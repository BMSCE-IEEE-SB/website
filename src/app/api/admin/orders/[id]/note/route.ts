import { getAdminServiceClient, jsonError, requireAdmin, recordAdminAudit } from '@/lib/server/supabase-admin';
import { isUuid } from '@/lib/server/input';

export const runtime = 'nodejs';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return jsonError('Administrator sign-in is required.', 401);
  const { id } = await context.params;
  if (!isUuid(id)) return jsonError('Order was not found.', 404);
  const body = await request.json().catch(() => null);
  const note = typeof body?.note === 'string' ? body.note.slice(0, 500) : null;
  
  try {
    const client = getAdminServiceClient();
    const { error } = await client.from('orders').update({ admin_note: note }).eq('id', id);
    if (error) return jsonError('The note could not be saved.', 409);
    
    await recordAdminAudit(admin, 'added a note to', 'order', id, { note: note ? note.slice(0, 120) : 'cleared' });
    
    return Response.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return jsonError('The note could not be saved.', 503);
  }
}
