import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { firestore } from './firebase';
import { db } from './db';
import { getTombstones } from './tombstones';
import type { Assessment } from './types';

/**
 * Two-way cloud sync (union merge). Local records get a stable `cid` the first
 * time they're pushed; on pull, any cloud record whose `cid` isn't local is
 * added. Photos are downscaled to a data URL so each assessment doc stays well
 * under Firestore's 1 MB limit (works on the free plan without Cloud Storage).
 */

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function blobToDataUrl(blob: Blob, maxW = 800, quality = 0.7): Promise<string> {
  const url = URL.createObjectURL(blob);
  const img = new Image();
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error('image load'));
    img.src = url;
  });
  const scale = Math.min(1, maxW / (img.naturalWidth || maxW));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round((img.naturalWidth || maxW) * scale);
  canvas.height = Math.round((img.naturalHeight || maxW) * scale);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  return canvas.toDataURL('image/jpeg', quality);
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

export interface SyncResult {
  pushed: number;
  pulled: number;
}

export async function syncAll(uid: string): Promise<SyncResult> {
  let pushed = 0;
  let pulled = 0;
  const base = ['users', uid] as const;

  // --- Clients --------------------------------------------------------------
  const clientsCol = collection(firestore, ...base, 'clients');
  const clientTombs = getTombstones('clients');
  for (const cid of clientTombs) {
    try {
      await deleteDoc(doc(clientsCol, cid));
    } catch {
      /* ignore */
    }
  }
  let clients = await db.clients.toArray();
  for (const c of clients) {
    if (c.synced) continue; // already uploaded this exact version
    if (!c.cid) {
      c.cid = uuid();
      await db.clients.update(c.id!, { cid: c.cid });
    }
    await setDoc(doc(clientsCol, c.cid), {
      cid: c.cid,
      name: c.name,
      dob: c.dob ?? null,
      notes: c.notes ?? null,
      createdAt: c.createdAt,
    });
    await db.clients.update(c.id!, { synced: true });
    pushed++;
  }
  const remoteClients = await getDocs(clientsCol);
  const localClientCids = new Set(clients.map((c) => c.cid));
  for (const d of remoteClients.docs) {
    const data = d.data() as { cid: string; name: string; dob?: string; notes?: string; createdAt: number };
    if (clientTombs.has(data.cid)) continue;
    if (!localClientCids.has(data.cid)) {
      await db.clients.add({
        name: data.name,
        dob: data.dob ?? undefined,
        notes: data.notes ?? undefined,
        createdAt: data.createdAt,
        cid: data.cid,
        synced: true,
      });
      pulled++;
    }
  }

  // Rebuild client id<->cid maps after the pull.
  clients = await db.clients.toArray();
  const idToCid = new Map<number, string>();
  const cidToId = new Map<string, number>();
  clients.forEach((c) => {
    idToCid.set(c.id!, c.cid!);
    cidToId.set(c.cid!, c.id!);
  });
  const fallbackClientId = clients[0]?.id;

  // --- Assessments ----------------------------------------------------------
  const aCol = collection(firestore, ...base, 'assessments');
  const aTombs = getTombstones('assessments');
  for (const cid of aTombs) {
    try {
      await deleteDoc(doc(aCol, cid));
    } catch {
      /* ignore */
    }
  }
  const assessments = await db.assessments.toArray();
  for (const a of assessments) {
    if (a.synced) continue; // already uploaded this exact version
    if (!a.cid) {
      a.cid = uuid();
      await db.assessments.update(a.id!, { cid: a.cid });
    }
    const imgBlob = a.annotated ?? a.photo;
    const image = imgBlob ? await blobToDataUrl(imgBlob) : null;
    await setDoc(doc(aCol, a.cid), {
      cid: a.cid,
      clientCid: idToCid.get(a.clientId) ?? null,
      createdAt: a.createdAt,
      view: a.view,
      imageWidth: a.imageWidth,
      imageHeight: a.imageHeight,
      landmarks: a.landmarks,
      metrics: a.metrics,
      score: a.score,
      image,
    });
    await db.assessments.update(a.id!, { synced: true });
    pushed++;
  }
  const remoteA = await getDocs(aCol);
  const localACids = new Set(assessments.map((a) => a.cid));
  for (const d of remoteA.docs) {
    const data = d.data() as Record<string, unknown>;
    const cid = data.cid as string;
    if (aTombs.has(cid)) continue;
    if (localACids.has(cid)) continue;
    const blob = data.image ? await dataUrlToBlob(data.image as string) : new Blob();
    const clientCid = data.clientCid as string | null;
    const clientId = (clientCid ? cidToId.get(clientCid) : undefined) ?? fallbackClientId;
    if (clientId == null) continue;
    await db.assessments.add({
      clientId,
      createdAt: data.createdAt as number,
      view: data.view as Assessment['view'],
      photo: blob,
      annotated: blob,
      imageWidth: data.imageWidth as number,
      imageHeight: data.imageHeight as number,
      landmarks: data.landmarks as Assessment['landmarks'],
      metrics: data.metrics as Assessment['metrics'],
      score: data.score as number,
      cid,
      synced: true,
    });
    pulled++;
  }

  // --- Pain -----------------------------------------------------------------
  const pCol = collection(firestore, ...base, 'pain');
  const pTombs = getTombstones('pain');
  for (const cid of pTombs) {
    try {
      await deleteDoc(doc(pCol, cid));
    } catch {
      /* ignore */
    }
  }
  const pains = await db.pain.toArray();
  for (const p of pains) {
    if (p.synced) continue; // already uploaded this exact version
    if (!p.cid) {
      p.cid = uuid();
      await db.pain.update(p.id!, { cid: p.cid });
    }
    await setDoc(doc(pCol, p.cid), {
      cid: p.cid,
      clientCid: idToCid.get(p.clientId) ?? null,
      createdAt: p.createdAt,
      date: p.date,
      region: p.region,
      severity: p.severity,
      notes: p.notes ?? null,
    });
    await db.pain.update(p.id!, { synced: true });
    pushed++;
  }
  const remoteP = await getDocs(pCol);
  const localPCids = new Set(pains.map((p) => p.cid));
  for (const d of remoteP.docs) {
    const data = d.data() as Record<string, unknown>;
    const cid = data.cid as string;
    if (pTombs.has(cid)) continue;
    if (localPCids.has(cid)) continue;
    const clientCid = data.clientCid as string | null;
    const clientId = (clientCid ? cidToId.get(clientCid) : undefined) ?? fallbackClientId;
    if (clientId == null) continue;
    await db.pain.add({
      clientId,
      createdAt: data.createdAt as number,
      date: data.date as string,
      region: data.region as string,
      severity: data.severity as number,
      notes: (data.notes as string) ?? undefined,
      cid,
      synced: true,
    });
    pulled++;
  }

  return { pushed, pulled };
}
