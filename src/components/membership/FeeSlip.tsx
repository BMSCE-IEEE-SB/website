'use client';

import Link from 'next/link';
import { chapters } from '@/data/site';
import AnimatedNumber from '@/components/site/AnimatedNumber';

const lines = ['IEEE student membership (global)', 'BMSCE branch membership', 'Workshops & branch activities', 'Digital member card'];

// Fixed pattern so server and browser render the same barcode.
const BARS = [3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1, 1, 2, 2, 1, 3, 1, 2, 1, 1, 2, 3, 1, 2];

function Stamp() {
  return (
    <svg viewBox="0 0 120 120" className="h-20 w-20 sm:h-28 sm:w-28" aria-hidden>
      <defs>
        <path id="stamp-circle" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
      </defs>
      <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="60" cy="60" r="36" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text fill="currentColor" fontSize="10" fontWeight="700" fontFamily="var(--font-mono)">
        {/* textLength spreads the text evenly around the whole circle (2πr ≈ 289). */}
        <textPath href="#stamp-circle" textLength="285" lengthAdjust="spacing">
          BMSCE IEEE · BRANCH 06261 ·
        </textPath>
      </text>
      <text x="60" y="57" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="800" fontFamily="var(--font-display)">
        2026
      </text>
      <text x="60" y="71" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="700" letterSpacing="1" fontFamily="var(--font-mono)">
        –27
      </text>
    </svg>
  );
}

/** The base price as a printed fee slip: itemised, stamped, with a torn edge. */
export default function FeeSlip({ baseFee, minChapter, maxChapter, error }: { baseFee?: number; minChapter?: number; maxChapter?: number; error?: string }) {
  const range = minChapter && maxChapter ? (minChapter === maxChapter ? `₹${minChapter}` : `₹${minChapter}–${maxChapter}`) : '';

  return (
    <div className="group relative mx-auto w-full max-w-[440px] -rotate-[1.5deg] transition-transform duration-500 hover:rotate-0">
      <div
        className="relative bg-white px-7 pt-8 pb-12 font-mono text-[13px] text-ink shadow-[0_30px_60px_-30px_rgb(11_27_51/0.45)] sm:px-9"
        style={{
          // Torn / zig-zag bottom edge
          mask: 'conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / 16px 100%',
          WebkitMask: 'conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / 16px 100%',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-lg font-extrabold tracking-tight" style={{ fontStretch: '115%' }}>
              <span className="text-brand-orange">BMSCE</span> <span className="text-brand-navy">IEEE</span>
            </p>
            <p className="mt-0.5 text-[11px] text-muted">Student Branch 06261 · Bengaluru</p>
          </div>
          <p className="text-right text-[11px] leading-tight text-muted">
            FEE SLIP
            <br />
            AY 2026–27
          </p>
        </div>

        <div className="my-5 border-t border-dashed border-ink/25" />

        <ul className="space-y-2.5">
          {lines.map((l) => (
            <li key={l} className="flex items-baseline gap-2">
              <span>{l}</span>
              <span className="flex-1 translate-y-[-3px] border-b border-dotted border-ink/25" />
              <span className="text-muted">incl.</span>
            </li>
          ))}
        </ul>

        <div className="my-5 border-t border-dashed border-ink/25" />

        <div className="relative flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-muted">TOTAL · ONE-TIME</p>
            {error ? (
              <p className="mt-2 font-sans text-sm text-red-600">{error}</p>
            ) : (
              <p className="display mt-1 text-6xl text-ink">
                ₹{baseFee ? <AnimatedNumber value={baseFee} /> : '—'}
              </p>
            )}
          </div>
          <div className="pointer-events-none absolute -top-2 right-[-14px] -rotate-12 sm:-top-8 sm:right-[-10px] text-brand-orange/80 mix-blend-multiply transition-transform duration-500 group-hover:rotate-0">
            <Stamp />
          </div>
        </div>

        <div className="my-5 border-t border-dashed border-ink/25" />

        <p className="flex items-baseline gap-2">
          <span>+ Chapters (optional)</span>
          <span className="flex-1 translate-y-[-3px] border-b border-dotted border-ink/25" />
          <span>{range ? `${range} ea.` : '—'}</span>
        </p>
        <p className="mt-1.5 font-sans text-xs text-muted">Picked in step 3, after your details.</p>
        <div className="mt-3 flex flex-wrap gap-1.5 font-sans">
          {chapters.map((c) => (
            <Link key={c.slug} href={`/chapters/${c.slug}`} className="rounded-md px-2 py-0.5 text-[11px] font-bold text-white transition-transform hover:-translate-y-0.5" style={{ background: c.color }}>
              {c.code}
            </Link>
          ))}
        </div>

        <div className="mt-7 flex items-end justify-between gap-6">
          <div className="flex h-10 items-end gap-[2px]" aria-hidden>
            {BARS.map((w, i) => (
              <span key={i} className="h-full bg-ink" style={{ width: w }} />
            ))}
          </div>
          <p className="text-right text-[10px] leading-tight text-muted">
            Pay via UPI
            <br />
            at step 4
          </p>
        </div>
      </div>
    </div>
  );
}
