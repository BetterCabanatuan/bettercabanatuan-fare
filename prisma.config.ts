import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Read loosely so `prisma generate` (postinstall, CI) works without a database.
  // Migrate commands still fail clearly when it is missing.
  datasource: { url: process.env.DATABASE_URL ?? "" },
});
