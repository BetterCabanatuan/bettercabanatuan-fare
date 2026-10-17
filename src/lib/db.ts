import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database, Enums } from "@/lib/database-types";

export type SubmissionStatus = Enums<"SubmissionStatus">;
export type JeepType = Enums<"JeepType">;

/**
 * The server's database client: the Supabase Data API with the secret key, which
 * bypasses row level security. Every table has RLS on with no policies, so this key is
 * the only way in; it must never reach the browser. Admin actions check `getAdmin()`
 * before they use it.
 */
export function getDb(): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl(), secretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function supabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set.");
  return url;
}

function secretKey(): string {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY is not set.");
  return key;
}
