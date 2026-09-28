/* eslint-disable @next/next/no-img-element */
import { execom } from '@/data/site';
import Reveal from '@/components/site/Reveal';
import SocialIcon from '@/components/site/SocialIcon';
import { SectionLabel } from '@/components/site/BrandShapes';

const tints = ['#f26625', '#00377e', '#18a4fe', '#7c3aed', '#059669'];

export default function Team() {
  return (
    <section id="team" className="py-24 sm:py-32">
      <div className="container-page">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <Reveal>
              <SectionLabel index="04">Executive committee</SectionLabel>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="section-title mt-6">The people running the show</h2>
            </Reveal>
          </div>
          <Reveal delay={120}>
            <p className="lead max-w-sm">Branch counselor, mentor and student leaders elected every year. Say hi on campus, or message them on LinkedIn.</p>
          </Reveal>
        </div>

        <ul className="no-scrollbar -mx-4 mt-14 flex snap-x scroll-px-4 gap-5 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:overflow-visible sm:px-0">
          {execom.map((m, i) => (
            <Reveal as="li" key={m.name} delay={i * 70} className="w-[64%] shrink-0 snap-start sm:w-auto">
              <div className="group relative aspect-[3/4] overflow-hidden rounded-[26px]" style={{ background: tints[i % tints.length] }}>
                <img src={m.photo} alt={m.name} loading="lazy" className="h-full w-full object-cover mix-blend-luminosity transition-all duration-700 group-hover:scale-105 group-hover:mix-blend-normal" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
                {m.linkedin && (
                  <a
                    href={m.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${m.name} on LinkedIn`}
                    className="absolute top-3 right-3 flex h-10 w-10 translate-y-0 items-center justify-center rounded-full bg-white text-brand-navy opacity-100 shadow-md transition-all hover:scale-110 sm:-translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:focus:translate-y-0 sm:focus:opacity-100"
                  >
                    <SocialIcon name="linkedin" className="h-4 w-4" />
                  </a>
                )}
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-white/85 uppercase"><span className="h-1.5 w-1.5 rounded-full bg-brand-orange" />{m.role}</p>
                  <h3 className="mt-1 text-xl leading-tight font-bold">{m.name}</h3>
                  {m.batch && <p className="mt-0.5 text-xs text-white/60">Class of {m.batch}</p>}
                </div>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
