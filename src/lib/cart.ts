export type CartChapter = { id: string; name: string; code: string; price: number };

export const CART_KEYS = {
  chapters: 'checkout_chapters',
  baseFee: 'checkout_base_fee',
  orderRef: 'checkout_order_ref',
};

export function readCart(): { chapters: CartChapter[]; baseFee: number } | null {
  const rawFee = sessionStorage.getItem(CART_KEYS.baseFee);
  if (rawFee === null) return null;
  try {
    const chapters: CartChapter[] = JSON.parse(sessionStorage.getItem(CART_KEYS.chapters) || '[]');
    return { chapters, baseFee: Number(rawFee) };
  } catch {
    return null;
  }
}

export function clearCart() {
  Object.values(CART_KEYS).forEach((k) => sessionStorage.removeItem(k));
}

/** Order reference stays stable across reloads so the QR the student paid against still matches. */
export function getOrCreateOrderRef() {
  let ref = sessionStorage.getItem(CART_KEYS.orderRef);
  if (!ref) {
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    ref = 'BMSCE-' + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
    sessionStorage.setItem(CART_KEYS.orderRef, ref);
  }
  return ref;
}
