import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../state/auth';
import Submissions from '../../components/Submissions';
import SignInModal from '../../components/SignInModal';
import { submitFeedback, isOwnerEmail, type FeedbackType } from '../../lib/feedback';
import { useTier } from '../../lib/entitlement';

const DRAFT_KEY = 'posturelab-feedback-draft';

function loadDraft(): { type: FeedbackType; text: string } {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    return {
      type: d.type === 'feature' ? 'feature' : 'bug',
      text: typeof d.text === 'string' ? d.text : '',
    };
  } catch {
    return { type: 'bug', text: '' };
  }
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
        active
          ? 'bg-brand-500 text-white'
          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
      }`}
    >
      {children}
    </button>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const isOwner = isOwnerEmail(user?.email);
  const { isPro, previewFree, setPreviewFree, canPreview } = useTier();

  // --- Feedback --------------------------------------------------------------
  const initialDraft = loadDraft();
  const [type, setType] = useState<FeedbackType>(initialDraft.type);
  const [text, setText] = useState(initialDraft.text);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [statusOk, setStatusOk] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  // Keep the draft so it survives signing in (which may bounce through the
  // profile setup) and page reloads — it's waiting when they come back.
  useEffect(() => {
    try {
      if (text.trim()) localStorage.setItem(DRAFT_KEY, JSON.stringify({ type, text }));
      else localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* storage unavailable */
    }
  }, [type, text]);

  async function send() {
    if (!text.trim()) return;
    // Sending requires an account so we can reach you when it's resolved.
    if (!user) {
      setShowSignIn(true);
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      await submitFeedback(type, text.trim());
      setStatusOk(true);
      setStatus('Thanks. Your note was sent.');
      setText('');
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
    } catch {
      setStatusOk(false);
      setStatus('Could not send right now. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Membership</h2>
            <p className="mt-1 text-sm text-slate-500">
              {isPro ? "You're on Pro — everything unlocked." : "You're on the free plan."}
            </p>
          </div>
          <span
            className={`chip ${
              isPro
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {isPro ? 'Pro' : 'Free'}
          </span>
        </div>
        <Link to="/subscribe" className="btn-primary mt-3 inline-block">
          {isPro ? 'View plan' : 'Upgrade to Pro'}
        </Link>
        {canPreview && (
          <label className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-sm text-slate-500 dark:border-slate-800">
            <input
              type="checkbox"
              checked={previewFree}
              onChange={(e) => setPreviewFree(e.target.checked)}
              className="h-4 w-4 accent-brand-500"
            />
            Preview the free experience (owner only)
          </label>
        )}
      </div>

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
        <h2 className="mb-1 font-semibold">About you</h2>
        <p className="text-sm text-slate-500">
          Personalize your posture ranges to your body.
        </p>
        <Link to="/profile" className="btn-ghost mt-3 inline-block">
          Open
        </Link>
      </div>

      {/* Feedback ----------------------------------------------------------- */}
      <div className="card space-y-3 p-5">
        <h2 className="font-semibold">Report a bug or request a feature</h2>
        <div className="flex gap-2">
          <Chip active={type === 'bug'} onClick={() => setType('bug')}>Report a bug</Chip>
          <Chip active={type === 'feature'} onClick={() => setType('feature')}>Request a feature</Chip>
        </div>
        <textarea
          className="input min-h-[7rem] w-full"
          maxLength={4000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            type === 'bug'
              ? 'What went wrong? What were you doing when it happened?'
              : 'What would you like the app to do?'
          }
        />
        <button className="btn-primary w-full" onClick={send} disabled={busy || !text.trim()}>
          {busy
            ? 'Sending…'
            : user
              ? type === 'bug'
                ? 'Report'
                : 'Request'
              : 'Log in to send'}
        </button>
        {!user && text.trim() && (
          <p className="text-xs text-slate-400">
            Log in to send this. Your note stays here, ready to go.
          </p>
        )}
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

      {showSignIn && (
        <SignInModal
          title="Log in to send"
          subtitle="Sign in so we can let you know once it's handled."
          onSignedIn={() => setShowSignIn(false)}
          onClose={() => setShowSignIn(false)}
        />
      )}

      {isOwner && <Submissions />}

      <div className="card p-5">
        <h2 className="mb-1 font-semibold">About</h2>
        <p className="text-sm text-slate-500">
          New to PostureLab?{' '}
          <Link to="/guide" className="text-brand-600 hover:underline">
            See the guide
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
