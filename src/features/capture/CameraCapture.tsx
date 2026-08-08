import { useEffect, useRef, useState } from 'react';
import type { ViewType } from '../../lib/types';

interface Props {
  view: ViewType;
  onCapture: (blob: Blob) => void;
  onClose: () => void;
}

type Mode = 'photo' | 'video';
type Facing = 'user' | 'environment';

/**
 * Camera capture with:
 *  - front/back camera toggle,
 *  - a self-timer (0/3/10s) so you can prop the phone and pose yourself,
 *  - a video mode: record a short clip, then scrub to (or auto-pick) the best
 *    frame and analyze that.
 */
export default function CameraCapture({ view, onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [error, setError] = useState('');
  const [mode, setMode] = useState<Mode>('photo');
  const [facing, setFacing] = useState<Facing>('user');
  const [timer, setTimer] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [recording, setRecording] = useState(false);

  // Video review state.
  const [clipUrl, setClipUrl] = useState('');
  const reviewRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [frameTime, setFrameTime] = useState(0);

  async function startStream(f: Facing) {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: f, width: { ideal: 1280 }, height: { ideal: 1920 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch {
      setError('Camera unavailable. Check permissions or upload a photo instead.');
    }
  }

  useEffect(() => {
    startStream(facing);
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);

  useEffect(() => {
    return () => {
      if (clipUrl) URL.revokeObjectURL(clipUrl);
    };
  }, [clipUrl]);

  function grabFrame(el: HTMLVideoElement): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = el.videoWidth;
    canvas.height = el.videoHeight;
    const ctx = canvas.getContext('2d')!;
    // Un-mirror the front camera so the saved image matches reality.
    if (facing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(el, 0, 0);
    return new Promise((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.92));
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

  function startRecording() {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const rec = new MediaRecorder(streamRef.current);
    rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || 'video/mp4' });
      setClipUrl(URL.createObjectURL(blob));
    };
    recorderRef.current = rec;
    rec.start();
    setRecording(true);
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function useFrame() {
    const el = reviewRef.current;
    if (!el) return;
    // Ensure the frame at frameTime is rendered before grabbing it.
    if (Math.abs(el.currentTime - frameTime) > 0.05) {
      el.currentTime = frameTime;
      await new Promise((r) => el.addEventListener('seeked', r, { once: true }));
    }
    onCapture(await grabFrame(el));
  }

  function retake() {
    if (clipUrl) URL.revokeObjectURL(clipUrl);
    setClipUrl('');
    setDuration(0);
    setFrameTime(0);
    startStream(facing);
  }

  const hint =
    view === 'lateral' ? 'Stand side-on, whole body in frame' : 'Face the camera, arms relaxed';

  // --- Video review screen ---------------------------------------------------
  if (clipUrl) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black">
        <div className="relative flex-1 overflow-hidden">
          <video
            ref={reviewRef}
            src={clipUrl}
            playsInline
            muted
            className="h-full w-full object-contain"
            style={{ transform: facing === 'user' ? 'scaleX(-1)' : undefined }}
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration || 0;
              setDuration(d);
              const mid = d / 2; // suggested frame = midpoint (usually settled pose)
              setFrameTime(mid);
              e.currentTarget.currentTime = mid;
            }}
          />
          <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 border-l-2 border-dashed border-yellow-300/70" />
        </div>
        <div className="space-y-3 bg-black p-5 text-white">
          <div className="text-center text-sm text-white/80">
            Scrub to the best frame, or use the suggested one.
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.03}
            value={frameTime}
            onChange={(e) => {
              const t = Number(e.target.value);
              setFrameTime(t);
              if (reviewRef.current) reviewRef.current.currentTime = t;
            }}
            className="w-full accent-brand-500"
          />
          <div className="flex items-center justify-between gap-3">
            <button className="btn-ghost !bg-slate-800 !text-white" onClick={retake}>
              Re-record
            </button>
            <button
              className="btn-ghost !bg-slate-800 !text-white"
              onClick={() => {
                const mid = duration / 2;
                setFrameTime(mid);
                if (reviewRef.current) reviewRef.current.currentTime = mid;
              }}
            >
              Suggested frame
            </button>
            <button className="btn-primary" onClick={useFrame}>
              Use this frame
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Live camera screen ----------------------------------------------------
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
              style={{ transform: facing === 'user' ? 'scaleX(-1)' : undefined }}
            />
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 border-l-2 border-dashed border-yellow-300/70" />
              <div className="absolute inset-x-0 top-4 text-center text-sm text-white/90">
                {hint}
              </div>
            </div>
            {countdown > 0 && (
              <div className="absolute inset-0 grid place-items-center">
                <span className="text-8xl font-bold text-white drop-shadow-lg">{countdown}</span>
              </div>
            )}
            {recording && (
              <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-sm text-white">
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> REC
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-3 bg-black p-5">
        {/* Mode + options row */}
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

        {/* Action row */}
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

          <button
            className="btn-ghost !bg-slate-800 !text-white"
            onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
            title="Flip camera"
          >
            ⟲ Flip
          </button>
        </div>
      </div>
    </div>
  );
}
