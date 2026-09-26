import { chapterCode, chapters as chapterInfo, departments } from '@/data/site';
import type { Order } from './auth';

const DAY = 86400000;

function dayKey(t: number) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Everything the overview dashboard needs, computed from the application list. */
export function overviewStats(orders: Order[]) {
  const now = Date.now();
  const startOfToday = new Date(new Date(now).toDateString()).getTime();
  const active = orders.filter((o) => o.status !== 'rejected');
  const pending = orders.filter((o) => o.status === 'pending');
  const verified = orders.filter((o) => o.status === 'verified');
  const rejected = orders.filter((o) => o.status === 'rejected');
  const sum = (list: Order[]) => list.reduce((s, o) => s + Number(o.total_amount || 0), 0);

  // Applications per day, last 30 days
  const counts = new Map<string, number>();
  for (const o of orders) counts.set(dayKey(new Date(o.created_at).getTime()), (counts.get(dayKey(new Date(o.created_at).getTime())) ?? 0) + 1);
  const daily = Array.from({ length: 30 }, (_, i) => {
    const t = startOfToday - (29 - i) * DAY;
    const d = new Date(t);
    return { label: `${d.getDate()} ${MONTHS[d.getMonth()]}`, short: `${d.getDate()}/${d.getMonth() + 1}`, value: counts.get(dayKey(t)) ?? 0 };
  });

  // Verifications per day, last 14 days (sparkline)
  const vCounts = new Map<string, number>();
  for (const o of verified) if (o.verified_at) vCounts.set(dayKey(new Date(o.verified_at).getTime()), (vCounts.get(dayKey(new Date(o.verified_at).getTime())) ?? 0) + 1);
  const verifiedTrend = Array.from({ length: 14 }, (_, i) => vCounts.get(dayKey(startOfToday - (13 - i) * DAY)) ?? 0);

  const within = (o: Order, from: number, to: number) => {
    const t = new Date(o.created_at).getTime();
    return t >= from && t < to;
  };
  const thisWeek = orders.filter((o) => within(o, now - 7 * DAY, now + 1)).length;
  const lastWeek = orders.filter((o) => within(o, now - 14 * DAY, now - 7 * DAY)).length;

  const oldestPending = pending.reduce<Order | null>((a, o) => (!a || o.created_at < a.created_at ? o : a), null);
  const oldestPendingDays = oldestPending ? Math.floor((now - new Date(oldestPending.created_at).getTime()) / DAY) : 0;

  // Chapter enrolment across active applications
  const chapterCounts = chapterInfo.map((c) => ({
    label: c.code,
    dot: c.color,
    value: active.filter((o) => (o.chapters ?? []).some((n) => chapterCode(n) === c.code)).length,
  }));

  // Department mix: top 6 + Other
  const deptMap = new Map<string, number>();
  for (const o of active) deptMap.set(o.department || 'Unknown', (deptMap.get(o.department || 'Unknown') ?? 0) + 1);
  const deptSorted = [...deptMap.entries()].sort((a, b) => b[1] - a[1]);
  const deptTop = deptSorted.slice(0, 6).map(([k, v]) => ({ label: k, value: v, full: departments.find(([c]) => c === k)?.[1] ?? k }));
  const other = deptSorted.slice(6).reduce((s, [, v]) => s + v, 0);
  if (other) deptTop.push({ label: 'Other', value: other, full: 'Other departments' });

  const years = ['1', '2', '3', '4', 'PG'].map((y) => ({ label: y === 'PG' ? 'PG / Research' : `Year ${y}`, value: active.filter((o) => o.year_of_study === y).length })).filter((y) => y.value > 0);

  const ageDays = (o: Order) => Math.floor((now - new Date(o.created_at).getTime()) / DAY);

  return {
    counts: { total: orders.length, pending: pending.length, verified: verified.length, rejected: rejected.length, active: active.length },
    money: { verified: sum(verified), pending: sum(pending) },
    daily,
    verifiedTrend,
    thisWeek,
    lastWeek,
    oldestPendingDays,
    chapterCounts,
    deptTop,
    years,
    pendingOldestFirst: [...pending].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    ageDays,
  };
}

/** "3h ago", "2d ago" relative to now. */
export function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}
