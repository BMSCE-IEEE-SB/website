import { getAdminServiceClient, jsonError, recordAdminAudit, requireAdmin } from '@/lib/server/supabase-admin';
import { isSafeLink } from '@/lib/server/input';

export const runtime = 'nodejs';
const categories = ['workshop', 'hackathon', 'summit', 'talk'];

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return jsonError('Administrator sign-in is required.', 401);
  const { data, error } = await getAdminServiceClient().from('events').select('*').order('date', { ascending: false });
  if (error) return jsonError('Events could not be loaded.', 503);
  return Response.json({ events: data }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return jsonError('Administrator sign-in is required.', 401);
  const e = await request.json().catch(() => null);
  const id = typeof e?.id === 'string' ? e.id.trim() : '';
  const fields = ['title', 'category', 'chapter', 'date', 'time', 'venue', 'image', 'description'];
  if (!id || id.length > 80 || fields.some((key) => typeof e[key] !== 'string') || !e.title.trim() || !e.venue.trim() ||
      !categories.includes(e.category) || e.title.length > 160 || e.venue.length > 180 || e.description.length > 5000 ||
      !isSafeLink(e.image) || (e.registration_url && !isSafeLink(e.registration_url)) || typeof e.is_featured !== 'boolean') return jsonError('Invalid event details.');
  const row = {
    id, title: e.title.trim(), category: e.category, chapter: e.chapter.slice(0, 40), date: e.date,
    time: e.time.slice(0, 30), venue: e.venue.trim(), image: e.image, description: e.description.trim(),
    registration_url: e.registration_url || null, is_featured: e.is_featured,
  };
  const { error } = await getAdminServiceClient().from('events').upsert(row);
  if (error) return jsonError('Event could not be saved.', 409);
  await recordAdminAudit(admin, 'event.saved', 'event', id, { title: row.title });
  return Response.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return jsonError('Administrator sign-in is required.', 401);
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!id || id.length > 80) return jsonError('Event was not found.', 404);
  const { error } = await getAdminServiceClient().from('events').delete().eq('id', id);
  if (error) return jsonError('Event could not be deleted.', 409);
  await recordAdminAudit(admin, 'event.deleted', 'event', id);
  return Response.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
}
