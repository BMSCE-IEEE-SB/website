'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { isDemoMode, supabase } from '@/lib/supabase';
import { DEFAULT_ANNOUNCEMENT, getAdminUser, loadAnnouncement, saveLocalAnnouncement, type Announcement } from '@/lib/auth';
import AdminNav from '@/components/admin/AdminNav';
import { Alert, Field, Input, PageLoader, Spinner } from '@/components/ui/form';
import { cn, errorMessage } from '@/lib/utils';

export default function AdminAnnouncementPage() {
  const router = useRouter();
  const demo = isDemoMode();
  const [adminEmail, setAdminEmail] = useState('');
  const [message, setMessage] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const admin = await getAdminUser().catch(() => null);
      if (!admin) {
        router.replace('/admin/login');
        return;
      }
      setAdminEmail(admin.email);
      const a = (await loadAnnouncement().catch(() => null)) ?? DEFAULT_ANNOUNCEMENT;
      setMessage(a.message);
      setLinkUrl(a.link_url ?? '');
      setIsActive(a.is_active);
      setIsLoading(false);
    })();
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const url = linkUrl.trim();
    if (url && !url.startsWith('/') && !/^https:\/\//.test(url)) {
      setStatus({ tone: 'error', text: 'Links must start with / (a page on this site) or https://.' });
      return;
    }
    setIsSaving(true);
    setStatus(null);
    const payload: Announcement = { message: message.trim(), link_url: url || undefined, is_active: isActive, updated_at: new Date().toISOString() };
    try {
      if (demo) {
        saveLocalAnnouncement(payload);
      } else {
        const { error } = await supabase.from('announcement').upsert({ id: 1, ...payload, link_url: payload.link_url ?? null });
        if (error) throw error;
      }
      setStatus({ tone: 'success', text: 'Saved. Visitors will see the change on their next page load.' });
    } catch (err) {
      setStatus({ tone: 'error', text: errorMessage(err, 'Could not save the announcement.') });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <AdminNav current="announcement" adminEmail={adminEmail} demo={demo} />

      <div className="container-page max-w-3xl py-10 sm:py-12">
        <h1 className="text-2xl font-bold sm:text-3xl">Announcement Banner</h1>
        <p className="mt-1 text-sm text-muted">The banner appears at the very top of every page across the website.</p>

      <div className="mt-8">
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Preview</p>
        {isActive ? (
          <div className="rounded-2xl bg-night px-4 py-3 text-center text-[13px] text-white/85">
            {message || 'Your announcement text'}
            {linkUrl && (
              <span className="ml-2 inline-flex items-center gap-1 font-semibold text-white">
                Learn more <ArrowRight className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-white px-4 py-3 text-center text-sm text-muted italic">The banner is hidden.</div>
        )}
      </div>

      <form onSubmit={handleSave} className="panel mt-8 space-y-6 p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-ink">Show banner</p>
            <p className="text-sm text-muted">Turn this off to hide it without losing the text.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() => setIsActive((v) => !v)}
            className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors', isActive ? 'bg-emerald-500' : 'bg-line')}
          >
            <span className={cn('absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform', isActive && 'translate-x-5')} />
            <span className="sr-only">Show banner</span>
          </button>
        </div>

        <Field label="Message" htmlFor="message" required hint={`${message.length}/160 characters`}>
          <textarea id="message" required rows={3} maxLength={160} value={message} onChange={(e) => setMessage(e.target.value)} className="input resize-none" />
        </Field>
        <Field label="Link" htmlFor="link" optional hint="A page on this site (e.g. /membership) or a full https:// address.">
          <Input id="link" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="/membership" />
        </Field>

        {status && <Alert tone={status.tone}>{status.text}</Alert>}

        <button type="submit" disabled={isSaving} className="btn btn-primary btn-lg w-full">
          {isSaving && <Spinner />} Save and publish
        </button>
      </form>
      </div>
    </div>
  );
}
