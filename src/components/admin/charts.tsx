'use client';

import { useState } from 'react';
import { CircleCheck, CircleX, Clock, Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/*
 * Chart kit for the admin dashboard. Plain HTML/SVG, following the data-viz rules:
 * one hue for magnitude, thin marks (<=24px) with 4px rounded data-ends, hairline
 * recessive grid, value labels in text colours (never the series colour), a hover
 * tooltip on every mark and a table view for every chart.
 */

export const VIZ = {
  series: '#00377e', // brand navy: the single magnitude hue
  grid: '#e9e6de',
  // Reserved status colours (validated: CVD-separable; amber relies on visible labels)
  verified: '#059669',
  pending: '#e59500',
  rejected: '#b91c1c',
};

export function ChartCard({
  title,
  subtitle,
  table,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  table: { head: string[]; rows: (string | number)[][] };
  children: React.ReactNode;
  className?: string;
}) {
  const [asTable, setAsTable] = useState(false);
  return (
    <section className={cn('panel min-w-0 p-5 sm:p-6', className)} aria-label={title}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          aria-pressed={asTable}
          className={cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors', asTable ? 'bg-ink text-white' : 'bg-paper text-ink-soft hover:text-ink')}
        >
          <Table2 className="h-3.5 w-3.5" /> Table
        </button>
      </div>
      {asTable ? (
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-white text-xs text-muted">
              <tr>
                {table.head.map((h, i) => (
                  <th key={h} className={cn('py-2 font-medium', i > 0 && 'text-right')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {table.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j} className={cn('py-2', j > 0 && 'text-right tabular-nums')}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </section>
  );
}

function niceMax(v: number) {
  if (v <= 4) return 4;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  return (n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

/** Single-series column chart (e.g. applications per day). */
export function ColumnChart({ data, valueLabel }: { data: { label: string; short: string; value: number }[]; valueLabel: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(1, ...data.map((d) => d.value)));
  const ticks = [0, max / 2, max];
  const every = Math.ceil(data.length / 6);

  return (
    <div className="relative">
      <div className="flex">
        {/* Y axis */}
        <div className="relative mr-2 h-44 w-7 shrink-0 text-right text-[11px] text-muted tabular-nums">
          {ticks.map((t) => (
            <span key={t} className="absolute right-0" style={{ bottom: `${(t / max) * 100}%`, transform: 'translateY(50%)' }}>
              {t}
            </span>
          ))}
        </div>
        <div className="relative h-44 min-w-0 flex-1">
          {ticks.map((t) => (
            <div key={t} className="absolute inset-x-0 h-px" style={{ bottom: `${(t / max) * 100}%`, background: VIZ.grid }} />
          ))}
          <div className="absolute inset-0 flex items-end">
            {data.map((d, i) => (
              <div
                key={d.label}
                className="relative flex h-full min-w-0 flex-1 cursor-default items-end justify-center"
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={`${d.label}: ${d.value} ${valueLabel}`}
              >
                <div
                  className="w-full max-w-6 rounded-t-[4px] transition-opacity"
                  style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 3 : 0, background: VIZ.series, opacity: hover === null || hover === i ? 1 : 0.35, marginInline: 1 }}
                />
                {hover === i && (
                  <div className="pointer-events-none absolute bottom-full z-10 mb-2 rounded-lg bg-ink px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-lg" style={{ left: '50%', transform: `translateX(${i > data.length * 0.75 ? '-90%' : i < data.length * 0.25 ? '-10%' : '-50%'})` }}>
                    <strong className="font-semibold">{d.value}</strong> <span className="text-white/70">{valueLabel}</span>
                    <div className="text-white/60">{d.label}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 ml-9 flex text-[11px] text-muted">
        {data.map((d, i) => (
          <span key={d.label} className="min-w-0 flex-1 overflow-visible text-center whitespace-nowrap">
            {i % every === 0 ? d.short : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Horizontal bars for comparing magnitudes; value at the tip, optional identity dot. */
export function BarList({ data, total }: { data: { label: string; value: number; dot?: string }[]; total?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-3">
      {data.map((d, i) => (
        <li
          key={d.label}
          className="relative grid grid-cols-[minmax(0,8.5rem)_1fr] items-center gap-3 text-sm"
          onPointerEnter={() => setHover(i)}
          onPointerLeave={() => setHover(null)}
        >
          <span className="flex min-w-0 items-center gap-2 text-ink-soft">
            {d.dot && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: d.dot }} aria-hidden />}
            <span className="truncate">{d.label}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 rounded-r-[4px] transition-opacity" style={{ width: `${(d.value / max) * 85}%`, minWidth: d.value ? 3 : 0, background: VIZ.series, opacity: hover === null || hover === i ? 1 : 0.35 }} />
            <span className="font-medium text-ink tabular-nums">{d.value}</span>
            {hover === i && total ? <span className="text-xs text-muted">{Math.round((d.value / total) * 100)}%</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Part-to-whole status bar with a labelled legend (status never relies on colour alone). */
export function StatusBar({ verified, pending, rejected }: { verified: number; pending: number; rejected: number }) {
  const total = Math.max(1, verified + pending + rejected);
  const parts = [
    { key: 'verified', label: 'Verified', value: verified, color: VIZ.verified, icon: CircleCheck },
    { key: 'pending', label: 'Pending', value: pending, color: VIZ.pending, icon: Clock },
    { key: 'rejected', label: 'Rejected', value: rejected, color: VIZ.rejected, icon: CircleX },
  ];
  return (
    <div>
      <div className="flex h-4 gap-[2px] overflow-hidden rounded-[4px]" role="img" aria-label={parts.map((p) => `${p.label} ${p.value}`).join(', ')}>
        {parts.map((p) =>
          p.value ? <div key={p.key} title={`${p.label}: ${p.value}`} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} /> : null,
        )}
      </div>
      <ul className="mt-4 grid grid-cols-3 gap-3">
        {parts.map((p) => (
          <li key={p.key}>
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <p.icon className="h-3.5 w-3.5" style={{ color: p.color }} aria-hidden /> {p.label}
            </span>
            <span className="mt-0.5 block text-lg font-semibold text-ink tabular-nums">
              {p.value} <span className="text-xs font-normal text-muted">{Math.round((p.value / total) * 100)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Tiny trend line for stat tiles. */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const w = 96;
  const h = 28;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => [values.length === 1 ? w : (i / (values.length - 1)) * w, h - 3 - (v / max) * (h - 6)] as const);
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn('h-7 w-24 overflow-visible', className)} aria-hidden>
      <path d={d} fill="none" stroke={VIZ.series} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {last && <circle cx={last[0]} cy={last[1]} r="4" fill={VIZ.series} stroke="#fff" strokeWidth="2" />}
    </svg>
  );
}
