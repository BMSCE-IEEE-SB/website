'use client';
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { gallery, type GalleryCategory } from '@/data/site';
import Reveal from '@/components/site/Reveal';

const filters: { value: 'all' | GalleryCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'hackathon', label: 'Hackathons' },
  { value: 'workshop', label: 'Workshops' },
  { value: 'summit', label: 'Summits' },
  { value: 'student-life', label: 'Student life' },
];

const PAGE = 12;

export default function GalleryGrid() {
  const [filter, setFilter] = useState<'all' | GalleryCategory>('all');
  const [limit, setLimit] = useState(PAGE);
  const [index, setIndex] = useState(-1);

  const photos = useMemo(() => (filter === 'all' ? gallery : gallery.filter((p) => p.category === filter)), [filter]);
  const shown = photos.slice(0, limit);

  return (
    <div>
      <div>
        <Reveal className="flex justify-start">
          <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div role="tablist" aria-label="Filter photos" className="inline-flex gap-1 rounded-full bg-white p-1">
              {filters.map((f) => (
                <button
                  key={f.value}
                  role="tab"
                  type="button"
                  aria-selected={filter === f.value}
                  onClick={() => {
                    setFilter(f.value);
                    setLimit(PAGE);
                  }}
                  className="tab"
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="mt-10 columns-2 gap-3 sm:gap-4 lg:columns-3">
          {shown.map((p, i) => (
            <button
              key={p.src + i}
              type="button"
              onClick={() => setIndex(i)}
              className="group relative mb-3 block w-full overflow-hidden rounded-3xl bg-white sm:mb-4"
              aria-label={`Open photo: ${p.alt}`}
            >
              <img
                src={p.src}
                alt={p.alt}
                loading="lazy"
                className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${i % 3 === 0 ? 'aspect-[4/5]' : 'aspect-[4/3]'}`}
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-4 pt-10 text-left text-sm font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {p.title}
              </span>
            </button>
          ))}
        </div>

        {photos.length > limit && (
          <div className="mt-8 text-center">
            <button type="button" onClick={() => setLimit((l) => l + PAGE)} className="btn btn-dark">
              Show more photos
            </button>
          </div>
        )}

        <Lightbox
          open={index >= 0}
          index={index}
          close={() => setIndex(-1)}
          slides={shown.map((p) => ({ src: p.full, alt: p.alt, title: p.title }))}
        />
      </div>
    </div>
  );
}
