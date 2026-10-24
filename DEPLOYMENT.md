# Render deployment checklist

## 1. Connect the GitHub repository

The source is in [the `login` repository](https://github.com/mengkhong2306-star/login),
on the `main` branch. In Render, choose **New + → Blueprint**, connect GitHub
if prompted, and select this repository and branch. Render reads `render.yaml`
and proposes the `novavault` web service and persistent disk.

## 2. Review the service and disk

The Blueprint selects a Starter web service and a 1 GB persistent disk mounted
at `/var/data`. These resources may incur charges. Review the current price
and service configuration in Render before confirming. Do not remove the
persistent disk: SQLite is configured to store accounts, recovery addresses,
reset tokens, and notes there.

## 3. Configure email delivery

Set the Blueprint's `GMAIL_ADDRESS` and `GMAIL_APP_PASSWORD` values in the
Render service environment. Use a Google App Password from an account with
2-Step Verification enabled, not the account's normal password. Do not commit
these values or share them in chat.

Render generates `FLASK_SECRET_KEY` and provides `RENDER_EXTERNAL_URL`. The
app uses the external URL when constructing password-reset links and requires
secure session cookies in the deployed environment.

## 4. Verify deployment

Wait for Render's deploy to succeed, then open the generated `onrender.com`
URL. Check `/health`, register a new account, add a note, and request a
password-reset email. The local `vault_secure.db` is excluded from Git and is
not migrated to Render; recreate accounts on the hosted site.
