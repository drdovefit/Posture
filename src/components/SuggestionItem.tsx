import { getProfile } from '../lib/profile';
import { screenExercise } from '../lib/exercises/contraindications';
import type { Suggestion } from '../lib/measure/suggestions';

/**
 * One "what to work on" card, safety-gated to the user's profile:
 *  - ok: shown normally
 *  - modify: shown with an amber caution note
 *  - hide: the exercise is withheld and replaced with a caution + alternative
 */
export default function SuggestionItem({ s }: { s: Suggestion }) {
  const gate = screenExercise(s.id, s.title, getProfile());

  if (gate.status === 'hide') {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-800/60 dark:bg-amber-900/15">
        <div className="mb-1 flex items-center gap-2">
          <span className="chip bg-amber-200 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
            Hidden for your safety
          </span>
          <span className="text-sm font-medium text-slate-500 line-through">{s.title}</span>
        </div>
        <p className="text-sm text-amber-800 dark:text-amber-200">{gate.message}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <div className="mb-1 flex items-center gap-2">
        <span className="chip bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
          {s.category}
        </span>
        <span className="text-sm font-medium">{s.title}</span>
      </div>
      <p className="text-sm text-slate-500">{s.detail}</p>
      {gate.status === 'modify' && (
        <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-900/15 dark:text-amber-200">
          ⚠ {gate.message}
        </p>
      )}
    </div>
  );
}
