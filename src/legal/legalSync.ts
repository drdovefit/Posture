import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../lib/firebase';

/**
 * The account's agreed legal version, stored at users/{uid}/meta/legal so it
 * follows the account across devices. Covered by the existing per-user
 * Firestore rules (a user can read and write their own users/{uid} tree).
 */
const ref = (uid: string) => doc(firestore, 'users', uid, 'meta', 'legal');

export async function fetchAccountLegalVersion(uid: string): Promise<number> {
  const snap = await getDoc(ref(uid));
  if (!snap.exists()) return 0;
  return Number((snap.data() as { version?: number }).version) || 0;
}

export async function pushAccountLegalVersion(uid: string, version: number): Promise<void> {
  await setDoc(ref(uid), { version, acceptedAt: Date.now() });
}
