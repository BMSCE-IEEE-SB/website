import { canModifyMembership, getAdminServiceClient, jsonError, requireAdmin, recordAdminAudit } from '@/lib/server/supabase-admin';
import { isUuid } from '@/lib/server/input';

export const runtime = 'nodejs';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return jsonError('Administrator sign-in is required.', 401);
  if (!canModifyMembership(admin)) return jsonError('SAC role does not have permission to modify member credentials.', 403);

  const { id } = await context.params;
  if (!isUuid(id)) return jsonError('Order was not found.', 404);

  const body = await request.json().catch(() => null);
  const rawId = body?.ieeeId;
  const ieeeId = typeof rawId === 'string' ? rawId.trim() : null;

  if (ieeeId && !/^\d{6,10}$/.test(ieeeId)) {
    return jsonError('IEEE member IDs must be 6–10 digits.', 400);
  }

  try {
    const client = getAdminServiceClient();
    const { data: order, error: orderErr } = await client
      .from('orders')
      .select('id, user_id, order_reference')
      .eq('id', id)
      .maybeSingle();

    if (orderErr || !order) return jsonError('Order was not found.', 404);

    const { error: profileErr } = await client
      .from('profiles')
      .update({ ieee_member_id: ieeeId || null })
      .eq('id', order.user_id);

    if (profileErr) return jsonError('The IEEE member ID could not be saved.', 409);

    await recordAdminAudit(admin, ieeeId ? 'assigned IEEE member ID to' : 'cleared IEEE member ID for', 'order', id, {
      ieee_member_id: ieeeId || null,
      user_id: order.user_id,
      order_reference: order.order_reference,
    });

    return Response.json({ success: true, ieee_member_id: ieeeId || null }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return jsonError('The IEEE member ID could not be saved.', 503);
  }
}
