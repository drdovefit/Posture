import type { Metric } from '../types';

/**
 * Turn a 0–100 posture score into a specific, graded message. The bands are
 * fine (roughly every 5 points) and each carries its own wording, so a 96 reads
 * differently from a 90, and a 62 differently from a 55.
 */
export function scoreFeedback(score: number): { title: string; detail: string } {
  const s = Math.round(score);
  if (s >= 97) return { title: 'Near-perfect alignment', detail: 'Your joints stack almost exactly on the plumb line. This is textbook posture — keep doing what you’re doing.' };
  if (s >= 93) return { title: 'Excellent posture', detail: 'Very well aligned with only the tiniest deviations. Small maintenance work keeps you here.' };
  if (s >= 88) return { title: 'Great posture', detail: 'Strong overall alignment with one or two minor areas to polish. You’re ahead of most people.' };
  if (s >= 83) return { title: 'Good posture', detail: 'Solid alignment with a couple of mild deviations worth a little attention.' };
  if (s >= 77) return { title: 'Above average', detail: 'Mostly balanced, but a few areas are starting to drift — a good time to correct them.' };
  if (s >= 70) return { title: 'Fair posture', detail: 'A mix of good and mild-to-moderate areas. Targeted work will move the needle quickly.' };
  if (s >= 62) return { title: 'Needs attention', detail: 'Several areas are pulling you off the plumb line. Focus on the flagged items below.' };
  if (s >= 52) return { title: 'Noticeable imbalance', detail: 'Multiple moderate deviations are stacking up. Prioritise the two lowest-scoring areas first.' };
  if (s >= 40) return { title: 'Significant imbalance', detail: 'Posture is meaningfully off in several places. Steady daily work will show clear progress.' };
  return { title: 'Major imbalance', detail: 'Large deviations across the board. Start with one area at a time and re-check weekly.' };
}

/**
 * A short, value-aware phrase for one metric — combines how far off it is with
 * a specific descriptor so 4.2° reads differently from 12°.
 */
export function metricPhrase(m: Metric): string {
  const v = Math.abs(m.value);
  const good = m.normal.match(/0[–-]?(\d+)/);
  const goodMax = good ? Number(good[1]) : 5;
  if (m.severity === 'good') {
    return v <= goodMax * 0.4 ? 'Excellent — right on the line.' : 'Good — within the normal range.';
  }
  const over = v / Math.max(goodMax, 1);
  if (m.severity === 'mild') {
    return over < 1.5 ? 'Slightly off — easy to correct.' : 'Mildly off — worth some focus.';
  }
  return over < 2.5 ? 'Moderately off — make this a priority.' : 'Well off — start here.';
}
