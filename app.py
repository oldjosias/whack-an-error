"""
Flask Application for Whack-an-Error
Clean, modular backend with separated concerns
"""
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from game_logic import GameManager
from data_manager import DataManager
import os

app = Flask(__name__)

# Enable CORS for GitHub Pages frontend
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "https://oldjosias.github.io",
            "http://localhost:*",
            "http://127.0.0.1:*"
        ]
    }
})

# Initialize managers
game_manager = GameManager(initial_d=3)
data_manager = DataManager()

# Log startup info
print("=" * 50)
print("🎮 Whack-an-Error Flask Server Starting...")
print(f"📊 Database: {'PostgreSQL' if os.environ.get('DATABASE_URL') else 'Local CSV/SQLite'}")
print("=" * 50)


@app.route('/')
def index():
    """Serve the main game page"""
    return render_template('index.html')


@app.route('/api/new_round', methods=['POST'])
def api_new_round():
    """Start a new round with specified parameters"""
    try:
        data = request.get_json() or {}
        grid_size = data.get('d')
        num_errors = data.get('errors', 0)
        
        # Convert to int if provided
        if grid_size is not None:
            grid_size = int(grid_size)
        if isinstance(num_errors, str):
            num_errors = int(num_errors)
            
        state = game_manager.create_new_round(grid_size, num_errors)
        return jsonify(state)
        
    except (ValueError, TypeError) as e:
        return jsonify({'error': 'Invalid parameters'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/flip_qubit', methods=['POST'])
def api_flip_qubit():
    """Flip a qubit and return updated state"""
    try:
        data = request.get_json()
        if not data or 'index' not in data:
            return jsonify({'error': 'Missing qubit index'}), 400
            
        qubit_index = int(data['index'])
        state = game_manager.flip_qubit(qubit_index)
        return jsonify(state)
        
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid qubit index'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/store_game_data', methods=['POST'])
def api_store_game_data():
    """Store game data"""
    try:
        game_data = request.get_json()
        if not game_data:
            return jsonify({'error': 'No data provided'}), 400
            
        result = data_manager.store_game_data(game_data)
        
        if 'error' in result:
            return jsonify(result), 500
            
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/highscores', methods=['GET'])
def api_highscores():
    """Get highscores by grid size"""
    try:
        highscores = data_manager.get_highscores()
        return jsonify(highscores)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/statistics')
def api_statistics():
    """Get statistics grouped by grid size"""
    try:
        age_min = request.args.get('age_min')
        age_max = request.args.get('age_max')
        
        # Convert to int if provided
        if age_min is not None:
            age_min = int(age_min)
        if age_max is not None:
            age_max = int(age_max)
            
        statistics = data_manager.get_statistics(age_min, age_max)
        return jsonify(statistics)
        
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid age parameters'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/statistics_by_age')
def api_statistics_by_age():
    """Get statistics grouped by age ranges"""
    try:
        statistics = data_manager.get_statistics_by_age()
        return jsonify(statistics)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/health')
def api_health():
    """Health check endpoint"""
    db_status = 'postgresql' if os.environ.get('DATABASE_URL') else 'local'
    
    # Try to verify database connection
    try:
        if data_manager.use_database:
            from database import DatabaseManager
            with DatabaseManager() as db:
                # Quick query to verify connection
                db.session.execute('SELECT 1')
                db_connected = True
        else:
            db_connected = True  # CSV mode always works
    except Exception as e:
        db_connected = False
        db_status = f"error: {str(e)}"
    
    return jsonify({
        'status': 'ok',
        'database': db_status,
        'db_connected': db_connected
    })


@app.route('/api/debug/data_count')
def api_debug_data_count():
    """Debug endpoint to check how many records are in the database"""
    if data_manager.use_database:
        try:
            from database import DatabaseManager, GameData
            with DatabaseManager() as db:
                count = db.session.query(GameData).count()
                sample = db.session.query(GameData).limit(3).all()
                
                return jsonify({
                    'storage': 'postgresql',
                    'total_records': count,
                    'sample_records': [{
                        'uid': s.uid,
                        'name': s.name,
                        'grid_size': s.grid_size,
                        'level_reached': s.level_reached
                    } for s in sample]
                })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        import csv
        try:
            with open(data_manager.filename, 'r') as f:
                count = sum(1 for _ in csv.reader(f)) - 1  # Minus header
            return jsonify({
                'storage': 'csv',
                'total_records': count
            })
        except FileNotFoundError:
            return jsonify({
                'storage': 'csv',
                'total_records': 0
            })


if __name__ == '__main__':
    # Use environment port for Render, fallback to 5002 for local dev
    port = int(os.environ.get('PORT', 5002))
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(host='0.0.0.0', port=port, debug=debug)
