import type { Profile } from '../profile';

/**
 * Exercise safety gating.
 *
 * Given the user's profile (the conditions / injuries / pregnancy boxes they
 * ticked), decide for each exercise or video whether to show it as-is, show it
 * with a caution, or hide it and offer a safer alternative.
 *
 * This is educational guidance grounded in standard advice (ACOG prenatal,
 * joint-replacement precautions, hypermobility physio consensus). It is NOT
 * medical clearance — every caution ends by pointing the user to a professional.
 * A licensed physio should review this mapping before it ships to real users.
 */

/** Every flag we can gate on, drawn straight from the profile boxes. */
export type SafetyFlag =
  | 'scoliosis'
  | 'kyphosis'
  | 'hypermobility'
  | 'arthritis'
  | 'spineSurgery'
  | 'osteoporosis'
  | 'legLength'
  | 'hipReplacement'
  | 'kneeReplacement'
  | 'ankleFoot'
  | 'shoulder'
  | 'pregnant'
  | 'postpartum';

export const FLAG_LABEL: Record<SafetyFlag, string> = {
  scoliosis: 'scoliosis',
  kyphosis: 'a rounded upper back',
  hypermobility: 'hypermobility',
  arthritis: 'arthritis',
  spineSurgery: 'past spine surgery',
  osteoporosis: 'low bone density',
  legLength: 'a leg-length difference',
  hipReplacement: 'a hip replacement',
  kneeReplacement: 'a knee replacement',
  ankleFoot: 'an ankle or foot injury',
  shoulder: 'a shoulder injury',
  pregnant: 'pregnancy',
  postpartum: 'being postpartum',
};

/** Collect the active safety flags from a profile. */
export function activeFlags(p: Profile): SafetyFlag[] {
  const flags: SafetyFlag[] = [];
  for (const c of p.conditions ?? []) flags.push(c as SafetyFlag);
  for (const i of p.injuries ?? []) flags.push(i as SafetyFlag);
  if (p.pregnancy === 'pregnant') flags.push('pregnant');
  if (p.pregnancy === 'postpartum') flags.push('postpartum');
  return flags;
}

export type Decision = 'ok' | 'modify' | 'hide';

interface Rule {
  /** Flags that hide the exercise outright. */
  hide?: SafetyFlag[];
  /** Flags that keep it but lead with a caution. */
  modify?: SafetyFlag[];
  /** What to do instead (shown in the caution card). */
  alt: string;
  /** Why, in one plain line. */
  reason: string;
}

/**
 * Rules keyed by the app's exercise/suggestion id. Anything not listed here is
 * considered safe for everyone (e.g. awareness cues, chin tucks).
 */
const RULES: Record<string, Rule> = {
  chestOpener: {
    modify: ['hypermobility', 'pregnant', 'shoulder'],
    reason: 'Deep chest stretching can overload loose or sore shoulders.',
    alt: 'a gentle version — stop at an easy stretch, never at end range, and skip it if the shoulder pinches',
  },
  coreStability: {
    modify: ['spineSurgery', 'pregnant', 'postpartum'],
    reason: 'Loaded core work needs a settled, neutral spine.',
    alt: 'the gentle, neutral-spine version (or wait for clearance after surgery or birth); if pregnant, do it propped up on an incline rather than flat on your back',
  },
  hipFlexorStretch: {
    modify: ['hypermobility', 'pregnant', 'hipReplacement'],
    reason: 'Strong hip stretching can push a loose or replaced hip too far.',
    alt: 'a shorter, gentler stretch within the limits your surgeon or physio set, and don’t force the range',
  },
  gluteActivation: {
    modify: ['pregnant', 'postpartum', 'hipReplacement'],
    reason: 'Lying flat on your back late in pregnancy, and deep hip bend after a hip replacement, are best avoided.',
    alt: 'a propped-up (incline) bridge if pregnant, and a shallow range within your hip precautions',
  },
  quadStretch: {
    modify: ['kneeReplacement', 'hypermobility', 'arthritis'],
    reason: 'Bending the knee hard behind you can strain a replaced or arthritic knee.',
    alt: 'a gentler range that stays pain-free — a lying or standing version that doesn’t force the knee',
  },
  calfStretch: {
    modify: ['ankleFoot'],
    reason: 'Loading a healing ankle or foot can set it back.',
    alt: 'a light, pain-free ankle range (seated is fine) and get a painful or swollen ankle checked first',
  },
  neckStretch: {
    modify: ['hypermobility'],
    reason: 'Loose neck joints don’t need more stretch.',
    alt: 'a very gentle ease into the stretch with no pulling on your head',
  },
  scapularStrength: {
    modify: ['shoulder'],
    reason: 'Overhead and end-range shoulder work can aggravate an injury.',
    alt: 'keep the arms low and the range pain-free — nothing overhead if it pinches',
  },
  hipMobility: {
    modify: ['hipReplacement', 'hypermobility'],
    reason: 'Deep hip rotation and crossing the leg over midline break hip-replacement precautions.',
    alt: 'gentle, pain-free hip movement that never crosses the leg past your midline',
  },
  hamstringMobility: {
    hide: ['spineSurgery'],
    modify: ['osteoporosis', 'hypermobility', 'pregnant'],
    reason: 'Bending forward through the spine is the risky part for fragile or recently operated backs.',
    alt: 'hinge from the hips with a flat back (or wait for clearance after spine surgery); keep it gentle and pain-free',
  },
  hipFlexorActivation: {
    modify: ['hipReplacement'],
    reason: 'Keep hip movements inside your replacement precautions.',
    alt: 'small, controlled marches within the range your surgeon allowed',
  },
};

export interface ScreenResult {
  status: Decision;
  /** Flags that triggered this decision. */
  flags: SafetyFlag[];
  /** Ready-to-show caution text (empty when status is 'ok'). */
  message: string;
}

/** Screen a single exercise/suggestion id against a profile. */
export function screenExercise(id: string, title: string, p: Profile): ScreenResult {
  const rule = RULES[id];
  if (!rule) return { status: 'ok', flags: [], message: '' };
  const active = new Set(activeFlags(p));

  const hitHide = (rule.hide ?? []).filter((f) => active.has(f));
  const hitModify = (rule.modify ?? []).filter((f) => active.has(f));

  if (hitHide.length === 0 && hitModify.length === 0) {
    return { status: 'ok', flags: [], message: '' };
  }

  const status: Decision = hitHide.length > 0 ? 'hide' : 'modify';
  const flags = status === 'hide' ? hitHide : hitModify;
  const names = flags.map((f) => FLAG_LABEL[f]);
  const list =
    names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;

  const lead =
    status === 'hide'
      ? `Because you told us about ${list}, we’ve hidden “${title}.”`
      : `Because you told us about ${list}, take “${title}” carefully.`;

  const message = `${lead} ${rule.reason} Instead, do ${rule.alt}. Check with your doctor or physio before starting, and stop if it hurts.`;

  return { status, flags, message };
}
