/**
 * NetC Kahoot Mode — Multiplayer Real-Time Quiz
 * Uses Firebase Realtime Database for live sync (up to 35 players)
 */

window.Kahoot = {
  /* ── State ─────────────────────────────────────── */
  pin: null,
  role: null,           // 'host' | 'player'
  nickname: null,
  playerKey: null,
  gameRef: null,
  _listeners: [],

  // Host-only
  _questions: [],
  _qIdx: 0,
  _timeLimitSec: 20,
  _timerHandle: null,
  _timeLeft: 0,
  _playerAnswers: {},
  _scores: {},

  // Player-only
  _hasAnswered: false,
  _myScore: 0,
  _myLastGain: 0,

  // Audio
  _audioCtx: null,
  _musicNodes: [],
  _isMuted: false,
  _lobbyMusicTimer: null,
  _questionMusicTimer: null,

  /* ── Utilities ──────────────────────────────────── */
  _generatePin() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  _getPlayerKey() {
    return 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  },

  _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  _getCorrectIdx(q) {
    if (q.correct !== undefined) return q.correct;
    if (q.answer !== undefined) return q.answer;
    return 0;
  },

  /* ── HOST: Create Room ──────────────────────────── */
  async createRoom(category, questionCount, timeLimitSec) {
    if (!window.rtdb) { alert('Realtime Database not connected.'); return; }

    const pin = this._generatePin();
    this.pin = pin;
    this.role = 'host';
    this._timeLimitSec = timeLimitSec;
    this._qIdx = 0;
    this._scores = {};
    this._playerAnswers = {};

    // Build question pool
    let pool = category === '__ALL__'
      ? [...ALL_QUESTIONS]
      : ALL_QUESTIONS.filter(q => q.category === category);
    this._questions = this._shuffle(pool).slice(0, questionCount);

    // Write room to RTDB
    this.gameRef = window.rtdb.ref('games/' + pin);
    await this.gameRef.set({
      host: Auth.currentUser()?.username || 'host',
      status: 'waiting',
      category,
      totalQuestions: this._questions.length,
      timeLimitSec,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      players: null,
      currentQ: null
    });

    // Auto-delete after 3 hours
    setTimeout(() => { if (this.gameRef) this.gameRef.remove(); }, 3 * 60 * 60 * 1000);

    this._listenForPlayers();
    this._showKahootView('lobby');

    // Update PIN display
    const pinEl = document.getElementById('k-pin-display');
    if (pinEl) pinEl.textContent = pin.slice(0,3) + ' ' + pin.slice(3);

    // Update URL hint
    const hintEl = document.getElementById('k-url-hint');
    const shortUrl = window.location.hostname + window.location.pathname.replace(/\/$/, '');
    if (hintEl) hintEl.textContent = shortUrl + '  →  "Join a Game"';

    // Generate QR code
    const joinUrl = window.location.origin + window.location.pathname.replace(/\/$/, '') + '/?join=' + pin;
    const qrContainer = document.getElementById('k-qr-code');
    if (qrContainer) {
      qrContainer.innerHTML = '';
      if (window.QRCode) {
        new QRCode(qrContainer, {
          text: joinUrl,
          width: 160,
          height: 160,
          colorDark: '#1a0008',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H
        });
      } else {
        // Fallback: show URL as text if library not loaded
        qrContainer.style.cssText = 'padding:12px;font-size:0.7rem;color:#1a0008;word-break:break-all;max-width:160px;';
        qrContainer.textContent = joinUrl;
      }
    }

    this.playLobbyMusic();
    return pin;
  },

  /* ── HOST: Listen for players ───────────────────── */
  _listenForPlayers() {
    const ref = this.gameRef.child('players');
    const fn = ref.on('value', snap => {
      const players = snap.val() || {};
      const list = Object.values(players);

      const cnt = document.getElementById('k-player-count');
      if (cnt) cnt.textContent = list.length;

      const grid = document.getElementById('k-player-list');
      if (grid) {
        grid.innerHTML = list.map(p => `
          <div class="k-player-chip">
            <div class="k-player-avatar">${p.nickname.charAt(0).toUpperCase()}</div>
            <span>${p.nickname}</span>
          </div>`).join('');
      }

      const btn = document.getElementById('k-start-btn');
      if (btn) {
        btn.disabled = list.length === 0;
        btn.textContent = list.length === 0
          ? '⏳ Waiting for players...'
          : `🚀 Start Game  (${list.length} joined)`;
      }
    });
    this._listeners.push(() => ref.off('value', fn));
  },

  /* ── HOST: Start game ───────────────────────────── */
  async startGame() {
    this.stopMusic();
    await this._broadcastQuestion();
  },

  /* ── HOST: Broadcast question ───────────────────── */
  async _broadcastQuestion() {
    if (this._timerHandle) clearInterval(this._timerHandle);
    await this.gameRef.child('answers').remove();

    const q = this._questions[this._qIdx];
    if (!q) { await this._showFinalPodium(); return; }

    // Send question WITHOUT correct answer
    await this.gameRef.update({
      status: 'question',
      currentQ: {
        idx: this._qIdx,
        total: this._questions.length,
        question: q.question,
        options: q.options,
        timeLimitSec: this._timeLimitSec,
        startedAt: firebase.database.ServerValue.TIMESTAMP
      }
    });

    this._renderHostQuestion(q);
    this.playQuestionMusic();

    this._timeLeft = this._timeLimitSec;
    this._updateTimerUI();
    this._timerHandle = setInterval(() => {
      this._timeLeft--;
      this._updateTimerUI();
      if (this._timeLeft <= 0) {
        clearInterval(this._timerHandle);
        this._revealAnswer();
      }
    }, 1000);

    this._listenForAnswers();
  },

  /* ── HOST: Listen for answers ───────────────────── */
  _listenForAnswers() {
    const ref = this.gameRef.child('answers');
    // Remove previous answer listener
    const prevIdx = this._listeners.findIndex(fn => fn._isAnswerListener);
    if (prevIdx !== -1) { this._listeners[prevIdx](); this._listeners.splice(prevIdx,1); }

    const fn = ref.on('value', snap => {
      const answers = snap.val() || {};
      this._playerAnswers = answers;
      const counts = [0,0,0,0];
      Object.values(answers).forEach(a => { if (a.optionIdx >= 0 && a.optionIdx < 4) counts[a.optionIdx]++; });
      const total = Object.keys(answers).length;
      const playerCount = Math.max(1, Object.keys(this._scores).length || 1);
      counts.forEach((c, i) => {
        const bar = document.getElementById('k-bar-' + i);
        const cnt = document.getElementById('k-bar-count-' + i);
        if (bar) bar.style.height = Math.round((c / playerCount) * 100) + '%';
        if (cnt) cnt.textContent = c;
      });
      const el = document.getElementById('k-answered-count');
      if (el) el.textContent = total + ' answered';
    });
    const off = () => ref.off('value', fn);
    off._isAnswerListener = true;
    this._listeners.push(off);
  },

  /* ── HOST: Reveal answer & score ────────────────── */
  async _revealAnswer() {
    clearInterval(this._timerHandle);
    this.stopMusic();

    const q = this._questions[this._qIdx];
    const correctIdx = this._getCorrectIdx(q);

    // Get current players
    const playersSnap = await this.gameRef.child('players').get();
    const players = playersSnap.val() || {};

    // Get answers
    const answersSnap = await this.gameRef.child('answers').get();
    const answers = answersSnap.val() || {};

    // Get question start time
    const startedAtSnap = await this.gameRef.child('currentQ/startedAt').get();
    const startedAt = startedAtSnap.val() || Date.now();

    // Ensure all players are in scores
    Object.entries(players).forEach(([key, p]) => {
      if (!this._scores[key]) this._scores[key] = { nickname: p.nickname, score: 0, lastGain: 0 };
    });

    // Calculate points
    Object.entries(answers).forEach(([key, ans]) => {
      if (!this._scores[key]) this._scores[key] = { nickname: ans.nickname || key, score: 0, lastGain: 0 };
      let gain = 0;
      if (ans.optionIdx === correctIdx) {
        const elapsed = (Date.now() - startedAt) / 1000;
        gain = Math.max(500, Math.round(1000 - (elapsed / this._timeLimitSec) * 500));
      }
      this._scores[key].lastGain = gain;
      this._scores[key].score += gain;
      if (ans.nickname) this._scores[key].nickname = ans.nickname;
    });

    // Rank
    const sorted = Object.entries(this._scores).sort(([,a],[,b]) => b.score - a.score);
    sorted.forEach(([key], i) => { this._scores[key].rank = i + 1; });

    // Push to RTDB
    await this.gameRef.update({
      status: 'leaderboard',
      revealedAnswer: correctIdx,
      scores: this._scores
    });

    this._renderLeaderboard(sorted, correctIdx, q, true);
  },

  /* ── HOST: Next question ────────────────────────── */
  async nextQuestion() {
    this._qIdx++;
    if (this._qIdx >= this._questions.length) {
      await this._showFinalPodium();
    } else {
      await this._broadcastQuestion();
    }
  },

  /* ── HOST: Show podium ──────────────────────────── */
  async _showFinalPodium() {
    await this.gameRef.update({ status: 'podium' });
    this._renderPodium(this._scores);
    this.playPodiumMusic();
    if (app && app.launchConfetti) setTimeout(() => app.launchConfetti(), 500);
  },

  /* ── PLAYER: Join room ──────────────────────────── */
  async joinRoom(pin, nickname) {
    if (!window.rtdb) { throw new Error('Database not connected.'); }

    pin = pin.replace(/\s/g, '').trim();
    if (!pin || pin.length !== 6) throw new Error('Please enter a valid 6-digit PIN.');
    if (!nickname || !nickname.trim()) throw new Error('Please enter a nickname.');

    this.pin = pin;
    this.role = 'player';
    this.nickname = nickname.trim();
    this.playerKey = this._getPlayerKey();
    this._myScore = 0;
    this._myLastGain = 0;
    this._hasAnswered = false;

    this.gameRef = window.rtdb.ref('games/' + pin);
    const snap = await this.gameRef.get();
    if (!snap.exists()) throw new Error('Game not found. Check the PIN.');

    const game = snap.val();
    if (game.status !== 'waiting') throw new Error('This game has already started.');

    const playerCount = Object.keys(game.players || {}).length;
    if (playerCount >= 35) throw new Error('This room is full (35 players max).');

    // Join
    await this.gameRef.child('players/' + this.playerKey).set({
      nickname: this.nickname,
      score: 0,
      joinedAt: firebase.database.ServerValue.TIMESTAMP
    });
    this.gameRef.child('players/' + this.playerKey).onDisconnect().remove();

    this._listenAsPlayer();
    this._showPlayerWaiting();
    this.playLobbyMusic();
  },

  /* ── PLAYER: Listen to game state ───────────────── */
  _listenAsPlayer() {
    const ref = this.gameRef;
    const fn = ref.on('value', snap => {
      const game = snap.val();
      if (!game) return;
      switch(game.status) {
        case 'waiting':    this._showPlayerWaiting(); break;
        case 'question':
          this._hasAnswered = false;
          this.stopMusic();
          this._renderPlayerQuestion(game.currentQ);
          this.playQuestionMusic();
          this._startPlayerTimer(game.currentQ);
          break;
        case 'leaderboard':
          this.stopMusic();
          const myData = game.scores?.[this.playerKey];
          if (myData) { this._myScore = myData.score; this._myLastGain = myData.lastGain; }
          const sorted = Object.entries(game.scores || {}).sort(([,a],[,b]) => b.score - a.score);
          this._renderLeaderboard(sorted, game.revealedAnswer, game.currentQ, false);
          break;
        case 'podium':
          this.stopMusic();
          this._renderPodium(game.scores);
          this.playPodiumMusic();
          break;
      }
    });
    this._listeners.push(() => ref.off('value', fn));
  },

  /* ── PLAYER: Submit answer ──────────────────────── */
  async submitAnswer(optionIdx) {
    if (this._hasAnswered) return;
    this._hasAnswered = true;

    document.querySelectorAll('.k-answer-btn').forEach((btn, i) => {
      btn.disabled = true;
      if (i === optionIdx) btn.classList.add('k-selected');
    });

    const el = document.getElementById('k-player-waiting-overlay');
    if (el) el.classList.remove('hidden');

    await this.gameRef.child('answers/' + this.playerKey).set({
      optionIdx,
      nickname: this.nickname,
      answeredAt: firebase.database.ServerValue.TIMESTAMP
    });
  },

  /* ── PLAYER: Client-side timer ──────────────────── */
  _startPlayerTimer(currentQ) {
    if (this._timerHandle) clearInterval(this._timerHandle);
    this._timeLimitSec = currentQ?.timeLimitSec || 20;
    const elapsed = currentQ?.startedAt ? (Date.now() - currentQ.startedAt) / 1000 : 0;
    this._timeLeft = Math.max(0, Math.ceil(this._timeLimitSec - elapsed));
    this._updateTimerUI();
    this._timerHandle = setInterval(() => {
      this._timeLeft = Math.max(0, this._timeLeft - 1);
      this._updateTimerUI();
      if (this._timeLeft <= 0) clearInterval(this._timerHandle);
    }, 1000);
  },

  /* ── Timer UI ───────────────────────────────────── */
  _updateTimerUI() {
    const el = document.getElementById('k-timer-num');
    const ring = document.getElementById('k-timer-ring-fg');
    if (el) {
      el.textContent = this._timeLeft;
      el.style.color = this._timeLeft <= 5 ? '#ff4060' : this._timeLeft <= 10 ? '#ffb020' : '#fff';
    }
    if (ring) {
      const circ = 2 * Math.PI * 45;
      const pct = this._timeLeft / (this._timeLimitSec || 20);
      ring.style.strokeDasharray = circ;
      ring.style.strokeDashoffset = circ * (1 - pct);
      ring.style.stroke = this._timeLeft <= 5 ? '#ff4060' : this._timeLeft <= 10 ? '#ffb020' : '#c4334a';
    }
  },

  /* ── Cleanup ────────────────────────────────────── */
  cleanup() {
    if (this._timerHandle) clearInterval(this._timerHandle);
    this._listeners.forEach(fn => { try { fn(); } catch(e){} });
    this._listeners = [];
    this.stopMusic();
    if (this.role === 'player' && this.gameRef && this.playerKey) {
      this.gameRef.child('players/' + this.playerKey).remove();
    }
    this.pin = null; this.role = null; this.gameRef = null;
    this._questions = []; this._qIdx = 0; this._scores = {};
  },

  /* ── View Switcher ──────────────────────────────── */
  _showKahootView(name) {
    document.querySelectorAll('.k-sub-view').forEach(el => el.classList.remove('k-active'));
    const el = document.getElementById('k-view-' + name);
    if (el) el.classList.add('k-active');
    app.navigateTo('kahoot');
  },

  _showPlayerWaiting() {
    this._showKahootView('player-waiting');
    const el = document.getElementById('k-waiting-name');
    if (el) el.textContent = this.nickname;
    const av = document.getElementById('k-waiting-avatar');
    if (av) av.textContent = this.nickname.charAt(0).toUpperCase();
  },

  /* ── RENDER: Host Question ──────────────────────── */
  _renderHostQuestion(q) {
    this._showKahootView('host-question');
    const colors = ['#e74c3c','#3498db','#f39c12','#2ecc71'];
    const letters = ['A','B','C','D'];
    document.getElementById('k-q-num').textContent = `Q${this._qIdx+1} / ${this._questions.length}`;
    document.getElementById('k-q-text').textContent = q.question;
    document.getElementById('k-answered-count').textContent = '0 answered';
    const grid = document.getElementById('k-host-opts');
    if (!grid) return;
    grid.innerHTML = q.options.map((opt, i) => `
      <div class="k-host-option" style="border-color:${colors[i]}">
        <div class="k-host-opt-row">
          <span class="k-opt-letter" style="background:${colors[i]}">${letters[i]}</span>
          <span class="k-opt-text">${opt}</span>
        </div>
        <div class="k-bar-section">
          <div class="k-answer-bar" id="k-bar-${i}" style="background:${colors[i]};height:2px;width:24px;border-radius:4px 4px 0 0;transition:height .4s;"></div>
          <span class="k-bar-count" id="k-bar-count-${i}">0</span>
        </div>
      </div>`).join('');
  },

  /* ── RENDER: Player Question ────────────────────── */
  _renderPlayerQuestion(currentQ) {
    if (!currentQ) return;
    this._showKahootView('player-question');
    const colors = ['#e74c3c','#3498db','#f39c12','#2ecc71'];
    const icons  = ['▲','◆','●','■'];
    document.getElementById('k-pq-num').textContent = `Q${(currentQ.idx||0)+1} / ${currentQ.total||'?'}`;
    document.getElementById('k-pq-text').textContent = currentQ.question;
    const overlay = document.getElementById('k-player-waiting-overlay');
    if (overlay) overlay.classList.add('hidden');
    const grid = document.getElementById('k-player-answers');
    if (!grid) return;
    grid.innerHTML = currentQ.options.map((opt, i) => `
      <button class="k-answer-btn" onclick="Kahoot.submitAnswer(${i})" style="background:${colors[i]}">
        <span class="k-answer-icon">${icons[i]}</span>
        <span class="k-answer-text">${opt}</span>
      </button>`).join('');
  },

  /* ── RENDER: Leaderboard ────────────────────────── */
  _renderLeaderboard(sorted, correctIdx, currentQ, isHost) {
    this._showKahootView('leaderboard');
    const opts = currentQ?.options || [];
    const correctEl = document.getElementById('k-correct-answer');
    if (correctEl) correctEl.textContent = '✅ ' + (opts[correctIdx] || '');

    const listEl = document.getElementById('k-lb-list');
    if (listEl) {
      listEl.innerHTML = sorted.slice(0, 10).map(([key, p], i) => {
        const isMe = !isHost && key === this.playerKey;
        return `<div class="k-lb-row ${p.lastGain > 0 ? 'correct' : 'wrong'} ${isMe ? 'k-lb-me' : ''}" style="animation-delay:${i*0.07}s">
          <span class="k-lb-rank">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</span>
          <span class="k-lb-name">${p.nickname}${isMe?' (You)':''}</span>
          <span class="k-lb-gain ${p.lastGain>0?'gain-pos':'gain-zero'}">${p.lastGain>0?'+'+p.lastGain:'—'}</span>
          <span class="k-lb-score">${p.score.toLocaleString()}</span>
        </div>`;
      }).join('');
    }

    const nextBtn = document.getElementById('k-next-btn');
    if (nextBtn) {
      if (isHost) {
        nextBtn.classList.remove('hidden');
        nextBtn.textContent = this._qIdx + 1 >= this._questions.length
          ? '🏆 Show Final Results'
          : `▶ Next Question (${this._qIdx+2}/${this._questions.length})`;
      } else {
        nextBtn.classList.add('hidden');
      }
    }

    const personalEl = document.getElementById('k-personal-result');
    if (personalEl) {
      if (!isHost && this.playerKey) {
        const myEntry = sorted.find(([k]) => k === this.playerKey)?.[1];
        const myRank  = sorted.findIndex(([k]) => k === this.playerKey) + 1;
        if (myEntry) {
          personalEl.innerHTML = `<div class="k-personal-score">
            <span>Your score: <strong>${myEntry.score.toLocaleString()}</strong></span>
            <span class="${myEntry.lastGain>0?'gain-pos':'gain-zero'}">${myEntry.lastGain>0?'+'+myEntry.lastGain+' pts':'No points this round'}</span>
            <span>Rank: #${myRank}</span>
          </div>`;
          personalEl.classList.remove('hidden');
        }
      } else {
        personalEl.classList.add('hidden');
      }
    }
  },

  /* ── RENDER: Podium ─────────────────────────────── */
  _renderPodium(scores) {
    this._showKahootView('podium');
    if (!scores) return;
    const sorted = Object.values(scores).sort((a,b) => b.score - a.score);
    const ids = ['k-pod-2','k-pod-1','k-pod-3'];
    const ranks = [1, 0, 2]; // 2nd, 1st, 3rd display order
    ranks.forEach((rank, i) => {
      const p = sorted[rank];
      const el = document.getElementById(ids[i]);
      if (!el) return;
      el.querySelector('.k-pod-name').textContent  = p ? p.nickname  : '—';
      el.querySelector('.k-pod-score').textContent = p ? p.score.toLocaleString() + ' pts' : '';
    });
    const listEl = document.getElementById('k-final-list');
    if (listEl) {
      listEl.innerHTML = sorted.map((p,i) => `
        <div class="k-lb-row">
          <span class="k-lb-rank">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</span>
          <span class="k-lb-name">${p.nickname}</span>
          <span class="k-lb-score">${p.score.toLocaleString()}</span>
        </div>`).join('');
    }
  },

  /* ── AUDIO: Lobby music ─────────────────────────── */
  playLobbyMusic() {
    if (this._isMuted) return;
    this.stopMusic();
    try {
      if (!this._audioCtx) this._audioCtx = new (window.AudioContext||window.webkitAudioContext)();
      if (this._audioCtx.state==='suspended') this._audioCtx.resume();
      const ctx = this._audioCtx;
      const master = ctx.createGain(); master.gain.value = 0.1;
      master.connect(ctx.destination);
      this._musicNodes = [master];
      const bpm = 120, beat = 60/bpm;
      const kick = (t) => {
        const o=ctx.createOscillator(), g=ctx.createGain();
        o.connect(g); g.connect(master);
        o.frequency.setValueAtTime(80,t); o.frequency.exponentialRampToValueAtTime(40,t+0.1);
        g.gain.setValueAtTime(0.8,t); g.gain.exponentialRampToValueAtTime(0.01,t+0.15);
        o.start(t); o.stop(t+0.2);
      };
      const hat = (t) => {
        const b=ctx.createBuffer(1,ctx.sampleRate*0.05,ctx.sampleRate);
        const d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*0.3;
        const s=ctx.createBufferSource(); s.buffer=b;
        const g=ctx.createGain(), f=ctx.createBiquadFilter();
        f.type='highpass'; f.frequency.value=8000;
        s.connect(f); f.connect(g); g.connect(master);
        g.gain.setValueAtTime(0.25,t); g.gain.exponentialRampToValueAtTime(0.01,t+0.05);
        s.start(t); s.stop(t+0.1);
      };
      const melody = [392,440,523,440,392,349,392,0];
      const note = (freq, t, dur) => {
        if(!freq) return;
        const o=ctx.createOscillator(), g=ctx.createGain();
        o.type='square'; o.frequency.value=freq;
        o.connect(g); g.connect(master);
        g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.12,t+0.02);
        g.gain.exponentialRampToValueAtTime(0.01,t+dur);
        o.start(t); o.stop(t+dur+0.05);
      };
      let loopT = ctx.currentTime;
      const loop = () => {
        if(!this._musicNodes.includes(master)) return;
        for(let i=0;i<4;i++) { kick(loopT+i*beat); hat(loopT+i*beat+beat*0.5); }
        melody.forEach((f,i) => note(f, loopT+i*beat*0.5, beat*0.4));
        loopT += beat*4;
        this._lobbyMusicTimer = setTimeout(loop, Math.max(0,(loopT-ctx.currentTime-0.1)*1000));
      };
      loop();
    } catch(e) { console.warn('Audio:', e); }
  },

  /* ── AUDIO: Question music (intense) ────────────── */
  playQuestionMusic() {
    if (this._isMuted) return;
    this.stopMusic();
    try {
      if (!this._audioCtx) this._audioCtx = new (window.AudioContext||window.webkitAudioContext)();
      if (this._audioCtx.state==='suspended') this._audioCtx.resume();
      const ctx = this._audioCtx;
      const master = ctx.createGain(); master.gain.value = 0.08;
      master.connect(ctx.destination);
      this._musicNodes = [master];
      const bpm = 160, beat = 60/bpm;
      const tick = (t, freq, vol=0.2) => {
        const o=ctx.createOscillator(), g=ctx.createGain();
        o.type='square'; o.frequency.value=freq;
        o.connect(g); g.connect(master);
        g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+0.01);
        g.gain.exponentialRampToValueAtTime(0.01,t+0.07);
        o.start(t); o.stop(t+0.1);
      };
      const pattern=[800,0,600,0,800,0,600,1000];
      let t = ctx.currentTime;
      const loop = () => {
        if(!this._musicNodes.includes(master)) return;
        pattern.forEach((f,i) => { if(f) tick(t+i*beat, f); });
        t += beat*8;
        this._questionMusicTimer = setTimeout(loop, Math.max(0,(t-ctx.currentTime-0.1)*1000));
      };
      loop();
    } catch(e) { console.warn('Audio:', e); }
  },

  /* ── AUDIO: Podium fanfare ──────────────────────── */
  playPodiumMusic() {
    if (this._isMuted) return;
    this.stopMusic();
    try {
      if (!this._audioCtx) this._audioCtx = new (window.AudioContext||window.webkitAudioContext)();
      if (this._audioCtx.state==='suspended') this._audioCtx.resume();
      const ctx = this._audioCtx;
      const master = ctx.createGain(); master.gain.value = 0.2;
      master.connect(ctx.destination);
      this._musicNodes = [master];
      const notes = [523,659,784,1047,784,1047,1175,1319];
      const durs  = [0.1,0.1,0.1,0.3,0.1,0.1,0.1,0.6];
      let t = ctx.currentTime + 0.1;
      notes.forEach((freq, i) => {
        const o=ctx.createOscillator(), g=ctx.createGain();
        o.type='triangle'; o.frequency.value=freq;
        o.connect(g); g.connect(master);
        g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.3,t+0.02);
        g.gain.exponentialRampToValueAtTime(0.01,t+durs[i]);
        o.start(t); o.stop(t+durs[i]+0.05);
        t += durs[i]+0.02;
      });
    } catch(e) { console.warn('Audio:', e); }
  },

  stopMusic() {
    clearTimeout(this._lobbyMusicTimer);
    clearTimeout(this._questionMusicTimer);
    this._musicNodes = [];
  },

  toggleMute() {
    this._isMuted = !this._isMuted;
    const btn = document.getElementById('k-mute-btn');
    if (btn) btn.textContent = this._isMuted ? '🔇' : '🔊';
    if (this._isMuted) this.stopMusic();
    else {
      if (this.role === 'host') {
        const statusSnap = this.gameRef?.child('status');
        // Re-play appropriate music based on current view
      }
    }
  }
};
