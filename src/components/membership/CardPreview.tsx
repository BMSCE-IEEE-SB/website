'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { chapters, departments } from '@/data/site';
import { loadPricing, type Pricing } from '@/lib/pricing';
import { useSession } from '@/lib/useSession';
import { saveDraft } from './Draft';
import MembershipCard from '@/components/site/MembershipCard';
import Tilt from '@/components/site/Tilt';
import AnimatedNumber from '@/components/site/AnimatedNumber';
import { cn } from '@/lib/utils';

const included = ['IEEE global student membership', 'BMSCE branch events and workshops', 'Member-only competition discounts', 'Your digital membership card'];

/** Pricing summary plus a "try your card" preview. Chapters are picked later, in step 3. */
export default function CardPreview() {
  const router = useRouter();
  const { user } = useSession();
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');

  useEffect(() => {
    loadPricing()
      .then(setPricing)
      .catch((e: Error) => setError(e.message));
  }, []);

  const prices = pricing?.chapters.map((c) => c.price) ?? [];
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;

  const start = () => {
    saveDraft({ name: name.trim() || undefined, department: department || undefined, year: year || undefined });
    router.push(user ? '/membership/profile' : '/membership/register');
  };

  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-2">
      {/* Price summary */}
      <div className="grain relative flex flex-col justify-between overflow-hidden rounded-[32px] bg-ink p-7 text-white sm:p-9">
        <div aria-hidden className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-sky/20 blur-3xl" />
        <div className="relative">
          <p className="text-sm text-white/60">Base membership</p>
          {error ? (
            <p className="mt-3 text-sm text-red-200">{error}</p>
          ) : (
            <p className="display mt-2 text-7xl">
              ₹{pricing ? <AnimatedNumber value={pricing.baseFee} /> : '—'}
            </p>
          )}
          <p className="mt-1 text-sm text-white/60">one-time for the academic year</p>
          <ul className="mt-7 space-y-3">
            {included.map((i) => (
              <li key={i} className="flex items-center gap-3 text-white/85">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-orange">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {i}
              </li>
            ))}
          </ul>
          <dl className="mt-9 grid grid-cols-3 gap-4 border-t border-white/10 pt-7">
            {[
              ['400K+', 'IEEE members'],
              ['6', 'chapters'],
              ['50+', 'events a year'],
            ].map(([v, l]) => (
              <div key={l}>
                <dd className="display text-3xl text-white">{v}</dd>
                <dt className="mt-1 text-xs text-white/55">{l}</dt>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative mt-9 rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10">
          <p className="font-semibold">
            Chapters are optional add-ons{pricing && prices.length ? `, ₹${min}${max !== min ? `–₹${max}` : ''} each` : ''}
          </p>
          <p className="mt-1 text-sm text-white/60">You choose them in step 3, after adding your details. We suggest ones that fit your department.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {chapters.map((c) => (
              <Link key={c.slug} href={`/chapters/${c.slug}`} className="rounded-full px-3 py-1 text-xs font-bold transition-transform hover:-translate-y-0.5" style={{ background: c.color }}>
                {c.code}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Try your card */}
      <div className="panel flex flex-col p-7 sm:p-9">
        <div className="flex items-center gap-2 text-sm font-semibold text-brand-orange">
          <Sparkles className="h-4 w-4" /> Try your card
        </div>
        <h3 className="mt-2 text-2xl font-bold text-ink">This is what you&apos;ll carry</h3>

        <div className="mt-6">
          <Tilt className="rounded-[22px]" max={10}>
            <MembershipCard data={{ name: name || undefined, department, year, status: 'verified' }} />
          </Tilt>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="preview-name" className="field-label">Your name</label>
            <input id="preview-name" className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Type to see it on the card" />
          </div>
          <div>
            <label htmlFor="preview-dept" className="field-label">Department</label>
            <select id="preview-dept" className="input" value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">Select</option>
              {departments.map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="field-label">Year</span>
            <div className="grid grid-cols-4 gap-1.5">
              {['1', '2', '3', '4'].map((y) => (
                <button
                  key={y}
                  type="button"
                  aria-pressed={year === y}
                  onClick={() => setYear(year === y ? '' : y)}
                  className={cn('rounded-xl py-3 text-sm font-semibold transition-all', year === y ? 'bg-ink text-white' : 'bg-paper text-ink-soft hover:bg-paper-2')}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button type="button" onClick={start} className="btn btn-primary btn-lg mt-7 w-full">
          {user ? 'Continue with this card' : 'Start registration with this card'} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
