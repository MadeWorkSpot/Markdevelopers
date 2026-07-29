import { getAdminDb } from "./firebase-admin";

const COLLECTION = "content";

export async function readData<T>(file: string): Promise<T> {
  const db = getAdminDb();
  const doc = await db.collection(COLLECTION).doc(file).get();
  return (doc.exists ? doc.data() : {}) as T;
}

export async function writeData<T>(file: string, data: T): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTION).doc(file).set(data as Record<string, unknown>);
}
