// Simple i18n helper for EN/DE with DOM application and dynamic formatting
(() => {
  const dict = {
    de: {
      'app.title': 'Whack-an-Error',
      'labels.grid_size': 'Spielfeldgröße:',
      'labels.mode': 'Modus:',
      'modes.game': 'Spiel',
      'modes.playground': 'Spielplatz',
      'buttons.start': 'Starten',
      'buttons.stats': 'Statistiken anzeigen',
      'buttons.tutorial': 'Tutorial anzeigen',
      'buttons.reset': 'Zurücksetzen',
      'buttons.close': 'Schließen',
  'buttons.nextRound': 'Nächste Runde',
      'buttons.showByAge': 'Nach Altersbereich zeigen',
      'buttons.showAll': 'Alle zeigen',
      'buttons.toggleErrors.show': 'Tunnel anzeigen',
      'buttons.toggleErrors.hide': 'Tunnel verbergen',
      'statuses.playgroundIntro': 'Spielplatz-Modus: Tunnel (Fehler) können manuell gesetzt werden.',
      'statuses.allSensorsOff_noLogical': 'Alle Sensoren aus! Kein logischer Fehler.',
      'statuses.allSensorsOff_logical': 'Alle Sensoren aus! Logischer Fehler! (Spielplatz-Modus: Du kannst weitermachen)',
      'statuses.setAllSensorsOff': 'Markiere Felder bis alle Sensoren aus sind.',
      'game.levelRound': 'Level {level}, Runde {round} von {total}',
      'game.levelCompleted': 'Level {completed} geschafft!',
      'game.nextLevelInfo': 'In Level {next} werden im Durchschnitt {next} Tunnel (Fehler) gegraben.',
      'game.startNextLevel': 'Level {next} starten',
      'game.newHighscore': 'Neuer Highscore!',
      'game.overLine': 'Spiel beendet! Logischer Fehler in Level {level}, Runde {round}.',
      'form.name': 'Name (optional)',
      'form.age': 'Alter (optional)',
      'buttons.save': 'Speichern',
      'buttons.discard': 'Verwerfen',
  'stats.title': 'Logische Fehlerrate vs. Physikalische Fehlerrate',
  'stats.physical': 'Physikalische Fehlerrate',
  'stats.logical': 'Logische Fehlerrate',
  'stats.ageLabel': 'Alter',
  'stats.sizeLabel': 'Größe',
  'legend.restError': 'Tunnel (übrige Fehler)',
  'legend.noError': 'Kein Tunnel',
  'legend.origError': 'Ursprünglicher Tunnel',
  'legend.playerCorrection': 'Korrektur durch Spieler',
  'legend.correctedOrigError': 'Ursprünglicher Tunnel zugeschüttet',
  'legend.correction': 'Korrektur',
  'highscore.title': 'Highscore: Level {level} ({name})',
  'highscore.none': 'Noch kein Highscore',
  'anonymousName': 'Anonym',
  'savedAs': 'Gespeichert als {filename}',
  'ui.languageLabel': 'Sprache / Language:',
      'tutorial.prev': 'Zurück',
      'tutorial.next': 'Weiter',
      'tutorial.slides': [
        '<b>Willkommen bei Whack-an-Error!</b><br><br>Dies ist ein Spiel zur Quantenfehlerkorrektur. Dein Ziel ist es, Tunnel Fehler in einem Gitter von Qubits zu finden und zu zuzuschütten(korrigieren).<br>Die Biber vom Jülicher See wollen nämlich auf die andere Seite.<br><img src=\'static/tutorial_1.png\' style=\'width:80%;margin-top:12px;\'>',
        'In jeder Runde Graben die Biber einige Tunnel. Ein Tunnel aktiviert seine benachbarten Sensoren.<br><img src=\'static/tutorial_2.png\' style=\'width:80%;margin-top:12px;\'>',
        'Grenzt ein Sensor an 1 oder 3 Tunnel, ist er aktiviert.<br>Grenzt ein Sensor an 0, 2 oder 4 Tunnel, ist er deaktiviert.<br><img src=\'static/tutorial_3.png\' style=\'width:80%;margin-top:12px;\'>',
        'Im Spiel kannst du die Tunnel von der Oberfläche aber natürlich nicht sehen.<br><img src=\'static/tutorial_4.png\' style=\'width:80%;margin-top:12px;\'>',
        'Markiere solange Felder zur Korrektur (Tunnel graben oder zuschütten).<br><img src=\'static/tutorial_5.png\' style=\'width:80%;margin-top:12px;\'>',
        'Markiere solange Felder zur Korrektur (Tunnel graben oder zuschütten).<br><img src=\'static/tutorial_6.png\' style=\'width:80%;margin-top:12px;\'>',
        'Bis alle Sensoren aus sind.<br><img src=\'static/tutorial_7.png\' style=\'width:80%;margin-top:12px;\'>',
        'Es gibt mehrere Wege zum Ziel!  Nimm am Besten den kürzesten!<br><br>Eine Schleife von Tunneln wie hier ist kein Problem.<br><img src=\'static/tutorial_8.png\' style=\'width:80%;margin-top:12px;\'>',
        'Nur wenn die Biber am Ende von der einen zur anderen Seite können, hast du verloren - ein logischer Fehler!<br><b>Logischer Fehler:</b> Eine durchgehender Tunnel, der von den Sensoren nicht erkannt wird und die Biber auf die andere Seite lässt.<br><img src=\'static/tutorial_9.png\' style=\'width:80%;margin-top:12px;\'>',
        'Im Spielplatz-Modus kannst du Fehler manuell setzen und die Auswirkungen direkt beobachten.<br><img src=\'static/tutorial_10.png\' style=\'width:80%;margin-top:12px;\'>',
        'Versuche, alle Fehler zu beseitigen, ohne einen logischen Fehler zu verursachen. Steige durch die Level für mehr Herausforderung!<br>Viel Erfolg!'
      ]
    },
    en: {
      'app.title': 'Whack-an-Error',
      'labels.grid_size': 'Grid size:',
      'labels.mode': 'Mode:',
      'modes.game': 'Game',
      'modes.playground': 'Playground',
      'buttons.start': 'Start',
      'buttons.stats': 'Show statistics',
      'buttons.tutorial': 'Show tutorial',
      'buttons.reset': 'Reset',
      'buttons.close': 'Close',
  'buttons.nextRound': 'Next round',
      'buttons.showByAge': 'Show by age range',
      'buttons.showAll': 'Show all',
      'buttons.toggleErrors.show': 'Show errors',
      'buttons.toggleErrors.hide': 'Hide errors',
      'statuses.playgroundIntro': 'Playground mode: you can set errors manually.',
      'statuses.allSensorsOff_noLogical': 'All sensors off! No logical error.',
      'statuses.allSensorsOff_logical': 'All sensors off! Logical error! (Playground: you can continue)',
      'statuses.setAllSensorsOff': 'Turn all sensors off.',
      'game.levelRound': 'Level {level}, Round {round} of {total}',
      'game.levelCompleted': 'Level {completed} done!',
      'game.nextLevelInfo': 'In level {next}, on average {next} faults are drawn.',
      'game.startNextLevel': 'Start level {next}',
      'game.newHighscore': 'New highscore!',
      'game.overLine': 'Game over! Logical error in level {level}, round {round}.',
      'form.name': 'Name (optional)',
      'form.age': 'Age (optional)',
      'buttons.save': 'Save',
      'buttons.discard': 'Discard',
  'stats.title': 'Logical error rate vs physical error rate',
  'stats.physical': 'Physical Error Rate',
  'stats.logical': 'Logical Error Rate',
  'stats.ageLabel': 'Age',
  'stats.sizeLabel': 'Size',
  'legend.restError': 'Residual error',
  'legend.noError': 'No error',
  'legend.origError': 'Original error',
  'legend.playerCorrection': 'Player correction',
  'legend.correctedOrigError': 'Original error corrected',
  'legend.correction': 'Correction',
  'highscore.title': 'Highscore: Level {level} ({name})',
  'highscore.none': 'No highscore yet',
  'anonymousName': 'Anonymous',
  'savedAs': 'Saved as {filename}',
  'ui.languageLabel': 'Language / Sprache:',
      'tutorial.prev': 'Back',
      'tutorial.next': 'Next',
      'tutorial.slides': [
                        '<b>Welcome to Whack-an-Error!</b><br><br>This is a game about quantum error correction. Your goal is to find and fill (correct) tunnel errors in a grid of qubits.<br>The beavers from Jülicher See want to get to the other side.<br><img src=\'static/tutorial_1.png\' style=\'width:80%;margin-top:12px;\'>',
                        'In each round, the beavers dig some tunnels. A tunnel activates its neighboring sensors.<br><img src=\'static/tutorial_2.png\' style=\'width:80%;margin-top:12px;\'>',
                        'If a sensor borders 1 or 3 tunnels, it is activated.<br>If a sensor borders 0, 2 or 4 tunnels, it is deactivated.<br><img src=\'static/tutorial_3.png\' style=\'width:80%;margin-top:12px;\'>',
                        'In the game, you cannot see the tunnels from the surface.<br><img src=\'static/tutorial_4.png\' style=\'width:80%;margin-top:12px;\'>',
                        'Mark fields for correction (dig or fill tunnels) until all sensors are off.<br><img src=\'static/tutorial_5.png\' style=\'width:80%;margin-top:12px;\'>',
                        'Mark fields for correction (dig or fill tunnels) until all sensors are off.<br><img src=\'static/tutorial_6.png\' style=\'width:80%;margin-top:12px;\'>',
                        'Until all sensors are off.<br><img src=\'static/tutorial_7.png\' style=\'width:80%;margin-top:12px;\'>',
                        'There are several ways to reach the goal! Take the shortest one!<br><br>A loop of tunnels like this is not a problem.<br><img src=\'static/tutorial_8.png\' style=\'width:80%;margin-top:12px;\'>',
                        'Only if the beavers can get from one side to the other at the end, you lose - a logical error!<br><b>Logical error:</b> A continuous tunnel that is not detected by the sensors and lets the beavers get to the other side.<br><img src=\'static/tutorial_9.png\' style=\'width:80%;margin-top:12px;\'>',
                        'In playground mode, you can set errors manually and directly observe the effects.<br><img src=\'static/tutorial_10.png\' style=\'width:80%;margin-top:12px;\'>',
                        'Try to eliminate all errors without causing a logical error. Progress through the levels for more challenge!<br>Good luck!'
                        ]
    }
  };

  function format(str, params) {
    if (!params) return str;
    return str.replace(/\{(\w+)\}/g, (_, k) => params[k] !== undefined ? params[k] : `{${k}}`);
  }

  const i18n = {
    dict,
    lang: (localStorage.getItem('lang') || (navigator.language || 'de').slice(0,2)).replace(/[^a-z]/g,'') || 'de',
    t(key, params) {
      const table = this.dict[this.lang] || this.dict.de;
      const v = table[key];
      if (Array.isArray(v)) return v; // for slides
      if (typeof v === 'string') return format(v, params);
      // fallback to de
      const vd = this.dict.de[key];
      if (Array.isArray(vd)) return vd;
      return typeof vd === 'string' ? format(vd, params) : key;
    },
    setLang(lang) {
      if (!this.dict[lang]) return;
      this.lang = lang;
      localStorage.setItem('lang', lang);
      this.apply();
      // Update any dynamic UI bits if game exists
      if (window.gameController) {
        const gs = window.gameController.gameState;
        if (gs && gs.gameActive && !gs.playgroundMode) {
          document.getElementById('game-status').textContent = this.t('game.levelRound', { level: gs.currentLevel, round: gs.currentRound, total: gs.roundsPerLevel });
        } else if (gs && gs.playgroundMode) {
          document.getElementById('game-status').textContent = this.t('statuses.playgroundIntro');
        }
        // Update toggle errors button label according to state
        const btn = document.getElementById('toggle-errors-btn');
        if (btn) btn.textContent = gs?.playgroundShowErrors ? this.t('buttons.toggleErrors.hide') : this.t('buttons.toggleErrors.show');
      }
    },
    apply() {
      // Update elements with data-i18n
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const txt = this.t(key);
        if (txt && typeof txt === 'string') el.textContent = txt;
      });
      // Update placeholders
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const txt = this.t(key);
        if (txt && typeof txt === 'string') el.setAttribute('placeholder', txt);
      });
      // Title
      const title = this.t('app.title');
      if (title) document.title = title;
    },
    init() {
      // Inject a language selector if placeholder exists or selection panel is present
      const container = document.getElementById('lang-switch') || document.getElementById('selection-panel');
      if (container && !document.getElementById('lang-select')) {
        const wrap = document.createElement('div');
        wrap.style.cssText = 'margin:8px 0; display:flex; gap:8px; align-items:center; justify-content:center;';
        const label = document.createElement('label');
        label.textContent = this.t('ui.languageLabel');
        const sel = document.createElement('select');
        sel.id = 'lang-select';
        sel.innerHTML = `<option value="de">Deutsch</option><option value="en">English</option>`;
        sel.value = this.lang in this.dict ? this.lang : 'de';
        sel.onchange = () => this.setLang(sel.value);
        wrap.appendChild(label); wrap.appendChild(sel);
        container.prepend(wrap);
      }
      this.apply();
    }
  };

  window.i18n = i18n;
})();
