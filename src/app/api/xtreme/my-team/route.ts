import { getAdminServiceClient, jsonError, requireUser } from '@/lib/server/supabase-admin';
import { isSupabaseConfigured } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user && isSupabaseConfigured()) {
    return jsonError('Please sign in.', 401);
  }

  const userId = user?.id || 'demo-user-id';

  if (!isSupabaseConfigured()) {
    return Response.json({ team: null, demo: true });
  }

  try {
    const client = getAdminServiceClient();

    const { data: team, error } = await client
      .from('xtreme_teams')
      .select('id, team_name, lead_user_id, vtools_verified, proctor_name, proctor_ieee_id, admin_note, created_at, updated_at')
      .eq('lead_user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!team) return Response.json({ team: null });

    const { data: members, error: memErr } = await client
      .from('xtreme_members')
      .select('id, is_lead, ieee_member_id, first_name, last_name, email, phone, usn, department, year_of_study')
      .eq('team_id', team.id)
      .order('is_lead', { ascending: false });

    if (memErr) throw memErr;

    return Response.json({
      team: {
        ...team,
        members: members || [],
      },
    });
  } catch (err) {
    console.error('Fetch my team failed:', err);
    return jsonError('Could not fetch team information.', 500);
  }
}

