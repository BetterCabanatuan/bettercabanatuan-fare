-- Starter TODAs at the malls and at Crossing, so the directory isn't empty and riders can
-- correct or add positions through "Suggest another position". A migration rather than
-- supabase/seed.sql because seed.sql only runs on a local `db reset`; these rows have to
-- reach the live database.
--
-- Nothing here is confirmed on site. Each position is the OpenStreetMap feature of the
-- landmark (fetched 2026-10-17, data © OpenStreetMap contributors, ODbL), not the spot
-- where the tricycles queue, and the descriptions say so. The barangay is the OSM address
-- of that feature. Units, contact and barangays served are left empty rather than guessed.
-- The ids are todaSlug(name) (src/lib/toda/submission.ts), so a resident's submission
-- with the same name updates the row.
--
-- DO NOTHING: re-running never overwrites what an admin has since edited.
INSERT INTO "toda" ("id", "name", "terminalDescription", "barangay", "lat", "lng", "barangaysServed", "source", "lastVerified")
VALUES
  -- OSM way 116576599 (SM Mega Center, landuse=retail).
  ('sm-mega-cabanatuan-toda', 'SM Mega Cabanatuan TODA',
   'SM Megacenter Cabanatuan (approximate position; where the tricycles wait is not confirmed yet)',
   'San Roque Norte', 15.48781, 120.96790, '{}', 'community', '2026-10-17'),
  -- OSM way 160105347 (SM City Cabanatuan, shop=mall). Its transport terminal (way 749118496) is jeeps.
  ('sm-city-of-cabanatuan-toda', 'SM City of Cabanatuan TODA',
   'SM City Cabanatuan, Maharlika Highway (approximate position; where the tricycles wait is not confirmed yet)',
   'San Juan Poblacion', 15.46685, 120.95507, '{}', 'community', '2026-10-17'),
  -- OSM way 116466809 (NE Pacific Mall, shop=mall).
  ('ne-pacific-mall-toda', 'NE Pacific Mall TODA',
   'NE Pacific Mall, Maharlika Highway (approximate position; where the tricycles wait is not confirmed yet)',
   'San Juan Poblacion', 15.46021, 120.94865, '{}', 'community', '2026-10-17'),
  -- OSM has no feature named Crossing. This is the Jollibee on Maharlika Highway (node
  -- 1313121668), beside the Shell station (node 951497239) the jeep data calls Shell Crossing.
  ('crossing-toda', 'Crossing TODA',
   'Crossing, Maharlika Highway, near Jollibee and Shell (approximate position; where the tricycles wait is not confirmed yet)',
   'Dicarma', 15.49301, 120.97547, '{}', 'community', '2026-10-17')
ON CONFLICT ("id") DO NOTHING;
