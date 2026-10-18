import { getAdminServiceClient, jsonError, requireUser } from '@/lib/server/supabase-admin';
import { isSupabaseConfigured } from '@/lib/supabase';

export const runtime = 'nodejs';

interface MemberPayload {
  is_lead: boolean;
  ieee_member_id: string;
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  usn?: string;
  department?: string;
  year_of_study?: string;
}

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user && isSupabaseConfigured()) {
    return jsonError('Please sign in to register your team.', 401);
  }

  const userId = user?.id || 'demo-user-id';
  const body = await request.json().catch(() => null);

  const rawTeamName = typeof body?.teamName === 'string' ? body.teamName.trim() : '';
  const members: MemberPayload[] = Array.isArray(body?.members) ? body.members : [];

  // Team Name Validation: letters and numbers only, 3-20 characters
  if (!rawTeamName || !/^[a-zA-Z0-9]{3,20}$/.test(rawTeamName)) {
    return jsonError('Team name must be 3-20 characters and contain only letters and numbers (no spaces or special characters).', 400);
  }

  // Members count: 1 to 3
  if (members.length < 1 || members.length > 3) {
    return jsonError('Teams must have between 1 and 3 members (minimum solo, maximum 3).', 400);
  }

  const leadMembers = members.filter((m) => m.is_lead);
  if (leadMembers.length !== 1) {
    return jsonError('Exactly one team member must be designated as the Team Lead.', 400);
  }

  // Check duplicate member IDs in payload
  const seenMemberIds = new Set<string>();
  for (const m of members) {
    const id = m.ieee_member_id?.trim();
    if (!id) return jsonError('All team members must have a valid IEEE Member Number.', 400);
    if (seenMemberIds.has(id)) {
      return jsonError(`Duplicate IEEE Member Number ${id} in team registration.`, 400);
    }
    seenMemberIds.add(id);

    if (!m.first_name?.trim()) {
      return jsonError('First name is required for all members.', 400);
    }
    if (!m.email?.trim() || !m.email.includes('@')) {
      return jsonError('Valid email address is required for all members.', 400);
    }
  }

  if (!isSupabaseConfigured()) {
    const demoTeamId = `demo-team-${Date.now()}`;
    return Response.json({
      success: true,
      teamId: demoTeamId,
      demo: true,
    });
  }

  try {
    const client = getAdminServiceClient();

    // 1. Check if this user already has a team
    const { data: existingTeam } = await client
      .from('xtreme_teams')
      .select('id, team_name, vtools_verified')
      .eq('lead_user_id', userId)
      .maybeSingle();

    if (existingTeam && existingTeam.vtools_verified) {
      return jsonError('Your team registration is locked because registration on official vTools has already been confirmed.', 403);
    }

    // 2. Check if team name is taken by ANY OTHER team
    const { data: teamWithSameName } = await client
      .from('xtreme_teams')
      .select('id, lead_user_id')
      .ilike('team_name', rawTeamName)
      .maybeSingle();

    if (teamWithSameName && teamWithSameName.id !== existingTeam?.id) {
      return jsonError(`The team name "${rawTeamName}" is already taken. Please choose another name.`, 409);
    }

    // 3. Check each member's validity against known/profile databases & verify not in other teams
    for (const m of members) {
      const cleanId = m.ieee_member_id.trim();

      // Check if registered on another team
      const { data: inOtherTeam } = await client
        .from('xtreme_members')
        .select('team_id, xtreme_teams(team_name)')
        .eq('ieee_member_id', cleanId)
        .maybeSingle();

      if (inOtherTeam && inOtherTeam.team_id !== existingTeam?.id) {
        // @ts-expect-error join
        const otherTeamName = inOtherTeam.xtreme_teams?.team_name || 'another team';
        return jsonError(`Member ${cleanId} (${m.first_name}) is already registered in team "${otherTeamName}".`, 409);
      }

      // Check membership status in either ieee_member_2026 or profiles
      const { data: known, error: knownErr } = await client
        .from('ieee_member_2026')
        .select('ieee_member_id')
        .eq('ieee_member_id', cleanId)
        .maybeSingle();

      if (knownErr) {
        console.error('Error querying ieee_member_2026:', knownErr);
        return jsonError('Database service error while checking membership. Please try again.', 500);
      }

      if (!known) {
        const { data: prof, error: profErr } = await client
          .from('profiles')
          .select('id')
          .eq('ieee_member_id', cleanId)
          .maybeSingle();

        if (profErr) {
          console.error('Error querying profiles:', profErr);
          return jsonError('Database service error while checking membership. Please try again.', 500);
        }

        if (!prof) {
          return jsonError(`Member ID ${cleanId} (${m.first_name}) was not found in the BMSCE IEEE member directory. Only active BMSCE members can participate.`, 400);
        }
      }
    }

    // 4. Save team and members atomically via RPC
    const membersToSave = members.map((m) => ({
      is_lead: m.is_lead,
      ieee_member_id: m.ieee_member_id.trim(),
      first_name: m.first_name.trim(),
      last_name: (m.last_name || '').trim(),
      email: m.email.trim().toLowerCase(),
      phone: (m.phone || '').trim(),
      usn: (m.usn || '').trim().toUpperCase(),
      department: (m.department || '').trim(),
      year_of_study: (m.year_of_study || '').trim(),
    }));

    const { data: rpcResult, error: rpcErr } = await client.rpc('save_xtreme_team', {
      p_team_name: rawTeamName,
      p_lead_user_id: userId,
      p_members: membersToSave,
    });

    if (rpcErr || !rpcResult) {
      console.error('save_xtreme_team RPC error:', rpcErr);
      return jsonError(rpcErr?.message || 'Failed to save team registration. Please try again.', 400);
    }

    // 5. Automatically assign proctor if available (fill-first by created_at)
    if (rpcResult.team_id) {
      const { error: autoAssignErr } = await client.rpc('auto_assign_proctor', {
        p_team_id: rpcResult.team_id,
      });
      if (autoAssignErr) {
        console.warn('auto_assign_proctor RPC notice:', autoAssignErr.message);
      }
    }

    return Response.json({
      success: true,
      teamId: rpcResult.team_id,
      teamName: rpcResult.team_name || rawTeamName,
    });
  } catch (err) {
    console.error('Registration failed:', err);
    return jsonError('Failed to save team registration. Please try again.', 500);
  }
}

