'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, ArrowUpRight, Clock } from 'lucide-react';
import { useAdmin } from '@/components/admin/AdminContext';
import { BarList, ChartCard, ColumnChart, Sparkline, StatusBar } from '@/components/admin/charts';
import { fetchActivity, type Activity } from '@/lib/admin';
import { greeting, overviewStats, timeAgo } from '@/lib/adminStats';
import { cn } from '@/lib/utils';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

function Stat({ label, value, sub, children, accent }: { label: string; value: string; sub?: React.ReactNode; children?: React.ReactNode; accent?: boolean }) {
  return (
    <div className={cn('panel flex flex-col justify-between gap-3 p-5', accent && 'bg-ink text-white')}>
      <p className={cn('text-sm', accent ? 'text-white/70' : 'text-muted')}>{label}</p>
      <div className="flex items-end justify-between gap-3">
        <p className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{value}</p>
        {children}
      </div>
      {sub && <p className={cn('text-xs', accent ? 'text-white/70' : 'text-muted')}>{sub}</p>}
    </div>
  );
}

export default function AdminOverview() {
  const { admin, orders, flags } = useAdmin();
  const s = useMemo(() => overviewStats(orders), [orders]);
  const [activity, setActivity] = useState<Activity[]>([]);

  useEffect(() => {
    fetchActivity(6).then(setActivity);
  }, [orders]);

  const flagged = orders.filter((o) => o.status === 'pending' && flags.has(o.id));
  const attention = [...flagged, ...s.pendingOldestFirst.filter((o) => !flags.has(o.id))].slice(0, 6);
  const weekDelta = s.thisWeek - s.lastWeek;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted">{greeting()}, {admin.email.split('@')[0]}</p>
          <h1 className="display mt-1 text-4xl text-ink sm:text-5xl">Overview</h1>
        </div>
        {s.counts.pending > 0 && (
          <Link href="/admin/orders" className="btn btn-primary self-start sm:self-auto">
            Review {s.counts.pending} pending <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Verified funds" value={inr(s.money.verified)} sub={`${inr(s.money.pending)} waiting to be verified`} accent />
        <Stat label="Pending review" value={String(s.counts.pending)} sub={s.counts.pending ? `Oldest waiting ${s.oldestPendingDays} day${s.oldestPendingDays === 1 ? '' : 's'}` : 'All caught up'} />
        <Stat label="Verified members" value={String(s.counts.verified)} sub="Verifications, last 14 days">
          <Sparkline values={s.verifiedTrend} />
        </Stat>
        <Stat
          label="Applications this week"
          value={String(s.thisWeek)}
          sub={
            <span className={cn(weekDelta > 0 ? 'text-emerald-700' : weekDelta < 0 ? 'text-red-700' : '')}>
              {weekDelta === 0 ? 'Same as last week' : `${weekDelta > 0 ? '+' : ''}${weekDelta} vs last week (${s.lastWeek})`}
            </span>
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <ChartCard
          title="Applications per day"
          subtitle="Last 30 days"
          table={{ head: ['Date', 'Applications'], rows: s.daily.map((d) => [d.label, d.value]) }}
        >
          <ColumnChart data={s.daily} valueLabel="applications" />
        </ChartCard>

        {/* Needs attention */}
        <section className="panel min-w-0 p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-ink">Needs attention</h3>
            <Link href="/admin/orders" className="text-xs font-semibold text-brand-navy hover:text-brand-orange">View queue</Link>
          </div>
          {attention.length === 0 ? (
            <p className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">Nothing waiting. Every application has been reviewed.</p>
          ) : (
            <ul className="divide-y divide-line">
              {attention.map((o) => {
                const f = flags.get(o.id);
                return (
                  <li key={o.id}>
                    <Link href={`/admin/orders?open=${o.id}`} className="group flex items-center gap-3 py-3">
                      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', f ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700')}>
                        {f ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">{o.student_name ?? o.order_reference}</span>
                        <span className="block truncate text-xs text-muted">{f ? f[0].text : `Waiting ${s.ageDays(o)} day${s.ageDays(o) === 1 ? '' : 's'} · ₹${o.total_amount}`}</span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <ChartCard
          title="Application status"
          subtitle={`${s.counts.total} applications in total`}
          table={{ head: ['Status', 'Applications'], rows: [['Verified', s.counts.verified], ['Pending', s.counts.pending], ['Rejected', s.counts.rejected]] }}
        >
          <StatusBar verified={s.counts.verified} pending={s.counts.pending} rejected={s.counts.rejected} />
        </ChartCard>
        <ChartCard
          title="Chapter sign-ups"
          subtitle="Active applications that include each chapter"
          table={{ head: ['Chapter', 'Members'], rows: s.chapterCounts.map((c) => [c.label, c.value]) }}
        >
          <BarList data={[...s.chapterCounts].sort((a, b) => b.value - a.value)} total={s.counts.active} />
        </ChartCard>
        <ChartCard
          title="By department"
          subtitle="Active applications"
          table={{ head: ['Department', 'Applications'], rows: s.deptTop.map((d) => [d.full, d.value]) }}
        >
          <BarList data={s.deptTop} total={s.counts.active} />
        </ChartCard>
        <ChartCard title="By year of study" subtitle="Active applications" table={{ head: ['Year', 'Applications'], rows: s.years.map((y) => [y.label, y.value]) }}>
          <BarList data={s.years} total={s.counts.active} />
        </ChartCard>

        <section className="panel min-w-0 p-5 sm:p-6 lg:col-span-2 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-ink">Recent activity</h3>
            <Link href="/admin/activity" className="text-xs font-semibold text-brand-navy hover:text-brand-orange">Full log</Link>
          </div>
          {activity.length === 0 ? (
            <p className="text-sm text-muted">No admin actions yet. Verifications, rejections and settings changes will show up here.</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((a) => (
                <li key={a.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-orange" />
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-ink">{a.admin_email.split('@')[0]}</span> <span className="text-ink-soft">{a.action}</span>{' '}
                    <span className="font-mono text-xs text-brand-navy">{a.target}</span>
                    {a.details && <span className="block truncate text-xs text-muted">{a.details}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-muted">{timeAgo(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
