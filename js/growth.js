(function () {
  'use strict';
  var LV = window.LV;
  if (!LV || !LV.state || !LV.state.biz) return;
  var S = LV.state, B = S.biz, esc = LV.esc, fmt = LV.fmt;
  var TYPES = (window.Biz && window.Biz.TYPES) || {};
  var SPOTS = (window.Biz && window.Biz.SPOTS) || {};

  var DEFAULTS = {
    standards: 55,
    franchises: [],
    market: { share: 20, rival: 38, moves: 0, lastAttack: -1, history: [] },
    warehouse: { built: false, stock: {}, auto: false, capacity: 360 },
    city: { eventId: 'normal', left: 2, history: [] }
  };
  if (!B.growth || typeof B.growth !== 'object') B.growth = {};
  (function merge(def, tgt) {
    Object.keys(def).forEach(function (k) {
      if (tgt[k] === undefined) tgt[k] = JSON.parse(JSON.stringify(def[k]));
      else if (def[k] && typeof def[k] === 'object' && !Array.isArray(def[k]) && typeof tgt[k] === 'object') merge(def[k], tgt[k]);
    });
  })(DEFAULTS, B.growth);
  var G = B.growth;
  if (!Array.isArray(G.franchises)) G.franchises = [];
  if (!Array.isArray(G.market.history)) G.market.history = [];
  if (!G.warehouse.stock || typeof G.warehouse.stock !== 'object') G.warehouse.stock = {};
  if (!Array.isArray(G.city.history)) G.city.history = [];

  function save() { try { LV.save(); } catch (e) {} }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function toast(m) { LV.toast(m); }
  function countType(t) { return B.points.filter(function (p) { return p.type === t; }).length; }
  function typeInfo(t) {
    return TYPES[t] || { name: t, color: '#64748b', icon: 'fa-box' };
  }
  function spotName(p) {
    var s = SPOTS[p && p.spot];
    return s ? s.name : 'точка';
  }
  function pointStock(p) { return p && p.stock != null ? p.stock : 40; }
  function sold() { return !!(B.story && B.story.flags && B.story.flags.sold); }

  var FRANCHISES = [
    { id: 'kiosk', type: 'kiosk', name: 'Ларёк у дома', req: 2, fee: 250000, royalty: 2500, icon: 'fa-store', color: '#f59e0b' },
    { id: 'pvz', type: 'pvz', name: 'ПВЗ-экспресс', req: 3, fee: 500000, royalty: 5200, icon: 'fa-box', color: '#10b981' },
    { id: 'cafe', type: 'cafe', name: 'Кофе-корнер', req: 1, fee: 700000, royalty: 7000, icon: 'fa-mug-hot', color: '#b45309' },
    { id: 'shop', type: 'shop', name: 'Магазин у метро', req: 1, fee: 1000000, royalty: 10500, icon: 'fa-shop', color: '#0ea5e9' },
    { id: 'taxifleet', type: 'taxifleet', name: 'Городское такси', req: 1, fee: 1800000, royalty: 18000, icon: 'fa-taxi', color: '#f59e0b' }
  ];

  var CITY_EVENTS = [
    { id: 'normal', name: 'Обычный день', desc: 'Спрос без бонусов', icon: 'fa-sun', color: '#f59e0b', left: 2, mult: {} },
    { id: 'heat', name: 'Жара', desc: 'Кофейни, киоски и магазины +20%', icon: 'fa-temperature-high', color: '#ef4444', left: 3, mult: { cafe: 1.25, kiosk: 1.15, shop: 1.15 } },
    { id: 'festival', name: 'Фестиваль', desc: 'Все точки +15%', icon: 'fa-champagne-glasses', color: '#a855f7', left: 3, mult: { '*': 1.15 } },
    { id: 'crisis', name: 'Кризис', desc: 'Спрос −15%, зато аренда не растёт', icon: 'fa-arrow-trend-down', color: '#64748b', left: 3, mult: { '*': 0.85 } },
    { id: 'night', name: 'Ночь города', desc: 'Кофейни и ПК-клубы +30%', icon: 'fa-moon', color: '#6366f1', left: 3, mult: { cafe: 1.3, pcclub: 1.3 } },
    { id: 'payday', name: 'День зарплаты', desc: 'Магазины, ТРЦ и электроника +20%', icon: 'fa-wallet', color: '#10b981', left: 3, mult: { shop: 1.2, mall: 1.2, electronics: 1.2 } },
    { id: 'checks', name: 'Проверки', desc: 'Выручка +10%, но инспекторы активнее', icon: 'fa-clipboard-check', color: '#f59e0b', left: 3, mult: { '*': 1.1 } }
  ];

  function cityEvent(id) {
    return CITY_EVENTS.filter(function (e) { return e.id === id; })[0] || CITY_EVENTS[0];
  }
  function ensureCity() {
    if (G.city.eventId && G.city.left > 0) return;
    var prev = G.city.eventId;
    var pool = CITY_EVENTS.filter(function (e) { return e.id !== 'normal' && e.id !== prev; });
    var ev = pool[Math.floor(Math.random() * pool.length)] || CITY_EVENTS[1];
    G.city.eventId = ev.id;
    G.city.left = ev.left || 3;
    G.city.history.unshift({ id: ev.id, name: ev.name, desc: ev.desc, at: B.stats.shifts || 0 });
    if (G.city.history.length > 8) G.city.history.pop();
    save();
  }
  ensureCity();

  function demandMult(p) {
    var ev = cityEvent(G.city.eventId);
    var m = ev.mult['*'] || 1;
    if (p && ev.mult[p.type]) m *= ev.mult[p.type];
    m *= clamp(0.95 + ((Number(G.market.share) || 0) - (Number(G.market.rival) || 0)) / 300, 0.78, 1.18);
    return m;
  }

  function franchiseRoyalty(f) {
    return Math.round(f.royalty * (0.6 + G.standards * 0.004));
  }
  function franchiseIncome() {
    return G.franchises.reduce(function (s, f) { return s + franchiseRoyalty(f); }, 0);
  }

  function shiftRow(name, sub, amount) {
    return '<div class="bj-shift-row"><div><b>' + name + '</b><span>' + sub + '</span></div><div class="bj-shift-sum"><b class="plus">+' + fmt(amount) + '</b></div></div>';
  }

  function shiftIncome() {
    var total = 0, rows = [];
    var royal = franchiseIncome();
    if (royal > 0) { total += royal; rows.push(shiftRow('Франшизы', G.franchises.length + ' договоров · роялти', royal)); }
    var div = (window.Exchange && Exchange.dividend) ? Exchange.dividend() : 0;
    if (div > 0) { total += div; rows.push(shiftRow('Биржа', 'дивиденды по портфелю', div)); }
    return { total: total, rows: rows };
  }

  function beforeShift(p) {
    if (!G.warehouse.built || !G.warehouse.auto) return 0;
    var stock = Number(G.warehouse.stock[p.type]) || 0;
    var room = 80 - pointStock(p);
    var move = Math.min(stock, room, 20);
    if (move <= 0) return 0;
    G.warehouse.stock[p.type] = stock - move;
    p.stock = pointStock(p) + move;
    save();
    return move;
  }

  function rivalMove() {
    var line;
    if (G.market.rival > G.market.share) {
      G.market.share = Math.round(clamp(G.market.share - 0.8, 3, 85) * 10) / 10;
      line = '«Сетка» запустила акцию и отжала долю';
    } else {
      G.market.rival = Math.round(clamp(G.market.rival + 0.5, 3, 85) * 10) / 10;
      line = '«Сетка» открыла новую точку';
    }
    G.market.history.unshift({ text: line, at: B.stats.shifts || 0 });
    if (G.market.history.length > 8) G.market.history.pop();
  }

  function onShiftEnd(shift, net) {
    var ratio = shift.done / Math.max(1, shift.total);
    G.market.share = Math.round(clamp(G.market.share + (ratio - 0.5) * 2.4 + G.franchises.length * 0.15, 3, 85) * 10) / 10;
    G.market.rival = Math.round(clamp(G.market.rival + (Math.random() - 0.5) * 0.7 - (ratio - 0.5) * 0.5, 3, 85) * 10) / 10;
    G.market.moves = (G.market.moves || 0) + 1;
    if (G.market.moves % 4 === 0) rivalMove();
    G.standards = Math.round(clamp(G.standards + ((Number(B.stats.rating) || 4.5) - 4.3) * 0.25, 0, 100) * 10) / 10;
    G.city.left = Math.max(0, (G.city.left || 0) - 1);
    ensureCity();
    if (window.Exchange && Exchange.onShiftEnd) Exchange.onShiftEnd();
    save();
  }

  function marketAttack(kind) {
    if (sold()) { toast('Сеть продана — рынок больше не ваш'); return; }
    var kinds = {
      ads: { name: 'Реклама', cost: 60000, share: 3, icon: 'fa-bullhorn' },
      dumping: { name: 'Демпинг', cost: 30000, share: 2, icon: 'fa-tags' },
      quality: { name: 'Сервис', cost: 80000, share: 2.5, icon: 'fa-star' }
    };
    var a = kinds[kind];
    if (!a) return;
    if (G.market.lastAttack === (B.stats.shifts || 0)) { toast('Одна атака за смену'); return; }
    if (B.cash < a.cost) { toast('Не хватает ' + fmt(a.cost - B.cash)); return; }
    B.cash -= a.cost;
    G.market.share = Math.round(clamp(G.market.share + a.share, 3, 85) * 10) / 10;
    G.market.rival = Math.round(clamp(G.market.rival - a.share * 0.35, 3, 85) * 10) / 10;
    if (kind === 'quality') G.standards = Math.round(clamp(G.standards + 2, 0, 100) * 10) / 10;
    if (kind === 'dumping') B.stats.rating = Math.max(3, Math.round(((Number(B.stats.rating) || 4.8) - 0.05) * 100) / 100);
    G.market.lastAttack = B.stats.shifts || 0;
    G.market.history.unshift({ text: a.name + ' · ' + fmt(a.cost) + ' · доля +' + a.share + '%', at: B.stats.shifts || 0 });
    if (G.market.history.length > 8) G.market.history.pop();
    B.events.unshift({ t: 'market', text: 'Рынок: ' + a.name + ' · +' + a.share + '% доли', time: timeNow() });
    save();
    renderMarket();
    toast(a.name + ' сработала');
  }
  function timeNow() {
    var d = LV.gameNow ? LV.gameNow() : new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function standardsUp() {
    if (sold()) { toast('Сеть продана'); return; }
    if (G.standards >= 100) { toast('Стандарты уже максимальные'); return; }
    if (B.cash < 120000) { toast('Нужно 120 000 ₽'); return; }
    B.cash -= 120000;
    G.standards = Math.min(100, G.standards + 5);
    G.market.share = Math.round(clamp(G.market.share + 0.5, 3, 85) * 10) / 10;
    save();
    renderFranchise();
    toast('Стандарты +5');
  }

  function sellFranchise(id) {
    if (sold()) { toast('Сеть продана'); return; }
    if (B.level < 10) { toast('Франшизы доступны с 10 уровня'); return; }
    var f = FRANCHISES.filter(function (x) { return x.id === id; })[0];
    if (!f) return;
    if (G.franchises.some(function (x) { return x.id === id; })) { toast('Франшиза уже продана'); return; }
    if (countType(f.type) < f.req) { toast('Нужно точек: ' + f.req); return; }
    B.cash += f.fee;
    G.franchises.push({ id: f.id, type: f.type, name: f.name, royalty: f.royalty, at: B.stats.shifts || 0 });
    G.market.share = Math.round(clamp(G.market.share + 2, 3, 85) * 10) / 10;
    B.events.unshift({ t: 'franchise', text: 'Продана франшиза: ' + f.name + ' · +' + fmt(f.fee), time: timeNow() });
    save();
    renderFranchise();
    toast('Франшиза продана · +' + fmt(f.fee));
  }

  function typeMeta(type) { return typeInfo(type); }

  function warehouseTotal() {
    return Object.keys(G.warehouse.stock).reduce(function (s, k) { return s + (Number(G.warehouse.stock[k]) || 0); }, 0);
  }
  function warehouseSpace() { return Math.max(0, G.warehouse.capacity - warehouseTotal()); }
  function hasWarehouse() { return !!G.warehouse.built; }

  function buildWarehouse() {
    if (sold()) { toast('Сеть продана'); return; }
    if (G.warehouse.built) { toast('Склад уже построен'); return; }
    if (B.level < 8) { toast('Склад доступен с 8 уровня'); return; }
    if (B.cash < 600000) { toast('Нужно 600 000 ₽'); return; }
    B.cash -= 600000;
    G.warehouse.built = true;
    B.events.unshift({ t: 'warehouse', text: 'Построен склад в Промзоне', time: timeNow() });
    save();
    renderWarehouse();
    toast('Склад построен');
  }

  function receiveSupply(type, qty) {
    if (!G.warehouse.built) return false;
    var add = Math.min(qty, warehouseSpace());
    if (add <= 0) return false;
    G.warehouse.stock[type] = (Number(G.warehouse.stock[type]) || 0) + add;
    if (G.warehouse.auto) deliverType(type);
    save();
    return true;
  }

  function deliverType(type) {
    var stock = Number(G.warehouse.stock[type]) || 0;
    B.points.forEach(function (p) {
      if (p.type !== type || stock <= 0) return;
      var room = 80 - pointStock(p);
      var move = Math.min(stock, room, 20);
      if (move <= 0) return;
      G.warehouse.stock[type] = stock - move;
      p.stock = pointStock(p) + move;
      stock -= move;
    });
  }

  function deliverToPoint(type, pid) {
    if (!G.warehouse.built) { toast('Сначала постройте склад'); return; }
    var p = B.points.filter(function (x) { return x.id === pid; })[0];
    if (!p || p.type !== type) return;
    var stock = Number(G.warehouse.stock[type]) || 0;
    var room = 80 - pointStock(p);
    if (stock <= 0) { toast('На складе нет этого товара'); return; }
    if (room <= 0) { toast('На точке уже полный запас'); return; }
    if (B.cash < 500) { toast('Доставка стоит 500 ₽'); return; }
    var qty = Math.min(stock, room, 30);
    B.cash -= 500;
    G.warehouse.stock[type] = stock - qty;
    p.stock = pointStock(p) + qty;
    B.events.unshift({ t: 'warehouse', text: 'Доставка: +' + qty + ' шт · ' + spotName(p), time: timeNow() });
    save();
    renderWarehouse();
    toast('Доставлено ' + qty + ' шт');
  }

  function toggleWarehouseAuto() {
    if (!G.warehouse.built) return;
    G.warehouse.auto = !G.warehouse.auto;
    save();
    renderWarehouse();
    toast(G.warehouse.auto ? 'Автодоставка включена' : 'Автодоставка выключена');
  }

  function sponsorCity() {
    if (sold()) { toast('Сеть продана'); return; }
    if (B.cash < 25000) { toast('Нужно 25 000 ₽'); return; }
    B.cash -= 25000;
    G.market.share = Math.round(clamp(G.market.share + 1.5, 3, 85) * 10) / 10;
    G.standards = Math.round(clamp(G.standards + 1, 0, 100) * 10) / 10;
    G.city.left = Math.min(5, (G.city.left || 0) + 1);
    B.events.unshift({ t: 'city', text: 'Городское событие · спонсорство', time: timeNow() });
    save();
    renderCity();
    toast('Город заметил спонсора');
  }

  var frHost = null, marketHost = null, whHost = null, cityHost = null;

  function shell(title, sub, body) {
    return '<div class="gr">' +
      '<header class="gr-top"><button class="gr-back" type="button" data-back><i class="fa-solid fa-chevron-left"></i></button>' +
      '<div><b>' + title + '</b><span>' + sub + '</span></div></header>' +
      '<div class="app-scroll pb gr-body">' + body + '</div></div>';
  }

  function renderFranchise() {
    if (!frHost) return;
    var deals = G.franchises.map(function (f) {
      return '<div class="gr-card"><div class="gr-row"><span class="gr-ava" style="background:' + (FRANCHISES.filter(function (x) { return x.id === f.id; })[0] || {}).color + '"><i class="fa-solid ' + (FRANCHISES.filter(function (x) { return x.id === f.id; })[0] || {}).icon + '"></i></span>' +
        '<div class="gr-grow"><b>' + esc(f.name) + '</b><span>роялти ' + fmt(franchiseRoyalty(f)) + ' / смена</span></div><span class="gr-pill good">активна</span></div></div>';
    }).join('');
    var offers = FRANCHISES.filter(function (f) { return !G.franchises.some(function (x) { return x.id === f.id; }); }).map(function (f) {
      var n = countType(f.type);
      var can = n >= f.req && B.level >= 10;
      return '<div class="gr-card"><div class="gr-row"><span class="gr-ava" style="background:' + f.color + '"><i class="fa-solid ' + f.icon + '"></i></span>' +
        '<div class="gr-grow"><b>' + esc(f.name) + '</b><span>' + n + '/' + f.req + ' точек · ' + fmt(f.fee) + '</span><small>роялти ' + fmt(Math.round(f.royalty * (0.6 + G.standards * 0.004))) + ' / смена</small></div>' +
        '<button class="gr-btn" type="button" ' + (can ? '' : 'disabled') + ' onclick="Growth.sellFranchise(\'' + f.id + '\')">' + (can ? 'Продать' : 'Нужно ' + f.req) + '</button></div></div>';
    }).join('');
    frHost.innerHTML = shell('Франшиза', 'масштаб без новых точек',
      '<div class="gr-hero"><span class="gr-kicker">СТАНДАРТЫ СЕТИ</span><b>' + G.standards + ' / 100</b><div class="gr-bar"><i style="width:' + G.standards + '%"></i></div>' +
      '<small>Роялти: ' + fmt(franchiseIncome()) + ' за смену · договоров ' + G.franchises.length + '</small></div>' +
      '<div class="gr-actions"><button class="gr-btn wide" type="button" onclick="Growth.standardsUp()">Повысить стандарты · 120 000 ₽</button></div>' +
      '<div class="gr-sec"><b>Мои франшизы</b><span>' + G.franchises.length + '</span></div>' +
      (deals || '<p class="gr-empty">Пока нет договоров. Продай первую франшизу.</p>') +
      '<div class="gr-sec"><b>Предложения</b><span>10+ ур.</span></div>' +
      (offers || '<p class="gr-empty">Все форматы уже проданы.</p>') +
      (sold() ? '<p class="gr-note">Сеть продана — новые договоры не заключаются.</p>' : '') +
      '<p class="gr-note">Франшиза приносит роялти каждую смену. Стандарты влияют на размер выплат.</p>');
  }

  function renderMarket() {
    if (!marketHost) return;
    var share = Number(G.market.share) || 0, rival = Number(G.market.rival) || 0;
    var other = Math.max(0, Math.round(100 - share - rival));
    var history = G.market.history.length ? G.market.history.map(function (x) {
      return '<div class="gr-history"><b>' + esc(x.text) + '</b><span>смена ' + (x.at || 0) + '</span></div>';
    }).join('') : '<p class="gr-empty">Пока тихо. Проведи смену — рынок отреагирует.</p>';
    marketHost.innerHTML = shell('Рынок', 'доля и конкурент',
      '<div class="gr-hero"><span class="gr-kicker">ДОЛЯ РЫНКА</span><b>' + share.toFixed(1) + '%</b>' +
      '<div class="gr-split"><i style="width:' + share + '%"></i><i style="width:' + rival + '%"></i><i style="width:' + other + '%"></i></div>' +
      '<small>Вы ' + share.toFixed(1) + '% · «Сетка» ' + rival.toFixed(1) + '% · другие ' + other + '%</small></div>' +
      '<div class="gr-actions">' +
      '<button class="gr-btn" type="button" onclick="Growth.marketAttack(\'ads\')">Реклама · 60 000 ₽</button>' +
      '<button class="gr-btn" type="button" onclick="Growth.marketAttack(\'dumping\')">Демпинг · 30 000 ₽</button>' +
      '<button class="gr-btn" type="button" onclick="Growth.marketAttack(\'quality\')">Сервис · 80 000 ₽</button></div>' +
      '<p class="gr-note">Одна атака за смену. Реклама даёт долю, демпинг бьёт по рейтингу, сервис — по стандартам.</p>' +
      '<div class="gr-sec"><b>Хроника рынка</b><span>' + G.market.moves + '</span></div>' + history +
      (sold() ? '<p class="gr-note">Сеть продана — борьба за долю остановлена.</p>' : ''));
  }

  function renderWarehouse() {
    if (!whHost) return;
    var total = warehouseTotal();
    var body = '<div class="gr-hero"><span class="gr-kicker">ЛОГИСТИКА</span><b>' + (G.warehouse.built ? total + ' / ' + G.warehouse.capacity : 'Склад не построен') + '</b>' +
      '<small>' + (G.warehouse.built ? (G.warehouse.auto ? 'автодоставка включена' : 'автодоставка выключена') : 'Поставки со Opt пойдут через склад') + '</small></div>';
    if (!G.warehouse.built) {
      body += '<div class="gr-card"><b>Построить склад</b><p class="gr-text">Храни товар для всех точек и доставляй его партиями. Склад увеличивает запас и снимает зависимость от одной поставки.</p>' +
        '<button class="gr-btn wide" type="button" onclick="Growth.buildWarehouse()">Построить · 600 000 ₽ · 8 ур.</button></div>';
    } else {
      body += '<div class="gr-card"><div class="gr-row"><div class="gr-grow"><b>Автодоставка</b><span>+20 шт на точку перед сменой</span></div>' +
        '<button class="gr-btn" type="button" onclick="Growth.toggleWarehouseAuto()">' + (G.warehouse.auto ? 'Выключить' : 'Включить') + '</button></div></div>';
      var types = Object.keys(G.warehouse.stock).filter(function (t) { return (Number(G.warehouse.stock[t]) || 0) > 0; });
      if (!types.length) body += '<p class="gr-empty">Склад пуст. Закажи товар на opt.lackuun.com — он придёт сюда.</p>';
      types.forEach(function (type) {
        var m = typeMeta(type), qty = Number(G.warehouse.stock[type]) || 0;
        var pts = B.points.filter(function (p) { return p.type === type; });
        body += '<div class="gr-card"><div class="gr-row"><span class="gr-ava" style="background:' + m.color + '"><i class="fa-solid ' + m.icon + '"></i></span>' +
          '<div class="gr-grow"><b>' + esc(m.name) + '</b><span>' + qty + ' шт на складе</span></div></div>' +
          (pts.length ? pts.map(function (p) {
            return '<div class="gr-line"><div><b>' + esc(spotName(p)) + '</b><span>' + pointStock(p) + '/80 на точке</span></div>' +
              '<button class="gr-btn small" type="button" onclick="Growth.deliverToPoint(\'' + type + '\',\'' + p.id + '\')">Доставить · 500 ₽</button></div>';
          }).join('') : '<p class="gr-text">Нет точек этого типа.</p>') + '</div>';
      });
      body += '<p class="gr-note">Доставка вручную переносит до 30 шт. Автодоставка — бесплатно, но не больше 20 шт на точку за смену.</p>';
    }
    whHost.innerHTML = shell('Склад', 'товар и доставка', body);
  }

  function renderCity() {
    if (!cityHost) return;
    var ev = cityEvent(G.city.eventId);
    var hist = G.city.history.length ? G.city.history.map(function (x) {
      return '<div class="gr-history"><b>' + esc(x.name) + '</b><span>' + esc(x.desc) + '</span></div>';
    }).join('') : '<p class="gr-empty">Город ещё не выбрал настроение.</p>';
    cityHost.innerHTML = shell('Город', 'события и спрос',
      '<div class="gr-hero" style="background:linear-gradient(135deg,' + ev.color + ',#0f172a)"><span class="gr-kicker">СЕЙЧАС В ГОРОДЕ</span><b><i class="fa-solid ' + ev.icon + '"></i> ' + esc(ev.name) + '</b>' +
      '<small>' + esc(ev.desc) + ' · ещё ' + (G.city.left || 0) + ' смен</small></div>' +
      '<div class="gr-actions"><button class="gr-btn wide" type="button" onclick="Growth.sponsorCity()">Стать спонсором · 25 000 ₽</button></div>' +
      '<div class="gr-sec"><b>Хроника города</b><span>' + G.city.history.length + '</span></div>' + hist +
      '<p class="gr-note">Событие меняет спрос в точках. Спонсорство добавляет долю рынка и продлевает событие.</p>');
  }

  function reg(id, name, icon, bg, desc, level, mount) {
    LV.registerApp({
      id: id, name: name, icon: icon, bg: bg, page: 2, status: 'white', desc: desc,
      visible: function () { return B.level >= level; },
      mount: function (body) {
        var host = body;
        if (id === 'franchise') frHost = host;
        if (id === 'rival') marketHost = host;
        if (id === 'warehouse') whHost = host;
        if (id === 'city') cityHost = host;
        if (id === 'franchise') renderFranchise();
        if (id === 'rival') renderMarket();
        if (id === 'warehouse') renderWarehouse();
        if (id === 'city') renderCity();
        return function () {
          if (id === 'franchise') frHost = null;
          if (id === 'rival') marketHost = null;
          if (id === 'warehouse') whHost = null;
          if (id === 'city') cityHost = null;
        };
      }
    });
  }

  reg('franchise', 'Франшиза', 'fa-handshake-angle', 'linear-gradient(140deg,#b45309,#7c2d12)', 'Роялти и стандарты', 10);
  reg('rival', 'Рынок', 'fa-chart-pie', 'linear-gradient(140deg,#be123c,#881337)', 'Доля и конкурент', 8);
  reg('warehouse', 'Склад', 'fa-warehouse', 'linear-gradient(140deg,#475569,#1e293b)', 'Логистика и запасы', 8);
  reg('city', 'Город', 'fa-city', 'linear-gradient(140deg,#0ea5e9,#0369a1)', 'События и спрос', 4);

  window.Growth = {
    demandMult: demandMult,
    beforeShift: beforeShift,
    shiftIncome: shiftIncome,
    onShiftEnd: onShiftEnd,
    hasWarehouse: hasWarehouse,
    warehouseSpace: warehouseSpace,
    receiveSupply: receiveSupply,
    deliverToPoint: deliverToPoint,
    buildWarehouse: buildWarehouse,
    toggleWarehouseAuto: toggleWarehouseAuto,
    sellFranchise: sellFranchise,
    standardsUp: standardsUp,
    marketAttack: marketAttack,
    sponsorCity: sponsorCity,
    state: G
  };

  save();
})();
