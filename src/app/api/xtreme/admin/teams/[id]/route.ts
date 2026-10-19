import { getAdminServiceClient, jsonError, requireAdmin } from '@/lib/server/supabase-admin';
import { isSupabaseConfigured } from '@/lib/supabase';
import { deleteLocalXtremeTeam, getLocalXtremeProctors, proctorCapacity, updateLocalXtremeTeam, type XtremeTeam } from '@/lib/xtreme';

export const runtime = 'nodejs';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin && isSupabaseConfigured()) {
    return jsonError('Admin sign-in required.', 401);
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);

  if (!id) return jsonError('Team ID is required.', 400);

  if (!isSupabaseConfigured()) {
    const patch: Partial<XtremeTeam> = {};
    if (body.admin_note !== undefined) patch.admin_note = body.admin_note;
    if (body.vtools_verified !== undefined) patch.vtools_verified = Boolean(body.vtools_verified);
    if (body.team_name !== undefined && /^[a-zA-Z0-9]{3,20}$/.test(body.team_name)) {
      patch.team_name = body.team_name;
    }

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
        if ((proc.assigned_count ?? 0) >= cap) {
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

  try {
    const client = getAdminServiceClient();

    // 1. If proctor assignment is requested, invoke concurrency-safe RPC
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

    // 2. Update other team properties
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.admin_note !== undefined) updateData.admin_note = body.admin_note;
    if (body.vtools_verified !== undefined) updateData.vtools_verified = Boolean(body.vtools_verified);
    if (body.team_name !== undefined && /^[a-zA-Z0-9]{3,20}$/.test(body.team_name)) {
      updateData.team_name = body.team_name;
    }

    // If proctor wasn't handled via proctor_id but legacy fields were provided directly
    if (!proctorAssigned) {
      if (body.proctor_name !== undefined) updateData.proctor_name = body.proctor_name;
      if (body.proctor_ieee_id !== undefined) updateData.proctor_ieee_id = body.proctor_ieee_id;
    }

    const { data: team, error } = await client
      .from('xtreme_teams')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return Response.json({
      success: true,
      team: {
        ...team,
        ...proctorData,
      },
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
