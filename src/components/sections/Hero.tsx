'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import NetworkCanvas from '@/components/site/NetworkCanvas';

const WORDS = [
  'build',
  'lead',
  'compete',
  'publish',
  'mentor',
  'belong',
];

function RotatingWord() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    // Do not rotate words if the user prefers reduced motion.
    if (reduceMotion) {
      return;
    }

    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % WORDS.length);
    }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, [reduceMotion]);

  return (
    <motion.span
      layout
      transition={{
        layout: {
          duration: 0.35,
          ease: 'easeOut',
        },
      }}
      className="relative inline-flex flex-col overflow-hidden px-2 align-baseline text-brand-orange"
    >
      {/* Invisible word keeps the container width stable */}
      <span
        className="invisible select-none whitespace-nowrap"
        aria-hidden="true"
      >
        {WORDS[index]}
      </span>

      {WORDS.map((word, wordIndex) => {
        const isActive = wordIndex === index;
        const isBefore = wordIndex < index;

        return (
          <motion.span
            key={word}
            className="absolute inset-0 flex items-center justify-center whitespace-nowrap"
            initial={false}
            animate={{
              y: isActive ? '0%' : isBefore ? '-100%' : '100%',
              opacity: isActive ? 1 : 0,
              scale: isActive ? 1 : 0.8,
            }}
            transition={{
              type: 'spring',
              stiffness: 220,
              damping: 26,
            }}
            aria-hidden={!isActive}
          >
            {word}
          </motion.span>
        );
      })}
    </motion.span>
  );
}

export default function Hero() {
  return (
    <section
      className="
        relative
        -mt-16
        overflow-hidden
        pt-16
        lg:-mt-[76px]
        lg:pt-[76px]
      "
    >
      {/* Background gradient decorations */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 overflow-hidden"
      >
        <div
          className="
            absolute
            right-0
            top-0
            h-[620px]
            w-[620px]
            translate-x-1/4
            -translate-y-1/4
            rounded-full
            bg-brand-sky/15
            blur-3xl
          "
        />

        <div
          className="
            absolute
            bottom-0
            left-0
            h-[420px]
            w-[420px]
            -translate-x-1/3
            rounded-full
            bg-brand-orange/12
            blur-3xl
          "
        />
      </div>

      {/* Animated network background */}
      <NetworkCanvas
        className="
          absolute
          inset-0
          -z-10
          h-full
          w-full
          opacity-70
        "
      />

      {/* Main hero content */}
      <div
        className="
          container-page
          grid
          items-center
          gap-16
          pt-10
          pb-24
          sm:pt-14
          lg:gap-8
          lg:pt-16
          lg:pb-28
        "
      >
        <div className="mx-auto max-w-2xl lg:text-center">

          {/* Membership announcement */}
          <motion.div
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.6,
            }}
          >
            <Link
              href="/membership"
              className="
                group
                inline-flex
                items-center
                gap-2.5
                rounded-full
                bg-white/80
                py-1.5
                pr-4
                pl-1.5
                text-sm
                text-ink-soft
                shadow-sm
                ring-1
                ring-ink/5
                backdrop-blur
                transition
                hover:bg-white
              "
            >
              <span
                className="
                  relative
                  flex
                  h-6
                  items-center
                  rounded-full
                  bg-brand-orange
                  px-2.5
                  text-xs
                  font-semibold
                  text-white
                "
              >
                <span
                  className="
                    absolute
                    -top-0.5
                    -right-0.5
                    h-2
                    w-2
                    animate-ping
                    rounded-full
                    bg-brand-orange
                  "
                  aria-hidden="true"
                />

                Open
              </span>

              <span>Membership drive 2026</span>

              <ArrowRight
                className="
                  h-3.5
                  w-3.5
                  transition-transform
                  group-hover:translate-x-0.5
                "
                aria-hidden="true"
              />
            </Link>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{
              opacity: 0,
              y: 24,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
              delay: 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="
              display
              mt-8
              text-[3.1rem]
              text-ink
              sm:text-7xl
              lg:text-[5.6rem]
            "
          >
            Engineers

            <br className="lg:hidden" />

            {' '}who{' '}

            <RotatingWord />

            <br />

            <span className="relative inline-block">
              together

              {/* Animated underline */}
              <svg
                aria-hidden="true"
                viewBox="0 0 300 14"
                className="
                  absolute
                  -bottom-2
                  left-0
                  h-3
                  w-full
                  text-brand-sky
                "
                preserveAspectRatio="none"
              >
                <motion.path
                  d="M3 10 C 70 3, 160 2, 297 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  initial={{
                    pathLength: 0,
                  }}
                  animate={{
                    pathLength: 1,
                  }}
                  transition={{
                    duration: 1.1,
                    delay: 0.7,
                    ease: 'easeInOut',
                  }}
                />
              </svg>
            </span>

            <span className="text-brand-orange">.</span>
          </motion.h1>

          {/* CTA buttons */}
          <motion.div
            initial={{
              opacity: 0,
              y: 16,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.7,
              delay: 0.35,
            }}
            className="
              mt-9
              flex
              flex-col
              justify-center
              gap-3
              sm:flex-row
            "
          >
            <Link
              href="/membership"
              className="btn btn-primary btn-lg"
            >
              <span>Become a member</span>

              <ArrowRight
                className="h-4 w-4"
                aria-hidden="true"
              />
            </Link>

            <Link
              href="/#chapters"
              className="
                btn
                btn-ghost
                btn-lg
                bg-white/50
                backdrop-blur
              "
            >
              Explore chapters
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
