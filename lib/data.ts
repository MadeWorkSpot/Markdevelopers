import { getAdminDb } from "./firebase-admin";

const COLLECTION = "content";

/**
 * Read a document from Firestore.
 *
 * When the Firebase service account is not configured (e.g. during builds that
 * must not embed credentials, or a misconfigured worker), this returns an empty
 * object instead of crashing. Callers already default their fields, so pages
 * render fallback content; in production the service account is provided at
 * runtime via `wrangler secret`, so real data loads.
 */
export async function readData<T>(file: string): Promise<T> {
  if (!process.env.FIREBASE_PRIVATE_KEY) return {} as T;
  const db = getAdminDb();
  const doc = await db.collection(COLLECTION).doc(file).get();
  return (doc.exists ? doc.data() : {}) as T;
}

export async function writeData<T>(file: string, data: T): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTION).doc(file).set(data as Record<string, unknown>);
}
