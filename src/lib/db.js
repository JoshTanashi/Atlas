import { openDB } from 'idb';

const DB_NAME = 'atlas-cache';
const DB_VERSION = 2;

const STORES = ['events', 'income', 'accounts', 'debts', 'goals', 'corrections', 'recurringExpenses'];

let dbPromise;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const store of STORES) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id' });
          }
        }
      },
    });
  }
  return dbPromise;
}

export async function getAll(store) {
  const db = await getDb();
  return db.getAll(store);
}

export async function put(store, row) {
  const db = await getDb();
  return db.put(store, row);
}

export async function putAll(store, rows) {
  const db = await getDb();
  const tx = db.transaction(store, 'readwrite');
  await Promise.all(rows.map((row) => tx.store.put(row)));
  await tx.done;
}

export async function remove(store, id) {
  const db = await getDb();
  return db.delete(store, id);
}

export async function replaceAll(store, rows) {
  const db = await getDb();
  const tx = db.transaction(store, 'readwrite');
  await tx.store.clear();
  await Promise.all(rows.map((row) => tx.store.put(row)));
  await tx.done;
}

export async function clearAllCaches() {
  const db = await getDb();
  await Promise.all(STORES.map((store) => db.clear(store)));
}
