'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import { departments } from '@/data/site';
import FeeSlip from './FeeSlip';
import { loadPricing, type Pricing } from '@/lib/pricing';
import { useSession } from '@/lib/useSession';
import { saveDraft } from './Draft';
import MembershipCard from '@/components/site/MembershipCard';
import Tilt from '@/components/site/Tilt';
import { cn } from '@/lib/utils';

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
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
      {/* Price as a fee slip */}
      <div className="flex items-center justify-center py-4">
        <FeeSlip baseFee={pricing?.baseFee} minChapter={prices.length ? min : undefined} maxChapter={prices.length ? max : undefined} error={error} />
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
