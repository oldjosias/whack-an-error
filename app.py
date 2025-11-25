"""Minimal Flask App
Provides a landing page and verifies database connectivity.
"""
from flask import Flask, jsonify
import os
from database import DatabaseManager

app = Flask(__name__)

print("=" * 50)
print("🚀 Minimal App Starting")
print(f"🔌 Database mode: {'PostgreSQL' if os.environ.get('DATABASE_URL') else 'SQLite (local)'}")
print("=" * 50)


@app.route('/')
def index():
    return (
        "<!DOCTYPE html><html><head><title>It works</title>"
        "<meta charset='utf-8'></head><body style='font-family:system-ui;"
        "display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;'>"
        "<h1>It works ✅</h1>"
        f"<p>Database: {'PostgreSQL' if os.environ.get('DATABASE_URL') else 'SQLite (local)'}</p>"
        "<p>Health: <a href='/api/health'>/api/health</a></p>"
        "</body></html>"
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


if __name__ == '__main__':
    # Use environment port for Render, fallback to 5002 for local dev
    port = int(os.environ.get('PORT', 5002))
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(host='0.0.0.0', port=port, debug=debug)
