'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import MembershipCard, { type CardData } from '@/components/site/MembershipCard';
import Tilt from '@/components/site/Tilt';

export type Draft = Omit<CardData, 'status' | 'reference'>;
const KEY = 'membership_card_draft';

export function readDraft(): Draft {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveDraft(d: Partial<Draft>) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...readDraft(), ...d }));
  } catch {}
}

const Ctx = createContext<{ draft: Draft; update: (d: Partial<Draft>) => void }>({ draft: {}, update: () => {} });

/** Keeps a live preview of the member's card as they move through the sign-up steps. */
export function DraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<Draft>({});

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring client-only storage after hydration
      if (saved) setDraft(JSON.parse(saved));
    } catch {}
  }, []);

  const update = useCallback((d: Partial<Draft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...d };
      try {
        sessionStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ draft, update }}>{children}</Ctx.Provider>;
}

export const useDraft = () => useContext(Ctx);

export function LiveCard({ status = 'draft', caption = 'Your card updates as you fill in the form.' }: { status?: CardData['status']; caption?: string }) {
  const { draft } = useDraft();
  return (
    <div>
      <Tilt className="rounded-[22px]" max={8}>
        <MembershipCard data={{ ...draft, status }} />
      </Tilt>
      {caption && <p className="mt-3 text-center text-xs text-muted">{caption}</p>}
    </div>
  );
}
