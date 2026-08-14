// Browser-stored brand images. Lets the owner drop in the QR and clothing-guide
// images from inside the app (no GitHub login needed) until the real files are
// committed to public/brand/. Stored as data URLs in localStorage on this
// device. Temporary — remove along with BrandUploader once the files ship.

export const BRAND_IMAGE_KEYS = {
  qr: 'posturelab-qr',
  clothing: 'posturelab-clothing',
} as const;

export function storedBrandImage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
