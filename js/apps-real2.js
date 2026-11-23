/* Лавка — рабочие приложения, часть 2: подкасты, игры, пульт, камера, файлы, диктофон */
(function () {
  'use strict';
  var LV = window.LV;
  if (!LV) return;
  var S = LV.state;
  var esc = LV.esc;

  function el(id) { return document.getElementById(id); }
  function save() { try { LV.save(); } catch (e) {} }
  function scroll(html) { return '<div class="app-scroll pb">' + html + '</div>'; }
  function tstr(sec) {
    sec = Math.max(0, Math.round(sec));
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  }
  function today() {
    var d = new Date();
    return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0');
  }
  function sheet(html) {
    var host = el('app-body');
    if (!host) return null;
    var old = el('ar-sheet');
    if (old) old.remove();
    var m = document.createElement('div');
    m.className = 'ar-sheet';
    m.id = 'ar-sheet';
    m.innerHTML = '<div class="ar-sheet-in">' + html + '</div>';
    m.addEventListener('click', function (e) { if (e.target === m) m.remove(); });
    host.appendChild(m);
    return m;
  }
  window.AppsReal2 = {};

  /* ============================================================
     ПОДКАСТЫ
     ============================================================ */
  var PODCASTS = [
    { id: 'p1', title: 'Точка с нуля: первый ПВЗ', show: 'Лавка. Подкаст', dur: 192 },
    { id: 'p2', title: 'Опт: как не уйти в минус', show: 'Лавка. Подкаст', dur: 248 },
    { id: 'p3', title: 'Люди: кого брать в смену', show: 'Лавка. Подкаст', dur: 176 },
    { id: 'p4', title: 'Налоги и проверки без паники', show: 'Лавка. Подкаст', dur: 214 }
  ];
  function podEnsure() {
    if (!S.podcast || typeof S.podcast !== 'object') S.podcast = { id: '', pos: 0, playing: false };
    if (!Array.isArray(S.podPlayed)) S.podPlayed = [];
    return S.podcast;
  }

  function renderPodcasts() {
    var host = el('pd-list');
    if (!host) return;
    var st = podEnsure();
    host.innerHTML = PODCASTS.map(function (p) {
      var active = st.id === p.id;
      var pos = active ? st.pos : 0;
      var pct = Math.round(pos / p.dur * 100);
      var done = S.podPlayed.indexOf(p.id) >= 0;
      return '<div class="pd-row' + (active ? ' on' : '') + '">' +
        '<button class="pd-play" type="button" onclick="AppsReal2.pod.toggle(\'' + p.id + '\')">' +
        '<i class="fa-solid ' + (active && st.playing ? 'fa-pause' : 'fa-play') + '"></i></button>' +
        '<div class="pd-main"><b>' + esc(p.title) + '</b><small>' + esc(p.show) + ' · ' + tstr(p.dur) +
        (done ? ' · прослушано' : '') + '</small>' +
        '<div class="pd-bar"><i style="width:' + pct + '%"></i></div></div>' +
        '<span class="pd-time">' + tstr(pos) + '</span></div>';
    }).join('');
  }

  AppsReal2.pod = {
    toggle: function (id) {
      var st = podEnsure();
      var p = PODCASTS.filter(function (x) { return x.id === id; })[0];
      if (!p) return;
      if (st.id === id && st.playing) { st.playing = false; }
      else {
        if (st.id !== id) st.pos = 0;
        st.id = id;
        st.playing = true;
        if (st.pos >= p.dur) st.pos = 0;
      }
      save();
      renderPodcasts();
    }
  };

  LV.registerApp({
    id: 'podcasts', name: 'Подкасты', icon: 'fa-podcast', bg: 'linear-gradient(140deg,#a855f7,#6d28d9)',
    page: 1, installable: true,
    mount: function (body) {
      body.innerHTML = LV.appbar({ title: 'Подкасты', sub: PODCASTS.length + ' выпуска · офлайн' }) + scroll('<div id="pd-list"></div>');
      renderPodcasts();
      var timer = setInterval(function () {
        var st = podEnsure();
        if (!st.playing || !st.id) return;
        var p = PODCASTS.filter(function (x) { return x.id === st.id; })[0];
        if (!p) return;
        st.pos += 1;
        if (st.pos >= p.dur) {
          st.pos = p.dur;
          st.playing = false;
          if (S.podPlayed.indexOf(p.id) < 0) S.podPlayed.push(p.id);
          save();
        }
        if (el('pd-list')) renderPodcasts();
      }, 1000);
      return function () { clearInterval(timer); };
    }
  });

  /* ============================================================
     ИГРЫ — «Собери корзину»
     ============================================================ */
  function gameEnsure() { if (typeof S.gameBest !== 'number') S.gameBest = 0; return S.gameBest; }

  LV.registerApp({
    id: 'games', name: 'Игры', icon: 'fa-gamepad', bg: 'linear-gradient(140deg,#2563eb,#7c3aed)',
    page: 1, installable: true,
    mount: function (body) {
      var score = 0, left = 20, active = -1, running = false;
      var t1 = null, t2 = null;

      body.innerHTML = LV.appbar({ title: 'Игры', sub: 'мини-игра · Собери корзину' }) + scroll(
        '<div class="gm-head"><div><b id="gm-score">0</b><span>счёт</span></div>' +
        '<div><b id="gm-best">' + gameEnsure() + '</b><span>рекорд</span></div>' +
        '<div><b id="gm-left">20</b><span>секунд</span></div></div>' +
        '<div class="gm-grid" id="gm-grid">' + new Array(9).fill(0).map(function (_, i) {
          return '<button class="gm-cell" type="button" data-i="' + i + '" onclick="void 0"></button>';
        }).join('') + '</div>' +
        '<div class="gm-bar"><i id="gm-bar" style="width:0%"></i></div>' +
        '<button class="btn btn-primary gm-start" type="button" id="gm-start">Начать игру</button>' +
        '<p class="gm-note">Лови зелёные клетки — это заказы. Красные пропускай: штраф.</p>'
      );

      var grid = el('gm-grid');
      function paint() {
        var cells = grid.querySelectorAll('.gm-cell');
        for (var i = 0; i < cells.length; i++) {
          cells[i].className = 'gm-cell' + (i === active ? ' on' : '');
        }
        if (el('gm-score')) el('gm-score').textContent = score;
        if (el('gm-left')) el('gm-left').textContent = left;
        if (el('gm-bar')) el('gm-bar').style.width = Math.round((20 - left) / 20 * 100) + '%';
      }
      function stop(msg) {
        running = false;
        clearInterval(t1); clearInterval(t2);
        active = -1; paint();
        if (score > gameEnsure()) { S.gameBest = score; save(); if (el('gm-best')) el('gm-best').textContent = score; }
        if (el('gm-start')) el('gm-start').textContent = 'Играть ещё';
        LV.toast(msg || ('Результат: ' + score));
      }
      function start() {
        if (running) return;
        running = true; score = 0; left = 20; active = -1;
        if (el('gm-start')) el('gm-start').textContent = 'Игра идёт…';
        paint();
        t1 = setInterval(function () {
          left -= 1;
          if (left <= 0) { left = 0; paint(); stop(); return; }
          paint();
        }, 1000);
        t2 = setInterval(function () {
          var cells = grid.querySelectorAll('.gm-cell');
          if (active >= 0 && cells[active]) cells[active].classList.remove('on');
          active = Math.floor(Math.random() * 9);
          var cell = cells[active];
          if (!cell) return;
          cell.classList.add('on');
          setTimeout(function () { if (cell && running) cell.classList.remove('on'); }, 520);
        }, 640);
      }
      grid.addEventListener('click', function (e) {
        var cell = e.target.closest('.gm-cell');
        if (!cell || !running) return;
        var i = Number(cell.getAttribute('data-i'));
        if (i === active) { score += 1; cell.classList.remove('on'); active = -1; }
        else { score = Math.max(0, score - 1); }
        paint();
      });
      if (el('gm-start')) el('gm-start').onclick = start;
      return function () { clearInterval(t1); clearInterval(t2); };
    }
  });

  /* ============================================================
     ПУЛЬТ
     ============================================================ */
  function smartEnsure() {
    if (!S.smart || typeof S.smart !== 'object') S.smart = {};
    var d = S.smart;
    if (typeof d.tv !== 'boolean') d.tv = false;
    if (typeof d.vol !== 'number') d.vol = 14;
    if (typeof d.ch !== 'number') d.ch = 1;
    if (typeof d.lamp !== 'boolean') d.lamp = false;
    if (typeof d.ac !== 'boolean') d.ac = false;
    return d;
  }
  var CHANNELS = ['Лавка ТВ', 'Город', 'Бизнес', 'Кино', 'Спорт'];

  AppsReal2.rc = {
    power: function () { var d = smartEnsure(); d.tv = !d.tv; save(); renderRemote(); },
    vol: function (n) { var d = smartEnsure(); d.vol = Math.max(0, Math.min(30, d.vol + n)); save(); renderRemote(); },
    ch: function (n) { var d = smartEnsure(); d.ch = ((d.ch - 1 + n + CHANNELS.length) % CHANNELS.length) + 1; save(); renderRemote(); },
    lamp: function () { var d = smartEnsure(); d.lamp = !d.lamp; save(); renderRemote(); },
    ac: function () { var d = smartEnsure(); d.ac = !d.ac; save(); renderRemote(); }
  };

  function renderRemote() {
    var host = el('rc-body');
    if (!host) return;
    var d = smartEnsure();
    host.innerHTML =
      '<div class="rc-tv' + (d.tv ? ' on' : '') + '">' +
      '<div class="rc-screen"><i class="fa-solid fa-tv"></i><b>' + (d.tv ? CHANNELS[d.ch - 1] : 'выключен') + '</b>' +
      '<small>' + (d.tv ? 'громкость ' + d.vol : 'нажмите включить') + '</small></div>' +
      '<button class="rc-power" type="button" onclick="AppsReal2.rc.power()"><i class="fa-solid fa-power-off"></i></button></div>' +
      '<div class="rc-row"><span>Громкость</span><div class="rc-vol"><button type="button" onclick="AppsReal2.rc.vol(-1)">−</button>' +
      '<b>' + d.vol + '</b><button type="button" onclick="AppsReal2.rc.vol(1)">+</button></div></div>' +
      '<div class="rc-row"><span>Канал</span><div class="rc-ch"><button type="button" onclick="AppsReal2.rc.ch(-1)">‹</button>' +
      '<b>' + d.ch + ' · ' + CHANNELS[d.ch - 1] + '</b><button type="button" onclick="AppsReal2.rc.ch(1)">›</button></div></div>' +
      '<div class="rc-tiles">' +
      '<button class="rc-tile' + (d.lamp ? ' on' : '') + '" type="button" onclick="AppsReal2.rc.lamp()"><i class="fa-solid fa-lightbulb"></i><span>Свет</span><b>' + (d.lamp ? 'вкл' : 'выкл') + '</b></button>' +
      '<button class="rc-tile' + (d.ac ? ' on' : '') + '" type="button" onclick="AppsReal2.rc.ac()"><i class="fa-solid fa-snowflake"></i><span>Кондиционер</span><b>' + (d.ac ? 'вкл' : 'выкл') + '</b></button>' +
      '</div>';
  }

  LV.registerApp({
    id: 'remote', name: 'Пульт', icon: 'fa-tv', bg: 'linear-gradient(140deg,#475569,#1e293b)',
    page: 1, installable: true,
    mount: function (body) {
      body.innerHTML = LV.appbar({ title: 'Пульт', sub: 'телевизор и умный дом' }) + scroll('<div id="rc-body"></div>');
      renderRemote();
    }
  });

  /* ============================================================
     КАМЕРА
     ============================================================ */
  function shotsEnsure() { if (!Array.isArray(S.shots)) S.shots = []; return S.shots; }

  function renderShots() {
    var host = el('cm-gal');
    if (!host) return;
    var list = shotsEnsure();
    if (!list.length) { host.innerHTML = '<div class="cm-empty">Снимков пока нет</div>'; return; }
    host.innerHTML = list.map(function (s) {
      return '<button class="cm-shot" type="button" style="background:linear-gradient(150deg,hsl(' + s.hue + ',72%,48%),hsl(' + ((s.hue + 60) % 360) + ',64%,32%))" ' +
        'onclick="AppsReal2.cam.open(' + s.id + ')"></button>';
    }).join('');
  }

  AppsReal2.cam = {
    snap: function () {
      var hue = Math.floor(Math.random() * 360);
      shotsEnsure().unshift({ id: Date.now(), hue: hue, date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
      save();
      renderShots();
      var t = el('cm-title');
      if (t) t.textContent = 'Галерея · ' + shotsEnsure().length;
      LV.toast('Снимок сохранён');
    },
    open: function (id) {
      var s = shotsEnsure().filter(function (x) { return x.id === id; })[0];
      if (!s) return;
      sheet('<div class="ar-prev" style="background:linear-gradient(150deg,hsl(' + s.hue + ',72%,48%),hsl(' + ((s.hue + 60) % 360) + ',64%,32%))"></div>' +
        '<div class="ar-prev-cap">Снимок · ' + esc(s.date || '') + '</div>');
    }
  };

  LV.registerApp({
    id: 'camera', name: 'Камера', icon: 'fa-camera', bg: 'linear-gradient(140deg,#334155,#0f172a)', page: 0,
    mount: function (body) {
      body.innerHTML = LV.appbar({ title: 'Камера', sub: 'галерея Лавки' }) + scroll(
        '<div class="cm-view"><div class="cm-frame"></div><span class="cm-hint">нажмите, чтобы снять</span>' +
        '<button class="cm-shutter" type="button" onclick="AppsReal2.cam.snap()"></button></div>' +
        '<div class="cm-title" id="cm-title">Галерея · ' + shotsEnsure().length + '</div>' +
        '<div class="cm-grid" id="cm-gal"></div>'
      );
      renderShots();
    }
  });

  /* ============================================================
     ФАЙЛЫ
     ============================================================ */
  var FILES = [
    { id: 1, folder: 'doc', name: 'Договор аренды · Центр.pdf', size: '412 КБ', date: '12.11', body: 'Договор аренды помещения на Тверской. Срок — 11 месяцев, ставка 900 ₽/смена, депозит 25 000 ₽.' },
    { id: 2, folder: 'doc', name: 'Лицензия на алкоголь.pdf', size: '180 КБ', date: '09.11', body: 'Лицензия № АЛ-4821. Действует до 09.11.2027. Выдана комитетом по лицензированию.' },
    { id: 3, folder: 'doc', name: 'Налоговая декларация.xlsx', size: '96 КБ', date: '01.11', body: 'Квартальная декларация: выручка, аренда, зарплаты, налог на имущество. Отправлена в ФНС.' },
    { id: 4, folder: 'down', name: 'Поставка · коробки.pdf', size: '64 КБ', date: '18.11', body: 'Накладная: 200 коробок, 3 рулона скотча, упаковка. Оплачено через «Опт».' },
    { id: 5, folder: 'down', name: 'Смета завода.xlsx', size: '128 КБ', date: '16.11', body: 'Смета запуска производства: оборудование, сырьё, персонал. Итого 1 240 000 ₽.' },
    { id: 6, folder: 'img', name: 'Витрина ПВЗ.jpg', size: '688 КБ', date: '15.11', img: 'img/pvz-window.jpg', body: 'Фото витрины пункта выдачи. Используется в карточке точки.' },
    { id: 7, folder: 'img', name: 'Вывеска Лавка.jpg', size: '922 КБ', date: '11.11', img: 'img/lavka-sign.jpg', body: 'Макет вывески для нового магазина. Зелёный фон, белый знак.' }
  ];
  var FILE_FOLDERS = [['all', 'Все'], ['doc', 'Документы'], ['down', 'Загрузки'], ['img', 'Фото']];

  var DOCS = {
    1: {
      kicker: 'ДОГОВОР АРЕНДЫ',
      title: 'Договор аренды № АР-12/26',
      sub: 'г. Москва · 12 ноября 2026 года',
      rows: [
        ['Арендодатель', 'ООО «Городская недвижимость»'],
        ['Арендатор', 'ООО «Лавка»'],
        ['Помещение', 'ул. Тверская, 12 · 18 м²'],
        ['Срок аренды', '11 месяцев'],
        ['Ставка', '900 ₽ за смену'],
        ['Депозит', '25 000 ₽']
      ],
      note: 'Арендатор использует помещение для розничной торговли и своевременно вносит арендную плату.',
      signer: 'А. В. Соколов',
      role: 'Арендодатель'
    },
    2: {
      kicker: 'АДМИНИСТРАЦИЯ ГОРОДА · КОМИТЕТ ПО ЛИЦЕНЗИРОВАНИЮ',
      title: 'ЛИЦЕНЗИЯ № АЛ-4821',
      sub: 'на осуществление розничной продажи алкогольной продукции',
      rows: [
        ['Лицензиат', 'ООО «Лавка» · ИНН 7712345678'],
        ['Адрес', 'г. Москва, ул. Тверская, 12'],
        ['Вид деятельности', 'Розничная продажа алкогольной продукции'],
        ['Срок действия', 'с 09.11.2022 по 09.11.2027'],
        ['Орган выдачи', 'Комитет по лицензированию города Москвы']
      ],
      note: 'Лицензия действительна при соблюдении требований законодательства и условий, указанных в приложении.',
      signer: 'И. С. Петров',
      role: 'Председатель комитета',
      stamp: true
    },
    3: {
      kicker: 'ФЕДЕРАЛЬНАЯ НАЛОГОВАЯ СЛУЖБА',
      title: 'НАЛОГОВАЯ ДЕКЛАРАЦИЯ',
      sub: 'за IV квартал 2026 года',
      rows: [
        ['Налогоплательщик', 'ООО «Лавка»'],
        ['ИНН / КПП', '7712345678 / 771201001'],
        ['Вид декларации', 'Налог на прибыль организаций'],
        ['Доходы', '2 480 000 ₽'],
        ['Расходы', '1 760 000 ₽'],
        ['Налог к уплате', '144 000 ₽']
      ],
      note: 'Декларация подписана усиленной квалифицированной электронной подписью.',
      signer: 'И. И. Лавров',
      role: 'Генеральный директор'
    },
    4: {
      kicker: 'ООО «ЛАВКА» · СКЛАД',
      title: 'НАКЛАДНАЯ № 4821',
      sub: 'поставка на пункт выдачи · 18 ноября 2026',
      rows: [
        ['Поставщик', 'Опт «Город»'],
        ['Получатель', 'ПВЗ Тверская, 12'],
        ['Коробки', '200 шт'],
        ['Упаковка', '3 рулона скотча, 200 пакетов'],
        ['Сумма', '48 600 ₽'],
        ['Оплата', 'Бизнес-счёт · оплачено']
      ],
      note: 'Товар принят без повреждений. Претензий по количеству и качеству нет.',
      signer: 'К. А. Смирнов',
      role: 'Кладовщик'
    },
    5: {
      kicker: 'ООО «ЛАВКА» · ПРОИЗВОДСТВО',
      title: 'СМЕТА ЗАПУСКА',
      sub: 'производственный цех · 16 ноября 2026',
      rows: [
        ['Оборудование', '640 000 ₽'],
        ['Сырьё и материалы', '280 000 ₽'],
        ['Персонал', '180 000 ₽'],
        ['Ремонт помещения', '140 000 ₽'],
        ['Итого', '1 240 000 ₽']
      ],
      note: 'Смета утверждена директором. Срок запуска линии — 30 дней с момента оплаты.',
      signer: 'А. В. Соколов',
      role: 'Директор'
    }
  };

  function documentHTML(f) {
    var d = DOCS[f.id];
    if (!d) return '';
    var rows = d.rows.map(function (r) {
      return '<div class="doc-row"><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>';
    }).join('');
    return '<div class="fl-doc"><div class="doc-paper">' +
      '<div class="doc-watermark">ИГРОВОЙ ДОКУМЕНТ</div>' +
      '<div class="doc-kicker">' + esc(d.kicker) + '</div>' +
      '<div class="doc-title">' + esc(d.title) + '</div>' +
      (d.sub ? '<div class="doc-sub">' + esc(d.sub) + '</div>' : '') +
      '<div class="doc-rows">' + rows + '</div>' +
      (d.note ? '<p class="doc-note">' + esc(d.note) + '</p>' : '') +
      '<div class="doc-sign">' +
      (d.stamp ? '<div class="doc-stamp"><b>КОМИТЕТ<br>ПО ЛИЦЕНЗИРОВАНИЮ</b><span>М.П.</span></div>' : '') +
      '<div class="doc-sign-box"><svg viewBox="0 0 220 50" aria-hidden="true"><path d="M4 34 C18 8 32 44 48 20 C62 2 70 42 86 24 C98 10 112 40 128 22 C142 6 154 38 170 24 C184 12 196 32 212 18" fill="none" stroke="#1e3a8a" stroke-width="2.2" stroke-linecap="round"/><path d="M92 36 C112 28 130 40 150 32" fill="none" stroke="#1e3a8a" stroke-width="1.4" stroke-linecap="round" opacity=".65"/></svg>' +
      '<span>' + esc(d.role) + '</span><b>' + esc(d.signer) + '</b></div></div>' +
      '<div class="doc-foot">Игровой документ · не имеет юридической силы</div>' +
      '</div></div>';
  }

  AppsReal2.files = {
    folder: 'all',
    q: '',
    setFolder: function (f) { this.folder = f; renderFiles(); },
    filter: function (v) { this.q = String(v || '').toLowerCase(); renderFiles(); },
    open: function (id) {
      var f = FILES.filter(function (x) { return x.id === id; })[0];
      if (!f) return;
      var preview = f.img
        ? '<img src="' + f.img + '" alt="' + esc(f.name) + '" style="display:block;width:100%;max-height:320px;object-fit:cover;border-radius:13px;margin-bottom:11px">'
        : (DOCS[f.id] ? documentHTML(f) : '<i class="fa-solid fa-file-lines"></i>');
      var desc = (f.img || DOCS[f.id]) ? '' : '<p>' + esc(f.body) + '</p>';
      sheet('<div class="fl-prev">' + preview +
        '<b>' + esc(f.name) + '</b>' +
        '<small>' + esc(f.size) + ' · ' + esc(f.date) + '</small>' + desc +
        '<button class="btn btn-primary" type="button" onclick="document.getElementById(\'ar-sheet\').remove()">Закрыть</button></div>');
    }
  };

  function renderFiles() {
    var host = el('fl-list');
    if (!host) return;
    var st = AppsReal2.files;
    var list = FILES.filter(function (f) {
      return (st.folder === 'all' || f.folder === st.folder) &&
        (!st.q || f.name.toLowerCase().indexOf(st.q) >= 0);
    });
    var chips = FILE_FOLDERS.map(function (f) {
      return '<button class="fl-chip' + (st.folder === f[0] ? ' on' : '') + '" type="button" onclick="AppsReal2.files.setFolder(\'' + f[0] + '\')">' + f[1] + '</button>';
    }).join('');
    host.innerHTML = '<div class="fl-chips">' + chips + '</div>' +
      (list.length ? list.map(function (f) {
        return '<button class="fl-row" type="button" onclick="AppsReal2.files.open(' + f.id + ')">' +
          '<span class="fl-ic"><i class="fa-solid ' + (f.folder === 'img' ? 'fa-image' : f.folder === 'down' ? 'fa-download' : 'fa-file-lines') + '"></i></span>' +
          '<span class="fl-main"><b>' + esc(f.name) + '</b><small>' + esc(f.size) + ' · ' + esc(f.date) + '</small></span>' +
          '<i class="fa-solid fa-chevron-right fl-arr"></i></button>';
      }).join('') : '<div class="fl-empty">Ничего не найдено</div>');
  }

  LV.registerApp({
    id: 'files', name: 'Файлы', icon: 'fa-folder-open', bg: 'linear-gradient(140deg,#f59e0b,#d97706)', page: 1,
    mount: function (body) {
      body.innerHTML = LV.appbar({ title: 'Файлы', sub: FILES.length + ' файла · 3 папки' }) + scroll(
        '<div class="fl-search"><i class="fa-solid fa-magnifying-glass"></i><input id="fl-q" placeholder="Поиск по файлам" oninput="AppsReal2.files.filter(this.value)"></div>' +
        '<div id="fl-list"></div>'
      );
      AppsReal2.files.folder = 'all';
      AppsReal2.files.q = '';
      renderFiles();
    }
  });

  /* ============================================================
     ДИКТОФОН
     ============================================================ */
  function recEnsure() { if (!Array.isArray(S.records)) S.records = []; return S.records; }

  function renderRecords() {
    var host = el('vr-list');
    if (!host) return;
    var list = recEnsure();
    if (!list.length) { host.innerHTML = '<div class="vr-empty">Записей нет. Нажмите «Записать».</div>'; return; }
    host.innerHTML = list.map(function (r) {
      return '<div class="vr-row"><button class="vr-play" type="button" onclick="AppsReal2.vr.play(' + r.id + ')">' +
        '<i class="fa-solid ' + (r.playing ? 'fa-pause' : 'fa-play') + '"></i></button>' +
        '<div class="vr-main"><b>' + esc(r.name) + '</b><small>' + tstr(r.dur) + ' · ' + esc(r.date) + '</small>' +
        '<div class="vr-bar"><i style="width:' + Math.round((r.pos || 0) / Math.max(1, r.dur) * 100) + '%"></i></div></div>' +
        '<button class="vr-del" type="button" onclick="AppsReal2.vr.del(' + r.id + ')"><i class="fa-solid fa-trash"></i></button></div>';
    }).join('');
  }

  AppsReal2.vr = {
    playingId: 0,
    play: function (id) {
      var list = recEnsure();
      var r = list.filter(function (x) { return x.id === id; })[0];
      if (!r) return;
      list.forEach(function (x) { x.playing = false; });
      r.playing = !r.playing;
      if (r.playing && r.pos >= r.dur) r.pos = 0;
      renderRecords();
    },
    del: function (id) {
      S.records = recEnsure().filter(function (r) { return r.id !== id; });
      save();
      renderRecords();
    }
  };

  LV.registerApp({
    id: 'voice', name: 'Диктофон', icon: 'fa-microphone-lines', bg: 'linear-gradient(140deg,#ef4444,#991b1b)',
    page: 1, installable: true,
    mount: function (body) {
      var rec = false, sec = 0, timer = null;
      body.innerHTML = LV.appbar({ title: 'Диктофон', sub: 'голосовые заметки' }) + scroll(
        '<div class="vr-rec"><button class="vr-btn" type="button" id="vr-btn"><i class="fa-solid fa-microphone"></i></button>' +
        '<b id="vr-time">0:00</b><span id="vr-state">нажмите, чтобы записать</span></div>' +
        '<div class="vr-list" id="vr-list"></div>'
      );
      var btn = el('vr-btn');
      btn.onclick = function () {
        if (!rec) {
          rec = true; sec = 0;
          btn.classList.add('on');
          if (el('vr-state')) el('vr-state').textContent = 'идёт запись…';
          timer = setInterval(function () {
            sec++;
            if (el('vr-time')) el('vr-time').textContent = tstr(sec);
          }, 1000);
        } else {
          rec = false;
          clearInterval(timer);
          btn.classList.remove('on');
          if (el('vr-state')) el('vr-state').textContent = 'нажмите, чтобы записать';
          if (sec > 0) {
            recEnsure().unshift({ id: Date.now(), name: 'Заметка ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), dur: sec, pos: 0, date: today(), playing: false });
            save();
            renderRecords();
          }
          sec = 0;
          if (el('vr-time')) el('vr-time').textContent = '0:00';
        }
      };
      renderRecords();
      var tick = setInterval(function () {
        var list = recEnsure();
        var any = false;
        list.forEach(function (r) {
          if (r.playing) {
            any = true;
            r.pos = (r.pos || 0) + 1;
            if (r.pos >= r.dur) { r.pos = r.dur; r.playing = false; }
          }
        });
        if (any && el('vr-list')) renderRecords();
      }, 1000);
      return function () { clearInterval(timer); clearInterval(tick); };
    }
  });
})();
