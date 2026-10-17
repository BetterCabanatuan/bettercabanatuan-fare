-- A TODA can wait for passengers at more than one place, e.g. both entrances of a mall.
-- The main terminal stays in "terminalDescription", "barangay", "lat" and "lng"; the
-- others go in "connectedTerminals" as [{ "terminalDescription", "barangay", "lat", "lng" }].
-- Kept on the row instead of in a table of their own so an admin's edit of every position
-- is one UPDATE: the Data API has no transactions.
--
-- The app checks each entry (src/lib/toda/terminals.ts); this CHECK only stops a bypassed
-- check from storing an unbounded list.
ALTER TABLE "toda"
  ADD COLUMN "connectedTerminals" JSONB NOT NULL DEFAULT '[]'
  CHECK (jsonb_typeof("connectedTerminals") = 'array' AND jsonb_array_length("connectedTerminals") <= 10);

-- A resident suggesting a position for a listed TODA either moves its main terminal
-- (FALSE, the old behaviour) or adds another terminal (TRUE).
ALTER TABLE "toda_submission" ADD COLUMN "connectedTerminal" BOOLEAN NOT NULL DEFAULT FALSE;

-- As before, plus: a connected-terminal submission for a listed TODA keeps the main
-- terminal and appends its own to "connectedTerminals". For a TODA not listed yet it
-- becomes the main terminal, since there is nothing to connect it to.
CREATE OR REPLACE FUNCTION "approve_toda_submission"(submission_id TEXT, toda_id TEXT, reviewer_email TEXT)
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
    "terminalDescription" = CASE WHEN s."connectedTerminal" THEN t."terminalDescription" ELSE EXCLUDED."terminalDescription" END,
    "barangay" = CASE WHEN s."connectedTerminal" THEN t."barangay" ELSE EXCLUDED."barangay" END,
    "lat" = CASE WHEN s."connectedTerminal" THEN t."lat" ELSE COALESCE(EXCLUDED."lat", t."lat") END,
    "lng" = CASE WHEN s."connectedTerminal" THEN t."lng" ELSE COALESCE(EXCLUDED."lng", t."lng") END,
    "connectedTerminals" = CASE WHEN s."connectedTerminal"
      THEN t."connectedTerminals" || jsonb_build_array(jsonb_build_object(
        'terminalDescription', s."terminalDescription", 'barangay', s."barangay", 'lat', s."lat", 'lng', s."lng"))
      ELSE t."connectedTerminals" END,
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

-- CREATE OR REPLACE keeps the grants from 20261017043500; restated so this file reads alone.
REVOKE EXECUTE ON FUNCTION "approve_toda_submission"(TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION "approve_toda_submission"(TEXT, TEXT, TEXT) TO service_role;
