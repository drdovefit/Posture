import { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
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
    default:
      return 'Something went wrong. Please try again.';
  }
}

export async function doSignOut() {
  await signOut(auth);
}
