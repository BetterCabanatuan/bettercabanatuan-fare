-- Supabase serves every table in `public` through its Data API (PostgREST, GraphQL) to the
-- `anon` and `authenticated` roles, which anyone holding the project's publishable key can
-- use. These tables hold submitters' private contact details and admin sessions, and the
-- app never talks to the Data API, so it should see nothing.
--
-- Row level security with no policies denies every row to those roles. The app and
-- `prisma migrate` connect as `postgres`, which owns these tables (owners skip RLS unless
-- FORCE is set) and on Supabase also has BYPASSRLS, so Prisma is unaffected.
--
-- RLS alone is enough, so there is no REVOKE: it would have to be guarded for plain
-- Postgres, where `anon` and `authenticated` don't exist, and adds nothing the Data API
-- can reach. Any migration that adds a table must enable RLS on it the same way.

ALTER TABLE "toda_submission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "toda" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "route_submission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "community_jeep_route" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;

-- Prisma's own history table also sits in `public`, and Supabase's default grants would let
-- the Data API rewrite or delete it. IF EXISTS because the shadow database Prisma builds for
-- `migrate dev` and `migrate diff` may not have it.
ALTER TABLE IF EXISTS "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
