import { Link } from 'react-router-dom';

/** A small locked panel that sends free users to the Subscribe page. */
export default function ProLock({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-5 text-center dark:border-brand-900/50 dark:bg-brand-900/10">
      <div className="text-2xl">🔒</div>
      <p className="mt-1 font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{blurb}</p>
      <Link to="/subscribe" className="btn-primary mt-3 inline-block">
        Subscribe to unlock
      </Link>
    </div>
  );
}
