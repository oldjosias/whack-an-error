/**
 * Game Controller
 * Main controller that coordinates between game state, API, and renderer
 */
class GameController {
    constructor() {
        this.gameState = new GameState();
        this.apiClient = new ApiClient();
        this.renderer = new GameRenderer();
        this.statisticsManager = new StatisticsManager(this.apiClient);
        this.tutorialManager = new TutorialManager();
    }

    async initialize() {
        await this.fetchHighscores();
        await this.newRound(false);
        this.setupEventHandlers();
        this.renderer.updateStatusPanelVisibility();
    }

    setupEventHandlers() {
        // Grid size change handler
        document.getElementById('d-select').addEventListener('change', async () => {
            if (!this.gameState.gameActive) {
                await this.newRound(false);
                this.showHighscore();
                this.renderer.updateBeavers(this.gameState.gridSize);
            }
        });

        // Statistics button handlers
        document.getElementById('show-stats-btn').onclick = () => {
            this.statisticsManager.showStatistics();
        };

        // Tutorial button handler
        document.getElementById('show-tutorial-btn').onclick = () => {
            this.tutorialManager.showTutorial();
        };
    }

    async startGame() {
        await this.fetchHighscores();
        
        const gridSize = parseInt(document.getElementById('d-select').value);
        const mode = document.getElementById('mode-select').value;
        
        this.gameState.startGame(mode, gridSize);
        
        if (this.gameState.playgroundMode) {
            document.getElementById('game-status').textContent = 'Spielplatz-Modus: Fehler können manuell gesetzt werden.';
            document.getElementById('toggle-errors-btn').style.display = 'block';
            document.getElementById('toggle-errors-btn').textContent = 'Fehler anzeigen';
            await this.newPlayground();
        } else {
            document.getElementById('game-status').textContent = `Level 1, Runde 1 von 5`;
            document.getElementById('toggle-errors-btn').style.display = 'none';
            await this.newRound(true);
        }
        
        document.getElementById('selection-panel').classList.add('hide');
        document.getElementById('floating-reset').style.display = 'block';
    }

    resetGame() {
        this.gameState.reset();
        document.getElementById('game-status').textContent = '';
        document.getElementById('status').textContent = '';
        document.getElementById('selection-panel').classList.remove('hide');
        document.getElementById('floating-reset').style.display = 'none';
        document.getElementById('toggle-errors-btn').style.display = 'none';
        
        if (document.getElementById('mode-select').value === 'playground') {
            this.newPlayground();
        } else {
            this.newRound(false);
        }
    }

    async newRound(isGame = false) {
        this.gameState.flippedQubits.clear();
        this.gameState.roundJustStarted = true;
        this.gameState.gridSize = parseInt(document.getElementById('d-select').value);
        
        const errors = isGame ? this.gameState.currentLevel : 0;
        
        try {
            const state = await this.apiClient.newRound(this.gameState.gridSize, errors);
            this.renderer.renderGame(state, this.gameState);
        } catch (error) {
            console.error('Failed to start new round:', error);
        }
    }

    async newPlayground() {
        try {
            const state = await this.apiClient.newRound(this.gameState.gridSize, 0);
            this.gameState.playgroundLastState = state;
            this.renderer.renderGame(state, this.gameState);
        } catch (error) {
            console.error('Failed to start playground:', error);
        }
    }

    togglePlaygroundErrors() {
        this.gameState.playgroundShowErrors = !this.gameState.playgroundShowErrors;
        document.getElementById('toggle-errors-btn').textContent = 
            this.gameState.playgroundShowErrors ? 'Fehler verbergen' : 'Fehler anzeigen';
        
        if (this.gameState.playgroundLastState) {
            this.renderer.renderGame(this.gameState.playgroundLastState, this.gameState);
        }
    }

    async flipQubit(qubitIndex) {
        // Hammer animation
        await this.playHammerAnimation();
        
        // Toggle marking
        if (this.gameState.flippedQubits.has(qubitIndex)) {
            this.gameState.flippedQubits.delete(qubitIndex);
        } else {
            this.gameState.flippedQubits.add(qubitIndex);
        }
        
        try {
            const state = await this.apiClient.flipQubit(qubitIndex);
            this.renderer.renderGame(state, this.gameState);
        } catch (error) {
            console.error('Failed to flip qubit:', error);
        }
    }

    async flipQubitPlayground(qubitIndex) {
        try {
            const state = await this.apiClient.flipQubit(qubitIndex);
            this.gameState.playgroundLastState = state;
            this.renderer.renderGame(state, this.gameState);
        } catch (error) {
            console.error('Failed to flip qubit in playground:', error);
        }
    }

    async playHammerAnimation() {
        const qubit = event.target;
        const rect = qubit.getBoundingClientRect();
        const hammer = document.getElementById('hammer');
        
        hammer.style.left = (rect.left - 48) + 'px';
        hammer.style.top = (rect.top - 48) + 'px';
        hammer.style.animation = 'none';
        hammer.offsetHeight; // Trigger reflow
        hammer.style.animation = 'hammerWhack 0.3s forwards';
        
        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Reset hammer
        hammer.style.animation = 'none';
        hammer.style.opacity = '0';
    }

    nextRound() {
        // Remove next round button if present
        const oldBtn = document.getElementById('next-round-btn');
        if (oldBtn) oldBtn.remove();
        
        this.gameState.currentRound++;
        if (this.gameState.currentRound > this.gameState.roundsPerLevel) {
            this.gameState.currentLevel++;
            this.gameState.currentRound = 1;
            if (this.gameState.currentLevel > this.gameState.maxLevel) {
                this.endGame();
                return;
            }
            // Show level completion popup
            this.showLevelCompletionPopup(this.gameState.currentLevel - 1, this.gameState.currentLevel);
            return;
        }
        
        document.getElementById('game-status').textContent = 
            `Level ${this.gameState.currentLevel}, Runde ${this.gameState.currentRound} von 5`;
        this.newRound(true);
    }

    endGame() {
        this.gameState.gameActive = false;
        const statusPanel = document.getElementById('status-panel');
        
        const isNewHighscore = this.gameState.currentLevel > 
            (this.gameState.highscores[this.gameState.gridSize]?.level || 0);
        
        const hsMsg = isNewHighscore ? 
            `<div style='color:#e94e77; font-weight:bold; margin-bottom:8px;'>Neuer Highscore!</div>` : '';
        
        statusPanel.innerHTML = `
            <div class="status" id="game-status"></div>
            <div class="status" id="status"></div>
            ${hsMsg}
            <div style='font-size:1.2em; margin-top:18px;'>
                Spiel beendet! Logischer Fehler in Level ${this.gameState.currentLevel}, Runde ${this.gameState.currentRound}.
            </div>
            <br>
            <input id='player-name' type='text' placeholder='Name (optional)' 
                style='margin-bottom:10px; width:90%; padding:6px; font-size:1em; border-radius:6px; border:1px solid #bbb;'>
            <br>
            <input id='player-age' type='number' min='0' max='120' placeholder='Alter (optional)' 
                style='margin-bottom:10px; width:90%; padding:6px; font-size:1em; border-radius:6px; border:1px solid #bbb;'>
            <br>
            <button id='save-yes' class='btn'>Speichern</button> 
            <button id='save-no' class='btn' style='background:#e94e77;'>Verwerfen</button>
        `;
        
        document.getElementById('save-yes').onclick = () => {
            this.storeGameData();
            this.hideResultsPanel();
        };
        document.getElementById('save-no').onclick = () => {
            this.hideResultsPanel();
        };
        
        document.getElementById('floating-reset').style.display = 'none';
    }

    hideResultsPanel() {
        document.getElementById('status-panel').innerHTML = 
            '<div class="status" id="game-status"></div><div class="status" id="status"></div>';
        this.resetGame();
    }

    showLevelCompletionPopup(completedLevel, nextLevel) {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: #fff; border: 3px solid #4a90e2; border-radius: 15px; 
            padding: 30px; z-index: 1000; text-align: center; font-size: 1.2em;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        
        popup.innerHTML = `
            <div style='color: #4a90e2; font-weight: bold; margin-bottom: 15px;'>
                Level ${completedLevel} geschafft!
            </div>
            <div style='margin-bottom: 20px;'>
                In Level ${nextLevel} werden im Durchschnitt ${nextLevel} Fehler eingezeichnet.
            </div>
            <button id='start-next-level-btn' class='btn' style='font-size: 1.1em; padding: 10px 20px;'>
                Level ${nextLevel} starten
            </button>
        `;
        
        document.body.appendChild(popup);
        
        // Add overlay to prevent clicking other elements
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 999;
        `;
        document.body.appendChild(overlay);
        
        document.getElementById('start-next-level-btn').onclick = () => {
            document.body.removeChild(popup);
            document.body.removeChild(overlay);
            
            // Continue with the next level
            document.getElementById('game-status').textContent = 
                `Level ${this.gameState.currentLevel}, Runde ${this.gameState.currentRound} von 5`;
            this.newRound(true);
        };
    }

    async storeGameData() {
        if (this.gameState.playgroundMode) return; // Do not save data in playground mode
        
        const gameData = {
            name: document.getElementById('player-name')?.value || '',
            age: document.getElementById('player-age')?.value || '',
            grid_size: this.gameState.gridSize,
            error_probabilities: this.gameState.calculateErrorProbabilities(),
            successful_rounds_per_level: this.gameState.successfulRoundsPerLevel,
            rounds_per_level: this.gameState.roundsPerLevel,
            level_reached: this.gameState.currentLevel,
            logical_errors: this.gameState.logicalErrors
        };
        
        try {
            const result = await this.apiClient.storeGameData(gameData);
            const resultsPanel = document.getElementById('results-panel');
            let msg = resultsPanel.innerHTML;
            msg += `<div style='margin-top:12px; color:#4a90e2;'>Saved as ${result.filename}</div>`;
            resultsPanel.innerHTML = msg;
            document.getElementById('game-status').textContent = '';
            await this.fetchHighscores();
        } catch (error) {
            console.error('Failed to store game data:', error);
        }
    }

    async fetchHighscores() {
        try {
            this.gameState.highscores = await this.apiClient.getHighscores();
            this.showHighscore();
        } catch (error) {
            console.error('Failed to fetch highscores:', error);
        }
    }

    showHighscore() {
        const dVal = document.getElementById('d-select').value;
        const panel = document.getElementById('selection-panel');
        const hs = this.gameState.highscores[dVal];
        
        let hsText = '';
        if (hs && hs.level > 0) {
            hsText = `<div id='highscore-info' style='margin-top:10px; color:#4a90e2;'>
                Highscore: Level ${hs.level} (${hs.name || 'Anonym'})
            </div>`;
        } else {
            hsText = `<div id='highscore-info' style='margin-top:10px; color:#4a90e2;'>
                Noch kein Highscore
            </div>`;
        }
        
        const old = document.getElementById('highscore-info');
        if (old) old.remove();
        panel.insertAdjacentHTML('beforeend', hsText);
    }
}
