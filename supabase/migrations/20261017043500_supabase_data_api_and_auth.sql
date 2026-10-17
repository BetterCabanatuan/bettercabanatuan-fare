-- Prisma and Better Auth are gone. The server now reads and writes these tables through
-- the Supabase Data API with the secret key (service_role), and admins sign in with
-- Supabase Auth. Row level security stays on with no policies, so the publishable key
-- still sees nothing; service_role bypasses RLS.

-- ── Reviewers are Supabase Auth users now ────────────────────────────────────
-- Better Auth's "user" table goes, so keep who reviewed a submission as the address,
-- which is all the admin pages show. Backfilled before the table is dropped.

ALTER TABLE "toda_submission" ADD COLUMN "reviewedByEmail" TEXT;
ALTER TABLE "route_submission" ADD COLUMN "reviewedByEmail" TEXT;

UPDATE "toda_submission" AS s SET "reviewedByEmail" = u."email" FROM "user" AS u WHERE s."reviewedById" = u."id";
UPDATE "route_submission" AS s SET "reviewedByEmail" = u."email" FROM "user" AS u WHERE s."reviewedById" = u."id";

-- Dropping the columns drops their foreign keys to "user" too.
ALTER TABLE "toda_submission" DROP COLUMN "reviewedById";
ALTER TABLE "route_submission" DROP COLUMN "reviewedById";

DROP TABLE "session", "account", "verification", "user";
DROP TABLE IF EXISTS "_prisma_migrations";

-- ── Timestamps ───────────────────────────────────────────────────────────────
-- Prisma stored UTC in TIMESTAMP without a zone. The Data API returns those without an
-- offset, which JavaScript parses as local time, so they become TIMESTAMPTZ.

ALTER TABLE "toda_submission"
  ALTER COLUMN "reviewedAt" TYPE TIMESTAMPTZ(3) USING "reviewedAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "toda"
  ALTER COLUMN "lastVerified" TYPE TIMESTAMPTZ(3) USING "lastVerified" AT TIME ZONE 'UTC',
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "route_submission"
  ALTER COLUMN "reviewedAt" TYPE TIMESTAMPTZ(3) USING "reviewedAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "community_jeep_route"
  ALTER COLUMN "verifiedOn" TYPE TIMESTAMPTZ(3) USING "verifiedOn" AT TIME ZONE 'UTC',
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- ── Defaults Prisma used to fill in ──────────────────────────────────────────
-- Prisma generated submission ids (cuid) and set "updatedAt" in the client. The database
-- does both now. Existing cuid ids stay as they are.

ALTER TABLE "toda_submission" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::TEXT;
ALTER TABLE "route_submission" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::TEXT;

ALTER TABLE "toda_submission" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "toda" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "route_submission" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "community_jeep_route" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

CREATE FUNCTION "set_updated_at"() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END
$$;

CREATE TRIGGER "toda_submission_updated_at" BEFORE UPDATE ON "toda_submission" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "toda_updated_at" BEFORE UPDATE ON "toda" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "route_submission_updated_at" BEFORE UPDATE ON "route_submission" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
CREATE TRIGGER "community_jeep_route_updated_at" BEFORE UPDATE ON "community_jeep_route" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();

-- ── Approvals ────────────────────────────────────────────────────────────────
-- The Data API has no transactions, so publishing an entry and marking its submission
-- VERIFIED happen together in these functions. Each locks the submission and only acts
-- while it is still PENDING, so two admins approving at once can't both win; the loser
-- gets FALSE. The slug comes from the app (todaSlug/routeSlug in src/lib) so the naming
-- rules live in one place.
--
-- A submission whose slug matches a published entry updates it. A correction only
-- replaces what it supplies: blank optional fields keep the published values.

CREATE FUNCTION "approve_toda_submission"(submission_id TEXT, toda_id TEXT, reviewer_email TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE
  s public."toda_submission";
BEGIN
  SELECT * INTO s FROM public."toda_submission"
  WHERE "id" = submission_id AND "status" = 'PENDING'
  FOR UPDATE;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  INSERT INTO public."toda" AS t
    ("id", "name", "terminalDescription", "barangay", "lat", "lng", "barangaysServed", "units", "officialContact", "lastVerified")
  VALUES
    (toda_id, s."name", s."terminalDescription", s."barangay", s."lat", s."lng", s."barangaysServed", s."units", s."officialContact", CURRENT_TIMESTAMP)
  ON CONFLICT ("id") DO UPDATE SET
    "name" = EXCLUDED."name",
    "terminalDescription" = EXCLUDED."terminalDescription",
    "barangay" = EXCLUDED."barangay",
    "lat" = COALESCE(EXCLUDED."lat", t."lat"),
    "lng" = COALESCE(EXCLUDED."lng", t."lng"),
    "barangaysServed" = CASE WHEN cardinality(EXCLUDED."barangaysServed") > 0 THEN EXCLUDED."barangaysServed" ELSE t."barangaysServed" END,
    "units" = COALESCE(EXCLUDED."units", t."units"),
    "officialContact" = COALESCE(EXCLUDED."officialContact", t."officialContact"),
    "lastVerified" = EXCLUDED."lastVerified";

  UPDATE public."toda_submission"
  SET "status" = 'VERIFIED', "reviewedAt" = CURRENT_TIMESTAMP, "reviewedByEmail" = reviewer_email, "todaId" = toda_id
  WHERE "id" = submission_id;
  RETURN TRUE;
END
$$;

-- The road line is fetched from OSRM by the app before calling this, so a slow routing
-- server never holds a transaction open.
CREATE FUNCTION "approve_route_submission"(
  submission_id TEXT,
  route_id TEXT,
  road_line JSONB,
  distance_km DOUBLE PRECISION,
  reviewer_email TEXT
)
RETURNS BOOLEAN LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE
  s public."route_submission";
BEGIN
  SELECT * INTO s FROM public."route_submission"
  WHERE "id" = submission_id AND "status" = 'PENDING'
  FOR UPDATE;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  INSERT INTO public."community_jeep_route" AS r
    ("id", "name", "fromName", "toName", "via", "jeepType", "line", "distanceKm", "farePaid", "verifiedOn")
  VALUES
    (route_id, s."name", s."fromName", s."toName", s."via", s."jeepType", road_line, distance_km, s."farePaid", CURRENT_TIMESTAMP)
  ON CONFLICT ("id") DO UPDATE SET
    "name" = EXCLUDED."name",
    "fromName" = EXCLUDED."fromName",
    "toName" = EXCLUDED."toName",
    "via" = COALESCE(EXCLUDED."via", r."via"),
    "jeepType" = CASE WHEN EXCLUDED."jeepType" = 'UNKNOWN' THEN r."jeepType" ELSE EXCLUDED."jeepType" END,
    "line" = EXCLUDED."line",
    "distanceKm" = EXCLUDED."distanceKm",
    "farePaid" = COALESCE(EXCLUDED."farePaid", r."farePaid"),
    "verifiedOn" = EXCLUDED."verifiedOn";

  UPDATE public."route_submission"
  SET "status" = 'VERIFIED', "reviewedAt" = CURRENT_TIMESTAMP, "reviewedByEmail" = reviewer_email, "routeId" = route_id
  WHERE "id" = submission_id;
  RETURN TRUE;
END
$$;

-- ── Access ───────────────────────────────────────────────────────────────────
-- Functions in `public` are callable through the Data API, and Postgres lets everyone
-- execute new functions by default. Only the server (service_role) may approve.

REVOKE EXECUTE ON FUNCTION "set_updated_at"() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION "approve_toda_submission"(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION "approve_route_submission"(TEXT, TEXT, JSONB, DOUBLE PRECISION, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION "approve_toda_submission"(TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION "approve_route_submission"(TEXT, TEXT, JSONB, DOUBLE PRECISION, TEXT) TO service_role;

-- Supabase usually grants these by default; stated here so the server works on projects
-- where the Data API doesn't expose new tables automatically.
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON "toda_submission", "toda", "route_submission", "community_jeep_route" TO service_role;
