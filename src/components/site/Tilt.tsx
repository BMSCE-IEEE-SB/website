'use client';

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';

/** Tilts its child towards the pointer, with a moving glare. */
export default function Tilt({ children, className, max = 10 }: { children: React.ReactNode; className?: string; max?: number }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const sx = useSpring(x, { stiffness: 160, damping: 18 });
  const sy = useSpring(y, { stiffness: 160, damping: 18 });
  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  const glareX = useTransform(sx, [0, 1], ['0%', '100%']);
  const glareY = useTransform(sy, [0, 1], ['0%', '100%']);
  const glare = useTransform([glareX, glareY], ([gx, gy]) => `radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,0.28), transparent 55%)`);

  return (
    <div
      className={className}
      style={{ perspective: 1000 }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType === 'touch') return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width);
        y.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        x.set(0.5);
        y.set(0.5);
      }}
    >
      <motion.div style={reduce ? undefined : { rotateX, rotateY, transformStyle: 'preserve-3d' }} className="relative">
        {children}
        {!reduce && <motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ background: glare }} />}
      </motion.div>
    </div>
  );
}
