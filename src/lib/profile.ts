/**
 * The user's profile. Stored locally per device. It quietly personalizes the
 * posture ranges and wording (see measure/personalize.ts). Nothing here is ever
 * shown as "we adjusted for X" in the app.
 */

export type Sex = 'female' | 'male' | 'unspecified';
export type Pregnancy = 'none' | 'pregnant' | 'postpartum';
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
  /** ISO date (YYYY-MM-DD); age is derived from this so it stays current. */
  birthday?: string;
  /** Legacy fallback when no birthday is set. */
  age?: number;
  heightCm?: number;
  weightKg?: number;
  pregnancy?: Pregnancy;
  conditions?: Condition[];
  injuries?: Injury[];
  /** Activity level 1 (sedentary) to 5 (athletic). Shapes tips, not the score. */
  fitness?: number;
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

/** Current age, derived from birthday (so it updates itself), else legacy age. */
export function ageFromProfile(p: Profile): number | undefined {
  if (p.birthday) {
    const b = new Date(p.birthday);
    if (!Number.isNaN(b.getTime())) {
      const now = new Date();
      let age = now.getFullYear() - b.getFullYear();
      const m = now.getMonth() - b.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1;
      return age >= 0 && age < 130 ? age : undefined;
    }
  }
  return p.age;
}

/** Body-mass index from height and weight, or undefined if either is missing. */
export function bmi(p: Profile): number | undefined {
  if (!p.heightCm || !p.weightKg) return undefined;
  const m = p.heightCm / 100;
  return p.weightKg / (m * m);
}
