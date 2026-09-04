import { Link } from 'react-router-dom';
import { useTier } from '../../lib/entitlement';

const PRICE = 27;
const PER_DAY = (PRICE / 30).toFixed(2); // ~0.90

// A CorePRO-first comparison. Free is the losing column on purpose.
type Row = { label: string; free: boolean; pro: boolean };
const ROWS: Row[] = [
  { label: 'A quick posture score', free: true, pro: true },
  { label: 'See every problem area — named for you', free: false, pro: true },
  { label: 'The exact fix for each one', free: false, pro: true },
  { label: 'Unlimited front & side scans', free: false, pro: true },
  { label: 'Progress tracking & before/after compare', free: false, pro: true },
  { label: 'Pain diary', free: false, pro: true },
  { label: 'Live weekly class + recordings', free: false, pro: true },
  { label: 'New flow & mobility every week', free: false, pro: true },
  { label: 'Private 1-on-1 sessions with your coach', free: false, pro: true },
];

function Mark({ on }: { on: boolean }) {
  return on ? (
    <span className="text-lg font-black text-emerald-500" aria-label="Included">✓</span>
  ) : (
    <span className="text-lg font-black text-red-500" aria-label="Locked">✕</span>
  );
}

export default function SubscribePage() {
  const { isPro, setTestSubscribed } = useTier();

  if (isPro) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-10 text-center">
        <div className="text-4xl">🎉</div>
        <h1 className="text-2xl font-bold">You're a CorePRO member</h1>
        <p className="text-slate-500">Everything is unlocked. Go straighten out.</p>
        <Link to="/analyze" className="btn-primary inline-block">Take a scan</Link>
        <div>
          <button
            onClick={() => setTestSubscribed(false)}
            className="text-xs font-medium text-slate-400 hover:text-red-500 hover:underline"
          >
            Cancel subscription (testing)
          </button>
        </div>
      </div>
    );
  }

  const goPro = () => setTestSubscribed(true);

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-16">
      {/* HERO — CorePRO first */}
      <div className="rounded-3xl bg-gradient-to-b from-brand-600 to-brand-800 px-6 py-10 text-center text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/80">CorePRO Membership</p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
          Your coach and your posture app,<br />in one membership.
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-white/85">
          CorePRO gives you the full coaching program <em>and</em> unlocks everything in PostureLab —
          every problem named, every fix shown, live classes, and time with your coach.
        </p>
        <div className="mt-6 flex items-baseline justify-center gap-2">
          <span className="text-4xl font-extrabold">${PRICE}</span>
          <span className="text-white/75">/month</span>
        </div>
        <p className="text-sm text-white/75">About ${PER_DAY} a day · cancel anytime</p>
        <button
          onClick={goPro}
          className="mt-5 rounded-full bg-white px-10 py-3 text-base font-bold text-brand-700 shadow-lg transition-transform hover:scale-[1.03]"
        >
          Start CorePRO
        </button>
      </div>

      {/* WHAT'S INSIDE — the star. App + coaching, clearly two halves. */}
      <div className="relative rounded-3xl border-2 border-brand-500 bg-white p-6 shadow-2xl dark:bg-slate-900">
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-4 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
          Everything included
        </span>
        <p className="mt-2 text-center text-xs font-medium text-brand-600">
          🔒 Founding rate — locked in for you before it goes up
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-brand-50 p-4 dark:bg-brand-900/20">
            <h3 className="font-bold">PostureLab Pro</h3>
            <p className="text-xs text-slate-500">The app, fully unlocked</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex gap-2"><Mark on /> Every problem area, named for you</li>
              <li className="flex gap-2"><Mark on /> The exact fix for each one</li>
              <li className="flex gap-2"><Mark on /> Unlimited front &amp; side scans</li>
              <li className="flex gap-2"><Mark on /> Progress tracking &amp; compare</li>
              <li className="flex gap-2"><Mark on /> Pain diary</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-brand-50 p-4 dark:bg-brand-900/20">
            <h3 className="font-bold">Core Academy</h3>
            <p className="text-xs text-slate-500">The coaching program</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex gap-2"><Mark on /> Live weekly class + recordings</li>
              <li className="flex gap-2"><Mark on /> New flow &amp; mobility every week</li>
              <li className="flex gap-2"><Mark on /> Private 1-on-1 sessions with your coach</li>
              <li className="flex gap-2"><Mark on /> The whole program, always growing</li>
            </ul>
          </div>
        </div>

        <button
          onClick={goPro}
          className="mt-5 w-full rounded-xl bg-brand-500 py-3 text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.02]"
        >
          Start CorePRO — ${PRICE}/mo
        </button>
        <p className="mt-2 text-center text-xs text-slate-400">Cancel anytime · your data stays yours</p>
      </div>

      {/* FREE — one muted line, not a co-equal plan */}
      <p className="text-center text-sm text-slate-500">
        On the free plan you get a quick score to try it out. What's actually wrong and how to fix it
        stays <span className="font-semibold text-slate-600 dark:text-slate-300">locked</span> until you join CorePRO.
      </p>

      {/* COMPARISON — Free is clearly the lesser column */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-[1fr_3.5rem_4.5rem] items-center gap-x-3 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:bg-slate-900/50">
          <span>What you get</span>
          <span className="text-center">Free</span>
          <span className="rounded-md bg-brand-500 py-1 text-center text-white">CorePRO</span>
        </div>
        {ROWS.map((r, i) => (
          <div
            key={r.label}
            className={`grid grid-cols-[1fr_3.5rem_4.5rem] items-center gap-x-3 px-5 py-3 text-sm ${
              i % 2 ? 'bg-slate-50/50 dark:bg-slate-900/30' : ''
            }`}
          >
            <span>{r.label}</span>
            <span className="text-center"><Mark on={r.free} /></span>
            <span className="text-center"><Mark on={r.pro} /></span>
          </div>
        ))}
      </div>

      {/* WHY */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['🎯', 'Stop guessing', 'It names each problem and hands you the fix — no random YouTube.'],
          ['📈', 'See it work', 'Scan weekly and watch your plumb line straighten and your number climb.'],
          ['🏆', 'A real coach', 'Live classes, weekly flows, and private sessions — the whole program.'],
        ].map(([icon, t, b]) => (
          <div key={t} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="text-2xl">{icon}</div>
            <h3 className="mt-1 font-bold">{t}</h3>
            <p className="mt-1 text-sm text-slate-500">{b}</p>
          </div>
        ))}
      </div>

      {/* FINAL CTA */}
      <div className="rounded-3xl bg-slate-900 px-6 py-10 text-center text-white dark:bg-slate-800">
        <h2 className="text-2xl font-extrabold">Ready when you are.</h2>
        <p className="mx-auto mt-2 max-w-md text-white/80">
          The full program and every fix, for about ${PER_DAY} a day.
        </p>
        <button
          onClick={goPro}
          className="mt-5 rounded-full bg-brand-500 px-10 py-3 text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.03]"
        >
          Start CorePRO — ${PRICE}/mo
        </button>
        <p className="mt-2 text-xs text-white/60">Cancel anytime. Manage it from Settings.</p>
      </div>
    </div>
  );
}
