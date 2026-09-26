'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}
const labels = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];
const colors = ['bg-red-400', 'bg-red-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-500'];

export default function PasswordField({
  id,
  value,
  onChange,
  autoComplete,
  showStrength,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  showStrength?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const s = value.length < 6 ? 0 : strength(value);
  return (
    <div>
      <div className="relative">
        <Lock className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required
          minLength={6}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input input-icon pr-12"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-2 text-muted hover:bg-paper hover:text-ink"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {showStrength && value && (
        <div className="mt-2 flex items-center gap-3">
          <div className="flex flex-1 gap-1">
            {[0, 1, 2, 3].map((k) => (
              <span key={k} className={cn('h-1.5 flex-1 rounded-full transition-colors duration-300', k < s ? colors[s] : 'bg-line')} />
            ))}
          </div>
          <span className="w-16 text-right text-xs text-muted">{labels[s]}</span>
        </div>
      )}
    </div>
  );
}
