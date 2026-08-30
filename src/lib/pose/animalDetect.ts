import { FilesetResolver, ImageClassifier } from '@mediapipe/tasks-vision';

/**
 * A tiny, opt-in easter egg: if a photo has no human in it, we run an image
 * classifier and, only when it is very confident (>= 95%), report a cat or dog.
 * Runs entirely in the browser. Loads its model from the MediaPipe CDN and
 * degrades to null if that isn't reachable, so it never breaks a normal scan.
 */

const CDN_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL =
  'https://storage.googleapis.com/mediapipe-models/image_classifier/efficientnet_lite0/float32/1/efficientnet_lite0.tflite';

const THRESHOLD = 0.95;

// ImageNet domestic-cat classes (keyword match, avoids "polecat" etc.).
const CAT = ['tabby', 'tiger cat', 'persian cat', 'siamese', 'egyptian cat'];
// Common ImageNet dog-breed keywords.
const DOG = [
  'dog', 'retriever', 'terrier', 'spaniel', 'poodle', 'bulldog', 'hound',
  'shepherd', 'husky', 'collie', 'mastiff', 'chihuahua', 'dachshund', 'beagle',
  'boxer', 'pug', 'corgi', 'labrador', 'pomeranian', 'rottweiler', 'pointer',
  'setter', 'schnauzer', 'dalmatian', 'great dane', 'samoyed', 'malamute',
  'doberman', 'pekinese', 'papillon', 'chow', 'whippet', 'vizsla', 'weimaraner',
  'ridgeback', 'malinois', 'griffon', 'sennenhund', 'saluki', 'borzoi', 'basenji',
  'keeshond', 'affenpinscher', 'komondor', 'kuvasz',
];

let promise: Promise<ImageClassifier> | null = null;
function get(): Promise<ImageClassifier> {
  if (!promise) {
    promise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(CDN_WASM);
      return ImageClassifier.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL },
        maxResults: 3,
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
    const clf = await get();
    const top = clf.classify(img).classifications?.[0]?.categories?.[0];
    if (!top || (top.score ?? 0) < THRESHOLD) return null;
    const name = (top.categoryName || '').toLowerCase();
    if (CAT.some((k) => name.includes(k))) return 'cat';
    if (DOG.some((k) => name.includes(k))) return 'dog';
    return null;
  } catch {
    return null;
  }
}
