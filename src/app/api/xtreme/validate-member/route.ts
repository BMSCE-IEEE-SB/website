import { getAdminServiceClient, jsonError, requireUser } from '@/lib/server/supabase-admin';
import { isSupabaseConfigured } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user && isSupabaseConfigured()) {
    return jsonError('Authentication required to validate member numbers.', 401);
  }

  const body = await request.json().catch(() => null);
  const rawId = typeof body?.ieee_member_id === 'string' ? body.ieee_member_id.trim() : '';

  if (!rawId) {
    return jsonError('IEEE Member Number is required.', 400);
  }

  // If Supabase is not configured (demo mode)
  if (!isSupabaseConfigured()) {
    const isPlausible = /^\d{6,12}$/.test(rawId);
    if (!isPlausible) {
      return Response.json({ valid: false, reason: 'Invalid member ID format. IEEE IDs are numbers.' });
    }
    return Response.json({
      valid: true,
      firstName: 'BMSCE Member',
      source: 'demo_check',
    });
  }

  try {
    const client = getAdminServiceClient();

    // 1. Check if member is already registered in another team
    const { data: existingMember, error: existingMemberError } = await client
      .from('xtreme_members')
      .select('team_id')
      .eq('ieee_member_id', rawId)
      .maybeSingle();

    if (existingMemberError) {
      console.error('Database query error on xtreme_members:', existingMemberError);
      return jsonError('Database service error. Please try again later.', 500);
    }

    if (existingMember) {
      return Response.json({
        valid: false,
        alreadyRegistered: true,
        reason: 'This IEEE member number is already registered with another team.',
      });
    }

    // 2. Check in ieee_member_2026 table (legacy CSV uploads)
    const { data: known, error: knownError } = await client
      .from('ieee_member_2026')
      .select('ieee_member_id, name')
      .eq('ieee_member_id', rawId)
      .maybeSingle();

    if (knownError) {
      console.error('Database query error on ieee_member_2026:', knownError);
      return jsonError('Database service error. Please try again later.', 500);
    }

    if (known) {
      const firstName = known.name ? known.name.split(' ')[0] : 'Member';
      return Response.json({
        valid: true,
        firstName,
        source: 'known_member',
      });
    }

    // 3. Check in profiles table (current members who registered on site)
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('first_name')
      .eq('ieee_member_id', rawId)
      .maybeSingle();

    if (profileError) {
      console.error('Database query error on profiles:', profileError);
      return jsonError('Database service error. Please try again later.', 500);
    }

    if (profile) {
      return Response.json({
        valid: true,
        firstName: profile.first_name,
        source: 'active_profile',
      });
    }

    // Member number not found in either database
    return Response.json({
      valid: false,
      reason: 'Member number not recognized in BMSCE IEEE database. Please ensure you are an active member from BMSCE or contact admin.',
    });
  } catch (err) {
    console.error('Error validating member:', err);
    return jsonError('Could not validate member number at this time.', 500);
  }
}
