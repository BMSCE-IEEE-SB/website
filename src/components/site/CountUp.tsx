'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';

/** Animates the numeric part of values like "1,000+" or "₹250" when scrolled into view. */
export default function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const reduce = useReducedMotion();
  const match = value.match(/^(\D*)([\d,]+)(.*)$/);
  const target = match ? Number(match[2].replace(/,/g, '')) : 0;
  const hasNumber = Boolean(match);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView || !hasNumber || reduce) return;
    const controls = animate(0, target, { duration: 1.6, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setN(Math.round(v)) });
    return () => controls.stop();
  }, [inView, target, reduce, hasNumber]);

  const shown = reduce ? target : n;
  if (!match) return <span className={className}>{value}</span>;
  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{value}</span>
      <span aria-hidden>
        {match[1]}
        {shown.toLocaleString('en-US')}
        {match[3]}
      </span>
    </span>
  );
}
