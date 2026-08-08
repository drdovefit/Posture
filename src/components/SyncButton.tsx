import { useState } from 'react';

/**
 * Header sign-in entry point. Cross-device cloud sync requires a backend
 * (auth + database), which is being set up. Until it's live, this button
 * explains the current local-first behavior so the affordance exists without
 * pretending to sign the user in.
 */
export default function SyncButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-ghost h-9" onClick={() => setOpen(true)}>
        Sign in
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="card w-full max-w-md space-y-3 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold">Cloud sync &amp; sign-in</h2>
            <p className="text-sm text-slate-500">
              Right now everything you save stays privately on this device. To
              sign in and sync your profiles, assessments and photos across
              devices, PostureLab needs a secure cloud account — that piece is
              being set up now.
            </p>
            <ul className="list-inside list-disc text-sm text-slate-500">
              <li>Your data will stay private to your account.</li>
              <li>Nothing you save today is lost — it will sync up once enabled.</li>
            </ul>
            <button className="btn-primary w-full" onClick={() => setOpen(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
