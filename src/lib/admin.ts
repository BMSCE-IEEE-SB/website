import { chapterCode } from '@/data/site';
import { getLocalOrders, writeLocalOrders, type Order } from './auth';
import { DEMO_SETTINGS_KEY, loadPayee, loadPricing, type DemoSettings, type Pricing } from './pricing';
import { isDemoMode, supabase } from './supabase';
import { adminFetch } from './admin-api';

export type AdminIdentity = { id: string; email: string };

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

type Row = Order & {
  profiles?: { full_name?: string; usn?: string; email?: string; department?: string; year_of_study?: string; phone?: string; ieee_member_id?: string } | null;
  order_items?: { price_at_purchase: number; chapters: { name: string } | null }[];
};

/** Every application with student details, newest first. */
export async function fetchOrders(): Promise<Order[]> {
  if (isDemoMode()) return getLocalOrders();
  const { data, error } = await supabase
    .from('orders')
    .select('*, profiles:user_id (full_name, usn, email, department, year_of_study, phone, ieee_member_id), order_items(price_at_purchase, chapters(name))')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Could not load applications: ${error.message}`);
  return ((data ?? []) as Row[]).map((o) => ({
    ...o,
    student_name: o.profiles?.full_name,
    usn: o.profiles?.usn,
    email: o.profiles?.email,
    department: o.profiles?.department,
    year_of_study: o.profiles?.year_of_study,
    phone: o.profiles?.phone,
    ieee_member_id: o.profiles?.ieee_member_id,
    chapters: (o.order_items ?? []).map((i) => i.chapters?.name).filter((n): n is string => Boolean(n)),
  }));
}

function patchDemo(ids: string[], patch: (o: Order) => Order) {
  const set = new Set(ids);
  writeLocalOrders(getLocalOrders().map((o) => (set.has(o.id) ? patch(o) : o)));
}

const labelFor = (list: Order[]) => (list.length === 1 ? `${list[0].order_reference}${list[0].student_name ? ` (${list[0].student_name})` : ''}` : `${list.length} applications`);

export async function verifyOrders(list: Order[], admin: AdminIdentity) {
  const ids = list.map((o) => o.id);
  const now = new Date().toISOString();
  if (isDemoMode()) {
    patchDemo(ids, (o) => ({ ...o, status: 'verified', verified_at: now, rejection_reason: undefined }));
  } else {
    for (const o of list) {
      const res = await adminFetch(`/api/admin/orders/${o.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'verified' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to verify order ${o.order_reference}`);
      }
    }
  }
  await logActivity(admin, 'verified', labelFor(list));
}

export async function rejectOrders(list: Order[], reason: string, admin: AdminIdentity) {
  const ids = list.map((o) => o.id);
  if (isDemoMode()) {
    patchDemo(ids, (o) => ({ ...o, status: 'rejected', verified_at: undefined, rejection_reason: reason }));
  } else {
    for (const o of list) {
      const res = await adminFetch(`/api/admin/orders/${o.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', reason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to reject order ${o.order_reference}`);
      }
    }
  }
  await logActivity(admin, 'rejected', labelFor(list), reason);
}

export async function saveNote(order: Order, note: string, admin: AdminIdentity) {
  const id = order.id;
  if (isDemoMode()) patchDemo([id], (o) => ({ ...o, admin_note: note || undefined }));
  else {
    const { error } = await supabase.from('orders').update({ admin_note: note || null }).eq('id', id);
    if (error) throw error;
  }
  await logActivity(admin, 'added a note to', labelFor([order]), note.slice(0, 120));
}

export async function markCredentialsSent(list: Order[], sent: boolean, admin: AdminIdentity) {
  const ids = list.map((o) => o.id);
  const value = sent ? new Date().toISOString() : null;
  if (isDemoMode()) patchDemo(ids, (o) => ({ ...o, credentials_sent_at: value ?? undefined }));
  else {
    const { error } = await supabase.from('orders').update({ credentials_sent_at: value }).in('id', ids);
    if (error) throw error;
  }
  await logActivity(admin, sent ? 'marked IEEE credentials sent for' : 'unmarked credentials for', list.length === 1 ? labelFor(list) : `${list.length} members`);
}

export async function saveIeeeId(order: Order, ieeeId: string, admin: AdminIdentity) {
  if (isDemoMode()) patchDemo([order.id], (o) => ({ ...o, ieee_member_id: ieeeId || undefined }));
  else {
    const { error } = await supabase.from('profiles').update({ ieee_member_id: ieeeId || null }).eq('id', order.user_id);
    if (error) throw error;
  }
  await logActivity(admin, 'set the IEEE member ID for', labelFor([order]), ieeeId || 'cleared');
}

/** Asks the server to generate and email the official PDF receipt. */
export async function sendReceipt(order: Order) {
  if (isDemoMode()) return true;
  const res = await adminFetch('/api/send-receipt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: order.id }),
  }).catch(() => null);
  return Boolean(res?.ok);
}

// ---------------------------------------------------------------------------
// Review flags: things a treasurer should double-check before verifying
// ---------------------------------------------------------------------------

export type Flag = { kind: 'duplicate-utr' | 'amount' | 'repeat-student'; text: string };

export function computeFlags(orders: Order[], pricing: Pricing | null): Map<string, Flag[]> {
  const flags = new Map<string, Flag[]>();
  const add = (id: string, f: Flag) => flags.set(id, [...(flags.get(id) ?? []), f]);

  const byUtr = new Map<string, Order[]>();
  const byUsn = new Map<string, Order[]>();
  for (const o of orders) {
    if (o.utr_reference) byUtr.set(o.utr_reference, [...(byUtr.get(o.utr_reference) ?? []), o]);
    if (o.usn && o.status !== 'rejected') byUsn.set(o.usn.toUpperCase(), [...(byUsn.get(o.usn.toUpperCase()) ?? []), o]);
  }
  for (const [utr, list] of byUtr) {
    if (list.length < 2) continue;
    for (const o of list) {
      const others = list.filter((x) => x.id !== o.id).map((x) => x.order_reference).join(', ');
      add(o.id, { kind: 'duplicate-utr', text: `UTR ${utr} is also used on ${others}.` });
    }
  }
  for (const list of byUsn.values()) {
    if (list.length < 2) continue;
    for (const o of list) add(o.id, { kind: 'repeat-student', text: `This USN has ${list.length} active applications.` });
  }
  if (pricing) {
    const priceByCode = new Map(pricing.chapters.map((c) => [c.code, c.price]));
    for (const o of orders) {
      const expected = Number(o.base_fee) + (o.chapters ?? []).reduce((s, n) => s + (priceByCode.get(chapterCode(n)) ?? 0), 0);
      if (Math.round(expected) !== Math.round(Number(o.total_amount))) {
        add(o.id, { kind: 'amount', text: `Paid ₹${o.total_amount}, but base fee plus chapters comes to ₹${expected}.` });
      }
    }
  }
  return flags;
}

// ---------------------------------------------------------------------------
// Activity log
// ---------------------------------------------------------------------------

export type Activity = { id: string; admin_email: string; action: string; target: string; details?: string; created_at: string };
const ACTIVITY_KEY = 'bmsce_demo_activity';

export async function logActivity(admin: AdminIdentity, action: string, target: string, details?: string) {
  const entry = { admin_email: admin.email, action, target, details, created_at: new Date().toISOString() };
  if (isDemoMode()) {
    try {
      const list: Activity[] = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]');
      localStorage.setItem(ACTIVITY_KEY, JSON.stringify([{ id: crypto.randomUUID(), ...entry }, ...list].slice(0, 300)));
    } catch {}
    return;
  }
  // Logging must never block the actual action.
  await supabase.from('admin_activity').insert({ admin_id: admin.id, ...entry }).then(() => {}, () => {});
}

export async function fetchActivity(limit = 100): Promise<Activity[]> {
  if (isDemoMode()) {
    try {
      return (JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]') as Activity[]).slice(0, limit);
    } catch {
      return [];
    }
  }
  const { data } = await supabase.from('admin_activity').select('*').order('created_at', { ascending: false }).limit(limit);
  return (data ?? []) as Activity[];
}

// ---------------------------------------------------------------------------
// Settings: fees and payment details
// ---------------------------------------------------------------------------

export type Settings = {
  baseFee: number;
  vpa: string;
  payeeName: string;
  driveYear?: number;
  isDriveOpen?: boolean;
  treasurerName?: string;
  treasurerRole?: string;
  treasurerPhone?: string;
  signatureUrl?: string;
  chapters: { id: string; code: string; name: string; price: number; is_active?: boolean }[];
};

export async function loadSettings(): Promise<Settings> {
  if (isDemoMode()) {
    const [pricing, payee] = await Promise.all([loadPricing(), loadPayee()]);
    return {
      baseFee: pricing.baseFee,
      vpa: payee.vpa,
      payeeName: payee.name,
      driveYear: new Date().getFullYear(),
      isDriveOpen: true,
      treasurerName: 'Branch Treasurer',
      treasurerRole: 'Treasurer',
      treasurerPhone: '+91 98765 43210',
      chapters: pricing.chapters,
    };
  }
  try {
    const res = await adminFetch('/api/admin/settings');
    if (res.ok) {
      const { settings, chapters } = await res.json();
      return {
        baseFee: Number(settings?.base_fee ?? 500),
        vpa: settings?.payee_vpa ?? '',
        payeeName: settings?.payee_name ?? '',
        driveYear: Number(settings?.drive_year ?? new Date().getFullYear()),
        isDriveOpen: settings?.is_drive_open ?? true,
        treasurerName: settings?.treasurer_name ?? 'Branch Treasurer',
        treasurerRole: settings?.treasurer_role ?? 'Treasurer',
        treasurerPhone: settings?.treasurer_phone ?? '',
        signatureUrl: settings?.signature_url ?? '',
        chapters: (chapters ?? []).map((c: any) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          price: Number(c.price),
          is_active: c.is_active ?? true,
        })),
      };
    }
  } catch {}
  const [pricing, payee] = await Promise.all([loadPricing(), loadPayee()]);
  return {
    baseFee: pricing.baseFee,
    vpa: payee.vpa,
    payeeName: payee.name,
    driveYear: new Date().getFullYear(),
    isDriveOpen: true,
    treasurerName: 'Branch Treasurer',
    treasurerRole: 'Treasurer',
    treasurerPhone: '',
    chapters: pricing.chapters,
  };
}

export async function saveSettings(next: Settings, admin: AdminIdentity) {
  if (isDemoMode()) {
    const demo: DemoSettings = { baseFee: next.baseFee, vpa: next.vpa, payeeName: next.payeeName, prices: Object.fromEntries(next.chapters.map((c) => [c.id, c.price])) };
    localStorage.setItem(DEMO_SETTINGS_KEY, JSON.stringify(demo));
  } else {
    const res = await adminFetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings: {
          base_fee: next.baseFee,
          payee_vpa: next.vpa,
          payee_name: next.payeeName,
          drive_year: next.driveYear ?? new Date().getFullYear(),
          is_drive_open: next.isDriveOpen ?? true,
          treasurer_name: next.treasurerName || 'Treasurer',
          treasurer_role: next.treasurerRole || 'Branch Treasurer',
          treasurer_phone: next.treasurerPhone || '',
        },
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save settings.');
    }
    for (const c of next.chapters) {
      const chRes = await adminFetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter: {
            id: c.id,
            name: c.name,
            price: c.price,
            is_active: c.is_active ?? true,
          },
        }),
      });
      if (!chRes.ok) {
        const err = await chRes.json().catch(() => ({}));
        throw new Error(err.error || `Failed to save chapter ${c.name}.`);
      }
    }
  }
  await logActivity(admin, 'updated settings', 'fees & payment', `Base ₹${next.baseFee}, UPI ${next.vpa}`);
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

const csvCell = (v: unknown) => {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // neutralise spreadsheet formulas
  return `"${s.replace(/"/g, '""')}"`;
};

export function downloadCsv(filename: string, header: string[], rows: unknown[][]) {
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
