"use server";

import { refresh } from "next/cache";

import { getDb } from "@/lib/db";
import { getAdmin } from "@/lib/session";

export type ResolveResult = { ok: true } | { ok: false; message: string };

/** Marks feedback as dealt with. Only NEW feedback changes, so two admins can't both resolve it. */
export async function resolveFeedback(id: string): Promise<ResolveResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, message: "Your session ended. Sign in again." };

  const { data, error } = await getDb()
    .from("feedback")
    .update({ status: "RESOLVED", resolvedAt: new Date().toISOString(), resolvedByEmail: admin.email })
    .eq("id", id)
    .eq("status", "NEW")
    .select("id");
  if (error) throw error;

  refresh();
  return data.length === 1
    ? { ok: true }
    : { ok: false, message: "Another admin already resolved this. The list has been refreshed." };
}
