# Database on Supabase

The app keeps resident submissions and admin sign-ins in Postgres, hosted on Supabase. Prisma owns the schema: every change is a migration in `prisma/migrations`, applied with `prisma migrate deploy`. Don't use the Supabase CLI or its migrations, and don't edit tables in the Supabase table editor.

## 1. Create the project

1. Sign in at [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.
2. Pick the region **Southeast Asia (Singapore)**, `ap-southeast-1`, the closest to the Philippines.
3. Set a database password and store it in your password manager. It only needs to be long; letters and digits avoid URL-encoding trouble later.

## 2. Copy the connection string

1. Open the project and click **Connect** at the top of the page.
2. Choose **Session pooler**. The string looks like this:

   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@[POOLER-HOST]:5432/postgres
   ```

3. Replace `[YOUR-PASSWORD]` with the database password, URL-encoded if it has reserved characters (`& # ? / @ :` or a space):

   ```bash
   node -e 'console.log(encodeURIComponent(process.argv[1]))' 'your-password'
   ```

Use the session pooler, not the direct connection or the transaction pooler. It is reachable over IPv4 and keeps a real session, which Prisma migrations need.

## 3. Apply the migrations

Put the string in `.env` as `DATABASE_URL` (see `.env.example`), then run:

```bash
npm run db:deploy
```

This applies every pending migration in `prisma/migrations` and never drops data. Run it again after each release that adds a migration, before the new code goes live. `npx prisma migrate status` shows what is applied.

In production the Worker reaches the same database through a Cloudflare Hyperdrive binding created from this same session-pooler string; see the Cloudflare deployment notes.

## 4. Make schema changes

Edit `prisma/schema.prisma`, then create the migration against a **local** database:

```bash
brew install postgresql@18
brew services start postgresql@18
createdb pamasahe
DATABASE_URL="postgresql://$USER@localhost:5432/pamasahe" npm run db:migrate -- --name short_description
```

Use local Postgres rather than a second Supabase project, for three reasons:

- `prisma migrate dev` may reset the database it points at. Keep it away from production data.
- It creates and drops a temporary shadow database on every run. A local superuser can do that without extra setup.
- Free Supabase projects are limited in number and pause when idle.

Commit the new folder under `prisma/migrations`, then apply it to Supabase with `npm run db:deploy` (step 3).

## Row level security

Supabase serves every table in the `public` schema through its Data API to anyone who has the project's publishable key. The app never uses that API, and these tables hold submitters' contact details and admin sessions. The migration `20261017000000_enable_rls` therefore turns on row level security with no policies for every table, so the API sees no rows. Prisma connects as `postgres`, which owns the tables and bypasses RLS, so the app is unaffected.

**Every migration that creates a table must also enable RLS on it:**

```sql
ALTER TABLE "new_table" ENABLE ROW LEVEL SECURITY;
```

The dashboard's Security Advisor flags any table that was missed. You can also switch the Data API off entirely: open **Integrations → Data API** and turn off **Enable Data API**.

## Troubleshooting

- **`Can't reach database server` (P1001)** with a host like `db.[PROJECT-REF].supabase.co`: that is the direct connection, which is IPv6 only unless you buy the IPv4 add-on. Use the session pooler string.
- **`password authentication failed`** or an invalid URL error: the password has a reserved character that isn't URL-encoded. Encode it as shown in step 2.
- **`Tenant or user not found`**: on the pooler the user name is `postgres.[PROJECT-REF]`, not plain `postgres`. Copy the whole string from **Connect** again.
- **`prepared statement "s0" already exists`**, or migrations hang: the string uses port `6543`, the transaction pooler. It doesn't support prepared statements or the session lock Prisma takes during migrations. Use the session pooler on port `5432`.
- **Connection times out on a free project**: Supabase pauses free projects after a period of inactivity. Restore the project from the dashboard.
- **`migrate deploy` reports a failed migration**: fix the cause, then mark it with `npx prisma migrate resolve --rolled-back <name>` (or `--applied`) and run `npm run db:deploy` again.
