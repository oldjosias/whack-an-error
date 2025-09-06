# Whack-an-Error

A quantum error correction game built with Flask and JavaScript. Players learn about surface code error correction by finding and fixing errors in a quantum computing lattice.

## Features

- **Interactive Game**: Click qubits to flip them and correct errors
- **Educational Tutorial**: Step-by-step guide to understanding quantum error correction
- **Statistics Tracking**: Monitor player performance and learning progress
- **Responsive Design**: Works on desktop and mobile devices
- **Multiple Difficulty Levels**: Progressive challenge as players advance

## Quick Start

1. **Install Dependencies**:
   ```bash
   pip install flask pandas numpy
   ```

2. **Run the Application**:
   ```bash
   python app.py
   ```

3. **Open Browser**: Navigate to `http://localhost:5000`

## Game Modes

- **Game Mode**: Try to correct all detectable errors without creating logical errors
- **Playground Mode**: Freely experiment with error patterns and their effects

## Project Structure

```
├── app.py              # Main Flask application
├── game_logic.py       # Core game mechanics and surface code logic
├── data_manager.py     # Data storage and statistics handling
├── surface_code.py     # Quantum surface code implementation
├── templates/
│   └── index.html      # Main game interface
├── static/
│   ├── css/
│   │   └── game.css    # Game styling
│   ├── js/
│   │   ├── api-client.js     # Backend communication
│   │   ├── game-controller.js # Main game controller
│   │   ├── game-renderer.js   # UI rendering
│   │   ├── game-state.js      # Game state management
│   │   └── managers.js        # Statistics and tutorial managers
│   └── [images]        # Game assets
└── data.csv           # Player data storage
```

## API Endpoints

- `GET /` - Main game interface
- `POST /api/new_round` - Start a new game round
- `POST /api/flip_qubit` - Flip a qubit during gameplay
- `POST /api/store_game_data` - Save player performance data
- `GET /api/highscores` - Retrieve top scores
- `GET /api/statistics` - Get overall game statistics
- `GET /api/statistics_by_age` - Get age-grouped statistics

## Development

The application follows a modular architecture:

- **Frontend**: Vanilla JavaScript with component-based organization
- **Backend**: Flask with separated concerns (game logic, data management)
- **Storage**: CSV-based data persistence
- **Styling**: Responsive CSS with flexbox layout

## Educational Goals

This game teaches:
- Quantum error correction principles
- Surface code mechanics
- Syndrome detection and correction
- Logical vs physical errors
- Error probability and mitigation strategies

## License

Educational project for quantum computing research and teaching.
