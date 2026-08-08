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
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-slate-200 dark:stroke-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          stroke={color(score)}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          className="rotate-90 fill-slate-800 dark:fill-slate-100"
          style={{ transformOrigin: 'center', fontSize: size * 0.3, fontWeight: 700 }}
        >
          {score}
        </text>
      </svg>
      <span className="mt-1 text-xs font-medium text-slate-500">{label}</span>
    </div>
  );
}
