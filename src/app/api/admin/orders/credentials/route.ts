import { getAdminServiceClient, jsonError, requireAdmin, recordAdminAudit } from '@/lib/server/supabase-admin';
import { isUuid } from '@/lib/server/input';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return jsonError('Administrator sign-in is required.', 401);
  
  const body = await request.json().catch(() => null);
  const orderIds = body?.orderIds;
  const sent = Boolean(body?.sent);
  
  if (!Array.isArray(orderIds) || orderIds.some((id) => typeof id !== 'string' || !isUuid(id))) {
    return jsonError('Invalid order IDs provided.');
  }
  
  if (orderIds.length === 0) {
     return Response.json({ success: true });
  }

  const value = sent ? new Date().toISOString() : null;
  
  try {
    const client = getAdminServiceClient();
    const { error } = await client.from('orders').update({ credentials_sent_at: value }).in('id', orderIds);
    if (error) return jsonError('Credentials status could not be updated.', 409);
    
    await recordAdminAudit(admin, sent ? 'marked IEEE credentials sent for' : 'unmarked credentials for', 'bulk_order', null, { count: orderIds.length, first_id: orderIds[0] });
    
    return Response.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return jsonError('Credentials status could not be updated.', 503);
  }
}
