import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Assessment } from '../../lib/types';

/** Line chart of posture score over time (assessments ordered oldest→newest). */
export default function ScoreTrend({ assessments }: { assessments: Assessment[] }) {
  const data = assessments.map((a) => ({
    date: new Date(a.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
    score: a.score,
    view: a.view,
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} className="fill-slate-500" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} className="fill-slate-500" />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            labelClassName="text-slate-600"
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#0ea5e9"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
