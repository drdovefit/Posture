import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

/**
 * Lazily-initialized MediaPipe PoseLandmarker. Assets are bundled under
 * /models so detection runs fully client-side and offline. If local assets are
 * unavailable, we fall back to the public CDN.
 */

let landmarkerPromise: Promise<PoseLandmarker> | null = null;

// Prefix with the app's base URL so assets resolve whether the app is served
// from the domain root or a subpath (e.g. GitHub Pages: /Posture/).
const BASE = import.meta.env.BASE_URL || '/';
const LOCAL_WASM = `${BASE}models/wasm`;
const LOCAL_MODEL = `${BASE}models/pose_landmarker_lite.task`;
const CDN_WASM =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const CDN_MODEL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';

async function headOk(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

async function create(): Promise<PoseLandmarker> {
  const useLocal = await headOk(LOCAL_MODEL);
  const wasmBase = useLocal ? LOCAL_WASM : CDN_WASM;
  const modelPath = useLocal ? LOCAL_MODEL : CDN_MODEL;

  const fileset = await FilesetResolver.forVisionTasks(wasmBase);
  return PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: modelPath, delegate: 'GPU' },
    runningMode: 'IMAGE',
    numPoses: 1,
    minPoseDetectionConfidence: 0.4,
    minPosePresenceConfidence: 0.4,
    minTrackingConfidence: 0.4,
  });
}

export function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = create().catch((err) => {
      // Reset so a later retry can attempt again (e.g. after network recovers).
      landmarkerPromise = null;
      throw err;
    });
  }
  return landmarkerPromise;
}

export interface RawLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

/** Detect pose landmarks on an already-decoded image element. */
export async function detectPose(
  image: HTMLImageElement,
): Promise<RawLandmark[] | null> {
  const landmarker = await getPoseLandmarker();
  const result = landmarker.detect(image);
  const first = result.landmarks?.[0];
  if (!first) return null;
  return first.map((p) => ({
    x: p.x,
    y: p.y,
    z: p.z ?? 0,
    visibility: p.visibility ?? 0,
  }));
}
