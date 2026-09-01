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
  opts: { watermark?: 'full' | 'minimal' } = {},
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
  const wantQr = (opts.watermark ?? 'full') === 'full';
  const [wordmark, qr] = await Promise.all([
    loadImage(`${base}brand/wordmark.png`),
    wantQr
      ? loadImage(storedBrandImage(BRAND_IMAGE_KEYS.qr) ?? `${base}brand/qr.png`)
      : Promise.resolve(null),
  ]);
  const hasWm = !!(wordmark && wordmark.naturalWidth);
  const hasQr = !!(qr && qr.naturalWidth);
  const margin = W * 0.03;

  const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  if (!wantQr) {
    // Minimal: just a small wordmark, bottom-left, for the saved image the
    // report uses (the QR sits in the report's blue header instead).
    if (hasWm) {
      const wmW = W * 0.165;
      const wmH = (wordmark!.naturalHeight / wordmark!.naturalWidth) * wmW;
      const pad = wmW * 0.12;
      const x0 = margin + pad;
      const y0 = H - margin - pad - wmH;
      ctx.save();
      ctx.globalAlpha = 0.82;
      ctx.fillStyle = '#ffffff';
      roundRect(margin, H - margin - wmH - pad * 2, wmW + pad * 2, wmH + pad * 2, wmH * 0.35);
      ctx.fill();
      ctx.restore();
      ctx.drawImage(wordmark!, x0, y0, wmW, wmH);
    }
  } else if (hasQr || hasWm) {
    // Full: QR + wordmark on one white rounded card, bottom-right. Compact so
    // it labels the photo without dominating it.
    const contentW = W * 0.1605; // ~7% larger QR + wordmark than before
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
    roundRect(cardX, cardY, cardW, cardH, r);
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
