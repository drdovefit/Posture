import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, firestore } from './firebase';
import {
  getProfile,
  getProfileUpdatedAt,
  isProfileEmpty,
  setProfileFromCloud,
  type Profile,
} from './profile';

/** The profile lives at users/{uid}/meta/profile so it follows the account. */
const ref = (uid: string) => doc(firestore, 'users', uid, 'meta', 'profile');

type Stored = Profile & { updatedAt?: number };

/** Upload the current local profile to the signed-in account. */
export async function pushProfile(uid?: string | null): Promise<void> {
  const id = uid ?? auth.currentUser?.uid;
  if (!id) return;
  await setDoc(ref(id), { ...getProfile(), updatedAt: getProfileUpdatedAt() || Date.now() });
}

/**
 * Reconcile the local profile with the account's copy on sign-in.
 * Last edit wins: if the cloud copy is newer it replaces the local one; if the
 * local copy is newer (or the cloud has none) the local copy is uploaded.
 * Returns true if a non-empty profile is present afterward.
 */
export async function syncProfile(uid: string): Promise<boolean> {
  let cloud: Stored | null = null;
  try {
    const snap = await getDoc(ref(uid));
    if (snap.exists()) cloud = snap.data() as Stored;
  } catch {
    return !isProfileEmpty(getProfile()); // offline: keep whatever is local
  }

  const localAt = getProfileUpdatedAt();
  const cloudAt = cloud?.updatedAt ?? 0;

  if (cloud && cloudAt >= localAt) {
    const { updatedAt, ...profile } = cloud;
    setProfileFromCloud(profile, updatedAt ?? Date.now());
    return !isProfileEmpty(profile);
  }

  // Local is newer, or the cloud has nothing yet: push local up.
  if (!isProfileEmpty(getProfile())) {
    try {
      await pushProfile(uid);
    } catch {
      /* will retry on next sign-in */
    }
  }
  return !isProfileEmpty(getProfile());
}
