/* Лавка — маркетплейс */
(function () {
  'use strict';

  var LV = window.LV;
  var S = LV.state;
  var DATA = null;
  var CATS = [];
  var PRODUCTS = [];
  var BY_ID = {};
  var CAT = {};
  var loadPromise = null;
  var bodyEl = null;
  var stack = [];
  var qTimer = null;

  // ---------- data ----------
  function preload() { return ensure().catch(function () {}); }

  function ensure() {
    if (DATA) return Promise.resolve(DATA);
    if (loadPromise) return loadPromise;
    loadPromise = fetch('data/products.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (d) {
        DATA = d;
        CATS = d.categories || [];
        CATS.forEach(function (c) {
          CAT[c.id] = c;
          c.count = 0;
        });
        PRODUCTS = d.products || [];
        PRODUCTS.forEach(function (p) {
          BY_ID[p.id] = p;
          if (CAT[p.cat]) CAT[p.cat].count++;
        });
        return DATA;
      });
    return loadPromise;
  }

  function catName(id) { return (CAT[id] && CAT[id].name) || 'Разное'; }
  function catColor(id) { return (CAT[id] && CAT[id].color) || '#10b981'; }
  function catIcon(id) { return (CAT[id] && CAT[id].icon) || 'fa-tag'; }

  // ---------- витрина бизнеса (завод → Лавка) ----------
  var BIZ_CAT = { id: 'biz', name: 'Мой завод', color: '#b45309', icon: 'fa-industry' };

  function bizListings() {
    try {
      if (window.Biz && Biz.marketListings) return Biz.marketListings() || [];
    } catch (e) {}
    return [];
  }

  function bizProduct(l) {
    var id = -1000 - Number(l.id);
    var p = BY_ID[id];
    if (!p) {
      p = {
        id: id, cat: 'biz', name: l.name,
        desc: 'Товар с вашего завода «Лавка Продакшн». Произведён в Промзоне и отгружается со склада.',
        price: Number(l.price) || 0, oldPrice: 0,
        rating: 5, reviews: Number(l.sold) || 0, sold: Number(l.sold) || 0,
        seller: 'Мой завод · Lavka Production',
        delivery: 2, free: true, stock: Number(l.stock) || 0,
        specs: {}, bizId: Number(l.id)
      };
      BY_ID[id] = p;
    }
    p.name = l.name;
    p.price = Number(l.price) || 0;
    p.stock = Number(l.stock) || 0;
    p.sold = Number(l.sold) || 0;
    p.reviews = p.sold;
    p.bizId = Number(l.id);
    p.specs = { 'Производство': 'Лавка Продакшн', 'Склад': 'Промзона', 'Остаток': p.stock + ' шт.' };
    return p;
  }

  function syncBiz() {
    CAT.biz = BIZ_CAT;
    return bizListings().map(bizProduct);
  }

  function art(p, big) {
    if (!p) return LV.svgArt('#10b981', 'ЛВ', 0, big);
    return LV.svgArt(catColor(p.cat), LV.initials(p.name), p.id, big);
  }

  function disc(p) {
    if (!p.oldPrice || p.oldPrice <= p.price) return 0;
    return Math.round((p.oldPrice - p.price) / p.oldPrice * 100);
  }

  function sortProducts(list, mode) {
    var arr = list.slice();
    if (mode === 'cheap') arr.sort(function (a, b) { return a.price - b.price; });
    else if (mode === 'exp') arr.sort(function (a, b) { return b.price - a.price; });
    else if (mode === 'rating') arr.sort(function (a, b) { return b.rating - a.rating || b.reviews - a.reviews; });
    else if (mode === 'new') arr.sort(function (a, b) { return b.id - a.id; });
    else arr.sort(function (a, b) { return b.sold - a.sold; });
    return arr;
  }

  function stars(r, size) {
    var full = Math.round(Number(r) || 0);
    var s = '';
    for (var i = 1; i <= 5; i++) s += '<i class="fa-' + (i <= full ? 'solid' : 'regular') + ' fa-star"></i>';
    return s;
  }

  // ---------- UI pieces ----------
  function priceHTML(p, cls) {
    return '<span class="price ' + (cls || '') + '">' + LV.fmt(p.price) + '</span>' +
      (p.oldPrice && p.oldPrice > p.price ? '<span class="old">' + LV.fmt(p.oldPrice) + '</span>' : '');
  }

  function favBtn(p, extra) {
    return '<button class="fav-btn' + (LV.isFav(p.id) ? ' on' : '') + '" type="button" data-fav="' + p.id + '" ' +
      'onclick="event.stopPropagation();Market.fav(' + p.id + ',this)" aria-label="В избранное">' +
      '<i class="fa-' + (LV.isFav(p.id) ? 'solid' : 'regular') + ' fa-heart"></i></button>';
  }

  function pcardHTML(p) {
    var d = disc(p);
    return '<div class="pcard" onclick="Market.go(\'product\',{id:' + p.id + '})" role="button" tabindex="0">' +
      (d ? '<span class="disc">−' + d + '%</span>' : '') +
      '<img class="pcard-img" src="' + art(p) + '" alt="' + LV.esc(p.name) + '" loading="lazy">' +
      favBtn(p) +
      '<div class="pcard-body">' +
      '<div class="pcard-name">' + LV.esc(p.name) + '</div>' +
      '<div class="pcard-price">' + priceHTML(p) + '</div>' +
      '<div class="pcard-meta"><i class="fa-solid fa-star"></i>' + Number(p.rating).toFixed(1) + ' · ' + LV.fmtNum(p.reviews) + ' отз.</div>' +
      '</div></div>';
  }

  function hcardHTML(p) {
    return '<div class="hcard" onclick="Market.go(\'product\',{id:' + p.id + '})" role="button" tabindex="0">' +
      '<div class="hcard-art"><img src="' + art(p) + '" alt="' + LV.esc(p.name) + '" loading="lazy">' +
      (disc(p) ? '<span class="disc">−' + disc(p) + '%</span>' : '') + '</div>' +
      '<div class="hcard-name">' + LV.esc(p.name) + '</div>' +
      '<div class="pcard-price">' + priceHTML(p) + '</div>' +
      '<div class="pcard-meta"><i class="fa-solid fa-star"></i>' + Number(p.rating).toFixed(1) + ' · ' + LV.fmtNum(p.sold) + ' купили</div>' +
      '</div>';
  }

  function prowHTML(p) {
    return '<div class="prow" onclick="Market.go(\'product\',{id:' + p.id + '})" role="button" tabindex="0">' +
      '<img class="prow-img" src="' + art(p) + '" alt="' + LV.esc(p.name) + '" loading="lazy">' +
      '<div class="prow-body">' +
      '<div class="prow-name">' + LV.esc(p.name) + '</div>' +
      '<div class="prow-sub">' + LV.esc(p.seller) + ' · рейтинг ' + Number(p.rating).toFixed(1) + '</div>' +
      '<div class="pcard-price">' + priceHTML(p) + '</div>' +
      '</div>' +
      favBtn(p) +
      '</div>';
  }

  function catsChips(active) {
    var biz = bizListings();
    return '<div class="cat-chips">' +
      '<button class="cat-chip' + (!active ? ' on' : '') + '" onclick="Market.tab(\'catalog\')"><span class="cat-dot" style="background:#10b981"><i class="fa-solid fa-border-all"></i></span>Все</button>' +
      (biz.length ? '<button class="cat-chip' + (active === 'biz' ? ' on' : '') + '" onclick="Market.category(\'biz\')"><span class="cat-dot" style="background:' + BIZ_CAT.color + '"><i class="fa-solid ' + BIZ_CAT.icon + '"></i></span>Мой завод</button>' : '') +
      CATS.map(function (c) {
        return '<button class="cat-chip' + (active === c.id ? ' on' : '') + '" onclick="Market.category(\'' + c.id + '\')">' +
          '<span class="cat-dot" style="background:' + c.color + '"><i class="fa-solid ' + c.icon + '"></i></span>' +
          LV.esc(c.name) + '</button>';
      }).join('') + '</div>';
  }

  function bizHomeHTML() {
    var list = syncBiz();
    if (!list.length) return '';
    var revenue = 0, sold = 0;
    list.forEach(function (p) { sold += Number(p.sold) || 0; });
    try { revenue = (LV.state.biz && LV.state.biz.stats && LV.state.biz.stats.revenue) || 0; } catch (e) {}
    return '<div class="mkt-sec"><div class="sec-head"><span class="sec-title">Мой завод</span>' +
      '<button class="sec-more" type="button" onclick="Market.category(\'biz\')">Все товары</button></div>' +
      '<div class="mkt-note" style="margin-bottom:10px"><i class="fa-solid fa-industry"></i> Своё производство · продано ' + LV.fmtNum(sold) + ' шт · выручка ' + LV.fmt(revenue) + '</div>' +
      '<div class="hscroll">' + list.map(hcardHTML).join('') + '</div></div>';
  }

  function bizCategoryHTML(params) {
    var list = syncBiz();
    if (!list.length) {
      return '<div class="empty" style="padding-top:56px"><i class="fa-solid fa-industry"></i>' +
        '<div class="empty-title">Витрина пуста</div>' +
        '<div class="empty-text">Постройте завод в Промзоне, выпустите партию и выставьте товар в Лавку.</div>' +
        '<button class="btn btn-primary" onclick="LV.openApp(\'production\')">Открыть Производство</button></div>';
    }
    return '<div class="cat-hero" style="background:linear-gradient(130deg,#b45309,#7c2d12)">' +
      '<span class="cat-hero-ic"><i class="fa-solid fa-industry"></i></span>' +
      '<div><b>Мой завод</b><span>' + list.length + ' товаров на витрине</span></div></div>' +
      '<div class="mkt-note"><i class="fa-solid fa-store"></i> Это ваши товары — продажи идут на счёт бизнеса</div>' +
      '<div class="pgrid" style="margin-top:10px">' + list.map(pcardHTML).join('') + '</div>' +
      '<div style="padding:16px 14px 4px"><button class="btn btn-block" type="button" onclick="LV.openApp(\'production\')"><i class="fa-solid fa-plus"></i> Выставить ещё</button></div>';
  }

  function cartTotal() {
    var sum = 0, count = 0;
    Object.keys(S.cart).forEach(function (id) {
      var p = BY_ID[id];
      if (!p) return;
      var q = Number(S.cart[id]) || 0;
      sum += p.price * q;
      count += q;
    });
    var delivery = sum === 0 || sum >= 3000 ? 0 : 299;
    return { sum: sum, delivery: delivery, total: sum + delivery, count: count };
  }

  function cartBadgeHTML() {
    var n = LV.cartCount();
    return '<span class="js-cart-badge">' + (n ? '<span class="badge">' + n + '</span>' : '') + '</span>';
  }

  function refreshBadges() {
    if (!bodyEl) return;
    var n = LV.cartCount();
    bodyEl.querySelectorAll('.js-cart-badge').forEach(function (el) {
      el.innerHTML = n ? '<span class="badge">' + n + '</span>' : '';
    });
    LV.renderApps();
  }

  function navHTML(active) {
    var tabs = [
      { id: 'home', name: 'Главная', icon: 'fa-house' },
      { id: 'catalog', name: 'Каталог', icon: 'fa-layer-group' },
      { id: 'cart', name: 'Корзина', icon: 'fa-cart-shopping' },
      { id: 'orders', name: 'Заказы', icon: 'fa-box' }
    ];
    var n = LV.cartCount();
    return '<div class="appnav">' + tabs.map(function (t) {
      return '<button class="nav-item' + (active === t.id ? ' on' : '') + '" type="button" data-mnav="' + t.id + '" onclick="Market.tab(\'' + t.id + '\')">' +
        '<i class="fa-solid ' + t.icon + '"></i>' +
        (t.id === 'cart' && n ? '<span class="badge">' + n + '</span>' : '') +
        '<span>' + t.name + '</span></button>';
    }).join('') + '</div>';
  }

  function sortChips(mode) {
    var opts = [
      ['pop', 'Популярные'], ['cheap', 'Сначала дешёвые'], ['exp', 'Сначала дорогие'],
      ['rating', 'По рейтингу'], ['new', 'Новинки']
    ];
    return '<div class="chips">' + opts.map(function (o) {
      return '<button class="chip' + (mode === o[0] ? ' on' : '') + '" data-sort="' + o[0] + '" onclick="Market.sort(\'' + o[0] + '\')">' + o[1] + '</button>';
    }).join('') + '</div>';
  }

  // ---------- views ----------
  function homeHTML() {
    if (!DATA) {
      return '<form class="mkt-search" id="mkt-search" onsubmit="return Market.searchFromHome(event)">' +
        '<i class="fa-solid fa-magnifying-glass"></i><input id="mkt-q-home" placeholder="Искать в Лавке" autocomplete="off">' +
        '<button class="ms-filter" type="button" onclick="Market.toastSoon()"><i class="fa-solid fa-sliders"></i></button></form>' +
        '<div class="spinner"></div><p class="center tiny muted">Загружаем каталог…</p>';
    }
    var hot = sortProducts(PRODUCTS.filter(function (p) { return p.rating >= 4.6; }), 'pop').slice(0, 10);
    if (hot.length < 10) hot = sortProducts(PRODUCTS, 'pop').slice(0, 10);
    var deals = PRODUCTS.filter(function (p) { return disc(p) > 0; }).sort(function (a, b) { return disc(b) - disc(a); }).slice(0, 6);
    var fresh = PRODUCTS.slice().sort(function (a, b) { return b.id - a.id; }).slice(0, 5);
    var sixCats = CATS.slice(0, 8);

    return '<form class="mkt-search" id="mkt-search" onsubmit="return Market.searchFromHome(event)">' +
      '<i class="fa-solid fa-magnifying-glass"></i>' +
      '<input id="mkt-q-home" placeholder="Искать в Лавке" autocomplete="off">' +
      '<button class="ms-filter" type="button" onclick="Market.tab(\'catalog\')" aria-label="Каталог"><i class="fa-solid fa-sliders"></i></button></form>' +

      '<div class="mkt-hero">' +
      '<h2>Твоя Лавка —<br>твои правила</h2>' +
      '<p>21 категория и 2 100 товаров. Заказывай, продавай, развивай.</p>' +
      '<div class="mkt-hero-row"><button class="hero-btn" type="button" onclick="Market.tab(\'catalog\')">В каталог</button>' +
      '<div class="hero-stat">' + LV.fmtNum(PRODUCTS.length) + ' товаров<br>уже в продаже</div></div></div>' +

      catsChips(null) +

      bizHomeHTML() +

      '<div class="mkt-sec"><div class="sec-head"><span class="sec-title">Подборки</span></div>' +
      '<div class="banners">' +
      '<div class="banner bn1"><span class="bn-tag">ВЫГОДНО</span><b>Скидки до 40% на технику</b><span>Смартфоны, ноутбуки и аксессуары по акции</span></div>' +
      '<div class="banner bn2"><span class="bn-tag">БОНУСЫ</span><b>+5% баллами</b><span>За каждый заказ в Лавке</span></div>' +
      '<div class="banner bn3"><span class="bn-tag">НОВИНКА</span><b>Товары для дома</b><span>Уют начинается с маленьких покупок</span></div>' +
      '</div></div>' +

      '<div class="mkt-sec"><div class="sec-head"><span class="sec-title">Хиты недели</span>' +
      '<button class="sec-more" type="button" onclick="Market.tab(\'catalog\')">Все товары</button></div>' +
      '<div class="hscroll">' + hot.map(hcardHTML).join('') + '</div></div>' +

      '<div class="mkt-sec"><div class="sec-head"><span class="sec-title">Категории</span>' +
      '<button class="sec-more" type="button" onclick="Market.tab(\'catalog\')">Все ' + CATS.length + '</button></div>' +
      '<div class="cat-grid">' + sixCats.map(function (c) {
        return '<button class="cat-card" type="button" onclick="Market.category(\'' + c.id + '\')">' +
          '<span class="cat-ico" style="background:' + c.color + '"><i class="fa-solid ' + c.icon + '"></i></span>' +
          '<span class="cat-info"><b>' + LV.esc(c.name) + '</b><span>' + c.count + ' товаров</span></span></button>';
      }).join('') + '</div></div>' +

      '<div class="mkt-sec"><div class="sec-head"><span class="sec-title">Скидки дня</span>' +
      '<span class="pill green"><i class="fa-solid fa-bolt"></i> −' + (deals[0] ? disc(deals[0]) : 0) + '%</span></div>' +
      '<div class="pgrid">' + deals.map(pcardHTML).join('') + '</div></div>' +

      '<div class="mkt-sec"><div class="sec-head"><span class="sec-title">Новинки</span>' +
      '<button class="sec-more" type="button" onclick="Market.go(\'search\',{q:\'\',sort:\'new\'})">Смотреть</button></div>' +
      fresh.map(prowHTML).join('') + '</div>' +

      '<p class="center tiny muted" style="padding:20px 20px 6px">Лавка · 2026 · Все цены в рублях</p>';
  }

  function catalogHTML() {
    if (!DATA) return '<div class="spinner"></div>';
    return '<div class="mkt-hero" style="background:linear-gradient(125deg,#0f766e,#10b981 60%,#34d399)">' +
      '<h2>Каталог</h2><p>' + CATS.length + ' категорий и ' + LV.fmtNum(PRODUCTS.length) + ' товаров</p>' +
      '<div class="mkt-hero-row"><div class="hero-stat" style="text-align:left">Выбирай категорию<br>или ищи напрямую</div></div></div>' +
      '<div class="mkt-sec" style="margin-top:14px"><div class="sec-head"><span class="sec-title">Все категории</span></div>' +
      '<div class="cat-grid">' + CATS.map(function (c) {
        return '<button class="cat-card" type="button" onclick="Market.category(\'' + c.id + '\')">' +
          '<span class="cat-ico" style="background:' + c.color + '"><i class="fa-solid ' + c.icon + '"></i></span>' +
          '<span class="cat-info"><b>' + LV.esc(c.name) + '</b><span>' + c.count + ' товаров</span></span></button>';
      }).join('') +
      (bizListings().length ? '<button class="cat-card" type="button" onclick="Market.category(\'biz\')">' +
        '<span class="cat-ico" style="background:' + BIZ_CAT.color + '"><i class="fa-solid ' + BIZ_CAT.icon + '"></i></span>' +
        '<span class="cat-info"><b>Мой завод</b><span>' + bizListings().length + ' товаров</span></span></button>' : '') +
      '</div></div>' +
      '<div class="mkt-sec"><div class="sec-head"><span class="sec-title">Популярное</span></div>' +
      '<div class="pgrid">' + sortProducts(PRODUCTS, 'pop').slice(0, 8).map(pcardHTML).join('') + '</div></div>';
  }

  function categoryHTML(params) {
    if (params.id === 'biz') return bizCategoryHTML(params);
    var c = CAT[params.id];
    if (!DATA || !c) return '<div class="spinner"></div>';
    var list = PRODUCTS.filter(function (p) { return p.cat === c.id; });
    var sorted = sortProducts(list, params.sort || 'pop');
    var limit = params.limit || 30;
    return '<div class="cat-hero" style="background:linear-gradient(130deg,' + LV.esc(c.color) + ',' + shadeOf(c.color) + ')">' +
      '<span class="cat-hero-ic"><i class="fa-solid ' + c.icon + '"></i></span>' +
      '<div><b>' + LV.esc(c.name) + '</b><span>' + c.count + ' товаров</span></div></div>' +
      sortChips(params.sort || 'pop') +
      '<div id="mkt-list">' + listHTML(sorted, limit) + '</div>';
  }

  function shadeOf(hex) {
    try {
      var n = parseInt(hex.slice(1), 16);
      var r = Math.max(0, ((n >> 16) & 255) - 55);
      var g = Math.max(0, ((n >> 8) & 255) - 55);
      var b = Math.max(0, (n & 255) - 55);
      return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    } catch (e) { return '#0f172a'; }
  }

  function listHTML(arr, limit) {
    if (!arr.length) return '<div class="empty"><i class="fa-solid fa-magnifying-glass"></i><div class="empty-title">Ничего не нашлось</div><div class="empty-text">Попробуй другой запрос или выбери категорию в каталоге.</div><button class="btn btn-primary" onclick="Market.tab(\'catalog\')">В каталог</button></div>';
    var shown = arr.slice(0, limit);
    return '<div class="mkt-note"><i class="fa-solid fa-box"></i> Найдено: ' + LV.fmtNum(arr.length) + '</div>' +
      '<div class="pgrid" style="margin-top:10px">' + shown.map(pcardHTML).join('') + '</div>' +
      (arr.length > limit ? '<div style="padding:16px 14px 4px"><button class="btn btn-block" type="button" onclick="Market.more()">Показать ещё ' + Math.min(30, arr.length - limit) + '</button></div>' : '') +
      '<div style="height:12px"></div>';
  }

  function searchHTML(params) {
    var q = params.q || '';
    return '<div class="search-wrap">' +
      '<div class="mkt-search" id="mkt-search" style="margin:10px 14px 0">' +
      '<i class="fa-solid fa-magnifying-glass"></i>' +
      '<input id="mkt-q" value="' + LV.esc(q) + '" placeholder="Искать в Лавке" autocomplete="off" oninput="Market.q(this.value)" onkeydown="if(event.key===\'Enter\')Market.searchNow()">' +
      (q ? '<button class="ms-clear" type="button" onclick="Market.clearQ()" aria-label="Очистить"><i class="fa-solid fa-xmark"></i></button>' : '') +
      '</div>' +
      sortChips(params.sort || 'pop') +
      '<div id="mkt-list">' + searchListHTML(params) + '</div></div>';
  }

  function searchListHTML(params) {
    if (!DATA) return '<div class="spinner"></div>';
    var q = (params.q || '').trim().toLowerCase();
    if (!q) {
      var sugg = ['наушники', 'кофемашина', 'кроссовки', 'футболка', 'крем', 'конструктор'];
      return '<div class="mkt-sec"><div class="sec-head"><span class="sec-title">Популярные запросы</span></div>' +
        '<div class="chips" style="flex-wrap:wrap;padding:0 14px">' + sugg.map(function (s) {
          return '<button class="chip" type="button" onclick="Market.quick(\'' + s + '\')">' + s + '</button>';
        }).join('') + '</div></div>' +
        '<div class="mkt-sec"><div class="sec-head"><span class="sec-title">Смотрите также</span></div>' +
        '<div class="cat-grid">' + CATS.slice(0, 6).map(function (c) {
          return '<button class="cat-card" type="button" onclick="Market.category(\'' + c.id + '\')">' +
            '<span class="cat-ico" style="background:' + c.color + '"><i class="fa-solid ' + c.icon + '"></i></span>' +
            '<span class="cat-info"><b>' + LV.esc(c.name) + '</b><span>' + c.count + ' товаров</span></span></button>';
        }).join('') + '</div></div>';
    }
    var words = q.split(/\s+/).filter(Boolean);
    var found = PRODUCTS.filter(function (p) {
      var hay = (p.name + ' ' + p.desc + ' ' + p.seller + ' ' + catName(p.cat)).toLowerCase();
      return words.every(function (w) { return hay.indexOf(w) >= 0; });
    });
    var limit = params.limit || 30;
    if (!found.length) {
      return '<div class="empty"><i class="fa-solid fa-magnifying-glass"></i><div class="empty-title">Ничего не нашлось</div><div class="empty-text">По запросу «' + LV.esc(params.q) + '» товаров нет. Попробуй короче или проверь раскладку.</div><button class="btn" onclick="Market.clearQ()">Очистить поиск</button></div>';
    }
    var sorted = sortProducts(found, params.sort || 'pop');
    return '<div class="mkt-note"><i class="fa-solid fa-box"></i> Найдено: ' + LV.fmtNum(found.length) + ' по запросу «' + LV.esc(params.q) + '»</div>' +
      '<div class="pgrid" style="margin-top:10px">' + sorted.slice(0, limit).map(pcardHTML).join('') + '</div>' +
      (found.length > limit ? '<div style="padding:16px 14px 4px"><button class="btn btn-block" type="button" onclick="Market.more()">Показать ещё</button></div>' : '');
  }

  function productHTML(params) {
    var p = BY_ID[params.id];
    if (!DATA) return '<div class="spinner"></div>';
    if (!p) return '<div class="empty"><div class="empty-title">Товар не найден</div></div>';
    var d = disc(p);
    var revs = p.revs || [];
    var dist = [0, 0, 0, 0, 0];
    revs.forEach(function (r) { if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++; });
    var maxD = Math.max.apply(null, dist.concat([1]));
    var similar = sortProducts(PRODUCTS.filter(function (x) { return x.cat === p.cat && x.id !== p.id; }), 'rating').slice(0, 8);
    var specKeys = Object.keys(p.specs || {});

    return '<div class="prod-wrap">' +
      '<img class="prod-art" src="' + art(p, true) + '" alt="' + LV.esc(p.name) + '">' +
      '<div class="prod-body">' +
      '<div class="prod-title">' + LV.esc(p.name) + '</div>' +
      '<div class="prod-meta"><span><i class="fa-solid fa-star"></i> ' + Number(p.rating).toFixed(1) + '</span>' +
      '<span>·</span><span>' + LV.fmtNum(p.reviews) + ' отзывов</span>' +
      '<span>·</span><span>' + LV.fmtNum(p.sold) + ' продано</span></div>' +
      '<div class="prod-price">' + priceHTML(p) + (d ? '<span class="pill" style="background:#fee2e2;color:#b91c1c">−' + d + '%</span>' : '') + '</div>' +
      '<div class="seller" style="margin-top:12px">' +
      '<span class="seller-ava">' + LV.esc(LV.initials(p.seller)) + '</span>' +
      '<div style="flex:1"><b>' + LV.esc(p.seller) + '</b><span>Проверенный продавец · рейтинг ' + Number(p.rating).toFixed(1) + '</span></div>' +
      '<span class="pill green">' + (p.free ? 'Доставка бесплатно' : 'Доставка ' + LV.fmt(299)) + '</span></div>' +
      '<div class="pill-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' +
      '<span class="pill"><i class="fa-solid fa-truck-fast"></i> ' + (p.delivery === 1 ? 'Завтра' : p.delivery + ' дн.') + '</span>' +
      '<span class="pill"><i class="fa-solid fa-box"></i> ' + (p.stock < 6 ? 'Осталось ' + p.stock + ' шт.' : 'В наличии') + '</span>' +
      '<span class="pill"><i class="fa-solid fa-rotate-left"></i> Возврат 14 дней</span></div>' +
      '<div class="hr"></div>' +
      '<div class="sec-title" style="margin-bottom:8px">Описание</div>' +
      '<p style="font-size:12px;line-height:1.6;color:var(--sub)">' + LV.esc(p.desc) + '</p>' +
      '<div class="hr"></div>' +
      '<div class="sec-title" style="margin-bottom:4px">Характеристики</div>' +
      specKeys.map(function (k) {
        return '<div class="spec"><span>' + LV.esc(k) + '</span><b>' + LV.esc(p.specs[k]) + '</b></div>';
      }).join('') +
      '<div class="hr"></div>' +
      '<div class="sec-head" style="padding:0;margin-bottom:2px"><span class="sec-title">Отзывы</span><span class="tiny muted">' + revs.length + ' из ' + LV.fmtNum(p.reviews) + '</span></div>' +
      '<div class="rate-box"><div class="rate-big">' + Number(p.rating).toFixed(1) + '</div>' +
      '<div class="rate-bars">' + [5, 4, 3, 2, 1].map(function (n) {
        return '<div class="rate-bar"><span>' + n + '</span><div class="track"><div class="fill" style="width:' + Math.round(dist[n - 1] / maxD * 100) + '%"></div></div></div>';
      }).join('') + '</div></div>' +
      (revs.length ? revs.map(function (r) {
        return '<div class="review"><div class="rev-head"><span class="rev-ava">' + LV.esc(LV.initials(r.author)) + '</span>' +
          '<b>' + LV.esc(r.author) + '</b><span>' + LV.dateRu(r.date) + '</span></div>' +
          '<div class="rev-stars">' + stars(r.rating) + '</div>' +
          '<p class="rev-text">' + LV.esc(r.text) + '</p></div>';
      }).join('') : '<p class="tiny muted" style="padding:14px 0">Пока нет отзывов — стань первым.</p>') +
      '<div class="hr"></div>' +
      '<div class="sec-head" style="padding:0"><span class="sec-title">Похожие товары</span>' +
      '<button class="sec-more" type="button" onclick="Market.category(\'' + p.cat + '\')">В категорию</button></div>' +
      '<div class="hscroll" style="padding-left:0;padding-right:0;margin-top:10px">' + similar.map(hcardHTML).join('') + '</div>' +
      '<div style="height:8px"></div></div></div>';
  }

  function productBuyHTML(p) {
    if (!p) return '';
    return '<div class="prod-buy">' +
      favBtn(p) +
      '<div class="pb-price"><b>' + LV.fmt(p.price) + '</b><span>' + (p.free ? 'Бесплатная доставка' : 'Доставка ' + LV.fmt(299)) + '</span></div>' +
      '<button class="btn btn-primary" type="button" style="padding:13px 20px" onclick="Market.add(' + p.id + ')">В корзину</button>' +
      '</div>';
  }

  function cartHTML() {
    if (!DATA) return '<div class="spinner"></div>';
    var ids = Object.keys(S.cart).filter(function (id) { return BY_ID[id] && S.cart[id] > 0; });
    if (!ids.length) {
      return '<div class="empty" style="padding-top:60px"><i class="fa-solid fa-cart-shopping"></i>' +
        '<div class="empty-title">Корзина пуста</div>' +
        '<div class="empty-text">Добавляй товары из каталога — они сохранятся, даже если закрыть приложение.</div>' +
        '<button class="btn btn-primary" onclick="Market.tab(\'catalog\')">Перейти в каталог</button></div>';
    }
    var t = cartTotal();
    return '<div class="cart-list">' + ids.map(function (id) {
      var p = BY_ID[id];
      var q = Number(S.cart[id]) || 1;
      return '<div class="cart-row">' +
        '<img src="' + art(p) + '" alt="' + LV.esc(p.name) + '">' +
        '<div class="cart-info"><div class="cart-name" onclick="Market.go(\'product\',{id:' + p.id + '})">' + LV.esc(p.name) + '</div>' +
        '<div class="tiny muted">' + LV.esc(p.seller) + '</div>' +
        '<div class="cart-bottom"><div class="qty">' +
        '<button type="button" onclick="Market.qty(' + p.id + ',-1)" aria-label="Меньше">−</button>' +
        '<span>' + q + '</span>' +
        '<button type="button" onclick="Market.qty(' + p.id + ',1)" aria-label="Больше">+</button>' +
        '</div><b style="font-size:13.5px;font-weight:900">' + LV.fmt(p.price * q) + '</b></div></div>' +
        '<button class="cart-del" type="button" onclick="Market.remove(' + p.id + ')" aria-label="Удалить"><i class="fa-solid fa-xmark"></i></button>' +
        '</div>';
    }).join('') + '</div>' +
      '<div class="summary">' +
      '<div class="summary-row"><span>Товары (' + t.count + ')</span><b>' + LV.fmt(t.sum) + '</b></div>' +
      '<div class="summary-row"><span>Доставка</span><b>' + (t.delivery ? LV.fmt(t.delivery) : 'Бесплатно') + '</b></div>' +
      '<div class="summary-row"><span>Скидка по акциям</span><b style="color:var(--green-d)">уже в цене</b></div>' +
      '<div class="summary-total"><span>Итого</span><b>' + LV.fmt(t.total) + '</b></div></div>' +
      '<div class="cart-cta"><button class="btn btn-primary btn-block" type="button" onclick="Market.checkout()">Оформить заказ</button>' +
      '<p class="center tiny muted" style="margin-top:9px">Оплата при получении или картой</p></div>';
  }

  function ordersHTML() {
    if (!DATA) return '<div class="spinner"></div>';
    if (!S.orders.length) {
      return '<div class="empty" style="padding-top:60px"><i class="fa-solid fa-box-open"></i>' +
        '<div class="empty-title">Заказов пока нет</div>' +
        '<div class="empty-text">Оформи первый заказ — он появится здесь со статусом и составом.</div>' +
        '<button class="btn btn-primary" onclick="Market.tab(\'home\')">На главную</button></div>';
    }
    return '<div style="height:12px"></div>' + S.orders.map(function (o) {
      var items = o.items || [];
      return '<div class="order-card"><div class="order-top"><b>Заказ ' + LV.esc(o.num) + '</b>' +
        '<span class="status ' + (o.status === 'done' ? 'done' : 'way') + '">' + (o.status === 'done' ? 'Доставлен' : 'В пути') + '</span></div>' +
        '<div class="tiny muted">' + LV.dateFull(o.date) + ' · ' + items.length + ' поз. · ' + LV.esc(o.address) + '</div>' +
        '<div class="order-items">' + items.slice(0, 6).map(function (it) {
          var p = BY_ID[it.id];
          return '<img src="' + art(p) + '" alt="">';
        }).join('') + '</div>' +
        '<div class="order-foot"><span class="tiny muted">' + (items[0] ? LV.esc(items[0].name) : '') + (items.length > 1 ? ' и ещё ' + (items.length - 1) : '') + '</span>' +
        '<b>' + LV.fmt(o.total) + '</b></div>' +
        '<button class="btn btn-sm btn-block" style="margin-top:10px" type="button" onclick="Market.order(' + o.id + ')">Детали заказа</button>' +
        '</div>';
    }).join('');
  }

  function orderHTML(params) {
    var o = null;
    S.orders.forEach(function (x) { if (x.id === params.id) o = x; });
    if (!o) return '<div class="empty"><div class="empty-title">Заказ не найден</div></div>';
    var steps = ['Оформлен', 'Собран', 'В пути', 'Доставлен'];
    var current = o.status === 'done' ? 3 : 2;
    return '<div style="padding:14px">' +
      '<div class="card"><div class="row"><div style="flex:1"><div class="tiny muted">Заказ</div>' +
      '<div style="font-size:18px;font-weight:900;letter-spacing:-.4px">' + LV.esc(o.num) + '</div></div>' +
      '<span class="status ' + (o.status === 'done' ? 'done' : 'way') + '">' + (o.status === 'done' ? 'Доставлен' : 'В пути') + '</span></div>' +
      '<div class="hr"></div><div class="row"><i class="fa-solid fa-location-dot muted"></i><div class="tiny" style="color:var(--sub);line-height:1.5">' + LV.esc(o.address) + '</div></div>' +
      '<div class="row" style="margin-top:8px"><i class="fa-solid fa-credit-card muted"></i><div class="tiny" style="color:var(--sub)">' + LV.esc(o.pay || 'Картой при получении') + '</div></div>' +
      '<div class="row" style="margin-top:8px"><i class="fa-regular fa-calendar muted"></i><div class="tiny" style="color:var(--sub)">Оформлен ' + LV.dateFull(o.date) + '</div></div></div>' +

      '<div class="card" style="margin-top:10px">' + steps.map(function (s, i) {
        var on = i <= current;
        return '<div class="tl-row"><span class="tl-dot' + (on ? ' on' : '') + '">' + (on ? '<i class="fa-solid fa-check"></i>' : '') + '</span>' +
          '<span class="tl-name' + (on ? ' on' : '') + '">' + s + '</span>' +
          '<span class="tiny muted">' + (i === 0 ? LV.dateRu(o.date) : on ? 'выполнено' : 'ожидается') + '</span></div>';
      }).join('') + '</div>' +

      '<div class="card" style="margin-top:10px">' +
      (o.items || []).map(function (it) {
        var p = BY_ID[it.id];
        return '<div class="order-line"><img src="' + art(p) + '" alt=""><div style="flex:1;min-width:0"><div class="order-line-name">' + LV.esc(it.name) + '</div>' +
          '<div class="tiny muted">' + it.qty + ' × ' + LV.fmt(it.price) + '</div></div><b>' + LV.fmt(it.qty * it.price) + '</b></div>';
      }).join('') +
      '<div class="summary-row" style="margin-top:8px"><span>Доставка</span><b>' + (o.delivery ? LV.fmt(o.delivery) : 'Бесплатно') + '</b></div>' +
      '<div class="summary-total"><span>Итого</span><b>' + LV.fmt(o.total) + '</b></div></div>' +
      '<button class="btn btn-block" style="margin-top:12px" type="button" onclick="Market.tab(\'orders\')">Ко всем заказам</button>' +
      '<div style="height:20px"></div></div>';
  }

  function favHTML() {
    if (!DATA) return '<div class="spinner"></div>';
    var list = S.fav.map(function (id) { return BY_ID[id]; }).filter(Boolean);
    if (!list.length) {
      return '<div class="empty" style="padding-top:60px"><i class="fa-regular fa-heart"></i>' +
        '<div class="empty-title">В избранном пусто</div>' +
        '<div class="empty-text">Нажимай на сердечко в карточке товара — всё сохранится здесь.</div>' +
        '<button class="btn btn-primary" onclick="Market.tab(\'catalog\')">В каталог</button></div>';
    }
    return '<div style="height:12px"></div><div class="mkt-note"><i class="fa-solid fa-heart" style="color:#ef4444"></i> ' + list.length + ' товаров в избранном</div>' +
      '<div class="pgrid" style="margin-top:10px" id="fav-grid">' + list.map(pcardHTML).join('') + '</div><div style="height:20px"></div>';
  }

  function doneHTML(params) {
    var o = null;
    S.orders.forEach(function (x) { if (x.id === params.id) o = x; });
    return '<div class="success-box" style="padding-top:40px">' +
      '<div class="success-ico"><i class="fa-solid fa-check"></i></div>' +
      '<div style="font-size:19px;font-weight:900;letter-spacing:-.4px">Заказ оформлен</div>' +
      '<p class="tiny muted" style="margin-top:6px">' + (o ? 'Номер ' + LV.esc(o.num) + ' · ' + LV.fmt(o.total) : '') + '</p>' +
      '<p class="tiny muted" style="margin-top:3px">' + (o ? 'Доставка: ' + LV.dateRu(o.date) + ' — ' + LV.esc(o.address) : '') + '</p>' +
      '<div style="padding:22px 14px 0"><button class="btn btn-primary btn-block" type="button" onclick="Market.tab(\'orders\')">Мои заказы</button>' +
      '<button class="btn btn-block" style="margin-top:8px" type="button" onclick="Market.tab(\'home\')">Продолжить покупки</button></div></div>';
  }

  // ---------- chrome ----------
  function viewBody() {
    syncBiz();
    var cur = stack[stack.length - 1] || { name: 'home', params: {} };
    var p = cur.params || {};
    switch (cur.name) {
      case 'catalog': return catalogHTML();
      case 'category': return categoryHTML(p);
      case 'search': return searchHTML(p);
      case 'product': return productHTML(p);
      case 'cart': return cartHTML();
      case 'orders': return ordersHTML();
      case 'order': return orderHTML(p);
      case 'fav': return favHTML();
      case 'done': return doneHTML(p);
      default: return homeHTML();
    }
  }

  function isRoot(name) {
    return name === 'home' || name === 'catalog' || name === 'cart' || name === 'orders';
  }

  function titleFor(cur) {
    if (cur.name === 'catalog') return 'Каталог';
    if (cur.name === 'cart') return 'Корзина';
    if (cur.name === 'orders') return 'Заказы';
    if (cur.name === 'category') return catName(cur.params.id);
    if (cur.name === 'search') return 'Поиск';
    if (cur.name === 'product') return 'Товар';
    if (cur.name === 'order') return 'Заказ';
    if (cur.name === 'fav') return 'Избранное';
    if (cur.name === 'done') return 'Готово';
    return 'Лавка';
  }

  function render() {
    if (!bodyEl) return;
    var cur = stack[stack.length - 1] || { name: 'home', params: {} };
    var showBrand = cur.name === 'home' || cur.name === 'catalog';
    var showNav = isRoot(cur.name) || cur.name === 'category';

    var left = '<button class="ab-btn" type="button" data-mback aria-label="' + (stack.length > 1 ? 'Назад' : 'Закрыть') + '">' +
      '<i class="fa-solid fa-chevron-left"></i></button>';
    if (showBrand) {
      left += '<div class="mkt-brand"><span class="mkt-logo">Л</span><div class="mkt-brand-txt"><b>Лавка</b><span>маркетплейс</span></div></div>';
    } else {
      left += '<div class="ab-title">' + LV.esc(titleFor(cur)) + '</div>';
    }

    var appbarHTML = '<div class="appbar mkt-bar">' + left +
      '<button class="mkt-ibtn" type="button" onclick="Market.tab(\'cart\')" aria-label="Корзина">' +
      '<i class="fa-solid fa-cart-shopping"></i>' + cartBadgeHTML() + '</button></div>';

    var html = appbarHTML +
      '<div class="app-scroll mkt-scroll" id="mkt-scroll">' + viewBody() + '</div>' +
      (cur.name === 'product' ? productBuyHTML(BY_ID[cur.params.id]) : '') +
      (showNav ? navHTML(cur.name) : '');

    bodyEl.innerHTML = html;
    var sc = document.getElementById('mkt-scroll');
    if (sc && cur.name !== 'search') sc.scrollTop = 0;
  }

  // ---------- navigation ----------
  var readyHooked = false;
  function whenReady() {
    if (DATA || readyHooked) return;
    readyHooked = true;
    ensure().then(function () {
      readyHooked = false;
      if (bodyEl) render();
    }).catch(function () { readyHooked = false; });
  }

  function tab(name) {
    stack = [{ name: name, params: {} }];
    render();
    whenReady();
  }

  function category(id) {
    stack.push({ name: 'category', params: { id: id, sort: 'pop', limit: 30 } });
    render();
    whenReady();
  }

  function go(name, params) {
    var cur = stack[stack.length - 1];
    if (cur && cur.name === name && name === 'search') {
      cur.params = Object.assign(cur.params || {}, params || {});
      render();
      return;
    }
    stack.push({ name: name, params: params || {} });
    render();
    whenReady();
  }

  function back() {
    if (stack.length > 1) {
      stack.pop();
      render();
    } else if (stack[0] && stack[0].name !== 'home') {
      tab('home');
    } else {
      LV.closeApp();
    }
  }

  function rerenderList() {
    var cur = stack[stack.length - 1];
    if (!cur) return;
    var host = document.getElementById('mkt-list');
    if (!host) return;
    if (cur.name === 'search') host.innerHTML = searchListHTML(cur.params);
    else if (cur.name === 'category') {
      var list = PRODUCTS.filter(function (p) { return p.cat === cur.params.id; });
      host.innerHTML = listHTML(sortProducts(list, cur.params.sort || 'pop'), cur.params.limit || 30);
    } else if (cur.name === 'fav') {
      host.innerHTML = favHTML();
    }
  }

  function setSort(mode) {
    var cur = stack[stack.length - 1];
    if (!cur) return;
    cur.params.sort = mode;
    cur.params.limit = 30;
    document.querySelectorAll('[data-sort]').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-sort') === mode);
    });
    rerenderList();
  }

  function more() {
    var cur = stack[stack.length - 1];
    if (!cur) return;
    cur.params.limit = (cur.params.limit || 30) + 30;
    rerenderList();
  }

  // ---------- actions ----------
  function add(id) {
    id = Number(id);
    S.cart[id] = (S.cart[id] || 0) + 1;
    LV.save();
    refreshBadges();
    LV.toast('Добавлено в корзину');
  }

  function qty(id, d) {
    id = String(id);
    if (!S.cart[id]) return;
    S.cart[id] = Number(S.cart[id]) + d;
    if (S.cart[id] <= 0) delete S.cart[id];
    LV.save();
    refreshBadges();
    render();
  }

  function remove(id) {
    delete S.cart[String(id)];
    LV.save();
    refreshBadges();
    render();
    LV.toast('Товар удалён');
  }

  function fav(id, el) {
    LV.toggleFav(id);
    var on = LV.isFav(id);
    if (el) {
      el.classList.toggle('on', on);
      el.innerHTML = '<i class="fa-' + (on ? 'solid' : 'regular') + ' fa-heart"></i>';
    }
    document.querySelectorAll('[data-fav="' + id + '"]').forEach(function (b) {
      b.classList.toggle('on', on);
      b.innerHTML = '<i class="fa-' + (on ? 'solid' : 'regular') + ' fa-heart"></i>';
    });
    var cur = stack[stack.length - 1];
    if (cur && cur.name === 'fav' && !on) rerenderList();
  }

  function searchFromHome(e) {
    if (e) e.preventDefault();
    var inp = document.getElementById('mkt-q-home');
    var q = inp ? inp.value.trim() : '';
    go('search', { q: q, sort: 'pop' });
    return false;
  }

  function quick(q) {
    var cur = stack[stack.length - 1];
    if (cur && cur.name === 'search') { cur.params.q = q; render(); }
    else go('search', { q: q });
  }

  function qInput(v) {
    var cur = stack[stack.length - 1];
    if (!cur || cur.name !== 'search') return;
    cur.params.q = v;
    cur.params.limit = 30;
    clearTimeout(qTimer);
    qTimer = setTimeout(function () {
      var host = document.getElementById('mkt-list');
      if (host) host.innerHTML = searchListHTML(cur.params);
      var clr = document.querySelector('#mkt-search .ms-clear');
      if (clr) clr.style.display = v ? '' : 'none';
    }, 200);
  }

  function searchNow() {
    clearTimeout(qTimer);
    var inp = document.getElementById('mkt-q');
    var cur = stack[stack.length - 1];
    if (!cur) return;
    if (inp) cur.params.q = inp.value;
    rerenderList();
  }

  function clearQ() {
    var cur = stack[stack.length - 1];
    if (!cur) return;
    cur.params.q = '';
    render();
  }

  function toastSoon() { LV.toast('Скоро добавим фильтры'); }

  // ---------- checkout ----------
  function payOptionsHTML() {
    if (window.Bank && Bank.linked) {
      var h = '<div class="pay-opt on" data-pay="bank:balance" onclick="Market.payPick(this)"><i class="fa-solid fa-building-columns"></i> BankFake · счёт · ' + LV.fmt(Bank.balance) + '</div>';
      (Bank.cards || []).forEach(function (c) {
        var bal = c.isGold ? '' : ' · ' + LV.fmt(c.balance);
        h += '<div class="pay-opt" data-pay="bank:' + c.id + '" onclick="Market.payPick(this)"><i class="fa-solid fa-credit-card"></i> ' + LV.esc(Bank.cardLabel(c)) + bal + '</div>';
      });
      h += '<div class="pay-opt" data-pay="Наличными курьеру" onclick="Market.payPick(this)"><i class="fa-solid fa-money-bill-wave"></i> Наличными курьеру</div>';
      return h;
    }
    return '<div class="pay-opt on" data-pay="Картой при получении" onclick="Market.payPick(this)"><i class="fa-solid fa-credit-card"></i> Картой при получении</div>' +
      '<div class="pay-opt" data-pay="СБП" onclick="Market.payPick(this)"><i class="fa-solid fa-mobile-screen"></i> СБП</div>' +
      '<div class="pay-opt" data-pay="Наличными курьеру" onclick="Market.payPick(this)"><i class="fa-solid fa-money-bill-wave"></i> Наличными курьеру</div>';
  }

  async function checkout() {
    var t = cartTotal();
    if (!t.count) return;
    if (window.Bank && Bank.reload) { try { await Bank.reload(); } catch (e) {} }
    var bankOn = !!(window.Bank && Bank.linked);
    var mask = document.createElement('div');
    mask.className = 'sheet-mask';
    mask.id = 'mkt-sheet';
    mask.innerHTML = '<div class="sheet" onclick="event.stopPropagation()">' +
      '<div class="sheet-grab"></div>' +
      '<h3>Оформление заказа</h3>' +
      '<p class="sub">' + (bankOn
        ? 'Оплата спишется с выбранного счёта BankFake. Это симулятор — реальные деньги не используются.'
        : 'Проверь адрес и выбери способ оплаты. Это симулятор — деньги не списываются.') + '</p>' +
      '<div style="font-size:11px;font-weight:800;color:var(--muted);margin-bottom:6px">КУДА ДОСТАВИТЬ</div>' +
      '<input class="field" id="ord-city" value="Москва" placeholder="Город" style="margin-bottom:8px">' +
      '<input class="field" id="ord-street" value="Тверская, 12" placeholder="Улица и дом" style="margin-bottom:8px">' +
      '<div style="display:flex;gap:8px;margin-bottom:12px">' +
      '<input class="field" id="ord-apt" value="45" placeholder="Кв." style="width:100px">' +
      '<input class="field" id="ord-phone" value="+7 900 000-00-00" placeholder="Телефон">' +
      '</div>' +
      '<div style="font-size:11px;font-weight:800;color:var(--muted);margin-bottom:6px">ОПЛАТА</div>' +
      payOptionsHTML() +
      '<div class="xid-note" style="margin:2px 0 10px"><i class="fa-solid fa-fingerprint"></i><div><b style="display:block;font-size:10.5px">XPRODC ID</b>' +
      (S.user.xid ? LV.esc(S.user.xid) + ' · ' + (bankOn ? 'BankFake подключён' : 'аккаунт подтверждён') : 'Не подключён — войдите, чтобы оформить заказ') + '</div></div>' +
      '<div class="summary" style="margin:12px 0 10px;padding:12px">' +
      '<div class="summary-row"><span>Товары (' + t.count + ')</span><b>' + LV.fmt(t.sum) + '</b></div>' +
      '<div class="summary-row"><span>Доставка</span><b>' + (t.delivery ? LV.fmt(t.delivery) : 'Бесплатно') + '</b></div>' +
      '<div class="summary-total"><span>Итого</span><b>' + LV.fmt(t.total) + '</b></div></div>' +
      '<button class="btn btn-primary btn-block" type="button" id="ord-submit" onclick="Market.placeOrder()">' +
      (S.user.xid ? 'Подтвердить заказ · ' + LV.fmt(t.total) : 'Войти в XPRODC ID и заказать') + '</button>' +
      '<button class="btn btn-block" style="margin-top:8px" type="button" onclick="Market.closeSheet()">Отмена</button>' +
      '</div>';
    mask.addEventListener('click', function (e) { if (e.target === mask) closeSheet(); });
    bodyEl.appendChild(mask);
  }

  function payPick(el) {
    document.querySelectorAll('#mkt-sheet .pay-opt').forEach(function (x) { x.classList.remove('on'); });
    el.classList.add('on');
  }

  function closeSheet() {
    var m = document.getElementById('mkt-sheet');
    if (m) m.remove();
  }

  async function placeOrder() {
    var t = cartTotal();
    if (!t.count) return;
    if (!S.user.xid) {
      closeSheet();
      LV.toast('Войдите в XPRODC ID, чтобы оформить заказ');
      if (window.XID) XID.open();
      return;
    }
    var city = (document.getElementById('ord-city') || {}).value || 'Москва';
    var street = (document.getElementById('ord-street') || {}).value || '';
    var apt = (document.getElementById('ord-apt') || {}).value || '';
    var payEl = document.querySelector('#mkt-sheet .pay-opt.on');
    var paySrc = payEl ? payEl.getAttribute('data-pay') : 'Картой при получении';
    var payLabel = paySrc;
    var items = Object.keys(S.cart).map(function (id) {
      var p = BY_ID[id];
      return {
        id: Number(id), name: p ? p.name : 'Товар', cat: p ? p.cat : '',
        price: p ? p.price : 0, qty: Number(S.cart[id]), biz: p && p.bizId ? p.bizId : 0
      };
    }).filter(function (x) { return x.qty > 0; });
    var bizItems = items.filter(function (x) { return x.biz > 0; });
    if (bizItems.length && window.Biz && Biz.checkStock) {
      var out = bizItems.filter(function (x) { return !Biz.checkStock(x.biz, x.qty); })[0];
      if (out) {
        delete S.cart[String(out.id)];
        LV.save();
        refreshBadges();
        closeSheet();
        render();
        LV.toast('«' + out.name + '» уже разобрали — товар убран из корзины');
        return;
      }
    }
    if (paySrc.indexOf('bank:') === 0) {
      if (!window.Bank || !Bank.linked) {
        LV.toast('BankFake не подключён');
        return;
      }
      var btn = document.getElementById('ord-submit');
      if (btn) { btn.disabled = true; btn.textContent = 'Оплата…'; }
      var res = await Bank.pay(t.total, paySrc.slice(5));
      if (btn) { btn.disabled = false; btn.textContent = 'Подтвердить заказ · ' + LV.fmt(t.total); }
      if (!res || !res.ok) {
        var reason = res && res.reason;
        LV.toast(reason === 'funds' ? 'Недостаточно средств на выбранном счёте'
          : reason === 'blocked' ? 'Карта заблокирована'
            : 'Не удалось оплатить с BankFake');
        return;
      }
      payLabel = 'BankFake · ' + res.label;
    }
    var order = {
      id: Date.now(),
      num: 'LV-' + String(100000 + Math.floor(Math.random() * 899999)),
      date: LV.todayISO(),
      address: city + ', ' + street + (apt ? ', кв. ' + apt : ''),
      pay: payLabel,
      xid: S.user.xid || '',
      items: items,
      total: t.total,
      delivery: t.delivery,
      status: 'way'
    };
    S.orders.unshift(order);
    S.cart = {};
    LV.save();
    if (bizItems.length && window.Biz && Biz.fulfill) {
      Biz.fulfill(bizItems);
      syncBiz();
    }
    refreshBadges();
    closeSheet();
    stack = [{ name: 'done', params: { id: order.id } }];
    render();
    LV.toast('Заказ ' + order.num + ' оформлен');
  }

  // ---------- mount ----------
  function mount(body) {
    bodyEl = body;
    stack = [{ name: 'home', params: {} }];
    render();
    ensure().then(function () {
      if (bodyEl === body) {
        var cur = stack[stack.length - 1];
        if (cur && cur.name === 'home') render();
      }
    }).catch(function () {
      if (bodyEl === body) {
        body.innerHTML = '<div class="empty" style="padding-top:80px"><i class="fa-solid fa-plug-circle-xmark"></i>' +
          '<div class="empty-title">Каталог не загрузился</div>' +
          '<div class="empty-text">Проверь подключение и попробуй снова. Файл data/products.json должен быть рядом с index.html.</div>' +
          '<button class="btn btn-primary" onclick="location.reload()">Повторить</button></div>';
      }
    });
    return function () { bodyEl = null; closeSheet(); clearTimeout(qTimer); };
  }

  // ---------- registration ----------
  LV.registerApp({
    id: 'market',
    name: 'Лавка',
    icon: 'fa-bag-shopping',
    bg: 'linear-gradient(140deg,#10b981,#047857)',
    page: null,
    dock: true,
    mount: mount
  });

  window.Market = {
    preload: preload,
    ensure: ensure,
    go: go,
    tab: tab,
    category: category,
    back: back,
    order: function (id) { go('order', { id: id }); },
    sort: setSort,
    more: more,
    add: add,
    qty: qty,
    remove: remove,
    fav: fav,
    checkout: checkout,
    payPick: payPick,
    closeSheet: closeSheet,
    placeOrder: placeOrder,
    searchFromHome: searchFromHome,
    qInput: qInput,
    q: qInput,
    searchNow: searchNow,
    clearQ: clearQ,
    quick: quick,
    toastSoon: toastSoon,
    product: function (id) { return BY_ID[id]; }
  };

  // делегирование: назад внутри маркетплейса
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-mback]')) { e.preventDefault(); Market.back(); }
  });

  // свайп назад
  document.addEventListener('touchstart', function (e) {
    if (!bodyEl || !e.touches.length) return;
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
  }, { passive: true });
  var touchX = 0, touchY = 0;
  document.addEventListener('touchend', function (e) {
    if (!bodyEl) return;
    var t = e.changedTouches[0];
    if (!t) return;
    var dx = t.clientX - touchX, dy = t.clientY - touchY;
    if (dx > 90 && Math.abs(dx) > Math.abs(dy) * 2 && touchX < 60) back();
  }, { passive: true });
})();
