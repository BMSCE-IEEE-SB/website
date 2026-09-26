import { isDemoMode, supabase, STORAGE_BUCKET } from './supabase';

/**
 * Live mode stores the storage *path* of the payment screenshot (the bucket is
 * private). This turns a stored value into something an <img> can show.
 */
export async function resolveScreenshotUrl(value?: string | null): Promise<string | null> {
  if (!value) return null;
  if (isDemoMode() || /^(https?:|data:|blob:)/.test(value)) return value;
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(value, 60 * 10);
  return error ? null : data.signedUrl;
}

export async function uploadScreenshot(userId: string, orderRef: string, file: File, suffix = '') {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${userId}/${orderRef}${suffix}.${ext}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(`Could not upload the screenshot: ${error.message}`);
  return path;
}
