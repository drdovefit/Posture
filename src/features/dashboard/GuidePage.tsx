const steps = [
  {
    title: 'Take a good photo',
    body: 'Full body in frame, plain background, even lighting. Phone at hip height, roughly 3m away. Wear fitted clothing so joints are visible.',
  },
  {
    title: 'Pick the view',
    body: 'Side (lateral) shows forward-head, rounded shoulders and pelvic lean. Front/back (anterior/posterior) show shoulder, hip and knee asymmetry.',
  },
  {
    title: 'Let AI place the points',
    body: 'PostureLab auto-detects your joints and draws a plumb line and body chain. Drag any point to correct it — measurements update live.',
  },
  {
    title: 'Read your score',
    body: 'Each measurement is graded good / mild / moderate against typical neutral ranges, and combined into a 0–100 posture score.',
  },
  {
    title: 'Track progress',
    body: 'Save assessments, compare before/after, and follow your score trend. Log discomfort in the pain diary to see it next to your posture.',
  },
];

const metricGuide = [
  ['Forward head', 'Ear carried ahead of the shoulder — loads the neck.'],
  ['Trunk lean', 'Upper body tipped forward or back of vertical.'],
  ['Hip / pelvis position', 'Pelvis shifted relative to the ankles.'],
  ['Shoulder / pelvic level', 'One side higher than the other (front/back view).'],
  ['Lateral shift', 'Trunk off-center over the feet.'],
  ['Knee alignment', 'Bent / hyper-extended (side) or knock/bow (front).'],
];

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">How PostureLab works</h1>
        <p className="text-sm text-slate-500">
          A quick guide to getting accurate, useful posture assessments.
        </p>
      </div>

      <img
        src={`${import.meta.env.BASE_URL}brand/illustration.png`}
        alt="Taking a posture photo with a phone"
        className="w-full rounded-2xl"
        loading="lazy"
      />

      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={s.title} className="card flex gap-4 p-4">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-500 font-bold text-white">
              {i + 1}
            </div>
            <div>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-sm text-slate-500">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="card p-4">
        <h2 className="mb-3 font-semibold">What the measurements mean</h2>
        <dl className="space-y-2">
          {metricGuide.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[10rem_1fr] gap-2 text-sm">
              <dt className="font-medium">{k}</dt>
              <dd className="text-slate-500">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
        <strong>Medical disclaimer.</strong> PostureLab is an educational and
        self-tracking tool. It does not diagnose, treat, or replace assessment by
        a qualified healthcare professional. Photo-based measurements are
        estimates and depend on camera angle and pose.
      </div>
    </div>
  );
}
