'use client';
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Download, Eye, Mail, MailCheck, Search, X } from 'lucide-react';
import { isDemoMode, supabase } from '@/lib/supabase';
import { getAdminUser, getLocalOrders, updateLocalOrderReceipt, updateLocalOrderStatus, type Order } from '@/lib/auth';
import { resolveScreenshotUrl } from '@/lib/orders';
import { adminFetch } from '@/lib/admin-api';
import { Alert, Modal, PageLoader, Spinner, StatusBadge } from '@/components/ui/form';
import AdminNav from '@/components/admin/AdminNav';
import { cn, errorMessage, formatDateTime } from '@/lib/utils';

type Filter = 'all' | 'pending' | 'verified' | 'rejected';
type Row = Order & {
  profiles?: { full_name?: string; usn?: string; email?: string; department?: string; year_of_study?: string; phone?: string } | null;
  order_items?: { chapters: { name: string } | null }[];
};

const csvCell = (v: unknown) => {
  let s = String(v ?? '');
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const demo = isDemoMode();
  const [adminEmail, setAdminEmail] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState<Filter>('pending');
  const [query, setQuery] = useState('');

  const [preview, setPreview] = useState<{ url: string | null; ref: string } | null>(null);
  const [rejecting, setRejecting] = useState<Order | null>(null);
  const [reason, setReason] = useState('The payment screenshot is unclear or the UTR does not match our bank statement.');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sendingReceiptId, setSendingReceiptId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (tone: 'success' | 'error' | 'info', text: string) => {
    setToast({ tone, text });
    setTimeout(() => setToast(null), 5000);
  };

  const load = useCallback(async () => {
    const admin = await getAdminUser().catch(() => null);
    if (!admin) {
      router.replace('/admin/login');
      return;
    }
    setAdminEmail(admin.email);

    if (demo) {
      setOrders(getLocalOrders());
    } else {
      const { data, error } = await supabase
        .from('orders')
        .select('*, profiles:user_id (full_name, usn, email, department, year_of_study, phone), order_items(chapters(name))')
        .order('created_at', { ascending: false });
      if (error) setLoadError(`Could not load orders: ${error.message}`);
      setOrders(
        ((data ?? []) as Row[]).map((o) => ({
          ...o,
          student_name: o.profiles?.full_name,
          usn: o.profiles?.usn,
          email: o.profiles?.email,
          department: o.profiles?.department,
          year_of_study: o.profiles?.year_of_study,
          phone: o.profiles?.phone,
          chapters: (o.order_items ?? []).map((i) => i.chapters?.name).filter((n): n is string => Boolean(n)),
        })),
      );
    }
    setIsLoading(false);
  }, [router, demo]);

  useEffect(() => {
    // load() only sets state after its first await, so this does not cascade renders.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function sendReceipt(order: Order) {
    const res = await adminFetch('/api/send-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error || `Server responded with status ${res.status}`);
    }
    return (data || {}) as { success: boolean; receiptNumber?: string };
  }

  async function verify(order: Order) {
    setBusyId(order.id);
    try {
      if (demo) {
        updateLocalOrderStatus(order.id, 'verified');
      } else {
        const response = await adminFetch(`/api/admin/orders/${order.id}/status`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'verified' }),
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Order update failed.');
      }
      showToast('success', `${order.order_reference} verified. You can now send the receipt.`);
      await load();
    } catch (err) {
      showToast('error', `Verification failed: ${errorMessage(err)}`);
    } finally {
      setBusyId(null);
    }
  }

  async function handleSendReceipt(order: Order) {
    if (!order.email) {
      showToast('error', 'Cannot send receipt: order has no student email associated.');
      return;
    }
    setSendingReceiptId(order.id);
    try {
      if (demo) {
        const demoNumber = order.receipt_number || 'DEMO-RECEIPT';
        updateLocalOrderReceipt(order.id, true, demoNumber);
        showToast('success', `Demo receipt delivery simulated for ${order.email}. No email was sent.`);
        await load();
        return;
      }
      const result = await sendReceipt(order);
      const assignedNum = result.receiptNumber || order.receipt_number;
      showToast('success', `Official receipt ${assignedNum ? `(${assignedNum}) ` : ''}sent successfully to ${order.email}.`);
      await load();
    } catch (err) {
      const msg = errorMessage(err);
      showToast('error', `Failed to send receipt: ${msg}`);
      await load();
    } finally {
      setSendingReceiptId(null);
    }
  }

  async function confirmReject() {
    if (!rejecting) return;
    if (!reason.trim()) return showToast('error', 'Please give the student a reason.');
    setBusyId(rejecting.id);
    try {
      if (demo) {
        updateLocalOrderStatus(rejecting.id, 'rejected', reason.trim());
      } else {
        const response = await adminFetch(`/api/admin/orders/${rejecting.id}/status`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'rejected', reason: reason.trim() }),
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Order update failed.');
      }
      showToast('success', `${rejecting.order_reference} rejected. The student can resubmit from their portal.`);
      setRejecting(null);
      await load();
    } catch (err) {
      showToast('error', `Could not reject: ${errorMessage(err)}`);
    } finally {
      setBusyId(null);
    }
  }

  async function openPreview(order: Order) {
    setPreview({ url: null, ref: order.order_reference });
    const url = await resolveScreenshotUrl(order.payment_screenshot_url);
    setPreview({ url: url ?? '', ref: order.order_reference });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== 'all' && o.status !== filter) return false;
      if (!q) return true;
      return [o.order_reference, o.student_name, o.usn, o.email, o.utr_reference].some((v) => v?.toLowerCase().includes(q));
    });
  }, [orders, filter, query]);

  function exportCSV() {
    const header = ['Order Ref', 'Student Name', 'USN', 'Email', 'Department', 'Year', 'Phone', 'Chapters', 'T-Shirt Size', 'Amount', 'Status', 'UTR', 'Submitted'];
    const rows = filtered.map((o) => [
      o.order_reference, o.student_name, o.usn, o.email, o.department, o.year_of_study, o.phone,
      (o.chapters ?? []).join('; '), o.tshirt_size || '—', o.total_amount, o.status, o.utr_reference, new Date(o.created_at).toISOString(),
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `bmsce_ieee_orders_${filter}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const counts = useMemo(
    () => ({
      all: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      verified: orders.filter((o) => o.status === 'verified').length,
      rejected: orders.filter((o) => o.status === 'rejected').length,
    }),
    [orders],
  );
  const collected = orders.filter((o) => o.status === 'verified').reduce((s, o) => s + Number(o.total_amount || 0), 0);

  const closePreview = useCallback(() => setPreview(null), []);
  const closeReject = useCallback(() => setRejecting(null), []);

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <AdminNav current="orders" adminEmail={adminEmail} demo={demo} />

      <div className="container-page py-10 sm:py-12">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Membership Verifications</h1>
            <p className="mt-1 text-sm text-muted">Verify UPI transaction receipts and manage active membership applications.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={exportCSV} disabled={filtered.length === 0} className="btn btn-ghost bg-white shadow-sm">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>

      <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4">
        {[
          ['Total applications', counts.all, 'text-ink'],
          ['Pending review', counts.pending, 'text-amber-600'],
          ['Verified members', counts.verified, 'text-emerald-600'],
          ['Verified funds', `₹${collected.toLocaleString('en-IN')}`, 'text-brand-navy'],
        ].map(([label, value, cls]) => (
          <div key={label as string} className="border-l-2 border-line pl-4">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className={cn('mt-1 font-display text-2xl font-bold sm:text-3xl', cls as string)}>{value}</dd>
          </div>
        ))}
      </dl>

      {loadError && <Alert tone="error" className="mt-6">{loadError}</Alert>}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div role="tablist" className="inline-flex gap-1 rounded-full bg-white p-1 shadow-[0_1px_2px_rgb(11_27_51/0.05)]">
            {(['pending', 'verified', 'rejected', 'all'] as const).map((f) => (
              <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)} className="tab capitalize">
                {f} <span className="ml-1 opacity-60">{counts[f]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="relative sm:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, USN, ref or UTR" className="input input-icon rounded-full py-2.5" aria-label="Search orders" />
        </div>
      </div>

      <div className="panel mt-5 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-12 text-center text-sm text-muted">No applications match this view.</p>
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((o) => (
              <li key={o.id} className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1.4fr_1fr_0.6fr_auto] lg:items-center lg:gap-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{o.student_name || 'Unnamed student'}</p>
                    {o.usn && <span className="rounded-md bg-sky-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-brand-navy">{o.usn}</span>}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted">{o.email}{o.phone && ` · ${o.phone}`}</p>
                  <p className="mt-0.5 text-xs text-muted">{[o.department, o.year_of_study && `Year ${o.year_of_study}`].filter(Boolean).join(' · ')}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {o.tshirt_size && (
                      <span className="rounded-full bg-brand-orange/10 px-2 py-0.5 text-[11px] font-semibold text-brand-orange ring-1 ring-brand-orange/20">
                        T-Shirt: {o.tshirt_size}
                      </span>
                    )}
                    {o.chapters && o.chapters.map((c) => (
                      <span key={c} className="rounded-full bg-paper px-2 py-0.5 text-[11px] text-ink-soft">{c}</span>
                    ))}
                  </div>
                </div>
                <div className="text-sm">
                  <p className="font-mono font-semibold text-ink">{o.order_reference}</p>
                  {o.receipt_number && (
                    <span className="inline-block mt-0.5 rounded bg-sky-50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-brand-navy">
                      Receipt {o.receipt_number}
                    </span>
                  )}
                  <p className="text-xs text-muted">{formatDateTime(o.created_at)}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted">UTR {o.utr_reference || '—'}</p>
                </div>
                <div className="flex items-center gap-3 lg:flex-col lg:items-start lg:gap-1.5">
                  <span className="font-display text-lg font-bold text-ink">₹{o.total_amount}</span>
                  <StatusBadge status={o.status} />
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  {o.payment_screenshot_url && (
                    <button type="button" onClick={() => openPreview(o)} className="btn btn-ghost px-3.5 py-2">
                      <Eye className="h-4 w-4" /> Proof
                    </button>
                  )}
                  {o.status === 'verified' && (
                    <button
                      type="button"
                      disabled={sendingReceiptId === o.id}
                      onClick={() => handleSendReceipt(o)}
                      className={cn(
                        'btn px-3.5 py-2 text-xs font-semibold',
                        o.receipt_sent
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 ring-inset hover:bg-emerald-100'
                          : 'bg-brand-navy text-white hover:bg-brand-navy-light'
                      )}
                      title={
                        o.receipt_sent && o.receipt_sent_at
                          ? `Receipt sent on ${formatDateTime(o.receipt_sent_at)}. Click to resend.`
                          : o.receipt_error
                          ? `Previous attempt failed: ${o.receipt_error}. Click to retry.`
                          : 'Send official confirmation receipt email to student'
                      }
                    >
                      {sendingReceiptId === o.id ? (
                        <Spinner className="h-4 w-4" />
                      ) : o.receipt_sent ? (
                        <MailCheck className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      {o.receipt_sent ? 'Resend Receipt' : 'Send Receipt'}
                    </button>
                  )}
                  {o.status !== 'verified' && (
                    <button type="button" disabled={busyId === o.id} onClick={() => verify(o)} className="btn bg-emerald-600 px-3.5 py-2 text-white hover:bg-emerald-700">
                      {busyId === o.id ? <Spinner /> : <Check className="h-4 w-4" />} Verify
                    </button>
                  )}
                  {o.status === 'pending' && (
                    <button type="button" disabled={busyId === o.id} onClick={() => setRejecting(o)} className="btn px-3.5 py-2 text-red-600 ring-1 ring-red-200 ring-inset hover:bg-red-50">
                      <X className="h-4 w-4" /> Reject
                    </button>
                  )}
                  {o.status === 'rejected' && o.rejection_reason && (
                    <p className="w-full text-xs text-red-600 lg:max-w-[16rem] lg:text-right" title={o.rejection_reason}>
                      Awaiting resubmission
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {preview && (
        <Modal title={`Payment proof · ${preview.ref}`} onClose={closePreview} wide>
          <div className="flex min-h-[240px] items-center justify-center overflow-hidden rounded-2xl bg-paper">
            {preview.url === null ? (
              <Spinner className="h-6 w-6 text-muted" />
            ) : preview.url ? (
              <img src={preview.url} alt="Payment screenshot" className="max-h-[70vh] w-auto object-contain" />
            ) : (
              <p className="p-8 text-sm text-muted">The screenshot could not be loaded.</p>
            )}
          </div>
        </Modal>
      )}

      {rejecting && (
        <Modal title="Reject payment proof" onClose={closeReject}>
          <p className="-mt-2 mb-4 text-sm text-muted">
            <span className="font-mono font-semibold text-brand-navy">{rejecting.order_reference}</span> · {rejecting.student_name}
          </p>
          <label htmlFor="reason" className="field-label">Reason shown to the student</label>
          <textarea id="reason" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} className="input resize-none" />
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={closeReject} className="btn btn-ghost">Cancel</button>
            <button type="button" disabled={busyId === rejecting.id} onClick={confirmReject} className="btn bg-red-600 text-white hover:bg-red-700">
              {busyId === rejecting.id && <Spinner />} Reject application
            </button>
          </div>
        </Modal>
      )}

      {toast && (
        <div className="fixed inset-x-4 bottom-4 z-[70] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-sm">
          <Alert tone={toast.tone} className="shadow-xl">{toast.text}</Alert>
        </div>
      )}
      </div>
    </div>
  );
}
