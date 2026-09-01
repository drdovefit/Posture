import { useState } from 'react';
import { resendVerification, reloadUser, doSignOut } from '../state/auth';

/**
 * Blocking screen shown when a signed-in account has not verified its email.
 * Google accounts are already verified, so this only affects email/password
 * signups. The app is unusable until they click the link we emailed them.
 */
export default function VerifyEmailGate({ email }: { email: string | null }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);

  async function check() {
    setBusy(true);
    setMsg('');
    try {
      const verified = await reloadUser();
      if (verified) {
        window.location.reload();
        return;
      }
      setOk(false);
      setMsg('Not verified yet. Open the link in your email, then tap this again.');
    } catch {
      setOk(false);
      setMsg('Could not check right now. Try again in a moment.');
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    setMsg('');
    try {
      await resendVerification();
      setOk(true);
      setMsg('Sent. Check your inbox and your spam folder.');
    } catch {
      setOk(false);
      setMsg('Could not resend right now. Try again shortly.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-full place-items-center bg-slate-50 p-4 dark:bg-slate-950">
      <div className="card w-full max-w-sm space-y-4 p-6 text-center">
        <img
          src={`${import.meta.env.BASE_URL}brand/logo-mark.png`}
          alt="PostureLab"
          className="mx-auto h-12 w-12 rounded-2xl"
        />
        <div>
          <h2 className="text-lg font-bold">Verify your email</h2>
          <p className="mt-1 text-sm text-slate-500">
            We sent a verification link to {email ? <span className="font-medium">{email}</span> : 'your email'}.
            Open it, then come back and tap "I verified".
          </p>
        </div>

        <button className="btn-primary w-full" onClick={check} disabled={busy}>
          {busy ? 'Please wait…' : 'I verified'}
        </button>
        <button className="btn-ghost w-full" onClick={resend} disabled={busy}>
          Resend the email
        </button>

        {msg && (
          <p
            className={`rounded-lg border p-2 text-sm font-medium ${
              ok
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {msg}
          </p>
        )}

        <button
          className="text-xs text-slate-400 hover:underline"
          onClick={async () => {
            await doSignOut();
          }}
        >
          Use a different account
        </button>
      </div>
    </div>
  );
}
