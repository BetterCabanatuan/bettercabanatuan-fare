# Community Route Mapping and Contributors Board: plan and specification

| | |
|---|---|
| Status | Approved decisions recorded in §13 (2026-10-17). Nothing built yet. |
| Last updated | 2026-10-17 |
| Related | [Jeepney Route Viewer spec](jeepney-route-viewer.md) (how community routes appear on the fare map), `src/app/[lang]/fare/suggest`, `src/app/[lang]/admin/routes`, `src/app/[lang]/feedback` (Google and Facebook sign-in) |

Every decision this spec depends on was answered by the project owner on 2026-10-17; see §13.

---

# Part 1: Plan

## 1. Summary

Today a rider suggests a jeep route with two pins, start (A) and end (B). When an admin approves it, the server asks OSRM for the **shortest** road from A to B and publishes that line. If the jeep takes a different road, the published line is wrong, and the free-text "Passes through" field is the only clue.

This work adds three things:

1. **Stops along the road.** The rider taps the map to add points between A and B that the jeep passes through. The road line goes through every point, so it follows the jeep's real road. The rider sees that line before sending.
2. **Sign-in to suggest a route.** Riders sign in with Google or Facebook, as they already do for feedback. Admins see who sent each route and that person's track record.
3. **A contributors board.** A public page ranks riders by how many of their route suggestions an admin approved. A rider's name appears only if they choose one; otherwise they show as an anonymous rider.

## 2. Goals and non-goals

**Goals**

- Published community route lines follow the road the jeep actually takes.
- Admins can judge a suggestion by who sent it and how their earlier suggestions went.
- Riders have a reason to map routes, and the reward never pays for junk.
- The Privacy Policy and Terms stay true of the code at every release.

**Non-goals (this work)**

- Different roads for the outbound and return trips. The return line stays the outbound line reversed, as today (see §12).
- Editing a published route on the map. A correction is still a new suggestion with the same name, as today.
- Sign-in, waypoints or board credit for **TODA** suggestions. They stay anonymous with optional contact (decision 5).
- A rider's "my submissions" page with each suggestion's status (listed as later work in §12).
- Points, badges or prizes beyond a ranked count.

## 3. Current state (as of 2026-10-17)

| Area | What exists | File |
|---|---|---|
| Suggest form | Start and end name and pin, "passes through" text, jeep type, fare paid, optional name and contact, notes, honeypot. Anonymous. | `src/components/routes/route-submission-form.tsx` |
| Validation | Zod schema shared by form and server action; at least one pin inside the city boundary | `src/lib/routes/submission.ts` |
| Storage | `route_submission` (PENDING / VERIFIED / REJECTED), `community_jeep_route` (published line) | `supabase/migrations/20261016165047_route_submissions.sql` |
| Approval | Server fetches the OSRM road A→B, then `approve_route_submission` publishes it in one transaction | `src/app/[lang]/admin/routes/actions.ts` |
| Rider sign-in | Google / Facebook through Supabase Auth, used only by `/feedback`; `getRider()` reads the session | `src/app/[lang]/feedback/actions.ts`, `src/lib/session.ts` |
| Privacy lookup | Admins search route submissions by `submitterName` / `submitterContact` | `src/lib/privacy/lookup.ts` |
| Browser routing | `map-services.ts` calls OSRM from the browser for the fare planner | `src/lib/map-services.ts` |

## 4. Phases

Each phase ships on its own and leaves the site consistent, including the legal pages.

| Phase | Delivers | Depends on | Legal text change |
|---|---|---|---|
| **1. Stops along the road** | Waypoint map in the suggest form, browser preview of the road line, waypoints stored, admin approval routes through them, admin card shows them | None | Services list: OSRM also receives the points of a suggested route |
| **2. Sign-in to suggest** | Suggest page requires sign-in; submission linked to the account; name and contact fields removed; per-account rate limit; admin card shows the submitter and their record | Phase 1 (form layout settles first) | Collect, delete, accounts and children sections cover route suggestions |
| **3. Contributors board** | `contributor` table, board function, `/contributors` page, rider sets or clears a public name, admin can clear a name, nav / footer / sitemap links | Phase 2 (needs accounts) | Collect, retention and delete sections cover the board; Terms "what you send us" and name rules |

### 4.1 Work breakdown

| # | Phase | Task | Main files |
|---|---|---|---|
| 1.1 | 1 | Migration: `waypoints` column | `supabase/migrations/<ts>_route_waypoints.sql`, `src/lib/database-types.ts` (regenerate with `npm run db:types`) |
| 1.2 | 1 | Schema: parse and validate waypoints; tests | `src/lib/routes/submission.ts`, `src/lib/routes/submission.test.ts` (new) |
| 1.3 | 1 | Pure function that places a new stop in order; tests | `src/lib/routes/waypoints.ts` (new), `waypoints.test.ts` (new) |
| 1.4 | 1 | Browser OSRM call through many points | `src/lib/map-services.ts` |
| 1.5 | 1 | Route road map field (client) | `src/components/routes/route-road-field.tsx` (new), form |
| 1.6 | 1 | Server action stores waypoints | `src/app/[lang]/fare/suggest/actions.ts` |
| 1.7 | 1 | Admin: approve through waypoints; show them on a map | `src/app/[lang]/admin/routes/actions.ts`, `page.tsx` |
| 1.8 | 1 | Dictionary strings (en, tl); Privacy services item | `src/lib/i18n/dictionaries/*.ts`, `src/lib/legal.ts` date |
| 2.1 | 2 | Migration: `userId` on `route_submission`, index | new migration |
| 2.2 | 2 | Sign-in returns to the page that started it | `src/app/[lang]/feedback/actions.ts`, `src/components/feedback/sign-in-options.tsx` |
| 2.3 | 2 | Suggest page: signed-out and signed-in states | `src/app/[lang]/fare/suggest/page.tsx` |
| 2.4 | 2 | Form: drop name/contact and honeypot; action checks session and rate limit | form, action |
| 2.5 | 2 | Admin card: submitter and record | `src/lib/routes/queries.ts`, admin page |
| 2.6 | 2 | Privacy and Terms text | dictionaries |
| 3.1 | 3 | Migration: `contributor` table, `route_contributor_board` function | new migration |
| 3.2 | 3 | Board query and public-name actions | `src/lib/routes/contributors.ts` (new), `src/app/[lang]/contributors/actions.ts` (new) |
| 3.3 | 3 | `/contributors` page and metadata | `src/app/[lang]/contributors/page.tsx` (new) |
| 3.4 | 3 | Admin "clear public name" | admin routes page and actions |
| 3.5 | 3 | Links: nav or footer, suggest "received" screen, sitemap | `src/app/sitemap.ts`, layout components |
| 3.6 | 3 | Privacy and Terms text | dictionaries |

### 4.2 Definition of done (every phase)

- `npm run lint`, `npm test` and `npm run build` pass.
- Every new string is in `en.ts` and `tl.ts` with matching placeholders.
- Privacy Policy and Terms describe what the phase collects and publishes; `LEGAL_UPDATED` bumped when they change.
- Migration applied to the linked project (`npm run db:deploy`) and types regenerated.
- One logical change per commit, Conventional Commits (`feat(jeep): …`, `feat(report): …`, `docs: …`). Commits go straight to `main` per the owner's standing instruction.

---

# Part 2: Specification

## 5. Users and situations

- **Regular rider who knows a route** and wants it on the map: has a phone, has Google or Facebook, may be on mobile data.
- **Active mapper** who rides several routes and wants credit for adding them.
- **Admin** reviewing suggestions on a laptop, who must decide whether a line is right and whether the sender is trustworthy.
- **Rider checking the board** to see who maps Cabanatuan's routes, or to find their own rank.

## 6. Functional requirements: stops along the road (Phase 1)

### 6.1 Placing stops

- **FR-1** The suggest form gets a new section, **"The road the jeep takes"**, after the start and end sections and before "The trip".
- **FR-2** Until both A and B are pinned, the section shows a short message ("Pin the start and end first") and no map.
- **FR-3** Once both are pinned, the section shows one map with A and B as fixed markers, labelled A and B, and the current road line.
- **FR-4** Tapping the map adds a stop. Stops are drawn as numbered markers (1, 2, 3…) in travel order.
- **FR-5** A new stop goes where it adds the least straight-line distance to the trip: between the pair of consecutive points (A, stops…, B) where `d(prev, new) + d(new, next) − d(prev, next)` is smallest. Ties go to the earlier pair. This is a pure function in `src/lib/routes/waypoints.ts` with unit tests.
- **FR-6** Stops can be dragged. Dragging keeps a stop's place in the order.
- **FR-7** Below the map, a list shows each stop as "Stop 1", "Stop 2"… with a **Remove** button (a real `<button>`, at least 44 px tall). **Remove all stops** appears when there are two or more.
- **FR-8** At most **12 stops** (decision 1). At the limit, map taps do nothing and the section says "You've added the most stops a route can have. Remove one to move it."
- **FR-9** Stops are optional. A suggestion with no stops behaves exactly as today.
- **FR-10** Moving or removing A or B keeps the stops, and the road line refreshes.

### 6.2 Road line preview

- **FR-11** Whenever A, B or any stop changes, the browser asks OSRM for one road through A → stops → B, 500 ms after the last change. A new request cancels the one in flight.
- **FR-12** The line is drawn on the section's map, with its length below: "About 12.4 km by road".
- **FR-13** While loading, the old line stays, faded, and a status reads "Finding the road…". The status is in an `aria-live="polite"` region.
- **FR-14** If OSRM finds no road (`NoRoute`), the section shows a warning: "We couldn't find a road through these points. Check that each one is on a road." The form can still be sent; the admin will see the same problem on approval.
- **FR-15** If OSRM can't be reached, the section says "The road preview isn't available right now. You can still send your route." No line is drawn.
- **FR-16** The preview is for the rider only. The server never trusts a line from the browser; the admin's approval fetches its own (FR-24).
- **FR-17** A hint above the map explains the purpose: "If the jeep doesn't take the road shown, tap a point on the road it does take. Add as few stops as you need."

### 6.3 Validation (form and server, shared schema)

- **FR-18** `waypoints` posts as one hidden input holding a JSON array of `[lng, lat]` pairs. Missing or empty means no stops.
- **FR-19** The schema rejects, with error key `waypoints`:
  - text that isn't JSON, or JSON that isn't an array of number pairs;
  - more than 8 pairs;
  - a longitude outside −180..180 or a latitude outside −90..90;
  - a stop farther than **60 km** (decision 2) from the city centre `[120.9667, 15.4865]`.
- **FR-20** The existing rule stays: at least one of A and B is inside the city boundary.
- **FR-21** The server action re-runs the same schema; the client check is only for quick feedback.

### 6.4 Admin review and approval

- **FR-22** Each submission card shows a small read-only map with A, numbered stops, B and the road line through them, fetched in the browser as in FR-11. Below it, each stop is listed with its coordinates linked to OpenStreetMap, like A and B today.
- **FR-23** Cards with no stops show "No stops; the road is the shortest one from A to B."
- **FR-24** On **Verify and publish**, the server fetches the OSRM road through A → stops → B in one request (`overview=full&geometries=geojson`) and passes it to `approve_route_submission` as today. The database function does not change.
- **FR-25** An OSRM `NoRoute` answer shows: "OpenStreetMap has no drivable road through these points. Check the pins, or reject it." Nothing is published.
- **FR-26** Submissions sent before this change have `waypoints = []` and approve exactly as before.
- **FR-27** The published `distanceKm` is OSRM's distance for the full line through the stops.

## 7. Functional requirements: sign-in to suggest (Phase 2)

### 7.1 Suggest page

- **FR-28** Signed out, `/fare/suggest` shows the page heading and intro, then the Google and Facebook sign-in card, with the heading "Sign in to suggest a route" and the reason: "Signing in keeps out spam, lets us ask you about your route, and lets your approved routes count on the contributors board. We only receive your name and email address."
- **FR-29** After sign-in, the rider returns to `/fare/suggest` in their language (`/tl/fare/suggest` for Tagalog).
- **FR-30** Signed in, the page shows the same "Signed in as {name}" bar as `/feedback`, with **Sign out** returning to the same page, then the form.
- **FR-31** The "About you" section (name, contact) is removed. The server stores the account's name and email in `submitterName` and `submitterContact`, so the admin page and the privacy lookup keep working unchanged.
- **FR-32** The honeypot field is removed; sign-in and the rate limit replace it.
- **FR-33** The "received" screen keeps the reference number and adds, from Phase 3: "When an admin approves it, it counts for you on the contributors board." with a link to `/contributors`.

### 7.2 Sign-in plumbing

- **FR-34** `signInWithProvider` and `signOutRider` accept an optional `returnTo` form field. It is used only if `sitePath()` accepts it (a same-site path); otherwise they fall back to the feedback page as today. The OAuth callback already restricts `next` to the same site.
- **FR-35** `SignInOptions` takes `heading`, `reason` and `returnTo` props so `/feedback` and `/fare/suggest` share it. `/feedback` passes its current text and behaves as before.

### 7.3 Server action

- **FR-36** `submitRoute` calls `getRider()` first. No session returns `{ status: "signedOut" }`; the form shows "You were signed out. Sign in again, then send your route." What the rider entered stays in the form.
- **FR-37** Rate limit: at most **10 route suggestions per account per hour** (decision 3). Over the limit returns `{ status: "tooMany" }` with "You've sent several routes in the last hour. Please wait a while before sending more."
- **FR-38** The row stores `userId` (the Supabase Auth user id), `submitterName` (account name, or null), `submitterContact` (account email, or null).

### 7.4 Admin: who sent it

- **FR-39** The card's "Sent by (private)" shows the account name, email and provider ("Google" / "Facebook").
- **FR-40** Under it, the sender's record across all their route suggestions: "3 approved · 1 rejected · 2 pending". One query fetches records for all senders on the page.
- **FR-41** Older anonymous submissions show "Anonymous (sent before sign-in was required)" plus whatever name and contact they gave.

## 8. Functional requirements: contributors board (Phase 3)

### 8.1 What counts

- **FR-42** A rider's score is the number of their route suggestions with status VERIFIED. Pending and rejected suggestions never count.
- **FR-43** A correction (a suggestion that updates an already published route) counts the same as a new route (decision 4).
- **FR-44** Suggestions without a `userId` (sent before Phase 2) count for nobody.
- **FR-45** Only route suggestions count. TODA suggestions do not (decision 5).
- **FR-46** If an admin later deletes a verified submission, it stops counting.

### 8.2 Public name (opt-in)

- **FR-47** Every rider starts anonymous. On the board they show as "Anonymous rider".
- **FR-48** A signed-in rider sets their public name on `/contributors`, in a small form: "Your name on this board", text input, **Save**, and **Use "Anonymous rider"** to clear it. The current value is filled in.
- **FR-49** A public name is 2 to 40 characters after trimming, with no `@` and no run of 7 or more digits, so emails and phone numbers aren't published by mistake. Errors: "Use 2 to 40 characters." / "Don't use an email address or phone number."
- **FR-50** The hint under the field reads: "Shown publicly next to your count of approved routes. Use a nickname if you like. Leave it as Anonymous rider to stay private."
- **FR-51** A rider can set a name before their first approved route. They appear on the board once a route is approved.
- **FR-52** On the admin routes page, a sender with a public name shows it with a **Clear public name** button, for names that break the Terms. Clearing sets it to null; the rider can choose a new one.

### 8.3 The `/contributors` page

- **FR-53** Route `/contributors` (English) and `/tl/contributors` (Tagalog), with its own `metadata`: title "Route contributors", description "Riders who mapped Cabanatuan City's jeep routes, ranked by routes an admin approved." Canonical and language alternates follow the other pages.
- **FR-54** One `<h1>`: "Route contributors". Intro: "Every jeep route here was checked by an admin before it went on the map. Each approved suggestion counts once."
- **FR-55** The board is a table with a caption, columns **Rank**, **Name**, **Approved routes**, **Latest**. "Latest" is the month of the rider's most recent approved route ("Oct 2026", formatted for the reader's language, Asia/Manila time).
- **FR-56** Sort: approved routes, most first. Among riders with the same count, the one whose latest approval is older comes first, since they got there sooner. Tied riders share a rank (1, 2, 2, 4).
- **FR-57** Shows the top **100** (decision 7).
- **FR-58** When signed in, the rider's own row is highlighted and marked "You". If they are outside the top 100, a line under the table reads "You're #143 with 2 approved routes." If they have none: "Your approved routes will show here."
- **FR-59** Empty board: "No approved routes yet. Be the first." with a **Suggest a route** button.
- **FR-60** A **Suggest a route** button is always shown above the table.
- **FR-61** The page never contains user ids or emails, in the HTML or in client props.
- **FR-62** Links to `/contributors`: the suggest page's "received" screen (FR-33), the site footer, and `app/sitemap.ts`.

### 8.4 Rendering

- **FR-63** The page shell (heading, intro, buttons) is prerendered. The board and the signed-in parts render per request inside `<Suspense>` after `connection()`, the same pattern `/fare` uses for community routes, so an approval shows at once and the build needs no database.
- **FR-64** If the database can't be reached, the board shows "The board isn't available right now." and the rest of the page still renders.

## 9. Data model

### 9.1 Migration, Phase 1: `<timestamp>_route_waypoints.sql`

```sql
-- Points the rider says the jeep passes through, between A and B, in travel order.
-- The road line is fetched through them at approval (src/app/[lang]/admin/routes/actions.ts).
ALTER TABLE "route_submission"
  ADD COLUMN "waypoints" JSONB NOT NULL DEFAULT '[]'
  CHECK (jsonb_typeof("waypoints") = 'array' AND jsonb_array_length("waypoints") <= 12);
```

The app validates each pair (§6.3). The CHECK only stops a bypassed check from storing an unbounded list.

### 9.2 Migration, Phase 2: `<timestamp>_route_submission_accounts.sql`

```sql
-- Route suggestions need sign-in from now on. Older rows stay anonymous (NULL).
-- Deleting the Supabase Auth user (a data deletion request) deletes their suggestions;
-- routes already published stay, since community_jeep_route holds no personal data.
ALTER TABLE "route_submission"
  ADD COLUMN "userId" UUID REFERENCES auth.users ("id") ON DELETE CASCADE;

-- Per-account rate limit, and the admin page's per-sender record.
CREATE INDEX "route_submission_userId_createdAt_idx" ON "route_submission" ("userId", "createdAt");
```

### 9.3 Migration, Phase 3: `<timestamp>_contributors.sql`

```sql
-- A rider's choice of how they appear on /contributors. No row, or a NULL name, means
-- "Anonymous rider". RLS on with no policies, like every other table.
CREATE TABLE "contributor" (
    "userId" UUID NOT NULL REFERENCES auth.users ("id") ON DELETE CASCADE,
    "publicName" TEXT CHECK (char_length("publicName") BETWEEN 2 AND 40),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contributor_pkey" PRIMARY KEY ("userId")
);
CREATE TRIGGER "contributor_updated_at" BEFORE UPDATE ON "contributor"
  FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
ALTER TABLE "contributor" ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON "contributor" TO service_role;

-- Ranked counts of approved route suggestions. Returns the user id so the server can
-- mark the signed-in rider's row; the page never renders it.
CREATE FUNCTION "route_contributor_board"()
RETURNS TABLE ("userId" UUID, "publicName" TEXT, "approved" INTEGER, "latest" TIMESTAMPTZ, "rank" INTEGER)
LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT s."userId", c."publicName", count(*)::INTEGER, max(s."reviewedAt"),
         rank() OVER (ORDER BY count(*) DESC)::INTEGER
  FROM public."route_submission" AS s
  LEFT JOIN public."contributor" AS c ON c."userId" = s."userId"
  WHERE s."status" = 'VERIFIED' AND s."userId" IS NOT NULL
  GROUP BY s."userId", c."publicName"
  ORDER BY count(*) DESC, max(s."reviewedAt") ASC;
$$;
REVOKE EXECUTE ON FUNCTION "route_contributor_board"() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION "route_contributor_board"() TO service_role;
```

The function returns every contributor, so the server can find the signed-in rider's rank outside the top 100 (FR-58). That is fine at city scale. If it ever passes a few thousand rows, add a limit and a separate "my rank" query.

### 9.4 TypeScript types

| Type | Where | Shape |
|---|---|---|
| `Waypoints` | `src/lib/routes/submission.ts` | `LngLat[]`, at most `SUBMISSION_LIMITS.waypoints` (12) |
| `Submission` | same | gains `waypoints: LngLat[]`; loses `submitterName`, `submitterContact` (Phase 2) |
| `SubmitState` | suggest `actions.ts` | gains `{ status: "signedOut" }`, `{ status: "tooMany" }` |
| `BoardRow` | `src/lib/routes/contributors.ts` | `{ rank: number; name: string \| null; approved: number; latest: Date; isYou: boolean }` |

## 10. UI wireframe descriptions

### 10.1 Suggest form, "The road the jeep takes" (phone, below 768 px)

```
┌──────────────────────────────────────┐
│ The road the jeep takes              │  ← FieldLegend
│ If the jeep doesn't take the road    │
│ shown, tap a point on the road it    │
│ does take.                           │  ← hint (FR-17)
│ ┌──────────────────────────────────┐ │
│ │  (A)━━━━━┓                       │ │
│ │          ┗━━(1)━━━━━┓            │ │  map, h-72
│ │                     ┗━━(2)━━(B)  │ │
│ │                          [+][-][◎]│ │
│ └──────────────────────────────────┘ │
│ About 12.4 km by road                │  ← aria-live status
│                                      │
│ Stop 1                     [Remove]  │
│ Stop 2                     [Remove]  │
│                   [Remove all stops] │
└──────────────────────────────────────┘
```

- A and B markers use the planner's A/B marker style. Stops are smaller numbered circles.
- Desktop (1024 px and wider) is the same layout in the form's `max-w-2xl` column, map `h-80`.

### 10.2 Admin submission card (desktop)

Adds a read-only map (h-56) above the existing details list, a "Stops" detail listing each stop with an OpenStreetMap link, and the sender block:

```
Sent by (private)
Juan Dela Cruz · juan@example.com · Google
3 approved · 1 rejected · 2 pending
Board name: "Kuya Juan"   [Clear public name]
```

### 10.3 `/contributors` (phone)

```
Route contributors                         ← h1
Every jeep route here was checked by an
admin before it went on the map…
[ Suggest a route ]

┌ Rank │ Name            │ Routes │ Latest ┐
│  1   │ Kuya Juan       │   12   │ Oct 2026│
│  2   │ Anonymous rider │    7   │ Sep 2026│
│  2   │ Maria S.        │    7   │ Oct 2026│
│ ▶4   │ You · Anonymous │    3   │ Oct 2026│  ← highlighted
└──────────────────────────────────────────┘

Your name on this board                    ← signed in only
[ Kuya Juan            ] [Save]
Shown publicly next to your count…
[Use "Anonymous rider"]
```

Signed out, the name form is replaced by "Sign in when you suggest a route to get counted." with a link to `/fare/suggest`.

The table fits at 360 px: "Latest" is hidden below 400 px; rank and count use `tabular-nums`.

## 11. Data flow

**Suggesting (Phases 1–2)**

1. Rider opens `/fare/suggest`. The server reads the session cookie (per request, inside Suspense) and shows sign-in or the form.
2. Rider pins A and B, then adds stops. The browser asks OSRM for the road through all points and draws it (only coordinates are sent).
3. On submit, the browser runs the shared schema. If it passes, the form posts to `submitRoute`.
4. `submitRoute` checks the session, counts the rider's suggestions in the last hour, re-runs the schema, and inserts a PENDING row with `waypoints`, `userId`, name and email.

**Reviewing**

5. Admin opens `/admin/routes`. The server lists pending rows and fetches the senders' records and public names. The browser draws each card's map through OSRM.
6. Admin taps **Verify and publish**. The server fetches the OSRM road through A → stops → B and calls `approve_route_submission`, which publishes the line and marks the row VERIFIED in one transaction.
7. `/fare` reads community routes per request, so the route appears at once.

**Board (Phase 3)**

8. `/contributors` calls `route_contributor_board()` per request, marks the signed-in rider's row, and renders the top 100 without ids.
9. A rider saves a public name; `setPublicName` checks the session, validates the name, and upserts their `contributor` row.

## 12. Edge cases

| Case | Behaviour |
|---|---|
| Rider adds a stop off any road (a field) | OSRM snaps it to the nearest road; the preview shows the result, and the rider can drag or remove it |
| Stop placed past B or before A | FR-5 inserts it where it adds the least distance, usually at that end; the preview shows any doubling back |
| Route that loops or returns by a different road | Out of scope. Rider explains in Notes. The published return line is the outbound line reversed, as today |
| OSRM down at approval | Approval fails with the existing "try again" message; nothing is published |
| Rider signs out in another tab, then submits | `signedOut` state (FR-36); form keeps its answers |
| Two accounts, same person | Not detected. Admin review is the gate; the board rewards only approved routes |
| Rider deletes their account | Their suggestions and `contributor` row are deleted by cascade; their published routes stay; they leave the board |
| Two riders send the same route | Each is reviewed. If both are approved (the second as a correction), both count (FR-43) |
| Admin is also a rider | Admin accounts sign in by email link; `getRider()` returns them too, so their approved suggestions count like anyone's |
| Offensive or impersonating public name | Admin clears it (FR-52); Terms forbid it (§14) |
| Old submissions with no `userId` | Approvable as before; count for nobody (FR-44) |
| `waypoints` JSON tampered to 500 points | Schema rejects (FR-19); the database CHECK backs it up |

### Later (not in this work)

- Separate outbound and return lines.
- "My suggestions" page with each suggestion's status and rejection reason.
- Sign-in, stops and board credit for TODA suggestions.
- Manual reordering of stops.

## 13. Decisions

Answered by the project owner on 2026-10-17.

| # | Question | Decision |
|---|---|---|
| 1 | Most stops per route | 12 |
| 2 | Farthest a stop may be from the city centre | 60 km (San Jose City is about 45 km) |
| 3 | Route suggestions per account per hour | 10 |
| 4 | Does a correction to a published route count on the board? | Yes, same as a new route |
| 5 | Should TODA suggestions require sign-in and count on the board? | No, routes only for now |
| 6 | Show anonymous riders on the board, or hide them? | Show as "Anonymous rider" |
| 7 | How many rows the board shows | 100 |
| 8 | Where the board is linked | Footer, "Route contributors", plus the suggest page's "received" screen |
| 9 | Who reviews the Tagalog wording | The project owner, before each phase ships |
| 10 | Who sees who sent a route | Admins only; no public profile pages |

## 14. Privacy Policy and Terms changes

Each line below is a statement the policy must make once its phase ships. `LEGAL_UPDATED` changes each time.

**Privacy Policy**

| Section | Phase | Change |
|---|---|---|
| Intro | 2 | "We ask for your name and email only when you send feedback **or suggest a jeep route**." |
| What we collect | 1 | Fare-map item unchanged. Suggest item: the points of the route, including stops along the road. |
| What we collect | 2 | Split the "Suggesting a jeep route or adding a TODA" item. Route: you sign in; admins see your name, email and which of Google or Facebook you used, and how many of your routes were approved, rejected or pending. TODA: unchanged (optional name and contact). |
| What we collect | 3 | Contributors board: if you choose a public name, it is shown with your number of approved routes and the month of your latest one. Without a name you appear as "Anonymous rider". |
| Services | 1 | OSRM also receives the points of a route you suggest, to draw its road. Admins' browsers send the same points when they review it. |
| How long we keep it | 3 | Your public name stays until you change it, clear it, or delete your account. |
| Delete your data | 2–3 | Deleting your account deletes your route suggestions and your place on the board. Routes already published stay, without your name. |
| Children | 2 | "To sign in and send feedback **or suggest a route**…" |

**Terms of Use**

| Section | Phase | Change |
|---|---|---|
| What you send us | 3 | "…publish and update that information on the site. Your name appears only on the contributors board, and only if you choose one." |
| What you send us | 3 | New item: "Your public name must not be offensive, pretend to be someone else, or include contact details. Admins may remove it." |
| Signing in | 2 | "You sign in with Google or Facebook to send feedback or suggest a route… each account can send up to 5 messages and 10 route suggestions an hour." |

## 15. Test plan

**Unit (Vitest)**

| File | Cases |
|---|---|
| `src/lib/routes/waypoints.test.ts` | Insert into empty list; insert between A and B; insert between two stops; point near A goes first; point beyond B goes last; tie goes to the earlier pair |
| `src/lib/routes/submission.test.ts` | No `waypoints` field → `[]`; valid pairs pass; not JSON; not an array; 13 pairs; out-of-range lat/lng; stop 61 km away; existing A/B and city-boundary rules still pass |
| `src/lib/routes/contributors.test.ts` | Public name: trims; 1 and 41 chars fail; email fails; 7-digit run fails; board rows map null name to anonymous and mark `isYou` |
| `src/lib/feedback/submission.test.ts` | `returnTo` that is a site path is used; `//evil.com` and `https://…` fall back |
| `src/lib/i18n/locales.test.ts` | Existing placeholder check covers the new strings |

**Manual, before each phase ships**

1. Suggest a route with 0, 1 and 12 stops on a phone; check the preview line and the stop list; try a thirteenth stop.
2. Approve each as admin; open `/fare` and check that the line follows the stops.
3. Phase 2: sign out mid-form and submit; send 11 routes in an hour; check the sender block and record on the admin card.
4. Phase 3: set, change and clear a public name; check ranks and ties; check the "You" row signed in and signed out; check no email or id in the page source; clear a name as admin.
5. Each phase: read the Privacy Policy and Terms against what the code does.
