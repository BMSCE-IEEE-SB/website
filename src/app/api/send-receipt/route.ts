import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getAdminServiceClient, jsonError, requireAdmin, recordAdminAudit } from '@/lib/server/supabase-admin';
import { escapeHtml } from '@/lib/server/receipt-email';

export const runtime = 'nodejs'; // force reload

function smtpConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 465);
  if (!host || !user || !pass || !Number.isInteger(port) || port < 1 || port > 65535) return null;
  return { host, user, pass, port, from: process.env.SMTP_FROM || `"BMSCE IEEE" <${user}>` };
}
async function deliverReceipt(receipt: {
  id: string;
  receipt_number: string;
  drive_year: number;
  recipient_email: string;
  student_name: string;
  amount: number;
  chapters: string[];
  payment_method: string;
  program?: string | null;
}, client: ReturnType<typeof getAdminServiceClient>) {
  const config = smtpConfig();
  if (!config) throw new Error('Receipt email is unavailable.');
  const { data: settings } = await client.from('membership_config')
    .select('treasurer_name, treasurer_role, treasurer_phone').eq('id', 1).maybeSingle();
  const academicYear = `${receipt.drive_year}-${String(receipt.drive_year + 1).slice(-2)}`;
  const { generateReceiptPdf, formatReceiptDate } = await import('@/lib/receipt-pdf');
  const pdf = await generateReceiptPdf({
    studentName: receipt.student_name,
    amount: receipt.amount,
    receiptNumber: receipt.receipt_number,
    dateStr: formatReceiptDate(),
    chapters: receipt.chapters,
    program: receipt.program === 'PG' ? 'Postgraduate (PG)' : 'Undergraduate (UG)',
    treasurerName: settings?.treasurer_name || 'BMSCE IEEE Treasurer',
    treasurerRole: settings?.treasurer_role || 'Treasurer',
    treasurerPhone: settings?.treasurer_phone || '',
    paymentMethod: receipt.payment_method,
  });
  const transporter = nodemailer.createTransport({ host: config.host, port: config.port, secure: config.port === 465, auth: { user: config.user, pass: config.pass } });
  await transporter.sendMail({
    from: config.from,
    to: receipt.recipient_email,
    subject: `BMSCE IEEE Membership Receipt: ${receipt.receipt_number}`,
    text: `Dear ${receipt.student_name},\n\nGreetings from BMSCE IEEE!\n\nYour payment to the IEEE Membership for the year ${academicYear} has been received successfully.\nPlease do find the attachment of the receipt for the same below.\n\nKindly note that the receipt number may be used as an alternative to your IEEE Membership ID while registering for any IEEE event in college until the official IEEE Membership ID is issued.\n\nFor more updates about BMSCE IEEE Student Branch, do check out our Instagram page: @bmsce_ieee.\n\nThank you!\n\nRegards,\nBMSCE IEEE`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0b1b33;line-height:1.6"><p>Dear ${escapeHtml(receipt.student_name)},</p><p>Greetings from BMSCE IEEE!</p><p>Your payment to the IEEE Membership for the year ${escapeHtml(academicYear)} has been received successfully.<br/>Please do find the attachment of the receipt for the same below.</p><p>Kindly note that the receipt number may be used as an alternative to your IEEE Membership ID while registering for any IEEE event in college until the official IEEE Membership ID is issued.</p><p>For more updates about BMSCE IEEE Student Branch, do check out our Instagram page: @bmsce_ieee.</p><p>Thank you!</p><p>Regards,<br/>BMSCE IEEE</p></div>`,
    attachments: [{ filename: `BMSCE-IEEE-${receipt.receipt_number}.pdf`, content: pdf, contentType: 'application/pdf' }],
  });
}

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return jsonError('Administrator sign-in is required.', 401);
  const config = smtpConfig();
  if (!config) return jsonError('Receipt email is not configured.', 503);
  try {
    await nodemailer.createTransport({ host: config.host, port: config.port, secure: config.port === 465, auth: { user: config.user, pass: config.pass } }).verify();
    return NextResponse.json({ configured: true, message: 'Receipt email is ready.' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return jsonError('Receipt email could not connect.', 503);
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return jsonError('Administrator sign-in is required.', 401);
  if (Number(request.headers.get('content-length') || 0) > 4096) return jsonError('Request is too large.', 413);
  const body = await request.json().catch(() => null);
  if (typeof body?.orderId !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.orderId)) return jsonError('A verified order is required.');
  const client = getAdminServiceClient();
  const { data, error } = await client.rpc('reserve_order_receipt', { p_order_id: body.orderId, p_actor_id: admin.id });
  if (error || !data) return jsonError('Only a verified order can receive an official receipt.', 409);
  const receipt = data as { id: string; receipt_number: string; drive_year: number; recipient_email: string; student_name: string; amount: number; chapters: string[]; payment_method: string; program?: string | null };
  if (!receipt.id || !receipt.recipient_email) return jsonError('The receipt record is incomplete.', 409);
  const { data: orderRow } = await client.from('orders').select('program').eq('id', body.orderId).maybeSingle();
  receipt.program = (orderRow as { program?: string } | null)?.program ?? null;
  try {
    await deliverReceipt(receipt, client);
    const sentAt = new Date().toISOString();
    const { error: receiptUpdateError } = await client.from('issued_receipts').update({ delivery_status: 'sent', sent_at: sentAt, last_error: null }).eq('id', receipt.id);
    const { error: orderUpdateError } = await client.from('orders').update({ receipt_sent: true, receipt_sent_at: sentAt, receipt_error: null }).eq('id', body.orderId);
    if (receiptUpdateError || orderUpdateError) throw new Error('Receipt delivery tracking failed.');
    await recordAdminAudit(admin, 'receipt.sent', 'receipt', receipt.id, { receipt_number: receipt.receipt_number, order_id: body.orderId });
    return NextResponse.json({ success: true, receiptNumber: receipt.receipt_number }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    await client.from('issued_receipts').update({ delivery_status: 'failed', last_error: 'Delivery failed' }).eq('id', receipt.id);
    await client.from('orders').update({ receipt_sent: false, receipt_error: 'Delivery failed' }).eq('id', body.orderId);
    return jsonError(`Delivery failed: ${error.message}`, 503);
  }
}
