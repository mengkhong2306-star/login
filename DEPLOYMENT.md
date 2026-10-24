# Supabase + GitHub Pages setup

GitHub Pages serves the static website, and Supabase provides authentication
and PostgreSQL. The old Flask deployment is no longer used by this version.

## 1. Create the database tables and security policies

1. Open your project in the [Supabase dashboard](https://supabase.com/dashboard).
2. Open **SQL Editor** and start a new query.
3. Copy the entire contents of [`supabase/schema.sql`](./supabase/schema.sql),
   run it, and confirm it completes without errors.

The SQL creates user profiles and notes, enables Row Level Security (RLS),
restricts reads and writes to the signed-in owner, and creates a profile when
an auth user registers.

## 2. Configure Supabase Auth redirects

In Supabase, open **Authentication → URL Configuration**:

- Set **Site URL** to
  `https://mengkhong2306-star.github.io/login/`.
- Add that same URL to **Redirect URLs** so confirmation and password-reset
  emails return to the static app.
- Ensure the **Email** provider is enabled. If email confirmation is enabled,
  new users must confirm their email before signing in.

## 3. Publish the app

The Supabase project URL and anon/publishable key are configured in
[`app.js`](./app.js). The anon key is intentionally public browser
configuration; database security must come from RLS. Never substitute a
`service_role` or `sb_secret_` key.

Push changes to the `main` branch. GitHub Pages will publish the static app at
<https://mengkhong2306-star.github.io/login/>. No Render, PythonAnywhere, or
Flask server configuration is needed for the website.

## 4. Verify

1. Open the GitHub Pages URL and create a test account.
2. If email confirmation is enabled, follow the email link and return to the
   site to sign in.
3. Add a note, refresh, and confirm it remains. Sign out and register a
   second test user to confirm the first user's notes are not visible.
4. Test password recovery and verify that the reset link returns to the app.

The Supabase health and database status can be monitored in the Supabase
dashboard. Do not post passwords, reset links, database connection strings, or
secret API keys in chat or commit them to Git.

## Existing account data

Existing Flask/SQLite/Render accounts and notes do not transfer automatically.
Users must create a new Supabase Auth account. Export notes separately before
retiring the old service if you need to preserve them. Passwords are not
migrated.
