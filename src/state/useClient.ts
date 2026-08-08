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
    if (activeId == null && clients && clients.length === 0) {
      ensureDefaultClient().then((id) => setActiveId(id));
    } else if (activeId == null && clients && clients.length > 0) {
      setActiveId(clients[0].id!);
    }
  }, [clients, activeId]);

  useEffect(() => {
    if (activeId != null) localStorage.setItem(KEY, String(activeId));
  }, [activeId]);

  const active = clients?.find((c) => c.id === activeId) ?? null;

  return { clients: clients ?? [], activeId, active, setActiveId };
}
