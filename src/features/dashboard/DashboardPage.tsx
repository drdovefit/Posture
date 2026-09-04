import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { useActiveClient } from '../../state/useClient';
import { useAuth } from '../../state/auth';
import ScoreRing from '../../components/ScoreRing';
import SuggestionItem from '../../components/SuggestionItem';
import ProLock from '../../components/ProLock';
import { useTier } from '../../lib/entitlement';
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
  const { isPro } = useTier();
  const firstName = user?.displayName?.trim().split(/\s+/)[0];
  const [showGuideTip, setShowGuideTip] = useState(() => {
    try {
      return !localStorage.getItem('posturelab-guide-seen');
    } catch {
      return false;
    }
  });
  function dismissGuideTip() {
    try {
      localStorage.setItem('posturelab-guide-seen', '1');
    } catch {
      /* storage may be unavailable */
    }
    setShowGuideTip(false);
  }
  const assessments = useLiveQuery(
    () =>
      activeId == null
        ? []
        : db.assessments.where('clientId').equals(activeId).reverse().sortBy('createdAt'),
    [activeId],
    [],
  );

  // Once someone has a scan they're no longer new: hide the tip and mark it
  // seen so it never returns, even if they later delete every scan.
  useEffect(() => {
    if (assessments.length > 0) {
      try {
        localStorage.setItem('posturelab-guide-seen', '1');
      } catch {
        /* ignore */
      }
      setShowGuideTip(false);
    }
  }, [assessments.length]);

  const latest = assessments?.[0];
  const focus = latest ? getSuggestions(analyze(latest.view, latest.landmarks).suggestionIds) : [];
  const avg =
    assessments && assessments.length
      ? Math.round(assessments.reduce((s, a) => s + a.score, 0) / assessments.length)
      : 0;
  const best = assessments && assessments.length ? Math.max(...assessments.map((a) => a.score)) : 0;
  const bestA =
    assessments && assessments.length
      ? assessments.reduce((m, a) => (a.score > m.score ? a : m), assessments[0])
      : undefined;
  const fmtDate = (t: number) =>
    new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6">
      {showGuideTip && !assessments.length && (
        <div className="card flex items-center gap-3 border-brand-200 bg-brand-50 p-4 dark:border-brand-900/40 dark:bg-brand-900/20">
          <div className="flex-1 text-sm">
            <span className="font-semibold">New here?</span> Take a look at the guide for the best results.
          </div>
          <Link to="/guide" onClick={dismissGuideTip} className="btn-primary whitespace-nowrap">
            See the guide
          </Link>
          <button
            onClick={dismissGuideTip}
            aria-label="Dismiss"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>{firstName && <h1 className="text-2xl font-bold">Hi {firstName}</h1>}</div>
        {assessments.length > 0 && (
          <Link to="/analyze" className="btn-primary">
            ＋ New analysis
          </Link>
        )}
      </div>

      {!assessments?.length ? (
        <div className="card overflow-hidden">
          <div className="grid items-center gap-6 p-8 md:grid-cols-2 md:p-10">
            <div className="space-y-4">
              <h2 className="text-xl font-bold">See your posture, clearly.</h2>
              <p className="text-slate-500">
                Add a side or front photo. PostureLab finds your joints, maps
                your posture, and gives you a score.
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
              <ScoreRing score={latest?.score ?? 0} size={76} label="" />
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold">Latest</span>
                  {latest && (
                    <span className="text-sm text-slate-500">{VIEW_LABEL[latest.view]} view</span>
                  )}
                </div>
                {latest && (
                  <div className="text-sm text-slate-500">{fmtDate(latest.createdAt)}</div>
                )}
              </div>
            </div>
            <div className="card flex flex-col justify-center p-5">
              <div className="text-3xl font-bold">{avg}</div>
              <div className="text-sm text-slate-500">
                Average score · {assessments.length} total
              </div>
            </div>
            <div className="card flex flex-col justify-center p-5">
              <div className="text-3xl font-bold">{best}</div>
              <div className="text-sm text-slate-500">
                Best score{bestA && ` · ${fmtDate(bestA.createdAt)}`}
              </div>
            </div>
          </div>

          {focus.length > 0 && (
            <div className="card p-5">
              <h2 className="mb-3 text-lg font-semibold">What to work on</h2>
              {isPro ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {focus.slice(0, 3).map((s) => (
                      <SuggestionItem key={s.id} s={s} />
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-slate-400">From your latest scan.</p>
                </>
              ) : (
                <ProLock
                  title="Your personalized fixes are Pro"
                  blurb="See exactly what to work on and how to fix each area from your latest scan."
                />
              )}
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
