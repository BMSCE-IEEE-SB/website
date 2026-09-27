'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ChevronDown, LogOut, Menu, User, X } from 'lucide-react';
import { chapters, navItems } from '@/data/site';
import { clearUserSession } from '@/lib/auth';
import { useSession } from '@/lib/useSession';
import { cn } from '@/lib/utils';

function initialsOf(name?: string, email?: string) {
  const src = name || email || '?';
  return src
    .split(/[\s.@_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, name } = useSession();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menu, setMenu] = useState<'chapters' | 'account' | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const isAdmin = pathname?.startsWith('/admin');
  const isHome = pathname === '/';
  // Only pages with a light hero start with a see-through header.
  const transparentTop = pathname === '/' || pathname === '/membership';

  // Solid background once scrolled; slide away when scrolling down, back when scrolling up.
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      setHidden(y > 320 && y > last + 4);
      if (y < last - 4 || y < 320) setHidden(false);
      last = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Highlight the section currently in view on the home page.
  useEffect(() => {
    if (!isHome) return;
    const els = navItems.map((n) => document.getElementById(n.id)).filter((el): el is HTMLElement => Boolean(el));
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.25, 0.5] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [isHome]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(null);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const close = () => {
    setOpen(false);
    setMenu(null);
  };

  const signOut = async () => {
    close();
    await clearUserSession();
    router.push('/');
  };

  const signedIn = Boolean(user);

  return (
    <header
      ref={headerRef}
      className={cn(
        'sticky top-0 z-50 transition-[transform,background-color,box-shadow] duration-300',
        hidden && !open && !menu ? '-translate-y-full' : 'translate-y-0',
        scrolled || open || !transparentTop ? 'bg-paper/85 shadow-[0_1px_0_rgb(11_27_51/0.06),0_10px_30px_-20px_rgb(11_27_51/0.35)] backdrop-blur-xl' : 'bg-transparent',
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-6 lg:h-[76px]">
        <Link href="/" onClick={close} className="flex shrink-0 items-center gap-2" aria-label="BMSCE IEEE home">
          <Image src="/brand/college-logo.png" alt="B.M.S. College of Engineering" width={2132} height={2132} className="h-8 w-8 object-contain lg:h-9 lg:w-9" />
          <Image src="/brand/logo.png" alt="BMSCE IEEE" width={816} height={334} preload loading="eager" className="h-9 w-auto lg:h-10" />
        </Link>

        {!isAdmin && (
          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
            {navItems.map((item) =>
              item.id === 'chapters' ? (
                <div key={item.id} className="relative" onMouseEnter={() => setMenu('chapters')} onMouseLeave={() => setMenu((m) => (m === 'chapters' ? null : m))}>
                  <button
                    type="button"
                    aria-expanded={menu === 'chapters'}
                    onClick={() => setMenu((m) => (m === 'chapters' ? null : 'chapters'))}
                    className={cn(
                      'flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:text-ink',
                      active === 'chapters' || pathname?.startsWith('/chapters') ? 'text-ink' : 'text-ink-soft',
                    )}
                  >
                    Chapters <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', menu === 'chapters' && 'rotate-180')} />
                  </button>
                  <AnimatePresence>
                    {menu === 'chapters' && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        className="absolute top-full left-1/2 w-[560px] -translate-x-1/2 pt-3"
                      >
                        <div className="grid grid-cols-2 gap-1 rounded-3xl bg-white p-3 shadow-[0_24px_60px_-20px_rgb(11_27_51/0.35)] ring-1 ring-ink/5">
                          {chapters.map((c) => {
                            const Icon = c.icon;
                            return (
                              <Link key={c.slug} href={`/chapters/${c.slug}`} onClick={close} className="group flex min-h-16 items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-paper">
                                {c.logo ? (
                                  <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-lg bg-white p-1 ring-1 ring-ink/5">
                                    <Image src={c.logo} alt="" aria-hidden width={100} height={60} className="max-h-8 w-full object-contain transition-transform group-hover:scale-110" />
                                  </span>
                                ) : (
                                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition-transform group-hover:scale-110" style={{ background: c.color }}>
                                    <Icon className="h-4.5 w-4.5" />
                                  </span>
                                )}
                                <span className="min-w-0 text-sm leading-snug font-semibold text-ink">{c.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:text-ink',
                    active === item.id || pathname === item.href ? 'text-ink' : 'text-ink-soft',
                  )}
                >
                  {item.label}
                  {(active === item.id || pathname === item.href) && (
                    <motion.span layoutId="nav-dot" className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand-orange" />
                  )}
                </Link>
              ),
            )}
          </nav>
        )}

        <div className="hidden items-center gap-2 lg:flex">
          {isAdmin ? (
            <Link href="/" className="btn btn-ghost">Back to site</Link>
          ) : (
            <>
              {user === undefined ? (
                <span className="h-10 w-24" />
              ) : signedIn ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenu((m) => (m === 'account' ? null : 'account'))}
                    aria-expanded={menu === 'account'}
                    className="flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm font-medium text-ink ring-1 ring-ink/10 transition hover:bg-white"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-navy text-xs font-semibold text-white">{initialsOf(name, user?.email)}</span>
                    <span className="max-w-[120px] truncate">{name?.split(' ')[0] || 'My account'}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted" />
                  </button>
                  <AnimatePresence>
                    {menu === 'account' && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.16 }}
                        className="absolute top-full right-0 mt-2 w-60 rounded-2xl bg-white p-2 shadow-[0_24px_60px_-20px_rgb(11_27_51/0.35)] ring-1 ring-ink/5"
                      >
                        <p className="truncate px-3 pt-2 pb-3 text-xs text-muted">{user?.email}</p>
                        <Link href="/account" onClick={close} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-paper">
                          <User className="h-4 w-4" /> Member portal
                        </Link>
                        <button type="button" onClick={signOut} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50">
                          <LogOut className="h-4 w-4" /> Sign out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link href="/login" className="btn text-ink-soft hover:text-ink">Member portal</Link>
              )}
              {!signedIn && (
                <Link href="/membership" className="btn btn-primary">
                  Become a member <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          className="-mr-2 rounded-full p-2.5 text-ink hover:bg-white lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto bg-paper lg:hidden"
          >
            <nav className="container-page flex flex-col pt-2 pb-10" aria-label="Mobile">
              {!isAdmin &&
                navItems.map((item, i) => (
                  <motion.div key={item.href} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
                    <Link href={item.href} onClick={close} className="flex items-center justify-between border-b border-line py-4 font-display text-3xl font-extrabold text-ink" style={{ fontStretch: '110%' }}>
                      {item.label}
                      <ArrowRight className="h-5 w-5 text-muted" />
                    </Link>
                    {item.id === 'chapters' && (
                      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-3">
                        {chapters.map((c) => (
                          <Link key={c.slug} href={`/chapters/${c.slug}`} onClick={close} className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-white" style={{ background: c.color }}>
                            {c.code}
                          </Link>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              <div className="mt-8 flex flex-col gap-3">
                {signedIn ? (
                  <>
                    <Link href="/account" onClick={close} className="btn btn-dark btn-lg w-full">
                      <User className="h-4 w-4" /> Member portal
                    </Link>
                    <button type="button" onClick={signOut} className="btn btn-ghost btn-lg w-full text-red-600">
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/membership" onClick={close} className="btn btn-primary btn-lg w-full">
                      Become a member <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href="/login" onClick={close} className="btn btn-ghost btn-lg w-full">
                      Member portal sign in
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
