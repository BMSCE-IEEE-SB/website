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
async function isAuthorisedAdmin(request: Request) {
  if (!isSupabaseConfigured()) return true; // demo mode
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return false;
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data: userData } = await client.auth.getUser(token);
  if (!userData.user) return false;
  const { data: admin } = await client.from('admins').select('id').eq('id', userData.user.id).maybeSingle();
  return Boolean(admin);
}

export async function POST(request: Request) {
  try {
    if (!(await isAuthorisedAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid recipient email is required' }, { status: 400 });
    }
    const chapters: string[] = Array.isArray(body?.chaptersList) ? body.chaptersList.slice(0, 20).map(String) : [];

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
      return NextResponse.json({ error: 'SMTP is not configured' }, { status: 503 });
    }
    const port = Number(process.env.SMTP_PORT || 465);

    const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0b1b33">
        <h2 style="color:#00377e;margin:0 0 16px">Welcome to BMSCE IEEE!</h2>
        <p>Dear <strong>${escapeHtml(body?.name || 'Member')}</strong>,</p>
        <p>Your payment of <strong>₹${escapeHtml(body?.amount)}</strong> (order ${escapeHtml(body?.orderRef)}) has been verified and your membership is now active.</p>
        <p>You are enrolled in the base branch membership${chapters.length ? ' and these chapters:' : '.'}</p>
        ${chapters.length ? `<ul style="background:#f6f8fb;padding:14px 32px;border-radius:12px">${chapters.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul>` : ''}
        <p>Your official IEEE.org credentials will be shared once headquarters provisions them.</p>
        <p style="margin-top:28px">Best regards,<br/><strong>BMSCE IEEE Student Branch</strong></p>
      </div>`;

    await transporter.sendMail({
      from: `"BMSCE IEEE" <${user}>`,
      to: email,
      subject: 'Membership confirmed - BMSCE IEEE',
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending receipt email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
