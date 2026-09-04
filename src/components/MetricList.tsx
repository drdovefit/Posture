import { Link } from 'react-router-dom';
import type { Metric } from '../lib/types';
import { metricPhrase } from '../lib/measure/feedback';
import { useTier } from '../lib/entitlement';

const sevChip: Record<string, string> = {
  good: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  mild: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  moderate: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
};
const sevLabel: Record<string, string> = { good: 'Good', mild: 'Mild', moderate: 'Moderate' };
const sevOrder: Record<string, number> = { good: 0, mild: 1, moderate: 2 };

/** How many measurements a free user sees clearly before the rest blur. */
const FREE_VISIBLE = 2;

function Row({ m }: { m: Metric }) {
  return (
    <li className="py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{m.label}</span>
        <div className="flex items-center gap-2">
          <span className="tabular-nums text-sm text-slate-500">{m.display}</span>
          <span className={`chip ${sevChip[m.severity]}`}>{sevLabel[m.severity]}</span>
        </div>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        <span className="font-medium text-slate-600 dark:text-slate-300">{metricPhrase(m)}</span>{' '}
        {m.explanation}
      </p>
      <p className="mt-0.5 text-xs text-slate-400">Average: {m.normal}</p>
    </li>
  );
}

export default function MetricList({ metrics }: { metrics: Metric[] }) {
  const { isPro } = useTier();
  if (!metrics.length)
    return <p className="text-sm text-slate-500">No measurements yet.</p>;

  if (isPro) {
    return (
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {metrics.map((m) => (
          <Row key={m.id} m={m} />
        ))}
      </ul>
    );
  }

  // Free: show the two mildest clearly, blur the rest (the real problems) behind
  // an unlock prompt so they can't just read the issue and Google it.
  const ordered = [...metrics].sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);
  const shown = ordered.slice(0, FREE_VISIBLE);
  const locked = ordered.slice(FREE_VISIBLE);

  return (
    <div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {shown.map((m) => (
          <Row key={m.id} m={m} />
        ))}
      </ul>

      {locked.length > 0 && (
        <div className="relative mt-1 overflow-hidden rounded-xl">
          <ul
            aria-hidden
            className="pointer-events-none select-none divide-y divide-slate-100 blur-[6px] dark:divide-slate-800"
          >
            {locked.map((m) => (
              <Row key={m.id} m={m} />
            ))}
          </ul>
          <div className="absolute inset-0 grid place-items-center bg-white/55 p-4 dark:bg-slate-900/60">
            <div className="w-full max-w-xs rounded-2xl border border-brand-200 bg-white p-4 text-center shadow-lg dark:border-brand-900/50 dark:bg-slate-900">
              <div className="text-2xl">🔒</div>
              <p className="mt-1 font-semibold">
                {locked.length} more area{locked.length === 1 ? '' : 's'} to work on
              </p>
              <p className="mt-1 text-xs text-slate-500">
                See every problem and exactly how to fix it with Premium.
              </p>
              <Link to="/subscribe" className="btn-primary mt-3 inline-block w-full">
                Subscribe to unlock
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
