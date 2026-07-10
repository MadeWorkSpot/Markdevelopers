import { getAdminDb } from "./firebase-admin";

const COLLECTION = "content";

export async function readData<T>(file: string): Promise<T> {
  try {
    const db = getAdminDb();
    const doc = await db.collection(COLLECTION).doc(file).get();
    return ((doc.exists ? doc.data() : {}) as T);
  } catch (error) {
    console.error(`Failed to read "${file}" from Firestore:`, error);
    return {} as T;
  }
}

export async function writeData<T>(file: string, data: T): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTION).doc(file).set(data as FirebaseFirestore.DocumentData);
}
