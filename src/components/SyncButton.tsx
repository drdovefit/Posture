import { useEffect, useRef, useState } from 'react';
import { useAuth, signInWithGoogle, doSignOut } from '../state/auth';
import { syncAll } from '../lib/sync';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C41.6 36 44 30.5 44 24c0-1.3-.1-2.3-.4-3.5z" />
  </svg>
);

export default function SyncButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const syncedFor = useRef<string | null>(null);

  async function runSync() {
    if (!user) return;
    setBusy(true);
    setStatus('Syncing…');
    try {
      const r = await syncAll(user.uid);
      setStatus(`Synced ✓ (${r.pushed} up, ${r.pulled} down)`);
    } catch (e) {
      setStatus('Sync failed — check connection and try again.');
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  // Auto-sync once when a session becomes signed-in.
  useEffect(() => {
    if (user && syncedFor.current !== user.uid) {
      syncedFor.current = user.uid;
      runSync();
    }
    if (!user) syncedFor.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleGoogle() {
    setBusy(true);
    setStatus('');
    try {
      await signInWithGoogle();
      setOpen(false);
    } catch (e) {
      setStatus('Sign-in failed. Please try again.');
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  const label = user
    ? user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Account'
    : 'Sign in';

  return (
    <>
      <button className="btn-ghost h-9 max-w-[7rem] truncate" onClick={() => setOpen(true)}>
        {user ? `👤 ${label}` : 'Sign in'}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="card w-full max-w-sm space-y-4 p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-500 text-2xl text-white">
              ⌇
            </div>

            {user ? (
              <>
                <div>
                  <h2 className="text-lg font-bold">You're signed in</h2>
                  <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                </div>
                <button className="btn-primary w-full" onClick={runSync} disabled={busy}>
                  {busy ? 'Syncing…' : 'Sync now'}
                </button>
                <button
                  className="btn-ghost w-full"
                  onClick={async () => {
                    await doSignOut();
                    setStatus('');
                    setOpen(false);
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-lg font-bold">Sign in to PostureLab</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Sync your profiles, assessments and photos across your devices.
                  </p>
                </div>
                <button
                  onClick={handleGoogle}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  <GoogleIcon />
                  {busy ? 'Opening…' : 'Continue with Google'}
                </button>
                <p className="text-xs text-slate-400">Your data stays private to your account.</p>
              </>
            )}

            {status && (
              <p className="rounded-lg bg-brand-50 p-2 text-xs text-brand-700 dark:bg-brand-900/30 dark:text-brand-200">
                {status}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
