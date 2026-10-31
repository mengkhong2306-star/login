# NiNJa GO

NiNJa GO is a static private-notes app. GitHub Pages serves the website;
Supabase provides email/password authentication and PostgreSQL storage. There
is no Flask server to run.

## Features

- Register and sign in with email and password
- Email-based password reset
- Add and delete private notes
- Change your username
- Admin-only account invitations, removal, and sign-in activity
- Public, searchable directory of Kali tool names and categories with links to official documentation
- Sign-in required only for private notes and account management
- Dashboard tabs for Notes and Account
- English and Khmer translations for the tool library, using Noto Sans Khmer
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

The tool directory presents Kali tool names in compact, category-grouped
cards. Its catalog was refreshed from the official Kali tools index on
2026-10-24 and contains 501 unique tool names, package slugs, and categories;
every entry has a concise, original high-level purpose summary and a details
view. The library is public and opens without signing in. Search by name or
filter by category, choose **View details** to read a purpose summary, and
follow the official Kali documentation link for authoritative requirements
and instructions. Choose **Sign in for notes** only when you want to use
private notes or account features. A small selected defensive set has safe
local or offline examples; other entries have summaries and documentation
links only.

Examples are text for learning and are not run by this website. The site does
not install software, run scans, or confirm authorization. Only test systems
you own or have explicit permission to assess; define the allowed scope first,
practice in an isolated lab, keep protections enabled, use least privilege,
and avoid production systems and real sensitive data. Do not treat a summary
as a substitute for the tool's official documentation.

The directory does not bundle tool software or copy Kali descriptions.
`tool-image-map.js` matches the SVG files supplied in
`image/Kali Tools _ Kali Linux Tools` to tool names and categories; entries
without a specific image use Kali's generic missing-icon asset. The supplied
image directory is left unchanged. The directory does not execute commands or
copy Kali's descriptions or page design. Tool artwork is used to identify
links to the respective official documentation; NiNJa GO is independent and
is not affiliated with Kali Linux.

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
