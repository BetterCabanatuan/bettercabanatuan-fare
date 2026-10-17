import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // The Supabase Session pooler (port 5432), not the transaction pooler (6543): migrations
  // need a session that keeps prepared statements and advisory locks.
  // Read loosely so `prisma generate` (postinstall, CI) works without a database.
  // Migrate commands still fail clearly when it is missing.
  datasource: { url: process.env.DATABASE_URL ?? "" },
});
