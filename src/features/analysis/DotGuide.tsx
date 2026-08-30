import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ViewType } from '../../lib/types';

const HIDE_KEY = 'posturelab-dotguide-hidden';
const GENDER_KEY = 'posturelab-gender';

export function dotGuideHidden() {
  return localStorage.getItem(HIDE_KEY) === '1';
}

type Gender = 'female' | 'male';

interface Placement {
  slug: string;
  label: string;
  where: string;
}

const PLACEMENTS: Record<'lateral' | 'anterior', Placement[]> = {
  lateral: [
    { slug: 'ear', label: 'Ear', where: 'On the tragus, the little flap in front of the ear canal (not the earlobe).' },
    { slug: 'shoulder', label: 'Shoulder', where: 'The bony tip of the shoulder (acromion), where the shoulder meets the arm.' },
    { slug: 'hip', label: 'Hip', where: 'The greater trochanter, the bony bump on the outer side of the upper thigh.' },
    { slug: 'pelvisFront', label: 'Front hip (ASIS)', where: 'The bony point at the front of your pelvis (the "hip bone" below your belt line), used to measure pelvic tilt.' },
    { slug: 'pelvisBack', label: 'Back hip (PSIS)', where: 'The bony dimple at the back of your pelvis, level with your belt at the back, the other end of the tilt line.' },
    { slug: 'knee', label: 'Knee', where: 'The center of the knee joint line, just behind the kneecap.' },
    { slug: 'ankle', label: 'Ankle', where: 'The lateral malleolus, the ankle bone that sticks out, just above the foot.' },
  ],
  anterior: [
    { slug: 'eyes', label: 'Eyes', where: 'The center (pupil) of each eye, used to check head tilt.' },
    { slug: 'shoulders', label: 'Shoulders', where: 'The top outer bony point of each shoulder (acromion).' },
    { slug: 'hips', label: 'Hips', where: 'The front hip bone (ASIS), level with the top of the pelvis.' },
    { slug: 'knees', label: 'Knees', where: 'The center of each kneecap (patella).' },
    { slug: 'ankles', label: 'Ankles', where: 'The center of each ankle (inner ankle bone).' },
  ],
};

interface Props {
  view: ViewType;
  open: boolean;
  onClose: () => void;
}

export default function DotGuide({ view, open, onClose }: Props) {
  const [brokenSrc, setBrokenSrc] = useState('');
  const [dontShow, setDontShow] = useState(false);
  const [gender, setGender] = useState<Gender>(
    () => (localStorage.getItem(GENDER_KEY) as Gender) || 'female',
  );
  // Which view the guide is showing — starts from the analyze view but can be
  // switched inside the guide.
  const [localView, setLocalView] = useState<'lateral' | 'anterior'>(
    view === 'anterior' ? 'anterior' : 'lateral',
  );
  useEffect(() => {
    if (open) setLocalView(view === 'anterior' ? 'anterior' : 'lateral');
  }, [open, view]);

  if (!open) return null;

  function pickGender(g: Gender) {
    setGender(g);
    localStorage.setItem(GENDER_KEY, g);
  }

  const rows = PLACEMENTS[localView];
  const viewSlug = localView === 'lateral' ? 'side' : 'front';
  const bigImg = `${import.meta.env.BASE_URL}brand/dots-${viewSlug}-${gender}.png`;

  function handleGotIt() {
    if (dontShow) localStorage.setItem(HIDE_KEY, '1');
    onClose();
  }

  const seg =
    'flex-1 py-1.5 text-sm transition-colors';
  const segOn = 'bg-brand-500 text-white';
  const segOff = 'text-slate-600 dark:text-slate-300';

  return createPortal(
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="card flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 p-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold">Check your dots</h2>
            <p className="text-sm text-slate-500">
              For an accurate score, drag each dot to the exact spot. Zoom in with
              the + button for precision.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Toggles: view on the left, gender on the right. */}
        <div className="flex gap-2 border-b border-slate-100 p-3 dark:border-slate-800">
          <div className="flex flex-1 overflow-hidden rounded-full border border-slate-200 dark:border-slate-700">
            <button className={`${seg} ${localView === 'lateral' ? segOn : segOff}`} onClick={() => setLocalView('lateral')}>
              Side
            </button>
            <button className={`${seg} ${localView === 'anterior' ? segOn : segOff}`} onClick={() => setLocalView('anterior')}>
              Front
            </button>
          </div>
          <div className="flex flex-1 overflow-hidden rounded-full border border-slate-200 dark:border-slate-700">
            <button className={`${seg} ${gender === 'female' ? segOn : segOff}`} onClick={() => pickGender('female')}>
              ♀ Female
            </button>
            <button className={`${seg} ${gender === 'male' ? segOn : segOff}`} onClick={() => pickGender('male')}>
              ♂ Male
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          {brokenSrc !== bigImg && (
            <img
              src={bigImg}
              alt={`${viewSlug} view dot placement`}
              className="mx-auto mb-4 w-full rounded-xl object-contain"
              onError={() => setBrokenSrc(bigImg)}
            />
          )}
          <ul className="space-y-2.5">
            {rows.map((r, i) => (
              <li key={r.slug} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-400 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div className="text-sm">
                  <span className="font-semibold">{r.label}</span>
                  <span className="text-slate-500">: {r.where}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 border-t border-slate-100 p-4 dark:border-slate-800">
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
              className="h-4 w-4 accent-brand-500"
            />
            Don't show this again
          </label>
          <button
            className="btn-primary w-full py-3 text-base font-semibold"
            onClick={handleGotIt}
          >
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
