/**
 * Records that were deleted locally after being synced, so sync can delete the
 * cloud copy too and never re-download them. Without this, a union-merge sync
 * "resurrects" deleted records from the cloud.
 */

export type TombstoneKind = 'clients' | 'assessments' | 'pain';

const KEY = 'posturelab-tombstones';

type Store = Record<TombstoneKind, string[]>;

function empty(): Store {
  return { clients: [], assessments: [], pain: [] };
}

function load(): Store {
  try {
    return { ...empty(), ...(JSON.parse(localStorage.getItem(KEY) || '{}') as Partial<Store>) };
  } catch {
    return empty();
  }
}

function save(s: Store): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable */
  }
}

/** Mark a synced record's cloud id as deleted. */
export function addTombstone(kind: TombstoneKind, cid: string): void {
  const s = load();
  if (!s[kind].includes(cid)) {
    s[kind].push(cid);
    save(s);
  }
}

/** The deleted cloud ids for a kind, as a set for quick lookup. */
export function getTombstones(kind: TombstoneKind): Set<string> {
  return new Set(load()[kind]);
}
