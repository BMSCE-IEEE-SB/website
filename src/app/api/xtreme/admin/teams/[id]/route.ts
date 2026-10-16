import { getAdminServiceClient, jsonError, requireAdmin } from '@/lib/server/supabase-admin';
import { isSupabaseConfigured } from '@/lib/supabase';
import { deleteLocalXtremeTeam, updateLocalXtremeTeam } from '@/lib/xtreme';

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
    const updated = updateLocalXtremeTeam(id, body);
    return Response.json({ success: true, team: updated, demo: true });
  }

  try {
    const client = getAdminServiceClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.proctor_name !== undefined) updateData.proctor_name = body.proctor_name;
    if (body.proctor_ieee_id !== undefined) updateData.proctor_ieee_id = body.proctor_ieee_id;
    if (body.admin_note !== undefined) updateData.admin_note = body.admin_note;
    if (body.vtools_verified !== undefined) updateData.vtools_verified = Boolean(body.vtools_verified);
    if (body.team_name !== undefined && /^[a-zA-Z0-9]{3,20}$/.test(body.team_name)) {
      updateData.team_name = body.team_name;
    }

    const { data: team, error } = await client
      .from('xtreme_teams')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    return Response.json({ success: true, team });
  } catch (err) {
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

