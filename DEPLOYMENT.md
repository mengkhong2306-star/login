# Hosting NovaVault

## Free option: PythonAnywhere

PythonAnywhere's free plan can host a small Flask app. It does not require a
payment card, but has resource, feature, and outbound-network limits. The
public app URL will use your PythonAnywhere username:
`https://YOUR_USERNAME.pythonanywhere.com/`.

### 1. Create your account and clone the app

Create a free account at [PythonAnywhere](https://www.pythonanywhere.com/),
then open a **Bash console** from its dashboard and run:

```bash
git clone https://github.com/mengkhong2306-star/login.git
cd ~/login
mkvirtualenv --python=/usr/bin/python3.13 novavault-env
pip install -r requirements.txt
python -c "import secrets; print(secrets.token_hex(32))"
```

Keep the secret printed by the last command private. Do not put it in GitHub.

### 2. Create the Flask web app

In the PythonAnywhere **Web** tab:

1. Choose **Add a new web app**.
2. Select **Manual configuration** and Python 3.13 (or the same version used
   for the virtualenv).
3. In the **Virtualenv** section, set
   `/home/YOUR_USERNAME/.virtualenvs/novavault-env`.
4. Open the WSGI configuration file linked on that page. Replace its contents
   with the following, substituting your PythonAnywhere username and the
   secret generated above:

```python
import os
import sys

project_home = "/home/YOUR_USERNAME/login"
if project_home not in sys.path:
    sys.path.insert(0, project_home)

os.environ["FLASK_SECRET_KEY"] = "PASTE_YOUR_PRIVATE_RANDOM_SECRET_HERE"
os.environ["SESSION_COOKIE_SECURE"] = "true"

from wsgi import app as application
```

5. Save the WSGI file and click **Reload** on the Web tab.
6. Open `https://YOUR_USERNAME.pythonanywhere.com/` and register an account.

The SQLite database is created beside the app in your home directory and
persists between web-app reloads. Do not delete it if you need to keep the
accounts and notes. The local database on your PC is not uploaded.

### 3. Password reset email limitation

The app sends recovery email through Gmail SMTP. Free hosting accounts can
have restricted outbound Internet access, so Gmail SMTP may be unavailable
from the free plan. Do not assume password reset email works until you have
tested it. If SMTP is blocked, the app's login and notes still work, but
password recovery email will not send from that host; use a permitted email
service or a host/account that allows outbound SMTP.

If outbound Gmail SMTP is supported for your account, add these privately to
the WSGI config before importing `wsgi`:

```python
os.environ["GMAIL_ADDRESS"] = "your-sender@gmail.com"
os.environ["GMAIL_APP_PASSWORD"] = "your-google-app-password"
```

Use a Google App Password, not your normal Google password. Never commit
these values to GitHub or share them in chat.

### 4. Update the hosted app

After pushing changes to GitHub, use a PythonAnywhere Bash console:

```bash
cd ~/login
git pull
```

Then click **Reload** on the Web tab. The SQLite database is ignored by Git
and is not overwritten by `git pull`.

## Alternative: Render

The repository also includes [`render.yaml`](./render.yaml) for Render. It
configures a Starter web service and persistent disk, which may incur charges.
Review Render's current pricing before creating those resources.

## GitHub Pages is not the Flask login

GitHub Pages only serves static files; it cannot execute Flask or provide the
database-backed login. The GitHub Pages landing page links to hosting
information. Use the PythonAnywhere app URL above for the actual login once
the web app is configured.
