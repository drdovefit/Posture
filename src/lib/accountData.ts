import { db } from './db';
import { syncAll } from './sync';

const OWNER_KEY = 'posturelab-owner';

/** Remove all local scans, pain entries, clients, and sync bookkeeping. */
async function wipeLocal(): Promise<void> {
  await Promise.all([db.assessments.clear(), db.pain.clear(), db.clients.clear()]);
  try {
    localStorage.removeItem('posturelab-tombstones');
    localStorage.removeItem('posturelab-active-client');
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
export async function handleAccountChange(uid: string | null): Promise<void> {
  let owner: string | null = null;
  try {
    owner = localStorage.getItem(OWNER_KEY);
  } catch {
    owner = null;
  }

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
  } else if (owner) {
    // A real account signed out: clear its data so the next person can't see it.
    await wipeLocal();
    try {
      localStorage.removeItem(OWNER_KEY);
    } catch {
      /* ignore */
    }
  }
}
