import { FALLBACK_BASE_FEE, FALLBACK_CART_CHAPTERS } from '@/data/site';
import type { CartChapter } from './cart';
import { isDemoMode, supabase } from './supabase';

export type Pricing = { baseFee: number; chapters: CartChapter[] };

/** Base fee and chapter prices: from Supabase in live mode, sample prices in demo mode. */
export async function loadPricing(): Promise<Pricing> {
  if (isDemoMode()) return { baseFee: FALLBACK_BASE_FEE, chapters: FALLBACK_CART_CHAPTERS };
  const [chaptersRes, configRes] = await Promise.all([
    supabase.from('chapters').select('id, name, code, price').order('name'),
    supabase.from('membership_config').select('base_fee').eq('id', 1).maybeSingle(),
  ]);
  if (chaptersRes.error || configRes.error || !configRes.data) {
    throw new Error('Membership pricing is not available right now. Please try again later or contact the branch.');
  }
  return {
    baseFee: Number(configRes.data.base_fee),
    chapters: (chaptersRes.data ?? []).map((c) => ({ ...c, price: Number(c.price) })),
  };
}
