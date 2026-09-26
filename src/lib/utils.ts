export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

/** Date-only strings ("2026-10-06") are calendar days, not UTC instants: keep the same day in every timezone. */
export function toDate(date: string | Date) {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(date);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Deterministic "6 Oct 2026" so server and browser render identical text. */
export function formatDate(date: string | Date) {
  const d = toDate(date);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
export const monthShort = (date: string) => MONTHS[toDate(date).getMonth()];
export const dayOfMonth = (date: string) => toDate(date).getDate();

export function formatDateTime(date: string | Date) {
  const d = new Date(date);
  return `${formatDate(d)}, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
}

export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.') {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'object' && err && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return fallback;
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Returns an error string if the file is not an acceptable payment screenshot. */
export function validateScreenshot(file: File | null): string | null {
  if (!file) return 'Please upload a screenshot of your payment.';
  if (!file.type.startsWith('image/')) return 'The payment proof must be an image (PNG or JPG).';
  if (file.size > MAX_UPLOAD_BYTES) return 'The screenshot is larger than 5 MB. Please upload a smaller image.';
  return null;
}

/**
 * Shrinks an image into a JPEG data URL. Demo mode stores screenshots in
 * localStorage, so they must survive a reload (blob: URLs do not) and stay small.
 */
export function imageToDataUrl(file: File, maxSize = 1000, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Could not process the image.'));
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read the image file.'));
    };
    img.src = url;
  });
}
