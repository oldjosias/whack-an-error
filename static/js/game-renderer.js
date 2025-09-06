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
        let style = '';
        
        if (showErrors && qubit.actual_error) {
            style = "background: url('static/water.jpeg') center center/cover no-repeat; border:4px solid #d00;";
        } else {
            style = 'background:rgba(160,82,45,0.2);border:4px solid #6b3e1e;';
        }
        
        el.setAttribute('style', style + 'width:48px;height:48px;border-radius:50%;position:absolute;display:flex;align-items:center;justify-content:center;');
        return el;
    }

    createQubitElementRegular(qubit, showErrors) {
        const el = document.createElement('div');
        let style = '';
        const isFlipped = qubit.flipped;
        
        if (!showErrors) {
            // During play: flipped by player uses dirt.png and orange border
            if (isFlipped) {
                style = "background: url('static/dirt.png') center center/cover no-repeat; border:4px solid orange;";
            } else {
                style = 'background:rgba(160,82,45,0.2);border:4px solid #6b3e1e;';
            }
        } else {
            // When zero syndrome
            if (qubit.actual_error) {
                // Residual error: water background, red border
                style = "background: url('static/water.jpeg') center center/cover no-repeat; border:4px solid #d00;";
            } else {
                // No error: opaque brown background
                style = 'background:rgba(160,82,45,0.2);border:4px solid #6b3e1e;';
            }
            
            // Overlay border for original error and/or flipped by player
            if (qubit.initial_error && isFlipped) {
                style = style.replace(/border:[^;]+;/, 'border:2px solid red; outline:2px solid orange;');
            } else if (!qubit.initial_error && isFlipped) {
                style = style.replace(/border:[^;]+;/, 'border:4px solid orange;');
            } else if (qubit.initial_error && !isFlipped) {
                style = style.replace(/border:[^;]+;/, 'border:4px solid red;');
            }
        }
        
        el.setAttribute('style', style + 'width:48px;height:48px;border-radius:50%;position:absolute;display:flex;align-items:center;justify-content:center;');
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
                statusText = 'Alle Sensoren aus! Logischer Fehler! (Spielplatz-Modus: Du kannst weitermachen)';
            } else {
                statusText = 'Alle Sensoren aus! Kein logischer Fehler.';
            }
        } else {
            statusText = 'Stelle alle Sensoren auf aus.';
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
                statusText = 'Alle Sensoren aus! Logischer Fehler!';
                if (gameState.gameActive && !gameState.playgroundMode) {
                    gameState.logicalErrors++;
                    this.setLegend(true);
                    window.gameController.endGame();
                    return;
                }
            } else {
                if (gameState.gameActive) {
                    statusText = 'Alle Sensoren aus! Kein logischer Fehler.';
                    gameState.successfulRoundsPerLevel[gameState.currentLevel - 1]++;
                    
                    // Show next round button
                    const nextBtn = document.createElement('button');
                    nextBtn.id = 'next-round-btn';
                    nextBtn.className = 'btn';
                    nextBtn.textContent = 'Nächste Runde';
                    nextBtn.onclick = () => window.gameController.nextRound();
                    statusPanel.appendChild(nextBtn);
                }
            }
        } else {
            statusText = 'Stelle alle Sensoren auf aus.';
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
    }

    setLegend(full) {
        const legend = document.getElementById('legend');
        if (!legend) return;
        
        if (full) {
            legend.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
                    <div style="display:flex; gap:32px; align-items:center; justify-content:center; margin-bottom:8px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div style="width:32px; height:32px; border-radius:50%; border:0px solid #d00; background:url('static/water.jpeg') center center/cover no-repeat;"></div>
                            <span style="font-size:1em;">Restfehler</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div style="width:32px; height:32px; border-radius:50%; border:0px solid #6b3e1e; background:rgba(160,82,45,0.2);"></div>
                            <span style="font-size:1em;">Kein Fehler</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:32px; align-items:center; justify-content:center;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div style="width:32px; height:32px; border-radius:50%; border:4px solid #d00; background:rgba(160,82,45,0);"></div>
                            <span style="font-size:1em;">Ursprünglicher Fehler</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div style="width:32px; height:32px; border-radius:50%; border:4px solid orange;"></div>
                            <span style="font-size:1em;">Korrektur durch Spieler</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div style="width:32px; height:32px; border-radius:50%; border:2px solid orange; outline:2px solid red;"></div>
                            <span style="font-size:1em;">Ursprünglicher Fehler korrigiert</span>
                        </div>
                    </div>
                </div>`;
        } else {
            legend.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:32px; height:32px; border-radius:50%; border:4px solid orange; background:url('static/dirt.png') center center/cover no-repeat;"></div>
                    <span style="font-size:1em;">Korrektur</span>
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
