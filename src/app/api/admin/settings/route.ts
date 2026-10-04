import { getAdminServiceClient, jsonError, recordAdminAudit, requireAdmin } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return jsonError('Administrator sign-in is required.', 401);
  const client = getAdminServiceClient();
  const [{ data: settings, error: settingsError }, { data: chapters, error: chaptersError }] = await Promise.all([
    client.from('membership_config').select('base_fee,pg_base_fee,payee_vpa,payee_name,drive_year,is_drive_open,treasurer_name,treasurer_role,treasurer_phone,signature_url').eq('id', 1).maybeSingle(),
    client.from('chapters').select('id,name,code,slug,price,pg_price,description,is_active,display_order').order('display_order'),
  ]);
  if (settingsError || chaptersError) return jsonError('Settings could not be loaded.', 503);
  return Response.json({ settings, chapters }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return jsonError('Administrator sign-in is required.', 401);
  const body = await request.json().catch(() => null);
  const s = body?.settings;
  if (!s || !Number.isFinite(Number(s.base_fee)) || Number(s.base_fee) < 0 || Number(s.base_fee) > 1000000 ||
      !Number.isFinite(Number(s.pg_base_fee)) || Number(s.pg_base_fee) < 0 || Number(s.pg_base_fee) > 1000000 ||
      !Number.isInteger(Number(s.drive_year)) || Number(s.drive_year) < 2020 || Number(s.drive_year) > 2035 ||
      typeof s.is_drive_open !== 'boolean' || !/^[\w.+-]{2,100}@[\w.-]{2,100}$/.test(s.payee_vpa || '') ||
      typeof s.payee_name !== 'string' || !s.payee_name.trim() || s.payee_name.length > 120 ||
      typeof s.treasurer_name !== 'string' || !s.treasurer_name.trim() || s.treasurer_name.length > 120 ||
      typeof s.treasurer_role !== 'string' || !s.treasurer_role.trim() || s.treasurer_role.length > 120 ||
      typeof s.treasurer_phone !== 'string' || s.treasurer_phone.length > 40) return jsonError('Invalid membership settings.');
  const client = getAdminServiceClient();
  const { error } = await client.from('membership_config').update({
    base_fee: Number(s.base_fee), pg_base_fee: Number(s.pg_base_fee), payee_vpa: s.payee_vpa.trim(), payee_name: s.payee_name.trim(), drive_year: Number(s.drive_year),
    is_drive_open: s.is_drive_open, treasurer_name: s.treasurer_name.trim(), treasurer_role: s.treasurer_role.trim(), treasurer_phone: s.treasurer_phone.trim(),
  }).eq('id', 1);
  if (error) return jsonError('Membership settings could not be saved.', 409);
  await recordAdminAudit(admin, 'settings.updated', 'membership_config', '1', { drive_year: Number(s.drive_year), is_drive_open: s.is_drive_open });
  return Response.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return jsonError('Administrator sign-in is required.', 401);
  const body = await request.json().catch(() => null);
  const c = body?.chapter;
  if (typeof c?.id !== 'string' || c.id.length > 80 || typeof c.name !== 'string' || !c.name.trim() || c.name.length > 120 ||
      !Number.isFinite(Number(c.price)) || Number(c.price) < 0 || Number(c.price) > 100000 ||
      !Number.isFinite(Number(c.pg_price)) || Number(c.pg_price) < 0 || Number(c.pg_price) > 100000 || typeof c.is_active !== 'boolean') return jsonError('Invalid chapter settings.');
  const client = getAdminServiceClient();
  const { error } = await client.from('chapters').update({ name: c.name.trim(), price: Number(c.price), pg_price: Number(c.pg_price), is_active: c.is_active }).eq('id', c.id);
  if (error) return jsonError('Chapter settings could not be saved.', 409);
  await recordAdminAudit(admin, 'chapter.updated', 'chapter', c.id, { name: c.name.trim(), price: Number(c.price), pg_price: Number(c.pg_price), is_active: c.is_active });
  return Response.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
}
