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
an auth user registers. It also creates private admin membership and sign-in
activity tables. Sign-ins are recorded by the app after the update is
published; older sessions are not available in this activity list.

## 2. Configure Supabase Auth redirects

In Supabase, open **Authentication → URL Configuration**:

- Set **Site URL** to
  `https://mengkhong2306-star.github.io/login/`.
- Add that same URL to **Redirect URLs** so confirmation and password-reset
  emails return to the static app.
- Ensure the **Email** provider is enabled. If email confirmation is enabled,
  new users must confirm their email before signing in. Configure a trusted
  SMTP provider if you want reliable confirmation, invitations, and password
  recovery email delivery.

## 3. Deploy the protected admin function

The admin dashboard uses a Supabase Edge Function. It verifies the caller's
signed-in identity and requires membership in `public.admin_users`. Its
service-role credential is read only from Supabase's server environment; it
is never included in browser code.

From a terminal with Node.js installed, install and link the Supabase CLI:

```bash
npm install --global supabase
supabase login
supabase link --project-ref ddkqqauzhzeqnrvjguxh
supabase functions deploy admin-users
```

Complete Supabase's browser authorization yourself. Never paste CLI tokens,
service-role keys, or `sb_secret_` keys into GitHub or chat. The function uses
the standard Supabase environment variables supplied to hosted Edge Functions.

## 4. Grant admin access

First register your own account on the website and confirm its email if
confirmation is enabled. Then, in the Supabase SQL Editor, replace the
placeholder with your account email and run:

```sql
insert into public.admin_users (user_id)
select id
from auth.users
where lower(email) = lower('YOUR_ACCOUNT_EMAIL')
on conflict (user_id) do nothing;
```

Only project owners with SQL Editor access should grant admin membership. The
browser client cannot edit this table. Sign out and back in to see the admin
panel.

To remove an administrator role, use the SQL Editor while signed in as the
Supabase project owner:

```sql
delete from public.admin_users
where user_id = (
    select id from auth.users
    where lower(email) = lower('ADMIN_ACCOUNT_EMAIL')
);
```

An administrator account cannot be removed from the dashboard. Remove its
admin role first, then another administrator can remove the account.

## 5. Publish the app

The Supabase project URL and anon/publishable key are configured in
[`app.js`](./app.js). The anon key is intentionally public browser
configuration; database security must come from RLS. Never substitute a
`service_role` or `sb_secret_` key.

Push changes to the `main` branch. GitHub Pages will publish the static app at
<https://mengkhong2306-star.github.io/login/>. No Render, PythonAnywhere, or
Flask server configuration is needed for the website.

## 6. Verify

1. Open the GitHub Pages URL and create a test account.
2. If email confirmation is enabled, follow the email link and return to the
   site to sign in.
3. Add a note, refresh, and confirm it remains. Sign out and register a
   second test user to confirm the first user's notes are not visible.
4. Test password recovery and verify that the reset link returns to the app.
5. For an admin account, confirm the account list, invitation, sign-in
   timestamp, and confirmed account removal controls appear.

The Supabase health and database status can be monitored in the Supabase
dashboard. Do not post passwords, reset links, database connection strings, or
secret API keys in chat or commit them to Git.

Admin removal permanently deletes the selected auth account and its related
profile and notes. The UI requires confirmation and prevents the signed-in
admin from removing their own account. Invite users by email; they set their
own password. Sign-in timestamps are app-side activity records, not a
tamper-proof audit log, and do not include IP addresses.

## Existing account data

Existing Flask/SQLite/Render accounts and notes do not transfer automatically.
Users must create a new Supabase Auth account. Export notes separately before
retiring the old service if you need to preserve them. Passwords are not
migrated.
