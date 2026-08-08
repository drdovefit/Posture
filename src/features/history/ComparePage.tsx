import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { useActiveClient } from '../../state/useClient';
import { useBlobUrl } from '../../state/useBlobUrl';
import type { Assessment } from '../../lib/types';

const VIEW_LABEL: Record<string, string> = {
  anterior: 'Front',
  lateral: 'Side',
  posterior: 'Back',
};

function optionLabel(a: Assessment) {
  return `${VIEW_LABEL[a.view]} · ${new Date(a.createdAt).toLocaleDateString()} · ${a.score}`;
}

function Panel({ a }: { a: Assessment | undefined }) {
  const url = useBlobUrl(a?.annotated ?? a?.photo);
  if (!a) return <div className="card grid aspect-[3/4] place-items-center text-slate-400">—</div>;
  return (
    <div className="card overflow-hidden">
      <div className="aspect-[3/4] bg-black">
        {url && <img src={url} alt="" className="h-full w-full object-contain" />}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold">{VIEW_LABEL[a.view]} view</span>
          <span
            className="text-xl font-bold"
            style={{ color: a.score >= 85 ? '#10b981' : a.score >= 65 ? '#f59e0b' : '#ef4444' }}
          >
            {a.score}
          </span>
        </div>
        <div className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleString()}</div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  const { activeId } = useActiveClient();
  const assessments = useLiveQuery(
    () =>
      activeId == null
        ? []
        : db.assessments.where('clientId').equals(activeId).reverse().sortBy('createdAt'),
    [activeId],
    [],
  );

  const [leftId, setLeftId] = useState<number | null>(null);
  const [rightId, setRightId] = useState<number | null>(null);

  const left = assessments?.find((a) => a.id === leftId) ?? assessments?.[assessments.length - 1];
  const right = assessments?.find((a) => a.id === rightId) ?? assessments?.[0];

  const delta = useMemo(() => {
    if (!left || !right) return null;
    return right.score - left.score;
  }, [left, right]);

  if (!assessments?.length) {
    return <div className="card p-10 text-center text-slate-500">No assessments to compare yet.</div>;
  }
  if (assessments.length < 2) {
    return (
      <div className="card p-10 text-center text-slate-500">
        Save at least two assessments to compare before/after.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Compare</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Before</label>
          <select
            className="input"
            value={left?.id ?? ''}
            onChange={(e) => setLeftId(Number(e.target.value))}
          >
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>
                {optionLabel(a)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">After</label>
          <select
            className="input"
            value={right?.id ?? ''}
            onChange={(e) => setRightId(Number(e.target.value))}
          >
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>
                {optionLabel(a)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {delta !== null && (
        <div className="card flex items-center justify-center gap-3 p-4 text-center">
          <span className="text-slate-500">Change in score:</span>
          <span
            className={`text-2xl font-bold ${
              delta > 0 ? 'text-emerald-500' : delta < 0 ? 'text-red-500' : 'text-slate-500'
            }`}
          >
            {delta > 0 ? '+' : ''}
            {delta}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Panel a={left} />
        <Panel a={right} />
      </div>
    </div>
  );
}
