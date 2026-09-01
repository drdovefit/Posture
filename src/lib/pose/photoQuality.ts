import type { Landmarks, ViewType } from '../types';

/** Top-most and bottom-most body points (0..1 down the image) for the view. */
function bodyTopBottom(lm: Landmarks, view: ViewType): { top?: number; bottom?: number } {
  if (view === 'lateral') {
    return { top: lm.ear?.y, bottom: lm.ankle?.y };
  }
  const tops = [lm.eyeL?.y, lm.eyeR?.y, lm.earL?.y, lm.earR?.y].filter(
    (n): n is number => n != null,
  );
  const bottoms = [lm.ankleL?.y, lm.ankleR?.y].filter((n): n is number => n != null);
  return {
    top: tops.length ? Math.min(...tops) : undefined,
    bottom: bottoms.length ? Math.max(...bottoms) : undefined,
  };
}

/** Average luminance (0..255) of a tiny downscaled copy of the image. */
export function imageBrightness(img: CanvasImageSource, w = 40, h = 40): number | null {
  try {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    }
    return sum / (data.length / 4);
  } catch {
    return null;
  }
}

/**
 * A single brief framing hint for the live camera (or null if the framing is
 * fine). Short wording, since it shows as a small on-camera bubble.
 */
export function framingHint(
  lm: Landmarks,
  view: ViewType,
  shoulderSep?: number,
): string | null {
  const { top, bottom } = bodyTopBottom(lm, view);
  const span = top != null && bottom != null ? bottom - top : undefined;
  if (bottom == null) return 'Fit your whole body in';
  if (bottom > 0.98) return 'Step back a little';
  if (top != null && top < 0.03) return 'Fit your head in';
  if (span != null && span < 0.45) return 'Move closer';
  if (shoulderSep != null && span != null && span >= 0.45) {
    const sepRatio = shoulderSep / Math.max(span, 1e-6);
    if (view === 'lateral' && sepRatio > 0.14) return 'Turn side-on';
    if (view !== 'lateral' && sepRatio < 0.06) return 'Face the camera';
  }
  return null;
}

/**
 * Non-blocking quality checks on a just-added photo. Bad photos are still
 * allowed; these just warn that the reading may be less accurate. Returns a
 * list of plain-language warnings (empty when the photo looks fine).
 */
export function photoWarnings(
  img: HTMLImageElement,
  lm: Landmarks,
  view: ViewType,
  opts: { confidence?: number; shoulderSep?: number; jointVisibility?: number } = {},
): string[] {
  const warns: string[] = [];

  // Low light.
  const bright = imageBrightness(img);
  if (bright != null && bright < 55) {
    warns.push('This photo looks low-light, so the reading may be less accurate.');
  }

  const { top, bottom } = bodyTopBottom(lm, view);
  const span = top != null && bottom != null ? bottom - top : undefined;

  // Feet out of frame or standing too close.
  if (bottom == null) {
    warns.push('Your feet may be out of frame. Try to fit your whole body in.');
  } else if (bottom > 0.98) {
    warns.push('You look a little close, or cut off at the feet. Step back so your whole body fits.');
  }

  // Head cropped at the top.
  if (top != null && top < 0.03) {
    warns.push('Your head looks cut off at the top. Fit your whole body in the frame.');
  }

  // Too far away / small in frame.
  if (span != null && span < 0.45) {
    warns.push('You look far away. Move closer so your body fills more of the frame.');
  }

  // Facing the wrong way for the chosen view (uses shoulder separation relative
  // to body height, so it holds at any distance). Skipped when clearly too far.
  if (opts.shoulderSep != null && span != null && span >= 0.45) {
    const sepRatio = opts.shoulderSep / Math.max(span, 1e-6);
    if (view === 'lateral' && sepRatio > 0.14) {
      warns.push('You may be facing the camera. Turn side-on for a Side scan.');
    } else if (view !== 'lateral' && sepRatio < 0.06) {
      warns.push('You may be side-on. Face the camera for a Front scan.');
    }
  }

  // Shoulders and hips hard to make out — usually baggy clothing hiding the
  // joints (or a busy background). Only when the body is otherwise well framed,
  // so it doesn't fire just because someone is far away.
  if (
    opts.jointVisibility != null &&
    opts.jointVisibility < 0.6 &&
    span != null &&
    span >= 0.45
  ) {
    warns.push(
      "We can't clearly make out your shoulders and hips. Wear fitted clothing — baggy clothes hide the joints — against a plain wall for a better reading.",
    );
  }

  // The detector itself is unsure about the joints.
  if (opts.confidence != null && opts.confidence < 0.5) {
    warns.push('The detected points look uncertain. Check them before you save.');
  }

  return warns;
}

/** Average visibility of the torso joints (shoulders + hips): a proxy for
 *  whether clothing or background is hiding them. 0..1. */
export function torsoVisibility(vis: {
  shoulderL?: number;
  shoulderR?: number;
  hipL?: number;
  hipR?: number;
}): number {
  const vals = [vis.shoulderL, vis.shoulderR, vis.hipL, vis.hipR].filter(
    (n): n is number => n != null,
  );
  if (!vals.length) return 1;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}
