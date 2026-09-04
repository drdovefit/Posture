import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db, deleteAssessment } from '../../lib/db';
import { useActiveClient } from '../../state/useClient';
import { shareOrDownloadFile } from '../../lib/share';
import { useCroppedPortrait } from '../../state/useCroppedPortrait';
import { exportAssessmentPdf } from '../../lib/report/pdf';
import { analyze } from '../../lib/measure';
import { getSuggestions } from '../../lib/measure/suggestions';
import MetricList from '../../components/MetricList';
import ScoreRing from '../../components/ScoreRing';
import SuggestionItem from '../../components/SuggestionItem';
import ProLock from '../../components/ProLock';
import { useTier } from '../../lib/entitlement';
import ScoreTrend from './ScoreTrend';
import type { Assessment, Client } from '../../lib/types';
import { useState } from 'react';

const VIEW_LABEL: Record<string, string> = {
  anterior: 'Front',
  lateral: 'Side',
  posterior: 'Back',
};

function scoreColor(score: number) {
  return score >= 85 ? '#10b981' : score >= 65 ? '#f59e0b' : '#ef4444';
}

function Row({ a, client }: { a: Assessment; client: Client | null }) {
  const thumb = useCroppedPortrait(a); // cropped to the body, for the thumbnail
  const { isPro } = useTier();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <div className="card overflow-hidden">
      <div className="flex gap-4 p-4">
        <div className="shrink-0">
          <div className="h-32 w-24 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
            {thumb && <img src={thumb} alt="" className="h-full w-full object-cover" />}
          </div>
          <div
            className="mt-1 text-center text-lg font-bold sm:hidden"
            style={{ color: scoreColor(a.score) }}
          >
            {a.score}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{VIEW_LABEL[a.view]} view</span>
            <span className="text-xs text-slate-500">
              {new Date(a.createdAt).toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {a.metrics.map((m) => (
              <span
                key={m.id}
                className={`chip ${
                  m.severity === 'good'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : m.severity === 'mild'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                }`}
              >
                {m.label}
              </span>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-ghost !py-1 text-xs" onClick={() => setOpen((o) => !o)}>
              {open ? 'Hide details' : 'Details'}
            </button>
            <button
              className="btn-ghost !py-1 text-xs"
              onClick={() => client && exportAssessmentPdf(client, a)}
            >
              Export PDF
            </button>
            <button
              className="btn-ghost !py-1 text-xs"
              onClick={async () => {
                const blob = a.annotated ?? a.photo;
                if (!blob) return;
                const name = `posturelab-${a.view}-${new Date(a.createdAt).toISOString().slice(0, 10)}.png`;
                await shareOrDownloadFile(new File([blob], name, { type: blob.type || 'image/png' }), 'My PostureLab result');
              }}
            >
              Share image
            </button>
            <button
              className="btn-ghost !py-1 text-xs !text-red-600"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </button>
          </div>
        </div>
        <div className="hidden sm:block">
          <ScoreRing score={a.score} size={72} label="" />
        </div>
      </div>

      {confirmDelete && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="card w-full max-w-xs space-y-4 p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold">Delete this scan?</h3>
            <div className="mx-auto h-40 w-32 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
              {thumb && <img src={thumb} alt="" className="h-full w-full object-cover" />}
            </div>
            <p className="text-sm text-slate-500">
              {VIEW_LABEL[a.view]} view ·{' '}
              {new Date(a.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <p className="text-xs text-slate-400">This can't be undone.</p>
            <div className="flex gap-2">
              <button className="btn-ghost flex-1" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
              <button
                className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                onClick={() => {
                  if (a.id) deleteAssessment(a.id);
                  setConfirmDelete(false);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {open && (
        <div className="space-y-4 border-t border-slate-100 p-4 dark:border-slate-800">
          <MetricList metrics={a.metrics} />
          {(() => {
            const suggestions = getSuggestions(analyze(a.view, a.landmarks).suggestionIds);
            if (!suggestions.length) return null;
            return (
              <div>
                <h3 className="mb-2 font-semibold">What to work on</h3>
                {isPro ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {suggestions.map((s) => (
                      <SuggestionItem key={s.id} s={s} />
                    ))}
                  </div>
                ) : (
                  <ProLock
                    title="Your fixes are Pro"
                    blurb="See what to work on and how to fix each flagged area."
                  />
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const { active, activeId } = useActiveClient();
  const assessments = useLiveQuery(
    () =>
      activeId == null
        ? []
        : db.assessments.where('clientId').equals(activeId).reverse().sortBy('createdAt'),
    [activeId],
    [],
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">History</h1>
        <Link to="/analyze" className="btn-primary">
          ＋ New
        </Link>
      </div>

      {assessments && assessments.length > 1 && (
        <div className="card p-4">
          <h2 className="mb-2 font-semibold">Score trend</h2>
          <ScoreTrend assessments={[...assessments].reverse()} />
        </div>
      )}

      {!assessments?.length ? (
        <div className="card overflow-hidden text-center">
          <img
            src={`${import.meta.env.BASE_URL}brand/progress.jpg`}
            alt=""
            className="mx-auto max-h-64 w-full object-contain"
            loading="lazy"
          />
          <p className="p-6 pt-0 text-slate-500">
            No saved assessments yet. Analyze a photo and your progress will
            chart here over time.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map((a) => (
            <Row key={a.id} a={a} client={active} />
          ))}
        </div>
      )}
    </div>
  );
}
