# Tricycle Fare Estimator (map): UI/UX specification

| | |
|---|---|
| Status | Draft for review |
| Last updated | 2026-10-18 |
| Related | [Jeepney Route Viewer spec](jeepney-route-viewer.md), `data/tricycle/fare-matrix.json`, `data/pamasahe-handoff/CLAUDE.md`, [tricycle fare research](../research/tricycle-fares-and-tariffs.md) |

## 1. Purpose

A commuter in Cabanatuan City puts two points on a map: where the trip starts (point A) and where it ends (point B). The page shows the tricycle fare for that trip, how it was worked out, and where the rates come from. The aim is to settle "magkano?" before the ride, not argue about it after.

This page and the [Jeepney Route Viewer](jeepney-route-viewer.md) share one map. This document defines the shared map and the A/B selection. The jeepney spec reuses them.

## 2. Users and situations

- **Rider at a terminal or on the street**, on a phone with mobile data, often in sunlight, sometimes with weak signal. Needs a number in under 30 seconds.
- **Rider planning ahead** at home on a laptop. Has time to check the route and the breakdown.
- **Rider in a dispute** who shows the screen to the driver. The fare, the distance and the source must be readable at arm's length.
- **Driver or TODA officer** checking that the app agrees with the official fare matrix.

## 3. Inputs and data sources

| Input | Source | Status |
|---|---|---|
| Base map (streets, landmarks) | OpenStreetMap through the map library already in the project (MapLibre with CARTO basemap styles) | Available |
| Road distance from A to B | A routing service that follows real roads **[FILL: choose provider, e.g. OSRM, Valhalla, GraphHopper or OpenRouteService; check usage limits and terms]** | Not chosen |
| Place search (type a place name) | A geocoding service **[FILL: choose provider, e.g. Nominatim or Photon; Nominatim does not allow search-as-you-type]** plus a short curated list of landmarks | Not chosen |
| Curated landmarks | A new data file of common pickup and drop-off points (e.g. Cabanatuan City Central Transport Terminal, SM City Cabanatuan, NE Pacific Mall, WalterMart Cabanatuan) **[FILL: final list and coordinates]** | To build |
| Barangay names and boundaries | `barangays.json` from the BetterCabanatuan repo **[FILL: confirm it includes boundaries, not just names]** | To import |
| Fare rules | `data/tricycle/fare-matrix.json` | **Unconfirmed** (see §5.1) |
| City limits | City boundary from OpenStreetMap or the city **[FILL: source]** | To build |
| User's location | Browser location, only after the user taps "Use my location" | Available |

The site has no server of its own (static site). The routing and search services are called directly from the user's browser. Only coordinates and typed search text are sent, never personal data.

## 4. Functional requirements

### 4.1 Choosing point A and point B

- **FR-1** The map opens centred on Cabanatuan City at a zoom level where main roads and landmarks are readable.
- **FR-2** The user can set each point in four ways:
  1. Tap or click the map.
  2. Type in a search box and pick a result. Curated landmarks are listed first.
  3. Tap "Use my location" (point A only by default).
  4. Pick from recent places stored on the device.
- **FR-3** The first point set becomes A and the second becomes B. After that, a tap moves whichever point is currently selected in the panel ("Editing: A" or "Editing: B").
- **FR-4** Both pins can be dragged. The fare updates when the drag ends.
- **FR-5** A "Swap" button switches A and B. A "Clear" button removes both.
- **FR-6** Each pin moves to the nearest road a tricycle can use, and the panel shows the street or landmark name and the barangay.
- **FR-7** The page address carries A and B, so a link to the exact trip can be shared or bookmarked. **[FILL: confirm that putting coordinates in the link is acceptable for privacy; it is the user's choice to share it]**

### 4.2 Route and distance

- **FR-8** Once A and B are both set, the page asks the routing service for the road route and draws it on the map.
- **FR-9** Distance is the road distance along that route, not a straight line.
- **FR-10** The panel shows the distance to one decimal place (e.g. "4.6 km") and the **billable distance** used for the fare (see §5.2).
- **FR-11** The route avoids roads tricycles may not use, where the routing service allows it. DILG has directed LGUs to keep tricycles off national highways (DILG Memorandum Circular 2020-036). **[FILL: confirm which stretches of Maharlika Highway and other national roads Cabanatuan restricts, and where crossings are allowed]**
- **FR-12** If the trip leaves the city limits, the page warns that this is likely a special trip and the matrix fare may not apply (see §8).

### 4.3 Passengers

- **FR-13** Two counters: **Regular** and **Discounted (student, senior, PWD)**. Default is 1 regular, 0 discounted.
- **FR-14** The total number of passengers is at least 1 and at most 3 (Ord. 050-2026 Sec. 4.2).
- **FR-14a** A **Special trip** switch, available only when there is 1 passenger, doubles the fare (Sec. 2d). It is off by default because a special trip applies only when the passenger asks for one.
- **FR-15** A short note says that discounted riders should show a valid ID.

### 4.4 Fare result

- **FR-16** The result shows:
  - the **total fare** in large type
  - a "Special trip" badge when the special-trip switch is on
  - one line per passenger type with count, per-person fare and subtotal
  - the extra-kilometre charge, if any
  - the billable distance
- **FR-17** Below the result, a **basis line** names the source and date, e.g. "Based on the 2026 Tricycle Fare Matrix Ordinance of Cabanatuan City, ordinance no. 050-2026. Last checked 18 Oct 2026."
- **FR-18** While the matrix is unconfirmed, a yellow "Not yet confirmed with the city" notice appears above the result. It cannot be dismissed.
- **FR-19** A "Charged more than this?" link opens the Report page with vehicle type, route, distance and correct fare already filled in.
- **FR-20** A "Show the driver" button enlarges the fare, distance and source to full screen for showing at arm's length.

### 4.5 Language and accessibility

- **FR-21** All labels, messages and results exist in English and Tagalog, switched by the site-wide language toggle.
- **FR-22** Everything works without the map. Search fields let keyboard and screen-reader users set A and B and get the same fare.
- **FR-23** Touch targets are at least 44 × 44 px. Text contrast meets WCAG AA. Pins differ by letter (A, B) as well as colour.

## 5. Fare estimation logic

### 5.1 Rates (from `data/tricycle/fare-matrix.json`, unconfirmed)

Ordinance No. 050-2026, base fuel band (gasoline ₱50.00–59.99/L). Per passenger; there is no solo/shared split.

| | Regular | Discounted (student, senior, PWD) |
|---|---|---|
| First 3 km | ₱35.00 | ₱28.00 |
| Each succeeding km, or part of a km | + ₱5.00 | + ₱4.00 |
| Special trip, first 3 km (2 × fare) | ₱70.00 | ₱56.00 |

The rates are read from a certified true copy of the ordinance. They stay unconfirmed until the legal effective date (15 days after newspaper publication, Sec. 15) and any fuel-price provisional rate (Sec. 5) are known. Fare stickers launch 2026-10-19. Sources and open questions: [tricycle fare research](../research/tricycle-fares-and-tariffs.md).

### 5.2 Steps

1. **Distance.** Take the road distance from the routing service, in km.
2. **Billable distance.** Round the displayed distance (0.1 km) **up** to a whole km, at least 1 km. The ordinance charges every succeeding 0.01–1.00 km as a full km (Sec. 3, Sec. 4.1). Rounding the displayed distance, not the raw one, keeps the billed km consistent with the km the rider sees, so 3.04 km (shown as 3.0 km) is billed as 3 km.
3. **Extra km.** Extra km = billable distance minus 3. If that is below zero, use zero.
4. **Per-person fare.** For each passenger type: first-3-km rate for that type + (extra km × that type's per-km rate: ₱5.00 regular, ₱4.00 discounted).
5. **Special trip.** If the passenger asked for a special trip, multiply the fare by 2.
6. **Total.** (Regular count × regular per-person fare) + (discounted count × discounted per-person fare).
7. **Display.** Show amounts in pesos with two decimals. All arithmetic is done in whole centavos to avoid rounding errors.

### 5.3 Worked examples (for review and for tests)

| Trip | Billable km | Passengers | Calculation | Total |
|---|---|---|---|---|
| 2.4 km | 3 | 1 regular | ₱35 | **₱35.00** |
| 2.4 km | 3 | 1 discounted | ₱28 | **₱28.00** |
| 3.1 km | 4 | 1 regular | ₱35 + 1 × ₱5 | **₱40.00** |
| 4.6 km | 5 | 2 regular | 2 × (₱35 + 2 × ₱5) | **₱90.00** |
| 6.0 km | 6 | 1 regular + 1 discounted | (₱35 + 3 × ₱5) + (₱28 + 3 × ₱4) | **₱90.00** |
| 11.4 km | 12 | 1 regular | ₱35 + 9 × ₱5 | **₱80.00** |
| 11.4 km, special trip | 12 | 1 regular | 2 × (₱35 + 9 × ₱5) | **₱160.00** |
| 14.4 km | 15 | 1 discounted | ₱28 + 12 × ₱4 | **₱76.00** |

### 5.4 Not covered yet

- **Fuel-price provisional rates (Sec. 5).** For every ₱10/L rise in gasoline, the city's Tricycle Franchising and Regulatory Board may set +₱2.50 base and +₱0.50 per km, for up to 60 days. Not modelled; the fare table carries a note telling riders to check the sticker. **[FILL: whether a provisional rate is in force and what the stickers show]**
- **Barangay fare table (Sec. 4).** The ordinance also lists fixed fares from the City Supermarket TODA terminal to 89 barangays. Above about 6.5 km they are lower than the per-km formula. Planned: show the table fare next to the formula for terminal trips. **[FILL: which one governs, from the TMLU]**
- **Special trips off the terminal.** The ordinance defines the 2× rule for trips leaving the City Supermarket terminal; the calculator offers it for any solo trip. **[FILL: whether it applies to street pick-ups]**
- Night, rain and baggage surcharges: the ordinance has none, and Sec. 7 bans charging more than the approved rate.

## 6. UI wireframe descriptions

### 6.1 Desktop (1024 px and wider)

```
+------------------------------------------------------------------+
| Site header: logo · Jeep · Tricycle · TODA · Sources · Report · EN/TL |
+---------------------------+--------------------------------------+
| LEFT PANEL (about 400 px) | MAP (rest of the width)              |
|                           |                                      |
| Mode tabs: [Tricycle] [Jeep]  pins A and B, route line,           |
|                           | zoom +/-, "Use my location",         |
| From (A) [search......] ⦿ | city-limits outline (thin, grey)     |
| To   (B) [search......]   |                                      |
| [Swap] [Clear]            |                                      |
|                           |                                      |
| Passengers                |                                      |
|  Regular      [-] 1 [+]   |                                      |
|  Discounted   [-] 0 [+]   |                                      |
|                           |                                      |
| ! Not yet confirmed notice|                                      |
| RESULT CARD               |                                      |
|  ₱30.00  · Solo rate      |                                      |
|  4.2 km road · billed 4 km|                                      |
|  breakdown lines          |                                      |
|  [Show the driver]        |                                      |
| Basis line · last checked |                                      |
| Charged more? Report it → |                                      |
+---------------------------+--------------------------------------+
```

- The panel scrolls on its own. The map stays in place.
- Before A and B are set, the result card shows a short instruction: "Tap the map or search to set where you start and where you're going."

### 6.2 Phone (below 768 px)

- The map fills the screen under a compact header.
- A **bottom sheet** holds the panel, with three heights:
  - **Peek:** the From and To fields only.
  - **Half:** adds the passenger counters and the fare total.
  - **Full:** adds the breakdown, basis line and report link.
- Once both points are set, the sheet opens to half height automatically so the fare is visible.
- The search fields open a full-screen search list. Curated landmarks come first, then recent places, then search results.
- "Show the driver" fills the screen with the total, distance and source in very large type, with a close button.

### 6.3 Map details

- Pin A is a dark circle with "A". Pin B is a yellow circle with "B", outlined so it shows on light map tiles.
- The route line is thick (about 6 px) in the site's primary blue, with a white outline.
- Restricted roads (national highways) are not highlighted by default. **[FILL: decide whether to show them]**
- While the route loads, a thin progress bar runs along the top of the map. The previous fare stays visible but greyed out.

## 7. Data flow (text description)

1. **Page load.** The fare rules, curated landmarks and city boundary are built into the page from the JSON files in `data/`. No network call is needed for these.
2. **Set A.** User input (tap, search pick, or location) → coordinates → check they are inside the city → snap to the nearest road → place pin A and show its name and barangay.
3. **Set B.** Same as step 2, for B.
4. **Route request.** A and B coordinates → routing service → route line and road distance → draw the line on the map.
5. **Fare.** Road distance + passenger counts + fare rules → fare steps from §5.2 → result card. This runs in the browser, with no network call.
6. **Change.** A change to a pin repeats steps 2–5. A change to passenger counts repeats step 5 only.
7. **Share or report.** The current A, B, distance and fare → page link, or prefilled fields on the Report page.
8. **Offline.** If the routing service can't be reached, step 4 fails and the user is asked to try again (see §8).

## 8. Edge cases

| Situation | What the user sees | What the system does |
|---|---|---|
| A or B is outside Cabanatuan City | "This point is outside Cabanatuan City. City tricycle fares may not apply." | Shows the route and fare but labels the result "Estimate only, special trip likely". |
| A and B are the same or under 100 m apart | "Your start and end points are very close." | Shows the minimum fare (first-3-km rate). |
| Pin dropped in a field, river or building | Pin moves to the nearest road, with a short note "Moved to nearest road". | Snaps to the nearest road a tricycle can use. |
| No road route found | "We couldn't find a road route between these points. Try moving a pin closer to a road." | Keeps both pins. |
| Routing service unreachable (offline, quota, outage) | "Can't measure the route right now. Try again in a moment." | Keeps both pins and shows no fare until the route is measured. |
| Route only works by using a national highway | "This route uses [road name], where tricycles may be restricted." | Shows the fare. **[FILL: whether to block, warn, or reroute]** |
| Very long trip (over **[FILL: e.g. 15 km]**) | "For long trips from the City Supermarket terminal, the ordinance's list of barangay fares may show a lower fare. Check the sticker." | Shows the formula fare with the warning. |
| Fare data missing or fails to load | "Tricycle fares are not available right now." | Hides the result card. The map still works. |
| Fare matrix unconfirmed (current state) | Yellow notice from FR-18. | Always on until the data file is marked confirmed. |
| Location permission denied or inaccurate (over 100 m accuracy) | "We couldn't get your exact location. Tap the map or search instead." | Leaves A empty, or places it with an accuracy circle. |
| Search finds nothing | "No places found. Try a landmark or barangay name." | Suggests curated landmarks. |
| Driver takes a different road | Note under the distance: "Fare is based on the route shown. A different road may change the distance." | No automatic action. **[FILL: later, let users drag the route line]** |
| Too many passengers | The + button is disabled at the limit, with a short reason. | Enforces the maximum from FR-14. |

## 9. Assumptions

- Tricycle fares are set by the city, not LTFRB. The page always names the city ordinance as the source.
- Road distance from a routing service is close enough to what a driver's odometer would show. **[FILL: spot-check 10 real trips against the app before launch]**
- One per-km formula applies to the whole city. Ordinance 050-2026 also has a terminal-to-barangay fare table (see §5.4).
- Users can read a map. The search fields cover users who can't.

## 10. Open items

| # | Item | Owner |
|---|---|---|
| 1 | Effective date of Ord. 050-2026, fuel-price provisional rate, sticker amounts | Project developer, via TMLU |
| 2 | Barangay table vs. per-km formula for terminal trips | Same |
| 3 | Special trips off the terminal | Same |
| 4 | National highway restrictions in Cabanatuan | Same, via Transport Management and Legalization Unit |
| 5 | Routing provider and its limits | Project developer |
| 6 | Geocoding provider and curated landmark list | Project developer |
| 7 | City boundary source | Project developer |
| 9 | Whether trip coordinates in shared links are acceptable | Project developer |
