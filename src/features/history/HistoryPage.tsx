import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db, deleteAssessment } from '../../lib/db';
import { useActiveClient } from '../../state/useClient';
import { useBlobUrl } from '../../state/useBlobUrl';
import { useCroppedPortrait } from '../../state/useCroppedPortrait';
import { exportAssessmentPdf } from '../../lib/report/pdf';
import { analyze } from '../../lib/measure';
import { getSuggestions } from '../../lib/measure/suggestions';
import MetricList from '../../components/MetricList';
import ScoreRing from '../../components/ScoreRing';
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
  const url = useBlobUrl(a.annotated ?? a.photo); // full image, for the download link
  const thumb = useCroppedPortrait(a); // cropped to the body, for the thumbnail
  const [open, setOpen] = useState(false);
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
              {new Date(a.createdAt).toLocaleString()}
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
            <a
              className="btn-ghost !py-1 text-xs"
              href={url}
              download={`posturelab-${a.view}-${new Date(a.createdAt).toISOString().slice(0, 10)}.png`}
            >
              ⬇ Image
            </a>
            <button
              className="btn-ghost !py-1 text-xs !text-red-600"
              onClick={() => a.id && confirm('Delete this assessment?') && deleteAssessment(a.id)}
            >
              Delete
            </button>
          </div>
        </div>
        <div className="hidden sm:block">
          <ScoreRing score={a.score} size={72} label="" />
        </div>
      </div>
      {open && (
        <div className="space-y-4 border-t border-slate-100 p-4 dark:border-slate-800">
          <MetricList metrics={a.metrics} />
          {(() => {
            const suggestions = getSuggestions(analyze(a.view, a.landmarks).suggestionIds);
            if (!suggestions.length) return null;
            return (
              <div>
                <h3 className="mb-2 font-semibold">What to work on</h3>
                <div className="grid gap-2 sm:grid-cols-2">
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
            No saved assessments yet — analyze a photo and your progress will
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
