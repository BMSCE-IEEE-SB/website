import { jsonError, getAdminServiceClient, requireUser } from '@/lib/server/supabase-admin';
import { isUuid } from '@/lib/server/input';
import { SENSORS_COUNCIL_UUID } from '@/lib/pricing';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return jsonError('Sign in to start checkout.', 401);
  const body = await request.json().catch(() => null);
  const rawChapterIds = body?.chapterIds;
  if (!Array.isArray(rawChapterIds) || rawChapterIds.some((id: unknown) => !isUuid(id))) {
    return jsonError('Choose valid chapters to continue.');
  }
  const chapterIds = Array.from(new Set(rawChapterIds as string[]));
  if (chapterIds.length > 6) {
    return jsonError('Choose valid chapters to continue.');
  }
  try {
    const client = getAdminServiceClient();
    if (chapterIds.includes(SENSORS_COUNCIL_UUID)) {
      try {
        await client.from('chapters').upsert({
          id: SENSORS_COUNCIL_UUID,
          name: 'IEEE Sensors Council',
          code: 'SC',
          slug: 'sc',
          price: 0,
          is_active: true,
          display_order: 6,
        }, { onConflict: 'id' });
      } catch (upsertError) {
        console.error('Failed to upsert SC chapter:', upsertError);
      }
    }
    const { data, error } = await client.rpc('create_checkout_intent', {
      p_user_id: user.id,
      p_chapter_ids: chapterIds,
    });
    if (error) {
      console.error('create_checkout_intent error:', error);
      return jsonError(error.message || 'Checkout pricing is unavailable. Refresh and try again.', 409);
    }
    if (!data) return jsonError('Checkout pricing is unavailable. Refresh and try again.', 409);
    return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return jsonError('Checkout is temporarily unavailable.', 503);
  }
}

