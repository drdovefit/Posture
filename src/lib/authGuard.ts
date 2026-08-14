// Client-side brute-force protection for email/password sign-in. Firebase also
// throttles server-side, but this stops repeated guesses earlier and makes the
// limit visible to the user. State is per-email in localStorage.
import { authErrorMessage } from '../state/auth';

const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000; // 15-minute lockout after too many wrong tries
const RESET_FIRST_MS = 30 * 1000; // first resend allowed after 30s
const RESET_NEXT_MS = 90 * 1000; // every resend after that: 90s

interface Rec {
  count?: number;
  lockedUntil?: number;
  resetAt?: number;
  resetCount?: number;
}

function key(email: string) {
  return `pl-authtry-${email.trim().toLowerCase()}`;
}
function read(email: string): Rec {
  try {
    return JSON.parse(localStorage.getItem(key(email)) || '{}');
  } catch {
    return {};
  }
}
function write(email: string, rec: Rec) {
  try {
    localStorage.setItem(key(email), JSON.stringify(rec));
  } catch {
    /* ignore quota / private mode */
  }
}

function lockRemaining(email: string): number {
  const r = read(email);
  return r.lockedUntil && r.lockedUntil > Date.now() ? r.lockedUntil - Date.now() : 0;
}
function attemptsLeft(email: string): number {
  return Math.max(0, MAX_ATTEMPTS - (read(email).count || 0));
}
function lockMessage(ms: number): string {
  const m = Math.ceil(ms / 60000);
  return `Too many sign-in attempts. Try again in about ${m} minute${
    m === 1 ? '' : 's'
  }, or reset your password.`;
}

/** Call before attempting sign-in; returns a message if this email is locked. */
export function preSigninBlock(email: string): string | null {
  const ms = lockRemaining(email);
  return ms > 0 ? lockMessage(ms) : null;
}

/** Clear the counter after a successful sign-in. */
export function recordSigninSuccess(email: string) {
  try {
    localStorage.removeItem(key(email));
  } catch {
    /* ignore */
  }
}

/**
 * Record a sign-in failure and return the message to show. Only wrong-credential
 * errors count toward the limit (network hiccups shouldn't lock anyone out).
 */
export function registerSigninFailure(email: string, err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  const credentialError = [
    'auth/invalid-credential',
    'auth/wrong-password',
    'auth/user-not-found',
  ].includes(code);
  if (!credentialError) return authErrorMessage(err);

  const rec = read(email);
  const count = (rec.count || 0) + 1;
  const next: Rec = { ...rec, count };
  if (count >= MAX_ATTEMPTS) next.lockedUntil = Date.now() + LOCK_MS;
  write(email, next);

  const ms = lockRemaining(email);
  if (ms > 0) return lockMessage(ms);
  const left = attemptsLeft(email);
  return `Wrong email or password. ${left} attempt${
    left === 1 ? '' : 's'
  } left before a temporary lock.`;
}

/** Milliseconds left before another reset link can be sent (0 = ready). */
export function resetCooldownRemaining(email: string): number {
  const r = read(email);
  if (!r.resetAt || !r.resetCount) return 0;
  const dur = r.resetCount <= 1 ? RESET_FIRST_MS : RESET_NEXT_MS;
  const rem = dur - (Date.now() - r.resetAt);
  return rem > 0 ? rem : 0;
}

/** Call before sending a reset email; returns a message if still cooling down. */
export function preResetBlock(email: string): string | null {
  const rem = resetCooldownRemaining(email);
  return rem > 0 ? `Please wait ${Math.ceil(rem / 1000)}s before requesting another reset link.` : null;
}

/** Record that a reset link was just sent (starts / escalates the cooldown). */
export function recordResetSent(email: string) {
  const r = read(email);
  write(email, { ...r, resetAt: Date.now(), resetCount: (r.resetCount || 0) + 1 });
}
