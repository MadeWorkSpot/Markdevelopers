import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { clearAuthCookies } from "@/lib/auth";
import {
  validateUploadedFile,
  detectFileType,
  sanitizeFileName,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
} from "@/lib/file-validation";

export const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/avif",
  "video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo", "video/x-matroska",
];

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
      await clearAuthCookies();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rl = await checkRateLimit("upload", ip, 30);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many uploads. Try again later." }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Size + extension + MIME checks first (cheap), then magic-byte validation.
    const isVideo = (file.type || "").startsWith("video/");
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      const sizeLabel = isVideo ? "200 MB" : "10 MB";
      return NextResponse.json(
        { error: `File too large. Maximum size is ${sizeLabel}.` },
        { status: 400 }
      );
    }

    const safeName = sanitizeFileName(file.name);

    // Magic-byte/content-signature validation. The client-declared type is
    // never trusted: the bytes must match the declared format.
    const buffer = await file.arrayBuffer();
    const validation = validateUploadedFile(
      { name: safeName, type: file.type, size: file.size },
      buffer
    );
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
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
    // SHA-256 is used instead of SHA-1 for stronger signature security.
    // Cloudinary supports SHA-256 via the sha_type parameter.
    const sigBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(sorted + apiSecret));
    const signature = Array.from(new Uint8Array(sigBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    const newFile = new File([buffer], safeName, { type: file.type });

    const uploadForm = new FormData();
    uploadForm.append("file", newFile);
    uploadForm.append("api_key", apiKey);
    uploadForm.append("timestamp", String(timestamp));
    uploadForm.append("folder", folder);
    if (!isVideo) {
      uploadForm.append("quality", "auto");
      uploadForm.append("fetch_format", "auto");
    }
    uploadForm.append("signature", signature);
    uploadForm.append("sha_type", "sha256");

    const resourceType = isVideo ? "video" : "image";
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      { method: "POST", body: uploadForm }
    );

    const data = await res.json();
    if (!res.ok || !data.secure_url) {
      return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ url: data.secure_url });
  } catch {
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}

export { detectFileType, validateUploadedFile };
