import Dexie, { type Table } from 'dexie';
import type { Assessment, Client, PainEntry } from './types';

/**
 * Local-first storage. Everything (photos included, as Blobs) lives in the
 * browser via IndexedDB — no server, no account. The schema is kept flat and
 * id-based so a future cloud-sync tier can mirror rows without a rewrite.
 */
export class PostureDB extends Dexie {
  clients!: Table<Client, number>;
  assessments!: Table<Assessment, number>;
  pain!: Table<PainEntry, number>;

  constructor() {
    super('posturelab');
    this.version(1).stores({
      clients: '++id, name, createdAt',
      assessments: '++id, clientId, createdAt, view',
      pain: '++id, clientId, createdAt, date',
    });
  }
}

export const db = new PostureDB();

// --- Client helpers ----------------------------------------------------------

export async function createClient(name: string, dob?: string, notes?: string) {
  return db.clients.add({ name, dob, notes, createdAt: Date.now() });
}

export async function ensureDefaultClient(): Promise<number> {
  const first = await db.clients.orderBy('createdAt').first();
  if (first?.id) return first.id;
  return (await createClient('Me')) as number;
}

// --- Assessment helpers ------------------------------------------------------

export async function saveAssessment(a: Omit<Assessment, 'id'>) {
  return db.assessments.add(a as Assessment);
}

export async function assessmentsForClient(clientId: number) {
  return db.assessments.where('clientId').equals(clientId).sortBy('createdAt');
}

export async function deleteAssessment(id: number) {
  return db.assessments.delete(id);
}

// --- Pain helpers ------------------------------------------------------------

export async function addPain(entry: Omit<PainEntry, 'id'>) {
  return db.pain.add(entry as PainEntry);
}

export async function painForClient(clientId: number) {
  return db.pain.where('clientId').equals(clientId).sortBy('date');
}

export async function deletePain(id: number) {
  return db.pain.delete(id);
}
