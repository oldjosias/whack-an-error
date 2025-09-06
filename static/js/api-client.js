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
            hs[g] = { level: gameData.level_reached, name: gameData.name || 'Anonym' };
            localStorage.setItem(this.highscoreKey, JSON.stringify(hs));
        }
        return Promise.resolve({ filename: `local-${entry.id}.json` });
    }

    async getHighscores() {
        const hs = JSON.parse(localStorage.getItem(this.highscoreKey) || '{}');
        return Promise.resolve(hs);
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
            out[`${lo}-${hi}`] = this._buildStats(bucket)[String(this._inferMaxLevel(bucket))] || { physical_error_rates: [], logical_error_rates: [] };
        }
        return Promise.resolve(out);
    }

    _inferMaxLevel(data) {
        let maxLevel = 0;
        for (const e of data) maxLevel = Math.max(maxLevel, e.rounds_per_level ? e.rounds_per_level : (e.level_reached || 0));
        return maxLevel || 1;
    }

    _buildStats(data) {
        // Group by grid size, estimate physical vs logical error rate from saved rounds
        const grouped = {};
        for (const e of data) {
            const key = String(e.grid_size);
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(e);
        }
        const res = {};
        for (const key of Object.keys(grouped)) {
            // naive aggregation: physical error rate ~ level/maxLevel, logical error rate ~ logical_errors/rounds
            const entries = grouped[key];
            const maxLevel = entries[0]?.rounds_per_level ? entries[0].rounds_per_level : (parseInt(key,10) ** 2 + (parseInt(key,10)-1) ** 2);
            const physical = [];
            const logical = [];
            for (const e of entries) {
                const phys = (e.level_reached || 1) / maxLevel;
                const logi = (e.logical_errors || 0) / ((e.rounds_per_level || 5) * (e.level_reached || 1));
                physical.push(phys);
                logical.push(Math.min(1, Math.max(0, logi)));
            }
            res[key] = {
                physical_error_rates: physical,
                logical_error_rates: logical,
            };
        }
        return res;
    }
}
