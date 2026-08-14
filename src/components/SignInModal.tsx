import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  signInWithGoogle,
  signInEmail,
  signUpEmail,
  resetPassword,
  authErrorMessage,
} from '../state/auth';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C41.6 36 44 30.5 44 24c0-1.3-.1-2.3-.4-3.5z" />
  </svg>
);

interface Props {
  title?: string;
  subtitle?: string;
  /** Called after a successful sign-in / sign-up. */
  onSignedIn: () => void;
  onClose: () => void;
}

/**
 * A focused sign-in sheet (Google + email/password) used wherever an action
 * needs an account first — e.g. saving an assessment to the cloud.
 */
export default function SignInModal({ title, subtitle, onSignedIn, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [statusOk, setStatusOk] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');

  async function handleReset() {
    if (!email.trim()) {
      setStatusOk(false);
      setStatus('Enter your email above, then tap “Forgot password?” again.');
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      await resetPassword(email.trim());
      setStatusOk(true);
      setStatus(`Password reset link sent to ${email.trim()} — check your inbox and spam.`);
    } catch (e) {
      setStatusOk(false);
      setStatus(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleGoogle() {
    setBusy(true);
    setStatus('');
    try {
      await signInWithGoogle();
      onSignedIn();
    } catch (e) {
      setStatusOk(false);
      setStatus(authErrorMessage(e));
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  async function handleEmail() {
    setBusy(true);
    setStatus('');
    try {
      if (mode === 'signup') await signUpEmail(email.trim(), password);
      else await signInEmail(email.trim(), password);
      onSignedIn();
    } catch (e) {
      setStatusOk(false);
      setStatus(authErrorMessage(e));
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="card relative w-full max-w-sm space-y-4 p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
        >
          ✕
        </button>
        <img
          src={`${import.meta.env.BASE_URL}brand/logo-mark.png`}
          alt="PostureLab"
          className="mx-auto h-12 w-12 rounded-2xl"
        />
        <div>
          <h2 className="text-lg font-bold">{title ?? 'Log in to save'}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {subtitle ?? "Don't worry — you won't get any spam."}
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
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" /> or with email
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>

        <div className="space-y-2 text-left">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="input"
          />
          <input
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEmail()}
            placeholder="Password"
            className="input"
          />
          <button className="btn-primary w-full" onClick={handleEmail} disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signup' ? 'Create account & save' : 'Sign in & save'}
          </button>
        </div>

        <div className="flex flex-col items-center gap-1">
          {mode === 'signin' && (
            <button
              className="text-xs text-brand-600 hover:underline"
              onClick={handleReset}
              disabled={busy}
            >
              Forgot password?
            </button>
          )}
          <button
            className="text-xs text-brand-600 hover:underline"
            onClick={() => {
              setMode((m) => (m === 'signup' ? 'signin' : 'signup'));
              setStatus('');
            }}
          >
            {mode === 'signup'
              ? 'Already have an account? Sign in'
              : 'New here? Create an account'}
          </button>
        </div>

        {status && (
          <p
            className={`rounded-lg border p-2 text-sm font-medium ${
              statusOk
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {status}
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
