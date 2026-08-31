import { db } from './db';
import { analyze } from './measure';
import type { Profile } from './profile';

/**
 * Recompute the metrics and score of every saved assessment using the given
 * profile, and write them back. Used by the profile screen to apply preferences
 * to past scans, or (with an empty profile) to reset them to the neutral score.
 * Returns how many were updated.
 */
export async function rescoreAll(profile: Profile): Promise<number> {
  const all = await db.assessments.toArray();
  for (const a of all) {
    if (a.id == null) continue;
    const r = analyze(a.view, a.landmarks, profile);
    await db.assessments.update(a.id, { metrics: r.metrics, score: r.score });
  }
  return all.length;
}
