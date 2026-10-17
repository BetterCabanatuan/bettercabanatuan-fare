// Admin access comes from the ADMIN_EMAILS environment variable (comma-separated).
// Removing an address there revokes access on the next request, even for open sessions.

export function parseAdminEmails(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string | null | undefined, list = process.env.ADMIN_EMAILS): boolean {
  if (!email) return false;
  return parseAdminEmails(list).has(email.trim().toLowerCase());
}

/**
 * Riders sign in with Google or Facebook to the same Supabase project as admins. Only the
 * emailed sign-in link proves an admin address, so a session that started with a social
 * provider never counts as an admin, even when it carries an admin's address. `amr` is
 * the session token's list of sign-in methods, as entries or plain strings.
 */
export function startedWithOAuth(amr: readonly ({ method: string } | string)[] | undefined): boolean {
  return (amr ?? []).some((entry) => (typeof entry === "string" ? entry : entry.method) === "oauth");
}
