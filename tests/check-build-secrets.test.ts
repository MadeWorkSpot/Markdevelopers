import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const SCRIPT = join(process.cwd(), "scripts", "check-build-secrets.mjs");

function runScanner(
  files: Record<string, string>,
  env: Record<string, string> = {}
): { exitCode: number; stdout: string; stderr: string } {
  const dir = mkdtempSync(join(tmpdir(), "scan-test-"));
  mkdirSync(join(dir, ".next"), { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(dir, ".next", name), content);
  }
  try {
    const stdout = execFileSync(process.execPath, [SCRIPT], {
      encoding: "utf8",
      env: { ...process.env, SCAN_ROOT: dir, SCAN_DIRS: ".next", ...env },
    });
    return { exitCode: 0, stdout, stderr: "" };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { exitCode: e.status ?? 1, stdout: "", stderr: e.stderr ?? "" };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const PEM_BODY =
  "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj" +
  "MzEfYyjiWA4b4PrzY4S4JQd8jV1wCZKQ8H9+J7hYpO2rFkH4HlG7sZ6wCQKeM6dQ";

describe("check-build-secrets.mjs", () => {
  it("exits 0 on a clean build", () => {
    const out = runScanner({ "clean.js": "export const x = 1;" });
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toMatch(/OK: no server secrets found/);
  });

  it("detects a leaked PEM private key in any bundle file", () => {
    const result = runScanner({
      "leak.js": `const key = "-----BEGIN PRIVATE KEY-----\n${PEM_BODY}\n-----END PRIVATE KEY-----";`,
    });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/PEM private key/);
    expect(result.stderr).toMatch(/leak\.js/);
  });

  it("does not false-positive on library PEM marker strings (jose-style)", () => {
    const out = runScanner({
      "jose.js":
        '"-----BEGIN PRIVATE KEY----- must be PKCS#8 ... -----END PRIVATE KEY-----"; export default {};',
    });
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toMatch(/OK: no server secrets found/);
  });

  it("detects a secret value by its literal value when provided via env", () => {
    const result = runScanner(
      { "env-leak.js": "export const c = 're_1234567890abcdef1234567890abcdef';" },
      { RESEND_API_KEY: "re_1234567890abcdef1234567890abcdef" }
    );
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/RESEND_API_KEY/);
  });

  it("detects a RESEND-style assignment pattern", () => {
    const result = runScanner({
      "assign.js": "const env = { RESEND_API_KEY: 're_abcdefghijklmnopqrstuvwxyz0123' };",
    });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/secret/);
    expect(result.stderr).toMatch(/assign\.js/);
  });

  it("does not flag placeholder or short env values", () => {
    const out = runScanner(
      { "ok.js": "export const k = 'your_api_secret';" },
      { CLOUDINARY_API_SECRET: "your_api_secret" }
    );
    expect(out.exitCode).toBe(0);
    expect(out.stdout).toMatch(/OK: no server secrets found/);
  });
});
