"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { readData, writeData } from "@/lib/data";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { checkRateLimit } from "@/lib/rate-limit";

const ADMIN_USERS = [
  { email: "madewebspot@gmail.com", password: "Markdevelopers123#" },
  { email: "markgroupkerala@gmail.com", password: "Markdevelopers123#" },
];

async function requireAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) throw new Error("Unauthorized");
  try {
    await adminAuth.verifySessionCookie(sessionCookie);
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

  const rl = checkRateLimit(`login:${email}`);
  if (!rl.allowed) {
    return { error: `Too many attempts. Try again in ${Math.ceil((rl.retryAfterMs ?? 0) / 60000)} minutes.` };
  }

  const user = ADMIN_USERS.find(
    (u) => u.email === email && u.password === password
  );
  if (!user) {
    return { error: "Invalid email or password." };
  }

  try {
    const sessionCookie = await adminAuth.createAdminSessionCookie(
      user.email,
      60 * 60 * 24 * 1000
    );

    const cookieStore = await cookies();
    cookieStore.set("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
  } catch {
    return { error: "Authentication failed." };
  }

  redirect("/admin/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/admin/login");
}

// ─── Content CRUD ────────────────────────────────────────────────────────────

export async function submitContact(_prev: unknown, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const message = formData.get("message") as string;

  if (!name || !email || !message) {
    return { error: "All fields are required." };
  }

  try {
    const db = adminDb;
    await db.collection("messages").add({
      name,
      email,
      message,
      createdAt: Date.now(),
      isRead: false,
    });
    return { success: true };
  } catch {
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
  const existing = await readData<Record<string, unknown>>(type);
  const merged = {
    ...existing,
    ...(data as Record<string, unknown>),
  };
  await writeData(type, merged);
  return { success: true };
}

export async function addArrayItem(
  type: string,
  key: string,
  item: Record<string, unknown>
) {
  await requireAdmin();
  const data = await readData<Record<string, unknown>>(type);
  const arr = (data[key] as unknown[]) ?? [];
  (data as Record<string, unknown>)[key] = [...arr, item];
  await writeData(type, data);
  return { success: true };
}

export async function updateArrayItem(
  type: string,
  key: string,
  index: number,
  item: Record<string, unknown>
) {
  await requireAdmin();
  const data = await readData<Record<string, unknown[]>>(type);
  const arr = data[key] ?? [];
  arr[index] = item as never;
  data[key] = arr;
  await writeData(type, data);
  return { success: true };
}

export async function deleteMessage(messageId: string) {
  await requireAdmin();
  await adminDb.collection("messages").doc(messageId).delete();
  revalidatePath("/admin/dashboard/notifications");
}

export async function deleteArrayItem(
  type: string,
  key: string,
  index: number
) {
  await requireAdmin();
  const data = await readData<Record<string, unknown[]>>(type);
  data[key] = (data[key] ?? []).filter((_, i) => i !== index);
  await writeData(type, data);
  return { success: true };
}

export async function reorderArray(
  type: string,
  key: string,
  fromIndex: number,
  toIndex: number
) {
  await requireAdmin();
  const data = await readData<Record<string, unknown[]>>(type);
  const arr = [...(data[key] ?? [])];
  const [item] = arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, item);
  (data as Record<string, unknown>)[key] = arr;
  await writeData(type, data);
  return { success: true };
}
