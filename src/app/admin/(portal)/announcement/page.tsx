'use client';

import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { isDemoMode } from '@/lib/supabase';
import { DEFAULT_ANNOUNCEMENT, loadAnnouncement, saveLocalAnnouncement, type Announcement } from '@/lib/auth';
import { useAdmin } from '@/components/admin/AdminContext';
import { logActivity } from '@/lib/admin';
import { Alert, Field, Input, PageLoader, Spinner } from '@/components/ui/form';
import { cn, errorMessage } from '@/lib/utils';
import { adminFetch } from '@/lib/admin-api';
import { isSafeLink } from '@/lib/server/input';

export default function AdminAnnouncementPage() {
  const demo = isDemoMode();
  const { admin } = useAdmin();
  const [message, setMessage] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const a = (await loadAnnouncement().catch(() => null)) ?? DEFAULT_ANNOUNCEMENT;
      setMessage(a.message);
      setLinkUrl(a.link_url ?? '');
      setIsActive(a.is_active);
      setIsLoading(false);
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const url = linkUrl.trim();
    if (url && !isSafeLink(url)) {
      setStatus({ tone: 'error', text: 'Use a same-site path or a valid https:// address.' });
      return;
    }
    setIsSaving(true);
    setStatus(null);
    const payload: Announcement = { message: message.trim(), link_url: url || undefined, is_active: isActive, updated_at: new Date().toISOString() };
    try {
      if (demo) {
        saveLocalAnnouncement(payload);
      } else {
        const response = await adminFetch('/api/admin/announcement', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, link_url: payload.link_url ?? null }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not save announcement.');
      }
      await logActivity(admin, 'updated the announcement', payload.is_active ? 'banner on' : 'banner off', payload.message.slice(0, 120));
      setStatus({ tone: 'success', text: 'Saved. Visitors will see the change on their next page load.' });
    } catch (err) {
      setStatus({ tone: 'error', text: errorMessage(err, 'Could not save the announcement.') });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <PageLoader />;

  return (
    <div className="max-w-3xl pb-10">
      <h1 className="display text-4xl text-ink sm:text-5xl">Announcement</h1>
      <p className="mt-2 text-sm text-muted">The banner appears at the very top of every page.</p>

      <div className="mt-8">
        <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Preview</p>
        {isActive ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-brand-navy px-4 py-2.5 text-center text-xs font-medium text-white shadow-sm sm:text-sm">
            <span>{message || 'Announcement message goes here…'}</span>
            {linkUrl && <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-70" />}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line p-4 text-center text-xs text-muted">The banner is hidden.</div>
        )}
      </div>

      <form onSubmit={handleSave} className="mt-8 space-y-6">
        {status && <Alert tone={status.tone}>{status.text}</Alert>}

        <Field label="Status" htmlFor="announcement-status">
          <div id="announcement-status" className="flex gap-3">
            {[
              { val: true, label: 'Enabled · visible to visitors' },
              { val: false, label: 'Disabled · hidden' },
            ].map((opt) => (
              <label
                key={String(opt.val)}
                className={cn(
                  'flex flex-1 cursor-pointer items-center justify-center rounded-xl border p-3.5 text-sm font-semibold transition-all',
                  isActive === opt.val ? 'border-brand-orange bg-brand-orange/5 text-brand-orange shadow-sm' : 'border-line text-muted hover:border-ink/20'
                )}
              >
                <input type="radio" name="isActive" checked={isActive === opt.val} onChange={() => setIsActive(opt.val)} className="sr-only" />
                {opt.label}
              </label>
            ))}
          </div>
        </Field>

        <Field label="Banner message" htmlFor="announcement-message" hint="Keep it short: one clear sentence.">
          <Input id="announcement-message" value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={160} placeholder="Membership Drive 2026 is live…" />
        </Field>

        <Field label="Target link (optional)" htmlFor="announcement-link" hint="Use an internal path like /membership or a full https:// URL.">
          <Input id="announcement-link" type="text" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="/membership" />
        </Field>

        <div className="flex items-center justify-end gap-3 pt-4">
          <button type="submit" disabled={isSaving} className="btn btn-primary">
            {isSaving ? <Spinner className="h-4 w-4" /> : null}
            Save announcement
          </button>
        </div>
      </form>
    </div>
  );
}
