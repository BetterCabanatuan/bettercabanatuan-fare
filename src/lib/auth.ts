import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { supabaseUrl } from "@/lib/db";

/**
 * Supabase Auth for the current request, reading and writing the session cookies. Used
 * only for auth: data goes through `getDb()`. Server Components can't set cookies, so a
 * token refresh there isn't saved; `src/proxy.ts` refreshes the session on /admin pages.
 */
export async function createAuthClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl(), publishableKey(), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component; the proxy has already refreshed the session.
        }
      },
    },
  });
}

export function publishableKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set.");
  return key;
}
