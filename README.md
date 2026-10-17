# Pamasahe Cabanatuan

Check the legal jeep and tricycle fare in Cabanatuan City before you pay.

Pamasahe Cabanatuan is a fare calculator for commuters in Cabanatuan City, Nueva Ecija. Set where you start and where you're going, and it shows the fare, how the fare adds up, and the source and date of the rate it used. It is a companion app to [BetterCabanatuan](https://bettercabanatuan.org), made by the community. It is not an official city government site.

> **Alpha.** Fares and routes are estimates and may differ from the actual fare. The tricycle fare matrix is not yet confirmed with the city. See [Data status](#data-status).

## What it does

- **Tricycle fare.** Tap the map or search for two places. The app measures the road distance and applies the city's tricycle fare matrix, solo or shared, for regular and discounted passengers.
- **Jeep fare.** Shows the jeepney routes that pass near your start and end points, with the regular fare and the 20% discount for students, seniors and PWDs.
- **Show the driver.** Opens the fare full-screen so you and the driver look at the same number.
- **TODA directory.** Lists which TODA serves which barangays. Residents can add a TODA.
- **Route suggestions.** Residents can suggest a missing jeep route. An admin checks every suggestion before it appears.
- **Sources page.** Credits every data source the app uses.
- **English and Tagalog.** English is served at the plain URLs (`/fare`) and Tagalog under `/tl` (`/tl/fare`).

Every fare names its source and the date the rate took effect. A rate that isn't confirmed with the city is labelled as unconfirmed.

## Help add TODAs and routes

The city has no public list of TODAs, and many jeep routes aren't mapped yet. Residents fill these gaps through two forms in the app. You don't need an account, and you don't need GitHub.

The site's public address isn't decided yet, so the pages below are given as paths. Add `/tl` in front for Tagalog, for example `/tl/toda`.

### See what's already listed

| What | Where |
|---|---|
| TODAs | `/toda` lists every verified TODA with its terminal, the barangays it serves and its official contact. Search by TODA name or barangay. |
| Jeep routes | Open `/fare`, switch to **Jeep**, and scroll to **Jeepney routes**. Tap a route to show it on the map. The preset routes are in [`data/jeepney/routes.json`](data/jeepney/routes.json); routes added by residents appear in the same list once approved. |
| Jeep terminals | [`data/jeepney/terminals.json`](data/jeepney/terminals.json), shown as markers on the jeep map. |
| Sources | `/sources` names where every fare, route and terminal comes from. |

Check these lists first. If a TODA or route is already there but wrong, send it again with the correct details: a submission with the same name updates the existing entry after review.

### Add a TODA

Go to `/toda/submit`, or tap **Add a TODA** on the directory. You'll be asked for:

- The TODA's name, as written on the tricycles or the terminal sign
- The barangay of the terminal and where exactly it is, plus an optional pin on the map
- The barangays it serves and roughly how many tricycles it has (optional)
- An official contact number (optional): the association's office or hotline only. Don't enter a driver's or officer's personal number unless they agreed to have it published.

### Suggest a jeep route

Go to `/fare/suggest`, or tap **Suggest a route** under the jeep route list. You'll be asked for:

- Where the jeep starts and where it ends, each with a name and a pin on the map
- The roads or towns it passes through (optional)
- Whether it's a traditional or modern jeep, if you know
- What you paid end to end as one regular passenger (optional)

### How review works

1. **You send the form.** It's saved as *pending* and isn't shown to anyone else.
2. **An admin checks it.** Admins sign in at `/admin/todas` and `/admin/routes` with an email listed in `ADMIN_EMAILS`. They approve the submission or reject it with a reason.
3. **Approved entries go live.** A TODA appears in the directory. A route appears on the jeep map and in the route list, with its line drawn along the roads between your two pins. A route whose pins have no road between them can't be approved, because a straight line would mislead riders.
4. **Rejected entries stay private.** Nothing from them is published.

Your name and contact details are optional. Only admins see them, so they can ask follow-up questions; they are never published.

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router) with React 19 and TypeScript
- Tailwind CSS 4 and [shadcn/ui](https://ui.shadcn.com)
- [MapLibre GL](https://maplibre.org) with OpenStreetMap data, [OSRM](https://project-osrm.org) for road routing and [Photon](https://photon.komoot.io) for place search
- PostgreSQL on [Supabase](https://supabase.com) through [Prisma](https://www.prisma.io), for resident submissions and admin sign-ins only
- [Better Auth](https://www.better-auth.com) magic-link sign-in for admins, with email sent through [Resend](https://resend.com)
- [Vitest](https://vitest.dev) for unit tests

Fare data lives in JSON files under `data/`. The fare pages are prerendered and all fare math runs in the browser, so the calculators don't need the database.

## Getting started

You need Node.js 24 and a PostgreSQL database: either a Supabase project or a local Postgres.

```bash
git clone https://github.com/BetterCabanatuan/bettercabanatuan-fare.git
cd bettercabanatuan-fare
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | What it is |
|---|---|
| `DATABASE_URL` | Postgres connection string. For Supabase, use the Session pooler string (port 5432); for local work, a local Postgres such as `postgresql://you@localhost:5432/pamasahe`. |
| `BETTER_AUTH_SECRET` | Random secret for sign-in sessions. Generate one with `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | Address of the app, `http://localhost:3000` in development. |
| `ADMIN_EMAILS` | Comma-separated email addresses allowed to sign in to `/admin`. |
| `RESEND_API_KEY` | Optional in development. Without it, the sign-in link is printed to the server console. Required in production. |
| `EMAIL_FROM` | Sender of the sign-in email. |
| `NEXT_PUBLIC_SITE_URL` | Public address of the site, used for metadata, the sitemap and Open Graph images. |

Create the database tables, then start the dev server:

```bash
npm run db:migrate
npm run dev
```

Open <http://localhost:3000>.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the development server. |
| `npm run build` | Generates the Prisma client and builds for production. |
| `npm start` | Runs the production build. |
| `npm test` | Runs the unit tests once. |
| `npm run lint` | Runs ESLint. |
| `npm run db:migrate` | Creates and applies migrations in development. |
| `npm run db:deploy` | Applies pending migrations in production. |

## Project structure

```text
data/            Fare rules, routes, terminals, TODAs and map data (JSON)
docs/            Product specs, research notes and brand guide
prisma/          Database schema and migrations
public/          Logo and app icons
scripts/         Data tools, such as generating jeep route lines
src/app/[lang]/  Pages; every page exists in English and Tagalog
src/components/  UI components; shadcn/ui primitives are in components/ui
src/lib/         Fare math (fare.ts), data loading, auth and i18n
```

## How fares are computed

All fare math lives in [`src/lib/fare.ts`](src/lib/fare.ts) as pure functions, with unit tests in [`src/lib/fare.test.ts`](src/lib/fare.test.ts). Amounts are computed in whole centavos and only formatted as pesos for display, which avoids floating-point rounding errors.

Fare amounts, distances and discount rates come from `data/`, never from components. To change a fare, edit the JSON file and cite the source in your pull request. The data files are validated when the app builds, so a malformed file fails the build instead of shipping a wrong fare.

## Data status

Each data file has a `_status` field that says how far it can be trusted.

| File | Status |
|---|---|
| `data/jeepney/fare-rules.json` | Checked against news reports of the LTFRB fare adjustment effective 28 September 2026. Still to be matched against the official LTFRB fare matrix. |
| `data/jeepney/routes.json` | Approximate. Route lines are drawn along main roads between each route's towns; they are not official route maps. |
| `data/jeepney/terminals.json` | Terminal positions from OpenStreetMap. |
| `data/tricycle/fare-matrix.json` | Unconfirmed. The figures come from a 2025 research paper, not the ordinance itself. |
| `data/toda/todas.json` | Empty. No public TODA list exists yet; the directory is built from resident submissions. |

The `/sources` page in the app lists where each figure comes from.

## Deployment

The database runs on Supabase. Prisma owns the schema, so every change is a migration in `prisma/migrations`, applied with `npm run db:deploy`. Every table has row level security turned on, so Supabase's public Data API can't read submitters' contact details. [`docs/deploy/supabase.md`](docs/deploy/supabase.md) covers creating the project, connecting, and making schema changes.

The app is moving to Cloudflare Workers through [OpenNext](https://opennext.js.org/cloudflare). Its deployment notes will follow. `NEXT_PUBLIC_SITE_URL` is baked into the build, so rebuild after changing it.

## Contributing

Corrections are welcome, especially fares, routes and TODA details.

- **Missing TODA or jeep route?** Use the forms in the app; see [Help add TODAs and routes](#help-add-todas-and-routes).
- **Wrong fare?** Open an issue with the source: an ordinance number, an LTFRB memo, a fare matrix photo or a news report.
- **Code changes.** Work on a branch named `<type>/<short-description>` and open a pull request to `main`. Commit messages follow [Conventional Commits](https://www.conventionalcommits.org), for example `fix(data): set modern jeep per-km rate to ₱2.40`.
- **Fare data changes** go in their own commit, separate from code, and the commit body cites the source.
- **Every visible string** goes in both `src/lib/i18n/dictionaries/en.ts` and `tl.ts`.
- Before opening a pull request, run `npm run lint`, `npm test` and `npm run build`.

[`AGENTS.md`](AGENTS.md) has the full coding conventions.

## Credits

Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors. Map tiles © [CARTO](https://carto.com/attributions).
