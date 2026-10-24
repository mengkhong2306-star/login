# Free hosting: Render + Supabase

Render runs the Flask app; Supabase provides the PostgreSQL database. The
Render free web service can sleep when idle, and Supabase's free project has
usage limits and may pause when inactive. Check both providers' current
limits before using this for important data. GitHub Pages is only a static
landing page; it cannot run the Flask login.

## 1. Create the Supabase database

1. Create a project at [Supabase](https://supabase.com/dashboard).
2. Save the database password privately when creating the project.
3. In the project dashboard, open **Connect** and select the **Session pooler**
   connection string for Python/IPv4 deployments.
4. Copy the full PostgreSQL URI. Keep it private; it contains the database
   password. Do not paste it into GitHub or chat.

The app creates its tables on startup. No manual SQL migration is required.

## 2. Deploy the GitHub repository to Render

1. Open the [Render Blueprint deploy link](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Fmengkhong2306-star%2Flogin)
   and sign in with GitHub.
2. Select the `login` repository and `main` branch.
3. Review the `novavault` service. The Blueprint uses Render's `free` web
   service plan and does not create a paid disk.
4. Set the requested `DATABASE_URL` to the Supabase Session pooler URI.
5. Render generates `FLASK_SECRET_KEY`. Keep it generated and private.
6. Optionally set `GMAIL_ADDRESS` and `GMAIL_APP_PASSWORD` in the Render
   environment to enable password-reset email. Use a Google App Password,
   never your normal Google password.
7. Confirm the Blueprint and wait for the deployment health check to pass.
   Open the `onrender.com` URL shown by Render.

The app's existing Flask login and password-reset token flow stays in place;
Supabase is the database only. Render's `RENDER_EXTERNAL_URL` is used to
build reset links, and secure cookies are enabled by the Blueprint.

## 3. Verify the hosted app

Open `/health` on the Render URL, register a new account, add a note, and
check that the note remains after a page reload. Local SQLite accounts and
notes are not copied to Supabase; create new accounts on the hosted site.

If Gmail settings are not configured, forgot-password requests cannot deliver
email. Do not rely on recovery until you have tested actual email delivery.
