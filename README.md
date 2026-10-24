# MengKhong

MengKhong is a small Flask learning app for private notes, with account
registration, login, and email-based password recovery. It includes a
responsive light/dark interface and stores passwords as hashes.

> **Status:** Learning/demo project, not a security-audited production vault.
> Use a unique password and do not store highly sensitive information.

## Features

- Register with a username, password, and recovery email
- Sign in and manage private notes
- Request a single-use password reset link that expires after 60 minutes
- Update the recovery email from the signed-in dashboard
- Responsive login and account screens with light/dark themes

## Run locally on Windows

From PowerShell:

```powershell
Set-Location C:\CyberLab
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
$env:FLASK_SECRET_KEY = (& python -c "import secrets; print(secrets.token_hex(32))")
python app.py
```

Open <http://127.0.0.1:5000> and create an account. The SQLite database is
created as `vault_secure.db` beside the app and is excluded from Git.

To enable Gmail password-reset email locally, set `GMAIL_ADDRESS` to the
sender's Gmail address and `GMAIL_APP_PASSWORD` to a Google App Password.
Google 2-Step Verification must be enabled to create an App Password. Never
use or commit your regular Google password. Restart the app after setting
environment variables. For a public deployment, configure
`PUBLIC_BASE_URL` to the HTTPS site URL.

## Host with PythonAnywhere and Supabase

Use PythonAnywhere to run Flask and Supabase PostgreSQL to store accounts,
reset tokens, and notes. Follow [`DEPLOYMENT.md`](./DEPLOYMENT.md) for setup.

PythonAnywhere free accounts restrict outbound network access. Test whether
your Supabase pooler endpoint is reachable from the account before deploying;
you may need a paid PythonAnywhere plan for external PostgreSQL access.
Supabase free projects also have usage limits and may pause when inactive.
Check both providers' current limits and backup policies before relying on
the service for important data. GitHub Pages is only a static landing page
and cannot run the Flask login.

The app keeps its existing Flask authentication and reset flow; Supabase is
the database only. Configure Gmail App Password settings in PythonAnywhere
if you want reset emails; outbound SMTP may also be restricted.

## Local database

When `DATABASE_URL` is not set, the app uses a local SQLite database named
`vault_secure.db`. That local file is excluded from Git and is not migrated
to Supabase; create accounts again on the hosted app.

## Project files

- `app.py` — Flask routes, database, templates, and application setup
- `wsgi.py` — production startup entry point
- `requirements.txt` — Python dependencies
