import { getAdminServiceClient, jsonError, recordAdminAudit, requireAdmin } from '@/lib/server/supabase-admin';
import { isSafeLink } from '@/lib/server/input';

export const runtime = 'nodejs';

export async function PUT(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return jsonError('Administrator sign-in is required.', 401);
  const body = await request.json().catch(() => null);
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const link = body?.link_url === null || body?.link_url === '' ? null : body?.link_url;
  if (!message || message.length > 160 || typeof body?.is_active !== 'boolean' || (link !== null && !isSafeLink(link))) return jsonError('Invalid announcement details.');
  const { error } = await getAdminServiceClient().from('announcement').upsert({ id: 1, message, link_url: link, is_active: body.is_active, updated_at: new Date().toISOString() });
  if (error) return jsonError('Announcement could not be saved.', 409);
  await recordAdminAudit(admin, 'announcement.updated', 'announcement', '1', { is_active: body.is_active, link_url: link });
  return Response.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
}
