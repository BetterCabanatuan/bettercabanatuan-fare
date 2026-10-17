-- The contributors board at /contributors ranks riders by how many of their route
-- suggestions an admin approved. Riders appear as "Anonymous rider" unless they choose a
-- public name here. RLS on with no policies, like every other table: only the server
-- (service_role) reads or writes it.
--
-- Deleting the Supabase Auth user (a data deletion request) deletes their name, and the
-- cascade on route_submission."userId" removes their suggestions, so they leave the board.
CREATE TABLE "contributor" (
    "userId" UUID NOT NULL REFERENCES auth.users ("id") ON DELETE CASCADE,
    -- The app checks 2 to 40 characters with no email or phone number (src/lib/routes/contributors.ts).
    "publicName" TEXT CHECK (char_length("publicName") BETWEEN 2 AND 40),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contributor_pkey" PRIMARY KEY ("userId")
);

CREATE TRIGGER "contributor_updated_at" BEFORE UPDATE ON "contributor" FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();

ALTER TABLE "contributor" ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON "contributor" TO service_role;

-- Every rider with an approved route suggestion, most approved first. Tied riders share a
-- rank; among them, whoever's latest approval is older got there first and is listed
-- first. Corrections count like new routes. Suggestions sent before sign-in was required
-- have no "userId" and count for nobody.
--
-- Returns the user id so the server can mark the signed-in rider's row; the page never
-- renders it. All rows come back so a rider outside the top 100 can still see their rank,
-- which is fine at city scale.
CREATE FUNCTION "route_contributor_board"()
RETURNS TABLE ("userId" UUID, "publicName" TEXT, "approved" INTEGER, "latest" TIMESTAMPTZ, "rank" INTEGER)
LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT
    s."userId",
    c."publicName",
    count(*)::INTEGER,
    max(s."reviewedAt"),
    (rank() OVER (ORDER BY count(*) DESC))::INTEGER
  FROM public."route_submission" AS s
  LEFT JOIN public."contributor" AS c ON c."userId" = s."userId"
  WHERE s."status" = 'VERIFIED' AND s."userId" IS NOT NULL
  GROUP BY s."userId", c."publicName"
  ORDER BY count(*) DESC, max(s."reviewedAt") ASC;
$$;

REVOKE EXECUTE ON FUNCTION "route_contributor_board"() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION "route_contributor_board"() TO service_role;
