import { cn } from '@/lib/utils';

/** Infinite horizontal scroller. Children are rendered twice for a seamless loop. */
export default function Marquee({
  children,
  reverse,
  duration = 40,
  className,
  pauseOnHover = true,
}: {
  children: React.ReactNode;
  reverse?: boolean;
  duration?: number;
  className?: string;
  pauseOnHover?: boolean;
}) {
  return (
    <div className={cn('marquee-mask flex overflow-hidden', pauseOnHover && 'paused-on-hover', className)}>
      <div
        className={cn('flex w-max shrink-0', reverse ? 'animate-marquee-reverse' : 'animate-marquee')}
        style={{ '--marquee-duration': `${duration}s` } as React.CSSProperties}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
