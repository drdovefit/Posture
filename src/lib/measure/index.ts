import type {
  AnalysisResult,
  Landmarks,
  Metric,
  Point,
  Severity,
  ViewType,
} from '../types';
import {
  angleAtVertex,
  angleFromVertical,
  clamp,
  distance,
  midpoint,
  tiltFromHorizontal,
} from './geometry';

/**
 * The measurement engine. Given a set of landmarks (normalized 0..1 image
 * coordinates, y increasing downward) and a view, it computes a list of posture
 * metrics, each with a severity band and explanation, and an aggregate 0–100
 * score. All functions here are pure so they can be unit-tested without a DOM.
 */

interface Band {
  /** Upper bound (inclusive) of the "good" range. */
  good: number;
  /** Upper bound (inclusive) of the "mild" range. Above this is "moderate". */
  mild: number;
}

function severityFor(value: number, band: Band): Severity {
  const v = Math.abs(value);
  if (v <= band.good) return 'good';
  if (v <= band.mild) return 'mild';
  return 'moderate';
}

/** Penalty (0..1 of this metric's weight) grows with deviation past "good". */
function penaltyFor(value: number, band: Band): number {
  const v = Math.abs(value);
  if (v <= band.good) return 0;
  // Scale so that reaching the "mild" bound = 0.5, and 2× the mild bound = 1.0.
  const span = Math.max(band.mild - band.good, 1e-6);
  return clamp((v - band.good) / (span * 2), 0, 1);
}

interface MetricSpec {
  id: string;
  label: string;
  unit: Metric['unit'];
  band: Band;
  weight: number;
  /** How to phrase the numeric value. */
  format: (value: number) => string;
  explain: (severity: Severity, value: number) => string;
  normal: string;
}

function buildMetric(spec: MetricSpec, value: number): Metric {
  const severity = severityFor(value, spec.band);
  return {
    id: spec.id,
    label: spec.label,
    value: Math.round(value * 10) / 10,
    unit: spec.unit,
    display: spec.format(value),
    severity,
    explanation: spec.explain(severity, value),
    normal: spec.normal,
  };
}

// --- Lateral (side) view ------------------------------------------------------

function analyzeLateral(lm: Landmarks): { metrics: Metric[]; specs: MetricSpec[] } {
  const metrics: Metric[] = [];
  const usedSpecs: MetricSpec[] = [];
  const have = (...ps: (Point | undefined)[]) => ps.every(Boolean) as boolean;

  // Body scale = vertical trunk+leg span, used for % offsets.
  const scale =
    lm.shoulder && lm.ankle ? Math.max(distance(lm.shoulder, lm.ankle), 1e-6) : 1;

  const push = (spec: MetricSpec, value: number) => {
    usedSpecs.push(spec);
    metrics.push(buildMetric(spec, value));
  };

  if (have(lm.ear, lm.shoulder)) {
    const angle = Math.abs(angleFromVertical(lm.ear!, lm.shoulder!));
    push(
      {
        id: 'forwardHead',
        label: 'Forward Head',
        unit: '°',
        band: { good: 5, mild: 12 },
        weight: 1.2,
        format: (v) => `${v.toFixed(1)}° from vertical`,
        normal: '0–5° (ear over shoulder)',
        explain: (s) =>
          s === 'good'
            ? 'Head is well stacked over the shoulders.'
            : 'The head sits forward of the shoulders — common with screen/desk use, loading the neck extensors.',
      },
      angle,
    );
  }

  if (have(lm.shoulder, lm.hip)) {
    const angle = Math.abs(angleFromVertical(lm.shoulder!, lm.hip!));
    push(
      {
        id: 'trunkLean',
        label: 'Trunk Lean',
        unit: '°',
        band: { good: 4, mild: 10 },
        weight: 1,
        format: (v) => `${v.toFixed(1)}° from vertical`,
        normal: '0–4° (shoulder over hip)',
        explain: (s) =>
          s === 'good'
            ? 'The trunk is stacked vertically over the pelvis.'
            : 'The upper body leans away from vertical, shifting load through the spine.',
      },
      angle,
    );
  }

  if (have(lm.hip, lm.ankle)) {
    const angle = Math.abs(angleFromVertical(lm.hip!, lm.ankle!));
    push(
      {
        id: 'pelvisShift',
        label: 'Hip / Pelvis Position',
        unit: '°',
        band: { good: 4, mild: 9 },
        weight: 1,
        format: (v) => `${v.toFixed(1)}° from vertical`,
        normal: '0–4° (hip over ankle)',
        explain: (s) =>
          s === 'good'
            ? 'The pelvis is balanced over the base of support.'
            : 'The pelvis is shifted relative to the ankles, altering the line of gravity through the legs.',
      },
      angle,
    );
  }

  if (have(lm.pelvisFront, lm.pelvisBack)) {
    // Tilt of the ASIS(front)→PSIS(back) line. Positive = front hip drops below
    // the back hip = anterior pelvic tilt; negative = posterior tilt. Level = 0.
    const dxAbs = Math.max(Math.abs(lm.pelvisFront!.x - lm.pelvisBack!.x), 1e-6);
    const drop = lm.pelvisFront!.y - lm.pelvisBack!.y; // +y is down the screen
    const tilt = (Math.atan2(drop, dxAbs) * 180) / Math.PI;
    push(
      {
        id: 'pelvicTilt',
        label: 'Pelvic Tilt',
        unit: '°',
        band: { good: 6, mild: 14 },
        weight: 1.2,
        format: (v) =>
          `${Math.abs(v).toFixed(1)}° ${v > 1 ? 'anterior' : v < -1 ? 'posterior' : 'neutral'}`,
        normal: '0–6° (front & back hip roughly level)',
        explain: (s, v) =>
          s === 'good'
            ? 'The pelvis is close to a neutral tilt.'
            : v > 0
              ? 'Anterior pelvic tilt: the front of the pelvis drops forward and down, arching the low back — often tight hip flexors with under-active glutes and deep core.'
              : 'Posterior pelvic tilt: the pelvis is tucked under, flattening the low back — often tight hamstrings/abs with under-active hip flexors.',
      },
      tilt,
    );
  }

  if (have(lm.hip, lm.knee, lm.ankle)) {
    const dev = 180 - angleAtVertex(lm.knee!, lm.hip!, lm.ankle!);
    push(
      {
        id: 'kneeAlign',
        label: 'Knee Alignment',
        unit: '°',
        band: { good: 6, mild: 14 },
        weight: 0.8,
        format: (v) => `${v.toFixed(1)}° off straight`,
        normal: '0–6° (slight soft-knee)',
        explain: (s) =>
          s === 'good'
            ? 'Knees are close to neutral extension.'
            : 'The knee is notably bent or hyper-extended in standing, which shifts pelvic and ankle mechanics.',
      },
      dev,
    );
  }

  if (have(lm.ear, lm.ankle)) {
    const offsetPct = (Math.abs(lm.ear!.x - lm.ankle!.x) / scale) * 100;
    push(
      {
        id: 'plumbAlign',
        label: 'Overall Plumb Alignment',
        unit: '%',
        band: { good: 6, mild: 14 },
        weight: 1,
        format: (v) => `${v.toFixed(1)}% of body height`,
        normal: '0–6% (ear roughly over ankle)',
        explain: (s) =>
          s === 'good'
            ? 'Ear, and therefore the head, tracks over the base of support.'
            : 'The head is carried well forward or behind the ankles — the whole body is off the ideal plumb line.',
      },
      offsetPct,
    );
  }

  return { metrics, specs: usedSpecs };
}

// --- Anterior / Posterior (front / back) view --------------------------------

function analyzeFrontal(lm: Landmarks): { metrics: Metric[]; specs: MetricSpec[] } {
  const metrics: Metric[] = [];
  const usedSpecs: MetricSpec[] = [];
  const have = (...ps: (Point | undefined)[]) => ps.every(Boolean) as boolean;

  const shoulderMid =
    lm.shoulderL && lm.shoulderR ? midpoint(lm.shoulderL, lm.shoulderR) : undefined;
  const hipMid = lm.hipL && lm.hipR ? midpoint(lm.hipL, lm.hipR) : undefined;
  const ankleMid =
    lm.ankleL && lm.ankleR ? midpoint(lm.ankleL, lm.ankleR) : undefined;
  const scale =
    shoulderMid && ankleMid ? Math.max(distance(shoulderMid, ankleMid), 1e-6) : 1;

  const push = (spec: MetricSpec, value: number) => {
    usedSpecs.push(spec);
    metrics.push(buildMetric(spec, value));
  };

  const eyeL = lm.eyeL ?? lm.earL;
  const eyeR = lm.eyeR ?? lm.earR;
  if (have(eyeL, eyeR)) {
    const tilt = tiltFromHorizontal(eyeL!, eyeR!);
    push(
      {
        id: 'headTilt',
        label: 'Head Tilt',
        unit: '°',
        band: { good: 2, mild: 5 },
        weight: 1,
        format: (v) => `${Math.abs(v).toFixed(1)}° ${v > 0 ? 'right-low' : v < 0 ? 'left-low' : 'level'}`,
        normal: '0–2° (eyes level)',
        explain: (s) =>
          s === 'good'
            ? 'The head is level.'
            : 'The head is tilted to one side, often paired with neck muscle imbalance.',
      },
      tilt,
    );
  }

  if (have(lm.shoulderL, lm.shoulderR)) {
    const tilt = tiltFromHorizontal(lm.shoulderL!, lm.shoulderR!);
    push(
      {
        id: 'shoulderLevel',
        label: 'Shoulder Level',
        unit: '°',
        band: { good: 2, mild: 5 },
        weight: 1.1,
        format: (v) => `${Math.abs(v).toFixed(1)}° ${v > 0 ? 'right-low' : v < 0 ? 'left-low' : 'level'}`,
        normal: '0–2° (shoulders even)',
        explain: (s) =>
          s === 'good'
            ? 'Shoulders are even in height.'
            : 'One shoulder sits higher than the other — an upper-body asymmetry to watch.',
      },
      tilt,
    );
  }

  if (have(lm.hipL, lm.hipR)) {
    const tilt = tiltFromHorizontal(lm.hipL!, lm.hipR!);
    push(
      {
        id: 'pelvicLevel',
        label: 'Pelvic Level',
        unit: '°',
        band: { good: 2, mild: 5 },
        weight: 1.2,
        format: (v) => `${Math.abs(v).toFixed(1)}° ${v > 0 ? 'right-low' : v < 0 ? 'left-low' : 'level'}`,
        normal: '0–2° (hips even)',
        explain: (s) =>
          s === 'good'
            ? 'The pelvis is level.'
            : 'A lateral pelvic tilt is present, which can relate to leg-length or hip-muscle imbalance.',
      },
      tilt,
    );
  }

  if (shoulderMid && (hipMid || ankleMid)) {
    const base = ankleMid ?? hipMid!;
    const shiftPct = (Math.abs(shoulderMid.x - base.x) / scale) * 100;
    push(
      {
        id: 'lateralShift',
        label: 'Lateral Body Shift',
        unit: '%',
        band: { good: 3, mild: 8 },
        weight: 1,
        format: (v) => `${v.toFixed(1)}% of height`,
        normal: '0–3% (trunk centered)',
        explain: (s) =>
          s === 'good'
            ? 'The trunk is centered over the base of support.'
            : 'The upper body is shifted to one side relative to the feet.',
      },
      shiftPct,
    );
  }

  // Knee (valgus / varus) — compare knee separation to hip & ankle separation.
  if (
    have(lm.hipL, lm.hipR, lm.kneeL, lm.kneeR, lm.ankleL, lm.ankleR)
  ) {
    const kneeSep = Math.abs(lm.kneeL!.x - lm.kneeR!.x);
    const refSep =
      (Math.abs(lm.hipL!.x - lm.hipR!.x) + Math.abs(lm.ankleL!.x - lm.ankleR!.x)) / 2;
    // Negative = knees closer than reference (valgus/knock), positive = wider (varus/bow).
    const pct = ((kneeSep - refSep) / Math.max(refSep, 1e-6)) * 100;
    push(
      {
        id: 'kneeValgus',
        label: 'Knee (Valgus/Varus)',
        unit: '%',
        band: { good: 12, mild: 25 },
        weight: 0.8,
        format: (v) =>
          `${Math.abs(v).toFixed(0)}% ${v < 0 ? 'knock-kneed' : v > 0 ? 'bow-legged' : 'neutral'}`,
        normal: 'within ±12% of hip/ankle width',
        explain: (s) =>
          s === 'good'
            ? 'Knee tracking is close to neutral.'
            : 'The knees converge (valgus) or bow out (varus) relative to hips and ankles.',
      },
      pct,
    );
  }

  return { metrics, specs: usedSpecs };
}

/** Map a flagged metric to corrective-suggestion ids (see suggestions.ts). */
function suggestionsForMetric(id: string, value = 0): string[] {
  // Pelvic tilt suggestions depend on direction (anterior vs posterior).
  if (id === 'pelvicTilt') {
    return value >= 0
      ? ['hipFlexorStretch', 'gluteActivation', 'pelvicNeutralCue']
      : ['hamstringMobility', 'hipFlexorActivation', 'pelvicNeutralCue'];
  }
  const map: Record<string, string[]> = {
    forwardHead: ['chinTuck', 'chestOpener'],
    trunkLean: ['coreStability', 'hipFlexorStretch'],
    pelvisShift: ['gluteActivation', 'coreStability'],
    kneeAlign: ['quadStretch', 'calfStretch'],
    plumbAlign: ['postureAwareness', 'coreStability'],
    headTilt: ['neckStretch', 'postureAwareness'],
    shoulderLevel: ['scapularStrength', 'chestOpener'],
    pelvicLevel: ['gluteActivation', 'hipMobility'],
    lateralShift: ['coreStability', 'hipMobility'],
    kneeValgus: ['gluteActivation', 'quadStretch'],
  };
  return map[id] ?? [];
}

/** Run the full analysis for a view. */
export function analyze(view: ViewType, lm: Landmarks): AnalysisResult {
  const { metrics, specs } =
    view === 'lateral' ? analyzeLateral(lm) : analyzeFrontal(lm);

  // Weighted score. Total possible penalty = sum of weights; score scales that.
  let totalWeight = 0;
  let penalty = 0;
  metrics.forEach((m, i) => {
    const spec = specs[i];
    totalWeight += spec.weight;
    penalty += penaltyFor(m.value, spec.band) * spec.weight;
  });
  const score =
    totalWeight > 0 ? Math.round(clamp(100 - (penalty / totalWeight) * 100, 0, 100)) : 0;

  // Order suggestions most-important first: metrics with a worse severity come
  // first, keeping the natural metric order within the same severity. Every
  // flagged area is still included — just in a nicer order.
  const sevRank: Record<Severity, number> = { moderate: 0, mild: 1, good: 2 };
  const suggestionIds = Array.from(
    new Set(
      metrics
        .filter((m) => m.severity !== 'good')
        .slice()
        .sort((a, b) => sevRank[a.severity] - sevRank[b.severity])
        .flatMap((m) => suggestionsForMetric(m.id, m.value)),
    ),
  );

  return { metrics, score, suggestionIds };
}

export { severityFor, penaltyFor };
