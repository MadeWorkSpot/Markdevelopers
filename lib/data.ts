import { cache } from "react";
import { getAdminDb } from "./firebase-admin";

const COLLECTION = "content";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";

export const readData = cache(async function readData<T>(file: string): Promise<T> {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}/${file}?key=${API_KEY}`;
    const res = await fetch(url);
    if (res.status === 404) return {} as T;
    if (!res.ok) return {} as T;
    const doc = (await res.json()) as {
      fields?: Record<string, Record<string, unknown>>;
    };
    if (!doc?.fields) return {} as T;

    function fromRestValue(val: Record<string, unknown> | undefined): unknown {
      if (!val) return undefined;
      if ("stringValue" in val) return val.stringValue;
      if ("integerValue" in val) return Number(val.integerValue);
      if ("doubleValue" in val) return val.doubleValue;
      if ("booleanValue" in val) return val.booleanValue;
      if ("nullValue" in val) return null;
      if ("arrayValue" in val) {
        const av = val.arrayValue as { values?: Record<string, unknown>[] };
        return (av.values || []).map(fromRestValue);
      }
      if ("mapValue" in val) {
        const mv = val.mapValue as {
          fields?: Record<string, Record<string, unknown>>;
        };
        const result: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(mv.fields || {}))
          result[k] = fromRestValue(v);
        return result;
      }
      return undefined;
    }

    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(doc.fields))
      result[k] = fromRestValue(v);
    return result as T;
  } catch {
    return {} as T;
  }
});

export async function writeData<T>(file: string, data: T): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTION).doc(file).set(data as Record<string, unknown>);
}
