import { getAdminServiceClient, jsonError, requireAdmin } from '@/lib/server/supabase-admin';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getLocalXtremeTeams } from '@/lib/xtreme';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin && isSupabaseConfigured()) {
    return jsonError('Admin access required.', 403);
  }

  if (!isSupabaseConfigured()) {
    const teams = getLocalXtremeTeams();
    const totalMembers = teams.reduce((acc, t) => acc + (t.members?.length || 0), 0);
    const vtoolsDone = teams.filter((t) => t.vtools_verified).length;
    const proctorAssigned = teams.filter((t) => t.proctor_name?.trim()).length;
    return Response.json({
      teams,
      stats: {
        totalTeams: teams.length,
        totalMembers,
        vtoolsDone,
        proctorAssigned,
      },
      demo: true,
    });
  }

  try {
    const client = getAdminServiceClient();

    const { data: teams, error } = await client
      .from('xtreme_teams')
      .select('id, team_name, lead_user_id, vtools_verified, proctor_name, proctor_ieee_id, admin_note, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch members for each team
    const { data: members, error: memErr } = await client
      .from('xtreme_members')
      .select('id, team_id, is_lead, ieee_member_id, first_name, last_name, email, phone, usn, department, year_of_study')
      .order('is_lead', { ascending: false });

    if (memErr) throw memErr;

    const membersByTeam: Record<string, typeof members> = {};
    for (const m of members || []) {
      if (!membersByTeam[m.team_id]) membersByTeam[m.team_id] = [];
      membersByTeam[m.team_id].push(m);
    }

    const enrichedTeams = (teams || []).map((t) => ({
      ...t,
      members: membersByTeam[t.id] || [],
    }));

    const totalTeams = enrichedTeams.length;
    const totalMembers = (members || []).length;
    const vtoolsDone = enrichedTeams.filter((t) => t.vtools_verified).length;
    const proctorAssigned = enrichedTeams.filter((t) => t.proctor_name?.trim()).length;

    return Response.json({
      teams: enrichedTeams,
      stats: {
        totalTeams,
        totalMembers,
        vtoolsDone,
        proctorAssigned,
      },
    });
  } catch (err) {
    console.error('Fetch xtreme admin teams failed:', err);
    return jsonError('Could not load teams.', 500);
  }
}

