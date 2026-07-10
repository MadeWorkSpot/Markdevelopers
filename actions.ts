"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomInt } from "crypto";
import { readData, writeData } from "@/lib/data";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { sendOtpEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

function generateOtp(): string {
  return randomInt(100000, 999999).toString();
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) throw new Error("Unauthorized");
  try {
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

  const rl = checkRateLimit(`login:${email}`);
  if (!rl.allowed) {
    return { error: `Too many attempts. Try again in ${Math.ceil((rl.retryAfterMs ?? 0) / 60000)} minutes.` };
  }

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
      const msg = data.error?.message ?? "";
      if (
        msg.includes("EMAIL_NOT_FOUND") ||
        msg.includes("INVALID_PASSWORD") ||
        msg.includes("INVALID_LOGIN_CREDENTIALS")
      ) {
        return { error: "Invalid email or password." };
      }
      if (msg.includes("USER_DISABLED")) {
        return {
          error:
            "Please verify your email before logging in. Check your inbox for the OTP code.",
        };
      }
      return { error: "Authentication failed." };
    }

    const sessionCookie = await adminAuth.createSessionCookie(data.idToken, {
      expiresIn: 60 * 60 * 24 * 1000,
    });

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

export async function signup(_prev: unknown, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "All fields are required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  try {
    const user = await adminAuth.createUser({
      email,
      password,
      disabled: true,
    });

    await adminDb.collection("users").doc(user.uid).set({
      name,
      email,
      role: "admin",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const otp = generateOtp();

    await adminDb.collection("otps").doc(email).set({
      code: otp,
      uid: user.uid,
      expiresAt: Date.now() + 10 * 60 * 1000,
      createdAt: Date.now(),
    });

    const sent = await sendOtpEmail(email, otp);
    if (!sent) {
      try { await adminAuth.deleteUser(user.uid); } catch { /* best effort */ }
      try { await adminDb.collection("otps").doc(email).delete(); } catch { /* best effort */ }
      try { await adminDb.collection("users").doc(user.uid).delete(); } catch { /* best effort */ }
      return {
        error:
          "Failed to send verification email. Please check your email address and try again.",
      };
    }
  } catch (err: unknown) {
    const e = err as { code?: string; errorInfo?: { code?: string } };
    const code = e.code ?? e.errorInfo?.code ?? "";
    if (code.includes("email-already-exists")) {
      return { error: "An account with this email already exists." };
    }
    return { error: "Signup failed. Please try again." };
  }

  redirect(
    `/admin/verify-email?email=${encodeURIComponent(email)}`
  );
}

export async function verifyOtp(_prev: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const code = formData.get("code") as string;

  if (!email || !code) {
    return { error: "Email and code are required." };
  }

  const rl = checkRateLimit(`verify:${email}`);
  if (!rl.allowed) {
    return { error: `Too many attempts. Try again in ${Math.ceil((rl.retryAfterMs ?? 0) / 60000)} minutes.` };
  }

  try {
    const otpDoc = await adminDb.collection("otps").doc(email).get();
    if (!otpDoc.exists) {
      return {
        error: "No verification code found. Please sign up again.",
      };
    }

    const otpData = otpDoc.data()!;
    if (otpData.code !== code) {
      return { error: "Invalid verification code." };
    }

    if (Date.now() > otpData.expiresAt) {
      await adminDb.collection("otps").doc(email).delete();
      return { error: "Code expired. Click resend for a new one." };
    }

    await adminAuth.updateUser(otpData.uid, {
      disabled: false,
      emailVerified: true,
    });

    await adminDb.collection("otps").doc(email).delete();
  } catch {
    return { error: "Verification failed. Please try again." };
  }

  redirect("/admin/login");
}

export async function resendOtp(email: string) {
  if (!email) return { error: "Email is required." };

  const rl = checkRateLimit(`resend:${email}`);
  if (!rl.allowed) {
    return { error: `Too many attempts. Try again in ${Math.ceil((rl.retryAfterMs ?? 0) / 60000)} minutes.` };
  }

  try {
    const otpDoc = await adminDb.collection("otps").doc(email).get();
    if (!otpDoc.exists) {
      return { error: "No pending verification found. Please sign up again." };
    }

    const otp = generateOtp();

    await adminDb.collection("otps").doc(email).update({
      code: otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const sent = await sendOtpEmail(email, otp);
    if (!sent) {
      return { error: "Failed to send email. Please try again." };
    }

    return { success: true };
  } catch {
    return { error: "Failed to resend code. Please try again." };
  }
}

export async function forgotPassword(_prev: unknown, formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  if (!email) return { error: "Email is required." };

  const rl = checkRateLimit(`forgot:${email}`);
  if (!rl.allowed) {
    return { error: `Too many attempts. Try again in ${Math.ceil((rl.retryAfterMs ?? 0) / 60000)} minutes.` };
  }

  try {
    const user = await adminAuth.getUserByEmail(email);
    const otp = generateOtp();

    await adminDb.collection("password_resets").doc(email).set({
      code: otp,
      uid: user.uid,
      expiresAt: Date.now() + 10 * 60 * 1000,
      createdAt: Date.now(),
    });

    const sent = await sendOtpEmail(email, otp);
    if (!sent) {
      return { error: "Failed to send email. Please try again." };
    }

    return { success: true, email };
  } catch {
    return { error: "No account found with this email." };
  }
}

export async function resetPassword(_prev: unknown, formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const code = (formData.get("code") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !code || !password) {
    return { error: "All fields are required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  try {
    const resetDoc = await adminDb.collection("password_resets").doc(email).get();
    if (!resetDoc.exists) {
      return { error: "No reset request found. Please try again." };
    }

    const resetData = resetDoc.data()!;
    if (resetData.code !== code) {
      return { error: "Invalid verification code." };
    }
    if (Date.now() > resetData.expiresAt) {
      await adminDb.collection("password_resets").doc(email).delete();
      return { error: "Code expired. Please request a new one." };
    }

    await adminAuth.updateUser(resetData.uid, { password });
    await adminDb.collection("password_resets").doc(email).delete();
  } catch {
    return { error: "Password reset failed. Please try again." };
  }

  return { success: true };
}

export async function logout() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (sessionCookie) {
      try {
        const decoded = await adminAuth.verifySessionCookie(sessionCookie);
        await adminAuth.revokeRefreshTokens(decoded.sub);
      } catch {
        // session already invalid
      }
    }
    cookieStore.delete("session");
  } catch {
    // proceed with redirect even if cookie cleanup fails
  }
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
