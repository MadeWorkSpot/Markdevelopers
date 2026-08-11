import { describe, it, expect } from "vitest";
import {
  detectFileType,
  validateUploadedFile,
  sanitizeFileName,
  MAX_IMAGE_SIZE,
} from "@/lib/file-validation";

const JPEG = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
]);

const PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);

const GIF = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00,
]);

const WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

const MP4 = new Uint8Array([
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32,
]);

const HTML = new Uint8Array([
  0x3c, 0x68, 0x74, 0x6d, 0x6c, 0x3e, 0x3c, 0x73, 0x63, 0x72, 0x69, 0x70,
]);

describe("detectFileType", () => {
  it("detects jpeg by magic bytes", () => {
    expect(detectFileType(JPEG)).toBe("jpeg");
  });

  it("detects png by magic bytes", () => {
    expect(detectFileType(PNG)).toBe("png");
  });

  it("detects gif by magic bytes", () => {
    expect(detectFileType(GIF)).toBe("gif");
  });

  it("detects webp by RIFF+WEBP", () => {
    expect(detectFileType(WEBP)).toBe("webp");
  });

  it("detects mp4 by ftyp brand", () => {
    expect(detectFileType(MP4)).toBe("mp4");
  });

  it("returns null for unknown content", () => {
    expect(detectFileType(HTML)).toBeNull();
  });

  it("returns null for tiny buffers", () => {
    expect(detectFileType(new Uint8Array(4))).toBeNull();
  });
});

describe("validateUploadedFile", () => {
  it("accepts a JPEG declared as image/jpeg", () => {
    const res = validateUploadedFile(
      { name: "photo.jpg", type: "image/jpeg", size: JPEG.length },
      JPEG
    );
    expect(res.ok).toBe(true);
  });

  it("accepts a PNG declared as image/png", () => {
    const res = validateUploadedFile(
      { name: "logo.png", type: "image/png", size: PNG.length },
      PNG
    );
    expect(res.ok).toBe(true);
  });

  it("rejects content that does not match the declared type", () => {
    const res = validateUploadedFile(
      { name: "fake.jpg", type: "image/jpeg", size: PNG.length },
      PNG
    );
    expect(res.ok).toBe(false);
    expect(res.error).toContain("content does not match");
  });

  it("rejects HTML masquerading as an image", () => {
    const res = validateUploadedFile(
      { name: "evil.png", type: "image/png", size: HTML.length },
      HTML
    );
    expect(res.ok).toBe(false);
  });

  it("rejects a disallowed MIME type", () => {
    const res = validateUploadedFile(
      { name: "script.html", type: "text/html", size: HTML.length },
      HTML
    );
    expect(res.ok).toBe(false);
    expect(res.error).toContain("Invalid file type");
  });

  it("rejects disallowed extensions", () => {
    const res = validateUploadedFile(
      { name: "photo.exe", type: "image/jpeg", size: JPEG.length },
      JPEG
    );
    expect(res.ok).toBe(false);
    expect(res.error).toContain("extension");
  });

  it("rejects empty files", () => {
    const res = validateUploadedFile(
      { name: "empty.jpg", type: "image/jpeg", size: 0 },
      new Uint8Array(0)
    );
    expect(res.ok).toBe(false);
    expect(res.error).toContain("empty");
  });

  it("rejects oversized files", () => {
    const res = validateUploadedFile(
      { name: "big.jpg", type: "image/jpeg", size: MAX_IMAGE_SIZE + 1 },
      JPEG
    );
    expect(res.ok).toBe(false);
    expect(res.error).toContain("too large");
  });
});

describe("sanitizeFileName", () => {
  it("strips path separators and traversal", () => {
    expect(sanitizeFileName("../../etc/passwd.jpg")).toBe("_._etc_passwd.jpg");
    expect(sanitizeFileName("../../etc/passwd.jpg")).not.toContain("/");
    expect(sanitizeFileName("../../etc/passwd.jpg")).not.toContain("\\");
  });

  it("removes null bytes", () => {
    expect(sanitizeFileName("a\u0000b.jpg")).toBe("ab.jpg");
  });

  it("removes dangerous characters", () => {
    expect(sanitizeFileName("a;rm -rf /&.jpg")).toBe("a_rm_-rf___.jpg");
    expect(sanitizeFileName("a;rm -rf /&.jpg")).not.toContain("/");
  });

  it("limits length", () => {
    const long = "x".repeat(1000) + ".jpg";
    expect(sanitizeFileName(long).length).toBeLessThanOrEqual(255);
  });

  it("allows normal names", () => {
    expect(sanitizeFileName("my-photo_2.jpg")).toBe("my-photo_2.jpg");
  });
});
