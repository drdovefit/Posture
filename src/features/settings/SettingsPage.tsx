import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../state/auth';
import {
  submitFeedback,
  loadFeedback,
  OWNER_EMAIL,
  type FeedbackType,
  type FeedbackItem,
} from '../../lib/feedback';
import {
  getProfile,
  setProfile,
  type Condition,
  type Injury,
  type Sex,
  type Pregnancy,
  type Fitness,
} from '../../lib/profile';

const CONDITIONS: { id: Condition; label: string }[] = [
  { id: 'scoliosis', label: 'Scoliosis' },
  { id: 'kyphosis', label: 'Kyphosis (rounded upper back)' },
  { id: 'hypermobility', label: 'Hypermobility (very flexible)' },
  { id: 'arthritis', label: 'Arthritis' },
  { id: 'spineSurgery', label: 'Past spine surgery' },
];

const INJURIES: { id: Injury; label: string }[] = [
  { id: 'legLength', label: 'Leg-length difference' },
  { id: 'hipReplacement', label: 'Hip replacement' },
  { id: 'kneeReplacement', label: 'Knee replacement' },
  { id: 'ankleFoot', label: 'Old ankle or foot injury' },
  { id: 'shoulder', label: 'Shoulder injury' },
];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
        active
          ? 'bg-brand-500 text-white'
          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
      }`}
    >
      {children}
    </button>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const isOwner = user?.email === OWNER_EMAIL;

  // --- Profile ---------------------------------------------------------------
  const p0 = getProfile();
  const [sex, setSex] = useState<Sex>(p0.sex ?? 'unspecified');
  const [age, setAge] = useState(p0.age != null ? String(p0.age) : '');
  const [ft, setFt] = useState(
    p0.heightCm ? String(Math.floor(p0.heightCm / 2.54 / 12)) : '',
  );
  const [inch, setInch] = useState(
    p0.heightCm ? String(Math.round((p0.heightCm / 2.54) % 12)) : '',
  );
  const [lb, setLb] = useState(p0.weightKg ? String(Math.round(p0.weightKg / 0.45359237)) : '');
  const [pregnancy, setPregnancy] = useState<Pregnancy>(p0.pregnancy ?? 'none');
  const [conditions, setConditions] = useState<Condition[]>(p0.conditions ?? []);
  const [injuries, setInjuries] = useState<Injury[]>(p0.injuries ?? []);
  const [fitness, setFitness] = useState<Fitness>(p0.fitness ?? 'unspecified');
  const [savedMsg, setSavedMsg] = useState('');

  const toggle = <T,>(list: T[], v: T): T[] =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  function saveProfile() {
    const heightCm =
      ft || inch ? Math.round(((Number(ft) || 0) * 12 + (Number(inch) || 0)) * 2.54) : undefined;
    const weightKg = lb ? Math.round(Number(lb) * 0.45359237) : undefined;
    setProfile({
      sex,
      age: age ? Number(age) : undefined,
      heightCm,
      weightKg,
      pregnancy,
      conditions,
      injuries,
      fitness,
    });
    setSavedMsg('Saved. Your next scans use this.');
    setTimeout(() => setSavedMsg(''), 3000);
  }

  // --- Feedback --------------------------------------------------------------
  const [type, setType] = useState<FeedbackType>('bug');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [statusOk, setStatusOk] = useState(false);

  async function send() {
    if (!text.trim()) return;
    setBusy(true);
    setStatus('');
    try {
      await submitFeedback(type, text.trim());
      setStatusOk(true);
      setStatus('Thanks. Your note was sent.');
      setText('');
    } catch {
      setStatusOk(false);
      setStatus('Could not send right now. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const [items, setItems] = useState<FeedbackItem[] | null>(null);
  const [loadingItems, setLoadingItems] = useState(false);
  async function view() {
    setLoadingItems(true);
    try {
      setItems(await loadFeedback());
    } catch {
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }
  const fmt = (t: number) =>
    new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="card p-5">
        <h2 className="mb-1 font-semibold">Account</h2>
        <p className="text-sm text-slate-500">
          {user ? `Signed in as ${user.email}` : 'You are not signed in.'}
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Manage sign-in and sync from the account button in the top bar.
        </p>
      </div>

      {/* Profile ------------------------------------------------------------ */}
      <div className="card space-y-4 p-5">
        <div>
          <h2 className="font-semibold">Your profile</h2>
          <p className="text-sm text-slate-500">
            This tailors your posture ranges to your body. It stays on your device.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Sex</label>
          <div className="flex flex-wrap gap-2">
            <Chip active={sex === 'female'} onClick={() => setSex('female')}>Female</Chip>
            <Chip active={sex === 'male'} onClick={() => setSex('male')}>Male</Chip>
            <Chip active={sex === 'unspecified'} onClick={() => setSex('unspecified')}>
              Prefer not to say
            </Chip>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Age</label>
            <input className="input" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="years" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Height (ft)</label>
            <input className="input" inputMode="numeric" value={ft} onChange={(e) => setFt(e.target.value)} placeholder="ft" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Height (in)</label>
            <input className="input" inputMode="numeric" value={inch} onChange={(e) => setInch(e.target.value)} placeholder="in" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Weight (lb)</label>
            <input className="input" inputMode="numeric" value={lb} onChange={(e) => setLb(e.target.value)} placeholder="lb" />
          </div>
        </div>

        {sex === 'female' && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Pregnancy</label>
            <div className="flex flex-wrap gap-2">
              <Chip active={pregnancy === 'none'} onClick={() => setPregnancy('none')}>No</Chip>
              <Chip active={pregnancy === 'pregnant'} onClick={() => setPregnancy('pregnant')}>Pregnant</Chip>
              <Chip active={pregnancy === 'postpartum'} onClick={() => setPregnancy('postpartum')}>Recently postpartum</Chip>
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Conditions (pick any that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => (
              <Chip
                key={c.id}
                active={conditions.includes(c.id)}
                onClick={() => setConditions((l) => toggle(l, c.id))}
              >
                {c.label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Injuries or surgeries (pick any that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {INJURIES.map((c) => (
              <Chip
                key={c.id}
                active={injuries.includes(c.id)}
                onClick={() => setInjuries((l) => toggle(l, c.id))}
              >
                {c.label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Activity level</label>
          <div className="flex flex-wrap gap-2">
            <Chip active={fitness === 'sedentary'} onClick={() => setFitness('sedentary')}>Sedentary</Chip>
            <Chip active={fitness === 'active'} onClick={() => setFitness('active')}>Active</Chip>
            <Chip active={fitness === 'very_active'} onClick={() => setFitness('very_active')}>Very active</Chip>
          </div>
        </div>

        <button className="btn-primary w-full" onClick={saveProfile}>Save profile</button>
        {savedMsg && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-sm font-medium text-emerald-700">
            {savedMsg}
          </p>
        )}
      </div>

      {/* Feedback ----------------------------------------------------------- */}
      <div className="card space-y-3 p-5">
        <h2 className="font-semibold">Report a bug or request a feature</h2>
        <div className="flex gap-2">
          <Chip active={type === 'bug'} onClick={() => setType('bug')}>Report a bug</Chip>
          <Chip active={type === 'feature'} onClick={() => setType('feature')}>Request a feature</Chip>
        </div>
        <textarea
          className="input min-h-[7rem] w-full"
          maxLength={4000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            type === 'bug'
              ? 'What went wrong? What were you doing when it happened?'
              : 'What would you like the app to do?'
          }
        />
        <button className="btn-primary w-full" onClick={send} disabled={busy || !text.trim()}>
          {busy ? 'Sending…' : 'Send'}
        </button>
        {status && (
          <p
            className={`rounded-lg border p-2 text-sm font-medium ${
              statusOk
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {status}
          </p>
        )}
      </div>

      {isOwner && (
        <div className="card space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Submissions</h2>
            <button className="btn-ghost" onClick={view} disabled={loadingItems}>
              {loadingItems ? 'Loading…' : items ? 'Refresh' : 'View'}
            </button>
          </div>
          {items && items.length === 0 && (
            <p className="text-sm text-slate-500">Nothing submitted yet.</p>
          )}
          {items && items.length > 0 && (
            <ul className="space-y-2">
              {items.map((it) => (
                <li key={it.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                  <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                    <span
                      className={`chip ${
                        it.type === 'bug'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200'
                          : 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200'
                      }`}
                    >
                      {it.type === 'bug' ? 'Bug' : 'Feature'}
                    </span>
                    <span>{fmt(it.createdAt)}</span>
                    {it.email && <span className="truncate">· {it.email}</span>}
                    {it.appVersion && <span>· v{it.appVersion}</span>}
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{it.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="card p-5">
        <h2 className="mb-1 font-semibold">About</h2>
        <p className="text-sm text-slate-500">
          PostureLab is an educational tool, not medical advice. New to it?{' '}
          <Link to="/guide" className="text-brand-600 hover:underline">
            See the guide
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
