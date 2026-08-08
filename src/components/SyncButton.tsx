import { useState } from 'react';

/**
 * Sign-in sheet with Google / Apple buttons. Real OAuth requires a configured
 * backend (Firebase); until the owner connects it, tapping a provider shows a
 * short status note instead of pretending to sign in.
 */
export default function SyncButton() {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');

  const providerMsg =
    'Cloud sign-in is almost ready — it turns on as soon as the backend is connected. Your data is saved safely on this device and will sync up automatically once it’s live.';

  return (
    <>
      <button className="btn-ghost h-9" onClick={() => setOpen(true)}>
        Sign in
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={() => {
            setOpen(false);
            setNote('');
          }}
        >
          <div
            className="card w-full max-w-sm space-y-4 p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-500 text-2xl text-white">
              ⌇
            </div>
            <div>
              <h2 className="text-lg font-bold">Sign in to PostureLab</h2>
              <p className="mt-1 text-sm text-slate-500">
                Sync your profiles, assessments and photos across your devices.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setNote(providerMsg)}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                  <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C41.6 36 44 30.5 44 24c0-1.3-.1-2.3-.4-3.5z" />
                </svg>
                Continue with Google
              </button>
              <button
                onClick={() => setNote(providerMsg)}
                className="flex w-full items-center justify-center gap-3 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                <svg width="16" height="16" viewBox="0 0 384 512" fill="currentColor" aria-hidden>
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM255.5 91.9c30.5-36.2 27.7-69.2 26.8-81.1-26.9 1.6-58 18.4-75.7 39.1-19.5 22.3-31 49.8-28.5 79.4 29.1 2.3 55.6-12.9 77.4-37.4z" />
                </svg>
                Continue with Apple
              </button>
            </div>

            {note ? (
              <p className="rounded-lg bg-brand-50 p-3 text-left text-xs text-brand-700 dark:bg-brand-900/30 dark:text-brand-200">
                {note}
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Your data stays private to your account.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
