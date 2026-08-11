#!/usr/bin/env node
/**
 * check-build-secrets.mjs
 *
 * Scans Next.js/OpenNext build output for accidentally-embedded server secrets.
 * Run AFTER `opennextjs-cloudflare build` and BEFORE `wrangler deploy`.
 *
 * It checks for:
 *   1. Marker patterns (e.g. PEM private keys).
 *   2. Secret-assignment literals in generated env/bundle files.
 *   3. The literal values of any server-only secrets provided to THIS script
 *      via its own environment (so CI can pass the real secret values without
 *      them ever being printed).
 *
 * Exit code 0 = clean. Exit code 1 = secrets found (build must not deploy).
 *
 * Never prints secret values — only the variable name and matching file.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// Root and scan dirs can be overridden so the scanner can be pointed at
// fixtures in tests (see tests/check-build-secrets.test.ts).
const ROOT = process.env.SCAN_ROOT || new URL("..", import.meta.url).pathname;

const SCAN_DIRS = (process.env.SCAN_DIRS || ".next,.open-next").split(",");

// Subdirectories that may contain dependency copies or build caches; the real
// application output lives outside these.
const SKIP_DIRS = new Set(["node_modules", ".cache", "cache", "dev"]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // skip huge binary files

// Server-only secret env vars. If present in the environment of this script,
// their literal values are searched for in the build output.
const SECRET_VAR_NAMES = [
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_CLIENT_EMAIL",
  "CLOUDINARY_API_SECRET",
  "TURNSTILE_SECRET_KEY",
  "RESEND_API_KEY",
  "SESSION_SECRET",
  "CLOUDFLARE_API_SECRET",
  "CLOUDFLARE_API_TOKEN",
  "ALLOWED_ADMIN_EMAILS",
];

// Value-shape patterns that should never appear as literals in build output.
const ASSIGNMENT_PATTERNS = [
  ["RESEND_API_KEY", /RESEND_API_KEY\s*=\s*re_[A-Za-z0-9_]+/],
  ["CLOUDFLARE_API_TOKEN", /CLOUDFLARE_API_TOKEN\s*=\s*cfat_[A-Za-z0-9_]+/],
  ["CLOUDFLARE_API_SECRET", /CLOUDFLARE_API_SECRET\s*=\s*cfut_[A-Za-z0-9_]+/],
  ["CLOUDFLARE_API_SECRET", /CLOUDFLARE_API_SECRET\s*=\s*["']?[A-Za-z0-9_-]{32,}/],
  ["CLOUDINARY_API_SECRET", /CLOUDINARY_API_SECRET\s*=\s*["'][A-Za-z0-9]+["']/],
  ["FIREBASE_PRIVATE_KEY", /FIREBASE_PRIVATE_KEY\s*=\s*["']?-----BEGIN PRIVATE KEY-----/],
];

const MARKER_PATTERNS = [
  // A full PEM block whose body is pure base64 (header + body + footer) can only
  // be an embedded private key. Minified library code (e.g. jose's "must be
  // PKCS#8" error strings) contains header/footer literals but never a base64
  // body, so it does not match. Verified across all generated bundle files.
  [
    "PEM private key",
    /-----BEGIN (RSA )?PRIVATE KEY-----[ \t\r\n]*[A-Za-z0-9+/=\r\n]{60,}[ \t\r\n]*-----END (RSA )?PRIVATE KEY-----/,
  ],
  ["Turnstile/Resend-style secret", /\b(re_|cfat_|cfut_)[A-Za-z0-9_]{16,}/],
];

function listFiles(dir) {
  const out = [];
  const walk = (d) => {
    let entries;
    try {
      entries = readdirSync(d);
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(d, entry);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (!SKIP_DIRS.has(entry)) walk(full);
      } else if (st.isFile() && st.size <= MAX_FILE_SIZE) {
        out.push(full);
      }
    }
  };
  walk(dir);
  return out;
}

const searchValues = [];
for (const name of SECRET_VAR_NAMES) {
  const value = process.env[name];
  if (value && !/^(your_|generate_|REPLACE|example)/i.test(value) && value.length >= 12) {
    searchValues.push({ name, value });
  }
}

const findings = new Map(); // varName -> array of relative paths

function record(name, file) {
  const rel = relative(ROOT, file);
  if (!findings.has(name)) findings.set(name, []);
  findings.get(name).push(rel);
}

function scanFile(file) {
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    return;
  }
  if (content.length === 0) return;

  for (const [name, pattern] of MARKER_PATTERNS) {
    if (pattern.test(content)) record(name, file);
  }
  for (const [name, pattern] of ASSIGNMENT_PATTERNS) {
    if (pattern.test(content)) record(name, file);
  }
  for (const { name, value } of searchValues) {
    if (content.includes(value)) record(name, file);
  }
}

for (const dir of SCAN_DIRS) {
  const full = join(ROOT, dir);
  if (!statSync(full, { throwIfNoEntry: false })) continue;
  for (const file of listFiles(full)) scanFile(file);
}

const names = [...findings.keys()].sort();
if (names.length > 0) {
  console.error("ERROR: server secrets found in build output — refusing to continue.");
  for (const name of names) {
    for (const file of findings.get(name)) {
      console.error(`  - ${name} found in ${file}`);
    }
  }
  console.error(
    "\nRemove these secrets from the build-time environment (set them via `wrangler secret put` instead) and rebuild."
  );
  process.exit(1);
}

console.log("OK: no server secrets found in build output (.next / .open-next).");
