import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from '@/lib/supabase';

export const runtime = 'nodejs';

const escapeHtml = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/**
 * In live mode only a signed-in branch admin may trigger receipts, otherwise
 * this endpoint would be an open mail relay from the branch's address.
 */
async function checkAdminAuth(request: Request): Promise<{ authorized: boolean; reason?: string }> {
  // Allow during local development so branch admins/developers can test SMTP locally without Supabase auth sessions
  if (process.env.NODE_ENV === 'development') {
    return { authorized: true };
  }

  // Allow in demo mode when Supabase is not configured
  if (!isSupabaseConfigured()) {
    return { authorized: true };
  }

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) {
    return { authorized: false, reason: 'Missing authorization token. Please log into an authorized branch admin account.' };
  }

  try {
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });
    const { data: userData, error: userError } = await client.auth.getUser(token);
    if (userError || !userData?.user) {
      return { authorized: false, reason: 'Invalid or expired session. Please sign in again.' };
    }

    const { data: admin, error: adminError } = await client
      .from('admins')
      .select('id')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (adminError || !admin) {
      return { authorized: false, reason: `Account (${userData.user.email}) is not registered in the admins table.` };
    }

    return { authorized: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication verification failed';
    return { authorized: false, reason: message };
  }
}

export async function GET(request: Request) {
  try {
    const auth = await checkAdminAuth(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Unauthorised' }, { status: 401 });
    }

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
      return NextResponse.json({
        configured: false,
        error: 'SMTP environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS) are missing',
      }, { status: 503 });
    }
    const port = Number(process.env.SMTP_PORT || 465);
    const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });

    await transporter.verify();
    return NextResponse.json({
      configured: true,
      host,
      port,
      user,
      from: process.env.SMTP_FROM || `"BMSCE IEEE" <${user}>`,
      message: 'SMTP connection verified successfully',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'SMTP verification failed';
    return NextResponse.json({
      configured: false,
      error: message,
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await checkAdminAuth(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Unauthorised' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid recipient email is required' }, { status: 400 });
    }
    const studentName = (body?.name || 'Member').trim();
    const chapters: string[] = Array.isArray(body?.chaptersList) ? body.chaptersList.slice(0, 20).map(String) : [];
    const amount = body?.amount ?? 1810;
    const orderId = typeof body?.orderId === 'string' ? body.orderId : undefined;

    // Load drive settings for year & treasurer
    let driveYear = 2026;
    let treasurerName = 'Neha Ramiah';
    let treasurerRole = 'Treasurer and MDC';
    let treasurerPhone = '+91 6385525264';
    let signatureUrl: string | undefined = undefined;

    if (isSupabaseConfigured()) {
      try {
        const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        const { data: config } = await client
          .from('membership_config')
          .select('drive_year, treasurer_name, treasurer_role, treasurer_phone, signature_url')
          .eq('id', 1)
          .maybeSingle();
        if (config) {
          if (config.drive_year) driveYear = Number(config.drive_year);
          if (config.treasurer_name) treasurerName = config.treasurer_name;
          if (config.treasurer_role) treasurerRole = config.treasurer_role;
          if (config.treasurer_phone) treasurerPhone = config.treasurer_phone;
          if (config.signature_url) signatureUrl = config.signature_url;
        }
      } catch (err) {
        console.error('Error loading config for receipt:', err);
      }
    }

    const academicYear = `${driveYear}-${String(driveYear + 1).slice(-2)}`;

    // Determine receipt number: e.g. 2026-27 - 001
    let receiptNumber = typeof body?.receiptNumber === 'string' && body.receiptNumber.trim() ? body.receiptNumber.trim() : '';
    if (!receiptNumber) {
      let count = 0;
      if (isSupabaseConfigured()) {
        try {
          const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
          const { count: c } = await client
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .not('receipt_number', 'is', null)
            .like('receipt_number', `${academicYear} - %`);
          count = c ?? 0;
        } catch (e) {
          console.error('Error counting receipts:', e);
        }
      }
      const seq = String(count + 1).padStart(3, '0');
      receiptNumber = `${academicYear} - ${seq}`;
    }

    // Generate Official PDF Receipt
    const { generateReceiptPdf, formatReceiptDate } = await import('@/lib/receipt-pdf');
    const pdfBuffer = await generateReceiptPdf({
      studentName,
      amount,
      receiptNumber,
      dateStr: formatReceiptDate(new Date()),
      chapters,
      treasurerName,
      treasurerRole,
      treasurerPhone,
      signaturePath: signatureUrl,
    });

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
      return NextResponse.json({ error: 'SMTP is not configured' }, { status: 503 });
    }
    const port = Number(process.env.SMTP_PORT || 465);

    const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });

    const emailSubject = `BMSCE IEEE Membership Receipt: ${receiptNumber}`;

    const emailHtml = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0b1b33;line-height:1.6;font-size:15px">
        <p>Dear <strong>${escapeHtml(studentName)}</strong>,</p>
        <p>Greetings from BMSCE IEEE!</p>
        <p>Your payment to the IEEE Membership for the year <strong>${escapeHtml(academicYear)}</strong> has been received successfully.<br/>
        Please do find the attachment of the <strong>receipt</strong> for the same below.</p>
        <p>Kindly note that the <strong>receipt number (${escapeHtml(receiptNumber)})</strong> may be used as an alternative to your IEEE Membership ID while registering for any IEEE event in college until the official IEEE Membership ID is issued.</p>
        <p>For more updates about BMSCE IEEE Student Branch, do check out our Instagram page: <a href="https://instagram.com/bmsce_ieee" style="color:#00377e;font-weight:bold;text-decoration:none" target="_blank">@bmsce_ieee</a>.</p>
        <p>Thank you!</p>
        <p style="margin-top:28px">Regards,<br/><strong>BMSCE IEEE</strong></p>
      </div>`;

    const emailText = `Dear ${studentName},\n\nGreetings from BMSCE IEEE!\n\nYour payment to the IEEE Membership for the year ${academicYear} has been received successfully.\nPlease do find the attachment of the receipt for the same below.\n\nKindly note that the receipt number (${receiptNumber}) may be used as an alternative to your IEEE Membership ID while registering for any IEEE event in college until the official IEEE Membership ID is issued.\n\nFor more updates about BMSCE IEEE Student Branch, do check out our Instagram page: @bmsce_ieee.\n\nThank you!\n\nRegards,\nBMSCE IEEE`;

    const from = process.env.SMTP_FROM || `"BMSCE IEEE" <${user}>`;

    await transporter.sendMail({
      from,
      to: email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
      attachments: [
        {
          filename: `BMSCE IEEE - ${receiptNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    // Update order with assigned receipt number in Supabase if orderId was provided
    if (orderId && isSupabaseConfigured()) {
      try {
        const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        await client
          .from('orders')
          .update({
            receipt_sent: true,
            receipt_sent_at: new Date().toISOString(),
            receipt_number: receiptNumber,
            receipt_error: null,
          })
          .eq('id', orderId);
      } catch (err) {
        console.error('Error updating order receipt status:', err);
      }
    }

    return NextResponse.json({ success: true, receiptNumber });
  } catch (error: unknown) {
    console.error('Error sending receipt email:', error);
    const message = error instanceof Error ? error.message : 'Failed to send email';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
