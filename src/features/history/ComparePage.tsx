import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { useActiveClient } from '../../state/useClient';
import type { Assessment, Point } from '../../lib/types';

const VIEW_LABEL: Record<string, string> = {
  anterior: 'Front',
  lateral: 'Side',
  posterior: 'Back',
};

const PANEL_ASPECT = 3 / 4; // width / height of each compare panel

function optionLabel(a: Assessment) {
  return `${VIEW_LABEL[a.view]} · ${new Date(a.createdAt).toLocaleDateString()} · ${a.score}`;
}

/**
 * Crop an assessment image to the person — head-to-feet with a little padding,
 * based on the landmark bounding box — so both panels frame the body the same
 * way with no black bars, and the top of the head is never cut off. Uniform
 * scale: fits vertically to the body and center-crops the sides to fill the
 * panel. Optionally mirrors, for when a photo was shot facing the other way.
 */
function useCroppedPortrait(a: Assessment | undefined, flip: boolean): string {
  const [url, setUrl] = useState('');
  const src = a?.annotated ?? a?.photo;
  useEffect(() => {
    let cancelled = false;
    if (!a || !src) {
      setUrl('');
      return;
    }
    const objUrl = URL.createObjectURL(src);
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const W = img.naturalWidth;
      const H = img.naturalHeight;
      const pts = Object.values(a.landmarks ?? {}).filter(Boolean) as Point[];
      let minX = 0, maxX = 1, minY = 0, maxY = 1;
      if (pts.length) {
        minX = Math.min(...pts.map((p) => p.x));
        maxX = Math.max(...pts.map((p) => p.x));
        minY = Math.min(...pts.map((p) => p.y));
        maxY = Math.max(...pts.map((p) => p.y));
      }
      // Padding: extra room above the head and below the feet.
      const topN = Math.max(0, minY - 0.06);
      const botN = Math.min(1, maxY + 0.05);
      const top = topN * H;
      const cropH = Math.max(1, (botN - topN) * H);
      const centerX = ((Math.max(0, minX - 0.04) + Math.min(1, maxX + 0.04)) / 2) * W;
      let cropW = cropH * PANEL_ASPECT;
      if (cropW > W) cropW = W; // can't be wider than the source image
      const left = Math.min(Math.max(0, centerX - cropW / 2), Math.max(0, W - cropW));

      const outH = Math.min(cropH, 1200);
      const outW = outH * PANEL_ASPECT;
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(outW));
      canvas.height = Math.max(1, Math.round(outH));
      const ctx = canvas.getContext('2d')!;
      if (flip) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(img, left, top, cropW, cropH, 0, 0, canvas.width, canvas.height);
      setUrl(canvas.toDataURL('image/png'));
      URL.revokeObjectURL(objUrl);
    };
    img.src = objUrl;
    return () => {
      cancelled = true;
    };
  }, [a, src, flip]);
  return url;
}

function Panel({
  a,
  flip,
  onToggleFlip,
}: {
  a: Assessment | undefined;
  flip: boolean;
  onToggleFlip: () => void;
}) {
  const url = useCroppedPortrait(a, flip);
  if (!a) return <div className="card grid aspect-[3/4] place-items-center text-slate-400">—</div>;
  return (
    <div className="card overflow-hidden">
      <div className="relative aspect-[3/4] bg-slate-100 dark:bg-slate-800">
        {url && <img src={url} alt="" className="h-full w-full object-cover" />}
        <button
          onClick={onToggleFlip}
          title="Mirror image"
          aria-label="Mirror image"
          className={`absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full text-lg text-white shadow ${
            flip ? 'bg-brand-500' : 'bg-black/60'
          }`}
        >
          ⇋
        </button>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold">{VIEW_LABEL[a.view]} view</span>
          <span
            className="text-xl font-bold"
            style={{ color: a.score >= 85 ? '#10b981' : a.score >= 65 ? '#f59e0b' : '#ef4444' }}
          >
            {a.score}
          </span>
        </div>
        <div className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleString()}</div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  const { activeId } = useActiveClient();
  const assessments = useLiveQuery(
    () =>
      activeId == null
        ? []
        : db.assessments.where('clientId').equals(activeId).reverse().sortBy('createdAt'),
    [activeId],
    [],
  );

  const [leftId, setLeftId] = useState<number | null>(null);
  const [rightId, setRightId] = useState<number | null>(null);
  const [leftFlip, setLeftFlip] = useState(false);
  const [rightFlip, setRightFlip] = useState(false);

  // Default to oldest (Before) and newest (After) once data loads — and keep
  // them distinct so both panels never resolve to the same assessment.
  useEffect(() => {
    if (!assessments || assessments.length < 2) return;
    const oldest = assessments[assessments.length - 1].id!;
    const newest = assessments[0].id!;
    setLeftId((cur) => (cur != null && assessments.some((a) => a.id === cur) ? cur : oldest));
    setRightId((cur) => (cur != null && assessments.some((a) => a.id === cur) ? cur : newest));
  }, [assessments]);

  const left = assessments?.find((a) => a.id === leftId);
  const right = assessments?.find((a) => a.id === rightId);

  const delta = useMemo(() => {
    if (!left || !right) return null;
    return right.score - left.score;
  }, [left, right]);

  if (!assessments?.length) {
    return <div className="card p-10 text-center text-slate-500">No assessments to compare yet.</div>;
  }
  if (assessments.length < 2) {
    return (
      <div className="card p-10 text-center text-slate-500">
        Save at least two assessments to compare before/after.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Compare</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Before</label>
          <select
            className="input"
            value={left?.id ?? ''}
            onChange={(e) => setLeftId(Number(e.target.value))}
          >
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>
                {optionLabel(a)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">After</label>
          <select
            className="input"
            value={right?.id ?? ''}
            onChange={(e) => setRightId(Number(e.target.value))}
          >
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>
                {optionLabel(a)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          className="btn-ghost"
          onClick={() => {
            const l = left?.id ?? null;
            const r = right?.id ?? null;
            setLeftId(r);
            setRightId(l);
          }}
        >
          ⇅ Swap before / after
        </button>
      </div>

      {delta !== null && (
        <div className="card flex items-center justify-center gap-3 p-4 text-center">
          <span className="text-slate-500">Change in score:</span>
          <span
            className={`text-2xl font-bold ${
              delta > 0 ? 'text-emerald-500' : delta < 0 ? 'text-red-500' : 'text-slate-500'
            }`}
          >
            {delta > 0 ? '+' : ''}
            {delta}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Panel a={left} flip={leftFlip} onToggleFlip={() => setLeftFlip((f) => !f)} />
        <Panel a={right} flip={rightFlip} onToggleFlip={() => setRightFlip((f) => !f)} />
      </div>
      <p className="text-center text-xs text-slate-400">
        Tip: use the ⇋ button to mirror a photo if you faced the other way in one of them.
      </p>
    </div>
  );
}
