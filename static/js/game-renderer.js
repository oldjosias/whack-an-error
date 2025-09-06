/**
 * Game Renderer
 * Handles all game visualization and UI rendering
 */
class GameRenderer {
    constructor() {
        this.cellSize = 48;
        this.gap = 16;
    }

    renderGame(state, gameState) {
        if (gameState.playgroundMode) {
            this.renderPlayground(state, gameState);
        } else {
            this.renderRegularGame(state, gameState);
        }
        this.updateBeavers(gameState.gridSize);
    }

    renderPlayground(state, gameState) {
        const area = document.getElementById('surface-code-area');
        area.innerHTML = '';
        
        const { minRow, minCol, maxRow, maxCol } = this.getBounds(state);
        this.setSurfaceCodeAreaSize(minRow, minCol, maxRow, maxCol);

        // Render qubits
        for (const q of state.qubits) {
            const el = this.createQubitElement(q, gameState.playgroundShowErrors);
            // In playground mode, always allow clicking unless specifically disabled
            if (gameState.playgroundMode || gameState.gameActive) {
                el.onclick = () => window.gameController.flipQubitPlayground(q.index);
                el.style.cursor = 'pointer';
            } else {
                el.onclick = null; // Disable clicking when game is over
                el.style.cursor = 'not-allowed';
            }
            this.positionElement(el, q, minRow, minCol);
            area.appendChild(el);
        }

        // Render stabilizers
        this.renderStabilizers(state, area, minRow, minCol, maxRow, maxCol);

        // Update status
        this.updatePlaygroundStatus(state);
        this.setLegend(state.zero_syndrome || state.logical_error);
    // Show beavers on the right only if a logical error has occurred with zero syndrome
    this.updateRightBeavers(gameState.gridSize, !!(state.zero_syndrome && state.logical_error));
    }

    renderRegularGame(state, gameState) {
        const area = document.getElementById('surface-code-area');
        area.innerHTML = '';
        
        const { minRow, minCol, maxRow, maxCol } = this.getBounds(state);
        this.setSurfaceCodeAreaSize(minRow, minCol, maxRow, maxCol);

        // Render qubits
        for (const q of state.qubits) {
            const el = this.createQubitElementRegular(q, state.zero_syndrome);
            if (gameState.gameActive) {
                el.onclick = () => window.gameController.flipQubit(q.index);
                el.style.cursor = 'pointer';
            } else {
                el.onclick = null; // Disable clicking when game is over
                el.style.cursor = 'not-allowed';
            }
            this.positionElement(el, q, minRow, minCol);
            area.appendChild(el);
        }

        // Render stabilizers
        this.renderStabilizers(state, area, minRow, minCol, maxRow, maxCol);

        // Handle game logic
        this.handleGameLogic(state, gameState);
    }

    createQubitElement(qubit, showErrors) {
        const el = document.createElement('div');
        let bg = "static/qubit_base.svg";
        if (showErrors && qubit.actual_error) bg = "static/qubit_error.svg";
        el.setAttribute('style', `background:url('${bg}') center center/contain no-repeat;width:48px;height:48px;position:absolute;display:flex;align-items:center;justify-content:center;`);
        return el;
    }

    createQubitElementRegular(qubit, showErrors) {
        const el = document.createElement('div');
        const isFlipped = qubit.flipped;
        let bg = 'static/qubit_base.svg';
        if (!showErrors) {
            if (isFlipped) bg = 'static/qubit_flipped.svg';
        } else {
            if (qubit.actual_error) bg = 'static/qubit_error.svg';
            else bg = 'static/qubit_base.svg';
        }
        el.setAttribute('style', `background:url('${bg}') center center/contain no-repeat;width:48px;height:48px;position:absolute;display:flex;align-items:center;justify-content:center;`);
        return el;
    }

    renderStabilizers(state, area, minRow, minCol, maxRow, maxCol) {
        for (const s of state.stabilizers) {
            const el = document.createElement('div');
            el.className = 'stabilizer' + (s.excited ? ' excited' : '');
            el.textContent = s.excited ? '' : '';
            this.positionElement(el, s, minRow, minCol);
            area.appendChild(el);

            // Add sensor image
            const sensor = document.createElement('img');
            sensor.src = this.getSensorSrc(s, maxRow);
            sensor.style.position = 'absolute';
            sensor.style.width = '70px';
            sensor.style.left = ((s.col - minCol) * (this.cellSize + this.gap) - 7) + 'px';
            sensor.style.top = ((s.row - minRow) * (this.cellSize + this.gap) - 7) + 'px';
            sensor.style.zIndex = '100';
            area.appendChild(sensor);
        }
    }

    getSensorSrc(stabilizer, maxRow) {
        const base = stabilizer.excited ? 'sensor_on' : 'sensor_off';
        if (stabilizer.row === 0) return `static/${base}_boundary_top.svg`;
        if (stabilizer.row === maxRow) return `static/${base}_boundary_bottom.svg`;
        return `static/${base}.svg`;
    }

    getBounds(state) {
        let minRow = Infinity, minCol = Infinity, maxRow = -Infinity, maxCol = -Infinity;
        for (const q of state.qubits.concat(state.stabilizers)) {
            if (q.row < minRow) minRow = q.row;
            if (q.col < minCol) minCol = q.col;
            if (q.row > maxRow) maxRow = q.row;
            if (q.col > maxCol) maxCol = q.col;
        }
        return { minRow, minCol, maxRow, maxCol };
    }

    setSurfaceCodeAreaSize(minRow, minCol, maxRow, maxCol) {
        const area = document.getElementById('surface-code-area');
        const width = ((maxCol - minCol + 1) * (this.cellSize + this.gap));
        const height = ((maxRow - minRow + 1) * (this.cellSize + this.gap));
        area.style.width = width + 'px';
        area.style.height = height + 'px';
        this.setDirtHeight();
    }

    positionElement(element, item, minRow, minCol) {
        element.style.left = ((item.col - minCol) * (this.cellSize + this.gap)) + 'px';
        element.style.top = ((item.row - minRow) * (this.cellSize + this.gap)) + 'px';
    }

    updatePlaygroundStatus(state) {
    let statusText = '';
        if (state.zero_syndrome) {
            if (state.logical_error) {
        statusText = i18n.t('statuses.allSensorsOff_logical');
            } else {
        statusText = i18n.t('statuses.allSensorsOff_noLogical');
            }
        } else {
        statusText = i18n.t('statuses.setAllSensorsOff');
        }
        document.getElementById('status').textContent = statusText;
        
        // Update status panel visibility
        this.updateStatusPanelVisibility();
    }

    handleGameLogic(state, gameState) {
        const statusPanel = document.getElementById('status-panel');
        
        // Remove any existing next round button
        const oldBtn = document.getElementById('next-round-btn');
        if (oldBtn) oldBtn.remove();
        
        // Check if any error is sampled
        let hasError = false;
        if (gameState.roundJustStarted) {
            for (const q of state.qubits) {
                if (q.actual_error) { 
                    hasError = true; 
                    break; 
                }
            }
        }
        
        if (gameState.roundJustStarted && !hasError && gameState.gameActive && state.zero_syndrome) {
            // No error sampled at start of round, auto-advance
            gameState.roundJustStarted = false;
            setTimeout(() => window.gameController.nextRound(), 600);
            return;
        }
        
        gameState.roundJustStarted = false;
        
    let statusText = '';
        if (state.zero_syndrome) {
            if (state.logical_error) {
        statusText = i18n.t('statuses.allSensorsOff_logical');
                if (gameState.gameActive && !gameState.playgroundMode) {
                    gameState.logicalErrors++;
                    this.setLegend(true);
                    // Show beavers on the right water to indicate path opened
                    this.updateRightBeavers(gameState.gridSize, true);
                    window.gameController.endGame();
                    return;
                }
            } else {
                if (gameState.gameActive) {
            statusText = i18n.t('statuses.allSensorsOff_noLogical');
                    gameState.successfulRoundsPerLevel[gameState.currentLevel - 1]++;
                    
                    // Show next round button
                    const nextBtn = document.createElement('button');
                    nextBtn.id = 'next-round-btn';
                    nextBtn.className = 'btn';
            nextBtn.textContent = i18n.t('buttons.nextRound');
                    nextBtn.onclick = () => window.gameController.nextRound();
                    statusPanel.appendChild(nextBtn);
                }
            }
        } else {
        statusText = i18n.t('statuses.setAllSensorsOff');
        }
        
        document.getElementById('status').textContent = statusText;
        if (!gameState.gameActive) document.getElementById('game-status').textContent = '';
        
        // Update status panel visibility
        this.updateStatusPanelVisibility();
        
        // Legend logic
        if ((state.zero_syndrome && gameState.gameActive) || state.logical_error) {
            this.setLegend(true);
        } else {
            this.setLegend(false);
        }

    // Ensure right-side beavers reflect current logical error state
    this.updateRightBeavers(gameState.gridSize, !!(state.zero_syndrome && state.logical_error));
    }

    setLegend(full) {
        const legend = document.getElementById('legend');
        if (!legend) return;
        
        if (full) {
        legend.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
                    <div style="display:flex; gap:32px; align-items:center; justify-content:center; margin-bottom:8px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div style="width:32px; height:32px; background:url('static/qubit_error.svg') center center/contain no-repeat;"></div>
                <span style="font-size:1em;">${i18n.t('legend.restError')}</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div style="width:32px; height:32px; background:url('static/qubit_base.svg') center center/contain no-repeat;"></div>
                <span style="font-size:1em;">${i18n.t('legend.noError')}</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:32px; align-items:center; justify-content:center;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div style="width:32px; height:32px; background:url('static/qubit_orig.svg') center center/contain no-repeat;"></div>
                <span style="font-size:1em;">${i18n.t('legend.origError')}</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div style="width:32px; height:32px; background:url('static/qubit_flipped.svg') center center/contain no-repeat;"></div>
                <span style="font-size:1em;">${i18n.t('legend.playerCorrection')}</span>
                        </div>
                        <!-- Combined corrected original error can be represented contextually by qubit state; omit extra icon for 8-bit set -->
                    </div>
                </div>`;
        } else {
        legend.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:32px; height:32px; background:url('static/qubit_flipped.svg') center center/contain no-repeat;"></div>
            <span style="font-size:1em;">${i18n.t('legend.correction')}</span>
                </div>`;
        }
    }

    updateBeavers(gridSize) {
        const dirtLeft = document.getElementById('dirt-left');
        if (!dirtLeft) return;
        
        dirtLeft.querySelectorAll('.beaver-img').forEach(e => e.remove());
        
        // Place beavers at every second row (boundary rows)
        for (let i = 0; i < 2 * gridSize; i += 2) {
            let topPx = i * (this.cellSize + this.gap);
            let img = document.createElement('img');
            img.src = 'static/beaver.svg';
            img.className = 'beaver-img';
            img.style.position = 'absolute';
            img.style.left = '1px';
            img.style.top = (topPx + this.cellSize / 2 - 10) + 'px';
            img.style.width = '48px';
            img.style.zIndex = '20';
            img.style.transform = 'scaleX(-1)';
            dirtLeft.appendChild(img);
        }
    }

    updateRightBeavers(gridSize, visible) {
        const dirtRight = document.getElementById('dirt-right');
        if (!dirtRight) return;
        // Clear existing right-side beavers
        dirtRight.querySelectorAll('.beaver-img-right').forEach(e => e.remove());
        if (!visible) return;
        // Place beavers at every second row (boundary rows)
        for (let i = 0; i < 2 * gridSize; i += 2) {
            let topPx = i * (this.cellSize + this.gap);
            let img = document.createElement('img');
            img.src = 'static/beaver.svg';
            img.className = 'beaver-img-right';
            img.style.position = 'absolute';
            img.style.right = '1px';
            img.style.top = (topPx + this.cellSize / 2 - 10) + 'px';
            img.style.width = '48px';
            img.style.zIndex = '20';
            // Default orientation assumed facing left; no flip to face into the field from the right
            dirtRight.appendChild(img);
        }
    }

    setDirtHeight() {
        // Water panels now use flexbox align-self: stretch
        // Force a reflow to ensure flexbox recalculates correctly
        const container = document.querySelector('.game-area-container');
        if (container) {
            // Trigger reflow by reading offsetHeight
            container.offsetHeight;
        }
    }

    updateStatusPanelVisibility() {
        const statusPanel = document.getElementById('status-panel');
        const gameStatus = document.getElementById('game-status');
        const status = document.getElementById('status');
        
        // Check if both status elements are empty
        const gameStatusEmpty = !gameStatus.textContent.trim();
        const statusEmpty = !status.textContent.trim();
        
        if (gameStatusEmpty && statusEmpty) {
            statusPanel.classList.add('empty');
        } else {
            statusPanel.classList.remove('empty');
        }
    }
}
