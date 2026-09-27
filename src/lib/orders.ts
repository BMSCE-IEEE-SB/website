import { isDemoMode, supabase, STORAGE_BUCKET } from './supabase';

/**
 * Live mode stores the storage *path* of the payment screenshot (the bucket is
 * private). This turns a stored value into something an <img> can show.
 */
export async function resolveScreenshotUrl(value?: string | null): Promise<string | null> {
  if (!value) return null;
  if (isDemoMode()) return /^(https?:|data:image\/(png|jpeg|webp);base64,|blob:)/i.test(value) ? value : null;
  if (value.length > 240 || !/^[0-9a-f-]{36}\/[A-Za-z0-9-]+\.(png|jpg|webp)$/i.test(value)) return null;
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(value, 60 * 10);
  return error ? null : data.signedUrl;
}
