import { useEffect, useRef, useState } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { auth } from '../lib/firebase';
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

  // Phone flow state.
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [phoneStep, setPhoneStep] = useState<'enter' | 'verify'>('enter');
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  async function runSync() {
    if (!user) return;
    setBusy(true);
    setStatus('Syncing…');
    try {
      const r = await syncAll(user.uid);
      setStatus(`Synced ✓ (${r.pushed} up, ${r.pulled} down)`);
    } catch (e) {
      setStatus('Sync failed — check your connection and try again.');
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (user && syncedFor.current !== user.uid) {
      syncedFor.current = user.uid;
      runSync();
    }
    if (!user) syncedFor.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function resetPhone() {
    setPhone('');
    setCode('');
    setPhoneStep('enter');
    confirmationRef.current = null;
    verifierRef.current?.clear();
    verifierRef.current = null;
  }

  function closeModal() {
    setOpen(false);
    setStatus('');
    resetPhone();
  }

  async function handleGoogle() {
    setBusy(true);
    setStatus('');
    try {
      await signInWithGoogle();
      closeModal();
    } catch (e) {
      setStatus('Google sign-in failed. Please try again.');
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  async function sendCode() {
    const num = phone.replace(/[^\d+]/g, '');
    if (!num.startsWith('+') || num.length < 8) {
      setStatus('Enter your number with country code, e.g. +15551234567');
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      verifierRef.current?.clear();
      verifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
      confirmationRef.current = await signInWithPhoneNumber(auth, num, verifierRef.current);
      setPhoneStep('verify');
      setStatus('Code sent — check your texts.');
    } catch (e) {
      setStatus('Could not send the code. Check the number (with country code) and try again.');
      verifierRef.current?.clear();
      verifierRef.current = null;
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    if (!confirmationRef.current) return;
    setBusy(true);
    setStatus('');
    try {
      await confirmationRef.current.confirm(code.trim());
      closeModal();
    } catch (e) {
      setStatus('That code didn’t match. Try again.');
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  const label = user
    ? user.displayName?.split(' ')[0] || user.email?.split('@')[0] || user.phoneNumber || 'Account'
    : 'Sign in';

  return (
    <>
      <button className="btn-ghost h-9 max-w-[7rem] truncate" onClick={() => setOpen(true)}>
        {user ? `👤 ${label}` : 'Sign in'}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={closeModal}
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
                  <p className="mt-1 text-sm text-slate-500">
                    {user.email || user.phoneNumber}
                  </p>
                </div>
                <button className="btn-primary w-full" onClick={runSync} disabled={busy}>
                  {busy ? 'Syncing…' : 'Sync now'}
                </button>
                <button
                  className="btn-ghost w-full"
                  onClick={async () => {
                    await doSignOut();
                    closeModal();
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
                    Sync your data across your devices.
                  </p>
                </div>

                <button
                  onClick={handleGoogle}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" /> or use your phone
                  <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                </div>

                {phoneStep === 'enter' ? (
                  <div className="space-y-2 text-left">
                    <input
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 555 123 4567"
                      className="input"
                    />
                    <button className="btn-primary w-full" onClick={sendCode} disabled={busy}>
                      {busy ? 'Sending…' : 'Send code'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 text-left">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="6-digit code"
                      className="input tracking-widest"
                    />
                    <button className="btn-primary w-full" onClick={verifyCode} disabled={busy}>
                      {busy ? 'Verifying…' : 'Verify & sign in'}
                    </button>
                    <button className="btn-ghost w-full" onClick={resetPhone}>
                      Use a different number
                    </button>
                  </div>
                )}
              </>
            )}

            {status && (
              <p className="rounded-lg bg-brand-50 p-2 text-xs text-brand-700 dark:bg-brand-900/30 dark:text-brand-200">
                {status}
              </p>
            )}
            {/* Invisible reCAPTCHA host for phone auth. */}
            <div id="recaptcha-container" />
          </div>
        </div>
      )}
    </>
  );
}
