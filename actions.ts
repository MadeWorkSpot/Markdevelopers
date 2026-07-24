"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { readData, writeData } from "@/lib/data";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { clearAuthCookies } from "@/lib/auth";

const VALID_CONTENT_TYPES = [
  "carousel", "services", "projects", "gallery",
  "about", "contact", "site",
];

const contentLocks = new Map<string, Promise<unknown>>();
const CONTENT_LOCK_TIMEOUT_MS = 30_000;

async function withContentLock<T>(type: string, fn: () => Promise<T>): Promise<T> {
  const prev = contentLocks.get(type) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  const safe = Promise.race([
    next,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Content lock timeout")), CONTENT_LOCK_TIMEOUT_MS)
    ),
  ]);
  contentLocks.set(type, safe.then(() => {}));
  return safe;
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) throw new Error("Unauthorized");
  try {
    // checkRevoked: true ensures that if a user's tokens were revoked
    // (e.g. after logout or password change), they cannot continue using
    // a previously-issued session cookie. This closes the window where
    // a stolen cookie remains valid after the user logs out.
    await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    throw new Error("Unauthorized");
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function login(_prev: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const rl = await checkRateLimit(`login:${email}`);
  if (!rl.allowed) {
    return { error: `Too many attempts. Try again in ${Math.ceil((rl.retryAfterMs ?? 0) / 60000)} minutes.` };
  }

  let sessionCookie: string;
  let refreshToken: string | undefined;
  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) return { error: "Configuration error. Please try again later." };

    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      return { error: "Invalid email or password." };
    }

    sessionCookie = await adminAuth.createSessionCookie(data.idToken, {
      expiresIn: 60 * 60 * 24 * 1000,
    });
    refreshToken = data.refreshToken;
  } catch {
    return { error: "Authentication failed." };
  }

  const cookieStore = await cookies();
  cookieStore.set("session", sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  if (refreshToken) {
    cookieStore.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return { success: true };
}

export async function logout() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (sessionCookie) {
    try {
      const session = await adminAuth.verifySessionCookie(sessionCookie);
      const uid = session.sub || session.user_id;
      if (uid) await adminAuth.revokeRefreshTokens(uid);
    } catch {}
  }
  await clearAuthCookies();
  redirect("/admin/login");
}

// ─── Content CRUD ────────────────────────────────────────────────────────────

export async function submitContact(_prev: unknown, formData: FormData) {
  try {
    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const message = (formData.get("message") as string)?.trim();

    if (!name || !email || !message) {
      return { error: "All fields are required." };
    }
    if (name.length > 100) {
      return { error: "Name must be 100 characters or less." };
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: "Please enter a valid email address." };
    }
    if (message.length > 5000) {
      return { error: "Message must be 5000 characters or less." };
    }

    const turnstileToken = formData.get("cf-turnstile-response") as string | null;
    const turnstileResult = await verifyTurnstile(turnstileToken);
    if (!turnstileResult.success) {
      return { error: "Security verification failed. Please try again." };
    }

    const rl = await checkRateLimit(`contact:${email}`);
    if (!rl.allowed) {
      return { error: `Too many messages. Try again in ${Math.ceil((rl.retryAfterMs ?? 0) / 60000)} minutes.` };
    }

    const db = adminDb;
    const now = Date.now();
    const docRef = await db.collection("messages").add({
      name,
      email,
      message,
      createdAt: now,
      isRead: false,
    });
    if (!docRef.id) {
      return { error: "Message could not be saved. Please try again." };
    }
    return { success: true };
  } catch (err) {
    console.error("[submitContact] Error:", err);
    return { error: "Failed to send message. Please try again." };
  }
}

export async function getUnreadCount() {
  try {
    await requireAdmin();
    const snapshot = await adminDb
      .collection("messages")
      .where("isRead", "==", false)
      .count()
      .get();
    return snapshot.data().count;
  } catch {
    return 0;
  }
}

export async function markMessagesAsRead() {
  await requireAdmin();
  const snapshot = await adminDb
    .collection("messages")
    .where("isRead", "==", false)
    .get();
  if (snapshot.empty) return;
  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += 500) {
    const batch = adminDb.batch();
    const chunk = docs.slice(i, i + 500);
    chunk.forEach((doc) => batch.update(doc.ref, { isRead: true }));
    await batch.commit();
  }
  revalidatePath("/admin", "layout");
}

export async function saveContent(type: string, data: unknown) {
  await requireAdmin();
  if (!VALID_CONTENT_TYPES.includes(type)) {
    return { success: false, error: "Invalid content type" };
  }
  const serialized = JSON.stringify(data);
  if (serialized.length > 1_048_576) {
    return { success: false, error: "Content too large. Maximum size is 1 MB." };
  }
  return withContentLock(type, async () => {
    const existing = await readData<Record<string, unknown>>(type);
    const merged = {
      ...existing,
      ...(data as Record<string, unknown>),
    };
    await writeData(type, merged);
    revalidatePath("/", "layout");
    return { success: true };
  });
}

export async function addArrayItem(
  type: string,
  key: string,
  item: Record<string, unknown>
) {
  await requireAdmin();
  if (!VALID_CONTENT_TYPES.includes(type)) {
    return { success: false, error: "Invalid content type" };
  }
  const data = await readData<Record<string, unknown>>(type);
  const arr = (data[key] as unknown[]) ?? [];
  (data as Record<string, unknown>)[key] = [...arr, item];
  await writeData(type, data);
  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateArrayItem(
  type: string,
  key: string,
  index: number,
  item: Record<string, unknown>
) {
  await requireAdmin();
  if (!VALID_CONTENT_TYPES.includes(type)) {
    return { success: false, error: "Invalid content type" };
  }
  const data = await readData<Record<string, unknown[]>>(type);
  const arr = data[key] ?? [];
  if (index < 0 || index >= arr.length) {
    return { success: false, error: "Index out of bounds" };
  }
  arr[index] = item as never;
  data[key] = arr;
  await writeData(type, data);
  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteMessage(messageId: string) {
  await requireAdmin();
  await adminDb.collection("messages").doc(messageId).delete();
  revalidatePath("/admin/dashboard/notifications");
  revalidatePath("/admin", "layout");
}

export async function deleteArrayItem(
  type: string,
  key: string,
  index: number
) {
  await requireAdmin();
  if (!VALID_CONTENT_TYPES.includes(type)) {
    return { success: false, error: "Invalid content type" };
  }
  const data = await readData<Record<string, unknown[]>>(type);
  data[key] = (data[key] ?? []).filter((_, i) => i !== index);
  await writeData(type, data);
  revalidatePath("/", "layout");
  return { success: true };
}

export async function reorderArray(
  type: string,
  key: string,
  fromIndex: number,
  toIndex: number
) {
  await requireAdmin();
  if (!VALID_CONTENT_TYPES.includes(type)) {
    return { success: false, error: "Invalid content type" };
  }
  const data = await readData<Record<string, unknown[]>>(type);
  const arr = [...(data[key] ?? [])];
  if (fromIndex < 0 || fromIndex >= arr.length || toIndex < 0 || toIndex >= arr.length) {
    return { success: false, error: "Index out of bounds" };
  }
  const [item] = arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, item);
  (data as Record<string, unknown>)[key] = arr;
  await writeData(type, data);
  revalidatePath("/", "layout");
  return { success: true };
}
