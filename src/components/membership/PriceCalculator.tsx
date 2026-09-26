'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { animate, motion } from 'motion/react';
import { ArrowRight, Check, Plus } from 'lucide-react';
import { chapters as chapterInfo } from '@/data/site';
import { loadPricing, PRESELECT_KEY, type Pricing } from '@/lib/pricing';
import { useSession } from '@/lib/useSession';
import { cn } from '@/lib/utils';

function AnimatedNumber({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const c = animate(shown, value, { duration: 0.5, ease: 'easeOut', onUpdate: (v) => setShown(Math.round(v)) });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate from the current display value
  }, [value]);
  return <>{shown.toLocaleString('en-IN')}</>;
}

export default function PriceCalculator() {
  const router = useRouter();
  const { user } = useSession();
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [error, setError] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPricing()
      .then(setPricing)
      .catch((e: Error) => setError(e.message));
  }, []);

  const total = useMemo(() => {
    if (!pricing) return 0;
    return pricing.baseFee + pricing.chapters.filter((c) => picked.has(c.code)).reduce((s, c) => s + c.price, 0);
  }, [pricing, picked]);

  const toggle = (code: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  const start = () => {
    sessionStorage.setItem(PRESELECT_KEY, JSON.stringify([...picked]));
    router.push(user ? '/membership/profile' : '/membership/register');
  };

  if (error) return <p className="rounded-2xl bg-red-50 p-5 text-sm text-red-700">{error}</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        {(pricing?.chapters ?? Array.from({ length: 6 }, (_, i) => ({ id: String(i), code: '', name: '', price: 0 }))).map((c) => {
          const info = chapterInfo.find((x) => x.code === c.code);
          const on = picked.has(c.code);
          const Icon = info?.icon;
          if (!c.code) return <div key={c.id} className="h-[88px] animate-pulse rounded-2xl bg-white" />;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.code)}
              aria-pressed={on}
              className={cn('flex w-full min-w-0 items-center gap-4 rounded-2xl bg-white p-4 text-left transition-all duration-200', on ? 'shadow-[0_0_0_2px_currentColor]' : 'hover:-translate-y-0.5 hover:shadow-md')}
              style={{ color: info?.color ?? 'var(--color-ink)' }}
            >
              <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors', on ? 'text-white' : 'bg-paper')} style={on ? { background: info?.color } : undefined}>
                {Icon ? <Icon className="h-5 w-5" /> : c.code}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-ink">{c.name}</span>
                <span className="block text-sm text-muted">+ ₹{c.price}</span>
              </span>
              <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors', on ? 'text-white' : 'bg-paper text-muted')} style={on ? { background: info?.color } : undefined}>
                {on ? <Check className="h-4 w-4" strokeWidth={3} /> : <Plus className="h-4 w-4" />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grain relative flex flex-col justify-between overflow-hidden rounded-[28px] bg-ink p-7 text-white lg:sticky lg:top-24">
        <div>
          <p className="text-sm text-white/60">Your membership</p>
          <p className="display mt-2 text-6xl">
            ₹<AnimatedNumber value={total} />
          </p>
          <p className="mt-1 text-sm text-white/60">one-time for the academic year</p>
          <ul className="mt-6 space-y-2 text-sm">
            <li className="flex justify-between"><span className="text-white/80">Base branch membership</span><span>₹{pricing?.baseFee ?? '—'}</span></li>
            {pricing?.chapters.filter((c) => picked.has(c.code)).map((c) => (
              <motion.li key={c.code} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between text-white/70">
                <span>{c.code}</span>
                <span>₹{c.price}</span>
              </motion.li>
            ))}
          </ul>
        </div>
        <button type="button" onClick={start} disabled={!pricing} className="btn btn-primary btn-lg mt-8 w-full">
          {user ? 'Continue registration' : 'Start registration'} <ArrowRight className="h-4 w-4" />
        </button>
        <p className="mt-3 text-center text-xs text-white/50">You can change chapters before paying.</p>
      </div>
    </div>
  );
}
