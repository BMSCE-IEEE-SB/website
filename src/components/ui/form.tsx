'use client';

import { useEffect } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { CircleAlert, CircleCheck, Info, LoaderCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Field({
  label,
  htmlFor,
  required,
  optional,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  optional?: boolean;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="field-label">
        {label}
        {required && <span className="ml-0.5 text-brand-orange">*</span>}
        {optional && <span className="ml-1.5 text-xs font-normal text-muted">Optional</span>}
      </label>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

export function Input({ icon: Icon, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { icon?: LucideIcon }) {
  return (
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />}
      <input className={cn('input', Icon && 'input-icon', className)} {...props} />
    </div>
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn('input', className)} {...props}>
      {children}
    </select>
  );
}

const alertStyles = {
  error: { cls: 'bg-red-50 text-red-800', icon: CircleAlert },
  success: { cls: 'bg-emerald-50 text-emerald-800', icon: CircleCheck },
  info: { cls: 'bg-sky-50 text-sky-900', icon: Info },
} as const;

export function Alert({ tone = 'info', children, className }: { tone?: keyof typeof alertStyles; children: ReactNode; className?: string }) {
  const { cls, icon: Icon } = alertStyles[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('flex items-start gap-3 rounded-2xl px-4 py-3 text-sm leading-relaxed', cls, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={cn('h-4 w-4 animate-spin', className)} aria-hidden />;
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading">
      <Spinner className="h-7 w-7 text-brand-orange" />
    </div>
  );
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={cn('max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-7', wide ? 'sm:max-w-2xl' : 'sm:max-w-md')}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-lg font-bold text-ink">{title}</h3>
          <button type="button" onClick={onClose} className="-m-1 rounded-full p-1.5 text-muted hover:bg-paper hover:text-ink" aria-label="Close">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; dot: string }> = {
    pending: { label: 'Pending verification', cls: 'bg-amber-50 text-amber-800', dot: 'bg-amber-500' },
    verified: { label: 'Verified', cls: 'bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },
    rejected: { label: 'Action required', cls: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
  };
  const s = map[status] ?? { label: status, cls: 'bg-paper text-ink-soft', dot: 'bg-muted' };
  return (
    <span className={cn('badge', s.cls)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  );
}

export function FileDrop({
  id,
  file,
  onChange,
  label = 'Tap to upload your payment screenshot',
}: {
  id: string;
  file: File | null;
  onChange: (f: File | null) => void;
  label?: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-colors',
        file ? 'border-emerald-300 bg-emerald-50/50' : 'border-line bg-paper hover:border-brand-sky hover:bg-sky-50/40',
      )}
    >
      <input id={id} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
      {file ? (
        <>
          <CircleCheck className="mb-2 h-7 w-7 text-emerald-600" aria-hidden />
          <span className="max-w-full truncate text-sm font-medium text-ink">{file.name}</span>
          <span className="mt-1 text-xs text-muted">Tap to choose a different file</span>
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" className="mb-2 h-7 w-7 text-brand-sky" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 13v8M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2" /><path d="m8 17 4-4 4 4" />
          </svg>
          <span className="text-sm font-medium text-ink">{label}</span>
          <span className="mt-1 text-xs text-muted">PNG or JPG, up to 5 MB</span>
        </>
      )}
    </label>
  );
}
