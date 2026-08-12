import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { ViewType } from '../../lib/types';

const HIDE_KEY = 'posturelab-dotguide-hidden';

export function dotGuideHidden() {
  return localStorage.getItem(HIDE_KEY) === '1';
}

interface Placement {
  slug: string;
  label: string;
  where: string;
}

const PLACEMENTS: Record<ViewType, Placement[]> = {
  lateral: [
    { slug: 'ear', label: 'Ear', where: 'On the tragus — the little flap in front of the ear canal (not the earlobe).' },
    { slug: 'shoulder', label: 'Shoulder', where: 'The bony tip of the shoulder (acromion), where the shoulder meets the arm.' },
    { slug: 'hip', label: 'Hip', where: 'The greater trochanter — the bony bump on the outer side of the upper thigh.' },
    { slug: 'knee', label: 'Knee', where: 'The center of the knee joint line, just behind the kneecap.' },
    { slug: 'ankle', label: 'Ankle', where: 'The lateral malleolus — the ankle bone that sticks out, just above the foot.' },
  ],
  anterior: [
    { slug: 'eyes', label: 'Eyes', where: 'The center (pupil) of each eye — used to check head tilt.' },
    { slug: 'shoulders', label: 'Shoulders', where: 'The top outer bony point of each shoulder (acromion).' },
    { slug: 'hips', label: 'Hips', where: 'The front hip bone (ASIS), level with the top of the pelvis.' },
    { slug: 'knees', label: 'Knees', where: 'The center of each kneecap (patella).' },
    { slug: 'ankles', label: 'Ankles', where: 'The center of each ankle (inner ankle bone).' },
  ],
  posterior: [
    { slug: 'shoulders', label: 'Shoulders', where: 'The top outer edge of each shoulder.' },
    { slug: 'hips', label: 'Hips', where: 'The top of each hip bone.' },
    { slug: 'knees', label: 'Knees', where: 'The back center of each knee.' },
    { slug: 'ankles', label: 'Ankles', where: 'The center of each ankle.' },
  ],
};

interface Props {
  view: ViewType;
  open: boolean;
  onClose: () => void;
}

export default function DotGuide({ view, open, onClose }: Props) {
  const [failed, setFailed] = useState<Set<string>>(new Set());
  if (!open) return null;

  const rows = PLACEMENTS[view];
  const viewSlug = view === 'lateral' ? 'side' : view === 'anterior' ? 'front' : 'back';
  const viewLabel = view === 'lateral' ? 'Side' : view === 'anterior' ? 'Front' : 'Back';

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
          <ul className="space-y-3">
            {rows.map((r, i) => {
              const src = `${import.meta.env.BASE_URL}brand/dot-${viewSlug}-${r.slug}.png`;
              const showImg = !failed.has(r.slug);
              return (
                <li key={r.slug} className="flex items-center gap-3">
                  <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                    {showImg ? (
                      <img
                        src={src}
                        alt={r.label}
                        className="h-full w-full object-cover"
                        onError={() =>
                          setFailed((prev) => new Set(prev).add(r.slug))
                        }
                      />
                    ) : (
                      <span className="text-lg font-bold text-amber-500">{i + 1}</span>
                    )}
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">{r.label}</span>
                    <p className="text-slate-500">{r.where}</p>
                  </div>
                </li>
              );
            })}
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
