// Core domain types for PostureLab.

/** A point in normalized image coordinates (0..1 for x and y). */
export interface Point {
  x: number;
  y: number;
}

/** The three postural assessment views. */
export type ViewType = 'anterior' | 'lateral' | 'posterior';

/**
 * The clinical landmark set PostureLab works with. Not every landmark is used
 * in every view — the measurement engine picks the ones relevant to the view.
 * For lateral views only one side is visible, so the generic (unsided) keys are
 * used. For anterior/posterior views the left/right pairs are used.
 */
export type LandmarkKey =
  // Lateral (single visible side)
  | 'ear'
  | 'shoulder'
  | 'hip'
  | 'knee'
  | 'ankle'
  // Bilateral (front/back)
  | 'earL' | 'earR'
  | 'eyeL' | 'eyeR'
  | 'shoulderL' | 'shoulderR'
  | 'hipL' | 'hipR'
  | 'kneeL' | 'kneeR'
  | 'ankleL' | 'ankleR';

export type Landmarks = Partial<Record<LandmarkKey, Point>>;

export type Severity = 'good' | 'mild' | 'moderate';

/** A single computed posture metric. */
export interface Metric {
  id: string;
  label: string;
  /** Numeric value (degrees or % of body height, see `unit`). */
  value: number;
  unit: '°' | '%' | 'cm*';
  /** Human-readable value, e.g. "4.2° forward". */
  display: string;
  severity: Severity;
  /** Plain-language explanation of what the finding means. */
  explanation: string;
  /** Normal reference range description. */
  normal: string;
}

export interface AnalysisResult {
  metrics: Metric[];
  /** Overall posture score, 0 (poor) – 100 (ideal). */
  score: number;
  /** Corrective-suggestion ids triggered by flagged metrics. */
  suggestionIds: string[];
}

export interface Client {
  id?: number;
  name: string;
  dob?: string;
  notes?: string;
  createdAt: number;
}

export interface Assessment {
  id?: number;
  clientId: number;
  createdAt: number;
  view: ViewType;
  /** Original uploaded photo. */
  photo: Blob;
  /** Rendered annotated image (plumb line + overlay baked in). */
  annotated?: Blob;
  /** Natural pixel size of the photo, for coordinate mapping. */
  imageWidth: number;
  imageHeight: number;
  landmarks: Landmarks;
  metrics: Metric[];
  score: number;
}

export interface PainEntry {
  id?: number;
  clientId: number;
  createdAt: number;
  /** ISO date (yyyy-mm-dd) the pain refers to. */
  date: string;
  region: string;
  severity: number; // 0..10
  notes?: string;
}
