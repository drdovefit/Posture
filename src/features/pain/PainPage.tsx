import { useRef, useState } from 'react';
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

const NOTES_MAX = 399;

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

/** yyyy-mm-dd → "Friday, August 14, 2026". */
function niceDate(d: string) {
  const dt = new Date(`${d}T00:00:00`);
  return isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
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
  const [customRegion, setCustomRegion] = useState('');
  const [severity, setSeverity] = useState(3);
  const [notes, setNotes] = useState('');

  // Free-moving slider that snaps to the nearest whole number on release.
  const [dragging, setDragging] = useState(false);
  const [sliderPos, setSliderPos] = useState(3);
  const posRef = useRef(3);

  // Notes textarea grows with content up to ~3 lines, then scrolls.
  const notesRef = useRef<HTMLTextAreaElement>(null);
  function growNotes() {
    const el = notesRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }
  const sliderVal = dragging ? sliderPos : severity;
  function commitSeverity() {
    const v = Math.round(posRef.current);
    setSeverity(v);
    setSliderPos(v);
    setDragging(false);
  }

  // Selection mode for bulk-deleting entries.
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  function toggleSelected(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function deleteSelected() {
    if (!selected.size) return;
    await db.pain.bulkDelete([...selected]);
    setSelected(new Set());
    setSelecting(false);
  }

  async function deleteAll() {
    const ids = (entries ?? []).map((e) => e.id!).filter(Boolean);
    if (!ids.length) return;
    if (!confirm(`Delete all ${ids.length} entries? This cannot be undone.`)) return;
    await db.pain.bulkDelete(ids);
    setSelected(new Set());
    setSelecting(false);
  }

  async function add() {
    if (activeId == null) return;
    const finalRegion =
      region === 'Other' ? customRegion.trim() || 'Other' : region;
    await addPain({
      clientId: activeId,
      createdAt: Date.now(),
      date,
      region: finalRegion,
      severity,
      notes: notes.trim() || undefined,
    });
    setNotes('');
    setSeverity(3);
    setSliderPos(3);
    posRef.current = 3;
    setDragging(false);
    setCustomRegion('');
    requestAnimationFrame(growNotes);
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
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block min-w-0 overflow-hidden text-sm">
            <span className="mb-1 block text-slate-500">Date</span>
            <input
              type="date"
              className="input min-w-0 max-w-full"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <span className="mt-1 block text-xs font-medium text-slate-600">{niceDate(date)}</span>
          </label>
          <label className="block min-w-0 text-sm">
            <span className="mb-1 block text-slate-500">Region</span>
            <select
              className="input min-w-0"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              {REGIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
        </div>
        {region === 'Other' && (
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500">Which area?</span>
            <input
              className="input"
              value={customRegion}
              onChange={(e) => setCustomRegion(e.target.value)}
              placeholder="Type the body area"
            />
          </label>
        )}
        <label className="block text-sm">
          <span className="mb-1 flex justify-between text-slate-500">
            <span>Severity</span>
            <span className={`font-bold ${sevColor(Math.round(sliderVal))}`}>
              {Math.round(sliderVal)}/10
            </span>
          </span>
          <input
            type="range"
            min={0}
            max={10}
            step="any"
            value={sliderVal}
            onChange={(e) => {
              const v = Number(e.target.value);
              posRef.current = v;
              setSliderPos(v);
              setDragging(true);
            }}
            onPointerUp={commitSeverity}
            onPointerCancel={commitSeverity}
            onTouchEnd={commitSeverity}
            onKeyUp={commitSeverity}
            onBlur={commitSeverity}
            className="range"
            style={{
              background: `linear-gradient(to right, #0ea5e9 ${(sliderVal / 10) * 100}%, #e2e8f0 ${
                (sliderVal / 10) * 100
              }%)`,
            }}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 flex items-center justify-between text-slate-500">
            <span>Notes (optional)</span>
            <span className="text-xs text-slate-400">{notes.length}/{NOTES_MAX}</span>
          </span>
          <textarea
            ref={notesRef}
            rows={1}
            maxLength={NOTES_MAX}
            className="input max-h-24 resize-none overflow-auto"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              growNotes();
            }}
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
          <>
            {/* Entries toolbar: enter select mode to bulk-delete. */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <span className="text-sm font-semibold text-slate-500">
                {selecting
                  ? `${selected.size} selected`
                  : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`}
              </span>
              {selecting ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn-ghost !py-1 text-xs"
                    onClick={() =>
                      setSelected(
                        selected.size === entries.length
                          ? new Set()
                          : new Set(entries.map((e) => e.id!)),
                      )
                    }
                  >
                    {selected.size === entries.length ? 'Clear all' : 'Select all'}
                  </button>
                  <button
                    className="btn-ghost !py-1 text-xs !text-red-600 disabled:opacity-40"
                    onClick={deleteSelected}
                    disabled={!selected.size}
                  >
                    Delete selected
                  </button>
                  <button
                    className="btn-ghost !py-1 text-xs !text-red-600"
                    onClick={deleteAll}
                  >
                    Delete all
                  </button>
                  <button
                    className="btn-ghost !py-1 text-xs"
                    onClick={() => {
                      setSelecting(false);
                      setSelected(new Set());
                    }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <button className="btn-ghost !py-1 text-xs" onClick={() => setSelecting(true)}>
                  Select
                </button>
              )}
            </div>

            {entries.map((e) => (
              <div
                key={e.id}
                className={`card flex items-center gap-3 p-3 ${
                  selecting ? 'cursor-pointer' : ''
                } ${e.id && selected.has(e.id) ? 'ring-2 ring-brand-500' : ''}`}
                onClick={() => selecting && e.id && toggleSelected(e.id)}
              >
                {selecting && (
                  <input
                    type="checkbox"
                    className="h-5 w-5 shrink-0 accent-brand-500"
                    checked={!!e.id && selected.has(e.id)}
                    onChange={() => e.id && toggleSelected(e.id)}
                    onClick={(ev) => ev.stopPropagation()}
                  />
                )}
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 font-bold dark:bg-slate-800 ${sevColor(e.severity)}`}>
                  {e.severity}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{e.region}</span>
                    <span className="text-xs text-slate-500">{niceDate(e.date)}</span>
                  </div>
                  {e.notes && (
                  <p className="line-clamp-3 text-sm text-slate-500">{e.notes}</p>
                )}
                </div>
                {!selecting && (
                  <button
                    className="btn-ghost !py-1 text-xs !text-red-600"
                    onClick={() => e.id && deletePain(e.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
