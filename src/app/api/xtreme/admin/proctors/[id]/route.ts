import { getAdminServiceClient, jsonError, requireAdmin } from '@/lib/server/supabase-admin';
import { isSupabaseConfigured } from '@/lib/supabase';
import { deleteLocalXtremeProctor, getLocalXtremeProctors, saveLocalXtremeProctor } from '@/lib/xtreme';

export const runtime = 'nodejs';

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin && isSupabaseConfigured()) {
    return jsonError('Admin access required.', 403);
  }

  const { id } = await context.params;
  if (!id) return jsonError('Proctor ID is required.', 400);

  if (!isSupabaseConfigured()) {
    deleteLocalXtremeProctor(id);
    return Response.json({ success: true, demo: true });
  }

  try {
    const client = getAdminServiceClient();

    // Check if proctor exists
    const { data: proctor } = await client
      .from('xtreme_proctors')
      .select('id, ieee_id')
      .eq('id', id)
      .maybeSingle();

    if (!proctor) {
      return jsonError('Proctor not found.', 404);
    }

    // Delete proctor (foreign keys on xtreme_teams will be set to NULL via ON DELETE SET NULL)
    // Also clear denormalized fields on assigned teams
    await client
      .from('xtreme_teams')
      .update({
        proctor_name: null,
        proctor_ieee_id: null,
        proctor_id: null,
        updated_at: new Date().toISOString(),
      })
      .or(`proctor_id.eq.${id},proctor_ieee_id.eq.${proctor.ieee_id}`);

    const { error: delError } = await client
      .from('xtreme_proctors')
      .delete()
      .eq('id', id);

    if (delError) throw delError;

    return Response.json({ success: true });
  } catch (err) {
    console.error('Delete proctor failed:', err);
    return jsonError('Could not delete proctor.', 500);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin && isSupabaseConfigured()) {
    return jsonError('Admin access required.', 403);
  }

  const { id } = await context.params;
  if (!id) return jsonError('Proctor ID is required.', 400);

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : undefined;
  const ieee_id = typeof body?.ieee_id === 'string' ? body.ieee_id.trim() : undefined;
  const capacity = body?.capacity === undefined || body?.capacity === null || body?.capacity === ''
    ? undefined
    : Number(body.capacity);

  if (name !== undefined && name.length < 2) {
    return jsonError('Proctor name must be at least 2 characters.', 400);
  }

  if (ieee_id !== undefined && !/^\d{5,15}$/.test(ieee_id)) {
    return jsonError('A valid IEEE Member ID (5-15 digits) is required for the proctor.', 400);
  }

  if (capacity !== undefined && (!Number.isInteger(capacity) || capacity < 1 || capacity > 500)) {
    return jsonError('Squad capacity must be a whole number between 1 and 500.', 400);
  }

  if (!isSupabaseConfigured()) {
    const proctors = getLocalXtremeProctors();
    const target = proctors.find((p) => p.id === id);
    if (!target) return jsonError('Proctor not found.', 404);
    if (name) target.name = name;
    if (ieee_id) target.ieee_id = ieee_id;
    if (capacity !== undefined) target.capacity = capacity;
    saveLocalXtremeProctor(target);
    return Response.json({ success: true, proctor: target, demo: true });
  }

  try {
    const client = getAdminServiceClient();

    const updateData: Record<string, string | number> = {};
    if (name) updateData.name = name;
    if (ieee_id) updateData.ieee_id = ieee_id;
    if (capacity !== undefined) updateData.capacity = capacity;

    const { data: updatedProctor, error } = await client
      .from('xtreme_proctors')
      .update(updateData)
      .eq('id', id)
      .select('id, name, ieee_id, capacity, sort_order, created_at')
      .single();

    if (error) throw error;

    // Sync denormalized proctor info on assigned teams
    await client
      .from('xtreme_teams')
      .update({
        proctor_name: updatedProctor.name,
        proctor_ieee_id: updatedProctor.ieee_id,
        updated_at: new Date().toISOString(),
      })
      .eq('proctor_id', id);

    return Response.json({ success: true, proctor: updatedProctor });
  } catch (err) {
    console.error('Update proctor failed:', err);
    return jsonError('Failed to update proctor.', 500);
  }
}

