/* Лавка — приложения телефона */
(function () {
  'use strict';

  var LV = window.LV;
  var S = LV.state;

  function appRoot() { return document.getElementById('app-body'); }

  function sheet(html) {
    var host = appRoot();
    if (!host) return null;
    var old = document.getElementById('app-sheet');
    if (old) old.remove();
    var m = document.createElement('div');
    m.className = 'sheet-mask';
    m.id = 'app-sheet';
    m.innerHTML = '<div class="sheet" onclick="event.stopPropagation()">' + html + '</div>';
    m.addEventListener('click', function (e) { if (e.target === m) m.remove(); });
    host.appendChild(m);
    return m;
  }
  function closeSheet() {
    var m = document.getElementById('app-sheet');
    if (m) m.remove();
  }

  function openMarket(tabName) {
    LV.openApp('market');
    setTimeout(function () {
      if (window.Market) Market.tab(tabName || 'home');
    }, 30);
  }

  // =====================================================
  // ФОТО
  // =====================================================
  var PHOTO_PAL = [
    ['#38bdf8', '#e0f2fe', '#0f766e', '#064e3b', '#fef9c3'],
    ['#fb923c', '#fde68a', '#b45309', '#7c2d12', '#fffbeb'],
    ['#0ea5e9', '#7dd3fc', '#0369a1', '#082f49', '#e0f2fe'],
    ['#a78bfa', '#f0abfc', '#6d28d9', '#3b0764', '#fce7f3'],
    ['#f43f5e', '#fda4af', '#9f1239', '#4c0519', '#ffe4e6'],
    ['#22d3ee', '#a7f3d0', '#0f766e', '#134e4a', '#fef9c3'],
    ['#94a3b8', '#e2e8f0', '#334155', '#0f172a', '#f8fafc'],
    ['#84cc16', '#d9f99d', '#3f6212', '#1a2e05', '#fef08a']
  ];
  var PHOTO_PLACES = ['Москва', 'Санкт-Петербург', 'Сочи', 'Казань', 'Парк Горького', 'Красная площадь', 'Ботанический сад', 'Новосибирск', 'Екатеринбург', 'Владивосток', 'Суздаль', 'Калининград'];

  function photoArt(i, big) {
    var pal = PHOTO_PAL[i % PHOTO_PAL.length];
    var h = LV.hash('photo' + i);
    var sunX = 70 + (h % 250);
    var sunY = 60 + ((h >> 4) % 70);
    var h1 = 240 + ((h >> 6) % 40);
    var h2 = 290 + ((h >> 8) % 40);
    var w = 400, hh = 400;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">' +
      '<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + pal[0] + '"/><stop offset="1" stop-color="' + pal[1] + '"/></linearGradient>' +
      '<linearGradient id="wat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + pal[0] + '" stop-opacity=".55"/><stop offset="1" stop-color="' + pal[3] + '" stop-opacity=".75"/></linearGradient></defs>' +
      '<rect width="400" height="400" fill="url(#sky)"/>' +
      '<circle cx="' + sunX + '" cy="' + sunY + '" r="' + (26 + (h % 18)) + '" fill="' + pal[4] + '" opacity=".9"/>' +
      '<g fill="#ffffff" opacity=".22"><ellipse cx="' + (60 + (h % 90)) + '" cy="' + (60 + ((h >> 3) % 50)) + '" rx="38" ry="12"/><ellipse cx="' + (250 + ((h >> 5) % 90)) + '" cy="' + (96 + ((h >> 7) % 40)) + '" rx="26" ry="9"/></g>' +
      '<path d="M0 ' + h1 + ' L70 ' + (h1 - 72) + ' L150 ' + h1 + ' L220 ' + (h1 - 54) + ' L310 ' + h1 + ' L400 ' + (h1 - 30) + ' L400 400 L0 400 Z" fill="' + pal[2] + '" opacity=".9"/>' +
      '<path d="M0 ' + h2 + ' L90 ' + (h2 - 38) + ' L180 ' + (h2 + 6) + ' L280 ' + (h2 - 46) + ' L400 ' + (h2 - 6) + ' L400 400 L0 400 Z" fill="' + pal[3] + '"/>' +
      '<rect y="340" width="400" height="60" fill="url(#wat)" opacity=".65"/>' +
      '<g stroke="#ffffff" stroke-opacity=".22" stroke-width="2"><path d="M20 358 q30 -6 60 0 t60 0"/><path d="M180 372 q30 -6 60 0 t60 0"/><path d="M70 386 q40 -6 80 0"/></g>' +
      '<rect width="400" height="400" fill="' + pal[3] + '" opacity=".05"/>' +
      '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function photoList() {
    var list = [];
    for (var i = 0; i < 27; i++) {
      var d = new Date(2026, 10, 16 - i * 2);
      list.push({
        i: i,
        place: PHOTO_PLACES[(i * 3) % PHOTO_PLACES.length],
        date: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'),
        month: d.getMonth()
      });
    }
    return list;
  }

  var PHOTOS = photoList();
  var photoIdx = 0;

  LV.registerApp({
    id: 'photos', name: 'Фото', icon: 'fa-images', bg: 'linear-gradient(140deg,#fbbf24,#f43f5e)',
    page: null, dock: true,
    mount: function (body) {
      var html = LV.appbar({
        title: 'Фото', sub: PHOTOS.length + ' снимков · 387 МБ',
        right: '<button class="ab-btn" type="button" onclick="Photo.cameraClick()" aria-label="Камера"><i class="fa-solid fa-camera"></i></button>'
      });
      var grid = '';
      var lastMonth = -1;
      PHOTOS.forEach(function (p, idx) {
        if (p.month !== lastMonth) {
          var dd = new Date(p.date + 'T12:00:00');
          grid += '<div class="ph-month">' + (p.month === new Date().getMonth() ? 'Этот месяц' : ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'][p.month] + ' ' + dd.getFullYear()) + '</div>';
          lastMonth = p.month;
        }
        grid += '<button class="ph-item" type="button" onclick="Photo.open(' + idx + ')">' +
          '<img src="' + photoArt(p.i) + '" alt="' + LV.esc(p.place) + '" loading="lazy">' +
          '<span class="ph-tag">' + LV.esc(p.place) + '</span></button>';
      });
      body.innerHTML = html + '<div class="app-scroll flush"><div class="ph-grid">' + grid + '</div>' +
        '<p class="center tiny muted" style="padding:16px 20px 20px">Все фото хранятся на устройстве</p></div>';
      return function () { LV.setStatus('dark'); };
    }
  });

  window.Photo = {
    open: function (idx) {
      photoIdx = Math.max(0, Math.min(PHOTOS.length - 1, idx));
      var body = appRoot();
      if (!body) return;
      var old = document.getElementById('ph-view');
      if (old) old.remove();
      var p = PHOTOS[photoIdx];
      LV.setStatus('white');
      var el = document.createElement('div');
      el.className = 'ph-view';
      el.id = 'ph-view';
      el.innerHTML = '<div class="phv-top"><button class="phv-close" type="button" onclick="Photo.close()" aria-label="Закрыть"><i class="fa-solid fa-chevron-left"></i></button>' +
        '<div><b>' + LV.esc(p.place) + '</b><span>' + LV.dateFull(p.date) + ' · ' + (photoIdx + 1) + ' из ' + PHOTOS.length + '</span></div></div>' +
        '<div class="phv-stage"><img src="' + photoArt(p.i, true) + '" alt="' + LV.esc(p.place) + '"></div>' +
        '<div class="phv-bottom"><div class="phv-meta">Лавка Фото · 12 Мп · f/1.8 · ' + LV.esc(p.place) + '</div>' +
        '<div class="phv-nav"><button type="button" onclick="Photo.step(-1)"' + (photoIdx === 0 ? ' disabled' : '') + '><i class="fa-solid fa-chevron-left"></i> Назад</button>' +
        '<button type="button" onclick="Photo.step(1)"' + (photoIdx >= PHOTOS.length - 1 ? ' disabled' : '') + 'Вперёд <i class="fa-solid fa-chevron-right"></i></button></div></div>';
      body.appendChild(el);
    },
    close: function () {
      var el = document.getElementById('ph-view');
      if (el) el.remove();
      LV.setStatus('dark');
    },
    step: function (d) {
      var n = photoIdx + d;
      if (n < 0 || n >= PHOTOS.length) return;
      Photo.open(n);
    },
    cameraClick: function () { LV.toast('Камера появится в обновлении'); }
  };

  // =====================================================
  // ПРОФИЛЬ
  // =====================================================
  function achCount() {
    var n = 0;
    var orders = (S.orders || []).length;
    if (orders >= 1) n++;
    if (orders >= 5) n++;
    if (orders >= 10) n++;
    if ((S.fav || []).length >= 1) n++;
    if ((S.fav || []).length >= 10) n++;
    if (S.user && S.user.xid) n++;
    if (Array.isArray(S.reminders) && S.reminders.length) n++;
    if (Number(S.gameBest) > 0) n++;
    if (Array.isArray(S.shots) && S.shots.length) n++;
    if (Array.isArray(S.podPlayed) && S.podPlayed.length) n++;
    return n;
  }
  function buyerRating() {
    var o = (S.orders || []).length;
    return (o ? Math.min(5, 4.7 + Math.min(0.3, o * 0.01)) : 4.5).toFixed(1);
  }
  LV.registerApp({
    id: 'profile', name: 'Профиль', icon: 'fa-user', bg: 'linear-gradient(140deg,#6366f1,#8b5cf6)',
    page: 0, status: 'dark',
    mount: function (body) {
      var u = S.user;
      var pp = u.passport || {};
      var ordersCount = S.orders.length;
      var favCount = S.fav.length;
      var hasXid = !!u.xid;
      body.innerHTML = '<div class="app-scroll flush" style="padding-bottom:24px">' +
        '<div class="prof-hero">' +
        '<button class="prof-close" type="button" data-back aria-label="Закрыть"><i class="fa-solid fa-xmark"></i></button>' +
        '<div class="prof-top"><div class="prof-ava">' + LV.esc(LV.initials(u.name)) + '</div>' +
        '<div style="min-width:0"><div class="prof-name">' + LV.esc(u.name) + '</div>' +
        '<div class="prof-tag">Участник Лавки с ' + LV.dateRu(u.joined) + '</div>' +
        '<button class="prof-xid' + (hasXid ? '' : ' off') + '" id="prof-xid" type="button" onclick="XID.open()">' +
        '<i class="fa-solid fa-' + (hasXid ? 'shield-halved' : 'arrow-right-to-bracket') + '"></i> ' +
        (hasXid ? LV.esc(u.xid) : 'Подключить XPRODC ID') +
        (hasXid ? ' <i class="fa-solid fa-circle-check"></i>' : '') + '</button>' +
        '</div></div></div>' +
        '<div class="prof-stats">' +
        '<div class="stat-card"><b>' + ordersCount + '</b><span>ЗАКАЗЫ</span></div>' +
        '<div class="stat-card"><b>' + favCount + '</b><span>ИЗБРАННОЕ</span></div>' +
        '<div class="stat-card"><b>' + LV.fmtNum(S.balance) + '</b><span>БАЛАНС, ₽</span></div>' +
        '</div>' +
        '<div class="prof-body">' +
        '<div class="set-group-title" style="padding-left:4px">XPRODC ID</div>' +
        '<div class="prof-menu">' +
        '<button class="prof-link" type="button" onclick="XID.open()"><span class="set-ico" style="background:#059669"><i class="fa-solid fa-shield-halved"></i></span><b>XPRODC ID</b><small>' + (hasXid ? LV.esc(u.xid) : 'Войти') + '</small><i class="fa-solid fa-chevron-right chev"></i></button>' +
        '<button class="prof-link" type="button" onclick="XID.achieve()"><span class="set-ico" style="background:#10b981"><i class="fa-solid fa-medal"></i></span><b>Достижения</b><small>' + achCount() + ' / 50</small><i class="fa-solid fa-chevron-right chev"></i></button>' +
        '<button class="prof-link" type="button" onclick="XID.rating()"><span class="set-ico" style="background:#f59e0b"><i class="fa-solid fa-trophy"></i></span><b>Рейтинг</b><small>' + buyerRating() + '</small><i class="fa-solid fa-chevron-right chev"></i></button>' +
        '<button class="prof-link" type="button" onclick="XID.linkTg()"><span class="set-ico" style="background:#2AABEE"><i class="fa-brands fa-telegram"></i></span><b>Telegram</b><small id="prof-tg-status">' + (u.tg ? LV.esc(u.tg) : 'Привязать') + '</small><i class="fa-solid fa-chevron-right chev"></i></button>' +
        '</div>' +
        '<div class="set-group-title" style="padding-left:4px">Покупки</div>' +
        '<div class="prof-menu">' +
        '<button class="prof-link" type="button" onclick="Profile.orders()"><span class="set-ico" style="background:#10b981"><i class="fa-solid fa-box"></i></span><b>Мои заказы</b><small>' + ordersCount + '</small><i class="fa-solid fa-chevron-right chev"></i></button>' +
        '<button class="prof-link" type="button" onclick="Profile.fav()"><span class="set-ico" style="background:#ef4444"><i class="fa-solid fa-heart"></i></span><b>Избранное</b><small>' + favCount + '</small><i class="fa-solid fa-chevron-right chev"></i></button>' +
        '<button class="prof-link" type="button" onclick="Profile.wallet()"><span class="set-ico" style="background:#0f172a"><i class="fa-solid fa-wallet"></i></span><b>Кошелёк и карты</b><i class="fa-solid fa-chevron-right chev"></i></button>' +
        '</div>' +
        '<div class="set-group-title" style="padding-left:4px">Аккаунт</div>' +
        '<div class="prof-menu">' +
        '<button class="prof-link" type="button" onclick="Passport.open()"><span class="set-ico" style="background:#0ea5e9"><i class="fa-solid fa-id-card"></i></span><b>Паспорт игрока</b><small>' + (pp.surname ? LV.esc(u.name || (pp.surname + ' ' + pp.name)) : 'Заполнить') + '</small><i class="fa-solid fa-chevron-right chev"></i></button>' +
        '<button class="prof-link" type="button" onclick="Profile.editName()"><span class="set-ico" style="background:#6366f1"><i class="fa-solid fa-pen"></i></span><b>Имя и аватар</b><i class="fa-solid fa-chevron-right chev"></i></button>' +
        '<button class="prof-link" type="button" onclick="Profile.addresses()"><span class="set-ico" style="background:#0ea5e9"><i class="fa-solid fa-location-dot"></i></span><b>Адреса доставки</b><small>1</small><i class="fa-solid fa-chevron-right chev"></i></button>' +
        '<button class="prof-link" type="button" onclick="Profile.payments()"><span class="set-ico" style="background:#f59e0b"><i class="fa-solid fa-credit-card"></i></span><b>Способы оплаты</b><i class="fa-solid fa-chevron-right chev"></i></button>' +
        '<button class="prof-link" type="button" onclick="Profile.security()"><span class="set-ico" style="background:#059669"><i class="fa-solid fa-shield-halved"></i></span><b>Безопасность</b><i class="fa-solid fa-chevron-right chev"></i></button>' +
        '<button class="prof-link" type="button" onclick="LV.openApp(\'settings\')"><span class="set-ico" style="background:#64748b"><i class="fa-solid fa-gear"></i></span><b>Настройки телефона</b><i class="fa-solid fa-chevron-right chev"></i></button>' +
        '</div>' +
        '<div class="xid-note"><i class="fa-solid fa-fingerprint"></i><div><b style="display:block;font-size:11px">Единый XPRODC ID</b>' +
        'Один ID для Лавки, кошелька и сервисов экосистемы. ' + (hasXid ? 'Аккаунт подключён.' : 'Подключите, чтобы оформлять заказы.') + '</div></div>' +
        (hasXid ? '<button class="btn btn-block" type="button" onclick="XID.logout()" style="color:#ef4444;background:rgba(239,68,68,.08)">Выйти из XPRODC ID</button>' : '<button class="btn btn-primary btn-block" type="button" onclick="XID.open()">Войти в XPRODC ID</button>') +
        '<p class="center tiny muted" style="margin:14px 0 4px">Лавка 1.0 · XPRODC ID</p>' +
        '</div></div>';
    }
  });

  window.Profile = {
    orders: function () { openMarket('orders'); },
    fav: function () { LV.openApp('market'); setTimeout(function () { Market.go('fav'); }, 30); },
    wallet: function () { LV.openApp('wallet'); },
    addresses: function () {
      LV.toast('Адрес: Москва, Тверская, 12');
    },
    payments: function () { LV.toast('Карта •••• 4417 · СБП'); },
    security: function () { LV.toast('Вход по X ID защищён'); },
    logout: function () { LV.toast('В симуляторе выход отключён'); },
    editName: function () {
      var m = sheet('<div class="sheet-grab"></div><h3>Имя и аватар</h3><p class="sub">Так тебя будут видеть продавцы и в отзывах.</p>' +
        '<input class="field" id="prof-name-input" value="' + LV.esc(S.user.name) + '" maxlength="24" placeholder="Имя" style="margin-bottom:10px">' +
        '<div class="pay-opt on" style="margin-bottom:10px"><span class="rev-ava" style="background:#e7f8f1;color:#059669;width:30px;height:30px;border-radius:9px">' + LV.esc(LV.initials(S.user.name)) + '</span> Аватар из инициалов</div>' +
        '<button class="btn btn-primary btn-block" type="button" onclick="Profile.saveName()">Сохранить</button>' +
        '<button class="btn btn-block" style="margin-top:8px" type="button" onclick="Profile.closeSheet()">Отмена</button>');
      setTimeout(function () {
        var i = document.getElementById('prof-name-input');
        if (i) { i.focus(); i.select(); }
      }, 60);
    },
    saveName: function () {
      var i = document.getElementById('prof-name-input');
      var v = i ? i.value.trim() : '';
      if (!v) { LV.toast('Введите имя'); return; }
      var p = S.user.passport || null;
      var surname = p && p.surname ? String(p.surname).trim() : '';
      if (p && surname) {
        var tail = ' ' + surname;
        if (v.toLowerCase().slice(-tail.length) === tail.toLowerCase()) {
          p.name = v.slice(0, -tail.length).trim() || v;
          S.user.name = v;
        } else {
          p.name = v;
          S.user.name = v + ' ' + surname;
        }
      } else {
        S.user.name = v;
      }
      S.user.nameOwn = true;
      LV.save();
      LV.updateHomeUser();
      Profile.closeSheet();
      LV.openApp('profile');
      LV.toast('Имя обновлено');
    },
    closeSheet: closeSheet
  };

  // =====================================================
  // НАСТРОЙКИ
  // =====================================================
  LV.registerApp({
    id: 'settings', name: 'Настройки', icon: 'fa-gear', bg: 'linear-gradient(140deg,#64748b,#334155)',
    page: null, dock: true,
    mount: function (body) {
      var st = S.settings;
      var dark = S.theme === 'dark';
      body.innerHTML = LV.appbar({ title: 'Настройки', sub: 'Lavka Phone 15' }) +
        '<div class="app-scroll pb">' +
        '<div class="set-group-title">Внешний вид</div>' +
        '<div class="set-group" id="set-theme-row" style="padding-top:12px">' +
        '<div class="row" style="padding:0 14px"><span class="set-ico" style="background:#0f172a"><i class="fa-solid fa-moon"></i></span><div class="set-lbl"><b>Тема оформления</b><span>Светлая или тёмная гамма</span></div></div>' +
        '<div class="theme-pick">' +
        '<button class="theme-opt' + (!dark ? ' on' : '') + '" type="button" data-theme="light" onclick="Settings.setTheme(\'light\')"><span class="theme-swatch"><i style="background:#f8fafc"></i><i style="background:#e2e8f0"></i></span>Светлая</button>' +
        '<button class="theme-opt' + (dark ? ' on' : '') + '" type="button" data-theme="dark" onclick="Settings.setTheme(\'dark\')"><span class="theme-swatch"><i style="background:#0f172a"></i><i style="background:#1e293b"></i></span>Тёмная</button>' +
        '</div></div>' +

        '<div class="set-group-title">Уведомления</div>' +
        '<div class="set-group">' +
        '<div class="set-row"><span class="set-ico" style="background:#10b981"><i class="fa-solid fa-bell"></i></span><div class="set-lbl"><b>Уведомления</b><span>Статусы заказов и скидки</span></div>' +
        '<button class="switch' + (st.notify ? ' on' : '') + '" type="button" data-key="notify" onclick="Settings.toggle(\'notify\',this)" aria-label="Уведомления"></button></div>' +
        '<div class="set-row"><span class="set-ico" style="background:#0ea5e9"><i class="fa-solid fa-volume-high"></i></span><div class="set-lbl"><b>Звуки</b><span>Клавиатура и действия</span></div>' +
        '<button class="switch' + (st.sound ? ' on' : '') + '" type="button" data-key="sound" onclick="Settings.toggle(\'sound\',this)" aria-label="Звуки"></button></div>' +
        '<div class="set-row"><span class="set-ico" style="background:#f59e0b"><i class="fa-solid fa-database"></i></span><div class="set-lbl"><b>Экономия данных</b><span>Меньше изображений в каталоге</span></div>' +
        '<button class="switch' + (st.saver ? ' on' : '') + '" type="button" data-key="saver" onclick="Settings.toggle(\'saver\',this)" aria-label="Экономия данных"></button></div>' +
        '</div>' +

        '<div class="set-group-title">Данные</div>' +
        '<div class="set-group">' +
          '<button class="set-row" type="button" onclick="Settings.replay()"><span class="set-ico" style="background:#6366f1"><i class="fa-solid fa-graduation-cap"></i></span><div class="set-lbl"><b>Обучение заново</b><span>Показать подсказки по телефону</span></div><i class="fa-solid fa-chevron-right chev"></i></button>' +
          '<button class="set-row" type="button" onclick="Settings.reset()"><span class="set-ico" style="background:#ef4444"><i class="fa-solid fa-arrow-rotate-left"></i></span><div class="set-lbl"><b>Сбросить прогресс</b><span>Корзина, заказы, избранное</span></div><i class="fa-solid fa-chevron-right chev"></i></button>' +
        '</div>' +

        '<div class="set-group-title">О телефоне</div>' +
        '<div class="set-group">' +
        '<div class="set-row"><span class="set-ico" style="background:#0f172a"><i class="fa-solid fa-mobile-screen"></i></span><div class="set-lbl"><b>Lavka Phone 15</b><span>6.1" · 256 ГБ · X ID ' + LV.esc(S.user.xid) + '</span></div><span class="set-val">v1.0</span></div>' +
        '<div class="set-row"><span class="set-ico" style="background:#10b981"><i class="fa-solid fa-bag-shopping"></i></span><div class="set-lbl"><b>Лавка</b><span>Магазин · 2100 товаров</span></div><span class="set-val">1.0</span></div>' +
        '<button class="set-row" type="button" onclick="XID.open()"><span class="set-ico" style="background:#6366f1"><i class="fa-solid fa-fingerprint"></i></span><div class="set-lbl"><b>XPRODC ID</b><span>' + (S.user.xid ? LV.esc(S.user.xid) : 'Единый аккаунт экосистемы') + '</span></div><span class="set-val" style="color:' + (S.user.xid ? 'var(--green-d)' : '#ef4444') + '">' + (S.user.xid ? 'подключён' : 'войти') + '</span></button>' +
        '</div>' +
        '<p class="center tiny muted" style="margin:6px 0 10px">Сделано в стиле BankFake<br>Лавка · 2026</p>' +
        '</div>';
    }
  });

  window.Settings = {
    setTheme: function (t) {
      S.theme = t;
      LV.save();
      document.body.classList.toggle('dark', t === 'dark');
      document.querySelectorAll('[data-theme]').forEach(function (b) {
        b.classList.toggle('on', b.getAttribute('data-theme') === t);
      });
      LV.toast(t === 'dark' ? 'Тёмная тема включена' : 'Светлая тема включена');
    },
    toggle: function (key, el) {
      if (!S.settings) S.settings = {};
      S.settings[key] = !S.settings[key];
      LV.save();
      el.classList.toggle('on', !!S.settings[key]);
    },
    replay: function () {
      LV.closeApp();
      setTimeout(function () { LV.startTutorial(); }, 380);
    },
    reset: function () {
      if (!window.confirm('Сбросить прогресс? Корзина, заказы, избранное и данные приложений будут удалены, в том числе в облаке.')) return;
      var done = function () { location.reload(); };
      if (window.LV && LV.cloud && LV.cloud.clear) {
        var p = LV.cloud.clear();
        if (p && typeof p.then === 'function') { p.then(done, done); return; }
      } else {
        try { localStorage.removeItem('lavka_state_v1'); } catch (e) {}
        try { localStorage.removeItem('lavka_ts'); } catch (e) {}
        try { localStorage.removeItem('lavka_owner_xid'); } catch (e) {}
      }
      done();
    }
  };

  // =====================================================
  // XPRODC ID — единый аккаунт
  // =====================================================
  var xidView = null;
  var xidMode = 'login';

  function xidHeroHTML() {
    var u = S.user, on = !!u.xid;
    if (!on) {
      return '<div class="xid-hero off">' +
        '<span class="xid-shield"><i class="fa-solid fa-shield-halved"></i></span>' +
        '<h2>XPRODC ID</h2>' +
        '<p>Единый аккаунт для BankFake, Лавки, кошелька LAVKA PAY и сервисов экосистемы. Без него нельзя оформить заказ.</p>' +
        '</div>';
    }
    return '<div class="xid-hero">' +
      '<span class="xid-shield"><i class="fa-solid fa-shield-halved"></i></span>' +
      '<h2>' + LV.esc(u.name) + '</h2>' +
      '<p>Единый аккаунт XPRODC. Действует в BankFake, Лавке и сервисах экосистемы.</p>' +
      '<div class="xid-code">' + LV.esc(u.xid) +
      '<button type="button" onclick="XID.copy()" aria-label="Скопировать ID"><i class="fa-regular fa-copy"></i></button></div>' +
      '</div>';
  }

  function xidLoginForm() {
    return '<div class="xid-form">' +
      '<input class="field" id="xid-in-login" placeholder="Почта или ник" autocomplete="username" style="margin-bottom:8px">' +
      '<input class="field" id="xid-in-pass" type="password" placeholder="Пароль" autocomplete="current-password" style="margin-bottom:10px">' +
      '<button class="btn btn-primary btn-block" type="button" id="xid-login-btn" onclick="XID.login()">Войти</button>' +
      '<button class="btn btn-block" style="margin-top:8px" type="button" onclick="XID.tg()"><i class="fa-brands fa-telegram" style="color:#2AABEE"></i> Войти через Telegram</button>' +
      '</div>';
  }

  function xidRegForm() {
    return '<div class="xid-form">' +
      '<input class="field" id="xid-in-nick" placeholder="Ник (2–24 символа)" maxlength="24" style="margin-bottom:8px">' +
      '<input class="field" id="xid-in-email" type="email" placeholder="Почта" autocomplete="email" style="margin-bottom:8px">' +
      '<input class="field" id="xid-in-pass" type="password" placeholder="Пароль (от 6 символов)" autocomplete="new-password" style="margin-bottom:10px">' +
      '<button class="btn btn-primary btn-block" type="button" id="xid-reg-btn" onclick="XID.register()">Создать XPRODC ID</button>' +
      '<p class="center tiny muted" style="margin:9px 0 0">Один аккаунт для BankFake, Лавки и сервисов XPRODC</p>' +
      '</div>';
  }

  function xidAccountHTML() {
    var u = S.user;
    var bankHTML = (window.Bank && Bank.linked)
      ? '<div class="set-row"><span class="set-ico" style="background:#059669"><i class="fa-solid fa-building-columns"></i></span><div class="set-lbl"><b>BankFake</b><span>' + LV.esc(Bank.cardLast4(Bank.cards[0] || {}) === '0000' ? 'Счёт подключён' : 'Карты подключены') + '</span></div><span class="set-val">' + LV.fmt(Bank.balance) + '</span></div>'
      : '<div class="set-row"><span class="set-ico" style="background:#64748b"><i class="fa-solid fa-building-columns"></i></span><div class="set-lbl"><b>BankFake</b><span>Войдите в BankFake с этим ID, чтобы платить с его карт</span></div><span class="set-val">—</span></div>';
    return '<div class="xid-account">' +
      '<div class="prof-ava">' + LV.esc(LV.initials(u.name)) + '</div>' +
      '<div style="flex:1;min-width:0"><b>' + LV.esc(u.name) + '</b>' +
      '<span>' + (u.joined ? 'В Лавке с ' + LV.dateRu(u.joined) : 'Единый аккаунт XPRODC') + '</span></div>' +
      '<span class="pill green">активен</span></div>' +
      '<div class="set-group">' +
      '<div class="set-row"><span class="set-ico" style="background:#0ea5e9"><i class="fa-solid fa-envelope"></i></span><div class="set-lbl"><b>Почта</b><span>' + LV.esc(u.email || '—') + '</span></div></div>' +
      bankHTML +
      '<button class="set-row" type="button" onclick="XID.linkTg()"><span class="set-ico" style="background:#2AABEE"><i class="fa-brands fa-telegram"></i></span><div class="set-lbl"><b>Telegram</b><span>' + (u.tg ? 'Привязан ' + LV.esc(u.tg) : 'Вход и уведомления через Telegram') + '</span></div><span class="set-val">' + (u.tg ? 'привязан' : 'привязать') + '</span></button>' +
      '<button class="set-row" type="button" onclick="Profile.editName()"><span class="set-ico" style="background:#6366f1"><i class="fa-solid fa-pen"></i></span><div class="set-lbl"><b>Имя и аватар</b><span>Так вас видят продавцы</span></div><i class="fa-solid fa-chevron-right chev"></i></button>' +
      '</div>' +
      '<div class="xid-note"><i class="fa-solid fa-circle-info"></i><div>Один XPRODC ID используется в BankFake, Лавке, LAVKA PAY, почте и других сервисах. Он обязателен для оформления заказов.</div></div>' +
      '<button class="btn btn-block" type="button" onclick="XID.logout()" style="color:#ef4444;background:rgba(239,68,68,.08)">Выйти из XPRODC ID</button>';
  }

  function xidGuestHTML() {
    return '<div class="xid-tabs">' +
      '<button class="xid-tab' + (xidMode === 'login' ? ' on' : '') + '" type="button" onclick="XID.mode(\'login\')">Вход</button>' +
      '<button class="xid-tab' + (xidMode === 'reg' ? ' on' : '') + '" type="button" onclick="XID.mode(\'reg\')">Регистрация</button>' +
      '</div>' +
      (xidMode === 'reg' ? xidRegForm() : xidLoginForm()) +
      '<div class="xid-note"><i class="fa-solid fa-lock"></i><div>XPRODC ID обязателен: без него нельзя оформить заказ и пользоваться кошельком.</div></div>';
  }

  function xidRender() {
    if (!xidView) return;
    var on = !!S.user.xid;
    xidView.innerHTML =
      '<div class="appbar">' +
      '<button class="ab-btn" type="button" onclick="XID.close()" aria-label="Назад"><i class="fa-solid fa-chevron-left"></i></button>' +
      '<div class="ab-title">XPRODC ID<div class="ab-sub">' + (on ? 'Аккаунт подключён' : 'Единый аккаунт') + '</div></div>' +
      '<div class="ab-right">' + (on ? '<span class="pill green"><i class="fa-solid fa-circle-check"></i> активен</span>' : '') + '</div></div>' +
      '<div class="app-scroll pb" id="xid-scroll">' +
      xidHeroHTML() +
      (on ? xidAccountHTML() : xidGuestHTML()) +
      '<p class="center tiny muted" style="margin:10px 0 6px">XPRODC ID · единая учётная запись</p>' +
      '</div>';
  }

  function xidHostRefresh(msg) {
    LV.save();
    LV.updateHomeUser();
    if (msg) LV.toast(msg);
    var host = LV.current ? LV.current.id : null;
    if (host === 'profile' || host === 'settings' || host === 'wallet') {
      XID.close();
      LV.openApp(host);
    } else {
      xidRender();
    }
  }

  window.XID = {
    open: function () {
      if (!LV.current) {
        LV.openApp('profile');
        XID.show();
        return;
      }
      XID.show();
    },
    show: function () {
      var host = appRoot();
      if (!host) return;
      XID.close();
      xidMode = 'login';
      xidView = document.createElement('div');
      xidView.className = 'xid-view';
      xidView.id = 'xid-view';
      host.appendChild(xidView);
      xidRender();
    },
    close: function () {
      var v = document.getElementById('xid-view');
      if (v) v.remove();
      xidView = null;
    },
    mode: function (m) {
      xidMode = m === 'reg' ? 'reg' : 'login';
      xidRender();
    },
    login: function () {
      var l = document.getElementById('xid-in-login');
      var p = document.getElementById('xid-in-pass');
      var login = l ? l.value.trim() : '';
      var pass = p ? p.value : '';
      if (!login) { LV.toast('Введите почту или ник'); if (l) l.focus(); return; }
      if (!pass) { LV.toast('Введите пароль'); if (p) p.focus(); return; }
      var btn = document.getElementById('xid-login-btn');
      if (btn) { btn.disabled = true; btn.textContent = 'Входим…'; }
      LV.xidLogin(login, pass).then(function (me) {
        xidHostRefresh('Вы вошли как ' + me.username + ' (' + me.xid + ')');
      }).catch(function (e) {
        LV.toast(e && e.message ? e.message : 'Не удалось войти');
      }).then(function () {
        if (btn) { btn.disabled = false; btn.textContent = 'Войти'; }
      });
    },
    register: function () {
      var n = document.getElementById('xid-in-nick');
      var em = document.getElementById('xid-in-email');
      var p = document.getElementById('xid-in-pass');
      var nick = n ? n.value.trim() : '';
      var email = em ? em.value.trim() : '';
      var pass = p ? p.value : '';
      if (!/^[A-Za-zА-Яа-яЁё0-9_-]{2,24}$/.test(nick)) {
        LV.toast('Ник: 2–24 символа, буквы, цифры, - и _');
        if (n) n.focus();
        return;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        LV.toast('Введите корректную почту');
        if (em) em.focus();
        return;
      }
      if (pass.length < 6) { LV.toast('Пароль не короче 6 символов'); if (p) p.focus(); return; }
      var btn = document.getElementById('xid-reg-btn');
      if (btn) { btn.disabled = true; btn.textContent = 'Создаём…'; }
      LV.xidRegister(nick, email, pass).then(function (me) {
        xidHostRefresh('XPRODC ID создан: ' + me.xid);
      }).catch(function (e) {
        LV.toast(e && e.message ? e.message : 'Не удалось создать аккаунт');
      }).then(function () {
        if (btn) { btn.disabled = false; btn.textContent = 'Создать XPRODC ID'; }
      });
    },
    logout: function () {
      if (!S.user.xid) return;
      if (!window.confirm('Выйти из XPRODC ID? Оформление заказов станет недоступно.')) return;
      LV.xidLogout().then(function () {
        xidHostRefresh('Вы вышли из XPRODC ID');
      });
    },
    linkTg: function () {
      if (!S.user.xid) { LV.toast('Сначала войдите в XPRODC ID'); return; }
      sheet('<div class="sheet-grab"></div><h3>Telegram</h3><p class="sub">Привяжите @username — через него можно входить в XPRODC ID и получать статусы заказов.</p>' +
        '<input class="field" id="xid-tg-input" value="' + LV.esc(S.user.tg || '') + '" placeholder="@username" maxlength="33" style="margin-bottom:10px">' +
        '<button class="btn btn-primary btn-block" type="button" onclick="XID.saveTg()">Привязать</button>' +
        '<button class="btn btn-block" style="margin-top:8px" type="button" onclick="Profile.closeSheet()">Отмена</button>');
      setTimeout(function () {
        var i = document.getElementById('xid-tg-input');
        if (i) { i.focus(); i.select(); }
      }, 60);
    },
    saveTg: function () {
      var i = document.getElementById('xid-tg-input');
      var v = i ? i.value.trim().replace(/^@+/, '') : '';
      if (!/^[a-zA-Z0-9_]{4,32}$/.test(v)) { LV.toast('Введите корректный @username'); return; }
      S.user.tg = '@' + v;
      Profile.closeSheet();
      xidHostRefresh('Telegram привязан');
    },
    tg: function () {
      LV.toast('Вход через Telegram появится после привязки в BankFake');
    },
    copy: function () {
      if (S.user.xid) LV.copyText(S.user.xid, 'XPRODC ID скопирован');
    },
    achieve: function () { LV.toast('Открыто ' + achCount() + ' из 50 достижений'); },
    rating: function () { LV.toast('Рейтинг покупателя: ' + buyerRating() + ' из 5 · заказов ' + (S.orders || []).length); }
  };

  // =====================================================
  // ЗАМЕТКИ
  // =====================================================
  var notesEditId = null;
  var notesHost = null;

  function notesHTML() {
    if (!S.notes.length) {
      return '<div class="empty" style="padding-top:50px"><i class="fa-regular fa-note-sticky"></i>' +
        '<div class="empty-title">Заметок нет</div><div class="empty-text">Запиши список покупок или идею — заметка сохранится на телефоне.</div>' +
        '<button class="btn btn-primary" onclick="Notes.new()">Создать заметку</button></div>';
    }
    return S.notes.map(function (n) {
      return '<div class="note"><button class="note-del" type="button" onclick="Notes.del(' + n.id + ')" aria-label="Удалить"><i class="fa-solid fa-trash"></i></button>' +
        '<h4 onclick="Notes.open(' + n.id + ')">' + LV.esc(n.title) + '</h4>' +
        '<p onclick="Notes.open(' + n.id + ')">' + LV.esc(n.text) + '</p>' +
        '<time>' + LV.dateRu(n.date) + '</time></div>';
    }).join('');
  }

  LV.registerApp({
    id: 'notes', name: 'Заметки', icon: 'fa-note-sticky', bg: 'linear-gradient(140deg,#fbbf24,#f59e0b)',
    page: 0, installable: true,
    desc: 'Списки покупок, идеи и быстрые записи — всё под рукой.',
    mount: function (body) {
      notesHost = body;
      body.innerHTML = LV.appbar({ title: 'Заметки', sub: S.notes.length + ' шт.', right: '<button class="ab-btn" type="button" onclick="Notes.new()" aria-label="Новая заметка"><i class="fa-solid fa-plus"></i></button>' }) +
        '<div class="app-scroll flush"><div class="notes-list" id="notes-list">' + notesHTML() + '</div>' +
        '<div style="height:90px"></div></div>' +
        '<button class="note-add" type="button" onclick="Notes.new()" aria-label="Новая заметка"><i class="fa-solid fa-plus"></i></button>';
      return function () { notesHost = null; closeSheet(); };
    }
  });

  window.Notes = {
    rerender: function () {
      var l = document.getElementById('notes-list');
      if (l) l.innerHTML = notesHTML();
    },
    new: function () {
      notesEditId = null;
      sheet('<div class="sheet-grab"></div><h3>Новая заметка</h3><p class="sub">Заголовок и текст сохранятся на этом телефоне.</p>' +
        '<input class="field" id="note-title" placeholder="Заголовок" maxlength="48" style="margin-bottom:8px">' +
        '<textarea class="field" id="note-text" rows="5" placeholder="Текст заметки"></textarea>' +
        '<button class="btn btn-primary btn-block" style="margin-top:10px" type="button" onclick="Notes.save()">Сохранить</button>' +
        '<button class="btn btn-block" style="margin-top:8px" type="button" onclick="Notes.closeSheet()">Отмена</button>');
      setTimeout(function () { var i = document.getElementById('note-title'); if (i) i.focus(); }, 60);
    },
    open: function (id) {
      var n = S.notes.find(function (x) { return x.id === id; });
      if (!n) return;
      notesEditId = id;
      sheet('<div class="sheet-grab"></div><h3>Заметка</h3><p class="sub">' + LV.dateRu(n.date) + '</p>' +
        '<input class="field" id="note-title" value="' + LV.esc(n.title) + '" maxlength="48" style="margin-bottom:8px">' +
        '<textarea class="field" id="note-text" rows="6">' + LV.esc(n.text) + '</textarea>' +
        '<button class="btn btn-primary btn-block" style="margin-top:10px" type="button" onclick="Notes.save()">Сохранить</button>' +
        '<button class="btn btn-block" style="margin-top:8px;color:#ef4444" type="button" onclick="Notes.del(' + id + ')">Удалить</button>');
    },
    save: function () {
      var t = (document.getElementById('note-title') || {}).value || '';
      var x = (document.getElementById('note-text') || {}).value || '';
      if (!t.trim() && !x.trim()) { LV.toast('Пустая заметка'); return; }
      if (notesEditId) {
        S.notes.forEach(function (n) {
          if (n.id === notesEditId) { n.title = t.trim() || 'Без названия'; n.text = x.trim(); n.date = LV.todayISO(); }
        });
      } else {
        S.notes.unshift({ id: Date.now(), title: t.trim() || 'Без названия', text: x.trim(), date: LV.todayISO() });
      }
      LV.save();
      closeSheet();
      Notes.rerender();
      LV.toast('Заметка сохранена');
    },
    del: function (id) {
      S.notes = S.notes.filter(function (n) { return n.id !== id; });
      LV.save();
      closeSheet();
      Notes.rerender();
      LV.toast('Заметка удалена');
    },
    closeSheet: closeSheet
  };

  // =====================================================
  // КАЛЬКУЛЯТОР
  // =====================================================
  var calc = { cur: '0', prev: null, op: null, fresh: true };
  var calcKeyHandler = null;

  function calcSym(op) { return op === '*' ? '×' : op === '/' ? '÷' : op === '-' ? '−' : '+'; }
  function calcShow(v) {
    var s = String(v);
    if (s.indexOf('.') >= 0) s = s.replace('.', ',');
    return s;
  }
  function calcRender() {
    var val = document.getElementById('calc-val');
    var expr = document.getElementById('calc-expr');
    if (val) val.textContent = calcShow(calc.cur);
    if (expr) expr.textContent = calc.prev !== null && calc.op ? calcShow(calc.prev) + ' ' + calcSym(calc.op) : '';
  }

  LV.registerApp({
    id: 'calc', name: 'Калькулятор', icon: 'fa-calculator', bg: 'linear-gradient(140deg,#0f766e,#134e4a)',
    page: 0,
    mount: function (body) {
      calc = { cur: '0', prev: null, op: null, fresh: true };
      body.innerHTML = LV.appbar({ title: 'Калькулятор', right: '<button class="ab-btn" type="button" onclick="Calc.reset()" aria-label="Сброс"><i class="fa-solid fa-arrow-rotate-left"></i></button>' }) +
        '<div class="calc">' +
        '<div class="calc-disp"><div class="calc-expr" id="calc-expr"></div><div class="calc-val" id="calc-val">0</div></div>' +
        '<div class="calc-grid">' +
        '<button class="ck fn" type="button" data-k="C">C</button>' +
        '<button class="ck fn" type="button" data-k="+/-">±</button>' +
        '<button class="ck fn" type="button" data-k="%">%</button>' +
        '<button class="ck op" type="button" data-k="/">÷</button>' +
        '<button class="ck" type="button" data-k="7">7</button>' +
        '<button class="ck" type="button" data-k="8">8</button>' +
        '<button class="ck" type="button" data-k="9">9</button>' +
        '<button class="ck op" type="button" data-k="*">×</button>' +
        '<button class="ck" type="button" data-k="4">4</button>' +
        '<button class="ck" type="button" data-k="5">5</button>' +
        '<button class="ck" type="button" data-k="6">6</button>' +
        '<button class="ck op" type="button" data-k="-">−</button>' +
        '<button class="ck" type="button" data-k="1">1</button>' +
        '<button class="ck" type="button" data-k="2">2</button>' +
        '<button class="ck" type="button" data-k="3">3</button>' +
        '<button class="ck op" type="button" data-k="+">+</button>' +
        '<button class="ck zero" type="button" data-k="0">0</button>' +
        '<button class="ck" type="button" data-k=".">,</button>' +
        '<button class="ck eq" type="button" data-k="=">=</button>' +
        '</div></div>';
      body.querySelectorAll('[data-k]').forEach(function (b) {
        b.addEventListener('click', function () { Calc.press(b.getAttribute('data-k')); });
      });
      calcKeyHandler = function (e) {
        var k = e.key;
        if (/^[0-9]$/.test(k)) Calc.press(k);
        else if (k === '.' || k === ',') Calc.press('.');
        else if (k === '+' || k === '-' || k === '*' || k === '/') { Calc.press(k); e.preventDefault(); }
        else if (k === 'Enter' || k === '=') { Calc.press('='); e.preventDefault(); }
        else if (k === 'Backspace') { Calc.press('del'); e.preventDefault(); }
        else if (k === 'Escape' || k.toLowerCase() === 'c') Calc.press('C');
      };
      document.addEventListener('keydown', calcKeyHandler);
      calcRender();
      return function () {
        if (calcKeyHandler) document.removeEventListener('keydown', calcKeyHandler);
        calcKeyHandler = null;
      };
    }
  });

  window.Calc = {
    press: function (k) {
      if (k === 'C') { calc = { cur: '0', prev: null, op: null, fresh: true }; calcRender(); return; }
      if (k === 'del') {
        if (calc.fresh) return;
        calc.cur = calc.cur.length > 1 ? calc.cur.slice(0, -1) : '0';
        if (calc.cur === '-') calc.cur = '0';
        calcRender(); return;
      }
      if (k === '%') {
        calc.cur = String(parseFloat(calc.cur || '0') / 100);
        calc.fresh = true;
        calcRender(); return;
      }
      if (k === '+/-') {
        calc.cur = calc.cur.charAt(0) === '-' ? calc.cur.slice(1) : (calc.cur === '0' ? '0' : '-' + calc.cur);
        calcRender(); return;
      }
      if (k === '+' || k === '-' || k === '*' || k === '/') {
        if (calc.prev !== null && calc.op && !calc.fresh) Calc.equals();
        calc.prev = parseFloat(calc.cur || '0');
        calc.op = k;
        calc.fresh = true;
        calcRender(); return;
      }
      if (k === '=') {
        if (calc.prev !== null && calc.op) {
          var b = parseFloat(calc.cur || '0');
          var a = calc.prev;
          var r = calc.op === '+' ? a + b : calc.op === '-' ? a - b : calc.op === '*' ? a * b : (b === 0 ? NaN : a / b);
          if (!isFinite(r) || isNaN(r)) { calc.cur = 'Ошибка'; calc.prev = null; calc.op = null; calc.fresh = true; calcRender(); return; }
          r = Math.round(r * 1e10) / 1e10;
          calc.cur = String(r);
          calc.prev = null;
          calc.op = null;
          calc.fresh = true;
        }
        calcRender(); return;
      }
      // цифры и точка
      if (calc.cur === 'Ошибка') { calc.cur = '0'; calc.prev = null; calc.op = null; calc.fresh = true; }
      if (calc.fresh) { calc.cur = k === '.' ? '0.' : k; calc.fresh = false; }
      else {
        if (k === '.' && calc.cur.indexOf('.') >= 0) return;
        if (calc.cur === '0' && k !== '.') calc.cur = k;
        else calc.cur += k;
      }
      calcRender();
    },
    reset: function () { Calc.press('C'); }
  };

  // =====================================================
  // ПОГОДА
  // =====================================================
  LV.registerApp({
    id: 'weather', name: 'Погода', icon: 'fa-cloud-sun', bg: 'linear-gradient(140deg,#0ea5e9,#0369a1)',
    page: 0,
    mount: function (body) {
      var hours = [
        ['Сейчас', 'fa-cloud-sun', '+3°'], ['15:00', 'fa-cloud', '+2°'], ['16:00', 'fa-cloud-rain', '+1°'],
        ['17:00', 'fa-cloud-rain', '0°'], ['18:00', 'fa-snowflake', '-1°'], ['19:00', 'fa-cloud-moon', '-2°']
      ];
      var days = [
        ['Сегодня', 'fa-cloud-sun', 'Облачно с прояснениями', '+3°', '-2°'],
        ['Чт', 'fa-cloud-rain', 'Небольшой дождь', '+2°', '-1°'],
        ['Пт', 'fa-snowflake', 'Снег', '0°', '-4°'],
        ['Сб', 'fa-sun', 'Ясно', '+1°', '-5°'],
        ['Вс', 'fa-cloud', 'Пасмурно', '+2°', '-3°']
      ];
      body.innerHTML = LV.appbar({ title: 'Погода', right: '<button class="ab-btn" type="button" onclick="LV.toast(\'Москва · обновлено только что\')" aria-label="Обновить"><i class="fa-solid fa-rotate"></i></button>' }) +
        '<div class="app-scroll pb">' +
        '<div class="weather-hero"><div class="w-city"><i class="fa-solid fa-location-dot"></i> Москва</div>' +
        '<div class="w-temp">+3°</div><div class="w-desc">Облачно с прояснениями</div>' +
        '<div class="w-range">Макс.: +4° · Мин.: −2° · Ощущается как 0°</div>' +
        '<div class="w-hourly">' + hours.map(function (h) {
          return '<div class="w-hour"><span>' + h[0] + '</span><i class="fa-solid ' + h[1] + '"></i><b>' + h[2] + '</b></div>';
        }).join('') + '</div></div>' +
        '<div class="w-days">' + days.map(function (d) {
          return '<div class="w-day"><span class="d-name">' + d[0] + '</span><i class="fa-solid ' + d[1] + '"></i><span class="d-desc">' + d[2] + '</span><b>' + d[3] + '</b><span class="d-lo">' + d[4] + '</span></div>';
        }).join('') + '</div>' +
        '<div class="w-extra">' +
        '<div class="w-card"><span>Ветер</span><b>4 м/с</b></div>' +
        '<div class="w-card"><span>Влажность</span><b>78%</b></div>' +
        '<div class="w-card"><span>Давление</span><b>746 мм</b></div>' +
        '<div class="w-card"><span>Восход / закат</span><b>7:48 / 16:32</b></div>' +
        '</div>' +
        '<p class="center tiny muted" style="padding:14px 20px">Данные для симулятора · обновлено в ' + LV.clockStr(new Date()) + '</p>' +
        '</div>';
    }
  });

  // =====================================================
  // КАЛЕНДАРЬ
  // =====================================================
  var CAL_MONTH = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  var calOffset = 0;
  var calSelected = new Date().getDate();
  var CAL_EV = {
    3: [{ t: '10:00', n: 'Встреча с командой', p: 'Онлайн' }, { t: '19:00', n: 'Тренировка', p: 'Зал' }],
    7: [{ t: '12:30', n: 'Доставка заказа', p: 'Курьер' }],
    12: [{ t: '09:00', n: 'Оплата подписки', p: 'Лавка+' }],
    18: [{ t: '11:00', n: 'Созвон по проекту', p: 'Онлайн' }, { t: '18:30', n: 'Ужин с друзьями', p: 'Кафе' }],
    21: [{ t: '15:00', n: 'Врач', p: 'Поликлиника' }],
    25: [{ t: '10:00', n: 'Сдача отчёта', p: 'Работа' }],
    28: [{ t: '20:00', n: 'Кино', p: 'Кинотеатр' }]
  };

  function calRenderGrid() {
    var now = new Date();
    var base = new Date(now.getFullYear(), now.getMonth() + calOffset, 1);
    var y = base.getFullYear(), m = base.getMonth();
    var first = (new Date(y, m, 1).getDay() + 6) % 7;
    var daysIn = new Date(y, m + 1, 0).getDate();
    var prevDays = new Date(y, m, 0).getDate();
    var cells = '';
    for (var i = 0; i < 42; i++) {
      var dayNum, other = false;
      if (i < first) { dayNum = prevDays - first + i + 1; other = true; }
      else if (i >= first + daysIn) { dayNum = i - first - daysIn + 1; other = true; }
      else dayNum = i - first + 1;
      var isToday = calOffset === 0 && dayNum === now.getDate() && !other;
      var sel = calOffset === 0 && dayNum === calSelected && !other;
      var ev = !other && calOffset === 0 && CAL_EV[dayNum];
      cells += '<button class="cal-day' + (other ? ' other' : '') + (isToday ? ' today' : '') + (sel && !isToday ? ' sel' : '') + '" type="button" ' +
        (other ? 'disabled' : ' onclick="Calendar.pick(' + dayNum + ')"') + '>' + dayNum +
        (ev ? '<span class="evd"></span>' : '') + '</button>';
    }
    var title = CAL_MONTH[m] + ' ' + y;
    var events = calOffset === 0 ? (CAL_EV[calSelected] || []) : [];
    var evHTML = events.length ? events.map(function (e) {
      return '<div class="cal-ev"><span class="ev-time">' + e.t + '</span><div><b>' + e.n + '</b><span>' + e.p + '</span></div></div>';
    }).join('') : '<p class="tiny muted" style="padding:14px 0">На этот день ничего не запланировано.</p>';
    var gridEl = document.getElementById('cal-grid');
    var titleEl = document.getElementById('cal-title');
    var evEl = document.getElementById('cal-events');
    if (gridEl) gridEl.innerHTML = cells;
    if (titleEl) titleEl.textContent = title;
    if (evEl) evEl.innerHTML = evHTML;
  }

  LV.registerApp({
    id: 'calendar', name: 'Календарь', icon: 'fa-calendar-days', bg: 'linear-gradient(140deg,#ef4444,#b91c1c)',
    page: 0,
    mount: function (body) {
      calOffset = 0;
      calSelected = new Date().getDate();
      body.innerHTML = LV.appbar({ title: 'Календарь', right: '<button class="ab-btn" type="button" onclick="Calendar.today()" aria-label="Сегодня"><i class="fa-solid fa-location-crosshairs"></i></button>' }) +
        '<div class="app-scroll pb">' +
        '<div class="cal-head"><button class="cal-nav" type="button" onclick="Calendar.month(-1)" aria-label="Назад"><i class="fa-solid fa-chevron-left"></i></button>' +
        '<b id="cal-title">' + CAL_MONTH[new Date().getMonth()] + ' ' + new Date().getFullYear() + '</b>' +
        '<button class="cal-nav" type="button" onclick="Calendar.month(1)" aria-label="Вперёд"><i class="fa-solid fa-chevron-right"></i></button></div>' +
        '<div class="cal-week"><span>ПН</span><span>ВТ</span><span>СР</span><span>ЧТ</span><span>ПТ</span><span>СБ</span><span>ВС</span></div>' +
        '<div class="cal-grid" id="cal-grid"></div>' +
        '<div class="hr"></div>' +
        '<div class="sec-title" style="margin-bottom:2px">События</div>' +
        '<div class="cal-events" id="cal-events"></div>' +
        '</div>';
      calRenderGrid();
    }
  });

  window.Calendar = {
    month: function (d) {
      calOffset += d;
      calSelected = calOffset === 0 ? new Date().getDate() : 1;
      calRenderGrid();
    },
    pick: function (d) { calSelected = d; calRenderGrid(); },
    today: function () { calOffset = 0; calSelected = new Date().getDate(); calRenderGrid(); }
  };

  // =====================================================
  // ЧАСЫ
  // =====================================================
  var clockTimer = null;
  var WORLD = [['Москва', 3], ['Лондон', 0], ['Нью-Йорк', -5], ['Токио', 9]];

  function clockTick() {
    var d = new Date();
    var h = document.getElementById('hand-h'), m = document.getElementById('hand-m'), s = document.getElementById('hand-s');
    var sec = d.getSeconds(), min = d.getMinutes() + sec / 60, hr = (d.getHours() % 12) + min / 60;
    if (h) h.style.transform = 'rotate(' + hr * 30 + 'deg)';
    if (m) m.style.transform = 'rotate(' + min * 6 + 'deg)';
    if (s) s.style.transform = 'rotate(' + sec * 6 + 'deg)';
    var dig = document.getElementById('clock-digital');
    if (dig) dig.textContent = LV.clockStr(d) + ':' + String(sec).padStart(2, '0');
    var wl = document.getElementById('world-list');
    if (wl) {
      wl.innerHTML = WORLD.map(function (w) {
        var utc = d.getTime() + d.getTimezoneOffset() * 60000 + w[1] * 3600000;
        var wd = new Date(utc);
        return '<div class="world-row"><div style="flex:1"><b>' + w[0] + '</b><span>UTC' + (w[1] >= 0 ? '+' : '') + w[1] + '</span></div><time>' + LV.clockStr(wd) + '</time></div>';
      }).join('');
    }
  }

  LV.registerApp({
    id: 'clock', name: 'Часы', icon: 'fa-clock', bg: 'linear-gradient(140deg,#1e293b,#0f172a)',
    page: 0,
    mount: function (body) {
      var nums = '';
      var R = 86;
      for (var i = 1; i <= 12; i++) {
        var a = i * Math.PI / 6;
        nums += '<span class="clock-num" style="left:' + (110 + R * Math.sin(a)) + 'px;top:' + (110 - R * Math.cos(a)) + 'px">' + i + '</span>';
      }
      body.innerHTML = LV.appbar({ title: 'Часы', right: '<button class="ab-btn" type="button" onclick="Clock.world()" aria-label="Мировые часы"><i class="fa-solid fa-earth-europe"></i></button>' }) +
        '<div class="app-scroll pb">' +
        '<div class="clock-face">' + nums +
        '<div class="hand hand-h" id="hand-h"></div><div class="hand hand-m" id="hand-m"></div><div class="hand hand-s" id="hand-s"></div>' +
        '<div class="clock-pin"></div></div>' +
        '<div class="clock-digital" id="clock-digital">--:--:--</div>' +
        '<div class="clock-date">' + LV.dateFull(LV.todayISO()) + ' · ' + ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'][new Date().getDay()] + '</div>' +
        '<div class="sec-title" style="margin-bottom:2px">Мировые часы</div>' +
        '<div id="world-list"></div>' +
        '<div class="hr"></div>' +
        '<div class="sec-title" style="margin-bottom:8px">Будильники</div>' +
        '<div class="card"><div class="row"><div style="flex:1"><b style="font-size:15px">07:30</b><div class="tiny muted">Будни · встроенный будильник</div></div><span class="switch on"></span></div></div>' +
        '<p class="center tiny muted" style="margin-top:14px">Часовой пояс: Москва, UTC+3</p>' +
        '</div>';
      clockTick();
      clearInterval(clockTimer);
      clockTimer = setInterval(clockTick, 1000);
      return function () { clearInterval(clockTimer); clockTimer = null; };
    }
  });

  window.Clock = {
    world: function () { LV.toast('Москва, Лондон, Нью-Йорк, Токио'); }
  };

  // =====================================================
  // МУЗЫКА
  // =====================================================
  var TRACKS = [
    { t: 'Северный свет', a: 'Лавка Sound', d: 214, c: '#0ea5e9', c2: '#1d4ed8' },
    { t: 'Пустой бульвар', a: 'Тихие улицы', d: 197, c: '#8b5cf6', c2: '#4c1d95' },
    { t: 'Кофе на рассвете', a: 'Утро', d: 246, c: '#f59e0b', c2: '#b45309' },
    { t: 'Между строк', a: 'Слово', d: 182, c: '#ef4444', c2: '#7f1d1d' },
    { t: 'Тёплый вечер', a: 'Дом', d: 231, c: '#10b981', c2: '#065f46' }
  ];
  var music = { i: 0, playing: false, pos: 39, timer: null };

  function trackArt(t) {
    return LV.svgArt(t.c, LV.initials(t.t), LV.hash(t.t), true);
  }
  function fmtTime(s) {
    s = Math.max(0, Math.floor(s));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
  function musicRenderHero() {
    var t = TRACKS[music.i];
    var artEl = document.getElementById('music-art');
    var titleEl = document.getElementById('music-title');
    var artistEl = document.getElementById('music-artist');
    var playEl = document.getElementById('music-play');
    if (artEl) artEl.src = trackArt(t);
    if (titleEl) titleEl.textContent = t.t;
    if (artistEl) artistEl.textContent = t.a;
    if (playEl) playEl.innerHTML = '<i class="fa-solid fa-' + (music.playing ? 'pause' : 'play') + '"></i>';
    var bar = document.getElementById('music-bar');
    if (bar) bar.style.width = (music.pos / t.d * 100) + '%';
    var pos = document.getElementById('music-pos');
    var dur = document.getElementById('music-dur');
    if (pos) pos.textContent = fmtTime(music.pos);
    if (dur) dur.textContent = fmtTime(t.d);
    document.querySelectorAll('[data-track]').forEach(function (r, idx) {
      r.style.background = idx === music.i ? 'var(--green-soft)' : '';
    });
  }
  function musicStart() {
    clearInterval(music.timer);
    music.timer = setInterval(function () {
      if (!music.playing) return;
      music.pos++;
      if (music.pos >= TRACKS[music.i].d) { Music.next(); return; }
      musicRenderHero();
    }, 1000);
  }

  LV.registerApp({
    id: 'music', name: 'Музыка', icon: 'fa-music', bg: 'linear-gradient(140deg,#f43f5e,#be123c)',
    page: 0,
    mount: function (body) {
      music.playing = false;
      music.pos = 39;
      var t = TRACKS[music.i];
      body.innerHTML = LV.appbar({ title: 'Музыка', sub: 'Плейлист «Для себя»' }) +
        '<div class="app-scroll pb">' +
        '<div class="music-art"><img id="music-art" src="' + trackArt(t) + '" alt="Обложка"></div>' +
        '<div class="music-title" id="music-title">' + t.t + '</div>' +
        '<div class="music-artist" id="music-artist">' + t.a + '</div>' +
        '<div class="music-progress"><i id="music-bar"></i></div>' +
        '<div class="music-times"><span id="music-pos">0:39</span><span id="music-dur">' + fmtTime(t.d) + '</span></div>' +
        '<div class="music-controls">' +
        '<button class="mc" type="button" onclick="Music.prev()" aria-label="Назад"><i class="fa-solid fa-backward-step"></i></button>' +
        '<button class="mc play" id="music-play" type="button" onclick="Music.toggle()" aria-label="Играть"><i class="fa-solid fa-play"></i></button>' +
        '<button class="mc" type="button" onclick="Music.next()" aria-label="Вперёд"><i class="fa-solid fa-forward-step"></i></button>' +
        '</div>' +
        '<div class="mkt-sec"><div class="sec-head" style="padding-left:2px"><span class="sec-title">Плейлист</span><span class="tiny muted">5 треков</span></div>' +
        TRACKS.map(function (tr, i) {
          return '<button class="track" type="button" data-track="' + i + '" onclick="Music.pick(' + i + ')">' +
            '<img src="' + trackArt(tr) + '" alt="">' +
            '<span style="flex:1;min-width:0"><b>' + tr.t + '</b><span>' + tr.a + '</span></span>' +
            '<span class="tr-dur">' + fmtTime(tr.d) + '</span></button>';
        }).join('') +
        '</div>' +
        '<p class="center tiny muted" style="margin-top:14px">Симулятор плеера · без реального звука</p>' +
        '</div>';
      musicRenderHero();
      musicStart();
      return function () { clearInterval(music.timer); music.timer = null; music.playing = false; };
    }
  });

  window.Music = {
    toggle: function () { music.playing = !music.playing; musicRenderHero(); },
    next: function () { music.i = (music.i + 1) % TRACKS.length; music.pos = 0; musicRenderHero(); },
    prev: function () {
      if (music.pos > 4) { music.pos = 0; } else { music.i = (music.i - 1 + TRACKS.length) % TRACKS.length; music.pos = 0; }
      musicRenderHero();
    },
    pick: function (i) { music.i = i; music.pos = 0; music.playing = true; musicRenderHero(); }
  };

  // =====================================================
  // ЗДОРОВЬЕ
  // =====================================================
  LV.registerApp({
    id: 'health', name: 'Здоровье', icon: 'fa-heart-pulse', bg: 'linear-gradient(140deg,#fb7185,#e11d48)',
    page: 0,
    mount: function (body) {
      body.innerHTML = LV.appbar({ title: 'Здоровье', sub: 'Сегодня, 18 ноября' }) +
        '<div class="app-scroll pb">' +
        '<div class="health-hero"><h3>Хороший день</h3><p>Ты почти выполнил цель по шагам</p>' +
        '<div class="rings"><div class="ring" style="background:conic-gradient(#a7f3d0 0 74%, rgba(255,255,255,.18) 74% 100%)"><div style="text-align:center"><b>74%</b><small>ЦЕЛЬ</small></div></div>' +
        '<div class="rings-list">' +
        '<div class="rl"><i class="fa-solid fa-shoe-prints"></i> Шаги <span>8 432</span></div>' +
        '<div class="rl"><i class="fa-solid fa-fire"></i> Калории <span>412</span></div>' +
        '<div class="rl"><i class="fa-solid fa-location-dot"></i> Дистанция <span>6,2 км</span></div>' +
        '</div></div></div>' +
        '<div class="h-stat" style="margin-top:14px">' +
        '<div class="h-card"><i class="fa-solid fa-heart"></i><b>62</b><span>Пульс в покое, уд/мин</span></div>' +
        '<div class="h-card"><i class="fa-solid fa-moon"></i><b>7:24</b><span>Сон прошлой ночью</span></div>' +
        '<div class="h-card"><i class="fa-solid fa-glass-water"></i><b>1,4 л</b><span>Вода за день</span></div>' +
        '<div class="h-card"><i class="fa-solid fa-person-walking"></i><b>6 200</b><span>Шагов до цели</span></div>' +
        '</div>' +
        '<div class="mkt-sec"><div class="sec-head"><span class="sec-title">Активность</span><span class="tiny muted">за неделю</span></div>' +
        '<div class="card" style="padding:14px">' +
        '<div style="display:flex;align-items:flex-end;gap:8px;height:96px">' +
        [42, 68, 54, 82, 61, 76, 47].map(function (v, i) {
          return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end">' +
            '<div style="width:100%;border-radius:7px 7px 3px 3px;background:' + (i === 6 ? 'linear-gradient(180deg,#34d399,#10b981)' : 'var(--chip)') + ';height:' + v + '%"></div>' +
            '<span class="tiny muted" style="font-size:8.5px">' + ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][i] + '</span></div>';
        }).join('') + '</div></div></div>' +
        '<p class="center tiny muted" style="margin-top:14px">Данные симулятора · не медицинская рекомендация</p>' +
        '</div>';
    }
  });

  // =====================================================
  // КОШЕЛЁК
  // =====================================================
  LV.registerApp({
    id: 'wallet', name: 'Кошелёк', icon: 'fa-wallet', bg: 'linear-gradient(140deg,#0f172a,#334155)',
    page: null, dock: true,
    mount: function (body) {
      var bankOn = !!(window.Bank && Bank.linked);
      var tx = [];
      S.orders.slice(0, 2).forEach(function (o) {
        tx.push({ icon: 'fa-bag-shopping', name: 'Лавка · ' + o.num, date: LV.dateRu(o.date), amt: -o.total });
      });
      tx.push({ icon: 'fa-briefcase', name: 'Зарплата', date: '10 ноября', amt: 64000, plus: true });
      tx.push({ icon: 'fa-mug-hot', name: 'Кофейня на углу', date: '9 ноября', amt: -340 });
      tx.push({ icon: 'fa-music', name: 'Лавка+ Подписка', date: '7 ноября', amt: -299 });
      tx.push({ icon: 'fa-arrow-down', name: 'Перевод от Марии С.', date: '5 ноября', amt: 2500, plus: true });
      var cardHTML = bankOn
        ? '<div class="wcard"><div class="wcard-top"><span>BANKFAKE</span><i class="fa-solid fa-building-columns"></i></div>' +
          '<div class="wcard-bal">' + LV.fmt(Bank.balance) + '</div>' +
          '<div class="wcard-sub">Основной счёт · XPRODC ID ' + LV.esc(S.user.xid) + '</div>' +
          '<div class="wcard-num">•••• •••• •••• ' + Bank.cardLast4(Bank.cards[0] || {}) + '</div>' +
          '<div class="wcard-bot"><span>' + LV.esc((S.user.name || '—').toUpperCase()) + '</span><span>' + LV.esc(S.user.email || 'XPRODC') + '</span></div></div>' +
          (Bank.cards.length
            ? '<div class="mkt-sec"><div class="sec-head"><span class="sec-title">Карты BankFake</span></div>' +
              Bank.cards.map(function (c) {
                return '<div class="tx"><span class="tx-ico"><i class="fa-solid fa-credit-card"></i></span>' +
                  '<div style="flex:1;min-width:0"><b>' + LV.esc(Bank.cardLabel(c)) + '</b><span>' + (c.blocked ? 'заблокирована' : (c.isGold ? 'премиальная' : 'активна')) + '</span></div>' +
                  '<span class="amt">' + (c.isGold ? 'без лимита' : LV.fmt(c.balance)) + '</span></div>';
              }).join('') + '</div>'
            : '')
        : '<div class="wcard"><div class="wcard-top"><span>LAVKA PAY</span><i class="fa-solid fa-wifi" style="transform:rotate(90deg)"></i></div>' +
          '<div class="wcard-bal">' + LV.fmt(S.balance) + '</div>' +
          '<div class="wcard-sub">Основной счёт · ' + (S.user.xid ? 'XPRODC ID ' + LV.esc(S.user.xid) : 'XPRODC ID не подключён') + '</div>' +
          '<div class="wcard-num">•••• •••• •••• 4417</div>' +
          '<div class="wcard-bot"><span>' + LV.esc((S.user.name || '—').toUpperCase()) + '</span><span>09/29</span></div></div>';
      body.innerHTML = LV.appbar({ title: 'Кошелёк', right: '<button class="ab-btn" type="button" onclick="Wallet.more()" aria-label="Ещё"><i class="fa-solid fa-ellipsis"></i></button>' }) +
        '<div class="app-scroll pb">' +
        cardHTML +
        '<div class="row" style="padding:0 14px;gap:8px">' +
        '<button class="btn btn-primary" style="flex:1" type="button" onclick="Wallet.top()">Пополнить</button>' +
        '<button class="btn" style="flex:1" type="button" onclick="Wallet.send()">Перевести</button></div>' +
        '<div class="mkt-sec"><div class="sec-head"><span class="sec-title">Операции</span><span class="tiny muted">ноябрь</span></div>' +
        tx.map(function (t) {
          return '<div class="tx"><span class="tx-ico' + (t.plus ? ' in' : '') + '"><i class="fa-solid ' + t.icon + '"></i></span>' +
            '<div style="flex:1;min-width:0"><b>' + LV.esc(t.name) + '</b><span>' + t.date + '</span></div>' +
            '<span class="amt' + (t.plus ? ' plus' : '') + '">' + (t.amt > 0 ? '+' : '−') + LV.fmt(Math.abs(t.amt)) + '</span></div>';
        }).join('') + '</div>' +
        '<p class="center tiny muted" style="margin-top:14px">' + (bankOn ? 'BANKFAKE · оплата из Лавки' : 'LAVKA PAY · симулятор') + ', реальные деньги не используются</p>' +
        '</div>';
    }
  });

  window.Wallet = {
    top: function () { LV.toast('Пополнение отключено в симуляторе'); },
    send: function () { LV.toast('Переводы по X ID — скоро'); },
    more: function () { LV.toast('LAVKA PAY · v1.0'); }
  };

  // =====================================================
  // ПОЧТА
  // =====================================================
  var MAIL = [
    { from: 'Лавка', subj: 'Ваш заказ в пути', prev: 'Курьер уже выехал, доставка сегодня до 18:00', time: '12:40', unread: true, body: 'Здравствуйте!\n\nВаш заказ собран и передан курьеру. Ожидайте доставку сегодня с 14:00 до 18:00. Курьер позвонит за 20 минут.\n\nОтследить заказ можно в приложении «Лавка» → Заказы.\n\nКоманда Лавки' },
    { from: 'XPRODC ID', subj: 'Новый вход в аккаунт', prev: 'Устройство Lavka Phone 15 · Москва', time: '11:02', unread: true, body: 'Зафиксирован новый вход в аккаунт X-82641735.\n\nУстройство: Lavka Phone 15\nГород: Москва\nВремя: сегодня, 11:02\n\nЕсли это были не вы — смените пароль в разделе «Безопасность».\n\nСлужба безопасности XPRODC ID' },
    { from: 'Лавка Бонусы', subj: 'Начислено 250 бонусов', prev: 'Спасибо за покупку! Бонусы уже на счёте', time: 'Вчера', unread: false, body: 'На ваш бонусный счёт начислено 250 бонусов.\n\n1 бонус = 1 ₽ при оплате следующего заказа. Бонусы действуют 90 дней.\n\nПриятных покупок!' },
    { from: 'Команда Лавки', subj: 'Подборка недели: техника', prev: 'Смартфоны, наушники и ноутбуки со скидкой', time: 'Вчера', unread: false, body: 'Мы собрали подборку техники недели: смартфоны, наушники, ноутбуки и аксессуары.\n\nСкидки до 40% действуют до воскресенья.' },
    { from: 'Ольга В.', subj: 'Фотографии с поездки', prev: 'Отправила всё, что успела обработать', time: '16 ноя', unread: false, body: 'Привет! Отправила фотографии с поездки. Часть уже в галерее телефона.\n\nВыбери лучшие — распечатаем.' },
    { from: 'LAVKA PAY', subj: 'Выписка за ноябрь', prev: 'Баланс на конец периода: 24 800 ₽', time: '15 ноя', unread: false, body: 'Выписка по счёту •••• 4417 за ноябрь.\n\nПоступления: 66 500 ₽\nСписания: 1 700 ₽\nБаланс: 24 800 ₽\n\nПолная выписка доступна в приложении «Кошелёк».' }
  ];
  var mailHost = null;
  var mailRead = {};

  function mailAll() {
    return MAIL.concat(window.BizSms ? window.BizSms() : []);
  }
  function mailUnreadCount() {
    return mailAll().filter(function (m, i) { return m.dyn ? m.unread : (m.unread && !mailRead[i]); }).length;
  }
  window.UnreadMail = mailUnreadCount;

  function mailListHTML() {
    return mailAll().map(function (m, i) {
      var unread = m.dyn ? m.unread : (m.unread && !mailRead[i]);
      return '<button class="mail-row" type="button" onclick="Mail.open(' + i + ')">' +
        '<span class="mail-ava">' + LV.esc(LV.initials(m.from)) + '</span>' +
        '<span class="mail-body"><span class="mail-top"><b>' + LV.esc(m.from) + '</b><time>' + m.time + '</time></span>' +
        '<span class="mail-sub">' + LV.esc(m.subj) + '</span>' +
        '<span class="mail-prev">' + LV.esc(m.prev) + '</span></span>' +
        (unread ? '<span class="unread"></span>' : '') + '</button>';
    }).join('');
  }

  LV.registerApp({
    id: 'mail', name: 'Почта', icon: 'fa-envelope', bg: 'linear-gradient(140deg,#3b82f6,#1d4ed8)',
    page: 0,
    mount: function (body) {
      mailHost = body;
      renderMailList();
      return function () { mailHost = null; };
    }
  });

  function renderMailList() {
    if (!mailHost) return;
    var unread = mailUnreadCount();
    mailHost.innerHTML = LV.appbar({
      title: 'Почта', sub: unread ? unread + ' непрочитанных' : 'Всё прочитано',
      right: '<button class="ab-btn" type="button" onclick="Mail.compose()" aria-label="Написать"><i class="fa-solid fa-pen"></i></button>'
    }) + '<div class="app-scroll flush">' + mailListHTML() + '<p class="center tiny muted" style="padding:18px">Показаны последние письма</p></div>';
  }

  window.Mail = {
    open: function (i) {
      var m = mailAll()[i];
      if (!m || !mailHost) return;
      if (m.dyn) {
        if (window.BizSmsRead) window.BizSmsRead(m.id);
      } else {
        mailRead[i] = true;
      }
      LV.renderApps();
      mailHost.innerHTML = '<div class="appbar"><button class="ab-btn" type="button" onclick="Mail.list()" aria-label="Назад"><i class="fa-solid fa-chevron-left"></i></button>' +
        '<div class="ab-title">Письмо</div><div class="ab-right"></div></div>' +
        '<div class="app-scroll pb">' +
        '<div class="tiny muted">' + LV.esc(m.from) + '</div>' +
        '<div style="font-size:18px;font-weight:900;letter-spacing:-.4px;line-height:1.3;margin:6px 0 4px">' + LV.esc(m.subj) + '</div>' +
        '<div class="tiny muted" style="margin-bottom:14px">' + m.time + ' · кому: ' + LV.esc(S.user.name) + '</div>' +
        '<div class="hr" style="margin-top:0"></div>' +
        '<p style="font-size:12.5px;line-height:1.7;color:var(--sub);white-space:pre-wrap">' + LV.esc(m.body) + '</p>' +
        '<button class="btn btn-block" style="margin-top:18px" type="button" onclick="Mail.list()">К списку писем</button>' +
        '</div>';
    },
    list: renderMailList,
    compose: function () { LV.toast('Отправка писем недоступна в симуляторе'); }
  };

  // =====================================================
  // СООБЩЕНИЯ
  // =====================================================
  var CHATS = [
    { name: 'Мария С.', last: 'Спасибо! Курьер уже едет', time: '12:31', unread: 2, msgs: [
      ['Мария С.', 'Привет! Ты уже оформил заказ?', false],
      ['Я', 'Да, взял наушники и кофемашину', true],
      ['Мария С.', 'Кофемашину тоже? Отлично', false],
      ['Мария С.', 'Спасибо! Курьер уже едет', false]
    ] },
    { name: 'Доставка Лавки', last: 'Курьер будет через 20 минут', time: '12:10', unread: 1, msgs: [
      ['Доставка', 'Ваш заказ LV-482913 передан курьеру.', false],
      ['Доставка', 'Курьер будет через 20 минут', false]
    ] },
    { name: 'Артём Ж.', last: 'Скинь ссылку на наушники', time: '11:04', unread: 0, msgs: [
      ['Артём Ж.', 'Видел твой заказ, как наушники?', false],
      ['Я', 'Отличные, держат заряд весь день', true],
      ['Артём Ж.', 'Скинь ссылку на наушники', false]
    ] },
    { name: 'Семья', last: 'Мама: не забудь про ужин', time: 'Вчера', unread: 0, msgs: [
      ['Мама', 'Не забудь про ужин в воскресенье', false],
      ['Я', 'Помню, буду к шести', true]
    ] }
  ];
  var msgHost = null;
  var msgChat = -1;
  window.UnreadMessages = function () {
    return CHATS.reduce(function (s, c) { return s + (Number(c.unread) || 0); }, 0);
  };

  function msgListHTML() {
    return CHATS.map(function (c, i) {
      return '<button class="mail-row" type="button" onclick="Messages.open(' + i + ')">' +
        '<span class="mail-ava" style="background:var(--green-soft);color:var(--green-d)">' + LV.esc(LV.initials(c.name)) + '</span>' +
        '<span class="mail-body"><span class="mail-top"><b>' + LV.esc(c.name) + '</b><time>' + c.time + '</time></span>' +
        '<span class="mail-prev" style="font-size:11px;color:var(--sub)">' + LV.esc(c.last) + '</span></span>' +
        (c.unread ? '<span class="unread"></span>' : '') + '</button>';
    }).join('');
  }

  function msgChatHTML(i) {
    var c = CHATS[i];
    return '<div class="appbar"><button class="ab-btn" type="button" onclick="Messages.list()" aria-label="Назад"><i class="fa-solid fa-chevron-left"></i></button>' +
      '<div class="ab-title">' + LV.esc(c.name) + '<div class="ab-sub">в сети</div></div><div class="ab-right"></div></div>' +
      '<div class="app-scroll" id="chat-scroll" style="display:flex;flex-direction:column;gap:7px;padding:14px">' +
      c.msgs.map(function (m) {
        return '<div class="chat-bubble' + (m[2] ? ' me' : '') + '">' + LV.esc(m[1]) + '</div>';
      }).join('') +
      '<div class="chat-time">сегодня</div></div>' +
      '<div class="chat-input"><input id="chat-input" placeholder="Сообщение" onkeydown="if(event.key===\'Enter\')Messages.send()">' +
      '<button type="button" onclick="Messages.send()" aria-label="Отправить"><i class="fa-solid fa-paper-plane"></i></button></div>';
  }

  function msgScrollBottom() {
    var el = document.getElementById('chat-scroll');
    if (el) el.scrollTop = el.scrollHeight;
  }

  LV.registerApp({
    id: 'messages', name: 'Сообщения', icon: 'fa-comment-dots', bg: 'linear-gradient(140deg,#22c55e,#0ea5e9)',
    page: 0,
    mount: function (body) {
      msgHost = body;
      msgChat = -1;
      body.innerHTML = LV.appbar({ title: 'Сообщения', right: '<button class="ab-btn" type="button" onclick="LV.toast(\'Новое сообщение\')" aria-label="Написать"><i class="fa-solid fa-pen"></i></button>' }) +
        '<div class="app-scroll flush">' + msgListHTML() + '</div>';
      return function () { msgHost = null; };
    }
  });

  window.Messages = {
    open: function (i) {
      if (!msgHost) return;
      msgChat = i;
      CHATS[i].unread = 0;
      msgHost.innerHTML = msgChatHTML(i);
      LV.renderApps();
      setTimeout(msgScrollBottom, 30);
    },
    list: function () {
      if (!msgHost) return;
      msgChat = -1;
      msgHost.innerHTML = LV.appbar({ title: 'Сообщения' }) +
        '<div class="app-scroll flush">' + msgListHTML() + '</div>';
    },
    send: function () {
      var inp = document.getElementById('chat-input');
      if (!inp || msgChat < 0) return;
      var v = inp.value.trim();
      if (!v) return;
      CHATS[msgChat].msgs.push(['Я', v, true]);
      CHATS[msgChat].last = v;
      inp.value = '';
      if (msgHost) msgHost.innerHTML = msgChatHTML(msgChat);
      setTimeout(msgScrollBottom, 30);
    }
  };

  // =====================================================
  // КАРТЫ
  // =====================================================
  LV.registerApp({
    id: 'maps', name: 'Карты', icon: 'fa-map-location-dot', bg: 'linear-gradient(140deg,#34d399,#0ea5e9)',
    page: 0,
    mount: function (body) {
      var pins = [
        { x: 34, y: 38, n: 'Лавка · Тверская', i: 'fa-bag-shopping' }, { x: 62, y: 26, n: 'Пункт выдачи', i: 'fa-box' },
        { x: 70, y: 62, n: 'Лавка · Арбат', i: 'fa-bag-shopping' }, { x: 46, y: 72, n: 'Постамат', i: 'fa-box' },
        { x: 82, y: 30, n: 'Правительство', i: 'fa-building-columns' }, { x: 56, y: 48, n: 'ПК-клуб', i: 'fa-gamepad' },
        { x: 46, y: 47, n: 'БЦ «Сити»', i: 'fa-building' }
      ];
      var map = '<svg viewBox="0 0 400 340" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%">' +
        '<rect width="400" height="340" fill="#e3f2ec"/>' +
        '<path d="M0 250 Q80 210 160 250 T400 240 L400 340 L0 340Z" fill="#bfe3f5"/>' +
        '<path d="M0 250 Q80 210 160 250 T400 240" stroke="#7cc3e0" stroke-width="3" fill="none"/>' +
        '<g fill="#cdeadd"><rect x="18" y="40" width="90" height="62" rx="8"/><rect x="150" y="52" width="70" height="50" rx="8"/><rect x="250" y="34" width="110" height="70" rx="8"/><rect x="60" y="150" width="80" height="60" rx="8"/><rect x="260" y="150" width="90" height="62" rx="8"/></g>' +
        '<g stroke="#ffffff" stroke-width="12" stroke-linecap="round"><path d="M-10 130 L410 118"/><path d="M130 -10 L140 350"/><path d="M-10 300 L410 286"/><path d="M300 -10 L290 350"/></g>' +
        '<g stroke="#f8fafc" stroke-width="4" stroke-linecap="round" opacity=".9"><path d="M-10 130 L410 118"/><path d="M130 -10 L140 350"/><path d="M-10 300 L410 286"/><path d="M300 -10 L290 350"/></g>' +
        '<circle cx="200" cy="170" r="34" fill="#2563eb" opacity=".12"/></svg>';
      body.innerHTML = LV.appbar({ title: 'Карты', sub: 'Москва', right: '<button class="ab-btn" type="button" onclick="Maps.me()" aria-label="Моё место"><i class="fa-solid fa-location-crosshairs"></i></button>' }) +
        '<div class="app-scroll pb">' +
        '<div class="map-wrap">' + map +
        '<div class="map-pin me" style="left:50%;top:50%" onclick="Maps.pin(\'Вы здесь\')"><i class="fa-solid fa-location-arrow"></i></div>' +
        pins.map(function (p) {
          return '<div class="map-pin" style="left:' + p.x + '%;top:' + p.y + '%" onclick="Maps.pin(\'' + LV.esc(p.n) + '\')"><i class="fa-solid ' + (p.i || 'fa-bag-shopping') + '"></i></div>';
        }).join('') +
        '<div class="map-legend">Пункты выдачи Лавки</div></div>' +
        '<div class="mkt-sec"><div class="sec-head"><span class="sec-title">Рядом с вами</span><span class="tiny muted">7 мест</span></div>' +
        '<div class="card" style="padding:4px 14px">' +
        [['Лавка · Тверская', 'Тверская, 12 · 350 м', '10:00–21:00', 'fa-store'], ['Пункт выдачи', 'Тверская, 18 · 500 м', '09:00–20:00', 'fa-box'], ['Лавка · Арбат', 'Арбат, 24 · 1,2 км', '10:00–22:00', 'fa-store'], ['Постамат', 'Никитский бульвар, 7 · 1,5 км', 'круглосуточно', 'fa-box'], ['Правительство', 'Тверская, 1 · 700 м', '09:00–18:00', 'fa-building-columns'], ['ПК-клуб «Арена»', 'Тверская, 20 · 1,1 км', 'круглосуточно', 'fa-gamepad'], ['БЦ «Сити»', 'Садовая, 8 · 900 м', '10:00–20:00', 'fa-building']].map(function (m, i) {
          return '<div class="cal-ev"><span class="set-ico" style="background:' + ['#10b981', '#0ea5e9', '#6366f1', '#f59e0b', '#64748b', '#6366f1', '#8b5cf6'][i] + '"><i class="fa-solid ' + m[3] + '"></i></span>' +
            '<div style="flex:1"><b>' + m[0] + '</b><span>' + m[1] + ' · ' + m[2] + '</span></div>' +
            '<button class="btn btn-sm" type="button" onclick="Maps.pin(\'' + LV.esc(m[0]) + '\')">Маршрут</button></div>';
        }).join('') + '</div></div>' +
        '<p class="center tiny muted" style="margin-top:14px">Карта схематичная · для симулятора</p>' +
        '</div>';
    }
  });

  window.Maps = {
    pin: function (n) { LV.toast(n + ' · маршрут построен'); },
    me: function () { LV.toast('Вы в центре Москвы'); }
  };

  // =====================================================
  // СОВЕТЫ
  // =====================================================
  LV.registerApp({
    id: 'tips', name: 'Советы', icon: 'fa-lightbulb', bg: 'linear-gradient(140deg,#f59e0b,#ea580c)',
    page: 1,
    mount: function (body) {
      var tips = [
        { i: 'fa-magnifying-glass', c: '#10b981', t: 'Ищи точнее', d: 'В поиске можно писать продавца или категорию: «кофемашина», «Nova», «для дома».' },
        { i: 'fa-heart', c: '#ef4444', t: 'Сохраняй в избранное', d: 'Сердечко в карточке товара прячет покупку в избранное — удобно сравнивать.' },
        { i: 'fa-truck-fast', c: '#0ea5e9', t: 'Доставка бесплатно', d: 'От 3 000 ₽ доставка по Москве бесплатная, остальное — 299 ₽.' },
        { i: 'fa-moon', c: '#6366f1', t: 'Тёмная тема', d: 'Настройки → Тема оформления. Телефон поддержит тёмную гамму интерфейса.' },
        ];
      body.innerHTML = LV.appbar({ title: 'Советы', sub: 'Как пользоваться Лавкой' }) +
        '<div class="app-scroll pb">' +
        '<div class="card" style="background:linear-gradient(130deg,#10b981,#059669);border:none;color:#fff;margin-bottom:14px">' +
        '<div style="font-size:17px;font-weight:900;letter-spacing:-.4px">Лавка — это просто</div>' +
        '<p style="font-size:11.5px;line-height:1.5;opacity:.9;margin-top:4px">2100 товаров, честные отзывы и доставка. Ниже — короткие подсказки.</p></div>' +
        tips.map(function (t) {
          return '<div class="card" style="margin-bottom:9px;display:flex;gap:11px;align-items:flex-start">' +
            '<span class="set-ico" style="background:' + t.c + '"><i class="fa-solid ' + t.i + '"></i></span>' +
            '<div><b style="font-size:12.5px">' + t.t + '</b><p style="font-size:11px;color:var(--sub);line-height:1.5;margin-top:3px">' + t.d + '</p></div></div>';
        }).join('') +
        '</div>';
    }
  });

  // =====================================================
  // МАГАЗИН ПРИЛОЖЕНИЙ
  // =====================================================
  var storeBody = null;

  function storeApps() {
    var lvl = (window.LV && LV.state && LV.state.biz) ? LV.state.biz.level : 0;
    return LV.apps.filter(function (a) {
      if (a.id === 'production' && lvl >= 10) return true;
      return a.installable;
    });
  }
  function appSize(a) {
    var h = LV.hash(a.id);
    return (3 + h % 22) + ',' + (h % 10) + ' МБ';
  }
  function storeCard(a, installed) {
    var h = 45 + LV.hash(a.id) % 5;
    return '<div class="store-card">' +
      '<span class="store-ic" style="background:' + a.bg + '"><i class="fa-solid ' + a.icon + '"></i></span>' +
      '<div class="store-info"><b>' + LV.esc(a.name) + '</b>' +
      '<span>' + LV.esc(a.desc || 'Приложение для телефона Лавки.') + '</span>' +
      '<span class="store-meta">' + appSize(a) + ' · 4,' + h + ' · бесплатно</span></div>' +
      '<div class="store-actions">' + (installed ?
        '<button class="btn btn-sm btn-primary" type="button" onclick="Store.open(\'' + a.id + '\')">Открыть</button>' +
        '<button class="store-del" type="button" onclick="Store.remove(\'' + a.id + '\')" aria-label="Удалить"><i class="fa-solid fa-trash"></i></button>' :
        '<button class="btn btn-sm store-get" type="button" onclick="Store.install(\'' + a.id + '\')">Установить</button>') +
      '</div></div>';
  }
  function storeHTML() {
    var list = storeApps();
    var inst = list.filter(function (a) { return LV.isInstalled(a.id); });
    var avail = list.filter(function (a) { return !LV.isInstalled(a.id); });
    return '<div class="app-scroll pb" id="store-scroll">' +
      '<div class="store-hero"><span class="store-hero-ic"><i class="fa-solid fa-store"></i></span>' +
      '<h2>Магазин приложений</h2>' +
      '<p>Устанавливай приложения и возвращай их на главный экран в любой момент.</p>' +
      '<div class="store-stats"><span><b>' + inst.length + '</b> установлено</span><span><b>' + avail.length + '</b> доступно</span></div></div>' +
      '<div class="store-sec"><div class="store-sec-head"><span>Установленные</span><span class="tiny muted">' + inst.length + '</span></div>' +
      (inst.length ? inst.map(function (a) { return storeCard(a, true); }).join('') : '<p class="store-empty">Пока ничего не установлено</p>') + '</div>' +
      '<div class="store-sec"><div class="store-sec-head"><span>Доступные</span><span class="tiny muted">' + avail.length + '</span></div>' +
      (avail.length ? avail.map(function (a) { return storeCard(a, false); }).join('') : '<p class="store-empty">Все приложения установлены</p>') + '</div>' +
      '<p class="center tiny muted" style="margin:16px 0 6px">Магазин Лавки · приложения-симуляторы</p></div>';
  }
  function renderStore() {
    if (!storeBody) return;
    var sc = document.getElementById('store-scroll');
    var top = sc ? sc.scrollTop : 0;
    storeBody.innerHTML = LV.appbar({
      title: 'Магазин', sub: 'Приложения для телефона',
      right: '<button class="ab-btn" type="button" onclick="Store.refresh()" aria-label="Обновить"><i class="fa-solid fa-rotate"></i></button>'
    }) + storeHTML();
    var nsc = document.getElementById('store-scroll');
    if (nsc) nsc.scrollTop = top;
  }

  LV.registerApp({
    id: 'store', name: 'Магазин', icon: 'fa-store', bg: 'linear-gradient(140deg,#0ea5e9,#2563eb)',
    page: 0, desc: 'Установка приложений на телефон',
    mount: function (body) {
      storeBody = body;
      renderStore();
      return function () { storeBody = null; };
    }
  });

  window.Store = {
    open: function (id) {
      LV.openApp(id);
    },
    install: function (id) {
      var a = LV.apps.filter(function (x) { return x.id === id; })[0];
      if (!a) return;
      LV.installApp(id);
      renderStore();
      LV.toast('«' + a.name + '» установлено на главный экран');
    },
    remove: function (id) {
      var a = LV.apps.filter(function (x) { return x.id === id; })[0];
      if (!a) return;
      LV.uninstallApp(id);
      renderStore();
      LV.toast('«' + a.name + '» удалено с главного экрана');
    },
    refresh: function () {
      renderStore();
      LV.toast('Список приложений обновлён');
    }
  };

  // =====================================================
  // БРАУЗЕР — LACKUUN.COM
  // =====================================================
  var WEB_CATS = [
    { id: 'news', name: 'Новости', icon: 'fa-newspaper', color: '#0ea5e9' },
    { id: 'shop', name: 'Магазины', icon: 'fa-bag-shopping', color: '#10b981' },
    { id: 'social', name: 'Соцсети', icon: 'fa-users', color: '#8b5cf6' },
    { id: 'money', name: 'Финансы', icon: 'fa-ruble-sign', color: '#f59e0b' },
    { id: 'fun', name: 'Развлечения', icon: 'fa-film', color: '#ef4444' },
    { id: 'service', name: 'Сервисы', icon: 'fa-wand-magic-sparkles', color: '#06b6d4' }
  ];

  var WEB_SITES = [
    {
      id: 'lavka', name: 'Лавка', host: 'lackuun.com', cat: 'shop',
      icon: 'fa-bag-shopping', color: '#10b981',
      slogan: 'Магазин, где всё рядом',
      nav: [['index', 'Главная'], ['catalog', 'Каталог'], ['deals', 'Акции'], ['about', 'О нас']],
      pages: {
        index: function () {
          return '<div class="web-banner web-banner-green">' +
            '<span class="pill light">2100 товаров</span>' +
            '<h3>Всё для дома — с доставкой завтра</h3>' +
            '<p>Скидки до 60% в 21 категории. Оформление заказа за минуту по XPRODC ID.</p>' +
            '<button class="btn btn-white" type="button" onclick="Web.toApp(\'market\')">Открыть приложение</button></div>' +
            '<div class="web-grid-2">' +
            [['Электроника', 'fa-plug'], ['Дом и сад', 'fa-couch'], ['Одежда', 'fa-shirt'], ['Красота', 'fa-spray-can-sparkles']].map(function (c) {
              return '<button class="web-tile" type="button" onclick="Web.sitePage(\'lavka\',\'catalog\')"><i class="fa-solid ' + c[1] + '"></i><b>' + c[0] + '</b></button>';
            }).join('') +
            '</div>' +
            '<div class="web-h">Хиты недели</div>' +
            webProduct('Наушники Air Tone', 4990, 6990, 'fa-headphones', '#6366f1') +
            webProduct('Кофемашина Barista', 18990, 24990, 'fa-mug-hot', '#b45309') +
            webProduct('Лампа Solar', 2490, 3490, 'fa-lightbulb', '#f59e0b') +
            webProduct('Рюкзак City', 3290, 4590, 'fa-bag-shopping', '#0ea5e9');
        },
        catalog: function () {
          return '<div class="web-h">Каталог</div>' +
            '<div class="web-chips">' +
            ['Все', 'Электроника', 'Дом', 'Одежда', 'Спорт', 'Красота'].map(function (c, i) {
              return '<button class="web-chip' + (i === 0 ? ' on' : '') + '" type="button" onclick="Web.chip(this)">' + c + '</button>';
            }).join('') + '</div>' +
            '<div class="web-prod-grid">' +
            [['Наушники Air Tone', 4990, 'fa-headphones', '#6366f1'], ['Смарт-часы Pulse', 11990, 'fa-clock', '#0ea5e9'],
             ['Кофемашина Barista', 18990, 'fa-mug-hot', '#b45309'], ['Лампа Solar', 2490, 'fa-lightbulb', '#f59e0b'],
             ['Рюкзак City', 3290, 'fa-bag-shopping', '#10b981'], ['Кроссовки Run', 6490, 'fa-shoe-prints', '#ef4444']].map(function (p) {
              return '<div class="web-prod-card"><span class="web-prod-ic" style="background:' + p[3] + '"><i class="fa-solid ' + p[2] + '"></i></span>' +
                '<b>' + p[0] + '</b><span class="web-price">' + LV.fmt(p[1]) + '</span>' +
                '<button class="web-mini" type="button" onclick="Web.toApp(\'market\')">В корзину</button></div>';
            }).join('') + '</div>' +
            '<p class="web-muted">Показано 6 из 2100 товаров. Полный каталог — в приложении Лавки.</p>';
        },
        deals: function () {
          return '<div class="web-h">Акции ноября</div>' +
            '<div class="web-promo"><b>-40%</b><div><span>На всё для кухни</span><small>до 30 ноября</small></div></div>' +
            '<div class="web-promo"><b>-25%</b><div><span>Электроника и гаджеты</span><small>выходные дни</small></div></div>' +
            '<div class="web-promo"><b>1 + 1</b><div><span>Товары для дома</span><small>при заказе от 3000 ₽</small></div></div>' +
            '<button class="btn btn-primary btn-block" style="margin-top:10px" type="button" onclick="Web.toApp(\'market\')">Смотреть акции в приложении</button>';
        },
        about: function () {
          return '<div class="web-h">О Лавке</div>' +
            '<p class="web-text">Лавка — магазин полного цикла: 21 категория, 2100 товаров, собственная доставка и оплата по XPRODC ID.</p>' +
            '<div class="web-stats"><div><b>2100</b><span>товаров</span></div><div><b>21</b><span>категория</span></div><div><b>1 день</b><span>доставка</span></div></div>' +
            '<p class="web-text">Мы работаем с локальными продавцами и проверяем каждый отзыв. Возврат — 14 дней без вопросов.</p>' +
            '<p class="web-muted">Москва, Тверская, 12 · support@lackuun.com</p>';
        }
      }
    },
    {
      id: 'vesti', name: 'Городские вести', host: 'vesti.lackuun.com', cat: 'news',
      icon: 'fa-newspaper', color: '#0ea5e9',
      slogan: 'Что происходит в городе',
      nav: [['index', 'Лента'], ['city', 'Город'], ['tech', 'Технологии'], ['sport', 'Спорт']],
      pages: {
        index: function () {
          return '<div class="web-lead" onclick="Web.sitePage(\'vesti\',\'a1\')">' +
            '<span class="web-kicker">Главное</span>' +
            '<h3>На Тверской открылся маркетплейс нового формата</h3>' +
            '<p>Первый офлайн-пункт выдачи с примерочными и кофейней принял 3 000 покупателей за выходные.</p>' +
            '<span class="web-meta">Сегодня, 10:20 · Город</span></div>' +
            '<div class="web-h">Лента</div>' +
            webNews('a2', 'Городские службы перешли на зимний график', 'Уборка улиц усилена, на маршруты вышли 420 единиц техники.', 'Сегодня, 09:05') +
            webNews('a3', 'Доставка за час стала доступна в 12 районах', 'Сервис расширил зону экспресс-доставки — проверьте свой адрес.', 'Вчера, 18:40') +
            webNews('a4', 'На выходных перекроют центр', 'Ограничения коснутся Тверской и прилегающих переулков.', 'Вчера, 15:10') +
            '<div class="web-chips" style="margin-top:12px">' +
            '<button class="web-chip" type="button" onclick="Web.sitePage(\'vesti\',\'city\')">Город</button>' +
            '<button class="web-chip" type="button" onclick="Web.sitePage(\'vesti\',\'tech\')">Технологии</button>' +
            '<button class="web-chip" type="button" onclick="Web.sitePage(\'vesti\',\'sport\')">Спорт</button></div>';
        },
        city: function () {
          return '<div class="web-h">Город</div>' +
            webNews('a2', 'Зимний график коммунальных служб', 'Техника вышла на улицы, работа идёт круглосуточно.', 'Сегодня, 09:05') +
            webNews('a4', 'Перекрытия в центре на выходных', 'Тверская будет закрыта для автомобилей с 08:00 субботы.', 'Вчера, 15:10') +
            webNews('a5', 'Открыт новый парк у реки', '300 деревьев, велодорожки и смотровая площадка.', '12 ноября');
        },
        tech: function () {
          return '<div class="web-h">Технологии</div>' +
            webNews('a6', 'XPRODC ID стал единым входом во все сервисы', 'Один аккаунт теперь действует в Лавке, банке и почте.', 'Сегодня, 08:30') +
            webNews('a7', 'Лавка запустила оплату по QR', 'Оплата проходит за 2 секунды, чек приходит в приложение.', '11 ноября') +
            '<button class="btn btn-block" style="margin-top:10px" type="button" onclick="Web.open(\'pulse\')">Открыть Пульс</button>';
        },
        sport: function () {
          return '<div class="web-h">Спорт</div>' +
            webNews('a8', 'Городской забег собрал 8 000 участников', 'Маршрут прошёл по набережной, результаты уже опубликованы.', 'Сегодня, 07:15') +
            webNews('a9', 'Открытая тренировка по бегу', 'Каждую субботу в 9:00 у парка, вход свободный.', '10 ноября');
        },
        a1: function () {
          return webArticle('На Тверской открылся маркетплейс нового формата', 'Город',
            'Первый офлайн-пункт выдачи с примерочными, кофейней и зоной отдыха принял 3 000 покупателей за выходные.',
            '<p class="web-text">Пункт работает ежедневно с 09:00 до 22:00. Здесь можно примерить одежду, проверить технику и сразу оформить возврат.</p>' +
            '<p class="web-text">Оплата проходит по XPRODC ID: достаточно показать QR-код в приложении. Заказы хранятся 7 дней.</p>' +
            '<p class="web-muted">Фото: пресс-служба Лавки</p>');
        },
        a2: function () {
          return webArticle('Городские службы перешли на зимний график', 'Город',
            'Уборка улиц усилена, на маршруты вышли 420 единиц техники. Особое внимание — остановкам и подходам к метро.',
            '<p class="web-text">Синоптики обещают снег до конца недели. Коммунальные службы переведены на круглосуточный режим.</p>' +
            '<p class="web-text">Сообщить о неубранном участке можно через городской портал.</p>');
        },
        a3: function () {
          return webArticle('Доставка за час стала доступна в 12 районах', 'Доставка',
            'Сервис расширил зону экспресс-доставки. Заказ собирают на ближайшем складе, курьер выезжает через 10 минут.',
            '<p class="web-text">Экспресс-доставка доступна для товаров с отметкой «за час». Стоимость — от 199 ₽, бесплатно от 3 000 ₽.</p>');
        },
        a4: function () {
          return webArticle('На выходных перекроют центр', 'Транспорт',
            'Ограничения коснутся Тверской и прилегающих переулков. Автомобилистов просят пользоваться метро.',
            '<p class="web-text">Перекрытия начнутся в субботу в 08:00 и завершатся в воскресенье в 23:00.</p>');
        },
        a5: function () {
          return webArticle('Открыт новый парк у реки', 'Город',
            '300 деревьев, велодорожки, смотровая площадка и детская зона — парк готов принимать гостей.',
            '<p class="web-text">Вход свободный, работает освещение и пункты проката.</p>');
        },
        a6: function () {
          return webArticle('XPRODC ID стал единым входом во все сервисы', 'Технологии',
            'Один аккаунт теперь действует в Лавке, банке и почте. Вход подтверждается через Telegram или почту.',
            '<button class="btn btn-primary btn-block" style="margin-top:10px" type="button" onclick="XID.open()">Открыть XPRODC ID</button>');
        },
        a7: function () {
          return webArticle('Лавка запустила оплату по QR', 'Технологии',
            'Оплата проходит за 2 секунды, электронный чек приходит в приложение.',
            '<p class="web-text">Новый способ доступен во всех пунктах выдачи и у партнёров.</p>');
        },
        a8: function () {
          return webArticle('Городской забег собрал 8 000 участников', 'Спорт',
            'Маршрут прошёл по набережной. Победители получили сертификаты Лавки.',
            '<p class="web-text">Результаты опубликованы на сайте организатора.</p>');
        },
        a9: function () {
          return webArticle('Открытая тренировка по бегу', 'Спорт',
            'Каждую субботу в 9:00 у парка. Вход свободный, нужна только удобная обувь.',
            '');
        }
      }
    },
    {
      id: 'xprodc', name: 'XPRODC Daily', host: 'xprodc.net', cat: 'news',
      icon: 'fa-bolt', color: '#059669',
      slogan: 'Экосистема XPRODC — новости и обновления',
      nav: [['index', 'Обновления'], ['id', 'XPRODC ID'], ['apps', 'Приложения']],
      pages: {
        index: function () {
          return '<div class="web-banner web-banner-dark"><span class="pill light">XPRODC</span>' +
            '<h3>Один ID — вся экосистема</h3><p>Лавка, банк, почта, кошелёк и браузер работают с единым аккаунтом.</p>' +
            '<button class="btn btn-white" type="button" onclick="Web.sitePage(\'xprodc\',\'id\')">Подробнее об ID</button></div>' +
            '<div class="web-h">Обновления</div>' +
            webNewsSite('xprodc', 'u1', 'Версия 4.2: браузер Lackuun', 'Встроенный браузер получил стартовую страницу, категории и закладки.', 'Сегодня') +
            webNewsSite('xprodc', 'u2', 'Лавка: 2100 товаров', 'Каталог расширен до 21 категории, добавлены отзывы и избранное.', '12 ноября') +
            webNewsSite('xprodc', 'u3', 'LAVKA PAY: переводы по X ID', 'Переводы между аккаунтами без комиссии.', '8 ноября');
        },
        id: function () {
          var on = !!S.user.xid;
          return '<div class="web-h">XPRODC ID</div>' +
            '<p class="web-text">XPRODC ID — единая учётная запись. Он используется в Лавке, LAVKA PAY, почте, браузере и сервисах партнёров.</p>' +
            '<div class="web-idcard"><i class="fa-solid fa-shield-halved"></i><div><b>' + (on ? LV.esc(S.user.xid) : 'Аккаунт не подключён') + '</b>' +
            '<span>' + (on ? LV.esc(S.user.name) + ' · активен' : 'Войдите, чтобы оформлять заказы') + '</span></div></div>' +
            '<button class="btn btn-primary btn-block" style="margin-top:10px" type="button" onclick="XID.open()">' + (on ? 'Открыть аккаунт' : 'Войти в XPRODC ID') + '</button>' +
            '<div class="web-list">' +
            '<div class="web-row"><i class="fa-solid fa-check"></i><span>Один вход для всех приложений</span></div>' +
            '<div class="web-row"><i class="fa-solid fa-check"></i><span>Подтверждение через Telegram</span></div>' +
            '<div class="web-row"><i class="fa-solid fa-check"></i><span>История заказов и платежей</span></div>' +
            '</div>';
        },
        apps: function () {
          return '<div class="web-h">Приложения экосистемы</div>' +
            [['Лавка', 'fa-bag-shopping', '#10b981'], ['LAVKA PAY', 'fa-wallet', '#0f172a'], ['Почта', 'fa-envelope', '#0ea5e9'],
             ['Браузер', 'fa-globe', '#38bdf8'], ['Заметки', 'fa-note-sticky', '#f59e0b'], ['XPRODC ID', 'fa-shield-halved', '#059669']].map(function (a) {
              return '<div class="web-app-row"><span class="web-app-ic" style="background:' + a[2] + '"><i class="fa-solid ' + a[1] + '"></i></span><b>' + a[0] + '</b><i class="fa-solid fa-arrow-up-right-from-square web-chev"></i></div>';
            }).join('');
        },
        u1: function () {
          return '<div class="web-h">Обновление</div><h3 class="web-title">Версия 4.2: браузер Lackuun</h3>' +
            '<p class="web-muted">Сегодня · XPRODC</p>' +
            '<p class="web-text">Встроенный браузер получил стартовую страницу с поиском, категориями и закладками. Появились вкладки с собственной историей и рекламные блоки партнёров.</p>' +
            '<p class="web-text">Обновление уже доступно на всех устройствах. Откройте браузер из магазина приложений.</p>' +
            '<button class="btn btn-primary btn-block" type="button" onclick="Web.home()">Открыть браузер</button>';
        },
        u2: function () {
          return '<div class="web-h">Обновление</div><h3 class="web-title">Лавка: 2100 товаров</h3>' +
            '<p class="web-muted">12 ноября · XPRODC</p>' +
            '<p class="web-text">Каталог расширен до 21 категории. Добавлены отзывы, избранное и сравнение характеристик. Доставка бесплатна от 3 000 ₽.</p>' +
            '<p class="web-text">Продавцы могут выставлять товары через «Производство» — витрина обновляется автоматически.</p>' +
            '<button class="btn btn-primary btn-block" type="button" onclick="Web.open(\'lavka\')">Перейти в Лавку</button>';
        },
        u3: function () {
          return '<div class="web-h">Обновление</div><h3 class="web-title">LAVKA PAY: переводы по X ID</h3>' +
            '<p class="web-muted">8 ноября · XPRODC</p>' +
            '<p class="web-text">Теперь переводить деньги можно по X ID без комиссии. История платежей синхронизируется с BankFake и почтой.</p>' +
            '<p class="web-text">Функция доступна всем владельцам XPRODC ID. Лимит — 100 000 ₽ в сутки.</p>' +
            '<button class="btn btn-primary btn-block" type="button" onclick="Web.open(\'bankfake\')">Открыть BankFake</button>';
        }
      }
    },
    {
      id: 'techno', name: 'ТехноМир', host: 'techno.lackuun.com', cat: 'shop',
      icon: 'fa-microchip', color: '#6366f1',
      slogan: 'Гаджеты, которые работают',
      nav: [['index', 'Главная'], ['catalog', 'Каталог'], ['p1', 'Хит']],
      pages: {
        index: function () {
          return '<div class="web-banner web-banner-indigo"><span class="pill light">Новинка</span>' +
            '<h3>Смарт-часы Pulse 2</h3><p>Экран AMOLED, 14 дней автономности, оплата по XPRODC ID.</p>' +
            '<button class="btn btn-white" type="button" onclick="Web.sitePage(\'techno\',\'p1\')">Смотреть</button></div>' +
            '<div class="web-h">Популярное</div>' +
            [['Смарт-часы Pulse 2', 11990, 'fa-clock', '#0ea5e9'], ['Наушники Air Tone', 4990, 'fa-headphones', '#6366f1'],
             ['Колонка Boom', 7990, 'fa-volume-high', '#ef4444'], ['Клавиатура Type', 4490, 'fa-keyboard', '#0f172a']].map(function (p) {
              return webProduct(p[0], p[1], 0, p[2], p[3]);
            }).join('') +
            '<button class="btn btn-block" style="margin-top:10px" type="button" onclick="Web.sitePage(\'techno\',\'catalog\')">Весь каталог</button>';
        },
        catalog: function () {
          return '<div class="web-h">Каталог техники</div>' +
            ['Смарт-часы Pulse 2 — 11 990 ₽', 'Наушники Air Tone — 4 990 ₽', 'Колонка Boom — 7 990 ₽',
             'Клавиатура Type — 4 490 ₽', 'Мышь Glide — 2 190 ₽', 'Монитор View 27 — 24 990 ₽'].map(function (t) {
              return '<div class="web-row web-row-b"><i class="fa-solid fa-microchip"></i><span>' + t + '</span></div>';
            }).join('') +
            '<p class="web-muted">Цены действительны при оплате по XPRODC ID.</p>';
        },
        p1: function () {
          return '<div class="web-product-hero"><span class="web-product-big" style="background:#0ea5e9"><i class="fa-solid fa-clock"></i></span>' +
            '<h3>Смарт-часы Pulse 2</h3><span class="web-price big">11 990 ₽</span><span class="web-old">14 990 ₽</span></div>' +
            '<div class="web-list">' +
            '<div class="web-row"><i class="fa-solid fa-check"></i><span>AMOLED 1.9", всегда включён</span></div>' +
            '<div class="web-row"><i class="fa-solid fa-check"></i><span>До 14 дней работы</span></div>' +
            '<div class="web-row"><i class="fa-solid fa-check"></i><span>Оплата и проезд по XPRODC ID</span></div>' +
            '<div class="web-row"><i class="fa-solid fa-check"></i><span>Влагозащита 5 ATM</span></div></div>' +
            '<button class="btn btn-primary btn-block" style="margin-top:10px" type="button" onclick="LV.toast(\'Товар добавлен в корзину\')">Купить</button>';
        }
      }
    },
    {
      id: 'dom', name: 'Дом и Сад', host: 'dom.lackuun.com', cat: 'shop',
      icon: 'fa-couch', color: '#65a30d',
      slogan: 'Уют начинается здесь',
      nav: [['index', 'Главная'], ['catalog', 'Каталог']],
      pages: {
        index: function () {
          return '<div class="web-banner web-banner-lime"><span class="pill light">Сезон</span>' +
            '<h3>Тёплый дом к зиме</h3><p>Пледы, лампы и ароматы — скидки до 45%.</p>' +
            '<button class="btn btn-white" type="button" onclick="Web.sitePage(\'dom\',\'catalog\')">В каталог</button></div>' +
            '<div class="web-h">Для уюта</div>' +
            webProduct('Плед Nordic', 2990, 4290, 'fa-bed', '#0ea5e9') +
            webProduct('Лампа Solar', 2490, 3490, 'fa-lightbulb', '#f59e0b') +
            webProduct('Аромат Cedar', 1290, 0, 'fa-spray-can-sparkles', '#10b981') +
            webProduct('Кресло Soft', 14990, 18990, 'fa-couch', '#8b5cf6');
        },
        catalog: function () {
          return '<div class="web-h">Каталог для дома</div>' +
            [['Плед Nordic', '2 990 ₽'], ['Лампа Solar', '2 490 ₽'], ['Аромат Cedar', '1 290 ₽'],
             ['Кресло Soft', '14 990 ₽'], ['Стол Oak', '21 990 ₽'], ['Ваза Clay', '1 890 ₽']].map(function (p) {
              return '<div class="web-row web-row-b"><i class="fa-solid fa-couch"></i><span>' + p[0] + '</span><b>' + p[1] + '</b></div>';
            }).join('');
        }
      }
    },
    {
      id: 'kruzhok', name: 'Кружок', host: 'kruzhok.net', cat: 'social',
      icon: 'fa-users', color: '#8b5cf6',
      slogan: 'Люди, покупки и разговоры',
      nav: [['index', 'Лента'], ['trending', 'Тренды']],
      pages: {
        index: function () {
          return '<div class="web-h">Сейчас в ленте</div>' +
            webPost('p1', 'Мария С.', 'МС', '#8b5cf6', 'Показываю свою новую кофемашину из Лавки. Капучино получился с первого раза.', 128) +
            webPost('p2', 'Артём', 'А', '#0ea5e9', 'Собрал рабочий стол мечты: лампа Solar, клавиатура Type и тишина.', 74) +
            webPost('p3', 'Лена', 'Л', '#ef4444', 'Кто пробовал доставку за час? У меня заказ приехал за 41 минуту.', 203);
        },
        trending: function () {
          return '<div class="web-h">Тренды недели</div>' +
            ['#лавка', '#xprodcid', '#доставказачас', '#зимнийдом', '#чернаяпятница'].map(function (t, i) {
              return '<div class="web-row web-row-b"><b style="width:20px;color:var(--muted)">' + (i + 1) + '</b><span>' + t + '</span><i class="fa-solid fa-arrow-trend-up" style="color:#10b981"></i></div>';
            }).join('');
        }
      }
    },
    {
      id: 'connect', name: 'Connect', host: 'connect.xprodc.net', cat: 'social',
      icon: 'fa-user-group', color: '#0ea5e9',
      slogan: 'Профессиональная сеть XPRODC',
      nav: [['index', 'Люди']],
      pages: {
        index: function () {
          return '<div class="web-h">Рекомендации</div>' +
            webPerson('u1', 'Мария Соколова', 'Дизайнер · Лавка', 'МС', '#8b5cf6', 'Подписаться') +
            webPerson('u2', 'Артём Волков', 'Разработчик · XPRODC', 'АВ', '#0ea5e9', 'Подписаться') +
            webPerson('u3', 'Лена Ким', 'Маркетинг · LAVKA PAY', 'ЛК', '#ef4444', 'Подписаться') +
            webPerson('u4', 'Игорь Лебедев', 'Логистика · Лавка', 'ИЛ', '#10b981', 'Подписаться');
        }
      }
    },
    {
      id: 'bankfake', name: 'BankFake', host: 'bankfake.net', cat: 'money',
      icon: 'fa-building-columns', color: '#059669',
      slogan: 'Банк, который всегда с тобой',
      nav: [['index', 'Главная'], ['cards', 'Карты']],
      pages: {
        index: function () {
          return '<div class="web-bank-hero"><span class="pill light">LAVKA PAY</span><h3>' + LV.fmt(S.balance) + '</h3><p>Основной счёт · ' + (S.user.xid ? LV.esc(S.user.xid) : 'XPRODC ID не подключён') + '</p></div>' +
            '<div class="web-grid-2">' +
            '<button class="web-tile" type="button" onclick="LV.toast(\'Переводы — в приложении Кошелёк\')"><i class="fa-solid fa-paper-plane"></i><b>Перевести</b></button>' +
            '<button class="web-tile" type="button" onclick="LV.toast(\'Пополнение отключено в симуляторе\')"><i class="fa-solid fa-plus"></i><b>Пополнить</b></button></div>' +
            '<div class="web-h">Курсы</div>' +
            '<div class="web-list"><div class="web-row web-row-b"><span>USD</span><b>92,40 ₽</b></div>' +
            '<div class="web-row web-row-b"><span>EUR</span><b>99,10 ₽</b></div>' +
            '<div class="web-row web-row-b"><span>CNY</span><b>12,70 ₽</b></div></div>' +
            '<button class="btn btn-primary btn-block" style="margin-top:10px" type="button" onclick="Web.toApp(\'wallet\')">Открыть кошелёк</button>';
        },
        cards: function () {
          return '<div class="web-h">Карты</div>' +
            '<div class="web-card-visual"><span>LAVKA PAY</span><b>•••• 4417</b><small>' + LV.esc(S.user.name.toUpperCase()) + '</small></div>' +
            '<div class="web-row web-row-b"><span>Карта •••• 4417</span><b>основная</b></div>' +
            '<div class="web-row web-row-b"><span>Карта •••• 9082</span><b>виртуальная</b></div>' +
            '<button class="btn btn-block" style="margin-top:10px" type="button" onclick="LV.toast(\'Выпуск карты — в приложении Кошелёк\')">Выпустить карту</button>';
        }
      }
    },
    {
      id: 'coin', name: 'КриптоЛавка', host: 'coin.lackuun.com', cat: 'money',
      icon: 'fa-coins', color: '#f59e0b',
      slogan: 'Курсы и цифровые активы',
      nav: [['index', 'Курсы']],
      pages: {
        index: function () {
          return '<div class="web-h">Курсы сегодня</div>' +
            [['BTC', '6 420 000 ₽', '+2,4%', true], ['ETH', '312 400 ₽', '-0,8%', false], ['XPD', '84,20 ₽', '+5,1%', true], ['USDT', '92,10 ₽', '+0,1%', true]].map(function (c) {
              return '<div class="web-row web-row-b"><b style="width:52px">' + c[0] + '</b><span>' + c[1] + '</span>' +
                '<b style="color:' + (c[3] ? '#10b981' : '#ef4444') + '">' + c[2] + '</b></div>';
            }).join('') +
            '<div class="web-h">Динамика XPD</div><div class="web-bars">' +
            [38, 52, 44, 61, 58, 72, 66, 80, 74, 88, 82, 95].map(function (h) {
              return '<i style="height:' + h + '%"></i>';
            }).join('') + '</div>' +
            '<p class="web-muted">Данные демонстрационные. Не является инвестиционной рекомендацией.</p>';
        }
      }
    },
    {
      id: 'kino', name: 'Кинозал', host: 'kino.lackuun.com', cat: 'fun',
      icon: 'fa-film', color: '#ef4444',
      slogan: 'Фильмы и сериалы без рекламы',
      nav: [['index', 'Афиша'], ['m1', 'Новинка']],
      pages: {
        index: function () {
          return '<div class="web-banner web-banner-red"><span class="pill light">Премьера</span><h3>«Городские огни»</h3>' +
            '<p>История курьера, который знает о городе больше всех.</p>' +
            '<button class="btn btn-white" type="button" onclick="Web.sitePage(\'kino\',\'m1\')">Смотреть</button></div>' +
            '<div class="web-h">Афиша</div>' +
            webMovie('m1', 'Городские огни', '2026 · драма', 'fa-city', '#ef4444') +
            webMovie('m2', 'Последний заказ', '2025 · триллер', 'fa-box', '#0f172a') +
            webMovie('m3', 'Тёплый дом', '2026 · комедия', 'fa-couch', '#f59e0b') +
            webMovie('m4', 'Ночная смена', '2024 · детектив', 'fa-moon', '#6366f1');
        },
        m1: function () {
          return '<div class="web-poster" style="background:linear-gradient(140deg,#ef4444,#7f1d1d)"><i class="fa-solid fa-city"></i></div>' +
            '<h3 class="web-title">Городские огни</h3><p class="web-muted">2026 · драма · 1 ч 48 мин</p>' +
            '<p class="web-text">Курьер Макс знает каждый двор и каждую остановку. Однажды его обычный заказ меняет всё.</p>' +
            '<div class="web-stars"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i><b>4.7</b></div>' +
            '<button class="btn btn-primary btn-block" style="margin-top:10px" type="button" onclick="LV.toast(\'Плеер отключён в симуляторе\')">Смотреть</button>';
        },
        m2: function () {
          return '<div class="web-poster" style="background:linear-gradient(140deg,#334155,#0f172a)"><i class="fa-solid fa-box"></i></div>' +
            '<h3 class="web-title">Последний заказ</h3><p class="web-muted">2025 · триллер · 2 ч 02 мин</p>' +
            '<p class="web-text">Курьер получает посылку без адреса. Правила простые: не открывать и не опаздывать.</p>' +
            '<button class="btn btn-primary btn-block" style="margin-top:10px" type="button" onclick="LV.toast(\'Плеер отключён в симуляторе\')">Смотреть</button>';
        },
        m3: function () {
          return '<div class="web-poster" style="background:linear-gradient(140deg,#f59e0b,#7c2d12)"><i class="fa-solid fa-couch"></i></div>' +
            '<h3 class="web-title">Тёплый дом</h3><p class="web-muted">2026 · комедия · 1 ч 36 мин</p>' +
            '<p class="web-text">Семья переезжает в старую квартиру и находит в стене письмо, которое меняет их планы на ремонт.</p>' +
            '<div class="web-stars"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-regular fa-star"></i><b>4.3</b></div>' +
            '<button class="btn btn-primary btn-block" style="margin-top:10px" type="button" onclick="LV.toast(\'Плеер отключён в симуляторе\')">Смотреть</button>';
        },
        m4: function () {
          return '<div class="web-poster" style="background:linear-gradient(140deg,#6366f1,#1e1b4b)"><i class="fa-solid fa-moon"></i></div>' +
            '<h3 class="web-title">Ночная смена</h3><p class="web-muted">2024 · детектив · 1 ч 52 мин</p>' +
            '<p class="web-text">Ночной ПВЗ, странный клиент и посылка, которую никто не заказывал. Одна смена — одно расследование.</p>' +
            '<div class="web-stars"><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i><b>4.6</b></div>' +
            '<button class="btn btn-primary btn-block" style="margin-top:10px" type="button" onclick="LV.toast(\'Плеер отключён в симуляторе\')">Смотреть</button>';
        }
      }
    },
    {
      id: 'igromir', name: 'ИгроМир', host: 'games.lackuun.com', cat: 'fun',
      icon: 'fa-gamepad', color: '#2563eb',
      slogan: 'Игры для любого настроения',
      nav: [['index', 'Каталог'], ['g1', 'Хит']],
      pages: {
        index: function () {
          return '<div class="web-banner web-banner-blue"><span class="pill light">Хит</span><h3>Собери корзину</h3>' +
            '<p>Аркада о доставке: собирай заказы и не теряй посылки.</p>' +
            '<button class="btn btn-white" type="button" onclick="Web.sitePage(\'igromir\',\'g1\')">Играть</button></div>' +
            '<div class="web-h">Каталог игр</div>' +
            webGame('Собери корзину', 'аркада', 'fa-basket-shopping', '#2563eb') +
            webGame('Ночной город', 'гонки', 'fa-car', '#8b5cf6') +
            webGame('Ферма у дома', 'симулятор', 'fa-seedling', '#10b981') +
            webGame('Космо-почта', 'головоломка', 'fa-rocket', '#ef4444');
        },
        g1: function () {
          return '<div class="web-poster" style="background:linear-gradient(140deg,#2563eb,#1e1b4b)"><i class="fa-solid fa-basket-shopping"></i></div>' +
            '<h3 class="web-title">Собери корзину</h3><p class="web-muted">Аркада · 12 уровней · бесплатно</p>' +
            '<p class="web-text">Управляй тележкой, собирай товары по списку и успевай на кассу до закрытия.</p>' +
            '<button class="btn btn-primary btn-block" style="margin-top:10px" type="button" onclick="LV.toast(\'Игра появится в разделе Игры\')">Играть</button>';
        }
      }
    },
    {
      id: 'weather', name: 'Погода', host: 'weather.lackuun.com', cat: 'service',
      icon: 'fa-cloud-sun', color: '#06b6d4',
      slogan: 'Точный прогноз на неделю',
      nav: [['index', 'Москва']],
      pages: {
        index: function () {
          return '<div class="web-weather"><i class="fa-solid fa-cloud-sun"></i><b>-3°</b><span>Москва · облачно с прояснениями</span>' +
            '<div class="web-chips">' + ['Москва', 'Петербург', 'Сочи', 'Казань'].map(function (c, i) {
              return '<button class="web-chip' + (i === 0 ? ' on' : '') + '" type="button" onclick="Web.chip(this);LV.toast(\'Прогноз для ' + c + '\')">' + c + '</button>';
            }).join('') + '</div></div>' +
            '<div class="web-h">На 5 дней</div>' +
            [['Сегодня', '-3°', 'fa-cloud-sun'], ['Чт', '-5°', 'fa-snowflake'], ['Пт', '-2°', 'fa-cloud'], ['Сб', '0°', 'fa-cloud-rain'], ['Вс', '-1°', 'fa-cloud-sun']].map(function (d) {
              return '<div class="web-row web-row-b"><b style="width:64px">' + d[0] + '</b><i class="fa-solid ' + d[2] + '" style="color:#06b6d4"></i><b>' + d[1] + '</b></div>';
            }).join('') +
            '<p class="web-muted">Ветер 4 м/с · влажность 78% · давление 742 мм</p>';
        }
      }
    },
    {
      id: 'maps', name: 'Карты', host: 'maps.lackuun.com', cat: 'service',
      icon: 'fa-map-location-dot', color: '#22c55e',
      slogan: 'Найди всё рядом',
      nav: [['index', 'Карта']],
      pages: {
        index: function () {
          var markers = [
            { x: 280, y: 240, kind: 'shop', color: '#22c55e' },
            { x: 500, y: 300, kind: 'rub', color: '#059669' },
            { x: 240, y: 440, kind: 'shield', color: '#3b82f6' },
            { x: 430, y: 470, kind: 'cross', color: '#ef4444' },
            { x: 80, y: 520, kind: 'tree', color: '#16a34a' },
            { x: 650, y: 260, kind: 'columns', color: '#64748b' },
            { x: 380, y: 340, kind: 'flag', color: '#8b5cf6' },
            { x: 520, y: 550, kind: 'factory', color: '#475569' },
            { x: 660, y: 590, kind: 'anchor', color: '#0ea5e9' }
          ];
          return '<div class="web-map">' +
            (window.CityMap ? CityMap.svg(markers, { you: { x: 380, y: 340 } }) : '') +
            '<span class="web-map-tag">Карта города</span></div>' +
            '<div class="web-h">Рядом с вами</div>' +
            webPlace('Пункт выдачи Лавки', 'Тверская, 12 · 240 м', 'fa-bag-shopping', '#10b981') +
            webPlace('Кофейня на углу', 'Тверская, 8 · 380 м', 'fa-mug-hot', '#b45309') +
            webPlace('BankFake', 'Садовая, 15 · 520 м', 'fa-building-columns', '#059669') +
            webPlace('Правительство', 'Правительственная, 1 · 700 м', 'fa-building-columns', '#64748b') +
            webPlace('БЦ «Сити»', 'Садовая, 8 · 900 м', 'fa-building', '#8b5cf6') +
            webPlace('ПК-клуб «Арена»', 'Тверская, 20 · 1,1 км', 'fa-gamepad', '#6366f1') +
            webPlace('Отделение полиции', 'Привокзальная, 2 · 610 м', 'fa-shield-halved', '#3b82f6') +
            webPlace('Городская больница', 'Садовая, 4 · 900 м', 'fa-hospital', '#ef4444') +
            '<p class="web-muted">Карта демонстрационная · маршруты недоступны</p>';
        }
      }
    },
    {
      id: 'mail', name: 'Почта', host: 'mail.lackuun.com', cat: 'service',
      icon: 'fa-envelope', color: '#0ea5e9',
      slogan: 'Письма и уведомления',
      nav: [['index', 'Входящие']],
      pages: {
        index: function () {
          return '<div class="web-h">Входящие</div>' +
            webMail('wm1', 'Лавка', 'Заказ в пути', 'Курьер уже выехал, доставка сегодня до 18:00', '12:40') +
            webMail('wm2', 'XPRODC ID', 'Новый вход в аккаунт', 'Устройство Lavka Phone 15 · Москва', '11:02') +
            webMail('wm3', 'LAVKA PAY', 'Начисление бонусов', '250 бонусов уже на счёте', 'Вчера') +
            webMail('wm4', 'Кинозал', 'Новая премьера', '«Городские огни» уже доступен', 'Вчера');
        },
        wm1: function () {
          return webLetter('Лавка', 'Заказ в пути', '12:40',
            'Здравствуйте!\n\nВаш заказ собран и передан курьеру. Ожидайте доставку сегодня с 14:00 до 18:00.\n\nКурьер позвонит за 20 минут.\n\nКоманда Лавки');
        },
        wm2: function () {
          return webLetter('XPRODC ID', 'Новый вход в аккаунт', '11:02',
            'Зафиксирован новый вход в аккаунт.\n\nУстройство: Lavka Phone 15\nГород: Москва\nВремя: сегодня, 11:02\n\nЕсли это были не вы — смените пароль в разделе «Безопасность».');
        },
        wm3: function () {
          return webLetter('LAVKA PAY', 'Начисление бонусов', 'Вчера',
            'На ваш бонусный счёт начислено 250 бонусов.\n\n1 бонус = 1 ₽ при оплате следующего заказа. Бонусы действуют 90 дней.');
        },
        wm4: function () {
          return webLetter('Кинозал', 'Новая премьера', 'Вчера',
            'Фильм «Городские огни» уже доступен подписчикам.\n\nПриятного просмотра!');
        }
      }
    }
  ];

  var WEB_LOGOS = {
    'fa-bag-shopping': '<path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    'fa-newspaper': '<rect x="3.5" y="5" width="17" height="14" rx="2"/><path d="M7 9h6M7 12.5h10M7 16h7"/>',
    'fa-bolt': '<path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z"/>',
    'fa-microchip': '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M4 10h3M4 14h3M17 10h3M17 14h3M10 4v3M14 4v3M10 17v3M14 17v3"/>',
    'fa-couch': '<path d="M4 12V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"/><path d="M3 12a1.5 1.5 0 0 1 3 0v3h12v-3a1.5 1.5 0 0 1 3 0v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5Z"/>',
    'fa-users': '<circle cx="9" cy="9" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 8.5a2.5 2.5 0 1 1 0 5"/><path d="M15.5 14.5A4.5 4.5 0 0 1 20.5 19"/>',
    'fa-user-group': '<circle cx="8" cy="8" r="2.6"/><circle cx="16" cy="9" r="2.2"/><path d="M3 19c0-2.8 2.2-5 5-5s5 2.2 5 5"/><path d="M14 19c0-2.2 1.6-4 4-4"/>',
    'fa-building-columns': '<path d="M4 20h16"/><path d="M6 20V10M10 20V10M14 20V10M18 20V10"/><path d="M3 10 12 4l9 6"/>',
    'fa-coins': '<ellipse cx="9" cy="7" rx="5" ry="2.5"/><path d="M4 7v5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V7"/><path d="M10 16.5c.9.6 2.2 1 3.5 1 2.8 0 5-1.1 5-2.5v-5"/>',
    'fa-film': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 5v14M16 5v14M3 9h5M3 15h5M16 9h5M16 15h5"/>',
    'fa-gamepad': '<path d="M8 9h8a5 5 0 0 1 4.8 6.4l-.5 1.6a2.4 2.4 0 0 1-4.1 1L14.5 16h-5l-1.7 2a2.4 2.4 0 0 1-4.1-1l-.5-1.6A5 5 0 0 1 8 9Z"/><path d="M8 12v3M6.5 13.5h3"/><circle cx="16" cy="12.5" r=".9"/><circle cx="18" cy="14.5" r=".9"/>',
    'fa-cloud-sun': '<circle cx="9" cy="9" r="3"/><path d="M9 3.5v1.5M4 9H2.5M9 14.5V16M14 9h1.5"/><path d="M8 19h8.5a3.5 3.5 0 0 0 .3-7 4.5 4.5 0 0 0-8.6.6"/>',
    'fa-map-location-dot': '<path d="M12 21s7-5.3 7-11a7 7 0 1 0-14 0c0 5.7 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
    'fa-envelope': '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>',
    'fa-heart-pulse': '<path d="M12 20s-7-4.3-7-9.5A4 4 0 0 1 12 8a4 4 0 0 1 7 2.5c0 5.2-7 9.5-7 9.5Z"/><path d="M7 12h3l1.5-2.5L14 14l1.2-2H17"/>',
    'fa-tags': '<path d="M4 5h7l9 9-6 6-9-9V5Z"/><circle cx="8" cy="9" r="1.4"/><path d="m13 12 4 4"/>',
    'fa-utensils': '<path d="M7 3v7a2 2 0 0 0 4 0V3"/><path d="M9 10v11"/><path d="M16 3c2 1.5 2 4 2 6s-.5 3-2 4v8"/>',
    'fa-comments': '<path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6Z"/><path d="M8 9h8M8 12h5"/>',
    'fa-ticket': '<path d="M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z"/><path d="M9 5v14"/>',
    'fa-briefcase': '<rect x="3" y="7.5" width="18" height="11" rx="2"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5"/><path d="M3 12h18"/>',
    'fa-building': '<path d="M5 21V4h9v17"/><path d="M14 9h5v12"/><path d="M8 8h3M8 12h3M8 16h3M16 12h1M16 16h1"/>',
    'fa-capsules': '<rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-45 12 12)"/><path d="M9 15 15 9"/>',
    'fa-music': '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
    'fa-futbol': '<circle cx="12" cy="12" r="8.5"/><path d="m12 7 3.5 2.5-1.3 4h-4.4L8.5 9.5 12 7Z"/>',
    'fa-burger': '<path d="M4 10a8 8 0 0 1 16 0"/><path d="M3.5 10h17"/><path d="M4 14h16"/><path d="M4 17.5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2"/>',
    'fa-plane': '<path d="M3 13.5 21 5l-4.5 8.5L21 19l-6-2-4 3v-4.5L3 13.5Z"/>',
    'fa-book-open': '<path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5Z"/><path d="M12 6.5v13"/>',
    'fa-landmark': '<path d="M3 20h18"/><path d="M5 20v-8M9 20v-8M15 20v-8M19 20v-8"/><path d="M12 3 3 8h18L12 3Z"/>',
    __default: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17"/>'
  };
  function siteLogoHTML(s) {
    var g = WEB_LOGOS[s && s.icon] || WEB_LOGOS.__default;
    return '<svg class="web-logo-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + g + '</svg>';
  }

  var EXTRA_SITES = [
    {
      id: 'afisha', name: 'Афиша', host: 'afisha.net', cat: 'fun',
      icon: 'fa-ticket', color: '#a855f7',
      slogan: 'Куда пойти в городе',
      nav: [['index', 'События'], ['weekend', 'Выходные'], ['about', 'О проекте']],
      pages: {
        index: function () {
          var ev = [
            ['12', 'ноя', 'Ночь маркетплейсов', 'Клуб «Склад»', '20:00', 'от 800 ₽', 'linear-gradient(150deg,#7c3aed,#c026d3)', 'fa-music'],
            ['15', 'ноя', 'Форум бизнеса', 'БЦ «Сити»', '11:00', 'вход по билету', 'linear-gradient(150deg,#0ea5e9,#0f766e)', 'fa-briefcase'],
            ['19', 'ноя', 'Кинопоказ «Ночная смена»', 'Кинозал «Луч»', '21:30', 'от 400 ₽', 'linear-gradient(150deg,#ef4444,#7c2d12)', 'fa-film'],
            ['23', 'ноя', 'Рынок локальных брендов', 'Парк, аллея', '12:00', 'бесплатно', 'linear-gradient(150deg,#22c55e,#15803d)', 'fa-bag-shopping']
          ];
          return '<div class="af-chips"><button class="af-chip on" type="button">Все</button><button class="af-chip" type="button">Сегодня</button><button class="af-chip" type="button">Музыка</button><button class="af-chip" type="button">Кино</button></div>' +
            '<div class="af-grid">' + ev.map(function (e) {
              return '<button class="af-card" type="button" onclick="LV.toast(\'Билеты появятся в продаже\')">' +
                '<span class="af-poster" style="background:' + e[6] + '"><i class="fa-solid ' + e[7] + '"></i>' +
                '<em class="af-date"><b>' + e[0] + '</b><small>' + e[1] + '</small></em></span>' +
                '<span class="af-name">' + e[2] + '</span>' +
                '<span class="af-meta">' + e[3] + ' · ' + e[4] + '</span>' +
                '<span class="af-price">' + e[5] + '</span></button>';
            }).join('') + '</div>';
        },
        weekend: function () {
          return '<div class="af-hero"><b>2 дня · 5 событий</b><span>Подборка на субботу и воскресенье</span></div>' +
            '<div class="af-list">' +
            '<button class="af-row" type="button"><span class="af-time">10:00</span><div><b>Экскурсия по Промзоне</b><span>Сбор у завода · 300 ₽</span></div><i class="fa-solid fa-chevron-right"></i></button>' +
            '<button class="af-row" type="button"><span class="af-time">13:00</span><div><b>Кухня улиц</b><span>Набережная · бесплатно</span></div><i class="fa-solid fa-chevron-right"></i></button>' +
            '<button class="af-row" type="button"><span class="af-time">18:00</span><div><b>Квартирник «Пульс»</b><span>Лофт на Ленина · 600 ₽</span></div><i class="fa-solid fa-chevron-right"></i></button>' +
            '</div>';
        },
        about: function () {
          return '<div class="af-about"><h3>Афиша города</h3><p>Собираем события каждую неделю: концерты, форумы, рынки и кинопоказы. Без накрученных отзывов.</p>' +
            '<div class="af-stats"><div><b>48</b><span>событий в месяц</span></div><div><b>12</b><span>площадок</span></div><div><b>0 ₽</b><span>за просмотр</span></div></div></div>';
        }
      }
    },
    {
      id: 'doma', name: 'Дома', host: 'doma.net', cat: 'service',
      icon: 'fa-building', color: '#14b8a6',
      slogan: 'Квартиры и помещения в аренду',
      nav: [['index', 'Объекты'], ['map', 'На карте'], ['about', 'О сервисе']],
      pages: {
        index: function () {
          var flats = [
            ['2 комнаты, 54 м²', 'Центр, Ленина 12', '48 000 ₽', '9 эт.', '4/9', 'linear-gradient(150deg,#0f766e,#134e4a)'],
            ['Студия, 28 м²', 'Спальный, Мира 3', '26 000 ₽', 'студия', '2/12', 'linear-gradient(150deg,#0ea5e9,#1e3a8a)'],
            ['Помещение, 80 м²', 'Вокзал, Привокзальная 1', '62 000 ₽', 'своб. план.', '1/1', 'linear-gradient(150deg,#a855f7,#4c1d95)']
          ];
          return '<div class="dm-tabs"><button class="dm-tab on" type="button">Аренда</button><button class="dm-tab" type="button">Продажа</button><button class="dm-tab" type="button">Помещения</button></div>' +
            '<div class="dm-list">' + flats.map(function (f) {
              return '<button class="dm-card" type="button" onclick="LV.toast(\'Показ по записи\')">' +
                '<span class="dm-photo" style="background:' + f[5] + '"><i class="fa-solid fa-building"></i><em>' + f[2] + '</em></span>' +
                '<span class="dm-body"><b>' + f[0] + '</b><span class="dm-addr">' + f[1] + '</span>' +
                '<span class="dm-specs"><span>' + f[3] + '</span><span>этаж ' + f[4] + '</span><span>без комиссии</span></span></span></button>';
            }).join('') + '</div>';
        },
        map: function () {
          return '<div class="dm-map"><span class="dm-pin p1"></span><span class="dm-pin p2"></span><span class="dm-pin p3"></span>' +
            '<div class="dm-map-card"><b>12 объектов</b><span>в радиусе 2 км от центра</span></div></div>' +
            '<button class="btn btn-block" type="button" onclick="Web.toApp(\'maps\')">Открыть слой аренды в Картах</button>';
        },
        about: function () {
          return '<div class="af-about"><h3>Дома</h3><p>Проверенные объявления от собственников и агентств. Показ — по записи, без комиссии за просмотр.</p>' +
            '<div class="af-stats"><div><b>340</b><span>объектов</span></div><div><b>24 ч</b><span>ответ</span></div><div><b>0%</b><span>комиссия</span></div></div></div>';
        }
      }
    },
    {
      id: 'apteka', name: 'Аптека', host: 'apteka.net', cat: 'shop',
      icon: 'fa-capsules', color: '#22c55e',
      slogan: 'Лекарства и здоровье рядом',
      nav: [['index', 'Каталог'], ['order', 'Заказ'], ['about', 'О сервисе']],
      pages: {
        index: function () {
          var cats = [['Простуда', 'fa-thermometer-half'], ['Витамины', 'fa-leaf'], ['Аптечка', 'fa-kit-medical'], ['Уход', 'fa-pump-soap']];
          var meds = [
            ['Аспирин 500 мг', '20 таблеток · №1', 180, false],
            ['Витамин C', '60 таблеток · №3', 420, false],
            ['Пластыри бактерицидные', '10 шт · №2', 95, false],
            ['Антибиотик широкого спектра', '14 капсул · №5', 640, true]
          ];
          return '<div class="ap-search"><i class="fa-solid fa-magnifying-glass"></i><span>Найти лекарство или симптом</span></div>' +
            '<div class="ap-cats">' + cats.map(function (c) {
              return '<button class="ap-cat" type="button" onclick="LV.toast(\'' + c[0] + ': скоро\')"><i class="fa-solid ' + c[1] + '"></i><span>' + c[0] + '</span></button>';
            }).join('') + '</div>' +
            '<div class="ap-list">' + meds.map(function (m) {
              return '<div class="ap-item"><span class="ap-cross"><i class="fa-solid fa-plus"></i></span>' +
                '<div class="ap-info"><b>' + m[0] + '</b><span>' + m[1] + '</span>' + (m[3] ? '<em class="ap-rx">по рецепту</em>' : '') + '</div>' +
                '<div class="ap-right"><b>' + LV.fmt(m[2]) + '</b></div></div>';
            }).join('') + '</div>';
        },
        order: function () {
          return '<div class="ap-order"><span class="ap-cross big"><i class="fa-solid fa-check"></i></span>' +
            '<b>Заказ №A-2041</b><p>Аспирин 500 мг · 1 упаковка</p>' +
            '<div class="ap-track"><span class="done"></span><span class="done"></span><span></span></div>' +
            '<small>Готов к выдаче в аптеке на Ленина, 12</small></div>' +
            '<button class="btn btn-primary btn-block" type="button" onclick="LV.toast(\'Покажите номер на кассе\')">Показать номер</button>';
        },
        about: function () {
          return '<div class="af-about"><h3>Аптека</h3><p>Сеть городских аптек: 34 точки, доставка от 2 часов. Рецептурные препараты — только при предъявлении рецепта.</p>' +
            '<div class="af-stats"><div><b>34</b><span>точки</span></div><div><b>15 мин</b><span>сборка</span></div><div><b>2 ч</b><span>доставка</span></div></div></div>';
        }
      }
    }
  ];
  WEB_SITES.push.apply(WEB_SITES, EXTRA_SITES);

  var webBody = null;
  var webTabs = [];
  var webActive = 0;
  var webTabSeq = 0;
  var webTabsOpen = false;
  var webScrollReset = false;
  var webLikes = {};
  var webFollows = {};

  function webNewTabState(entry) {
    return { id: ++webTabSeq, history: [entry || { kind: 'start' }], index: 0, scroll: 0 };
  }
  function webTab() { return webTabs[webActive] || webTabs[0] || null; }
  function webTabsReset() {
    webTabs = [webNewTabState({ kind: 'start' })];
    webActive = 0;
    webTabsOpen = false;
  }

  function webSite(id) {
    return WEB_SITES.filter(function (s) { return s.id === id; })[0];
  }
  function webCat(id) {
    return WEB_CATS.filter(function (c) { return c.id === id; })[0];
  }
  function webSitesIn(cat) {
    return WEB_SITES.filter(function (s) { return s.cat === cat && !s.hidden; });
  }
  function webEntry() {
    var t = webTab();
    return t ? (t.history[t.index] || { kind: 'start' }) : { kind: 'start' };
  }

  function webPush(e) {
    var t = webTab();
    if (!t) return;
    t.history = t.history.slice(0, t.index + 1);
    t.history.push(e);
    t.index = t.history.length - 1;
    t.scroll = 0;
    webScrollReset = true;
    webRender();
  }

  function webProduct(name, price, old, ico, color) {
    return '<div class="web-prod"><span class="web-prod-ic" style="background:' + color + '"><i class="fa-solid ' + ico + '"></i></span>' +
      '<div class="web-prod-info"><b>' + name + '</b><span class="web-price">' + LV.fmt(price) + '</span>' +
      (old ? '<span class="web-old">' + LV.fmt(old) + '</span>' : '') + '</div></div>';
  }
  function webNews(page, title, text, meta) {
    return '<button class="web-news" type="button" onclick="Web.sitePage(\'vesti\',\'' + page + '\')">' +
      '<b>' + title + '</b><span>' + text + '</span><small>' + meta + '</small></button>';
  }
  function webNewsSite(siteId, page, title, text, meta) {
    return '<button class="web-news" type="button" onclick="Web.sitePage(\'' + siteId + '\',\'' + page + '\')">' +
      '<b>' + title + '</b><span>' + text + '</span><small>' + meta + '</small></button>';
  }
  function webArticle(title, kicker, lead, body) {
    return '<article class="web-article"><span class="web-kicker">' + kicker + '</span><h3>' + title + '</h3>' +
      '<p class="web-lead-p">' + lead + '</p>' + body + '</article>';
  }
  function webPost(id, name, ini, color, text, likes) {
    return '<div class="web-post"><div class="web-post-head"><span class="web-ava" style="background:' + color + '">' + ini + '</span>' +
      '<div><b>' + name + '</b><span>только что</span></div></div><p>' + text + '</p>' +
      '<button class="web-like" type="button" data-like="' + id + '" onclick="Web.like(this)"><i class="fa-solid fa-heart"></i><b>' + likes + '</b></button>' +
      '<button class="web-like" type="button" onclick="LV.toast(\'Комментарии скоро\')"><i class="fa-solid fa-comment"></i><b>12</b></button></div>';
  }
  function webPerson(id, name, role, ini, color, label) {
    var on = !!webFollows[id];
    return '<div class="web-person"><span class="web-ava" style="background:' + color + '">' + ini + '</span>' +
      '<div style="flex:1;min-width:0"><b>' + name + '</b><span>' + role + '</span></div>' +
      '<button class="web-follow' + (on ? ' on' : '') + '" type="button" onclick="Web.follow(this,\'' + id + '\')">' + (on ? 'Вы подписаны' : label) + '</button></div>';
  }
  function webMovie(id, title, meta, ico, color) {
    return '<button class="web-movie" type="button" onclick="Web.sitePage(\'kino\',\'' + id + '\')">' +
      '<span class="web-movie-poster" style="background:linear-gradient(140deg,' + color + ',#0f172a)"><i class="fa-solid ' + ico + '"></i></span>' +
      '<b>' + title + '</b><span>' + meta + '</span></button>';
  }
  function webGame(title, genre, ico, color) {
    return '<div class="web-row web-row-b"><span class="web-app-ic" style="background:' + color + '"><i class="fa-solid ' + ico + '"></i></span>' +
      '<span><b style="display:block">' + title + '</b><small style="color:var(--muted)">' + genre + '</small></span>' +
      '<button class="web-mini" type="button" onclick="LV.toast(\'Игра появится в разделе Игры\')">Играть</button></div>';
  }
  function webPlace(name, meta, ico, color) {
    return '<div class="web-row web-row-b"><span class="web-app-ic" style="background:' + color + '"><i class="fa-solid ' + ico + '"></i></span>' +
      '<span><b style="display:block">' + name + '</b><small style="color:var(--muted)">' + meta + '</small></span>' +
      '<i class="fa-solid fa-route" style="color:var(--muted)"></i></div>';
  }
  function webMail(id, from, subj, prev, time) {
    return '<button class="web-news" type="button" onclick="Web.sitePage(\'mail\',\'' + id + '\')">' +
      '<b>' + from + '</b><span>' + subj + ' — ' + prev + '</span><small>' + time + '</small></button>';
  }
  function webLetter(from, subj, time, body) {
    return '<div class="web-letter"><div class="web-letter-head"><b>' + from + '</b><span>' + time + '</span></div>' +
      '<h3>' + subj + '</h3><p>' + LV.esc(body).replace(/\n/g, '<br>') + '</p></div>' +
      '<button class="btn btn-block" style="margin-top:10px" type="button" onclick="Web.sitePage(\'mail\',\'index\')">К входящим</button>';
  }

  function webSiteCard(s) {
    if (!s) return '';
    return '<button class="web-site-card" type="button" onclick="Web.open(\'' + s.id + '\')">' +
      '<span class="web-site-ic" style="background:' + s.color + '">' + siteLogoHTML(s) + '</span>' +
      '<span class="web-site-info"><b>' + LV.esc(s.name) + '</b><span>' + LV.esc(s.host) + '</span></span>' +
      '<i class="fa-solid fa-chevron-right web-chev"></i></button>';
  }

  function webAddress(e) {
    if (e.kind === 'site') {
      var s = webSite(e.site);
      if (!s) return 'lackuun.com';
      return s.host + (e.page && e.page !== 'index' ? '/' + e.page : '');
    }
    if (e.kind === 'cat') return 'lackuun.com/c/' + e.cat;
    if (e.kind === 'search') return 'lackuun.com/search?q=' + e.q;
    if (e.kind === 'cats') return 'lackuun.com/categories';
    if (e.kind === 'favs') return 'lackuun.com/bookmarks';
    return 'lackuun.com';
  }

  function webShortcuts() {
    var ids = ['lavka', 'bankfake', 'pulse', 'edok', 'kino', 'mail', 'weather', 'maps'];
    return '<div class="web-shortcuts">' + ids.map(function (id) {
      var s = webSite(id);
      if (!s || s.hidden) return '';
      return '<button class="web-shortcut" type="button" onclick="Web.open(\'' + s.id + '\')">' +
        '<span class="web-shortcut-ic" style="background:' + s.color + '">' + siteLogoHTML(s) + '</span>' +
        '<b>' + LV.esc(s.name) + '</b></button>';
    }).join('') + '</div>';
  }

  // ---------- реклама ----------
  var WEB_ADS_MODERN = [
    {
      brand: 'LAVKA PAY', icon: 'fa-wallet', accent: '#10b981',
      title: 'Кэшбэк 5% на всё',
      text: 'Счёт для покупок и бизнеса. Обслуживание — 0 ₽, переводы без комиссии.',
      cta: 'Открыть счёт', site: 'bankfake', badge: '0 ₽',
      price: 'бесплатно', note: 'для бизнеса',
      advertiser: 'ООО «ЛАВКА ФИНАНС»', erid: '2VfnxW9aK1'
    },
    {
      brand: 'XPRODC ID', icon: 'fa-fingerprint', accent: '#6366f1',
      title: 'Один ID для всех сервисов',
      text: 'Вход без паролей, история заказов и бонусы в Лавке, BankFake и LAVKA PAY.',
      cta: 'Подключить', site: 'bankfake', badge: '1 клик',
      advertiser: 'XPRODC', erid: '2VfnxQ4mT7'
    },
    {
      brand: 'Едок', icon: 'fa-burger', accent: '#f97316',
      title: 'Ужин за 30 минут',
      text: 'Пицца, бургеры и суши с доставкой. −25% на первый заказ по коду LAVKA25.',
      cta: 'Заказать', site: 'edok', badge: '−25%',
      price: 'от 490 ₽', old: '650 ₽', note: '30 мин',
      advertiser: 'ООО «Едок»', erid: '2VfnxL2pR9'
    },
    {
      brand: 'Квант', icon: 'fa-wand-magic-sparkles', accent: '#8b5cf6',
      title: 'Спроси Кванта о чём угодно',
      text: 'Поможет с текстом, таблицами и кодом. Первые 20 запросов бесплатно.',
      cta: 'Попробовать', site: 'kvant', badge: '20 free',
      duration: '0:42', views: '1,2 млн',
      advertiser: 'ООО «Квант»', erid: '2VfnxK7dS5'
    },
    {
      brand: 'Опт', icon: 'fa-truck-fast', accent: '#0f766e',
      title: 'Товар для бизнеса со склада',
      text: 'Поставки для ПВЗ, кофеен и магазинов. Доставка на точку за 1 день.',
      cta: 'Перейти', site: 'opt', badge: 'B2B',
      advertiser: 'ООО «Опт-Сервис»', erid: '2VfnxN4vB8'
    },
    {
      brand: 'Авиатор', icon: 'fa-plane', accent: '#0e7490',
      title: 'Билеты от 2 990 ₽',
      text: 'Прямые рейсы по стране. Возврат без штрафа за 24 часа.',
      cta: 'Найти билет', site: 'aviator', badge: '−30%',
      price: 'от 2 990 ₽', old: '4 200 ₽',
      advertiser: 'АО «Авиатор»', erid: '2VfnxZ2hJ6'
    },
    {
      brand: 'ТехноМир', icon: 'fa-headphones', accent: '#0284c7',
      title: 'Наушники недели',
      text: 'Беспроводные, 40 часов работы и шумоподавление.',
      cta: 'В каталог', site: 'techno', badge: '−33%',
      price: '9 990 ₽', old: '14 990 ₽', note: 'осталось 12',
      advertiser: 'ООО «ТехноМир»', erid: '2VfnxR3cV4'
    },
    {
      brand: 'Кинозал', icon: 'fa-film', accent: '#b91c1c',
      title: 'Премьера: «Ночная смена»',
      text: 'История о ночном ПВЗ, которая пошла не по плану.',
      cta: 'Смотреть', site: 'kino', badge: 'премьера',
      duration: '2:14', views: '84 тыс.',
      advertiser: 'ООО «Кинозал»', erid: '2VfnxG8yU2'
    },
    {
      brand: 'Лавка', icon: 'fa-bag-shopping', accent: '#16a34a',
      title: 'Скидки до 40% на технику',
      text: 'Смартфоны, ноутбуки и аксессуары недели.',
      cta: 'Смотреть', site: 'lavka', badge: '−40%',
      price: 'от 299 ₽', old: '499 ₽',
      advertiser: 'ООО «Лавка»', erid: '2VfnxT6wE2'
    },
    {
      brand: 'LAVKA Бонусы', icon: 'fa-gift', accent: '#f59e0b',
      title: '250 бонусов за покупку',
      text: '1 бонус = 1 ₽ при оплате следующего заказа. Действуют 90 дней.',
      cta: 'Забрать', site: 'lavka', badge: '+250',
      advertiser: 'ООО «Лавка»', erid: '2VfnxB2nM5'
    }
  ];

  var WEB_ADS_OLD = [
    {
      brand: 'Городок', title: 'НОВОСТИ ГОРОДА — КАЖДЫЙ ДЕНЬ',
      text: 'Открытие «Северного», транспорт, погода и афиша',
      site: 'gorodok', page: 'index',
      advertiser: 'Городок.net', erid: '2VfnxH7bN3'
    },
    {
      brand: 'Гостевая', title: 'ОСТАВЬ ЗАПИСЬ В ГОСТЕВОЙ КНИГЕ',
      text: '2 481 запись · отвечает администратор',
      site: 'gorodok', page: 'guestbook',
      advertiser: 'Городок.net', erid: '2VfnxB5sD1'
    },
    {
      brand: 'ICQ', title: 'СКАЧАЙ ICQ 2003b — ОБЩАЙСЯ БЕСПЛАТНО!',
      text: 'Аська № 148-271-336 · звони, если что',
      site: 'gorodok', page: 'links',
      advertiser: 'Городок.net', erid: '2VfnxC8kF4'
    },
    {
      brand: 'Афиша', title: 'АФИША НА НЕДЕЛЮ: КОНЦЕРТЫ И ВЫСТАВКИ',
      text: 'Филармония, Дом культуры и кинотеатр «Луч»',
      site: 'gorodok', page: 'afisha',
      advertiser: 'Городок.net', erid: '2VfnxM3tY6'
    },
    {
      brand: 'Конкурс', title: 'ФОТОКОНКУРС «ОСЕНЬ В ГОРОДЕ»',
      text: 'Приз — принтер · снимки принимаем до 25 октября',
      site: 'gorodok', page: 'news',
      advertiser: 'Городок.net', erid: '2VfnxJ5rD7'
    },
    {
      brand: 'Dial-up', title: 'БЕСПЛАТНЫЙ ИНТЕРНЕТ НА 30 ДНЕЙ!',
      text: 'Карточка доступа в подарок · 56k · без абонплаты',
      site: 'gorodok', page: 'links',
      advertiser: 'ООО «Городской провайдер»', erid: '2VfnxY9sL2'
    },
    {
      brand: 'Погода', title: 'ПОГОДА НА НЕДЕЛЮ: −7 °C, СНЕГ',
      text: 'Курс доллара: 29,45 ₽ · пробки: 3 балла',
      site: 'gorodok', page: 'index',
      advertiser: 'Городок.net', erid: '2VfnxK1eP6'
    }
  ];

  var WEB_ADS_TEXT = [
    {
      title: 'Доставка продуктов за час', host: 'lackuun.com',
      text: 'Свежие продукты из Лавки — на дом и в офис. Бесплатно от 3 000 ₽.',
      site: 'lavka', advertiser: 'ООО «Лавка»', erid: '2VfnxT6wE2'
    },
    {
      title: 'Кредит на развитие бизнеса', host: 'bankfake.net',
      text: 'Решение за 5 минут, ставка от 12% годовых. Без залога и поручителей.',
      site: 'bankfake', advertiser: 'АО «BankFake»', erid: '2VfnxP1qA8'
    }
  ];

  function webAdSeed(str, total) {
    var h = 0, s = String(str || '');
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100003;
    return total ? h % total : h;
  }

  function webAdLegal(ad) {
    return '<small class="web-ad-legal">' + LV.esc(ad.advertiser) + ' · erid: ' + LV.esc(ad.erid) + '</small>';
  }

  function webAdHero(ad) {
    return '<button class="web-ad web-ad-modern" type="button" style="--ad-accent:' + ad.accent + '" onclick="Web.open(\'' + ad.site + '\')">' +
      '<span class="web-ad-row"><span class="web-ad-mark">Реклама</span>' +
      '<span class="web-ad-brand"><i class="fa-solid ' + ad.icon + '"></i> ' + LV.esc(ad.brand) + '</span></span>' +
      '<b class="web-ad-title">' + LV.esc(ad.title) + '</b>' +
      '<span class="web-ad-text">' + LV.esc(ad.text) + '</span>' +
      '<span class="web-ad-cta">' + LV.esc(ad.cta) + ' <i class="fa-solid fa-arrow-right"></i></span>' +
      webAdLegal(ad) + '</button>';
  }

  function webAdTile(ad) {
    return '<button class="web-ad web-ad-tile" type="button" style="--ad-accent:' + ad.accent + '" onclick="Web.open(\'' + ad.site + '\')">' +
      '<span class="web-ad-tile-art"><i class="fa-solid ' + ad.icon + '"></i></span>' +
      '<span class="web-ad-tile-body">' +
      '<span class="web-ad-row"><span class="web-ad-mark">Реклама</span>' +
      '<span class="web-ad-brand">' + LV.esc(ad.brand) + '</span></span>' +
      '<b class="web-ad-tile-title">' + LV.esc(ad.title) + '</b>' +
      (ad.price ? '<span class="web-ad-price">' + LV.esc(ad.price) + (ad.old ? ' <s>' + LV.esc(ad.old) + '</s>' : '') + '</span>' : '') +
      '<span class="web-ad-text">' + LV.esc(ad.text) + '</span>' +
      '<span class="web-ad-cta">' + LV.esc(ad.cta) + '</span>' +
      '</span>' +
      (ad.badge ? '<span class="web-ad-badge">' + LV.esc(ad.badge) + '</span>' : '') +
      webAdLegal(ad) + '</button>';
  }

  function webAdVideo(ad) {
    return '<button class="web-ad web-ad-video" type="button" style="--ad-accent:' + ad.accent + '" onclick="Web.open(\'' + ad.site + '\')">' +
      '<span class="web-ad-video-art"><i class="fa-solid ' + ad.icon + ' web-ad-video-ico"></i>' +
      '<span class="web-ad-play"><i class="fa-solid fa-play"></i></span>' +
      (ad.duration ? '<span class="web-ad-dur">' + LV.esc(ad.duration) + '</span>' : '') + '</span>' +
      '<span class="web-ad-video-body">' +
      '<span class="web-ad-row"><span class="web-ad-mark">Реклама</span>' +
      '<span class="web-ad-brand">' + LV.esc(ad.brand) + '</span></span>' +
      '<b class="web-ad-video-title">' + LV.esc(ad.title) + '</b>' +
      '<span class="web-ad-text">' + LV.esc(ad.text) + '</span>' +
      '<span class="web-ad-meta">' + (ad.views ? LV.esc(ad.views) + ' просмотров · ' : '') + LV.esc(ad.cta) + '</span>' +
      '</span>' + webAdLegal(ad) + '</button>';
  }

  function webAdSplit(ad) {
    return '<button class="web-ad web-ad-split" type="button" style="--ad-accent:' + ad.accent + '" onclick="Web.open(\'' + ad.site + '\')">' +
      '<span class="web-ad-split-body">' +
      '<span class="web-ad-row"><span class="web-ad-mark">Реклама</span>' +
      '<span class="web-ad-brand">' + LV.esc(ad.brand) + '</span></span>' +
      '<b class="web-ad-split-title">' + LV.esc(ad.title) + '</b>' +
      '<span class="web-ad-text">' + LV.esc(ad.text) + '</span>' +
      (ad.badge ? '<span class="web-ad-badge inline">' + LV.esc(ad.badge) + '</span>' : '') +
      '<span class="web-ad-cta ghost">' + LV.esc(ad.cta) + ' <i class="fa-solid fa-arrow-right"></i></span>' +
      '</span>' +
      '<span class="web-ad-split-art"><i class="fa-solid ' + ad.icon + '"></i><em></em><em></em></span>' +
      webAdLegal(ad) + '</button>';
  }

  function webAdTicker(ad) {
    var line = LV.esc(ad.brand + ' · ' + ad.title + ' · ' + ad.text + ' · ');
    return '<button class="web-ad web-ad-ticker" type="button" onclick="Web.open(\'' + ad.site + '\')">' +
      '<span class="web-ad-ticker-row"><span class="web-ad-mark">Реклама</span>' +
      '<span class="web-ad-ticker-track"><span>' + line + line + '</span></span>' +
      '<i class="fa-solid fa-arrow-right"></i></span>' + webAdLegal(ad) + '</button>';
  }

  function webAdOldBanner(ad) {
    return '<button class="web-ad-old" type="button" onclick="Web.open(\'' + ad.site + '\'' + (ad.page ? ',\'' + ad.page + '\'' : '') + ')">' +
      '<span class="web-ad-old-tag">РЕКЛАМА</span>' +
      '<span class="web-ad-old-new">NEW!</span>' +
      '<span class="web-ad-old-brand">' + LV.esc(ad.brand) + '</span>' +
      '<span class="web-ad-old-title">' + LV.esc(ad.title) + '</span>' +
      '<span class="web-ad-old-text">' + LV.esc(ad.text) + '</span>' +
      webAdLegal(ad) + '</button>';
  }

  function webAdOldPair(ad) {
    return '<button class="web-ad web-ad-oldpair" type="button" onclick="Web.open(\'' + ad.site + '\'' + (ad.page ? ',\'' + ad.page + '\'' : '') + ')">' +
      '<span class="web-ad-oldpair-row">' +
      '<span class="old-btn88"><b>' + LV.esc(ad.brand) + '</b><span>NET</span></span>' +
      '<span class="old-btn88 alt2"><b>RU</b><span>TOP</span></span>' +
      '<span class="web-ad-oldpair-text"><b>' + LV.esc(ad.title) + '</b><span>' + LV.esc(ad.text) + '</span></span>' +
      '</span>' + webAdLegal(ad) + '</button>';
  }

  function webAdStrip(ad) {
    return '<button class="web-ad web-ad-strip" type="button" onclick="Web.open(\'' + ad.site + '\')">' +
      '<span class="web-ad-mark">Реклама</span>' +
      '<span class="web-ad-strip-main"><b>' + LV.esc(ad.title) + '</b><span>' + LV.esc(ad.text) + '</span></span>' +
      '<i class="fa-solid fa-chevron-right"></i>' + webAdLegal(ad) + '</button>';
  }

  function webAdText(ad) {
    return '<button class="web-ad-text" type="button" onclick="Web.open(\'' + ad.site + '\')">' +
      '<span class="web-ad-mark">Реклама</span>' +
      '<b>' + LV.esc(ad.title) + '</b>' +
      '<span class="web-ad-url">' + LV.esc(ad.host) + '</span>' +
      '<span class="web-ad-text-line">' + LV.esc(ad.text) + '</span>' + webAdLegal(ad) + '</button>';
  }

  function webAd(style, i) {
    if (style === 'old') return webAdOldBanner(WEB_ADS_OLD[i % WEB_ADS_OLD.length]);
    if (style === 'oldpair') return webAdOldPair(WEB_ADS_OLD[i % WEB_ADS_OLD.length]);
    if (style === 'text') return webAdText(WEB_ADS_TEXT[i % WEB_ADS_TEXT.length]);
    var ad = WEB_ADS_MODERN[i % WEB_ADS_MODERN.length];
    if (style === 'tile') return webAdTile(ad);
    if (style === 'video') return webAdVideo(ad);
    if (style === 'split') return webAdSplit(ad);
    if (style === 'ticker') return webAdTicker(ad);
    if (style === 'hero' || style === 'modern') return webAdHero(ad);
    return webAdStrip(ad);
  }

  function webAdForSite(site, page) {
    var seed = webAdSeed((site.id || '') + ':' + (page || 'index'));
    if (site.era === 'old') return seed % 3 === 0 ? webAd('oldpair', seed) : webAd('old', seed);
    var pool = ['hero', 'tile', 'video', 'split', 'ticker', 'strip'];
    return webAd(pool[seed % pool.length], seed);
  }

  function webAdCarousel() {
    return '<div class="web-ad-carousel">' +
      '<div class="web-ad-carousel-head"><span class="web-ad-mark">Реклама</span><span>3 предложения</span></div>' +
      '<div class="web-ad-carousel-track">' +
      webAd('hero', 0) + webAd('tile', 2) + webAd('video', 3) +
      '</div></div>';
  }

  function webStart() {
    var letters = [['L', '#4285F4'], ['a', '#EA4335'], ['c', '#FBBC05'], ['k', '#4285F4'], ['u', '#34A853'], ['u', '#EA4335'], ['n', '#4285F4']];
    var favs = (S.webFav || []).map(webSite).filter(function (s) { return s && !s.hidden; });
    return '<div class="web-start web-google">' +
      '<div class="web-g-logo">' + letters.map(function (l) { return '<span style="color:' + l[1] + '">' + l[0] + '</span>'; }).join('') + '<em>.com</em></div>' +
      '<p class="web-g-sub">Поиск по сайтам, новостям и сервисам Lackuun</p>' +
      '<div class="web-gsearch"><i class="fa-solid fa-magnifying-glass"></i>' +
      '<input id="web-search" placeholder="Поиск в Lackuun" onkeydown="if(event.key===\'Enter\')Web.search()">' +
      '<button type="button" onclick="Web.search()" aria-label="Найти"><i class="fa-solid fa-magnifying-glass"></i></button></div>' +
      '<div class="web-g-actions">' +
      '<button type="button" onclick="Web.search()">Поиск в Lackuun</button>' +
      '<button type="button" onclick="Web.cats()">Все категории</button>' +
      '</div>' +
      '<div class="web-gchips">' + WEB_CATS.map(function (c) {
        return '<button class="web-gchip" type="button" onclick="Web.cat(\'' + c.id + '\')"><i class="fa-solid ' + c.icon + '" style="color:' + c.color + '"></i>' + c.name + '</button>';
      }).join('') + '</div>' +
      '<div class="web-h web-h-center">Популярное</div>' + webShortcuts() +
      '<div class="web-ad-slot">' + webAdCarousel() + '</div>' +
      (favs.length ? '<div class="web-h">Закладки</div>' + favs.map(webSiteCard).join('') : '') +
      '<div class="web-h">Сейчас в городе</div>' +
      webNews('a2', 'Городские службы перешли на зимний график', 'Техника вышла на улицы, работа идёт круглосуточно.', 'Сегодня, 09:05') +
      webNews('a3', 'Доставка за час стала доступна в 12 районах', 'Сервис расширил зону экспресс-доставки — проверьте свой адрес.', 'Вчера, 18:40') +
      '<p class="web-foot">Lackuun · 2026</p></div>';
  }

  function webCatsPage() {
    return '<div class="web-page-head"><button class="web-back" type="button" onclick="Web.back()"><i class="fa-solid fa-chevron-left"></i></button>' +
      '<h3>Категории</h3></div>' +
      '<div class="web-ad-slot">' + webAd('strip', 1) + '</div>' +
      WEB_CATS.map(function (c) {
        return '<div class="web-h">' + c.name + '</div>' + webSitesIn(c.id).map(webSiteCard).join('');
      }).join('');
  }

  function webCatPage(id) {
    var c = webCat(id);
    if (!c) return webNotFound('категория');
    return '<div class="web-page-head"><button class="web-back" type="button" onclick="Web.back()"><i class="fa-solid fa-chevron-left"></i></button>' +
      '<h3>' + c.name + '</h3></div><p class="web-muted">' + webSitesIn(id).length + ' сайтов в категории</p>' +
      webSitesIn(id).map(webSiteCard).join('');
  }

  function webStrip(html) {
    return String(html || '').replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  }
  function webSiteIndex(s) {
    if (s.__idx) return s.__idx;
    var parts = [s.name, s.host, s.slogan || '', (webCat(s.cat) || {}).name || ''];
    var secs = [];
    (s.nav || []).forEach(function (n) { secs.push({ page: n[0], title: n[1], text: n[1] }); });
    Object.keys(s.pages || {}).forEach(function (k) {
      if (k === 'index') return;
      var title = k;
      (s.nav || []).some(function (n) { if (n[0] === k) { title = n[1]; return true; } return false; });
      var txt = '';
      try { txt = webStrip(s.pages[k]() || ''); } catch (e) { txt = ''; }
      secs.push({ page: k, title: title, text: txt });
    });
    s.__idx = (parts.join(' ') + ' ' + secs.map(function (x) { return x.text; }).join(' ')).toLowerCase();
    s.__secs = secs;
    return s.__idx;
  }
  function webHighlight(text, q) {
    var t = LV.esc(text), qq = String(q || '').trim();
    if (!qq) return t;
    var re = new RegExp('(' + qq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
    return t.replace(re, '<mark>$1</mark>');
  }
  function webStem(w) {
    if (w.length < 5) return w;
    return w.replace(/(ами|ями|ого|его|ому|ему|ыми|ими|ая|яя|ое|ее|ые|ие|ов|ев|ам|ям|ах|ях|ой|ей|ую|юю|ом|ем|ы|и|а|я|о|е|у|ю|ь)$/, '') || w;
  }
  function webScoreSite(s, words) {
    var name = s.name.toLowerCase(), host = s.host.toLowerCase();
    var slog = (s.slogan || '').toLowerCase(), idx = webSiteIndex(s);
    var score = 0;
    for (var i = 0; i < words.length; i++) {
      var w = words[i], stem = webStem(w), part = 0;
      if (name === w || name.indexOf(w) === 0) part = 60;
      else if (name.indexOf(w) >= 0) part = 35;
      else if (name.indexOf(stem) >= 0) part = 30;
      else if (host.indexOf(w) >= 0) part = 22;
      else if (slog.indexOf(w) >= 0 || slog.indexOf(stem) >= 0) part = 15;
      else if (idx.indexOf(w) >= 0) part = 8;
      else if (idx.indexOf(stem) >= 0) part = 6;
      if (!part) return 0;
      score += part;
    }
    return score;
  }
  function webMatchNote(s, query) {
    var qq = query.toLowerCase(), stem = webStem(qq);
    var secs = s.__secs || [];
    for (var i = 0; i < secs.length; i++) {
      var t = secs[i].text.toLowerCase();
      if (t.indexOf(qq) >= 0 || t.indexOf(stem) >= 0) return 'нашлось в разделе «' + secs[i].title + '»';
    }
    return '';
  }

  function webSearchPage(q) {
    var query = String(q || '').toLowerCase().replace(/\s+/g, ' ').trim();
    var words = query.split(' ').filter(Boolean);
    var found = words.length ? WEB_SITES.map(function (s) {
      return { s: s, sc: webScoreSite(s, words) };
    }).filter(function (x) { return x.sc > 0 && !x.s.hidden; }).sort(function (a, b) {
      return b.sc - a.sc || a.s.name.localeCompare(b.s.name);
    }) : [];
    var letters = [['L', '#4285F4'], ['a', '#EA4335'], ['c', '#FBBC05'], ['k', '#4285F4'], ['u', '#34A853'], ['u', '#EA4335'], ['n', '#4285F4']];
    var logo = '<div class="web-g-logo small">' + letters.map(function (l) { return '<span style="color:' + l[1] + '">' + l[0] + '</span>'; }).join('') + '<em>.com</em></div>';
    var head = '<div class="web-res-head">' + logo +
      '<div class="web-gsearch"><i class="fa-solid fa-magnifying-glass"></i>' +
      '<input id="web-res-search" value="' + LV.esc(q || '') + '" onkeydown="if(event.key===\'Enter\')Web.searchFromResults()">' +
      '<button type="button" onclick="Web.searchFromResults()" aria-label="Найти"><i class="fa-solid fa-magnifying-glass"></i></button></div></div>';
    if (!found.length) {
      return head + '<div class="web-404"><i class="fa-solid fa-magnifying-glass"></i><h3>Ничего не найдено</h3><p>По запросу «' + LV.esc(q) + '» сайтов нет. Попробуйте другое слово или откройте категорию.</p>' +
        '<button class="btn btn-primary" type="button" onclick="Web.home()">На стартовую</button></div>' +
        '<div class="web-h">Популярное</div>' + ['lavka', 'pulse', 'edok', 'bankfake'].map(function (id) { return webSiteCard(webSite(id)); }).join('');
    }
    return head + '<p class="web-res-count">Найдено ' + found.length + ' · запрос «' + LV.esc(q) + '»</p>' +
      '<div class="web-ad-slot">' + webAd('text', 0) + '</div>' +
      found.map(function (x) {
        var s = x.s, cat = webCat(s.cat);
        var note = webMatchNote(s, query);
        return '<button class="web-res-item" type="button" onclick="Web.open(\'' + s.id + '\')">' +
          '<span class="web-site-ic small" style="background:' + s.color + '">' + siteLogoHTML(s) + '</span>' +
          '<span class="web-res-main">' +
          '<span class="web-res-host">' + LV.esc(s.host) + (cat ? ' · ' + LV.esc(cat.name) : '') + '</span>' +
          '<b>' + webHighlight(s.name, q) + '</b>' +
          '<span class="web-res-text">' + LV.esc(s.slogan) + (note ? ' · ' + note : '') + '</span>' +
          '</span></button>';
      }).join('');
  }

  function webNotFound(q) {
    return '<div class="web-404"><i class="fa-solid fa-plug-circle-xmark"></i><h3>Страница не найдена</h3>' +
      '<p>Не удалось открыть «' + LV.esc(q || '') + '». Проверьте адрес или выберите сайт из каталога.</p>' +
      '<button class="btn btn-primary" type="button" onclick="Web.home()">На стартовую</button></div>' +
      '<div style="padding:0 14px"><div class="web-h">Может быть, это</div>' +
      ['pulse', 'lavka', 'torg'].map(function (id) { return webSiteCard(webSite(id)); }).join('') + '</div>';
  }

  function webSiteHTML(site, page) {
    if (!page || !site.pages[page]) {
      page = site.pages.index ? 'index' : (site.nav && site.nav[0] ? site.nav[0][0] : Object.keys(site.pages)[0]);
    }
    var fn = site.pages[page];
    if (site.custom) {
      var inner = fn();
      if (typeof site.chrome === 'function') inner = site.chrome(inner, page || 'index');
      var hasAd = inner.indexOf('web-ad') >= 0;
      var customAd = hasAd ? '' : '<div class="web-ad-slot">' + webAdForSite(site, page) + '</div>';
      return '<div class="web-site web-site-custom">' + inner + customAd + '</div>';
    }
    var nav = site.nav.map(function (n) {
      return '<button class="web-snav' + (n[0] === page ? ' on' : '') + '" type="button" onclick="Web.sitePage(\'' + site.id + '\',\'' + n[0] + '\')">' + n[1] + '</button>';
    }).join('');
    return '<div class="web-site">' +
      '<div class="web-site-head" style="background:' + site.color + '">' +
      '<div class="web-site-brand"><span class="web-site-logo">' + siteLogoHTML(site) + '</span>' +
      '<div><b>' + LV.esc(site.name) + '</b><span>' + LV.esc(site.host) + '</span></div></div>' +
      '<p>' + LV.esc(site.slogan) + '</p></div>' +
      '<div class="web-site-nav">' + nav + '</div>' +
      '<div class="web-ad-slot">' + webAdForSite(site, page) + '</div>' +
      '<div class="web-site-body">' + fn() + '</div>' +
      '<div class="web-site-foot">' + LV.esc(site.name) + ' · ' + LV.esc(site.host) + '</div></div>';
  }

  function webFavsPage() {
    var favs = (S.webFav || []).map(webSite).filter(function (s) { return s && !s.hidden; });
    return '<div class="web-page-head"><button class="web-back" type="button" onclick="Web.back()"><i class="fa-solid fa-chevron-left"></i></button>' +
      '<h3>Закладки</h3></div>' +
      (favs.length ? favs.map(webSiteCard).join('') : '<p class="web-muted" style="padding:0 14px">Пока пусто. Откройте сайт и нажмите звезду в адресной строке.</p>');
  }

  function webContent(e) {
    if (e.kind === 'start') return webStart();
    if (e.kind === 'cats') return webCatsPage();
    if (e.kind === 'cat') return webCatPage(e.cat);
    if (e.kind === 'search') return webSearchPage(e.q);
    if (e.kind === 'favs') return webFavsPage();
    if (e.kind === 'site') {
      var s = webSite(e.site);
      if (!s) return webNotFound(e.site);
      return webSiteHTML(s, e.page || 'index');
    }
    return webStart();
  }

  function webTabTitle(t) {
    if (!t) return 'Lackuun';
    var e = t.history[t.index] || { kind: 'start' };
    if (e.kind === 'start') return 'Lackuun';
    if (e.kind === 'search') return e.q ? 'Поиск: ' + e.q : 'Поиск';
    if (e.kind === 'cats') return 'Категории';
    if (e.kind === 'cat') { var c = webCat(e.cat); return c ? c.name : 'Категория'; }
    if (e.kind === 'favs') return 'Закладки';
    if (e.kind === 'site') { var s = webSite(e.site); return s ? s.name : 'Сайт'; }
    return 'Lackuun';
  }
  function webTabHost(t) {
    if (!t) return 'lackuun.com';
    var e = t.history[t.index] || { kind: 'start' };
    if (e.kind === 'site') { var s = webSite(e.site); return s ? s.host : 'lackuun.com'; }
    return 'lackuun.com';
  }
  function webTabIcon(t) {
    if (!t) return 'fa-globe';
    var e = t.history[t.index] || { kind: 'start' };
    if (e.kind === 'site') { var s = webSite(e.site); return s ? s.icon : 'fa-globe'; }
    if (e.kind === 'search') return 'fa-magnifying-glass';
    if (e.kind === 'cats' || e.kind === 'cat') return 'fa-border-all';
    if (e.kind === 'favs') return 'fa-star';
    return 'fa-globe';
  }
  function webTabColor(t) {
    var e = t ? (t.history[t.index] || {}) : {};
    var s = e.kind === 'site' ? webSite(e.site) : null;
    return s ? s.color : '#4285F4';
  }

  function webTopHTML() {
    var t = webTab();
    var e = webEntry();
    return '<div class="web-top"><div class="web-controls">' +
      '<button class="web-navbtn web-exit" type="button" data-back aria-label="Закрыть браузер"><i class="fa-solid fa-xmark"></i></button>' +
      '<button class="web-navbtn" type="button" onclick="Web.back()" ' + (!t || t.index <= 0 ? 'disabled' : '') + ' aria-label="Назад"><i class="fa-solid fa-chevron-left"></i></button>' +
      '<button class="web-navbtn" type="button" onclick="Web.forward()" ' + (!t || t.index >= t.history.length - 1 ? 'disabled' : '') + ' aria-label="Вперёд"><i class="fa-solid fa-chevron-right"></i></button>' +
      '<div class="web-url"><i class="fa-solid fa-lock"></i><input id="web-url" value="' + LV.esc(webAddress(e)) + '" onkeydown="if(event.key===\'Enter\')Web.go()" aria-label="Адрес сайта" spellcheck="false"></div>' +
      '<button class="web-navbtn" type="button" onclick="Web.refresh()" aria-label="Обновить"><i class="fa-solid fa-rotate"></i></button>' +
      '<button class="web-navbtn web-tabcount" type="button" onclick="Web.showTabs()" aria-label="Вкладки"><i class="fa-regular fa-square"></i><b>' + webTabs.length + '</b></button>' +
      '</div></div>';
  }

  function webBottomHTML() {
    var e = webEntry();
    var active = webTabsOpen ? 'tabs'
      : (e.kind === 'start' || e.kind === 'search') ? 'home'
        : (e.kind === 'cats' || e.kind === 'cat') ? 'cats'
          : e.kind === 'favs' ? 'favs' : '';
    var tabs = [
      ['home', 'Поиск', 'fa-magnifying-glass', 'Web.home()', 0],
      ['cats', 'Категории', 'fa-border-all', 'Web.cats()', 0],
      ['tabs', 'Вкладки', 'fa-clone', 'Web.showTabs()', webTabs.length],
      ['favs', 'Закладки', 'fa-star', 'Web.favs()', 0],
      ['menu', 'Меню', 'fa-ellipsis', 'Web.menu()', 0]
    ];
    return '<div class="web-bottom">' + tabs.map(function (t) {
      return '<button class="web-bbtn' + (active === t[0] ? ' on' : '') + '" type="button" onclick="' + t[3] + '">' +
        '<span class="web-bbtn-ic"><i class="fa-' + (t[0] === 'favs' && active !== 'favs' ? 'regular' : 'solid') + ' ' + t[2] + '"></i>' +
        (t[4] ? '<em>' + t[4] + '</em>' : '') + '</span><span>' + t[1] + '</span></button>';
    }).join('') + '</div>';
  }

  function webTabsOverlay() {
    var cards = webTabs.map(function (t, i) {
      var color = webTabColor(t);
      return '<div class="web-tab-card' + (i === webActive ? ' on' : '') + '">' +
        '<button class="web-tab-main" type="button" onclick="Web.switchTab(' + i + ')">' +
        '<span class="web-tab-thumb" style="background:linear-gradient(155deg,' + color + ',#0f172a)"><i class="fa-solid ' + webTabIcon(t) + '"></i><em>' + LV.esc(webTabHost(t)) + '</em></span>' +
        '<b>' + LV.esc(webTabTitle(t)) + '</b><small>' + LV.esc(webTabHost(t)) + '</small>' +
        '</button>' +
        '<button class="web-tab-x" type="button" onclick="Web.closeTab(' + i + ')" aria-label="Закрыть вкладку"><i class="fa-solid fa-xmark"></i></button>' +
        '</div>';
    }).join('');
    return '<div class="web-tabs-ov">' +
      '<div class="web-tabs-top"><h3>Вкладки <span>' + webTabs.length + '</span></h3>' +
      '<button class="web-navbtn" type="button" onclick="Web.hideTabs()" aria-label="Закрыть"><i class="fa-solid fa-xmark"></i></button></div>' +
      '<div class="web-tabs-scroll">' +
      '<button class="web-newtab" type="button" onclick="Web.newTab()"><i class="fa-solid fa-plus"></i> Новая вкладка</button>' +
      '<div class="web-tab-grid">' + cards + '</div>' +
      '<p class="web-muted center" style="margin:14px 0">У каждой вкладки своя история переходов</p>' +
      '</div></div>';
  }

  function webRender() {
    if (!webBody) return;
    var t = webTab();
    var old = document.getElementById('web-scroll');
    if (old && t && !webScrollReset) t.scroll = old.scrollTop;
    webScrollReset = false;
    webBody.innerHTML = webTopHTML() +
      '<div class="web-scroll" id="web-scroll">' + webContent(webEntry()) + '</div>' +
      webBottomHTML() + (webTabsOpen ? webTabsOverlay() : '');
    var ns = document.getElementById('web-scroll');
    if (ns && t) ns.scrollTop = t.scroll || 0;
  }

  LV.registerApp({
    id: 'browser', name: 'Браузер', icon: 'fa-globe', bg: 'linear-gradient(140deg,#38bdf8,#0284c7)',
    page: 1, desc: 'Lackuun.com: поиск, сайты, вкладки и категории',
    mount: function (body) {
      webBody = body;
      webTabsReset();
      webScrollReset = true;
      webRender();
      return function () { webBody = null; };
    }
  });

  window.Web = {
    sites: WEB_SITES,
    categories: WEB_CATS,
    ad: webAd,
    open: function (id, page) {
      var st = webSite(id);
      if (!st || st.hidden) { webPush({ kind: 'search', q: id }); return; }
      webPush({ kind: 'site', site: id, page: page || 'index' });
    },
    sitePage: function (id, page) {
      webPush({ kind: 'site', site: id, page: page || 'index' });
    },
    cat: function (id) { webPush({ kind: 'cat', cat: id }); },
    favs: function () { webPush({ kind: 'favs' }); },
    searchFromResults: function (arg) {
      var i = document.getElementById('web-res-search');
      var q = (typeof arg === 'string' && arg.trim()) ? arg.trim() : (i ? i.value.trim() : '');
      if (q) webPush({ kind: 'search', q: q });
    },
    cats: function () { webPush({ kind: 'cats' }); },
    home: function () { webPush({ kind: 'start' }); },
    back: function () {
      var t = webTab();
      if (!t || t.index <= 0) return;
      t.index--;
      t.scroll = 0;
      webScrollReset = true;
      webRender();
    },
    forward: function () {
      var t = webTab();
      if (!t || t.index >= t.history.length - 1) return;
      t.index++;
      t.scroll = 0;
      webScrollReset = true;
      webRender();
    },
    showTabs: function () {
      webTabsOpen = true;
      webRender();
    },
    hideTabs: function () {
      webTabsOpen = false;
      webRender();
    },
    newTab: function () {
      var old = document.getElementById('web-scroll');
      var cur = webTab();
      if (old && cur) cur.scroll = old.scrollTop;
      webTabs.push(webNewTabState({ kind: 'start' }));
      webActive = webTabs.length - 1;
      webTabsOpen = false;
      webScrollReset = true;
      webRender();
      setTimeout(function () {
        var i = document.getElementById('web-search');
        if (i) i.focus();
      }, 60);
    },
    switchTab: function (i) {
      if (i < 0 || i >= webTabs.length) return;
      if (i === webActive) { webTabsOpen = false; webRender(); return; }
      var old = document.getElementById('web-scroll');
      var cur = webTab();
      if (old && cur) cur.scroll = old.scrollTop;
      webActive = i;
      webTabsOpen = false;
      webScrollReset = true;
      webRender();
    },
    closeTab: function (i) {
      if (i < 0 || i >= webTabs.length) return;
      if (webTabs.length <= 1) {
        webTabs[0] = webNewTabState({ kind: 'start' });
        webActive = 0;
        webTabsOpen = false;
        webScrollReset = true;
        webRender();
        return;
      }
      webTabs.splice(i, 1);
      if (webActive > i) webActive--;
      else if (webActive === i) webActive = Math.min(i, webTabs.length - 1);
      webScrollReset = true;
      webRender();
    },
    refresh: function () {
      webRender();
      LV.toast('Страница обновлена');
    },
    go: function () {
      var i = document.getElementById('web-url');
      var raw = i ? i.value.trim().toLowerCase() : '';
      if (!raw) return;
      raw = raw.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
      raw = raw.replace(/lavka\.net/g, 'lackuun.com');
      var parts = raw.split('/');
      var host = parts[0];
      var page = parts[1] || 'index';
      if (host === 'lackuun.com' || host === 'lackuun') {
        if (page === 'c' && parts[2]) { webPush({ kind: 'cat', cat: parts[2] }); return; }
        if (page === 'categories') { webPush({ kind: 'cats' }); return; }
        if (page === 'bookmarks') { webPush({ kind: 'favs' }); return; }
        if (page === 'search' && parts[2]) { webPush({ kind: 'search', q: parts.slice(2).join('/') }); return; }
        webPush({ kind: 'start' });
        return;
      }
      var site = WEB_SITES.filter(function (s) { return s.host === host || s.id === host; })[0];
      if (site && !site.hidden) {
        webPush({ kind: 'site', site: site.id, page: site.pages[page] ? page : 'index' });
        return;
      }
      webPush({ kind: 'search', q: raw });
    },
    search: function (arg) {
      var i = document.getElementById('web-search');
      var q = (typeof arg === 'string' && arg.trim()) ? arg.trim() : (i ? i.value.trim() : '');
      if (!q) { LV.toast('Введите запрос'); return; }
      webPush({ kind: 'search', q: q });
    },
    searchFromAddress: function () {
      var i = document.getElementById('web-url');
      var q = i ? i.value.trim() : '';
      if (q) webPush({ kind: 'search', q: q });
    },
    chip: function (el) {
      var p = el.parentNode;
      if (!p) return;
      p.querySelectorAll('.web-chip').forEach(function (b) { b.classList.remove('on'); });
      el.classList.add('on');
    },
    like: function (btn) {
      var id = btn.getAttribute('data-like');
      var on = !webLikes[id];
      webLikes[id] = on;
      btn.classList.toggle('on', on);
      var n = btn.querySelector('b');
      if (n) n.textContent = String(Math.max(0, Number(n.textContent) + (on ? 1 : -1)));
    },
    follow: function (btn, id) {
      webFollows[id] = !webFollows[id];
      btn.classList.toggle('on', !!webFollows[id]);
      btn.textContent = webFollows[id] ? 'Вы подписаны' : 'Подписаться';
    },
    bookmark: function () {
      var e = webEntry();
      if (e.kind !== 'site') { LV.toast('Откройте сайт, чтобы добавить в закладки'); return; }
      if (!S.webFav) S.webFav = [];
      var i = S.webFav.indexOf(e.site);
      if (i >= 0) { S.webFav.splice(i, 1); LV.toast('Удалено из закладок'); }
      else { S.webFav.push(e.site); LV.toast('Сайт добавлен в закладки'); }
      LV.save();
      webRender();
    },
    toApp: function (id) {
      LV.openApp(id);
    },
    menu: function () {
      sheet('<div class="sheet-grab"></div><h3>Lackuun</h3><p class="sub">Поиск, сайты и сервисы города</p>' +
        '<button class="btn btn-block" type="button" onclick="Web.closeMenu();Web.newTab()"><i class="fa-solid fa-plus"></i> Новая вкладка</button>' +
        '<button class="btn btn-block" style="margin-top:8px" type="button" onclick="Web.closeMenu();Web.showTabs()"><i class="fa-solid fa-clone"></i> Все вкладки · ' + webTabs.length + '</button>' +
        '<button class="btn btn-block" style="margin-top:8px" type="button" onclick="Web.closeMenu();Web.cats()"><i class="fa-solid fa-border-all"></i> Все категории</button>' +
        '<button class="btn btn-block" style="margin-top:8px" type="button" onclick="Web.closeMenu();Web.clearHistory()"><i class="fa-solid fa-broom"></i> Очистить историю вкладки</button>' +
        '<p class="center tiny muted" style="margin:14px 0 4px">Lackuun · 2026</p>');
    },
    closeMenu: function () { closeSheet(); },
    clearHistory: function () {
      var t = webTab();
      if (t) { t.history = [{ kind: 'start' }]; t.index = 0; t.scroll = 0; }
      webTabsOpen = false;
      webScrollReset = true;
      webRender();
      LV.toast('История вкладки очищена');
    }
  };

  // =====================================================
  // ЗАГЛУШКИ
  // =====================================================
  function stubApp(cfg) {
    return {
      id: cfg.id, name: cfg.name, icon: cfg.icon, bg: cfg.bg, page: cfg.page,
      installable: !!cfg.installable, desc: cfg.desc,
      mount: function (body) {
        body.innerHTML = LV.appbar({ title: cfg.name, right: '<span class="pill">скоро</span>' }) +
          '<div class="app-scroll flush"><div class="stub">' +
          '<div class="stub-ic" style="background:' + cfg.bg + '"><i class="fa-solid ' + cfg.icon + '"></i></div>' +
          '<div class="pill green"><i class="fa-solid fa-wand-magic-sparkles"></i> В разработке</div>' +
          '<h3>' + cfg.name + '</h3>' +
          '<p>' + cfg.desc + '</p>' +
          '<button class="btn btn-primary" type="button" onclick="LV.toast(\'Мы сообщим о запуске\')">Сообщить о запуске</button>' +
          '<button class="btn btn-block" style="margin-top:8px" type="button" data-back>Вернуться</button>' +
          '</div></div>';
      }
    };
  }

  // ===== Lavka Online — будущий онлайн-город =====
  LV.registerApp({
    id: 'online', name: 'Lavka Online', icon: 'fa-globe', bg: 'linear-gradient(150deg,#10b981,#0b1220)',
    img: 'img/lavka-online-192.png',
    page: 0,
    mount: function (body) {
      var joined = !!(LV.state.onlineWait);
      var steps = [
        ['Общий город', 'другие игроки ходят по той же карте', 'в коде'],
        ['Совместные смены', 'работаете вдвоём и делите выручку', 'прототип'],
        ['Гонки и ограбления', 'дерзко, но по правилам города', 'идея'],
        ['Твоя сеть напоказ', 'другие видят точки, уровень и рейтинг', 'план']
      ].map(function (s) {
        return '<div class="onl-step"><div><b>' + s[0] + '</b><small>' + s[1] + '</small></div><i>' + s[2] + '</i></div>';
      }).join('');
      body.innerHTML = LV.appbar({ title: 'Lavka Online', sub: 'онлайн-город · скоро' }) +
        '<div class="app-scroll pb onl-body">' +
        '<div class="onl-hero"><span class="onl-chip">В РАЗРАБОТКЕ</span>' +
        '<div class="onl-brand"><img src="img/lavka-online-512.png" alt=""><div class="onl-logo">LAVKA<b>ONLINE</b></div></div>' +
        '<p class="onl-tag">Город, где играют все. Общий онлайн-мир поверх твоей сети.</p></div>' +
        '<div class="onl-head">Что будет внутри</div>' +
        '<div class="onl-road">' + steps + '</div>' +
        '<button class="onl-join' + (joined ? ' on' : '') + '" type="button" onclick="Online.join()">' +
        (joined ? 'Вы в листе ожидания' : 'Записаться в бету') + '</button>' +
        '<p class="onl-note">Выход — декабрь 2026. Запись в бету откроется раньше — сайт online.lavka в браузере.</p>' +
        '</div>';
    }
  });

  window.Online = {
    join: function () {
      var S = LV.state;
      if (S.onlineWait) { LV.toast('Вы уже в листе ожидания'); return; }
      S.onlineWait = true;
      try { LV.save(); } catch (e) {}
      if (window.Sfx) Sfx.play('reward');
      LV.toast('Вы в листе ожидания Lavka Online');
      LV.openApp('online');
    }
  };
})();