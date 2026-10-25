'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ExternalLink, Trophy } from 'lucide-react';
import Reveal from '@/components/site/Reveal';
import Countdown from '@/components/site/Countdown';
import { XTREME_20_REGISTRATION_END_UTC } from '@/lib/xtreme';

const facts = [
  '24-hour global coding competition — teams of 1–3 IEEE student members',
  '1st place wins a trip to the IEEE conference of your choice',
  'Every squad gets an assigned BMSCE faculty proctor',
];

export default function XtremeSpotlight() {
  return (
    <section id="ieeextreme" className="py-8 sm:py-12">
      <div className="container-page">
        <div className="grain relative overflow-hidden rounded-[40px] bg-brand-navy px-6 py-14 text-white sm:px-12 sm:py-20 lg:px-16">
          <div aria-hidden className="absolute inset-0">
            <div className="absolute -top-40 -right-20 h-[480px] w-[480px] rounded-full bg-brand-sky/25 blur-3xl" />
            <div className="absolute -bottom-48 -left-20 h-[380px] w-[380px] rounded-full bg-brand-orange/30 blur-3xl" />
            {/* Subtle logo watermark */}
            <div className="pointer-events-none absolute -right-16 -bottom-16 w-80 sm:w-96 lg:w-[460px] opacity-[0.07] select-none">
              <Image
                src="/ieeextreme/xtreme-logo-dark.png"
                alt=""
                width={826}
                height={439}
                className="h-auto w-full object-contain"
              />
            </div>
          </div>

          <div className="relative grid items-center gap-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <div className="mb-4 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 backdrop-blur-md">
                <Image
                  src="/ieeextreme/xtreme-logo-dark.png"
                  alt="IEEEXtreme Region 10"
                  width={80}
                  height={42}
                  className="h-4.5 w-auto object-contain"
                />
                <span className="h-3 w-px bg-white/20" aria-hidden="true" />
                <span className="text-xs font-semibold tracking-wider text-white/90 uppercase">
                  Region 10 · 31 October 2026
                </span>
              </div>
              <h2 className="display mt-2 text-5xl sm:text-6xl lg:text-7xl">24 hours. One leaderboard.</h2>
              <p className="mt-4 max-w-xl text-lg text-white/90">
                Join IEEE&apos;s flagship global programming competition. Form your squad of 1–3, get a campus proctor, and compete with thousands of teams worldwide.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link href="/ieeextreme/register" className="btn btn-lg bg-brand-orange text-white hover:-translate-y-0.5 hover:bg-[#e05a1f]">
                  Register your squad <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/ieeextreme" className="btn btn-outline-light btn-lg">
                  Explore the gateway
                </Link>
              </div>
              <a
                href="https://ieeextreme.org"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white"
              >
                Official rules & prizes at ieeextreme.org <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Reveal>

            <Reveal delay={120} className="lg:col-span-5">
              <div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md sm:p-8">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-brand-orange" />
                  <h3 className="text-xl font-bold text-white">Registration ends in</h3>
                </div>
                <div className="mt-5 flex justify-center">
                  <Countdown to={XTREME_20_REGISTRATION_END_UTC} light />
                </div>
                <p className="mt-3 text-center text-xs text-white/60">Closes 25 Oct 2026 · 23:59 UTC (05:29 IST, Oct 26)</p>
                <ul className="mt-5 space-y-3 border-t border-white/15 pt-5">
                  {facts.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-white/95">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-orange" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
