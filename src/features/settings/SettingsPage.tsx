import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../state/auth';
import Submissions from '../../components/Submissions';
import { submitFeedback, isOwnerEmail, type FeedbackType } from '../../lib/feedback';

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

  // --- Feedback --------------------------------------------------------------
  const [type, setType] = useState<FeedbackType>('bug');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [statusOk, setStatusOk] = useState(false);

  async function send() {
    if (!text.trim()) return;
    setBusy(true);
    setStatus('');
    try {
      await submitFeedback(type, text.trim());
      setStatusOk(true);
      setStatus('Thanks. Your note was sent.');
      setText('');
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
          {busy ? 'Sending…' : 'Send'}
        </button>
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

      {isOwner && <Submissions />}

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
