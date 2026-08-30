import { Link } from 'react-router-dom';
import { useAuth } from '../../state/auth';

/**
 * Settings placeholder. Intentionally minimal for now: a home for account,
 * profile, and preferences as they are added.
 */
export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="card p-5">
        <h2 className="mb-1 font-semibold">Account</h2>
        <p className="text-sm text-slate-500">
          {user ? `Signed in as ${user.email}` : 'You are not signed in.'}
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Manage sign-in and sync from the account button in the top bar.
        </p>
      </div>

      <div className="card p-5">
        <h2 className="mb-1 font-semibold">Profile</h2>
        <p className="text-sm text-slate-500">More profile options are coming soon.</p>
      </div>

      <div className="card p-5">
        <h2 className="mb-1 font-semibold">About</h2>
        <p className="text-sm text-slate-500">
          PostureLab is an educational tool, not medical advice. New to it?{' '}
          <Link to="/guide" className="text-brand-600 hover:underline">
            See the guide
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
