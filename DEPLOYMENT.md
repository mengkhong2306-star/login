# Host MengKhong with PythonAnywhere and Supabase

PythonAnywhere runs the Flask app; Supabase stores account, reset-token, and
note data in PostgreSQL. GitHub Pages only hosts the static landing page and
cannot run the Flask login.

## Important free-plan network limitation

PythonAnywhere free accounts restrict outbound internet access to an allowlist.
The Supabase Session pooler hostname may not be reachable on that plan. Before
configuring the web app, test the pooler host and port from a PythonAnywhere
Bash console. Substitute only the hostname shown in the Supabase URI (do not
include the username, password, or `postgresql://` prefix):

```bash
python -c "import socket; socket.create_connection(('YOUR_SESSION_POOLER_HOST', 5432), timeout=5).close(); print('Supabase pooler is reachable')"
```

If it times out or is blocked, the free plan cannot connect this app to
Supabase; use a PythonAnywhere plan that allows external connections or choose
another Flask host. Do not put a database password in the test command.

Gmail SMTP may also be blocked on free accounts. Test real email delivery
before relying on password recovery.

## 1. Get the Supabase connection string

1. Open your project in the [Supabase dashboard](https://supabase.com/dashboard).
2. Select **Connect**, then choose the **Session pooler** connection string.
3. Keep the full URI private. It contains your database password; never commit
   it to GitHub or paste it into chat.

The app creates its tables on startup. No SQL migration is required.

## 2. Create the PythonAnywhere app

1. Create/sign in to a [PythonAnywhere account](https://www.pythonanywhere.com/).
2. Open a Bash console and clone the repository:

   ```bash
   git clone https://github.com/mengkhong2306-star/login.git
   cd login
   python3 -m venv ~/.virtualenvs/mengkhong
   ~/.virtualenvs/mengkhong/bin/pip install -r requirements.txt
   ```

3. In **Web**, select **Add a new web app**, then choose **Manual
   configuration** and the Python version matching the virtual environment.
4. In the web app's **Virtualenv** field, enter:
   `/home/YOUR_USERNAME/.virtualenvs/mengkhong`.
5. Click the WSGI configuration-file link. Replace its contents with the
   following, replacing the example values locally in that private file:

   ```python
   import os
   import sys

   project_home = "/home/YOUR_USERNAME/login"
   if project_home not in sys.path:
       sys.path.insert(0, project_home)

   os.environ["FLASK_SECRET_KEY"] = "GENERATE_A_PRIVATE_RANDOM_VALUE"
   os.environ["DATABASE_URL"] = "PASTE_SUPABASE_SESSION_POOLER_URI"
   os.environ["SESSION_COOKIE_SECURE"] = "true"
   os.environ["PUBLIC_BASE_URL"] = "https://YOUR_USERNAME.pythonanywhere.com"

   # Optional: Google App Password, not your regular Google password.
   # os.environ["GMAIL_ADDRESS"] = "your-sender@gmail.com"
   # os.environ["GMAIL_APP_PASSWORD"] = "your-google-app-password"

   from wsgi import app as application
   ```

   Generate the Flask secret in a console with
   `python -c "import secrets; print(secrets.token_hex(32))"`.
   Keep the WSGI configuration private; do not commit its values or paste
   them into chat.
6. Save the WSGI file and click **Reload** on the Web tab. The site URL is
   `https://YOUR_USERNAME.pythonanywhere.com/`.

## 3. Verify and update

Open `/health`, then register an account, add a note, and reload the page.
For a Supabase-backed deployment, accounts and notes should remain available
after reload. Local SQLite accounts and notes are not migrated.

To publish later code changes, run `git pull` in the PythonAnywhere Bash
console and click **Reload** on the Web tab. If the app fails to start, check
the error log linked from the Web tab; do not expose database credentials in
the log or support request.

If Gmail settings are not configured and tested, forgot-password requests
cannot deliver email.
