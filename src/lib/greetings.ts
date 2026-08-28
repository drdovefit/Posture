// Rotating dashboard catchphrases. Shown under "Hi {name}". Some are tagged to
// a time of day or day of week; untagged ones can show any time. {name} is
// swapped for the signed-in first name (name-only lines are skipped when there
// isn't one). Every line here is meant to clear a ~8/10 "actually funny/charming"
// bar — keep that bar if you add more.

type When = 'morning' | 'afternoon' | 'evening' | 'night' | 'weekend' | 'monday' | 'friday';

interface Phrase {
  text: string;
  when?: When;
}

const PHRASES: Phrase[] = [
  // --- General (any time) -------------------------------------------------
  { text: 'Spine’s looking suspiciously good today.' },
  { text: 'Slouch less, smug more.' },
  { text: 'Your future self already said thanks.' },
  { text: 'Gravity: 0. You: 1.' },
  { text: 'Stand like you own the place.' },
  { text: 'Posture so clean it squeaks.' },
  { text: 'The plumb line fears you.' },
  { text: 'Shoulders back, secrets forward.' },
  { text: 'Tall today, unstoppable tomorrow.' },
  { text: 'Chin up — we’ve got math to do.' },
  { text: 'Straighten up, legend.' },
  { text: 'One scan closer to statue-level posture.' },
  { text: 'Ribs over hips, world domination next.' },
  { text: 'You bring the spine, we’ll bring the score.' },
  { text: 'Slouching is a choice. Choose violence instead.' },
  { text: 'Let’s make gravity work for it today.' },
  { text: 'Ah, a person of great vertical ambition.' },
  { text: 'Warning: dangerously well-aligned.' },
  { text: 'Sit up — I can hear you slouching.' },
  { text: 'Big spine energy detected.' },
  { text: 'Look at you, defying gravity for fun.' },
  { text: 'Posture check: are you doing it right now? Thought so.' },
  { text: 'The couch misses you. Ignore it.' },
  { text: 'Stack the bones, stack the wins.' },
  { text: 'Every degree counts. So does every scan.' },
  { text: 'Straight spine, unbothered, moisturized.' },
  { text: 'Let’s turn that hunch into a flex.' },
  { text: 'Your skeleton deserves the good posture.' },
  { text: 'Somewhere, a chiropractor just felt a chill.' },
  { text: 'Plumb line’s warmed up. Are you?' },
  { text: 'Two words: absolutely towering.' },
  { text: 'Fix the posture, keep the personality.' },
  { text: 'You, but two degrees straighter.' },
  { text: 'Confidence is just posture with a haircut.' },
  { text: 'Time to out-posture yesterday.' },

  // --- Name-based (any time) ----------------------------------------------
  { text: 'Let’s get you scored, {name}.' },
  { text: 'Back at it, {name} — spine first.' },
  { text: '{name}, the plumb line’s ready when you are.' },
  { text: 'Look who decided to stand up straight. Hi, {name}.' },
  { text: '{name}, your posture called — it’s improving.' },
  { text: 'Big {name} energy. Bigger posture energy.' },
  { text: 'Ready to out-posture yesterday’s {name}?' },
  { text: 'The world’s a little straighter with you in it, {name}.' },
  { text: '{name}, gravity would like a word. Ignore it.' },
  { text: 'Scan’s not gonna take itself, {name}.' },
  { text: 'Statistically, {name}, you’re the tallest you’ve been all day.' },
  { text: '{name} enters. Slouching leaves.' },
  { text: 'Let’s make it a good one, {name}.' },
  { text: 'Posture legend {name} has entered the chat.' },
  { text: '{name}, stand tall — you’ve earned the inches.' },
  { text: 'Somewhere your spine is whispering “thank you, {name}.”' },
  { text: 'Alright {name}, shoulders down from your ears.' },
  { text: '{name}, today we align. Tomorrow, the world.' },
  { text: 'You again, {name}? The plumb line’s thrilled.' },
  { text: 'Certified straight-spine behaviour, {name}.' },

  // --- Morning ------------------------------------------------------------
  { text: 'Coffee first, then we straighten you out.', when: 'morning' },
  { text: 'Morning, sunshine. Ribs over hips.', when: 'morning' },
  { text: 'New day, fresh spine.', when: 'morning' },
  { text: 'Rise, shine, align.', when: 'morning' },
  { text: 'Before the day bends you, stand tall.', when: 'morning' },
  { text: 'Good morning, {name}. Let’s beat the desk before it starts.', when: 'morning' },
  { text: 'Bed head, straight spine. We’ll allow it.', when: 'morning' },
  { text: 'Early scan? Someone’s serious.', when: 'morning' },
  { text: 'The sun’s up and so are your shoulders.', when: 'morning' },
  { text: 'Morning posture sets the whole day’s tone.', when: 'morning' },
  { text: 'First flex of the day: standing tall.', when: 'morning' },
  { text: 'Wake up, stack up.', when: 'morning' },
  { text: 'A.M. alignment hits different, {name}.', when: 'morning' },
  { text: 'Stretch, scan, conquer. In that order.', when: 'morning' },

  // --- Afternoon ----------------------------------------------------------
  { text: 'Post-lunch slump? Not on our watch.', when: 'afternoon' },
  { text: '2 PM posture is a personality test.', when: 'afternoon' },
  { text: 'Midday reset — shoulders down from your ears.', when: 'afternoon' },
  { text: 'Betcha you were slouching just now.', when: 'afternoon' },
  { text: 'Afternoon check, {name}: sit up, superstar.', when: 'afternoon' },
  { text: 'The desk has claimed enough spines today. Fight back.', when: 'afternoon' },
  { text: 'Halfway through the day — how’s the hunch?', when: 'afternoon' },
  { text: 'Lunch is over. The plumb line remains undefeated.', when: 'afternoon' },
  { text: 'Reset the ribs, recharge the day.', when: 'afternoon' },
  { text: 'Peak slouch hours. Stand accordingly.', when: 'afternoon' },
  { text: 'Afternoon you deserves good posture too.', when: 'afternoon' },
  { text: 'Three o’clock. Chin off the chest, please.', when: 'afternoon' },

  // --- Evening ------------------------------------------------------------
  { text: 'Undo the desk before the couch undoes you.', when: 'evening' },
  { text: 'Evening, {name}. Let’s decompress that spine.', when: 'evening' },
  { text: 'The day bent you. Let’s straighten the tab.', when: 'evening' },
  { text: 'Golden hour, golden posture.', when: 'evening' },
  { text: 'Clock out, stand tall.', when: 'evening' },
  { text: 'Dinner soon. Spine now.', when: 'evening' },
  { text: 'You survived the desk. Reward it with a scan.', when: 'evening' },
  { text: 'Evening reset: shoulders back, day behind you.', when: 'evening' },
  { text: 'One good scan to close the day out right.', when: 'evening' },
  { text: 'The couch is calling. Answer it standing tall.', when: 'evening' },
  { text: 'Sunset spine check, {name}.', when: 'evening' },

  // --- Night --------------------------------------------------------------
  { text: 'Night owl posture is still posture.', when: 'night' },
  { text: 'One scan before bed? Bold. Respected.', when: 'night' },
  { text: 'Late night, straight spine. Rare combo.', when: 'night' },
  { text: 'The world’s asleep. Your posture isn’t.', when: 'night' },
  { text: 'Burning the midnight… alignment.', when: 'night' },
  { text: 'Even at this hour, {name} stands tall.', when: 'night' },
  { text: 'Scanning past bedtime — that’s dedication.', when: 'night' },
  { text: 'Quiet hours. Loud posture.', when: 'night' },
  { text: 'Can’t sleep? Might as well align.', when: 'night' },
  { text: 'Moonlight and a mean plumb line.', when: 'night' },

  // --- Monday -------------------------------------------------------------
  { text: 'Monday: the spine’s least favorite day. Fight back.', when: 'monday' },
  { text: 'New week, new plumb line.', when: 'monday' },
  { text: 'Monday you, meet straighter you.', when: 'monday' },
  { text: 'Start the week stacked, {name}.', when: 'monday' },
  { text: 'Mondays are hard. Your posture doesn’t have to be soft.', when: 'monday' },
  { text: 'Week one rep: stand tall.', when: 'monday' },
  { text: 'Beat the Monday slump — literally.', when: 'monday' },
  { text: 'Fresh week, unbothered spine.', when: 'monday' },

  // --- Friday -------------------------------------------------------------
  { text: 'Friday spine hits different.', when: 'friday' },
  { text: 'Weekend’s close. Stand tall to the finish.', when: 'friday' },
  { text: 'You made it to Friday, {name}. So did your posture.', when: 'friday' },
  { text: 'End the week the way you carried it — tall.', when: 'friday' },
  { text: 'Friday flex: perfect alignment.', when: 'friday' },
  { text: 'One last scan before the weekend, champ.', when: 'friday' },
  { text: 'TGIF — Thank Goodness I’m aligned, Friday.', when: 'friday' },

  // --- Weekend ------------------------------------------------------------
  { text: 'Weekend scan? Look at you being consistent.', when: 'weekend' },
  { text: 'Rest day for the mind, work day for the posture.', when: 'weekend' },
  { text: 'Weekends are for lounging tall.', when: 'weekend' },
  { text: 'No desk today — no excuse to slouch either, {name}.', when: 'weekend' },
  { text: 'Saturday spine, Sunday shine.', when: 'weekend' },
  { text: 'Even the weekend deserves good posture.', when: 'weekend' },
  { text: 'Lazy day, straight spine. The dream.', when: 'weekend' },
  { text: 'Weekend {name}: relaxed, but make it aligned.', when: 'weekend' },
];

function currentTags(now: Date): Set<When> {
  const h = now.getHours();
  const d = now.getDay();
  const tags = new Set<When>();
  if (h >= 5 && h < 12) tags.add('morning');
  else if (h < 17) tags.add('afternoon');
  else if (h < 21) tags.add('evening');
  else tags.add('night');
  if (d === 0 || d === 6) tags.add('weekend');
  if (d === 1) tags.add('monday');
  if (d === 5) tags.add('friday');
  return tags;
}

/** Pick a catchphrase appropriate for now, with {name} filled in. */
export function pickGreeting(name?: string, now: Date = new Date()): string {
  const tags = currentTags(now);
  let pool = PHRASES.filter((p) => !p.when || tags.has(p.when));
  if (!name) pool = pool.filter((p) => !p.text.includes('{name}'));
  if (!pool.length) pool = PHRASES.filter((p) => !p.text.includes('{name}'));
  const text = pool[Math.floor(Math.random() * pool.length)].text;
  return text.replace(/\{name\}/g, name || 'friend');
}

export const GREETING_COUNT = PHRASES.length;
