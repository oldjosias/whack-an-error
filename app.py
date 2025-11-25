"""Prototype Flask App for Whack-an-Error
Provides a configuration screen and simple data interactions.
"""
from flask import Flask, jsonify, request, render_template_string
import json
import os
import random
import uuid
from database import DatabaseManager, GameData

app = Flask(__name__)

print("=" * 50)
print("🚀 Minimal App Starting")
print(f"🔌 Database mode: {'PostgreSQL' if os.environ.get('DATABASE_URL') else 'SQLite (local)'}")
print("=" * 50)


ALLOWED_GRID_SIZES = (3, 4, 5, 6, 7)


def _serialize_game(game: GameData) -> dict:
        """Serialize a GameData row to a plain dict."""
        def _load_json(value: str):
                if not value:
                        return []
                try:
                        return json.loads(value)
                except json.JSONDecodeError:
                        return []

        return {
                'uid': game.uid,
                'timestamp': game.timestamp.isoformat() if game.timestamp else None,
                'name': game.name,
                'age': game.age,
                'grid_size': game.grid_size,
                'error_probabilities': _load_json(game.error_probabilities),
                'successful_rounds_per_level': _load_json(game.successful_rounds_per_level),
                'rounds_per_level': game.rounds_per_level,
                'level_reached': game.level_reached,
                'logical_errors': game.logical_errors,
        }


@app.route('/')
def index():
        db_mode = 'PostgreSQL' if os.environ.get('DATABASE_URL') else 'SQLite (local)'
        return render_template_string(
                """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Whack-an-Error Prototype</title>
    <style>
        :root {
            color-scheme: light dark;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: #0b1026;
            color: #f7f9fe;
        }
        body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: radial-gradient(circle at top, rgba(67, 101, 226, 0.35), rgba(8, 12, 31, 0.95));
        }
        .panel {
            background: rgba(7, 10, 24, 0.85);
            border: 1px solid rgba(120, 135, 255, 0.25);
            border-radius: 16px;
            padding: 32px;
            max-width: 520px;
            width: 100%;
            box-shadow: 0 30px 60px -30px rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(18px);
        }
        h1 {
            margin-top: 0;
            font-size: 1.8rem;
            letter-spacing: 0.02em;
            text-align: center;
        }
        .field {
            margin: 24px 0;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        label {
            font-weight: 600;
            font-size: 0.95rem;
        }
        select {
            appearance: none;
            border-radius: 10px;
            padding: 12px 16px;
            background: rgba(17, 25, 56, 0.9);
            border: 1px solid rgba(93, 117, 255, 0.35);
            color: inherit;
            font-size: 1rem;
        }
        .actions {
            display: flex;
            gap: 12px;
            justify-content: space-between;
            flex-wrap: wrap;
        }
        button {
            flex: 1 1 160px;
            padding: 14px 18px;
            font-size: 1rem;
            border-radius: 12px;
            border: none;
            cursor: pointer;
            font-weight: 600;
            transition: transform 120ms ease, box-shadow 120ms ease;
            color: #0b1026;
        }
        button.primary {
            background: linear-gradient(135deg, #7bdff2, #b2f7ef);
        }
        button.secondary {
            background: linear-gradient(135deg, #cdb4db, #ffc8dd);
        }
        button:disabled {
            opacity: 0.5;
            cursor: wait;
            transform: none;
            box-shadow: none;
        }
        button:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 12px 24px -18px rgba(255, 255, 255, 0.9);
        }
        .status {
            margin-top: 16px;
            font-size: 0.95rem;
            min-height: 1.2em;
        }
        .status.error {
            color: #ff8a94;
        }
        .database-label {
            font-size: 0.85rem;
            opacity: 0.7;
            text-align: center;
            margin-top: 8px;
        }
        .overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.75);
            display: none;
            align-items: center;
            justify-content: center;
            padding: 24px;
            z-index: 10;
        }
        .overlay.visible {
            display: flex;
        }
        .overlay-content {
            max-width: 720px;
            width: 100%;
            max-height: 80vh;
            overflow: auto;
            border-radius: 18px;
            background: rgba(8, 13, 34, 0.95);
            border: 1px solid rgba(148, 187, 255, 0.25);
            padding: 24px 28px;
            box-shadow: 0 30px 60px -24px rgba(0, 0, 0, 0.75);
            position: relative;
        }
        .overlay-content h2 {
            margin-top: 0;
        }
        .overlay-close {
            position: absolute;
            top: 16px;
            right: 16px;
            background: rgba(255, 255, 255, 0.16);
            border: none;
            color: inherit;
            cursor: pointer;
            border-radius: 999px;
            width: 36px;
            height: 36px;
            font-size: 1.1rem;
            line-height: 36px;
            text-align: center;
        }
        pre {
            background: rgba(15, 22, 46, 0.92);
            padding: 20px;
            border-radius: 12px;
            overflow-x: auto;
            font-size: 0.9rem;
            line-height: 1.45;
            border: 1px solid rgba(106, 130, 255, 0.25);
        }
    </style>
</head>
<body>
    <div class="panel">
        <h1>Configure Your Quantum Game</h1>
        <p style="text-align:center;opacity:0.75;max-width:36ch;margin:0 auto 24px;">
            Choose a code distance <strong>d</strong> to seed the demo game data. We'll flesh out the full gameplay next.
        </p>
        <div class="field">
            <label for="grid-size">Code distance (d)</label>
            <select id="grid-size" aria-label="Choose code distance">
                {% for value in grid_sizes %}
                <option value="{{ value }}">d = {{ value }}</option>
                {% endfor %}
            </select>
        </div>
        <div class="actions">
            <button type="button" class="primary" id="start-btn">Start Game</button>
            <button type="button" class="secondary" id="show-btn">Show Data</button>
        </div>
        <p id="status" class="status" role="status" aria-live="polite"></p>
        <p class="database-label">Database: {{ database_mode }}</p>
    </div>

    <div class="overlay" id="data-overlay" role="dialog" aria-modal="true" aria-labelledby="data-title">
        <div class="overlay-content">
            <button class="overlay-close" id="close-overlay" aria-label="Close">×</button>
            <h2 id="data-title">Stored Game Data</h2>
            <pre id="data-output">Loading data…</pre>
        </div>
    </div>

    <script>
        const allowedSizes = {{ grid_sizes | tojson }};
        const statusEl = document.getElementById('status');
        const startBtn = document.getElementById('start-btn');
        const showBtn = document.getElementById('show-btn');
        const selectEl = document.getElementById('grid-size');
        const overlay = document.getElementById('data-overlay');
        const closeOverlay = document.getElementById('close-overlay');
        const dataOutput = document.getElementById('data-output');

        function setStatus(message, isError = false) {
            statusEl.textContent = message || '';
            statusEl.classList.toggle('error', Boolean(isError));
        }

        async function startGame() {
            const gridSize = Number(selectEl.value);
            if (!allowedSizes.includes(gridSize)) {
                setStatus('Please select a valid code distance.', true);
                return;
            }

            setStatus('Generating demo game data…');
            startBtn.disabled = true;
            try {
                const response = await fetch('/api/game/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ grid_size: gridSize })
                });

                const payload = await response.json();
                if (!response.ok || payload.status !== 'ok') {
                    throw new Error(payload.message || 'Unable to start the game.');
                }

                setStatus(`Game data stored (id: ${payload.game.uid})`);
            } catch (error) {
                setStatus(error.message || 'Unexpected error while starting the game.', true);
            } finally {
                startBtn.disabled = false;
            }
        }

        async function showData() {
            setStatus('');
            dataOutput.textContent = 'Loading data…';
            overlay.classList.add('visible');

            try {
                const response = await fetch('/api/game/data');
                const payload = await response.json();
                const items = payload.items || [];

                if (!items.length) {
                    dataOutput.textContent = 'No data stored yet. Start a game first!';
                    return;
                }

                dataOutput.textContent = JSON.stringify(items, null, 2);
            } catch (error) {
                dataOutput.textContent = error.message || 'Unable to load data.';
            }
        }

        function hideOverlay(event) {
            if (!event || event.target === overlay || event.target === closeOverlay) {
                overlay.classList.remove('visible');
            }
        }

        startBtn.addEventListener('click', startGame);
        showBtn.addEventListener('click', showData);
        closeOverlay.addEventListener('click', hideOverlay);
        overlay.addEventListener('click', hideOverlay);
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                overlay.classList.remove('visible');
            }
        });
    </script>
</body>
</html>
                """,
                database_mode=db_mode,
                grid_sizes=ALLOWED_GRID_SIZES,
        )


# All legacy game endpoints removed.


@app.route('/api/health')
def api_health():
    """Health check endpoint"""
    db_status = 'postgresql' if os.environ.get('DATABASE_URL') else 'sqlite'
    try:
        with DatabaseManager() as db:
            db.session.execute('SELECT 1')
            db_connected = True
    except Exception as e:
        db_connected = False
        db_status = f"error: {e}"
    
    return jsonify({
        'status': 'ok',
        'database': db_status,
        'db_connected': db_connected
    })


@app.route('/api/debug/ping')
def api_debug_ping():
    """Simple debug endpoint"""
    return jsonify({'ping': 'pong'})


@app.route('/api/game/start', methods=['POST'])
def api_game_start():
    """Generate random demo data and store it in the database."""
    payload = request.get_json(silent=True) or {}
    grid_size = payload.get('grid_size')

    try:
        grid_size = int(grid_size)
    except (TypeError, ValueError):
        return jsonify({'status': 'error', 'message': 'Grid size must be an integer.'}), 400

    if grid_size not in ALLOWED_GRID_SIZES:
        return jsonify({'status': 'error', 'message': 'Invalid grid size selected.'}), 400

    uid = uuid.uuid4().hex[:8]
    level_count = max(1, random.randint(1, grid_size))
    error_probabilities = [round(random.uniform(0.05, 0.25), 3) for _ in range(level_count)]
    successes = [random.randint(0, 1) for _ in range(level_count)]

    game = GameData(
        uid=uid,
        name=f"Demo Player d{grid_size}",
        age=None,
        grid_size=grid_size,
        error_probabilities=json.dumps(error_probabilities),
        successful_rounds_per_level=json.dumps(successes),
        rounds_per_level=level_count,
        level_reached=random.randint(1, grid_size),
        logical_errors=random.randint(0, 2),
    )

    try:
        with DatabaseManager() as db:
            db.session.add(game)
            db.session.commit()
            db.session.refresh(game)
    except Exception as exc:
        return jsonify({'status': 'error', 'message': f'Failed to save game data: {exc}'}), 500

    return jsonify({'status': 'ok', 'game': _serialize_game(game)})


@app.route('/api/game/data', methods=['GET'])
def api_game_data():
    """Return all stored game data."""
    try:
        with DatabaseManager() as db:
            games = db.session.query(GameData).order_by(GameData.timestamp.desc()).all()
            items = [_serialize_game(game) for game in games]
    except Exception as exc:
        return jsonify({'status': 'error', 'message': f'Failed to load data: {exc}'}), 500

    return jsonify({'status': 'ok', 'items': items})


if __name__ == '__main__':
    # Use environment port for Render, fallback to 5002 for local dev
    port = int(os.environ.get('PORT', 5002))
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(host='0.0.0.0', port=port, debug=debug)
