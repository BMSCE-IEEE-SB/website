'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import FeeSlip from './FeeSlip';
import { loadPricing, type Pricing } from '@/lib/pricing';
import { useSession } from '@/lib/useSession';

export default function PricingBreakdown() {
  const { user } = useSession();
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPricing()
      .then(setPricing)
      .catch((e: Error) => setError(e.message));
  }, []);

  const prices = pricing?.chapters.map((c) => c.price) ?? [];
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;

  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
      {/* Price as a fee slip */}
      <div className="flex items-center justify-center py-4">
        <FeeSlip baseFee={pricing?.baseFee} minChapter={prices.length ? min : undefined} maxChapter={prices.length ? max : undefined} error={error} />
      </div>

      {/* Enrollment details & CTA */}
      <div className="panel flex flex-col justify-between p-7 sm:p-9">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-orange">
            <Sparkles className="h-4 w-4" /> Simple & transparent
          </div>
          <h3 className="mt-2 text-2xl font-bold text-ink">Ready to join BMSCE IEEE?</h3>
          <p className="mt-3 text-ink-soft">
            Registration takes about 5 minutes. Everything is verified directly by the branch executive team.
          </p>

          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-paper text-brand-navy">
                <CheckCircle2 className="h-4 w-4 text-brand-orange" />
              </span>
              <div>
                <h4 className="text-sm font-semibold text-ink">One annual fee</h4>
                <p className="mt-0.5 text-xs text-muted">Covers global IEEE dues, BMSCE branch membership, and official welcome kit.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-paper text-brand-navy">
                <Zap className="h-4 w-4 text-brand-orange" />
              </span>
              <div>
                <h4 className="text-sm font-semibold text-ink">Pick your chapters</h4>
                <p className="mt-0.5 text-xs text-muted">Add CS, PES, PELS/IES, WIE or SSIT based on your engineering interests.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-paper text-brand-navy">
                <ShieldCheck className="h-4 w-4 text-brand-orange" />
              </span>
              <div>
                <h4 className="text-sm font-semibold text-ink">Instant UPI & fast verification</h4>
                <p className="mt-0.5 text-xs text-muted">Scan to pay with any UPI app and submit your reference for 2–3 day verification.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-line pt-6">
          <Link
            href={user ? '/membership/profile' : '/membership/register'}
            className="btn btn-primary btn-lg w-full justify-center"
          >
            {user ? 'Continue registration' : 'Start registration'} <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-center text-xs text-muted">
            Already applied?{' '}
            <Link href="/login" className="font-semibold text-brand-navy underline hover:text-brand-orange">
              Sign in to Member Portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
