"""Web-based Surface Code game prototype.

Serves a browser-playable experience that mirrors the loop outlined in
``game_pseudocode.py``. Users clear syndromes interactively while the app
persists aggregated results.
"""
from __future__ import annotations

import json
import os
import uuid

from flask import Flask, jsonify, render_template, request
from sqlalchemy import text

from database import DatabaseManager, GameData


app = Flask(__name__)
db_manager = DatabaseManager()

ALLOWED_GRID_SIZES = (3, 4, 5, 6, 7)
DEFAULT_LEVELS = [round(0.01 + i * (0.15 - 0.01) / 9, 3) for i in range(10)]
ALLOWED_ROUNDS_PER_LEVEL = (1, 3, 5, 7)
DEFAULT_ROUNDS_PER_LEVEL = 3

print("=" * 60)
print("Surface Code prototype starting")
print(
    f"Database mode: {'PostgreSQL' if os.environ.get('DATABASE_URL') else 'SQLite (local)'}"
)
print("=" * 60)


def _parse_json_array(raw_value, coercer):
    """Convert arbitrary input into a JSON-serialisable list."""

    if raw_value is None:
        return []
    if isinstance(raw_value, (list, tuple)):
        items = raw_value
    elif isinstance(raw_value, str):
        try:
            items = json.loads(raw_value)
        except json.JSONDecodeError:
            return []
        if not isinstance(items, list):
            return []
    else:
        return []

    output = []
    for item in items:
        try:
            output.append(coercer(item))
        except (TypeError, ValueError):
            continue
    return output


def _parse_probability_stats(raw_value):
    """Standardise aggregated probability stats sent by the client."""

    if raw_value is None:
        return []
    if isinstance(raw_value, str):
        try:
            raw_value = json.loads(raw_value)
        except json.JSONDecodeError:
            return []
    if not isinstance(raw_value, list):
        return []

    stats = []
    for item in raw_value:
        if not isinstance(item, dict):
            continue
        try:
            probability = float(item.get("probability"))
            total_rounds = int(item.get("total_rounds"))
            logical_failures = int(item.get("logical_failures"))
        except (TypeError, ValueError):
            continue
        stats.append(
            {
                "probability": round(probability, 6),
                "total_rounds": max(total_rounds, 0),
                "logical_failures": max(logical_failures, 0),
            }
        )
    return stats


def _serialize_game(game: GameData) -> dict:
    """Convert database rows into plain dicts for JSON responses."""

    def _load_json(value: str):
        if not value:
            return []
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return []

    return {
        "uid": game.uid,
        "timestamp": game.timestamp.isoformat() if game.timestamp else None,
        "name": game.name,
        "grid_size": game.grid_size,
        "error_probabilities": _load_json(game.error_probabilities),
        "probability_stats": _load_json(game.probability_stats),
    }


@app.route("/")
def index():
    database_mode = "PostgreSQL" if os.environ.get("DATABASE_URL") else "SQLite (local)"
    return render_template(
        "index.html",
        grid_sizes=ALLOWED_GRID_SIZES,
        levels=DEFAULT_LEVELS,
        rounds_per_level=DEFAULT_ROUNDS_PER_LEVEL,
        allowed_rounds=ALLOWED_ROUNDS_PER_LEVEL,
        database_mode=database_mode,
    )


@app.route("/api/health")
def api_health():
    status = {"status": "ok"}
    try:
        db_manager.session.execute(text("SELECT 1"))
        status["database"] = "reachable"
    except Exception as exc:  # pragma: no cover - best effort
        status["database"] = f"error: {exc}"
    return jsonify(status)


@app.route("/api/debug/ping")
def api_ping():
    return jsonify({"message": "pong"})


@app.route("/api/game/data")
def api_game_data():
    records = (
        db_manager.session.query(GameData)
        .order_by(GameData.timestamp.desc())
        .limit(100)
        .all()
    )
    return jsonify([_serialize_game(record) for record in records])


@app.route("/api/game/save", methods=["POST"])
def api_game_save():
    payload = request.get_json(silent=True) or {}
    uid = (payload.get("uid") or uuid.uuid4().hex)[:8]

    try:
        grid_size = int(payload.get("grid_size"))
    except (TypeError, ValueError):
        grid_size = None
    if grid_size not in ALLOWED_GRID_SIZES:
        return jsonify({"status": "error", "message": "invalid grid_size"}), 400

    error_probabilities = _parse_json_array(payload.get("error_probabilities"), float)
    probability_stats = _parse_probability_stats(payload.get("probability_stats"))
    if not probability_stats and error_probabilities:
        probability_stats = [
            {"probability": round(value, 6), "total_rounds": 0, "logical_failures": 0}
            for value in error_probabilities
        ]

    record = GameData(
        uid=uid,
        name=payload.get("name"),
        grid_size=grid_size,
        error_probabilities=json.dumps(error_probabilities),
        probability_stats=json.dumps(probability_stats),
    )

    try:
        db_manager.session.add(record)
        db_manager.session.commit()
    except Exception as exc:  # pragma: no cover - database failure
        db_manager.session.rollback()
        return jsonify({"status": "error", "message": str(exc)}), 500

    return jsonify({"status": "stored", "uid": uid})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG") == "1")
