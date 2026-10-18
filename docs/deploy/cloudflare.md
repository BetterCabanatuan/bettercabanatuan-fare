# Deploy to Cloudflare Workers

The site runs as one Cloudflare Worker built with [OpenNext](https://opennext.js.org/cloudflare). Pages prerendered at build time are served from Workers Static Assets. The database and admin sign-in are the Supabase project from [supabase.md](supabase.md), reached over HTTPS with `supabase-js`, so the Worker needs no database binding.

## What lives where

| Setting | Where | Notes |
| --- | --- | --- |
| `SUPABASE_SECRET_KEY` | `.env` (dev), `wrangler secret` (prod) | Read at runtime. The server's database key; bypasses row level security. |
| `ADMIN_EMAILS` | `.env` (dev), `wrangler secret` (prod) | Read at runtime. |
| `RESEND_API_KEY` | `.env` (dev, optional), `wrangler secret` (prod) | Read at runtime. Sends the app's emails. See [Emails](#emails). |
| `EMAIL_FROM` | `wrangler.jsonc` `vars` (prod), `.env` (dev, optional) | Read at runtime. The sender of the app's emails. |
| `DATABASE_URL` | GitHub secret (CI) | Supabase Session pooler string, used only by `supabase db push` in the workflow. The app doesn't read it. |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `.env` (dev), GitHub variables (CI) | Inlined into the bundle at build time. Changing one needs a new build. Setting them on the Worker has no effect. |
| `MAINTENANCE_MODE`, `MAINTENANCE_UNTIL` | `wrangler.jsonc` `vars` (prod), shell or `.env` (dev) | Read at runtime. See [Maintenance mode](#maintenance-mode). |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | GitHub secrets | Used only by the deploy step. |

## Before you start

- A Cloudflare account on the **Workers Paid** plan. The Worker is about 3.4 MB gzipped (16 MB uncompressed), just over the 3 MB limit of the free plan (the paid limit is 10 MB). Most of it is Next.js itself.
- The Supabase project and keys from [supabase.md](supabase.md), with the migrations applied.
- `npm ci` has been run in this repository.

## 1. Log in

```bash
npx wrangler login
```

## 2. Set the secrets

```bash
npx wrangler secret put SUPABASE_SECRET_KEY
npx wrangler secret put ADMIN_EMAILS
npx wrangler secret put RESEND_API_KEY
```

Paste the Supabase secret key, the comma-separated admin addresses and a Resend API key when prompted. Secrets persist across deploys. List them with `npx wrangler secret list`.

### Emails

The app sends two kinds of email through [Resend](https://resend.com):

- **New submission**, to everyone in `ADMIN_EMAILS`, when a resident sends a TODA, a jeep route or feedback.
- **Review decision**, to the submitter, when an admin approves or rejects their TODA or route. It goes out in the language they used to submit it, and a rejection includes the admin's reason. Route submitters always get one, because their email comes from Google or Facebook. TODA submitters get one only if they typed an email address as their contact.

To turn them on:

1. In Resend, verify the domain you send from (**Domains → Add domain**, then add the DNS records it lists). If Supabase already sends the admin sign-in links through Resend ([supabase.md](supabase.md), step 4), that domain is already verified.
2. Create an API key with **Sending access** only, and save it with `npx wrangler secret put RESEND_API_KEY`.
3. Set `EMAIL_FROM` in `wrangler.jsonc` to a sender on that domain, e.g. `Pamasahe Cabanatuan <pamasahe@example.org>`, and deploy.

Each email is sent after the response, so a slow or failing mail service never delays or breaks a submission or review. Failures show in the Worker logs as `[email]`. Until both values are set, the app sends nothing and logs each email it skipped.

## 3. Deploy

Put the `NEXT_PUBLIC_*` values in your shell, because they are inlined at build time:

```bash
export NEXT_PUBLIC_SITE_URL="https://[FILL: PRODUCTION_DOMAIN]"
export NEXT_PUBLIC_SUPABASE_URL="[FILL: SUPABASE_URL]"
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="[FILL: SUPABASE_PUBLISHABLE_KEY]"
npm run deploy
```

`npm run deploy` runs `opennextjs-cloudflare build` (which runs `npm run build`, so `next build`), then `opennextjs-cloudflare deploy`.

**Deploying from your laptop bundles your `.env` files into the Worker.** OpenNext copies the values in `.env`, `.env.production` and `.env.local` into the bundle as fallbacks. That includes your `SUPABASE_SECRET_KEY` and any dev values. Deploy from CI (step 5) or a clean checkout without `.env` files. Values set on the Worker (secrets) still win at runtime.

## 4. Add the custom domain

In the Cloudflare dashboard, open **Workers & Pages → bettercabanatuan-fare → Settings → Domains & Routes → Add → Custom domain**, then enter the domain. The domain's DNS must be on Cloudflare. The site keeps answering on `bettercabanatuan-fare.<account>.workers.dev` too.

Rebuild after the domain is final, because `NEXT_PUBLIC_SITE_URL` (canonical URLs, sitemap, Open Graph) is inlined at build time.

## 5. Deploy from GitHub Actions

`.github/workflows/deploy.yml` runs on every push to `main` and on manual dispatch. It runs lint and tests, builds the Worker, applies migrations with `supabase db push`, then deploys. The build comes before the migration, so a failed build never leaves the database ahead of the live site.

In the GitHub repository, open **Settings → Secrets and variables → Actions** and add:

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `DATABASE_URL` | Supabase Session pooler string (**Connect → Session pooler**, port `5432`), with the database password filled in |
| Secret | `CLOUDFLARE_API_TOKEN` | Token from **My Profile → API Tokens → Create Token → Edit Cloudflare Workers** template |
| Secret | `CLOUDFLARE_ACCOUNT_ID` | **Workers & Pages → Overview**, right-hand column |
| Variable | `NEXT_PUBLIC_SITE_URL` | `https://[FILL: PRODUCTION_DOMAIN]` |
| Variable | `NEXT_PUBLIC_SUPABASE_URL` | From Supabase **Connect → App frameworks** |
| Variable | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Same place |

`SUPABASE_SECRET_KEY`, `ADMIN_EMAILS` and `RESEND_API_KEY` stay Worker secrets (step 2). The workflow doesn't touch them.

**Alternative: Workers Builds.** Cloudflare can build from the repository itself (**Workers & Pages → bettercabanatuan-fare → Settings → Builds → Connect**). Set the build command to `npx opennextjs-cloudflare build` and the deploy command to `npx opennextjs-cloudflare deploy`. Put the `NEXT_PUBLIC_*` values under **Build variables and secrets**. Workers Builds doesn't run migrations, so you would run `npm run db:deploy` by hand before each release that adds one. That's why this repository ships the GitHub Actions workflow instead. Don't enable both, or every push deploys twice.

## Maintenance mode

While the Worker variable `MAINTENANCE_MODE` is `"true"`, every public page shows a maintenance page in the rider's language, with HTTP status `503` and a `Retry-After` header. The address doesn't change, so each page works again as soon as maintenance ends. The admin area (`/admin`, `/tl/admin`, including sign-in) and the sign-in callbacks under `/api/auth/` keep working, so admins can still review submissions. Static files, `/robots.txt` and `/sitemap.xml` are served as usual. Any value other than `true` (any case) leaves the site up.

`MAINTENANCE_UNTIL` is optional. Set it to the time you expect to finish, such as `2026-10-18T18:00+08:00`, and the page shows "Back by Sunday 18 October at 6:00 pm" in Manila time. A time without an offset is read as Manila time. Leave it empty when you don't know; the page then says so and asks riders to try again in an hour. A time that has passed is ignored.

`src/proxy.ts` reads both on every request through `process.env`, which OpenNext fills from the Worker's variables. Changing them needs no rebuild. The logic lives in `src/lib/maintenance.ts`.

There are two ways to switch it. Pick by how long the maintenance lasts and whether anyone will push to `main` meanwhile.

**In `wrangler.jsonc` (survives deploys).** Set `"MAINTENANCE_MODE": "true"` (and `MAINTENANCE_UNTIL` if you know it) under `vars`, commit and push to `main`. The workflow deploys it. To turn it off, set it back to `"false"` and push again. Each switch waits for a full build and deploy.

**In the Cloudflare dashboard (fast, but temporary).** Open **Workers & Pages → bettercabanatuan-fare → Settings → Variables and Secrets**, edit `MAINTENANCE_MODE` to `true`, and deploy. It takes effect within seconds, without a build. To turn it off, set it back to `false` the same way. **The next deploy undoes a dashboard change:** every `wrangler deploy`, including the one the workflow runs on each push to `main`, replaces the plain-text variables with the list in `wrangler.jsonc`. A push during maintenance therefore turns maintenance off again. Use the dashboard for short windows when nobody is merging, or use `wrangler.jsonc` instead.

Visiting `/maintenance` directly while maintenance is off gives a 404, so the page never says the site is down when it isn't. The page is never in the sitemap and is marked `noindex`. Search engines treat a `503` with `Retry-After` as a temporary outage and keep the pages indexed, so don't change `robots.txt` for maintenance.

To try it locally, build and start with the variable set: `npm run build && MAINTENANCE_MODE=true npm start`. In the Worker runtime, run `npx opennextjs-cloudflare build && npx wrangler dev --var MAINTENANCE_MODE:true`.

## Local development and preview

Day to day, use `npm run dev`. It runs in Node and reads the Supabase settings from `.env`, with no Cloudflare tooling involved.

To test the real Worker runtime locally:

```bash
npm run preview
```

Then open <http://localhost:8787>. Local secrets for the Worker (`SUPABASE_SECRET_KEY`, `ADMIN_EMAILS`, optionally `RESEND_API_KEY`) go in `.dev.vars`, which git ignores.

## How the database connection works

`src/lib/db.ts` builds a `supabase-js` client with the secret key on each call. It only uses `fetch`, so nothing holds a socket between requests. Admin sign-in uses `@supabase/ssr` with session cookies; `src/proxy.ts` refreshes the session only on `/admin` pages, so public pages make no auth calls.

## Troubleshooting

- **Deploy fails with `Your Worker exceeded the size limit`**: you're on the free plan (3 MB), or something new pulls in a large dependency. Check the size with `npx wrangler deploy --dry-run --outdir /tmp/worker`.
- **The Worker bundle suddenly includes many `.wasm` files**: `next.config.ts` leaves dev-tool `.wasm` files out of the server trace (`outputFileTracingExcludes`). A new dev dependency that ships `.wasm` may need adding to that list.
- **`SUPABASE_SECRET_KEY is not set`** in the logs: set the Worker secret (step 2), or add it to `.env` or `.dev.vars` locally.
- **The site shows old `NEXT_PUBLIC_*` values**: they're fixed at build time. Change the GitHub variable and re-run the workflow.
- **Logs**: `npx wrangler tail` streams production logs. Observability is enabled in `wrangler.jsonc`, so they also show in the dashboard under **Workers & Pages → bettercabanatuan-fare → Logs**.
