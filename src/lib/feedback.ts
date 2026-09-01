import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, firestore } from './firebase';

/** These accounts can read and manage feedback (also enforced by Firestore rules). */
export const OWNER_EMAILS = [
  'drdovefit@gmail.com',
  'drdoveifbbpro@gmail.com',
  'nolenp223@gmail.com',
];

export function isOwnerEmail(email?: string | null): boolean {
  return !!email && OWNER_EMAILS.includes(email.toLowerCase());
}

export type FeedbackType = 'bug' | 'feature';
export type FeedbackStatus = 'open' | 'held' | 'done';

export interface FeedbackItem {
  id: string;
  type: FeedbackType;
  text: string;
  email: string | null;
  uid: string | null;
  appVersion?: string;
  createdAt: number;
  status?: FeedbackStatus;
  resolvedMessage?: string;
  resolvedAt?: number;
  dismissedByUser?: boolean;
}

/** Messages shown to the submitter when their item is checked off. */
const BUG_DONE = [
  "Thanks for flagging that bug. It's fixed now.",
  "Good catch on that bug. It's patched.",
  'The bug you reported is gone. Thanks for the heads up.',
  'We fixed the bug you told us about. Thank you.',
  'The bug you found has been patched. Appreciate the report.',
  'Nice find. The bug you reported is sorted.',
  'The bug you flagged is fixed now. Thanks for your patience.',
  'The bug you caught is fixed. Thanks for helping us spot it.',
  'The issue you reported is sorted. Thanks for pointing it out.',
  'The bug you reported is fixed and live. Thanks for the report.',
  'We patched the bug you described. Thanks for the detail.',
  'The glitch you reported is handled now. Thanks for flagging it.',
  'We cleared up the bug you mentioned. Thanks for telling us.',
  'The bug you reported is patched. You helped make the app better.',
  'The issue you raised is resolved. Thanks a lot.',
  'We handled the bug you caught. Thank you.',
  'The bug you reported is fixed. We owe you one.',
  'The bug you reported has been dealt with. Thanks again.',
  'We patched the bug you sent in. Keep the reports coming.',
];

const FEATURE_DONE = [
  'The feature you suggested is in the app now. Thanks for it.',
  'Great suggestion. The feature you asked for is live.',
  'We added the feature you suggested. Thank you.',
  'Done. The feature you requested is in.',
  'We built the feature you suggested. Thanks for the idea.',
  'The idea you sent in made it into the app. Nice one.',
  'The feature you requested is added and live. Thanks for asking.',
  'Your feature request is live in the app now.',
  'Good call. The feature you suggested is in the app.',
  'We loved your idea, so we built it. It is live now.',
  'The feature you asked for is added. Thanks for shaping the app.',
  'Your suggestion is now part of the app. Thank you.',
  'The feature you suggested is done and live. Thanks for the idea.',
  'We took the idea you sent and built it. It is in.',
  'The feature you requested is added. Keep the ideas coming.',
  'The feature you suggested is live now. Thanks for asking.',
  'The idea you sent just went into the app. Appreciate it.',
  'We built and shipped the feature you suggested. Great idea.',
  'The feature you asked for is here now, thanks to you.',
  'We added the feature you requested. Thank you.',
];

function randomDoneMessage(type: FeedbackType): string {
  const arr = type === 'bug' ? BUG_DONE : FEATURE_DONE;
  return arr[Math.floor(Math.random() * arr.length)];
}

const col = () => collection(firestore, 'feedback');

/** Save a bug report or feature request. Works signed in or not. */
export async function submitFeedback(type: FeedbackType, text: string): Promise<void> {
  await addDoc(col(), {
    type,
    text: text.slice(0, 4000),
    email: auth.currentUser?.email ?? null,
    uid: auth.currentUser?.uid ?? null,
    appVersion: typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : null,
    createdAt: Date.now(),
    status: 'open',
    dismissedByUser: false,
  });
}

/** Owner-only: load every submission, newest first. */
export async function loadFeedback(): Promise<FeedbackItem[]> {
  const snap = await getDocs(query(col(), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FeedbackItem, 'id'>) }));
}

/** Owner: pin to top (hold) or unpin. */
export async function setHeld(id: string, held: boolean): Promise<void> {
  await updateDoc(doc(col(), id), { status: held ? 'held' : 'open' });
}

/** Owner: mark done, which shows the submitter a thank-you banner. */
export async function markDone(id: string, type: FeedbackType): Promise<void> {
  await updateDoc(doc(col(), id), {
    status: 'done',
    resolvedMessage: randomDoneMessage(type),
    resolvedAt: Date.now(),
  });
}

/** Owner: undo a done item — send it back to the To-do list and pull the
 *  submitter's thank-you banner (works even if they haven't seen it yet). */
export async function reopenFeedback(id: string): Promise<void> {
  await updateDoc(doc(col(), id), {
    status: 'open',
    resolvedMessage: deleteField(),
    resolvedAt: deleteField(),
    dismissedByUser: false,
  });
}

/** Owner: delete one submission. */
export async function removeFeedback(id: string): Promise<void> {
  await deleteDoc(doc(col(), id));
}

/** Owner: delete every submission. */
export async function removeAllFeedback(): Promise<void> {
  const all = await loadFeedback();
  await Promise.all(all.map((it) => deleteDoc(doc(col(), it.id))));
}

/** Submitter: their own resolved-and-not-yet-dismissed items, for the banner. */
export async function loadMyResolved(uid: string): Promise<FeedbackItem[]> {
  const snap = await getDocs(query(col(), where('uid', '==', uid)));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<FeedbackItem, 'id'>) }))
    .filter((it) => it.status === 'done' && !it.dismissedByUser);
}

/** Submitter: dismiss their thank-you banner. */
export async function dismissResolved(id: string): Promise<void> {
  await updateDoc(doc(col(), id), { dismissedByUser: true });
}
