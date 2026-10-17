# Supabase

The app keeps resident submissions in Supabase Postgres and signs admins in with Supabase Auth. The server reaches the database through the Supabase Data API with the project's secret key. Every schema change is a migration in `supabase/migrations`, applied with the Supabase CLI (`npx supabase`, installed with the project). Don't edit tables in the Supabase table editor.

## 1. Create the project

1. Sign in at [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.
2. Pick the region **Southeast Asia (Singapore)**, `ap-southeast-1`, the closest to the Philippines.
3. Set a database password and store it in your password manager. The CLI asks for it when it applies migrations.

## 2. Copy the keys

Open **Project Settings → API Keys** and put these in `.env` (see `.env.example`):

| Variable | Key | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | Public. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_...`) | Public. Used only for admin sign-in. |
| `SUPABASE_SECRET_KEY` | Secret key (`sb_secret_...`) | Server only. It bypasses row level security, so it can read submitters' contact details. Never give it a `NEXT_PUBLIC_` prefix. |

Leave the Data API on (**Integrations → Data API**): the server uses it.

## 3. Apply the migrations

```bash
npx supabase login
npx supabase link --project-ref [FILL: SUPABASE_PROJECT_REF]
npm run db:deploy
```

`npm run db:deploy` runs `supabase db push`, which applies every migration in `supabase/migrations` that the project hasn't had yet. Run it again after each release that adds a migration, before the new code goes live. `npx supabase migration list` shows what is applied.

### A database first set up with Prisma

The first three migrations used to live in `prisma/migrations` and were applied by `prisma migrate deploy`. The Supabase CLI keeps its own history, so on a database that already has them, mark them applied once before the first push:

```bash
npx supabase migration repair --status applied 20261016155044 20261016165047 20261017000000
npm run db:deploy
```

The push then runs only `20261017043500_supabase_data_api_and_auth`. It moves reviewer names from Better Auth's `user` table into a `reviewedByEmail` column, then drops the Better Auth tables (`user`, `session`, `account`, `verification`) and `_prisma_migrations`. Admins sign in again afterwards; no submission or published entry is lost.

## 4. Set up admin sign-in

Admins sign in with a one-time email link. Only addresses in `ADMIN_EMAILS` get one, and their Supabase user is created on first sign-in.

1. **Authentication → URL Configuration**: set **Site URL** to the production address, and add these under **Redirect URLs**:
   - `http://localhost:3000/api/auth/confirm`
   - `https://[FILL: PRODUCTION_DOMAIN]/api/auth/confirm`
2. **Authentication → Emails → Templates**: the sign-in email is a React Email template, [`emails/admin-sign-in.tsx`](../../emails/admin-sign-in.tsx), exported to [`supabase/templates/admin-sign-in.html`](../../supabase/templates/admin-sign-in.html). Paste the whole HTML file into both **Magic link** and **Confirm signup**, with the subject `Your Pamasahe Cabanatuan sign-in link`. An admin's very first sign-in creates their user, so Supabase sends **Confirm signup** that time and **Magic link** after.

   The template's link is `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email`. `{{ .RedirectTo }}` is the app's `/api/auth/confirm?next=/admin/todas` address, so the same template works from localhost and production, and the token works on any device. With Supabase's default template the link still works, but only in the browser that asked for it.
3. **Authentication → Providers → Email**: set **Email OTP Expiration** to `600` seconds, so the link expires in 10 minutes as the sign-in page says.
4. **Authentication → Emails → SMTP Settings**: Supabase's built-in mailer sends only a few emails an hour and only to team members. For production, add a custom SMTP server, such as Resend (`smtp.resend.com`, port `465`, user `resend`, password: a Resend API key). The **Sender email** must be on a domain verified in Resend; `onboarding@resend.dev` only delivers to the Resend account's own address.

Removing an address from `ADMIN_EMAILS` revokes access on the next request, even for a signed-in admin.

## 5. Set up rider sign-in (Google and Facebook)

Riders sign in with Google or Facebook before they send feedback at `/feedback`. Admins read it at `/admin/feedback`. A Google or Facebook session never counts as an admin, even when its address is in `ADMIN_EMAILS`: only the emailed link signs an admin in.

Both providers redirect to Supabase, not to the app. The callback address they need is `https://[FILL: SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback` (**Authentication → Sign In / Providers** shows it under each provider).

1. **Authentication → URL Configuration → Redirect URLs**: add the app's callback, with `**` so the `?next=` part matches:
   - `http://localhost:3000/api/auth/callback**`
   - `https://[FILL: PRODUCTION_DOMAIN]/api/auth/callback**`
2. **Google**: in the [Google Cloud console](https://console.cloud.google.com/apis/credentials), set up the **OAuth consent screen** (External; app name Pamasahe Cabanatuan; scopes `openid`, `email`, `profile`; the home page and privacy policy links). Then **Create credentials → OAuth client ID → Web application**, with the Supabase callback above under **Authorized redirect URIs**. Paste the client ID and secret into **Authentication → Sign In / Providers → Google** and turn it on.
3. **Facebook**: at [Meta for Developers](https://developers.facebook.com/apps), create an app with the **Authenticate and request data from users with Facebook Login** use case and add the `email` permission. Under **Facebook Login → Settings**, put the Supabase callback in **Valid OAuth Redirect URIs**. Paste the **App ID** and **App secret** (App settings → Basic) into **Authentication → Sign In / Providers → Facebook** and turn it on.

   Until the app is switched to **Live**, only people with a role on the app can sign in. Going Live needs a **Privacy policy URL** and **User data deletion** instructions in App settings → Basic.

To delete a rider's data, delete their user under **Authentication → Users**: their feedback is deleted with it.

## 6. Make schema changes

```bash
npm run db:new -- short_description
```

This creates an empty file in `supabase/migrations`. Write the SQL, then:

1. Apply it with `npm run db:deploy`. Test it on a separate Supabase project (or a local stack with `npx supabase start`, which needs Docker) before it touches production data.
2. Regenerate the TypeScript types with `npm run db:types`, and commit both files.

## 7. Change the sign-in email

```bash
npm run email:dev
```

This opens a live preview at <http://localhost:3001>. Edit `emails/admin-sign-in.tsx`, then run `npm run email:export` to regenerate `supabase/templates/admin-sign-in.html`, commit both, and paste the new HTML into both dashboard templates (step 4). Keep the `{{ .RedirectTo }}` and `{{ .TokenHash }}` placeholders in the link; Supabase fills them in when it sends the email. Supabase sends the email, so changing it needs no deploy.

## Row level security

Supabase serves every table in the `public` schema through its Data API to anyone who has the publishable key. Every table here has row level security turned on with **no policies**, so the publishable key sees no rows. The server uses the secret key, whose `service_role` bypasses RLS. The approval functions (`approve_toda_submission`, `approve_route_submission`) are callable only by `service_role`.

**Every migration that creates a table must also enable RLS on it:**

```sql
ALTER TABLE "new_table" ENABLE ROW LEVEL SECURITY;
```

**Every new function in `public` must be closed to the publishable key:**

```sql
REVOKE EXECUTE ON FUNCTION "new_function"(...) FROM PUBLIC, anon, authenticated;
```

The dashboard's Security Advisor flags any table that was missed.

## Troubleshooting

- **`SUPABASE_SECRET_KEY is not set`** in the server log, and the TODA list or community routes are empty: add the secret key to `.env` (or `npx wrangler secret put SUPABASE_SECRET_KEY` in production).
- **Admin sign-in link lands on "That sign-in link has expired"**: the link was already used, is older than 10 minutes, or (with the default email template) was opened in a different browser. Use the template in step 4.
- **`Error sending confirmation email`** (status 500) in the server log: Supabase reached your SMTP server and it refused. **Authentication → Logs** shows the server's reason. Usually the sender address isn't on a verified domain, or the SMTP password (API key) is wrong or revoked.
- **No sign-in email arrives**: the address isn't in `ADMIN_EMAILS`, or the built-in mailer's limit was hit. Check **Authentication → Logs**, and set up custom SMTP.
- **`supabase db push` fails on an existing table**: the database was set up by Prisma. Mark the old migrations applied (step 3).
- **`permission denied for table`** from the server: the table is missing its grant to `service_role`. See the `GRANT` lines at the end of `20261017043500_supabase_data_api_and_auth.sql`.
- **Requests time out on a free project**: Supabase pauses free projects after a period of inactivity. Restore the project from the dashboard.
