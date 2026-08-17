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

  // Bottom-right badge: the QR and the wordmark together on one white rounded
  // card, so the branding is always clearly visible over any photo (dark text
  // on a dark background used to disappear). Sized generously so it reads.
  const margin = W * 0.03;
  const hasQr = !!(qr && qr.naturalWidth);
  const hasWm = !!(wordmark && wordmark.naturalWidth);
  if (hasQr || hasWm) {
    const contentW = W * 0.22; // QR + wordmark share this width
    const pad = contentW * 0.1;
    const gap = contentW * 0.07;
    const qrH = hasQr ? contentW : 0;
    const wmH = hasWm ? (wordmark!.naturalHeight / wordmark!.naturalWidth) * contentW : 0;
    const cardW = contentW + pad * 2;
    const cardH = pad + qrH + (hasQr && hasWm ? gap : 0) + wmH + pad;
    const cardX = W - margin - cardW;
    const cardY = H - margin - cardH;
    const r = contentW * 0.09;

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.22)';
    ctx.shadowBlur = W * 0.01;
    ctx.shadowOffsetY = W * 0.002;
    ctx.beginPath();
    ctx.moveTo(cardX + r, cardY);
    ctx.arcTo(cardX + cardW, cardY, cardX + cardW, cardY + cardH, r);
    ctx.arcTo(cardX + cardW, cardY + cardH, cardX, cardY + cardH, r);
    ctx.arcTo(cardX, cardY + cardH, cardX, cardY, r);
    ctx.arcTo(cardX, cardY, cardX + cardW, cardY, r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    let cy = cardY + pad;
    if (hasQr) {
      ctx.drawImage(qr!, cardX + pad, cy, contentW, qrH);
      cy += qrH + gap;
    }
    if (hasWm) {
      ctx.drawImage(wordmark!, cardX + pad, cy, contentW, wmH);
    }
  }

  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/png', 0.92),
  );
}
