import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Landmarks, ViewType } from '../../lib/types';
import { analyze } from '../../lib/measure';
import { detectPose, type RawLandmark } from '../../lib/pose/landmarker';
import { defaultLandmarks, mapLandmarks } from '../../lib/pose/mapping';
import { photoWarnings, torsoVisibility } from '../../lib/pose/photoQuality';
import { classifyAnimal } from '../../lib/pose/animalDetect';

/** Average detector confidence across the main body joints (0..1). */
function detectionConfidence(raw: RawLandmark[]): number {
  const idx = [11, 12, 23, 24, 25, 26, 27, 28];
  const vals = idx.map((i) => raw[i]?.visibility ?? 0);
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

/** Shoulder separation (normalized x), used to sanity-check the chosen view. */
function shoulderSeparation(raw: RawLandmark[]): number | undefined {
  if (!raw[11] || !raw[12]) return undefined;
  return Math.abs(raw[11].x - raw[12].x);
}

/** How clearly the torso joints (shoulders + hips) show — low when baggy
 *  clothing or a busy background hides them. 0..1. */
function torsoVis(raw: RawLandmark[]): number {
  return torsoVisibility({
    shoulderL: raw[11]?.visibility,
    shoulderR: raw[12]?.visibility,
    hipL: raw[23]?.visibility,
    hipR: raw[24]?.visibility,
  });
}
import { renderAnnotated } from '../../lib/report/renderAnnotated';
import { getSuggestions } from '../../lib/measure/suggestions';
import { scoreFeedback } from '../../lib/measure/feedback';
import { db, saveAssessment } from '../../lib/db';
import { scheduleSync } from '../../lib/autosync';
import { useActiveClient } from '../../state/useClient';
import { useAuth } from '../../state/auth';
import PostureEditor from '../../components/PostureEditor';
import MetricList from '../../components/MetricList';
import ScoreRing from '../../components/ScoreRing';
import SignInModal from '../../components/SignInModal';
import CameraCapture from '../capture/CameraCapture';
import DotGuide, { dotGuideHidden } from './DotGuide';

const VIEWS: { id: ViewType; label: string; hint: string }[] = [
  { id: 'lateral', label: 'Side', hint: 'Stand side-on to the camera' },
  { id: 'anterior', label: 'Front', hint: 'Face the camera' },
];

/** One captured view (photo + its landmarks), so Side and Front are both kept. */
interface Shot {
  url: string;
  blob: Blob;
  imgEl: HTMLImageElement | null;
  landmarks: Landmarks;
  detectMsg: string;
  warnings?: string[];
  /** False when detection found no body (score is meaningless until adjusted). */
  detected: boolean;
  /** Easter egg: set when the photo is confidently a cat or dog, not a person. */
  animal?: 'cat' | 'dog';
  savedId?: number;
}

export default function AnalyzePage() {
  const { activeId } = useActiveClient();
  const { user } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  const [animalSaveGone, setAnimalSaveGone] = useState(false);
  const pendingSave = useRef(false);

  const [view, setView] = useState<ViewType>('lateral');
  const [shots, setShots] = useState<Partial<Record<ViewType, Shot>>>({});
  const [detecting, setDetecting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showDotGuide, setShowDotGuide] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const shot = shots[view];
  const stage: 'pick' | 'edit' = shot ? 'edit' : 'pick';
  const result = useMemo(
    () => analyze(view, shot?.landmarks ?? {}),
    [view, shot?.landmarks],
  );
  const suggestions = getSuggestions(result.suggestionIds);

  // Easter egg: stable "meow"/"woof" lines when the photo is a cat or dog.
  const animal = shot?.animal;
  const animalLines = useMemo(() => {
    if (!animal) return [] as { a: string; b: string }[];
    const w = animal === 'dog' ? 'woof' : 'meow';
    const rand = () => Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => w).join(' ');
    const rows = result.metrics.length || 6;
    return Array.from({ length: rows }, () => ({ a: rand(), b: rand() }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animal, result.metrics.length]);

  function patchShot(v: ViewType, patch: Partial<Shot>) {
    setShots((prev) => {
      const cur = prev[v];
      if (!cur) return prev;
      return { ...prev, [v]: { ...cur, ...patch } };
    });
  }

  async function loadBlob(blob: Blob) {
    // Adding a photo (file, paste, or drag-drop) needs an account.
    if (!user) {
      setShowSignIn(true);
      return;
    }
    const forView = view;
    setAnimalSaveGone(false);
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.src = url;
    await img.decode().catch(() => {});
    setShots((prev) => {
      const old = prev[forView];
      if (old?.url) URL.revokeObjectURL(old.url);
      return {
        ...prev,
        [forView]: { url, blob, imgEl: img, landmarks: {}, detectMsg: 'Detecting posture…', detected: true },
      };
    });
    if (!dotGuideHidden()) setShowDotGuide(true);

    setDetecting(true);
    try {
      const raw = await detectPose(img);
      const landmarks = raw ? mapLandmarks(raw, forView) : defaultLandmarks(forView);
      const animal = raw ? undefined : (await classifyAnimal(img)) ?? undefined;
      patchShot(forView, {
        landmarks,
        detected: !!raw,
        animal,
        detectMsg: raw
          ? 'Drag any point to fine-tune.'
          : animal
            ? ''
            : 'No body found. Drag the points onto your joints.',
        warnings: raw
          ? photoWarnings(img, landmarks, forView, {
              confidence: detectionConfidence(raw),
              shoulderSep: shoulderSeparation(raw),
              jointVisibility: torsoVis(raw),
            })
          : [],
      });
    } catch {
      patchShot(forView, {
        landmarks: defaultLandmarks(forView),
        detectMsg: 'Detection unavailable. Place the points by hand.',
      });
    } finally {
      setDetecting(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) loadBlob(f);
    e.target.value = '';
  }

  // Paste an image (Cmd/Ctrl+V) to start an analysis for the active view.
  const loadBlobRef = useRef(loadBlob);
  loadBlobRef.current = loadBlob;
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            loadBlobRef.current(blob);
            break;
          }
        }
      }
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  // Complete a save once auth state propagates after a sign-in.
  const saveRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (user && pendingSave.current) {
      pendingSave.current = false;
      saveRef.current();
    }
  }, [user]);

  async function reDetect() {
    const s = shots[view];
    if (!s?.imgEl) return;
    setDetecting(true);
    patchShot(view, { detectMsg: 'Re-detecting…' });
    try {
      const raw = await detectPose(s.imgEl);
      const landmarks = raw ? mapLandmarks(raw, view) : defaultLandmarks(view);
      const animal = raw ? undefined : (await classifyAnimal(s.imgEl)) ?? undefined;
      patchShot(view, {
        landmarks,
        detected: !!raw,
        animal,
        detectMsg: raw ? 'Points updated.' : animal ? '' : 'No body found.',
        warnings: raw
          ? photoWarnings(s.imgEl, landmarks, view, {
              confidence: detectionConfidence(raw),
              shoulderSep: shoulderSeparation(raw),
              jointVisibility: torsoVis(raw),
            })
          : photoWarnings(s.imgEl, landmarks, view),
      });
    } catch {
      patchShot(view, { detectMsg: 'Detection unavailable.' });
    } finally {
      setDetecting(false);
    }
  }

  function replacePhoto() {
    const s = shots[view];
    if (s?.url) URL.revokeObjectURL(s.url);
    setShots((prev) => {
      const next = { ...prev };
      delete next[view];
      return next;
    });
  }

  async function save() {
    const s = shots[view];
    if (!s?.blob || !s.imgEl || activeId == null) return;
    if (!user) {
      setShowSignIn(true);
      return;
    }
    const annotated = await renderAnnotated(s.imgEl, view, s.landmarks, result.metrics, 900, {
      watermark: 'minimal',
    });
    const data = {
      clientId: activeId,
      view,
      photo: s.blob,
      annotated,
      imageWidth: s.imgEl.naturalWidth,
      imageHeight: s.imgEl.naturalHeight,
      landmarks: s.landmarks,
      metrics: result.metrics,
      score: result.score,
      synced: false,
    };
    if (s.savedId != null) {
      await db.assessments.update(s.savedId, data);
      scheduleSync();
    } else {
      const id = (await saveAssessment({ createdAt: Date.now(), ...data })) as number;
      patchShot(view, { savedId: id });
    }
  }
  saveRef.current = save;

  function annotatedFilename() {
    return `posturelab-${view}-${new Date().toISOString().slice(0, 10)}.png`;
  }
  function triggerDownload(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = annotatedFilename();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function shareImage() {
    const s = shots[view];
    if (!s?.imgEl) return;
    const blob = await renderAnnotated(s.imgEl, view, s.landmarks, result.metrics, 900, {
      watermark: 'full',
    });
    const file = new File([blob], annotatedFilename(), { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
    if (nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: 'My PostureLab result' });
        return;
      } catch (e) {
        if ((e as { name?: string })?.name === 'AbortError') return;
      }
    }
    triggerDownload(blob);
  }
  async function downloadImage() {
    const s = shots[view];
    if (!s?.imgEl) return;
    triggerDownload(
      await renderAnnotated(s.imgEl, view, s.landmarks, result.metrics, 900, { watermark: 'full' }),
    );
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = Array.from(e.dataTransfer.files).find((file) => file.type.startsWith('image/'));
    if (f) loadBlob(f);
  }

  const viewLabel = VIEWS.find((v) => v.id === view)!.label.toLowerCase();
  const bothShots = shots.lateral && shots.anterior;

  return (
    <div
      className="relative space-y-4"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragOver(false);
      }}
      onDrop={onDrop}
    >
      {dragOver && (
        <div className="pointer-events-none fixed inset-0 z-40 grid place-items-center bg-brand-500/20 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-brand-500 bg-white px-8 py-6 text-lg font-semibold text-brand-700 shadow-lg dark:bg-slate-900">
            Drop your photo to analyze
          </div>
        </div>
      )}
      <h1 className="text-2xl font-bold">New analysis</h1>

      {/* Side / Front tabs — each keeps its own photo, so you can do both. */}
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
            <div className="flex items-center gap-2 font-semibold">
              {v.label} view
              {shots[v.id] && (
                <span className="rounded-full bg-brand-500 px-1.5 text-[10px] font-semibold text-white">
                  ✓ photo
                </span>
              )}
            </div>
            <div className="hidden text-xs text-slate-500 sm:block">{v.hint}</div>
          </button>
        ))}
      </div>

      {stage === 'pick' && (
        <div className="card overflow-hidden">
          <div className="grid items-center gap-5 p-5 sm:grid-cols-2">
            <div className="hidden items-center justify-center sm:flex">
              <img
                src={`${import.meta.env.BASE_URL}brand/${view === 'lateral' ? 'side.jpg' : 'front.png'}`}
                alt=""
                className={`rounded-xl object-contain ${view === 'anterior' ? 'max-h-80' : 'max-h-72'}`}
                loading="lazy"
              />
            </div>
            <div className="space-y-3">
              <h2 className="text-lg font-semibold capitalize">Add a {viewLabel} photo</h2>
              <p className="text-sm text-slate-500">
                Full-body photo, plain background, camera at hip height, standing
                relaxed. The joint points are placed for you to fine-tune.
              </p>
              <p className="text-xs text-slate-400">
                Tip: paste (⌘/Ctrl + V) or drag &amp; drop an image. Add a Side and a
                Front, and both are kept so you can view them together.
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="btn-primary" onClick={() => fileRef.current?.click()}>
                  ＋ Add {viewLabel} photo
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => (user ? setShowCamera(true) : setShowSignIn(true))}
                >
                  Use camera
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
            </div>
          </div>
        </div>
      )}

      {stage === 'edit' && shot && (
        <>
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
              {shot.animal ? (
                <img src={shot.url} alt="" className="w-full rounded-2xl" />
              ) : (
                <PostureEditor
                  imageUrl={shot.url}
                  view={view}
                  landmarks={shot.landmarks}
                  metrics={result.metrics}
                  onChange={(lm) => patchShot(view, { landmarks: lm, detected: true, detectMsg: '' })}
                />
              )}
              <div className="space-y-2">
                {shot.detectMsg && (
                  <p className="text-sm text-slate-500">{shot.detectMsg}</p>
                )}
                {shot.warnings?.map((w) => (
                  <p
                    key={w}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200"
                  >
                    {w}
                  </p>
                ))}
                <div className="flex flex-wrap gap-2">
                  {!shot.animal && (
                    <>
                      <button className="btn-ghost" onClick={() => setShowDotGuide(true)}>
                        ? Dot guide
                      </button>
                      <button className="btn-ghost" onClick={reDetect} disabled={detecting}>
                        {detecting ? 'Detecting…' : 'Re-detect'}
                      </button>
                    </>
                  )}
                  <button className="btn-ghost" onClick={replacePhoto}>
                    Replace photo
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="card flex items-center gap-4 p-4">
                {shot.animal ? (
                  <>
                    <ScoreRing
                      score={100}
                      size={96}
                      label=""
                      centerContent={
                        <span className="text-4xl" aria-hidden>
                          {shot.animal === 'cat' ? '🐱' : '🐶'}
                        </span>
                      }
                    />
                    <div className="text-sm">
                      <div className="font-semibold">
                        {shot.animal === 'cat' ? 'Cat detected' : 'Dog detected'}
                      </div>
                      <p className="mt-0.5 text-slate-500">{animalLines[0]?.a}</p>
                    </div>
                  </>
                ) : shot.detected === false ? (
                  <>
                    <ScoreRing
                      score={0}
                      size={96}
                      label=""
                      centerContent={
                        <button
                          onClick={reDetect}
                          disabled={detecting}
                          className="grid h-16 w-16 place-items-center rounded-full bg-brand-500 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          {detecting ? '…' : 'Detect'}
                        </button>
                      }
                    />
                    <div className="text-sm">
                      <div className="font-semibold">No body detected</div>
                      <p className="mt-0.5 text-slate-500">
                        Drag the points onto your joints, or tap Detect to try again. See the{' '}
                        <button
                          className="text-brand-600 hover:underline"
                          onClick={() => setShowDotGuide(true)}
                        >
                          dot guide
                        </button>{' '}
                        for help.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <ScoreRing score={result.score} size={96} />
                    <div className="text-sm">
                      <div className="font-semibold">{scoreFeedback(result.score).title}</div>
                      <p className="mt-0.5 text-slate-500">{scoreFeedback(result.score).detail}</p>
                    </div>
                  </>
                )}
              </div>
              <div className="card p-4">
                <h2 className="mb-1 font-semibold">Measurements</h2>
                {shot.animal ? (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {animalLines.map((l, i) => (
                      <li key={i} className="flex items-center justify-between py-3 text-sm">
                        <span className="font-medium">{l.a}</span>
                        <span className="text-slate-500">{l.b}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <MetricList metrics={result.metrics} />
                )}
              </div>
              <div>
                {shot.animal ? (
                  <button
                    className={`btn-primary w-full transition-opacity duration-500 ${
                      animalSaveGone ? 'pointer-events-none opacity-0' : ''
                    }`}
                    onClick={() => setAnimalSaveGone(true)}
                  >
                    Save assessment
                  </button>
                ) : (
                  <>
                    <button className="btn-primary w-full" onClick={save} disabled={activeId == null}>
                      {shot.savedId != null
                        ? 'Saved ✓ · Update'
                        : user
                          ? 'Save assessment'
                          : 'Log in to save assessment'}
                    </button>
                    {shot.savedId != null && (
                      <p className="mt-1 text-center text-xs text-slate-400">
                        Saved to your <Link to="/history" className="text-brand-600 hover:underline">history</Link>.
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className={`btn-ghost transition-opacity duration-500 ${
                    shot.animal && animalSaveGone ? 'pointer-events-none opacity-0' : ''
                  }`}
                  onClick={shot.animal ? () => setAnimalSaveGone(true) : shareImage}
                >
                  ⬆ Share
                </button>
                <button
                  className={`btn-ghost transition-opacity duration-500 ${
                    shot.animal && animalSaveGone ? 'pointer-events-none opacity-0' : ''
                  }`}
                  onClick={shot.animal ? () => setAnimalSaveGone(true) : downloadImage}
                >
                  ⬇ Download
                </button>
              </div>
            </div>
          </div>

          {bothShots && (
            <div className="card p-4">
              <h2 className="mb-3 font-semibold">Side &amp; front together</h2>
              <div className="grid grid-cols-2 gap-4">
                {(['lateral', 'anterior'] as ViewType[]).map((v) => {
                  const s = shots[v]!;
                  const r = analyze(v, s.landmarks);
                  return (
                    <div key={v}>
                      <PostureEditor
                        imageUrl={s.url}
                        view={v}
                        landmarks={s.landmarks}
                        metrics={r.metrics}
                        readOnly
                      />
                      <div className="mt-1 text-center text-sm font-semibold">
                        {VIEWS.find((x) => x.id === v)!.label} · {r.score}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!shot.animal && suggestions.length > 0 && (
            <div className="card p-4">
              <div className="mb-3">
                <h2 className="font-semibold">Suggested focus areas</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {suggestions.map((s) => (
                  <div key={s.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
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

      <DotGuide view={view} open={showDotGuide} onClose={() => setShowDotGuide(false)} />

      {showSignIn && (
        <SignInModal
          title="Sign in to scan"
          subtitle="Create an account or sign in to analyze and save your posture."
          onClose={() => setShowSignIn(false)}
          onSignedIn={() => {
            setShowSignIn(false);
            pendingSave.current = true;
          }}
        />
      )}


      {showCamera && (
        <CameraCapture
          view={view}
          onViewChange={setView}
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
