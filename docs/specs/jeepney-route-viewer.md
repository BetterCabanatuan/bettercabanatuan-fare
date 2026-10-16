# Jeepney Route Viewer (map): UI/UX specification

| | |
|---|---|
| Status | Draft for review. **Blocked on route data (see §3).** |
| Last updated | 2026-10-16 |
| Related | [Tricycle Fare Estimator spec](tricycle-fare-estimator.md) (defines the shared map and the A/B selection), `data/jeepney/routes.json`, `data/jeepney/fare-rules.json` |

## 1. Purpose

On the same map used for tricycle fares, a commuter can:

1. pick a jeepney station and see the routes that serve it, or
2. set point A and point B and see whether a jeepney route connects them, where to board, where to get off, and the fare.

**This feature is built only for routes that have confirmed data.** No route is shown, and no fare is computed from a route, until its line and stops are confirmed (§3, §9).

## 2. Users and situations

- **Rider going to a nearby town** (Talavera, Santa Rosa, Gapan, Palayan…) who wants to know which jeep to take and where it leaves from.
- **Rider getting off partway** who needs the fare to a stop before the end of the line.
- **Rider new to Cabanatuan** who doesn't know which terminal serves which town.

## 3. Route data status

> **[FILL: confirm availability of jeepney route data for Cabanatuan City]**
> The viewer must not assume this data exists.

What is known as of 2026-10-16:

| Source | What it has | What it lacks |
|---|---|---|
| `data/jeepney/routes.json` | 15 routes out of Cabanatuan (e.g. to Talavera, San Jose City, Gapan, Zaragoza, Bongabon), with names, "via" towns, jeep type and a terminal for most | **No stops, no km markers, no route lines.** Several "via" fields are TODO. All routes are intercity. **[FILL: are there jeepney routes inside the city?]** |
| OpenStreetMap (checked 2026-10-16, partial) | Terminal locations, e.g. Cabanatuan City Central Transport Terminal, Cabiao Jeep Terminal, SM City Cabanatuan and WalterMart transport terminals; several provincial bus routes passing through | No jeepney route lines found for Cabanatuan |
| LPTRP (the city's Local Public Transport Route Plan) and LTFRB Region III franchise list | The official list of routes | **[FILL: request from the city and LTFRB Region III]** |

**Data each route needs before it can appear on the map:**

| Field | Description | Required |
|---|---|---|
| Route ID and name | e.g. "Cabanatuan – Talavera" | Yes |
| Jeep type | Traditional or modern (sets the fare rates) | Yes |
| Route line per direction | The road path from end to end, one for each direction (outbound and return can differ because of one-way streets) | Yes |
| Terminal(s) | Name and location of each end | Yes |
| Stops | Ordered list of named stops with location and distance from the terminal in km | Recommended (see §5.3) |
| Source and date verified | LPTRP, franchise, or a mapped ride, with date | Yes |
| Status | Active, suspended or unverified | Yes |

**[FILL: how lines will be collected: tracing in OpenStreetMap, riding each route with a GPS tracker app, or both]**

## 4. Functional requirements

### 4.1 Availability

- **FR-1** The map has a mode switch: **Tricycle** and **Jeep**.
- **FR-2** If **no** route has a confirmed line, the Jeep mode shows an empty state instead of a map search (§6.3). The existing distance-based jeep fare calculator stays available.
- **FR-3** If **some** routes have confirmed lines, only those routes appear on the map. Routes without lines appear in a "Routes still being mapped" list with name, terminal and type, without a line or a fare.

### 4.2 Choosing a station

- **FR-4** In Jeep mode the map shows terminal and stop markers for routes with confirmed data. Markers are hidden at low zoom and grouped when crowded.
- **FR-5** Tapping a station opens a card with its name, its barangay, and the routes serving it (route name, jeep type, direction).
- **FR-6** Tapping a route in the card highlights that route's line, dims the others, and lists its stops in order in the side panel.
- **FR-7** From the station card the user can choose "Board here" (sets it as the boarding point) or "Get off here" (sets it as the drop-off point).

### 4.3 Choosing point A and point B

- **FR-8** Point A and point B work exactly as in the tricycle spec (tap, search, location, recent places, drag, swap, clear). Switching modes keeps A and B.
- **FR-9** With both points set, the system looks for routes where:
  - a boarding point is within walking distance of A,
  - a drop-off point is within walking distance of B, and
  - the drop-off comes after the boarding point in the route's direction of travel.

  Walking distance limit: **[FILL: e.g. 500 m]**.
- **FR-10** Matching routes are listed and sorted by total walking distance, then by fare. Each item shows route name, jeep type, where to board, where to get off, walking distance at each end, distance on the jeep, and fare.
- **FR-11** Selecting a result draws, on the map:
  - a dashed walking line from A to the boarding point
  - the jeep route line between boarding and drop-off, solid and highlighted
  - the rest of the route, faded
  - a dashed walking line from the drop-off point to B
- **FR-12** Trips needing two jeeps (one transfer) are out of scope for the first version. **[FILL: confirm]**

### 4.4 Fare

- **FR-13** The fare uses `data/jeepney/fare-rules.json` and the jeep type of the route:

  | Jeep type | First 4 km | Each km after |
  |---|---|---|
  | Traditional | ₱14.00 | ₱2.00 |
  | Modern | ₱17.00 | ₱2.40 **[FILL: confirm ₱2.40; a March 2026 report said ₱2.30]** |

  Students, seniors and PWDs get 20% off. The student discount applies on school days.
- **FR-14** Distance is the distance **along the route** between the boarding and drop-off points, not the road distance from A to B.
- **FR-15** Steps:
  1. distance on the jeep
  2. billable km using the official rule **[FILL: part-km rule and rounding of the discounted fare from the LTFRB fare matrix]**
  3. regular fare = first-4-km fare + (billable km beyond 4 × per-km rate)
  4. discounted fare = regular fare minus 20%, rounded per the LTFRB matrix

  Both fares are shown side by side.
- **FR-16** Worked examples (traditional jeep, no rounding applied yet):
  - 3 km → ₱14.00 regular, ₱11.20 discounted
  - 10 km → ₱14 + 6 × ₱2 = ₱26.00 regular, ₱20.80 discounted
- **FR-17** A basis line sits under every fare: "Based on the LTFRB fare adjustment effective 28 Sept 2026 (DOTr memo, 25 Sept 2026). Last checked **[date]**."

### 4.5 Language and accessibility

- **FR-18** All text is in English and Tagalog.
- **FR-19** Results and stop lists are readable as text without the map. Route colours are paired with route names and patterns, so routes are never told apart by colour alone.

## 5. Boarding and drop-off points

### 5.1 How jeeps actually stop

Jeepneys in the Philippines often pick up and drop off anywhere along the route, not only at marked stops. The viewer has to reflect that.

### 5.2 Option A: board anywhere along the line

The boarding point is the place on the route line nearest to A. The drop-off point is the place nearest to B. Distance is measured along the line between them. This needs route lines but **no stop list**.

### 5.3 Option B: named stops only

The boarding point is the nearest named stop to A, and the drop-off point is the nearest named stop to B. Distance comes from the stops' km markers. This needs a **full stop list** for each route.

**[FILL: choose option A, B, or A with named stops shown as landmarks. Recommendation: A, because it matches how riders use jeeps and needs less data.]**

## 6. UI wireframe descriptions

### 6.1 Desktop (1024 px and wider)

```
+------------------------------------------------------------------+
| Site header: logo · Jeep · Tricycle · TODA · Sources · Report · EN/TL |
+---------------------------+--------------------------------------+
| LEFT PANEL (about 400 px) | MAP                                  |
| Mode tabs: [Tricycle] [Jeep]  station markers, route lines,       |
|                           | pins A and B, walking lines (dashed) |
| From (A) [search......] ⦿ |                                      |
| To   (B) [search......]   |                                      |
|                           |                                      |
| ROUTES FOUND (2)          |                                      |
|  ▸ Cabanatuan–Talavera    |                                      |
|    Traditional · walk 300 m + 150 m                              |
|    Board: [stop/point] · Get off: [stop/point]                   |
|    8.4 km · ₱24.00 / ₱19.20                                      |
|  ▸ [second route]         |                                      |
|                           |                                      |
| SELECTED ROUTE            |                                      |
|  stop list with the board and get-off stops marked               |
|  fare card: regular | student/senior/PWD                         |
|  basis line · last checked|                                      |
|                           |                                      |
| Routes still being mapped |                                      |
|  (collapsed list)         |                                      |
+---------------------------+--------------------------------------+
```

The fares in the box show the layout only (traditional jeep, 8.4 km billed as 9 km under the part-km assumption). They are not confirmed figures.

### 6.2 Phone (below 768 px)

- Full-screen map with a bottom sheet, as in the tricycle spec.
- Peek height: From and To fields. Half height: the top route result with its fare. Full height: all results, the stop list and the basis line.
- Tapping a station opens a small card above the sheet with the routes serving it and the "Board here" / "Get off here" buttons.

### 6.3 Empty state (no route data confirmed)

- The map shows terminal markers only, if their locations are confirmed.
- The panel says: "Jeepney routes are still being mapped. Meanwhile, you can compute a jeep fare by distance." It has a button to the distance calculator and a link to the list of known routes and terminals.
- A secondary link: "Know a route? Help us map it." **[FILL: where submissions go]**

### 6.4 Map details

- Station markers: small white circles with a dark outline. Terminals are larger and labelled.
- Selected route: thick line in the route's colour with a white outline. Other routes are thin and faded.
- Direction arrows along the selected route at regular spacing.
- Walking segments: grey dashed lines.

## 7. Data flow (text description)

1. **Page load.** Route data, stops, terminals and fare rules are built into the page from `data/jeepney/`. Routes without a confirmed line are kept out of the map layer and listed separately.
2. **Station path.** Tap a station → look up the routes serving it → show the station card → choose a route → highlight its line and list its stops → "Board here" or "Get off here" sets that point.
3. **A/B path.** A and B coordinates (shared with tricycle mode) → for each confirmed route and direction, find the nearest point on the line to A and to B (or the nearest stop, depending on §5) → keep routes where both are within walking distance and the order is correct → measure distance along the route → compute the fare (FR-15) → sort and list.
4. **Select result.** The chosen route → draw the walking lines, the riding segment and the faded remainder → show the stop list and fare card.
5. **No match.** No route passes → show the no-route message and the tricycle fallback (§8).
6. **Offline.** Route matching and fares use only data already in the page, so they work offline once the page has loaded. Only the base map tiles and place search need a connection. **[FILL: confirm offline map tiles are out of scope]**

## 8. Edge cases

| Situation | What the user sees | What the system does |
|---|---|---|
| No route data confirmed (current state) | Empty state from §6.3 | No route matching runs. The distance calculator remains. |
| Some routes confirmed, others not | Confirmed routes on the map, others in "Routes still being mapped" | Unconfirmed routes never get a line or a route-based fare. |
| No route connects A and B | "No jeepney route found between these points." plus "Check the tricycle fare instead" (switches mode with A and B kept) | **[FILL: later, suggest tricycle to the nearest jeep route]** |
| A route passes near A and B but in the wrong order | That route is not listed | It is excluded by the direction check in FR-9. |
| A and B both near the same stop, or under 500 m apart | "These points are close. Walking or a tricycle may be easier." | Shows the jeep minimum fare if a route matches. |
| Point is near a route but farther than the walking limit | "Nearest jeep route is [route name], [distance] away." | Lists it separately, flagged "longer walk". |
| Route loops, or outbound and return use different streets | Correct direction shown with arrows | Each direction is matched on its own line. |
| Route suspended or out of date | Route greyed out with "Suspended" or "Not verified since [date]" | Excluded from matching. Fare still shown in the route list. |
| Jeep type unknown for a route | "Fare unavailable: jeep type not confirmed" | Route line shown, fare hidden. |
| Fare rules missing or fail to load | "Jeep fares are not available right now." | Routes still shown, fares hidden. |
| Rounding rule not yet confirmed (current state) | Fares shown to the centavo | **[FILL: apply the official rounding once confirmed]** |
| Base map can't load (offline) | "Map unavailable offline. Your routes and fares are still listed." | The text list still works from built-in data. |

## 9. Assumptions

- Jeepney fares follow the LTFRB rates in `data/jeepney/fare-rules.json` and apply in Region III. **[FILL: confirm against the LTFRB Region III fare matrix]**
- A route line traced from a GPS ride or from OpenStreetMap is accurate enough to measure distance along the route to within **[FILL: e.g. 0.2 km]**.
- Route data is updated by pull request, like the other data files. Each route records who verified it and when.
- No route is shown as confirmed unless it has a source and a verification date.

## 10. Open items

| # | Item | Owner |
|---|---|---|
| 1 | **Whether jeepney route data exists for Cabanatuan** (LPTRP, LTFRB Region III franchises) | Project developer |
| 2 | Whether there are jeepney routes inside the city, not just to other towns | Same |
| 3 | Route lines and stops for each route (OSM tracing or GPS rides) | Same plus community |
| 4 | Option A or B for boarding points (§5) | Product decision |
| 5 | Walking distance limit | Product decision |
| 6 | Modern jeep per-km rate (₱2.40 vs ₱2.30) and the official rounding rule | Project developer, via the LTFRB fare matrix |
| 7 | Transfers between two routes | Product decision, later version |
| 8 | Where "Help us map it" submissions go | Project developer |
