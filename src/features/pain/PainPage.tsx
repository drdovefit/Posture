import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { addPain, db, deletePain } from '../../lib/db';
import { useActiveClient } from '../../state/useClient';

const REGIONS = [
  'Neck',
  'Upper back',
  'Lower back',
  'Left shoulder',
  'Right shoulder',
  'Hip',
  'Knee',
  'Other',
];

function sevColor(v: number) {
  if (v <= 3) return 'text-emerald-500';
  if (v <= 6) return 'text-amber-500';
  return 'text-red-500';
}

export default function PainPage() {
  const { activeId } = useActiveClient();
  const entries = useLiveQuery(
    () =>
      activeId == null
        ? []
        : db.pain.where('clientId').equals(activeId).reverse().sortBy('createdAt'),
    [activeId],
    [],
  );

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [region, setRegion] = useState(REGIONS[0]);
  const [severity, setSeverity] = useState(3);
  const [notes, setNotes] = useState('');

  async function add() {
    if (activeId == null) return;
    await addPain({
      clientId: activeId,
      createdAt: Date.now(),
      date,
      region,
      severity,
      notes: notes.trim() || undefined,
    });
    setNotes('');
    setSeverity(3);
  }

  const chartData = [...(entries ?? [])]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({ date: e.date.slice(5), severity: e.severity }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Pain diary</h1>
        <p className="text-sm text-slate-500">
          Log discomfort over time and watch it alongside your posture progress.
        </p>
      </div>

      <div className="card space-y-3 p-4">
        <div className="grid gap-3">
          <label className="block min-w-0 text-sm">
            <span className="mb-1 block text-slate-500">Date</span>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="block min-w-0 text-sm">
            <span className="mb-1 block text-slate-500">Region</span>
            <select className="input" value={region} onChange={(e) => setRegion(e.target.value)}>
              {REGIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1 flex justify-between text-slate-500">
            <span>Severity</span>
            <span className={`font-bold ${sevColor(severity)}`}>{severity}/10</span>
          </span>
          <input
            type="range"
            min={0}
            max={10}
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            className="w-full accent-brand-500"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-500">Notes (optional)</span>
          <input
            className="input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. worse after sitting all day"
          />
        </label>
        <button className="btn-primary w-full" onClick={add} disabled={activeId == null}>
          Add entry
        </button>
      </div>

      {chartData.length > 1 && (
        <div className="card p-4">
          <h2 className="mb-2 font-semibold">Pain trend</h2>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="pain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} className="fill-slate-500" />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} className="fill-slate-500" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="severity" stroke="#ef4444" strokeWidth={2} fill="url(#pain)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {!entries?.length ? (
          <div className="card p-8 text-center text-slate-500">No entries yet.</div>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="card flex items-center gap-3 p-3">
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 font-bold dark:bg-slate-800 ${sevColor(e.severity)}`}>
                {e.severity}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{e.region}</span>
                  <span className="text-xs text-slate-500">{e.date}</span>
                </div>
                {e.notes && <p className="truncate text-sm text-slate-500">{e.notes}</p>}
              </div>
              <button
                className="btn-ghost !py-1 text-xs !text-red-600"
                onClick={() => e.id && deletePain(e.id)}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
