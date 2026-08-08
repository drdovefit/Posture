import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Landmarks, ViewType } from '../../lib/types';
import { analyze } from '../../lib/measure';
import { detectPose } from '../../lib/pose/landmarker';
import { defaultLandmarks, mapLandmarks } from '../../lib/pose/mapping';
import { renderAnnotated } from '../../lib/report/renderAnnotated';
import { getSuggestions } from '../../lib/measure/suggestions';
import { saveAssessment } from '../../lib/db';
import { useActiveClient } from '../../state/useClient';
import PostureEditor from '../../components/PostureEditor';
import MetricList from '../../components/MetricList';
import ScoreRing from '../../components/ScoreRing';
import CameraCapture from '../capture/CameraCapture';

type Stage = 'pick' | 'edit';

const VIEWS: { id: ViewType; label: string; hint: string }[] = [
  { id: 'lateral', label: 'Side', hint: 'Stand side-on to the camera' },
  { id: 'anterior', label: 'Front', hint: 'Face the camera' },
];

export default function AnalyzePage() {
  const { activeId } = useActiveClient();
  const navigate = useNavigate();

  const [view, setView] = useState<ViewType>('lateral');
  const [stage, setStage] = useState<Stage>('pick');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [landmarks, setLandmarks] = useState<Landmarks>({});
  const [detecting, setDetecting] = useState(false);
  const [detectMsg, setDetectMsg] = useState<string>('');
  const [showCamera, setShowCamera] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const result = useMemo(() => analyze(view, landmarks), [view, landmarks]);
  const suggestions = getSuggestions(result.suggestionIds);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  // When the view is switched while editing, re-map landmarks for the new view.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (stage === 'edit' && imgEl) reDetect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  async function loadBlob(blob: Blob) {
    const url = URL.createObjectURL(blob);
    setImageBlob(blob);
    setImageUrl(url);

    const img = new Image();
    img.src = url;
    await img.decode().catch(() => {});
    setImgEl(img);
    setStage('edit');

    // Try auto-detection; fall back to manual defaults.
    setDetecting(true);
    setDetectMsg('Detecting posture…');
    try {
      const raw = await detectPose(img);
      if (raw) {
        setLandmarks(mapLandmarks(raw, view));
        setDetectMsg('Auto-detected — drag any point to fine-tune.');
      } else {
        setLandmarks(defaultLandmarks(view));
        setDetectMsg('No body detected — drag the points onto the joints.');
      }
    } catch {
      setLandmarks(defaultLandmarks(view));
      setDetectMsg('Auto-detection unavailable — place the points manually.');
    } finally {
      setDetecting(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) loadBlob(f);
  }

  async function reDetect() {
    if (!imgEl) return;
    setDetecting(true);
    setDetectMsg('Re-detecting…');
    try {
      const raw = await detectPose(imgEl);
      setLandmarks(raw ? mapLandmarks(raw, view) : defaultLandmarks(view));
      setDetectMsg(raw ? 'Re-detected.' : 'No body detected.');
    } catch {
      setDetectMsg('Auto-detection unavailable.');
    } finally {
      setDetecting(false);
    }
  }

  async function save() {
    if (!imageBlob || !imgEl || activeId == null) return;
    const annotated = await renderAnnotated(imgEl, view, landmarks, result.metrics);
    await saveAssessment({
      clientId: activeId,
      createdAt: Date.now(),
      view,
      photo: imageBlob,
      annotated,
      imageWidth: imgEl.naturalWidth,
      imageHeight: imgEl.naturalHeight,
      landmarks,
      metrics: result.metrics,
      score: result.score,
    });
    navigate('/history');
  }

  function reset() {
    setStage('pick');
    setLandmarks({});
    setImgEl(null);
    setImageBlob(null);
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl('');
  }

  const viewLabel = VIEWS.find((v) => v.id === view)!.label.toLowerCase();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">New analysis</h1>

      {/* View selector — pick which view, then add a photo for it. */}
      <div className="grid grid-cols-2 gap-2">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
              view === v.id
                ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200'
                : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
            }`}
          >
            <div className="font-semibold">{v.label} view</div>
            <div className="hidden text-xs text-slate-500 sm:block">{v.hint}</div>
          </button>
        ))}
      </div>

      {stage === 'pick' && (
        <div className="card overflow-hidden">
          <div className="grid items-center gap-5 p-5 sm:grid-cols-2">
            <img
              src={`${import.meta.env.BASE_URL}brand/hero-icons.jpg`}
              alt=""
              className="hidden w-full rounded-xl object-cover sm:block"
              loading="lazy"
            />
            <div className="space-y-3">
              <h2 className="text-lg font-semibold capitalize">Add a {viewLabel} photo</h2>
              <p className="text-sm text-slate-500">
                Full-body photo, plain background, camera at hip height, standing
                relaxed. It’s auto-detected the moment you add it.
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="btn-primary" onClick={() => fileRef.current?.click()}>
                  ＋ Add {viewLabel} photo
                </button>
                <button className="btn-ghost" onClick={() => setShowCamera(true)}>
                  Use camera
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFile}
              />
            </div>
          </div>
        </div>
      )}

      {stage === 'edit' && imageUrl && (
        <>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-3">
            <PostureEditor
              imageUrl={imageUrl}
              view={view}
              landmarks={landmarks}
              metrics={result.metrics}
              onChange={setLandmarks}
            />
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-slate-500">{detectMsg}</span>
              <div className="ml-auto flex gap-2">
                <button className="btn-ghost" onClick={reDetect} disabled={detecting}>
                  {detecting ? 'Detecting…' : 'Re-detect'}
                </button>
                <button className="btn-ghost" onClick={reset}>
                  ＋ Add another photo
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card flex items-center gap-4 p-4">
              <ScoreRing score={result.score} size={96} />
              <div className="text-sm text-slate-500">
                Weighted from {result.metrics.length} measurements. Higher is
                closer to a neutral, balanced posture.
              </div>
            </div>
            <div className="card p-4">
              <h2 className="mb-1 font-semibold">Measurements</h2>
              <MetricList metrics={result.metrics} />
            </div>
            <button className="btn-primary w-full" onClick={save} disabled={activeId == null}>
              Save assessment
            </button>
          </div>
          </div>

          {suggestions.length > 0 && (
            <div className="card p-4">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="font-semibold">Suggested focus areas</h2>
                <span className="text-xs text-slate-400">Educational only — not a treatment plan.</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {suggestions.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="chip bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
                        {s.category}
                      </span>
                      <span className="text-sm font-medium">{s.title}</span>
                    </div>
                    <p className="text-sm text-slate-500">{s.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showCamera && (
        <CameraCapture
          view={view}
          onClose={() => setShowCamera(false)}
          onCapture={(blob) => {
            setShowCamera(false);
            loadBlob(blob);
          }}
        />
      )}
    </div>
  );
}
