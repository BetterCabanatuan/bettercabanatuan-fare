-- Points the rider says the jeep passes through between A and B, in travel order, as
-- [lng, lat] pairs. The road line is fetched through them when an admin approves the
-- route (src/app/[lang]/admin/routes/actions.ts), so it follows the jeep's real road
-- instead of the shortest one. Older submissions get [] and approve as before.
--
-- The app checks each pair (src/lib/routes/submission.ts); this CHECK only stops a
-- bypassed check from storing an unbounded list.
ALTER TABLE "route_submission"
  ADD COLUMN "waypoints" JSONB NOT NULL DEFAULT '[]'
  CHECK (jsonb_typeof("waypoints") = 'array' AND jsonb_array_length("waypoints") <= 12);
