import { useRef, useState } from 'react';
import type { Landmarks, Metric, Point, ViewType } from '../lib/types';
import { buildOverlay, COLORS } from '../lib/pose/overlay';
import { LANDMARK_LABELS } from '../lib/pose/mapping';

interface Props {
  imageUrl: string;
  view: ViewType;
  landmarks: Landmarks;
  metrics?: Metric[];
  /** When set, the overlay is read-only (no drag handles) — e.g. thumbnails. */
  readOnly?: boolean;
  onChange?: (lm: Landmarks) => void;
}

/**
 * Interactive posture overlay. Renders the photo with an SVG layer on top
 * carrying the plumb line, body chain, level bars and draggable landmark dots.
 * Coordinates are normalized (0..1) so the overlay scales with the image.
 */
export default function PostureEditor({
  imageUrl,
  view,
  landmarks,
  metrics = [],
  readOnly = false,
  onChange,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [dragKey, setDragKey] = useState<keyof Landmarks | null>(null);
  const [hoverKey, setHoverKey] = useState<keyof Landmarks | null>(null);
  const [zoom, setZoom] = useState(1);
  const overlay = buildOverlay(view, landmarks, metrics);

  // The label to show: the point being dragged takes priority over hover.
  const activeKey = dragKey ?? hoverKey;
  const activePoint = activeKey ? landmarks[activeKey] : undefined;

  function toNormalized(clientX: number, clientY: number): Point {
    const el = wrapRef.current!;
    const rect = el.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragKey || readOnly) return;
    const p = toNormalized(e.clientX, e.clientY);
    onChange?.({ ...landmarks, [dragKey]: p });
  }

  function endDrag() {
    setDragKey(null);
  }

  return (
    <div className="relative">
      <div
        className="overflow-auto rounded-xl bg-black"
        style={{ maxHeight: readOnly ? undefined : '72vh' }}
      >
        <div
          ref={wrapRef}
          className="relative select-none"
          style={{ width: `${zoom * 100}%` }}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
        >
          <img src={imageUrl} alt="Posture" className="block w-full" draggable={false} />
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        {/* Plumb line */}
        <line
          x1={overlay.plumbX * 100}
          y1={0}
          x2={overlay.plumbX * 100}
          y2={100}
          stroke={COLORS.plumb}
          strokeWidth={0.4}
          strokeDasharray="1.5 1.5"
          vectorEffect="non-scaling-stroke"
        />
        {/* Segments */}
        {overlay.segments.map((s, i) => (
          <line
            key={i}
            x1={s.a.x * 100}
            y1={s.a.y * 100}
            x2={s.b.x * 100}
            y2={s.b.y * 100}
            stroke={s.color}
            strokeWidth={s.width * 0.25}
            strokeLinecap="round"
            strokeDasharray={s.dash ? '1.5 1.5' : undefined}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {/* Draggable dots as absolutely-positioned handles (bigger hit target). */}
      {overlay.dots.map(({ key, p }) => (
        <button
          key={key}
          type="button"
          disabled={readOnly}
          onPointerDown={(e) => {
            if (readOnly) return;
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            setDragKey(key);
          }}
          onPointerEnter={() => !readOnly && setHoverKey(key)}
          onPointerLeave={() => setHoverKey((k) => (k === key ? null : k))}
          title={LANDMARK_LABELS[key as string] ?? String(key)}
          aria-label={LANDMARK_LABELS[key as string] ?? String(key)}
          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ${
            readOnly ? '' : 'cursor-grab active:cursor-grabbing'
          } ${dragKey === key ? 'ring-2 ring-white' : ''}`}
          style={{
            left: `${p.x * 100}%`,
            top: `${p.y * 100}%`,
            width: readOnly ? 8 : 18,
            height: readOnly ? 8 : 18,
            background: COLORS.dot,
            touchAction: 'none',
          }}
        />
      ))}

      {/* Floating label for the hovered / dragged landmark. */}
      {!readOnly && activeKey && activePoint && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-slate-900/90 px-2 py-1 text-xs font-medium text-white shadow-lg"
          style={{
            left: `${activePoint.x * 100}%`,
            top: `calc(${activePoint.y * 100}% - 14px)`,
          }}
        >
          {LANDMARK_LABELS[activeKey as string] ?? String(activeKey)}
        </div>
      )}
        </div>
      </div>

      {/* Zoom controls — zoom in to place dots precisely, then pan by dragging
          an empty area. */}
      {!readOnly && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-slate-900/80 p-1 text-white">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1, Math.round((z - 0.5) * 10) / 10))}
            className="grid h-8 w-8 place-items-center rounded-full text-lg hover:bg-white/20"
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="w-9 text-center text-xs tabular-nums">{zoom.toFixed(1)}×</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(4, Math.round((z + 0.5) * 10) / 10))}
            className="grid h-8 w-8 place-items-center rounded-full text-lg hover:bg-white/20"
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
