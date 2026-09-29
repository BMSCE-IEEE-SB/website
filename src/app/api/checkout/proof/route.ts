import { getAdminServiceClient, jsonError, requireUser } from '@/lib/server/supabase-admin';
import { imageTypeFromBytes, isUuid } from '@/lib/server/input';

export const runtime = 'nodejs';
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return jsonError('Sign in to submit payment proof.', 401);
  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  const intentId = form?.get('intentId');
  const orderId = form?.get('orderId');
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_BYTES) return jsonError('Choose an image no larger than 5 MB.');

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = imageTypeFromBytes(bytes);
  if (!type) return jsonError('The proof must be a valid PNG, JPEG, or WebP image.');

  const client = getAdminServiceClient();
  let ref: string;
  let suffix = '';
  if (isUuid(intentId) && !orderId) {
    const { data, error } = await client.from('checkout_intents').select('order_reference, expires_at').eq('id', intentId).eq('user_id', user.id).maybeSingle();
    if (error || !data || new Date(data.expires_at).getTime() <= Date.now()) return jsonError('Your checkout quote expired. Start checkout again.', 409);
    ref = data.order_reference;
  } else if (isUuid(orderId) && !intentId) {
    const { data, error } = await client.from('orders').select('order_reference, status').eq('id', orderId).eq('user_id', user.id).maybeSingle();
    if (error || !data || data.status !== 'rejected') return jsonError('This application cannot accept a new proof.', 409);
    ref = data.order_reference;
    suffix = `-R${crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;
  } else {
    return jsonError('A valid checkout quote or rejected application is required.');
  }

  const path = `${user.id}/${ref}${suffix}.${type.extension}`;
  const { error } = await client.storage.from('public-assets').upload(path, bytes, {
    contentType: type.mime,
    upsert: true,
  });
  if (error) {
    console.error('Storage upload error:', error);
    return jsonError('The proof could not be stored. Please try again.', 503);
  }
  return Response.json({ path }, { headers: { 'Cache-Control': 'no-store' } });
}
