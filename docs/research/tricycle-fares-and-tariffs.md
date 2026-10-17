# Tricycle fares and tariffs: research notes

| | |
|---|---|
| Checked | 2026-10-18 |
| Scope | The pre-2026 Cabanatuan tricycle fare matrix, the 2026 fare matrix ordinance (draft, enactment, status), the national discount laws that apply to tricycles, and a comparison with `data/tricycle/fare-matrix.json` |
| Related | `data/tricycle/fare-matrix.json`, `docs/specs/tricycle-fare-estimator.md`, `data/pamasahe-handoff/CLAUDE.md`, `docs/research/jeepney-routes-and-fares.md` |

**Confidence labels:**
- **Confirmed (primary)** means the claim was read in a city document, a city post, or a statute.
- **Secondary only** means news, a student-organisation post or a research paper, with no primary document found.
- **Unverified** means a community source, an inference, or something no source settles.

**Access caveats:**
- **Rappler:** WebFetch returned 403, so the fact check was read from a plain HTTP fetch of the page.
- **Blocked sites:** tempo.mb.com.ph, batasnatin.com and the ijaems.com article page returned 403. The ijaems PDF did load.
- **Facebook:** posts were read through the public embed endpoint (`facebook.com/plugins/post.php`). Two posts are no longer available: a Liga ng mga Barangay post linked from Rappler, and a video titled "New Tricycle Fare Matrix in Cabanatuan City".
- **The 2026 ordinance:** the only copy found is a 10-page scanned certified true copy. The Araullo University Central Student Council (AUCSC) published it as an image-only PDF on Google Drive. These notes come from reading the page images. The scan is watermarked "Copy of Araullo University Central Student Council", and the certifying officer's name and signature are blurred.
- **Not found:** the student-council summary named in the brief, with the "6 km = ₱55" and "14.4 km = ₱95" examples. It was not located.

---

## Summary

1. **The 2026 ordinance is enacted. It is Ordinance No. 050-2026, the "2026 Tricycle Fare Matrix Ordinance of Cabanatuan City."** (Confirmed, primary.)
   - The Sangguniang Panlungsod passed it unanimously at its 15th regular session on **2026-04-14**.
   - Mayor Myca Elizabeth R. Vergara signed it on **2026-04-28**.
   - The city's statement of 2026-10-15 says the Sangguniang Panlalawigan approved it on **2026-08-18**. It also says fare-matrix stickers, procured by public bidding, **launch on Monday 2026-10-19**.
   - Rappler's "still a draft" fact check (2026-04-08) was correct when it ran, but it is now out of date.
2. **New rates (Sections 3 and 4).**
   - **First 3 km:** ₱35.00 per passenger, or ₱28.00 for a student, senior or PWD.
   - **Each succeeding km or fraction of a km (0.01–1.00 km):** +₱5.00 per passenger, or +₱4.00 discounted.
   - **No solo/shared split.** The fare is per passenger, whatever the head count.
   - **Special trip** (one passenger hires the whole tricycle so it leaves the terminal without waiting) costs two passenger fares: ₱70 regular, ₱56 discounted, for trips up to 3 km.
   - **Capacity:** at most 3 passengers.
   - **Night or baggage surcharges:** none in the ordinance.
3. **Two fare tables in the same ordinance give different fares for long trips.**
   - **Per-km formula (Sections 3–4):** applies anywhere in the city.
   - **Barangay table (Section 4):** a fixed fare for trips between the **City Supermarket TODA terminal** ("Kilometer 0") and each of 89 barangays.
   - **Where they agree:** up to about 6.5 km.
   - **Where they don't:** further out the table is lower than the formula. Patalac (14.5 km) is ₱70 in the table and ₱95 by the formula. The table also contradicts itself: Lourdes and Barlis are both 6.2 km, but one is ₱50 and the other ₱55.
4. **A fuel-price mechanism can raise fares (Section 5), and today's pump prices are well past the base band.**
   - **How it works:** for every ₱10/L rise in gasoline, the base fare rises ₱2.50 and the per-km rate ₱0.50. The base rates assume gasoline at ₱50–59.99/L.
   - **Who activates it:** the city's Tricycle Franchising and Regulatory Board, after a technical review and public notice. A provisional rate lasts up to 60 days.
   - **Pump prices now:** gasoline in Oct 2026 is reportedly about ₱90/L (community sources). That band carries a provisional rate of ₱45.00 for the first 3 km and ₱7.00 per km.
   - **Unknown:** whether the city has activated a provisional rate, or which rate the 2026-10-19 stickers show.
5. **The 2018 matrix is confirmed only by secondary sources.**
   - The figures (₱20 solo / ₱15 each for 2+; ₱15 / ₱10 discounted; +₱5 per passenger per km after 3 km) come from the 2025 IJAEMS paper.
   - The paper cites no ordinance and calls the matrix outdated and not strictly enforced.
   - Rappler quotes the City Legalization Division: rates were last adjusted in **November 2018**.
   - No 2018 ordinance number or text was found.
6. **Several values in `fare-matrix.json` conflict with the ordinance:**
   - the unofficial ₱10/km solo rate
   - rounding to the nearest km (the ordinance rounds part-km **up**)
   - the missing ₱4/km discounted succeeding rate
   - the special-trip rule
   - the empty `ordinanceNo`

   Details are in the "Conflicts with the repo" section below.

### What the app should show today

- **Through 2026-10-18:** the 2018 matrix is the last one in force, but it is secondary-sourced and only loosely enforced. Keep showing it with the "not confirmed" notice. Do not show the calibrated ₱10/km solo rate as a matrix fare.
- **From 2026-10-19:** switch the tricycle calculator to **Ordinance No. 050-2026 base rates**.
  - Fare per passenger: ₱35 / ₱28 for the first 3 km, then +₱5 / +₱4 for each further km or part-km, **rounded up**.
  - Special trip only when the passenger asks for one: 2 × fare.
  - Maximum 3 passengers.
- **Keep a visible caveat** that a fuel-price provisional rate may apply. Keep it until someone sees a sticker or the TMLU confirms which rates are posted. If the provisional band for ~₱90/L gasoline applies, fares would be ₱45 / ₱36 for the first 3 km and +₱7 / +₱5.50 per km.
- **For trips between the City Supermarket terminal and a listed barangay**, show the barangay table fare (it is lower for long trips) alongside the formula, until the city says which governs.
- **Basis line:** "Ordinance No. 050-2026 (enacted 14 Apr 2026, approved by the Mayor 28 Apr 2026); new fare matrix launched 19 Oct 2026."

---

## Findings

### Q1. The pre-2026 matrix ("last adjusted November 2018")

| Claim | Source | Confidence |
|---|---|---|
| A fare matrix was set up in **2019** and shown on stickers for franchised tricycles. The paper calls it "currently outdated and not strictly enforced". | Palma et al., IJAEMS 11(1), pp. 160–166, published 2025-02-25, https://ijaems.com/upload_images/issue_files/11IJAEMS-10220257-Economic.pdf (also on ResearchGate 389360461) | **Secondary only** |
| Table 1 ("Current Tricycle Fare Matrix"), for the first 3 km. **Single passenger:** ₱20.00 regular, ₱15.00 student/senior/PWD. **Two or more passengers:** ₱15.00 regular, ₱10.00 discounted. | Same paper, p. 161 | **Secondary only**. The paper gives no ordinance number and no citation for the table. |
| Beyond 3 km, "an additional five pesos was charged per passenger per kilometer". The paper gives no separate solo rate and no discounted per-km rate. | Same paper, p. 160 | **Secondary only** |
| "It was in November 2018 when the tricycle fare rates were last adjusted, according to the City Legalization Division." | Rappler, 2026-04-08 (URL in the sources list) | **Secondary only**, but it reports a statement from a city office |
| A 2019 petition says the rate was ₱5 per km and that seniors, PWDs and students still get the 20% discount. | Change.org petition created 2019-09-13, https://www.change.org/p/mayor-strict-implementation-of-tricycle-fare-hike-in-cabanatuan-city-f90b0f48-1aa9-471d-b166-b54debe821ef | **Unverified** (community) |
| Special trip, night surcharge, baggage | None of the above mentions them. | **Not found** |
| 2018 ordinance number, date enacted, text | Not found. | **Not found** |

**Older history** (context only; it does not affect today's fare):
- **Feb 2018 Tempo column** (via a search-result excerpt; the page returns 403): ₱14 for the first **2 km** plus ₱2 per km, and ₱10 each for multiple passengers.
- **"Cabanatuan City: Tricycle Capital of the Philippines" paper** (search-result excerpt only): Ordinance 2007-040 set ₱14 for the first 1–3 km plus ₱2 per km. The same paper says an earlier rate of ₱7 was set in 2004.
- **The two disagree** on whether the ₱14 base covered 2 km or 3 km. Neither was checked against a primary document.

**Verdict on the project's current belief:** the ₱20 / ₱15 / ₱15 / ₱10 figures and the +₱5 per passenger per km match the only source that gives numbers. That source is secondary and cites nothing. The figures are plausible but **not confirmed by a primary source**. As of 2026-10-19 they are superseded anyway.

### Q2. The 2026 ordinance: draft, hearing, and final text

#### Hearing

| Claim | Source | Confidence |
|---|---|---|
| The Sangguniang Panlungsod issued a "Notice to the Public" on 2026-03-18. Its Committees on Public Utilities and Facilities and on Laws, Rules and Regulations would hold a public hearing on "An Ordinance Prescribing the New Fare Matrix for Motorized Tricycles-for-Hire within the Jurisdiction of Cabanatuan City, Providing Penalties for Violation Thereof, and for Other Purposes". **Date:** 2026-03-31 (Tue), 2:00 PM. **Venue:** Cabanatuan City DRRM Council Training Center, near the City Hall entrance gate. | Image of the SP notice, as reposted on a personal Facebook account that Rappler links: https://www.facebook.com/photo/?fbid=122108083821253023&set=a.122099554359253023 | **Confirmed (primary)**: a city document, seen as an image |
| The Legalization Division told Rappler that the viral photos were "kopya lamang po ng draft ordinansa", a copy of the draft shared with stakeholders at the 2026-03-31 hearing. It said the draft would still go through the remaining legislative steps. | Rappler, 2026-04-08 | **Secondary only** (it quotes a city office) |
| The hearing ran under the "Reporma sa Pasada" initiative. The AU Central Student Council, Midway Student Council, Cabanatuan City Student Congress, Liga ng mga Barangay and tricycle operators attended. The student councils said the final matrix was expected "within 2–4 weeks". | AUCSC and Midway SC Facebook posts (URLs in the sources list) | **Secondary only** |

#### Final text of Ordinance No. 050-2026

All claims in this table are **confirmed (primary)**: they come from the certified true copy described in the access caveats. Section numbers are the ordinance's own.

| Item | What the ordinance says |
|---|---|
| Number and title | **Ordinance No. 050-2026**, "An Ordinance Prescribing the New Fare Matrix for Motorized Tricycles-for-Hire within the Jurisdiction of Cabanatuan City, Providing Penalties for Violation Thereof, and for Other Purposes". Short title (Sec. 1): "2026 Tricycle Fare Matrix Ordinance of Cabanatuan City". |
| Enactment | Passed at the 15th regular weekly session on **2026-04-14**, on motion of Coun. Jo-Mario Angelo E. Matias. "Unanimously Approved." Approved by **Mayor Myca Elizabeth R. Vergara on 2026-04-28**. Certified true copy dated 2026-07-23. A "Received" stamp of the Office of the Sangguniang Panlalawigan, Nueva Ecija, carries a handwritten date that appears to read 7.22.26. That reading is uncertain. |
| Legal basis | Cites Sec. 458(a)(3)(vi) of the Local Government Code: the Sangguniang Panlungsod regulates tricycles and grants their franchises. |
| Minimum fare (Sec. 2a, Sec. 3) | The minimum covers "the first fraction of a kilometer but not exceeding three (3) kilometers" from the point of origin: **₱35.00 per passenger**, or **₱28.00** for a senior, PWD or student. |
| Succeeding km (Sec. 3 table, Sec. 4.1) | "Rate for every succeeding fraction to one (1) kilometer, 0.01–1.00 kilometer": **₱5.00 per passenger**, or **₱4.00** discounted. Sec. 4.1 says the same thing: ₱5.00 "for every succeeding one (1) kilometer, or fraction thereof" beyond 3 km. **Any part of a km counts as a whole km.** |
| Rapok / pick-up (Sec. 2c) | A passenger picked up at one place and taken to a destination pays the first-3-km rate plus the per-km rate "for every succeeding fraction or whole one (1) kilometer … per passenger". |
| Discount (Sec. 2e) | 20% off for senior citizens, PWDs and students. They pay 80% of the regular fare. All the table values are exactly 80%. |
| Special trip (Sec. 2d, notes under the tables) | One passenger hires the whole tricycle, so it does not wait for more passengers before leaving the Barangay TODA terminal at City Supermarket for the barangay. "A special trip is allowed only when requested by the passenger." In the barangay table the special-trip fare is **2 × the per-passenger fare** (₱70 / ₱56 at the minimum). The ordinance does not give a special-trip rule for street pick-ups away from the terminal. |
| Capacity (Sec. 2f, Sec. 4.2) | At most **3 passengers** per trip. More than that is "overloading". |
| Barangay table (Sec. 4) | A standardized fare from the Barangay TODA terminal at City Supermarket ("Kilometer 0") to each of the **89 barangay TODAs**, "vice versa". Each row gives distance, regular fare, discounted fare, special trip and discounted special trip. See "Barangay table and formula disagree" below. |
| Fuel-price mechanism (Sec. 2g–2j, Sec. 5) | **Trigger:** "Fuel price destabilization", meaning gasoline moving ±₱10.00/L within 14 days, or another change the local authority judges substantial. **Who decides:** the city's **Tricycle Franchising and Regulatory Board**, after a technical review and public notice. **Duration:** a provisional rate lasts **up to 60 days** unless extended or amended. **Formula:** multiplier = 1 + (ΔP / Pref × 0.33), rounded to the nearest ₱0.50. **Stated result:** "+₱2.50 base fare" and "+₱0.50 succeeding rate" for every ₱10.00/L increase. |
| Provisional rate table (Sec. 5) | Gasoline bands run from ₱50.00–59.99/L (the base rate, ₱35 / ₱28 / ₱5 / ₱4) up to ₱150.00–159.99/L (₱60 / ₱48 / ₱10 / ₱8). There are no bands below ₱50. Selected rows are below. |
| Display (Sec. 6) | Operators must display the official approved fare matrix, issued by the **Transportation Management and Legalization Unit (TMLU)**, inside the sidecar or on the windshield where passengers can read it. |
| Prohibited acts (Sec. 7) | Overcharging; refusing to convey passengers to their destination; failing to display the matrix; subcontracting or choosing passengers; overloading. |
| Penalties (Sec. 8) | **1st offense:** ₱500 fine **or** 1-day impoundment. **2nd:** ₱1,000 fine **or** 7-day impoundment. **3rd:** cancellation and revocation of the MTOP (Motorized Tricycle Operator's Permit). The ordinance says "or", not "and", for the first two offenses. |
| Enforcement and complaints (Sec. 9–10) | The TMLU, under the Office of the City Mayor, enforces the ordinance, with written notice and a hearing. Complaints go to a TMLU Grievance Committee. **Chair:** TMLU head. **Vice-chair:** Tri-Wheels Federation chair. **Members:** City Legal Office, the SP utilities committee, and PNP Cabanatuan. |
| Effectivity (Sec. 15) | Takes effect "fifteen (15) days after publication in a newspaper of local circulation and posting in at least three (3) conspicuous places in the city". |
| Repeal (Sec. 14) | Inconsistent earlier ordinances are repealed or modified. No specific earlier ordinance is named. |
| Not in the ordinance | No night surcharge, rain surcharge or baggage charge. No IRR clause. No "60-day transitory period": the only 60 days in the text is the maximum length of a provisional fuel rate. |

**Selected provisional bands (Sec. 5), per passenger:**

| Gasoline ₱/L | First 3 km (reg / disc) | Per succeeding km (reg / disc) |
|---|---|---|
| 50.00–59.99 (base) | ₱35.00 / ₱28.00 | ₱5.00 / ₱4.00 |
| 60.00–69.99 | ₱37.50 / ₱30.00 | ₱5.50 / ₱4.50 |
| 70.00–79.99 | ₱40.00 / ₱32.00 | ₱6.00 / ₱5.00 |
| 80.00–89.99 | ₱42.50 / ₱34.00 | ₱6.50 / ₱5.00 |
| 90.00–99.99 | ₱45.00 / ₱36.00 | ₱7.00 / ₱5.50 |
| 100.00–109.99 | ₱47.50 / ₱38.00 | ₱7.50 / ₱6.00 |

The discounted per-km values in these bands are 80% rounded to the nearest ₱0.50 (₱6.50 × 0.8 = ₱5.20 → ₱5.00). So the discounted provisional rate is **not** exactly 80%.

#### The student-council summary, item by item

| Claim in the brief | Verdict against Ord. 050-2026 |
|---|---|
| ₱35 for the first 3 km + ₱5 per succeeding km | **Correct.** It is ₱35 for the first 3 km, not 2 km. Part-km rounds **up**. |
| Worked example: 14.4 km = ₱95 | **Correct** under the formula: 11.4 km → 12 succeeding units → ₱35 + ₱60 = ₱95. Truncating would give ₱90. |
| Worked example: 6 km = ₱55 | **Not correct for exactly 6.0 km.** The formula gives ₱35 + 3 × ₱5 = **₱50**. The answer is ₱55 only for 6.01–7.00 km. Some 6.x km rows in the barangay table are ₱55 (Barlis 6.2, Sumacab Este 6.3). The "₱35 for the first 2 km, part-km dropped" reading contradicts the ordinance text and should be discarded. The summary itself was not found. |
| Fuel indexing ±₱2.50 per ₱10 change in gasoline | **Partly correct.** It is +₱2.50 on the base **and** +₱0.50 on the per-km rate per ₱10/L. It is triggered by the city board, not automatic. The definition says "increase or decrease", but the table has no bands below the ₱50–59.99 base. |
| 20% discount for students, seniors and PWDs | **Correct.** It also applies to the per-km rate (₱4). |
| Special rate = two passengers' fare to leave the terminal right away | **Correct.** Passenger-requested only, and defined for departures from the City Supermarket TODA terminal. |
| Penalties ₱500 / ₱1,000 + 1-week impound / franchise revocation | **Mostly correct**, but it is a fine **or** impoundment, not both. The third offense revokes the **MTOP**. |
| IRR expected in 2–4 weeks | **Not in the ordinance.** The student posts said the final matrix (not an IRR) would come out in 2–4 weeks. |
| 60-day provisional period | **Conflated.** The ordinance's 60 days is the maximum life of a fuel-price provisional rate. A separate "60-day transitory period" for information drives and sticker distribution appears only in the AUCSC post of 2026-07-28 ("as discussed during the public hearing"), not in the ordinance text. That claim is **secondary only**. |

#### Barangay table and formula disagree

Fares here are regular, per passenger. The formula is ₱35 + ₱5 × ⌈d − 3⌉.

| Barangay | Distance in table | Table fare | Formula fare |
|---|---|---|---|
| Cruz Roja | 4.5 km | ₱45 | ₱45 |
| Mayapyap Norte | 5.4 km | ₱50 | ₱50 |
| Lourdes | 6.2 km | ₱50 | ₱55 |
| Barlis | 6.2 km | ₱55 | ₱55 |
| Obrero | 6.9 km | ₱50 | ₱55 |
| Bangad | 7.1 km | ₱55 | ₱60 |
| Buliran | 8.8 km | ₱55 | ₱65 |
| Bagong Sikat | 10 km | ₱60 | ₱70 |
| Cabu | 12 km | ₱65 | ₱80 |
| Kalikid Norte | 13 km | ₱70 | ₱85 |
| Patalac | 14.5 km | ₱70 | ₱95 |

Every barangay listed at or under 3 km is ₱35, and 3.1–3.3 km is ₱40, so both methods agree there. Above roughly 6.5 km the table works as stepped bands (₱55, ₱60, ₱65, ₱70) that fall further and further below the per-km formula. The ordinance doesn't say which governs a terminal-to-barangay trip. Reading Section 4 literally, the table is the "standardized" matrix for those trips. **Unverified**; ask the TMLU.

#### Worked examples (base band, for tests)

| Trip | Succeeding units | Passengers | Fare |
|---|---|---|---|
| 2.4 km | 0 | 1 regular | ₱35.00 |
| 2.4 km | 0 | 1 discounted | ₱28.00 |
| 3.00 km | 0 | 1 regular | ₱35.00 |
| 3.01 km | 1 | 1 regular | ₱40.00 |
| 4.6 km | 2 | 1 regular | ₱45.00 |
| 4.6 km | 2 | 2 regular | 2 × ₱45 = ₱90.00 |
| 6.0 km | 3 | 1 regular + 1 discounted | ₱50 + ₱40 = ₱90.00 |
| 11.4 km | 9 | 1 regular | ₱80.00 |
| 11.4 km, special trip requested | 9 | 1 regular | 2 × ₱80 = ₱160.00 (assumes the 2× rule applies off-terminal; the ordinance doesn't say) |
| 14.4 km | 12 | 1 regular | ₱95.00 |
| 14.4 km | 12 | 1 discounted | ₱28 + 12 × ₱4 = ₱76.00 |

### Q3. Approval status as of 2026-10-18

| Claim | Source | Confidence |
|---|---|---|
| Passed by the SP on 2026-04-14 and approved by the Mayor on 2026-04-28 | Ordinance text (certified true copy) | **Confirmed (primary)** |
| "Naaprubahan sa Sangguniang Panglungsod … noong April 14, 2026, at … inaprubahan ng Sangguniang Panglalawigan noong August 18, 2026." Stickers were procured by public bidding; the new matrix "ilulunsad … simula Lunes, Oktubre 19, 2026". Hotline 0998-500-2726 (call or text) for tricycle complaints, with plate number, date and time, and place. | City Government of Cabanatuan, "Opisyal na Pahayag" dated 2026-10-15 (posted Fri 2026-10-16), https://www.facebook.com/lgucabanatuan/posts/pfbid0ArUeMyUy87U4dAfXG5Y8XeZmcJeYvEnkXmfW3Ya1DGtSX3mU91YH1F3ot6HRwH4yl | **Confirmed (primary)**. The statement doesn't give the ordinance number or fare amounts. |
| The provincial review fits the Local Government Code. Component-city ordinances go to the Sangguniang Panlalawigan, which has 30 days from receipt to review them. Receipt around 2026-07-22 and approval on 2026-08-18 fit that window. | RA 7160 Sec. 56, https://lawphil.net/statutes/repacts/ra1991/ra_7160_1991.html | **Confirmed (primary)** for the law. The receipt date is a hard-to-read stamp, so it is **unverified**. |
| "Effective July 2, 2026" (PHINMA AU CCJE Student Council) and "effective July 20, 2026" (AU Political Science Student Organization). Both are shares of the AUCSC post of 2026-07-28, whose own text gives **no** date. | Facebook posts (URLs in the sources list) | **Unverified and contradictory.** Both dates come before the provincial approval of 2026-08-18. Treat them as wrong. |
| Newspaper publication of the ordinance (Sec. 15) and the resulting legal effectivity date | Not found. | **Not found** |
| Whether a fuel-price provisional rate has been activated | Not found. | **Not found** |
| Whether the 2026-10-19 stickers show the base or a provisional rate | Not found. No sticker image was found. | **Not found** |
| Gasoline is about ₱90–92/L in mid-Oct 2026, up about ₱55/L since January | metrofueltracker.com (national average ₱91.80 for unleaded 91, 2026-10-17); tipidgas.ph (Nueva Ecija gasoline-95 average ₱90.80, last verified about 2 months ago); presyopatrol.com (+₱54.92/L year to date, citing the DOE Oil Monitor) | **Unverified** (community). If accurate, the ₱90–99.99 band applies, should the city activate Section 5. |

Rappler's fact check was accurate on 2026-04-08, six days before the SP vote. No news outlet (PIA, PNA, Inquirer, Punto!, SunStar, Rappler) was found covering the passage or the 2026-10-19 launch.

### Q4. National laws and who regulates

| Rule | What it says for tricycles | Source | Confidence |
|---|---|---|---|
| LGUs regulate tricycles | The Sangguniang Panlungsod regulates tricycles and grants their franchises, "subject to the guidelines prescribed by the Department of Transportation and Communications". The ordinance cites the city-level clause, Sec. 458(a)(3)(vi). | RA 7160 (Local Government Code), Sec. 447(a)(3)(vi) for municipalities and Sec. 458(a)(3)(vi) for cities, https://lawphil.net/statutes/repacts/ra1991/ra_7160_1991.html | **Confirmed (primary)** |
| LTFRB does not set tricycle fares | LTFRB MC 94-001 applies its fare-discount rules to all operators "except tricycles-for-hire which are under the jurisdiction of the local governments". | Search-result excerpt of https://dev.lawyerly.ph/laws/38031 | **Secondary only** (not read in full) |
| DILG guidance | DILG MC 2007-01 sets out what city and municipal tricycle franchise and regulatory ordinances should cover. MC 2020-004 covers reviewing those codes, and MC 2020-036 keeps tricycles off national highways (already cited in the spec). One excerpt says fares are set by the sanggunian after a public hearing, posted inside the vehicle and at terminals, and may be flat or a minimum plus a per-km rate. Which circular that excerpt comes from was not confirmed. | https://batasnatin.com/laws/mc-2007-001 (403; search excerpts only) | **Secondary only** |
| Students: RA 11314 (approved 2019-04-17) | **Covers tricycles by name** (Sec. 4). 20% off regular fares on showing a school ID or validated enrollment form (Sec. 5). Applies for the whole enrollment period, **including weekends and holidays**. Excludes postgraduate and informal short courses. | https://lawphil.net/statutes/repacts/ra2019/ra_11314_2019.html | **Confirmed (primary)** |
| Seniors: RA 9994 (approved 2010-02-15) | The 20% fare discount lists PUBs, PUJs, taxis, AUVs, shuttle services and public railways. **Tricycles are not named**, and the list is not written as open-ended. | https://lawphil.net/statutes/repacts/ra2010/ra_9994_2010.html | **Confirmed (primary)** that tricycles are not named. Whether the IRR or DILG MC 2011-88 extends it to tricycles was **not checked**. |
| PWDs: RA 10754 (approved 2016-03-23) | 20% off "actual fare for land transportation travel such as, **but not limited to**," PUBs, PUJs, taxis, AUVs, shuttle services and railways. The open-ended wording can reach tricycles. | https://lawphil.net/statutes/repacts/ra2016/ra_10754_2016.html | **Confirmed (primary)** for the wording. Its application to tricycles is an inference. |
| Local rule settles it | Ord. 050-2026 Sec. 2(e) grants the 20% discount to seniors, PWDs and students on tricycle fares, so in Cabanatuan the national coverage questions don't change the fare. | Ordinance text | **Confirmed (primary)** |

---

## Conflicts with the repo (proposals only; no data files were edited)

**`data/tricycle/fare-matrix.json`**

| Field | Repo value | Finding |
|---|---|---|
| `pending.ordinanceNo` | TODO | **050-2026** |
| `pending.label` / `status` | "Approved…", stickers 2026-10-19 | Matches the city statement. Add the Mayor's approval (2026-04-28), the short title, and that the legal effectivity date (Sec. 15, 15 days after publication) is unknown. |
| `pending.fares` | TODO | ₱35 / ₱28 for the first 3 km. +₱5 / +₱4 for each succeeding km or part-km. Per passenger. Special trip 2 ×. Maximum 3 passengers. |
| `pending.sources` | LGU post, Rappler | Add the ordinance scan (Drive link) and the AUCSC post of 2026-07-28. Mark Rappler as superseded. |
| `current.perSucceedingKmSolo` = 10 and `soloRateNote` | Calibrated from one rider report | **No basis in either matrix.** The 2018 matrix (as reported) has no separate solo per-km rate. The 2026 ordinance has none either; its "special trip" doubles the whole fare (₱70 base + ₱10 per km). Under the 2026 formula, the rider's 11.4 km trip is ₱80 per passenger, or ₱160 as a requested special trip. Kalikid Norte ↔ City Supermarket is ₱70 in the barangay table, or ₱140 as a special trip. Remove the solo rate, or label it plainly as "reported, not official". |
| Part-km rounding (spec §5.2, "nearest whole km") | Nearest km | **Wrong for the 2026 ordinance.** Each succeeding "0.01–1.00 km" is one unit, so part-km **rounds up** after 3 km. The 2018 rule is unknown. |
| `current.specialTrip` | TODO | For 2018: not found. For 2026: passenger-requested only, 2 × the per-passenger fare, defined for departures from the City Supermarket TODA terminal. |
| Discounted succeeding km | Not modelled; `perSucceedingKmPerPassenger` = 5 for everyone | 2026: **₱4.00** discounted. 2018: unknown; the paper gives only ₱5. |
| Solo vs shared split | `single` / `perPassengerIfTwoOrMore` | 2026 has **no split**: ₱35 per passenger regardless of count. The split applies to the 2018 matrix only. |
| `current.ordinanceNo` / `effectiveDate` | TODO | Still unknown. The only evidence is "last adjusted November 2018" (Rappler, quoting the Legalization Division) and "established 2019" (IJAEMS). |
| Fuel-price provisional rates | Not modelled | New. Needs a decision on how to show them (see the open questions below). |
| Barangay terminal table | Not modelled | New. It conflicts with the formula above about 6.5 km. |

**`docs/specs/tricycle-fare-estimator.md`**
- **FR-14:** maximum 3 passengers (Sec. 4.2).
- **§5.1 and the §5.3 worked examples:** replace them with the 2026 tables above. Under 050-2026, every row in the current examples changes (4.6 km solo goes from ₱40 to ₱45; 11.4 km goes from ₱100 to ₱80).
- **§5.4:** the ordinance has no night, rain or baggage surcharge, and Sec. 7 bans charging more than the approved rate. The special-trip rule is now defined.
- **FR-17 basis line:** cite Ordinance No. 050-2026.
- **FR-19 report link:** complaints go to the TMLU Grievance Committee (Sec. 10). The city hotline is 0998-500-2726.
- **§9 "one matrix for the whole city":** partly false. There is a city-wide formula and also a terminal-to-barangay table.

**`data/pamasahe-handoff/CLAUDE.md`**: the line "approval status unknown" for the 2026 draft is out of date.

---

## Open questions to ask the city

Ask the **TMLU** (Transportation Management and Legalization Unit, Office of the City Mayor), the **Public Transport Regulation Division / CBLIPO**, the **Legalization Division** and the **SP Records Management Division**.

1. **Effectivity:** the date and newspaper of publication under Sec. 15, and the official effective date. Is 2026-10-19 the legal effective date or only the sticker launch? Is there a 60-day grace or transitory period before penalties apply?
2. **Fuel provisional rate:** has the Tricycle Franchising and Regulatory Board activated Section 5? If so, which gasoline band, from what date, and until when? Do the 2026-10-19 stickers show the base or a provisional rate? Request a photo or PDF of the sticker.
3. **Barangay table or formula:** for a trip between the City Supermarket TODA terminal and a listed barangay, which governs, the Section 4 table or the per-km formula? Why do Lourdes (6.2 km, ₱50) and Barlis (6.2 km, ₱55) differ? Where in each barangay is the distance measured to?
4. **Special trips off the terminal:** does the 2 × rule apply to a lone passenger picked up on the street (rapok) who wants no other passengers?
5. **Distance measurement:** how is distance measured in a dispute: odometer, the TODA's posted distance, or a map? What happens on a trip that leaves the city?
6. **The 2018 matrix:** the ordinance number, the enactment date, and a copy of the sticker, for the history record and for any dispute about fares charged before 2026-10-19.
7. **TODA list:** a list of the 89 barangay TODAs with official contacts, for the directory.
8. **Official copy:** a city-hosted copy of Ordinance 050-2026, so the app need not rely on a student council's Google Drive scan.

**Field check (cheap and decisive):** from 2026-10-19, photograph a new sticker inside a tricycle. It shows which rate band is in force and may show the ordinance number.

---

## Sources (all accessed 2026-10-18)

**Primary**
- Ordinance No. 050-2026, certified true copy (SP Records Management Division, 2026-07-23), scanned and published by AUCSC: https://drive.google.com/file/d/14QDtG_-Q6CjbAoXCFQQ3emCDIAClyaX1/view (PDF made 2026-07-28; image-only; watermarked by AUCSC)
- City Government of Cabanatuan, "Opisyal na Pahayag", 2026-10-15: https://www.facebook.com/lgucabanatuan/posts/pfbid0ArUeMyUy87U4dAfXG5Y8XeZmcJeYvEnkXmfW3Ya1DGtSX3mU91YH1F3ot6HRwH4yl
- Sangguniang Panlungsod "Notice to the Public" of the 2026-03-31 hearing, issued 2026-03-18 (image reposted on a personal account, linked from Rappler): https://www.facebook.com/photo/?fbid=122108083821253023&set=a.122099554359253023
- RA 7160 (Local Government Code), Secs. 54, 56, 59, 447, 458: https://lawphil.net/statutes/repacts/ra1991/ra_7160_1991.html
- RA 11314 (Student Fare Discount Act): https://lawphil.net/statutes/repacts/ra2019/ra_11314_2019.html
- RA 9994 (Expanded Senior Citizens Act of 2010): https://lawphil.net/statutes/repacts/ra2010/ra_9994_2010.html
- RA 10754 (PWD benefits): https://lawphil.net/statutes/repacts/ra2016/ra_10754_2016.html

**Secondary**
- Rappler fact check, 2026-04-08: https://www.rappler.com/newsbreak/fact-check/new-cabanatuan-city-fare-matrix-ordinance-draft-not-yet-in-force/
- Palma et al., "Economic Suitability of Electronic Fare Meters for Tricycle Drivers in Cabanatuan City", IJAEMS 11(1), 2025-02-25: https://ijaems.com/upload_images/issue_files/11IJAEMS-10220257-Economic.pdf (same paper as https://www.researchgate.net/publication/389360461)
- AUCSC, "NEWS | Cabanatuan City Implements Standardized Tricycle Fare Matrix", 2026-07-28: https://www.facebook.com/aucscofficial/posts/1614432447370285
- AU Political Science Student Organization (share with "effective July 20, 2026"): https://www.facebook.com/aupolsciso/posts/1537622341504359
- PHINMA AU CCJE Student Council (share with "effective July 2, 2026"): https://www.facebook.com/100063765702290/posts/1622605509874957
- AUCSC, "Reporma sa Pasada Public Hearing Concludes", about 2026-03-31: https://www.facebook.com/aucscofficial/posts/pfbid0Bfz4kHDNSZfNEKdDKkDwEu17QPgwDUMvqTpuT6MEtW2S2e6G4tAytD25A2NCMqAfl
- Midway Student Council, "Reporma sa Pasada Public Hearing", about 2026-03-31: https://www.facebook.com/MidwaySCOfficial/posts/pfbid0rky8SVeBNuMhDkJUv79YmeXDqQWu95WZibASW2PgDZFPzGrYNQBK4Qjfi3UQZSPpl
- Tempo, "Cabanatuan as tricycle city", 2018-02-23 (403; search excerpt only): https://tempo.mb.com.ph/2018/02/23/cabanatuan-as-tricycle-city/
- "Cabanatuan City: Tricycle Capital of the Philippines" (search excerpt only): https://www.researchpublish.com/upload/book/Cabanatuan%20City-3270.pdf
- LTFRB MC 94-001 (search excerpt only): https://dev.lawyerly.ph/laws/38031
- DILG MC 2007-01 (403; search excerpts only): https://batasnatin.com/laws/mc-2007-001

**Community (unverified)**
- Change.org petition, 2019-09-13: https://www.change.org/p/mayor-strict-implementation-of-tricycle-fare-hike-in-cabanatuan-city-f90b0f48-1aa9-471d-b166-b54debe821ef
- Fuel prices: https://metrofueltracker.com/prices ; https://tipidgas.ph/province/nueva-ecija/ ; https://presyopatrol.com/fuel-prices-philippines
- Liga ng mga Barangay Cabanatuan post linked from Rappler (no longer available): https://www.facebook.com/liga.cabanatuan.3/posts/pfbid02iq5nYbuxjwhitPAi2SYcctEimno6m17ETjLqHw9UMTEu3Y3PMj2kQCW9f5yWTgx8l
- "New Tricycle Fare Matrix in Cabanatuan City" video (no longer available; a search excerpt claimed the matrix was already "epektibo"): https://www.facebook.com/yourCirKeith/videos/new-tricycle-fare-matrix-in-cabanatuan-city/1053357248388974/
