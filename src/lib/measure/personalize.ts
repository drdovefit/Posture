import { ageFromProfile, bmi, type Profile } from '../profile';

/**
 * Per-metric personalization, grounded in the posture literature (see the
 * research notes shared with the team). Each factor widens the normal range
 * (goodAdd / mildAdd), lowers how much a metric counts (weightMul), and can add
 * a caveat that only shows when the metric is actually flagged. Adjustments
 * stack, then are capped so nothing gets unreasonable.
 *
 * Metric ids: forwardHead, trunkLean, pelvisShift, pelvicTilt, kneeAlign,
 * plumbAlign (lateral); headTilt, shoulderLevel, pelvicLevel, lateralShift,
 * kneeValgus (frontal).
 */
export interface MetricAdjustment {
  goodAdd: number;
  mildAdd: number;
  weightMul: number;
  caveat?: string;
}

export function metricAdjustment(id: string, p: Profile): MetricAdjustment {
  let goodAdd = 0;
  let mildAdd = 0;
  let weightMul = 1;
  const caveats: string[] = [];
  const add = (g: number, m: number, w = 1, c?: string) => {
    goodAdd += g;
    mildAdd += m;
    weightMul *= w;
    if (c) caveats.push(c);
  };

  const { sex, pregnancy, fitness } = p;
  const age = ageFromProfile(p);
  void fitness; // shapes tips elsewhere, never the score
  const b = bmi(p);
  const conditions = p.conditions ?? [];
  const injuries = p.injuries ?? [];

  // Age: forward head and overall stacking ease gradually past 40; teens get a
  // little slack too.
  if (age != null && age > 40) {
    const t = Math.min((age - 40) * 0.1, 5);
    const tp = Math.min((age - 40) * 0.06, 3);
    if (id === 'forwardHead') add(t, t);
    if (id === 'plumbAlign') add(tp, tp);
  }
  if (age != null && age < 18 && (id === 'forwardHead' || id === 'plumbAlign' || id === 'trunkLean')) {
    add(1.5, 1.5);
  }

  // Sex: females carry a touch more anterior pelvic tilt and knee angle.
  if (sex === 'female') {
    if (id === 'pelvicTilt') add(2, 2);
    if (id === 'kneeValgus') add(3, 3);
  }

  // Weight-for-height: only a high BMI widens pelvis / low-back tolerance.
  if (b != null && b >= 30) {
    const heavy = b >= 35 ? 3 : 2;
    if (id === 'pelvicTilt') add(heavy, heavy);
    if (id === 'trunkLean') add(1, 1);
    if (id === 'pelvisShift' || id === 'pelvicLevel') {
      caveats.push('If this looks off, double-check your hip points.');
    }
  }

  // Pregnancy: big, temporary easing of the pelvis and trunk.
  if (pregnancy === 'pregnant') {
    if (id === 'pelvicTilt') add(8, 8, 0.5, 'Extra low-back curve is expected right now.');
    if (id === 'trunkLean') add(3, 3, 0.7);
  } else if (pregnancy === 'postpartum') {
    if (id === 'pelvicTilt') add(4, 4, 0.7);
    if (id === 'trunkLean') add(1.5, 1.5, 0.85);
  }

  // Conditions.
  if (conditions.includes('scoliosis')) {
    if (id === 'shoulderLevel' || id === 'pelvicLevel' || id === 'headTilt') {
      add(3, 4, 0.5, 'Some side-to-side difference is expected; watch your trend over time.');
    }
    if (id === 'lateralShift') {
      add(3, 4, 0.5, 'Some side-to-side difference is expected; watch your trend over time.');
    }
  }
  if (conditions.includes('kyphosis')) {
    if (id === 'forwardHead') add(4, 4, 0.7, 'A firmer upper-back curve can be structural.');
    if (id === 'plumbAlign') add(3, 3, 0.8);
  }
  if (conditions.includes('hypermobility') && id === 'kneeAlign') {
    add(5, 5, 0.8, 'Very mobile joints can read as hyperextended.');
  }
  if (conditions.includes('arthritis')) {
    if (id === 'kneeAlign') add(4, 4, 0.7, 'Some stiffness or offset is expected with arthritis.');
    if (id === 'kneeValgus') add(5, 5, 0.7);
  }
  if (conditions.includes('spineSurgery')) {
    if (id === 'trunkLean') add(3, 3, 0.7, 'Limited trunk movement is expected after spine surgery.');
    if (id === 'pelvicTilt') add(3, 3, 0.8);
  }

  // Injuries, each mapped to one measurement.
  if (injuries.includes('legLength') && id === 'pelvicLevel') {
    add(3, 4, 0.5, 'Uneven hips are expected with a leg-length difference.');
  }
  if (injuries.includes('hipReplacement')) {
    if (id === 'pelvicTilt') add(3, 3, 0.75);
    if (id === 'pelvicLevel') add(3, 3, 0.75);
  }
  if (injuries.includes('kneeReplacement')) {
    if (id === 'kneeAlign') add(4, 4, 0.75);
    if (id === 'kneeValgus') add(5, 5, 0.75);
  }
  if (injuries.includes('ankleFoot') && id === 'plumbAlign') add(3, 3, 0.85);
  if (injuries.includes('shoulder') && id === 'shoulderLevel') {
    add(3, 3, 0.6, 'A past shoulder injury can leave it a little uneven.');
  }

  return {
    goodAdd: Math.min(goodAdd, 12),
    mildAdd: Math.min(mildAdd, 14),
    weightMul: Math.max(weightMul, 0.3),
    caveat: caveats[0],
  };
}
