import { jsonError, getAdminServiceClient, requireUser } from '@/lib/server/supabase-admin';
import { isUuid } from '@/lib/server/input';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return jsonError('Sign in to start checkout.', 401);
  const body = await request.json().catch(() => null);
  const chapterIds = body?.chapterIds;
  if (!Array.isArray(chapterIds) || chapterIds.length > 6 || chapterIds.some((id: unknown) => !isUuid(id))) {
    return jsonError('Choose valid chapters to continue.');
  }
  try {
    const { data, error } = await getAdminServiceClient().rpc('create_checkout_intent', {
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

