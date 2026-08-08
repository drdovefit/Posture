import type { Landmarks, Metric, ViewType } from '../types';
import { buildOverlay, COLORS } from '../pose/overlay';

/**
 * Draw the photo plus the posture overlay (plumb line, body chain, level bars,
 * landmark dots) onto a canvas and return it as a PNG Blob. Used for the saved
 * annotated thumbnail and the PDF report.
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

  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/png', 0.92),
  );
}
