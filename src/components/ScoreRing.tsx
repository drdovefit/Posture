import type { ReactNode } from 'react';

interface Props {
  score: number;
  size?: number;
  label?: string;
  /** Render this in the center instead of the score number (e.g. a button). */
  centerContent?: ReactNode;
}

function color(score: number) {
  if (score >= 85) return '#10b981';
  if (score >= 65) return '#f59e0b';
  return '#ef4444';
}

/**
 * Circular posture-score gauge. The ring is drawn in SVG, but the number is
 * rendered as plain HTML centered over it — this avoids SVG <text> transform
 * quirks so the number always shows (including on iOS Safari).
 */
export default function ScoreRing({ score, size = 128, label = 'Posture score', centerContent }: Props) {
  const stroke = size * 0.09;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = c * (1 - clamped / 100);
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            strokeWidth={stroke}
            className="stroke-slate-200 dark:stroke-slate-800"
          />
          <g transform={`rotate(-90 ${cx} ${cx})`}>
            <circle
              cx={cx}
              cy={cx}
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
        </svg>
        {centerContent ? (
          <div className="absolute inset-0 flex items-center justify-center">{centerContent}</div>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center font-bold tabular-nums text-slate-800 dark:text-slate-100"
            style={{ fontSize: size * 0.3 }}
          >
            {score}
          </div>
        )}
      </div>
      {label && <span className="mt-1 text-xs font-medium text-slate-500">{label}</span>}
    </div>
  );
}
