import { useState } from 'react';
import { useActiveClient } from '../state/useClient';
import { createClient } from '../lib/db';

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

  return (
    <div className="flex items-center gap-1">
      <select
        value={activeId ?? ''}
        onChange={(e) => setActiveId(Number(e.target.value))}
        className="input h-9 max-w-[9rem] py-0"
        aria-label="Active client"
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
          <button className="btn-primary h-9 !px-2" onClick={add}>
            ✓
          </button>
          <button className="btn-ghost h-9 !px-2" onClick={() => setAdding(false)}>
            ✕
          </button>
        </div>
      ) : (
        <button
          className="btn-ghost h-9 w-9 !px-0"
          onClick={() => setAdding(true)}
          title="Add client"
          aria-label="Add client"
        >
          ＋
        </button>
      )}
    </div>
  );
}
