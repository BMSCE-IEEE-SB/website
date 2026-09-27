'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, DollarSign, Layers, Mail, Save, Send } from 'lucide-react';
import { isDemoMode, supabase } from '@/lib/supabase';
import {
  getAdminUser,
  loadAdminChapters,
  loadAdminSettings,
  saveAdminChapter,
  saveAdminSettings,
  type ChapterSetting,
  type MembershipSettings,
} from '@/lib/auth';
import AdminNav from '@/components/admin/AdminNav';
import { Alert, Field, Input, PageLoader, Spinner } from '@/components/ui/form';
import { cn, errorMessage } from '@/lib/utils';

export default function AdminSettingsPage() {
  const router = useRouter();
  const demo = isDemoMode();
  const [adminEmail, setAdminEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Drive settings
  const [settings, setSettings] = useState<MembershipSettings>({
    base_fee: 1810,
    payee_vpa: 'bmsceieee@okhdfcbank',
    payee_name: 'BMSCE IEEE Student Branch',
    drive_year: 2026,
    is_drive_open: true,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Chapter settings
  const [chapters, setChapters] = useState<ChapterSetting[]>([]);
  const [savingChapterId, setSavingChapterId] = useState<string | null>(null);

  // SMTP Diagnostics
  const [smtpStatus, setSmtpStatus] = useState<{ checked: boolean; ok?: boolean; message?: string } | null>(null);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTestMail, setIsSendingTestMail] = useState(false);

  const [toast, setToast] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const showToast = (tone: 'success' | 'error', text: string) => {
    setToast({ tone, text });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    (async () => {
      const admin = await getAdminUser().catch(() => null);
      if (!admin) {
        router.replace('/admin/login');
        return;
      }
      setAdminEmail(admin.email);
      try {
        const [loadedSettings, loadedChapters] = await Promise.all([
          loadAdminSettings(),
          loadAdminChapters(),
        ]);
        setSettings(loadedSettings);
        setChapters(loadedChapters);
      } catch (err) {
        showToast('error', `Failed to load settings: ${errorMessage(err)}`);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [router]);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await saveAdminSettings(settings);
      showToast('success', 'Membership drive configuration saved successfully.');
    } catch (err) {
      showToast('error', `Could not save settings: ${errorMessage(err)}`);
    } finally {
      setIsSavingSettings(false);
    }
  }

  async function handleSaveChapter(ch: ChapterSetting) {
    setSavingChapterId(ch.id);
    try {
      await saveAdminChapter(ch);
      showToast('success', `${ch.name} (${ch.code}) updated to ₹${ch.price}.`);
    } catch (err) {
      showToast('error', `Failed to update chapter: ${errorMessage(err)}`);
    } finally {
      setSavingChapterId(null);
    }
  }

  async function handleVerifySmtp() {
    setIsTestingSmtp(true);
    setSmtpStatus(null);
    try {
      const headers: Record<string, string> = {};
      if (!demo) {
        const { data } = await supabase.auth.getSession();
        if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`;
      }
      const res = await fetch('/api/send-receipt', { headers });
      const data = await res.json();
      if (!res.ok || !data.configured) {
        setSmtpStatus({ checked: true, ok: false, message: data.error || 'SMTP verification failed' });
        showToast('error', data.error || 'SMTP verification failed');
      } else {
        setSmtpStatus({ checked: true, ok: true, message: `Connected to ${data.host}:${data.port} as ${data.user}` });
        showToast('success', 'SMTP server connected and verified successfully!');
      }
    } catch (err) {
      const msg = errorMessage(err);
      setSmtpStatus({ checked: true, ok: false, message: msg });
      showToast('error', `SMTP test error: ${msg}`);
    } finally {
      setIsTestingSmtp(false);
    }
  }

  async function handleSendTestReceipt(e: React.FormEvent) {
    e.preventDefault();
    if (!testEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      showToast('error', 'Please enter a valid email address.');
      return;
    }
    setIsSendingTestMail(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (!demo) {
        const { data } = await supabase.auth.getSession();
        if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`;
      }
      const res = await fetch('/api/send-receipt', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: testEmail,
          name: 'Branch Executive Test',
          orderRef: 'TEST-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
          amount: settings.base_fee,
          chaptersList: ['Computer Society (Sample)'],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch test receipt.');
      }
      showToast('success', `Test receipt sent successfully to ${testEmail}!`);
    } catch (err) {
      showToast('error', `Failed to send test email: ${errorMessage(err)}`);
    } finally {
      setIsSendingTestMail(false);
    }
  }

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <AdminNav current="settings" adminEmail={adminEmail} demo={demo} />

      <div className="container-page max-w-4xl py-10 sm:py-12">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Pricing & Drive Settings</h1>
          <p className="mt-1 text-sm text-muted">
            Configure the annual membership base fee, UPI receiving details, and individual chapter add-on pricing.
          </p>
        </div>

        {/* 1. Base Fee & Payment Config */}
        <form onSubmit={handleSaveSettings} className="panel mt-8 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-brand-sky">
              <DollarSign className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Annual Membership Drive</h2>
              <p className="text-xs text-muted">Sitewide checkout base fee and UPI payee credentials</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Base Membership Fee (₹)" htmlFor="base_fee" required hint="Required fee for all new students.">
              <Input
                id="base_fee"
                type="number"
                min="0"
                step="1"
                required
                value={settings.base_fee}
                onChange={(e) => setSettings((s) => ({ ...s, base_fee: Number(e.target.value) }))}
              />
            </Field>

            <Field label="Drive Year" htmlFor="drive_year" required hint="The active calendar/academic year.">
              <Input
                id="drive_year"
                type="number"
                min="2020"
                max="2035"
                required
                value={settings.drive_year}
                onChange={(e) => setSettings((s) => ({ ...s, drive_year: Number(e.target.value) }))}
              />
            </Field>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Payee UPI VPA" htmlFor="payee_vpa" required hint="UPI address receiving membership payments.">
              <Input
                id="payee_vpa"
                type="text"
                required
                value={settings.payee_vpa}
                onChange={(e) => setSettings((s) => ({ ...s, payee_vpa: e.target.value.trim() }))}
                placeholder="bmsceieee@okhdfcbank"
              />
            </Field>

            <Field label="Payee Official Name" htmlFor="payee_name" required hint="Account holder name shown in UPI apps.">
              <Input
                id="payee_name"
                type="text"
                required
                value={settings.payee_name}
                onChange={(e) => setSettings((s) => ({ ...s, payee_name: e.target.value }))}
                placeholder="BMSCE IEEE Student Branch"
              />
            </Field>
          </div>

          <div className="border-t border-line pt-6">
            <h3 className="text-sm font-bold text-ink">Official Receipt Sign-Off (Treasurer)</h3>
            <p className="text-xs text-muted">Details printed on official student membership PDF receipts</p>
            <div className="mt-4 grid gap-6 sm:grid-cols-3">
              <Field label="Treasurer Full Name" htmlFor="treasurer_name" required>
                <Input
                  id="treasurer_name"
                  type="text"
                  required
                  value={settings.treasurer_name || ''}
                  onChange={(e) => setSettings((s) => ({ ...s, treasurer_name: e.target.value }))}
                  placeholder="Neha Ramiah"
                />
              </Field>

              <Field label="Designation" htmlFor="treasurer_role" required>
                <Input
                  id="treasurer_role"
                  type="text"
                  required
                  value={settings.treasurer_role || ''}
                  onChange={(e) => setSettings((s) => ({ ...s, treasurer_role: e.target.value }))}
                  placeholder="Treasurer and MDC"
                />
              </Field>

              <Field label="Contact Phone" htmlFor="treasurer_phone" required>
                <Input
                  id="treasurer_phone"
                  type="text"
                  required
                  value={settings.treasurer_phone || ''}
                  onChange={(e) => setSettings((s) => ({ ...s, treasurer_phone: e.target.value }))}
                  placeholder="+91 6385525264"
                />
              </Field>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              💡 Signature image can be uploaded to <code>public/brand/signature.png</code> to automatically appear above the name on all generated receipts.
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-line pt-6">
            <div>
              <p className="font-medium text-ink">Membership Drive Status</p>
              <p className="text-xs text-muted">Allow students to submit new registrations</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.is_drive_open}
              onClick={() => setSettings((s) => ({ ...s, is_drive_open: !s.is_drive_open }))}
              className={cn(
                'relative h-7 w-12 shrink-0 rounded-full transition-colors',
                settings.is_drive_open ? 'bg-emerald-500' : 'bg-line',
              )}
            >
              <span
                className={cn(
                  'block h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                  settings.is_drive_open ? 'translate-x-6' : 'translate-x-1',
                )}
              />
            </button>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={isSavingSettings} className="btn btn-dark">
              {isSavingSettings ? <Spinner /> : <Save className="h-4 w-4" />}
              Save Drive Settings
            </button>
          </div>
        </form>

        {/* 2. Technical Chapters Add-on Pricing */}
        <div className="panel mt-8 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-brand-orange">
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Society Chapters & Affinity Groups</h2>
              <p className="text-xs text-muted">Add-on fees for students opting into specific societies</p>
            </div>
          </div>

          <div className="mt-6 divide-y divide-line">
            {chapters.map((ch) => (
              <div key={ch.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-paper px-2 py-0.5 font-mono text-xs font-bold text-brand-navy">
                      {ch.code}
                    </span>
                    <p className="font-semibold text-ink">{ch.name}</p>
                  </div>
                  {ch.description && (
                    <p className="mt-1 line-clamp-1 text-xs text-muted">{ch.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 sm:shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted">Price: ₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="input w-24 py-1.5 text-center font-display font-semibold"
                      value={ch.price}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value));
                        setChapters((prev) =>
                          prev.map((item) => (item.id === ch.id ? { ...item, price: val } : item)),
                        );
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...ch, is_active: !ch.is_active };
                      setChapters((prev) =>
                        prev.map((item) => (item.id === ch.id ? updated : item)),
                      );
                      handleSaveChapter(updated);
                    }}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-semibold transition-colors',
                      ch.is_active
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-paper text-muted hover:bg-line',
                    )}
                  >
                    {ch.is_active ? 'Active' : 'Disabled'}
                  </button>

                  <button
                    type="button"
                    disabled={savingChapterId === ch.id}
                    onClick={() => handleSaveChapter(ch)}
                    className="btn btn-ghost px-3 py-1.5 text-xs"
                    title="Save chapter price"
                  >
                    {savingChapterId === ch.id ? <Spinner className="h-3 w-3" /> : <Save className="h-3.5 w-3.5" />}
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. SMTP & Transactional Email Settings */}
        <div className="panel mt-8 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Email SMTP Server & Receipt Dispatch</h2>
              <p className="text-xs text-muted">Test connection and verify transactional receipt emails</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex flex-col gap-3 rounded-xl border border-line bg-paper/50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">SMTP Server Connectivity</p>
                <p className="text-xs text-muted">Checks credentials, TLS handshake, and port connectivity</p>
                {smtpStatus && (
                  <p className={cn('mt-2 text-xs font-medium flex items-center gap-1.5', smtpStatus.ok ? 'text-emerald-600' : 'text-rose-600')}>
                    {smtpStatus.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                    {smtpStatus.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={isTestingSmtp}
                onClick={handleVerifySmtp}
                className="btn btn-outline shrink-0 text-xs"
              >
                {isTestingSmtp ? <Spinner className="h-3.5 w-3.5" /> : null}
                Test SMTP Connection
              </button>
            </div>

            <form onSubmit={handleSendTestReceipt} className="rounded-xl border border-line bg-paper/50 p-4">
              <p className="text-sm font-semibold text-ink">Send a Sample Receipt Email</p>
              <p className="text-xs text-muted">Dispatches a test membership confirmation receipt to verify inbox delivery</p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="email"
                  required
                  placeholder="your-email@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="input flex-1 py-1.5 text-sm"
                />
                <button
                  type="submit"
                  disabled={isSendingTestMail}
                  className="btn btn-dark shrink-0 text-xs"
                >
                  {isSendingTestMail ? <Spinner className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                  Send Test Email
                </button>
              </div>
            </form>
          </div>
        </div>

        {toast && (
          <div className="fixed inset-x-4 bottom-4 z-[70] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-sm">
            <Alert tone={toast.tone} className="shadow-xl">
              {toast.text}
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}
