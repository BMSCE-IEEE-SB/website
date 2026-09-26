import { tickerItems } from '@/data/site';
import Marquee from '@/components/site/Marquee';

export default function Ticker() {
  return (
    <div className="relative z-10 overflow-hidden py-6">
    <div className="-mx-4 -rotate-1 bg-brand-orange py-4 text-white shadow-[0_20px_40px_-20px_rgb(242_102_37/0.7)] sm:py-5">
      <Marquee duration={45} pauseOnHover={false}>
        {tickerItems.map((t) => (
          <span key={t} className="flex items-center">
            <span className="display px-6 text-2xl whitespace-nowrap sm:text-3xl">{t}</span>
            <svg viewBox="0 0 20 20" className="h-4 w-4 text-white/70" aria-hidden>
              <path d="M10 1 L19 18 L1 18 Z" fill="currentColor" />
            </svg>
          </span>
        ))}
      </Marquee>
    </div>
    </div>
  );
}
