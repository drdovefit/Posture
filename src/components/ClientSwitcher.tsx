import { useState } from 'react';
import { useActiveClient } from '../state/useClient';
import { createClient, db } from '../lib/db';

export default function ClientSwitcher() {
  const { clients, activeId, setActiveId } = useActiveClient();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  async function add() {
    const n = name.trim();
    if (!n) return;
    const id = (await createClient(n)) as number;
    setActiveId(id);
    setName('');
    setAdding(false);
  }

  async function removeActive() {
    if (activeId == null || clients.length <= 1) return;
    const current = clients.find((c) => c.id === activeId);
    if (!confirm(`Delete profile "${current?.name}" and all its assessments? This can't be undone.`))
      return;
    // Remove the profile and its data.
    await db.assessments.where('clientId').equals(activeId).delete();
    await db.pain.where('clientId').equals(activeId).delete();
    await db.clients.delete(activeId);
    const next = clients.find((c) => c.id !== activeId);
    setActiveId(next?.id ?? null);
  }

  return (
    <div className="flex items-center gap-1">
      <select
        value={activeId ?? ''}
        onChange={(e) => setActiveId(Number(e.target.value))}
        className="input h-9 max-w-[9rem] py-0"
        aria-label="Active profile"
      >
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      {adding ? (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Name"
            className="input h-9 w-28 py-0"
          />
          <button className="btn-primary h-9 !px-2" onClick={add} title="Save profile">
            ✓
          </button>
          <button className="btn-ghost h-9 !px-2" onClick={() => setAdding(false)}>
            ✕
          </button>
        </div>
      ) : (
        <>
          <button
            className="btn-ghost h-9 w-9 !px-0"
            onClick={() => setAdding(true)}
            title="Add profile"
            aria-label="Add profile"
          >
            ＋
          </button>
          {clients.length > 1 && (
            <button
              className="btn-ghost h-9 w-9 !px-0 !text-red-500"
              onClick={removeActive}
              title="Delete current profile"
              aria-label="Delete current profile"
            >
              🗑
            </button>
          )}
        </>
      )}
    </div>
  );
}
