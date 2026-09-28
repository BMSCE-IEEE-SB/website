'use client';
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle, Check, ChevronLeft, ChevronRight, Copy, Download, Keyboard, Mail, Search, StickyNote, X, ZoomIn,
} from 'lucide-react';
import { useAdmin } from '@/components/admin/AdminContext';
import { downloadCsv, rejectOrders, saveNote, sendReceipt, verifyOrders, type Flag } from '@/lib/admin';
import { resolveScreenshotUrl } from '@/lib/orders';
import type { Order } from '@/lib/auth';
import { chapterCode, chapters as chapterInfo, departments } from '@/data/site';
import { Modal, Spinner, StatusBadge } from '@/components/ui/form';
import { timeAgo } from '@/lib/adminStats';
import { cn, formatDateTime } from '@/lib/utils';

type Status = 'all' | 'pending' | 'verified' | 'rejected';
type Sort = 'newest' | 'oldest' | 'amount';
const PAGE = 25;
const REASONS = [
  'The screenshot is unclear or cropped. Please upload the full payment confirmation.',
  'We could not find this UTR in our bank statement. Please check the number.',
  'The amount paid does not match your total. Please pay the difference and resubmit.',
  'This payment proof has already been used for another application.',
];

const colorOf = (code: string) => chapterInfo.find((c) => c.code === code)?.color ?? '#6b778c';

function ChapterChips({ names }: { names?: string[] }) {
  if (!names?.length) return <span className="text-xs text-muted">Base only</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {names.map((n) => {
        const code = chapterCode(n);
        return (
          <span key={n} className="rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: colorOf(code) }}>
            {code}
          </span>
        );
      })}
    </span>
  );
}

function FlagList({ flags }: { flags?: Flag[] }) {
  if (!flags?.length) return null;
  return (
    <ul className="space-y-2">
      {flags.map((f, i) => (
        <li key={i} className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong className="font-semibold">{f.kind === 'duplicate-utr' ? 'Duplicate UTR. ' : f.kind === 'amount' ? 'Amount check. ' : 'Repeat student. '}</strong>
            {f.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function ApplicationsPage() {
  const { admin, orders, flags, reload, toast } = useAdmin();
  const [status, setStatus] = useState<Status>('pending');
  const [query, setQuery] = useState('');
  const [chapter, setChapter] = useState('all');
  const [dept, setDept] = useState('all');
  const [range, setRange] = useState<'all' | '7' | '30'>('all');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [sort, setSort] = useState<Sort>('newest');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState<Order[] | null>(null);
  const [reason, setReason] = useState(REASONS[0]);
  const [confirmVerify, setConfirmVerify] = useState<Order[] | null>(null);
  const [showKeys, setShowKeys] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [nowTs, setNowTs] = useState(0);

  // Deep link from the overview: /admin/orders?open=<id>
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('open');
    const t = setTimeout(() => {
      setNowTs(Date.now());
      if (id) {
        setOpenId(id);
        setStatus('all');
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const counts = useMemo(
    () => ({
      all: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      verified: orders.filter((o) => o.status === 'verified').length,
      rejected: orders.filter((o) => o.status === 'rejected').length,
    }),
    [orders],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const since = range === 'all' || !nowTs ? 0 : nowTs - Number(range) * 86400000;
    const list = orders.filter((o) => {
      if (status !== 'all' && o.status !== status) return false;
      if (flaggedOnly && !flags.has(o.id)) return false;
      if (chapter !== 'all' && !(o.chapters ?? []).some((n) => chapterCode(n) === chapter)) return false;
      if (dept !== 'all' && o.department !== dept) return false;
      if (since && new Date(o.created_at).getTime() < since) return false;
      if (!q) return true;
      return [o.order_reference, o.student_name, o.usn, o.email, o.utr_reference, o.phone].some((v) => v?.toLowerCase().includes(q));
    });
    return list.sort((a, b) =>
      sort === 'amount' ? Number(b.total_amount) - Number(a.total_amount) : sort === 'oldest' ? a.created_at.localeCompare(b.created_at) : b.created_at.localeCompare(a.created_at),
    );
  }, [orders, status, query, chapter, dept, range, flaggedOnly, sort, flags, nowTs]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const safePage = Math.min(page, pages - 1);
  const visible = filtered.slice(safePage * PAGE, safePage * PAGE + PAGE);
  const open = openId ? orders.find((o) => o.id === openId) ?? null : null;
  const selectedOrders = orders.filter((o) => selected.has(o.id));
  const deptOptions = useMemo(() => [...new Set(orders.map((o) => o.department).filter(Boolean))] as string[], [orders]);

  const resetPage = () => {
    setPage(0);
    setCursor(0);
  };

  // --- actions --------------------------------------------------------------
  const doVerify = useCallback(
    async (list: Order[]) => {
      if (!list.length) return;
      setBusy(true);
      try {
        await verifyOrders(list, admin);
        let sent = 0;
        for (const o of list) if (await sendReceipt(o)) sent++;
        toast('success', `${list.length === 1 ? list[0].order_reference : `${list.length} applications`} verified.${sent ? ` ${sent} receipt email${sent > 1 ? 's' : ''} sent.` : ' Receipt email not sent (SMTP not configured).'}`);
        setSelected(new Set());
        setConfirmVerify(null);
        await reload();
      } catch (err) {
        toast('error', `Verification failed: ${(err as Error).message}`);
      } finally {
        setBusy(false);
      }
    },
    [admin, reload, toast],
  );

  const requestVerify = useCallback(
    (list: Order[]) => {
      const eligible = list.filter((o) => o.status !== 'verified');
      if (!eligible.length) return;
      if (eligible.some((o) => flags.has(o.id))) setConfirmVerify(eligible);
      else doVerify(eligible);
    },
    [flags, doVerify],
  );

  const doReject = async () => {
    if (!rejecting?.length || !reason.trim()) return;
    setBusy(true);
    try {
      await rejectOrders(rejecting, reason.trim(), admin);
      toast('success', `${rejecting.length === 1 ? rejecting[0].order_reference : `${rejecting.length} applications`} rejected. Students can resubmit from their portal.`);
      setRejecting(null);
      setSelected(new Set());
      await reload();
    } catch (err) {
      toast('error', `Could not reject: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = (list: Order[]) =>
    downloadCsv(
      `bmsce_ieee_applications_${new Date().toISOString().slice(0, 10)}.csv`,
      ['Order ref', 'Name', 'USN', 'Email', 'Phone', 'Department', 'Year', 'Chapters', 'Amount', 'Status', 'UTR', 'Submitted', 'Verified', 'Flags', 'Note'],
      list.map((o) => [
        o.order_reference, o.student_name, o.usn, o.email, o.phone, o.department, o.year_of_study, (o.chapters ?? []).map(chapterCode).join('; '),
        o.total_amount, o.status, o.utr_reference, o.created_at, o.verified_at ?? '', (flags.get(o.id) ?? []).map((f) => f.kind).join('; '), o.admin_note ?? '',
      ]),
    );

  const toggleSel = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const allVisibleSelected = visible.length > 0 && visible.every((o) => selected.has(o.id));

  // --- keyboard shortcuts -----------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select, [role="dialog"]') || e.metaKey || e.ctrlKey || e.altKey) return;
      // While a panel or dialog is open, only Escape does anything.
      if (openId || rejecting || confirmVerify || showKeys) {
        if (e.key === 'Escape') setOpenId(null);
        return;
      }
      const current = visible[Math.min(cursor, visible.length - 1)];
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setCursor((c) => Math.min(visible.length - 1, c + 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
      } else if ((e.key === 'Enter' || e.key === 'o') && current) {
        setOpenId(current.id);
      } else if (e.key === 'x' && current) {
        toggleSel(current.id);
      } else if (e.key === 'v' && current) {
        requestVerify([current]);
      } else if (e.key === 'r' && current && current.status === 'pending') {
        setRejecting([current]);
      } else if (e.key === 'Escape') {
        setOpenId(null);
      } else if (e.key === '?') {
        setShowKeys((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, cursor, requestVerify, openId, rejecting, confirmVerify, showKeys]);

  return (
    <div className="pb-24">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="display text-4xl text-ink sm:text-5xl">Applications</h1>
          <p className="mt-2 text-sm text-muted">
            {counts.pending} waiting · {counts.verified} verified · {counts.rejected} rejected
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowKeys(true)} className="btn btn-ghost bg-white" title="Keyboard shortcuts (?)">
            <Keyboard className="h-4 w-4" /> <span className="hidden sm:inline">Shortcuts</span>
          </button>
          <button type="button" onClick={() => exportCsv(filtered)} disabled={!filtered.length} className="btn btn-ghost bg-white">
            <Download className="h-4 w-4" /> Export {filtered.length}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 space-y-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div role="tablist" className="inline-flex gap-1 rounded-full bg-white p-1 shadow-sm">
              {(['pending', 'verified', 'rejected', 'all'] as const).map((f) => (
                <button key={f} type="button" role="tab" aria-selected={status === f} onClick={() => { setStatus(f); resetPage(); }} className="tab capitalize">
                  {f} <span className="ml-1 opacity-60">{counts[f]}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="relative xl:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
            <input ref={searchRef} type="search" value={query} onChange={(e) => { setQuery(e.target.value); resetPage(); }} placeholder="Search name, USN, ref, UTR, phone   /" className="input input-icon rounded-full py-2.5" aria-label="Search applications" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={chapter} onChange={(e) => { setChapter(e.target.value); resetPage(); }} className="input w-auto rounded-full py-2 text-sm" aria-label="Filter by chapter">
            <option value="all">All chapters</option>
            {chapterInfo.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
          </select>
          <select value={dept} onChange={(e) => { setDept(e.target.value); resetPage(); }} className="input w-auto rounded-full py-2 text-sm" aria-label="Filter by department">
            <option value="all">All departments</option>
            {deptOptions.map((d) => <option key={d} value={d}>{departments.find(([c]) => c === d)?.[1] ?? d}</option>)}
          </select>
          <select value={range} onChange={(e) => { setRange(e.target.value as typeof range); resetPage(); }} className="input w-auto rounded-full py-2 text-sm" aria-label="Date range">
            <option value="all">Any time</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="input w-auto rounded-full py-2 text-sm" aria-label="Sort">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="amount">Highest amount</option>
          </select>
          <button
            type="button"
            aria-pressed={flaggedOnly}
            onClick={() => { setFlaggedOnly((v) => !v); resetPage(); }}
            className={cn('flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors', flaggedOnly ? 'bg-red-600 text-white' : 'bg-white text-ink-soft hover:text-ink')}
          >
            <AlertTriangle className="h-4 w-4" /> Needs a closer look ({orders.filter((o) => flags.has(o.id)).length})
          </button>
        </div>
      </div>

      {/* List */}
      <div className="panel mt-5 overflow-hidden">
        {visible.length === 0 ? (
          <p className="p-12 text-center text-sm text-muted">No applications match these filters.</p>
        ) : (
          <>
            <div className="hidden grid-cols-[2rem_1.5fr_1fr_1fr_0.7fr_auto] items-center gap-4 border-b border-line px-5 py-3 text-xs font-medium text-muted lg:grid">
              <input type="checkbox" checked={allVisibleSelected} onChange={() => setSelected((prev) => { const n = new Set(prev); visible.forEach((o) => (allVisibleSelected ? n.delete(o.id) : n.add(o.id))); return n; })} aria-label="Select all on this page" className="h-4 w-4 accent-brand-navy" />
              <span>Student</span>
              <span>Order</span>
              <span>Chapters</span>
              <span>Amount</span>
              <span className="w-48 text-right">Actions</span>
            </div>
            <ul className="divide-y divide-line">
              {visible.map((o, i) => {
                const f = flags.get(o.id);
                return (
                  <li
                    key={o.id}
                    onClick={() => { setCursor(i); setOpenId(o.id); }}
                    className={cn(
                      'grid cursor-pointer grid-cols-[2rem_1fr] items-center gap-x-4 gap-y-3 px-5 py-4 transition-colors lg:grid-cols-[2rem_1.5fr_1fr_1fr_0.7fr_auto]',
                      i === cursor ? 'bg-sky-50/60' : 'hover:bg-paper/70',
                      selected.has(o.id) && 'bg-sky-50',
                    )}
                  >
                    <input type="checkbox" checked={selected.has(o.id)} onClick={(e) => e.stopPropagation()} onChange={() => toggleSel(o.id)} aria-label={`Select ${o.order_reference}`} className="h-4 w-4 accent-brand-navy" />
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-semibold text-ink">
                        <span className="truncate">{o.student_name || 'Unnamed student'}</span>
                        {f && <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" aria-label="Needs a closer look" />}
                        {o.admin_note && <StickyNote className="h-3.5 w-3.5 shrink-0 text-muted" aria-label="Has a note" />}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        <span className="font-mono font-semibold text-brand-navy">{o.usn}</span> · {o.department} · Year {o.year_of_study}
                      </p>
                    </div>
                    <div className="col-start-2 text-sm lg:col-start-auto">
                      <p className="font-mono text-xs font-semibold text-ink">{o.order_reference}{o.receipt_number ? ` · ${o.receipt_number}` : ''}</p>
                      <p className="text-xs text-muted">{timeAgo(o.created_at)} · UTR {o.utr_reference ?? '—'}{o.tshirt_size ? ` · Size ${o.tshirt_size}` : ''}</p>
                    </div>
                    <div className="col-start-2 lg:col-start-auto"><ChapterChips names={o.chapters} /></div>
                    <div className="col-start-2 flex items-center gap-3 lg:col-start-auto lg:block">
                      <p className="font-display font-bold text-ink">₹{o.total_amount}</p>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="col-start-2 flex gap-2 lg:col-start-auto lg:w-48 lg:justify-end" onClick={(e) => e.stopPropagation()}>
                      {o.status !== 'verified' && (
                        <button type="button" disabled={busy} onClick={() => requestVerify([o])} className="btn bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700">
                          <Check className="h-4 w-4" /> Verify
                        </button>
                      )}
                      {o.status === 'pending' && (
                        <button type="button" disabled={busy} onClick={() => setRejecting([o])} className="btn px-3 py-1.5 text-red-600 ring-1 ring-red-200 ring-inset hover:bg-red-50">
                          <X className="h-4 w-4" /> Reject
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>
            {safePage * PAGE + 1}–{Math.min(filtered.length, (safePage + 1) * PAGE)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <button type="button" disabled={safePage === 0} onClick={() => { setPage(safePage - 1); setCursor(0); }} className="btn btn-ghost bg-white px-3" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
            <button type="button" disabled={safePage >= pages - 1} onClick={() => { setPage(safePage + 1); setCursor(0); }} className="btn btn-ghost bg-white px-3" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-2xl flex-wrap items-center gap-2 rounded-2xl bg-ink p-3 pl-5 text-white shadow-2xl">
            <span className="mr-auto text-sm font-semibold">{selected.size} selected</span>
            <button type="button" disabled={busy} onClick={() => requestVerify(selectedOrders)} className="btn bg-emerald-500 px-3 py-2 text-white hover:bg-emerald-600"><Check className="h-4 w-4" /> Verify</button>
            <button type="button" disabled={busy} onClick={() => setRejecting(selectedOrders.filter((o) => o.status === 'pending'))} className="btn bg-white/10 px-3 py-2 hover:bg-white/20"><X className="h-4 w-4" /> Reject</button>
            <button type="button" onClick={() => exportCsv(selectedOrders)} className="btn bg-white/10 px-3 py-2 hover:bg-white/20"><Download className="h-4 w-4" /> Export</button>
            <button type="button" onClick={() => setSelected(new Set())} className="btn px-3 py-2 text-white/70 hover:text-white">Clear</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail drawer */}
      <AnimatePresence>
        {open && (
          <Drawer
            key={open.id}
            order={open}
            flags={flags.get(open.id)}
            busy={busy}
            onClose={() => setOpenId(null)}
            onVerify={() => requestVerify([open])}
            onReject={() => setRejecting([open])}
            onPrev={() => { const idx = filtered.findIndex((o) => o.id === open.id); if (idx > 0) setOpenId(filtered[idx - 1].id); }}
            onNext={() => { const idx = filtered.findIndex((o) => o.id === open.id); if (idx >= 0 && idx < filtered.length - 1) setOpenId(filtered[idx + 1].id); }}
          />
        )}
      </AnimatePresence>

      {rejecting && rejecting.length > 0 && (
        <Modal title={rejecting.length === 1 ? `Reject ${rejecting[0].order_reference}` : `Reject ${rejecting.length} applications`} onClose={() => setRejecting(null)}>
          <p className="-mt-2 mb-4 text-sm text-muted">The student sees this reason in their portal and can resubmit without paying again.</p>
          <div className="mb-3 flex flex-col gap-2">
            {REASONS.map((r) => (
              <button key={r} type="button" onClick={() => setReason(r)} className={cn('rounded-xl px-3 py-2 text-left text-sm transition-colors', reason === r ? 'bg-ink text-white' : 'bg-paper text-ink-soft hover:bg-paper-2')}>
                {r}
              </button>
            ))}
          </div>
          <label htmlFor="reason" className="field-label">Reason shown to the student</label>
          <textarea id="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="input resize-none" />
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setRejecting(null)} className="btn btn-ghost">Cancel</button>
            <button type="button" disabled={busy || !reason.trim()} onClick={doReject} className="btn bg-red-600 text-white hover:bg-red-700">{busy && <Spinner />} Reject</button>
          </div>
        </Modal>
      )}

      {confirmVerify && (
        <Modal title="Verify with warnings?" onClose={() => setConfirmVerify(null)}>
          <p className="-mt-2 mb-4 text-sm text-ink-soft">
            {confirmVerify.filter((o) => flags.has(o.id)).length} of {confirmVerify.length} selected application{confirmVerify.length > 1 ? 's' : ''} need a closer look:
          </p>
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {confirmVerify.filter((o) => flags.has(o.id)).map((o) => (
              <div key={o.id}>
                <p className="mb-1 text-sm font-semibold text-ink">{o.student_name} · <span className="font-mono text-xs">{o.order_reference}</span></p>
                <FlagList flags={flags.get(o.id)} />
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setConfirmVerify(null)} className="btn btn-ghost">Go back</button>
            <button type="button" disabled={busy} onClick={() => doVerify(confirmVerify)} className="btn bg-emerald-600 text-white hover:bg-emerald-700">{busy && <Spinner />} Verify anyway</button>
          </div>
        </Modal>
      )}

      {showKeys && (
        <Modal title="Keyboard shortcuts" onClose={() => setShowKeys(false)}>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
            {[
              ['j / k', 'Move down / up the list'],
              ['Enter', 'Open the highlighted application'],
              ['v', 'Verify it'],
              ['r', 'Reject it'],
              ['x', 'Select it'],
              ['/', 'Search'],
              ['Esc', 'Close the panel'],
              ['?', 'Show this list'],
            ].map(([k, d]) => (
              <div key={k} className="contents">
                <dt><kbd className="rounded-md bg-paper px-2 py-1 font-mono text-xs text-ink ring-1 ring-line">{k}</kbd></dt>
                <dd className="text-ink-soft">{d}</dd>
              </div>
            ))}
          </dl>
        </Modal>
      )}
    </div>
  );
}

function Drawer({
  order,
  flags,
  busy,
  onClose,
  onVerify,
  onReject,
  onPrev,
  onNext,
}: {
  order: Order;
  flags?: Flag[];
  busy: boolean;
  onClose: () => void;
  onVerify: () => void;
  onReject: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const { admin, reload, toast } = useAdmin();
  const [proof, setProof] = useState<string | null | undefined>(undefined);
  const [zoom, setZoom] = useState(false);
  const [note, setNote] = useState(order.admin_note ?? '');
  const [savingNote, setSavingNote] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sendingReceipt, setSendingReceipt] = useState(false);

  useEffect(() => {
    let alive = true;
    resolveScreenshotUrl(order.payment_screenshot_url).then((u) => alive && setProof(u));
    return () => {
      alive = false;
    };
  }, [order.payment_screenshot_url]);

  const handleSendReceipt = async () => {
    setSendingReceipt(true);
    try {
      const ok = await sendReceipt(order);
      if (ok) {
        toast('success', `Official PDF receipt dispatched for ${order.order_reference}.`);
        await reload();
      } else {
        toast('error', 'Could not send receipt. Verify SMTP credentials in environment.');
      }
    } catch (err) {
      toast('error', `Could not send receipt: ${(err as Error).message}`);
    } finally {
      setSendingReceipt(false);
    }
  };

  const storeNote = async () => {
    setSavingNote(true);
    try {
      await saveNote(order, note.trim(), admin);
      toast('success', 'Note saved. Only admins can see it.');
      await reload();
    } catch (err) {
      toast('error', `Could not save the note: ${(err as Error).message}`);
    } finally {
      setSavingNote(false);
    }
  };

  const timeline = [
    { label: 'Submitted', at: order.created_at, done: true },
    order.status === 'verified' && { label: 'Verified', at: order.verified_at, done: true },
    order.status === 'rejected' && { label: 'Rejected', at: undefined, done: true, bad: true },
    order.credentials_sent_at && { label: 'IEEE credentials sent', at: order.credentials_sent_at, done: true },
    order.receipt_sent_at && { label: 'Official PDF receipt emailed', at: order.receipt_sent_at, done: true },
  ].filter(Boolean) as { label: string; at?: string; done: boolean; bad?: boolean }[];

  return (
    <>
      <motion.div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label={`Application ${order.order_reference}`}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-white shadow-2xl"
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="font-mono text-xs font-semibold text-brand-navy">{order.order_reference}</p>
            <h2 className="truncate text-lg font-bold text-ink">{order.student_name || 'Unnamed student'}</h2>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={onPrev} className="rounded-full p-2 text-muted hover:bg-paper hover:text-ink" aria-label="Previous application"><ChevronLeft className="h-5 w-5" /></button>
            <button type="button" onClick={onNext} className="rounded-full p-2 text-muted hover:bg-paper hover:text-ink" aria-label="Next application"><ChevronRight className="h-5 w-5" /></button>
            <button type="button" onClick={onClose} className="rounded-full p-2 text-muted hover:bg-paper hover:text-ink" aria-label="Close"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={order.status} />
            <span className="font-display text-2xl font-bold text-ink">₹{order.total_amount}</span>
            <ChapterChips names={order.chapters} />
          </div>

          <FlagList flags={flags} />
          {order.status === 'rejected' && order.rejection_reason && <p className="rounded-xl bg-paper px-3 py-2 text-sm text-ink-soft">Reason given: {order.rejection_reason}</p>}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">Payment proof</p>
              {order.payment_method === 'CASH' && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Cash</span>
              )}
            </div>

            {order.payment_method === 'CASH' ? (
              <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-8 text-center">
                <p className="text-sm font-medium text-emerald-800">Cash Payment</p>
                <p className="mt-1 text-xs text-emerald-600">Please verify that you have collected the cash from the student at the registration desk before verifying this application.</p>
              </div>
            ) : (
              <button type="button" onClick={() => proof && setZoom((z) => !z)} className={cn('relative block w-full overflow-hidden rounded-2xl bg-paper', zoom ? 'cursor-zoom-out' : 'cursor-zoom-in')}>
                {proof === undefined ? (
                  <div className="flex h-56 items-center justify-center"><Spinner className="h-6 w-6 text-muted" /></div>
                ) : proof ? (
                  <>
                    <img src={proof} alt="Payment screenshot" className={cn('w-full object-contain transition-all', zoom ? 'max-h-none' : 'max-h-72')} />
                    {!zoom && <span className="absolute right-3 bottom-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-ink"><ZoomIn className="h-3.5 w-3.5" /> Zoom</span>}
                  </>
                ) : (
                  <p className="p-8 text-center text-sm text-muted">No screenshot could be loaded.</p>
                )}
              </button>
            )}

            <div className="mt-3 flex items-center justify-between rounded-xl bg-paper px-4 py-3">
              <div>
                <p className="text-xs text-muted">{order.payment_method === 'CASH' ? 'Method' : 'UTR / reference'}</p>
                <p className="font-mono text-sm font-semibold text-ink">{order.payment_method === 'CASH' ? 'CASH' : (order.utr_reference ?? '—')}</p>
              </div>
              {order.utr_reference && (
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(order.utr_reference!).catch(() => {});
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-sm"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['USN', order.usn],
              ['Department', departments.find(([c]) => c === order.department)?.[1] ?? order.department],
              ['Year', order.year_of_study],
              ['Phone', order.phone],
              ['IEEE member ID', order.ieee_member_id],
              ['T-Shirt size', order.tshirt_size ? `Size ${order.tshirt_size}` : undefined],
              ['Receipt #', order.receipt_number],
              ['Base fee', order.base_fee ? `₹${order.base_fee}` : undefined],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted">{k}</dt>
                  <dd className="mt-0.5 font-medium text-ink">{v}</dd>
                </div>
              ))}
            <div className="col-span-2">
              <dt className="text-xs text-muted">Email</dt>
              <dd className="mt-0.5 flex items-center justify-between gap-3 font-medium text-ink">
                <span className="truncate">{order.email}</span>
                {order.email && (
                  <a href={`mailto:${order.email}?subject=${encodeURIComponent(`Your BMSCE IEEE application ${order.order_reference}`)}`} className="flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-navy hover:text-brand-orange">
                    <Mail className="h-3.5 w-3.5" /> Email student
                  </a>
                )}
              </dd>
            </div>
          </dl>

          <div>
            <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">Timeline</p>
            <ol className="space-y-3 border-l-2 border-line pl-4">
              {timeline.map((t) => (
                <li key={t.label} className="relative text-sm">
                  <span className={cn('absolute top-1.5 -left-[21px] h-2.5 w-2.5 rounded-full ring-4 ring-white', t.bad ? 'bg-red-600' : 'bg-brand-navy')} />
                  <span className="font-medium text-ink">{t.label}</span>
                  {t.at && <span className="ml-2 text-muted">{formatDateTime(t.at)}</span>}
                </li>
              ))}
              {order.status === 'pending' && (
                <li className="relative text-sm text-muted">
                  <span className="absolute top-1.5 -left-[21px] h-2.5 w-2.5 animate-pulse rounded-full bg-amber-500 ring-4 ring-white" />
                  Waiting for review
                </li>
              )}
            </ol>
          </div>

          <div>
            <label htmlFor="admin-note" className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
              <StickyNote className="h-3.5 w-3.5" /> Private note
            </label>
            <textarea id="admin-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Called the student, bank shows the payment on 12 Oct." className="input resize-none text-sm" />
            <button type="button" onClick={storeNote} disabled={savingNote || note === (order.admin_note ?? '')} className="btn btn-ghost mt-2 px-3 py-1.5 text-xs">
              {savingNote && <Spinner />} Save note
            </button>
          </div>
        </div>

        {order.status !== 'verified' ? (
          <div className="flex gap-3 border-t border-line p-4">
            {order.status === 'pending' && (
              <button type="button" disabled={busy} onClick={onReject} className="btn flex-1 text-red-600 ring-1 ring-red-200 ring-inset hover:bg-red-50">
                <X className="h-4 w-4" /> Reject
              </button>
            )}
            <button type="button" disabled={busy} onClick={onVerify} className="btn flex-1 bg-emerald-600 text-white hover:bg-emerald-700">
              {busy ? <Spinner /> : <Check className="h-4 w-4" />} Verify payment
            </button>
          </div>
        ) : (
          <div className="flex gap-3 border-t border-line p-4">
            <button
              type="button"
              disabled={sendingReceipt}
              onClick={handleSendReceipt}
              className="btn flex-1 bg-brand-navy text-white hover:bg-brand-navy/90"
            >
              {sendingReceipt ? <Spinner /> : <Mail className="h-4 w-4" />}
              {order.receipt_sent ? 'Resend official PDF receipt' : 'Send official PDF receipt'}
            </button>
          </div>
        )}
      </motion.aside>
    </>
  );
}
