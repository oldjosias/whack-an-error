# Whack‑an‑Error

A kid‑friendly, interactive surface‑code game. Play to fix physical errors without causing a logical error, and learn quantum error correction along the way.

This repo supports two ways to run the game:

- Static (client‑only) build: No backend. Runs on GitHub Pages or any static server. Data is kept in your browser using localStorage.
- Flask backend: Local server that persists runs to CSV and serves statistics/highscores via API.

## Features

- Interactive surface‑code board with stabilizer “sensors”
- Two modes: Game and Playground (toggle error visibility in Playground)
- Level progression with popup between levels; max level = n/2 where n = d² + (d−1)²
- End‑of‑game Save/Discard; highscores per grid size (d)
- Statistics: Logical error rate vs physical error rate; “Show by age range” with an Unknown bucket
- Dataset management (static mode): Download dataset (includes highscores) and Delete dataset (also clears highscores)
- Localization (EN/DE) with live UI updates
- Responsive layout; water panels always visible on small screens; visual “beavers” on the right when a logical error occurs
- Kid‑friendly, pixel/retro styling

## Run the game

### Option A — Static (no backend)

Works offline; ideal for GitHub Pages.

- Quick open: Open `index.html` in a modern browser. If your browser blocks local file imports, serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

- Data lives in your browser under localStorage keys:
   - `whack_data_v1` (runs)
   - `whack_highscores_v1` (highscores)

### Option B — Flask backend (local CSV persistence)

1) Install dependencies

```bash
pip install flask pandas numpy
```

2) Start the server

```bash
python app.py
```

3) Visit http://localhost:5000

The backend saves to `data.csv` and exposes the API below.

## How to play

- Pick a grid size d and mode, then Start.
- Game mode: Click qubits to turn all sensors off without creating a logical error.
- Playground mode: Explore; use the “Show/Hide errors” toggle to visualize ground truth.
- If all sensors are off and no logical error occurs, advance rounds/levels. Between levels, a popup offers “Start next level”.
- When a logical error occurs, the game ends. Enter optional name/age and Save or Discard. Clicking qubits is disabled after game over.
- The selection panel shows the highscore for the chosen d.

## Statistics (what’s plotted and how)

- X‑axis (physical error rate): i/n for i = 1..floor(n/2), with n = d² + (d−1)².
- Y‑axis (logical error rate): 1 − successes/rounds, where “rounds” only counts levels that were actually reached.
- Mixed datasets (different d): axes are recomputed from grid sizes. For age splits, a conservative common axis (smallest n) is used.
- “Show by age range” groups into ranges plus an Unknown bucket when age is missing/not a number.

Static build UI extras:
- Download dataset: Exports both `data` and `highscores` in one JSON bundle.
- Delete dataset: Clears both runs and highscores and immediately refreshes the highscore label.

## Localization

- English and German are supported. The UI updates immediately when switching language.

## Project structure

```
├── index.html                # Static entry (client‑only)
├── 404.html                  # GitHub Pages SPA fallback
├── app.py                    # Flask app (optional backend)
├── data_manager.py           # CSV storage & server‑side statistics
├── game_logic.py             # Backend (legacy) game logic
├── surface_code.py           # Backend (legacy) surface code helpers
├── static/
│   ├── css/
│   │   └── game.css
│   ├── js/
│   │   ├── static-engine.js  # Client‑side Surface Code simulator
│   │   ├── api-client.js     # Uses StaticEngine (static) or API (backend)
│   │   ├── game-state.js     # State & progression (max level = n/2)
│   │   ├── game-renderer.js  # Rendering, sensors, beavers, legend
│   │   ├── managers.js       # Statistics & tutorial UI
│   │   ├── game-controller.js# Orchestration
│   │   └── i18n.js           # EN/DE strings and DOM bindings
│   └── assets (images)
├── templates/
│   └── index.html            # Flask entry
└── data.csv                  # CSV (backend mode)
```

## API (Flask mode)

- GET `/` — Main page
- POST `/api/new_round` — Start a new round
- POST `/api/flip_qubit` — Flip a qubit
- POST `/api/store_game_data` — Persist a run (name, age, grid, per‑level successes, etc.)
- GET `/api/highscores` — Highscores per grid size
- GET `/api/statistics` — Overall statistics
- GET `/api/statistics_by_age` — Statistics split by age ranges

In static mode, the client uses `StaticEngine` and localStorage; these endpoints aren’t called.

## Deployment

### GitHub Pages (static)

- Commit/push to `main`. Enable Pages for the repo and set source to the root.
- `index.html` and `404.html` are already in place; assets use relative paths.

### Flask (local/server)

- Run `python app.py` locally, or deploy behind a WSGI server. CSV persistence is to `data.csv`.

## Data & privacy

- Static mode: All data stays in your browser (localStorage). Use the Statistics modal to Download or Delete.
- Flask mode: Data is stored in `data.csv` on the server machine; no external services are used.

## Educational goals

- Surface code basics, stabilizer syndromes, and the distinction between physical and logical errors
- How correction success probability changes with physical error rate

## License

Educational project for quantum computing research and teaching.
