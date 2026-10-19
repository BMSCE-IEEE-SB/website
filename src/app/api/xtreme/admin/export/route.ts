import { getAdminServiceClient, jsonError, requireAdmin } from '@/lib/server/supabase-admin';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getLocalXtremeTeams } from '@/lib/xtreme';

export const runtime = 'nodejs';

export function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`; // neutralise spreadsheet formulas
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin && isSupabaseConfigured()) {
    return jsonError('Admin sign-in required.', 401);
  }

  let teamsData: Array<{
    team_name: string;
    vtools_verified: boolean;
    proctor_name?: string | null;
    proctor_ieee_id?: string | null;
    admin_note?: string | null;
    created_at: string;
    members: Array<{
      is_lead: boolean;
      first_name: string;
      last_name?: string | null;
      ieee_member_id: string;
      email: string;
      phone?: string | null;
      usn?: string | null;
      department?: string | null;
      year_of_study?: string | null;
    }>;
  }> = [];

  if (!isSupabaseConfigured()) {
    teamsData = getLocalXtremeTeams();
  } else {
    try {
      const client = getAdminServiceClient();
      const { data: teams, error } = await client
        .from('xtreme_teams')
        .select('id, team_name, vtools_verified, proctor_name, proctor_ieee_id, admin_note, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: members, error: memErr } = await client
        .from('xtreme_members')
        .select('team_id, is_lead, first_name, last_name, ieee_member_id, email, phone, usn, department, year_of_study')
        .order('is_lead', { ascending: false });

      if (memErr) throw memErr;

      const membersByTeam: Record<string, typeof members> = {};
      for (const m of members || []) {
        if (!membersByTeam[m.team_id]) membersByTeam[m.team_id] = [];
        membersByTeam[m.team_id].push(m);
      }

      teamsData = (teams || []).map((t) => ({
        ...t,
        members: membersByTeam[t.id] || [],
      }));
    } catch (err) {
      console.error('Export failed:', err);
      return jsonError('Failed to generate export.', 500);
    }
  }

  const headers = [
    'Team Name',
    'Official vTools Status',
    'Proctor Name',
    'Proctor IEEE ID',
    'Admin Notes',
    'Role',
    'First Name',
    'Last Name',
    'IEEE Member ID',
    'Email Address',
    'Phone',
    'USN',
    'Department',
    'Year of Study',
    'Registered At',
  ];

  const rows: string[] = [headers.join(',')];

  for (const team of teamsData) {
    const teamMembers = team.members || [];
    if (teamMembers.length === 0) {
      rows.push(
        [
          escapeCSV(team.team_name),
          escapeCSV(team.vtools_verified ? 'Verified on vTools' : 'Pending vTools'),
          escapeCSV(team.proctor_name || ''),
          escapeCSV(team.proctor_ieee_id || ''),
          escapeCSV(team.admin_note || ''),
          escapeCSV('None'),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(''),
          escapeCSV(team.created_at),
        ].join(',')
      );
    } else {
      for (const m of teamMembers) {
        rows.push(
          [
            escapeCSV(team.team_name),
            escapeCSV(team.vtools_verified ? 'Verified on vTools' : 'Pending vTools'),
            escapeCSV(team.proctor_name || ''),
            escapeCSV(team.proctor_ieee_id || ''),
            escapeCSV(team.admin_note || ''),
            escapeCSV(m.is_lead ? 'Team Lead' : 'Teammate'),
            escapeCSV(m.first_name),
            escapeCSV(m.last_name || ''),
            escapeCSV(m.ieee_member_id),
            escapeCSV(m.email),
            escapeCSV(m.phone || ''),
            escapeCSV(m.usn || ''),
            escapeCSV(m.department || ''),
            escapeCSV(m.year_of_study || ''),
            escapeCSV(team.created_at),
          ].join(',')
        );
      }
    }
  }

  const csvContent = rows.join('\r\n');

  return new Response(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="ieeextreme-20-bmsce-teams-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}

