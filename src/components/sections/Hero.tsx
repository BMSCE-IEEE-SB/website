'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import NetworkCanvas from '@/components/site/NetworkCanvas';

const WORDS = ['build', 'lead', 'compete', 'publish', 'mentor', 'belong'];

function RotatingWord() {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setI((v) => (v + 1) % WORDS.length), 3000);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <motion.span
      layout
      transition={{ layout: { duration: 0.35, ease: 'easeOut' } }}
      className="relative inline-flex flex-col overflow-hidden text-brand-orange align-baseline px-2"
    >
      <span className="invisible select-none whitespace-nowrap" aria-hidden>
        {WORDS[i]}
      </span>
      {WORDS.map((w, index) => (
        <motion.span
          key={w}
          className="absolute inset-0 flex items-center justify-center whitespace-nowrap"
          initial={false}
          animate={{
            y: index === i ? '0%' : index < i ? '-100%' : '100%',
            opacity: index === i ? 1 : 0,
            scale: index === i ? 1 : 0.8,
          }}
          transition={{ type: 'spring', stiffness: 220, damping: 26 }}
          aria-hidden={index !== i}
        >
          {w}
        </motion.span>
      ))}
    </motion.span>
  );
}

export default function Hero() {
  return (
    <section className="relative -mt-16 overflow-hidden pt-16 lg:-mt-[76px] lg:pt-[76px]">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 h-[620px] w-[620px] translate-x-1/4 -translate-y-1/4 rounded-full bg-brand-sky/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[420px] w-[420px] -translate-x-1/3 rounded-full bg-brand-orange/12 blur-3xl" />
      </div>
      <NetworkCanvas className="absolute inset-0 -z-10 h-full w-full opacity-70" />

      <div className="container-page grid items-center gap-16 pt-10 pb-24 sm:pt-14 lg:gap-8 lg:pt-16 lg:pb-28">
        <div className="mx-auto max-w-2xl lg:text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
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
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="display mt-8 text-[3.1rem] text-ink sm:text-7xl lg:text-[5.6rem]"
          >
            Engineers <br className="lg:hidden" />
            who <RotatingWord />
            <br />
            <span className="relative">
              together
              <svg aria-hidden viewBox="0 0 300 14" className="absolute -bottom-2 left-0 h-3 w-full text-brand-sky" preserveAspectRatio="none">
                <motion.path
                  d="M3 10 C 70 3, 160 2, 297 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.1, delay: 0.7, ease: 'easeInOut' }}
                />
              </svg>
            </span>
            <span className="text-brand-orange">.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }} className="lead mx-auto mt-8 max-w-xl">
            The IEEE Student Branch of B.M.S. College of Engineering, Bengaluru. Six technical chapters and a
            community of 1,000+ students who make things.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.35 }} className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/membership" className="btn btn-primary btn-lg">
              Become a member <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/#chapters" className="btn btn-ghost btn-lg bg-white/50 backdrop-blur">
              Explore chapters
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
