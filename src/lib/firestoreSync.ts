import { useEffect, useRef, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  deleteDoc,
  writeBatch,
  QueryConstraint,
} from 'firebase/firestore';
import { getFirebaseDb, friendlyFirebaseError } from './firebase';

type Item = { id: string } & Record<string, any>;

function sortKeys(value: any): any {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const k of Object.keys(value).sort()) out[k] = sortKeys(value[k]);
    return out;
  }
  return value;
}

/** Order-independent string used to compare local and remote versions of a document. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

/** Document body for Firestore: no `id` (it is the doc id), no undefined values, no excluded fields. */
export function toDocData(item: Record<string, any>, exclude: string[] = []): Record<string, any> {
  const copy = JSON.parse(JSON.stringify(item)); // drops undefined / functions
  delete copy.id;
  for (const f of exclude) delete copy[f];
  return copy;
}

function sortKey(item: Record<string, any>): string {
  return String(item.createdAt ?? item.timestamp ?? item.updatedAt ?? item.dateTime ?? '');
}

function sortNewestFirst<T extends Record<string, any>>(list: T[]): T[] {
  return [...list].sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
}

interface SyncOptions<T extends Item> {
  /** Firestore collection name */
  name: string;
  items: T[];
  setItems: (items: T[]) => void;
  /** Sync only runs when true (Firebase configured + user logged in). */
  enabled: boolean;
  /** Propagate local deletions to Firestore. */
  allowDelete?: boolean;
  /** Push local changes to Firestore (false = read only for this user). */
  allowWrite?: boolean;
  constraints?: QueryConstraint[];
  /** Fields never written to Firestore (e.g. passwords). */
  exclude?: string[];
  onError: (message: string) => void;
}

/**
 * Keeps a local React state array in sync with a Firestore collection.
 *  - Remote changes (onSnapshot) are merged into the local array.
 *  - Local changes (add / edit / delete) are diffed against the last known remote
 *    state and written to Firestore.
 * Existing add/update/delete functions in the app therefore keep working unchanged.
 * Nothing is written until the first snapshot has arrived, so stale local (demo)
 * data can never overwrite the cloud database.
 */
export function useCollectionSync<T extends Item>(opts: SyncOptions<T>): { loaded: boolean } {
  const { name, items, enabled, allowDelete = false, allowWrite = true } = opts;
  const [loaded, setLoaded] = useState(false);

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const setItemsRef = useRef(opts.setItems);
  setItemsRef.current = opts.setItems;
  const onErrorRef = useRef(opts.onError);
  onErrorRef.current = opts.onError;
  const excludeRef = useRef(opts.exclude || []);
  const constraintsRef = useRef(opts.constraints || []);
  const remoteRef = useRef<Map<string, string>>(new Map());
  const firstSnapshotRef = useRef(true);

  // ---- Firestore -> local state
  useEffect(() => {
    if (!enabled) {
      setLoaded(false);
      firstSnapshotRef.current = true;
      return;
    }
    const db = getFirebaseDb();
    if (!db) return;

    const q = query(collection(db, name), ...constraintsRef.current);
    const unsub = onSnapshot(
      q,
      (snap) => {
        const remote = new Map<string, string>();
        const remoteItems = new Map<string, T>();
        snap.docs.forEach((d) => {
          const data = d.data();
          remote.set(d.id, stableStringify(toDocData(data, excludeRef.current)));
          remoteItems.set(d.id, { ...data, id: d.id } as unknown as T);
        });
        remoteRef.current = remote;

        const cur = itemsRef.current;
        if (firstSnapshotRef.current) {
          firstSnapshotRef.current = false;
          setItemsRef.current(sortNewestFirst(Array.from(remoteItems.values())));
        } else {
          // keep the local order; remote-only docs are added on top, remote deletions removed
          const pending = new Map(remoteItems);
          const merged: T[] = [];
          let changed = false;
          for (const c of cur) {
            const r = pending.get(c.id);
            if (!r) {
              changed = true; // deleted remotely (or local item not yet written)
              continue;
            }
            pending.delete(c.id);
            const same = stableStringify(toDocData(c, excludeRef.current)) === remote.get(c.id);
            if (same) {
              merged.push(c);
            } else {
              merged.push(r);
              changed = true;
            }
          }
          const added = sortNewestFirst(Array.from(pending.values()));
          if (added.length) changed = true;
          if (changed) setItemsRef.current([...added, ...merged]);
        }
        setLoaded(true);
      },
      (err) => {
        onErrorRef.current(`${name}: ${friendlyFirebaseError(err)}`);
      }
    );
    return () => unsub();
  }, [enabled, name]);

  // ---- local state -> Firestore
  useEffect(() => {
    if (!enabled || !loaded || !allowWrite) return;
    const db = getFirebaseDb();
    if (!db) return;
    const remote = remoteRef.current;
    const seen = new Set<string>();

    for (const item of items) {
      if (!item || !item.id) continue;
      seen.add(item.id);
      const data = toDocData(item, excludeRef.current);
      const s = stableStringify(data);
      if (remote.get(item.id) !== s) {
        remote.set(item.id, s);
        setDoc(doc(db, name, item.id), data).catch((e) => {
          remote.delete(item.id);
          onErrorRef.current(`Could not save to "${name}": ${friendlyFirebaseError(e)}`);
        });
      }
    }

    if (allowDelete) {
      for (const id of Array.from(remote.keys())) {
        if (!seen.has(id)) {
          const prev = remote.get(id);
          remote.delete(id);
          deleteDoc(doc(db, name, id)).catch((e) => {
            if (prev !== undefined) remote.set(id, prev);
            onErrorRef.current(`Could not delete from "${name}": ${friendlyFirebaseError(e)}`);
          });
        }
      }
    }
  }, [items, enabled, loaded, allowWrite, allowDelete, name]);

  return { loaded };
}

/** localStorage keys used by the offline mode -> Firestore collection names */
const LOCAL_TO_COLLECTION: Array<[string, string]> = [
  ['bj_clients', 'clients'],
  ['bj_jobs', 'jobs'],
  ['bj_candidates', 'candidates'],
  ['bj_pipeline', 'pipeline'],
  ['bj_interviews', 'interviews'],
  ['bj_reminders', 'reminders'],
  ['bj_edit_histories', 'editHistories'],
  ['bj_activities', 'activities'],
  ['bj_export_logs', 'exportLogs'],
  ['bj_import_logs', 'importLogs'],
];

export function countLocalData(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, col] of LOCAL_TO_COLLECTION) {
    try {
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      if (Array.isArray(arr) && arr.length) out[col] = arr.length;
    } catch {
      /* ignore */
    }
  }
  return out;
}

/** One-time upload of the data saved in this browser (offline mode) into Firestore. Admin only. */
export async function uploadLocalDataToFirestore(
  onProgress?: (done: number, total: number) => void
): Promise<Record<string, number>> {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase is not connected.');

  const jobs: Array<{ col: string; id: string; data: Record<string, any> }> = [];
  for (const [key, col] of LOCAL_TO_COLLECTION) {
    try {
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(arr)) continue;
      for (const item of arr) {
        if (item && item.id) jobs.push({ col, id: String(item.id), data: toDocData(item) });
      }
    } catch {
      /* ignore */
    }
  }

  const counts: Record<string, number> = {};
  let done = 0;
  const BATCH = 400;
  for (let i = 0; i < jobs.length; i += BATCH) {
    const batch = writeBatch(db);
    for (const j of jobs.slice(i, i + BATCH)) {
      batch.set(doc(db, j.col, j.id), j.data);
      counts[j.col] = (counts[j.col] || 0) + 1;
    }
    await batch.commit();
    done = Math.min(i + BATCH, jobs.length);
    onProgress?.(done, jobs.length);
  }
  return counts;
}
