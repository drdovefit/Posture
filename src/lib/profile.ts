/**
 * The user's profile. Stored locally per device. It quietly personalizes the
 * posture ranges and wording (see measure/personalize.ts). Nothing here is ever
 * shown as "we adjusted for X" in the app.
 */

export type Sex = 'female' | 'male' | 'unspecified';
export type Pregnancy = 'none' | 'pregnant' | 'postpartum';
export type Fitness = 'sedentary' | 'active' | 'very_active' | 'unspecified';
export type Condition =
  | 'scoliosis'
  | 'kyphosis'
  | 'hypermobility'
  | 'arthritis'
  | 'spineSurgery';
export type Injury =
  | 'legLength'
  | 'hipReplacement'
  | 'kneeReplacement'
  | 'ankleFoot'
  | 'shoulder';

export interface Profile {
  sex?: Sex;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  pregnancy?: Pregnancy;
  conditions?: Condition[];
  injuries?: Injury[];
  fitness?: Fitness;
}

const KEY = 'posturelab-profile';

function load(): Profile {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Profile;
  } catch {
    return {};
  }
}

let current: Profile = load();

export function getProfile(): Profile {
  return current;
}

export function setProfile(p: Profile): void {
  current = p;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable */
  }
}

/** Body-mass index from height and weight, or undefined if either is missing. */
export function bmi(p: Profile): number | undefined {
  if (!p.heightCm || !p.weightKg) return undefined;
  const m = p.heightCm / 100;
  return p.weightKg / (m * m);
}
