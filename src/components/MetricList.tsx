import type { Metric } from '../lib/types';

const sevChip: Record<string, string> = {
  good: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  mild: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  moderate: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
};
const sevLabel: Record<string, string> = { good: 'Good', mild: 'Mild', moderate: 'Moderate' };

export default function MetricList({ metrics }: { metrics: Metric[] }) {
  if (!metrics.length)
    return <p className="text-sm text-slate-500">No measurements yet.</p>;
  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {metrics.map((m) => (
        <li key={m.id} className="py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">{m.label}</span>
            <div className="flex items-center gap-2">
              <span className="tabular-nums text-sm text-slate-500">{m.display}</span>
              <span className={`chip ${sevChip[m.severity]}`}>{sevLabel[m.severity]}</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-slate-500">{m.explanation}</p>
          <p className="mt-0.5 text-xs text-slate-400">Normal: {m.normal}</p>
        </li>
      ))}
    </ul>
  );
}
