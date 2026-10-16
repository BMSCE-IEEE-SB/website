import { getAdminServiceClient, jsonError, requireUser } from '@/lib/server/supabase-admin';
import { isSupabaseConfigured } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user && isSupabaseConfigured()) {
    return jsonError('Please sign in.', 401);
  }

  const userId = user?.id || 'demo-user-id';

  if (!isSupabaseConfigured()) {
    return Response.json({ success: true, vtools_verified: true, demo: true });
  }

  try {
    const client = getAdminServiceClient();

    const { data: team, error } = await client
      .from('xtreme_teams')
      .select('id, team_name, vtools_verified')
      .eq('lead_user_id', userId)
      .maybeSingle();

    if (error || !team) {
      return jsonError('No registered team found for your account.', 404);
    }

    const { error: updateErr } = await client
      .from('xtreme_teams')
      .update({
        vtools_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', team.id);

    if (updateErr) throw updateErr;

    return Response.json({
      success: true,
      message: 'Official IEEE vTools registration confirmed. Team registration is now locked.',
      vtools_verified: true,
    });
  } catch (err) {
    console.error('vTools verification failed:', err);
    return jsonError('Could not record vTools verification.', 500);
  }
}

