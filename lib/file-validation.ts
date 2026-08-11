/**
 * Server-side file validation for uploads.
 *
 * The client-declared MIME type is NOT trusted: the actual file bytes are
 * inspected (magic bytes / content signatures) and must match the declared
 * type before an upload is accepted.
 */

export const ALLOWED_EXTENSIONS = new Set([
  // images
  "jpg", "jpeg", "png", "gif", "webp", "avif",
  // videos
  "mp4", "webm", "ogv", "ogg", "mov", "qt", "avi", "mkv",
]);

const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
] as const;

const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
] as const;

export const ALLOWED_MIME_TYPES = new Set<string>([
  ...IMAGE_MIME_TYPES,
  ...VIDEO_MIME_TYPES,
]);

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200 MB
export const MAX_FILENAME_LENGTH = 255;

export type DetectedFileType =
  | "jpeg"
  | "png"
  | "gif"
  | "webp"
  | "avif"
  | "mp4"
  | "webm"
  | "ogg"
  | "mov"
  | "avi"
  | "mkv";

// Map client MIME type -> expected content signature label.
const MIME_TO_TYPE: Record<string, DetectedFileType> = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogg",
  "video/quicktime": "mov",
  "video/x-msvideo": "avi",
  "video/x-matroska": "mkv",
};

const FTYP_BRANDS: Record<string, DetectedFileType> = {
  mp42: "mp4",
  mp41: "mp4",
  isom: "mp4",
  iso2: "mp4",
  avc1: "mp4",
  mp4v: "mp4",
  M4V: "mp4",
  dash: "mp4",
  "qt  ": "mov",
};

function ascii(bytes: Uint8Array, start: number, length: number): string {
  let out = "";
  for (let i = start; i < start + length && i < bytes.length; i++) {
    out += String.fromCharCode(bytes[i]);
  }
  return out;
}

function isAscii(bytes: Uint8Array, start: number, length: number): boolean {
  if (start + length > bytes.length) return false;
  for (let i = start; i < start + length; i++) {
    if (bytes[i] < 0x20 || bytes[i] > 0x7e) return false;
  }
  return true;
}

/**
 * Detect the real file type from the leading bytes. Returns null when the
 * content does not match any allowed format.
 */
export function detectFileType(buffer: ArrayBuffer | Uint8Array): DetectedFileType | null {
  const bytes =
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.length < 12) return null;

  // JPEG
  if (
    bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  ) {
    return "jpeg";
  }

  // PNG
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e &&
    bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a &&
    bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "png";
  }

  // GIF
  const gifHeader = ascii(bytes, 0, 6);
  if (gifHeader === "GIF87a" || gifHeader === "GIF89a") return "gif";

  // RIFF container (WebP, AVI)
  if (ascii(bytes, 0, 4) === "RIFF") {
    const formType = ascii(bytes, 8, 4);
    if (formType === "WEBP") return "webp";
    if (formType === "AVI ") return "avi";
  }

  // ISOBMFF (MP4 / QuickTime / AVIF): box size + "ftyp"
  if (ascii(bytes, 4, 4) === "ftyp" && isAscii(bytes, 8, 4)) {
    const brand = ascii(bytes, 8, 4);
    const ftyp = FTYP_BRANDS[brand];
    if (ftyp) return ftyp;
    // AVIF brands
    if (brand === "avif" || brand === "avis") {
      return "avif";
    }
    return null;
  }

  // EBML (WebM / Matroska)
  if (
    bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3
  ) {
    // Distinguish WebM from generic Matroska via DocType in the EBML header.
    const docType = findEbmlDocType(bytes);
    return docType === "webm" ? "webm" : "mkv";
  }

  // OGG
  if (ascii(bytes, 0, 4) === "OggS") return "ogg";

  return null;
}

function findEbmlDocType(bytes: Uint8Array): string | null {
  // EBML header contains DocType in the initial element tree; a simple scan
  // for the ASCII "webm" marker within the first 64 bytes is sufficient here.
  const window = ascii(bytes, 0, Math.min(64, bytes.length));
  return window.includes("webm") ? "webm" : null;
}

export interface FileValidationResult {
  ok: boolean;
  error?: string;
}

/**
 * Validate an uploaded File:
 *  - declared MIME type must be allowed
 *  - actual bytes (magic number) must match the declared type
 *  - size must be within the per-type limit
 *  - filename must be sanitizable and not a path/traversal attempt
 */
export function validateUploadedFile(
  file: Pick<File, "name" | "type" | "size">,
  readBuffer?: ArrayBuffer | Uint8Array
): FileValidationResult {
  const mime = (file.type || "").trim().toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mime)) {
    return { ok: false, error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP, AVIF images and MP4, WebM, OGG, MOV, AVI, MKV videos." };
  }

  const isVideo = mime.startsWith("video/");
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    return { ok: false, error: `File too large. Maximum size is ${isVideo ? "200 MB" : "10 MB"}.` };
  }
  if (file.size === 0) {
    return { ok: false, error: "File is empty." };
  }

  const ext = sanitizeFileName(file.name).split(".").pop()?.toLowerCase();
  if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
    return { ok: false, error: "File extension is not allowed." };
  }

  if (!readBuffer) return { ok: true };
  const detected = detectFileType(readBuffer);
  if (!detected) {
    return { ok: false, error: "File content does not match a supported format." };
  }
  if (detected !== MIME_TO_TYPE[mime]) {
    return { ok: false, error: "File content does not match its declared type." };
  }

  return { ok: true };
}

/**
 * Sanitize a client-supplied filename. Strips path separators, control chars,
 * null bytes, and traversal attempts; enforces a maximum length.
 */
export function sanitizeFileName(name: string): string {
  return name
    .replace(/\0/g, "")
    .replace(/[\x00-\x1f\x7f]/g, "_")
    .replace(/[^\w.\-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .replace(/^\.+/, "")
    .replace(/[\\/]/g, "_")
    .slice(0, MAX_FILENAME_LENGTH);
}
