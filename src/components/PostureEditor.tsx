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
  const overlay = buildOverlay(view, landmarks, metrics);

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
    <div
      ref={wrapRef}
      className="relative select-none overflow-hidden rounded-xl bg-black touch-none"
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
    </div>
  );
}
