/**
 * API Client
 * Handles all communication with the backend
 */
class ApiClient {
    constructor() {
        // Use in-browser engine to simulate server for GitHub Pages
        this.engine = new StaticEngine();
        this.storageKey = 'whack_data_v1';
        this.highscoreKey = 'whack_highscores_v1';
    }

    async newRound(gridSize, numErrors = 0) {
        const state = this.engine.newRound(gridSize, numErrors);
        return Promise.resolve(state);
    }

    async flipQubit(qubitIndex) {
        const state = this.engine.flipQubit(qubitIndex);
        return Promise.resolve(state);
    }

    async storeGameData(gameData) {
        // Append to localStorage array and update highscore
        const arr = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        const entry = { ...gameData, timestamp: Date.now(), id: crypto.randomUUID?.() || String(Date.now()) };
        arr.push(entry);
        localStorage.setItem(this.storageKey, JSON.stringify(arr));

        // Update highscores per grid_size
        const hs = JSON.parse(localStorage.getItem(this.highscoreKey) || '{}');
        const g = String(gameData.grid_size);
        const prev = hs[g] || { level: 0 };
        if (gameData.level_reached > (prev.level || 0)) {
            const anon = (window.i18n ? i18n.t('anonymousName') : 'Anonym');
            hs[g] = { level: gameData.level_reached, name: gameData.name || anon };
            localStorage.setItem(this.highscoreKey, JSON.stringify(hs));
        }
        return Promise.resolve({ filename: `local-${entry.id}.json` });
    }

    async getHighscores() {
        const hs = JSON.parse(localStorage.getItem(this.highscoreKey) || '{}');
        return Promise.resolve(hs);
    }

    // Utility: export and clear local dataset (static mode)
    async getAllData() {
        const arr = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        return Promise.resolve(arr);
    }

    async clearData() {
        localStorage.removeItem(this.storageKey);
        return Promise.resolve(true);
    }

    async getExportBundle() {
        const data = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        const highscores = JSON.parse(localStorage.getItem(this.highscoreKey) || '{}');
        return Promise.resolve({
            version: 'v1',
            exported_at: new Date().toISOString(),
            data,
            highscores,
        });
    }

    async clearHighscores() {
        localStorage.removeItem(this.highscoreKey);
        return Promise.resolve(true);
    }

    async getStatistics(ageMin = null, ageMax = null) {
        // Build statistics from localStorage
        const arr = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        const filtered = arr.filter(e => {
            const a = parseInt(e.age || '-1', 10);
            if (Number.isNaN(a)) return true;
            if (ageMin !== null && a < ageMin) return false;
            if (ageMax !== null && a > ageMax) return false;
            return true;
        });
        return Promise.resolve(this._buildStats(filtered));
    }

    async getStatisticsByAge() {
        const arr = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        const ranges = [
            [0, 7], [8, 15], [16, 25], [26, 35], [36, 45], [46, 99]
        ];
        const out = {};
        for (const [lo, hi] of ranges) {
            const bucket = arr.filter(e => {
                const a = parseInt(e.age || '-1', 10);
                return !Number.isNaN(a) && a >= lo && a <= hi;
            });
            out[`${lo}-${hi}`] = this._buildStatsAll(bucket);
        }
        // Unknown age bucket
        const unknown = arr.filter(e => Number.isNaN(parseInt(e.age || '-1', 10)));
        out['unknown'] = this._buildStatsAll(unknown);
        return Promise.resolve(out);
    }

    _pickAnyGrid(stats) {
        const keys = Object.keys(stats || {});
        return keys.length ? keys[0] : '3';
    }

    _buildStats(data) {
        // Group by grid size and compute physical vs logical error rate using recomputed axes
        const grouped = {};
        for (const e of data) {
            const key = String(e.grid_size);
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(e);
        }
        const res = {};
        for (const key of Object.keys(grouped)) {
            const entries = grouped[key];
            // Recompute consistent x-axis: n = d^2 + (d-1)^2, max = floor(n/2)
            const d = parseInt(key, 10) || 3;
            const n = d * d + (d - 1) * (d - 1);
            const maxIdx = Math.floor(n / 2);
            const errorProbs = Array.from({ length: maxIdx }, (_, i) => (i + 1) / n);
            const roundsPerLevel = (entries[0]?.rounds_per_level) || 5;

            // Prepare aggregation arrays
            const totalSuccess = Array(errorProbs.length).fill(0);
            const totalRounds = Array(errorProbs.length).fill(0);

            for (const e of entries) {
                const succ = Array.isArray(e.successful_rounds_per_level) ? e.successful_rounds_per_level : [];
                const lvlReached = parseInt(e.level_reached || 0, 10) || 0;
                const rounds = parseInt(e.rounds_per_level || roundsPerLevel, 10) || roundsPerLevel;
                for (let i = 0; i < Math.min(succ.length, errorProbs.length); i++) {
                    totalSuccess[i] += (succ[i] || 0);
                    if (i < lvlReached) totalRounds[i] += rounds;
                }
            }

            const logicalRates = errorProbs.map((_, i) => {
                const denom = totalRounds[i] || 0;
                const succ = totalSuccess[i] || 0;
                const successRate = denom > 0 ? (succ / denom) : 0;
                return 1 - successRate;
            });

            res[key] = {
                physical_error_rates: errorProbs,
                logical_error_rates: logicalRates,
            };
        }
        return res;
    }

        _buildStatsAll(data) {
                // Combine across all grid sizes into a single dataset with a conservative common axis
            if (!data.length) return { physical_error_rates: [], logical_error_rates: [] };
            // Determine the smallest n among entries to align axes
            let minN = Infinity;
            let roundsPerLevel = 5;
            for (const e of data) {
                const d = parseInt(e.grid_size || '3', 10) || 3;
                const n = d * d + (d - 1) * (d - 1);
                if (n < minN) minN = n;
                if (e.rounds_per_level) roundsPerLevel = e.rounds_per_level;
            }
            if (!Number.isFinite(minN) || minN <= 0) return { physical_error_rates: [], logical_error_rates: [] };
            const maxIdx = Math.floor(minN / 2);
            const errorProbs = Array.from({ length: maxIdx }, (_, i) => (i + 1) / minN);
            const totalSuccess = Array(errorProbs.length).fill(0);
            const totalRounds = Array(errorProbs.length).fill(0);
            for (const e of data) {
                const succ = Array.isArray(e.successful_rounds_per_level) ? e.successful_rounds_per_level : [];
                const lvlReached = parseInt(e.level_reached || 0, 10) || 0;
                const rounds = parseInt(e.rounds_per_level || roundsPerLevel, 10) || roundsPerLevel;
                for (let i = 0; i < Math.min(succ.length, errorProbs.length); i++) {
                    totalSuccess[i] += (succ[i] || 0);
                    if (i < lvlReached) totalRounds[i] += rounds;
                }
            }
            const logicalRates = errorProbs.map((_, i) => {
                const denom = totalRounds[i] || 0;
                const succ = totalSuccess[i] || 0;
                const successRate = denom > 0 ? (succ / denom) : 0;
                return 1 - successRate;
            });
            return { physical_error_rates: errorProbs, logical_error_rates: logicalRates };
    }
}
