import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { useActiveClient } from '../../state/useClient';
import { useAuth } from '../../state/auth';
import { pickGreeting } from '../../lib/greetings';
import ScoreRing from '../../components/ScoreRing';
import { useCroppedPortrait } from '../../state/useCroppedPortrait';
import { analyze } from '../../lib/measure';
import { getSuggestions } from '../../lib/measure/suggestions';
import type { Assessment } from '../../lib/types';

const VIEW_LABEL: Record<string, string> = {
  anterior: 'Front',
  lateral: 'Side',
  posterior: 'Back',
};

function RecentCard({ a }: { a: Assessment }) {
  const url = useCroppedPortrait(a);
  return (
    <Link to="/history" className="card overflow-hidden transition-transform hover:-translate-y-0.5">
      <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-800">
        {url && <img src={url} alt="" className="h-full w-full object-cover" />}
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
  const { activeId } = useActiveClient();
  const { user } = useAuth();
  const firstName = user?.displayName?.trim().split(/\s+/)[0];
  const greeting = useMemo(() => pickGreeting(firstName), [firstName]);
  const assessments = useLiveQuery(
    () =>
      activeId == null
        ? []
        : db.assessments.where('clientId').equals(activeId).reverse().sortBy('createdAt'),
    [activeId],
    [],
  );

  const latest = assessments?.[0];
  const focus = latest ? getSuggestions(analyze(latest.view, latest.landmarks).suggestionIds) : [];
  const avg =
    assessments && assessments.length
      ? Math.round(assessments.reduce((s, a) => s + a.score, 0) / assessments.length)
      : 0;
  const best = assessments && assessments.length ? Math.max(...assessments.map((a) => a.score)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{firstName ? `Hi ${firstName}` : 'Hey there'}</h1>
          <p className="text-sm text-slate-500">{greeting}</p>
        </div>
        <Link to="/analyze" className="btn-primary">
          ＋ New analysis
        </Link>
      </div>

      {!assessments?.length ? (
        <div className="card overflow-hidden">
          <div className="grid items-center gap-6 p-8 md:grid-cols-2 md:p-10">
            <div className="space-y-4">
              <h2 className="text-xl font-bold">See your posture, clearly.</h2>
              <p className="text-slate-500">
                Upload a side, front, or back photo and PostureLab auto-detects
                your joints, draws your plumb line, and scores your alignment —
                privately, on your device.
              </p>
              <Link to="/analyze" className="btn-primary">
                Start your first analysis
              </Link>
            </div>
            <img
              src={`${import.meta.env.BASE_URL}brand/results.jpg`}
              alt="Posture score and measurements"
              className="w-full rounded-xl object-contain"
              loading="lazy"
            />
          </div>
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

          {focus.length > 0 && (
            <div className="card p-5">
              <h2 className="mb-3 text-lg font-semibold">What to work on</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {focus.slice(0, 3).map((s) => (
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
              <p className="mt-2 text-xs text-slate-400">
                From your latest scan · educational only, not a treatment plan.
              </p>
            </div>
          )}

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
