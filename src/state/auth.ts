import { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => onAuthStateChanged(auth, (u) => {
    setUser(u);
    setReady(true);
  }), []);
  return { user, ready };
}

/** Sign in with Google. Popup works from a tap on iOS; fall back to redirect. */
export async function signInWithGoogle() {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? '';
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await signInWithRedirect(auth, googleProvider);
      return;
    }
    throw err;
  }
}

export async function signInEmail(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signUpEmail(email: string, password: string) {
  await createUserWithEmailAndPassword(auth, email, password);
}

/** Email the user a link to reset their password. */
export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

/** Turn a Firebase auth error code into a friendly message. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address doesn’t look right.';
    case 'auth/missing-password':
    case 'auth/weak-password':
      return 'Use a password of at least 6 characters.';
    case 'auth/email-already-in-use':
      return 'That email already has an account — try signing in instead.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Wrong email or password.';
    case 'auth/unauthorized-domain':
      return 'This site isn’t authorized for Google sign-in yet. Add its domain in Firebase → Authentication → Settings → Authorized domains.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in isn’t turned on for this project yet (Firebase → Authentication → Sign-in method).';
    case 'auth/popup-blocked':
    case 'auth/cancelled-popup-request':
      return 'Your browser blocked the sign-in popup — allow popups for this site and try again.';
    case 'auth/popup-closed-by-user':
      return 'The Google window was closed before sign-in finished.';
    case 'auth/too-many-requests':
      return 'Too many attempts. This account is temporarily paused — wait a bit or reset your password.';
    case 'auth/network-request-failed':
      return 'Network problem — check your connection and try again.';
    default:
      return 'Sign-in failed. Please try again.';
  }
}

export async function doSignOut() {
  await signOut(auth);
}

/** Update the signed-in user's display name. */
export async function updateDisplayName(name: string) {
  if (!auth.currentUser) return;
  await updateProfile(auth.currentUser, { displayName: name });
}
