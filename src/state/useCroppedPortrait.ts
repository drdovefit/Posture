import { useEffect, useState } from 'react';
import type { Assessment, Point } from '../lib/types';

/**
 * Crop an assessment image to the person — head-to-feet with a little padding,
 * from the landmark bounding box — so thumbnails and compare panels frame the
 * body with no black bars and never cut the top of the head. Uniform scale:
 * fits vertically to the body and center-crops the sides to fill the box.
 * Optionally mirrors. Returns a data URL (empty string until ready).
 */
export function useCroppedPortrait(
  a: Pick<Assessment, 'annotated' | 'photo' | 'landmarks'> | undefined,
  flip = false,
  aspect = 3 / 4,
): string {
  const [url, setUrl] = useState('');
  const src = a?.annotated ?? a?.photo;
  useEffect(() => {
    let cancelled = false;
    if (!a || !src) {
      setUrl('');
      return;
    }
    const objUrl = URL.createObjectURL(src);
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const W = img.naturalWidth;
      const H = img.naturalHeight;
      const pts = Object.values(a.landmarks ?? {}).filter(Boolean) as Point[];
      let minX = 0, maxX = 1, minY = 0, maxY = 1;
      if (pts.length) {
        minX = Math.min(...pts.map((p) => p.x));
        maxX = Math.max(...pts.map((p) => p.x));
        minY = Math.min(...pts.map((p) => p.y));
        maxY = Math.max(...pts.map((p) => p.y));
      }
      // Generous padding so the body isn't cropped too tight (space above the
      // head and below the feet).
      const topN = Math.max(0, minY - 0.1);
      const botN = Math.min(1, maxY + 0.08);
      const top = topN * H;
      const cropH = Math.max(1, (botN - topN) * H);
      const centerX = ((Math.max(0, minX - 0.07) + Math.min(1, maxX + 0.07)) / 2) * W;
      let cropW = cropH * aspect;
      if (cropW > W) cropW = W;
      const left = Math.min(Math.max(0, centerX - cropW / 2), Math.max(0, W - cropW));

      const outH = Math.min(cropH, 1200);
      const outW = outH * aspect;
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(outW));
      canvas.height = Math.max(1, Math.round(outH));
      const ctx = canvas.getContext('2d')!;
      if (flip) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(img, left, top, cropW, cropH, 0, 0, canvas.width, canvas.height);
      setUrl(canvas.toDataURL('image/png'));
      URL.revokeObjectURL(objUrl);
    };
    img.src = objUrl;
    return () => {
      cancelled = true;
    };
  }, [a, src, flip, aspect]);
  return url;
}
