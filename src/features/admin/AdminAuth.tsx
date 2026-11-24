/**
 * Contexte d'authentification du back-office.
 *
 * `status` :
 *   - 'loading'    : session en cours de résolution ;
 *   - 'anonymous'  : aucune session → login ;
 *   - 'denied'     : connecté mais pas actif dans `admin_users` (RLS refuse tout le reste) ;
 *   - 'ready'      : admin authentifié (rôle connu).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '@/integrations/supabase/client';
import { fetchAdminRole, signInAdmin, signOutAdmin, type AdminRole } from '@/services/admin';
import type { ServiceError } from '@/services/_shared';

export type AdminStatus = 'loading' | 'anonymous' | 'denied' | 'ready';

interface AdminAuthState {
  status: AdminStatus;
  user: User | null;
  role: AdminRole | null;
  signIn: (email: string, password: string) => Promise<ServiceError | null>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AdminAuthState>({ status: 'loading', user: null, role: null, signIn: async () => null, signOut: async () => {} });

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AdminStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AdminRole | null>(null);

  const resolve = useCallback(async (u: User | null) => {
    setUser(u);
    if (!u) {
      setRole(null);
      setStatus('anonymous');
      return;
    }
    const r = await fetchAdminRole(u.id);
    setRole(r);
    setStatus(r ? 'ready' : 'denied');
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const db = await getSupabase();
      if (cancelled) return;
      if (!db) {
        setStatus('anonymous');
        return;
      }
      const { data } = await db.auth.getSession();
      if (cancelled) return;
      await resolve(data.session?.user ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [resolve]);

  useEffect(() => {
    let sub: { unsubscribe: () => void } | null = null;
    void getSupabase().then((db) => {
      if (!db) return;
      const { data } = db.auth.onAuthStateChange((_event, session) => {
        void resolve(session?.user ?? null);
      });
      sub = data.subscription;
    });
    return () => sub?.unsubscribe();
  }, [resolve]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await signInAdmin(email, password);
      if (res.error) return res.error;
      await resolve(res.data);
      return null;
    },
    [resolve],
  );

  const signOut = useCallback(async () => {
    await signOutAdmin();
    await resolve(null);
  }, [resolve]);

  const value = useMemo(() => ({ status, user, role, signIn, signOut }), [status, user, role, signIn, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAdminAuth = () => useContext(Ctx);
