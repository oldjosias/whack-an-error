# Prototype App: Whack‑an‑Error

This stripped-down Flask project now exposes the first ingredient for the upcoming game: a preferences screen that seeds demo game data and lets you inspect what is stored in the database.

## Purpose
Provide a tiny web service that:
- Serves a landing screen at `/` where you can select the code distance `d` and trigger demo data generation.
- Verifies database connectivity via `/api/health`.
- Generates random placeholder runs through `/api/game/start` and persists them.
- Lists all stored runs with `/api/game/data` and shows them in a modal from the UI.
- Offers a simple ping endpoint at `/api/debug/ping` for smoke tests.

## Current Files
```
app.py          # Flask app with prototype UI + API endpoints
database.py     # SQLAlchemy engine + example model (GameData)
render.yaml     # Render.com service + PostgreSQL provisioning
requirements.txt# Minimal dependencies (Flask, gunicorn, psycopg2-binary, SQLAlchemy)
README.md       # This file
```

Legacy assets (HTML, static JS/CSS, templates, migration scripts) were removed in the previous cleanup pass.

## Endpoints
- GET `/` — Renders the game preferences screen with controls and embedded JavaScript.
- GET `/api/health` — Performs a `SELECT 1` against the configured database URL and reports the result.
- GET `/api/debug/ping` — Returns JSON `{message: "pong"}`.
- POST `/api/game/start` — Accepts `{grid_size: 3|4|5|6|7}`, generates random demo statistics, and stores them in the database.
- GET `/api/game/data` — Returns all stored demo runs ordered by most recent first.

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
