import { Link } from 'react-router-dom';
import { useTier } from '../../lib/entitlement';

const PRICE = 27;
const PER_DAY = (PRICE / 30).toFixed(2); // ~0.90

type Row = { label: string; free: string | boolean; pro: string | boolean };
const ROWS: Row[] = [
  { label: 'Posture score from a photo', free: true, pro: true },
  { label: 'Front + side scans', free: '1 each', pro: 'Unlimited' },
  { label: 'See every problem area (unblurred)', free: false, pro: true },
  { label: 'Exactly how to fix each one', free: false, pro: true },
  { label: 'Exercise videos & follow-alongs', free: false, pro: true },
  { label: 'Pain diary', free: false, pro: true },
  { label: 'Progress tracking & compare', free: 'Limited', pro: true },
  { label: 'The full Core Academy program', free: false, pro: true },
  { label: 'Weekly class + LPF flow + mobility', free: false, pro: true },
  { label: "Book private sessions with the coach", free: false, pro: true },
];

function Mark({ v, big }: { v: string | boolean; big?: boolean }) {
  if (v === true) return <span className="font-bold text-emerald-500">✓</span>;
  if (v === false)
    return (
      <span className={`font-black text-red-500 ${big ? 'text-lg' : ''}`} aria-label="Not included">
        ✕
      </span>
    );
  return <span className="text-xs font-semibold text-slate-500">{v}</span>;
}

export default function SubscribePage() {
  const { isPro, setTestSubscribed } = useTier();

  if (isPro) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-8 text-center">
        <div className="text-4xl">🎉</div>
        <h1 className="text-2xl font-bold">You're on Pro</h1>
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
    <div className="mx-auto max-w-3xl space-y-10 pb-16">
      {/* HERO — loss framing */}
      <div className="rounded-3xl bg-gradient-to-b from-brand-500 to-brand-700 px-6 py-10 text-center text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">CorePRO Membership</p>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">
          You're seeing 2 of your problems.<br />Unlock the rest.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-white/85">
          Free tells you something's off. Pro shows you <strong>every</strong> issue, hands you the
          exact fix for each, and comes with the entire Core Academy program.
        </p>
        <button
          onClick={goPro}
          className="mt-6 rounded-full bg-white px-8 py-3 text-base font-bold text-brand-700 shadow-lg transition-transform hover:scale-[1.03]"
        >
          Unlock everything — ${PRICE}/mo
        </button>
        <p className="mt-2 text-xs text-white/75">That's about ${PER_DAY} a day. Cancel anytime.</p>
      </div>

      {/* PLANS — Pro dominant (center-stage effect) */}
      <div className="grid items-center gap-4 sm:grid-cols-5">
        {/* Free — deliberately bare */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 opacity-90 dark:border-slate-800 dark:bg-slate-900/40 sm:col-span-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Free</h2>
          <p className="mt-1 text-3xl font-bold text-slate-500">$0</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex gap-2"><Mark v={true} /> Your posture score</li>
            <li className="flex gap-2"><Mark v={true} /> 1 front + 1 side scan</li>
            <li className="flex gap-2 text-slate-500"><Mark v={false} big /> Your real problem areas</li>
            <li className="flex gap-2 text-slate-500"><Mark v={false} big /> How to fix anything</li>
            <li className="flex gap-2 text-slate-500"><Mark v={false} big /> Videos, pain diary, tracking</li>
            <li className="flex gap-2 text-slate-500"><Mark v={false} big /> Core Academy</li>
          </ul>
        </div>

        {/* Pro — big, glowing, badged */}
        <div className="relative rounded-2xl border-2 border-brand-500 bg-white p-6 shadow-2xl dark:bg-slate-900 sm:col-span-3 sm:scale-105">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-4 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
            Most popular
          </span>
          <h2 className="text-sm font-bold uppercase tracking-wide text-brand-600">CorePRO</h2>
          <div className="mt-1 flex items-end gap-2">
            <p className="text-4xl font-extrabold">${PRICE}</p>
            <p className="pb-1 text-sm text-slate-400">/month</p>
          </div>
          <p className="text-xs font-medium text-brand-600">
            🔒 Founding rate — locked in for you before it rises
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex gap-2"><Mark v={true} /> <strong>Every</strong> problem area, unblurred</li>
            <li className="flex gap-2"><Mark v={true} /> Your personal fix for each one</li>
            <li className="flex gap-2"><Mark v={true} /> Unlimited scans + progress tracking</li>
            <li className="flex gap-2"><Mark v={true} /> Exercise videos & weekly follow-alongs</li>
            <li className="flex gap-2"><Mark v={true} /> Pain diary</li>
            <li className="flex gap-2"><Mark v={true} /> The whole Core Academy: class, LPF flow, mobility, private sessions</li>
          </ul>
          <button
            onClick={goPro}
            className="mt-5 w-full rounded-xl bg-brand-500 py-3 text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.02]"
          >
            Go Pro
          </button>
          <p className="mt-2 text-center text-xs text-slate-400">Cancel anytime · keep your data</p>
        </div>
      </div>

      {/* VALUE STACK — bundling */}
      <div className="rounded-2xl border border-slate-200 p-6 dark:border-slate-800">
        <h2 className="text-center text-lg font-bold">One price, two things in one</h2>
        <p className="mt-1 text-center text-sm text-slate-500">
          Pro isn't just the app. It's the app <em>plus</em> the whole coaching program.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-brand-50 p-4 dark:bg-brand-900/15">
            <h3 className="font-bold">PostureLab Pro</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
              <li>Every problem named + the fix</li>
              <li>Unlimited scans & progress tracking</li>
              <li>Pain diary + exercise videos</li>
            </ul>
          </div>
          <div className="rounded-xl bg-brand-50 p-4 dark:bg-brand-900/15">
            <h3 className="font-bold">Core Academy</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
              <li>Weekly class + the recording</li>
              <li>New LPF flow &amp; mobility every week</li>
              <li>Book private sessions with the coach</li>
            </ul>
          </div>
        </div>
      </div>

      {/* FULL COMPARISON — contrast, big red ✕ */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:bg-slate-900/50">
          <span>What you get</span>
          <span className="w-14 text-center">Free</span>
          <span className="w-14 rounded-md bg-brand-500 py-0.5 text-center text-white">Pro</span>
        </div>
        {ROWS.map((r, i) => (
          <div
            key={r.label}
            className={`grid grid-cols-[1fr_auto_auto] items-center gap-x-6 px-5 py-3 text-sm ${
              i % 2 ? 'bg-slate-50/50 dark:bg-slate-900/30' : ''
            }`}
          >
            <span>{r.label}</span>
            <span className="w-14 text-center"><Mark v={r.free} big /></span>
            <span className="w-14 text-center"><Mark v={r.pro} big /></span>
          </div>
        ))}
      </div>

      {/* WHY */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['🎯', 'Stop guessing', "It names each problem and hands you the fix — no Googling, no random YouTube."],
          ['📈', 'See it work', 'Scan weekly and watch the plumb line straighten and your number climb. Proof, not a feeling.'],
          ['🏆', 'A coach in your pocket', "Live classes, weekly flows, and private sessions — the whole program, included."],
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
        <h2 className="text-2xl font-extrabold">Fix what you can finally see.</h2>
        <p className="mx-auto mt-2 max-w-md text-white/80">
          Less than ${PER_DAY} a day for every fix, every video, and the full Core Academy.
        </p>
        <button
          onClick={goPro}
          className="mt-5 rounded-full bg-brand-500 px-10 py-3 text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.03]"
        >
          Unlock everything — ${PRICE}/mo
        </button>
        <p className="mt-2 text-xs text-white/60">Cancel anytime. Manage it from Settings.</p>
      </div>
    </div>
  );
}
