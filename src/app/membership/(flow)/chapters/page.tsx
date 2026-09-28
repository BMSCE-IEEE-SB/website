'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, Plus, Shirt, X } from 'lucide-react';
import { getCurrentUser, getLocalProfile, hasPaidCookie, hasUserSubmittedPayment } from '@/lib/auth';
import { isDemoMode, supabase } from '@/lib/supabase';
import { chapters as chapterInfo, departments } from '@/data/site';
import { loadPricing } from '@/lib/pricing';
import AnimatedNumber from '@/components/site/AnimatedNumber';
import { Alert, PageLoader, Spinner, Modal } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { CART_KEYS, type CartChapter } from '@/lib/cart';

const TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] as const;

const infoFor = (code: string) =>
  chapterInfo.find(
    (c) =>
      c.code === code ||
      (c.code === 'PES & SC' && (code === 'PES' || code === 'SC')) ||
      (c.code === 'PELS/IES' && (code === 'PELS' || code === 'IES'))
  );

export default function ChaptersPage() {
  const router = useRouter();
  const demo = isDemoMode();
  const [chapters, setChapters] = useState<CartChapter[]>([]);
  const [baseFee, setBaseFee] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [tshirtSize, setTshirtSize] = useState('');
  const [sizeError, setSizeError] = useState(false);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [department, setDepartment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    if (hasPaidCookie()) {
      router.replace('/account');
      return;
    }

    const onPageShow = (e: PageTransitionEvent) => {
      if (hasPaidCookie()) {
        router.replace('/account');
      }
    };
    window.addEventListener('pageshow', onPageShow);

    (async () => {
      const paid = await hasUserSubmittedPayment();
      if (!alive) return;
      if (paid) {
        router.replace('/account');
        return;
      }

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
      if (demo) {
        const p = getLocalProfile(user.id);
        if (p?.department) setDepartment(p.department);
      } else {
        const { data: p } = await supabase.from('profiles').select('department').eq('id', user.id).maybeSingle();
        if (p?.department) setDepartment(p.department);
      }
      // Restore the selection and T-shirt size if the student came back from checkout.
      const freeIds = list.filter((c) => c.price === 0).map((c) => c.id);
      try {
        const prev: CartChapter[] = JSON.parse(sessionStorage.getItem(CART_KEYS.chapters) || '[]');
        const prevIds = prev.map((c) => c.id).filter((id) => list.some((c) => c.id === id));
        freeIds.forEach((fid) => {
          if (!prevIds.includes(fid)) prevIds.push(fid);
        });
        setSelected(prevIds);
        const savedSize = sessionStorage.getItem(CART_KEYS.tshirtSize);
        if (savedSize) setTshirtSize(savedSize);
      } catch {
        setSelected(freeIds);
      }
      setIsLoading(false);
    })();
    return () => {
      alive = false;
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [router]);

  const deptLabel = departments.find(([code]) => code === department)?.[1];

  const ordered = chapters;
  const picked = useMemo(() => selected.map((id) => chapters.find((c) => c.id === id)).filter((c): c is CartChapter => Boolean(c)), [selected, chapters]);
  const total = baseFee + picked.reduce((s, c) => s + c.price, 0);

  const toggle = (id: string) => {
    const chapter = chapters.find((c) => c.id === id);
    if (chapter && chapter.price === 0) return;
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSelectSize = (size: string) => {
    setTshirtSize(size);
    setSizeError(false);
    sessionStorage.setItem(CART_KEYS.tshirtSize, size);
  };

  const handleCheckout = () => {
    if (!tshirtSize) {
      setSizeError(true);
      const el = document.getElementById('tshirt-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSizeError(false);
    setIsSubmitting(true);
    const prev = sessionStorage.getItem(CART_KEYS.chapters);
    const prevSize = sessionStorage.getItem(CART_KEYS.tshirtSize);
    const nextCart = JSON.stringify(picked);
    // A changed cart or size means a changed order configuration.
    if (prev !== nextCart || prevSize !== tshirtSize) sessionStorage.removeItem(CART_KEYS.orderRef);
    sessionStorage.setItem(CART_KEYS.chapters, nextCart);
    sessionStorage.setItem(CART_KEYS.baseFee, String(baseFee));
    sessionStorage.setItem(CART_KEYS.tshirtSize, tshirtSize);
    router.push('/membership/checkout');
  };

  if (isLoading) return <PageLoader />;

  if (error) return <Alert tone="error" className="mx-auto max-w-xl">{error}</Alert>;

  return (
    <div className="mx-auto max-w-6xl pb-28 lg:pb-0">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <h1 className="display text-4xl text-ink sm:text-5xl">Pick your chapters</h1>
          <p className="lead mt-3 max-w-xl">Base membership is already included. Add any communities you want, as many as you like.</p>
        </div>
      </div>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {/* Free T-Shirt with Base Membership */}
          <div
            id="tshirt-section"
            className={cn(
              'relative overflow-hidden rounded-[26px] bg-white p-6 transition-all duration-300',
              sizeError
                ? 'shadow-[0_0_0_2px_#ef4444,0_20px_40px_-24px_rgba(239,68,68,0.3)] ring-2 ring-red-500/20'
                : 'shadow-[0_1px_2px_rgb(11_27_51/0.05)] ring-1 ring-ink/5'
            )}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3.5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-orange/10 text-brand-orange">
                  <Shirt className="h-6 w-6" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-ink">Official BMSCE IEEE T-Shirt</h2>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/20">
                      FREE with base membership
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs sm:text-sm text-muted">
                    Every member receives our official annual branch T-shirt at no extra cost. Pick your size below.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSizeChartOpen(true)}
                className="inline-flex cursor-pointer items-center self-start rounded-full bg-paper px-3 py-1 text-xs font-semibold text-brand-navy transition hover:bg-sky-50 sm:self-auto"
              >
                View size chart
              </button>
            </div>

            <div className="mt-5 border-t border-line pt-5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted">
                  Select T-Shirt Size <span className="text-red-500">*</span>
                </label>
                {tshirtSize ? (
                  <span className="text-xs font-semibold text-brand-navy">
                    Selected: <span className="rounded bg-sky-50 px-1.5 py-0.5 font-bold">{tshirtSize}</span>
                  </span>
                ) : (
                  <span className={cn('text-xs font-medium', sizeError ? 'text-red-500 font-semibold' : 'text-muted')}>
                    Required for membership kit
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2.5">
                {TSHIRT_SIZES.map((size) => {
                  const active = tshirtSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleSelectSize(size)}
                      className={cn(
                        'flex h-11 min-w-[52px] cursor-pointer items-center justify-center rounded-xl px-4 text-sm font-semibold transition-all duration-200',
                        active
                          ? 'bg-brand-navy text-white shadow-md shadow-brand-navy/25 scale-[1.03]'
                          : 'bg-paper text-ink hover:bg-line/70 hover:text-ink'
                      )}
                      aria-pressed={active}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>

              {sizeError && (
                <p className="mt-2 text-xs font-medium text-red-500">
                  Please pick your T-shirt size before proceeding to payment.
                </p>
              )}
            </div>
          </div>

          <motion.ul layout className="grid gap-4 sm:grid-cols-2">
            {ordered.map((c) => {
              const info = infoFor(c.code);
              const on = selected.includes(c.id);
              const color = c.code === 'SC' ? '#14b8a6' : (info?.color ?? '#0b1b33');
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
                      aria-label={`${on ? 'Remove' : 'Add'} ${c.name}, ₹${c.price}`}
                      className="absolute inset-0 z-10 cursor-pointer rounded-[26px]"
                    />
                    <div className="relative h-28 overflow-hidden bg-white">
                      {info && <img src={info.logo || info.image} alt="" loading="lazy" className="h-full w-full object-contain p-6 transition-transform duration-700 group-hover:scale-110" />}
                      <div className="absolute inset-0 transition-opacity duration-300 pointer-events-none" style={{ background: `linear-gradient(to top, ${color} 5%, ${color}99 60%, ${color}40)`, opacity: on ? 1 : 0.85 }} />
                      <span className="absolute bottom-3 left-4 text-xs font-bold tracking-widest text-white/90">{c.code}</span>
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-bold leading-snug text-ink">{c.name}</h3>
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
                            <p className="mt-4 border-t border-line pt-4 text-xs sm:text-sm leading-relaxed text-ink-soft">
                              {info.comingSoon ? info.description : `${info.tagline}. ${info.description}`}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="font-display text-lg font-bold" style={{ color: on ? color : undefined }}>{c.price === 0 ? 'Included' : `+ ₹${c.price}`}</span>
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
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24">
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
              <li className="flex items-center justify-between text-ink-soft">
                <span className="flex items-center gap-2">
                  <Shirt className="h-3.5 w-3.5 text-brand-orange" />
                  Official IEEE T-Shirt {tshirtSize && <span className="font-mono text-xs font-bold text-ink">({tshirtSize})</span>}
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">FREE</span>
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
                      {c.price === 0 ? (
                        <span className="text-xs font-bold text-emerald-700">Included</span>
                      ) : (
                        <>
                          ₹{c.price}
                          <button type="button" onClick={() => toggle(c.id)} className="rounded-full p-0.5 text-muted hover:bg-paper hover:text-ink" aria-label={`Remove ${c.code}`}>
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            {sizeError && (
              <p className="mt-3 text-xs font-medium text-red-500">
                Please select your T-shirt size above.
              </p>
            )}
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
            <p className="text-xs text-muted">
              {picked.length ? `${picked.length} chapter${picked.length > 1 ? 's' : ''} + base` : 'Base membership'}
              {tshirtSize ? ` · Shirt: ${tshirtSize}` : ''}
            </p>
            <p className="display text-2xl text-ink">
              ₹<AnimatedNumber value={total} />
            </p>
          </div>
          <button type="button" onClick={handleCheckout} disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting && <Spinner />} Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {sizeChartOpen && (
        <Modal title="T-Shirt Size Chart (Inches)" onClose={() => setSizeChartOpen(false)} wide>
          <div className="mt-4 overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-paper text-xs font-bold uppercase text-muted">
                <tr>
                  <th className="p-3">Size</th>
                  <th className="p-3">XS (34)</th>
                  <th className="p-3">S (36)</th>
                  <th className="p-3">M (38)</th>
                  <th className="p-3">L (40)</th>
                  <th className="p-3">XL (42)</th>
                  <th className="p-3 whitespace-nowrap">2XL (44)</th>
                  <th className="p-3 whitespace-nowrap">3XL (46)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium text-ink">
                <tr>
                  <td className="p-3 font-bold text-muted">Chest</td>
                  <td className="p-3">34</td>
                  <td className="p-3">36</td>
                  <td className="p-3">38</td>
                  <td className="p-3">40</td>
                  <td className="p-3">42</td>
                  <td className="p-3">44</td>
                  <td className="p-3">46</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-muted">Length</td>
                  <td className="p-3">24</td>
                  <td className="p-3">25</td>
                  <td className="p-3">26</td>
                  <td className="p-3">27</td>
                  <td className="p-3">28</td>
                  <td className="p-3">29</td>
                  <td className="p-3">30</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-muted whitespace-nowrap">Sleeve length</td>
                  <td className="p-3">7.5</td>
                  <td className="p-3">8</td>
                  <td className="p-3">8</td>
                  <td className="p-3">8.5</td>
                  <td className="p-3">8.5</td>
                  <td className="p-3">9</td>
                  <td className="p-3">10</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-muted">Shoulder</td>
                  <td className="p-3">15.5</td>
                  <td className="p-3">16</td>
                  <td className="p-3">17</td>
                  <td className="p-3">17.5</td>
                  <td className="p-3">18</td>
                  <td className="p-3">19</td>
                  <td className="p-3">20</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  );
}
