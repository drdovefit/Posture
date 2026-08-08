interface Props {
  score: number;
  size?: number;
  label?: string;
}

function color(score: number) {
  if (score >= 85) return '#10b981';
  if (score >= 65) return '#f59e0b';
  return '#ef4444';
}

export default function ScoreRing({ score, size = 128, label = 'Posture score' }: Props) {
  const stroke = size * 0.09;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(100, score)) / 100);
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track + progress arc. Only the arc is rotated (via an SVG attribute
            transform, which is reliable across browsers) so it starts at 12 o'clock. */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-slate-200 dark:stroke-slate-800"
        />
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            strokeWidth={stroke}
            stroke={color(score)}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset .6s ease' }}
          />
        </g>
        {/* Number is rendered upright — no rotation, so it shows on every browser. */}
        <text
          x={cx}
          y={cy}
          dominantBaseline="central"
          textAnchor="middle"
          className="fill-slate-800 dark:fill-slate-100"
          style={{ fontSize: size * 0.3, fontWeight: 700 }}
        >
          {score}
        </text>
      </svg>
      {label && <span className="mt-1 text-xs font-medium text-slate-500">{label}</span>}
    </div>
  );
}
