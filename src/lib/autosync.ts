import { auth } from './firebase';

/**
 * Automatic background sync. Uploads happen right after any change (debounced),
 * so edits reach the cloud within a second or two. Downloads (to catch changes
 * from another device) happen on focus and on a gentle interval. We deliberately
 * do NOT poll every few seconds: that would burn the free Firestore quota fast.
 */

let timer: ReturnType<typeof setTimeout> | null = null;
let running = false;
let pending = false;

async function run() {
  timer = null;
  const u = auth.currentUser;
  if (!u || !u.emailVerified) return;
  if (running) {
    pending = true;
    return;
  }
  running = true;
  try {
    const { syncAll } = await import('./sync');
    await syncAll(u.uid);
  } catch {
    /* offline or busy; a later change or the interval will retry */
  }
  running = false;
  if (pending) {
    pending = false;
    scheduleSync(2000);
  }
}

/** Ask for a sync soon (debounced). Called after any local change. */
export function scheduleSync(delay = 1500): void {
  if (timer) return;
  timer = setTimeout(run, delay);
}

let installed = false;

/** Install the focus and interval download triggers. Call once at startup. */
export function startAutoSync(): void {
  if (installed) return;
  installed = true;
  // Pull other-device changes periodically while the app is open.
  setInterval(() => {
    if (auth.currentUser) scheduleSync(0);
  }, 45_000);
  window.addEventListener('focus', () => {
    if (auth.currentUser) scheduleSync(400);
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && auth.currentUser) scheduleSync(400);
  });
}
