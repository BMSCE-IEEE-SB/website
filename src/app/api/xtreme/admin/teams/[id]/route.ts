import { getAdminServiceClient, jsonError, requireAdmin } from '@/lib/server/supabase-admin';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  deleteLocalXtremeTeam,
  getLocalXtremeProctors,
  getLocalXtremeTeams,
  proctorCapacity,
  updateLocalXtremeTeam,
  type XtremeMember,
  type XtremeTeam,
} from '@/lib/xtreme';

export const runtime = 'nodejs';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin && isSupabaseConfigured()) {
    return jsonError('Admin sign-in required.', 401);
  }

  const { id } = await context.params;
  if (!id) return jsonError('Team ID is required.', 400);

  if (!isSupabaseConfigured()) {
    const teams = getLocalXtremeTeams();
    const team = teams.find((t) => t.id === id);
    if (!team) return jsonError('Team not found.', 404);
    return Response.json({ success: true, team, demo: true });
  }

  try {
    const client = getAdminServiceClient();
    const { data: team, error } = await client
      .from('xtreme_teams')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!team) return jsonError('Team not found.', 404);

    const { data: members, error: memErr } = await client
      .from('xtreme_members')
      .select('*')
      .eq('team_id', id)
      .order('is_lead', { ascending: false });

    if (memErr) throw memErr;

    return Response.json({
      success: true,
      team: {
        ...team,
        members: members || [],
      },
    });
  } catch (err: unknown) {
    console.error('Fetch xtreme team failed:', err);
    return jsonError('Could not load team.', 500);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin && isSupabaseConfigured()) {
    return jsonError('Admin sign-in required.', 401);
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);

  if (!id) return jsonError('Team ID is required.', 400);
  if (!body) return jsonError('Request body is required.', 400);

  // 1. Validate team name if provided
  if (body.team_name !== undefined) {
    const teamName = String(body.team_name).trim();
    if (!/^[a-zA-Z0-9]{3,20}$/.test(teamName)) {
      return jsonError('Team name must be 3-20 characters and contain only letters and numbers (no spaces).', 400);
    }
  }

  // 2. Validate members if provided
  let processedMembers: XtremeMember[] | undefined = undefined;
  if (body.members !== undefined) {
    if (!Array.isArray(body.members)) {
      return jsonError('Members must be an array.', 400);
    }
    if (body.members.length < 1 || body.members.length > 3) {
      return jsonError('A squad must have between 1 and 3 members.', 400);
    }

    const leads = body.members.filter((m: Partial<XtremeMember>) => m.is_lead);
    if (leads.length !== 1) {
      return jsonError('Exactly one member must be designated as the team lead.', 400);
    }

    const seenIeee = new Set<string>();
    processedMembers = [];

    for (const m of body.members) {
      const firstName = typeof m.first_name === 'string' ? m.first_name.trim() : '';
      const lastName = typeof m.last_name === 'string' ? m.last_name.trim() : '';
      const email = typeof m.email === 'string' ? m.email.trim().toLowerCase() : '';
      const ieeeId = typeof m.ieee_member_id === 'string' ? m.ieee_member_id.trim() : '';

      if (!firstName) {
        return jsonError('Member first name is required.', 400);
      }
      if (!email || !email.includes('@')) {
        return jsonError(`A valid email address is required for ${firstName}.`, 400);
      }
      if (!ieeeId || (!/^\d{5,15}$/.test(ieeeId) && ieeeId !== '999')) {
        return jsonError(`Valid IEEE Member ID (5-15 digits) required for ${firstName}.`, 400);
      }

      if (seenIeee.has(ieeeId)) {
        return jsonError(`Duplicate IEEE Member ID "${ieeeId}" in squad roster.`, 400);
      }
      seenIeee.add(ieeeId);

      processedMembers.push({
        id: m.id,
        team_id: id,
        is_lead: Boolean(m.is_lead),
        ieee_member_id: ieeeId,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: typeof m.phone === 'string' ? m.phone.trim() : '',
        usn: typeof m.usn === 'string' ? m.usn.trim().toUpperCase() : '',
        department: typeof m.department === 'string' ? m.department.trim() : 'CSE',
        year_of_study: typeof m.year_of_study === 'string' ? m.year_of_study.trim() : '3rd Year',
      });
    }
  }

  // -------------------------------------------------------------------------
  // Handle Demo Mode
  // -------------------------------------------------------------------------
  if (!isSupabaseConfigured()) {
    const existingTeams = getLocalXtremeTeams();
    const currentTeam = existingTeams.find((t) => t.id === id);
    if (!currentTeam) return jsonError('Team not found.', 404);

    if (body.team_name !== undefined) {
      const teamName = String(body.team_name).trim();
      const conflict = existingTeams.find(
        (t) => t.id !== id && t.team_name.toLowerCase() === teamName.toLowerCase()
      );
      if (conflict) {
        return jsonError(`Team name "${teamName}" is already taken.`, 409);
      }
    }

    if (processedMembers) {
      for (const m of processedMembers) {
        for (const otherTeam of existingTeams) {
          if (otherTeam.id === id) continue;
          const memberConflict = otherTeam.members?.find((om) => om.ieee_member_id === m.ieee_member_id);
          if (memberConflict) {
            return jsonError(
              `IEEE Member ID "${m.ieee_member_id}" is already registered with squad "${otherTeam.team_name}".`,
              400
            );
          }
        }
      }
    }

    const patch: Partial<XtremeTeam> = {};
    if (body.admin_note !== undefined) patch.admin_note = body.admin_note;
    if (body.vtools_verified !== undefined) patch.vtools_verified = Boolean(body.vtools_verified);
    if (body.team_name !== undefined) patch.team_name = String(body.team_name).trim();
    if (processedMembers) patch.members = processedMembers;

    if (body.proctor_id !== undefined) {
      if (!body.proctor_id) {
        // Unassign
        patch.proctor_id = null;
        patch.proctor_name = '';
        patch.proctor_ieee_id = '';
      } else {
        const proctors = getLocalXtremeProctors();
        const proc = proctors.find((p) => p.id === body.proctor_id);
        if (!proc) return jsonError('Proctor not found.', 404);
        const cap = proctorCapacity(proc);
        const assignedCount = existingTeams.filter(
          (t) => t.id !== id && (t.proctor_id === proc.id || t.proctor_ieee_id === proc.ieee_id)
        ).length;
        if (assignedCount >= cap) {
          return jsonError(`Proctor "${proc.name}" already has ${cap} squads assigned.`, 400);
        }
        patch.proctor_id = proc.id;
        patch.proctor_name = proc.name;
        patch.proctor_ieee_id = proc.ieee_id;
      }
    }

    const updated = updateLocalXtremeTeam(id, patch);
    return Response.json({ success: true, team: updated, demo: true });
  }

  // -------------------------------------------------------------------------
  // Handle Supabase Mode
  // -------------------------------------------------------------------------
  try {
    const client = getAdminServiceClient();

    // 1. Check team existence & name uniqueness if changing team_name or members
    let currentTeam: { id: string; team_name: string; leader_email?: string | null; lead_user_id?: string | null } | null = null;
    if (body.team_name !== undefined || processedMembers) {
      const { data: fetchedTeam, error: fetchErr } = await client
        .from('xtreme_teams')
        .select('id, team_name, leader_email, lead_user_id')
        .eq('id', id)
        .maybeSingle();

      if (fetchErr) throw fetchErr;
      if (!fetchedTeam) return jsonError('Team not found.', 404);
      currentTeam = fetchedTeam;
    }

    if (body.team_name !== undefined) {
      const teamName = String(body.team_name).trim();
      const { data: nameCheck } = await client
        .from('xtreme_teams')
        .select('id')
        .ilike('team_name', teamName)
        .neq('id', id)
        .maybeSingle();

      if (nameCheck) {
        return jsonError(`Team name "${teamName}" is already taken.`, 409);
      }
    }

    // 2. Check member IEEE IDs across other squads
    if (processedMembers) {
      const ieeeIds = processedMembers.map((m) => m.ieee_member_id);
      const { data: conflicts } = await client
        .from('xtreme_members')
        .select('ieee_member_id, team_id')
        .in('ieee_member_id', ieeeIds)
        .neq('team_id', id);

      if (conflicts && conflicts.length > 0) {
        return jsonError(
          `IEEE Member ID "${conflicts[0].ieee_member_id}" is already registered with another squad.`,
          400
        );
      }
    }

    // 3. Proctor assignment / unassignment
    let proctorAssigned = false;
    let proctorData: { proctor_name?: string | null; proctor_ieee_id?: string | null; proctor_id?: string | null } = {};

    if (body.proctor_id !== undefined) {
      const targetProctorId = body.proctor_id ? String(body.proctor_id).trim() : null;
      const { data: pRes, error: pErr } = await client.rpc('assign_proctor_to_team', {
        p_team_id: id,
        p_proctor_id: targetProctorId,
      });

      if (pErr) {
        return jsonError(pErr.message || 'Failed to update proctor assignment.', 400);
      }

      proctorAssigned = true;
      if (pRes?.unassigned) {
        proctorData = { proctor_id: null, proctor_name: null, proctor_ieee_id: null };
      } else if (pRes?.proctor_id) {
        proctorData = {
          proctor_id: pRes.proctor_id,
          proctor_name: pRes.proctor_name,
          proctor_ieee_id: pRes.proctor_ieee_id,
        };
      }
    }

    // 4. Update team attributes
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.admin_note !== undefined) updateData.admin_note = body.admin_note;
    if (body.vtools_verified !== undefined) updateData.vtools_verified = Boolean(body.vtools_verified);
    if (body.team_name !== undefined) updateData.team_name = String(body.team_name).trim();

    if (processedMembers && currentTeam) {
      const lead = processedMembers.find((m) => m.is_lead);
      if (lead) {
        const leadEmail = lead.email.toLowerCase();
        if (currentTeam.leader_email && currentTeam.leader_email.toLowerCase() !== leadEmail) {
          updateData.leader_email = leadEmail;
          updateData.lead_user_id = null; // reset claim so new lead can claim team
        } else if (!currentTeam.leader_email) {
          updateData.leader_email = leadEmail;
        }
      }
    }

    if (!proctorAssigned) {
      if (body.proctor_name !== undefined) updateData.proctor_name = body.proctor_name;
      if (body.proctor_ieee_id !== undefined) updateData.proctor_ieee_id = body.proctor_ieee_id;
    }

    const { data: updatedTeam, error: teamUpdateErr } = await client
      .from('xtreme_teams')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (teamUpdateErr) throw teamUpdateErr;

    // 5. Update members in xtreme_members if provided
    let finalMembers: XtremeMember[] | undefined = undefined;
    if (processedMembers) {
      // Delete existing member rows for this squad
      const { error: delErr } = await client.from('xtreme_members').delete().eq('team_id', id);
      if (delErr) throw delErr;

      // Insert new member rows
      const insertRows = processedMembers.map((m) => ({
        team_id: id,
        is_lead: m.is_lead,
        ieee_member_id: m.ieee_member_id,
        first_name: m.first_name,
        last_name: m.last_name || '',
        email: m.email,
        phone: m.phone || null,
        usn: m.usn || null,
        department: m.department || 'CSE',
        year_of_study: m.year_of_study || '3rd Year',
      }));

      const { data: inserted, error: insErr } = await client
        .from('xtreme_members')
        .insert(insertRows)
        .select('*');

      if (insErr) throw insErr;
      finalMembers = inserted || [];
    }

    const resultTeam: Record<string, unknown> = {
      ...updatedTeam,
      ...proctorData,
    };
    if (finalMembers !== undefined) {
      resultTeam.members = finalMembers;
    }

    return Response.json({
      success: true,
      team: resultTeam,
    });
  } catch (err: unknown) {
    console.error('Update xtreme team failed:', err);
    return jsonError('Could not update team.', 500);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin && isSupabaseConfigured()) {
    return jsonError('Admin sign-in required.', 401);
  }

  const { id } = await context.params;
  if (!id) return jsonError('Team ID is required.', 400);

  if (!isSupabaseConfigured()) {
    deleteLocalXtremeTeam(id);
    return Response.json({ success: true, demo: true });
  }

  try {
    const client = getAdminServiceClient();
    const { error } = await client.from('xtreme_teams').delete().eq('id', id);
    if (error) throw error;

    return Response.json({ success: true });
  } catch (err) {
    console.error('Delete xtreme team failed:', err);
    return jsonError('Could not delete team.', 500);
  }
}
