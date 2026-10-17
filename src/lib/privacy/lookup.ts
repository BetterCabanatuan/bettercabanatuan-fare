import "server-only";

import { isAdminEmail } from "@/lib/admins";
import { getDb } from "@/lib/db";

// Finds everything held about one person, so an admin can answer an access, correction
// or deletion request (Privacy Policy, "Your rights"). Searches names, emails and phone
// numbers, case-insensitively.

export const MIN_QUERY_LENGTH = 3;
const LIMIT = 50;
// Rider accounts are read in one page; plenty for a city fare site. Past this many, the
// search must move to a database function over auth.users.
const ACCOUNTS_PAGE = 1000;

export type Account = {
  id: string;
  email: string | null;
  name: string | null;
  provider: string;
  createdAt: Date;
  lastSignInAt: Date | null;
  /** Admin accounts are listed but can't be deleted here, so no one locks the team out. */
  isAdmin: boolean;
};

/** `%` and `_` are LIKE wildcards; escaped, they match themselves. */
const likePattern = (query: string): string => `%${query.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;

const byId = <T extends { id: string }>(rows: T[]): T[] => [...new Map(rows.map((row) => [row.id, row])).values()];

// Each column gets its own ilike query rather than a PostgREST or() string, so nothing
// typed in the search box is ever read as filter syntax.
async function feedbackMatching(pattern: string) {
  const db = getDb();
  const results = await Promise.all(
    (["userName", "userEmail"] as const).map((column) =>
      db.from("feedback").select().ilike(column, pattern).order("createdAt", { ascending: false }).limit(LIMIT),
    ),
  );
  return byId(
    results.flatMap(({ data, error }) => {
      if (error) throw error;
      return data;
    }),
  );
}

async function todaSubmissionsMatching(pattern: string) {
  const db = getDb();
  const results = await Promise.all(
    (["submitterName", "submitterContact"] as const).map((column) =>
      db.from("toda_submission").select().ilike(column, pattern).order("createdAt", { ascending: false }).limit(LIMIT),
    ),
  );
  return byId(
    results.flatMap(({ data, error }) => {
      if (error) throw error;
      return data;
    }),
  );
}

async function routeSubmissionsMatching(pattern: string) {
  const db = getDb();
  const results = await Promise.all(
    (["submitterName", "submitterContact"] as const).map((column) =>
      db.from("route_submission").select().ilike(column, pattern).order("createdAt", { ascending: false }).limit(LIMIT),
    ),
  );
  return byId(
    results.flatMap(({ data, error }) => {
      if (error) throw error;
      return data;
    }),
  );
}

async function accountsMatching(query: string): Promise<Account[]> {
  const { data, error } = await getDb().auth.admin.listUsers({ page: 1, perPage: ACCOUNTS_PAGE });
  if (error) throw error;
  const needle = query.toLowerCase();
  return data.users
    .map((user): Account => {
      const name: unknown = user.user_metadata?.full_name ?? user.user_metadata?.name;
      const provider: unknown = user.app_metadata?.provider;
      return {
        id: user.id,
        email: user.email ?? null,
        name: typeof name === "string" ? name : null,
        provider: typeof provider === "string" ? provider : "unknown",
        createdAt: new Date(user.created_at),
        lastSignInAt: user.last_sign_in_at ? new Date(user.last_sign_in_at) : null,
        isAdmin: isAdminEmail(user.email),
      };
    })
    .filter((account) => [account.email, account.name].some((value) => value?.toLowerCase().includes(needle)))
    .slice(0, LIMIT);
}

export async function findPersonalData(query: string) {
  const pattern = likePattern(query);
  const [accounts, feedback, todaSubmissions, routeSubmissions] = await Promise.all([
    accountsMatching(query),
    feedbackMatching(pattern),
    todaSubmissionsMatching(pattern),
    routeSubmissionsMatching(pattern),
  ]);
  return { accounts, feedback, todaSubmissions, routeSubmissions };
}

export type PersonalData = Awaited<ReturnType<typeof findPersonalData>>;
