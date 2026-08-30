export interface Suggestion {
  id: string;
  title: string;
  category: 'stretch' | 'strengthen' | 'awareness';
  detail: string;
}

/**
 * Educational corrective suggestions keyed by id. These are general wellness
 * tips, NOT medical advice — the UI surfaces a disclaimer alongside them.
 */
export const SUGGESTIONS: Record<string, Suggestion> = {
  chinTuck: {
    id: 'chinTuck',
    title: 'Chin tucks',
    category: 'strengthen',
    detail:
      'Gently draw the chin straight back (making a "double chin"), hold 5s, 10 reps. Retrains deep neck flexors against forward-head posture.',
  },
  chestOpener: {
    id: 'chestOpener',
    title: 'Doorway chest stretch',
    category: 'stretch',
    detail:
      'Forearms on a doorframe, step through and hold 30s. Lengthens tight pecs that pull the shoulders forward.',
  },
  coreStability: {
    id: 'coreStability',
    title: 'Dead-bug / plank core work',
    category: 'strengthen',
    detail:
      'Build anti-extension core control to keep the trunk stacked over the pelvis. 3 sets, 30 to 45s.',
  },
  hipFlexorStretch: {
    id: 'hipFlexorStretch',
    title: 'Kneeling hip-flexor stretch',
    category: 'stretch',
    detail:
      'Half-kneel and tuck the pelvis, hold 30s per side. Eases tight hip flexors that tip the pelvis and lean the trunk.',
  },
  gluteActivation: {
    id: 'gluteActivation',
    title: 'Glute bridges',
    category: 'strengthen',
    detail:
      'Bridge and squeeze the glutes at the top, 3×12. Strengthens hip extensors that level and stabilize the pelvis.',
  },
  quadStretch: {
    id: 'quadStretch',
    title: 'Standing quad stretch',
    category: 'stretch',
    detail:
      'Hold the ankle behind you, knee pointing down, 30s per side. Reduces pull on the knee and pelvis.',
  },
  calfStretch: {
    id: 'calfStretch',
    title: 'Calf / soleus stretch',
    category: 'stretch',
    detail:
      'Wall stretch, straight and bent knee, 30s each. Improves ankle mobility that affects standing knee position.',
  },
  postureAwareness: {
    id: 'postureAwareness',
    title: 'Posture awareness resets',
    category: 'awareness',
    detail:
      'Set hourly reminders to stack ear-over-shoulder-over-hip and reset your stance. Frequent small resets beat one long correction.',
  },
  neckStretch: {
    id: 'neckStretch',
    title: 'Upper-trap / levator stretch',
    category: 'stretch',
    detail:
      'Ease the head away from the raised side, hold 30s per side, to relax the muscles driving a head tilt.',
  },
  scapularStrength: {
    id: 'scapularStrength',
    title: 'Scapular rows / Y-T-W',
    category: 'strengthen',
    detail:
      'Band rows and Y-T-W raises, 3×10, to balance the muscles that set shoulder height.',
  },
  hipMobility: {
    id: 'hipMobility',
    title: 'Hip mobility flow',
    category: 'stretch',
    detail:
      '90/90 hip rotations and figure-4 stretch to even out hip mobility and pelvic position.',
  },
  hamstringMobility: {
    id: 'hamstringMobility',
    title: 'Hamstring mobility',
    category: 'stretch',
    detail:
      'For a tucked (posterior) pelvis: hamstring stretches and hip hinges, 30s × 3, to free the pelvis to rotate back to neutral.',
  },
  hipFlexorActivation: {
    id: 'hipFlexorActivation',
    title: 'Hip-flexor activation',
    category: 'strengthen',
    detail:
      'For a posterior tilt: standing marches and seated knee raises, 3×12, to wake up hip flexors that help restore the natural low-back curve.',
  },
  pelvicNeutralCue: {
    id: 'pelvicNeutralCue',
    title: 'Find neutral pelvis',
    category: 'awareness',
    detail:
      'Rock the pelvis fully forward, then fully tucked, and settle in the middle. Practise breathing and standing there so neutral becomes your default.',
  },
};

export function getSuggestions(ids: string[]): Suggestion[] {
  return ids.map((id) => SUGGESTIONS[id]).filter(Boolean);
}
