'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Plus } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { chapters as chapterInfo } from '@/data/site';
import { loadPricing, PRESELECT_KEY } from '@/lib/pricing';
import { LiveCard, useDraft } from '@/components/membership/Draft';
import { Alert, PageLoader, Spinner } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { CART_KEYS, type CartChapter } from '@/lib/cart';

export default function ChaptersPage() {
  const router = useRouter();
  const { update } = useDraft();
  const [chapters, setChapters] = useState<CartChapter[]>([]);
  const [baseFee, setBaseFee] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      const user = await getCurrentUser().catch(() => null);
      if (!alive) return;
      if (!user) {
        router.replace('/membership/register');
        return;
      }

      let list: CartChapter[];
      let fee: number;
      try {
        ({ chapters: list, baseFee: fee } = await loadPricing());
      } catch (err) {
        if (alive) {
          setError((err as Error).message);
          setIsLoading(false);
        }
        return;
      }
      if (!alive) return;
      setChapters(list);
      setBaseFee(fee);

      // Restore a previous selection if the user came back from checkout.
      // ...or the chapters picked on the /membership price calculator.
      try {
        const prev: CartChapter[] = JSON.parse(sessionStorage.getItem(CART_KEYS.chapters) || '[]');
        const codes: string[] = JSON.parse(sessionStorage.getItem(PRESELECT_KEY) || '[]');
        const ids = prev.length ? prev.map((c) => c.id) : list.filter((c) => codes.includes(c.code)).map((c) => c.id);
        setSelected(new Set(ids.filter((id) => list.some((c) => c.id === id))));
      } catch {}
      setIsLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const picked = useMemo(() => chapters.filter((c) => selected.has(c.id)), [chapters, selected]);
  useEffect(() => {
    if (!isLoading) update({ chapters: picked.map((c) => c.code) });
  }, [picked, isLoading, update]);
  const total = baseFee + picked.reduce((s, c) => s + c.price, 0);

  const handleCheckout = () => {
    setIsSubmitting(true);
    const prev = sessionStorage.getItem(CART_KEYS.chapters);
    const nextCart = JSON.stringify(picked);
    // A changed cart means a changed amount, so it needs a fresh order reference.
    if (prev !== nextCart) sessionStorage.removeItem(CART_KEYS.orderRef);
    sessionStorage.removeItem(PRESELECT_KEY);
    sessionStorage.setItem(CART_KEYS.chapters, nextCart);
    sessionStorage.setItem(CART_KEYS.baseFee, String(baseFee));
    router.push('/membership/checkout');
  };

  if (isLoading) return <PageLoader />;

  const describe = (code: string) => chapterInfo.find((c) => c.code === code);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">Choose your chapters</h1>
        <p className="lead mx-auto mt-3 max-w-xl">Your base membership is included. Add as many technical chapters as you like.</p>
      </div>

      {error ? (
        <Alert tone="error" className="mx-auto mt-10 max-w-xl">{error}</Alert>
      ) : (
        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-3">
            {chapters.map((c) => {
              const on = selected.has(c.id);
              const info = describe(c.code);
              const Icon = info?.icon;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c.id)}
                  aria-pressed={on}
                  className={cn(
                    'flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left transition-all sm:p-5',
                    on ? 'shadow-[0_0_0_2px_var(--color-brand-sky),0_12px_32px_-16px_rgb(24_164_254/0.5)]' : 'shadow-[0_1px_2px_rgb(11_27_51/0.05)] hover:shadow-[0_8px_24px_-12px_rgb(11_27_51/0.2)]',
                  )}
                >
                  <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', info ? cn(info.tone.soft, info.tone.text) : 'bg-paper text-muted')}>
                    {Icon ? <Icon className="h-5 w-5" /> : <span className="text-xs font-bold">{c.code}</span>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink">{c.name}</span>
                    <span className="block truncate text-sm text-muted">{info?.tagline ?? c.code}</span>
                  </span>
                  <span className="shrink-0 font-display font-semibold text-ink">₹{c.price}</span>
                  <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors', on ? 'bg-brand-sky text-white' : 'bg-paper text-muted')}>
                    {on ? <Check className="h-4 w-4" strokeWidth={3} /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
              );
            })}
            {chapters.length === 0 && <p className="text-sm text-muted">No chapters are open for registration right now. You can continue with the base membership.</p>}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24">
            <div className="hidden sm:block"><LiveCard caption="" /></div>
            <div className="panel p-6">
            <h2 className="text-lg font-bold">Summary</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Base branch membership</dt>
                <dd className="font-medium">₹{baseFee}</dd>
              </div>
              {picked.map((c) => (
                <div key={c.id} className="flex justify-between text-muted">
                  <dt>{c.code}</dt>
                  <dd>₹{c.price}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
              <span className="font-semibold">Total</span>
              <span className="font-display text-3xl font-bold text-brand-navy">₹{total}</span>
            </div>
            <button type="button" onClick={handleCheckout} disabled={isSubmitting} className="btn btn-primary btn-lg mt-6 w-full">
              {isSubmitting && <Spinner />}
              Continue to payment
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </button>
            <Link href="/membership/profile" className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted hover:text-ink">
              <ArrowLeft className="h-4 w-4" /> Edit my details
            </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
