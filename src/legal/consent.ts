import { LEGAL_VERSION } from './documents';

/**
 * Records which version of the Terms / Privacy Policy has been agreed to.
 *
 * Consent is per identity, not just per device: each signed-in account has its
 * own key (and a synced copy on the account, see legalSync), and there's an
 * anonymous key for use without an account. Switching to an account that hasn't
 * agreed to the current version shows the consent gate again. Agreement is
 * recorded per version, so it doesn't keep popping up.
 */
const BASE = 'posturelab-legal-version';

function keyFor(uid?: string | null): string {
  return uid ? `${BASE}-${uid}` : BASE;
}

export function acceptedLegalVersion(uid?: string | null): number {
  try {
    return Number(localStorage.getItem(keyFor(uid))) || 0;
  } catch {
    return 0;
  }
}

export function hasAcceptedLegal(uid?: string | null): boolean {
  return acceptedLegalVersion(uid) >= LEGAL_VERSION;
}

/** True when this identity agreed before, but to an older version (an update). */
export function isLegalUpdate(uid?: string | null): boolean {
  const v = acceptedLegalVersion(uid);
  return v > 0 && v < LEGAL_VERSION;
}

/** Record acceptance for this identity, and always for anonymous use too, so
 *  signing out doesn't re-prompt after an account has already agreed. */
export function acceptLegal(uid?: string | null): void {
  try {
    localStorage.setItem(keyFor(uid), String(LEGAL_VERSION));
    if (uid) localStorage.setItem(keyFor(null), String(LEGAL_VERSION));
  } catch {
    /* storage unavailable */
  }
}

/** Mirror a version fetched from the account into this device's per-account key. */
export function cacheAccountLegal(uid: string, version: number): void {
  try {
    localStorage.setItem(keyFor(uid), String(version));
  } catch {
    /* storage unavailable */
  }
}
