import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from './firebase';
import { useAuth } from '../state/auth';
import { isOwnerEmail } from './feedback';

/**
 * Free vs Pro. A user is Pro when:
 *   - they are one of the owner accounts, or
 *   - the global testing switch (config/flags.proForAll) is on, or
 *   - their email is on the proMembers list with active = true (fed from Skool
 *     via Zapier).
 * Owners can flip a local "preview free" switch to see the free experience.
 */
export type Tier = 'free' | 'pro';

const PREVIEW_KEY = 'posturelab-preview-free';

interface TierCtx {
  tier: Tier;
  isPro: boolean;
  ready: boolean;
  /** Owner-only: viewing the app as a free user would see it. */
  previewFree: boolean;
  setPreviewFree: (v: boolean) => void;
  /** Whether this account may use the preview toggle (owners only). */
  canPreview: boolean;
}

const Ctx = createContext<TierCtx>({
  tier: 'free',
  isPro: false,
  ready: false,
  previewFree: false,
  setPreviewFree: () => {},
  canPreview: false,
});

export function TierProvider({ children }: { children: ReactNode }) {
  const { user, ready: authReady } = useAuth();
  const owner = isOwnerEmail(user?.email);
  const [real, setReal] = useState<Tier>('free');
  const [ready, setReady] = useState(false);
  const [previewFree, setPreviewState] = useState(() => {
    try {
      return localStorage.getItem(PREVIEW_KEY) === '1';
    } catch {
      return false;
    }
  });

  function setPreviewFree(v: boolean) {
    setPreviewState(v);
    try {
      if (v) localStorage.setItem(PREVIEW_KEY, '1');
      else localStorage.removeItem(PREVIEW_KEY);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!authReady) return;
      setReady(false);
      if (!user) {
        if (alive) {
          setReal('free');
          setReady(true);
        }
        return;
      }
      if (owner) {
        if (alive) {
          setReal('pro');
          setReady(true);
        }
        return;
      }
      let pro = false;
      try {
        const flags = await getDoc(doc(firestore, 'config', 'flags'));
        if ((flags.data() as { proForAll?: boolean } | undefined)?.proForAll) pro = true;
      } catch {
        /* no flags doc / offline */
      }
      if (!pro && user.email) {
        try {
          const m = await getDoc(doc(firestore, 'proMembers', user.email));
          if ((m.data() as { active?: boolean } | undefined)?.active) pro = true;
        } catch {
          /* not on the list / offline */
        }
      }
      if (alive) {
        setReal(pro ? 'pro' : 'free');
        setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [authReady, user, owner]);

  const tier: Tier = previewFree ? 'free' : real;

  return (
    <Ctx.Provider
      value={{
        tier,
        isPro: tier === 'pro',
        ready,
        previewFree,
        setPreviewFree,
        canPreview: owner,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useTier(): TierCtx {
  return useContext(Ctx);
}
