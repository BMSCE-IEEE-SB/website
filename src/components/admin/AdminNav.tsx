'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckSquare, DollarSign, LogOut, Megaphone, Users } from 'lucide-react';
import { clearAdminSession } from '@/lib/auth';
import { cn } from '@/lib/utils';

export type AdminTab = 'orders' | 'settings' | 'announcement' | 'team';

interface AdminNavProps {
  current: AdminTab;
  adminEmail?: string;
  demo?: boolean;
}

export default function AdminNav({ current, adminEmail, demo }: AdminNavProps) {
  const router = useRouter();

  const signOut = async () => {
    await clearAdminSession();
    router.push('/admin/login');
  };

  const navItems = [
    { id: 'orders', label: 'Verifications', href: '/admin/orders', icon: CheckSquare },
    { id: 'settings', label: 'Pricing & Drive', href: '/admin/settings', icon: DollarSign },
    { id: 'announcement', label: 'Announcement', href: '/admin/announcement', icon: Megaphone },
    { id: 'team', label: 'Admin Team', href: '/admin/team', icon: Users },
  ] as const;

  return (
    <div className="border-b border-line bg-white">
      <div className="container-page py-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-navy text-[11px] font-bold text-white">
                SB
              </span>
              <p className="font-semibold text-ink">BMSCE IEEE Admin</p>
              {demo && (
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-brand-navy">
                  Demo Mode
                </span>
              )}
            </div>
            {adminEmail && (
              <p className="mt-0.5 text-xs text-muted truncate max-w-sm">
                Signed in as <span className="font-medium text-ink">{adminEmail}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <nav className="flex flex-wrap items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = current === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
                      isActive
                        ? 'bg-brand-navy text-white shadow-sm'
                        : 'text-ink-soft hover:bg-paper hover:text-ink',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
              title="Sign out of admin portal"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
