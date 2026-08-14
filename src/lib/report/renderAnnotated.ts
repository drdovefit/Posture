import type { Landmarks, Metric, ViewType } from '../types';
import { buildOverlay, COLORS } from '../pose/overlay';
import { BRAND_IMAGE_KEYS, storedBrandImage } from '../brandImages';

/** Load an image for compositing; resolves null if it isn't there. */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = src;
  });
}

/**
 * Draw the photo plus the posture overlay (plumb line, body chain, level bars,
 * landmark dots) onto a canvas and return it as a PNG Blob. The PostureLab
 * wordmark is stamped across the top and, if a QR image is present at
 * brand/qr.png, it's placed in the bottom-right corner. Used for the saved
 * annotated thumbnail, the shared/downloaded image, and the PDF report.
 */
export async function renderAnnotated(
  image: HTMLImageElement,
  view: ViewType,
  lm: Landmarks,
  metrics: Metric[],
  maxWidth = 900,
): Promise<Blob> {
  const scale = Math.min(1, maxWidth / image.naturalWidth);
  const W = Math.round(image.naturalWidth * scale);
  const H = Math.round(image.naturalHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0, W, H);

  const overlay = buildOverlay(view, lm, metrics);
  const x = (nx: number) => nx * W;
  const y = (ny: number) => ny * H;

  // Plumb line (dashed, full height).
  ctx.save();
  ctx.strokeStyle = COLORS.plumb;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(x(overlay.plumbX), 0);
  ctx.lineTo(x(overlay.plumbX), H);
  ctx.stroke();
  ctx.restore();

  // Segments.
  overlay.segments.forEach((s) => {
    ctx.save();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width;
    ctx.lineCap = 'round';
    if (s.dash) ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(x(s.a.x), y(s.a.y));
    ctx.lineTo(x(s.b.x), y(s.b.y));
    ctx.stroke();
    ctx.restore();
  });

  // Dots.
  overlay.dots.forEach(({ p }) => {
    ctx.save();
    ctx.fillStyle = COLORS.dot;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x(p.x), y(p.y), 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });

  const base = import.meta.env.BASE_URL;
  const [wordmark, qr] = await Promise.all([
    loadImage(`${base}brand/wordmark.png`),
    loadImage(storedBrandImage(BRAND_IMAGE_KEYS.qr) ?? `${base}brand/qr.png`),
  ]);

  // Small wordmark in the top-left corner (transparent PNG), with a soft shadow
  // so it stays readable over any photo.
  if (wordmark && wordmark.naturalWidth) {
    const wmW = W * 0.2;
    const wmH = (wordmark.naturalHeight / wordmark.naturalWidth) * wmW;
    const margin = W * 0.03;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = W * 0.01;
    ctx.drawImage(wordmark, margin, margin, wmW, wmH);
    ctx.restore();
  }

  // QR code in the bottom-right corner, on a white rounded card (a quiet zone
  // so it scans). Only drawn if brand/qr.png exists.
  if (qr && qr.naturalWidth) {
    const size = Math.max(90, W * 0.16);
    const pad = size * 0.09;
    const margin = W * 0.03;
    const cardW = size + pad * 2;
    const cx = W - margin - cardW;
    const cy = H - margin - cardW;
    const r = size * 0.08;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx + r, cy);
    ctx.arcTo(cx + cardW, cy, cx + cardW, cy + cardW, r);
    ctx.arcTo(cx + cardW, cy + cardW, cx, cy + cardW, r);
    ctx.arcTo(cx, cy + cardW, cx, cy, r);
    ctx.arcTo(cx, cy, cx + cardW, cy, r);
    ctx.closePath();
    ctx.fill();
    ctx.drawImage(qr, cx + pad, cy + pad, size, size);
    ctx.restore();
  }

  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/png', 0.92),
  );
}
