/**
 * NetC Review System — Enhanced Interactive Controller
 * Black & Maroon themed SPA for Taiwanese Networking Certification prep.
 *
 * Interactive features:
 *  • Bilingual UI — Traditional Chinese ↔ English (persisted)
 *  • Keyboard shortcuts (1-4 / A-D to answer, → next, Esc exit)
 *  • Per-question countdown timer (30 s default)
 *  • Streak tracker with badge animation
 *  • Confetti burst on high scores
 *  • Toast notification system
 *  • Live search on dashboard
 *  • Flashcard keyboard nav (← → Space)
 *  • Dark / Light mode toggle (persisted)
 *  • Progress ring animation on results
 *  • Card shuffle & "restart failed only" option
 *  • Auth integration (JWT login/logout)
 *  • Progress tracking & XP system via /api/ backend
 *  • Gamified dashboard with XP bar, level, streak
 *  • Smart Review for hard/review/recent questions
 */

const app = {
  /* ── state ───────────────────────────────────────── */
  view: 'login',
  lang: 'zh',          // 'zh' | 'en'
  category: null,
  quizQ: [], quizIdx: 0,
  correct: 0, answered: 0,
  answeredQ: false,
  streak: 0, bestStreak: 0,
  timerSec: 30, timerHandle: null,
  reviewIdx: 0, reviewMode: 'list',
  cardFlipped: false,
  wrongAnswers: [],
  sessionXP: 0,            // XP earned this quiz session
  _currentTab: 'hard',     // smart-review active tab
  _smartQuestions: [],     // questions for smart review quiz

  /* ── i18n strings ────────────────────────────────── */
  i18n: {
    zh: {
      hero_eyebrow:  'Taiwan Networking Certification',
      hero_title:    '網路認證<br>複習系統',
      hero_sub:      '選擇學習類別，開始您的考試備考之旅',
      section_label: '學習類別',
      search_ph:     '搜尋類別… (按 / 快速聚焦)',
      kbd_tip:       '鍵盤：1-4 選答，→ 下一題，Esc 結束',
      stat_total:    '總題數',
      stat_cat:      '類別',
      stat_mode:     '學習模式',
      stat_streak:   '最佳連勝',
      mode_quiz_title: '測驗模式',
      mode_quiz_sub:   '逐題作答，即時反饋與計時',
      mode_rev_title:  '複習模式',
      mode_rev_sub:    '快速瀏覽答案，記憶強化',
      btn_next:        '下一題',
      btn_finish:      '查看結果',
      btn_retry:       '重新測驗',
      btn_retry_wrong: '重練錯題',
      btn_review:      '進入複習',
      btn_home:        '返回首頁',
      lbl_correct:     '正確率',
      lbl_correct_n:   '正確',
      lbl_incorrect_n: '錯誤',
      lbl_total:       '總題數',
      lbl_streak_r:    '最高連勝',
      expl_header:     '解析',
      flip_hint:       '點擊翻轉 | 鍵盤：← → 切換，Space 翻轉',
      timer_out:       '時間到！自動顯示答案 ⏰',
      work_item:       'Work Item',
      questions_lbl:   '題',
      cat_sub_prefix:  '共',
      cat_sub_suffix:  '道題目',
      btn_start_all:       '全部題目 — 開始測驗',
      btn_start_review_all:'全部題目 — 複習模式',
      search_btn: '搜尋',
    },
    en: {
      hero_eyebrow:  'Taiwan Networking Certification',
      hero_title:    'Network Cert<br>Review System',
      hero_sub:      'Select a category and start your exam prep journey',
      section_label: 'Categories',
      search_ph:     'Search categories… (press / to focus)',
      kbd_tip:       'Keyboard: 1-4 to answer, → next, Esc to exit',
      stat_total:    'Questions',
      stat_cat:      'Categories',
      stat_mode:     'Study Modes',
      stat_streak:   'Best Streak',
      mode_quiz_title: 'Quiz Mode',
      mode_quiz_sub:   'Answer one by one with instant feedback & timer',
      mode_rev_title:  'Review Mode',
      mode_rev_sub:    'Browse answers quickly to reinforce memory',
      btn_next:        'Next',
      btn_finish:      'See Results',
      btn_retry:       'Retry Quiz',
      btn_retry_wrong: 'Retry Wrong',
      btn_review:      'Review Mode',
      btn_home:        'Home',
      lbl_correct:     'Accuracy',
      lbl_correct_n:   'Correct',
      lbl_incorrect_n: 'Incorrect',
      lbl_total:       'Total',
      lbl_streak_r:    'Best Streak',
      expl_header:     'Explanation',
      flip_hint:       'Click to flip | Keyboard: ← → navigate, Space flip',
      timer_out:       'Time up! Answer revealed ⏰',
      work_item:       'Work Item',
      questions_lbl:   'questions',
      cat_sub_prefix:  '',
      cat_sub_suffix:  'questions total',
      btn_start_all:       'All Questions — Start Quiz',
      btn_start_review_all:'All Questions — Review Mode',
      search_btn: 'Search',
    }
  },

  /* ── category config ─────────────────────────────── */
  cats: [
    { icon: '🌐', color: '#c4334a' },
    { icon: '📐', color: '#c4334a' },
    { icon: '🔧', color: '#b5451b' },
    { icon: '🔌', color: '#c07c2a' },
    { icon: '💻', color: '#7b2d8b' },
    { icon: '🌐', color: '#1a5e8b' },
    { icon: '📍', color: '#8b1a2a' },
    { icon: '🖧',  color: '#1a7a4a' },
    { icon: '🔒', color: '#5c3a8b' },
    { icon: '📡', color: '#2a5c8b' },
    { icon: '☁️', color: '#1a6b5a' },
  ],

  authMode: 'login', // 'login' or 'register'

  /* ── boot ────────────────────────────────────────── */
  async init() {
    // Apply saved theme (default dark)
    const theme = localStorage.getItem('nc-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);

    // Build merged question bank
    ALL_QUESTIONS = buildQuestionBank();
    console.log(`Question bank loaded: ${ALL_QUESTIONS.length} total questions`);

    // Apply saved language
    const lang = localStorage.getItem('nc-lang') || 'zh';
    this.lang = lang;
    this._updateLangButtons();
    this.applyLang();
    this.bindGlobal();

    // Inject toast container + confetti canvas + binary rain canvas
    document.body.insertAdjacentHTML('beforeend',
      '<div class="toast-container" id="toasts"></div>' +
      '<canvas id="confetti-canvas"></canvas>' +
      '<canvas id="binary-rain-canvas"></canvas>'
    );

    this._startBinaryRain();

    // Wait for Firebase auth to initialize
    const user = await Auth.init();

    // ── Auth check ────────────────────────────────────
    if (user) {
      await this._onLoginSuccess(user, false);
    } else {
      this.showLogin();
    }
  },

  /* ── show login / dashboard ──────────────────────── */
  showLogin() {
    this._hideAllViews();
    document.getElementById('view-login').classList.remove('hidden');
    this.view = 'login';
    // Hide nav user bar
    document.getElementById('nav-user-bar')?.classList.add('hidden');
    document.getElementById('btn-logout')?.classList.add('hidden');
  },

  async _onLoginSuccess(user, showWelcome = true) {
    // Show nav user bar
    this._updateNavUserBar(user);

    // Load progress from server
    try {
      const data = await Progress.loadAll();
      if (data.user) user = { ...user, ...data.user };
    } catch (e) {
      console.warn('Progress load failed:', e.message);
    }

    this.buildDashboard();
    this.navigateTo('dashboard');

    if (showWelcome && user) {
      const shortName = this._getShortName(user.name);
      this.toast(`歡迎回來，${shortName}！ 🎉`, '👋', 'success');
    }
  },

  _getShortName(name) {
    if (!name) return '';
    // Extract English first name from "(FIRSTNAME LASTNAME)"
    const en = name.match(/\(([^)]+)\)/);
    if (en) return en[1].split(' ')[0];
    return name.slice(0, 3);
  },

  /* ── handle login/register form submit ────────────────────── */
  toggleAuthMode() {
    this.authMode = this.authMode === 'login' ? 'register' : 'login';
    
    const isReg = this.authMode === 'register';
    document.getElementById('field-name').classList.toggle('hidden', !isReg);
    
    // Update texts
    document.getElementById('auth-mode-text').textContent = isReg ? 'Student Registration · 學生註冊' : 'Student Login · 學生登入';
    document.getElementById('auth-btn-text').textContent = isReg ? '註冊 Register' : '登入 Sign In';
    
    const toggleText = isReg 
      ? 'Already have an account? <strong style="color:var(--accent)">Login here</strong>'
      : 'Need an account? <strong style="color:var(--accent)">Register here</strong>';
    document.getElementById('auth-toggle-text').innerHTML = toggleText;

    // Reset error
    document.getElementById('login-error').classList.add('hidden');
  },

  async handleAuthSubmit(event) {
    event.preventDefault();
    const isReg = this.authMode === 'register';
    
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-pw').value;
    const name = isReg ? document.getElementById('auth-name').value.trim() : null;

    const btn = document.getElementById('auth-btn');
    const errDiv = document.getElementById('login-error');

    // Reset error
    errDiv.classList.add('hidden');
    errDiv.textContent = '';
    btn.disabled = true;
    document.getElementById('auth-btn-text').textContent = isReg ? '註冊中…' : '登入中…';

    try {
      let result;
      if (isReg) {
        result = await Auth.register(email, password, name);
        this.toast('註冊成功！Registration successful!', '🎉', 'success');
      } else {
        result = await Auth.login(email, password);
      }
      
      const user = result.user;
      await this._onLoginSuccess(user, true);

    } catch (err) {
      errDiv.textContent = `❌ ${err.message}`;
      errDiv.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      document.getElementById('auth-btn-text').textContent = isReg ? '註冊 Register' : '登入 Sign In';
    }
  },

  /* ── update nav user bar ─────────────────────────── */
  _updateNavUserBar(user) {
    if (!user) return;
    const bar    = document.getElementById('nav-user-bar');
    const avatar = document.getElementById('nav-avatar');
    const name   = document.getElementById('nav-user-name');
    const fill   = document.getElementById('nav-xp-fill');
    const badge  = document.getElementById('nav-level-badge');
    const logout = document.getElementById('btn-logout');

    if (bar)    bar.classList.remove('hidden');
    if (logout) logout.classList.remove('hidden');

    if (avatar) avatar.textContent   = Auth.getInitials(user.name);
    if (name)   name.textContent     = this._getShortName(user.name) || user.name;
    if (badge)  badge.textContent    = `Lv.${user.level || 1}`;

    if (fill) {
      const pct = ((user.xp || 0) % 500) / 500 * 100;
      fill.style.width = `${pct}%`;
    }
  },

  /* ── binary rain background ──────────────────────── */
  _startBinaryRain() {
    const canvas = document.getElementById('binary-rain-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const FONT_SIZE = 14;
    const CHARS = '01';
    const EXTRA = '10100111000110';

    let cols, drops, speeds, glows;

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      cols   = Math.floor(canvas.width / FONT_SIZE);
      drops  = Array.from({ length: cols }, () => Math.random() * -canvas.height / FONT_SIZE);
      speeds = Array.from({ length: cols }, () => 0.3 + Math.random() * 0.7);
      glows  = Array.from({ length: cols }, () => Math.random() > 0.85);
    }

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.fillStyle = 'rgba(8, 5, 7, 0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${FONT_SIZE}px 'Courier New', monospace`;

      for (let i = 0; i < cols; i++) {
        const char = (CHARS + EXTRA)[Math.floor(Math.random() * (CHARS + EXTRA).length)];
        const x = i * FONT_SIZE;
        const y = drops[i] * FONT_SIZE;

        if (glows[i]) {
          ctx.shadowBlur  = 12;
          ctx.shadowColor = '#c4334a';
          ctx.fillStyle   = '#ff6080';
        } else {
          ctx.shadowBlur  = 0;
          ctx.fillStyle   = `rgba(140, 26, 42, ${0.25 + Math.random() * 0.4})`;
        }

        ctx.fillText(char, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i]  = 0;
          speeds[i] = 0.3 + Math.random() * 0.7;
          glows[i]  = Math.random() > 0.85;
        }

        drops[i] += speeds[i];
      }

      requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);
  },

  /* ── language ────────────────────────────────────── */
  setLang(lang) {
    this.lang = lang;
    localStorage.setItem('nc-lang', lang);
    this._updateLangButtons();
    this.applyLang();
    if (this.view === 'dashboard') this.buildDashboard();
    if (this.view === 'category' && this.category) this._updateCategoryScreen();
    if (this.view === 'quiz') this._renderQuestion();
    if (this.view === 'review') {
      const qs = ALL_QUESTIONS.filter(q => q.category === this.category);
      this._buildReviewList(qs);
      this._renderFlashcard(qs);
    }
    this.toast(lang === 'en' ? 'Switched to English 🇬🇧' : '切換為中文 🇹🇼', '🌐');
  },

  _updateLangButtons() {
    document.getElementById('btn-lang-zh')?.classList.toggle('active', this.lang === 'zh');
    document.getElementById('btn-lang-en')?.classList.toggle('active', this.lang === 'en');
  },

  applyLang() {
    const t = this.i18n[this.lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) el.innerHTML = t[key];
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      if (t[key] !== undefined) el.placeholder = t[key];
    });
    const btnNext = document.getElementById('btn-next');
    if (btnNext) {
      const isLast = this.quizIdx >= this.quizQ.length - 1;
      btnNext.childNodes[0].textContent = isLast ? t.btn_finish : t.btn_next;
    }
    const mQt = document.querySelector('#mode-quiz h3');
    const mQs = document.querySelector('#mode-quiz p');
    const mRt = document.querySelector('#mode-review h3');
    const mRs = document.querySelector('#mode-review p');
    if (mQt) mQt.textContent = t.mode_quiz_title;
    if (mQs) mQs.textContent = t.mode_quiz_sub;
    if (mRt) mRt.textContent = t.mode_rev_title;
    if (mRs) mRs.textContent = t.mode_rev_sub;
    const rl = (id, key) => { const el = document.querySelector(id); if (el) el.textContent = t[key]; };
    rl('#res-ring-label',    'lbl_correct');
    rl('#stat-correct-lbl', 'lbl_correct_n');
    rl('#stat-incorrect-lbl','lbl_incorrect_n');
    rl('#stat-total-lbl',   'lbl_total');
    rl('#stat-streak-lbl',  'lbl_streak_r');
    rl('#expl-header-text', 'expl_header');
    rl('#fc-hint-text',     'flip_hint');
  },

  _t(q, field) {
    if (this.lang === 'en') {
      const enField = field + '_en';
      if (q[enField] !== undefined) return q[enField];
    }
    return q[field];
  },

  _s(key) { return this.i18n[this.lang][key] || key; },

  /* ── theme ───────────────────────────────────────── */
  toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('nc-theme', next);
    this.toast(`切換到${next === 'dark' ? '深色' : '淺色'}模式`, '🎨');
  },

  /* ── navigation ──────────────────────────────────── */
  navigateTo(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    const tgt = document.getElementById(`view-${viewId}`);
    if (tgt) tgt.classList.remove('hidden');
    window.scrollTo(0, 0);

    if (viewId === 'smart-review') {
      this._buildSmartReview();
    }
  },

  switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.id === `tab-btn-${tabId}`);
    });
    ['dashboard', 'progress', 'study', 'info'].forEach(id => {
      const el = document.getElementById(`tab-${id}`);
      if (el) el.classList.toggle('hidden', id !== tabId);
    });
  },

  _hideAllViews() {
    ['login','dashboard','category','quiz','results','review','smart-review']
      .forEach(v => document.getElementById(`view-${v}`)?.classList.add('hidden'));
  },

  /* ── dashboard ───────────────────────────────────── */
  buildDashboard() {
    const allCats = [...new Set(ALL_QUESTIONS.map(q => q.category))];
    const total   = ALL_QUESTIONS.length;
    const catCount = allCats.length;

    const user    = Auth.currentUser();
    const loggedIn = Auth.isLoggedIn();

    if (loggedIn) {
      // Show logged-in hero
      document.getElementById('hero-welcome')?.classList.remove('hidden');
      document.getElementById('hero-title-default')?.classList.add('hidden');
      document.getElementById('smart-review-btn-wrap')?.classList.remove('hidden');
      document.getElementById('app-tabs')?.classList.remove('hidden');
      
      // Switch to dashboard tab by default when navigating to dashboard
      this.switchTab('dashboard');

      const stats = Progress.getStats();
      const shortName = this._getShortName(user.name) || user.name;
      const el = document.getElementById('hero-greeting');
      if (el) el.textContent = `歡迎回來，${shortName}！`;

      // Level + XP
      const lvlEl = document.getElementById('hero-level-num');
      if (lvlEl) lvlEl.textContent = `Lv.${stats.level}`;

      const streakEl = document.getElementById('hero-streak-num');
      if (streakEl) streakEl.textContent = stats.streak;

      const xpCur = document.getElementById('hero-xp-current');
      const xpNxt = document.getElementById('hero-xp-next');
      const xpLvl = document.getElementById('hero-xp-next-level');
      const xpFill = document.getElementById('hero-xp-fill');
      if (xpCur) xpCur.textContent = stats.xpInLevel;
      if (xpNxt) xpNxt.textContent = stats.xpToNext;
      if (xpLvl) xpLvl.textContent = stats.level + 1;
      if (xpFill) xpFill.style.width = `${stats.levelProgress}%`;

      const svgStudied = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`;
      const svgMastered = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
      const svgHard = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
      const svgCompleted = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

      // Stats grid
      document.getElementById('hero-stats').innerHTML =
        this._statCard(svgStudied, stats.studied, '已學習') +
        this._statCard(svgMastered, stats.mastered, '已掌握') +
        this._statCard(svgHard, stats.hard, '困難題') +
        this._statCard(svgCompleted, stats.completedToday, '今日完成');

      // Category progress
      document.getElementById('cat-progress-section')?.classList.remove('hidden');
      this._buildCategoryProgress(allCats);

    } else {
      // Show default hero
      document.getElementById('hero-welcome')?.classList.add('hidden');
      document.getElementById('hero-title-default')?.classList.remove('hidden');
      document.getElementById('smart-review-btn-wrap')?.classList.add('hidden');
      document.getElementById('app-tabs')?.classList.add('hidden');
      
      // When not logged in, force 'study' view structure and hide tabs
      this.switchTab('dashboard');
      document.getElementById('tab-study')?.classList.remove('hidden');
      document.getElementById('tab-progress')?.classList.add('hidden');

      document.getElementById('hero-stats').innerHTML =
        this._stat(total,     this._s('stat_total')) +
        this._stat(catCount,  this._s('stat_cat'))   +
        this._stat(this.bestStreak || '—', this._s('stat_streak'));
    }

    this.renderCategoryGrid(allCats);

    // live search
    const si = document.getElementById('search-input');
    if (si) {
      const fresh = si.cloneNode(true);
      si.parentNode.replaceChild(fresh, si);
      fresh.addEventListener('input', e => {
        const q = e.target.value.toLowerCase();
        const filtered = allCats.filter(c => {
          const sample = ALL_QUESTIONS.find(x => x.category === c);
          const enName = sample?.category_en || '';
          return c.toLowerCase().includes(q) || enName.toLowerCase().includes(q);
        });
        this.renderCategoryGrid(filtered);
      });
    }
  },

  _stat: (v, l) =>
    `<div class="hero-stat"><span class="hero-stat-value">${v}</span><span class="hero-stat-label">${l}</span></div>`,

  _statCard: (icon, value, label) =>
    `<div class="hero-stat-card">
      <div class="stat-card-icon">${icon}</div>
      <div class="stat-card-val">${value}</div>
      <div class="stat-card-lbl">${label}</div>
    </div>`,

  /* ── category progress bars ──────────────────────── */
  _buildCategoryProgress(allCats) {
    const grid = document.getElementById('cat-progress-grid');
    if (!grid) return;

    grid.innerHTML = allCats.map(cat => {
      const catQs  = ALL_QUESTIONS.filter(q => q.category === cat);
      const prog   = Progress.getCategoryProgress(cat, catQs);
      const pct    = prog.percentage;
      const full   = pct === 100;
      const status = pct === 0 ? 'not-started' : pct === 100 ? 'completed' : 'in-progress';
      const statusText = pct === 0 ? '未開始' : pct === 100 ? '✅ 已完成' : '📖 進行中';

      return `
        <div class="cat-progress-card">
          <div class="cat-progress-header">
            <span class="cat-progress-name">${cat}</span>
            <span class="cat-progress-pct">${pct}%</span>
          </div>
          <div class="cat-progress-bar-wrap">
            <div class="cat-progress-bar-fill ${full ? 'full' : ''}" style="width:${pct}%"></div>
          </div>
          <div class="cat-progress-footer">
            <span class="cat-progress-status ${status}">${statusText}</span>
            <button class="cat-progress-continue" onclick="app.pickCategory('${this._esc(cat)}')">
              ${pct > 0 && pct < 100 ? '繼續 →' : '開始'}
            </button>
          </div>
        </div>`;
    }).join('');
  },

  /* ── category grid ───────────────────────────────── */
  renderCategoryGrid(cats) {
    const allCats = [...new Set(ALL_QUESTIONS.map(q => q.category))];
    const grid = document.getElementById('category-grid');
    if (!cats.length) {
      grid.innerHTML = `<p style="color:var(--text-lo);padding:20px">找不到相關類別</p>`;
      return;
    }

    const loggedIn = Auth.isLoggedIn();

    grid.innerHTML = cats.map(cat => {
      const idx    = allCats.indexOf(cat);
      const cfg    = this.cats[idx % this.cats.length];
      const count  = ALL_QUESTIONS.filter(q => q.category === cat).length;
      const sample = ALL_QUESTIONS.find(q => q.category === cat);
      const displayName = (this.lang === 'en' && sample?.category_en) ? sample.category_en : cat;
      const subText = this.lang === 'en'
        ? `${count} ${this._s('questions_lbl')}`
        : `${this._s('cat_sub_prefix')} ${count} ${this._s('cat_sub_suffix')}`;

      // Progress badge
      let progressBadge = '';
      if (loggedIn) {
        const catQs = ALL_QUESTIONS.filter(q => q.category === cat);
        const prog  = Progress.getCategoryProgress(cat, catQs);
        if (prog.mastered > 0) {
          const badge = prog.percentage === 100 ? 'mastered' : 'learning';
          const txt   = prog.percentage === 100 ? `⭐ 全部掌握` : `📖 ${prog.mastered}/${prog.total}`;
          progressBadge = `<span class="cat-progress-badge ${badge}">${txt}</span>`;
        }
      }

      return `
        <div class="category-card"
             style="--card-accent:${cfg.color}"
             onclick="app.pickCategory('${this._esc(cat)}')"
             tabindex="0"
             onkeydown="if(event.key==='Enter')app.pickCategory('${this._esc(cat)}')"
             role="button" aria-label="${displayName}, ${count} questions">
          <div class="cat-icon" style="background:${cfg.color}1a;color:${cfg.color}">${cfg.icon}</div>
          <h3>${displayName}</h3>
          <span class="cat-badge" style="margin-top: 8px;">${subText}</span>
          ${progressBadge}
        </div>`;
    }).join('');
  },

  _esc: s => s.replace(/'/g, "\\'"),

  /* ── category screen ─────────────────────────────── */
  pickCategory(cat) {
    this.category = cat;
    this._updateCategoryScreen();
    this.navigateTo('category');
  },

  _updateCategoryScreen() {
    const cat   = this.category;
    const count = ALL_QUESTIONS.filter(q => q.category === cat).length;
    const sample = ALL_QUESTIONS.find(q => q.category === cat);
    const displayName = (this.lang === 'en' && sample?.category_en) ? sample.category_en : cat;
    const sub = this.lang === 'en' ? `${count} questions` : `共 ${count} 道題目`;
    document.getElementById('cat-screen-title').textContent = displayName;
    document.getElementById('cat-screen-sub').textContent = sub;
    this.applyLang();
  },

  /* ── session state ───────────────────────────────── */
  _saveQuizSession() {
    if (!this.quizQ || this.quizQ.length === 0 || this.quizIdx >= this.quizQ.length) return;
    const session = {
      category: this.category,
      quizQIds: this.quizQ.map(q => q.id || q.question_id || q.question),
      quizIdx: this.quizIdx,
      correct: this.correct,
      answered: this.answered,
      streak: this.streak,
      wrongAnswersIds: this.wrongAnswers.map(q => q.id || q.question_id || q.question),
      sessionXP: this.sessionXP
    };
    localStorage.setItem(`nc_session_${this.category}`, JSON.stringify(session));
  },
  _clearQuizSession() {
    localStorage.removeItem(`nc_session_${this.category}`);
  },
  _resumeSession(s) {
    const qMap = {};
    ALL_QUESTIONS.forEach(q => { qMap[String(q.id || q.question_id || q.question)] = q; });
    this.quizQ = s.quizQIds.map(id => qMap[String(id)]).filter(Boolean);
    this.quizIdx = s.quizIdx;
    this.correct = s.correct;
    this.answered = s.answered;
    this.streak = s.streak;
    this.answeredQ = false;
    this.wrongAnswers = s.wrongAnswersIds.map(id => qMap[String(id)]).filter(Boolean);
    this.sessionXP = s.sessionXP;

    this.navigateTo('quiz');
    this._renderQuestion();
  },

  /* ── quiz start ──────────────────────────────────── */
  startQuiz(onlyWrong = false) {
    const raw = localStorage.getItem(`nc_session_${this.category}`);
    if (!onlyWrong && raw) {
      try {
        const s = JSON.parse(raw);
        if (s.quizIdx > 0 && s.quizIdx < s.quizQIds.length) {
          if (confirm(this.lang === 'en' ? "Resume where you left off? (Cancel to start over)" : "有未完成的測驗進度。要繼續上一次的進度嗎？(按取消將重新開始)")) {
            this._resumeSession(s);
            return;
          }
        }
      } catch(e) {}
      this._clearQuizSession();
    }

    const pool = onlyWrong && this.wrongAnswers.length
      ? this.wrongAnswers.slice()
      : ALL_QUESTIONS.filter(q => q.category === this.category);

    this.quizQ = this._shuffle([...pool]);
    this.quizIdx = 0;
    this.correct = 0;
    this.answered = 0;
    this.streak = 0;
    this.answeredQ = false;
    this.wrongAnswers = [];
    this.sessionXP = 0;

    this.navigateTo('quiz');
    this._renderQuestion();
  },

  /* ── Smart Review quiz start ─────────────────────── */
  startSmartReview() {
    const tab = this._currentTab;
    let items = [];

    if (tab === 'hard')   items = Progress.getHardQuestions();
    if (tab === 'queue')  items = Progress.getReviewQueue();
    if (tab === 'recent') items = Progress.getRecentlyStudied();

    if (!items.length) {
      this.toast('No questions in this list!', 'ℹ️');
      return;
    }

    // Map IDs back to full question objects
    const qMap = {};
    ALL_QUESTIONS.forEach(q => { qMap[String(q.id || q.question_id || q.question)] = q; });

    const pool = items
      .map(item => qMap[String(item.id)] || ALL_QUESTIONS.find(q =>
        String(q.id) === String(item.id) || String(q.question_id) === String(item.id)
      ))
      .filter(Boolean);

    if (!pool.length) {
      this.toast('Could not match questions — try studying a category first!', 'ℹ️');
      return;
    }

    // Use the first question's category as context
    this.category = pool[0].category || '__SMART__';
    this.quizQ = this._shuffle([...pool]);
    this.quizIdx = 0;
    this.correct = 0;
    this.answered = 0;
    this.streak = 0;
    this.answeredQ = false;
    this.wrongAnswers = [];
    this.sessionXP = 0;

    this.navigateTo('quiz');
    this._renderQuestion();
    this.toast(`🎯 Smart Review — ${pool.length} questions`, '🎯', 'success');
  },

  /* ── ALL-IN-ONE mode ─────────────────────────────── */
  startAllQuestions(mode = 'quiz') {
    const allLabel = this.lang === 'en' ? 'All Questions' : '全部題目';
    this.category = '__ALL__';

    if (mode === 'review') {
      this.reviewIdx = 0;
      this.reviewMode = 'list';
      this.cardFlipped = false;
      document.getElementById('cat-screen-title').textContent = allLabel;
      document.getElementById('cat-screen-sub').textContent =
        this.lang === 'en'
          ? `${ALL_QUESTIONS.length} questions total`
          : `共 ${ALL_QUESTIONS.length} 道題目`;
      this.navigateTo('review');
      this._buildReviewList(ALL_QUESTIONS);
      this._renderFlashcard(ALL_QUESTIONS);
    } else {
      const raw = localStorage.getItem(`nc_session_${this.category}`);
      if (raw) {
        try {
          const s = JSON.parse(raw);
          if (s.quizIdx > 0 && s.quizIdx < s.quizQIds.length) {
            if (confirm(this.lang === 'en' ? "Resume where you left off? (Cancel to start over)" : "有未完成的測驗進度。要繼續上一次的進度嗎？(按取消將重新開始)")) {
              this._resumeSession(s);
              return;
            }
          }
        } catch(e) {}
        this._clearQuizSession();
      }

      this.quizQ = this._shuffle([...ALL_QUESTIONS]);
      this.quizIdx = 0;
      this.correct = 0;
      this.answered = 0;
      this.streak = 0;
      this.answeredQ = false;
      this.wrongAnswers = [];
      this.sessionXP = 0;
      this.navigateTo('quiz');
      this._renderQuestion();
    }
    this.toast(
      this.lang === 'en'
        ? `Starting all ${ALL_QUESTIONS.length} questions! 🚀`
        : `開始全部 ${ALL_QUESTIONS.length} 道題目！🚀`,
      '🚀', 'success'
    );
  },

  /* ── render question ─────────────────────────────── */
  _renderQuestion() {
    const q     = this.quizQ[this.quizIdx];
    const total = this.quizQ.length;
    const n     = this.quizIdx + 1;

    const card = document.getElementById('quiz-card');
    card.classList.remove('pop');
    void card.offsetWidth;
    card.classList.add('pop');

    document.getElementById('quiz-q-label').textContent = `${n} / ${total}`;
    document.getElementById('quiz-progress-fill').style.width = `${(n / total) * 100}%`;
    document.getElementById('pill-correct').textContent = this.correct;
    document.getElementById('pill-total').textContent = this.answered;
    document.getElementById('q-number').textContent = `Q${n}`;
    document.getElementById('q-text').textContent = this._t(q, 'question');

    const imgWrap = document.getElementById('q-image-wrap');
    if (q.imageContext || q.imagePath) {
      imgWrap.classList.remove('hidden');
      document.getElementById('q-image-ph').innerHTML = q.imagePath
        ? `<img src="${q.imagePath}" alt="${q.imageContext || 'Diagram'}">`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> Image: ${q.imageContext}`;
    } else {
      imgWrap.classList.add('hidden');
    }

    const labels = ['A','B','C','D'];
    const keys   = ['1','2','3','4'];
    const opts   = this._t(q, 'options');
    document.getElementById('options-grid').innerHTML = opts.map((opt, i) => `
      <button class="option-btn" id="opt-${i}"
              onclick="app.pick(${i})"
              data-idx="${i}">
        <span class="opt-label">${labels[i]}</span>
        <span class="opt-text">${opt}</span>
        <span class="opt-key">${keys[i]}</span>
      </button>`).join('');

    document.getElementById('explanation-box').classList.add('hidden');

    const btnNext = document.getElementById('btn-next');
    btnNext.disabled = true;
    btnNext.childNodes[0].textContent = n < total ? this._s('btn_next') : this._s('btn_finish');

    this._updateStreak();
    this.answeredQ = false;
    this._startTimer();
  },

  /* ── timer ───────────────────────────────────────── */
  _startTimer() {
    clearInterval(this.timerHandle);
    this.timerSec = 30;
    this._renderTimer();
    this.timerHandle = setInterval(() => {
      this.timerSec--;
      this._renderTimer();
      if (this.timerSec <= 0) {
        clearInterval(this.timerHandle);
        if (!this.answeredQ) {
          this.toast(this._s('timer_out'), '⏰', 'error');
          this._autoReveal();
        }
      }
    }, 1000);
  },

  _renderTimer() {
    const el      = document.getElementById('quiz-timer');
    const display = document.getElementById('timer-display');
    if (!el || !display) return;
    display.textContent = this.timerSec;
    el.classList.toggle('warning', this.timerSec <= 8);
  },

  _autoReveal() {
    if (this.answeredQ) return;
    const q = this.quizQ[this.quizIdx];
    this.answeredQ = true;
    this.answered++;
    this.streak = 0;
    this.wrongAnswers.push(q);
    document.querySelectorAll('.option-btn').forEach((btn, i) => {
      btn.classList.add('locked');
      if (i === q.answer) btn.classList.add('correct');
    });
    if (q.explanation) {
      document.getElementById('expl-text').textContent = this._t(q, 'explanation');
      document.getElementById('explanation-box').classList.remove('hidden');
    }
    document.getElementById('btn-next').disabled = false;
    document.getElementById('pill-total').textContent = this.answered;
    this._updateStreak();

    // Save progress — timed out = wrong
    const qId = String(q.id || q.question_id || this.quizIdx);
    Progress.saveAnswer(qId, false, q.category, this.streak);
  },

  /* ── pick answer ─────────────────────────────────── */
  async pick(idx) {
    if (this.answeredQ) return;
    this.answeredQ = true;
    clearInterval(this.timerHandle);
    this.answered++;

    const q         = this.quizQ[this.quizIdx];
    const isCorrect = idx === q.answer;

    if (isCorrect) {
      this.correct++;
      this.streak++;
      if (this.streak > this.bestStreak) this.bestStreak = this.streak;
      this.toast(this._correctMsg(), '✓', 'success');
    } else {
      this.streak = 0;
      this.wrongAnswers.push(q);
      this.toast(this.lang === 'en' ? 'Incorrect — see explanation' : '不正確，請看解析', '✗', 'error');
    }

    // Style options
    document.querySelectorAll('.option-btn').forEach((btn, i) => {
      btn.classList.add('locked');
      if (i === q.answer) btn.classList.add('correct');
      if (i === idx && !isCorrect) btn.classList.add('incorrect');
    });

    // Explanation
    if (q.explanation) {
      document.getElementById('expl-text').textContent = this._t(q, 'explanation');
      document.getElementById('explanation-box').classList.remove('hidden');
    }

    document.getElementById('pill-correct').textContent = this.correct;
    document.getElementById('pill-total').textContent = this.answered;
    document.getElementById('btn-next').disabled = false;
    this._updateStreak();

    // ── Save progress & show XP float ─────────────────
    const qId = String(q.id || q.question_id || this.quizIdx);
    try {
      const result = await Progress.saveAnswer(qId, isCorrect, q.category, this.streak);
      if (result && result.xpGained > 0) {
        this.sessionXP += result.xpGained;
        this._showXPFloat(result.xpGained, idx);
        // Update nav bar
        const updatedUser = Auth.currentUser();
        if (updatedUser) this._updateNavUserBar(updatedUser);
      }
    } catch (e) {
      console.warn('Progress save error:', e.message);
    }
  },

  /* ── XP Float popup ──────────────────────────────── */
  _showXPFloat(amount, optIdx) {
    const btn = document.getElementById(`opt-${optIdx}`);
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const el   = document.createElement('div');
    el.className   = 'xp-float';
    el.textContent = `+${amount} XP`;
    el.style.left  = `${rect.left + rect.width / 2 - 30}px`;
    el.style.top   = `${rect.top + window.scrollY - 10}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  },

  _correctMsg() {
    const msgs = this.lang === 'en'
      ? ['Correct!', 'Well done!', 'Perfect!', 'Great job!', 'Keep it up!']
      : ['正確！','太棒了！','完美！','答對了！','繼續保持！'];
    if (this.streak >= 3) return `🔥 ${this.streak} ${this.lang === 'en' ? 'streak!' : '連勝！'}`;
    return msgs[Math.floor(Math.random() * msgs.length)];
  },

  _updateStreak() {
    const badge = document.getElementById('streak-badge');
    if (!badge) return;
    if (this.streak >= 2) {
      const label = this.lang === 'en' ? 'streak' : '連勝';
      badge.textContent = `🔥 ${this.streak} ${label}`;
      badge.classList.add('show');
    } else {
      badge.classList.remove('show');
    }
  },

  /* ── next question ───────────────────────────────── */
  nextQuestion() {
    clearInterval(this.timerHandle);
    this.quizIdx++;
    this._saveQuizSession();
    if (this.quizIdx >= this.quizQ.length) {
      this._clearQuizSession();
      this._showResults();
    } else {
      this._renderQuestion();
    }
  },

  exitQuiz() {
    clearInterval(this.timerHandle);
    if (this.answered > 0 && this.quizIdx < this.quizQ.length) {
      const msg = this.lang === 'en' ? 'Exit quiz?' : '確定要結束測驗嗎？';
      if (!confirm(msg)) return;
    }
    this.navigateTo(this.category === '__ALL__' || this.category === '__SMART__' ? 'dashboard' : 'category');
  },

  /* ── results ─────────────────────────────────────── */
  _showResults() {
    clearInterval(this.timerHandle);
    const total = this.quizQ.length;
    const pct   = Math.round((this.correct / total) * 100);

    let emoji, title, gradeClass, gradeText;
    if (pct >= 80) { emoji='🎉'; title='太棒了！'; gradeClass='grade-a'; gradeText='優秀'; }
    else if (pct >= 60) { emoji='👍'; title='不錯哦！'; gradeClass='grade-b'; gradeText='良好'; }
    else { emoji='💪'; title='繼續加油！'; gradeClass='grade-c'; gradeText='需加強'; }

    document.getElementById('res-emoji').textContent = emoji;
    document.getElementById('res-title').textContent = title;
    document.getElementById('res-grade').className = `grade-band ${gradeClass}`;
    document.getElementById('res-grade').innerHTML = `<span>${gradeText}</span><span>${pct}%</span>`;
    document.getElementById('res-pct').textContent = `${pct}%`;
    document.getElementById('stat-correct').textContent = this.correct;
    document.getElementById('stat-incorrect').textContent = total - this.correct;
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-streak').textContent = this.bestStreak;

    // XP session display
    const xpSection = document.getElementById('res-xp-gained');
    const xpNum     = document.getElementById('res-xp-num');
    if (xpSection && xpNum && this.sessionXP > 0) {
      xpNum.textContent = this.sessionXP;
      xpSection.classList.remove('hidden');
    } else if (xpSection) {
      xpSection.classList.add('hidden');
    }

    const retryWrong = document.getElementById('btn-retry-wrong');
    if (retryWrong) {
      retryWrong.style.display = this.wrongAnswers.length ? 'inline-flex' : 'none';
      retryWrong.textContent = `重練錯題 (${this.wrongAnswers.length})`;
    }

    this.navigateTo('results');

    const circ   = 2 * Math.PI * 52.4;
    const offset = circ - (pct / 100) * circ;
    const ring   = document.getElementById('ring-fill');
    ring.style.strokeDasharray  = circ;
    ring.style.strokeDashoffset = circ;
    ring.style.stroke = pct >= 80 ? 'var(--correct)' : pct >= 60 ? 'var(--gold)' : 'var(--accent)';
    setTimeout(() => { ring.style.strokeDashoffset = offset; }, 120);

    if (pct >= 80) this._confetti();

    // Refresh dashboard
    this.buildDashboard();
    // Refresh nav bar
    const user = Auth.currentUser();
    if (user) this._updateNavUserBar(user);
  },

  /* ── review ──────────────────────────────────────── */
  startReview() {
    this.reviewIdx  = 0;
    this.cardFlipped = false;
    const questions = ALL_QUESTIONS.filter(q => q.category === this.category);
    document.getElementById('review-title').textContent = this.category;
    this._buildReviewList(questions);
    this._renderFlashcard(questions);
    this.setReviewMode(this.reviewMode);
    this.navigateTo('review');
  },

  setReviewMode(mode) {
    this.reviewMode = mode;
    document.getElementById('btn-view-list').classList.toggle('active', mode === 'list');
    document.getElementById('btn-view-card').classList.toggle('active', mode === 'card');
    document.getElementById('review-list').classList.toggle('hidden', mode !== 'list');
    document.getElementById('fc-wrap').classList.toggle('hidden', mode !== 'card');
  },

  _buildReviewList(questions) {
    const labels = ['A','B','C','D'];
    document.getElementById('review-list').innerHTML = questions.map((q, qi) => `
      <div class="review-item">
        <span class="ri-num">Q${qi + 1}</span>
        ${(q.imageContext || q.imagePath) ? `
          <div class="q-image-wrap">
            <div class="image-placeholder">${q.imagePath ? `<img src="${q.imagePath}" alt="">` : `🖼 Image: ${q.imageContext}`}</div>
          </div>` : ''}
        <p class="ri-question">${this._t(q, 'question')}</p>
        <div class="ri-options">
          ${this._t(q, 'options').map((opt, i) => `
            <div class="ri-opt ${i === q.answer ? 'correct' : ''}">
              <span class="ri-opt-label">${labels[i]}</span>
              <span>${opt}</span>
            </div>`).join('')}
        </div>
        ${q.explanation ? `<div class="ri-expl">💡 ${this._t(q, 'explanation')}</div>` : ''}
      </div>`).join('');
  },

  _renderFlashcard(questions) {
    if (!questions) questions = ALL_QUESTIONS.filter(q => q.category === this.category);
    if (!questions.length) return;
    const q = questions[this.reviewIdx];
    const labels = ['A','B','C','D'];

    document.getElementById('fc-num').textContent = `Q${this.reviewIdx + 1}`;
    document.getElementById('fc-counter').textContent = `${this.reviewIdx + 1} / ${questions.length}`;
    document.getElementById('fc-question').textContent = q.question;

    const imgWrap = document.getElementById('fc-image-wrap');
    if (q.imageContext || q.imagePath) {
      imgWrap.classList.remove('hidden');
      document.getElementById('fc-image-ph').innerHTML = q.imagePath
        ? `<img src="${q.imagePath}" alt="">` : `🖼 Image: ${q.imageContext}`;
    } else { imgWrap.classList.add('hidden'); }

    document.getElementById('fc-opts').innerHTML = q.options.map((opt, i) => `
      <div class="ri-opt ${i === q.answer ? 'correct' : ''}">
        <span class="ri-opt-label">${labels[i]}</span>
        <span>${opt}</span>
      </div>`).join('');

    document.getElementById('fc-expl').textContent = q.explanation || '';

    const fc = document.getElementById('flashcard');
    fc.classList.remove('flipped');
    this.cardFlipped = false;

    document.getElementById('btn-fc-prev').disabled = this.reviewIdx === 0;
    document.getElementById('btn-fc-next').disabled = this.reviewIdx === questions.length - 1;
  },

  flipCard() {
    this.cardFlipped = !this.cardFlipped;
    document.getElementById('flashcard').classList.toggle('flipped', this.cardFlipped);
  },

  nextCard() {
    const questions = ALL_QUESTIONS.filter(q => q.category === this.category);
    if (this.reviewIdx < questions.length - 1) { this.reviewIdx++; this._renderFlashcard(questions); }
  },

  prevCard() {
    if (this.reviewIdx > 0) {
      this.reviewIdx--;
      this._renderFlashcard(ALL_QUESTIONS.filter(q => q.category === this.category));
    }
  },

  /* ── Smart Review ────────────────────────────────── */
  _buildSmartReview() {
    const hardItems   = Progress.getHardQuestions();
    const queueItems  = Progress.getReviewQueue();
    const recentItems = Progress.getRecentlyStudied();

    document.getElementById('sr-count-hard').textContent   = hardItems.length;
    document.getElementById('sr-count-queue').textContent  = queueItems.length;
    document.getElementById('sr-count-recent').textContent = recentItems.length;

    this.switchReviewTab(this._currentTab || 'hard');
  },

  switchReviewTab(tab) {
    this._currentTab = tab;

    // Update tab styles
    ['hard','queue','recent'].forEach(t => {
      document.getElementById(`sr-tab-${t}`)?.classList.toggle('active', t === tab);
    });

    let items = [];
    if (tab === 'hard')   items = Progress.getHardQuestions();
    if (tab === 'queue')  items = Progress.getReviewQueue();
    if (tab === 'recent') items = Progress.getRecentlyStudied();

    const content = document.getElementById('sr-content');
    if (!content) return;

    if (!items.length) {
      content.innerHTML = `<div class="sr-empty">
        ${tab === 'hard'   ? '🎉 No hard questions yet — keep studying!' : ''}
        ${tab === 'queue'  ? '✅ No questions in your review queue — great job!' : ''}
        ${tab === 'recent' ? '📚 You haven\'t studied anything yet — start a category!' : ''}
      </div>`;
      return;
    }

    // Map IDs to full question objects for display
    const qMap = {};
    ALL_QUESTIONS.forEach(q => { qMap[String(q.id || q.question_id || q.question)] = q; });

    content.innerHTML = items.slice(0, 30).map(item => {
      const q = qMap[String(item.id)] || ALL_QUESTIONS.find(q =>
        String(q.id) === String(item.id) || String(q.question_id) === String(item.id)
      );
      const text     = q ? q.question : `Question #${item.id}`;
      const category = item.category || (q && q.category) || '—';

      const wrongBadge   = item.wrongCount   ? `<span class="sr-wrong-badge">❌ ${item.wrongCount} wrong</span>` : '';
      const correctBadge = item.correctCount ? `<span class="sr-correct-badge">✅ ${item.correctCount} correct</span>` : '';

      return `
        <div class="sr-question-card">
          <div class="sr-card-text">${text}</div>
          <div class="sr-card-footer">
            <span class="sr-cat-tag">${category}</span>
            ${wrongBadge}
            ${correctBadge}
          </div>
        </div>`;
    }).join('');
  },

  /* ── keyboard shortcuts ──────────────────────────── */
  bindGlobal() {
    document.addEventListener('keydown', e => {
      if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;

      /* Quiz view */
      if (this.view === 'quiz') {
        const keyMap = { '1':0,'2':1,'3':2,'4':3,'a':0,'b':1,'c':2,'d':3 };
        const kl = e.key.toLowerCase();
        if (kl in keyMap && !this.answeredQ) {
          e.preventDefault();
          this.pick(keyMap[kl]);
        }
        if ((e.key === 'ArrowRight' || e.key === 'Enter') && this.answeredQ) {
          e.preventDefault();
          const btn = document.getElementById('btn-next');
          if (!btn.disabled) this.nextQuestion();
        }
        if (e.key === 'Escape') this.exitQuiz();
      }

      /* Review / flashcard */
      if (this.view === 'review' && this.reviewMode === 'card') {
        if (e.key === 'ArrowRight') { e.preventDefault(); this.nextCard(); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); this.prevCard(); }
        if (e.key === ' ')          { e.preventDefault(); this.flipCard(); }
      }

      /* Dashboard */
      if (this.view === 'dashboard' && e.key === '/') {
        e.preventDefault();
        this.focusSearch();
      }
    });
  },

  /* ── focus search ────────────────────────────────── */
  focusSearch() {
    if (this.view !== 'dashboard') {
      this.navigateTo('dashboard');
      setTimeout(() => {
        const si = document.getElementById('search-input');
        if (si) { si.focus(); si.select(); si.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      }, 120);
    } else {
      const si = document.getElementById('search-input');
      if (si) { si.focus(); si.select(); si.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }
  },

  /* ── toast notifications ─────────────────────────── */
  toast(msg, icon = 'ℹ️', type = '') {
    const container = document.getElementById('toasts');
    if (!container) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
    container.appendChild(t);
    setTimeout(() => {
      t.classList.add('out');
      setTimeout(() => t.remove(), 280);
    }, 2600);
  },

  /* ── confetti ────────────────────────────────────── */
  _confetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#c4334a','#8b1a2a','#e05070','#ffd580','#ffffff','#ff9999'];
    const particles = Array.from({length: 120}, () => ({
      x: Math.random() * canvas.width,
      y: -10,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      angle: Math.random() * 360,
      spin: (Math.random() - 0.5) * 8,
    }));

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        p.angle += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - frame / 160);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      frame++;
      if (frame < 180) requestAnimationFrame(animate);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    animate();
  },

  /* ── utilities ───────────────────────────────────── */
  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },
};

document.addEventListener('DOMContentLoaded', () => app.init());
