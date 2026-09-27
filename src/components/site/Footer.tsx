import Image from 'next/image';
import Link from 'next/link';
import { BRANCH, chapters, contactInfo, socialLinks } from '@/data/site';
import SocialIcon from './SocialIcon';
import { BrandDots } from './BrandShapes';

const columns = [
  {
    title: 'Explore',
    links: [
      { label: 'About', href: '/#about' },
      { label: 'Gallery', href: '/gallery' },
      { label: 'Team', href: '/#team' },
      { label: 'Contact', href: '/#contact' },
    ],
  },
  {
    title: 'Chapters',
    links: chapters.map((c) => ({ label: c.name, href: `/chapters/${c.slug}` })),
  },
  {
    title: 'Membership',
    links: [
      { label: 'Become a member', href: '/membership' },
      { label: 'Member portal', href: '/login' },
      { label: 'Privacy policy', href: '/privacy' },
      { label: 'Terms of membership', href: '/terms' },
      { label: 'Refund policy', href: '/refund' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-night text-white/70">
      <div className="container-page pt-20 pb-10">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="inline-flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
              <Image src="/brand/college-logo.png" alt="B.M.S. College of Engineering" width={2132} height={2132} className="h-10 w-10 object-contain" />
              <Image src="/brand/logo.png" alt="BMSCE IEEE" width={816} height={334} className="h-9 w-auto" />
            </div>
            <p className="mt-6 max-w-sm text-sm leading-relaxed">
              The IEEE Student Branch of {BRANCH.college}, Bengaluru. Branch {BRANCH.branchCode} · {BRANCH.region} · {BRANCH.section}.
            </p>
            <div className="mt-6 space-y-1.5 text-sm">
              <a href={`mailto:${contactInfo.email}`} className="block hover:text-white">{contactInfo.email}</a>
              <a href={`tel:${contactInfo.phone.replace(/\s/g, '')}`} className="block hover:text-white">{contactInfo.phone}</a>
              <p>{contactInfo.address}</p>
            </div>
            <div className="mt-6 flex items-center gap-2">
              {socialLinks.map((s) => (
                <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/70 transition-all hover:-translate-y-0.5 hover:bg-brand-orange hover:text-white">
                  <SocialIcon name={s.key} />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-8">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-semibold text-white">{col.title}</h3>
                <ul className="mt-4 space-y-3 text-sm">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="transition-colors hover:text-white">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p aria-hidden className="display mt-20 text-center text-[13vw] leading-[0.8] whitespace-nowrap text-white/[0.05] select-none xl:text-[11rem]">
          BMSCE IEEE
        </p>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-xs sm:flex-row sm:items-center">
          <p className="flex items-center gap-3">
            <BrandDots /> © {new Date().getFullYear()} {BRANCH.name}. Operates under IEEE bylaws.
          </p>
          <Link href="/admin/login" className="text-white/40 hover:text-white">Executive login</Link>
        </div>
      </div>
    </footer>
  );
}
