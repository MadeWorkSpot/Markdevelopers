import { adminDb } from "./firebase-admin";

const COLLECTION = "content";

export async function readData<T>(file: string): Promise<T> {
  const doc = await adminDb.collection(COLLECTION).doc(file).get();
  return ((doc.exists ? doc.data() : {}) as T);
}

export async function writeData<T>(file: string, data: T): Promise<void> {
  await adminDb.collection(COLLECTION).doc(file).set(data as FirebaseFirestore.DocumentData);
}
