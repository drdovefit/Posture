import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BRAND_IMAGE_KEYS, storedBrandImage } from '../../lib/brandImages';

type Tab = 'side' | 'front';

const BASE = import.meta.env.BASE_URL;

const CONTENT: Record<
  Tab,
  { title: string; image: string; how: string[]; measures: [string, string][] }
> = {
  side: {
    title: 'Side view',
    image: `${BASE}brand/side.jpg`,
    how: [
      'Stand side-on to the camera (your profile faces it).',
      'Get your whole body in frame, from head to feet.',
      'Arms relaxed at your sides, look straight ahead.',
      'Camera at hip height, ~3 m away, held level.',
    ],
    measures: [
      ['Forward head', 'Ear carried ahead of the shoulder, which loads the neck.'],
      ['Trunk lean', 'Upper body tipped forward or back of vertical.'],
      ['Hip / pelvis position', 'Pelvis shifted relative to the ankles.'],
      ['Knee alignment', 'Knee bent or locked back in standing.'],
      ['Overall stacking', 'How well the whole body stacks over the ankles.'],
    ],
  },
  front: {
    title: 'Front view',
    image: `${BASE}brand/front.png`,
    how: [
      'Face the camera straight on.',
      'Feet about hip-width, weight even, arms relaxed.',
      'Get your whole body in frame, from head to feet.',
      'Camera at hip height, ~3 m away, held level.',
    ],
    measures: [
      ['Head tilt', 'Whether the eyes/head are level side to side.'],
      ['Shoulder level', 'One shoulder higher than the other.'],
      ['Pelvic level', 'A side-to-side (lateral) tilt of the hips.'],
      ['Lateral shift', 'Trunk off-center over the feet.'],
      ['Knee valgus/varus', 'Knees converging (knock) or bowing out.'],
    ],
  },
};

const steps = [
  ['Pick the view and add a photo', 'Choose Side or Front, then add or capture a full-body photo.'],
  ['The points appear on your joints', 'PostureLab finds your joints and draws a straight guide line. Drag any point to fine-tune, and the measurements update as you go.'],
  ['Read your score', 'Each measurement is graded good, mild, or moderate, then combined into a score out of 100.'],
  ['Track progress', 'Save it, compare before and after, and follow your trend over time.'],
];

export default function GuidePage() {
  const [tab, setTab] = useState<Tab>('side');
  const [clothingBroken, setClothingBroken] = useState(false);
  const c = CONTENT[tab];
  const clothingImg =
    storedBrandImage(BRAND_IMAGE_KEYS.clothing) ?? `${BASE}brand/clothing-guide.png`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">How PostureLab works</h1>
        <p className="text-sm text-slate-500">
          A quick guide to getting accurate, useful posture assessments.
        </p>
      </div>

      <img
        src={`${BASE}brand/${tab === 'side' ? 'take-side.png' : 'illustration.png'}`}
        alt="Taking a posture photo"
        className="w-full rounded-2xl"
        loading="lazy"
        onError={(e) => {
          // Side "taking a photo" art is optional until provided; fall back.
          (e.currentTarget as HTMLImageElement).src = `${BASE}brand/illustration.png`;
        }}
      />

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2">
        {(['side', 'front'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold capitalize transition-colors ${
              tab === t
                ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200'
                : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
            }`}
          >
            {t} view
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="space-y-4 p-5">
          <h2 className="text-lg font-bold">{c.title}</h2>
          <div>
            <h3 className="mb-1 font-semibold">How to take the photo</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-slate-500">
              {c.how.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-1 font-semibold">What this view measures</h3>
            <dl className="space-y-1.5">
              {c.measures.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[9rem_1fr] gap-2 text-sm">
                  <dt className="font-medium">{k}</dt>
                  <dd className="text-slate-500">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <div className="card space-y-3 p-5">
        <h2 className="text-lg font-bold">What to wear</h2>
        <p className="text-sm text-slate-500">
          Fitted clothing so your joints show: shorts or leggings with a fitted
          top or sports bra. Baggy clothes hide the hips and shoulders and throw
          the score off.
        </p>
        {!clothingBroken && (
          <img
            src={clothingImg}
            alt="What to wear: fitted clothing, not baggy"
            className="w-full rounded-xl object-contain"
            loading="lazy"
            onError={() => setClothingBroken(true)}
          />
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">The steps</h2>
        <ol className="space-y-3">
          {steps.map(([title, body], i) => (
            <li key={title} className="card flex gap-4 p-4">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-500 font-bold text-white">
                {i + 1}
              </div>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-slate-500">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="card flex flex-col items-center gap-3 p-6 text-center">
        <h2 className="text-lg font-bold">Ready to go?</h2>
        <p className="text-sm text-slate-500">
          Pick a view, add a photo, and get your score in seconds.
        </p>
        <Link to="/analyze" className="btn-primary">
          Start a scan
        </Link>
      </div>
    </div>
  );
}
