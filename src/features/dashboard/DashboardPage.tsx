import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { useActiveClient } from '../../state/useClient';
import ScoreRing from '../../components/ScoreRing';
import { useBlobUrl } from '../../state/useBlobUrl';
import type { Assessment } from '../../lib/types';

const VIEW_LABEL: Record<string, string> = {
  anterior: 'Front',
  lateral: 'Side',
  posterior: 'Back',
};

function RecentCard({ a }: { a: Assessment }) {
  const url = useBlobUrl(a.annotated ?? a.photo);
  return (
    <Link to="/history" className="card overflow-hidden transition-transform hover:-translate-y-0.5">
      <div className="aspect-[3/4] bg-black">
        {url && <img src={url} alt="" className="h-full w-full object-contain" />}
      </div>
      <div className="flex items-center justify-between p-3">
        <div>
          <div className="text-sm font-medium">{VIEW_LABEL[a.view]} view</div>
          <div className="text-xs text-slate-500">
            {new Date(a.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className="text-lg font-bold" style={{ color: a.score >= 85 ? '#10b981' : a.score >= 65 ? '#f59e0b' : '#ef4444' }}>
          {a.score}
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { active, activeId } = useActiveClient();
  const assessments = useLiveQuery(
    () =>
      activeId == null
        ? []
        : db.assessments.where('clientId').equals(activeId).reverse().sortBy('createdAt'),
    [activeId],
    [],
  );

  const latest = assessments?.[0];
  const avg =
    assessments && assessments.length
      ? Math.round(assessments.reduce((s, a) => s + a.score, 0) / assessments.length)
      : 0;
  const best = assessments && assessments.length ? Math.max(...assessments.map((a) => a.score)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Hi{active ? `, ${active.name}` : ''} 👋</h1>
          <p className="text-sm text-slate-500">
            Your posture at a glance. Everything stays private on this device.
          </p>
        </div>
        <Link to="/analyze" className="btn-primary">
          ＋ New analysis
        </Link>
      </div>

      {!assessments?.length ? (
        <div className="card grid place-items-center gap-4 p-12 text-center">
          <div className="text-5xl">📷</div>
          <p className="max-w-sm text-slate-500">
            No assessments yet. Upload a side, front, or back photo and PostureLab
            will draw your posture lines and score your alignment.
          </p>
          <Link to="/analyze" className="btn-primary">
            Start your first analysis
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card flex items-center gap-4 p-5">
              <ScoreRing score={latest?.score ?? 0} size={96} label="Latest" />
              <div className="text-sm text-slate-500">
                {latest && new Date(latest.createdAt).toLocaleDateString()} ·{' '}
                {latest && VIEW_LABEL[latest.view]} view
              </div>
            </div>
            <div className="card flex flex-col justify-center p-5">
              <div className="text-3xl font-bold">{avg}</div>
              <div className="text-sm text-slate-500">Average score</div>
            </div>
            <div className="card flex flex-col justify-center p-5">
              <div className="text-3xl font-bold">{best}</div>
              <div className="text-sm text-slate-500">
                Best score · {assessments.length} total
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent</h2>
              <Link to="/history" className="text-sm text-brand-600 hover:underline">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {assessments.slice(0, 4).map((a) => (
                <RecentCard key={a.id} a={a} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
