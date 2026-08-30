import { useEffect, useRef, useState } from 'react';
import type { ViewType } from '../../lib/types';
import { imageBrightness } from '../../lib/pose/photoQuality';

interface Props {
  view: ViewType;
  onCapture: (blob: Blob) => void;
  onClose: () => void;
  /** Switch the Side/Front view from inside the camera. */
  onViewChange?: (v: ViewType) => void;
}

type Facing = 'user' | 'environment';

const TIMERS = [0, 3, 10, 15, 30];

/**
 * Photo capture with a Side/Front toggle, front/back flip, and a self-timer.
 * Portrait-first: the stream is requested tall so a standing person fills the
 * frame the right way up.
 */
export default function CameraCapture({ view, onCapture, onClose, onViewChange }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [error, setError] = useState('');
  const [facing, setFacing] = useState<Facing>('user');
  const [timer, setTimer] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const [lowLight, setLowLight] = useState(false);

  const viewLabel = view === 'lateral' ? 'Side view' : 'Front view';
  const guideTips =
    view === 'lateral'
      ? [
          'Stand side-on so your profile faces the camera.',
          'Get your whole body in frame, head to feet.',
          'Arms relaxed at your sides, look straight ahead.',
          'Camera at hip height, about 3 m away, held level.',
        ]
      : [
          'Face the camera straight on.',
          'Feet about hip-width, weight even, arms relaxed.',
          'Get your whole body in frame, head to feet.',
          'Camera at hip height, about 3 m away, held level.',
        ];

  async function startStream(f: Facing) {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try {
      const video: MediaTrackConstraints = {
        facingMode: f,
        width: { ideal: 1080 },
        height: { ideal: 1920 },
      };
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch {
      setError('Camera unavailable. Check permissions or upload a photo instead.');
    }
  }

  // Mirror only the front camera so it reads like a mirror while framing.
  const previewTransform = facing === 'user' ? 'scaleX(-1)' : 'none';

  useEffect(() => {
    startStream(facing);
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);

  // Live low-light check: sample the preview a few times a second and toggle
  // the on-camera bubble, so it appears while it's dark and clears when it isn't.
  useEffect(() => {
    if (error) return;
    const iv = setInterval(() => {
      const el = videoRef.current;
      if (!el || el.videoWidth === 0) return;
      const b = imageBrightness(el);
      if (b != null) setLowLight(b < 55);
    }, 700);
    return () => clearInterval(iv);
  }, [error]);

  function grabFrame(el: HTMLVideoElement, maxW = 1400): Promise<Blob> {
    // Capture the full camera frame (no crop), matching the zoomed-out preview.
    const vw = el.videoWidth || maxW;
    const vh = el.videoHeight || maxW;
    const scale = Math.min(1, maxW / vw);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(vw * scale);
    canvas.height = Math.round(vh * scale);
    const ctx = canvas.getContext('2d')!;
    if (facing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
    return new Promise((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.9));
  }

  async function shootNow() {
    if (videoRef.current) onCapture(await grabFrame(videoRef.current));
  }
  function shoot() {
    if (timer > 0) {
      let n = timer;
      setCountdown(n);
      const iv = setInterval(() => {
        n -= 1;
        setCountdown(n);
        if (n <= 0) {
          clearInterval(iv);
          setCountdown(0);
          shootNow();
        }
      }, 1000);
    } else {
      shootNow();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="relative flex-1 overflow-hidden">
        {error ? (
          <div className="grid h-full place-items-center p-6 text-center text-slate-300">
            {error}
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-contain"
              style={{ transform: previewTransform, transformOrigin: 'center' }}
            />

            {/* Vertical guide line. */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 border-l-2 border-dashed border-yellow-300/70" />
            </div>

            {/* Guide button (left). */}
            <button
              onClick={() => setShowGuide(true)}
              className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1.5 text-sm font-medium text-white"
            >
              ? Guide
            </button>

            {/* Side / Front toggle (center). */}
            <div className="absolute left-1/2 top-4 -translate-x-1/2">
              <div className="flex overflow-hidden rounded-full border border-white/30 text-sm">
                {(['lateral', 'anterior'] as ViewType[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => onViewChange?.(v)}
                    className={`px-4 py-1.5 font-semibold ${
                      view === v ? 'bg-brand-500 text-white' : 'bg-black/60 text-white/80'
                    }`}
                  >
                    {v === 'lateral' ? 'Side' : 'Front'}
                  </button>
                ))}
              </div>
            </div>

            {/* Flip camera (right), large tap target. */}
            <button
              onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
              className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-black/60 text-2xl text-white"
              aria-label="Flip camera"
              title="Flip camera"
            >
              ⟲
            </button>

            <div className="pointer-events-none absolute inset-x-0 bottom-4 text-center">
              <span className="rounded-full bg-black/50 px-3 py-1 text-xs text-white/90">
                {view === 'lateral'
                  ? 'Stand side-on, whole body in frame'
                  : 'Face the camera, arms relaxed'}
              </span>
            </div>

            {lowLight && (
              <div className="pointer-events-none absolute left-1/2 top-20 -translate-x-1/2">
                <div className="flex items-center gap-2 rounded-full bg-amber-400/95 px-4 py-1.5 text-sm font-semibold text-black shadow-lg">
                  <span aria-hidden>🔅</span> Low light. Find a brighter spot.
                </div>
              </div>
            )}

            {countdown > 0 && (
              <div className="absolute inset-0 grid place-items-center">
                <span className="text-8xl font-bold text-white drop-shadow-lg">{countdown}</span>
              </div>
            )}

            {showGuide && (
              <div
                className="absolute inset-0 z-20 grid place-items-center bg-black/70 p-6"
                onClick={() => setShowGuide(false)}
              >
                <div
                  className="w-full max-w-xs rounded-2xl bg-white p-5 text-slate-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="mb-2 text-base font-bold">{viewLabel}: how to</h3>
                  <ul className="list-inside list-disc space-y-1.5 text-sm text-slate-600">
                    {guideTips.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  <button className="btn-primary mt-4 w-full" onClick={() => setShowGuide(false)}>
                    Got it
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="space-y-3 bg-black p-5">
        <div className="flex items-center justify-center">
          <div className="flex overflow-hidden rounded-full border border-slate-700 text-sm text-white">
            {TIMERS.map((t) => (
              <button
                key={t}
                className={`px-3 py-1.5 ${timer === t ? 'bg-brand-500' : 'bg-slate-800'}`}
                onClick={() => setTimer(t)}
              >
                {t === 0 ? 'Off' : `${t}s`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <button className="btn-ghost !bg-slate-800 !text-white" onClick={onClose}>
            Cancel
          </button>
          <button
            onClick={shoot}
            disabled={!!error || countdown > 0}
            className="h-16 w-16 rounded-full border-4 border-white bg-white/20 disabled:opacity-40"
            aria-label="Capture photo"
          />
          <span className="w-16" />
        </div>
      </div>
    </div>
  );
}
