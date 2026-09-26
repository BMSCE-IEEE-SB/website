'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser, getLocalProfile, type SessionUser } from './auth';
import { isDemoMode, supabase } from './supabase';

export const AUTH_EVENT = 'bmsce-auth-change';

/** Call after demo sign-in/out so every mounted component refreshes. */
export const notifyAuthChange = () => window.dispatchEvent(new Event(AUTH_EVENT));

/** undefined while loading, null when signed out. */
export function useSession() {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [name, setName] = useState<string | undefined>();

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      const u = await getCurrentUser().catch(() => null);
      if (!alive) return;
      setUser(u);
      if (!u) return setName(undefined);
      if (isDemoMode()) setName(getLocalProfile(u.id)?.full_name);
      else {
        const { data } = await supabase.from('profiles').select('full_name').eq('id', u.id).maybeSingle();
        if (alive) setName(data?.full_name ?? undefined);
      }
    };
    refresh();
    window.addEventListener(AUTH_EVENT, refresh);
    window.addEventListener('storage', refresh);
    const sub = isDemoMode() ? null : supabase.auth.onAuthStateChange(() => refresh()).data.subscription;
    return () => {
      alive = false;
      window.removeEventListener(AUTH_EVENT, refresh);
      window.removeEventListener('storage', refresh);
      sub?.unsubscribe();
    };
  }, []);

  return { user, name };
}
