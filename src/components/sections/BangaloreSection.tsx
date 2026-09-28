import { ArrowUpRight, Compass, Globe2, Landmark } from 'lucide-react';
import Reveal from '@/components/site/Reveal';
import { Sails } from '@/components/site/BrandShapes';
import { BRANCH } from '@/data/site';

export default function BangaloreSection() {
  return (
    <section id="bangalore-section" className="py-12 sm:py-16">
      <div className="container-page">
        <div className="grain relative overflow-hidden rounded-[36px] bg-night px-6 py-12 text-white shadow-2xl sm:rounded-[44px] sm:px-12 sm:py-16 lg:px-16">
          {/* Ambient background glows and decorative sails */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 right-0 h-[450px] w-[450px] translate-x-1/4 -translate-y-1/4 rounded-full bg-brand-navy/60 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-[350px] w-[350px] -translate-x-1/4 translate-y-1/4 rounded-full bg-brand-orange/15 blur-3xl" />
            <Sails className="absolute -right-16 -bottom-16 h-[340px] w-[340px] animate-spin-slow opacity-[0.07]" />
          </div>

          <div className="relative grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <Reveal>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold tracking-wide text-brand-sky backdrop-blur">
                  <Compass className="h-3.5 w-3.5" />
                  <span>{BRANCH.region} · {BRANCH.section}</span>
                </div>
              </Reveal>

              <Reveal delay={80}>
                <h2 className="display mt-5 text-4xl text-white sm:text-5xl lg:text-6xl">
                  Part of IEEE Bangalore Section
                </h2>
              </Reveal>

              <Reveal delay={140}>
                <p className="lead mt-5 max-w-2xl text-white/80">
                  BMSCE IEEE Student Branch operates under the mentorship and active ecosystem of the IEEE Bangalore Section. Established in 1977, the section is one of the most vibrant technical hubs in Asia-Pacific, empowering student branches, global conferences, and humanitarian engineering initiatives across Karnataka.
                </p>
              </Reveal>

              <Reveal delay={200} className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="https://ieeebangalore.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-lg inline-flex items-center gap-2 group"
                >
                  Visit IEEE Bangalore Section
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </Reveal>
            </div>

            <div className="lg:col-span-5">
              <Reveal delay={160}>
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="flex items-start gap-4 rounded-2xl bg-white/5 p-4.5 ring-1 ring-white/10 backdrop-blur transition-colors hover:bg-white/[0.08]">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-sky/15 text-brand-sky">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Established in 1977</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-white/70">
                        Over four decades of technical leadership, standards, and professional community building.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-2xl bg-white/5 p-4.5 ring-1 ring-white/10 backdrop-blur transition-colors hover:bg-white/[0.08]">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-orange/20 text-brand-orange">
                      <Globe2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Region 10 (Asia-Pacific)</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-white/70">
                        Direct connection to prestigious conferences, student paper contests, and international recognitions.
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
