import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"];
const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      await adminAuth.verifySessionCookie(sessionCookie, true);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rl = checkRateLimit("upload", ip);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many uploads. Try again later." }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP, AVIF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10 MB." },
        { status: 400 }
      );
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Upload configuration error" }, { status: 500 });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = "markdev";

    const paramsToSign: Record<string, string> = {
      folder,
      timestamp: String(timestamp),
    };
    const sorted = Object.keys(paramsToSign).sort().map(k => `${k}=${paramsToSign[k]}`).join("&");
    const sigBuffer = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(sorted + apiSecret));
    const signature = Array.from(new Uint8Array(sigBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    const buffer = await file.arrayBuffer();
    const newFile = new File([buffer], file.name, { type: file.type });

    const uploadForm = new FormData();
    uploadForm.append("file", newFile);
    uploadForm.append("api_key", apiKey);
    uploadForm.append("timestamp", String(timestamp));
    uploadForm.append("folder", folder);
    uploadForm.append("quality", "auto");
    uploadForm.append("fetch_format", "auto");
    uploadForm.append("signature", signature);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: uploadForm }
    );

    const data = await res.json();
    if (!res.ok || !data.secure_url) {
      console.error("Cloudinary error:", JSON.stringify(data));
      return NextResponse.json({ error: data.error?.message || JSON.stringify(data), status: res.status }, { status: 500 });
    }

    return NextResponse.json({ url: data.secure_url });
  } catch (e) {
    console.error("Upload error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
