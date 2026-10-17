# Deploy to Cloudflare Workers

The site runs as one Cloudflare Worker built with [OpenNext](https://opennext.js.org/cloudflare). Pages prerendered at build time are served from Workers Static Assets. The database and admin sign-in are the Supabase project from [supabase.md](supabase.md), reached over HTTPS with `supabase-js`, so the Worker needs no database binding.

## What lives where

| Setting | Where | Notes |
| --- | --- | --- |
| `SUPABASE_SECRET_KEY` | `.env` (dev), `wrangler secret` (prod) | Read at runtime. The server's database key; bypasses row level security. |
| `ADMIN_EMAILS` | `.env` (dev), `wrangler secret` (prod) | Read at runtime. |
| `DATABASE_URL` | GitHub secret (CI) | Supabase Session pooler string, used only by `supabase db push` in the workflow. The app doesn't read it. |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `.env` (dev), GitHub variables (CI) | Inlined into the bundle at build time. Changing one needs a new build. Setting them on the Worker has no effect. |
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
```

Paste the Supabase secret key and the comma-separated admin addresses when prompted. Secrets persist across deploys. List them with `npx wrangler secret list`.

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

`SUPABASE_SECRET_KEY` and `ADMIN_EMAILS` stay Worker secrets (step 2). The workflow doesn't touch them.

**Alternative: Workers Builds.** Cloudflare can build from the repository itself (**Workers & Pages → bettercabanatuan-fare → Settings → Builds → Connect**). Set the build command to `npx opennextjs-cloudflare build` and the deploy command to `npx opennextjs-cloudflare deploy`. Put the `NEXT_PUBLIC_*` values under **Build variables and secrets**. Workers Builds doesn't run migrations, so you would run `npm run db:deploy` by hand before each release that adds one. That's why this repository ships the GitHub Actions workflow instead. Don't enable both, or every push deploys twice.

## Local development and preview

Day to day, use `npm run dev`. It runs in Node and reads the Supabase settings from `.env`, with no Cloudflare tooling involved.

To test the real Worker runtime locally:

```bash
npm run preview
```

Then open <http://localhost:8787>. Local secrets for the Worker (`SUPABASE_SECRET_KEY`, `ADMIN_EMAILS`) go in `.dev.vars`, which git ignores.

## How the database connection works

`src/lib/db.ts` builds a `supabase-js` client with the secret key on each call. It only uses `fetch`, so nothing holds a socket between requests. Admin sign-in uses `@supabase/ssr` with session cookies; `src/proxy.ts` refreshes the session only on `/admin` pages, so public pages make no auth calls.

## Troubleshooting

- **Deploy fails with `Your Worker exceeded the size limit`**: you're on the free plan (3 MB), or something new pulls in a large dependency. Check the size with `npx wrangler deploy --dry-run --outdir /tmp/worker`.
- **The Worker bundle suddenly includes many `.wasm` files**: `next.config.ts` leaves dev-tool `.wasm` files out of the server trace (`outputFileTracingExcludes`). A new dev dependency that ships `.wasm` may need adding to that list.
- **`SUPABASE_SECRET_KEY is not set`** in the logs: set the Worker secret (step 2), or add it to `.env` or `.dev.vars` locally.
- **The site shows old `NEXT_PUBLIC_*` values**: they're fixed at build time. Change the GitHub variable and re-run the workflow.
- **Logs**: `npx wrangler tail` streams production logs. Observability is enabled in `wrangler.jsonc`, so they also show in the dashboard under **Workers & Pages → bettercabanatuan-fare → Logs**.
