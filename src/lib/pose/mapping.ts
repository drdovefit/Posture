import type { Landmarks, Point, ViewType } from '../types';
import type { RawLandmark } from './landmarker';

/** MediaPipe Pose 33-landmark indices (subject's anatomical left/right). */
const IDX = {
  nose: 0,
  eyeL: 2,
  eyeR: 5,
  earL: 7,
  earR: 8,
  shoulderL: 11,
  shoulderR: 12,
  hipL: 23,
  hipR: 24,
  kneeL: 25,
  kneeR: 26,
  ankleL: 27,
  ankleR: 28,
} as const;

function pt(raw: RawLandmark[], i: number): Point {
  return { x: raw[i].x, y: raw[i].y };
}

/** Pick the more-visible of a left/right landmark pair (for side views). */
function morevisible(raw: RawLandmark[], a: number, b: number): Point {
  return raw[a].visibility >= raw[b].visibility ? pt(raw, a) : pt(raw, b);
}

/**
 * Order a subject-left/right pair by screen x so the returned [screenLeft,
 * screenRight] is intuitive from the viewer's perspective (used for
 * "left-low / right-low" style readouts on front/back views).
 */
function byScreen(raw: RawLandmark[], a: number, b: number): [Point, Point] {
  const pa = pt(raw, a);
  const pb = pt(raw, b);
  return pa.x <= pb.x ? [pa, pb] : [pb, pa];
}

/**
 * Convert MediaPipe's 33 raw landmarks into PostureLab's clinical landmark set
 * appropriate for the given view.
 */
export function mapLandmarks(raw: RawLandmark[], view: ViewType): Landmarks {
  if (view === 'lateral') {
    return {
      ear: morevisible(raw, IDX.earL, IDX.earR),
      shoulder: morevisible(raw, IDX.shoulderL, IDX.shoulderR),
      hip: morevisible(raw, IDX.hipL, IDX.hipR),
      knee: morevisible(raw, IDX.kneeL, IDX.kneeR),
      ankle: morevisible(raw, IDX.ankleL, IDX.ankleR),
    };
  }

  const [eyeL, eyeR] = byScreen(raw, IDX.eyeL, IDX.eyeR);
  const [earL, earR] = byScreen(raw, IDX.earL, IDX.earR);
  const [shoulderL, shoulderR] = byScreen(raw, IDX.shoulderL, IDX.shoulderR);
  const [hipL, hipR] = byScreen(raw, IDX.hipL, IDX.hipR);
  const [kneeL, kneeR] = byScreen(raw, IDX.kneeL, IDX.kneeR);
  const [ankleL, ankleR] = byScreen(raw, IDX.ankleL, IDX.ankleR);

  return {
    eyeL, eyeR,
    earL, earR,
    shoulderL, shoulderR,
    hipL, hipR,
    kneeL, kneeR,
    ankleL, ankleR,
  };
}

/** The landmark keys that are editable/drawn for a given view, in draw order. */
export function keysForView(view: ViewType): (keyof Landmarks)[] {
  if (view === 'lateral') return ['ear', 'shoulder', 'hip', 'knee', 'ankle'];
  return [
    'eyeL', 'eyeR',
    'earL', 'earR',
    'shoulderL', 'shoulderR',
    'hipL', 'hipR',
    'kneeL', 'kneeR',
    'ankleL', 'ankleR',
  ];
}

/** Human labels for landmark keys (shown on hover / in the editor). */
export const LANDMARK_LABELS: Record<string, string> = {
  ear: 'Ear', shoulder: 'Shoulder', hip: 'Hip', knee: 'Knee', ankle: 'Ankle',
  eyeL: 'Left eye', eyeR: 'Right eye',
  earL: 'Left ear', earR: 'Right ear',
  shoulderL: 'Left shoulder', shoulderR: 'Right shoulder',
  hipL: 'Left hip', hipR: 'Right hip',
  kneeL: 'Left knee', kneeR: 'Right knee',
  ankleL: 'Left ankle', ankleR: 'Right ankle',
};

/**
 * Fallback landmark positions when auto-detection is unavailable, so the user
 * can drag them onto the body manually. Spread down the vertical centerline.
 */
export function defaultLandmarks(view: ViewType): Landmarks {
  if (view === 'lateral') {
    return {
      ear: { x: 0.5, y: 0.12 },
      shoulder: { x: 0.5, y: 0.28 },
      hip: { x: 0.5, y: 0.52 },
      knee: { x: 0.5, y: 0.74 },
      ankle: { x: 0.5, y: 0.94 },
    };
  }
  return {
    eyeL: { x: 0.45, y: 0.1 }, eyeR: { x: 0.55, y: 0.1 },
    earL: { x: 0.42, y: 0.12 }, earR: { x: 0.58, y: 0.12 },
    shoulderL: { x: 0.38, y: 0.28 }, shoulderR: { x: 0.62, y: 0.28 },
    hipL: { x: 0.43, y: 0.54 }, hipR: { x: 0.57, y: 0.54 },
    kneeL: { x: 0.44, y: 0.75 }, kneeR: { x: 0.56, y: 0.75 },
    ankleL: { x: 0.45, y: 0.94 }, ankleR: { x: 0.55, y: 0.94 },
  };
}
