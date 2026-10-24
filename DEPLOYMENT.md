# Deploy NovaVault to Render

## Push the source to GitHub

Install Git for Windows, then run these commands in PowerShell:

```powershell
Set-Location C:\CyberLab
git init -b main
git add app.py wsgi.py requirements.txt render.yaml .gitignore templates
git commit -m "Prepare NovaVault for Render"
git remote add origin https://github.com/mengkhong2306-star/login.git
git push -u origin main
```

Sign in to GitHub if Git prompts you. Do not add `vault_secure.db`, `.env`
files, or the virtual environment; `.gitignore` excludes them.

## Create the Render service

In Render, create a Blueprint instance and connect the `login` repository.
Review the `starter` web service and 1 GB persistent disk before confirming:
Render may charge for these resources. The persistent disk is where account,
recovery-email, and note data are stored.

Set the requested `GMAIL_ADDRESS` and `GMAIL_APP_PASSWORD` environment
variables in Render. Use a Google App Password (with 2-Step Verification
enabled), not your normal Google password. Keep both values private.
Render supplies `RENDER_EXTERNAL_URL`, which is used to build reset links.

After the first deployment, open the deployed site and register an account
using the recovery email you want associated with it. The local SQLite
database is intentionally excluded from Git and is not copied to Render.
