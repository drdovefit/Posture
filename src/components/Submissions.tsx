import { useEffect, useState } from 'react';
import {
  loadFeedback,
  setHeld,
  markDone,
  removeFeedback,
  removeAllFeedback,
  type FeedbackItem,
  type FeedbackType,
} from '../lib/feedback';

const fmt = (t?: number) =>
  t ? new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

function TypeChip({ type }: { type: FeedbackType }) {
  return (
    <span
      className={`chip ${
        type === 'bug'
          ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200'
          : 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200'
      }`}
    >
      {type === 'bug' ? 'Bug' : 'Feature'}
    </span>
  );
}

export default function Submissions() {
  const [items, setItems] = useState<FeedbackItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'active' | 'history'>('active');
  const [filter, setFilter] = useState<'all' | FeedbackType>('all');
  const [confirmAll, setConfirmAll] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setItems(await loadFeedback());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, []);

  async function act(id: string, fn: () => Promise<void>) {
    setBusyId(id);
    try {
      await fn();
      await refresh();
    } catch {
      /* ignore, list stays */
    } finally {
      setBusyId(null);
    }
  }

  const all = items ?? [];
  const active = all
    .filter((it) => it.status !== 'done')
    .sort((a, b) => {
      const ah = a.status === 'held' ? 1 : 0;
      const bh = b.status === 'held' ? 1 : 0;
      if (ah !== bh) return bh - ah; // held first
      return b.createdAt - a.createdAt;
    });
  const done = all
    .filter((it) => it.status === 'done' && (filter === 'all' || it.type === filter))
    .sort((a, b) => (b.resolvedAt ?? 0) - (a.resolvedAt ?? 0));

  return (
    <div className="card space-y-3 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Submissions</h2>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={refresh} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            view === 'active' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}
          onClick={() => setView('active')}
        >
          To do
        </button>
        <button
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            view === 'history' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}
          onClick={() => setView('history')}
        >
          History
        </button>
      </div>

      {view === 'active' && (
        <>
          {active.length === 0 && <p className="text-sm text-slate-500">Nothing to do. Nice.</p>}
          <ul className="space-y-2">
            {active.map((it) => (
              <li
                key={it.id}
                className={`rounded-xl border p-3 ${
                  it.status === 'held'
                    ? 'border-amber-300 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-900/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                  <TypeChip type={it.type} />
                  {it.status === 'held' && <span className="font-semibold text-amber-600">Held</span>}
                  <span>{fmt(it.createdAt)}</span>
                  {it.email && <span className="truncate">· {it.email}</span>}
                  {it.appVersion && <span>· v{it.appVersion}</span>}
                </div>
                <p className="whitespace-pre-wrap text-sm">{it.text}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white disabled:opacity-50"
                    title="Mark done"
                    disabled={busyId === it.id}
                    onClick={() => act(it.id, () => markDone(it.id, it.type))}
                  >
                    ✓
                  </button>
                  <button
                    className={`grid h-8 w-8 place-items-center rounded-full text-white disabled:opacity-50 ${
                      it.status === 'held' ? 'bg-amber-600' : 'bg-amber-400'
                    }`}
                    title={it.status === 'held' ? 'Unpin' : 'Hold at top'}
                    disabled={busyId === it.id}
                    onClick={() => act(it.id, () => setHeld(it.id, it.status !== 'held'))}
                  >
                    ★
                  </button>
                  <button
                    className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-slate-600 disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200"
                    title="Remove"
                    disabled={busyId === it.id}
                    onClick={() => act(it.id, () => removeFeedback(it.id))}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {all.length > 0 && (
            <div className="pt-1">
              {confirmAll ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Remove every submission?</span>
                  <button className="btn-ghost" onClick={() => setConfirmAll(false)}>Cancel</button>
                  <button
                    className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-semibold text-white"
                    onClick={() => act('*', removeAllFeedback).then(() => setConfirmAll(false))}
                  >
                    Remove all
                  </button>
                </div>
              ) : (
                <button
                  className="text-sm font-medium text-red-600 hover:underline"
                  onClick={() => setConfirmAll(true)}
                >
                  Remove all
                </button>
              )}
            </div>
          )}
        </>
      )}

      {view === 'history' && (
        <>
          <div className="flex gap-2">
            {(['all', 'bug', 'feature'] as const).map((f) => (
              <button
                key={f}
                className={`rounded-lg px-3 py-1 text-sm font-medium ${
                  filter === f ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f === 'bug' ? 'Bugs' : 'Features'}
              </button>
            ))}
          </div>
          {done.length === 0 && <p className="text-sm text-slate-500">Nothing checked off yet.</p>}
          <ul className="space-y-2">
            {done.map((it) => (
              <li key={it.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                  <TypeChip type={it.type} />
                  <span className="text-emerald-600">Done {fmt(it.resolvedAt)}</span>
                  {it.email && <span className="truncate">· {it.email}</span>}
                </div>
                <p className="whitespace-pre-wrap text-sm">{it.text}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
