'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { Activity, Calendar, ClipboardCheck, ExternalLink, LayoutDashboard, LogOut, Megaphone, Settings, ShieldCheck, Users } from 'lucide-react';
import { AdminProvider, useAdmin } from '@/components/admin/AdminContext';
import { clearAdminSession } from '@/lib/auth';
import { isDemoMode } from '@/lib/supabase';
import { Alert } from '@/components/ui/form';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Applications', icon: ClipboardCheck, badge: 'pending' as const },
  { href: '/admin/members', label: 'Members', icon: Users },
  { href: '/admin/events', label: 'Events & Workshops', icon: Calendar },
  { href: '/admin/announcement', label: 'Announcement', icon: Megaphone },
  { href: '/admin/team', label: 'Team access', icon: ShieldCheck },
  { href: '/admin/settings', label: 'Fees & settings', icon: Settings },
  { href: '/admin/activity', label: 'Activity log', icon: Activity },
];

function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, orders } = useAdmin();
  const pending = orders.filter((o) => o.status === 'pending').length;
  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname?.startsWith(href));

  const signOut = async () => {
    await clearAdminSession();
    router.push('/admin/login');
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-24 space-y-6">
          <div className="rounded-2xl bg-ink p-4 text-white">
            <p className="text-xs text-white/55">Signed in as</p>
            <p className="mt-0.5 truncate text-sm font-semibold">{admin.email}</p>
            {isDemoMode() && <span className="mt-2 inline-block rounded-full bg-brand-orange/20 px-2 py-0.5 text-[11px] font-semibold text-brand-orange">Demo mode · sample data</span>}
          </div>
          <nav className="space-y-1" aria-label="Admin">
            {nav.map((n) => {
              const active = isActive(n.href);
              return (
                <Link key={n.href} href={n.href} className={cn('relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors', active ? 'text-ink' : 'text-ink-soft hover:bg-white hover:text-ink')}>
                  {active && <motion.span layoutId="admin-nav" className="absolute inset-0 rounded-xl bg-white shadow-sm" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                  <n.icon className={cn('relative h-4 w-4', active && 'text-brand-orange')} />
                  <span className="relative flex-1">{n.label}</span>
                  {n.badge && pending > 0 && <span className="relative rounded-full bg-brand-orange px-2 py-0.5 text-[11px] font-bold text-white">{pending}</span>}
                </Link>
              );
            })}
          </nav>
          <div className="space-y-1 border-t border-line pt-4">
            <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-soft hover:bg-white hover:text-ink">
              <ExternalLink className="h-4 w-4" /> View website
            </Link>
            <button type="button" onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile tabs */}
      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 lg:hidden">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className={cn('flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium', isActive(n.href) ? 'bg-ink text-white' : 'bg-white text-ink-soft')}>
            <n.icon className="h-4 w-4" /> {n.label}
            {n.badge && pending > 0 && <span className="rounded-full bg-brand-orange px-1.5 text-[11px] font-bold text-white">{pending}</span>}
          </Link>
        ))}
        <button type="button" onClick={signOut} className="flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-red-600">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </>
  );
}

function LoadError() {
  const { error } = useAdmin();
  return error ? <Alert tone="error" className="mb-6">{error}</Alert> : null;
}

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ tone: 'success' | 'error' | 'info'; text: string; id: number } | null>(null);
  const showToast = useCallback((tone: 'success' | 'error' | 'info', text: string) => {
    const id = Date.now();
    setToast({ tone, text, id });
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 5000);
  }, []);

  return (
    <AdminProvider onToast={showToast}>
      <div className="container-page py-8 lg:py-10">
        <div className="lg:flex lg:gap-10">
          <Sidebar />
          <div className="min-w-0 flex-1">
            <LoadError />
            {children}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {toast && (
          <motion.div key={toast.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="fixed inset-x-4 bottom-4 z-[70] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-sm">
            <Alert tone={toast.tone} className="shadow-xl">{toast.text}</Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminProvider>
  );
}
