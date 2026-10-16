# Jeepney routes and fares: research notes

| | |
|---|---|
| Checked | 2026-10-16 |
| Scope | Two specific routes (Crossing ↔ Fort Magsaysay, NE Pacific Mall ↔ Crossing), the jeepney fare rules, and a sanity pass over `data/jeepney/routes.json` |
| Related | `data/jeepney/routes.json`, `data/jeepney/fare-rules.json`, `data/pamasahe-handoff/CLAUDE.md`, `docs/specs/jeepney-route-viewer.md` |

**Source labels:** **primary** means an LTFRB, DOTr, OTC, LGU or statute document. **secondary** means news, including state media (PNA, PIA). **community** means a blog, aggregator, map app or OpenStreetMap, and it is unverified.

**Access caveat:** ltfrb.gov.ph, otc.gov.ph, legacy.senate.gov.ph, rappler.com, mb.com.ph and pia.gov.ph all returned HTTP 403 to automated fetches. Two PNA article URLs now return 404. Where these notes cite one of those pages, the content comes from a search-result excerpt, not from reading the page. Each case is marked.

---

## Summary

1. **Crossing ↔ Fort Magsaysay: route exists. Present in `routes.json` as `cab-fortmagsaysay`, but thinly sourced and missing the operator.**
   - Evidence that it runs: the General Tinio LGU site (primary, 2022), an accredited operator cooperative (OTC masterlist), and a community-mapped terminal on Del Pilar St. near the Shell station at "Crossing".
   - No official franchise (PA/CPC) route description, LPTRP entry or via-list was found.
   - No evidence it runs via Palayan city proper or continues to Laur.
2. **NE Pacific Mall ↔ Crossing: not found. Missing from `routes.json`, and nothing supports adding it.**
   - No primary, secondary or community source names a jeepney route between these two points.
   - There is one lead on intra-city service: a "Cabanatuan City Loop Transport Cooperative" appears in the OTC masterlist. Its route is unknown.
3. **Fare rates: correct per consistent secondary reporting, but not yet verified against a primary LTFRB document.**
   - The base rates match the reporting: traditional ₱14 for the first 4 km + ₱2.00/km; modern ₱17 for the first 4 km + ₱2.40/km; effective 2026-09-28 under a DOTr memo of 2026-09-25.
   - No source reports a Region III or provincial rate that differs from NCR. The previous ₱13 base (Oct 2023) was nationwide.
   - **`discountNotes` is wrong.** The student discount applies for the whole enrollment period, including weekends and holidays (RA 11314), not "school days" only.
   - **Rounding can now be filled in.** Fares are rounded to the nearest ₱0.25. Community fare tables show this, and it matches LTFRB's earlier fare guides.
   - No LTFRB memorandum circular or board resolution number was found.
4. **Other routes:** several are sourced only from aggregators or unrelated pages (a real-estate listing, a Flickr photo).
   - Two `reportedFare` values are attributed to the wrong source and jeep type.
   - Some routes are served by both traditional and modern jeeps, which the single `type` field can't express.
   - The PNA source links have gone dead (404).
   - At least six Cabanatuan routes with evidence are missing (Guimba, Llanera, Rizal, Sto. Domingo, Sta. Rosa, San Antonio).

---

## Findings

### Q1. Cabanatuan Crossing ↔ Fort Magsaysay

| Claim | Source | Type |
|---|---|---|
| Commuters to General Tinio can take "Fort Magsaysay Jeepney Operators that pass-through Cabanatuan - Fort Magsaysay Road" (page dated 2022-04-28) | https://www.generaltinio.gov.ph/view/article/8 | **primary** (LGU), but it describes the route only incidentally |
| Operator: **Fort Magsaysay-Cabanatuan City Transport Service Cooperative**, #576, Region III, Nueva Ecija, address in Cabanatuan City (626 Luz St., De Guzman Subd., Bantog Norte) | OTC Transport Cooperative Masterlist as of July 2023, rehosted at https://ltoportal.ph/wp-content/uploads/2023/12/TC-Masterlist-as-of-July-2023-PDF-1.pdf (ltoportal.ph is not an official LTO site). Also listed in the OTC Jan 2021 list, https://otc.gov.ph/wp-content/uploads/2021/02/Accredited-Transport-Cooperatives-Jan-2021-Web.pdf (403, seen via search excerpt only) | **primary document via unofficial mirror**. This is cooperative accreditation, not a franchise. |
| "Fort Magsaysay-Cabanatuan Transport Service Cooperative Jeepney Terminal", Del Pilar Street, Cabanatuan City, Plus Code FXVF+7QM. Decoded, that is about 15.4932, 120.9744. | https://www.waze.com/live-map/directions/ph/central-luzon/cabanatuan-city/fort-magsaysay-cabanatuan-transport-service-cooperative-jeepney-terminal?to=place.ChIJF74uFCUplzMRasFcEWUXrnQ | community / unverified |
| "Regular jeepney route from Cabanatuan City to Fort Magsaysay's South Gate… Jeep terminal is located at the back of Shell Crossing" (blog author's reply to a comment, 2023-06-10) | https://www.lakadpilipinas.com/2015/08/nueva-ecija-travel-guide.html | community / unverified |
| OSM has a Shell station (node 951497239) at 15.4934, 120.9755, about 120 m from the Waze terminal point. Caltex, Petron, TotalEnergies and Flying V stations cluster within about 400 m, which suggests a major junction. OSM has **no** feature named "Crossing" and **no** jeepney route relations in the Cabanatuan area. | OpenStreetMap via Overpass, queried 2026-10-16 | community / unverified |
| The road is named "Cabanatuan City–Bangad–Fort Magsaysay Road". OSM ways are named "Bangad - Fort Magsaysay Road". | https://commons.wikimedia.org/wiki/Category:Cabanatuan_City-Bangad-Fort_Magsaysay_Road,_Nueva_Ecija ; OSM | community (the name appears to follow DPWH naming, not checked against DPWH) |
| Old fare snapshot of ₱20 (blog itinerary, updated 2022) | lakadpilipinas (above) | community, outdated |

**Not found:**
- An LTFRB franchise or route description (official route name, terminals, via-list).
- The route in the city's LPTRP.
- Whether the jeeps use Palayan city proper or continue to Laur.
- Whether "South Gate" is the actual end point. That comes from community sources only.

**What can be stated:** the route is commonly called "Cabanatuan City – Fort Magsaysay". It runs from Del Pilar St. near Shell/"Crossing" along the Cabanatuan–(Bangad)–Fort Magsaysay Road. It is operated by members of the Fort Magsaysay-Cabanatuan City TSC.

**In `routes.json`:** **present** as `cab-fortmagsaysay`.
- `terminal` is "Behind Shell Crossing (per a 2023 comment)", which is consistent with Waze.
- `operator` is missing.
- The only `source` is the blog comment.
- `type: "traditional"` is unverified. No source states the jeep type.
- `cab-laur` ("via: TODO") could share this corridor. Nothing found confirms or rules that out.

### Q2. NE Pacific Mall ↔ Cabanatuan Crossing

| Claim | Source | Type |
|---|---|---|
| NE Pacific Mall is on Maharlika Hwy, Brgy. H. Concepcion, with Robinsons Cabanatuan adjoining it | https://en.wikipedia.org/wiki/NE_Pacific_Mall | community |
| OSM places the mall (way 116466809) at 15.4602, 120.9488. That is about 4.6 km straight-line SSW of the Crossing terminal point. The SM City Cabanatuan Transport Terminal (OSM way 749118496) is about 0.8 km away at 15.4657, 120.9539. | OpenStreetMap via Overpass, 2026-10-16 | community / unverified |
| "Cabanatuan City Loop Transport Cooperative", #575, Padre Burgos (Pob.), Cabanatuan City. The name suggests an intra-city loop route; the route itself was not found. | OTC masterlist July 2023 (mirror above) | primary document via unofficial mirror |
| "Jeepneys from ₱8 for the first 4 km" in Cabanatuan, with no route named. The fare is pre-2018, so the page is stale. | https://en.wikivoyage.org/wiki/Cabanatuan | community, outdated |
| Commutetour lists 22 jeep and modern-jeep destinations from the Central Terminal. None is Pacific Mall or Crossing. | https://ph.commutetour.com/ph/terminal/cabanatuan/ (updated 2026-01-17) | community |

**Not found:** any source naming a jeepney route, franchise or terminal between NE Pacific Mall and Crossing. Searches covered LGU, LTFRB, news, Facebook-indexed pages and OSM.

**Inference, not verified:** southbound intercity jeeps on Maharlika Hwy (to Santa Rosa, Gapan and beyond) probably pass NE Pacific Mall. Whether any of them also pass Crossing is unknown.

**In `routes.json`:** **missing**. No addition is recommended until the city or LTFRB-3 confirms a route.

### Q3. Fare rates in `fare-rules.json`

| Item | File says | Finding | Sources |
|---|---|---|---|
| Traditional PUJ | ₱14 first 4 km + ₱2.00/km | **Matches.** Up from ₱13 / ₱1.80. | GMA 2026-09-25 https://www.gmanetwork.com/news/money/economy/1003715/dotr-approves-ltfrb-fare-hike-recommendation-for-puvs/story/ ; Philstar 2026-09-27 https://www.philstar.com/headlines/2026/09/27/2559277/jeepney-fares-p14-starting-sept-28-buses-taxis-tnvs-also-hike-rates ; Top Gear 2026-09-28 https://www.topgear.com.ph/news/industry-news/dotr-fare-hike-september-28-2026-a6941-20260928 ; UNTV 2026-09-28 https://www.untvnews.com/news/ltfrb-issues-new-fare-matrix-for-puvs-transport-group-to-launch-nationwide-transport-strike (all **secondary**) |
| Modern PUJ | ₱17 first 4 km + ₱2.40/km | **Matches.** Up from ₱15 / ₱2.20. All September sources say ₱2.40. The ₱2.30 figure appeared only in March 2026 reporting (https://currentph.com/2026/03/17/ltfrb-approves-fare-hike-for-jeepneys-buses-and-tnvs/, community). | Same as above (**secondary**) |
| Effective date / authority | 2026-09-28; DOTr memo 2026-09-25 lifting the March suspension | **Matches.** The rates were first approved for 2026-03-19 and suspended a day before, then reinstated by a DOTr memo of 2026-09-25 signed by Acting Sec. Giovanni Lopez. **No LTFRB MC or board resolution number found.** | GMA (above); SunStar 2026-03-17 https://www.sunstar.com.ph/manila/ltfrb-approves-fare-increase-on-all-pujs (**secondary**) |
| Region III vs NCR | Not addressed | **No regional difference reported.** No Region III or Central Luzon matrix was found. The previous ₱13 provisional base (2023-10-08) was explicitly nationwide. Historically Region III has been grouped with NCR (e.g. the ₱9 rollback for "NCR, Regions 3, 4"). | Inquirer 2023 https://newsinfo.inquirer.net/1840354/fwd-ltfrb-grants-p1-provisional-increase-to-pujs-nationwide-effective-oct-8 ; PNA https://www.pna.gov.ph/articles/1055605 (search excerpt only) (**secondary**) |
| Discounts | 20% for senior, PWD, student | **Matches.** DOTr retained the "mandatory 20% fare discounts". | UNTV (above, **secondary**). Statutes: RA 9994 (seniors), RA 10754 (PWD), RA 11314 (students), **primary**, not re-read here. |
| `discountNotes` | "Student discount applies on school days" | **Wrong.** RA 11314 grants the student discount for the entire period of enrollment, **including weekends and holidays**. It excludes postgraduate and short-term courses. | RA 11314, https://legacy.senate.gov.ph/republic_acts/ra%2011314.pdf (**primary**, 403; wording via search excerpt). Corroborated by a Senate press release https://legacy.senate.gov.ph/press_release/2019/1107_poe1.asp (search excerpt) and https://jontotheworld.com/new-jeepney-fare-september-2026-complete-fare-guide/ (community). |
| `rounding` | TODO | **Round to the nearest ₱0.25.** The discounted fare is 80% of the *unrounded* regular fare, then rounded. For example: traditional 1–4 km is ₱14.00 / ₱11.25; 5 km ₱16.00 / ₱12.75; 10 km ₱26.00 / ₱20.75. Modern 1–4 km is ₱17.00 / ₱13.50; 5 km ₱19.50 / ₱15.50; 7 km ₱24.25 / ₱19.25. These checks rule out computing the discount from the rounded regular fare, which would give ₱19.50 at 7 km. | Community tables: https://jontotheworld.com/new-jeepney-fare-september-2026-complete-fare-guide/ ; https://baguiocityguide.com/new-jeepney-taxi-bus-and-tnvs-fares-start-september-28/ . Primary convention: LTFRB fare guide 2023-10-08, https://ltfrb.gov.ph/wp-content/uploads/2024/11/Fare-Guide_Traditional-PUJ-Provisional-Fare-Increase_08Oct2023.pdf (403, not read). |
| Part-km rule | Not in file | **Unknown.** Published tables list whole km only. | — |
| Matrix posting | Not in file | Philstar reports operators must post the updated matrix before charging. A Manila Bulletin headline (2026-09-28) says a fare guide is enough. | Philstar (above); https://mb.com.ph/2026/09/28/no-need-for-matrix-ltfrb-says-fare-guide-enough-to-implement-increase (403, headline only) (**secondary**) |

**Verdict:** the rates and date are correct as far as secondary sources go. They are **not yet verified against a primary LTFRB document**: the LTFRB site was unreachable and no MC or BR number surfaced. The student-discount note is wrong, and the rounding rule can be filled in.

### Q4. Other routes in `routes.json`

| Route id | Issue |
|---|---|
| `cab-zaragoza`, `cab-bongabon` | `reportedFare` (₱45, ₱50) matches commutetour's **traditional "Jeep"** rows, but the route is typed `modern` and sourced to PNA. The fare is misattributed. |
| `cab-zaragoza`, `cab-tarlac`, `cab-bongabon` | Source PNA URLs (articles 1196835, 1180704) now return **404**. Content is known only from search excerpts: a Zaragoza Ramstar launch in Mar 2023, and Bongabon Prime Movers "Bongabon–Cabanatuan City via Palayan City" in Aug 2022. |
| `cab-tarlac`, `cab-bongabon`, `cab-gabaldon` | Commutetour lists **both** traditional and modern service, so a single `type` per route can't represent this. Tarlac fares are ₱85 traditional and ₱123 modern. |
| `cab-sanmiguel`, `cab-cabiao` | The only source is a Camella real-estate listing, so these are effectively unverifiable. Partial support exists: commutetour lists San Miguel at ₱70; the OTC list has a "San Miguel Sta. Rosa Cabanatuan Transport Cooperative"; OSM has a "Cabiao Jeep Terminal" on Circumferential Road (node 4780171537). |
| `cab-sanjose` | The only source is a Flickr photo, and the terminal is TODO. Commutetour lists ₱100 from the Central Terminal. |
| `cab-laur`, `cab-gabaldon` | Source is travelguideph.net, a "bus schedule" page (community; not checked). `via` is TODO. Laur may overlap the Fort Magsaysay corridor. A LAUR TSC and two Gabaldon cooperatives are in the OTC list. |
| `cab-gentinio` | Well sourced (LGU, primary). The LGU page also names the Fort Magsaysay jeeps as an option, which supports `cab-fortmagsaysay`. |
| `cab-licab`, `cab-pantabangan`, `cab-gennatividad`, `cab-talavera`, `cab-gapan` | Commutetour only (community). Fares match that page. |
| All | No `status`, `verifiedOn` or `operator` on most routes. No route is backed by an LTFRB franchise record or the LPTRP. No duplicate ids were found. |
| **Missing** | Commutetour lists these Central Terminal routes, which are absent from the file: **Guimba (₱65), Llanera (₱60), Rizal (modern, ₱75), Sta. Rosa, Sto. Domingo, San Juan, San Vicente**. Cooperatives named for further Cabanatuan routes are in the OTC list: Rizal–Cabanatuan, Cabanatuan–Mabini Rizal, SAGACA (San Antonio–Cabanatuan), Sto. Domingo–Cabanatuan, Guimba–Cabanatuan, Dingalan–Cabanatuan, Talavera TSC, Palayan City TC, Cabanatuan City Loop. Cooperative names are indicative only, not franchises. |

---

## Recommended changes to the data files (proposals only)

**`data/jeepney/fare-rules.json`**
- `discountNotes`: change to "Student discount applies throughout enrollment, including weekends and holidays (RA 11314); not for postgraduate or short-term courses."
- `rounding`: set it to "Round to the nearest ₱0.25. Discounted fare = 0.8 × unrounded regular fare, then rounded to the nearest ₱0.25." Mark it as pending primary confirmation.
- `_status`: keep it as news-verified, and add "no LTFRB MC/BR number found; ltfrb.gov.ph not reachable for verification 2026-10-16".
- Add sources: the GMA 2026-09-25, Philstar 2026-09-27 and UNTV 2026-09-28 URLs above.
- Optionally add `"scope": "nationwide (no Region III-specific rate reported)"`.

**`data/jeepney/routes.json`**
- `cab-fortmagsaysay`:
  - Add `"operator": "Fort Magsaysay-Cabanatuan City Transport Service Cooperative"`.
  - Set `terminal` to "Del Pilar St., behind Shell (Crossing)".
  - Set `via` to "Cabanatuan–Bangad–Fort Magsaysay Road".
  - Add the General Tinio LGU page and the Waze listing as sources.
  - Add the approximate terminal coordinates 15.4932, 120.9744 as **unverified**.
  - Leave `type` unconfirmed.
- Do **not** add a NE Pacific Mall ↔ Crossing route.
- `cab-zaragoza`, `cab-bongabon`: move `reportedFare` to a traditional-service entry, or drop it, and cite commutetour for it.
- Allow multiple jeep types per route (e.g. `types: ["traditional","modern"]`) for Tarlac, Bongabon and Gabaldon.
- Replace the dead PNA links with archived copies (web.archive.org) if they exist.
- Add `status` (`unverified` / `confirmed`) and `verifiedOn` to every route, as the route viewer spec §3 already requires.
- Consider adding Guimba, Llanera, Rizal, Sta. Rosa and Sto. Domingo as `unverified`, sourced to commutetour.

**`docs/specs/jeepney-route-viewer.md`** (follow-ups)
- FR-13: resolve the ₱2.40 vs ₱2.30 question as ₱2.40.
- FR-16: the worked examples become ₱11.25 (not ₱11.20) and ₱20.75 (not ₱20.80) once rounding is applied.
- §3 open item 2: the "Cabanatuan City Loop" cooperative is the only lead on intra-city jeepneys.

---

## Open questions and what to request

**From LTFRB Region III** (San Fernando, Pampanga; or LTFRB Central Office hotline 1342):
1. The issuance number (Board Resolution or Memorandum Circular) and the official PUJ fare guide/matrix PDF for the 2026-09-28 adjustment. Confirm it applies unchanged in Region III.
2. The official rule for fractional kilometres and the ₱0.25 rounding.
3. The franchise (PA/CPC) route descriptions for:
   - Fort Magsaysay-Cabanatuan City TSC: official route name, terminals, via, and whether the line ends at the South Gate or goes on to Laur or Palayan.
   - Cabanatuan City Loop TSC.
   - Any route serving NE Pacific Mall.
4. The list of active PUJ franchises with origin or destination in Cabanatuan City, with jeep type.

**From Cabanatuan City** (City Planning and Development Office, which holds the LPTRP per a city procurement document; and the transport management unit):
1. The approved or updated **LPTRP**, especially intra-city routes and the route list for the Central Terminal and for "Crossing". A city procurement PDF lists "Preparation/Updating of LPTRP – Prepared/Updated" under the CPDO (https://www.cabanatuancity.gov.ph/uploads/files/procurement/66010faec8e483.61830833.pdf, **primary**, seen via search excerpt only).
2. The official location and name of the jeep terminal at "Crossing", and which routes use it.
3. Whether a Pacific Mall–Crossing or other intra-city jeepney route is authorized.

**From Palayan City LGU:** whether any Cabanatuan jeepney routes terminate in or pass through Palayan city proper. Nothing found online.

**Field check (cheap and decisive):** visit the Del Pilar St./Shell terminal and photograph the route signboards ("karatula") and the posted fare matrix on a Fort Magsaysay jeep. The signboard and matrix carry the franchised route and the case number.
