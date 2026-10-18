import { getAdminServiceClient, jsonError, requireAdmin } from '@/lib/server/supabase-admin';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getLocalXtremeProctors, saveLocalXtremeProctor } from '@/lib/xtreme';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin && isSupabaseConfigured()) {
    return jsonError('Admin access required.', 403);
  }

  if (!isSupabaseConfigured()) {
    const proctors = getLocalXtremeProctors();
    return Response.json({ proctors, demo: true });
  }

  try {
    const client = getAdminServiceClient();

    const { data: proctors, error } = await client
      .from('xtreme_proctors')
      .select('id, name, ieee_id, created_at')
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Fetch team assignments count per proctor
    const { data: teams, error: teamsError } = await client
      .from('xtreme_teams')
      .select('proctor_id, proctor_ieee_id');

    if (teamsError) throw teamsError;

    const enrichedProctors = (proctors || []).map((p) => {
      const assigned_count = (teams || []).filter(
        (t) => (t.proctor_id === p.id || (t.proctor_ieee_id && t.proctor_ieee_id === p.ieee_id))
      ).length;
      return {
        ...p,
        assigned_count,
      };
    });

    return Response.json({ proctors: enrichedProctors });
  } catch (err) {
    console.error('Fetch proctors failed:', err);
    return jsonError('Could not load proctors.', 500);
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin && isSupabaseConfigured()) {
    return jsonError('Admin access required.', 403);
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const ieee_id = typeof body?.ieee_id === 'string' ? body.ieee_id.trim() : '';

  if (!name || name.length < 2) {
    return jsonError('Proctor name is required (minimum 2 characters).', 400);
  }

  if (!ieee_id || !/^\d{5,15}$/.test(ieee_id)) {
    return jsonError('A valid IEEE Member ID (5-15 digits) is required for the proctor.', 400);
  }

  if (!isSupabaseConfigured()) {
    const newProctor = {
      id: `proc-demo-${Date.now()}`,
      name,
      ieee_id,
      created_at: new Date().toISOString(),
      assigned_count: 0,
    };
    saveLocalXtremeProctor(newProctor);
    return Response.json({ success: true, proctor: newProctor, demo: true });
  }

  try {
    const client = getAdminServiceClient();

    // Check unique IEEE ID
    const { data: existing } = await client
      .from('xtreme_proctors')
      .select('id')
      .eq('ieee_id', ieee_id)
      .maybeSingle();

    if (existing) {
      return jsonError(`A proctor with IEEE Member ID "${ieee_id}" already exists.`, 409);
    }

    const { data: proctor, error } = await client
      .from('xtreme_proctors')
      .insert({ name, ieee_id })
      .select('id, name, ieee_id, created_at')
      .single();

    if (error) throw error;

    return Response.json({
      success: true,
      proctor: { ...proctor, assigned_count: 0 },
    });
  } catch (err) {
    console.error('Create proctor failed:', err);
    return jsonError('Failed to create proctor.', 500);
  }
}

