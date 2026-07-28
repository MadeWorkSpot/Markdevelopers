import { cache } from "react";
import { getAdminDb, fromRestDoc } from "./firebase-admin";

const COLLECTION = "content";
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";

export const readData = cache(async function readData<T>(file: string): Promise<T> {
  if (!API_KEY || !PROJECT_ID) return {} as T;
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}/${file}?key=${API_KEY}`;
    const res = await fetch(url);
    if (res.status === 404) return {} as T;
    if (!res.ok) return {} as T;
    const doc = await res.json();
    return fromRestDoc(doc) as T;
  } catch {
    return {} as T;
  }
});

export async function writeData<T>(file: string, data: T): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTION).doc(file).set(data as Record<string, unknown>);
}
