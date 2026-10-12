(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function store(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }

  /* ---------- Language ---------- */
  var titles = { pt: 'Iure Rosa — Senior Product Owner', en: 'Iure Rosa — Senior Product Owner' };
  function setLang(lang) {
    root.dataset.lang = lang;
    root.lang = lang === 'en' ? 'en' : 'pt-BR';
    document.title = titles[lang];
    store('lang', lang);
  }
  document.getElementById('langToggle').addEventListener('click', function () {
    setLang(root.dataset.lang === 'en' ? 'pt' : 'en');
  });

  /* ---------- Theme ---------- */
  function currentTheme() {
    if (root.dataset.theme) return root.dataset.theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function syncThemeColor() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = getComputedStyle(root).getPropertyValue('--bg').trim();
  }
  document.getElementById('themeToggle').addEventListener('click', function () {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    store('theme', next);
    syncThemeColor();
  });
  syncThemeColor();

  /* ---------- Nav state ---------- */
  var nav = document.querySelector('.nav');
  function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__links a'));
  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) {
      var target = document.querySelector(a.getAttribute('href'));
      if (target) sectionObserver.observe(target);
    });

    /* ---------- Reveal on scroll ---------- */
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(function (el, i) {
      el.style.transitionDelay = (el.closest('.hero') ? i * 90 : 0) + 'ms';
      revealObserver.observe(el);
    });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Copy email ---------- */
  var toast = document.getElementById('toast');
  var toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-on'); }, 1800);
  }
  document.getElementById('copyMail').addEventListener('click', function () {
    var email = 'iurengineer@gmail.com';
    var done = function () { showToast(root.dataset.lang === 'en' ? 'Email copied' : 'E-mail copiado'); };
    if (navigator.clipboard) navigator.clipboard.writeText(email).then(done, function () {});
  });

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Character level: one level per year since engineering school (2017) ---------- */
  var lvEl = document.getElementById('lv');
  var level = new Date().getFullYear() - 2017;
  if (lvEl) lvEl.textContent = level;

  /* ---------- Konami code easter egg ---------- */
  var konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  var konamiPos = 0;
  document.addEventListener('keydown', function (e) {
    var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    konamiPos = key === konami[konamiPos] ? konamiPos + 1 : (key === konami[0] ? 1 : 0);
    if (konamiPos < konami.length) return;
    konamiPos = 0;
    level += 1;
    if (lvEl) lvEl.textContent = level;
    var sheet = document.getElementById('sheet');
    if (sheet) { sheet.classList.remove('is-leveled'); void sheet.offsetWidth; sheet.classList.add('is-leveled'); }
    if (!reduceMotion) {
      var banner = document.createElement('div');
      banner.className = 'levelup';
      banner.setAttribute('aria-hidden', 'true');
      banner.textContent = 'LEVEL UP!';
      document.body.appendChild(banner);
      setTimeout(function () { banner.remove(); }, 1900);
    }
    showToast((root.dataset.lang === 'en' ? 'Level up! Now LV ' : 'Subiu de nível! Agora LV ') + level + ' ★');
  });

  /* ---------- Path planner animation ---------- */
  var canvas = document.getElementById('planner');
  var statusEl = document.getElementById('plannerStatus');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var COLS = 16, ROWS = 12;
  var state = null, cell = 0, ox = 0, oy = 0, W = 0, H = 0;

  function css(name) { return getComputedStyle(canvas).getPropertyValue(name).trim(); }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var pad = 22;
    cell = Math.min((W - pad * 2) / COLS, (H - pad * 2) / ROWS);
    ox = (W - cell * COLS) / 2;
    oy = (H - cell * ROWS) / 2;
  }

  function makeWorld() {
    for (var attempt = 0; attempt < 50; attempt++) {
      var walls = [];
      for (var y = 0; y < ROWS; y++) {
        walls.push([]);
        for (var x = 0; x < COLS; x++) walls[y].push(Math.random() < 0.26);
      }
      var start = { x: 0, y: ROWS - 1 }, goal = { x: COLS - 1, y: 0 };
      walls[start.y][start.x] = false;
      walls[goal.y][goal.x] = false;
      var result = astar(walls, start, goal);
      if (result.path && result.path.length > COLS) {
        return { walls: walls, start: start, goal: goal, explored: result.explored, path: result.path };
      }
    }
    return null;
  }

  function astar(walls, s, g) {
    var key = function (p) { return p.y * COLS + p.x; };
    var h = function (p) { return Math.abs(p.x - g.x) + Math.abs(p.y - g.y); };
    var open = [{ x: s.x, y: s.y, g: 0, f: h(s) }];
    var came = {}, cost = {}, closed = {}, explored = [];
    cost[key(s)] = 0;
    while (open.length) {
      open.sort(function (a, b) { return a.f - b.f || b.g - a.g; });
      var cur = open.shift();
      var k = key(cur);
      if (closed[k]) continue;
      closed[k] = true;
      explored.push({ x: cur.x, y: cur.y });
      if (cur.x === g.x && cur.y === g.y) {
        var path = [{ x: cur.x, y: cur.y }], ck = k;
        while (came[ck] !== undefined) {
          ck = came[ck];
          path.unshift({ x: ck % COLS, y: Math.floor(ck / COLS) });
        }
        return { path: path, explored: explored };
      }
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
        var nx = cur.x + d[0], ny = cur.y + d[1];
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || walls[ny][nx]) return;
        var nk = ny * COLS + nx, ng = cur.g + 1;
        if (cost[nk] === undefined || ng < cost[nk]) {
          cost[nk] = ng; came[nk] = k;
          open.push({ x: nx, y: ny, g: ng, f: ng + h({ x: nx, y: ny }) });
        }
      });
    }
    return { path: null, explored: explored };
  }

  function center(p) { return { x: ox + (p.x + 0.5) * cell, y: oy + (p.y + 0.5) * cell }; }


  function draw(exploredCount, pathProgress) {
    var c = { grid: css('--grid'), wall: css('--wall'), explored: css('--explored'), accent: css('--accent'), surface: css('--surface'), xp: css('--xp'), hp: css('--hp') };
    ctx.clearRect(0, 0, W, H);
    var s = state;

    // grid dots
    ctx.fillStyle = c.grid;
    for (var y = 0; y <= ROWS; y++) for (var x = 0; x <= COLS; x++) {
      ctx.beginPath(); ctx.arc(ox + x * cell, oy + y * cell, 1.1, 0, Math.PI * 2); ctx.fill();
    }
    // explored cells
    ctx.fillStyle = c.explored;
    for (var i = 0; i < Math.min(exploredCount, s.explored.length); i++) {
      var e = s.explored[i];
      ctx.fillRect(ox + e.x * cell + 1, oy + e.y * cell + 1, cell - 2, cell - 2);
    }
    // walls
    ctx.fillStyle = c.wall;
    for (y = 0; y < ROWS; y++) for (x = 0; x < COLS; x++) {
      if (s.walls[y][x]) { ctx.fillRect(ox + x * cell + 2, oy + y * cell + 2, cell - 4, cell - 4); }
    }
    // goal: treasure chest
    var gc = center(s.goal), gs = cell * 0.62;
    ctx.fillStyle = c.xp;
    ctx.fillRect(gc.x - gs / 2, gc.y - gs / 2.6, gs, gs / 1.3);
    ctx.fillStyle = c.wall;
    ctx.fillRect(gc.x - gs / 2, gc.y - gs / 12, gs, Math.max(1.5, gs / 9));
    ctx.fillRect(gc.x - gs / 10, gc.y - gs / 7, gs / 5, gs / 4);

    // path
    var robot = center(s.start);
    if (pathProgress > 0) {
      var segs = s.path.length - 1;
      var t = pathProgress * segs;
      ctx.strokeStyle = c.accent; ctx.lineWidth = 3; ctx.lineCap = 'square'; ctx.lineJoin = 'miter';
      ctx.beginPath();
      var p0 = center(s.path[0]); ctx.moveTo(p0.x, p0.y);
      for (var j = 1; j <= Math.floor(t) && j <= segs; j++) { var pj = center(s.path[j]); ctx.lineTo(pj.x, pj.y); }
      var fi = Math.min(Math.floor(t), segs - 1), frac = t - fi;
      var a = center(s.path[fi]), b = center(s.path[Math.min(fi + 1, segs)]);
      robot = { x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac };
      ctx.lineTo(robot.x, robot.y);
      ctx.stroke();
    }
    // hero
    var hs = cell * 0.6;
    ctx.fillStyle = c.hp;
    ctx.fillRect(robot.x - hs / 2, robot.y - hs / 2, hs, hs);
    ctx.fillStyle = c.surface;
    ctx.fillRect(robot.x - hs / 4, robot.y - hs / 4, hs / 2, hs / 2);
  }

  function setStatus(txt) { if (statusEl) statusEl.textContent = txt; }

  var phase = 'explore', phaseStart = 0, raf = 0, visible = true;
  var EXPLORE_MS = 1700, PATH_MS = 1900, HOLD_MS = 1600;

  function newEpisode(now) {
    state = makeWorld();
    phase = 'explore'; phaseStart = now;
    setStatus('exploring…');
  }

  function frame(now) {
    if (!state) newEpisode(now);
    var t = now - phaseStart;
    if (phase === 'explore') {
      var k = Math.min(1, t / EXPLORE_MS);
      draw(Math.ceil(k * state.explored.length), 0);
      if (k >= 1) { phase = 'path'; phaseStart = now; setStatus('path found · ' + (state.path.length - 1) + ' steps'); }
    } else if (phase === 'path') {
      var p = Math.min(1, t / PATH_MS);
      var eased = 1 - Math.pow(1 - p, 3);
      draw(state.explored.length, eased);
      if (p >= 1) { phase = 'hold'; phaseStart = now; setStatus('treasure found ✦'); }
    } else {
      draw(state.explored.length, 1);
      if (t >= HOLD_MS) newEpisode(now);
    }
    if (visible) raf = requestAnimationFrame(frame);
  }

  resize();
  if (reduceMotion) {
    state = makeWorld();
    draw(state.explored.length, 1);
    setStatus('path found · ' + (state.path.length - 1) + ' steps');
  } else {
    raf = requestAnimationFrame(frame);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var wasVisible = visible;
        visible = entries[0].isIntersecting;
        if (visible && !wasVisible) { phaseStart = performance.now(); raf = requestAnimationFrame(frame); }
        if (!visible) cancelAnimationFrame(raf);
      }).observe(canvas);
    }
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resize();
      if (reduceMotion && state) draw(state.explored.length, 1);
    }, 120);
  });

  // Redraw static frame when theme changes under reduced motion
  document.getElementById('themeToggle').addEventListener('click', function () {
    if (reduceMotion && state) draw(state.explored.length, 1);
  });
})();
