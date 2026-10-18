import { getAdminServiceClient, jsonError, requireAdmin } from '@/lib/server/supabase-admin';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getLocalXtremeProctors, getLocalXtremeTeams, saveLocalXtremeTeam, type XtremeMember, type XtremeTeam } from '@/lib/xtreme';

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
    const proctorAssigned = teams.filter((t) => t.proctor_name?.trim() || t.proctor_id).length;
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
      .select('id, team_name, lead_user_id, leader_email, proctor_id, vtools_verified, proctor_name, proctor_ieee_id, admin_note, created_at, updated_at')
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
    const proctorAssigned = enrichedTeams.filter((t) => t.proctor_name?.trim() || t.proctor_id).length;

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

interface AdminCreateMemberInput {
  name: string;
  phone?: string;
  email: string;
  ieee_id: string;
  usn?: string;
  department?: string;
  year_of_study?: string;
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin && isSupabaseConfigured()) {
    return jsonError('Admin access required.', 403);
  }

  const body = await request.json().catch(() => null);
  const teamName = typeof body?.team_name === 'string' ? body.team_name.trim() : '';
  const leaderName = typeof body?.leader_name === 'string' ? body.leader_name.trim() : '';
  const leaderPhone = typeof body?.leader_phone === 'string' ? body.leader_phone.trim() : '';
  const leaderEmail = typeof body?.leader_email === 'string' ? body.leader_email.trim().toLowerCase() : '';
  const leaderIeeeId = typeof body?.leader_ieee_id === 'string' ? body.leader_ieee_id.trim() : '';
  const leaderUsn = typeof body?.leader_usn === 'string' ? body.leader_usn.trim().toUpperCase() : '';
  const leaderDept = typeof body?.leader_department === 'string' ? body.leader_department.trim() : 'CSE';
  const leaderYear = typeof body?.leader_year_of_study === 'string' ? body.leader_year_of_study.trim() : '3rd Year';
  const proctorId = typeof body?.proctor_id === 'string' ? body.proctor_id.trim() : null;
  const adminNote = typeof body?.admin_note === 'string' ? body.admin_note.trim() : '';

  // Validate team name (3-20 chars alphanumeric)
  if (!teamName || !/^[a-zA-Z0-9]{3,20}$/.test(teamName)) {
    return jsonError('Team name must be 3-20 characters and contain only letters and numbers (no spaces).', 400);
  }

  // Validate leader details
  if (!leaderName || leaderName.length < 2) {
    return jsonError('Leader name is required.', 400);
  }
  if (!leaderEmail || !leaderEmail.includes('@')) {
    return jsonError('A valid leader email address is required.', 400);
  }
  if (!leaderIeeeId || !/^\d{5,15}$/.test(leaderIeeeId)) {
    return jsonError('A valid IEEE Member ID (5-15 digits) is required for the leader.', 400);
  }

  // Teammates parsing and validation
  const rawTeammates: AdminCreateMemberInput[] = Array.isArray(body?.teammates) ? body.teammates : [];
  if (rawTeammates.length > 2) {
    return jsonError('A team can have at most 2 additional teammates (maximum 3 members total).', 400);
  }

  const seenIeeeIds = new Set<string>([leaderIeeeId]);
  const processedTeammates: AdminCreateMemberInput[] = [];

  for (const mate of rawTeammates) {
    const mName = typeof mate?.name === 'string' ? mate.name.trim() : '';
    const mEmail = typeof mate?.email === 'string' ? mate.email.trim().toLowerCase() : '';
    const mIeeeId = typeof mate?.ieee_id === 'string' ? mate.ieee_id.trim() : '';

    if (!mName && !mEmail && !mIeeeId) continue; // Skip empty entry

    if (!mName) return jsonError('Teammate name is required.', 400);
    if (!mEmail || !mEmail.includes('@')) return jsonError('Valid teammate email is required.', 400);
    if (!mIeeeId || !/^\d{5,15}$/.test(mIeeeId)) return jsonError(`Valid IEEE ID required for teammate ${mName}.`, 400);

    if (seenIeeeIds.has(mIeeeId)) {
      return jsonError(`Duplicate IEEE Member ID "${mIeeeId}" in team roster.`, 400);
    }
    seenIeeeIds.add(mIeeeId);

    processedTeammates.push({
      name: mName,
      email: mEmail,
      phone: typeof mate?.phone === 'string' ? mate.phone.trim() : '',
      ieee_id: mIeeeId,
      usn: typeof mate?.usn === 'string' ? mate.usn.trim().toUpperCase() : '',
      department: typeof mate?.department === 'string' ? mate.department.trim() : 'CSE',
      year_of_study: typeof mate?.year_of_study === 'string' ? mate.year_of_study.trim() : '3rd Year',
    });
  }

  // Handle Demo Mode
  if (!isSupabaseConfigured()) {
    const existingTeams = getLocalXtremeTeams();
    if (existingTeams.some((t) => t.team_name.toLowerCase() === teamName.toLowerCase())) {
      return jsonError(`Team name "${teamName}" is already taken.`, 409);
    }

    let proctorName = '';
    let proctorIeee = '';
    if (proctorId) {
      const proctors = getLocalXtremeProctors();
      const proc = proctors.find((p) => p.id === proctorId);
      if (proc) {
        if ((proc.assigned_count ?? 0) >= 20) {
          return jsonError(`Proctor "${proc.name}" already has 20 teams assigned.`, 400);
        }
        proctorName = proc.name;
        proctorIeee = proc.ieee_id;
      }
    }

    const teamId = `team-demo-${Date.now()}`;
    const members: XtremeMember[] = [
      {
        id: `mem-${teamId}-lead`,
        team_id: teamId,
        is_lead: true,
        ieee_member_id: leaderIeeeId,
        first_name: leaderName.split(' ')[0] || leaderName,
        last_name: leaderName.split(' ').slice(1).join(' '),
        email: leaderEmail,
        phone: leaderPhone,
        usn: leaderUsn,
        department: leaderDept,
        year_of_study: leaderYear,
      },
      ...processedTeammates.map((m, idx) => ({
        id: `mem-${teamId}-${idx}`,
        team_id: teamId,
        is_lead: false,
        ieee_member_id: m.ieee_id,
        first_name: m.name.split(' ')[0] || m.name,
        last_name: m.name.split(' ').slice(1).join(' '),
        email: m.email,
        phone: m.phone,
        usn: m.usn,
        department: m.department,
        year_of_study: m.year_of_study,
      })),
    ];

    const newTeam: XtremeTeam = {
      id: teamId,
      team_name: teamName,
      lead_user_id: null,
      leader_email: leaderEmail,
      proctor_id: proctorId,
      vtools_verified: false,
      proctor_name: proctorName,
      proctor_ieee_id: proctorIeee,
      admin_note: adminNote,
      created_at: new Date().toISOString(),
      members,
    };

    saveLocalXtremeTeam(newTeam);
    return Response.json({ success: true, team: newTeam, demo: true });
  }

  try {
    const client = getAdminServiceClient();

    // 1. Check if team name is taken
    const { data: nameCheck } = await client
      .from('xtreme_teams')
      .select('id')
      .ilike('team_name', teamName)
      .maybeSingle();

    if (nameCheck) {
      return jsonError(`Team name "${teamName}" is already taken.`, 409);
    }

    // 2. Check if any member is already registered in another team
    for (const ieeeId of seenIeeeIds) {
      const { data: memberInTeam } = await client
        .from('xtreme_members')
        .select('team_id, xtreme_teams(team_name)')
        .eq('ieee_member_id', ieeeId)
        .maybeSingle();

      if (memberInTeam) {
        // @ts-expect-error join
        const otherName = memberInTeam.xtreme_teams?.team_name || 'another team';
        return jsonError(`Member with IEEE ID "${ieeeId}" is already registered in team "${otherName}".`, 409);
      }
    }

    // 3. Create team row (unclaimed, lead_user_id = null)
    const { data: createdTeam, error: teamErr } = await client
      .from('xtreme_teams')
      .insert({
        team_name: teamName,
        lead_user_id: null,
        leader_email: leaderEmail,
        admin_note: adminNote || null,
        vtools_verified: false,
      })
      .select('*')
      .single();

    if (teamErr || !createdTeam) {
      console.error('Insert team error:', teamErr);
      return jsonError('Failed to create team record.', 500);
    }

    // 4. Create member rows
    const membersToInsert = [
      {
        team_id: createdTeam.id,
        is_lead: true,
        ieee_member_id: leaderIeeeId,
        first_name: leaderName.split(' ')[0] || leaderName,
        last_name: leaderName.split(' ').slice(1).join(' '),
        email: leaderEmail,
        phone: leaderPhone,
        usn: leaderUsn,
        department: leaderDept,
        year_of_study: leaderYear,
      },
      ...processedTeammates.map((m) => ({
        team_id: createdTeam.id,
        is_lead: false,
        ieee_member_id: m.ieee_id,
        first_name: m.name.split(' ')[0] || m.name,
        last_name: m.name.split(' ').slice(1).join(' '),
        email: m.email,
        phone: m.phone,
        usn: m.usn,
        department: m.department,
        year_of_study: m.year_of_study,
      })),
    ];

    const { data: insertedMembers, error: memErr } = await client
      .from('xtreme_members')
      .insert(membersToInsert)
      .select('*');

    if (memErr) {
      console.error('Insert members error:', memErr);
      // Clean up team
      await client.from('xtreme_teams').delete().eq('id', createdTeam.id);
      return jsonError('Failed to save team roster.', 500);
    }

    // 5. If proctor_id was selected, assign via concurrency-safe RPC
    let proctorResult = null;
    if (proctorId) {
      const { data: pRes, error: pErr } = await client.rpc('assign_proctor_to_team', {
        p_team_id: createdTeam.id,
        p_proctor_id: proctorId,
      });

      if (pErr) {
        console.error('assign_proctor_to_team error:', pErr);
        // Clean up created team and members so no partial/orphaned team is left
        await client.from('xtreme_members').delete().eq('team_id', createdTeam.id);
        await client.from('xtreme_teams').delete().eq('id', createdTeam.id);
        return jsonError(`Team creation failed: ${pErr.message}`, 400);
      }
      proctorResult = pRes;
    }

    return Response.json({
      success: true,
      team: {
        ...createdTeam,
        proctor_name: proctorResult?.proctor_name || null,
        proctor_ieee_id: proctorResult?.proctor_ieee_id || null,
        members: insertedMembers,
      },
    });
  } catch (err: unknown) {
    console.error('Admin create team error:', err);
    return jsonError('Internal server error creating team.', 500);
  }
}
