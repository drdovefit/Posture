import { LEGAL_VERSION } from './documents';

/**
 * Records which version of the Terms / Privacy Policy this device has agreed to.
 * When LEGAL_VERSION goes up, the stored value falls behind and the consent gate
 * shows again — so people agree once per version, not on every visit.
 */
const KEY = 'posturelab-legal-version';

export function acceptedLegalVersion(): number {
  try {
    return Number(localStorage.getItem(KEY)) || 0;
  } catch {
    return 0;
  }
}

export function hasAcceptedLegal(): boolean {
  return acceptedLegalVersion() >= LEGAL_VERSION;
}

/** True when they've agreed before, but to an older version (an update). */
export function isLegalUpdate(): boolean {
  const v = acceptedLegalVersion();
  return v > 0 && v < LEGAL_VERSION;
}

export function acceptLegal(): void {
  try {
    localStorage.setItem(KEY, String(LEGAL_VERSION));
  } catch {
    /* storage unavailable */
  }
}
