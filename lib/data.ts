import { getAdminDb } from "./firebase-admin";

const COLLECTION = "content";

const dataCache = new Map<string, unknown>();

export async function readData<T>(file: string): Promise<T> {
  const cached = dataCache.get(file);
  if (cached !== undefined) return cached as T;

  const promise = (async () => {
    const db = getAdminDb();
    const doc = await db.collection(COLLECTION).doc(file).get();
    return (doc.exists ? doc.data() : {}) as T;
  })();

  dataCache.set(file, promise);

  try {
    const data = await promise;
    dataCache.set(file, data);
    return data as T;
  } catch (error) {
    dataCache.delete(file);
    throw error;
  }
}

export async function writeData<T>(file: string, data: T): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTION).doc(file).set(data as Record<string, unknown>);
  dataCache.delete(file);
}
