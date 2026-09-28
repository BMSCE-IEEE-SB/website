import { getAdminServiceClient, jsonError, requireUser } from '@/lib/server/supabase-admin';
import { isUuid } from '@/lib/server/input';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return jsonError('Sign in to submit your application.', 401);
  const body = await request.json().catch(() => null);
  if (!isUuid(body?.intentId) || typeof body?.proofPath !== 'string' || typeof body?.tshirtSize !== 'string') return jsonError('Checkout details are incomplete.');
  const proof = body.proofPath;
  if (!proof.startsWith(`${user.id}/`) || proof.length > 160) return jsonError('Payment proof is invalid.');
  const utr = (typeof body?.utr === 'string' && /^\d{12}$/.test(body.utr.replace(/\s/g, '')))
    ? body.utr.replace(/\s/g, '')
    : null;

  const client = getAdminServiceClient();
  const { data: intent, error: intentError } = await client.from('checkout_intents')
    .select('order_reference, expires_at, submitted_order_id').eq('id', body.intentId).eq('user_id', user.id).maybeSingle();
  if (intentError || !intent || new Date(intent.expires_at).getTime() <= Date.now()) return jsonError('Your checkout quote expired. Start checkout again.', 409);
  if (proof.split('/')[1]?.split('.')[0] !== intent.order_reference) return jsonError('Payment proof does not match this checkout.');

  const { data: signed, error: signedError } = await client.storage.from('public-assets').createSignedUrl(proof, 30);
  if (signedError || !signed?.signedUrl) return jsonError('Payment proof could not be found. Upload it again.', 400);

  const { data, error } = await client.rpc('submit_checkout_intent', {
    p_user_id: user.id,
    p_intent_id: body.intentId,
    p_proof_path: proof,
    p_utr: utr,
    p_tshirt_size: body.tshirtSize,
  });
  if (error || !data) return jsonError('Your application could not be submitted. Refresh and try again.', 409);
  const response = Response.json({ orderId: data }, { headers: { 'Cache-Control': 'no-store' } });
  response.headers.set(
    'Set-Cookie',
    'bmsce_paid=1; Path=/; Max-Age=31536000; SameSite=Lax'
  );
  return response;
}
