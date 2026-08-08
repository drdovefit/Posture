import type { Landmarks, Metric, Point, Severity, ViewType } from '../types';
import { midpoint } from '../measure/geometry';

/** Palette shared by the interactive SVG editor and the baked annotated image. */
export const COLORS = {
  plumb: '#fde047', // yellow dashed reference line
  chain: '#22d3ee', // cyan body chain
  dot: '#f59e0b', // landmark handles
  good: '#34d399',
  mild: '#fbbf24',
  moderate: '#f87171',
} as const;

export function severityColor(s: Severity): string {
  return s === 'good' ? COLORS.good : s === 'mild' ? COLORS.mild : COLORS.moderate;
}

export interface Segment {
  a: Point;
  b: Point;
  color: string;
  width: number;
  dash?: boolean;
}

export interface OverlaySpec {
  /** Normalized x of the vertical plumb line. */
  plumbX: number;
  /** Cyan body-chain + colored deviation segments. */
  segments: Segment[];
  /** Points to render as draggable dots, keyed for hit-testing. */
  dots: { key: keyof Landmarks; p: Point }[];
}

const chainWidth = 4;
const levelWidth = 5;

function seg(a: Point, b: Point, color: string, width: number, dash = false): Segment {
  return { a, b, color, width, dash };
}

/**
 * Build the full set of drawing primitives for a view. Pure — depends only on
 * landmark positions and (optionally) computed metrics for severity coloring.
 */
export function buildOverlay(
  view: ViewType,
  lm: Landmarks,
  metrics: Metric[] = [],
): OverlaySpec {
  const sev = (id: string): Severity =>
    metrics.find((m) => m.id === id)?.severity ?? 'good';
  const segments: Segment[] = [];
  const dots: { key: keyof Landmarks; p: Point }[] = [];

  if (view === 'lateral') {
    const chain: (keyof Landmarks)[] = ['ear', 'shoulder', 'hip', 'knee', 'ankle'];
    for (let i = 0; i < chain.length - 1; i++) {
      const a = lm[chain[i]];
      const b = lm[chain[i + 1]];
      if (a && b) segments.push(seg(a, b, COLORS.chain, chainWidth));
    }
    // Red pelvis reference bar (like the reference image) at the hip.
    if (lm.hip) {
      const c = severityColor(sev('pelvisShift'));
      segments.push(
        seg({ x: lm.hip.x - 0.12, y: lm.hip.y }, { x: lm.hip.x + 0.12, y: lm.hip.y }, c, levelWidth),
      );
    }
    chain.forEach((k) => {
      const p = lm[k];
      if (p) dots.push({ key: k, p });
    });
    const plumbX = lm.ankle?.x ?? 0.5;
    return { plumbX, segments, dots };
  }

  // Frontal (anterior / posterior): horizontal level bars + vertical midline.
  const pairs: [keyof Landmarks, keyof Landmarks, string][] = [
    ['eyeL', 'eyeR', 'headTilt'],
    ['shoulderL', 'shoulderR', 'shoulderLevel'],
    ['hipL', 'hipR', 'pelvicLevel'],
    ['kneeL', 'kneeR', 'kneeValgus'],
    ['ankleL', 'ankleR', 'kneeValgus'],
  ];
  pairs.forEach(([lk, rk, metricId]) => {
    const a = lm[lk];
    const b = lm[rk];
    if (a && b) segments.push(seg(a, b, severityColor(sev(metricId)), levelWidth));
  });

  // Cyan spine midline: shoulder-mid → hip-mid → ankle-mid.
  const sMid = lm.shoulderL && lm.shoulderR ? midpoint(lm.shoulderL, lm.shoulderR) : undefined;
  const hMid = lm.hipL && lm.hipR ? midpoint(lm.hipL, lm.hipR) : undefined;
  const aMid = lm.ankleL && lm.ankleR ? midpoint(lm.ankleL, lm.ankleR) : undefined;
  if (sMid && hMid) segments.push(seg(sMid, hMid, COLORS.chain, chainWidth));
  if (hMid && aMid) segments.push(seg(hMid, aMid, COLORS.chain, chainWidth));

  (
    [
      'eyeL', 'eyeR', 'shoulderL', 'shoulderR',
      'hipL', 'hipR', 'kneeL', 'kneeR', 'ankleL', 'ankleR',
    ] as (keyof Landmarks)[]
  ).forEach((k) => {
    const p = lm[k];
    if (p) dots.push({ key: k, p });
  });

  const plumbX = aMid?.x ?? 0.5;
  return { plumbX, segments, dots };
}
