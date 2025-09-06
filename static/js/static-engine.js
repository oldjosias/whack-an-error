// StaticEngine: client-side simulation of the surface code game state
class StaticEngine {
    constructor() {
        this.d = 3;
        this.dataQubits = [];
        this.stabilizers = [];
        this.flips = [];
        this.initialError = [];
        this.coordToIndex = new Map();
        this.stabNeighbors = []; // array of arrays of data-qubit indices
    }

    initGrid(d) {
        this.d = d;
        this.dataQubits = [];
        this.stabilizers = [];
        this.coordToIndex.clear();
        this.stabNeighbors = [];
        let idx = 0;
        // data qubits
        for (let row = 0; row < 2 * d - 1; row++) {
            for (let col = row % 2; col < 2 * d - 1; col += 2) {
                this.dataQubits.push({ index: idx, row, col });
                this.coordToIndex.set(`${row},${col}`, idx);
                idx++;
            }
        }
        // X ancilla stabilizers: at even rows, odd columns
        let sidx = 0;
        for (let row = 0; row < 2 * d - 1; row += 2) {
            for (let col = 1; col < 2 * d - 1; col += 2) {
                this.stabilizers.push({ index: sidx, row, col, excited: 0 });
                sidx++;
            }
        }
        // neighbors for each stabilizer (N,E,S,W data qubits if present)
        this.stabNeighbors = this.stabilizers.map(s => {
            const neigh = [];
            const coords = [
                [s.row - 1, s.col],
                [s.row + 1, s.col],
                [s.row, s.col - 1],
                [s.row, s.col + 1],
            ];
            for (const [r, c] of coords) {
                const key = `${r},${c}`;
                if (this.coordToIndex.has(key)) neigh.push(this.coordToIndex.get(key));
            }
            return neigh;
        });
        this.flips = new Array(this.dataQubits.length).fill(0);
        this.initialError = new Array(this.dataQubits.length).fill(0);
    }

    newRound(d, numErrors = 0) {
        if (this.d !== d || this.dataQubits.length === 0) this.initGrid(d);
        this.flips.fill(0);
        this.initialError.fill(0);
        // place numErrors unique random errors
        const n = this.dataQubits.length;
        const indices = [...Array(n).keys()];
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        for (let k = 0; k < Math.min(numErrors, n); k++) {
            this.initialError[indices[k]] = 1;
        }
        return this.getState();
    }

    flipQubit(index) {
        if (index >= 0 && index < this.flips.length) {
            this.flips[index] = this.flips[index] ^ 1;
        }
        return this.getState();
    }

    getState() {
        // compute actual error per data qubit
        const actual = this.initialError.map((e, i) => (e ^ this.flips[i]) & 1);
        // compute stabilizer excitations (parity of neighboring data qubits)
        const stab = this.stabilizers.map((s, si) => {
            let parity = 0;
            for (const qi of this.stabNeighbors[si]) parity ^= actual[qi];
            return { index: s.index, row: s.row, col: s.col, excited: parity ? 1 : 0 };
        });
        const zeroSyndrome = stab.every(s => s.excited === 0) ? 1 : 0;
        // logical X: parity over data qubits with col == 0 and even rows (as in Python L_X)
        let logicalParity = 0;
        for (let row = 0; row < 2 * this.d - 1; row += 2) {
            const key = `${row},0`;
            if (this.coordToIndex.has(key)) {
                const qi = this.coordToIndex.get(key);
                logicalParity ^= actual[qi];
            }
        }
        const logicalError = logicalParity ? 1 : 0;

        // build qubit objects for UI
        const qubits = this.dataQubits.map(q => ({
            index: q.index,
            row: q.row,
            col: q.col,
            actual_error: actual[q.index],
            initial_error: this.initialError[q.index],
            flipped: this.flips[q.index],
        }));

        return {
            qubits,
            stabilizers: stab,
            zero_syndrome: zeroSyndrome,
            logical_error: logicalError,
        };
    }
}
