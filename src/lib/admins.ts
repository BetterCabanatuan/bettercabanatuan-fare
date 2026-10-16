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
