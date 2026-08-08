import { useEffect, useRef, useState } from 'react';
import type { ViewType } from '../../lib/types';

interface Props {
  view: ViewType;
  onCapture: (blob: Blob) => void;
  onClose: () => void;
}

/**
 * Full-screen camera capture with a plumb-line alignment guide. Uses the
 * device camera via getUserMedia; captures a still frame to a Blob.
 */
export default function CameraCapture({ view, onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 1920 } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch {
        setError('Camera unavailable. Check permissions or upload a photo instead.');
      }
    })();
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  function shoot() {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext('2d')!.drawImage(v, 0, 0);
    canvas.toBlob((b) => b && onCapture(b), 'image/jpeg', 0.92);
  }

  const hint =
    view === 'lateral'
      ? 'Stand side-on, whole body in frame'
      : view === 'anterior'
      ? 'Face the camera, arms relaxed'
      : 'Back to the camera, arms relaxed';

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
            />
            {/* Alignment guides */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 border-l-2 border-dashed border-yellow-300/70" />
              <div className="absolute inset-x-0 top-4 text-center text-sm text-white/90">
                {hint}
              </div>
            </div>
          </>
        )}
      </div>
      <div className="flex items-center justify-between gap-4 bg-black p-5">
        <button className="btn-ghost !bg-slate-800 !text-white" onClick={onClose}>
          Cancel
        </button>
        <button
          onClick={shoot}
          disabled={!!error}
          className="h-16 w-16 rounded-full border-4 border-white bg-white/20 disabled:opacity-40"
          aria-label="Capture"
        />
        <div className="w-20" />
      </div>
    </div>
  );
}
