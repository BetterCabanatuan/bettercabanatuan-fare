# Pamasahe Cabanatuan: fare calculator (BetterCabanatuan companion app)

## What this is
A website (mobile app later) that tells Cabanatuan City commuters the correct fare for a trip, so arguments over tricycle and jeep fares stop. It answers a request from Cabanatuan residents. It is a standalone Next.js app, separate from the main BetterCabanatuan site (which is already deployed on the BetterGov LGU template), linked from that site's menu and reusing its colors, logo and fonts.

## Three sections
1. **Jeep fare calculator**: pick a route, choose where you board and where you get off, show regular and discounted fares.
2. **Tricycle fare calculator**: same idea, using the city's tricycle fare matrix.
3. **TODA directory**: each TODA's name, terminal, barangays served, official contact; answers "which TODA serves my area?"

Plus, everywhere: a "Report overcharging" page (plate number + city office/hotline), a Tagalog/English toggle, and a "basis + last updated" line under every fare (e.g. "Based on LTFRB fare adjustment effective 2026-09-28").

## Tech decisions (agreed)
- Next.js (App Router) + TypeScript + Tailwind.
- Static export, no backend. All fare math runs in the browser. Mobile-first, installable/offline-capable (PWA).
- Data lives in JSON files under `data/`, same pattern as the BetterGov LGU template, so fares can be updated by pull request without code changes. Reuse `barangays.json` from the BetterCabanatuan repo.
- All fare logic in one module, `lib/fare.ts`, separate from UI, with unit tests for every case: minimum fare, per-km charges, discounts, rounding, multi-passenger tricycle rates. People will use these numbers in real disputes, so the math must be provably right.
- Deploy on the same host as BetterCabanatuan, on its own subdomain.
- Later: map view with Leaflet + OpenStreetMap; community-submitted corrections.

## Planned pages
`/` (choose Jeep or Tricycle), `/jeep`, `/tricycle`, `/toda`, `/toda/[id]`, `/sources`, `/report`.

## Phases
- **Phase 1**: jeep calculator (fare rules are known) + TODA directory structure.
- **Phase 2**: tricycle calculator (built on Ord. 050-2026; confirm the open items below).
- **Phase 3**: map view and community corrections.

## Data status (see each file's `_status` field)
- `data/jeepney/fare-rules.json`: **ready**. Effective 2026-09-28. Traditional P14 first 4 km + P2/km; modern P17 first 4 km + P2.40/km; 20% off for seniors, PWDs, and students (students every day, per MC 2017-024). Traditional rates confirmed by the official LTFRB PUJ General Fare Guide (https://drive.google.com/file/d/15IcGdAKFdlSAqaCy8SHh759e6OP8mIZF/view), which rounds fares to the nearest 25 centavos. Modern rates still need the LTFRB modern PUJ guide.
- `data/jeepney/routes.json`: 15 routes with names, via, and sources; **stops and km markers still empty**. Authoritative list = the city's LPTRP (Local Public Transport Route Plan) / LTFRB Region III franchises. `reportedFare` values are old third-party snapshots, sanity check only.
- `data/tricycle/fare-matrix.json`: **unconfirmed**. Ordinance No. 050-2026 (passed 2026-04-14, signed 2026-04-28, provincial approval 2026-08-18, stickers from 2026-10-19): per passenger P35 first 3 km (P28 discounted), +P5 (P4) per succeeding km or part of a km, max 3 passengers, requested special trip = 2 fares. Read from a certified copy shared by a student council. Unknown: legal effective date, whether a fuel-price provisional rate is in force, and whether the terminal-to-barangay fare table or the per-km formula governs. The previous matrix (Nov 2018) is in `history`. Details: `docs/research/tricycle-fares-and-tariffs.md`.
- `data/toda/todas.json`: **empty schema**. No public TODA list exists online. Publish only official TODA contacts, not personal phone numbers, unless the person consents.

## Open items (owner: project developer)
- Request from the city (City Legalization Division / City Economic Enterprise and Public Utilities Management Office, Transport Management and Legalization Unit): an official copy of Ord. 050-2026 and its publication date, whether a fuel-price provisional rate is in force, barangay table vs. formula, the 2018 ordinance number, the TODA list, and the LPTRP.
- Map jeep stops and km markers (ride each route with a GPS tracker app, or trace in OpenStreetMap).
- Decide the site disclaimer: community-made unless the LGU endorses it.

## Key sources
- Jeep fares: https://cebudailynews.inquirer.net/769811/dotr-oks-jeepney-fare-increase-effective-monday , https://mb.com.ph/2026/09/25/dotr-approves-delayed-jeepney-fare-hike-to-cushion-rising-fuel-costs
- Tricycle Ord. 050-2026 (certified copy): https://drive.google.com/file/d/14QDtG_-Q6CjbAoXCFQQ3emCDIAClyaX1/view
- Tricycle 2026 draft (superseded): https://www.rappler.com/newsbreak/fact-check/new-cabanatuan-city-fare-matrix-ordinance-draft-not-yet-in-force/
- Tricycle current matrix: https://www.researchgate.net/publication/389360461_Economic_Suitability_of_Electronic_Fare_Meters_for_Tricycle_Drivers_in_Cabanatuan_City
- City transport office: https://zamboangacity.gov.ph/cabanatuan-officials-benchmark-best-practices-in-zambo-visit/
- Tricycles are LGU-regulated, not LTFRB: https://foi.gov.ph/requests/list-of-tricycle-operators-and-drivers-toda-in-metro-manila-and-the-number-of-unit
