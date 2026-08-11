/**
 * Hostname validation helpers.
 *
 * Kept free of `next/headers` so it can be imported safely from the edge
 * middleware runtime.
 */

/**
 * Normalize a Host header value: lowercase, strip the port, strip a trailing dot.
 */
export function normalizeHost(host: string): string {
  return (host ?? "").trim().toLowerCase().split(":")[0].replace(/\.$/, "");
}

export function getAdminHost(
  env: Record<string, string | undefined> = process.env
): string {
  const base = normalizeHost(env.PUBLIC_HOST || "");
  const prefix = (env.ADMIN_HOST_PREFIX || "admindashboard.")
    .replace(/\.+$/, "")
    .concat(".");
  return base ? normalizeHost(prefix + base) : "";
}

export function getDevAdminHost(
  env: Record<string, string | undefined> = process.env
): string {
  const base = normalizeHost(env.PUBLIC_HOST_DEV || "localhost");
  const prefix = (env.ADMIN_HOST_PREFIX_DEV || "admin.")
    .replace(/\.+$/, "")
    .concat(".");
  return normalizeHost(prefix + base);
}

function isLocalHostname(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost");
}

/**
 * Returns true only for the configured admin subdomain (production or local dev).
 * Any other host — including lookalikes such as `admindashboard.evil.com` — is
 * NOT treated as the admin host. The dev admin hostname only applies to
 * localhost request hosts.
 */
export function isAdminHost(
  host: string,
  env: Record<string, string | undefined> = process.env
): boolean {
  const normalized = normalizeHost(host);
  if (!normalized) return false;

  const adminHost = getAdminHost(env);
  if (adminHost && normalized === adminHost) return true;

  if (isLocalHostname(normalized)) {
    const devAdminHost = getDevAdminHost(env);
    if (devAdminHost && normalized === devAdminHost) return true;
  }

  return false;
}
