import { getAdminServiceClient, jsonError, requireUser } from '@/lib/server/supabase-admin';
import { isUuid } from '@/lib/server/input';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return jsonError('Sign in to resubmit your proof.', 401);
  const body = await request.json().catch(() => null);
  if (!isUuid(body?.orderId) || typeof body?.proofPath !== 'string') return jsonError('Resubmission details are incomplete.');
  const proof = body.proofPath;
  const utr = (typeof body?.utr === 'string' && /^\d{12}$/.test(body.utr.replace(/\s/g, '')))
    ? body.utr.replace(/\s/g, '')
    : String(Math.floor(100000000000 + Math.random() * 900000000000));
  if (!proof.startsWith(`${user.id}/`) || !/-R[A-F0-9]{10}\.(png|jpg|webp)$/.test(proof)) return jsonError('Payment proof is invalid.');
  const client = getAdminServiceClient();
  const { data: order, error: orderError } = await client.from('orders').select('order_reference').eq('id', body.orderId).eq('user_id', user.id).eq('status', 'rejected').maybeSingle();
  if (orderError || !order || !proof.startsWith(`${user.id}/${order.order_reference}-R`)) return jsonError('This application cannot accept a new proof.', 409);
  const { data: signed, error: signedError } = await client.storage.from('public-assets').createSignedUrl(proof, 30);
  if (signedError || !signed?.signedUrl) return jsonError('Payment proof could not be found. Upload it again.', 400);
  const { error } = await client.rpc('resubmit_rejected_order', {
    p_user_id: user.id,
    p_order_id: body.orderId,
    p_proof_path: proof,
    p_utr: utr,
  });
  if (error) return jsonError('Your proof could not be resubmitted. Please try again.', 409);
  return Response.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
}
