'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, X } from 'lucide-react';
import { loadAnnouncement, type Announcement } from '@/lib/auth';
import { isSafeLink } from '@/lib/server/input';

const DISMISS_KEY = 'bmsce_announcement_dismissed';

export default function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    let alive = true;
    loadAnnouncement()
      .then((a) => {
        if (!alive || !a?.is_active || !a.message) return;
        // Stay dismissed until the admin publishes a different message.
        if (sessionStorage.getItem(DISMISS_KEY) === a.message) return;
        setAnnouncement(a);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!announcement) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, announcement.message);
    setAnnouncement(null);
  };

  const safeLink = isSafeLink(announcement.link_url) ? announcement.link_url : null;
  const isExternal = safeLink?.startsWith('https://');

  return (
    <aside className="relative z-[51] bg-night text-white">
      <div className="container-page flex items-center gap-3 py-2.5 text-[13px] sm:justify-center">
        <span className="hidden h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-brand-orange sm:block" />
        <p className="min-w-0 flex-1 text-white/85 sm:flex-none">
          {announcement.message}
          {safeLink && (
            <Link
              href={safeLink}
              {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="ml-2 inline-flex items-center gap-1 font-semibold whitespace-nowrap text-white underline-offset-4 hover:underline"
            >
              Learn more <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </p>
        <button type="button" onClick={dismiss} className="-mr-1 shrink-0 rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Dismiss announcement">
          <X className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
