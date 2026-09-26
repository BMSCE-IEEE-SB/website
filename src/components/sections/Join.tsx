import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { membershipBenefits } from '@/data/site';
import Reveal from '@/components/site/Reveal';
import Tilt from '@/components/site/Tilt';
import MembershipCard from '@/components/site/MembershipCard';

export default function Join() {
  return (
    <section id="membership" className="py-8 sm:py-12">
      <div className="container-page">
        <div className="grain relative overflow-hidden rounded-[40px] bg-brand-orange px-6 py-14 text-white sm:px-12 sm:py-20 lg:px-16">
          <div aria-hidden className="absolute inset-0">
            <div className="absolute -top-40 -right-20 h-[480px] w-[480px] rounded-full bg-white/15 blur-3xl" />
            <div className="absolute -bottom-48 -left-20 h-[380px] w-[380px] rounded-full bg-[#ff8a4c]/60 blur-3xl" />
          </div>

          <div className="relative grid items-center gap-14 lg:grid-cols-2">
            <Reveal>
              <p className="text-sm font-semibold tracking-[0.16em] text-white/80 uppercase">Membership 2026</p>
              <h2 className="display mt-4 text-5xl sm:text-6xl lg:text-7xl">Your card is waiting</h2>
              <ul className="mt-8 space-y-3">
                {membershipBenefits.slice(0, 4).map((b) => (
                  <li key={b} className="flex items-start gap-3 text-white/90">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-brand-orange">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link href="/membership" className="btn btn-lg bg-ink text-white hover:-translate-y-0.5 hover:bg-night">
                  See plans & join <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/login" className="btn btn-outline-light btn-lg">
                  I&apos;m already a member
                </Link>
              </div>
            </Reveal>

            <Reveal delay={120} className="mx-auto w-full max-w-md">
              <Tilt className="rounded-[22px]" max={12}>
                <MembershipCard data={{ name: 'You', usn: '1BM26CS000', department: 'Any branch', chapters: ['CS', 'RAS', 'WIE'], status: 'verified' }} />
              </Tilt>
              <p className="mt-5 text-center text-sm text-white/75">Move your cursor over the card.</p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
