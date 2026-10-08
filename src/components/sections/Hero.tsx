'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import NetworkCanvas from '@/components/site/NetworkCanvas';

const MEMBERSHIP_OPEN = false; // flip to true when the drive reopens

// ...WORDS and RotatingWord unchanged from your original...

export default function Hero() {
  return (
    <section className="relative -mt-16 overflow-hidden pt-16 lg:-mt-[76px] lg:pt-[76px]">
      {/* background + NetworkCanvas unchanged */}

      <div className="container-page grid items-center gap-16 pt-10 pb-24 sm:pt-14 lg:gap-8 lg:pt-16 lg:pb-28">
        <div className="mx-auto max-w-2xl lg:text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {MEMBERSHIP_OPEN ? (
              <Link
                href="/membership"
                className="group inline-flex items-center gap-2.5 rounded-full bg-white/80 py-1.5 pr-4 pl-1.5 text-sm text-ink-soft shadow-sm ring-1 ring-ink/5 backdrop-blur transition hover:bg-white"
              >
                <span className="relative flex h-6 items-center rounded-full bg-brand-orange px-2.5 text-xs font-semibold text-white">
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 animate-ping rounded-full bg-brand-orange" />
                  Open
                </span>
                Membership drive 2026
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <div className="inline-flex items-center gap-2.5 rounded-full bg-white/80 py-1.5 pr-4 pl-1.5 text-sm text-ink-soft shadow-sm ring-1 ring-ink/5 backdrop-blur">
                <span className="flex h-6 items-center rounded-full bg-ink/10 px-2.5 text-xs font-semibold text-ink-soft">
                  Closed
                </span>
                Membership drive 2026
              </div>
            )}
          </motion.div>

          {/* h1 unchanged */}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"
          >
            {MEMBERSHIP_OPEN ? (
              <Link href="/membership" className="btn btn-primary btn-lg">
                Become a member <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <button type="button" disabled className="btn btn-primary btn-lg cursor-not-allowed opacity-60">
                Applications closed
              </button>
            )}
            <Link href="/#chapters" className="btn btn-ghost btn-lg bg-white/50 backdrop-blur">
              Explore chapters
            </Link>
          </motion.div>

          {!MEMBERSHIP_OPEN && (
            <p className="mt-4 text-sm text-ink-soft">
              The 2026 drive has ended. Follow us for the next intake.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
