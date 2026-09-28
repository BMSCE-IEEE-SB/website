import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { membershipBenefits } from '@/data/site';
import Reveal from '@/components/site/Reveal';

export default function Join() {
  return (
    <section id="membership" className="py-8 sm:py-12">
      <div className="container-page">
        <div className="grain relative overflow-hidden rounded-[40px] bg-brand-orange px-6 py-14 text-white sm:px-12 sm:py-20 lg:px-16">
          <div aria-hidden className="absolute inset-0">
            <div className="absolute -top-40 -right-20 h-[480px] w-[480px] rounded-full bg-white/15 blur-3xl" />
            <div className="absolute -bottom-48 -left-20 h-[380px] w-[380px] rounded-full bg-[#ff8a4c]/60 blur-3xl" />
          </div>

          <div className="relative grid items-center gap-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <p className="text-sm font-semibold tracking-[0.16em] text-white/80 uppercase">Membership 2026</p>
              <h2 className="display mt-4 text-5xl sm:text-6xl lg:text-7xl">Ready to build the future?</h2>
              <p className="mt-4 max-w-xl text-lg text-white/90">
                Join BMSCE IEEE to connect with a global community of innovators, work on real-world projects, and accelerate your engineering journey.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link href="/membership" className="btn btn-lg bg-ink text-white hover:-translate-y-0.5 hover:bg-night">
                  See plans & join <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/login" className="btn btn-outline-light btn-lg">
                  I&apos;m already a member
                </Link>
              </div>
            </Reveal>

            <Reveal delay={120} className="lg:col-span-5">
              <div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md sm:p-8">
                <h3 className="text-xl font-bold text-white">What you get</h3>
                <ul className="mt-5 space-y-3.5">
                  {membershipBenefits.map((b) => {
                    const [title, desc] = b.split(' – ');
                    return (
                      <li key={b} className="flex items-start gap-3 text-white/95 text-sm sm:text-base">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-brand-orange">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                        <span>
                          {desc ? (
                            <>
                              <strong className="font-semibold text-white">{title}</strong> — {desc}
                            </>
                          ) : (
                            b
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

