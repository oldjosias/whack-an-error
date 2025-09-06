/**
 * Statistics Manager
 * Handles statistics display and Chart.js integration
 */
class StatisticsManager {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    showStatistics() {
        this.fetchStatisticsAndShow();
        document.getElementById('stats-modal').style.display = 'block';
        this.setupModalEventHandlers();
    }

    setupEventHandlers() {
        // Main event handlers - may be called before DOM is ready
        // Modal-specific handlers are set up when modal is shown
    }

    setupModalEventHandlers() {
        // Set up event handlers for modal buttons when modal is displayed
        const ageSplitBtn = document.getElementById('stats-age-split-btn');
        const allBtn = document.getElementById('stats-all-btn');
    const dlBtn = document.getElementById('stats-download-btn');
    const delBtn = document.getElementById('stats-delete-btn');
        const closeBtn = document.querySelector('#stats-modal .close');
        
        if (ageSplitBtn) {
            ageSplitBtn.onclick = async () => {
                try {
                    const data = await this.apiClient.getStatisticsByAge();
                    this.showStatsPlot(data, true);
                } catch (error) {
                    console.error('Failed to fetch age statistics:', error);
                }
            };
        }

        if (allBtn) {
            allBtn.onclick = () => {
                this.fetchStatisticsAndShow();
            };
        }

        if (dlBtn) {
            dlBtn.onclick = async () => {
                try {
                    const data = await this.apiClient.getAllData();
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    const ts = new Date().toISOString().replace(/[:.]/g, '-');
                    a.download = `whack-data-${ts}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } catch (err) {
                    console.error('Failed to download data:', err);
                }
            };
        }

        if (delBtn) {
            delBtn.onclick = async () => {
                try {
                    const confirmed = window.confirm(i18n?.t('stats.confirmDelete') || 'Delete all local data?');
                    if (!confirmed) return;
                    await this.apiClient.clearData();
                    // Refresh the plot to reflect empty dataset
                    this.fetchStatisticsAndShow();
                } catch (err) {
                    console.error('Failed to delete data:', err);
                }
            };
        }

        if (closeBtn) {
            closeBtn.onclick = () => {
                document.getElementById('stats-modal').style.display = 'none';
            };
        }

        // Also close modal when clicking outside of it
        const modal = document.getElementById('stats-modal');
        if (modal) {
            modal.onclick = (event) => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            };
        }
    }

    async fetchStatisticsAndShow() {
        try {
            const data = await this.apiClient.getStatistics();
            this.showStatsPlot(data, false);
        } catch (error) {
            console.error('Failed to fetch statistics:', error);
        }
    }

    showStatsPlot(data, isAgeSplit) {
        const ctx = document.getElementById('stats-canvas').getContext('2d');
        if (window.statsChart) window.statsChart.destroy();

        const colors = ['#e94e77', '#4a90e2', '#f5a623', '#7ed321', '#b8e986', '#d0021b', '#417505'];
        const datasets = [];
        let i = 0;

    for (const label in data) {
            const xvals = data[label].physical_error_rates;
            const yvals = data[label].logical_error_rates;
            const points = xvals.map((x, idx) => ({ x: x, y: yvals[idx] }));

            datasets.push({
        label: isAgeSplit ? (i18n.t('stats.ageLabel') + ' ' + label) : (i18n.t('stats.sizeLabel') + ' ' + label),
                data: points,
                borderColor: colors[i % colors.length],
                backgroundColor: colors[i % colors.length] + '33',
                fill: false,
                showLine: true,
                pointRadius: 2,
            });
            i++;
        }

        window.statsChart = new Chart(ctx, {
            type: 'scatter',
            data: { datasets: datasets },
            options: {
                scales: {
                    x: { 
                        title: { display: true, text: i18n.t('stats.physical') }, 
                        type: 'linear' 
                    },
                    y: { 
                        title: { display: true, text: i18n.t('stats.logical') }, 
                        min: 0, 
                        max: 1 
                    }
                }
            }
        });
    }
}

/**
 * Tutorial Manager
 * Handles tutorial display and navigation
 */
class TutorialManager {
    constructor() {
        this.slides = (window.i18n ? i18n.t('tutorial.slides') : [
            `<b>Willkommen bei Fehler-Whack!</b><br><br>Dies ist ein Spiel zur Quantenfehlerkorrektur. Dein Ziel ist es, Fehler in einem Gitter von Qubits zu finden und zu korrigieren.<br><img src='static/tutorial_1.png' style='width:80%;margin-top:12px;'>`,
            `In jeder Runde haben einige Qubits Fehler. Benutze deine Schaufel, um Qubits zu flippen und versuche, alle Sensoren auszuschalten.<br><img src='static/tutorial_2.png' style='width:80%;margin-top:12px;'>`,
            `Sensoren zeigen an, ob sich Fehler in der Nähe befinden. Wenn alle Sensoren aus sind, hast du alle detektierbaren Fehler entfernt.<br><img src='static/tutorial_3.png' style='width:80%;margin-top:12px;'>`,
            `Aber Vorsicht! Wenn du alle Syndrome entfernst, aber ein logischer Fehler bleibt, verlierst du die Runde.<br><b>Logischer Fehler:</b> Ein Fehler, der von den Sensoren nicht erkannt wird und die kodierte Information verändert.<br><img src='static/tutorial_4.png' style='width:80%;margin-top:12px;'>`,
            `Im Spielplatz-Modus kannst du Fehler manuell setzen und die Auswirkungen direkt beobachten.<br><img src='static/tutorial_5.png' style='width:80%;margin-top:12px;'>`,
            `Versuche, alle Fehler zu beseitigen, ohne einen logischen Fehler zu verursachen. Steige durch die Level für mehr Herausforderung!<br>Viel Erfolg!<br><img src='static/tutorial_6.png' style='width:80%;margin-top:12px;'>`
        ]);
        this.currentIndex = 0;
    }

    showTutorial() {
    // Refresh slides to current language
    if (window.i18n) this.slides = i18n.t('tutorial.slides');
    this.currentIndex = 0;
        this.updateTutorialSlide();
        document.getElementById('tutorial-modal').style.display = 'block';
    }

    closeTutorial() {
        document.getElementById('tutorial-modal').style.display = 'none';
    }

    updateTutorialSlide() {
        document.getElementById('tutorial-slide').innerHTML = this.slides[this.currentIndex];
        document.getElementById('tutorial-prev').disabled = this.currentIndex === 0;
        document.getElementById('tutorial-next').disabled = this.currentIndex === this.slides.length - 1;
    }

    setupEventHandlers() {
    document.getElementById('tutorial-prev').onclick = () => {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.updateTutorialSlide();
            }
        };

    document.getElementById('tutorial-next').onclick = () => {
            if (this.currentIndex < this.slides.length - 1) {
                this.currentIndex++;
                this.updateTutorialSlide();
            }
        };
    }
}
