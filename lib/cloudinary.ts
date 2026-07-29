const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

function parseCloudinaryUrl(url: string): { publicId: string; resourceType: string } | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith("cloudinary.com")) return null;
    const segments = parsed.pathname.split("/");
    const uploadIndex = segments.indexOf("upload");
    if (uploadIndex === -1 || uploadIndex + 2 >= segments.length) return null;
    const resourceType = segments[uploadIndex - 1];
    if (resourceType !== "image" && resourceType !== "video") return null;
    const version = segments[uploadIndex + 1];
    if (!version?.startsWith("v") || !/^\d+$/.test(version.slice(1))) return null;
    const fullPath = segments.slice(uploadIndex + 2).join("/");
    const dotIndex = fullPath.lastIndexOf(".");
    const publicId = dotIndex > 0 ? fullPath.slice(0, dotIndex) : fullPath;
    return { publicId, resourceType };
  } catch {
    return null;
  }
}

async function destroyCloudinary(
  publicId: string,
  resourceType: string
): Promise<boolean> {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) return false;

  const timestamp = Math.round(Date.now() / 1000);
  const toSign = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
  const sigBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(toSign));
  const signature = Array.from(new Uint8Array(sigBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

  const body = new URLSearchParams({
    public_id: publicId,
    api_key: API_KEY,
    timestamp: String(timestamp),
    signature,
    sha_type: "sha256",
  });

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/destroy`,
    { method: "POST", body }
  );
  const data = await res.json();
  return data.result === "ok";
}

export async function deleteCloudinaryResource(url: string): Promise<boolean> {
  const parsed = parseCloudinaryUrl(url);
  if (!parsed) return false;

  const { publicId, resourceType } = parsed;
  if (!publicId) return false;

  return destroyCloudinary(publicId, resourceType);
}
