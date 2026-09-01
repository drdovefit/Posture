import { useEffect, useState } from 'react';
import { loadMyResolved, dismissResolved, type FeedbackItem } from '../lib/feedback';
import { useAuth } from '../state/auth';

/**
 * Top-of-screen thank-you banner shown to a submitter once the owner checks off
 * their bug or feature. One card per resolved item; the X dismisses it for good.
 */
export default function FeedbackBanner() {
  const { user, ready } = useAuth();
  const [items, setItems] = useState<FeedbackItem[]>([]);

  useEffect(() => {
    let alive = true;
    const uid = user?.uid;
    if (!ready || !uid) {
      setItems([]);
      return;
    }
    (async () => {
      try {
        const mine = await loadMyResolved(uid);
        if (alive) setItems(mine);
      } catch {
        /* offline or blocked — just show nothing */
      }
    })();
    return () => {
      alive = false;
    };
  }, [ready, user]);

  async function dismiss(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id)); // optimistic
    try {
      await dismissResolved(id);
    } catch {
      /* it will simply reappear on next load if this failed */
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-2 px-4 pt-3">
      {items.map((it) => (
        <div
          key={it.id}
          className="mx-auto flex max-w-6xl items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-3 text-brand-800 shadow-sm dark:border-brand-800/60 dark:bg-brand-900/30 dark:text-brand-100"
        >
          <span className="mt-0.5 text-lg" aria-hidden>
            {it.type === 'bug' ? '🛠️' : '✨'}
          </span>
          <p className="flex-1 text-sm font-medium">
            {it.resolvedMessage ??
              (it.type === 'bug'
                ? 'The bug you reported has been fixed. Thank you.'
                : 'The feature you suggested is in the app now. Thank you.')}
          </p>
          <button
            onClick={() => dismiss(it.id)}
            aria-label="Dismiss"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-brand-500 hover:bg-brand-100 dark:hover:bg-brand-800/50"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
