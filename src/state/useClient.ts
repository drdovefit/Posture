import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, ensureDefaultClient } from '../lib/db';

const KEY = 'posturelab-active-client';

/**
 * Tracks the currently-selected client id, persisted to localStorage, and
 * exposes the live list of clients. Ensures at least one client ("Me") exists.
 */
export function useActiveClient() {
  const clients = useLiveQuery(() => db.clients.orderBy('createdAt').toArray(), [], []);
  const [activeId, setActiveId] = useState<number | null>(() => {
    const v = localStorage.getItem(KEY);
    return v ? Number(v) : null;
  });

  useEffect(() => {
    if (!clients) return;
    // No client selected yet: create the default "Me" or pick the first one.
    if (activeId == null) {
      if (clients.length === 0) ensureDefaultClient().then((id) => setActiveId(id));
      else setActiveId(clients[0].id!);
      return;
    }
    // Selected id points at a client that no longer exists (e.g. data cleared
    // on this device, or a stale localStorage id): reconcile instead of leaving
    // the app with no usable client and Save disabled.
    if (clients.length > 0 && !clients.some((c) => c.id === activeId)) {
      setActiveId(clients[0].id!);
    } else if (clients.length === 0) {
      ensureDefaultClient().then((id) => setActiveId(id));
    }
  }, [clients, activeId]);

  useEffect(() => {
    if (activeId != null) localStorage.setItem(KEY, String(activeId));
  }, [activeId]);

  const active = clients?.find((c) => c.id === activeId) ?? null;

  return { clients: clients ?? [], activeId, active, setActiveId };
}
