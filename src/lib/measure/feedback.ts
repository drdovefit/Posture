import type { Metric } from '../types';

interface Band {
  min: number;
  title: string;
  detail: string;
}

/**
 * Turn a 0..100 posture score into a specific, graded message. There are ~25
 * bands so a 96 reads differently from a 90, and a 62 differently from a 55.
 * Plain wording, no jargon.
 */
const BANDS: Band[] = [
  { min: 97, title: 'Practically perfect', detail: 'Your joints stack almost dead straight. Whatever you are doing, keep doing it.' },
  { min: 94, title: 'Outstanding', detail: 'Extremely well stacked, with only the tiniest deviations left.' },
  { min: 91, title: 'Excellent', detail: 'Very strong posture with barely anything to change.' },
  { min: 88, title: 'Really strong', detail: 'Great overall, with just one or two small things to polish.' },
  { min: 85, title: 'Great', detail: 'Solid posture that sits ahead of most people.' },
  { min: 82, title: 'Very good', detail: 'Well balanced, with a couple of mild things to keep an eye on.' },
  { min: 79, title: 'Good', detail: 'Mostly stacked, with a few small drifts to tidy up.' },
  { min: 76, title: 'Pretty good', detail: 'Above average, with a little room to clean up.' },
  { min: 73, title: 'Decent', detail: 'A fair base, with a handful of mild areas to work on.' },
  { min: 70, title: 'Fair', detail: 'A mix of good and mildly off areas. A little work goes a long way.' },
  { min: 67, title: 'Okay', detail: 'Some areas are holding well, others are starting to drift.' },
  { min: 64, title: 'Getting there', detail: 'A few things are pulling you off. Pick one to start with.' },
  { min: 61, title: 'Needs some work', detail: 'Several mild to moderate areas are adding up.' },
  { min: 58, title: 'Needs work', detail: 'A number of areas are off. Steady effort will show quickly.' },
  { min: 55, title: 'Off in places', detail: 'Multiple moderate areas. Focus on the two lowest first.' },
  { min: 52, title: 'Noticeably off', detail: 'Deviations are stacking up in a few spots.' },
  { min: 49, title: 'Quite off', detail: 'Posture is off in several places. Take it one area at a time.' },
  { min: 46, title: 'Well off', detail: 'A lot is drifting. Start small and re-check often.' },
  { min: 43, title: 'Significantly off', detail: 'Meaningful deviations across the body.' },
  { min: 40, title: 'Very off', detail: 'Posture is off in many places. Daily work will move it.' },
  { min: 36, title: 'Major imbalance', detail: 'Large deviations across the board.' },
  { min: 32, title: 'Heavily off', detail: 'Most areas need attention. Work through them one at a time.' },
  { min: 28, title: 'Very heavily off', detail: 'Broad, large deviations. Small steady steps add up.' },
  { min: 20, title: 'Severe imbalance', detail: 'Posture is far off across the body.' },
  { min: 0, title: 'Rebuild from here', detail: 'A lot to work on. Start with one area and track it each week.' },
];

export function scoreFeedback(score: number): { title: string; detail: string } {
  const s = Math.round(score);
  if (s <= 0) {
    return {
      title: 'No score yet',
      detail: 'Line the points up on your joints to get a reading.',
    };
  }
  const band = BANDS.find((b) => s >= b.min) ?? BANDS[BANDS.length - 1];
  return { title: band.title, detail: band.detail };
}

/**
 * A short, value-aware phrase for one metric, combining how far off it is with
 * a plain descriptor so a small deviation reads differently from a large one.
 */
export function metricPhrase(m: Metric): string {
  const v = Math.abs(m.value);
  const good = m.normal.match(/0[^\d]*(\d+)/);
  const goodMax = good ? Number(good[1]) : 5;
  if (m.severity === 'good') {
    return v <= goodMax * 0.4 ? 'Right on the line.' : 'Within the average range.';
  }
  const over = v / Math.max(goodMax, 1);
  if (m.severity === 'mild') {
    return over < 1.5 ? 'Slightly off.' : 'Mildly off.';
  }
  return over < 2.5 ? 'Moderately off.' : 'Noticeably off.';
}
