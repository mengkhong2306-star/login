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
- BlackArch Linux overview with its official logo and links to the official site and tool repository
- Sign-in required only for private notes and account management
- Dashboard tabs for Notes and Account
- English, Khmer, Spanish, French, Simplified Chinese, Arabic, Hindi,
  Vietnamese, Japanese, and Korean translations for the public tool library
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
filter by category, then choose **View details** for the purpose summary, safe
learning workflow, Kali package installation steps, and official
documentation. The package tab explains refreshing package lists and
installing the listed Kali package; confirm the package and requirements on
the official tool page before installation. Private notes and account
management remain available only to authenticated users. A selected
defensive set has safe local or offline examples; other tools provide
documentation links rather than unverified run commands.

Examples are text for learning and are not run by this website. The site does
not install software, run scans, or confirm authorization. Only test systems
you own or have explicit permission to assess; define the allowed scope first,
practice in an isolated lab, keep protections enabled, use least privilege,
and avoid production systems and real sensitive data. Do not treat a summary
as a substitute for the tool's official documentation.

The directory does not bundle tool software or copy Kali descriptions.
Purpose summaries remain concise and high-level; the additional languages use
localized category-level summaries, while English and Khmer retain the
existing grouped-purpose summaries.
The distribution selector also provides a separate searchable BlackArch
catalog with 2,868 package names, versions, and 50 official package groups
from the BlackArch tools index (refreshed 2026-10-31). BlackArch entries link
to their official group references and upstream project links where listed;
publisher descriptions and tool-specific usage commands are not copied.
Package installation guidance is for Arch Linux with the BlackArch
repository configured. The displayed logo is the official asset from
<https://blackarch.org/images/logo/ba-logo.png>.
`tool-image-map.js` maps 501 catalog entries to 321 distinct, transparent
2048×2048 WebP exports of the supplied SVG artwork. Tools that share a source
logo share its export, and tools without a specific image use the generic
missing-icon artwork. WebP keeps the 2K transparent images substantially
smaller than PNG exports. The original image directory is left unchanged. The
directory does not execute commands or copy Kali's descriptions or page
design. Tool artwork is used to identify links to the respective official
documentation; NiNJa GO is independent and is not affiliated with Kali Linux.

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
