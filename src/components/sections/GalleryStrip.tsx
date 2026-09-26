'use client';
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import Link from 'next/link';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { ArrowRight } from 'lucide-react';
import { gallery } from '@/data/site';
import Marquee from '@/components/site/Marquee';
import Reveal from '@/components/site/Reveal';
import { SectionLabel } from '@/components/site/BrandShapes';

const rowA = gallery.filter((_, i) => i % 2 === 0);
const rowB = gallery.filter((_, i) => i % 2 === 1);

export default function GalleryStrip() {
  const [index, setIndex] = useState(-1);

  const tile = (p: (typeof gallery)[number], wide: boolean) => (
    <button
      key={p.src}
      type="button"
      onClick={() => setIndex(gallery.indexOf(p))}
      className={`group relative mx-2 h-52 shrink-0 overflow-hidden rounded-[22px] sm:h-64 ${wide ? 'w-80 sm:w-[26rem]' : 'w-56 sm:w-72'}`}
      aria-label={`Open photo: ${p.alt}`}
    >
      <img src={p.src} alt={p.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
      <span className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/80 via-transparent to-transparent p-4 text-left text-sm font-semibold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        {p.title}
      </span>
    </button>
  );

  return (
    <section id="gallery" className="overflow-hidden bg-white py-24 sm:py-32">
      <div className="container-page flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <Reveal>
            <SectionLabel index="04">Gallery</SectionLabel>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="section-title mt-6">Proof we don&apos;t just talk</h2>
          </Reveal>
        </div>
        <Reveal delay={120}>
          <Link href="/gallery" className="btn btn-dark btn-lg">
            Open the full gallery <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>

      <div className="mt-14 space-y-4">
        <Marquee duration={60}>{rowA.map((p, i) => tile(p, i % 3 === 0))}</Marquee>
        <Marquee duration={70} reverse>
          {rowB.map((p, i) => tile(p, i % 3 === 1))}
        </Marquee>
      </div>

      <Lightbox open={index >= 0} index={index} close={() => setIndex(-1)} slides={gallery.map((p) => ({ src: p.full, alt: p.alt }))} />
    </section>
  );
}
