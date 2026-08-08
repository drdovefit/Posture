import type { Point } from '../types';

/** Euclidean distance between two points. */
export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Midpoint of two points. */
export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Angle in degrees of the vector a→b measured from the vertical (straight down
 * the image, +y). 0° means b is directly below a. Positive is clockwise
 * (toward +x / image right). Range (-180, 180].
 */
export function angleFromVertical(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  // atan2(x, y): angle from the +y (downward) axis.
  return (Math.atan2(dx, dy) * 180) / Math.PI;
}

/**
 * Signed angle in degrees of the line through a→b measured from the horizontal.
 * 0° means perfectly level. Positive means b is lower on screen than a
 * (i.e. the a-side is raised). Range (-90, 90].
 */
export function tiltFromHorizontal(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

/**
 * Interior angle at vertex `v` formed by the rays v→a and v→b, in degrees.
 * Range [0, 180].
 */
export function angleAtVertex(v: Point, a: Point, b: Point): number {
  const a1 = Math.atan2(a.y - v.y, a.x - v.x);
  const a2 = Math.atan2(b.y - v.y, b.x - v.x);
  let deg = Math.abs((a1 - a2) * 180) / Math.PI;
  if (deg > 180) deg = 360 - deg;
  return deg;
}

/** Absolute horizontal offset between two points (in normalized units). */
export function horizontalOffset(a: Point, b: Point): number {
  return Math.abs(a.x - b.x);
}

/** Clamp a number into [lo, hi]. */
export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
