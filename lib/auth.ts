export function isAuthenticated(sessionToken: string | undefined | null): boolean {
  return !!sessionToken;
}

export function getSessionUserId(sessionToken: string | undefined | null): string | null {
  if (!sessionToken) return null;
  try {
    const payload = JSON.parse(atob(sessionToken));
    return payload.userId ?? null;
  } catch {
    return null;
  }
}
