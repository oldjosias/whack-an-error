/**
 * Game State Manager
 * Manages the core game state and logic
 */
class GameState {
    constructor() {
        this.gridSize = 3;
        this.gameActive = false;
        this.playgroundMode = false;
        this.currentLevel = 1;
        this.maxLevel = 0;
        this.currentRound = 0;
        this.logicalErrors = 0;
        this.roundsPerLevel = 5;
        this.successfulRoundsPerLevel = [];
        this.flippedQubits = new Set();
        this.roundJustStarted = false;
        this.playgroundShowErrors = false;
        this.playgroundLastState = null;
        this.highscores = {};
    }

    reset() {
        this.gameActive = false;
        this.playgroundMode = false;
        this.currentLevel = 1;
        this.currentRound = 0;
        this.logicalErrors = 0;
        this.flippedQubits.clear();
        this.playgroundLastState = null;
    }

    startGame(mode, gridSize) {
        this.gridSize = gridSize;
        this.maxLevel = gridSize * gridSize + (gridSize - 1) * (gridSize - 1);
        this.playgroundMode = mode === 'playground';
        this.flippedQubits.clear();

        if (this.playgroundMode) {
            this.gameActive = false;
            this.playgroundShowErrors = false;
        } else {
            this.gameActive = true;
            this.currentLevel = 1;
            this.currentRound = 1;
            this.logicalErrors = 0;
            this.successfulRoundsPerLevel = Array(this.maxLevel).fill(0);
        }
    }

    calculateErrorProbabilities() {
        const errorProbabilities = [];
        for (let lvl = 1; lvl <= this.maxLevel; lvl++) {
            errorProbabilities.push(lvl / this.maxLevel);
        }
        return errorProbabilities;
    }
}
