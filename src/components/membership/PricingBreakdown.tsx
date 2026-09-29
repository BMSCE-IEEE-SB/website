'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import FeeSlip from './FeeSlip';
import { SectionLabel } from '@/components/site/BrandShapes';
import Reveal from '@/components/site/Reveal';
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
  const paidPrices = prices.filter((p) => p > 0);
  const min = paidPrices.length ? Math.min(...paidPrices) : 0;
  const max = paidPrices.length ? Math.max(...paidPrices) : 0;

  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
      {/* Left side: Section header & registration CTA */}
      <Reveal>
        <SectionLabel index="02">Pricing</SectionLabel>
        <h2 className="section-title mt-6">One simple price</h2>
        <p className="lead mt-4 max-w-xl">
          Pay once for the year. Add chapters in registration, with an official branch T-shirt and global IEEE benefits included.
        </p>

        <ul className="mt-8 space-y-3.5 text-sm text-ink-soft">
          <li className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-orange" />
            <span>IEEE global student credentials & network</span>
          </li>
          <li className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-orange" />
            <span>CS, WIE & SC chapters included at no extra cost</span>
          </li>
          <li className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-orange" />
            <span>Official BMSCE IEEE branch T-shirt & welcome kit</span>
          </li>
        </ul>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href={user ? '/membership/profile' : '/membership/register'}
            className="btn btn-primary btn-lg"
          >
            {user ? 'Continue registration' : 'Start registration'} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/login" className="btn btn-ghost btn-lg bg-white/60">
            Sign in to Member Portal
          </Link>
        </div>
      </Reveal>

      {/* Right side: Fee slip receipt */}
      <Reveal delay={100} className="flex items-center justify-center py-4">
        <FeeSlip
          baseFee={pricing?.baseFee}
          minChapter={paidPrices.length ? min : undefined}
          maxChapter={paidPrices.length ? max : undefined}
          error={error}
        />
      </Reveal>
    </div>
  );
}
