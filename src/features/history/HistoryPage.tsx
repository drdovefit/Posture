import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db, deleteAssessment } from '../../lib/db';
import { useActiveClient } from '../../state/useClient';
import { useBlobUrl } from '../../state/useBlobUrl';
import { exportAssessmentPdf } from '../../lib/report/pdf';
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

function Row({ a, client }: { a: Assessment; client: Client | null }) {
  const url = useBlobUrl(a.annotated ?? a.photo);
  const [open, setOpen] = useState(false);
  return (
    <div className="card overflow-hidden">
      <div className="flex gap-4 p-4">
        <div className="h-32 w-24 shrink-0 overflow-hidden rounded-lg bg-black">
          {url && <img src={url} alt="" className="h-full w-full object-contain" />}
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
        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <MetricList metrics={a.metrics} />
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
