"""
Flask Application for Whack-an-Error
Clean, modular backend with separated concerns
"""
from flask import Flask, render_template, request, jsonify
from game_logic import GameManager
from data_manager import DataManager

app = Flask(__name__)

# Initialize managers
game_manager = GameManager(initial_d=3)
data_manager = DataManager()


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
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(debug=True, port=5002)
