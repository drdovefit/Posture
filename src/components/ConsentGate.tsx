import { useState } from 'react';
import { createPortal } from 'react-dom';
import LegalDoc from './LegalDoc';

/**
 * Blocking overlay that asks the user to agree to the Terms of Service and
 * Privacy Policy before using PostureLab. It renders on top of the app, so the
 * dashboard shows frozen and darkened behind it. Shows on first use, when a new
 * account hasn't agreed, and again after an update (LEGAL_VERSION raised).
 * Recording the acceptance is handled by the caller.
 */
export default function ConsentGate({
  isUpdate,
  loading,
  onAccept,
}: {
  isUpdate: boolean;
  loading?: boolean;
  onAccept: () => void;
}) {
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState<'terms' | 'privacy' | null>(null);

  function agree() {
    if (checked) onAccept();
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/75 p-5 backdrop-blur-sm">
      {loading ? (
        <div className="text-sm font-medium text-slate-200">Loading…</div>
      ) : (
        <div className="card w-full max-w-md space-y-5 p-7 text-center shadow-2xl">
          <img
            src={`${import.meta.env.BASE_URL}brand/logo-mark.png`}
            alt="PostureLab"
            className="mx-auto h-14 w-14 rounded-2xl"
          />
          <div>
            <h1 className="text-xl font-bold">
              {isUpdate ? 'We’ve updated our terms' : 'One quick thing'}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {isUpdate
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
      )}

      {open && <LegalDoc doc={open} onClose={() => setOpen(null)} />}
    </div>,
    document.body,
  );
}
