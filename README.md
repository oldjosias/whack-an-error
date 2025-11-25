# Minimal App: Whack‑an‑Error (Stripped Version)

This repository has been reduced to a minimal Flask + PostgreSQL connectivity check. All former game logic, static assets, and CSV/statistics code have been removed per cleanup request.

## Purpose
Provide a tiny web service that:
- Serves a landing page at `/` showing “It works.”
- Verifies database connectivity via `/api/health`.
- Offers a simple ping endpoint at `/api/debug/ping`.

## Current Files
```
app.py          # Flask app (minimal endpoints)
database.py     # SQLAlchemy engine + example model (GameData)
render.yaml     # Render.com service + PostgreSQL provisioning
requirements.txt# Minimal dependencies (Flask, gunicorn, psycopg2-binary, SQLAlchemy)
README.md       # This file
```

Legacy assets (HTML, static JS/CSS, templates, migration scripts) were removed in this stripped version.

## Endpoints
- GET `/` — Returns a minimal HTML page confirming the service runs.
- GET `/api/health` — Performs a `SELECT 1` against the configured database URL. Returns JSON `{status: "ok"}` or `{status: "error"}`.
- GET `/api/debug/ping` — Returns JSON `{message: "pong"}`.

## Database
Environment variable `DATABASE_URL` is injected by Render (see `render.yaml`). On startup `database.py` creates tables for the placeholder `GameData` model; you can remove the model or extend it as needed.

## Run Locally
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql://user:pass@host:5432/dbname  # adjust for local setup
gunicorn app:app
```
Then open http://localhost:8000 (Render uses your specified port; gunicorn defaults to 8000 locally unless configured).

## Modifying Further
- Add new models in `database.py` (or split into a `models/` package if it grows).
- Introduce new routes in `app.py` keeping imports minimal.
- Update `requirements.txt` only as new dependencies are required.

## Deployment (Render)
`render.yaml` provisions a free PostgreSQL instance and a Python web service. The only required env var for the app is `DATABASE_URL` (automatically provided).

## Next Steps (Optional)
- Add basic tests to ensure the health endpoint returns OK when the database is reachable.

Minimal version complete.
