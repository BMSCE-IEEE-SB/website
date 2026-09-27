'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Download, Mail, Search, Send } from 'lucide-react';
import { useAdmin } from '@/components/admin/AdminContext';
import { downloadCsv, markCredentialsSent, saveIeeeId } from '@/lib/admin';
import type { Order } from '@/lib/auth';
import { chapterCode, chapters as chapterInfo } from '@/data/site';
import { cn, formatDate } from '@/lib/utils';

function IeeeIdField({ order }: { order: Order }) {
  const { admin, reload, toast } = useAdmin();
  const [value, setValue] = useState(order.ieee_member_id ?? '');
  const [saving, setSaving] = useState(false);
  const dirty = value.trim() !== (order.ieee_member_id ?? '');

  const save = async () => {
    if (!dirty) return;
    if (value.trim() && !/^\d{6,10}$/.test(value.trim())) {
      toast('error', 'IEEE member IDs are 6–10 digits.');
      return;
    }
    setSaving(true);
    try {
      await saveIeeeId(order, value.trim(), admin);
      toast('success', `IEEE ID saved for ${order.student_name}.`);
      await reload();
    } catch (err) {
      toast('error', `Could not save: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        inputMode="numeric"
        placeholder="Add ID"
        aria-label={`IEEE member ID for ${order.student_name}`}
        className={cn('w-full rounded-lg border px-2.5 py-1.5 font-mono text-xs outline-none transition focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20', dirty ? 'border-amber-300 bg-amber-50' : 'border-transparent bg-paper hover:border-line')}
      />
      {saving && <span className="absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 animate-spin rounded-full border-2 border-brand-sky border-t-transparent" />}
    </div>
  );
}

export default function MembersPage() {
  const { admin, orders, reload, toast } = useAdmin();
  const [chapter, setChapter] = useState('all');
  const [creds, setCreds] = useState<'all' | 'waiting' | 'sent'>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  // One row per verified member (their latest verified application).
  const members = useMemo(() => {
    const byUser = new Map<string, Order>();
    for (const o of orders) {
      if (o.status !== 'verified') continue;
      const prev = byUser.get(o.user_id);
      if (!prev || (o.verified_at ?? '') > (prev.verified_at ?? '')) byUser.set(o.user_id, o);
    }
    return [...byUser.values()].sort((a, b) => (a.student_name ?? '').localeCompare(b.student_name ?? ''));
  }, [orders]);

  const chapterCounts = chapterInfo.map((c) => ({ ...c, count: members.filter((m) => (m.chapters ?? []).some((n) => chapterCode(n) === c.code)).length }));
  const waiting = members.filter((m) => !m.credentials_sent_at).length;

  const list = members.filter((m) => {
    if (chapter !== 'all' && !(m.chapters ?? []).some((n) => chapterCode(n) === chapter)) return false;
    if (creds === 'waiting' && m.credentials_sent_at) return false;
    if (creds === 'sent' && !m.credentials_sent_at) return false;
    const q = query.trim().toLowerCase();
    return !q || [m.student_name, m.usn, m.email, m.ieee_member_id].some((v) => v?.toLowerCase().includes(q));
  });

  const selectedList = list.filter((m) => selected.has(m.id));
  const allSelected = list.length > 0 && list.every((m) => selected.has(m.id));

  const mark = async (targets: Order[], sent: boolean) => {
    if (!targets.length) return;
    setBusy(true);
    try {
      await markCredentialsSent(targets, sent, admin);
      toast('success', sent ? `Marked credentials sent for ${targets.length} member${targets.length > 1 ? 's' : ''}.` : 'Marked as waiting again.');
      setSelected(new Set());
      await reload();
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const exportRoster = (rows: Order[]) =>
    downloadCsv(
      `bmsce_ieee_roster_${chapter === 'all' ? 'all' : chapter.replace('/', '-')}_${new Date().toISOString().slice(0, 10)}.csv`,
      ['Full name', 'Email', 'USN', 'Department', 'Year', 'Phone', 'Chapters', 'IEEE member ID', 'Verified on', 'Credentials sent'],
      rows.map((m) => [m.student_name, m.email, m.usn, m.department, m.year_of_study, m.phone, (m.chapters ?? []).map(chapterCode).join('; '), m.ieee_member_id ?? '', m.verified_at?.slice(0, 10) ?? '', m.credentials_sent_at ? 'Yes' : 'No']),
    );

  const bccAll = list.map((m) => m.email).filter(Boolean).join(',');

  return (
    <div className="pb-24">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="display text-4xl text-ink sm:text-5xl">Members</h1>
          <p className="mt-2 text-sm text-muted">
            {members.length} verified · <span className={waiting ? 'font-medium text-amber-700' : ''}>{waiting} waiting for IEEE credentials</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {bccAll && (
            <a href={`mailto:?bcc=${encodeURIComponent(bccAll)}&subject=${encodeURIComponent('BMSCE IEEE update')}`} className="btn btn-ghost bg-white">
              <Mail className="h-4 w-4" /> Email {list.length}
            </a>
          )}
          <button type="button" onClick={() => exportRoster(list)} disabled={!list.length} className="btn btn-dark">
            <Download className="h-4 w-4" /> Export roster ({list.length})
          </button>
        </div>
      </div>

      {/* Chapter filter chips double as a breakdown */}
      <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <button type="button" onClick={() => setChapter('all')} aria-pressed={chapter === 'all'} className={cn('shrink-0 rounded-2xl px-4 py-2.5 text-left transition-all', chapter === 'all' ? 'bg-ink text-white' : 'bg-white text-ink hover:-translate-y-0.5')}>
          <span className="block text-xs opacity-70">All</span>
          <span className="font-display text-lg font-bold">{members.length}</span>
        </button>
        {chapterCounts.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => setChapter(chapter === c.code ? 'all' : c.code)}
            aria-pressed={chapter === c.code}
            className={cn('shrink-0 rounded-2xl px-4 py-2.5 text-left transition-all', chapter === c.code ? 'text-white shadow-md' : 'bg-white text-ink hover:-translate-y-0.5')}
            style={chapter === c.code ? { background: c.color } : undefined}
          >
            <span className="flex items-center gap-1.5 text-xs opacity-80">
              {chapter !== c.code && <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />}
              {c.code}
            </span>
            <span className="font-display text-lg font-bold">{c.count}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" className="inline-flex gap-1 self-start rounded-full bg-white p-1 shadow-sm">
          {([['all', 'All'], ['waiting', 'Credentials pending'], ['sent', 'Credentials sent']] as const).map(([v, l]) => (
            <button key={v} type="button" role="tab" aria-selected={creds === v} onClick={() => setCreds(v)} className="tab">{l}</button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, USN, email, IEEE ID" className="input input-icon rounded-full py-2.5" aria-label="Search members" />
        </div>
      </div>

      {/* Phones: cards */}
      <ul className="mt-5 space-y-3 md:hidden">
        {list.length === 0 && <li className="panel p-8 text-center text-sm text-muted">No members match these filters.</li>}
        {list.map((m) => (
          <li key={m.id} className={cn('panel p-4', selected.has(m.id) && 'ring-2 ring-brand-sky')}>
            <div className="flex items-start gap-3">
              <input type="checkbox" checked={selected.has(m.id)} onChange={() => setSelected((p) => { const n = new Set(p); if (n.has(m.id)) n.delete(m.id); else n.add(m.id); return n; })} aria-label={`Select ${m.student_name}`} className="mt-1 h-4 w-4 accent-brand-navy" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{m.student_name}</p>
                <p className="text-xs text-muted"><span className="font-mono text-brand-navy">{m.usn}</span> · {m.department} · Year {m.year_of_study}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(m.chapters ?? []).length ? (m.chapters ?? []).map((n) => {
                    const code = chapterCode(n);
                    return <span key={n} className="rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: chapterInfo.find((c) => c.code === code)?.color }}>{code}</span>;
                  }) : <span className="text-xs text-muted">Base only</span>}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1"><IeeeIdField key={m.ieee_member_id ?? ''} order={m} /></div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => mark([m], !m.credentials_sent_at)}
                    className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold', m.credentials_sent_at ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800')}
                  >
                    {m.credentials_sent_at ? <><Check className="h-3.5 w-3.5" /> Sent</> : 'Pending'}
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Tablet and up: table */}
      <div className="panel mt-5 hidden overflow-x-auto md:block">
        {list.length === 0 ? (
          <p className="p-12 text-center text-sm text-muted">No members match these filters.</p>
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th className="w-10 px-5 py-3">
                  <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(list.map((m) => m.id)))} aria-label="Select all" className="h-4 w-4 accent-brand-navy" />
                </th>
                <th className="py-3 font-medium">Member</th>
                <th className="py-3 font-medium">Chapters</th>
                <th className="py-3 font-medium">Verified</th>
                <th className="w-40 py-3 font-medium">IEEE member ID</th>
                <th className="px-5 py-3 text-right font-medium">Credentials</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((m) => (
                <tr key={m.id} className={cn('transition-colors hover:bg-paper/60', selected.has(m.id) && 'bg-sky-50')}>
                  <td className="px-5 py-3">
                    <input type="checkbox" checked={selected.has(m.id)} onChange={() => setSelected((p) => { const n = new Set(p); if (n.has(m.id)) n.delete(m.id); else n.add(m.id); return n; })} aria-label={`Select ${m.student_name}`} className="h-4 w-4 accent-brand-navy" />
                  </td>
                  <td className="py-3">
                    <p className="font-semibold text-ink">{m.student_name}</p>
                    <p className="text-xs text-muted"><span className="font-mono text-brand-navy">{m.usn}</span> · {m.department} · Year {m.year_of_study}</p>
                  </td>
                  <td className="py-3">
                    <span className="flex flex-wrap gap-1">
                      {(m.chapters ?? []).length ? (m.chapters ?? []).map((n) => {
                        const code = chapterCode(n);
                        return <span key={n} className="rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: chapterInfo.find((c) => c.code === code)?.color }}>{code}</span>;
                      }) : <span className="text-xs text-muted">Base only</span>}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-muted">{m.verified_at ? formatDate(m.verified_at) : '—'}</td>
                  <td className="py-3 pr-4"><IeeeIdField key={m.ieee_member_id ?? ''} order={m} /></td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => mark([m], !m.credentials_sent_at)}
                      className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors', m.credentials_sent_at ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100' : 'bg-amber-50 text-amber-800 hover:bg-amber-100')}
                      title={m.credentials_sent_at ? `Sent ${formatDate(m.credentials_sent_at)}. Click to undo.` : 'Mark as sent'}
                    >
                      {m.credentials_sent_at ? <><Check className="h-3.5 w-3.5" /> Sent</> : 'Pending'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {selectedList.length > 0 && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-xl flex-wrap items-center gap-2 rounded-2xl bg-ink p-3 pl-5 text-white shadow-2xl">
            <span className="mr-auto text-sm font-semibold">{selectedList.length} selected</span>
            <button type="button" disabled={busy} onClick={() => mark(selectedList.filter((m) => !m.credentials_sent_at), true)} className="btn bg-emerald-500 px-3 py-2 text-white hover:bg-emerald-600"><Send className="h-4 w-4" /> Credentials sent</button>
            <button type="button" onClick={() => exportRoster(selectedList)} className="btn bg-white/10 px-3 py-2 hover:bg-white/20"><Download className="h-4 w-4" /> Export</button>
            <button type="button" onClick={() => setSelected(new Set())} className="btn px-3 py-2 text-white/70 hover:text-white">Clear</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
