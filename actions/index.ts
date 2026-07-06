"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(_prevState: { error?: string } | null, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Demo credentials – replace with real auth logic
  if (email !== "admin@example.com" || password !== "password") {
    return { error: "Invalid email or password." };
  }

  const token = btoa(JSON.stringify({ userId: "1", email, role: "admin" }));

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  redirect("/admin/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/admin/login");
}
