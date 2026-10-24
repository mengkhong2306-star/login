# MengKhong

MengKhong is a static private-notes app. GitHub Pages serves the website;
Supabase provides email/password authentication and PostgreSQL storage. There
is no Flask server to run.

## Features

- Register and sign in with email and password
- Email-based password reset
- Add and delete private notes
- Change your username
- Admin-only account invitations, removal, and sign-in activity
- Safe, fictional defensive-security exercises
- Searchable starter library of Kali tools with safe local/offline examples
- Responsive interface with light and dark themes
- Row Level Security keeps each user's profile and notes private

## Setup

1. Follow [`DEPLOYMENT.md`](./DEPLOYMENT.md) to create the Supabase schema,
   configure authentication, deploy the protected admin function, and grant
   your own account admin access.
2. Ensure GitHub Pages is enabled for the `main` branch at the repository root.
   The site is <https://mengkhong2306-star.github.io/login/>.
3. Register a new account and test sign-in, password recovery, and notes.

The Supabase URL and anon/publishable key in `app.js` are public browser
configuration. The SQL schema enables Row Level Security. Never put a
Supabase `service_role` or `sb_secret_` key in browser code or GitHub.
Admin account management is performed by an Edge Function that verifies
admin membership server-side. Account removal is permanent and deletes that
account's notes.

The tool library is a small, original reference catalog in `tool-catalog.js`.
It links to official Kali documentation and displays commands as text only;
the website does not execute shell commands. Examples are limited to local
audits, localhost, file integrity checks, and offline packet captures.

## Data migration

Existing Flask/SQLite/Render accounts and notes are not automatically moved
to Supabase Auth. Users must create accounts in the new site. Export and
migrate notes separately if needed; never migrate password hashes into
browser code.

## Project files

- `index.html` — GitHub Pages interface
- `app.js` — Supabase browser authentication and notes UI
- `supabase/schema.sql` — tables, trigger, grants, and Row Level Security
- `DEPLOYMENT.md` — Supabase and GitHub Pages setup
