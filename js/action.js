/* Lavka Action — 112, перестрелка и поездка на скорой */
(function () {
  'use strict';

  function phone() { return document.getElementById('phone'); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function make(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function open(cls) {
    var host = phone();
    if (!host) return null;
    var box = make('div', 'act ' + cls);
    host.appendChild(box);
    return box;
  }

  function bust(box) {
    if (box && box.parentNode) box.parentNode.removeChild(box);
  }

  // ============================================================
  // 112 · ВЫБОР СЛУЖБЫ
  // ============================================================
  function call112(opts) {
    opts = opts || {};
    var box = open('act112');
    if (!box) return;
    var address = opts.address || 'Тверская, 12 · Лавка';
    var done = false;

    box.innerHTML =
      '<div class="act-top dark"><button class="act-x" type="button" aria-label="Закрыть"><i class="fa-solid fa-xmark"></i></button>' +
      '<div><b>Экстренный вызов</b><span>единый номер · 112</span></div><span class="act-live">LIVE</span></div>' +
      '<div class="a112-body">' +
      '<div class="a112-num"><span>11</span><span>2</span></div>' +
      '<p class="a112-hint">Выберите службу. Диспетчер ответит сразу.</p>' +
      '<div class="a112-grid">' +
      '<button class="a112-s" type="button" data-s="police"><i class="fa-solid fa-shield-halved"></i><b>Полиция</b><small>102</small></button>' +
      '<button class="a112-s med" type="button" data-s="ambulance"><i class="fa-solid fa-truck-medical"></i><b>Скорая</b><small>103</small></button>' +
      '<button class="a112-s" type="button" data-s="fire"><i class="fa-solid fa-fire-extinguisher"></i><b>Пожарная</b><small>104</small></button>' +
      '</div><div class="a112-log" id="a112-log"><p class="a112-note"><i class="fa-solid fa-location-dot"></i> Адрес определён: ' + address + '</p></div>' +
      '</div>';

    var log = box.querySelector('#a112-log');
    box.querySelector('.act-x').onclick = function () { close(); };

    function close() {
      if (box._timer) clearInterval(box._timer);
      bust(box);
      if (opts.onExit) opts.onExit();
    }

    function add(html) {
      var n = make('div', 'a112-card', html);
      log.appendChild(n);
      log.scrollTop = log.scrollHeight;
      return n;
    }

    box.querySelectorAll('.a112-s').forEach(function (btn) {
      btn.onclick = function () {
        var s = btn.getAttribute('data-s');
        if (s !== 'ambulance') {
          add('<b>' + (s === 'police' ? 'Полиция · 102' : 'Пожарная · 104') + '</b>' +
            '<p>Диспетчер: это не медицинская служба. Для раненого нужна скорая — нажмите 103.</p>');
          return;
        }
        box.querySelectorAll('.a112-s').forEach(function (b) { b.disabled = true; });
        add('<b>Скорая · 103</b>' +
          '<p>Диспетчер: что случилось?</p>' +
          '<p class="a112-q">— Огнестрельное ранение. Мужчина, около 30 лет. Кровотечение, в сознании, но слабеет.</p>' +
          '<p>Диспетчер: адрес — ' + address + '. Подтверждаете?</p>' +
          '<button class="a112-send" type="button">Подтвердить вызов</button>');
        var send = log.querySelector('.a112-send');
        send.onclick = function () {
          send.disabled = true;
          send.textContent = 'Вызов принят';
          add('<div class="a112-eta"><b>Бригада №7 выехала</b><span>Скорая уже в пути. Не оставляйте пострадавшего одного.</span>' +
            '<div class="a112-bar"><i></i></div><small id="a112-eta">Ожидание · 0:12</small></div>');
          var left = 4;
          var eta = box.querySelector('#a112-eta');
          box._timer = setInterval(function () {
            left--;
            if (left <= 0) {
              clearInterval(box._timer);
              box._timer = null;
              if (eta) eta.textContent = 'Скорая у входа';
              var go = add('<b class="a112-ok">Бригада на месте</b><p>Фельдшер ждёт у машины. Нужно ехать немедленно.</p>' +
                '<button class="a112-send go" type="button">К машине</button>');
              go.querySelector('.a112-send').onclick = function () {
                if (done) return;
                done = true;
                bust(box);
                if (opts.onDone) opts.onDone();
              };
            } else if (eta) {
              eta.textContent = 'Ожидание · 0:0' + left;
            }
          }, 1000);
        };
      };
    });
  }

  // ============================================================
  // ОБЩИЙ ДВИЖОК АРЕНЫ
  // ============================================================
  var SCENES = {
    shop: {
      title: 'Оборона точки',
      sub: 'План магазина · вид сверху',
      floor: '#eef6ea',
      wall: '#b9cbb2',
      shelf: '#8fb07f',
      shelfEdge: '#6f9560',
      counter: '#b08968',
      obstacles: [
        [26, 84, 104, 24], [26, 132, 104, 24], [26, 182, 58, 96],
        [230, 84, 104, 24], [230, 132, 104, 24], [276, 182, 58, 96],
        [26, 316, 104, 24], [230, 316, 104, 24],
        [26, 402, 74, 26], [260, 402, 74, 26]
      ]
    },
    lombard: {
      title: 'Оборона ломбарда',
      sub: 'Зал залогов · вид сверху',
      floor: '#f4f0e6',
      wall: '#cfc7b4',
      shelf: '#b9a97f',
      shelfEdge: '#94845f',
      counter: '#8d7a54',
      obstacles: [
        [28, 96, 82, 82], [250, 96, 82, 82],
        [28, 236, 104, 24], [228, 236, 104, 24],
        [28, 356, 82, 24], [250, 356, 82, 24],
        [140, 400, 80, 30]
      ]
    },
    port: {
      title: 'Порт «Северный»',
      sub: 'Складские контейнеры · вид сверху',
      floor: '#e8eef0',
      wall: '#aebec4',
      shelf: '#8aa0a8',
      shelfEdge: '#678089',
      counter: '#c2763f',
      obstacles: [
        [24, 90, 110, 54], [226, 90, 110, 54],
        [24, 176, 110, 54], [226, 176, 110, 54],
        [120, 276, 120, 46],
        [24, 360, 84, 50], [252, 360, 84, 50]
      ]
    }
  };

  var ARENA_LOOKS = [
    { floor: '#eef6ea', wall: '#b9cbb2', shelf: '#8fb07f', shelfEdge: '#6f9560', counter: '#b08968' },
    { floor: '#f3ece1', wall: '#c7b8a2', shelf: '#a88f6c', shelfEdge: '#806a4d', counter: '#9a6138' },
    { floor: '#e8eef5', wall: '#a9b9ca', shelf: '#8499b1', shelfEdge: '#637a94', counter: '#8b6448' },
    { floor: '#f1e9ee', wall: '#c4b0bc', shelf: '#a98799', shelfEdge: '#806173', counter: '#9c5e57' }
  ];
  var ARENA_DISTRICTS = ['Центр', 'Заречье', 'Складской район', 'Спальный', 'Порт', 'Вокзал'];

  function arenaVariant(base) {
    var sc = JSON.parse(JSON.stringify(base));
    var look = ARENA_LOOKS[Math.floor(Math.random() * ARENA_LOOKS.length)];
    Object.keys(look).forEach(function (k) { sc[k] = look[k]; });
    sc.sub = base.sub + ' · ' + ARENA_DISTRICTS[Math.floor(Math.random() * ARENA_DISTRICTS.length)];
    sc.obstacles = sc.obstacles.map(function (b) {
      var x = Math.max(12, Math.min(348 - b[2], b[0] + (Math.random() * 18 - 9)));
      var y = Math.max(70, Math.min(492 - b[3], b[1] + (Math.random() * 18 - 9)));
      var w = Math.max(28, b[2] + (Math.random() * 14 - 7));
      var h = Math.max(20, b[3] + (Math.random() * 12 - 6));
      return [Math.round(x), Math.round(y), Math.round(w), Math.round(h)];
    });
    var crates = 1 + Math.floor(Math.random() * 2);
    for (var i = 0; i < crates; i++) {
      var w = 36 + Math.round(Math.random() * 26);
      var h = 22 + Math.round(Math.random() * 18);
      var x = 24 + Math.round(Math.random() * (312 - w));
      var y = 270 + Math.round(Math.random() * 120);
      if (x < 230 && x + w > 130 && y > 380) continue;
      sc.obstacles.push([x, y, w, h]);
    }
    return sc;
  }

  function shooter(opts) {
    opts = opts || {};
    var sc = arenaVariant(SCENES[opts.scene] || SCENES.shop);
    var box = open('act-game act-shooter');
    if (!box) return;
    box.innerHTML =
      '<div class="act-top"><button class="act-x" type="button" aria-label="Выйти"><i class="fa-solid fa-xmark"></i></button>' +
      '<div><b>' + sc.title + '</b><span id="ag-sub">' + sc.sub + '</span></div><span class="ag-hp" id="ag-hp">100</span></div>' +
      '<div class="act-stage"><canvas id="ag-cv"></canvas>' +
      '<div class="ag-msg hidden" id="ag-msg"></div>' +
      '<div class="ag-dpad">' +
      '<button type="button" data-dir="up" aria-label="Вверх"><i class="fa-solid fa-chevron-up"></i></button>' +
      '<button type="button" data-dir="left" aria-label="Влево"><i class="fa-solid fa-chevron-left"></i></button>' +
      '<button type="button" data-dir="down" aria-label="Вниз"><i class="fa-solid fa-chevron-down"></i></button>' +
      '<button type="button" data-dir="right" aria-label="Вправо"><i class="fa-solid fa-chevron-right"></i></button>' +
      '</div>' +
      '<button class="ag-fire" id="ag-fire" type="button" aria-label="Огонь"><i class="fa-solid fa-crosshairs"></i></button>' +
      '</div>' +
      '<div class="ag-tip">WASD / стрелки — движение · тап по арене — выстрел</div>';

    var cv = box.querySelector('#ag-cv');
    var ctx = cv.getContext('2d');
    var W = 360, H = 520;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.scale(dpr, dpr);

    var hpEl = box.querySelector('#ag-hp');
    var subEl = box.querySelector('#ag-sub');
    var msgEl = box.querySelector('#ag-msg');
    var fireBtn = box.querySelector('#ag-fire');
    var keys = {};
    var dirs = {};
    var touch = { up: false, down: false, left: false, right: false };
    var raf = 0, last = 0, ended = false, shooting = false;
    var shots = [], ebullets = [], particles = [];
    var tick = 0;

    var player = { x: 180, y: 448, r: 12, hp: 100, aim: -Math.PI / 2, cool: 0, hurt: 0 };
    var wave = 1, waves = opts.waves || 2, perWave = opts.perWave || 4;
    var enemies = [], spawnLeft = perWave, spawnTimer = 0, waveBreak = 0;

    function blocked() { return sc.obstacles; }

    function circleRect(cx, cy, r, b) {
      var nx = clamp(cx, b[0], b[0] + b[2]);
      var ny = clamp(cy, b[1], b[1] + b[3]);
      var dx = cx - nx, dy = cy - ny;
      return dx * dx + dy * dy < r * r;
    }

    function resolve(node, r) {
      node.x = clamp(node.x, r + 8, W - r - 8);
      node.y = clamp(node.y, r + 8, H - r - 8);
      blocked().forEach(function (b) {
        if (!circleRect(node.x, node.y, r, b)) return;
        var left = node.x - b[0], right = b[0] + b[2] - node.x;
        var top = node.y - b[1], bottom = b[1] + b[3] - node.y;
        var m = Math.min(left, right, top, bottom);
        if (m === left) node.x = b[0] - r;
        else if (m === right) node.x = b[0] + b[2] + r;
        else if (m === top) node.y = b[1] - r;
        else node.y = b[1] + b[3] + r;
      });
    }

    function spawnEnemy() {
      if (spawnLeft <= 0) return;
      spawnLeft--;
      var x = 148 + Math.random() * 64;
      enemies.push({ x: x, y: H - 18, r: 12, hp: 3, speed: 38 + Math.random() * 16, cool: 0.7 + Math.random(), flash: 0, wob: Math.random() * 6 });
    }

    function shootAt(tx, ty) {
      if (player.cool > 0 || ended) return;
      var a = Math.atan2(ty - player.y, tx - player.x);
      player.aim = a;
      player.cool = 0.16;
      shots.push({ x: player.x + Math.cos(a) * 16, y: player.y + Math.sin(a) * 16, vx: Math.cos(a) * 430, vy: Math.sin(a) * 430, life: 1.2 });
    }

    function nearest() {
      var best = null, bd = 1e9;
      enemies.forEach(function (e) {
        var d = (e.x - player.x) * (e.x - player.x) + (e.y - player.y) * (e.y - player.y);
        if (d < bd) { bd = d; best = e; }
      });
      return best;
    }

    function canvasPoint(ev) {
      var r = cv.getBoundingClientRect();
      return { x: (ev.clientX - r.left) / r.width * W, y: (ev.clientY - r.top) / r.height * H };
    }

    cv.addEventListener('pointerdown', function (ev) {
      ev.preventDefault();
      if (ended) return;
      var p = canvasPoint(ev);
      shootAt(p.x, p.y);
    });

    fireBtn.addEventListener('pointerdown', function (ev) {
      ev.preventDefault();
      shooting = true;
      var e = nearest();
      if (e) shootAt(e.x, e.y);
    });
    fireBtn.addEventListener('pointerup', function () { shooting = false; });
    fireBtn.addEventListener('pointercancel', function () { shooting = false; });

    box.querySelectorAll('.ag-dpad button').forEach(function (b) {
      var d = b.getAttribute('data-dir');
      var on = function (ev) { ev.preventDefault(); touch[d] = true; };
      var off = function () { touch[d] = false; };
      b.addEventListener('pointerdown', on);
      b.addEventListener('pointerup', off);
      b.addEventListener('pointerleave', off);
      b.addEventListener('pointercancel', off);
    });

    function onKey(ev, down) {
      var k = ev.key;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].indexOf(k) < 0) return;
      ev.preventDefault();
      if (k === ' ') {
        if (down) {
          var e = nearest();
          if (e) shootAt(e.x, e.y);
        }
        return;
      }
      keys[k.toLowerCase()] = down;
    }
    var kd = function (ev) { onKey(ev, true); };
    var ku = function (ev) { onKey(ev, false); };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    function moveAxis() {
      var dx = 0, dy = 0;
      if (keys.a || keys.arrowleft || touch.left) dx -= 1;
      if (keys.d || keys.arrowright || touch.right) dx += 1;
      if (keys.w || keys.arrowup || touch.up) dy -= 1;
      if (keys.s || keys.arrowdown || touch.down) dy += 1;
      var l = Math.hypot(dx, dy) || 1;
      return { x: dx / l, y: dy / l };
    }

    function update(dt) {
      tick += dt;
      player.cool = Math.max(0, player.cool - dt);
      player.hurt = Math.max(0, player.hurt - dt);
      var m = moveAxis();
      player.x += m.x * 156 * dt;
      player.y += m.y * 156 * dt;
      resolve(player, player.r);

      if (shooting) {
        var e = nearest();
        if (e) shootAt(e.x, e.y);
      }

      if (spawnLeft > 0) {
        spawnTimer -= dt;
        if (spawnTimer <= 0) { spawnTimer = 0.85; spawnEnemy(); }
      }

      enemies.forEach(function (e) {
        var a = Math.atan2(player.y - e.y, player.x - e.x);
        e.x += Math.cos(a) * e.speed * dt;
        e.y += Math.sin(a) * e.speed * dt;
        e.x += Math.cos(tick * 1.7 + e.wob) * 8 * dt;
        resolve(e, e.r);
        e.cool -= dt;
        e.flash = Math.max(0, e.flash - dt);
        if (e.cool <= 0 && e.y < H - 30) {
          e.cool = 1.5 + Math.random() * 0.9;
          var ba = a + (Math.random() - 0.5) * 0.24;
          ebullets.push({ x: e.x, y: e.y, vx: Math.cos(ba) * 150, vy: Math.sin(ba) * 150, life: 3.4 });
        }
      });

      shots.forEach(function (s) {
        s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
        for (var i = enemies.length - 1; i >= 0; i--) {
          var e = enemies[i];
          if (Math.hypot(s.x - e.x, s.y - e.y) < e.r + 4) {
            e.hp--; e.flash = 0.12; s.life = 0;
            for (var k = 0; k < 5; k++) particles.push({ x: s.x, y: s.y, vx: (Math.random() - .5) * 130, vy: (Math.random() - .5) * 130, life: .3, c: '#ef4444' });
            if (e.hp <= 0) {
              enemies.splice(i, 1);
              for (var j = 0; j < 8; j++) particles.push({ x: e.x, y: e.y, vx: (Math.random() - .5) * 180, vy: (Math.random() - .5) * 180, life: .45, c: '#b91c1c' });
            }
            break;
          }
        }
        if (s.x < 0 || s.x > W || s.y < 0 || s.y > H) s.life = 0;
      });
      shots = shots.filter(function (s) { return s.life > 0; });

      ebullets.forEach(function (b) {
        b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
        if (Math.hypot(b.x - player.x, b.y - player.y) < player.r + 3) {
          b.life = 0;
          player.hp -= 7;
          player.hurt = 0.22;
          for (var i = 0; i < 6; i++) particles.push({ x: player.x, y: player.y, vx: (Math.random() - .5) * 140, vy: (Math.random() - .5) * 140, life: .35, c: '#dc2626' });
        }
      });
      ebullets = ebullets.filter(function (b) { return b.life > 0 && b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20; });

      particles.forEach(function (p) {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; p.life -= dt;
      });
      particles = particles.filter(function (p) { return p.life > 0; });

      hpEl.textContent = Math.max(0, Math.ceil(player.hp));
      hpEl.className = 'ag-hp' + (player.hp <= 35 ? ' low' : '');

      if (player.hp <= 0) { endGame(false); return; }

      if (!enemies.length && spawnLeft <= 0) {
        if (wave < waves) {
          waveBreak -= dt;
          if (waveBreak <= 0) {
            wave++; spawnLeft = perWave; spawnTimer = 0; waveBreak = 1.6;
            subEl.textContent = sc.sub + ' · волна ' + wave + '/' + waves;
            toastMsg('Волна ' + wave);
          }
        } else {
          endGame(true);
        }
      } else if (!enemies.length && spawnLeft > 0) {
        spawnTimer = Math.min(spawnTimer, 0.35);
      }
    }

    function toastMsg(text) {
      if (!text) return;
      msgEl.classList.remove('hidden');
      msgEl.innerHTML = '<b>' + text + '</b>';
      clearTimeout(toastMsg.t);
      toastMsg.t = setTimeout(function () { msgEl.classList.add('hidden'); }, 900);
    }

    function drawScene() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = sc.floor;
      ctx.fillRect(0, 0, W, H);
      // плитка
      ctx.strokeStyle = 'rgba(120,150,120,.12)';
      ctx.lineWidth = 1;
      for (var x = 0; x <= W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (var y = 0; y <= H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // дверной проём
      ctx.fillStyle = '#d9ead2';
      ctx.fillRect(148, H - 16, 64, 16);
      ctx.fillStyle = 'rgba(34,197,94,.25)';
      ctx.fillRect(148, H - 8, 64, 4);

      // стены
      ctx.fillStyle = sc.wall;
      ctx.fillRect(0, 0, W, 14);
      ctx.fillRect(0, 0, 14, H);
      ctx.fillRect(W - 14, 0, 14, H);
      ctx.fillRect(0, H - 14, 148, 14);
      ctx.fillRect(212, H - 14, W - 212, 14);
      ctx.strokeStyle = 'rgba(60,80,60,.16)';
      ctx.lineWidth = 2;
      ctx.strokeRect(7, 7, W - 14, H - 14);

      // препятствия
      sc.obstacles.forEach(function (b, i) {
        var isCounter = i >= sc.obstacles.length - 2 && b[3] <= 32;
        ctx.fillStyle = isCounter ? sc.counter : sc.shelf;
        roundRect(ctx, b[0], b[1], b[2], b[3], 7);
        ctx.fill();
        ctx.strokeStyle = isCounter ? 'rgba(80,60,30,.35)' : sc.shelfEdge;
        ctx.lineWidth = 2;
        roundRect(ctx, b[0], b[1], b[2], b[3], 7);
        ctx.stroke();
        if (!isCounter) {
          ctx.strokeStyle = 'rgba(255,255,255,.28)';
          ctx.lineWidth = 1.5;
          for (var sx = b[0] + 10; sx < b[0] + b[2] - 6; sx += 20) {
            ctx.beginPath(); ctx.moveTo(sx, b[1] + 5); ctx.lineTo(sx, b[1] + b[3] - 5); ctx.stroke();
          }
        }
      });

      // частицы
      particles.forEach(function (p) {
        ctx.globalAlpha = Math.max(0, p.life * 2.4);
        ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 7); ctx.fill();
      });
      ctx.globalAlpha = 1;

      // враги
      enemies.forEach(function (e) {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.fillStyle = 'rgba(0,0,0,.16)';
        ctx.beginPath(); ctx.ellipse(0, e.r + 5, e.r, 4, 0, 0, 7); ctx.fill();
        ctx.fillStyle = e.flash > 0 ? '#fecaca' : '#b91c1c';
        ctx.beginPath(); ctx.arc(0, 0, e.r, 0, 7); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath(); ctx.arc(-4, -2, 2, 0, 7); ctx.arc(4, -2, 2, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillRect(-7, 5, 14, 3);
        ctx.restore();
      });

      // пули
      ebullets.forEach(function (b) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, 7); ctx.fill();
      });
      shots.forEach(function (s) {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 0.018, s.y - s.vy * 0.018); ctx.stroke();
      });

      // игрок
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.fillStyle = 'rgba(16,185,129,.18)';
      ctx.beginPath(); ctx.arc(0, 0, player.r + 8, 0, 7); ctx.fill();
      ctx.rotate(player.aim);
      ctx.fillStyle = '#111827';
      ctx.fillRect(6, -3, 16, 6);
      ctx.rotate(-player.aim);
      ctx.fillStyle = player.hurt > 0 ? '#fca5a5' : '#10b981';
      ctx.beginPath(); ctx.arc(0, 0, player.r, 0, 7); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#064e3b';
      ctx.beginPath(); ctx.arc(-3, -2, 1.8, 0, 7); ctx.arc(3, -2, 1.8, 0, 7); ctx.fill();
      ctx.restore();

      // индикатор врагов
      if (enemies.length) {
        ctx.fillStyle = 'rgba(17,24,39,.62)';
        roundRect(ctx, W / 2 - 46, 22, 92, 20, 10); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '700 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Волна ' + wave + '/' + waves + ' · ' + (enemies.length + spawnLeft), W / 2, 36);
        ctx.textAlign = 'left';
      }
    }

    function roundRect(c, x, y, w, h, r) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }

    function endGame(win) {
      if (ended) return;
      ended = true;
      cancelAnimationFrame(raf);
      msgEl.classList.remove('hidden');
      if (win) {
        msgEl.innerHTML = '<div class="ag-card win"><i class="fa-solid fa-shield-halved"></i><b>Точка удержана</b><span>Бандиты отступили. Всего волн: ' + waves + '.</span>' +
          '<button type="button" id="ag-next">Дальше</button></div>';
        msgEl.querySelector('#ag-next').onclick = function () {
          cleanup();
          bust(box);
          if (opts.onWin) opts.onWin();
        };
      } else {
        msgEl.innerHTML = '<div class="ag-card lose"><i class="fa-solid fa-heart-crack"></i><b>Вас одолели</b><span>Попробуйте ещё раз — бандиты не ждут.</span>' +
          '<button type="button" id="ag-retry">Ещё раз</button><button type="button" class="ghost" id="ag-out">Отступить</button></div>';
        msgEl.querySelector('#ag-retry').onclick = function () {
          cleanup();
          bust(box);
          setTimeout(function () { shooter(opts); }, 60);
        };
        msgEl.querySelector('#ag-out').onclick = function () {
          cleanup();
          bust(box);
          if (opts.onExit) opts.onExit();
        };
      }
    }

    function cleanup() {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    }

    box.querySelector('.act-x').onclick = function () {
      cleanup();
      bust(box);
      if (opts.onExit) opts.onExit();
    };

    function loop(ts) {
      if (ended) return;
      if (!last) last = ts;
      var dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;
      update(dt);
      drawScene();
      if (!ended) raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
  }

  // ============================================================
  // ПОЕЗДКА НА СКОРОЙ
  // ============================================================
  function drive(opts) {
    opts = opts || {};
    var box = open('act-game act-drive');
    if (!box) return;
    box.innerHTML =
      '<div class="act-top dark"><button class="act-x" type="button" aria-label="Выйти"><i class="fa-solid fa-xmark"></i></button>' +
      '<div><b>Скорая · до больницы</b><span id="ad-sub">Пробки · держитесь правого ряда</span></div><span class="ad-time" id="ad-time">0%</span></div>' +
      '<div class="act-stage"><canvas id="ad-cv"></canvas>' +
      '<div class="ag-msg hidden" id="ad-msg"></div>' +
      '<div class="ad-hud"><div class="ad-hp"><i id="ad-hpbar"></i></div><div class="ad-prog"><i id="ad-progbar"></i></div></div>' +
      '<div class="ad-controls">' +
      '<button type="button" data-dir="left" aria-label="Влево"><i class="fa-solid fa-chevron-left"></i></button>' +
      '<button type="button" class="boost" id="ad-boost" aria-label="Газ"><i class="fa-solid fa-bolt"></i></button>' +
      '<button type="button" data-dir="right" aria-label="Вправо"><i class="fa-solid fa-chevron-right"></i></button>' +
      '</div></div>' +
      '<div class="ag-tip">A / D или стрелки — руль · Пробел — газ</div>';

    var hospitalImg = new Image();
    hospitalImg.src = 'img/hospital-entrance.jpg';

    var cv = box.querySelector('#ad-cv');
    var ctx = cv.getContext('2d');
    var W = 360, H = 520;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.scale(dpr, dpr);

    var msgEl = box.querySelector('#ad-msg');
    var hpBar = box.querySelector('#ad-hpbar');
    var progBar = box.querySelector('#ad-progbar');
    var timeEl = box.querySelector('#ad-time');
    var boostBtn = box.querySelector('#ad-boost');
    var keys = {};
    var touch = { left: false, right: false };
    var raf = 0, last = 0, ended = false;
    var roadX = 64, roadW = 232;
    var lanes = [roadX + roadW / 6, roadX + roadW / 2, roadX + roadW * 5 / 6];
    var car = { x: lanes[1], y: 430, vx: 0, hp: 100, flash: 0, lane: 1 };
    var traffic = [], scroll = 0, spawnT = 0.5, progress = 0, dist = 0, boost = false;

    function onKey(ev, down) {
      var k = ev.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'a', 'd', ' '].indexOf(k) < 0) return;
      ev.preventDefault();
      if (k === ' ') { boost = down; return; }
      keys[k] = down;
    }
    var kd = function (ev) { onKey(ev, true); };
    var ku = function (ev) { onKey(ev, false); };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    box.querySelectorAll('.ad-controls button[data-dir]').forEach(function (b) {
      var d = b.getAttribute('data-dir');
      b.addEventListener('pointerdown', function (ev) { ev.preventDefault(); touch[d] = true; });
      var off = function () { touch[d] = false; };
      b.addEventListener('pointerup', off);
      b.addEventListener('pointerleave', off);
      b.addEventListener('pointercancel', off);
    });
    boostBtn.addEventListener('pointerdown', function (ev) { ev.preventDefault(); boost = true; });
    boostBtn.addEventListener('pointerup', function () { boost = false; });
    boostBtn.addEventListener('pointercancel', function () { boost = false; });

    function spawnCar() {
      var lane = Math.floor(Math.random() * 3);
      var laneX = lanes[lane];
      // не ставим машину вплотную к другой в том же ряду
      for (var i = 0; i < traffic.length; i++) {
        if (traffic[i].lane === lane && traffic[i].y < 120) return;
      }
      var colors = ['#64748b', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#e2e8f0'];
      traffic.push({ x: laneX, y: -70, lane: lane, speed: 52 + Math.random() * 46, color: colors[Math.floor(Math.random() * colors.length)], w: 30, h: 50 });
    }

    function update(dt) {
      var steer = 0;
      if (keys.a || keys.arrowleft || touch.left) steer -= 1;
      if (keys.d || keys.arrowright || touch.right) steer += 1;
      car.vx += steer * 520 * dt;
      car.vx *= 0.86;
      car.x += car.vx * dt;
      car.x = clamp(car.x, roadX + 22, roadX + roadW - 22);
      car.flash = Math.max(0, car.flash - dt);

      var speed = boost ? 176 : 118;
      scroll += speed * dt;
      dist += speed * dt;
      progress = clamp(dist / 2400 * 100, 0, 100);

      car.y = 430 - Math.sin(scroll / 40) * 2;

      spawnT -= dt;
      if (spawnT <= 0) { spawnT = Math.max(0.38, 0.95 - progress / 190); spawnCar(); }

      traffic.forEach(function (t) {
        t.y += (speed + t.speed) * dt;
      });
      traffic = traffic.filter(function (t) { return t.y < H + 80; });

      // столкновения
      traffic.forEach(function (t) {
        if (Math.abs(t.x - car.x) < 24 && Math.abs(t.y - car.y) < 44) {
          t.y = car.y + 48;
          t.speed = 0;
          car.hp -= 16;
          car.flash = 0.4;
          car.vx += (car.x < t.x ? -1 : 1) * 90;
          if (car.hp <= 0) endGame(false);
        }
      });

      hpBar.style.width = Math.max(0, car.hp) + '%';
      hpBar.style.background = car.hp > 55 ? '#22c55e' : car.hp > 25 ? '#f59e0b' : '#ef4444';
      progBar.style.width = progress + '%';
      timeEl.textContent = Math.round(progress) + '%';

      if (progress >= 100) endGame(true);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      // газоны и дома
      ctx.fillStyle = '#dfeadd';
      ctx.fillRect(0, 0, W, H);
      drawBuildings(0, 64, -1);
      drawBuildings(W - 64, 64, 1);

      // дорога
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(roadX, 0, roadW, H);
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(roadX + 7, 0, roadW - 14, H);

      // обочины
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(roadX - 8, 0, 8, H);
      ctx.fillRect(roadX + roadW, 0, 8, H);

      // разметка
      ctx.strokeStyle = 'rgba(255,255,255,.78)';
      ctx.lineWidth = 3;
      ctx.setLineDash([26, 24]);
      ctx.lineDashOffset = -(scroll % 50);
      [roadX + roadW / 3, roadX + roadW * 2 / 3].forEach(function (x) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(250,204,21,.55)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(roadX + 4, 0); ctx.lineTo(roadX + 4, H); ctx.moveTo(roadX + roadW - 4, 0); ctx.lineTo(roadX + roadW - 4, H); ctx.stroke();

      // машины
      traffic.forEach(function (t) { drawCar(t.x, t.y, t.color, false); });

      // скорая
      drawAmbulance(car.x, car.y, car.flash > 0);

      // финиш у больницы
      if (progress > 90) {
        ctx.globalAlpha = Math.min(1, (progress - 90) / 10);
        var px = roadX, py = 158, pw = roadW, ph = 138;
        if (hospitalImg.complete && hospitalImg.width) {
          var ir = Math.max(pw / hospitalImg.width, ph / hospitalImg.height);
          var sw = pw / ir, sh = ph / ir;
          ctx.save();
          ctx.beginPath();
          roundRect(ctx, px, py, pw, ph, 12);
          ctx.clip();
          ctx.drawImage(hospitalImg, (hospitalImg.width - sw) / 2, (hospitalImg.height - sh) / 2, sw, sh, px, py, pw, ph);
          ctx.fillStyle = 'rgba(2,6,23,.48)';
          ctx.fillRect(px, py, pw, ph);
          ctx.restore();
        } else {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(px, py + 34, pw, 70);
        }
        ctx.fillStyle = '#fff';
        ctx.font = '800 18px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('БОЛЬНИЦА', W / 2, py + ph / 2 + 6);
        ctx.textAlign = 'left';
        ctx.globalAlpha = 1;
      }
    }

    function drawBuildings(baseX, w, side) {
      for (var y = -((scroll * 0.35) % 90); y < H + 90; y += 90) {
        var heights = 56 + ((Math.floor(y / 90) * 17) % 26);
        ctx.fillStyle = '#cfe0cb';
        ctx.fillRect(baseX, y + 8, w, heights);
        ctx.fillStyle = '#bcd4b6';
        ctx.fillRect(baseX + (side < 0 ? w - 10 : 0), y + 8, 10, heights);
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        for (var wy = y + 16; wy < y + heights - 4; wy += 16) {
          ctx.fillRect(baseX + 12, wy, w - 24, 6);
        }
      }
    }

    function drawCar(x, y, color, flash) {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = 'rgba(0,0,0,.2)';
      roundRect(ctx, -15, -23, 30, 48, 8); ctx.fill();
      ctx.fillStyle = flash ? '#fff' : color;
      roundRect(ctx, -15, -25, 30, 50, 8); ctx.fill();
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(-11, -17, 22, 12);
      ctx.fillRect(-11, 8, 22, 10);
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.fillRect(-13, -22, 26, 3);
      ctx.restore();
    }

    function drawAmbulance(x, y, flash) {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = 'rgba(0,0,0,.24)';
      roundRect(ctx, -17, -28, 34, 58, 9); ctx.fill();
      ctx.fillStyle = '#f8fafc';
      roundRect(ctx, -17, -30, 34, 60, 9); ctx.fill();
      ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 2;
      roundRect(ctx, -17, -30, 34, 60, 9); ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-5, -22, 10, 4);
      ctx.fillRect(-2, -25, 4, 10);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-13, 8, 26, 14);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-17, 2, 34, 4);
      if (flash) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(-11, -24, 4, 0, 7); ctx.fill();
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath(); ctx.arc(11, -24, 4, 0, 7); ctx.fill();
      }
      ctx.restore();
    }

    function endGame(win) {
      if (ended) return;
      ended = true;
      cancelAnimationFrame(raf);
      msgEl.classList.remove('hidden');
      if (win) {
        msgEl.innerHTML = '<div class="ag-card win"><div style="width:100%;height:108px;border-radius:12px;overflow:hidden;margin-bottom:10px"><img src="img/hospital-entrance.jpg" alt="Городская больница" style="width:100%;height:100%;object-fit:cover;display:block"></div><i class="fa-solid fa-hospital"></i><b>Больница</b><span>Вы довезли Макса. Врачи уже у входа.</span>' +
          '<button type="button" id="ad-next">Дальше</button></div>';
        msgEl.querySelector('#ad-next').onclick = function () {
          cleanup();
          bust(box);
          if (opts.onWin) opts.onWin();
        };
      } else {
        msgEl.innerHTML = '<div class="ag-card lose"><i class="fa-solid fa-car-burst"></i><b>Скорая разбита</b><span>Нужно попробовать снова — счёт на минуты.</span>' +
          '<button type="button" id="ad-retry">Ещё раз</button><button type="button" class="ghost" id="ad-out">Выйти</button></div>';
        msgEl.querySelector('#ad-retry').onclick = function () {
          cleanup();
          bust(box);
          setTimeout(function () { drive(opts); }, 60);
        };
        msgEl.querySelector('#ad-out').onclick = function () {
          cleanup();
          bust(box);
          if (opts.onExit) opts.onExit();
        };
      }
    }

    function cleanup() {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    }

    box.querySelector('.act-x').onclick = function () {
      cleanup();
      bust(box);
      if (opts.onExit) opts.onExit();
    };

    function loop(ts) {
      if (ended) return;
      if (!last) last = ts;
      var dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;
      update(dt);
      draw();
      if (!ended) raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
  }

  function roundRect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  window.BizAction = {
    call112: call112,
    shooter: shooter,
    drive: drive,
    close: function () {
      var host = phone();
      if (!host) return;
      host.querySelectorAll('.act').forEach(function (n) { host.removeChild(n); });
    }
  };
})();
