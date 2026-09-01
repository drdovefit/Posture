import { useEffect, useRef, useState } from 'react';
import type { ViewType } from '../../lib/types';
import { imageBrightness, framingHint } from '../../lib/pose/photoQuality';
import { detectPoseSource } from '../../lib/pose/landmarker';
import { mapLandmarks } from '../../lib/pose/mapping';

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
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [error, setError] = useState('');
  const [facing, setFacing] = useState<Facing>('user');
  const [timer, setTimer] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [countBig, setCountBig] = useState(false);
  const [shutterState, setShutterState] = useState<'idle' | 'fade' | 'flash'>('idle');
  const [showGuide, setShowGuide] = useState(false);
  const [lowLight, setLowLight] = useState(false);
  const [frameTip, setFrameTip] = useState<string | null>(null);

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
      // Ask the camera for a feed shaped like the screen, so it fills the frame
      // with no crop and no zoom. width/height are hints for resolution; the
      // aspectRatio is what makes it match the screen (portrait on a phone).
      const screenAR = window.innerWidth / window.innerHeight;
      const video: MediaTrackConstraints = {
        facingMode: f,
        aspectRatio: { ideal: screenAR },
        width: { ideal: 1920 },
        height: { ideal: 1920 },
      };
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
      streamRef.current = stream;
      // Lock to the standard 1x lens where the device exposes zoom control, so
      // a phone with an ultra-wide doesn't open at 0.5x. Clamp 1 into the
      // supported range in case a camera's minimum is above or below it.
      try {
        const track = stream.getVideoTracks()[0];
        const caps = (track?.getCapabilities?.() ?? {}) as {
          zoom?: { min?: number; max?: number };
        };
        if (track && caps.zoom && typeof caps.zoom.min === 'number') {
          const min = caps.zoom.min;
          const max = typeof caps.zoom.max === 'number' ? caps.zoom.max : 1;
          const target = Math.min(Math.max(1, min), max);
          await track.applyConstraints({
            advanced: [{ zoom: target }],
          } as unknown as MediaTrackConstraints);
        }
      } catch {
        /* zoom not controllable on this device */
      }
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

  // Re-match the feed to the screen shape if the device is rotated, so it keeps
  // filling the frame without zoom whichever way it's held. Debounced so a drag
  // resize doesn't thrash the camera.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => startStream(facing), 400);
    };
    window.addEventListener('orientationchange', onResize);
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener('orientationchange', onResize);
      window.removeEventListener('resize', onResize);
    };
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

  // Live framing check: run pose detection on the preview about once a second
  // and show a brief hint (move closer, step back, turn side-on, and so on).
  useEffect(() => {
    if (error) return;
    let cancelled = false;
    let busy = false;
    const iv = setInterval(async () => {
      const el = videoRef.current;
      if (!el || el.videoWidth === 0 || busy) return;
      busy = true;
      try {
        const raw = await detectPoseSource(el);
        if (cancelled) return;
        if (!raw) {
          setFrameTip(null);
          return;
        }
        const lm = mapLandmarks(raw, view);
        const sep = raw[11] && raw[12] ? Math.abs(raw[11].x - raw[12].x) : undefined;
        setFrameTip(framingHint(lm, view, sep));
      } catch {
        /* detector not ready; ignore this tick */
      } finally {
        busy = false;
      }
    }, 1200);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [error, view]);

  // Clear any running timer countdown on unmount.
  useEffect(() => () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  function grabFrame(el: HTMLVideoElement, maxW = 1400): Promise<Blob> {
    // No zoom: capture the whole camera frame exactly as the preview shows it.
    const vw = el.videoWidth || 1080;
    const vh = el.videoHeight || 1920;
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
    const el = videoRef.current;
    if (!el) return;
    // Grab the frame at this instant, flash the shutter green for a second so
    // the capture is unmistakable, then hand the photo off.
    const blob = await grabFrame(el);
    setCountdown(0);
    setCountBig(false);
    setShutterState('flash');
    setTimeout(() => {
      setShutterState('idle');
      onCapture(blob);
    }, 1000);
  }
  function cancelCountdown() {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = null;
    setCountdown(0);
    setCountBig(false);
    setShutterState('idle');
  }
  function shoot() {
    if (timer > 0) {
      let n = timer;
      setCountdown(n);
      setCountBig(true); // starts big in the centre…
      setShutterState('fade'); // …shutter fades white → dark grey over the timer
      // …then shrinks up to the top-left so it's clearly a running countdown.
      setTimeout(() => setCountBig(false), 700);
      countdownRef.current = setInterval(() => {
        n -= 1;
        setCountdown(n);
        if (n <= 0) {
          cancelCountdown();
          shootNow();
        }
      }, 1000);
    } else {
      shootNow();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#eef4ff]">
      <div className="relative flex-1 overflow-hidden">
        {error ? (
          <div className="grid h-full place-items-center p-6 text-center text-slate-600">
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

            {(lowLight || frameTip) && (
              <div className="pointer-events-none absolute left-1/2 top-20 flex -translate-x-1/2 flex-col items-center gap-1.5">
                {lowLight && (
                  <div className="flex items-center gap-1.5 rounded-full bg-amber-400/45 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    <span aria-hidden>🔅</span> Low light
                  </div>
                )}
                {frameTip && (
                  <div className="rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {frameTip}
                  </div>
                )}
              </div>
            )}

            {/* Armed-timer badge (before the countdown starts). */}
            {countdown === 0 && timer > 0 && (
              <div className="absolute left-4 top-16 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 font-semibold text-white">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                <span className="text-sm">{timer}s</span>
              </div>
            )}

            {/* Live countdown: starts big in the centre, then shrinks to the
                top-left so it can't be missed. Sits above the overlay. */}
            {countdown > 0 && (
              <div className="pointer-events-none absolute inset-0 z-30">
                <span
                  className={`absolute font-bold tabular-nums text-white transition-all duration-500 ease-out ${
                    countBig
                      ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[7rem] leading-none'
                      : 'left-6 top-16 text-4xl'
                  }`}
                  style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}
                >
                  {countdown}
                </span>
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

      <div className="space-y-3 bg-[#eef4ff] p-5">
        <div className="flex items-center justify-center">
          <div className="flex overflow-hidden rounded-full border border-slate-300 text-sm">
            {TIMERS.map((t) => (
              <button
                key={t}
                className={`px-3 py-1.5 ${
                  timer === t ? 'bg-brand-500 text-white' : 'bg-white text-slate-600'
                }`}
                onClick={() => setTimer(t)}
              >
                {t === 0 ? 'Off' : `${t}s`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <button className="btn-ghost !bg-white !text-slate-700 border border-slate-300" onClick={onClose}>
            Cancel
          </button>
          <button
            onClick={countdown > 0 ? cancelCountdown : shoot}
            disabled={!!error}
            className="h-16 w-16 rounded-full border-4 border-slate-400 shadow-md disabled:opacity-40"
            style={
              shutterState === 'fade'
                ? {
                    backgroundColor: '#374151', // dark grey target
                    transitionProperty: 'background-color',
                    transitionTimingFunction: 'linear',
                    transitionDuration: `${timer}s`, // fades over the whole timer
                  }
                : shutterState === 'flash'
                  ? {
                      backgroundColor: '#22c55e', // green flash on capture
                      transitionProperty: 'background-color',
                      transitionDuration: '120ms',
                    }
                  : {
                      backgroundColor: '#ffffff', // starts white
                      transitionProperty: 'background-color',
                      transitionDuration: '300ms',
                    }
            }
            aria-label={countdown > 0 ? 'Cancel timer' : 'Capture photo'}
          />
          <span className="w-16" />
        </div>
      </div>
    </div>
  );
}
