import { useEffect, useRef, useState } from 'react';
import type { ViewType } from '../../lib/types';

interface Props {
  view: ViewType;
  onCapture: (blob: Blob) => void;
  onClose: () => void;
}

type Mode = 'photo' | 'video';
type Facing = 'user' | 'environment';

interface Frame {
  blob: Blob;
  url: string;
}

const MAX_FRAMES = 60; // ~9s at 150ms sampling
const SAMPLE_MS = 150;

/**
 * Camera capture with front/back toggle, a self-timer, and a video mode.
 *
 * Video mode samples still frames from the live preview *while recording*
 * (instead of recording a file and seeking it afterwards). Seeking a recorded
 * blob is unreliable on iOS Safari and produced black frames — sampling live
 * frames avoids that entirely and works everywhere.
 */
export default function CameraCapture({ view, onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const samplerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const framesRef = useRef<Frame[]>([]);

  const [error, setError] = useState('');
  const [mode, setMode] = useState<Mode>('photo');
  const [facing, setFacing] = useState<Facing>('user');
  const [timer, setTimer] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [recording, setRecording] = useState(false);
  const [frameCount, setFrameCount] = useState(0);

  // Review state (after recording).
  const [reviewing, setReviewing] = useState(false);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [index, setIndex] = useState(0);
  const [showGuide, setShowGuide] = useState(false);

  const viewLabel = view === 'lateral' ? 'Side view' : 'Front view';
  const guideTips =
    view === 'lateral'
      ? [
          'Stand side-on — your profile faces the camera.',
          'Get your whole body in frame, head to feet.',
          'Arms relaxed at your sides, look straight ahead.',
          'Camera at hip height, ~3 m away, held level.',
        ]
      : [
          'Face the camera straight on.',
          'Feet about hip-width, weight even, arms relaxed.',
          'Get your whole body in frame, head to feet.',
          'Camera at hip height, ~3 m away, held level.',
        ];

  async function startStream(f: Facing) {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try {
      const video: MediaTrackConstraints = {
        facingMode: f,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
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

  // Mirror only the front camera; no digital zoom so the full frame is visible.
  const previewTransform = facing === 'user' ? 'scaleX(-1)' : 'none';

  useEffect(() => {
    if (!reviewing) startStream(facing);
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);

  useEffect(() => {
    return () => {
      if (samplerRef.current) clearInterval(samplerRef.current);
      framesRef.current.forEach((f) => URL.revokeObjectURL(f.url));
    };
  }, []);

  function grabFrame(el: HTMLVideoElement, maxW = 900): Promise<Blob> {
    const scale = Math.min(1, maxW / (el.videoWidth || maxW));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round((el.videoWidth || maxW) * scale);
    canvas.height = Math.round((el.videoHeight || maxW) * scale);
    const ctx = canvas.getContext('2d')!;
    if (facing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
    return new Promise((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.9));
  }

  // --- Photo ----------------------------------------------------------------
  async function shootNow() {
    if (videoRef.current) onCapture(await grabFrame(videoRef.current, 1400));
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

  // --- Video (live frame sampling) ------------------------------------------
  function startRecording() {
    framesRef.current.forEach((f) => URL.revokeObjectURL(f.url));
    framesRef.current = [];
    setFrameCount(0);
    setRecording(true);
    samplerRef.current = setInterval(async () => {
      const el = videoRef.current;
      if (!el || el.videoWidth === 0) return;
      if (framesRef.current.length >= MAX_FRAMES) {
        stopRecording();
        return;
      }
      const blob = await grabFrame(el, 900);
      framesRef.current.push({ blob, url: URL.createObjectURL(blob) });
      setFrameCount(framesRef.current.length);
    }, SAMPLE_MS);
  }

  function stopRecording() {
    if (samplerRef.current) clearInterval(samplerRef.current);
    samplerRef.current = null;
    setRecording(false);
    const captured = framesRef.current;
    if (captured.length === 0) return;
    setFrames(captured);
    setIndex(Math.floor(captured.length / 2)); // suggested = middle
    setReviewing(true);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }

  function retake() {
    frames.forEach((f) => URL.revokeObjectURL(f.url));
    framesRef.current = [];
    setFrames([]);
    setIndex(0);
    setReviewing(false);
    setFrameCount(0);
    startStream(facing);
  }

  // --- Review screen ---------------------------------------------------------
  if (reviewing && frames.length > 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white">
        <div className="relative flex-1 overflow-hidden bg-white">
          <img
            src={frames[index].url}
            alt=""
            className="h-full w-full object-contain"
          />
          <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 border-l-2 border-dashed border-yellow-300/70" />
          <div className="absolute inset-x-0 top-4 text-center">
            <span className="rounded-full bg-brand-500 px-3 py-1 text-sm font-semibold text-white">
              {viewLabel}
            </span>
          </div>
        </div>
        <div className="space-y-3 bg-black p-5 text-white">
          <div className="text-center text-sm text-white/80">
            Frame {index + 1} of {frames.length} — scrub to the best one.
          </div>
          <input
            type="range"
            min={0}
            max={frames.length - 1}
            step={1}
            value={index}
            onChange={(e) => setIndex(Number(e.target.value))}
            className="w-full accent-brand-500"
          />
          <div className="flex items-center justify-between gap-3">
            <button className="btn-ghost !bg-slate-800 !text-white" onClick={retake}>
              Re-record
            </button>
            <button
              className="btn-ghost !bg-slate-800 !text-white"
              onClick={() => setIndex(Math.floor(frames.length / 2))}
            >
              Suggested
            </button>
            <button className="btn-primary" onClick={() => onCapture(frames[index].blob)}>
              Use this frame
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Live camera -----------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="relative flex-1 overflow-hidden bg-white">
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
            {/* Flip camera — top-right icon (standard camera placement). */}
            <button
              onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
              className="absolute right-4 top-16 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-lg text-white"
              aria-label="Flip camera"
              title="Flip camera"
            >
              ⟲
            </button>
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 border-l-2 border-dashed border-yellow-300/70" />
              <div className="absolute inset-x-0 top-4 flex flex-col items-center gap-1">
                <span className="rounded-full bg-brand-500 px-3 py-1 text-sm font-semibold text-white">
                  {viewLabel}
                </span>
                <span className="text-xs text-white/90">
                  {view === 'lateral' ? 'Stand side-on, whole body in frame' : 'Face the camera, arms relaxed'}
                </span>
              </div>
            </div>
            {countdown > 0 && (
              <div className="absolute inset-0 grid place-items-center">
                <span className="text-8xl font-bold text-white drop-shadow-lg">{countdown}</span>
              </div>
            )}
            {recording && (
              <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-sm text-white">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> REC · {frameCount}
              </div>
            )}
            {/* Guide button — shows tips for the current view. */}
            <button
              onClick={() => setShowGuide(true)}
              className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1.5 text-sm font-medium text-white"
            >
              ? Guide
            </button>
            {showGuide && (
              <div
                className="absolute inset-0 z-20 grid place-items-center bg-black/70 p-6"
                onClick={() => setShowGuide(false)}
              >
                <div
                  className="w-full max-w-xs rounded-2xl bg-white p-5 text-slate-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="mb-2 text-base font-bold">{viewLabel} — how to</h3>
                  <ul className="list-inside list-disc space-y-1.5 text-sm text-slate-600">
                    {guideTips.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  <button
                    className="btn-primary mt-4 w-full"
                    onClick={() => setShowGuide(false)}
                  >
                    Got it
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="space-y-3 bg-black p-5">
        <div className="flex items-center justify-center gap-2 text-sm text-white">
          <div className="flex overflow-hidden rounded-full border border-slate-700">
            <button
              className={`px-4 py-1.5 ${mode === 'photo' ? 'bg-brand-500' : 'bg-slate-800'}`}
              onClick={() => setMode('photo')}
            >
              Photo
            </button>
            <button
              className={`px-4 py-1.5 ${mode === 'video' ? 'bg-brand-500' : 'bg-slate-800'}`}
              onClick={() => setMode('video')}
            >
              Video
            </button>
          </div>
          {mode === 'photo' && (
            <div className="flex overflow-hidden rounded-full border border-slate-700">
              {[0, 3, 10].map((t) => (
                <button
                  key={t}
                  className={`px-3 py-1.5 ${timer === t ? 'bg-brand-500' : 'bg-slate-800'}`}
                  onClick={() => setTimer(t)}
                >
                  {t === 0 ? 'No timer' : `${t}s`}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <button className="btn-ghost !bg-slate-800 !text-white" onClick={onClose}>
            Cancel
          </button>

          {mode === 'photo' ? (
            <button
              onClick={shoot}
              disabled={!!error || countdown > 0}
              className="h-16 w-16 rounded-full border-4 border-white bg-white/20 disabled:opacity-40"
              aria-label="Capture photo"
            />
          ) : recording ? (
            <button
              onClick={stopRecording}
              className="grid h-16 w-16 place-items-center rounded-full border-4 border-white bg-red-600"
              aria-label="Stop recording"
            >
              <span className="h-6 w-6 rounded bg-white" />
            </button>
          ) : (
            <button
              onClick={startRecording}
              disabled={!!error}
              className="h-16 w-16 rounded-full border-4 border-white bg-red-600 disabled:opacity-40"
              aria-label="Start recording"
            />
          )}

          {/* Spacer to keep the shutter centred (flip moved to top-right). */}
          <span className="w-16" />
        </div>
      </div>
    </div>
  );
}
