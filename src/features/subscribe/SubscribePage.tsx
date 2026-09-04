import { Link } from 'react-router-dom';
import { useTier } from '../../lib/entitlement';

const PRICE = '$27';

type Row = { label: string; free: string | boolean; pro: string | boolean };

const ROWS: Row[] = [
  { label: 'Posture score from a photo', free: true, pro: true },
  { label: 'Front + side scan', free: '1 each', pro: 'Unlimited' },
  { label: 'See your top 2 measurements', free: true, pro: true },
  { label: 'See every problem area, unblurred', free: false, pro: true },
  { label: 'What to work on — your fixes', free: false, pro: true },
  { label: 'Exercise videos & follow-alongs', free: false, pro: true },
  { label: 'Pain diary', free: false, pro: true },
  { label: 'Progress tracking & compare over time', free: 'Limited', pro: true },
  { label: 'The Core Academy program', free: false, pro: true },
  { label: 'Weekly class + LPF flow + mobility', free: false, pro: true },
  { label: 'Book private sessions with the coach', free: false, pro: true },
];

function Cell({ v }: { v: string | boolean }) {
  if (v === true)
    return <span className="text-emerald-600 dark:text-emerald-400">✓</span>;
  if (v === false)
    return <span className="text-slate-300 dark:text-slate-600">✕</span>;
  return <span className="text-xs font-medium text-slate-500">{v}</span>;
}

export default function SubscribePage() {
  const { isPro, setTestSubscribed } = useTier();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">CorePRO</p>
        <h1 className="mt-1 text-3xl font-bold">Unlock your full posture plan</h1>
        <p className="mx-auto mt-2 max-w-xl text-slate-500">
          Free shows you your score and a peek. Pro shows you <strong>every problem</strong>,
          <strong> exactly how to fix it</strong>, and comes bundled with the whole Core Academy
          program.
        </p>
      </div>

      {isPro ? (
        <div className="card border-emerald-300 bg-emerald-50 p-6 text-center dark:border-emerald-800/60 dark:bg-emerald-900/15">
          <div className="text-3xl">✓</div>
          <h2 className="mt-1 text-xl font-bold text-emerald-800 dark:text-emerald-200">
            You're on Pro
          </h2>
          <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
            Everything is unlocked. Go take a scan.
          </p>
          <Link to="/analyze" className="btn-primary mt-4 inline-block">
            New scan
          </Link>
          <div className="mt-4">
            <button
              onClick={() => setTestSubscribed(false)}
              className="text-xs font-medium text-slate-400 hover:text-red-500 hover:underline"
            >
              Cancel subscription (testing)
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Two plans */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card p-6">
              <h2 className="text-lg font-bold">Free</h2>
              <p className="mt-1 text-3xl font-bold">
                $0<span className="text-base font-medium text-slate-400">/mo</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-500">
                <li>✓ Your posture score</li>
                <li>✓ One front and one side scan</li>
                <li>✓ Your two mildest measurements</li>
                <li className="text-slate-400">🔒 The problems that matter — blurred</li>
                <li className="text-slate-400">🔒 Fixes, videos, pain diary</li>
              </ul>
            </div>

            <div className="card relative overflow-hidden border-2 border-brand-500 p-6">
              <span className="absolute right-3 top-3 rounded-full bg-brand-500 px-3 py-0.5 text-xs font-semibold text-white">
                Best value
              </span>
              <h2 className="text-lg font-bold">CorePRO</h2>
              <p className="mt-1 text-3xl font-bold">
                {PRICE}<span className="text-base font-medium text-slate-400">/mo</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">PostureLab Pro + the Core Academy program</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>✓ <strong>Every</strong> problem area, unblurred</li>
                <li>✓ Your personalized fixes for each</li>
                <li>✓ Unlimited scans + full progress tracking</li>
                <li>✓ Exercise videos & weekly follow-alongs</li>
                <li>✓ Pain diary</li>
                <li>✓ The whole Core Academy: class, LPF flow, mobility, private sessions</li>
              </ul>
              <button
                onClick={() => setTestSubscribed(true)}
                className="btn-primary mt-5 block w-full text-center"
              >
                Go Pro with CorePRO
              </button>
            </div>
          </div>

          {/* Full comparison */}
          <div className="card overflow-hidden p-0">
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-800">
              <span>What you get</span>
              <span className="w-12 text-center">Free</span>
              <span className="w-12 text-center text-brand-600">Pro</span>
            </div>
            {ROWS.map((r) => (
              <div
                key={r.label}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-b border-slate-50 px-5 py-2.5 text-sm last:border-0 dark:border-slate-800/60"
              >
                <span>{r.label}</span>
                <span className="w-12 text-center">
                  <Cell v={r.free} />
                </span>
                <span className="w-12 text-center">
                  <Cell v={r.pro} />
                </span>
              </div>
            ))}
          </div>

          {/* Why */}
          <div className="card p-6">
            <h2 className="text-lg font-bold">Why it's worth it</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                ['🎯', 'Know exactly what to fix', 'No guessing and no Googling — the app names each problem and hands you the moves for it.'],
                ['📈', 'Watch it improve', 'Scan each week and see the plumb line straighten and your number climb. Proof, not a feeling.'],
                ['🏆', 'A full program, not just an app', 'Pro is the entire Core Academy — coaching, weekly classes, and mobility — with PostureLab built in.'],
              ].map(([icon, title, body]) => (
                <div key={title} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="text-2xl">{icon}</div>
                  <h3 className="mt-1 font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <button onClick={() => setTestSubscribed(true)} className="btn-primary inline-block px-8">
              Unlock everything — {PRICE}/mo
            </button>
            <p className="mt-2 text-xs text-slate-400">
              Testing mode: this unlocks Pro instantly. Manage it from Settings.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
