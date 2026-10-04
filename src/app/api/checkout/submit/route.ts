import { getAdminServiceClient, jsonError, requireUser } from '@/lib/server/supabase-admin';
import { isUuid } from '@/lib/server/input';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return jsonError('Sign in to submit your application.', 401);
  const body = await request.json().catch(() => null);
  const paymentMethod = body?.paymentMethod === 'CASH' ? 'CASH' : 'UPI';
  if (!isUuid(body?.intentId)) return jsonError('Checkout details are incomplete.');
  
  const validSizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
  if (!validSizes.includes(body?.tshirtSize)) return jsonError('Invalid T-shirt size selected.');

  if (paymentMethod === 'UPI' && typeof body?.proofPath !== 'string') return jsonError('Checkout details are incomplete.');

  let proof: string | null = null;
  if (paymentMethod === 'UPI') {
    proof = body.proofPath;
    if (!proof || !proof.startsWith(`${user.id}/`) || proof.length > 160) return jsonError('Payment proof is invalid.');
  }

  const cleanUtr = typeof body?.utr === 'string' ? body.utr.replace(/\s/g, '') : '';
  if (paymentMethod === 'UPI' && !/^\d{12}$/.test(cleanUtr)) return jsonError('Enter the 12-digit UPI reference (UTR) for this payment.', 400);
  const utr = paymentMethod === 'UPI' ? cleanUtr : null;

  const client = getAdminServiceClient();
  const { data: intent, error: intentError } = await client.from('checkout_intents')
    .select('order_reference, expires_at, submitted_order_id').eq('id', body.intentId).eq('user_id', user.id).maybeSingle();
  if (intentError || !intent || new Date(intent.expires_at).getTime() <= Date.now()) return jsonError('Your checkout quote expired. Start checkout again.', 409);

  if (paymentMethod === 'UPI') {
    // proof path format: {user_id}/{order_reference}.{ext}
    const filename = proof!.split('/')[1];
    if (!filename || !filename.startsWith(intent.order_reference)) {
      return jsonError('Payment proof does not match this checkout.');
    }

    const { data: signed, error: signedError } = await client.storage.from('public-assets').createSignedUrl(proof!, 30);
    if (signedError || !signed?.signedUrl) return jsonError('Payment proof could not be found. Upload it again.', 400);
  }

  const { data, error } = await client.rpc('submit_checkout_intent', {
    p_user_id: user.id,
    p_intent_id: body.intentId,
    p_proof_path: proof,
    p_utr: utr,
    p_tshirt_size: body.tshirtSize,
    p_payment_method: paymentMethod,
  });
  if (error || !data) return jsonError('Your application could not be submitted. Refresh and try again.', 409);
  const response = Response.json({ orderId: data }, { headers: { 'Cache-Control': 'no-store' } });
  response.headers.set(
    'Set-Cookie',
    'bmsce_paid=1; Path=/; Max-Age=31536000; SameSite=Lax'
  );
  return response;
}
