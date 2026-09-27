import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from '@/lib/supabase';

type AdminIdentity = { id: string; email: string };
type AuthIdentity = { id: string; email: string };

let adminClient: SupabaseClient | null = null;

export function getAdminServiceClient() {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('The secure database service is not configured.');
  }
  if (!adminClient) {
    adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

export async function requireAdmin(request: Request): Promise<AdminIdentity | null> {
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token || !isSupabaseConfigured() || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

  try {
    const authClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await authClient.auth.getUser(token);
    if (error || !data.user?.email) return null;

    const { data: admin, error: adminError } = await getAdminServiceClient()
      .from('admins')
      .select('id')
      .eq('id', data.user.id)
      .maybeSingle();
    return adminError || !admin ? null : { id: data.user.id, email: data.user.email };
  } catch {
    return null;
  }
}

export async function requireUser(request: Request): Promise<AuthIdentity | null> {
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token || !isSupabaseConfigured() || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  try {
    const authClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await authClient.auth.getUser(token);
    return error || !data.user?.email ? null : { id: data.user.id, email: data.user.email };
  } catch {
    return null;
  }
}

export function jsonError(message = 'Request could not be completed.', status = 400) {
  return Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function recordAdminAudit(
  actor: AdminIdentity,
  action: string,
  entityType: string,
  entityId: string | null,
  details: Record<string, unknown> = {},
) {
  const { error } = await getAdminServiceClient().rpc('record_admin_audit', {
    p_actor_id: actor.id,
    p_actor_email: actor.email,
    p_action: action,
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_details: details,
  });
  if (error) throw new Error('Could not record the required audit event.');
}
