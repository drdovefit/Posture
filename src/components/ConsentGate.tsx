import { useState } from 'react';
import LegalDoc from './LegalDoc';

/**
 * Blocking screen that asks the user to agree to the Terms of Service and
 * Privacy Policy before using PostureLab. It shows on first use, when a new
 * account hasn't agreed, and again after an update (when LEGAL_VERSION is
 * raised). Recording the acceptance is handled by the caller.
 */
export default function ConsentGate({
  isUpdate,
  onAccept,
}: {
  isUpdate: boolean;
  onAccept: () => void;
}) {
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState<'terms' | 'privacy' | null>(null);
  const update = isUpdate;

  function agree() {
    if (!checked) return;
    onAccept();
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-5 dark:bg-slate-950">
      <div className="card w-full max-w-md space-y-5 p-7 text-center">
        <img
          src={`${import.meta.env.BASE_URL}brand/logo-mark.png`}
          alt="PostureLab"
          className="mx-auto h-14 w-14 rounded-2xl"
        />
        <div>
          <h1 className="text-xl font-bold">
            {update ? 'We’ve updated our terms' : 'Welcome to PostureLab'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {update
              ? 'We’ve updated our Terms of Service and Privacy Policy. Please review and agree to keep using PostureLab.'
              : 'Please review and agree to our Terms of Service and Privacy Policy to use PostureLab.'}
          </p>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-left dark:border-slate-800">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-brand-500"
          />
          <span className="text-sm text-slate-600 dark:text-slate-300">
            I have read and agree to the{' '}
            <button
              type="button"
              onClick={() => setOpen('terms')}
              className="font-medium text-brand-600 underline hover:text-brand-700"
            >
              Terms of Service
            </button>{' '}
            and{' '}
            <button
              type="button"
              onClick={() => setOpen('privacy')}
              className="font-medium text-brand-600 underline hover:text-brand-700"
            >
              Privacy Policy
            </button>
            .
          </span>
        </label>

        <button
          onClick={agree}
          disabled={!checked}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          Agree and continue
        </button>

        <p className="text-xs text-slate-400">
          Tap the blue links above to read each document in full.
        </p>
      </div>

      {open && <LegalDoc doc={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
