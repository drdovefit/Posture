import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getProfile,
  setProfile,
  ageFromProfile,
  type Condition,
  type Injury,
  type Sex,
  type Pregnancy,
} from '../../lib/profile';
import { rescoreAll } from '../../lib/rescore';

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

const ACTIVITY = [
  { name: 'Sedentary', ex: 'Mostly sitting, with little or no exercise.' },
  { name: 'Lightly active', ex: 'Short walks or light chores most days.' },
  { name: 'Moderately active', ex: 'Regular workouts a few times a week.' },
  { name: 'Very active', ex: 'Hard training or sport most days of the week.' },
  { name: 'Athlete', ex: 'Intense daily training or competitive sport.' },
  { name: 'Bodybuilder', ex: 'Serious strength training with high muscle mass.' },
];
const ACT_MAX = ACTIVITY.length;

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

export default function ProfilePage() {
  const navigate = useNavigate();
  const p0 = getProfile();

  const [sex, setSex] = useState<Sex>(p0.sex ?? 'unspecified');
  const [birthday, setBirthday] = useState(p0.birthday ?? '');

  const [heightUnit, setHeightUnit] = useState<'imperial' | 'metric'>('imperial');
  const [ft, setFt] = useState(p0.heightCm ? String(Math.floor(p0.heightCm / 2.54 / 12)) : '');
  const [inch, setInch] = useState(p0.heightCm ? String(Math.round((p0.heightCm / 2.54) % 12)) : '');
  const [cm, setCm] = useState(p0.heightCm ? String(Math.round(p0.heightCm)) : '');

  const [weightUnit, setWeightUnit] = useState<'lb' | 'kg'>('lb');
  const [lb, setLb] = useState(p0.weightKg ? String(Math.round(p0.weightKg / 0.45359237)) : '');
  const [kg, setKg] = useState(p0.weightKg ? String(Math.round(p0.weightKg)) : '');

  const [pregnancy, setPregnancy] = useState<Pregnancy>(p0.pregnancy ?? 'none');
  const [conditions, setConditions] = useState<Condition[]>(p0.conditions ?? []);
  const [injuries, setInjuries] = useState<Injury[]>(p0.injuries ?? []);
  const [fitness, setFitness] = useState<number>(
    typeof p0.fitness === 'number' && p0.fitness >= 1 && p0.fitness <= ACT_MAX ? p0.fitness : 3,
  );
  // Free-moving slider that snaps to the nearest level on release (like the pain diary).
  const [fitDragging, setFitDragging] = useState(false);
  const [fitPos, setFitPos] = useState(fitness);
  const fitRef = useRef(fitness);
  const fitVal = fitDragging ? fitPos : fitness;
  const actLevel = Math.min(Math.max(Math.round(fitVal) || 3, 1), ACT_MAX);
  const act = ACTIVITY[actLevel - 1];
  function commitFitness() {
    const v = Math.min(Math.max(Math.round(fitRef.current), 1), ACT_MAX);
    setFitness(v);
    setFitPos(v);
    setFitDragging(false);
  }

  const [dirty, setDirty] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);
  const [busyMsg, setBusyMsg] = useState('');
  const [confirm, setConfirm] = useState<'reset' | 'apply' | null>(null);

  const mark = () => {
    setDirty(true);
    setSavedOnce(false);
  };

  const currentAge = ageFromProfile({ birthday });

  function toHeightCm(): number | undefined {
    if (heightUnit === 'imperial') {
      const total = (Number(ft) || 0) * 12 + (Number(inch) || 0);
      return total ? Math.round(total * 2.54) : undefined;
    }
    return cm ? Math.round(Number(cm)) : undefined;
  }
  function toWeightKg(): number | undefined {
    if (weightUnit === 'lb') return lb ? Math.round(Number(lb) * 0.45359237) : undefined;
    return kg ? Math.round(Number(kg)) : undefined;
  }

  function toggleHeightUnit() {
    if (heightUnit === 'imperial') {
      const total = (Number(ft) || 0) * 12 + (Number(inch) || 0);
      setCm(total ? String(Math.round(total * 2.54)) : '');
      setHeightUnit('metric');
    } else {
      const c = Number(cm) || 0;
      const totalIn = c / 2.54;
      setFt(c ? String(Math.floor(totalIn / 12)) : '');
      setInch(c ? String(Math.round(totalIn % 12)) : '');
      setHeightUnit('imperial');
    }
  }
  function toggleWeightUnit() {
    if (weightUnit === 'lb') {
      setKg(lb ? String(Math.round(Number(lb) * 0.45359237)) : '');
      setWeightUnit('kg');
    } else {
      setLb(kg ? String(Math.round(Number(kg) / 0.45359237)) : '');
      setWeightUnit('lb');
    }
  }

  function buildProfile() {
    return {
      sex,
      birthday: birthday || undefined,
      heightCm: toHeightCm(),
      weightKg: toWeightKg(),
      pregnancy,
      conditions,
      injuries,
      fitness,
    };
  }

  function save() {
    setProfile(buildProfile());
    try {
      localStorage.setItem('posturelab-profile-done', '1');
    } catch {
      /* ignore */
    }
    setDirty(false);
    setSavedOnce(true);
  }

  async function applyToAll() {
    save();
    setBusyMsg('Updating your scans…');
    try {
      const n = await rescoreAll(getProfile());
      setBusyMsg(`Updated ${n} scan${n === 1 ? '' : 's'} to match your profile.`);
    } catch {
      setBusyMsg('Could not update scans right now.');
    }
    setConfirm(null);
    setTimeout(() => setBusyMsg(''), 3000);
  }

  async function reset() {
    setProfile({});
    setSex('unspecified');
    setBirthday('');
    setFt('');
    setInch('');
    setCm('');
    setLb('');
    setKg('');
    setPregnancy('none');
    setConditions([]);
    setInjuries([]);
    setFitness(3);
    setDirty(false);
    setSavedOnce(false);
    setBusyMsg('Resetting your scans…');
    try {
      const n = await rescoreAll({});
      setBusyMsg(`Profile cleared. ${n} scan${n === 1 ? '' : 's'} reset to the neutral score.`);
    } catch {
      setBusyMsg('Could not reset scans right now.');
    }
    setConfirm(null);
    setTimeout(() => setBusyMsg(''), 3500);
  }

  const toggle = <T,>(list: T[], v: T): T[] =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">About you</h1>
        <button
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={() => setConfirm('reset')}
        >
          Reset
        </button>
      </div>

      <div className="card space-y-5 p-5">
        {/* Sex */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Sex</label>
          <div className="flex flex-wrap gap-2">
            <Chip active={sex === 'female'} onClick={() => { setSex('female'); mark(); }}>Female</Chip>
            <Chip active={sex === 'male'} onClick={() => { setSex('male'); mark(); }}>Male</Chip>
            <Chip active={sex === 'unspecified'} onClick={() => { setSex('unspecified'); mark(); }}>
              Prefer not to say
            </Chip>
          </div>
        </div>

        {/* Birthday */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Birthday{currentAge != null ? ` · age ${currentAge}` : ''}
          </label>
          <input
            type="date"
            className="input"
            value={birthday}
            onChange={(e) => { setBirthday(e.target.value); mark(); }}
          />
        </div>

        {/* Height */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-medium text-slate-500">Height</label>
            <button
              type="button"
              className="text-xs font-medium text-brand-600 hover:underline"
              onClick={toggleHeightUnit}
            >
              {heightUnit === 'imperial' ? 'Use cm' : 'Use ft / in'}
            </button>
          </div>
          {heightUnit === 'imperial' ? (
            <div className="flex items-center gap-2">
              <input className="input w-20" inputMode="numeric" value={ft} onChange={(e) => { setFt(e.target.value); mark(); }} placeholder="ft" />
              <span className="text-sm text-slate-400">ft</span>
              <input className="input w-20" inputMode="numeric" value={inch} onChange={(e) => { setInch(e.target.value); mark(); }} placeholder="in" />
              <span className="text-sm text-slate-400">in</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input className="input w-28" inputMode="numeric" value={cm} onChange={(e) => { setCm(e.target.value); mark(); }} placeholder="cm" />
              <span className="text-sm text-slate-400">cm</span>
            </div>
          )}
        </div>

        {/* Weight */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-medium text-slate-500">Weight</label>
            <button
              type="button"
              className="text-xs font-medium text-brand-600 hover:underline"
              onClick={toggleWeightUnit}
            >
              {weightUnit === 'lb' ? 'Use kg' : 'Use lb'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            {weightUnit === 'lb' ? (
              <>
                <input className="input w-28" inputMode="numeric" value={lb} onChange={(e) => { setLb(e.target.value); mark(); }} placeholder="lb" />
                <span className="text-sm text-slate-400">lb</span>
              </>
            ) : (
              <>
                <input className="input w-28" inputMode="numeric" value={kg} onChange={(e) => { setKg(e.target.value); mark(); }} placeholder="kg" />
                <span className="text-sm text-slate-400">kg</span>
              </>
            )}
          </div>
        </div>

        {/* Pregnancy */}
        {sex === 'female' && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Pregnancy</label>
            <div className="flex flex-wrap gap-2">
              <Chip active={pregnancy === 'none'} onClick={() => { setPregnancy('none'); mark(); }}>No</Chip>
              <Chip active={pregnancy === 'pregnant'} onClick={() => { setPregnancy('pregnant'); mark(); }}>Pregnant</Chip>
              <Chip active={pregnancy === 'postpartum'} onClick={() => { setPregnancy('postpartum'); mark(); }}>Recently postpartum</Chip>
            </div>
          </div>
        )}

        {/* Conditions */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Conditions (pick any that apply)</label>
          <div className="flex flex-wrap gap-2">
            <Chip active={conditions.length === 0} onClick={() => { setConditions([]); mark(); }}>None</Chip>
            {CONDITIONS.map((c) => (
              <Chip key={c.id} active={conditions.includes(c.id)} onClick={() => { setConditions((l) => toggle(l, c.id)); mark(); }}>
                {c.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Injuries */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Injuries or surgeries (pick any that apply)</label>
          <div className="flex flex-wrap gap-2">
            <Chip active={injuries.length === 0} onClick={() => { setInjuries([]); mark(); }}>None</Chip>
            {INJURIES.map((c) => (
              <Chip key={c.id} active={injuries.includes(c.id)} onClick={() => { setInjuries((l) => toggle(l, c.id)); mark(); }}>
                {c.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Activity slider */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Activity level</label>
          <input
            type="range"
            min={1}
            max={ACT_MAX}
            step="any"
            value={fitVal}
            onChange={(e) => {
              const v = Number(e.target.value);
              fitRef.current = v;
              setFitPos(v);
              setFitDragging(true);
              mark();
            }}
            onPointerUp={commitFitness}
            onPointerCancel={commitFitness}
            onTouchEnd={commitFitness}
            onKeyUp={commitFitness}
            onBlur={commitFitness}
            className="w-full accent-brand-500"
            style={{
              background: `linear-gradient(to right, #0ea5e9 ${((fitVal - 1) / (ACT_MAX - 1)) * 100}%, #e2e8f0 ${
                ((fitVal - 1) / (ACT_MAX - 1)) * 100
              }%)`,
            }}
          />
          <div className="mt-1 text-sm">
            <span className="font-semibold">{act.name}.</span>
            <span className="text-slate-500"> {act.ex}</span>
          </div>
        </div>
      </div>

      {/* Save + apply */}
      <div className="space-y-2">
        <button
          className={`w-full rounded-xl px-4 py-2.5 font-semibold text-white transition-colors ${
            savedOnce && !dirty ? 'bg-emerald-500' : 'bg-brand-500 hover:bg-brand-600'
          }`}
          onClick={save}
        >
          {savedOnce && !dirty ? 'Saved ✓' : 'Save profile'}
        </button>
        <button
          className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          onClick={() => setConfirm('apply')}
        >
          Update all past scans to match these preferences
        </button>
        {busyMsg && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-sm font-medium text-emerald-700">
            {busyMsg}
          </p>
        )}
        <button className="w-full text-sm text-slate-400 hover:underline" onClick={() => navigate('/')}>
          Back to dashboard
        </button>
      </div>

      {/* Confirm dialogs */}
      {confirm === 'apply' && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4" onClick={() => setConfirm(null)}>
          <div className="card w-full max-w-sm space-y-3 p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold">Update all past scans?</h3>
            <p className="text-sm text-slate-500">
              This re-scores every scan you've saved using your current profile, so your history
              matches these preferences. It saves your profile first.
            </p>
            <div className="flex gap-2">
              <button className="btn-ghost flex-1" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn-primary flex-1" onClick={applyToAll}>Update</button>
            </div>
          </div>
        </div>
      )}
      {confirm === 'reset' && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4" onClick={() => setConfirm(null)}>
          <div className="card w-full max-w-sm space-y-3 p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold">Reset your profile?</h3>
            <p className="text-sm text-slate-500">
              This clears all your profile details and re-scores every past scan with the neutral,
              non-personalized ranges. It can't be undone.
            </p>
            <div className="flex gap-2">
              <button className="btn-ghost flex-1" onClick={() => setConfirm(null)}>Cancel</button>
              <button
                className="flex-1 rounded-lg bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600"
                onClick={reset}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
