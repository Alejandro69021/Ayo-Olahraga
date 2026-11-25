/**
 * Penyimpanan lokal terpisah untuk Program Builder (IndexedDB: "ayo_programs_db" v1).
 * Murni tanpa React/DOM agar aman dites di vitest (node + fake-indexeddb) maupun browser.
 */
import type { UserProfile, ProgramPlan, ProgressionState } from "./program-types";

const DB_NAME = "ayo_programs_db";
const DB_VERSION = 1;
const STORE_PROFILE = "profile";
const STORE_PLANS = "plans";
const STORE_PROGRESSION = "progression";

function getIndexedDB(): IDBFactory | undefined {
  if (typeof globalThis !== "undefined" && globalThis.indexedDB) {
    return globalThis.indexedDB;
  }
  return undefined;
}

function openProgramDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const idb = getIndexedDB();
      if (!idb) {
        resolve(null);
        return;
      }

      const request = idb.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_PROFILE)) {
          db.createObjectStore(STORE_PROFILE, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_PLANS)) {
          db.createObjectStore(STORE_PLANS, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_PROGRESSION)) {
          db.createObjectStore(STORE_PROGRESSION, { keyPath: "exerciseId" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function runIdb<T>(
  storeName: string,
  mode: IDBTransactionMode,
  executor: (store: IDBObjectStore, setResult: (value: T | null) => void) => void
): Promise<T | null> {
  const db = await openProgramDB();
  if (!db) return null;

  return new Promise<T | null>((resolve) => {
    try {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      let result: T | null = null;

      executor(store, (value) => {
        result = value;
      });

      tx.oncomplete = () => {
        db.close();
        resolve(result);
      };
      tx.onerror = () => {
        db.close();
        resolve(null);
      };
      tx.onabort = () => {
        db.close();
        resolve(null);
      };
    } catch {
      try {
        db.close();
      } catch {}
      resolve(null);
    }
  });
}

export async function saveProfile(profile: UserProfile): Promise<UserProfile | null> {
  const normalized: UserProfile = { ...profile, id: "me" };
  return runIdb<UserProfile>(STORE_PROFILE, "readwrite", (store, setResult) => {
    store.put(normalized);
    setResult(normalized);
  });
}

export async function getProfile(): Promise<UserProfile | null> {
  return runIdb<UserProfile>(STORE_PROFILE, "readonly", (store, setResult) => {
    const req = store.get("me");
    req.onsuccess = () => {
      setResult((req.result as UserProfile | undefined) ?? null);
    };
  });
}

export async function savePlan(plan: ProgramPlan): Promise<ProgramPlan | null> {
  return runIdb<ProgramPlan>(STORE_PLANS, "readwrite", (store, setResult) => {
    store.put(plan);
    setResult(plan);
  });
}

export async function listPlans(): Promise<ProgramPlan[] | null> {
  return runIdb<ProgramPlan[]>(STORE_PLANS, "readonly", (store, setResult) => {
    const req = store.getAll();
    req.onsuccess = () => {
      const plans = (req.result as ProgramPlan[] | undefined) ?? [];
      setResult([...plans].sort((a, b) => b.createdAt - a.createdAt));
    };
  });
}

export async function getActivePlan(): Promise<ProgramPlan | null> {
  const plans = await listPlans();
  if (!plans || plans.length === 0) {
    return null;
  }
  return plans[0];
}

export async function deletePlan(id: string): Promise<boolean | null> {
  return runIdb<boolean>(STORE_PLANS, "readwrite", (store, setResult) => {
    store.delete(id);
    setResult(true);
  });
}

export async function saveProgression(
  state: ProgressionState
): Promise<ProgressionState | null> {
  return runIdb<ProgressionState>(STORE_PROGRESSION, "readwrite", (store, setResult) => {
    store.put(state);
    setResult(state);
  });
}

export async function getProgression(
  exerciseId: string
): Promise<ProgressionState | null> {
  return runIdb<ProgressionState>(STORE_PROGRESSION, "readonly", (store, setResult) => {
    const req = store.get(exerciseId);
    req.onsuccess = () => {
      setResult((req.result as ProgressionState | undefined) ?? null);
    };
  });
}
