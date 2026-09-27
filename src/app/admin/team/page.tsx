'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Plus, Shield, ShieldAlert, Trash2, UserCheck } from 'lucide-react';
import { isDemoMode } from '@/lib/supabase';
import {
  addAdminWhitelistEntry,
  getAdminUser,
  loadAdminWhitelist,
  removeAdminWhitelistEntry,
  type AdminWhitelistEntry,
} from '@/lib/auth';
import AdminNav from '@/components/admin/AdminNav';
import { Alert, Field, Input, PageLoader, Select, Spinner } from '@/components/ui/form';
import { cn, errorMessage } from '@/lib/utils';
import { adminFetch } from '@/lib/admin-api';

const roles = [
  { value: 'chair', label: 'Branch Chair' },
  { value: 'vice-chair', label: 'Vice Chair' },
  { value: 'treasurer', label: 'Branch Treasurer (Dues & Finance)' },
  { value: 'secretary', label: 'Branch Secretary' },
  { value: 'admin', label: 'Executive Committee Member' },
];

export default function AdminTeamPage() {
  const router = useRouter();
  const demo = isDemoMode();
  const [adminEmail, setAdminEmail] = useState('');
  const [whitelist, setWhitelist] = useState<AdminWhitelistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingEmail, setDeletingEmail] = useState<string | null>(null);

  const [toast, setToast] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const showToast = (tone: 'success' | 'error', text: string) => {
    setToast({ tone, text });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    try {
      let list: AdminWhitelistEntry[];
      if (demo) list = await loadAdminWhitelist();
      else {
        const response = await adminFetch('/api/admin/team');
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not load admin team.');
        list = result.whitelist;
      }
      setWhitelist(list);
    } catch (err) {
      showToast('error', `Failed to load admin team: ${errorMessage(err)}`);
    }
  }, [demo]);

  useEffect(() => {
    (async () => {
      const admin = await getAdminUser().catch(() => null);
      if (!admin) {
        router.replace('/admin/login');
        return;
      }
      setAdminEmail(admin.email);
      await load();
      setIsLoading(false);
    })();
  }, [router, load]);

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    const clean = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      showToast('error', 'Please enter a valid email address.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (demo) await addAdminWhitelistEntry(clean, newRole);
      else {
        const response = await adminFetch('/api/admin/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: clean, role: newRole }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not authorize administrator.');
      }
      showToast('success', `${clean} added to authorized administrators.`);
      setNewEmail('');
      await load();
    } catch (err) {
      showToast('error', `Failed to add administrator: ${errorMessage(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemoveAdmin(email: string) {
    if (whitelist.length <= 1) {
      showToast('error', 'Cannot remove the last administrator.');
      return;
    }
    if (!confirm(`Revoke admin privileges for ${email}?`)) return;
    setDeletingEmail(email);
    try {
      if (demo) await removeAdminWhitelistEntry(email);
      else {
        const response = await adminFetch(`/api/admin/team?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not revoke administrator.');
      }
      showToast('success', `Revoked admin privileges for ${email}.`);
      await load();
    } catch (err) {
      showToast('error', `Failed to remove: ${errorMessage(err)}`);
    } finally {
      setDeletingEmail(null);
    }
  }

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <AdminNav current="team" adminEmail={adminEmail} demo={demo} />

      <div className="container-page max-w-4xl py-10 sm:py-12">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Admin Team & Access Control</h1>
          <p className="mt-1 text-sm text-muted">
            Manage authorized executive committee members who can review membership proofs, verify orders, and publish announcements.
          </p>
        </div>

        {/* 1. Add New Admin */}
        <form onSubmit={handleAddAdmin} className="panel mt-8 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-brand-sky">
              <UserCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Authorize New Administrator</h2>
              <p className="text-xs text-muted">Pre-approved emails will automatically receive admin rights upon sign-in</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-[1fr_240px_auto] sm:items-end">
            <Field label="Institutional or Executive Email" htmlFor="new-admin-email" required>
              <Input
                id="new-admin-email"
                type="email"
                icon={Mail}
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="executive.dept@bmsce.ac.in"
              />
            </Field>

            <Field label="Designated Role" htmlFor="new-admin-role" required>
              <Select
                id="new-admin-role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              >
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </Field>

            <button type="submit" disabled={isSubmitting} className="btn btn-dark sm:mb-0.5">
              {isSubmitting ? <Spinner /> : <Plus className="h-4 w-4" />}
              Authorize Email
            </button>
          </div>
        </form>

        {/* 2. Whitelist Ledger */}
        <div className="panel mt-8 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-navy/10 text-brand-navy">
              <Shield className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Authorized Branch Administrators ({whitelist.length})</h2>
              <p className="text-xs text-muted">Currently pre-approved accounts with verified database access</p>
            </div>
          </div>

          <div className="mt-6 divide-y divide-line">
            {whitelist.map((item) => {
              const isCurrent = item.email.toLowerCase() === adminEmail.toLowerCase();
              return (
                <div key={item.email} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink truncate">{item.email}</p>
                      {isCurrent && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          You
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted capitalize">
                      Role: {roles.find((r) => r.value === item.role)?.label ?? item.role}
                      {item.created_at && ` · Added ${new Date(item.created_at).toLocaleDateString()}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isCurrent || deletingEmail === item.email}
                      onClick={() => handleRemoveAdmin(item.email)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                        isCurrent
                          ? 'opacity-40 cursor-not-allowed text-muted'
                          : 'text-red-600 hover:bg-red-50',
                      )}
                      title={isCurrent ? 'You cannot remove your own active account' : 'Revoke admin access'}
                    >
                      {deletingEmail === item.email ? <Spinner className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                      <span>Revoke Access</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl bg-paper p-4 text-xs leading-relaxed text-muted flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 text-brand-navy shrink-0 mt-0.5" />
            <p>
              Security note: Added emails are verified against the PostgreSQL database. When an invited executive signs up or logs into the BMSCE IEEE site with their matching email, the backend trigger automatically enables administrative permissions.
            </p>
          </div>
        </div>

        {toast && (
          <div className="fixed inset-x-4 bottom-4 z-[70] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-sm">
            <Alert tone={toast.tone} className="shadow-xl">
              {toast.text}
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}
