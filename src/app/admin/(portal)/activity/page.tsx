'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { useAdmin } from '@/components/admin/AdminContext';
import { downloadCsv, fetchActivity, type Activity } from '@/lib/admin';
import { timeAgo } from '@/lib/adminStats';
import { PageLoader } from '@/components/ui/form';
import { cn, formatDateTime } from '@/lib/utils';

const KINDS = [
  { key: 'all', label: 'Everything' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'settings', label: 'Settings' },
  { key: 'other', label: 'Other' },
] as const;

const kindOf = (a: Activity) => (a.action === 'verified' ? 'verified' : a.action === 'rejected' ? 'rejected' : a.action.includes('settings') || a.action.includes('announcement') ? 'settings' : 'other');
const dot: Record<string, string> = { verified: 'bg-emerald-600', rejected: 'bg-red-700', settings: 'bg-brand-sky', other: 'bg-muted' };

export default function ActivityPage() {
  const { orders } = useAdmin();
  const [items, setItems] = useState<Activity[] | null>(null);
  const [kind, setKind] = useState<(typeof KINDS)[number]['key']>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchActivity(300).then(setItems);
  }, [orders]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items ?? []).filter((a) => (kind === 'all' || kindOf(a) === kind) && (!q || [a.admin_email, a.action, a.target, a.details].some((v) => v?.toLowerCase().includes(q))));
  }, [items, kind, query]);

  if (!items) return <PageLoader />;

  return (
    <div className="pb-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="display text-4xl text-ink sm:text-5xl">Activity log</h1>
          <p className="mt-2 text-sm text-muted">Every verification, rejection and settings change, with who did it and when.</p>
        </div>
        <button
          type="button"
          disabled={!list.length}
          onClick={() => downloadCsv(`bmsce_ieee_activity_${new Date().toISOString().slice(0, 10)}.csv`, ['When', 'Admin', 'Action', 'Target', 'Details'], list.map((a) => [a.created_at, a.admin_email, a.action, a.target, a.details ?? '']))}
          className="btn btn-ghost self-start bg-white"
        >
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div role="tablist" className="inline-flex gap-1 rounded-full bg-white p-1 shadow-sm">
            {KINDS.map((k) => (
              <button key={k.key} type="button" role="tab" aria-selected={kind === k.key} onClick={() => setKind(k.key)} className="tab">{k.label}</button>
            ))}
          </div>
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the log" className="input input-icon rounded-full py-2.5" aria-label="Search the log" />
        </div>
      </div>

      <div className="panel mt-5 p-5 sm:p-6">
        {list.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">{items.length ? 'Nothing matches.' : 'No admin actions yet. They will appear here as the team works through applications.'}</p>
        ) : (
          <ol className="relative space-y-5 border-l-2 border-line pl-6">
            {list.map((a) => (
              <li key={a.id} className="relative">
                <span className={cn('absolute top-1.5 -left-[31px] h-3 w-3 rounded-full ring-4 ring-white', dot[kindOf(a)])} />
                <p className="text-sm text-ink">
                  <span className="font-semibold">{a.admin_email}</span> <span className="text-ink-soft">{a.action}</span> <span className="font-mono text-xs text-brand-navy">{a.target}</span>
                </p>
                {a.details && <p className="mt-0.5 text-sm text-muted">{a.details}</p>}
                <p className="mt-0.5 text-xs text-muted" title={formatDateTime(a.created_at)}>{timeAgo(a.created_at)} · {formatDateTime(a.created_at)}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
