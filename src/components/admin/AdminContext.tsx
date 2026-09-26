'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAdminUser, type Order } from '@/lib/auth';
import { computeFlags, fetchOrders, type AdminIdentity, type Flag } from '@/lib/admin';
import { loadPricing, type Pricing } from '@/lib/pricing';

type Ctx = {
  admin: AdminIdentity;
  orders: Order[];
  pricing: Pricing | null;
  flags: Map<string, Flag[]>;
  error: string;
  reload: () => Promise<void>;
  toast: (tone: 'success' | 'error' | 'info', text: string) => void;
};

const AdminCtx = createContext<Ctx | null>(null);

export function useAdmin() {
  const ctx = useContext(AdminCtx);
  if (!ctx) throw new Error('useAdmin must be used inside the admin portal');
  return ctx;
}

export function AdminProvider({ children, onToast }: { children: React.ReactNode; onToast: Ctx['toast'] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminIdentity | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    try {
      const [o, p] = await Promise.all([fetchOrders(), loadPricing().catch(() => null)]);
      setOrders(o);
      setPricing(p);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    getAdminUser()
      .catch(() => null)
      .then(async (a) => {
        if (!alive) return;
        if (!a) {
          router.replace(`/admin/login?next=${encodeURIComponent(pathname ?? '/admin')}`);
          return;
        }
        await reload();
        if (alive) setAdmin({ id: a.id, email: a.email });
      });
    return () => {
      alive = false;
    };
    // Only on first mount: navigating inside the portal keeps the session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flags = useMemo(() => computeFlags(orders, pricing), [orders, pricing]);

  if (!admin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading">
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" />
      </div>
    );
  }

  return <AdminCtx.Provider value={{ admin, orders, pricing, flags, error, reload, toast: onToast }}>{children}</AdminCtx.Provider>;
}
