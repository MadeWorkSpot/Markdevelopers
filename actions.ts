"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { readData, writeData } from "@/lib/data";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";
import { clearAuthCookies, getCookieOptions, assertAdminEmail, isAdminEmail } from "@/lib/auth";
import { deleteCloudinaryResource } from "@/lib/cloudinary";

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
    const session = await adminAuth.verifySessionCookie(sessionCookie, true);
    // Fail-closed admin allowlist: the authenticated Firebase account must be
    // explicitly listed in ALLOWED_ADMIN_EMAILS. If unconfigured, no account
    // is permitted (deny-by-default).
    assertAdminEmail(session.email);
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

  const ip = await getClientIpFromHeaders();
  const rlEmail = await checkRateLimit(`login:${email}`);
  const rlIp = await checkRateLimit(`login-ip`, ip, 20);
  if (!rlEmail.allowed || !rlIp.allowed) {
    return { error: `Too many attempts. Try again in ${Math.ceil(Math.max(rlEmail.retryAfterMs ?? 0, rlIp.retryAfterMs ?? 0) / 60000)} minutes.` };
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

    // Admin allowlist: only explicitly-listed accounts may sign in. A valid
    // credential for a non-listed account is indistinguishable from a wrong
    // one to the caller.
    if (!isAdminEmail(data.email)) {
      return { error: "Invalid email or password." };
    }

    sessionCookie = await adminAuth.createSessionCookie(data.idToken, {
      expiresIn: 60 * 60 * 24 * 1000,
    });
    refreshToken = data.refreshToken;
  } catch {
    return { error: "Authentication failed." };
  }

  const cookieOptions = getCookieOptions();
  const cookieStore = await cookies();
  cookieStore.set("session", sessionCookie, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24,
  });
  if (refreshToken) {
    cookieStore.set("refresh_token", refreshToken, {
      ...cookieOptions,
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

    // Per-email AND per-IP limits — rotating addresses or IPs cannot bypass.
    const ip = await getClientIpFromHeaders();
    const rlEmail = await checkRateLimit(`contact:${email}`);
    const rlIp = await checkRateLimit(`contact-ip`, ip, 10);
    if (!rlEmail.allowed || !rlIp.allowed) {
      return { error: `Too many messages. Try again in ${Math.ceil(Math.max(rlEmail.retryAfterMs ?? 0, rlIp.retryAfterMs ?? 0) / 60000)} minutes.` };
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

    const contactDoc = await db.collection("content").doc("contact").get();
    const contactData = contactDoc.data();
    const toEmail = (contactData?.email as string) || "info@markdevelopers.in";

    // User content is escaped before being interpolated into the HTML email so
    // a visitor cannot inject markup/phishing content into the admin's inbox.
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Mark Developers <noreply@markdevelopers.in>",
        to: toEmail,
        subject: `New Contact Form Message from ${escapeHtml(name)}`,
        html: `<p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Message:</strong></p><p>${escapeHtml(message)}</p>`,
      }),
    });
    return { success: true };
  } catch {
    return { error: "Failed to send message. Please try again." };
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return c;
    }
  });
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

const MESSAGE_ID_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;

export async function markMessagesAsRead() {
  await requireAdmin();
  const ip = await getClientIpFromHeaders();
  const rl = await checkRateLimit(`mark-read`, ip, 60);
  if (!rl.allowed) return;
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
  if (JSON.stringify(item).length > 1_048_576) {
    return { success: false, error: "Item too large. Maximum size is 1 MB." };
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
  if (JSON.stringify(item).length > 1_048_576) {
    return { success: false, error: "Item too large. Maximum size is 1 MB." };
  }
  const data = await readData<Record<string, unknown[]>>(type);
  const arr = data[key] ?? [];
  if (index < 0 || index >= arr.length) {
    return { success: false, error: "Index out of bounds" };
  }
  arr[index] = item;
  data[key] = arr;
  await writeData(type, data);
  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteMessage(messageId: string) {
  await requireAdmin();
  if (typeof messageId !== "string" || !MESSAGE_ID_PATTERN.test(messageId)) {
    return { success: false, error: "Invalid message ID" };
  }
  const ip = await getClientIpFromHeaders();
  const rl = await checkRateLimit(`delete-message`, ip, 60);
  if (!rl.allowed) return { success: false, error: "Too many requests. Try again later." };
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
  const items = data[key] ?? [];
  const item = items[index] as Record<string, unknown> | undefined;
  if (item) {
    const urls = [item.src, item.videoSrc].filter(Boolean) as string[];
    await Promise.allSettled(urls.map(deleteCloudinaryResource));
  }
  data[key] = items.filter((_, i) => i !== index);
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
