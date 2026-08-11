/**
 * Safely resolve a `redirect` query parameter to a relative path on the current
 * origin.
 *
 * Rules:
 *  - Only a path beginning with a single `/` is accepted.
 *  - Absolute URLs, protocol-relative URLs (`//host`), backslash-based parsing
 *    bypasses (`\/host`) and any path starting with a scheme are rejected.
 *  - Control characters are rejected.
 *  - The value is re-parsed with a URL parser so the resolved URL can never
 *    leave the current origin.
 *  - On any failure the fallback path is returned.
 */
export function safeRedirectPath(
  raw: string | null,
  fallback = "/admin/dashboard"
): string {
  if (!raw) return fallback;

  const value = raw.trim();
  if (value.length > 2048) return fallback;

  // Only a plain relative path is acceptable.
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.startsWith("/\\")) return fallback;
  if (/^\/%2f/i.test(value)) return fallback;
  if (/[\\\x00-\x1f\x7f]/.test(value)) return fallback;
  if (/^\/\s*[a-z][a-z0-9+.-]*:/i.test(value)) return fallback;

  // Authoritative re-parse: the resolved URL must stay on the same origin and
  // remain a path (never an absolute/host URL).
  let resolved: URL;
  try {
    resolved = new URL(value, "https://markdevelopers.in");
  } catch {
    return fallback;
  }
  if (resolved.origin !== "https://markdevelopers.in") return fallback;

  return resolved.pathname + resolved.search;
}
