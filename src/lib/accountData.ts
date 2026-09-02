import { db } from './db';
import { syncAll } from './sync';
import { syncProfile } from './profileSync';

const OWNER_KEY = 'posturelab-owner';

/** Remove all local scans, pain entries, clients, and sync bookkeeping. */
async function wipeLocal(): Promise<void> {
  await Promise.all([db.assessments.clear(), db.pain.clear(), db.clients.clear()]);
  try {
    localStorage.removeItem('posturelab-tombstones');
    localStorage.removeItem('posturelab-active-client');
    // The profile belongs to the account too, so it should not linger between
    // accounts; the correct one is pulled back from the cloud on sign-in.
    localStorage.removeItem('posturelab-profile');
    localStorage.removeItem('posturelab-profile-at');
    localStorage.removeItem('posturelab-profile-done');
  } catch {
    /* storage unavailable */
  }
}

/**
 * Keep local data tied to the signed-in account so one account never sees
 * another's scans on the same device. Wipes local data when the account
 * changes, or when a real account signs out, then pulls the current account's
 * data from the cloud. A first sign-in from a never-signed-in state keeps the
 * local scans and lets them upload to the new account.
 */
export async function handleAccountChange(uid: string | null): Promise<boolean> {
  let owner: string | null = null;
  try {
    owner = localStorage.getItem(OWNER_KEY);
  } catch {
    owner = null;
  }

  let hasProfile = false;
  if (uid) {
    if (owner && owner !== uid) {
      await wipeLocal(); // switched to a different account
    }
    try {
      localStorage.setItem(OWNER_KEY, uid);
    } catch {
      /* ignore */
    }
    try {
      await syncAll(uid);
    } catch {
      /* offline or rules not ready; will retry on next sign-in/sync */
    }
    try {
      hasProfile = await syncProfile(uid);
      // If a saved profile came down, don't force the first-run setup screen.
      if (hasProfile) localStorage.setItem('posturelab-profile-done', '1');
    } catch {
      /* offline; profile stays local and syncs next time */
    }
  } else if (owner) {
    // A real account signed out: clear its data so the next person can't see it.
    await wipeLocal();
    try {
      localStorage.removeItem(OWNER_KEY);
    } catch {
      /* ignore */
    }
  }
  return hasProfile;
}
