import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { ViewType } from '../../lib/types';

const HIDE_KEY = 'posturelab-dotguide-hidden';

export function dotGuideHidden() {
  return localStorage.getItem(HIDE_KEY) === '1';
}

const PLACEMENTS: Record<ViewType, { label: string; where: string }[]> = {
  lateral: [
    { label: 'Ear', where: 'On the ear canal (the little opening), level with the sideburn.' },
    { label: 'Shoulder', where: 'The tip of the shoulder where the arm meets it (the acromion).' },
    { label: 'Hip', where: 'The bony bump on the side of the hip (greater trochanter).' },
    { label: 'Knee', where: 'The center of the knee joint, seen from the side.' },
    { label: 'Ankle', where: 'The ankle bone that sticks out, just above the foot.' },
  ],
  anterior: [
    { label: 'Eyes', where: 'The center of each eye — used to check head tilt.' },
    { label: 'Shoulders', where: 'The top outer edge of each shoulder.' },
    { label: 'Hips', where: 'The front of each hip bone (level with the waistband).' },
    { label: 'Knees', where: 'The center of each kneecap.' },
    { label: 'Ankles', where: 'The center of each ankle, just above the foot.' },
  ],
  posterior: [
    { label: 'Shoulders', where: 'The top outer edge of each shoulder.' },
    { label: 'Hips', where: 'The top of each hip bone.' },
    { label: 'Knees', where: 'The back center of each knee.' },
    { label: 'Ankles', where: 'The center of each ankle.' },
  ],
};

interface Props {
  view: ViewType;
  open: boolean;
  onClose: () => void;
}

export default function DotGuide({ view, open, onClose }: Props) {
  const [imgOk, setImgOk] = useState(true);
  if (!open) return null;

  const rows = PLACEMENTS[view];
  const viewLabel = view === 'lateral' ? 'Side' : view === 'anterior' ? 'Front' : 'Back';
  const imgSrc = `${import.meta.env.BASE_URL}brand/dots-${view === 'lateral' ? 'side' : view === 'anterior' ? 'front' : 'back'}.png`;

  function dismissForever() {
    localStorage.setItem(HIDE_KEY, '1');
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="card flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 p-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold">Check your dots ({viewLabel} view)</h2>
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

        <div className="min-h-0 flex-1 overflow-auto p-4">
          {imgOk && (
            <img
              src={imgSrc}
              alt={`${viewLabel} view dot placement`}
              className="mx-auto mb-4 max-h-64 rounded-xl object-contain"
              onError={() => setImgOk(false)}
            />
          )}
          <ul className="space-y-2.5">
            {rows.map((r, i) => (
              <li key={r.label} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-400 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div className="text-sm">
                  <span className="font-semibold">{r.label}</span>
                  <span className="text-slate-500"> — {r.where}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2 border-t border-slate-100 p-4 dark:border-slate-800">
          <button className="btn-ghost flex-1" onClick={dismissForever}>
            Don't show again
          </button>
          <button className="btn-primary flex-1" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
