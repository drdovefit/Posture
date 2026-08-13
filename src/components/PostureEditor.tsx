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

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

/**
 * Interactive posture overlay: the photo with a plumb line, body chain, level
 * bars and draggable landmark dots. Supports pinch-to-zoom and drag-to-pan
 * (two fingers pinch, one finger on empty space pans, one finger on a dot moves
 * it). Landmark coordinates stay normalized (0..1) so the overlay tracks the
 * image at any zoom — toNormalized reads the transformed element's rect.
 */
export default function PostureEditor({
  imageUrl,
  view,
  landmarks,
  metrics = [],
  readOnly = false,
  onChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [dragKey, setDragKey] = useState<keyof Landmarks | null>(null);
  const [hoverKey, setHoverKey] = useState<keyof Landmarks | null>(null);
  const [zoom, setZoom] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  // Active touch/mouse pointers for pan & pinch (id -> last client position).
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null);

  const overlay = buildOverlay(view, landmarks, metrics);
  const activeKey = dragKey ?? hoverKey;
  const activePoint = activeKey ? landmarks[activeKey] : undefined;

  function toNormalized(clientX: number, clientY: number): Point {
    const rect = wrapRef.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
    };
  }

  function clampPan(nx: number, ny: number, z: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: nx, y: ny };
    const minX = (1 - z) * rect.width;
    const minY = (1 - z) * rect.height;
    return {
      x: Math.min(0, Math.max(minX, nx)),
      y: Math.min(0, Math.max(minY, ny)),
    };
  }

  function resetZoom() {
    setZoom(1);
    setTx(0);
    setTy(0);
  }

  function applyZoom(next: number) {
    const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(next * 10) / 10));
    setZoom(z);
    setTx((x) => clampPan(x, ty, z).x);
    setTy((y) => clampPan(tx, y, z).y);
    if (z === 1) {
      setTx(0);
      setTy(0);
    }
  }

  // --- Pointer handling on the container (pan + pinch) -----------------------
  function onContainerPointerDown(e: React.PointerEvent) {
    if (readOnly || dragKey) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    }
  }

  function onContainerPointerMove(e: React.PointerEvent) {
    if (dragKey) {
      // Moving a landmark dot.
      onChange?.({ ...landmarks, [dragKey]: toNormalized(e.clientX, e.clientY) });
      return;
    }
    if (readOnly || !pointers.current.has(e.pointerId)) return;
    const prev = pointers.current.get(e.pointerId)!;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size >= 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      applyZoom(pinchStart.current.zoom * (dist / pinchStart.current.dist));
    } else if (pointers.current.size === 1 && zoom > 1) {
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      const c = clampPan(tx + dx, ty + dy, zoom);
      setTx(c.x);
      setTy(c.y);
    }
  }

  function onContainerPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (dragKey) setDragKey(null);
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl bg-black"
        style={{ touchAction: 'none' }}
        onPointerDown={onContainerPointerDown}
        onPointerMove={onContainerPointerMove}
        onPointerUp={onContainerPointerUp}
        onPointerCancel={onContainerPointerUp}
      >
        <div
          ref={wrapRef}
          className="relative w-full select-none"
          style={{ transform: `translate(${tx}px, ${ty}px) scale(${zoom})`, transformOrigin: '0 0' }}
        >
          <img src={imageUrl} alt="Posture" className="block w-full" draggable={false} />
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
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

          {overlay.dots.map(({ key, p }) => (
            <button
              key={key}
              type="button"
              disabled={readOnly}
              onPointerDown={(e) => {
                if (readOnly) return;
                e.stopPropagation();
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
                setDragKey(key);
              }}
              onPointerMove={(e) => {
                if (dragKey === key) onChange?.({ ...landmarks, [key]: toNormalized(e.clientX, e.clientY) });
              }}
              onPointerUp={() => setDragKey(null)}
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
                width: readOnly ? 8 : 18 / zoom,
                height: readOnly ? 8 : 18 / zoom,
                background: COLORS.dot,
                touchAction: 'none',
              }}
            />
          ))}

          {!readOnly && activeKey && activePoint && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-slate-900/90 px-2 py-1 text-white shadow-lg"
              style={{
                left: `${activePoint.x * 100}%`,
                top: `calc(${activePoint.y * 100}% - ${10 / zoom}px)`,
                fontSize: `${12 / zoom}px`,
              }}
            >
              {LANDMARK_LABELS[activeKey as string] ?? String(activeKey)}
            </div>
          )}
        </div>
      </div>

      {/* Zoom controls: pinch to zoom, or use these; reset returns to 1×. */}
      {!readOnly && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-slate-900/80 p-1 text-white">
          <button
            type="button"
            onClick={() => applyZoom(zoom - 0.5)}
            className="grid h-8 w-8 place-items-center rounded-full text-lg hover:bg-white/20"
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="w-9 text-center text-xs tabular-nums">{zoom.toFixed(1)}×</span>
          <button
            type="button"
            onClick={() => applyZoom(zoom + 0.5)}
            className="grid h-8 w-8 place-items-center rounded-full text-lg hover:bg-white/20"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/20"
            aria-label="Reset zoom"
            title="Reset zoom"
          >
            ⟲
          </button>
        </div>
      )}
    </div>
  );
}
