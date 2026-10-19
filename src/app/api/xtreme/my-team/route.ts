import { getAdminServiceClient, jsonError, requireUser } from '@/lib/server/supabase-admin';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getLocalTeamForUser } from '@/lib/xtreme';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user && isSupabaseConfigured()) {
    return jsonError('Please sign in.', 401);
  }

  const userId = user?.id || 'demo-user-id';
  const userEmail = user?.email || '';

  if (!isSupabaseConfigured()) {
    const localTeam = getLocalTeamForUser(userId, userEmail);
    if (!localTeam) return Response.json({ team: null, demo: true });

    // Sanitize: exclude internal organizer admin_note
    const { admin_note, ...safeTeam } = localTeam;
    void admin_note;
    return Response.json({ team: safeTeam, demo: true });
  }

  try {
    const client = getAdminServiceClient();

    const { data: initialTeam, error } = await client
      .from('xtreme_teams')
      .select('id, team_name, lead_user_id, leader_email, proctor_id, vtools_verified, proctor_name, proctor_ieee_id, created_at, updated_at')
      .eq('lead_user_id', userId)
      .maybeSingle();

    if (error) throw error;

    let team = initialTeam;

    // 2. If no team found, try auto-claiming an unclaimed team by verified email match
    if (!team && userEmail) {
      const { data: claimResult, error: claimErr } = await client.rpc('claim_xtreme_team', {
        p_user_id: userId,
        p_email: userEmail,
      });

      if (!claimErr && claimResult?.claimed && claimResult?.team_id) {
        const { data: claimedTeam, error: fetchErr } = await client
          .from('xtreme_teams')
          .select('id, team_name, lead_user_id, leader_email, proctor_id, vtools_verified, proctor_name, proctor_ieee_id, created_at, updated_at')
          .eq('id', claimResult.team_id)
          .maybeSingle();

        if (!fetchErr && claimedTeam) {
          team = claimedTeam;
        }
      }
    }

    if (!team) {
      return Response.json({ team: null });
    }

    // 3. Fetch members for the team
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
