import { addDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { auth, firestore } from './firebase';

/** Only this account can read submitted feedback (enforced by Firestore rules). */
export const OWNER_EMAIL = 'drdovefit@gmail.com';

export type FeedbackType = 'bug' | 'feature';

export interface FeedbackItem {
  id: string;
  type: FeedbackType;
  text: string;
  email: string | null;
  appVersion?: string;
  createdAt: number;
}

/** Save a bug report or feature request. Works signed in or not. */
export async function submitFeedback(type: FeedbackType, text: string): Promise<void> {
  await addDoc(collection(firestore, 'feedback'), {
    type,
    text: text.slice(0, 4000),
    email: auth.currentUser?.email ?? null,
    uid: auth.currentUser?.uid ?? null,
    appVersion: typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : null,
    createdAt: Date.now(),
  });
}

/** Owner-only: load every submission, newest first. */
export async function loadFeedback(): Promise<FeedbackItem[]> {
  const q = query(collection(firestore, 'feedback'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FeedbackItem, 'id'>) }));
}
