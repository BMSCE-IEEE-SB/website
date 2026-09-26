'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, Plus, Sparkles, X } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { chapters as chapterInfo, departments, suggestedByDepartment } from '@/data/site';
import { loadPricing } from '@/lib/pricing';
import { LiveCard, readDraft, useDraft } from '@/components/membership/Draft';
import AnimatedNumber from '@/components/site/AnimatedNumber';
import { Alert, PageLoader, Spinner } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { CART_KEYS, type CartChapter } from '@/lib/cart';

const infoFor = (code: string) => chapterInfo.find((c) => c.code === code);

export default function ChaptersPage() {
  const router = useRouter();
  const { update } = useDraft();
  const [chapters, setChapters] = useState<CartChapter[]>([]);
  const [baseFee, setBaseFee] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [department, setDepartment] = useState('');
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
      setDepartment(readDraft().department ?? '');
      // Restore the selection if the student came back from checkout.
      try {
        const prev: CartChapter[] = JSON.parse(sessionStorage.getItem(CART_KEYS.chapters) || '[]');
        setSelected(prev.map((c) => c.id).filter((id) => list.some((c) => c.id === id)));
      } catch {}
      setIsLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  const suggested = useMemo(() => suggestedByDepartment[department] ?? [], [department]);
  const deptLabel = departments.find(([code]) => code === department)?.[1];

  // Suggested chapters first, then the rest in their usual order.
  const ordered = useMemo(
    () => [...chapters].sort((a, b) => Number(suggested.includes(b.code)) - Number(suggested.includes(a.code))),
    [chapters, suggested],
  );
  const picked = useMemo(() => selected.map((id) => chapters.find((c) => c.id === id)).filter((c): c is CartChapter => Boolean(c)), [selected, chapters]);
  const total = baseFee + picked.reduce((s, c) => s + c.price, 0);

  useEffect(() => {
    if (!isLoading) update({ chapters: picked.map((c) => c.code) });
  }, [picked, isLoading, update]);

  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const addSuggested = () => {
    const ids = chapters.filter((c) => suggested.includes(c.code)).map((c) => c.id);
    setSelected((prev) => [...prev, ...ids.filter((id) => !prev.includes(id))]);
  };

  const handleCheckout = () => {
    setIsSubmitting(true);
    const prev = sessionStorage.getItem(CART_KEYS.chapters);
    const nextCart = JSON.stringify(picked);
    // A changed cart means a changed amount, so it needs a fresh order reference.
    if (prev !== nextCart) sessionStorage.removeItem(CART_KEYS.orderRef);
    sessionStorage.setItem(CART_KEYS.chapters, nextCart);
    sessionStorage.setItem(CART_KEYS.baseFee, String(baseFee));
    router.push('/membership/checkout');
  };

  if (isLoading) return <PageLoader />;

  if (error) return <Alert tone="error" className="mx-auto max-w-xl">{error}</Alert>;

  const allSuggestedPicked = suggested.length > 0 && suggested.every((code) => picked.some((p) => p.code === code));

  return (
    <div className="mx-auto max-w-6xl pb-28 lg:pb-0">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <h1 className="display text-4xl text-ink sm:text-5xl">Pick your chapters</h1>
          <p className="lead mt-3 max-w-xl">Base membership is already included. Add any communities you want, as many as you like.</p>
        </div>
        {suggested.length > 0 && !allSuggestedPicked && (
          <motion.button
            type="button"
            onClick={addSuggested}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="group flex items-center gap-3 self-start rounded-2xl bg-white p-3 pr-4 text-left shadow-sm ring-1 ring-ink/5 transition hover:-translate-y-0.5 hover:shadow-md lg:self-auto"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange">
              <Sparkles className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">Add the picks for {department}</span>
              <span className="block text-xs text-muted">{suggested.join(' + ')}</span>
            </span>
          </motion.button>
        )}
      </div>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <motion.ul layout className="grid gap-4 sm:grid-cols-2">
          {ordered.map((c) => {
            const info = infoFor(c.code);
            const on = selected.includes(c.id);
            const isSuggested = suggested.includes(c.code);
            const color = info?.color ?? '#0b1b33';
            const Icon = info?.icon;
            return (
              <motion.li key={c.id} layout transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                <div
                  className={cn(
                    'group relative block w-full overflow-hidden rounded-[26px] bg-white text-left transition-all duration-300',
                    on ? 'shadow-[0_0_0_3px_var(--chapter),0_24px_40px_-24px_var(--chapter)]' : 'shadow-[0_1px_2px_rgb(11_27_51/0.05)] hover:-translate-y-1 hover:shadow-[0_20px_40px_-24px_rgb(11_27_51/0.35)]',
                  )}
                  style={{ '--chapter': color } as React.CSSProperties}
                >
                  {/* Whole tile toggles; the "Learn more" link sits above this layer. */}
                  <button
                    type="button"
                    onClick={() => toggle(c.id)}
                    aria-pressed={on}
                    aria-label={`${on ? 'Remove' : 'Add'} ${info?.name ?? c.name}, ₹${c.price}`}
                    className="absolute inset-0 z-10 cursor-pointer rounded-[26px]"
                  />
                  <div className="relative h-28 overflow-hidden">
                    {info && <img src={info.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />}
                    <div className="absolute inset-0 transition-opacity duration-300" style={{ background: `linear-gradient(to top, ${color} 5%, ${color}99 60%, ${color}40)`, opacity: on ? 1 : 0.85 }} />
                    <span className="absolute top-3 left-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur">
                      {Icon ? <Icon className="h-5 w-5" /> : c.code}
                    </span>
                    {isSuggested && (
                      <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-ink shadow-sm">
                        <Sparkles className="h-3 w-3 text-brand-orange" /> Suggested
                      </span>
                    )}
                    <span className="absolute bottom-3 left-4 text-xs font-bold tracking-widest text-white/90">{c.code}</span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-bold leading-snug text-ink">{info?.name ?? c.name}</h3>
                        <p className="mt-0.5 text-sm text-muted">{info?.tagline ?? c.name}</p>
                      </div>
                      <motion.span
                        animate={on ? { scale: [1, 1.25, 1], rotate: [0, -8, 0] } : { scale: 1 }}
                        transition={{ duration: 0.35 }}
                        className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors', on ? 'text-white' : 'bg-paper text-muted group-hover:text-ink')}
                        style={on ? { background: color } : undefined}
                      >
                        {on ? <Check className="h-4 w-4" strokeWidth={3} /> : <Plus className="h-4 w-4" />}
                      </motion.span>
                    </div>

                    <AnimatePresence initial={false}>
                      {on && info && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                          <ul className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm text-ink-soft">
                            {info.activities.slice(0, 3).map((a) => (
                              <li key={a} className="flex items-start gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
                                {a}
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-display text-lg font-bold" style={{ color: on ? color : undefined }}>+ ₹{c.price}</span>
                      {info && (
                        <Link href={`/chapters/${info.slug}`} target="_blank" className="relative z-20 text-xs font-semibold text-muted underline-offset-2 hover:text-ink hover:underline">
                          Learn more
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </motion.ul>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <div className="hidden sm:block">
            <LiveCard caption="Chapters you add appear on your card." />
          </div>
          <div className="panel p-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-bold">Your total</h2>
              <span className="display text-4xl text-brand-navy">
                ₹<AnimatedNumber value={total} />
              </span>
            </div>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-ink-soft">Base branch membership</span>
                <span className="font-medium">₹{baseFee}</span>
              </li>
              <AnimatePresence initial={false}>
                {picked.map((c) => (
                  <motion.li
                    key={c.id}
                    layout
                    initial={{ opacity: 0, x: -12, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, x: 12, height: 0 }}
                    className="flex items-center justify-between overflow-hidden"
                  >
                    <span className="flex items-center gap-2 text-ink-soft">
                      <span className="h-2 w-2 rounded-full" style={{ background: infoFor(c.code)?.color }} />
                      {c.code}
                    </span>
                    <span className="flex items-center gap-2">
                      ₹{c.price}
                      <button type="button" onClick={() => toggle(c.id)} className="rounded-full p-0.5 text-muted hover:bg-paper hover:text-ink" aria-label={`Remove ${c.code}`}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            {picked.length === 0 && <p className="mt-3 text-xs text-muted">No chapters yet. That&apos;s fine, you can continue with base membership.</p>}
            <button type="button" onClick={handleCheckout} disabled={isSubmitting} className="btn btn-primary btn-lg mt-6 hidden w-full lg:flex">
              {isSubmitting && <Spinner />}
              Continue to payment
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </button>
            <Link href="/membership/profile" className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted hover:text-ink">
              <ArrowLeft className="h-4 w-4" /> Edit my details{deptLabel ? ` (${department})` : ''}
            </Link>
          </div>
        </aside>
      </div>

      {/* Phone / tablet: sticky total bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">{picked.length ? `${picked.length} chapter${picked.length > 1 ? 's' : ''} + base` : 'Base membership'}</p>
            <p className="display text-2xl text-ink">
              ₹<AnimatedNumber value={total} />
            </p>
          </div>
          <button type="button" onClick={handleCheckout} disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting && <Spinner />} Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
