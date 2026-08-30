import { FilesetResolver, ObjectDetector } from '@mediapipe/tasks-vision';

/**
 * Opt-in easter egg: if a photo has no human in it, look for a cat or dog with
 * an object detector (COCO has dedicated "cat"/"dog" classes, which handles
 * real-world photos far better than image labeling). Runs in the browser,
 * loads its model from the MediaPipe CDN, and degrades to null if unreachable
 * so it never breaks a normal scan.
 */

const CDN_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL =
  'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float32/1/efficientdet_lite0.tflite';

const THRESHOLD = 0.5;

let promise: Promise<ObjectDetector> | null = null;
function get(): Promise<ObjectDetector> {
  if (!promise) {
    promise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(CDN_WASM);
      return ObjectDetector.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL },
        scoreThreshold: 0.35,
        maxResults: 5,
        runningMode: 'IMAGE',
      });
    })().catch((e) => {
      promise = null;
      throw e;
    });
  }
  return promise;
}

export async function classifyAnimal(
  img: HTMLImageElement,
): Promise<'cat' | 'dog' | null> {
  try {
    const detector = await get();
    const detections = detector.detect(img).detections ?? [];
    let best: { name: 'cat' | 'dog'; score: number } | null = null;
    for (const d of detections) {
      const c = d.categories?.[0];
      const name = (c?.categoryName || '').toLowerCase();
      if ((name === 'cat' || name === 'dog') && (!best || (c!.score ?? 0) > best.score)) {
        best = { name, score: c!.score ?? 0 };
      }
    }
    return best && best.score >= THRESHOLD ? best.name : null;
  } catch {
    return null;
  }
}
