import type { Landmarks, ViewType } from '../types';

/**
 * Non-blocking quality checks on a just-added photo. Bad photos are still
 * allowed; these just warn the user that the reading may be less accurate.
 * Returns a list of plain-language warnings (empty when the photo looks fine).
 */
export function photoWarnings(
  img: HTMLImageElement,
  lm: Landmarks,
  view: ViewType,
): string[] {
  const warns: string[] = [];

  // Brightness: average luminance of a tiny downscaled copy of the photo.
  try {
    const c = document.createElement('canvas');
    c.width = 40;
    c.height = 40;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, 40, 40);
      const { data } = ctx.getImageData(0, 0, 40, 40);
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      }
      const avg = sum / (data.length / 4);
      if (avg < 55) {
        warns.push('This photo looks low-light, so the reading may be less accurate.');
      }
    }
  } catch {
    /* cross-origin or decode issue: skip the brightness check */
  }

  // Whole body in frame: are the ankles present and not cut off at the bottom?
  const ankleY = view === 'lateral' ? lm.ankle?.y : lm.ankleL?.y ?? lm.ankleR?.y;
  if (ankleY == null) {
    warns.push('Your feet may be out of frame, so the reading may be less accurate. Try to fit your whole body in.');
  } else if (ankleY > 0.98) {
    warns.push('You look a little close, or cut off at the feet. Step back so your whole body fits.');
  }

  return warns;
}
