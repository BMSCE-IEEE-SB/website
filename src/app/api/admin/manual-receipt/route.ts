import nodemailer from 'nodemailer';
import { getAdminServiceClient, jsonError, recordAdminAudit, requireAdmin } from '@/lib/server/supabase-admin';
import { escapeHtml } from '@/lib/server/receipt-email';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return jsonError('Administrator sign-in is required.', 401);
  if (Number(request.headers.get('content-length') || 0) > 12000) return jsonError('Request is too large.', 413);
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const amount = Number(body?.amount);
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';
  const chapters = Array.isArray(body?.chapters) ? body.chapters.slice(0, 20).map((value: unknown) => typeof value === 'string' ? value.trim().slice(0, 120) : '') : [];
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError('Enter a valid recipient email.');
  if (!name || name.length > 120 || !Number.isFinite(amount) || amount < 0 || amount > 10000000) return jsonError('Enter a valid name and amount.');
  if (reason.length < 10 || reason.length > 1000 || chapters.some((chapter: string) => !chapter)) return jsonError('Enter a clear reason and valid chapter names.');
  const client = getAdminServiceClient();
  const { data, error } = await client.rpc('reserve_manual_receipt', {
    p_actor_id: admin.id, p_email: email, p_name: name, p_amount: amount, p_chapters: chapters, p_reason: reason,
  });
  if (error || !data) return jsonError('The manual receipt could not be reserved.', 409);
  const receipt = data as { id: string; receipt_number: string; drive_year: number; recipient_email: string; student_name: string; amount: number; chapters: string[] };
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 465);
  if (!host || !user || !pass || !Number.isInteger(port)) {
    await client.from('issued_receipts').update({ delivery_status: 'failed', last_error: 'Delivery configuration missing' }).eq('id', receipt.id);
    return jsonError('Receipt email is not configured. The receipt number remains reserved.', 503);
  }
  try {
    const { data: settings } = await client.from('membership_config').select('treasurer_name, treasurer_role, treasurer_phone').eq('id', 1).maybeSingle();
    const { generateReceiptPdf, formatReceiptDate } = await import('@/lib/receipt-pdf');
    const year = `${receipt.drive_year}-${String(receipt.drive_year + 1).slice(-2)}`;
    const pdf = await generateReceiptPdf({
      studentName: receipt.student_name, amount: receipt.amount, receiptNumber: receipt.receipt_number,
      dateStr: formatReceiptDate(), chapters: receipt.chapters,
      treasurerName: settings?.treasurer_name || 'BMSCE IEEE Treasurer',
      treasurerRole: settings?.treasurer_role || 'Treasurer', treasurerPhone: settings?.treasurer_phone || '',
    });
    await nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } }).sendMail({
      from: process.env.SMTP_FROM || `"BMSCE IEEE" <${user}>`,
      to: email,
      subject: `BMSCE IEEE Membership Receipt: ${receipt.receipt_number}`,
      text: `Dear ${name},\n\nYour BMSCE IEEE membership payment has been received for ${year}. Receipt number: ${receipt.receipt_number}.\n\nRegards,\nBMSCE IEEE`,
      html: `<div style="font-family:Arial,sans-serif"><p>Dear <strong>${escapeHtml(name)}</strong>,</p><p>Your BMSCE IEEE membership payment has been received for ${escapeHtml(year)}.</p><p>Receipt number: <strong>${escapeHtml(receipt.receipt_number)}</strong>.</p><p>Regards,<br/>BMSCE IEEE</p></div>`,
      attachments: [{ filename: `BMSCE-IEEE-${receipt.receipt_number}.pdf`, content: pdf, contentType: 'application/pdf' }],
    });
    const { error: trackingError } = await client.from('issued_receipts').update({ delivery_status: 'sent', sent_at: new Date().toISOString(), last_error: null }).eq('id', receipt.id);
    if (trackingError) throw new Error('Receipt delivery tracking failed.');
    await recordAdminAudit(admin, 'receipt.manual_sent', 'receipt', receipt.id, { receipt_number: receipt.receipt_number, recipient_email: email, reason });
    return Response.json({ success: true, receiptNumber: receipt.receipt_number }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    await client.from('issued_receipts').update({ delivery_status: 'failed', last_error: 'Delivery failed' }).eq('id', receipt.id);
    return jsonError('Receipt delivery failed. The reserved number remains assigned for retry.', 503);
  }
}
