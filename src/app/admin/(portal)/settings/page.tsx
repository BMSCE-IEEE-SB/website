'use client';

import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { RotateCcw, Save } from 'lucide-react';
import { useAdmin } from '@/components/admin/AdminContext';
import { loadSettings, saveSettings, type Settings } from '@/lib/admin';
import { chapters as chapterInfo } from '@/data/site';
import FeeSlip from '@/components/membership/FeeSlip';
import { Alert, Modal, PageLoader, Spinner } from '@/components/ui/form';

const VPA_RE = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

export default function SettingsPage() {
  const { admin, reload, toast } = useAdmin();
  const [saved, setSaved] = useState<Settings | null>(null);
  const [draft, setDraft] = useState<Settings | null>(null);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadSettings()
      .then((s) => {
        setSaved(s);
        setDraft(s);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const changes = useMemo(() => {
    if (!saved || !draft) return [];
    const out: string[] = [];
    if (saved.baseFee !== draft.baseFee) out.push(`Base fee: ₹${saved.baseFee} → ₹${draft.baseFee}`);
    if (saved.vpa !== draft.vpa) out.push(`UPI ID: ${saved.vpa} → ${draft.vpa}`);
    if (saved.payeeName !== draft.payeeName) out.push(`Payee name: ${saved.payeeName} → ${draft.payeeName}`);
    if (saved.isDriveOpen !== draft.isDriveOpen) out.push(`Drive status: ${draft.isDriveOpen ? 'Open' : 'Closed'}`);
    if (saved.driveYear !== draft.driveYear) out.push(`Drive year: ${saved.driveYear} → ${draft.driveYear}`);
    if (saved.treasurerName !== draft.treasurerName) out.push(`Treasurer: ${saved.treasurerName} → ${draft.treasurerName}`);
    if (saved.treasurerRole !== draft.treasurerRole) out.push(`Treasurer role: ${saved.treasurerRole} → ${draft.treasurerRole}`);
    if (saved.treasurerPhone !== draft.treasurerPhone) out.push(`Treasurer phone: ${saved.treasurerPhone} → ${draft.treasurerPhone}`);
    draft.chapters.forEach((c) => {
      const before = saved.chapters.find((x) => x.id === c.id)?.price;
      if (before !== c.price) out.push(`${c.code}: ₹${before} → ₹${c.price}`);
    });
    return out;
  }, [saved, draft]);

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!draft || !saved) return <PageLoader />;

  const problems = [
    !(draft.baseFee > 0) && 'The base fee must be more than ₹0.',
    !VPA_RE.test(draft.vpa) && 'The UPI ID should look like name@bank.',
    !draft.payeeName.trim() && 'Add the payee name shown in UPI apps.',
    draft.chapters.some((c) => !(c.price >= 0)) && 'Chapter prices cannot be negative.',
    !draft.treasurerName?.trim() && 'Add the branch treasurer name for official receipts.',
    !draft.treasurerRole?.trim() && 'Add the treasurer designation / role.',
  ].filter(Boolean) as string[];

  const setChapterPrice = (id: string, price: number) => setDraft({ ...draft, chapters: draft.chapters.map((c) => (c.id === id ? { ...c, price } : c)) });
  const prices = draft.chapters.map((c) => c.price);

  const save = async () => {
    setBusy(true);
    try {
      await saveSettings({ ...draft, payeeName: draft.payeeName.trim(), vpa: draft.vpa.trim() }, admin);
      setSaved(draft);
      setConfirming(false);
      toast('success', 'Saved. New registrations will use these fees and payment details.');
      await reload();
    } catch (err) {
      toast('error', `Could not save: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const upiPreview = `upi://pay?pa=${encodeURIComponent(draft.vpa)}&pn=${encodeURIComponent(draft.payeeName)}&am=${draft.baseFee.toFixed(2)}&cu=INR&tn=PREVIEW`;

  return (
    <div className="pb-10">
      <h1 className="display text-4xl text-ink sm:text-5xl">Fees & payment</h1>
      <p className="mt-2 max-w-xl text-sm text-muted">Change what students pay and where the money goes. Applications that were already submitted keep their original amount.</p>

      <div className="mt-8 grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_440px] [&>*]:min-w-0">
        <div className="space-y-6">
          <section className="panel p-6">
            <h2 className="font-bold text-ink">Drive status & academic year</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 [&>*]:min-w-0">
              <div>
                <label htmlFor="drive-status" className="field-label">Membership applications</label>
                <select
                  id="drive-status"
                  value={draft.isDriveOpen ? 'open' : 'closed'}
                  onChange={(e) => setDraft({ ...draft, isDriveOpen: e.target.value === 'open' })}
                  className="input text-sm"
                >
                  <option value="open">Active / Open (Registrations accepted)</option>
                  <option value="closed">Closed (Public message shown)</option>
                </select>
              </div>
              <div>
                <label htmlFor="drive-year" className="field-label">Drive year</label>
                <input
                  id="drive-year"
                  type="number"
                  min={2020}
                  max={2035}
                  value={draft.driveYear ?? new Date().getFullYear()}
                  onChange={(e) => setDraft({ ...draft, driveYear: Number(e.target.value) })}
                  className="input font-mono text-sm max-w-xs"
                />
              </div>
            </div>
          </section>

          <section className="panel p-6">
            <h2 className="font-bold text-ink">Membership fee</h2>
            <label htmlFor="base-fee" className="field-label mt-5">Base branch membership (₹)</label>
            <input id="base-fee" type="number" min={1} step={1} value={draft.baseFee} onChange={(e) => setDraft({ ...draft, baseFee: Number(e.target.value) })} className="input max-w-xs font-mono" />

            <h3 className="mt-8 text-sm font-semibold text-ink">Chapter add-ons (₹)</h3>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 [&>*]:min-w-0">
              {draft.chapters.map((c) => {
                const info = chapterInfo.find((x) => x.code === c.code);
                return (
                  <li key={c.id} className="flex items-center gap-3 rounded-2xl bg-paper p-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold text-white" style={{ background: info?.color ?? '#0b1b33' }}>{c.code.split('/')[0]}</span>
                    <label htmlFor={`price-${c.id}`} className="min-w-0 flex-1 truncate text-sm text-ink">{c.name}</label>
                    <input id={`price-${c.id}`} type="number" min={0} step={10} value={c.price} onChange={(e) => setChapterPrice(c.id, Number(e.target.value))} className="w-24 rounded-lg border border-line bg-white px-2 py-1.5 text-right font-mono text-sm outline-none focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20" />
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="panel p-6">
            <h2 className="font-bold text-ink">Where students pay</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 [&>*]:min-w-0">
              <div>
                <label htmlFor="vpa" className="field-label">Branch UPI ID</label>
                <input id="vpa" value={draft.vpa} onChange={(e) => setDraft({ ...draft, vpa: e.target.value })} className="input font-mono text-sm" placeholder="neharamiah2006-1@oksbi" />
              </div>
              <div>
                <label htmlFor="payee" className="field-label">Payee name</label>
                <input id="payee" value={draft.payeeName} onChange={(e) => setDraft({ ...draft, payeeName: e.target.value })} className="input text-sm" />
              </div>
            </div>
            <div className="mt-5 flex items-center gap-5 rounded-2xl bg-paper p-4">
              <div className="rounded-xl bg-white p-2"><QRCodeSVG value={upiPreview} size={88} marginSize={0} /></div>
              <p className="text-sm text-ink-soft">Test this QR with your phone before saving. It should open a payment of <strong className="text-ink">₹{draft.baseFee}</strong> to <strong className="text-ink">{draft.payeeName || '—'}</strong>. Don&apos;t complete the payment.</p>
            </div>
          </section>

          <section className="panel p-6">
            <h2 className="font-bold text-ink">Branch Treasurer (Receipt Signatory)</h2>
            <p className="mt-1 text-xs text-muted">These details appear on official PDF receipts generated and dispatched to students.</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-3 [&>*]:min-w-0">
              <div>
                <label htmlFor="treasurer-name" className="field-label">Treasurer name</label>
                <input
                  id="treasurer-name"
                  value={draft.treasurerName ?? ''}
                  onChange={(e) => setDraft({ ...draft, treasurerName: e.target.value })}
                  placeholder="e.g. Branch Treasurer"
                  className="input text-sm"
                />
              </div>
              <div>
                <label htmlFor="treasurer-role" className="field-label">Designation / Role</label>
                <input
                  id="treasurer-role"
                  value={draft.treasurerRole ?? ''}
                  onChange={(e) => setDraft({ ...draft, treasurerRole: e.target.value })}
                  placeholder="e.g. Treasurer and MDC"
                  className="input text-sm"
                />
              </div>
              <div>
                <label htmlFor="treasurer-phone" className="field-label">Contact phone</label>
                <input
                  id="treasurer-phone"
                  value={draft.treasurerPhone ?? ''}
                  onChange={(e) => setDraft({ ...draft, treasurerPhone: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="input text-sm font-mono"
                />
              </div>
            </div>
          </section>

          {problems.length > 0 && <Alert tone="error"><ul className="list-disc pl-4">{problems.map((p) => <li key={p}>{p}</li>)}</ul></Alert>}

          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={!changes.length || problems.length > 0} onClick={() => setConfirming(true)} className="btn btn-primary btn-lg">
              <Save className="h-4 w-4" /> Save {changes.length ? `${changes.length} change${changes.length > 1 ? 's' : ''}` : ''}
            </button>
            <button type="button" disabled={!changes.length} onClick={() => setDraft(saved)} className="btn btn-ghost btn-lg bg-white">
              <RotateCcw className="h-4 w-4" /> Discard
            </button>
          </div>
        </div>

        <div className="xl:sticky xl:top-24">
          <p className="mb-4 text-xs font-semibold tracking-wide text-muted uppercase">Preview on the membership page</p>
          <FeeSlip baseFee={draft.baseFee} minChapter={prices.length ? Math.min(...prices) : undefined} maxChapter={prices.length ? Math.max(...prices) : undefined} />
        </div>
      </div>

      {confirming && (
        <Modal title="Save these changes?" onClose={() => setConfirming(false)}>
          <ul className="space-y-2 text-sm">
            {changes.map((c) => <li key={c} className="rounded-xl bg-paper px-3 py-2 font-mono text-ink">{c}</li>)}
          </ul>
          <p className="mt-4 text-sm text-muted">Students who start registering after this will see the new amounts. This is recorded in the activity log.</p>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setConfirming(false)} className="btn btn-ghost">Cancel</button>
            <button type="button" disabled={busy} onClick={save} className="btn btn-primary">{busy && <Spinner />} Save changes</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
