import { getAdminServiceClient, jsonError, requireAdmin } from '@/lib/server/supabase-admin';
import { isUuid } from '@/lib/server/input';

export const runtime = 'nodejs';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return jsonError('Administrator sign-in is required.', 401);
  const { id } = await context.params;
  if (!isUuid(id)) return jsonError('Order was not found.', 404);
  const body = await request.json().catch(() => null);
  if (!['verified', 'rejected'].includes(body?.status)) return jsonError('Choose a valid order status.');
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 1000) : null;
  try {
    const { error } = await getAdminServiceClient().rpc('set_order_status', {
      p_order_id: id,
      p_actor_id: admin.id,
      p_actor_email: admin.email,
      p_status: body.status,
      p_reason: reason,
    });
    if (error) return jsonError('The order could not be updated.', 409);
    return Response.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return jsonError('The order could not be updated.', 503);
  }
}
