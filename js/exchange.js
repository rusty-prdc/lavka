(function () {
  'use strict';
  var LV = window.LV;
  if (!LV || !LV.state || !LV.state.biz) return;
  var B = LV.state.biz, fmt = LV.fmt, esc = LV.esc;
  var G = B.growth || (B.growth = {});
  var DEFAULTS = { prices: {}, prev: {}, history: {}, holdings: {}, news: [], lastTick: 0 };
  if (!G.stocks || typeof G.stocks !== 'object') G.stocks = {};
  Object.keys(DEFAULTS).forEach(function (k) {
    if (G.stocks[k] === undefined) G.stocks[k] = JSON.parse(JSON.stringify(DEFAULTS[k]));
  });
  var ST = G.stocks;

  var DEFS = [
    { id: 'lavka', name: 'Лавка', ticker: 'LVK', price: 120, vol: 0.02, color: '#10b981' },
    { id: 'bank', name: 'BankFake', ticker: 'BFK', price: 84, vol: 0.018, color: '#6366f1' },
    { id: 'port', name: 'Порт «Северный»', ticker: 'PRT', price: 210, vol: 0.025, color: '#0ea5e9' },
    { id: 'techno', name: 'ТехноГород', ticker: 'TCH', price: 155, vol: 0.03, color: '#f59e0b' },
    { id: 'setka', name: 'Сетка', ticker: 'STK', price: 64, vol: 0.028, color: '#ef4444' }
  ];
  var NEWS = [
    { id: 'lavka', text: 'Лавка открыла новый распределительный центр', delta: 0.04 },
    { id: 'lavka', text: 'Лавка запускает доставку за 15 минут', delta: 0.03 },
    { id: 'bank', text: 'BankFake повысил ставки по вкладам', delta: 0.035 },
    { id: 'bank', text: 'Регулятор проверил BankFake — без нарушений', delta: 0.02 },
    { id: 'port', text: 'Порт увеличил грузооборот на 12%', delta: 0.05 },
    { id: 'port', text: 'Забастовка в порту приостановлена', delta: -0.03 },
    { id: 'techno', text: 'ТехноГород показал новый процессор', delta: 0.06 },
    { id: 'techno', text: 'Утечка данных в ТехноГороде', delta: -0.05 },
    { id: 'setka', text: '«Сетка» снизила цены и давит на рынок', delta: 0.04 },
    { id: 'setka', text: 'Проверка «Сетки»: штраф за нарушения', delta: -0.06 }
  ];

  function save() { try { LV.save(); } catch (e) {} }
  function def(id) { return DEFS.filter(function (x) { return x.id === id; })[0]; }
  function price(id) { return Number(ST.prices[id]) || (def(id) || {}).price || 1; }
  function holding(id) {
    if (!ST.holdings[id]) ST.holdings[id] = { qty: 0, avg: 0 };
    return ST.holdings[id];
  }
  function ensure() {
    DEFS.forEach(function (d) {
      if (typeof ST.prices[d.id] !== 'number') ST.prices[d.id] = d.price;
      if (typeof ST.prev[d.id] !== 'number') ST.prev[d.id] = d.price;
      if (!Array.isArray(ST.history[d.id])) ST.history[d.id] = [d.price];
      if (!ST.holdings[d.id]) ST.holdings[d.id] = { qty: 0, avg: 0 };
    });
    if (!Array.isArray(ST.news)) ST.news = [];
  }
  ensure();

  function portfolioValue() {
    return DEFS.reduce(function (s, d) { return s + holding(d.id).qty * price(d.id); }, 0);
  }
  function portfolioCost() {
    return DEFS.reduce(function (s, d) { return s + holding(d.id).qty * holding(d.id).avg; }, 0);
  }
  function dividend() {
    var v = portfolioValue();
    return v > 0 ? Math.round(v * 0.003) : 0;
  }
  function pct(id) {
    var p = price(id), prev = Number(ST.prev[id]) || p;
    return prev ? (p - prev) / prev * 100 : 0;
  }
  function money(n) { return Math.round(n * 100) / 100; }

  function stockTick() {
    ensure();
    DEFS.forEach(function (d) {
      var p = price(d.id);
      var drift = (Math.random() - 0.5) * d.vol * 2;
      var shock = Math.random() < 0.04 ? (Math.random() - 0.5) * 0.08 : 0;
      var next = Math.max(5, p * (1 + drift + shock));
      ST.prev[d.id] = p;
      ST.prices[d.id] = money(next);
      var h = ST.history[d.id];
      h.push(money(next));
      if (h.length > 36) h.shift();
    });
    if (Math.random() < 0.18) news();
    ST.lastTick = Date.now();
    save();
    if (exHost && exView === 'market') renderExchange();
  }

  function news() {
    var n = NEWS[Math.floor(Math.random() * NEWS.length)];
    if (!n) return;
    if (n.delta) {
      ST.prices[n.id] = money(Math.max(5, price(n.id) * (1 + n.delta)));
      ST.prev[n.id] = price(n.id) / (1 + n.delta);
    }
    ST.news.unshift({ text: n.text, at: Date.now() });
    if (ST.news.length > 4) ST.news.pop();
  }

  function sparkline(id) {
    var h = ST.history[id] || [];
    if (h.length < 2) return '';
    var min = Math.min.apply(null, h), max = Math.max.apply(null, h);
    var span = Math.max(1, max - min);
    var pts = h.map(function (v, i) {
      var x = i / (h.length - 1) * 100;
      var y = 28 - (v - min) / span * 26;
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
    var up = pct(id) >= 0;
    return '<svg class="gr-spark" viewBox="0 0 100 30" preserveAspectRatio="none"><polyline points="' + pts + '" fill="none" stroke="' + (up ? '#10b981' : '#ef4444') + '" stroke-width="2"/></svg>';
  }

  function shell(title, sub, body) {
    return '<div class="gr"><header class="gr-top"><button class="gr-back" type="button" data-back><i class="fa-solid fa-chevron-left"></i></button>' +
      '<div><b>' + title + '</b><span>' + sub + '</span></div></header><div class="app-scroll pb gr-body">' + body + '</div></div>';
  }

  var exHost = null, exView = 'market', exTrade = null;

  function openTrade(id, side) {
    exTrade = { id: id, side: side, qty: 1 };
    exView = 'trade';
    renderExchange();
  }
  function back() { exView = 'market'; exTrade = null; renderExchange(); }
  function qty(n) {
    if (!exTrade) return;
    exTrade.qty = Math.max(1, Math.min(9999, exTrade.qty + n));
    renderExchange();
  }

  function confirm() {
    if (!exTrade) return;
    var id = exTrade.id, side = exTrade.side, q = exTrade.qty, p = price(id), total = Math.round(p * q);
    var h = holding(id);
    if (side === 'buy') {
      if (B.cash < total) { LV.toast('Не хватает ' + fmt(total - B.cash)); return; }
      B.cash -= total;
      var oldCost = h.qty * h.avg;
      h.qty += q;
      h.avg = (oldCost + total) / h.qty;
      B.events.unshift({ t: 'stock', text: 'Куплено ' + q + ' ' + id + ' · ' + fmt(total), time: now() });
    } else {
      if (h.qty < q) { LV.toast('Недостаточно акций'); return; }
      B.cash += total;
      h.qty -= q;
      if (h.qty <= 0) { h.qty = 0; h.avg = 0; }
      B.events.unshift({ t: 'stock', text: 'Продано ' + q + ' ' + id + ' · +' + fmt(total), time: now() });
    }
    save();
    LV.toast(side === 'buy' ? 'Куплено · ' + fmt(total) : 'Продано · +' + fmt(total));
    back();
  }
  function now() {
    var d = LV.gameNow ? LV.gameNow() : new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function tradeHTML() {
    var d = def(exTrade.id), p = price(d.id), q = exTrade.qty, total = Math.round(p * q);
    var h = holding(d.id);
    return shell('Биржа', d.name + ' · ' + d.ticker,
      '<div class="gr-card gr-trade"><div class="gr-row"><span class="gr-ava" style="background:' + d.color + '">' + d.ticker.slice(0, 1) + '</span>' +
      '<div class="gr-grow"><b>' + esc(d.name) + '</b><span>' + fmt(p) + ' за акцию</span></div></div>' +
      '<div class="gr-qty"><button type="button" onclick="Exchange.qty(-1)">−</button><b>' + q + '</b><button type="button" onclick="Exchange.qty(1)">+</button></div>' +
      '<div class="gr-total">Итого <b>' + fmt(total) + '</b></div>' +
      '<p class="gr-note">На счету ' + fmt(B.cash) + ' · в портфеле ' + h.qty + ' шт.</p>' +
      '<button class="gr-btn wide" type="button" onclick="Exchange.confirm()">' + (exTrade.side === 'buy' ? 'Купить' : 'Продать') + '</button>' +
      '<button class="gr-btn wide ghost" type="button" onclick="Exchange.back()">Назад</button></div>');
  }

  function renderExchange() {
    if (!exHost) return;
    if (exView === 'trade' && exTrade) { exHost.innerHTML = tradeHTML(); return; }
    var value = portfolioValue(), cost = portfolioCost(), pl = value - cost;
    var cards = DEFS.map(function (d) {
      var p = price(d.id), ch = pct(d.id), h = holding(d.id);
      return '<div class="gr-stock"><div class="gr-stock-head"><span class="gr-ticker" style="background:' + d.color + '">' + d.ticker + '</span>' +
        '<div class="gr-grow"><b>' + esc(d.name) + '</b><span>' + (h.qty ? h.qty + ' шт · ' + fmt(h.qty * p) : 'нет в портфеле') + '</span></div>' +
        '<div class="gr-price"><b>' + fmt(p) + '</b><span class="' + (ch >= 0 ? 'up' : 'down') + '">' + (ch >= 0 ? '+' : '') + ch.toFixed(1) + '%</span></div></div>' +
        sparkline(d.id) +
        '<div class="gr-stock-foot"><button class="gr-btn small" type="button" onclick="Exchange.openTrade(\'' + d.id + '\',\'buy\')">Купить</button>' +
        (h.qty ? '<button class="gr-btn small ghost" type="button" onclick="Exchange.openTrade(\'' + d.id + '\',\'sell\')">Продать</button>' : '') + '</div></div>';
    }).join('');
    var news = ST.news.length ? ST.news.map(function (n) {
      return '<div class="gr-history"><b>' + esc(n.text) + '</b><span>торги</span></div>';
    }).join('') : '<p class="gr-empty">Новостей пока нет.</p>';
    exHost.innerHTML = shell('Биржа', 'LAVKA INVEST',
      '<div class="gr-hero"><span class="gr-kicker">ПОРТФЕЛЬ</span><b>' + fmt(value) + '</b>' +
      '<small>Вложено ' + fmt(cost) + ' · ' + (pl >= 0 ? '+' : '') + fmt(pl) + ' · на счету ' + fmt(B.cash) + '</small></div>' +
      '<div class="gr-sec"><b>Городские компании</b><span>' + DEFS.length + '</span></div>' + cards +
      '<div class="gr-sec"><b>Новости рынка</b><span>live</span></div>' + news +
      '<p class="gr-note">Цены меняются каждые 7 секунд. Дивиденды начисляются в конце смены.</p>');
  }

  LV.registerApp({
    id: 'exchange', name: 'Биржа', icon: 'fa-chart-line', bg: 'linear-gradient(140deg,#0f766e,#0f172a)',
    page: 2, status: 'white', desc: 'Акции и дивиденды',
    visible: function () { return B.level >= 6; },
    mount: function (body) {
      exHost = body;
      exView = 'market';
      exTrade = null;
      ensure();
      stockTick();
      renderExchange();
      var timer = setInterval(stockTick, 7000);
      return function () { exHost = null; clearInterval(timer); };
    }
  });

  window.Exchange = {
    openTrade: openTrade,
    back: back,
    qty: qty,
    confirm: confirm,
    dividend: dividend,
    onShiftEnd: function () { stockTick(); },
    state: ST
  };

  save();
})();
