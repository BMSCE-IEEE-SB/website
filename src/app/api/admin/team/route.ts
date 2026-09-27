import { getAdminServiceClient, jsonError, recordAdminAudit, requireAdmin } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return jsonError('Administrator sign-in is required.', 401);
  const { data, error } = await getAdminServiceClient().from('admin_whitelist').select('email,role,created_at').order('created_at');
  if (error) return jsonError('Admin team could not be loaded.', 503);
  return Response.json({ whitelist: data }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return jsonError('Administrator sign-in is required.', 401);
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const role = typeof body?.role === 'string' ? body.role : '';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !['chair','vice-chair','treasurer','secretary','admin'].includes(role)) return jsonError('Enter a valid email and role.');
  const client = getAdminServiceClient();
  const { error } = await client.from('admin_whitelist').upsert({ email, role });
  if (error) return jsonError('Administrator could not be authorized.', 409);
  await recordAdminAudit(admin, 'admin.whitelist_added', 'admin_whitelist', email, { role });
  return Response.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return jsonError('Administrator sign-in is required.', 401);
  const email = new URL(request.url).searchParams.get('email')?.trim().toLowerCase() || '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email === admin.email.toLowerCase()) return jsonError('Cannot revoke this administrator.');
  const { error } = await getAdminServiceClient().rpc('revoke_admin_whitelist', {
    p_email: email, p_actor_id: admin.id, p_actor_email: admin.email,
  });
  if (error) return jsonError('Administrator access could not be revoked. Ensure another administrator remains.', 409);
  return Response.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
}
