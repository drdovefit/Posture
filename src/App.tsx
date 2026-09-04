import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import SyncButton from './components/SyncButton';
import FeedbackBanner from './components/FeedbackBanner';
import VerifyEmailGate from './components/VerifyEmailGate';
import ConsentGate from './components/ConsentGate';
import LegalDoc from './components/LegalDoc';
import { LEGAL_VERSION } from './legal/documents';
import { hasAcceptedLegal, isLegalUpdate, acceptLegal, cacheAccountLegal } from './legal/consent';
import { TierProvider } from './lib/entitlement';
import { fetchAccountLegalVersion, pushAccountLegalVersion } from './legal/legalSync';
import { useAuth } from './state/auth';
import { handleAccountChange } from './lib/accountData';
import { startAutoSync } from './lib/autosync';

const nav = [
  { to: '/', label: 'Dashboard', icon: '◱', end: true },
  { to: '/analyze', label: 'Analyze', icon: '＋' },
  { to: '/history', label: 'History', icon: '≣' },
  { to: '/compare', label: 'Compare', icon: '⇄' },
  { to: '/pain', label: 'Pain diary', icon: '♥' },
  { to: '/guide', label: 'Guide', icon: '?' },
];

export default function App() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const promptedRef = useRef(false);
  const accountRef = useRef<string | null | undefined>(undefined);
  const [agreed, setAgreed] = useState(() => hasAcceptedLegal(null));
  const [checkingLegal, setCheckingLegal] = useState(false);
  const [legalOpen, setLegalOpen] = useState<'terms' | 'privacy' | null>(null);

  // Consent is per account, not per device. Re-check whenever the signed-in
  // account changes: use this identity's local record first, then confirm
  // against the account's synced record so a different account is re-prompted.
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    const uid = user?.uid ?? null;
    const local = hasAcceptedLegal(uid);
    setAgreed(local);
    if (uid && !local) {
      setCheckingLegal(true);
      fetchAccountLegalVersion(uid)
        .then((v) => {
          if (!alive) return;
          if (v >= LEGAL_VERSION) {
            cacheAccountLegal(uid, v);
            setAgreed(true);
          }
        })
        .catch(() => {})
        .finally(() => alive && setCheckingLegal(false));
    } else if (uid && local) {
      // Make sure the account carries what this device already accepted.
      pushAccountLegalVersion(uid, LEGAL_VERSION).catch(() => {});
    }
    return () => {
      alive = false;
    };
  }, [ready, user]);

  function acceptLegalNow() {
    const uid = user?.uid ?? null;
    acceptLegal(uid);
    if (uid) pushAccountLegalVersion(uid, LEGAL_VERSION).catch(() => {});
    setAgreed(true);
  }

  useEffect(() => {
    startAutoSync();
  }, []);

  // Tie local data to the signed-in account: wipe and re-pull when the account
  // changes or signs out, so one account never sees another's data here. After
  // the account's data (including the saved profile) is synced, send only a
  // brand-new user — one with no saved "About you" — to the profile setup;
  // everyone else lands on the dashboard.
  useEffect(() => {
    if (!ready) return;
    const uid = user?.uid ?? null;
    if (accountRef.current === uid) return;
    accountRef.current = uid;
    let alive = true;
    (async () => {
      // hasProfile reflects the ACCOUNT's saved "About you", not local storage
      // (which can linger between accounts). A new account with nothing saved
      // opens the profile setup; once they Save, it never forces it again.
      const hasProfile = await handleAccountChange(uid);
      if (!alive || !uid || promptedRef.current) return;
      promptedRef.current = true;
      if (!hasProfile) navigate('/profile');
    })();
    if (!uid) promptedRef.current = false;
    return () => {
      alive = false;
    };
  }, [ready, user, navigate]);

  // Still checking who's signed in.
  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-400 dark:bg-slate-950">
        Loading…
      </div>
    );
  }

  // Signed in but not verified: the verify screen. Signed-out visitors can
  // browse the app; signing in is required only to scan (see AnalyzePage).
  if (user && !user.emailVerified) {
    return <VerifyEmailGate email={user.email} />;
  }

  return (
    <TierProvider>
    <div className="mx-auto flex min-h-full max-w-6xl flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex items-center gap-3 px-4 py-3">
          <NavLink to="/" className="flex items-center">
            <img
              src={`${import.meta.env.BASE_URL}brand/wordmark.png`}
              alt="Posture Lab"
              className="h-11 w-auto sm:h-14"
            />
          </NavLink>
          <div className="ml-auto flex items-center gap-2">
            <SyncButton />
            <NavLink
              to="/settings"
              aria-label="Settings"
              title="Settings"
              className={({ isActive }) =>
                `grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors ${
                  isActive
                    ? 'bg-brand-500 text-white'
                    : 'text-slate-500 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </NavLink>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-500 text-white'
                    : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              <span className="mr-1.5 opacity-70">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <FeedbackBanner />

      <main key={loc.pathname} className="flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-400 dark:border-slate-800">
        <button onClick={() => setLegalOpen('terms')} className="hover:text-brand-600 hover:underline">
          Terms of Service
        </button>
        <span className="mx-1">·</span>
        <button onClick={() => setLegalOpen('privacy')} className="hover:text-brand-600 hover:underline">
          Privacy Policy
        </button>
        <span className="mx-1">·</span>
        <span title="App version">Version {__APP_VERSION__}</span>
      </footer>

      {legalOpen && <LegalDoc doc={legalOpen} onClose={() => setLegalOpen(null)} />}

      {/* Terms/Privacy consent for signed-in accounts, over a darkened, frozen
          dashboard. Anonymous visitors browse first and agree when they sign in. */}
      {user && !agreed && (
        <ConsentGate
          isUpdate={isLegalUpdate(user.uid)}
          loading={checkingLegal}
          onAccept={acceptLegalNow}
        />
      )}
    </div>
    </TierProvider>
  );
}
