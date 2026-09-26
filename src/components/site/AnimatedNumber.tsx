'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'motion/react';

/** Smoothly tweens between numeric values (e.g. a changing total). */
export default function AnimatedNumber({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    if (reduce) {
      from.current = value;
      return;
    }
    const c = animate(from.current, value, {
      duration: 0.5,
      ease: 'easeOut',
      onUpdate: (v) => {
        from.current = v;
        setShown(Math.round(v));
      },
    });
    return () => c.stop();
  }, [value, reduce]);

  return <>{(reduce ? value : shown).toLocaleString('en-IN')}</>;
}
