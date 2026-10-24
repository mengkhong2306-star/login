# NovaVault

NovaVault is a small Flask learning app for private notes, with account
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

## Deploy to Render

The repository includes a Render Blueprint in [`render.yaml`](./render.yaml).
In Render, create a **Blueprint** from the `main` branch of this repository,
review the plan and persistent-disk costs, and confirm only if they are
acceptable. The Starter service and 1 GB persistent disk may incur charges.

Configure the Blueprint's requested `GMAIL_ADDRESS` and
`GMAIL_APP_PASSWORD` values in Render. Render generates `FLASK_SECRET_KEY`;
the Blueprint configures the SQLite database on the persistent disk and
enables secure session cookies. Render's `RENDER_EXTERNAL_URL` is used to
create password-reset links.

The persistent disk stores user accounts and notes. The local database is
not uploaded or migrated; create accounts again on the deployed site.
See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the deployment checklist.

## Project files

- `app.py` — Flask routes, database, templates, and application setup
- `wsgi.py` — production startup entry point
- `render.yaml` — Render service and persistent disk configuration
- `requirements.txt` — Python dependencies
