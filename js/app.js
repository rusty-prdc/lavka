/* Лавка — ядро: состояние, домашний экран, приложения, обучение */
(function () {
  'use strict';

  var LS_KEY = 'lavka_state_v1';

  var DEFAULTS = {
    v: 1,
    user: { name: '', xid: '', joined: '', tg: '', email: '' },
    tutorial: true,
    theme: 'light',
    cart: {},
    fav: [],
    orders: [],
    notes: [
      { id: 1, title: 'Список покупок', text: 'Кофе в зёрнах\nСыр\nОливковое масло\nПеченье к чаю', date: '2026-11-16' }
    ],
    settings: { notify: true, sound: true, saver: false },
    balance: 24800,
    page: 0,
    webFav: ['lavka', 'bankfake'],
    removed: ['voice', 'translate', 'podcasts', 'games', 'remote']
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  var state;
  try {
    var raw = localStorage.getItem(LS_KEY);
    state = raw ? JSON.parse(raw) : clone(DEFAULTS);
    if (!state || typeof state !== 'object') state = clone(DEFAULTS);
  } catch (e) { state = clone(DEFAULTS); }
  // мягкое слияние дефолтов
  (function merge(base, tgt) {
    Object.keys(base).forEach(function (k) {
      if (tgt[k] === undefined) tgt[k] = clone(base[k]);
      else if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) && typeof tgt[k] === 'object') merge(base[k], tgt[k]);
    });
  })(DEFAULTS, state);

  // XPRODC ID един: сессия BankFake из localStorage или общего cookie (cookie общий для портов)
  function readCookie(name) {
    try {
      var m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()[\]\\\/+^]/g, '\\$&') + '=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : '';
    } catch (e) { return ''; }
  }
  function readXidSession() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem('xid_session') || 'null'); } catch (e) {}
    if (!s || !s.xid) {
      try { var c = readCookie('xprodc_session'); if (c) s = JSON.parse(c); } catch (e) {}
    }
    if (!s || typeof s.xid !== 'string' || !/^X-\d+$/i.test(s.xid)) return null;
    return s;
  }

  // ---------- XPRODC ID: настоящий аккаунт, общий с BankFake ----------
  var XID_BASES = ['https://xprodc.site/id', 'http://de-bots3.h1cloud.net:25292/id'];
  var XID_GAME = 'bankfake';
  var xidBase = '';

  function xidLsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function xidLsGet(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }

  function xidSessionSave(sess) { xidLsSet('xid_session', sess); }
  function xidSessionClear() { try { localStorage.removeItem('xid_session'); } catch (e) {} }

  async function xidPickBase() {
    var cached = xidLsGet('xid_base', '');
    if (cached) { xidBase = cached; return cached; }
    for (var i = 0; i < XID_BASES.length; i++) {
      try {
        var r = await fetch(XID_BASES[i] + '/health');
        if (r.ok) { xidBase = XID_BASES[i]; xidLsSet('xid_base', xidBase); return xidBase; }
      } catch (e) {}
    }
    xidBase = XID_BASES[0];
    return xidBase;
  }

  async function xidRefreshSession(sess) {
    if (!sess || !sess.refresh) return false;
    if (!xidBase) await xidPickBase();
    try {
      var r = await fetch(xidBase + '/auth/refresh', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: sess.refresh })
      });
      if (!r.ok) return false;
      var t = await r.json();
      var next = {
        access: t.access_token, refresh: t.refresh_token,
        exp: Date.now() + (Number(t.expires_in) || 900) * 1000,
        xid: t.xid, username: t.username, isAdmin: !!t.is_admin
      };
      xidSessionSave(next);
      return next;
    } catch (e) { return false; }
  }

  async function xidApi(path, opts, noRetry) {
    if (!xidBase) await xidPickBase();
    opts = opts || {};
    var sess = readXidSession();
    if (sess && sess.exp && sess.exp - 60000 < Date.now()) {
      var refreshed = await xidRefreshSession(sess);
      if (refreshed) sess = refreshed;
    }
    var headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    if (sess && sess.access) headers.Authorization = 'Bearer ' + sess.access;
    var r = await fetch(xidBase + path, Object.assign({}, opts, { headers: headers }));
    if (r.status === 401 && !noRetry && sess && sess.refresh) {
      var again = await xidRefreshSession(sess);
      if (again) return xidApi(path, opts, true);
    }
    return r;
  }

  async function xidReplyError(r) {
    var d = null;
    try { d = await r.json(); } catch (e) {}
    var msg = d && d.detail;
    if (Array.isArray(msg)) msg = msg.map(function (x) { return x.msg || ''; }).filter(Boolean).join(', ') || 'Проверьте данные';
    return msg || ('Ошибка ' + r.status);
  }

  function xidApplyMe(me) {
    state.user.xid = me.xid || state.user.xid;
    state.user.name = me.username || state.user.name;
    state.user.email = me.email || '';
    state.user.tg = me.tg_username ? '@' + String(me.tg_username).replace(/^@+/, '') : '';
    state.user.joined = me.created_at ? String(me.created_at).slice(0, 10) : (state.user.joined || '');
    state.user.bankLinked = true;
    save();
  }

  async function xidMe() {
    var r = await xidApi('/me');
    if (!r.ok) {
      var err = new Error(await xidReplyError(r));
      err.status = r.status;
      throw err;
    }
    return r.json();
  }

  async function xidLogin(login, password) {
    if (!xidBase) await xidPickBase();
    var r = await fetch(xidBase + '/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: login, password: password })
    });
    if (!r.ok) throw new Error(await xidReplyError(r));
    var t = await r.json();
    xidSessionSave({
      access: t.access_token, refresh: t.refresh_token,
      exp: Date.now() + (Number(t.expires_in) || 900) * 1000,
      xid: t.xid, username: t.username, isAdmin: !!t.is_admin
    });
    var me = await xidMe();
    xidApplyMe(me);
    updateHomeUser();
    try { await bankReload(); } catch (e) {}
    return me;
  }

  async function xidRegister(username, email, password) {
    if (!xidBase) await xidPickBase();
    var r = await fetch(xidBase + '/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username, email: email, password: password })
    });
    if (!r.ok) throw new Error(await xidReplyError(r));
    var t = await r.json();
    xidSessionSave({
      access: t.access_token, refresh: t.refresh_token,
      exp: Date.now() + (Number(t.expires_in) || 900) * 1000,
      xid: t.xid, username: t.username, isAdmin: !!t.is_admin
    });
    var me = await xidMe();
    xidApplyMe(me);
    updateHomeUser();
    try { await bankReload(); } catch (e) {}
    return me;
  }

  async function xidLogout() {
    var sess = readXidSession();
    if (sess && sess.refresh) {
      try {
        await xidApi('/auth/logout', {
          method: 'POST', body: JSON.stringify({ refresh_token: sess.refresh })
        });
      } catch (e) {}
    }
    xidSessionClear();
    state.user.name = '';
    state.user.xid = '';
    state.user.email = '';
    state.user.tg = '';
    state.user.joined = '';
    state.user.bankLinked = false;
    state.balance = DEFAULTS.balance;
    save();
    updateHomeUser();
  }

  function xidGuest() {
    state.user.name = '';
    state.user.xid = '';
    state.user.email = '';
    state.user.tg = '';
    state.user.joined = '';
    state.user.bankLinked = false;
    bankRaw = null;
    bankBalance = 0;
    bankCards = [];
    bankSource = '';
    bankVersion = 0;
    state.balance = DEFAULTS.balance;
    try { save(); } catch (e) {}
    updateHomeUser();
  }

  async function xidBoot() {
    var sess = readXidSession();
    if (!sess) { xidGuest(); return; }
    var s = sess;
    if (!s.access || (s.exp && s.exp - 60000 < Date.now())) {
      s = await xidRefreshSession(sess);
      if (!s) {
        xidSessionClear();
        xidGuest();
        return;
      }
    }
    try {
      var me = await xidMe();
      xidApplyMe(me);
    } catch (e) {
      if (e && e.status === 401) {
        xidSessionClear();
        xidGuest();
        return;
      }
    }
    updateHomeUser();
    try { await bankReload(); } catch (e) {}
    updateHomeUser();
  }

  // ---------- BankFake: единый счёт, карты и оплата ----------
  var bankRaw = null;
  var bankBalance = 0;
  var bankCards = [];
  var bankPaymentCardId = 'balance';
  var bankSource = '';
  var bankVersion = 0;

  function bankApply(st, source, version) {
    if (!st || typeof st !== 'object') return false;
    bankRaw = st;
    bankBalance = Number(st.balance) || 0;
    bankCards = Array.isArray(st.cards) ? st.cards : [];
    bankPaymentCardId = st.paymentCardId || 'balance';
    bankSource = source || '';
    if (version) bankVersion = version;
    state.balance = bankBalance;
    try { save(); } catch (e) {}
    return true;
  }
  function bankLoadLocal() {
    try {
      var raw = localStorage.getItem('bankfake_pro_v3');
      if (!raw) return false;
      return bankApply(JSON.parse(raw), 'local');
    } catch (e) { return false; }
  }
  function bankCardLast4(c) {
    var n = String((c && (c.number || c.fullNumber || c.last4)) || '').replace(/\D/g, '');
    return n.slice(-4) || '0000';
  }
  function bankCardLabel(c) {
    return (c && c.type ? c.type : 'Карта') + ' •••• ' + bankCardLast4(c);
  }
  function bankDebit(st, amount, target) {
    amount = Math.max(0, Number(amount) || 0);
    var label = '';
    if (!target || target === 'balance') {
      if (Number(st.balance || 0) < amount) return { ok: false, reason: 'funds' };
      st.balance = +(Number(st.balance || 0) - amount).toFixed(2);
      label = 'Основной счёт BankFake';
    } else {
      var card = (st.cards || []).filter(function (c) { return String(c.id) === String(target); })[0];
      if (!card) return { ok: false, reason: 'card' };
      if (card.blocked) return { ok: false, reason: 'blocked' };
      if (!card.isGold && Number(card.balance || 0) < amount) return { ok: false, reason: 'funds' };
      if (!card.isGold) card.balance = +(Number(card.balance || 0) - amount).toFixed(2);
      label = bankCardLabel(card);
    }
    if (amount > 0) {
      if (!Array.isArray(st.history)) st.history = [];
      st.history.unshift({
        type: 'expense', title: 'Лавка', amount: amount,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ts: Date.now(), cat: 'ТЦ'
      });
    }
    return { ok: true, label: label };
  }

  async function bankLoadCloud() {
    if (!readXidSession()) return false;
    try {
      var r = await xidApi('/sync?game_id=' + XID_GAME + '&key=state');
      if (!r.ok) return false;
      var d = await r.json();
      if (!d.found || !d.value) return false;
      return bankApply(JSON.parse(d.value), 'cloud', d.version || 0);
    } catch (e) { return false; }
  }

  async function bankPayCloud(amount, target) {
    for (var attempt = 0; attempt < 3; attempt++) {
      var res = bankDebit(bankRaw, amount, target);
      if (!res.ok) return res;
      var r = await xidApi('/sync', {
        method: 'PUT',
        body: JSON.stringify({ game_id: XID_GAME, key: 'state', value: JSON.stringify(bankRaw), version: bankVersion })
      });
      if (r.ok) {
        var d = await r.json();
        bankApply(bankRaw, 'cloud', d.version || bankVersion);
        return { ok: true, label: res.label, balance: bankBalance };
      }
      if (r.status === 409) {
        var detail = null;
        try { var e = await r.json(); detail = (e && e.detail) || e; } catch (e2) {}
        if (detail && detail.server_value) {
          try {
            bankRaw = JSON.parse(detail.server_value);
            bankBalance = Number(bankRaw.balance) || 0;
            bankCards = Array.isArray(bankRaw.cards) ? bankRaw.cards : [];
            bankVersion = Number(detail.server_version) || bankVersion;
            continue;
          } catch (e3) {}
        }
        return { ok: false, reason: 'sync' };
      }
      return { ok: false, reason: 'sync' };
    }
    return { ok: false, reason: 'sync' };
  }

  async function bankPay(amount, target) {
    amount = Math.max(0, Number(amount) || 0);
    if (!bankRaw) return { ok: false, reason: 'not-linked' };
    if (bankSource === 'cloud') return bankPayCloud(amount, target);
    var res = bankDebit(bankRaw, amount, target);
    if (!res.ok) return res;
    try { localStorage.setItem('bankfake_pro_v3', JSON.stringify(bankRaw)); } catch (e) {}
    bankApply(bankRaw, 'local');
    if (window.XID && XID.pushBank) XID.pushBank();
    return { ok: true, label: res.label, balance: bankBalance };
  }

  async function bankReload() {
    var ok = await bankLoadCloud();
    if (!ok) ok = bankLoadLocal();
    return !!ok;
  }

  window.Bank = {
    get linked() { return !!bankRaw; },
    get balance() { return bankBalance; },
    get cards() { return bankCards; },
    get paymentCardId() { return bankPaymentCardId; },
    get source() { return bankSource; },
    get version() { return bankVersion; },
    get raw() { return bankRaw; },
    cardLabel: bankCardLabel,
    cardLast4: bankCardLast4,
    reload: bankReload,
    apply: bankApply,
    pay: bankPay
  };

  var APPS = [];
  var BY_ID = {};
  var currentApp = null;
  var cleanup = null;
  var phone, appview, appBody, toastEl, tutEl;

  // ---------- utils ----------
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fmt(n) {
    var v = Math.round(Number(n) || 0);
    return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + '\u00a0₽';
  }
  function fmtNum(n) { return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0'); }
  var MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  var MONTHS_S = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  var WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
  var WEEKDAYS_S = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

  function dateRu(iso) {
    var d = new Date(iso + 'T12:00:00');
    if (isNaN(d.getTime())) return iso || '';
    return d.getDate() + ' ' + MONTHS[d.getMonth()];
  }
  function dateFull(iso) {
    var d = new Date(iso + 'T12:00:00');
    if (isNaN(d.getTime())) return iso || '';
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function clockStr(d) {
    return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function initials(name) {
    var parts = String(name || '').replace(/[^\wа-яА-ЯёЁ\s-]/g, ' ').split(/[\s-]+/).filter(Boolean);
    var a = (parts[0] || 'Л')[0] || 'Л';
    var b = (parts[1] || '')[0] || '';
    return (a + b).toUpperCase();
  }
  function hexShade(hex, amt) {
    var n = parseInt(String(hex).replace('#', ''), 16);
    if (isNaN(n)) return hex;
    var r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
    var g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    var b = Math.max(0, Math.min(255, (n & 255) + amt));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  function hash(str) {
    var h = 0;
    for (var i = 0; i < String(str).length; i++) h = (h * 31 + String(str).charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  var artCache = {};
  function svgArt(color, label, seed, big) {
    var key = color + '|' + label + '|' + seed + '|' + (big ? 1 : 0);
    if (artCache[key]) return artCache[key];
    var c1 = color || '#10b981';
    var c2 = hexShade(c1, -48);
    var c3 = hexShade(c1, 55);
    var h = hash(String(label) + seed);
    var x = 200 + (h % 90);
    var y = 40 + ((h >> 3) % 80);
    var r = 80 + ((h >> 5) % 60);
    var x2 = 20 + ((h >> 7) % 90);
    var y2 = 210 + ((h >> 9) % 70);
    var r2 = 55 + ((h >> 11) % 50);
    var rot = (h % 40) - 20;
    var initialsTxt = label;
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">' +
      '<defs>' +
      '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(' + rot + ' .5 .5)">' +
      '<stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient>' +
      '</defs>' +
      '<rect width="300" height="300" fill="url(#g)"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + c3 + '" opacity=".34"/>' +
      '<circle cx="' + x2 + '" cy="' + y2 + '" r="' + r2 + '" fill="#000" opacity=".10"/>' +
      '<path d="M0 232 Q 75 196 150 232 T 300 232 L300 300 L0 300 Z" fill="#fff" opacity=".09"/>' +
      '<g opacity=".16" fill="#fff">' +
      '<circle cx="34" cy="48" r="3"/><circle cx="52" cy="48" r="3"/><circle cx="70" cy="48" r="3"/>' +
      '<circle cx="34" cy="66" r="3"/><circle cx="52" cy="66" r="3"/><circle cx="70" cy="66" r="3"/>' +
      '</g>' +
      '<text x="150" y="' + (big ? 180 : 182) + '" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="' + (big ? 104 : 92) + '" font-weight="800" fill="#fff" fill-opacity=".95" text-anchor="middle">' + esc(initialsTxt) + '</text>' +
      '<text x="150" y="' + (big ? 256 : 258) + '" font-family="Inter, Segoe UI, Arial, sans-serif" font-size="15" font-weight="600" letter-spacing="5" fill="#fff" fill-opacity=".6" text-anchor="middle">LAVKA</text>' +
      '</svg>';
    var uri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    artCache[key] = uri;
    return uri;
  }

  // ---------- state ----------
  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function cartCount() {
    return Object.keys(state.cart || {}).reduce(function (s, k) { return s + (Number(state.cart[k]) || 0); }, 0);
  }
  function isFav(id) { return (state.fav || []).indexOf(Number(id)) >= 0; }
  function toggleFav(id) {
    id = Number(id);
    var i = state.fav.indexOf(id);
    if (i >= 0) { state.fav.splice(i, 1); toast('Убрано из избранного'); }
    else { state.fav.push(id); toast('Добавлено в избранное'); }
    save();
  }

  // ---------- toast ----------
  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2100);
  }

  // ---------- apps ----------
  function registerApp(def) {
    if (!def || !def.id) return;
    if (BY_ID[def.id]) return;
    APPS.push(def);
    BY_ID[def.id] = def;
  }

  function appBadge(id) {
    if (id === 'market') {
      var n = cartCount();
      return n ? String(n) : '';
    }
    if (id === 'messages') return '2';
    if (id === 'mail' && window.BizUnreadSms) {
      var u = window.BizUnreadSms();
      return u ? String(u) : '';
    }
    if (id === 'store') {
      var avail = APPS.filter(function (a) { return a.installable && !isInstalled(a.id); }).length;
      return avail ? String(avail) : '';
    }
    return '';
  }

  function isInstalled(id) {
    return (state.removed || []).indexOf(id) < 0;
  }
  function installApp(id) {
    var i = (state.removed || []).indexOf(id);
    if (i >= 0) state.removed.splice(i, 1);
    save();
    renderApps();
  }
  function uninstallApp(id) {
    if (!state.removed) state.removed = [];
    if (state.removed.indexOf(id) < 0) state.removed.push(id);
    if (currentApp && currentApp.id === id) closeApp();
    save();
    renderApps();
  }

  function appHTML(a, inDock) {
    var badge = inDock ? '' : appBadge(a.id);
    if (a.id === 'market') badge = appBadge(a.id);
    return '<button class="app" type="button" data-app="' + a.id + '" aria-label="' + esc(a.name) + '">' +
      '<span class="app-ic" style="background:' + a.bg + '"><i class="fa-solid ' + a.icon + '"></i></span>' +
      (badge ? '<span class="app-badge">' + esc(badge) + '</span>' : '') +
      '<span class="app-name">' + esc(a.name) + '</span>' +
      '</button>';
  }

  function renderApps() {
    var pages = {};
    APPS.forEach(function (a) {
      if (a.page === null || a.page === undefined) return;
      if (!a.dock && !isInstalled(a.id)) return;
      var p = a.page || 0;
      (pages[p] = pages[p] || []).push(a);
    });
    var max = Math.max(0, Object.keys(pages).reduce(function (m, k) { return Math.max(m, Number(k)); }, 0));
    var pagesHTML = '';
    for (var i = 0; i <= max; i++) {
      var list = pages[i] || [];
      pagesHTML += '<div class="apps-page' + (list.length >= 12 ? ' dense' : '') + '">' + list.map(function (a) { return appHTML(a, false); }).join('') + '</div>';
    }
    var track = document.getElementById('apps-track');
    var dots = document.getElementById('home-dots');
    var dock = document.getElementById('dock');
    if (!track) return;
    track.innerHTML = pagesHTML;
    if (dots) {
      var dh = '';
      for (var d = 0; d <= max; d++) dh += '<button class="dot' + (d === state.page ? ' active' : '') + '" type="button" data-page="' + d + '" aria-label="Страница ' + (d + 1) + '"></button>';
      dots.innerHTML = dh;
    }
    if (dock) {
      dock.innerHTML = APPS.filter(function (a) { return a.dock; }).map(function (a) { return appHTML(a, true); }).join('');
    }
    setPage(state.page || 0, true);
  }

  var page = 0;
  function setPage(p, silent) {
    var track = document.getElementById('apps-track');
    if (!track) return;
    var total = track.children.length;
    if (!total) return;
    p = Math.max(0, Math.min(total - 1, p));
    page = p; state.page = p;
    track.style.transform = 'translateX(-' + (p * 100) + '%)';
    document.querySelectorAll('#home-dots .dot').forEach(function (dot, i) {
      dot.classList.toggle('active', i === p);
    });
    if (!silent) { save(); }
  }

  function updateHomeUser() {
    var n = state.user.name || 'Гость';
    var av = document.getElementById('home-avatar');
    var nm = document.getElementById('home-name');
    var xid = document.getElementById('home-xid');
    if (av) av.textContent = initials(n).slice(0, 1);
    if (nm) nm.textContent = n;
    if (xid) {
      xid.textContent = state.user.xid || 'Войти в ID';
      xid.classList.toggle('off', !state.user.xid);
    }
    var h = new Date().getHours();
    var hi = document.querySelector('.home-hi');
    if (hi) hi.textContent = h < 5 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
  }

  function tick() {
    var d = new Date();
    var t = clockStr(d);
    var sb = document.getElementById('sb-time');
    var ht = document.getElementById('home-time');
    var hs = document.getElementById('home-sub');
    if (sb) sb.textContent = t;
    if (ht) ht.textContent = t;
    if (hs) hs.innerHTML = d.getDate() + ' ' + MONTHS[d.getMonth()] + ' · <b>Лавка</b> · маркетплейс';
  }

  // ---------- app lifecycle ----------
  function setStatus(c) {
    if (phone) phone.dataset.status = c === 'white' ? 'white' : 'dark';
  }

  function openApp(id, opts) {
    var app = BY_ID[id];
    if (!app) { toast('Приложение недоступно'); return; }
    if (app.installable && !isInstalled(id)) {
      toast('Сначала установите приложение в Магазине');
      if (BY_ID.store) setTimeout(function () { openApp('store'); }, 250);
      return;
    }
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    currentApp = app;
    if (appBody) appBody.innerHTML = '';
    appview.classList.add('open');
    phone.classList.add('app-open');
    setStatus(app.status || 'dark');
    try {
      cleanup = app.mount ? app.mount(appBody, { app: app, close: closeApp }) : null;
    } catch (e) {
      console.error(e);
      if (appBody) appBody.innerHTML = '<div class="empty"><i class="fa-solid fa-triangle-exclamation"></i><div class="empty-title">Не удалось открыть</div><div class="empty-text">Попробуйте ещё раз</div><button class="btn btn-primary" data-back>Закрыть</button></div>';
    }
  }

  function closeApp() {
    if (!appview || !appview.classList.contains('open')) return;
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    appview.classList.remove('open');
    if (phone) phone.classList.remove('app-open');
    setStatus('dark');
    currentApp = null;
    setTimeout(function () {
      if (appview && !appview.classList.contains('open') && appBody) appBody.innerHTML = '';
    }, 380);
  }

  function appbar(o) {
    o = o || {};
    var back = o.back === false ? '' : '<button class="ab-btn" type="button" data-back aria-label="Назад"><i class="fa-solid fa-chevron-left"></i></button>';
    return '<div class="appbar" id="' + (o.id || '') + '">' + back +
      '<div class="ab-title' + (o.center ? ' center' : '') + '">' +
      (o.title ? esc(o.title) : '') +
      (o.sub ? '<div class="ab-sub">' + esc(o.sub) + '</div>' : '') +
      '</div>' +
      '<div class="ab-right">' + (o.right || '') + '</div></div>';
  }

  function closeButtonHTML() {
    return '<button class="ab-btn" type="button" data-back aria-label="Закрыть"><i class="fa-solid fa-xmark"></i></button>';
  }

  // ---------- tutorial ----------
  var TUT = [
    {
      title: 'Привет, это «Лавка»',
      text: 'Твой телефон с маркетплейсом. Здесь 2100 товаров, 21 категория, доставка и оформление заказов — всё как в жизни.',
      target: null,
      btn: 'Показать',
      prepare: function () { closeApp(); setPage(0); updateHomeUser(); }
    },
    {
      title: 'Маркетплейс',
      text: 'Главное приложение — «Лавка». Внутри каталог, поиск, корзина и заказы. Нажми «Далее», чтобы открыть.',
      target: '[data-app="market"]',
      prepare: function () { closeApp(); setPage(0); }
    },
    {
      title: 'Поиск и категории',
      text: 'Ищи товар по названию, продавцу или описанию. Категории — ниже: от электроники до ювелирных изделий.',
      target: '#mkt-search',
      prepare: function () { openApp('market', { tut: true }); }
    },
    {
      title: 'Корзина и заказы',
      text: 'Всё, что добавил, хранится в корзине. Заказы можно оформить за пару секунд — статус и история сохранятся.',
      target: '[data-mnav="cart"]',
      prepare: function () { openApp('market'); }
    },
    {
      title: 'Профиль и X ID',
      text: 'Это твой профиль. X ID — единый идентификатор: его видно в профиле, по нему тебя узнают в сервисах экосистемы.',
      target: '#prof-xid',
      prepare: function () { openApp('profile'); }
    },
    {
      title: 'Настройки',
      text: 'Тёмная тема, уведомления и звуки — всё здесь. Обучение можно запустить заново в любой момент.',
      target: '#set-theme-row',
      prepare: function () { openApp('settings'); }
    },
    {
      title: 'Готово',
      text: 'Телефон твой. Открывай «Лавку», выбирай товары и оформляй первый заказ. Приятных покупок.',
      target: null,
      btn: 'Начать',
      prepare: function () { closeApp(); setPage(0); }
    }
  ];

  var tutStep = 0;
  var tutTimer = null;

  function startTutorial() {
    if (!tutEl) return;
    tutStep = 0;
    tutEl.classList.remove('hidden');
    tutGoto(0);
  }

  function endTutorial() {
    clearTimeout(tutTimer);
    if (tutEl) tutEl.classList.add('hidden');
    state.tutorial = true;
    save();
    closeApp();
    setPage(0);
  }

  function tutGoto(i) {
    clearTimeout(tutTimer);
    if (!tutEl) return;
    if (i >= TUT.length) { endTutorial(); return; }
    tutStep = i;
    var s = TUT[i];
    var stepEl = document.getElementById('tut-step');
    var titleEl = document.getElementById('tut-title');
    var textEl = document.getElementById('tut-text');
    var nextEl = document.getElementById('tut-next');
    if (stepEl) stepEl.textContent = (i + 1) + ' / ' + TUT.length;
    if (titleEl) titleEl.textContent = s.title;
    if (textEl) textEl.textContent = s.text;
    if (nextEl) nextEl.textContent = s.btn || 'Далее';
    var card = document.getElementById('tut-card');
    var spot = document.getElementById('tut-spot');
    if (spot) spot.style.opacity = '0';
    if (card) { card.style.top = 'auto'; card.style.bottom = '14px'; card.style.opacity = '0'; }
    if (s.prepare) { try { s.prepare(); } catch (e) { console.error(e); } }
    tutTimer = setTimeout(function () { placeTut(s, 0); }, 460);
  }

  function placeTut(s, attempt) {
    if (!tutEl || tutEl.classList.contains('hidden')) return;
    var card = document.getElementById('tut-card');
    var spot = document.getElementById('tut-spot');
    if (!card || !phone) return;
    var target = s.target ? document.querySelector(s.target) : null;
    if (s.target && !target && attempt < 12) {
      tutTimer = setTimeout(function () { placeTut(s, attempt + 1); }, 220);
      return;
    }
    var ph = phone.getBoundingClientRect();
    var ox = phone.clientLeft, oy = phone.clientTop;
    var W = phone.clientWidth, H = phone.clientHeight;

    if (spot) {
      if (target) {
        try { target.scrollIntoView({ block: 'center', behavior: 'instant' }); } catch (e) {}
        var tr = target.getBoundingClientRect();
        var pad = target.classList.contains('app') ? 7 : 5;
        var left = Math.max(4, tr.left - ph.left - ox - pad);
        var top = Math.max(4, tr.top - ph.top - oy - pad);
        var width = Math.min(W - left - 4, tr.width + pad * 2);
        var height = Math.min(H - top - 4, tr.height + pad * 2);
        spot.style.opacity = '1';
        spot.style.left = left + 'px';
        spot.style.top = top + 'px';
        spot.style.width = width + 'px';
        spot.style.height = height + 'px';
        spot.style.borderRadius = (target.classList.contains('app') ? 22 : 16) + 'px';
      } else {
        spot.style.opacity = '0';
      }
    }

    card.style.opacity = '1';
    var ch = card.offsetHeight;
    var margin = 14;
    var cardTop = null, cardBottom = null;
    if (target) {
      var tRect = target.getBoundingClientRect();
      var relTop = tRect.top - ph.top - oy;
      var relBottom = tRect.bottom - ph.top - oy;
      if (relBottom < H * 0.46) {
        cardTop = Math.min(H - ch - margin, relBottom + 16);
      } else {
        cardBottom = Math.min(H - margin, H - relTop + 16);
        if (H - cardBottom < ch + margin) cardTop = margin;
      }
    } else {
      cardTop = Math.max(margin, (H - ch) / 2 + 10);
    }
    if (cardTop !== null) { card.style.top = cardTop + 'px'; card.style.bottom = 'auto'; }
    else { card.style.top = 'auto'; card.style.bottom = cardBottom + 'px'; }
  }

  // ---------- boot ----------
  function boot() {
    phone = document.getElementById('phone');
    appview = document.getElementById('appview');
    appBody = document.getElementById('app-body');
    toastEl = document.getElementById('toast');
    tutEl = document.getElementById('tutorial');

    if (state.theme === 'dark') document.body.classList.add('dark');
    xidBoot();
    updateHomeUser();
    renderApps();
    tick();
    setInterval(tick, 15000);

    // страховка: SVG-иконки статус-бара даже при старой разметке
    (function statusIcons() {
      var box = document.querySelector('.sb-right');
      if (!box || box.querySelector('.sb-i')) return;
      box.innerHTML = '<svg class="sb-i" viewBox="0 0 18 12" style="width:15px;height:10px;fill:currentColor"><rect x="0" y="8" width="3" height="4"/><rect x="5" y="6" width="3" height="6"/><rect x="10" y="3" width="3" height="9"/><rect x="15" y="0" width="3" height="12"/></svg>' +
        '<svg class="sb-i" viewBox="0 0 16 12" style="width:15px;height:10px;fill:currentColor"><path d="M8 11.3 5.9 9.2a3 3 0 0 1 4.2 0L8 11.3Zm-3.4-3.4a5.4 5.4 0 0 1 6.8 0L10 9.3a3.2 3.2 0 0 0-4 0L4.6 7.9ZM2 5.3a8.8 8.8 0 0 1 12 0l-1.4 1.4a6.8 6.8 0 0 0-9.2 0L2 5.3Z"/></svg>' +
        '<svg class="sb-i" viewBox="0 0 24 12" style="width:17px;height:10px;fill:none;stroke:currentColor"><rect x="0.8" y="1.2" width="18.4" height="9.6" rx="2.4" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="2.6" y="3" width="12.6" height="6" rx="1" style="fill:currentColor"/><rect x="20.6" y="3.8" width="2.2" height="4.4" rx="1" style="fill:currentColor"/></svg>';
    })();

    // глубокая ссылка: market/#web=pulse или market/#web=torg/t1
    var m = (location.hash || '').match(/^#web=([a-z0-9_-]+)(?:\/([a-z0-9_-]+))?/i);
    if (m) {
      state.tutorial = true;
      save();
      setTimeout(function () {
        openApp('browser');
        if (window.Web) Web.open(m[1].toLowerCase(), m[2] ? m[2].toLowerCase() : undefined);
      }, 250);
    }
    // быстрый запуск приложения: market/#app=job
    var am = (location.hash || '').match(/^#app=([a-z0-9_-]+)/i);
    if (am) {
      state.tutorial = true;
      save();
      setTimeout(function () { openApp(am[1].toLowerCase()); }, 300);
    }

    // часы
    updateClockHands();

    // клики по домашнему экрану
    document.addEventListener('click', function (e) {
      var appBtn = e.target.closest('[data-app]');
      if (appBtn) { openApp(appBtn.getAttribute('data-app')); return; }
      var dot = e.target.closest('[data-page]');
      if (dot) { setPage(Number(dot.getAttribute('data-page'))); return; }
      var back = e.target.closest('[data-back]');
      if (back) { closeApp(); return; }
    });

    // свайп страниц
    var vp = document.querySelector('.apps-vp');
    if (vp) {
      var sx = 0, sy = 0, active = false;
      vp.addEventListener('touchstart', function (e) {
        if (!e.touches.length) return;
        sx = e.touches[0].clientX; sy = e.touches[0].clientY; active = true;
      }, { passive: true });
      vp.addEventListener('touchend', function (e) {
        if (!active) return;
        active = false;
        var t = e.changedTouches[0];
        var dx = t.clientX - sx, dy = t.clientY - sy;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          setPage(page + (dx < 0 ? 1 : -1));
        }
      }, { passive: true });
    }

    // кнопки обучения
    var next = document.getElementById('tut-next');
    var skip = document.getElementById('tut-skip');
    if (next) next.addEventListener('click', function () { tutGoto(tutStep + 1); });
    if (skip) skip.addEventListener('click', endTutorial);

    window.addEventListener('resize', function () {
      if (tutEl && !tutEl.classList.contains('hidden')) placeTut(TUT[tutStep], 0);
    });


    // прогрев каталога
    setTimeout(function () {
      if (window.Market && Market.preload) Market.preload();
    }, 1400);
  }

  function updateClockHands() {
    var el = document.getElementById('clock-hands');
    if (!el) return;
    var d = new Date();
    var h = document.getElementById('hand-h');
    var m = document.getElementById('hand-m');
    var s = document.getElementById('hand-s');
    if (!h || !m || !s) return;
    var sec = d.getSeconds();
    var min = d.getMinutes() + sec / 60;
    var hr = (d.getHours() % 12) + min / 60;
    h.style.transform = 'rotate(' + (hr * 30) + 'deg)';
    m.style.transform = 'rotate(' + (min * 6) + 'deg)';
    s.style.transform = 'rotate(' + (sec * 6) + 'deg)';
    clearTimeout(updateClockHands._t);
    updateClockHands._t = setTimeout(updateClockHands, 1000);
  }

  function copyText(text, msg) {
    var done = function () { toast(msg || 'Скопировано'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text, done); });
    } else fallbackCopy(text, done);
  }
  function fallbackCopy(text, done) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      done();
    } catch (e) { toast('Не удалось скопировать'); }
  }

  function openSettingsTo(anchor) {
    openApp('settings');
    setTimeout(function () {
      var el = document.getElementById(anchor);
      if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 420);
  }

  // ---------- export ----------
  window.LV = {
    get state() { return state; },
    get current() { return currentApp; },
    save: save,
    registerApp: registerApp,
    openApp: openApp,
    closeApp: closeApp,
    appbar: appbar,
    closeButtonHTML: closeButtonHTML,
    setStatus: setStatus,
    toast: toast,
    esc: esc,
    fmt: fmt,
    fmtNum: fmtNum,
    dateRu: dateRu,
    dateFull: dateFull,
    todayISO: todayISO,
    clockStr: clockStr,
    initials: initials,
    svgArt: svgArt,
    hash: hash,
    cartCount: cartCount,
    isFav: isFav,
    toggleFav: toggleFav,
    isInstalled: isInstalled,
    installApp: installApp,
    uninstallApp: uninstallApp,
    renderApps: renderApps,
    updateHomeUser: updateHomeUser,
    xidLogin: xidLogin,
    xidRegister: xidRegister,
    xidLogout: xidLogout,
    bankReload: bankReload,
    startTutorial: startTutorial,
    copyText: copyText,
    openSettingsTo: openSettingsTo,
    apps: APPS
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
