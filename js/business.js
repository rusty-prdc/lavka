/* Lavka Business — Job, Производство, Телефон, Карта города и сюжет */
(function () {
  'use strict';

  var LV = window.LV;
  if (!LV) return;
  var S = LV.state;
  var esc = LV.esc;
  var fmt = LV.fmt;

  // ============================================================
  // СОСТОЯНИЕ
  // ============================================================
  var START_STOCK = 40;
  var DEFAULTS = {
    cash: 30000,
    level: 1, xp: 0,
    points: [], staff: [], factory: null,
    licenses: { alcohol: false, weapon: false },
    credit: { score: 50, loans: [], taken: 0 },
    auto: { on: false, left: 0 },
    nextId: 0,
    installed: { job: false, production: false },
    story: { step: 0, flags: {}, sms: [], calls: [], taxi: 0 },
    stats: { orders: 0, revenue: 0, shifts: 0, sold: 0, missed: 0, rating: 4.8 },
    events: []
  };
  if (!S.biz) S.biz = JSON.parse(JSON.stringify(DEFAULTS));
  (function merge(def, tgt) {
    Object.keys(def).forEach(function (k) {
      if (tgt[k] === undefined) tgt[k] = JSON.parse(JSON.stringify(def[k]));
      else if (def[k] && typeof def[k] === 'object' && !Array.isArray(def[k]) && typeof tgt[k] === 'object') merge(def[k], tgt[k]);
    });
  })(DEFAULTS, S.biz);
  var B = S.biz;
  B.story = B.story || { step: 0, flags: {}, sms: [], calls: [], taxi: 0 };
  B.story.flags = B.story.flags || {};
  B.story.sms = B.story.sms || [];
  B.credit.loans = B.credit.loans || [];
  if (B.credit.active) { B.credit.loans.push(B.credit.active); B.credit.active = null; }
  B.points.forEach(function (p) { if (p.stock == null) p.stock = START_STOCK; });

  function save() { try { LV.save(); } catch (e) {} }
  function nowTime() {
    var d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function toast(m) { LV.toast(m); }

  function isX8() {
    var u = (S && S.user) || {};
    var norm = function (v) { return String(v || '').trim().replace(/^@/, '').toUpperCase(); };
    var id = norm(u.xid), nm = norm(u.name);
    if (id === 'X-8' || nm === 'X-8') return true;
    return !id;
  }

  // ============================================================
  // ДАННЫЕ
  // ============================================================
  var MAX_LEVEL = 30;
  var XP_LEVELS = [0, 60, 150, 280, 440, 630, 850, 1100, 1380, 1700,
    2050, 2430, 2840, 3280, 3750, 4250, 4780, 5340, 5930, 6550,
    7200, 7880, 8590, 9330, 10100, 10900, 11730, 12590, 13480, 14400];

  var DIST = {
    center: { name: 'Центр', color: '#d9a441', mult: 1.2, x: 34, y: 36, w: 28, h: 24, icon: 'fa-building' },
    elite: { name: 'Элита', color: '#8b5cf6', mult: 1.6, x: 6, y: 8, w: 26, h: 22, icon: 'fa-gem' },
    sleep: { name: 'Спальный', color: '#22c55e', mult: 1.0, x: 64, y: 8, w: 30, h: 24, icon: 'fa-house' },
    park: { name: 'Парк', color: '#16a34a', mult: 0.9, x: 6, y: 62, w: 30, h: 26, icon: 'fa-tree' },
    industrial: { name: 'Промзона', color: '#64748b', mult: 0.8, x: 64, y: 62, w: 30, h: 26, icon: 'fa-industry' },
    station: { name: 'Вокзал', color: '#0ea5e9', mult: 1.1, x: 6, y: 36, w: 24, h: 20, icon: 'fa-train' },
    hospital: { name: 'Больница', color: '#ef4444', mult: 1, x: 40, y: 6, w: 20, h: 18, icon: 'fa-hospital' },
    taxi: { name: 'Таксопарк', color: '#f59e0b', mult: 1, x: 74, y: 38, w: 20, h: 16, icon: 'fa-taxi' }
  };

  var TYPES = {
    pvz: { name: 'Пункт выдачи', cost: 25000, rent: 900, avg: 240, base: 30, icon: 'fa-box', color: '#10b981', desc: 'Выдача, примерочная, кофейня' },
    kiosk: { name: 'Ларёк', cost: 45000, rent: 1200, avg: 300, base: 18, icon: 'fa-store', color: '#f59e0b', desc: 'Мелкие покупки у дома' },
    shop: { name: 'Магазин', cost: 120000, rent: 3000, avg: 650, base: 42, icon: 'fa-shop', color: '#0ea5e9', desc: 'Полноценный магазин' },
    cafe: { name: 'Кофейня', cost: 70000, rent: 1800, avg: 450, base: 26, icon: 'fa-mug-hot', color: '#b45309', desc: 'Кофе и выпечка', level: 3 },
    barbershop: { name: 'Барбершоп', cost: 90000, rent: 2200, avg: 550, base: 30, icon: 'fa-scissors', color: '#f59e0b', desc: 'Стрижки и уход', level: 4 },
    carwash: { name: 'Автомойка', cost: 110000, rent: 2600, avg: 700, base: 34, icon: 'fa-car-side', color: '#0ea5e9', desc: 'Мойка и детейлинг', level: 5 },
    pcclub: { name: 'ПК-клуб', cost: 150000, rent: 3500, avg: 500, base: 40, icon: 'fa-gamepad', color: '#6366f1', desc: 'Компьютеры, турниры, бар', level: 6 },
    alcohol: { name: 'Алкомаркет', cost: 180000, rent: 4200, avg: 900, base: 56, icon: 'fa-wine-bottle', color: '#a855f7', desc: 'Алкоголь и напитки', license: 'alcohol', level: 7 },
    pharmacy: { name: 'Аптека', cost: 170000, rent: 3800, avg: 800, base: 44, icon: 'fa-capsules', color: '#10b981', desc: 'Лекарства и здоровье', level: 8 },
    gym: { name: 'Спортзал', cost: 220000, rent: 4500, avg: 900, base: 50, icon: 'fa-dumbbell', color: '#ef4444', desc: 'Тренажёры и абонементы', level: 9 },
    boutique: { name: 'Бутик', cost: 240000, rent: 4800, avg: 1100, base: 54, icon: 'fa-shirt', color: '#ec4899', desc: 'Одежда и аксессуары', level: 10 },
    electronics: { name: 'Электроника', cost: 280000, rent: 5200, avg: 1300, base: 58, icon: 'fa-mobile-screen', color: '#3b82f6', desc: 'Техника и гаджеты', level: 11 },
    weapon: { name: 'Оружейный', cost: 320000, rent: 6800, avg: 1700, base: 72, icon: 'fa-crosshairs', color: '#ef4444', desc: 'Оружие и снаряжение', license: 'weapon', level: 12 },
    cinema: { name: 'Кинотеатр', cost: 520000, rent: 9500, avg: 1600, base: 66, icon: 'fa-film', color: '#8b5cf6', desc: 'Фильмы и попкорн', level: 15 },
    hotel: { name: 'Отель', cost: 950000, rent: 16000, avg: 3200, base: 74, icon: 'fa-hotel', color: '#06b6d4', desc: 'Номера и сервис', level: 18 },
    autosalon: { name: 'Автосалон', cost: 1600000, rent: 26000, avg: 6500, base: 82, icon: 'fa-car', color: '#f97316', desc: 'Новые и подержанные авто', level: 22 },
    mall: { name: 'ТРЦ', cost: 3000000, rent: 48000, avg: 12000, base: 92, icon: 'fa-building', color: '#64748b', desc: 'Целый торговый центр', level: 26 }
  };
  var MAP_KIND = {
    cafe: 'cup', barbershop: 'scissors', carwash: 'car', pcclub: 'pc', pharmacy: 'cross',
    gym: 'dumbbell', boutique: 'shirt', electronics: 'phone', cinema: 'film',
    hotel: 'house', autosalon: 'car', mall: 'shop'
  };

  var SPOTS = (window.CityMap && window.CityMap.SPOTS) || {};
  var LEGACY_SPOT = { center: 'center1', station: 'station', sleep: 'sleep2', elite: 'elite', park: 'park', industrial: 'industrial' };
  function spotOf(p) { return (p && p.spot) || LEGACY_SPOT[p && p.district] || 'center1'; }
  function spotInfo(p) {
    var s = SPOTS[spotOf(p)] || {};
    return { name: s.name || 'Точка', area: s.area || '', mult: s.mult || 1 };
  }
  function pointAtSpot(id) {
    return B.points.filter(function (p) { return spotOf(p) === id; })[0];
  }
  function pointStock(p) { return p.stock == null ? START_STOCK : p.stock; }

  var STAFF_POOL = [
    { id: 'c1', name: 'Игорь', role: 'Продавец', salary: 1200, eff: 0.12, ini: 'И', color: '#0ea5e9' },
    { id: 'c2', name: 'Настя', role: 'Менеджер', salary: 1800, eff: 0.2, ini: 'Н', color: '#ec4899' },
    { id: 'c3', name: 'Тимур', role: 'Курьер', salary: 900, eff: 0.08, ini: 'Т', color: '#16a34a' },
    { id: 'c4', name: 'Лена', role: 'Кассир', salary: 1000, eff: 0.1, ini: 'Л', color: '#f59e0b' }
  ];

  var PLOT_NUMBER = '+7 099 328-22-23';
  var PLOT_ID = 'plot';

  var GOV_NUMBER = '+7 099 000-00-01';
  var LICENSES = {
    alcohol: { name: 'Алкоголь', level: 7, fee: 60000 },
    weapon: { name: 'Оружие', level: 12, fee: 150000, requires: 'alcohol' }
  };

  var CONTACTS = {
    maks: { name: 'Макс', number: '+7 999 120-45-67', ini: 'М', color: '#0ea5e9', kind: 'friend' },
    mom: { name: 'Мама', number: '+7 916 555-01-24', ini: 'М', color: '#ec4899', kind: 'family' },
    dad: { name: 'Папа', number: '+7 916 555-77-02', ini: 'П', color: '#f59e0b', kind: 'family' },
    taxi: { name: 'Такси Лавка', number: '+7 800 555-35-35', ini: 'Т', color: '#facc15', kind: 'taxi' },
    gov: { name: 'Правительство', number: GOV_NUMBER, ini: 'П', color: '#64748b', kind: 'gov' }
  };

  function levelForXp(x) {
    var l = 1;
    for (var i = 0; i < XP_LEVELS.length; i++) if (x >= XP_LEVELS[i]) l = i + 1;
    return Math.min(MAX_LEVEL, l);
  }
  function nextXp() { return B.level >= MAX_LEVEL ? 0 : XP_LEVELS[B.level]; }
  function typeUnlocked(t) {
    var ty = TYPES[t];
    if (!ty) return false;
    if (ty.license) return !!B.licenses[ty.license] && B.level >= (ty.level || 1);
    if (ty.level) return B.level >= ty.level;
    if (t === 'pvz') return true;
    if (t === 'kiosk') return !!B.story.flags.contract;
    if (t === 'shop') return B.level >= 5;
    return false;
  }
  function typeLockReason(t) {
    var ty = TYPES[t];
    if (!ty) return '';
    if (ty.license && !B.licenses[ty.license]) return 'нужна лицензия';
    if (ty.level && B.level < ty.level) return 'с ' + ty.level + ' уровня';
    if (t === 'kiosk' && !B.story.flags.contract) return 'по сюжету';
    if (t === 'shop' && B.level < 5) return 'с 5 уровня';
    return '';
  }
  function countType(t) { return B.points.filter(function (p) { return p.type === t; }).length; }

  function addXp(n) {
    var before = B.level;
    B.xp += n;
    var lvl = levelForXp(B.xp);
    if (lvl !== before) {
      B.level = lvl;
      onLevelUp(lvl);
    }
    save();
    storyTick();
  }

  function onLevelUp(lvl) {
    B.events.unshift({ t: 'level', text: 'Уровень ' + lvl, time: nowTime() });
    LV.toast('Новый уровень: ' + lvl);
    if (lvl >= 10 && !B.story.flags.prodUnlocked) unlockProduction();
    if (lvl === 5 || lvl === 10) storyTick();
    if (lvl === 7) {
      govIntro();
    } else if (lvl === 12) {
      ensureGov();
      addSms('Правительство', 'Можно оформить лицензию на оружие. Позвоните и приезжайте.');
      LV.toast('Доступна лицензия на оружие');
    } else if (lvl === 20 || lvl === MAX_LEVEL) {
      queueCall({
        incoming: true, from: 'Макс', number: CONTACTS.maks.number, ini: 'М', color: '#0ea5e9',
        lines: [
          'Макс: Уровень ' + lvl + '. Это уже серьёзный бизнес.',
          'Макс: В городе появляются новые возможности. Загляни в Job.'
        ]
      });
    }
    save();
  }

  function unlockProduction() {
    B.story.flags.prodUnlocked = true;
    var def = LV.apps.filter(function (a) { return a.id === 'production'; })[0];
    if (def) def.installable = true;
    if (LV.current && LV.current.id === 'store' && window.Store) Store.refresh();
    save();
    toast('Открыто приложение «Производство»');
  }

  // ============================================================
  // СМС
  // ============================================================
  function addSms(from, text) {
    B.story.sms.unshift({ id: 's' + Date.now() + Math.floor(Math.random() * 999), from: from, text: text, time: nowTime(), read: false });
    save();
    toast('СМС от ' + from);
    if (LV.current && LV.current.id === 'mail' && window.Mail) Mail.list();
    if (window.LV && LV.renderApps) LV.renderApps();
  }
  window.BizSms = function () {
    return B.story.sms.map(function (s) {
      return {
        id: s.id, dyn: true, from: 'СМС · ' + s.from,
        subj: s.text.split('\n')[0].slice(0, 60),
        prev: s.text.replace(/\n/g, ' ').slice(0, 64),
        time: s.time, unread: !s.read, body: s.text
      };
    });
  };
  window.BizSmsRead = function (id) {
    B.story.sms.forEach(function (s) { if (s.id === id) s.read = true; });
    save();
    if (LV.current && LV.current.id === 'mail' && window.Mail) Mail.list();
    LV.renderApps();
  };
  window.BizUnreadSms = function () {
    return B.story.sms.filter(function (s) { return !s.read; }).length;
  };

  // ============================================================
  // СЮЖЕТ
  // ============================================================
  var STORY_OBJ = [
    'Скачай Lavka Job в Магазине приложений',
    'Открой первый пункт выдачи',
    'Проведи первую смену',
    'Найми первого сотрудника',
    'Позвони по номеру ' + PLOT_NUMBER,
    'Вызови такси и приезжай в БЦ «Сити»',
    'Открой ларёк',
    'Дорасти до 5 уровня',
    'Открой магазин',
    'Дорасти до 10 уровня',
    'Построй завод в Промзоне',
    'Выпусти и продай первую партию',
    'Получи лицензию на алкоголь — Job → Лицензии',
    'Открой алкомаркет',
    'Получи лицензию на оружие',
    'Открой оружейный магазин',
    'Дорасти до 30 уровня',
    'Игра пройдена — ты построил свой маркетплейс'
  ];

  function storyTick() {
    var st = B.story.step;
    var nxt = null;
    if (st === 0 && B.installed.job) nxt = 1;
    else if (st === 1 && countType('pvz') >= 1) nxt = 2;
    else if (st === 2 && B.stats.shifts >= 1) nxt = 3;
    else if (st === 3 && B.staff.length >= 1) nxt = 4;
    else if (st === 4 && B.story.flags.plotCalled) nxt = 5;
    else if (st === 5 && B.story.flags.contract) nxt = 6;
    else if (st === 6 && countType('kiosk') >= 1) nxt = 7;
    else if (st === 7 && B.level >= 5) nxt = 8;
    else if (st === 8 && countType('shop') >= 1) nxt = 9;
    else if (st === 9 && B.level >= 10) nxt = 10;
    else if (st === 10 && B.factory && B.factory.built) nxt = 11;
    else if (st === 11 && B.stats.sold >= 1) nxt = 12;
    else if (st === 12 && B.licenses.alcohol) nxt = 13;
    else if (st === 13 && countType('alcohol') >= 1) nxt = 14;
    else if (st === 14 && B.licenses.weapon) nxt = 15;
    else if (st === 15 && countType('weapon') >= 1) nxt = 16;
    else if (st === 16 && B.level >= MAX_LEVEL) nxt = 17;
    if (nxt !== null) advanceStory(nxt);
  }

  function advanceStory(step) {
    if (step <= B.story.step) return;
    B.story.step = step;
    save();
    var maks = { incoming: true, from: 'Макс', number: CONTACTS.maks.number, ini: 'М', color: '#0ea5e9' };
    var ark = { incoming: true, from: 'Аркадий', number: PLOT_NUMBER, ini: 'А', color: '#8b5cf6' };
    if (step === 1) {
      queueCall(Object.assign({}, maks, { lines: [
        'Макс: Ну наконец-то, поставил Job.',
        'Макс: Слушай, у меня знакомый в Лавке. Город как раз расширяется.',
        'Макс: Открой пункт выдачи. Это проще, чем кажется, и деньги уже на счёте.',
        'Макс: Только не тяни — хорошие места разбирают быстро.'
      ] }));
      addSms('Макс', 'Скинул 30 000 ₽ на бизнес-счёт. Открой ПВЗ в Центре — там проходимость.\n— Макс');
    } else if (step === 2) {
      queueCall(Object.assign({}, maks, { lines: [
        'Макс: Ну вот, уже бизнесмен.',
        'Макс: ПВЗ — это не просто точка. Это люди, заказы и выручка.',
        'Макс: Проведи первую смену и посмотри цифры. Потом поговорим.'
      ] }));
      addSms('Макс', 'Смена — кнопка «Провести смену» в Lavka Job. Смотри, чтобы аренда не съела выручку.');
    } else if (step === 3) {
      queueCall(Object.assign({}, maks, { lines: [
        'Макс: Вижу выручку. Красиво.',
        'Макс: Но без людей далеко не уедешь. Найми сотрудника.',
        'Макс: Зарплата идёт со смены, зато заказов станет больше.'
      ] }));
      addSms('Макс', 'В Job открой вкладку «Люди» и найми первого. Не бери самого дорогого сразу.');
    } else if (step === 4) {
      B.story.flags.plotUnlocked = true;
      queueCall(Object.assign({}, maks, { lines: [
        'Макс: Теперь у тебя есть команда.',
        'Макс: Слушай... мне дали номер — ' + PLOT_NUMBER + '. Говорят, по помещению.',
        'Макс: Позвони. Может, контракт на ларёк. Только аккуратно.'
      ] }));
      addSms('Макс', 'Запиши номер: ' + PLOT_NUMBER + '. Скажи, что от Макса.');
    } else if (step === 5) {
      addSms('Аркадий', 'Жду тебя в БЦ «Сити» до 20:00. Вызови такси через телефон.\n— Аркадий');
    } else if (step === 6) {
      queueCall(Object.assign({}, ark, { lines: [
        'Аркадий: Контракт подписан, ларёк твой.',
        'Аркадий: Не подведи. Если пойдёт — будет разговор поинтереснее.'
      ] }));
      addSms('Аркадий', 'Ларёк у метро, 18 квадратов. Аренда 1 200 ₽ за смену. Открывайся.');
    } else if (step === 7) {
      queueCall(Object.assign({}, maks, { lines: [
        'Макс: Ларёк? Уважаю.',
        'Макс: Следующая цель — магазин. Но сначала дорасти до 5 уровня.'
      ] }));
    } else if (step === 8) {
      queueCall(Object.assign({}, maks, { lines: [
        'Макс: Пятый уровень! Магазин теперь доступен.',
        'Макс: Открой точку в спальном районе — там семьи и постоянные покупки.'
      ] }));
      addSms('Макс', 'Магазин открыт в Job → Карта. Спальный район — самое то.');
    } else if (step === 9) {
      queueCall(Object.assign({}, maks, { lines: [
        'Макс: Магазин — это уже серьёзно.',
        'Макс: Теперь цель — 10 уровень. Там Аркадий обещал что-то большое.'
      ] }));
    } else if (step === 10) {
      unlockProduction();
      queueCall(Object.assign({}, ark, { lines: [
        'Аркадий: Десятый уровень. Поздравляю.',
        'Аркадий: В Промзоне есть заброшенный цех. Забирай, пока не забрали другие.',
        'Аркадий: Производство — это уже твои товары. Дальше сам.'
      ] }));
      addSms('Аркадий', 'Приложение «Производство» открыто. Завод — в Промзоне.');
    } else if (step === 11) {
      queueCall(Object.assign({}, ark, { lines: [
        'Аркадий: Завод стоит. Теперь запусти партию и продай.',
        'Аркадий: Товар сам себя не продаст. Лавка ждёт.'
      ] }));
    } else if (step === 12) {
      queueCall(Object.assign({}, ark, { lines: [
        'Аркадий: Завод работает. Но это только начало.',
        'Аркадий: Дальше — лицензии. Алкоголь, потом оружие.',
        'Аркадий: Загляни в Job → Лицензии. Там всё по шагам.'
      ] }));
      addSms('Аркадий', 'Лицензии — в Job → Лицензии. Начни с алкоголя.');
    } else if (step === 13) {
      queueCall(Object.assign({}, ark, { lines: [
        'Аркадий: Алкомаркет? Это уже другой уровень.',
        'Аркадий: Теперь открой точку и покажи выручку.'
      ] }));
      addSms('Аркадий', 'Алкомаркет можно открыть на карте. Лицензия уже есть.');
    } else if (step === 14) {
      queueCall(Object.assign({}, ark, { lines: [
        'Аркадий: Алкомаркет работает. Теперь оружие.',
        'Аркадий: Лицензия — с 12 уровня. Звони в правительство.'
      ] }));
      addSms('Аркадий', 'Оружие — только после алкоголя и с 12 уровня.');
    } else if (step === 15) {
      queueCall(Object.assign({}, ark, { lines: [
        'Аркадий: Лицензия на оружие есть.',
        'Аркадий: Осталось открыть оружейный. Дальше — только масштаб.'
      ] }));
      addSms('Аркадий', 'Оружейный магазин доступен на карте.');
    } else if (step === 16) {
      queueCall(Object.assign({}, maks, { lines: [
        'Макс: Оружейный?! Ты серьёзно?',
        'Макс: Осталось дойти до 30 уровня. Покажи, на что способен.'
      ] }));
      addSms('Макс', 'Финальная цель — 30 уровень. Ты почти у вершины.');
    } else if (step === 17) {
      queueCall(Object.assign({}, ark, { lines: [
        'Аркадий: 30 уровень. Ты построил свой маркетплейс.',
        'Аркадий: Город у твоих ног. Что дальше — решать тебе.'
      ] }));
      addSms('Аркадий', 'Игра пройдена. Ты построил маркетплейс. Это только начало.');
    }
    if (LV.current && LV.current.id === 'job' && jobHost) renderJob();
    if (LV.current && LV.current.id === 'production' && prodHost) renderProd();
  }

  function objective() { return STORY_OBJ[B.story.step] || STORY_OBJ[0]; }
  function objectiveAction() {
    var st = B.story.step;
    if (st === 0) return 'LV.openApp(\'store\')';
    if (st === 1 || st === 6 || st === 8) return 'Biz.openMap(\'rent\')';
    if (st === 2) return 'Biz.shift()';
    if (st === 3) return 'Biz.jobTab(\'staff\')';
    if (st === 4) return 'Biz.callPlot()';
    if (st === 5) return 'Biz.openMap(\'taxi\')';
    if (st === 10) return 'Biz.openMap(\'factory\')';
    if (st === 11) return 'LV.openApp(\'production\')';
    if (st === 12 || st === 14) return 'Biz.jobTab(\'licenses\')';
    if (st === 13 || st === 15) return 'Biz.openMap(\'rent\')';
    if (st === 16) return 'Biz.shift()';
    return '';
  }
  function objectiveLabel() {
    var st = B.story.step;
    if (st === 0) return 'Открыть Магазин';
    if (st === 1 || st === 6 || st === 8) return 'Открыть точку';
    if (st === 2) return 'Смена';
    if (st === 3) return 'Нанять';
    if (st === 4) return 'Позвонить';
    if (st === 5) return 'Такси';
    if (st === 10) return 'Завод';
    if (st === 11) return 'Производство';
    if (st === 12 || st === 14) return 'Лицензии';
    if (st === 13 || st === 15) return 'Открыть точку';
    if (st === 16) return 'Смена';
    return '';
  }

  // ============================================================
  // ЭКРАН ЗВОНКА
  // ============================================================
  var callEl = null;
  var curCall = null;
  var lineIdx = 0;
  var callTimer = null;
  var callQueue = [];

  function queueCall(c) {
    c.id = 'call' + Date.now() + Math.floor(Math.random() * 999);
    callQueue.push(c);
    if (!callEl) renderCall();
  }

  function renderCall() {
    if (callEl || !callQueue.length) return;
    curCall = callQueue.shift();
    lineIdx = 0;
    var phone = document.getElementById('phone');
    if (!phone) { curCall = null; return; }
    callEl = document.createElement('div');
    callEl.className = 'call-screen';
    callEl.innerHTML = callIncomingHTML(curCall);
    phone.appendChild(callEl);
    callEl.classList.remove('show');
    requestAnimationFrame(function () { if (callEl) callEl.classList.add('show'); });
    if (!curCall.incoming) {
      var cc = curCall;
      if (curCall.audio && curCall.audio.length) startDialogue();
      else setTimeout(function () { if (callEl && curCall === cc) startDialogue(); }, 600);
    }
  }

  function callIncomingHTML(c) {
    if (!c.incoming) return callDialogueHTML(c, 'Вызов…');
    return '<div class="call-bg"></div>' +
      '<div class="call-top"><span>LAVKA · сеть</span><span>5G</span></div>' +
      '<div class="call-center">' +
      '<div class="call-ring"><i class="r1"></i><i class="r2"></i><span class="call-ava big" style="background:' + (c.color || '#0ea5e9') + '">' + (c.ini || '?') + '</span></div>' +
      '<b class="call-name">' + esc(c.from || 'Неизвестный') + '</b>' +
      '<span class="call-num">' + esc(c.number || '') + '</span>' +
      '<span class="call-state">входящий вызов</span></div>' +
      '<div class="call-actions">' +
      '<button class="call-action decline" type="button" onclick="Biz.callDecline()"><span class="call-circle"><svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .6 3.6 1 1 0 0 1-.25 1Z"/></svg></span><b>Сбросить</b></button>' +
      '<button class="call-action answer" type="button" onclick="Biz.callAnswer()"><span class="call-circle"><svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .6 3.6 1 1 0 0 1-.25 1Z"/></svg></span><b>Ответить</b></button>' +
      '</div>';
  }

  function callDialogueHTML(c, state) {
    return '<div class="call-bg"></div>' +
      '<div class="call-top"><span>' + esc(c.from || 'Неизвестный') + '</span><span id="call-timer">' + state + '</span></div>' +
      '<div class="call-mini"><span class="call-ava sm" style="background:' + (c.color || '#0ea5e9') + '">' + (c.ini || '?') + '</span>' +
      '<div><b>' + esc(c.from || 'Неизвестный') + '</b><span>' + esc(c.number || '') + '</span></div>' +
      '<span class="call-wave"><i></i><i></i><i></i><i></i></span>' +
      (c.voicemail ? '<em class="call-vm">автоответчик</em>' : '') + '</div>' +
      '<div class="call-lines" id="call-lines"></div>' +
      '<div class="call-foot"><button class="call-next" type="button" id="call-next" onclick="Biz.callNext()">Далее</button>' +
      '<button class="call-end" type="button" onclick="Biz.callHang()">Завершить</button></div>';
  }
  var callAudio = null;
  function stopCallAudio() {
    var a = callAudio;
    callAudio = null;
    if (!a) return;
    try { a.onended = null; a.pause(); a.currentTime = 0; } catch (e) {}
  }
  function playCallAudio(src, cc, lineNo) {
    stopCallAudio();
    if (!src) return;
    if (S && S.settings && S.settings.sound === false) return;
    var a = new Audio(src);
    callAudio = a;
    a.preload = 'auto';
    a.volume = src.indexOf('ring') >= 0 ? 0.55 : 0.95;
    a.onended = function () {
      if (callAudio !== a) return;
      callAudio = null;
      if (curCall === cc && cc.autoAfterAudio && lineIdx === lineNo) revealLine();
    };
    var p = a.play();
    if (p && p.catch) p.catch(function () {});
  }

  function startDialogue() {
    if (!callEl || !curCall || curCall.started) return;
    curCall.started = true;
    lineIdx = 0;
    callEl.innerHTML = callDialogueHTML(curCall, '00:00');
    var sec = 0;
    clearInterval(callTimer);
    callTimer = setInterval(function () {
      sec++;
      var t = document.getElementById('call-timer');
      if (t) t.textContent = '00:' + String(sec).padStart(2, '0');
    }, 1000);
    var cc = curCall;
    revealLine();
    if (cc && cc.autoLine != null) {
      cc.autoTimer = setTimeout(function () {
        if (curCall === cc && lineIdx === cc.autoLine) revealLine();
      }, cc.autoDelay || 2000);
    }
  }

  function revealLine() {
    var box = document.getElementById('call-lines');
    if (!box || !curCall) return;
    var lines = curCall.lines || [];
    if (lineIdx >= lines.length) { endCall(); return; }
    var p = document.createElement('p');
    p.className = 'call-line';
    p.textContent = lines[lineIdx];
    box.appendChild(p);
    box.scrollTop = box.scrollHeight;
    lineIdx++;
    var src = curCall.audio && curCall.audio[lineIdx - 1];
    if (src) playCallAudio(src, curCall, lineIdx);
    var btn = document.getElementById('call-next');
    if (btn) btn.textContent = lineIdx >= lines.length ? 'Завершить' : 'Далее';
  }

  function endCall() {
    clearInterval(callTimer);
    if (curCall && curCall.autoTimer) clearTimeout(curCall.autoTimer);
    stopCallAudio();
    if (callEl && callEl.parentNode) callEl.parentNode.removeChild(callEl);
    callEl = null;
    var cb = curCall && curCall.onEnd;
    curCall = null;
    if (typeof cb === 'function') { try { cb(); } catch (e) {} }
    setTimeout(function () { if (!callEl) renderCall(); }, 350);
  }

  window.Biz = window.Biz || {};

  Biz.callAnswer = function () { if (curCall) startDialogue(); };
  Biz.callDecline = function () { endCall(); };
  Biz.callNext = function () {
    if (!curCall) return;
    if (!curCall.started) { startDialogue(); return; }
    if (lineIdx >= (curCall.lines || []).length) { endCall(); return; }
    revealLine();
  };
  Biz.callHang = function () { endCall(); };

  function showCall(c) {
    queueCall(c);
  }

  function voicemail(name, number, ini, color, lines, audio, autoAfterAudio) {
    showCall({
      incoming: false, voicemail: true, from: name, number: number, ini: ini, color: color,
      lines: lines, audio: audio, autoAfterAudio: !!autoAfterAudio
    });
  }

  // ============================================================
  // КАРТА
  // ============================================================
  var mapEl = null;
  var mapMode = 'view';
  var mapSel = null;

  function hexA(hex, a) {
    var n = parseInt(String(hex).replace('#', ''), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  function openMap(mode, opts) {
    if (mapEl) return;
    mapMode = mode || 'view';
    mapSel = null;
    var phone = document.getElementById('phone');
    if (!phone) return;
    mapEl = document.createElement('div');
    mapEl.className = 'map-screen';
    mapEl.innerHTML = mapHTML();
    phone.appendChild(mapEl);
    mapSheetDefault();
  }
  Biz.openMap = openMap;

  function closeMap() {
    if (mapEl && mapEl.parentNode) mapEl.parentNode.removeChild(mapEl);
    mapEl = null;
    mapSel = null;
  }
  Biz.closeMap = closeMap;

  function mapTitle() {
    if (mapMode === 'rent') return 'Открыть точку';
    if (mapMode === 'factory') return 'Завод';
    if (mapMode === 'taxi') return 'Такси';
    return 'Карта города';
  }

  function mapMarkers() {
    var list = [], used = {};
    B.points.forEach(function (p) {
      var id = spotOf(p), sp = SPOTS[id];
      if (!sp) return;
      used[id] = true;
      list.push({ x: sp.x, y: sp.y, kind: MAP_KIND[p.type] || p.type, color: TYPES[p.type].color, id: id });
    });
    Object.keys(SPOTS).forEach(function (id) {
      if (used[id]) return;
      var sp = SPOTS[id];
      if (sp.gov) {
        if (mapMode === 'taxi' || mapMode === 'view') {
          list.push({ x: sp.x, y: sp.y, kind: 'columns', color: '#64748b', id: id });
        }
        return;
      }
      if (sp.office) {
        if (mapMode === 'taxi' || mapMode === 'view') {
          list.push({ x: sp.x, y: sp.y, kind: 'flag', color: '#8b5cf6', id: id });
        }
        return;
      }
      if (mapMode === 'rent' || mapMode === 'view' || mapMode === 'taxi' || (mapMode === 'factory' && id === 'industrial')) {
        list.push({ x: sp.x, y: sp.y, kind: sp.factory ? 'factory' : 'shop', color: sp.factory ? '#475569' : '#22c55e', id: id });
      }
    });
    return list;
  }

  function mapRoutePoint() {
    if (!mapSel) return null;
    if (mapSel === 'contract') return { x: 165, y: 150 };
    return SPOTS[mapSel] || null;
  }

  function renderMapCanvas() {
    var c = document.getElementById('mp-canvas');
    if (!c) return;
    var svg = window.CityMap ? window.CityMap.svg(mapMarkers(), { you: { x: 180, y: 150 }, route: mapRoutePoint() }) : '';
    c.innerHTML = svg + '<span class="mp-tag">Пункты выдачи Лавки</span>';
  }

  function mapHTML() {
    return '<div class="mp-head"><button class="mp-back" type="button" onclick="Biz.closeMap()"><i class="fa-solid fa-chevron-left"></i></button>' +
      '<div><b>' + mapTitle() + '</b><span>Москва · демо</span></div><span class="mp-cash">' + fmt(B.cash) + '</span></div>' +
      '<div class="mp-canvas" id="mp-canvas">' +
      (window.CityMap ? window.CityMap.svg(mapMarkers(), { you: { x: 180, y: 150 }, route: mapRoutePoint() }) : '') +
      '<span class="mp-tag">Пункты выдачи Лавки</span></div>' +
      '<div class="mp-legend"><span><i class="fa-solid fa-shop"></i> помещения</span><span><i class="fa-solid fa-taxi"></i> такси</span><span><i class="fa-solid fa-file-signature"></i> контракт</span></div>' +
      '<div class="mp-sheet" id="mp-sheet"></div>';
  }

  function mpSpotRow(id) {
    var sp = SPOTS[id];
    if (!sp) return '';
    return '<button class="mp-spot" type="button" onclick="Biz.mapPick(\'' + id + '\')">' +
      '<span class="mp-spot-ic" style="background:' + (sp.factory ? '#475569' : '#22c55e') + '"><i class="fa-solid ' + (sp.factory ? 'fa-industry' : 'fa-shop') + '"></i></span>' +
      '<div><b>' + sp.name + '</b><small>' + sp.area + ' · спрос ×' + sp.mult + '</small></div>' +
      '<i class="fa-solid fa-chevron-right"></i></button>';
  }

  function mapSheetDefault() {
    var el = document.getElementById('mp-sheet');
    if (!el) return;
    var ids = Object.keys(SPOTS);
    if (mapMode === 'rent') {
      var free = ids.filter(function (id) { return !pointAtSpot(id) && !SPOTS[id].gov && !SPOTS[id].office; });
      el.innerHTML = '<div class="mp-sheet-h">Свободные помещения <span>' + free.length + '</span></div>' +
        (free.length ? free.map(mpSpotRow).join('') : '<p class="mp-sheet-note">Свободных помещений нет.</p>');
    } else if (mapMode === 'factory') {
      el.innerHTML = '<div class="mp-sheet-h">Промзона <span>площадка</span></div>' + mpSpotRow('industrial');
    } else if (mapMode === 'taxi') {
      var rows = '';
      rows += '<button class="mp-spot" type="button" onclick="Biz.mapPick(\'bc\')"><span class="mp-spot-ic" style="background:#8b5cf6"><i class="fa-solid fa-building"></i></span><div><b>БЦ «Сити»</b><small>офис Аркадия · по записи</small></div><i class="fa-solid fa-chevron-right"></i></button>';
      if (B.level >= 7) {
        rows += '<button class="mp-spot" type="button" onclick="Biz.mapPick(\'gov\')"><span class="mp-spot-ic" style="background:#64748b"><i class="fa-solid fa-building-columns"></i></span><div><b>Правительство</b><small>лицензии · по записи</small></div><i class="fa-solid fa-chevron-right"></i></button>';
      }
      rows += ids.filter(function (id) { return !SPOTS[id].gov && !SPOTS[id].office; }).map(mpSpotRow).join('');
      el.innerHTML = '<div class="mp-sheet-h">Куда едем? <span>300 ₽</span></div>' + rows;
    } else {
      var pts = B.points.map(function (p) {
        var id = spotOf(p), sp = SPOTS[id];
        if (!sp) return '';
        return '<button class="mp-spot" type="button" onclick="Biz.mapPick(\'' + id + '\')"><span class="mp-spot-ic" style="background:' + TYPES[p.type].color + '"><i class="fa-solid ' + TYPES[p.type].icon + '"></i></span><div><b>' + TYPES[p.type].name + '</b><small>' + sp.name + ' · заказов ' + (p.orders || 0) + '</small></div><i class="fa-solid fa-chevron-right"></i></button>';
      }).join('');
      el.innerHTML = '<div class="mp-sheet-h">Мои точки <span>' + B.points.length + '</span></div>' + (pts || '<p class="mp-sheet-note">Точек пока нет.</p>');
    }
  }

  Biz.mapPick = function (id) {
    mapSel = id;
    renderMapCanvas();
    var el = document.getElementById('mp-sheet');
    if (!el) return;
    if (id === 'contract') id = 'bc';
    mapSel = id;
    if (id === 'bc') {
      el.innerHTML = '<div class="mp-sheet-h">БЦ «Сити» <span>офис Аркадия</span></div>' +
        '<p class="mp-sheet-note">' + (B.story.flags.contract ? 'Аркадий на месте. Можно зайти и поговорить.' : (B.story.step >= 5 ? 'Встреча по контракту на ларёк.' : 'Сначала познакомьтесь с Аркадием по телефону.')) + '</p>' +
        (mapMode === 'taxi' ? '<button class="mp-go" type="button" onclick="Biz.taxiGo()">Вызвать такси · 300 ₽</button>' : '');
      return;
    }
    if (id === 'gov') {
      var gs = SPOTS[id] || {};
      el.innerHTML = '<div class="mp-sheet-h">Правительство <span>' + (gs.area || 'Центр') + '</span></div>' +
        '<p class="mp-sheet-note">Лицензии на алкоголь и оружие. Приём по записи.</p>' +
        (mapMode === 'taxi' ? '<button class="mp-go" type="button" onclick="Biz.taxiGo()">Вызвать такси · 300 ₽</button>' : '') +
        (mapMode === 'taxi' && !B.story.flags.govCalled ? '<p class="mp-sheet-note">Сначала позвоните в правительство — контакт в телефоне.</p>' : '');
      return;
    }
    var s = SPOTS[id];
    if (!s) return;
    var p = pointAtSpot(id);
    if (mapMode === 'rent' && !p) {
      var rows = Object.keys(TYPES).map(function (t) {
        var ty = TYPES[t], un = typeUnlocked(t);
        return '<button class="mp-type' + (un ? '' : ' locked') + '" type="button" ' + (un ? 'onclick="Biz.mapPickType(\'' + t + '\')"' : '') + '>' +
          '<span class="mp-type-ic" style="background:' + ty.color + '"><i class="fa-solid ' + ty.icon + '"></i></span>' +
          '<div><b>' + ty.name + '</b><small>' + (un ? fmt(ty.cost) + ' · аренда ' + fmt(ty.rent) + '/смена' : (typeLockReason(t) || 'закрыто')) + '</small></div>' +
          (un ? '<i class="fa-solid fa-chevron-right"></i>' : '<i class="fa-solid fa-lock"></i>') + '</button>';
      }).join('');
      el.innerHTML = '<div class="mp-sheet-h">' + s.name + ' <span>' + s.area + ' · спрос ×' + s.mult + '</span></div>' +
        '<p class="mp-sheet-note">Свободное помещение · баланс ' + fmt(B.cash) + '</p>' + rows;
    } else if (mapMode === 'factory') {
      if (id !== 'industrial') {
        el.innerHTML = '<div class="mp-sheet-h">' + s.name + '</div><p class="mp-sheet-note">Завод можно построить только в Промзоне — на «Заводской, 1».</p>';
        return;
      }
      el.innerHTML = '<div class="mp-sheet-h">Заводская, 1 <span>Промзона</span></div>' +
        '<p class="mp-sheet-note">Заброшенный цех. Ремонт и оборудование — 150 000 ₽.</p>' +
        '<button class="mp-go" type="button" onclick="Biz.buildFactory()">Построить завод</button>';
    } else if (mapMode === 'taxi') {
      el.innerHTML = '<div class="mp-sheet-h">' + s.name + ' <span>' + s.area + '</span></div><p class="mp-sheet-note">Поездка по городу — 300 ₽. Оплата с бизнес-счёта.</p>' +
        '<button class="mp-go" type="button" onclick="Biz.taxiGo()">Вызвать такси</button>';
    } else {
      el.innerHTML = '<div class="mp-sheet-h">' + s.name + ' <span>' + s.area + ' · спрос ×' + s.mult + '</span></div>' +
        (p ? '<div class="mp-point"><span style="background:' + TYPES[p.type].color + '"><i class="fa-solid ' + TYPES[p.type].icon + '"></i></span><div><b>' + TYPES[p.type].name + '</b><small>заказов: ' + (p.orders || 0) + ' · товар: ' + pointStock(p) + ' · аренда ' + fmt(TYPES[p.type].rent) + '</small></div></div>'
          : '<p class="mp-sheet-note">Свободное помещение. Откройте точку через Job → Карта.</p>');
    }
  };

  Biz.mapPickType = function (type) {
    var t = TYPES[type];
    if (!t || !mapSel || !SPOTS[mapSel]) return;
    var s = SPOTS[mapSel];
    var el = document.getElementById('mp-sheet');
    if (!el) return;
    el.innerHTML = '<div class="mp-sheet-h">' + t.name + ' · ' + s.name + '</div>' +
      '<p class="mp-sheet-note">Открытие: ' + fmt(t.cost) + '. Аренда: ' + fmt(t.rent) + ' за смену. Средний чек: ' + fmt(t.avg) + '.</p>' +
      '<button class="mp-go" type="button" onclick="Biz.openPointAt(\'' + type + '\')">Открыть за ' + fmt(t.cost) + '</button>' +
      '<button class="mp-cancel" type="button" onclick="Biz.mapPick(\'' + mapSel + '\')">Назад</button>';
  };

  Biz.openPointAt = function (type) {
    var t = TYPES[type];
    if (!t || !mapSel || !SPOTS[mapSel]) return;
    if (!typeUnlocked(type)) { toast('Закрыто: ' + (typeLockReason(type) || 'этот тип ещё недоступен')); return; }
    if (pointAtSpot(mapSel)) { toast('Помещение уже занято'); return; }
    if (B.cash < t.cost) { toast('Не хватает денег'); return; }
    B.cash -= t.cost;
    B.points.push({ id: 'p' + (++B.nextId), type: type, spot: mapSel, orders: 0, stock: START_STOCK, opened: Date.now() });
    B.events.unshift({ t: 'point', text: t.name + ' · ' + SPOTS[mapSel].name, time: nowTime() });
    closeMap();
    addXp(30);
    storyTick();
    save();
    toast(t.name + ' открыт');
    if (type === 'pvz' && !B.story.flags.opgIntro) {
      B.story.flags.opgIntro = true;
      save();
      setTimeout(opgScene, 700);
    }
    if (LV.current && LV.current.id === 'job' && jobHost) renderJob();
  };

  function opgScene() {
    showCutscene({
      kicker: 'Улица · первый день',
      scene: 'city',
      slides: [
        { who: 'Незнакомец', ini: '?', color: '#dc2626', text: 'Слышь. Точку открыл? Значит, теперь ты с района.' },
        { who: 'Тима', ini: 'Т', color: '#dc2626', text: 'Я Тима. Работаю с бизнесом: пять тысяч — и никто тебя не трогает. Пока.' },
        { who: 'Ты', ini: 'Т', color: '#0ea5e9', text: '...' }
      ],
      choices: [
        { label: 'Заплатить 5 000 ₽', primary: true, action: opgPay },
        { label: 'Отказать', action: opgRefuse }
      ]
    });
  }

  function opgPay() {
    if (B.cash < 5000) {
      B.story.flags.opg = 'debt';
      B.events.unshift({ t: 'opg', text: 'ОПГ: денег не нашлось', time: nowTime() });
      save();
      toast('Не хватает 5 000 ₽');
      setTimeout(function () { addSms('Тима', 'Денег нет? Ладно. Должок растёт.'); }, 1200);
      return;
    }
    B.cash -= 5000;
    B.story.flags.opg = 'paid';
    B.events.unshift({ t: 'opg', text: 'ОПГ: дань 5 000 ₽', time: nowTime() });
    save();
    toast('Заплачено 5 000 ₽');
    setTimeout(function () { addSms('Тима', 'Красавчик. Пока не трогаем. Но если что — я рядом.'); }, 1200);
  }

  function opgRefuse() {
    B.story.flags.opg = 'refused';
    B.events.unshift({ t: 'opg', text: 'ОПГ: отказ платить', time: nowTime() });
    B.stats.rating = Math.max(3, Math.round(((Number(B.stats.rating) || 4.8) - 0.1) * 100) / 100);
    save();
    setTimeout(function () { addSms('Неизвестный', 'Ну смотри, бизнесмен. Мы вернёмся.'); }, 1200);
  }

  function arrivalScene(dest) {
    var sp = SPOTS[dest] || {};
    var name = sp.name || 'город';
    var p = pointAtSpot(dest);
    var slides, choices;
    if (p) {
      var t = TYPES[p.type] || { name: 'Точка', color: '#22c55e', rent: 0 };
      var staffN = B.staff.filter(function (s) { return s.pointId === p.id; }).length;
      slides = [
        { who: 'Управляющий', ini: 'У', color: t.color || '#22c55e', text: 'Приехали. «' + t.name + '» на ' + name + '. Это ваша точка.' },
        { who: 'Управляющий', ini: 'У', color: t.color || '#22c55e', text: 'Заказов в очереди: ' + (p.orders || 0) + '. Сотрудников: ' + staffN + '. Аренда: ' + fmt(t.rent || 0) + ' за смену. Товар: ' + pointStock(p) + ' шт.' },
        { who: 'Управляющий', ini: 'У', color: t.color || '#22c55e', text: staffN ? 'Команда на месте. Можно провести смену и забрать выручку.' : 'Людей нет — смену придётся тянуть самому. Наймите сотрудника.' }
      ];
      choices = [
        { label: 'Провести смену', primary: true, action: function () { setTimeout(function () { Biz.shift(); }, 60); } },
        { label: 'Позже', action: function () {} }
      ];
    } else if (sp.factory) {
      var built = B.factory && B.factory.built;
      slides = [
        { who: 'Мастер', ini: 'М', color: '#f59e0b', text: 'Промзона. ' + name + ' — здесь пахнет металлом и деньгами.' },
        { who: 'Мастер', ini: 'М', color: '#f59e0b', text: built ? 'Завод работает. На складе ' + (B.factory.stock || 0) + ' шт. Товар уходит в точки.' : 'Завод ещё не построен. Место свободное — можно занять.' }
      ];
      choices = built
        ? [{ label: 'Понятно', primary: true, action: function () {} }]
        : [{ label: 'Построить завод', primary: true, action: function () { setTimeout(function () { Biz.buildFactory(); }, 60); } }, { label: 'Позже', action: function () {} }];
    } else {
      slides = [
        { who: 'Гид', ini: 'Г', color: '#38bdf8', text: 'Вы на месте: ' + name + '. ' + (sp.area ? 'Район: ' + sp.area + '.' : '') },
        { who: 'Гид', ini: 'Г', color: '#38bdf8', text: 'Помещение свободно, спрос ×' + (sp.mult || 1) + '. Можно открыть точку.' },
        { who: 'Ты', ini: 'Т', color: '#0ea5e9', text: 'Значит, здесь и начну.' }
      ];
      choices = [
        { label: 'Открыть точку', primary: true, action: function () { setTimeout(function () { openMap('rent'); }, 60); } },
        { label: 'Осмотреться', action: function () {} }
      ];
    }
    showCutscene({ kicker: 'Такси · ' + name, scene: 'city', slides: slides, choices: choices });
  }

  Biz.taxiGo = function () {
    if (B.cash < 300) { toast('Не хватает 300 ₽ на такси'); return; }
    var dest = mapSel;
    if (!dest) { toast('Выберите точку на карте'); return; }
    B.cash -= 300;
    save();
    closeMap();
    var destName = dest === 'contract' || dest === 'bc' ? 'БЦ «Сити»' : dest === 'gov' ? 'Правительство' : (SPOTS[dest] ? SPOTS[dest].name : 'город');
    showCall({
      incoming: false, from: 'Такси Лавка', number: CONTACTS.taxi.number, ini: 'Т', color: '#facc15',
      lines: [
        'Диспетчер: Машина №214, белая, подъедет через 3 минуты.',
        'Таксист: Куда едем?',
        'Таксист: Понял. По пробкам минут двадцать.'
      ],
      onEnd: function () {
        if (!B.story.flags.contract && B.story.step >= 5 && (dest === 'contract' || dest === 'bc')) {
          setTimeout(contractScene, 400);
        } else if (dest === 'bc' || dest === 'contract') {
          setTimeout(function () { if (typeof arkadyOffice === 'function') arkadyOffice(); }, 400);
        } else if (dest === 'gov') {
          setTimeout(govScene, 400);
        } else {
          setTimeout(function () { arrivalScene(dest); }, 400);
        }
        if (LV.current && LV.current.id === 'job' && jobHost) renderJob();
      }
    });
  };

  // ============================================================
  // HTML-КАТСЦЕНЫ
  // ============================================================
  var cutEl = null, cutSlides = [], cutIndex = 0, cutTimer = null, cutFull = '', cutTyping = false, cutOpts = null;

  function cutClose() {
    if (cutTimer) { clearInterval(cutTimer); cutTimer = null; }
    if (cutEl && cutEl.parentNode) cutEl.parentNode.removeChild(cutEl);
    cutEl = null;
  }

  function cutRenderActions() {
    if (!cutEl) return;
    var box = cutEl.querySelector('#cut-actions');
    if (!box) return;
    box.innerHTML = '';
    if (cutTyping || cutIndex < cutSlides.length - 1) {
      var next = document.createElement('button');
      next.type = 'button';
      next.className = 'cut-btn primary';
      next.textContent = 'Далее';
      next.onclick = cutAdvance;
      box.appendChild(next);
      return;
    }
    if (cutOpts && cutOpts.choices && cutOpts.choices.length) {
      cutOpts.choices.forEach(function (c) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cut-btn' + (c.primary ? ' primary' : '');
        btn.textContent = c.label;
        btn.disabled = !!c.disabled;
        btn.onclick = function () {
          if (c.disabled) return;
          var keep = c.action ? c.action() : undefined;
          if (keep !== false) cutClose();
        };
        box.appendChild(btn);
      });
      return;
    }
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'cut-btn primary';
    close.textContent = 'Закрыть';
    close.onclick = cutClose;
    box.appendChild(close);
  }

  function cutShowSlide(i) {
    if (!cutEl) return;
    var sl = cutSlides[i] || {};
    cutIndex = i;
    var stage = cutEl.querySelector('.cut-stage');
    stage.className = 'cut-stage ' + (sl.scene || (cutOpts && cutOpts.scene) || 'office');
    var av = cutEl.querySelector('#cut-avatar');
    av.textContent = sl.ini || '?';
    av.style.background = sl.color || '#22c55e';
    cutEl.querySelector('#cut-who').textContent = sl.who || '';
    cutEl.querySelector('#cut-name').textContent = sl.who || '';
    var tx = cutEl.querySelector('#cut-text');
    cutFull = sl.text || '';
    tx.textContent = '';
    cutTyping = true;
    cutRenderActions();
    if (cutTimer) clearInterval(cutTimer);
    var pos = 0;
    cutTimer = setInterval(function () {
      pos += 2;
      tx.textContent = cutFull.slice(0, pos);
      if (pos >= cutFull.length) {
        clearInterval(cutTimer);
        cutTimer = null;
        cutTyping = false;
        tx.textContent = cutFull;
        cutRenderActions();
      }
    }, 14);
  }

  function cutAdvance() {
    if (!cutEl) return;
    if (cutTyping) {
      if (cutTimer) { clearInterval(cutTimer); cutTimer = null; }
      cutTyping = false;
      cutEl.querySelector('#cut-text').textContent = cutFull;
      cutRenderActions();
      return;
    }
    if (cutIndex < cutSlides.length - 1) {
      cutShowSlide(cutIndex + 1);
      return;
    }
    if (!(cutOpts && cutOpts.choices && cutOpts.choices.length)) cutClose();
  }

  function showCutscene(opts) {
    cutClose();
    var host = document.getElementById('phone');
    if (!host) return;
    cutOpts = opts;
    cutSlides = opts.slides || [];
    cutIndex = 0;
    cutEl = document.createElement('div');
    cutEl.className = 'cut';
    cutEl.innerHTML =
      '<div class="cut-top"><span class="cut-kicker"></span><button class="cut-skip" type="button">Пропустить</button></div>' +
      '<div class="cut-stage ' + (opts.scene || 'office') + '"><div class="cut-window"></div><div class="cut-portrait" id="cut-avatar">?</div><div class="cut-name" id="cut-name"></div></div>' +
      '<div class="cut-body"><b class="cut-who" id="cut-who"></b><p class="cut-text" id="cut-text"></p><div class="cut-actions" id="cut-actions"></div><div class="cut-hint">нажмите «Далее», чтобы продолжить</div></div>';
    cutEl.querySelector('.cut-kicker').textContent = opts.kicker || '';
    host.appendChild(cutEl);
    cutEl.querySelector('.cut-skip').onclick = cutClose;
    if (!cutSlides.length) { cutClose(); return; }
    cutShowSlide(0);
  }
  Biz.cutClose = cutClose;

  function signContract() {
    if (B.story.flags.contract) return true;
    B.story.flags.contract = true;
    B.cash += 20000;
    addXp(60);
    B.events.unshift({ t: 'contract', text: 'Контракт на ларёк подписан', time: nowTime() });
    save();
    storyTick();
    toast('Контракт подписан · +20 000 ₽');
    if (LV.current && LV.current.id === 'job' && jobHost) renderJob();
    return true;
  }

  function contractScene() {
    if (B.story.flags.contract) { arkadyOffice(); return; }
    showCutscene({
      kicker: 'БЦ «Сити» · офис Аркадия',
      scene: 'office',
      slides: [
        { who: 'Аркадий', ini: 'А', color: '#8b5cf6', text: 'Приехал. Садись. Чай? Нет? Ладно.' },
        { who: 'Аркадий', ini: 'А', color: '#8b5cf6', text: 'Ларёк у метро, 18 квадратов. Аренда — 1 200 ₽ за смену.' },
        { who: 'Аркадий', ini: 'А', color: '#8b5cf6', text: 'Контракт на твоё имя. Подписывай — и начинай.' },
        { who: 'Ты', ini: 'Т', color: '#0ea5e9', text: 'А подвох?' },
        { who: 'Аркадий', ini: 'А', color: '#8b5cf6', text: 'Подвох будет, если не откроешься. Держи бонус — 20 000 ₽ на старт.' }
      ],
      choices: [
        { label: 'Подписать контракт', primary: true, action: signContract },
        { label: 'Уйти', action: function () {} }
      ]
    });
  }

  function arkadyOffice() {
    if (!B.story.flags.contract && B.story.step >= 5) { contractScene(); return; }
    var text;
    if (!B.story.flags.plotUnlocked) text = 'Аркадий: Мы ещё не знакомы. Позвони по номеру, который дал Макс.';
    else if (!B.story.flags.contract) text = 'Аркадий: Рано. Сначала позвони и договорись о встрече.';
    else if (!B.licenses.alcohol) text = 'Аркадий: Ларёк работает? Тогда слушай: алкоголь — это лицензия. Звони в правительство, контакт у тебя в телефоне.';
    else if (!B.licenses.weapon) text = 'Аркадий: Алкоголь оформил? Молодец. Теперь оружие — но только с 12 уровня и после алкоголя.';
    else text = 'Аркадий: Обе лицензии есть. Дальше — только масштаб. Открывай точки и расти до 30.';
    showCutscene({
      kicker: 'БЦ «Сити» · офис Аркадия',
      scene: 'office',
      slides: [{ who: 'Аркадий', ini: 'А', color: '#8b5cf6', text: text }],
      choices: [{ label: 'Понятно', primary: true, action: function () {} }]
    });
  }
  Biz.arkadyOffice = arkadyOffice;

  // ============================================================
  // ОПТ · ПОСТАВКИ
  // ============================================================
  var SUPPLY_CATALOG = {
    pvz: [
      { id: 'boxes', name: 'Коробки', desc: 'Упаковка и выдача посылок', qty: 40, price: 2400, icon: 'fa-box-open', color: '#a16207' },
      { id: 'tape', name: 'Упаковка', desc: 'Скотч, плёнка, пакеты', qty: 30, price: 900, icon: 'fa-tape', color: '#64748b' },
      { id: 'coffee', name: 'Кофе для клиентов', desc: 'Стаканы и капсулы', qty: 50, price: 1500, icon: 'fa-mug-hot', color: '#b45309' }
    ],
    kiosk: [
      { id: 'tobacco', name: 'Сигареты и вейпы', desc: 'Витрина у кассы', qty: 50, price: 4000, icon: 'fa-smoking', color: '#475569' },
      { id: 'snacks', name: 'Снеки', desc: 'Чипсы, орехи, шоколад', qty: 60, price: 3200, icon: 'fa-cookie-bite', color: '#ef4444' },
      { id: 'drinks', name: 'Напитки', desc: 'Вода, соки, газировка', qty: 40, price: 3600, icon: 'fa-bottle-water', color: '#0ea5e9' }
    ],
    shop: [
      { id: 'grocery', name: 'Бакалея', desc: 'Крупы, макароны, масло', qty: 50, price: 4500, icon: 'fa-basket-shopping', color: '#f59e0b' },
      { id: 'dairy', name: 'Молочка', desc: 'Молоко, сыр, йогурты', qty: 30, price: 7800, icon: 'fa-cow', color: '#64748b' },
      { id: 'drinks', name: 'Напитки', desc: 'Вода, соки, газировка', qty: 40, price: 6200, icon: 'fa-bottle-water', color: '#0ea5e9' }
    ],
    cafe: [
      { id: 'beans', name: 'Кофе в зёрнах', desc: 'Арабика, 20 кг', qty: 20, price: 9000, icon: 'fa-mug-saucer', color: '#78350f' },
      { id: 'milk', name: 'Молоко', desc: 'Для латте и капучино', qty: 40, price: 4800, icon: 'fa-cow', color: '#64748b' },
      { id: 'pastry', name: 'Выпечка', desc: 'Круассаны и десерты', qty: 60, price: 5400, icon: 'fa-croissant', color: '#d97706' }
    ],
    barbershop: [
      { id: 'consumables', name: 'Расходники', desc: 'Лезвия, воротнички, салфетки', qty: 40, price: 3600, icon: 'fa-scissors', color: '#f59e0b' },
      { id: 'cosmetics', name: 'Косметика', desc: 'Масла, гели, помады', qty: 30, price: 6000, icon: 'fa-pump-soap', color: '#ec4899' },
      { id: 'towels', name: 'Полотенца', desc: 'Чистые, 50 шт', qty: 50, price: 2500, icon: 'fa-soap', color: '#0ea5e9' }
    ],
    carwash: [
      { id: 'chemistry', name: 'Автохимия', desc: 'Шампуни и пенка', qty: 40, price: 7200, icon: 'fa-spray-can-sparkles', color: '#0ea5e9' },
      { id: 'wipes', name: 'Тряпки и салфетки', desc: 'Микрофибра, 60 шт', qty: 60, price: 2400, icon: 'fa-shirt', color: '#64748b' },
      { id: 'polish', name: 'Полироль', desc: 'Кузов и стёкла', qty: 30, price: 5400, icon: 'fa-oil-can', color: '#b45309' }
    ],
    pcclub: [
      { id: 'parts', name: 'Комплектующие', desc: 'Платы, память, кулеры', qty: 10, price: 25000, icon: 'fa-microchip', color: '#6366f1' },
      { id: 'drinks', name: 'Напитки', desc: 'Энергетики и вода', qty: 40, price: 4800, icon: 'fa-bottle-water', color: '#0ea5e9' },
      { id: 'snacks', name: 'Снеки', desc: 'Чипсы и батончики', qty: 60, price: 4200, icon: 'fa-cookie-bite', color: '#ef4444' }
    ],
    alcohol: [
      { id: 'wine', name: 'Вино', desc: 'Столовое и креплёное', qty: 30, price: 12000, icon: 'fa-wine-bottle', color: '#7c3aed' },
      { id: 'beer', name: 'Пиво', desc: 'Бутылочное и разливное', qty: 60, price: 9000, icon: 'fa-beer-mug-empty', color: '#eab308' },
      { id: 'strong', name: 'Крепкое', desc: 'Виски, коньяк, водка', qty: 20, price: 15000, icon: 'fa-wine-glass', color: '#b91c1c' }
    ],
    pharmacy: [
      { id: 'meds', name: 'Лекарства', desc: 'Основной ассортимент', qty: 50, price: 12000, icon: 'fa-capsules', color: '#10b981' },
      { id: 'vitamins', name: 'Витамины', desc: 'Сезонные комплексы', qty: 40, price: 6000, icon: 'fa-pills', color: '#0ea5e9' },
      { id: 'consumables', name: 'Расходники', desc: 'Бинты, маски, антисептик', qty: 60, price: 3000, icon: 'fa-kit-medical', color: '#64748b' }
    ],
    gym: [
      { id: 'sportfood', name: 'Спортпит', desc: 'Протеин и батончики', qty: 30, price: 12000, icon: 'fa-dumbbell', color: '#ef4444' },
      { id: 'gear', name: 'Инвентарь', desc: 'Гантели, фитнес-резинки', qty: 20, price: 9000, icon: 'fa-dumbbell', color: '#334155' },
      { id: 'towels', name: 'Полотенца', desc: 'Для гостей, 60 шт', qty: 60, price: 3600, icon: 'fa-soap', color: '#0ea5e9' }
    ],
    boutique: [
      { id: 'clothes', name: 'Одежда', desc: 'Новая коллекция', qty: 30, price: 18000, icon: 'fa-shirt', color: '#ec4899' },
      { id: 'accessories', name: 'Аксессуары', desc: 'Сумки, ремни, украшения', qty: 40, price: 9000, icon: 'fa-gem', color: '#a855f7' },
      { id: 'packaging', name: 'Упаковка', desc: 'Пакеты и коробки', qty: 60, price: 2400, icon: 'fa-box', color: '#64748b' }
    ],
    electronics: [
      { id: 'phones', name: 'Смартфоны', desc: 'Новые модели, 10 шт', qty: 10, price: 45000, icon: 'fa-mobile-screen', color: '#3b82f6' },
      { id: 'laptops', name: 'Ноутбуки', desc: 'Домашние и игровые', qty: 6, price: 90000, icon: 'fa-laptop', color: '#6366f1' },
      { id: 'accs', name: 'Аксессуары', desc: 'Чехлы, зарядки, кабели', qty: 40, price: 12000, icon: 'fa-headphones', color: '#0ea5e9' }
    ],
    weapon: [
      { id: 'pistols', name: 'Пистолеты', desc: 'Травматические, 10 шт', qty: 10, price: 80000, icon: 'fa-crosshairs', color: '#334155' },
      { id: 'rifles', name: 'Ружья', desc: 'Охотничьи, 8 шт', qty: 8, price: 120000, icon: 'fa-shield-halved', color: '#7c3aed' },
      { id: 'ammo', name: 'Патроны', desc: 'Учебные, 100 шт', qty: 100, price: 25000, icon: 'fa-bullseye', color: '#b45309' }
    ],
    cinema: [
      { id: 'popcorn', name: 'Попкорн', desc: 'Зёрна и масло', qty: 60, price: 6000, icon: 'fa-cubes-stacked', color: '#f59e0b' },
      { id: 'drinks', name: 'Напитки', desc: 'Кола, вода, соки', qty: 50, price: 7500, icon: 'fa-bottle-water', color: '#0ea5e9' },
      { id: 'glasses', name: '3D-очки', desc: 'Многоразовые, 100 шт', qty: 100, price: 4000, icon: 'fa-glasses', color: '#334155' }
    ],
    hotel: [
      { id: 'linen', name: 'Бельё', desc: 'Комплекты на 40 номеров', qty: 40, price: 16000, icon: 'fa-bed', color: '#06b6d4' },
      { id: 'amenities', name: 'Косметика', desc: 'Мини-наборы для гостей', qty: 60, price: 9000, icon: 'fa-pump-soap', color: '#ec4899' },
      { id: 'breakfast', name: 'Завтраки', desc: 'Продукты на неделю', qty: 50, price: 12500, icon: 'fa-croissant', color: '#d97706' }
    ],
    autosalon: [
      { id: 'cars', name: 'Автомобили', desc: 'Новые, 3 шт', qty: 3, price: 900000, icon: 'fa-car', color: '#f97316' },
      { id: 'tires', name: 'Шины', desc: 'Комплекты, 20 шт', qty: 20, price: 120000, icon: 'fa-ring', color: '#334155' },
      { id: 'accs', name: 'Аксессуары', desc: 'Коврики, химия, масла', qty: 30, price: 30000, icon: 'fa-oil-can', color: '#0ea5e9' }
    ],
    mall: [
      { id: 'tenant', name: 'Товар арендаторам', desc: 'Витрины и стоки', qty: 50, price: 50000, icon: 'fa-store', color: '#64748b' },
      { id: 'foodcourt', name: 'Фудкорт', desc: 'Продукты для точек', qty: 60, price: 30000, icon: 'fa-utensils', color: '#f59e0b' },
      { id: 'decor', name: 'Декор', desc: 'Оформление и реклама', qty: 40, price: 20000, icon: 'fa-couch', color: '#8b5cf6' }
    ]
  };
  var supplySel = null;
  var SUPPLY_PRICE_K = 0.75;
  function goodPrice(g) { return Math.round(g.price * SUPPLY_PRICE_K / 100) * 100; }

  function supplyTypes() {
    var seen = {};
    B.points.forEach(function (p) { if (TYPES[p.type]) seen[p.type] = (seen[p.type] || 0) + 1; });
    return Object.keys(seen);
  }
  function supplyPoints(type) {
    return B.points.filter(function (p) { return p.type === type; });
  }
  function supplyPointObj(type) {
    var list = supplyPoints(type);
    var p = list.filter(function (x) { return x.id === supplySel; })[0];
    if (!p) p = list[0] || null;
    supplySel = p ? p.id : null;
    return p;
  }
  function optPoints(type) {
    var pts = type ? supplyPoints(type) : B.points;
    if (!pts.length) return '<p class="opt-empty">' + (type ? 'Точек этого бизнеса пока нет.' : 'Точек пока нет.') + '</p>';
    return '<div class="opt-points">' + pts.map(function (p) {
      var t = TYPES[p.type], si = spotInfo(p);
      return '<button class="opt-point' + (p.id === supplySel ? ' on' : '') + '" type="button" onclick="Biz.supplySelect(\'' + p.id + '\')">' +
        '<span class="opt-point-ic" style="background:' + t.color + '"><i class="fa-solid ' + t.icon + '"></i></span>' +
        '<div><b>' + t.name + '</b><span>' + si.area + ' · товар ' + pointStock(p) + ' шт</span></div>' +
        (p.id === supplySel ? '<i class="fa-solid fa-check"></i>' : '') + '</button>';
    }).join('') + '</div>';
  }
  function optCatalog(type) {
    var p = supplyPointObj(type);
    var ty = TYPES[type] || { name: type, icon: 'fa-store', color: '#0f766e' };
    var head = '<div class="opt-head"><button class="opt-back" type="button" onclick="Web.sitePage(\'opt\',\'index\')"><i class="fa-solid fa-chevron-left"></i> Поставки</button>' +
      '<h2>' + esc(ty.name) + '</h2><p>Опт для этого бизнеса.</p></div>';
    var lock = '';
    if (type === 'weapon' && !B.licenses.weapon) {
      lock = '<div class="opt-lock"><i class="fa-solid fa-lock"></i><div><b>Нужна лицензия на оружие</b><span>Оформите в Job → Лицензии, потом возвращайтесь.</span></div></div>';
    } else if (!supplyPoints(type).length) {
      lock = '<div class="opt-lock"><i class="fa-solid fa-store-slash"></i><div><b>Нет точки «' + esc(ty.name) + '»</b><span>Откройте точку этого типа на карте — и опт появится.</span></div></div>';
    }
    var goods = SUPPLY_CATALOG[type] || [];
    var cards = goods.map(function (g) {
      var can = !!p && (type !== 'weapon' || B.licenses.weapon);
      return '<div class="opt-good"><span class="opt-good-ic" style="background:' + g.color + '"><i class="fa-solid ' + g.icon + '"></i></span>' +
        '<div class="opt-good-info"><b>' + g.name + '</b><span>' + g.desc + '</span><small>+' + g.qty + ' шт · ' + fmt(goodPrice(g)) + '</small></div>' +
        '<button class="opt-buy' + (can ? '' : ' off') + '" type="button" ' + (can ? 'onclick="Biz.supplyOrder(\'' + type + '\',\'' + g.id + '\')"' : 'disabled') + '>' + (can ? 'Заказать' : 'Недоступно') + '</button></div>';
    }).join('');
    return head + lock + '<div class="opt-sub">Куда везём</div>' + optPoints(type) + '<div class="opt-sub">Партии</div>' + cards;
  }
  function optHome() {
    var types = supplyTypes();
    var cats = types.length ? '<div class="opt-cats">' + types.map(function (t) {
      var ty = TYPES[t], n = supplyPoints(t).length;
      return '<button class="opt-cat" type="button" onclick="Web.sitePage(\'opt\',\'b_' + t + '\')">' +
        '<span style="background:' + ty.color + '"><i class="fa-solid ' + ty.icon + '"></i></span>' +
        '<b>' + esc(ty.name) + '</b><small>' + n + ' ' + (n === 1 ? 'точка' : 'точек') + '</small></button>';
    }).join('') + '</div>' : '<p class="opt-empty">Откройте первую точку — и для неё появится свой опт.</p>';
    return '<div class="opt-hero"><span class="opt-kicker">ОПТ · B2B</span><h1>Свой опт для каждого бизнеса</h1><p>ПВЗ — коробки, кофейне — зерно, автосалону — машины.</p></div>' +
      '<div class="opt-stats"><div><b>' + B.points.length + '</b><span>точек</span></div><div><b>' + types.length + '</b><span>бизнесов</span></div><div><b>' + fmt(B.cash) + '</b><span>на счёте</span></div></div>' +
      '<div class="opt-sub">Мои бизнесы</div>' + cats +
      '<div class="opt-sub">Мои точки</div>' + optPoints('') +
      '<p class="opt-note">Товар приходит сразу на точку. Смена списывает проданное.</p>';
  }
  function supplyTick() {
    if (B.story.flags.supplyFood && !B.story.flags.supplyFoodMsg) {
      B.story.flags.supplyFoodMsg = true;
      addSms('Макс', 'Товар пришёл. Он уже на точке — проверь Job → Точки.');
    }
    if (B.story.flags.supplyFood && B.story.flags.supplyWeapon && !B.story.flags.supplyDone) {
      B.story.flags.supplyDone = true;
      B.cash += 5000;
      addXp(50);
      addSms('Макс', 'Оружие приняли. Полный цикл собран: склад → точка → смена. Держи 5 000 ₽.');
      toast('Задание «Поставки» выполнено · +5 000 ₽');
    }
    save();
  }
  function supplyOrder(type, id) {
    var g = (SUPPLY_CATALOG[type] || []).filter(function (x) { return x.id === id; })[0];
    if (!g) return;
    var p = supplyPointObj(type);
    if (!p) { toast('Сначала откройте точку этого бизнеса'); return; }
    if (type === 'weapon' && !B.licenses.weapon) { toast('Нужна лицензия на оружие'); return; }
    var price = goodPrice(g);
    if (B.cash < price) { toast('Не хватает ' + fmt(price - B.cash)); return; }
    B.cash -= price;
    p.stock = pointStock(p) + g.qty;
    B.stats.supplied = (B.stats.supplied || 0) + 1;
    B.events.unshift({ t: 'supply', text: 'Поставка: ' + g.name + ' → ' + TYPES[p.type].name, time: nowTime() });
    if (type === 'weapon') B.story.flags.supplyWeapon = true;
    else B.story.flags.supplyFood = true;
    save();
    supplyTick();
    if (jobHost) renderJob();
    if (window.Web && document.getElementById('web-scroll')) Web.refresh();
    toast('+' + g.qty + ' шт · ' + g.name);
  }
  function supplyIntro() {
    if (B.story.flags.supplyIntro) return;
    B.story.flags.supplyIntro = true;
    save();
    queueCall({
      incoming: true, from: 'Макс', number: CONTACTS.maks.number, ini: 'М', color: '#0ea5e9',
      lines: [
        'Макс: Слушай, у тебя уже есть точка, а товар ты как завозишь?',
        'Макс: Есть сайт «Опт» — у каждого бизнеса там свой раздел. Открой браузер и зайди на opt.lavka.net.',
        'Макс: Запомни главное: без товара смену не откроешь. Кнопка просто скажет «Нет товара» — и всё.',
        'Макс: Для ПВЗ — коробки и упаковка. Для кофейни — зерно и молоко. Для автосалона — машины.',
        'Макс: Заходи в раздел своего бизнеса и закажи первую партию. Дальше сам.'
      ]
    });
    addSms('Макс', 'Открой Браузер → opt.lavka.net. Без товара смена не запустится. У каждого бизнеса свой раздел.');
  }
  function supplyTaskCard() {
    if (!B.story.flags.supplyIntro) return '';
    var food = !!B.story.flags.supplyFood, weapon = !!B.story.flags.supplyWeapon;
    var done = food && weapon;
    var line = done ? 'Выполнено · +5 000 ₽' : (!food ? 'Закажи партию на «Опте»' : 'Закажи оружие на «Опте»');
    return '<button class="bj-supply' + (done ? ' done' : '') + '" type="button" onclick="Biz.openOpt()">' +
      '<span class="bj-supply-ic"><i class="fa-solid fa-truck-fast"></i></span>' +
      '<div><b>Задание Макса · поставки</b><span>' + line + '</span></div>' +
      '<span class="bj-supply-flags"><i class="fa-solid ' + (food ? 'fa-circle-check' : 'fa-circle') + '"></i><i class="fa-solid ' + (weapon ? 'fa-circle-check' : 'fa-circle') + '"></i></span>' +
      '<i class="fa-solid fa-chevron-right"></i></button>';
  }
  Biz.supplySelect = function (id) {
    supplySel = id;
    if (window.Web) Web.refresh();
  };
  Biz.supplyOrder = supplyOrder;
  Biz.openOpt = function (type) {
    if (window.LV) LV.openApp('browser');
    setTimeout(function () {
      if (!window.Web) return;
      Web.open('opt');
      if (type) setTimeout(function () { Web.sitePage('opt', 'b_' + type); }, 80);
    }, 120);
  };

  if (window.Web && window.Web.sites) {
    window.Web.sites.push({
      id: 'opt', name: 'Опт', host: 'opt.lavka.net', cat: 'shop', custom: true,
      icon: 'fa-truck-fast', color: '#0f766e',
      slogan: 'Оптовые поставки для каждого бизнеса',
      nav: [],
      chrome: function (body, page) {
        var active = page || 'index';
        var isBiz = active.indexOf('b_') === 0;
        return '<div class="opt">' +
          '<header class="opt-top"><div class="opt-brand"><span class="opt-logo"><i class="fa-solid fa-truck-fast"></i></span><div><b>ОПТ</b><span>поставки для бизнеса</span></div></div><span class="opt-badge">B2B</span></header>' +
          '<nav class="opt-nav">' +
          '<button class="' + (active === 'index' || isBiz ? 'on' : '') + '" type="button" onclick="Web.sitePage(\'opt\',\'index\')">Поставки</button>' +
          '<button class="' + (active === 'points' ? 'on' : '') + '" type="button" onclick="Web.sitePage(\'opt\',\'points\')">Точки</button>' +
          '</nav><div class="opt-body">' + body + '</div></div>';
      },
      pages: (function () {
        var pg = {
          index: optHome,
          points: function () {
            return '<div class="opt-head"><button class="opt-back" type="button" onclick="Web.sitePage(\'opt\',\'index\')"><i class="fa-solid fa-chevron-left"></i> Поставки</button><h2>Мои точки</h2><p>Остатки товара после поставок.</p></div>' + optPoints('');
          }
        };
        Object.keys(SUPPLY_CATALOG).forEach(function (t) {
          pg['b_' + t] = function () { return optCatalog(t); };
        });
        return pg;
      })()
    });
  }


  // ============================================================
  // ЛИЦЕНЗИИ И ПРАВИТЕЛЬСТВО
  // ============================================================
  function ensureGov() {
    if (B.level < LICENSES.alcohol.level || B.story.flags.govUnlocked) return;
    B.story.flags.govUnlocked = true;
    addSms('Аркадий', 'Есть человек в правительстве: ' + GOV_NUMBER + '. Позвони, скажи, что от меня, — поможет с лицензиями.');
    save();
  }

  function govIntro() {
    ensureGov();
    if (B.story.flags.govIntro) return;
    B.story.flags.govIntro = true;
    save();
    queueCall({
      incoming: true, from: 'Аркадий', number: PLOT_NUMBER, ini: 'А', color: '#8b5cf6',
      lines: [
        'Аркадий: Седьмой уровень. Уже не ларёк.',
        'Аркадий: Хочешь алкоголь или оружие? Это не просто точка — нужна лицензия.',
        'Аркадий: Я скинул контакт правительства. Позвони, договорись и съезди на такси.',
        'Аркадий: Скажешь, что от меня. Дальше сам.'
      ]
    });
  }

  function callGovReal() {
    ensureGov();
    if (B.level < LICENSES.alcohol.level) {
      showCall({
        incoming: false, from: 'Правительство', number: GOV_NUMBER, ini: 'П', color: '#64748b',
        lines: [
          'Сергей Петрович: Слушаю.',
          'Сергей Петрович: Лицензии оформляем с 7 уровня. Подрастите — и звоните.'
        ]
      });
      return;
    }
    if (B.story.flags.govVisitType) {
      showCall({
        incoming: false, from: 'Правительство', number: GOV_NUMBER, ini: 'П', color: '#64748b',
        lines: [
          'Сергей Петрович: Я уже дал задание.',
          'Сергей Петрович: Приезжайте в правительство, Тверская, 1. Такси через телефон.'
        ]
      });
      return;
    }
    var alcohol = B.licenses.alcohol, weapon = B.licenses.weapon;
    var type = null;
    if (!alcohol) type = 'alcohol';
    else if (!weapon && B.level >= LICENSES.weapon.level) type = 'weapon';

    var lines;
    if (type === 'alcohol') {
      lines = [
        'Сергей Петрович: Аркадий говорил о вас.',
        'Сергей Петрович: Лицензия на алкоголь. Пошлина — ' + fmt(LICENSES.alcohol.fee) + '.',
        'Сергей Петрович: Приезжайте в правительство, Тверская, 1.',
        'Сергей Петрович: Такси вызовите через телефон.'
      ];
    } else if (type === 'weapon') {
      lines = [
        'Сергей Петрович: Алкоголь уже оформили. Теперь оружие?',
        'Сергей Петрович: Лицензия на торговлю оружием. Пошлина — ' + fmt(LICENSES.weapon.fee) + '.',
        'Сергей Петрович: Приезжайте, Тверская, 1. Такси через телефон.'
      ];
    } else if (!alcohol) {
      lines = [
        'Сергей Петрович: Слушаю.',
        'Сергей Петрович: Сначала получите лицензию на алкоголь — с 7 уровня.'
      ];
    } else if (!weapon) {
      lines = [
        'Сергей Петрович: Слушаю.',
        'Сергей Петрович: Оружие — с 12 уровня. Подрастёте — приезжайте.'
      ];
    } else {
      lines = [
        'Сергей Петрович: Слушаю.',
        'Сергей Петрович: Обе лицензии у вас. Всё оформлено, работайте.'
      ];
    }

    if (type) {
      B.story.flags.govCalled = true;
      B.story.flags.govCallType = type;
      B.story.flags.govVisitType = type;
      save();
    }

    showCall({
      incoming: false, from: 'Правительство', number: GOV_NUMBER, ini: 'П', color: '#64748b',
      lines: lines,
      onEnd: function () {
        if (type) toast('Запись: ' + LICENSES[type].name.toLowerCase() + ' · приезжайте в правительство');
        if (LV.current && LV.current.id === 'job' && jobHost) renderJob();
        if (phoneHost) renderPhone();
      }
    });
  }

  function govCutscene() {
    var type = B.story.flags.govVisitType;
    if (!type || !LICENSES[type]) return;
    var L = LICENSES[type];
    var enough = B.cash >= L.fee;
    showCutscene({
      kicker: 'Правительство · кабинет',
      scene: 'gov',
      slides: [
        { who: 'Сергей Петрович', ini: 'С', color: '#64748b', text: 'Проходите. Присаживайтесь.' },
        { who: 'Сергей Петрович', ini: 'С', color: '#64748b', text: 'Лицензия на ' + L.name.toLowerCase() + '. Пошлина — ' + fmt(L.fee) + '.' },
        { who: 'Сергей Петрович', ini: 'С', color: '#64748b', text: enough ? 'Деньги на бизнес-счёте? Подписывайте.' : 'Не хватает ' + fmt(L.fee - B.cash) + '. Приходите, когда будут деньги.' }
      ],
      choices: [
        { label: enough ? 'Оплатить ' + fmt(L.fee) : 'Не хватает ' + fmt(L.fee - B.cash), primary: true, disabled: !enough, action: function () { return payLicense(type); } },
        { label: 'Уйти', action: function () {} }
      ]
    });
  }

  function payLicense(type) {
    var L = LICENSES[type];
    if (!L || B.licenses[type] || B.cash < L.fee) return false;
    B.cash -= L.fee;
    B.licenses[type] = true;
    B.story.flags.govVisitType = null;
    B.story.flags['govVisit' + type] = true;
    B.events.unshift({ t: 'license', text: 'Лицензия: ' + L.name, time: nowTime() });
    addXp(150);
    save();
    storyTick();
    toast('Лицензия получена: ' + L.name);
    if (LV.current && LV.current.id === 'job' && jobHost) renderJob();
    return true;
  }

  function govScene() {
    var type = B.story.flags.govVisitType;
    if (!B.story.flags.govCalled || !type) {
      showCall({
        incoming: false, from: 'Правительство', number: GOV_NUMBER, ini: 'П', color: '#64748b',
        lines: [
          'Сергей Петрович: Вы не записаны.',
          'Сергей Петрович: Позвоните в правительство и запишитесь на приём.'
        ]
      });
      return;
    }
    var L = LICENSES[type];
    if (B.licenses[type]) {
      showCall({
        incoming: false, from: 'Правительство', number: GOV_NUMBER, ini: 'П', color: '#64748b',
        lines: ['Сергей Петрович: Лицензия уже оформлена. Не тратьте моё время.']
      });
      return;
    }
    if (type === 'weapon' && !B.licenses.alcohol) {
      showCall({
        incoming: false, from: 'Правительство', number: GOV_NUMBER, ini: 'П', color: '#64748b',
        lines: ['Сергей Петрович: Сначала алкоголь. Потом оружие.']
      });
      return;
    }
    govCutscene();
  }

  function callGovEntry() {
    ensureGov();
    if (B.level < LICENSES.alcohol.level) {
      showCall({
        incoming: false, from: 'Правительство', number: GOV_NUMBER, ini: 'П', color: '#64748b',
        lines: [
          'Сергей Петрович: Слушаю.',
          'Сергей Петрович: Лицензии оформляем с 7 уровня. Подрастите — и звоните.'
        ]
      });
      return;
    }
    callGovReal();
  }

  Biz.callGov = callGovEntry;
  Biz.taxiToGov = function () {
    if (!B.story.flags.govCalled) { toast('Сначала позвоните в правительство'); return; }
    mapSel = 'gov';
    Biz.taxiGo();
  };

  // ============================================================
  // JOB
  // ============================================================
  var jobHost = null;
  var jobTab = 'main';

  function licCard(type) {
    var L = LICENSES[type], ty = TYPES[type];
    var licensed = !!B.licenses[type];
    var ready = B.level >= L.level && (!L.requires || B.licenses[L.requires]);
    var called = B.story.flags.govCallType === type || licensed;
    var opened = countType(type) > 0;
    var steps = [
      ['Позвонить в правительство', called],
      ['Приехать на такси', licensed],
      ['Получить лицензию', licensed],
      ['Открыть точку', opened]
    ];
    var action;
    if (!ready) {
      var why = B.level < L.level ? 'с ' + L.level + ' уровня' : 'сначала алкоголь';
      action = '<button class="lic-btn" type="button" disabled>Доступно ' + why + '</button>';
    } else if (!licensed && !called) {
      action = '<button class="lic-btn" type="button" onclick="Biz.callGov()">Позвонить в правительство</button>';
    } else if (!licensed) {
      action = '<button class="lic-btn" type="button" onclick="Biz.taxiToGov()">Такси к правительству · 300 ₽</button>';
    } else {
      action = '<button class="lic-btn" type="button" onclick="Biz.openMap(\'rent\')">Открыть точку за ' + fmt(ty.cost) + '</button>';
    }
    return '<div class="lic-card' + (licensed ? ' ok' : '') + '">' +
      '<div class="lic-head"><span class="lic-ic" style="background:' + ty.color + '"><i class="fa-solid ' + ty.icon + '"></i></span>' +
      '<div class="lic-title"><b>' + ty.name + '</b><span>Лицензия «' + L.name + '» · ' + fmt(L.fee) + '</span></div>' +
      '<span class="lic-status' + (licensed ? ' on' : '') + '">' + (licensed ? 'есть' : 'нет') + '</span></div>' +
      '<div class="lic-steps">' + steps.map(function (st) {
        return '<div class="lic-step' + (st[1] ? ' done' : '') + '"><i></i><span>' + st[0] + '</span></div>';
      }).join('') + '</div>' + action + '</div>';
  }

  function renderLicenses() {
    return '<div class="lic-intro"><b>Обучение: лицензии</b><p>Позвоните в правительство, приезжайте на такси и оформите лицензию. После этого можно открыть алкомаркет или оружейный.</p></div>' +
      licCard('alcohol') + licCard('weapon') +
      '<p class="lic-note">Правительство: ' + GOV_NUMBER + ' · контакт в телефоне</p>';
  }

  function renderAdmin() {
    if (!isX8()) return '<p class="bj-empty">Доступно только X-8.</p>';
    return '<div class="adm-head"><span class="adm-badge">X-8</span><div><b>Админ-панель</b><span>выдача денег · только X-8</span></div></div>' +
      '<div class="adm-bal"><span>На бизнес-счёте</span><b>' + fmt(B.cash) + '</b></div>' +
      '<div class="adm-form">' +
      '<label class="adm-label">Сумма</label>' +
      '<div class="adm-input"><input id="adm-amount" type="number" inputmode="numeric" placeholder="0" step="1000"><span>₽</span></div>' +
      '<div class="adm-quick">' +
      '<button type="button" onclick="Biz.adminSet(10000)">10 000</button>' +
      '<button type="button" onclick="Biz.adminSet(100000)">100 000</button>' +
      '<button type="button" onclick="Biz.adminSet(1000000)">1 000 000</button>' +
      '</div>' +
      '<button class="adm-add" type="button" onclick="Biz.adminAdd()"><i class="fa-solid fa-sack-dollar"></i> Начислить</button>' +
      '</div>' +
      '<p class="adm-note">Деньги идут на бизнес-счёт и сохраняются в игре.</p>';
  }

  Biz.adminSet = function (v) {
    var i = document.getElementById('adm-amount');
    if (i) i.value = v;
  };

  Biz.adminAdd = function () {
    if (!isX8()) { toast('Только для X-8'); return; }
    var i = document.getElementById('adm-amount');
    var am = Math.round(Number(i && i.value) || 0);
    if (am <= 0) { toast('Введите сумму'); return; }
    if (am > 100000000) { toast('Максимум 100 000 000 ₽'); return; }
    B.cash += am;
    B.events.unshift({ t: 'admin', text: 'Админ X-8: +' + fmt(am), time: nowTime() });
    save();
    if (adminHost) adminHost.innerHTML = adminPanelHTML();
    if (jobHost) renderJob();
    toast('Начислено ' + fmt(am));
  };

  var adminHost = null;

  function adminPanelHTML() {
    return '<header class="pr-top"><button class="pr-back" type="button" data-back><i class="fa-solid fa-chevron-left"></i></button>' +
      '<div><b>АДМИН · X-8</b><span>выдача денег</span></div></header>' +
      '<div class="app-scroll pb adm-wrap">' + renderAdmin() + '</div>';
  }

  function renderJob() {
    if (!jobHost) return;
    if (B.points.length && B.story.step >= 6 && !B.story.flags.supplyIntro) supplyIntro();
    if (B.level >= 7) { ensureGov(); if (!B.story.flags.govIntro) govIntro(); }
    var lvl = B.level, next = nextXp();
    var pct = B.level >= MAX_LEVEL ? 100 : Math.min(100, Math.round((B.xp - XP_LEVELS[B.level - 1]) / Math.max(1, next - XP_LEVELS[B.level - 1]) * 100));
    var tabsList = [['main', 'Обзор'], ['points', 'Точки'], ['staff', 'Люди'], ['licenses', 'Лицензии'], ['auto', 'Авто']];
    if (isX8()) tabsList.push(['admin', 'Админ']);
    var tabs = tabsList.map(function (t) {
      return '<button class="bj-tab' + (jobTab === t[0] ? ' on' : '') + '" type="button" onclick="Biz.jobTab(\'' + t[0] + '\')">' + t[1] + '</button>';
    }).join('');
    var body = '';
    if (jobTab === 'main') {
      body = '<div class="bj-obj"><span>ТЕКУЩАЯ ЦЕЛЬ</span><b>' + esc(objective()) + '</b>' +
        (objectiveAction() ? '<button type="button" onclick="' + objectiveAction() + '">' + objectiveLabel() + '</button>' : '') + '</div>' +
        (isX8() ? '<button class="bj-lic-banner adm-banner" type="button" onclick="Biz.jobTab(\'admin\')"><i class="fa-solid fa-user-shield"></i><div><b>Админ-панель · X-8</b><span>выдать деньги</span></div><i class="fa-solid fa-chevron-right"></i></button>' : '') +
        (B.story.flags.govUnlocked ? '<button class="bj-lic-banner" type="button" onclick="Biz.jobTab(\'licenses\')"><i class="fa-solid fa-file-signature"></i><div><b>Лицензии</b><span>алкоголь и оружие · обучение</span></div><i class="fa-solid fa-chevron-right"></i></button>' : '') +
        supplyTaskCard() +
        '<div class="bj-stats"><div><b>' + B.stats.orders + '</b><span>заказов</span></div><div><b>' + fmt(B.stats.revenue) + '</b><span>выручка</span></div><div><b>' + B.points.length + '</b><span>точек</span></div></div>' +
        '<div class="bj-rate"><span>Рейтинг</span><b>' + (B.stats.rating || 4.8) + '</b><span>· потеряно ' + (B.stats.missed || 0) + '</span></div>' +
        '<button class="bj-shift" type="button" onclick="Biz.shift()"><span class="bj-play"></span> Открыть смену</button>' +
        '<p class="bj-note">10 секунд: заказы, сотрудники и события</p>' +
        '<div class="bj-sec"><b>События</b><span>сегодня</span></div>' +
        (B.events.length ? B.events.slice(0, 5).map(function (e) { return '<div class="bj-event"><i class="fa-solid fa-circle"></i><div><b>' + esc(e.text) + '</b><span>' + e.time + '</span></div></div>'; }).join('') : '<p class="bj-empty">Пока тихо. Открой точку и проведи смену.</p>');
    } else if (jobTab === 'points') {
      body = '<div class="bj-sec"><b>Мои точки</b><span>' + B.points.length + '</span></div>' +
        (B.points.length ? B.points.map(function (p) {
          var t = TYPES[p.type], si = spotInfo(p);
          var staff = B.staff.filter(function (s) { return s.pointId === p.id; }).length;
          return '<div class="bj-point"><span class="bj-point-ic" style="background:' + t.color + '"><i class="fa-solid ' + t.icon + '"></i></span>' +
            '<div class="bj-point-info"><b>' + t.name + '</b><span>' + si.area + ' · заказов: ' + (p.orders || 0) + ' · товар: ' + pointStock(p) + '</span><small>' + (staff ? staff + ' сотрудник' : 'без сотрудника') + ' · аренда ' + fmt(t.rent) + '</small></div></div>';
        }).join('') : '<p class="bj-empty">Точек нет. Открой первую на карте.</p>') +
        '<button class="bj-open" type="button" onclick="Biz.openMap(\'rent\')"><i class="fa-solid fa-plus"></i> Открыть точку</button>' +
        '<button class="bj-open ghost" type="button" onclick="Biz.openMap(\'view\')"><i class="fa-solid fa-map"></i> Карта города</button>';
    } else if (jobTab === 'licenses') {
      body = renderLicenses();
    } else if (jobTab === 'auto') {
      body = renderAuto();
    } else if (jobTab === 'admin') {
      body = renderAdmin();
    } else {
      var hired = B.staff.map(function (s) {
        var p = B.points.filter(function (x) { return x.id === s.pointId; })[0];
        return '<div class="bj-person"><span class="bj-ava" style="background:' + (s.color || '#0ea5e9') + '">' + (s.ini || 'С') + '</span>' +
          '<div><b>' + esc(s.name) + '</b><span>' + esc(s.role) + ' · ' + (p ? TYPES[p.type].name : 'без точки') + '</span><small>' + fmt(s.salary) + '/смена · +' + Math.round(s.eff * 100) + '% заказов</small></div></div>';
      }).join('');
      var free = B.points.filter(function (p) { return !B.staff.some(function (s) { return s.pointId === p.id; }); });
      var pool = STAFF_POOL.filter(function (c) { return !B.staff.some(function (s) { return s.cid === c.id; }); }).map(function (c) {
        return '<div class="bj-person"><span class="bj-ava" style="background:' + c.color + '">' + c.ini + '</span>' +
          '<div><b>' + c.name + '</b><span>' + c.role + ' · ' + fmt(c.salary) + '/смена</span><small>+' + Math.round(c.eff * 100) + '% к заказам</small></div>' +
          '<button class="bj-hire" type="button" onclick="Biz.hire(\'' + c.id + '\')">Нанять</button></div>';
      }).join('');
      body = (hired ? '<div class="bj-sec"><b>Команда</b><span>' + B.staff.length + '</span></div>' + hired : '<p class="bj-empty">Команды пока нет.</p>') +
        '<div class="bj-sec"><b>Кандидаты</b><span>' + (free.length ? free.length + ' свободных точек' : 'нет свободных точек') + '</span></div>' +
        (free.length ? pool : '<p class="bj-empty">Сначала откройте точку — сотрудника нужно куда-то поставить.</p>') +
        '<p class="bj-note">Найм — 3 000 ₽. Зарплата списывается каждую смену.</p>';
    }
    jobHost.innerHTML = '<div class="bj">' +
      '<header class="bj-top"><button class="bj-back" type="button" data-back><i class="fa-solid fa-chevron-left"></i></button>' +
      '<div class="bj-brand"><b>LAVKA <span>JOB</span></b><span>бизнес-центр</span></div>' +
      '<div class="bj-lvl">ур. <b>' + lvl + '</b></div></header>' +
      '<div class="bj-cash"><span>Бизнес-счёт</span><b>' + fmt(B.cash) + '</b>' +
      '<div class="bj-xp"><i style="width:' + pct + '%"></i></div><small>' + (B.level >= MAX_LEVEL ? 'максимальный уровень' : B.xp + ' / ' + next + ' XP') + '</small></div>' +
      '<div class="bj-tabs">' + tabs + '</div>' +
      '<div class="app-scroll pb bj-body">' + body + '</div></div>';
  }

  Biz.jobTab = function (t) { jobTab = t; renderJob(); };

  var shiftEl = null;
  var shift = null;
  var SHIFT_TITLES = {
    pvz: ['Выдача заказа', 'Возврат', 'Примерка', 'Отправка', 'Крупная посылка'],
    kiosk: ['Покупка', 'Кофе', 'Снеки', 'Пресса', 'Срочный заказ'],
    shop: ['Корзина', 'Крупный заказ', 'Доставка', 'Покупка', 'Пакет'],
    cafe: ['Кофе', 'Круассан', 'Заказ с собой', 'Десерт', 'Большой заказ'],
    barbershop: ['Стрижка', 'Борода', 'Укладка', 'Уход', 'Запись'],
    carwash: ['Мойка', 'Химчистка', 'Полировка', 'Коврики', 'Экспресс'],
    pcclub: ['Час игры', 'Турнир', 'Напитки', 'Абонемент', 'Ночной пакет'],
    alcohol: ['Вино', 'Крепкое', 'Пиво', 'Доставка', 'Крупный заказ'],
    pharmacy: ['Лекарства', 'Витамины', 'Заказ', 'Консультация', 'Доставка'],
    gym: ['Абонемент', 'Тренировка', 'Персональный', 'Спортпит', 'Годовой'],
    boutique: ['Платье', 'Костюм', 'Аксессуар', 'Примерка', 'Крупный заказ'],
    electronics: ['Смартфон', 'Ноутбук', 'Наушники', 'Гарантия', 'Крупный заказ'],
    weapon: ['Оружие', 'Патроны', 'Экипировка', 'Документы', 'Крупный заказ'],
    cinema: ['Билет', 'Попкорн', 'Сеанс', 'Комбо', 'Группа'],
    hotel: ['Номер', 'Завтрак', 'Поздний выезд', 'Люкс', 'Группа'],
    autosalon: ['Авто', 'Тест-драйв', 'Кредит', 'Допы', 'Крупный заказ'],
    mall: ['Покупка', 'Еда', 'Кино', 'Парковка', 'Крупный заказ']
  };

  function shiftStaffCount(pid) {
    return B.staff.filter(function (s) { return s.pointId === pid; }).length;
  }

  function shiftOrderHTML(o) {
    var p = B.points.filter(function (x) { return x.id === o.pointId; })[0];
    var si = p ? spotInfo(p) : null;
    return '<div class="shift-order' + (o.done ? ' done' : '') + (o.urgent ? ' urgent' : '') + '">' +
      '<div class="shift-ord"><span>' + (o.urgent ? 'СРОЧНО · ' : '') + (si ? si.area : '') + '</span>' +
      '<b>' + esc(o.title) + '</b><small>' + fmt(o.price) + '</small></div>' +
      (o.done ? '<span class="shift-check">✓</span>' : '<button type="button" onclick="Biz.shiftDo(\'' + o.id + '\')" ' + (shift && shift.actions <= 0 ? 'disabled' : '') + '>Взять</button>') +
      '</div>';
  }

  function renderShift() {
    if (!shift) return;
    var phone = document.getElementById('phone');
    if (!phone) return;
    var top = 0;
    if (shiftEl && shiftEl.parentNode) {
      var oldList = document.getElementById('shift-list');
      top = oldList ? oldList.scrollTop : 0;
    } else {
      shiftEl = document.createElement('div');
      shiftEl.className = 'shift-screen';
      phone.appendChild(shiftEl);
    }
    var left = Math.max(0, Math.ceil((shift.endsAt - Date.now()) / 1000));
    shiftEl.innerHTML = '<div class="shift">' +
      '<header class="shift-top"><div><b>СМЕНА</b><span>' + shift.total + ' заказов · ' + B.points.length + ' точек</span></div>' +
      '<span class="shift-clock" id="shift-clock">00:' + String(left).padStart(2, '0') + '</span></header>' +
      '<div class="shift-stats"><div><b>' + shift.done + '</b><span>выполнено</span></div>' +
      '<div><b>' + fmt(shift.revenue) + '</b><span>выручка</span></div>' +
      '<div><b>' + shift.actions + '</b><span>действия</span></div></div>' +
      '<div class="shift-prog"><i style="width:' + Math.round(shift.done / Math.max(1, shift.total) * 100) + '%"></i></div>' +
      '<div class="shift-list" id="shift-list">' + shift.list.map(shiftOrderHTML).join('') + '</div>' +
      '<div class="shift-auto">Смена закроется автоматически · оставайтесь до конца</div>' +
      '</div>';
    var nl = document.getElementById('shift-list');
    if (nl) nl.scrollTop = top;
  }

  function tickShift() {
    if (!shift || shift.paused) return;
    var left = Math.max(0, Math.ceil((shift.endsAt - Date.now()) / 1000));
    var clock = document.getElementById('shift-clock');
    if (clock) clock.textContent = '00:' + String(left).padStart(2, '0');
    if (!shift.eventDone && left <= 5) showShiftEvent();
    if (left <= 0) finishShift();
  }

  function staffTick() {
    if (!shift || shift.paused) return;
    var points = {};
    B.staff.forEach(function (s) { points[s.pointId] = (points[s.pointId] || 0) + 1; });
    var processed = 0;
    Object.keys(points).forEach(function (pid) {
      var pending = shift.list.filter(function (o) { return !o.done && o.pointId === pid; });
      if (!pending.length) return;
      var o = pending[Math.floor(Math.random() * pending.length)];
      o.done = true;
      shift.done++;
      shift.revenue += o.price;
      processed++;
    });
    if (processed) renderShift();
  }

  function showShiftEvent() {
    if (!shift || shift.paused) return;
    shift.paused = true;
    shift.eventDone = true;
    shift.pauseAt = Date.now();
    clearInterval(shift.timer);
    clearInterval(shift.staffTimer);
    var events = [
      { title: 'Терминал сломался', text: 'Касса не принимает оплату. Решение?', a: 'Починить · 1 500 ₽', b: 'Работать вручную', id: 'terminal' },
      { title: 'Крупный заказ', text: 'Срочная доставка на 4 000 ₽.', a: 'Принять', b: 'Отказать', id: 'big' },
      { title: 'Проверка', text: 'Инспектор проверяет документы.', a: 'Показать документы', b: 'Закрыть точку', id: 'check' }
    ];
    shift.ev = events[Math.floor(Math.random() * events.length)];
    var card = document.createElement('div');
    card.className = 'shift-event';
    card.id = 'shift-event';
    card.innerHTML = '<div class="shift-event-card"><span>СОБЫТИЕ</span><b>' + shift.ev.title + '</b><p>' + shift.ev.text + '</p>' +
      '<button type="button" onclick="Biz.shiftEvent(\'a\')">' + shift.ev.a + '</button>' +
      '<button type="button" class="ghost" onclick="Biz.shiftEvent(\'b\')">' + shift.ev.b + '</button></div>';
    shiftEl.appendChild(card);
  }

  Biz.shiftEvent = function (which) {
    if (!shift || !shift.ev) return;
    var ev = shift.ev;
    if (ev.id === 'terminal') {
      if (which === 'a') { shift.eventCost += 1500; }
      else { shift.actions = Math.max(0, shift.actions - 2); }
    } else if (ev.id === 'big') {
      if (which === 'a' && B.points.length) {
        shift.list.unshift({ id: 'big' + Date.now(), pointId: B.points[0].id, title: 'Крупный заказ', price: 4000, urgent: true, done: false });
        shift.total++;
      } else { shift.ratingHit = true; }
    } else if (ev.id === 'check') {
      if (which === 'a') { shift.ratingBoost = true; }
      else {
        var lost = 0;
        shift.list = shift.list.filter(function (o) {
          if (!o.done && lost < 3) { lost++; return false; }
          return true;
        });
        shift.total = Math.max(shift.done, shift.total - lost);
      }
    }
    var card = document.getElementById('shift-event');
    if (card) card.remove();
    shift.endsAt += Date.now() - shift.pauseAt;
    shift.paused = false;
    shift.timer = setInterval(tickShift, 1000);
    shift.staffTimer = setInterval(staffTick, 2000);
    renderShift();
  };

  Biz.shiftDo = function (id) {
    if (!shift || shift.paused) return;
    if (shift.actions <= 0) { toast('Действия закончились — сотрудники доделают'); return; }
    var o = shift.list.filter(function (x) { return x.id === id; })[0];
    if (!o || o.done) return;
    o.done = true;
    shift.done++;
    shift.revenue += o.price;
    shift.actions--;
    renderShift();
  };

  function finishShift(silent) {
    if (!shift) return;
    clearInterval(shift.timer);
    clearInterval(shift.staffTimer);
    var s = shift;
    shift = null;
    if (shiftEl && shiftEl.parentNode) shiftEl.parentNode.removeChild(shiftEl);
    shiftEl = null;
    var rent = B.points.reduce(function (a, p) { return a + TYPES[p.type].rent; }, 0);
    var salaries = B.staff.reduce(function (a, x) { return a + x.salary; }, 0);
    var net = s.revenue - rent - salaries - (s.eventCost || 0);
    B.cash = Math.max(0, B.cash + net);
    creditCharge(net);
    B.stats.shifts = (B.stats.shifts || 0) + 1;
    B.stats.orders = (B.stats.orders || 0) + s.done;
    B.stats.missed = (B.stats.missed || 0) + Math.max(0, s.total - s.done);
    var ratio = s.done / Math.max(1, s.total);
    var rating = Number(B.stats.rating) || 4.8;
    rating += ratio >= 0.7 ? 0.05 : (ratio < 0.4 ? -0.15 : 0);
    if (s.ratingBoost) rating += 0.05;
    if (s.ratingHit) rating -= 0.05;
    B.stats.rating = Math.max(3, Math.min(5, Math.round(rating * 100) / 100));
    B.stats.revenue = (B.stats.revenue || 0) + Math.max(0, s.revenue);
    B.events.unshift({ t: 'shift', text: 'Смена: ' + s.done + ' из ' + s.total + ' · ' + fmt(net), time: nowTime() });
    var gained = Math.round(s.done * 3 + 12 + (ratio >= 0.8 ? 15 : 0));
    addXp(gained);
    storyTick();
    var soldByPoint = {};
    s.list.forEach(function (o) { if (o.done) soldByPoint[o.pointId] = (soldByPoint[o.pointId] || 0) + 1; });
    B.points.forEach(function (p) { if (soldByPoint[p.id]) p.stock = Math.max(0, pointStock(p) - soldByPoint[p.id]); });
    save();
    if (jobHost) renderJob();
    var rows = '<div class="bj-shift-row"><div><b>Выполнено заказов</b><span>' + s.done + ' из ' + s.total + '</span></div><div class="bj-shift-sum"><b>+' + fmt(s.revenue) + '</b></div></div>' +
      '<div class="bj-shift-row"><div><b>Аренда</b><span>' + B.points.length + ' точек</span></div><div class="bj-shift-sum"><b class="minus">−' + fmt(rent) + '</b></div></div>' +
      '<div class="bj-shift-row"><div><b>Зарплата</b><span>' + B.staff.length + ' сотрудников</span></div><div class="bj-shift-sum"><b class="minus">−' + fmt(salaries) + '</b></div></div>' +
      (s.eventCost ? '<div class="bj-shift-row"><div><b>Событие</b><span>ремонт и расходы</span></div><div class="bj-shift-sum"><b class="minus">−' + fmt(s.eventCost) + '</b></div></div>' : '') +
      '<div class="bj-shift-total"><span>Итого на счёт</span><b class="' + (net >= 0 ? 'plus' : 'minus') + '">' + (net >= 0 ? '+' : '') + fmt(net) + '</b></div>' +
      '<p class="bj-note">Рейтинг: ' + B.stats.rating + ' · +' + gained + ' XP</p>' +
      '<button class="btn btn-primary btn-block" type="button" onclick="Biz.closeSheet()">Готово</button>';
    if (silent) { toast('Автосмена: ' + (net >= 0 ? '+' : '') + fmt(net)); return; }
    showSheet('<div class="bj-sheet-grab"></div><h3>Смена закрыта</h3><p class="bj-sheet-sub">' + (ratio >= 0.7 ? 'Хорошая смена' : ratio < 0.4 ? 'Много потерянных заказов' : 'Средний результат') + '</p>' + rows);
  }

  Biz.shiftFinish = function () { finishShift(); };

  Biz.shift = function () {
    if (shift) return;
    if (!B.points.length) { toast('Сначала откройте точку'); openMap('rent'); return; }
    var list = [];
    B.points.forEach(function (p) {
      var t = TYPES[p.type], si = spotInfo(p);
      var staffN = shiftStaffCount(p.id);
      var stock = pointStock(p);
      if (stock <= 0) return;
      var n = Math.min(stock, Math.max(3, Math.round((5 + staffN * 4) * si.mult * (0.85 + (Number(B.stats.rating) || 4.8) / 20))));
      var titles = SHIFT_TITLES[p.type] || SHIFT_TITLES.pvz;
      for (var i = 0; i < n; i++) {
        var urgent = Math.random() < 0.18;
        var price = Math.round(t.avg * (0.9 + Math.random() * 1.2) * (urgent ? 1.3 : 1) / 10) * 10;
        list.push({ id: 'o' + i + '_' + Date.now() + Math.floor(Math.random() * 99), pointId: p.id, title: titles[Math.floor(Math.random() * titles.length)], price: price, urgent: urgent, done: false });
      }
    });
    if (!list.length) {
      var needBoxes = B.points.length > 0 && B.points.every(function (p) { return p.type === 'pvz'; });
      toast(needBoxes ? 'Нет коробок. Закажи их на сайте «Опт»' : 'Нет товара. Закажи поставку на сайте «Опт»');
      return;
    }
    list.sort(function (a, b) { return (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0) || b.price - a.price; });
    shift = { list: list, total: list.length, actions: 5 + B.staff.length * 2, done: 0, revenue: 0,
      endsAt: Date.now() + 10000, eventDone: false, eventCost: 0, paused: false, ev: null };
    shift.timer = setInterval(tickShift, 1000);
    shift.staffTimer = setInterval(staffTick, 2000);
    renderShift();
    tickShift();
  };

  // ============================================================
  // АВТОМАТИЗАЦИЯ СМЕН
  // ============================================================
  var autoTimer = null;
  var AUTO_PACKS = [
    { id: 'a10', shifts: 10, price: 15000 },
    { id: 'a30', shifts: 30, price: 35000 },
    { id: 'a100', shifts: 100, price: 90000 }
  ];

  function stopAuto(quiet) {
    B.auto.on = false;
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    save();
    if (!quiet) toast('Автоматизация выключена');
    if (jobHost) renderJob();
  }

  function startAuto() {
    if (!B.points.length) { toast('Сначала откройте точку'); return; }
    if (!B.auto.left) { toast('Сначала купите пакет автосмен'); return; }
    B.auto.on = true;
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = setInterval(runAutoShift, 10000);
    save();
    if (jobHost) renderJob();
    toast('Автоматизация включена');
  }

  function runAutoShift() {
    if (!B.auto.on) return;
    if (shift) return;
    if (B.auto.left <= 0) { stopAuto(true); return; }
    var list = [];
    B.points.forEach(function (p) {
      var t = TYPES[p.type], si = spotInfo(p);
      var stock = pointStock(p);
      if (stock <= 0) return;
      var staffN = shiftStaffCount(p.id);
      var n = Math.min(stock, Math.max(3, Math.round((5 + staffN * 4) * si.mult * (0.85 + (Number(B.stats.rating) || 4.8) / 20))));
      var titles = SHIFT_TITLES[p.type] || SHIFT_TITLES.pvz;
      for (var i = 0; i < n; i++) {
        var price = Math.round(t.avg * (0.9 + Math.random() * 1.2) / 10) * 10;
        list.push({ id: 'a' + i + '_' + Date.now() + Math.floor(Math.random() * 99), pointId: p.id, title: titles[Math.floor(Math.random() * titles.length)], price: price, done: true });
      }
    });
    if (!list.length) { stopAuto(true); toast('Автосмена остановлена: нет товара'); return; }
    var revenue = list.reduce(function (a, o) { return a + o.price; }, 0);
    shift = { list: list, total: list.length, actions: 0, done: list.length, revenue: revenue,
      endsAt: Date.now(), eventDone: true, eventCost: 0, paused: false, ev: null };
    B.auto.left--;
    finishShift(true);
  }

  function renderAuto() {
    var on = !!B.auto.on;
    var packs = AUTO_PACKS.map(function (p) {
      return '<div class="auto-pack"><div><b>' + p.shifts + ' смен</b><span>' + fmt(p.price) + '</span></div>' +
        '<button type="button" onclick="Biz.autoBuy(\'' + p.id + '\')">Купить</button></div>';
    }).join('');
    return '<div class="auto-hero">' +
      '<div class="auto-top"><span>АВТОМАТИЗАЦИЯ</span><b class="' + (on ? 'on' : '') + '">' + (on ? 'включена' : 'выключена') + '</b></div>' +
      '<div class="auto-left"><b>' + B.auto.left + '</b><span>автосмен осталось</span></div>' +
      '<button class="auto-btn' + (on ? ' stop' : '') + '" type="button" onclick="Biz.autoToggle()">' +
      (on ? 'Выключить' : (B.auto.left ? 'Включить' : 'Нужен пакет')) + '</button></div>' +
      '<p class="auto-note">Одна автосмена раз в 10 секунд: сама открывается и закрывается. Товар списывается, аренда и зарплата тоже.</p>' +
      '<div class="bj-sec"><b>Пакеты автосмен</b><span>платно</span></div>' + packs +
      '<p class="bj-note">Работает, пока приложение открыто.</p>';
  }

  Biz.autoToggle = function () {
    if (B.auto.on) stopAuto();
    else startAuto();
  };

  Biz.autoBuy = function (id) {
    var p = AUTO_PACKS.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    if (!B.points.length) { toast('Сначала откройте точку'); return; }
    if (B.cash < p.price) { toast('Не хватает ' + fmt(p.price - B.cash)); return; }
    B.cash -= p.price;
    B.auto.left += p.shifts;
    B.events.unshift({ t: 'auto', text: 'Автоматизация: +' + p.shifts + ' смен', time: nowTime() });
    save();
    if (jobHost) renderJob();
    toast('+' + p.shifts + ' автосмен');
    if (!B.auto.on) startAuto();
  };

  Biz.hire = function (cid) {
    var c = STAFF_POOL.filter(function (x) { return x.id === cid; })[0];
    if (!c) return;
    var free = B.points.filter(function (p) { return !B.staff.some(function (s) { return s.pointId === p.id; }); });
    if (!free.length) { toast('Нет свободных точек'); return; }
    if (B.cash < 3000) { toast('Найм стоит 3 000 ₽'); return; }
    B.cash -= 3000;
    var point = free[0];
    B.staff.push({ cid: c.id, name: c.name, role: c.role, salary: c.salary, eff: c.eff, pointId: point.id, ini: c.ini, color: c.color });
    B.events.unshift({ t: 'hire', text: c.name + ' нанят · ' + TYPES[point.type].name, time: nowTime() });
    toast(c.name + ' нанят');
    addXp(20);
    storyTick();
    save();
    renderJob();
  };

  Biz.openJob = function (tab) { if (tab) jobTab = tab; LV.openApp('job'); };

  // ============================================================
  // ПРОИЗВОДСТВО
  // ============================================================
  var prodHost = null;

  function renderProd() {
    if (!prodHost) return;
    var unlocked = B.level >= 10 || B.story.flags.prodUnlocked;
    if (!unlocked) {
      prodHost.innerHTML = '<div class="pr-lock"><span><i class="fa-solid fa-lock"></i></span><b>Производство закрыто</b>' +
        '<p>Откроется на 10 уровне Lavka Job. Сейчас у вас ' + B.level + ' уровень.</p>' +
        '<button type="button" data-back>Понятно</button></div>';
      return;
    }
    var f = B.factory;
    var body;
    if (!f || !f.built) {
      body = '<div class="pr-empty"><span><i class="fa-solid fa-industry"></i></span><h3>Завод не построен</h3>' +
        '<p>Выберите место в Промзоне и постройте цех. Стоимость — 150 000 ₽.</p>' +
        '<button type="button" onclick="Biz.openMap(\'factory\')">Выбрать место</button></div>';
    } else {
      body = '<div class="pr-factory"><div class="pr-factory-top"><span>ЦЕХ №4</span><i class="fa-solid fa-industry"></i></div>' +
        '<b>Лавка Продакшн</b><span>Промзона · линия №1</span></div>' +
        '<div class="pr-stock"><span>На складе</span><b>' + (f.stock || 0) + ' шт</b><small>партия — 100 шт</small></div>' +
        '<button class="pr-run" type="button" onclick="Biz.produce()"><i class="fa-solid fa-gears"></i> Запустить партию · 5 000 ₽</button>' +
        '<button class="pr-sell" type="button" onclick="Biz.sell()"><i class="fa-solid fa-truck-fast"></i> Продать партию · 9 000 ₽</button>' +
        '<div class="pr-stats"><div><b>' + (B.stats.sold || 0) + '</b><span>партий продано</span></div><div><b>' + fmt(B.stats.revenue) + '</b><span>выручка</span></div></div>' +
        '<p class="pr-note">Товар уходит в Лавку. Чем выше уровень — тем больше партия.</p>';
    }
    prodHost.innerHTML = '<div class="pr">' +
      '<header class="pr-top"><button class="pr-back" type="button" data-back><i class="fa-solid fa-chevron-left"></i></button>' +
      '<div><b>ПРОИЗВОДСТВО</b><span>свой продукт</span></div><span class="pr-lvl">ур. ' + B.level + '</span></header>' +
      '<div class="app-scroll pb pr-body">' + body + '</div></div>';
  }

  Biz.produce = function () {
    if (!B.factory || !B.factory.built) { toast('Сначала постройте завод'); return; }
    if (B.cash < 5000) { toast('Нужно 5 000 ₽'); return; }
    B.cash -= 5000;
    B.factory.stock = (B.factory.stock || 0) + 100;
    B.events.unshift({ t: 'prod', text: 'Выпущена партия 100 шт', time: nowTime() });
    addXp(25);
    save();
    renderProd();
    toast('Партия готова: 100 шт');
  };

  Biz.sell = function () {
    if (!B.factory || !B.factory.built) { toast('Сначала постройте завод'); return; }
    if ((B.factory.stock || 0) < 100) { toast('На складе меньше партии'); return; }
    B.factory.stock -= 100;
    B.cash += 9000;
    B.stats.sold = (B.stats.sold || 0) + 1;
    B.events.unshift({ t: 'sold', text: 'Партия продана · +9 000 ₽', time: nowTime() });
    addXp(45);
    storyTick();
    save();
    renderProd();
    if (jobHost) renderJob();
    toast('Партия продана · +9 000 ₽');
  };

  Biz.buildFactory = function () {
    if (B.factory && B.factory.built) { toast('Завод уже построен'); return; }
    if (B.cash < 150000) { toast('Нужно 150 000 ₽. Проведите ещё смены'); return; }
    B.cash -= 150000;
    B.factory = { built: true, district: 'industrial', stock: 0 };
    B.events.unshift({ t: 'factory', text: 'Завод построен в Промзоне', time: nowTime() });
    closeMap();
    addXp(80);
    storyTick();
    save();
    toast('Завод построен');
    if (LV.current && LV.current.id === 'production' && prodHost) renderProd();
    if (jobHost) renderJob();
  };

  // ============================================================
  // КРЕДИТЫ
  // ============================================================
  var crHost = null;
  var CREDIT_SHARE = 0.4;
  var CREDIT_MAX_LOANS = 3;
  var CREDIT_TERMS = [20, 40, 60];
  var crForm = { amount: 0, term: 20 };

  function creditGrade(s) {
    return s >= 90 ? 'A+' : s >= 75 ? 'A' : s >= 60 ? 'B' : s >= 45 ? 'C' : s >= 30 ? 'D' : 'E';
  }
  function creditRate(amount) {
    return 0.1 + (100 - B.credit.score) / 500 + (amount || 0) / 2000000;
  }
  function creditDebt() {
    return B.credit.loans.reduce(function (s, a) { return s + Math.max(0, a.total - a.paid); }, 0);
  }
  function creditLimit() {
    var base = 40000 + B.level * 8000 + (B.stats.revenue || 0) * 0.15;
    var mult = 0.5 + B.credit.score / 100;
    var lim = Math.round(base * mult / 1000) * 1000;
    return Math.max(0, lim - creditDebt());
  }
  function creditCalc(amount, term) {
    var total = Math.round((amount || 0) * (1 + creditRate(amount)));
    return { total: total, payment: Math.ceil(total / Math.max(1, term)), over: total - (amount || 0) };
  }

  function closeLoan(id) {
    var a = B.credit.loans.filter(function (x) { return x.id === id; })[0];
    if (!a) return;
    B.credit.loans = B.credit.loans.filter(function (x) { return x.id !== id; });
    B.credit.score = Math.min(100, B.credit.score + 10);
    B.events.unshift({ t: 'credit', text: 'Кредит закрыт · ' + fmt(a.total), time: nowTime() });
    addSms('Лавка Банк', 'Кредит закрыт. Кредитная оценка: ' + B.credit.score + '.');
    toast('Кредит закрыт');
    save();
    if (crHost) renderCredit();
  }

  function creditCharge(net) {
    var loans = B.credit.loans || [];
    if (!loans.length) return;
    var pot = Math.round(Math.max(0, net || 0) * CREDIT_SHARE);
    if (pot <= 0) {
      B.events.unshift({ t: 'credit', text: 'Платёж по кредитам перенесён', time: nowTime() });
      save();
      if (crHost) renderCredit();
      return;
    }
    var closed = [];
    loans.forEach(function (a) {
      if (pot <= 0) return;
      var due = Math.min(a.payment, a.total - a.paid);
      if (due <= 0) { closed.push(a.id); return; }
      var pay = Math.min(due, pot);
      pot -= pay;
      a.paid += pay;
      B.cash = Math.max(0, B.cash - pay);
      B.credit.score = Math.min(100, B.credit.score + 1);
      if (a.paid >= a.total) closed.push(a.id);
    });
    B.events.unshift({ t: 'credit', text: 'Платёж по кредитам', time: nowTime() });
    save();
    closed.forEach(closeLoan);
    if (crHost) renderCredit();
  }

  function renderCredit() {
    if (!crHost) return;
    var c = B.credit, loans = c.loans || [];
    var lim = creditLimit();
    var head = '<header class="cr-top"><button class="cr-back" type="button" data-back><i class="fa-solid fa-chevron-left"></i></button>' +
      '<div><b>КРЕДИТЫ</b><span>Лавка Банк</span></div><span class="cr-score">' + creditGrade(c.score) + '</span></header>';
    var body = '<div class="cr-card hero"><span class="cr-kicker">КРЕДИТНАЯ ОЦЕНКА</span><b>' + creditGrade(c.score) + ' · ' + c.score + '</b>' +
      '<span class="cr-card-sub">доступно ' + fmt(lim) + ' · кредитов ' + loans.length + ' из ' + CREDIT_MAX_LOANS + '</span></div>';
    if (c.score < 30) {
      body += '<div class="cr-warn"><i class="fa-solid fa-circle-exclamation"></i><div><b>Кредитование приостановлено</b><span>Оценка ниже 30. Погасите кредиты и проведите смены.</span></div></div>';
    }
    if (loans.length) {
      body += '<div class="cr-sub">Мои кредиты</div>' + loans.map(function (a) {
        var left = a.total - a.paid;
        var pct = Math.min(100, Math.round(a.paid / a.total * 100));
        return '<div class="cr-loan">' +
          '<div class="cr-loan-top"><b>' + fmt(left) + '</b><span>' + Math.round(a.rate * 100) + '% · ' + a.term + ' смен</span></div>' +
          '<div class="cr-bar"><i style="width:' + pct + '%"></i></div>' +
          '<div class="cr-loan-foot"><span>Платёж до ' + fmt(a.payment) + '</span>' +
          '<button class="cr-btn" type="button" onclick="Biz.creditPay(\'' + a.id + '\')">Погасить</button></div></div>';
      }).join('');
    }
    if (loans.length < CREDIT_MAX_LOANS && c.score >= 30 && lim >= 5000) {
      if (!crForm.amount) crForm.amount = Math.min(lim, 50000);
      if (crForm.amount > lim) crForm.amount = lim;
      var calc = creditCalc(crForm.amount, crForm.term);
      body += '<div class="cr-sub">Новый кредит</div>' +
        '<div class="cr-form">' +
        '<label class="cr-label">Сумма кредита</label>' +
        '<div class="cr-input"><input id="cr-amount" type="number" inputmode="numeric" min="5000" max="' + lim + '" step="1000" value="' + crForm.amount + '" oninput="Biz.creditAmount(this.value)"><span>₽</span></div>' +
        '<div class="cr-terms">' + CREDIT_TERMS.map(function (t) {
          return '<button class="cr-chip' + (crForm.term === t ? ' on' : '') + '" type="button" onclick="Biz.creditTerm(' + t + ')">' + t + ' смен</button>';
        }).join('') + '</div>' +
        '<div class="cr-preview" id="cr-preview">Платёж до ' + fmt(calc.payment) + ' · переплата ' + fmt(calc.over) + '</div>' +
        '<button class="cr-btn primary" id="cr-take" type="button" onclick="Biz.creditTake()">Взять ' + fmt(crForm.amount) + '</button>' +
        '</div>';
    }
    if (lim < 5000 && loans.length < CREDIT_MAX_LOANS) {
      body += '<p class="cr-note">Лимит исчерпан — погасите часть кредитов, и он освободится.</p>';
    }
    body += '<div class="cr-sub">Как это работает</div>' +
      '<div class="cr-rules"><div><i class="fa-solid fa-1"></i><span>Берёте любую сумму в пределах лимита.</span></div>' +
      '<div><i class="fa-solid fa-2"></i><span>Со смены уходит 40% прибыли — на все кредиты сразу.</span></div>' +
      '<div><i class="fa-solid fa-3"></i><span>Оценка растёт от платежей и падает от просрочек.</span></div>' +
      '<div><i class="fa-solid fa-4"></i><span>Можно держать до трёх кредитов одновременно.</span></div></div>';
    crHost.innerHTML = '<div class="cr">' + head + '<div class="app-scroll pb cr-body">' + body + '</div></div>';
  }

  Biz.creditAmount = function (v) {
    var lim = creditLimit();
    var n = Math.round((parseInt(v, 10) || 0) / 1000) * 1000;
    if (n > lim) n = lim;
    crForm.amount = Math.max(0, n);
    var calc = creditCalc(crForm.amount, crForm.term);
    var pv = document.getElementById('cr-preview');
    if (pv) pv.textContent = 'Платёж до ' + fmt(calc.payment) + ' · переплата ' + fmt(calc.over);
    var btn = document.getElementById('cr-take');
    if (btn) { btn.textContent = 'Взять ' + fmt(crForm.amount); btn.disabled = crForm.amount < 5000; }
  };

  Biz.creditTerm = function (t) { crForm.term = Number(t) || 20; renderCredit(); };

  Biz.creditTake = function () {
    if (B.credit.score < 30) { toast('Кредитная оценка слишком низкая'); return; }
    if (B.credit.loans.length >= CREDIT_MAX_LOANS) { toast('Уже три кредита — больше не дадим'); return; }
    var lim = creditLimit();
    var amount = Math.min(crForm.amount, lim);
    if (amount < 5000) { toast('Минимум 5 000 ₽'); return; }
    var term = crForm.term;
    var calc = creditCalc(amount, term);
    B.credit.loans.push({ id: 'l' + Date.now(), amount: amount, term: term, rate: creditRate(amount), total: calc.total, payment: calc.payment, paid: 0, missed: 0, taken: Date.now() });
    B.credit.taken = (B.credit.taken || 0) + 1;
    B.cash += amount;
    B.events.unshift({ t: 'credit', text: 'Кредит · ' + fmt(amount), time: nowTime() });
    crForm.amount = 0;
    save();
    renderCredit();
    addSms('Лавка Банк', 'Одобрено ' + fmt(amount) + '. Платёж до ' + fmt(calc.payment) + ' со смены.');
    toast('Кредит получен · ' + fmt(amount));
  };

  Biz.creditPay = function (id) {
    var a = B.credit.loans.filter(function (x) { return x.id === id; })[0];
    if (!a) return;
    var left = a.total - a.paid;
    if (B.cash < left) { toast('Не хватает ' + fmt(left - B.cash)); return; }
    B.cash -= left;
    a.paid = a.total;
    closeLoan(id);
  };

  // ============================================================
  // ТЕЛЕФОН
  // ============================================================
  var phoneHost = null;
  var phoneTab = 'keypad';
  var dialNumber = '';

  function phoneContacts() {
    ensureGov();
    var list = ['maks', 'mom', 'dad', 'taxi'];
    if (B.story.flags.plotUnlocked) list.push(PLOT_ID);
    if (B.level >= 7) list.push('gov');
    return list;
  }

  function renderPhone() {
    if (!phoneHost) return;
    if (B.level >= 7) ensureGov();
    var tabs = [['keypad', 'Набор'], ['contacts', 'Контакты'], ['recent', 'Недавние']].map(function (t) {
      return '<button class="ph-tab' + (phoneTab === t[0] ? ' on' : '') + '" type="button" onclick="Biz.phoneTab(\'' + t[0] + '\')">' + t[1] + '</button>';
    }).join('');
    var body = '';
    if (phoneTab === 'keypad') {
      var keys = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'], ['*', ''], ['0', '+'], ['#', '']];
      body = '<div class="ph-dialer">' +
        '<div class="ph-dial-num" id="ph-dial-num">' + (dialNumber ? esc(dialNumber) : '<span>Введите номер</span>') + '</div>' +
        '<div class="ph-keys">' + keys.map(function (k) {
          return '<button class="ph-key" type="button" onclick="Biz.dialKey(\'' + k[0] + '\')"><b>' + k[0] + '</b><span>' + k[1] + '</span></button>';
        }).join('') + '</div>' +
        '<div class="ph-dial-actions">' +
        '<button class="ph-callbtn" type="button" onclick="Biz.dialCall()" aria-label="Позвонить"><svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11.4 11.4 0 0 0 3.6.6 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .6 3.6 1 1 0 0 1-.25 1Z"/></svg></button>' +
        '<button class="ph-delbtn" type="button" onclick="Biz.dialBack()" aria-label="Удалить">⌫</button></div></div>';
    } else if (phoneTab === 'contacts') {
      body = phoneContacts().map(function (id) {
        var c = id === PLOT_ID
          ? { name: 'Неизвестный', number: PLOT_NUMBER, ini: '?', color: '#8b5cf6', kind: 'plot' }
          : CONTACTS[id];
        return '<button class="ph-row" type="button" onclick="Biz.callContact(\'' + id + '\')">' +
          '<span class="ph-ava" style="background:' + c.color + '">' + c.ini + '</span>' +
          '<span class="ph-info"><b>' + esc(c.name) + '</b><span>' + esc(c.number) + '</span></span>' +
          '<i class="fa-solid fa-phone"></i></button>';
      }).join('');
    } else {
      var rec = B.story.calls.slice(0, 8);
      body = rec.length ? rec.map(function (c) {
        return '<div class="ph-recent"><i class="fa-solid fa-phone' + (c.missed ? '-slash' : '') + '"></i>' +
          '<div><b>' + esc(c.name) + '</b><span>' + esc(c.number) + ' · ' + c.time + '</span></div><span class="ph-dur">' + (c.dur || '') + '</span></div>';
      }).join('') : '<p class="ph-empty">Звонков пока нет.</p>';
    }
    phoneHost.innerHTML = '<div class="ph">' +
      '<header class="ph-top"><button class="ph-back" type="button" data-back><i class="fa-solid fa-chevron-left"></i></button>' +
      '<b>Телефон</b><span>XPRODC</span></header>' +
      '<div class="ph-tabs">' + tabs + '</div>' +
      '<div class="app-scroll pb ph-body">' + body + '</div></div>';
  }

  Biz.phoneTab = function (t) { phoneTab = t; renderPhone(); };

  function refreshDial() {
    var el = document.getElementById('ph-dial-num');
    if (!el) return;
    if (dialNumber) el.textContent = dialNumber;
    else el.innerHTML = '<span>Введите номер</span>';
  }
  Biz.dialKey = function (k) {
    if (dialNumber.length >= 18) return;
    dialNumber += k;
    refreshDial();
  };
  Biz.dialBack = function () {
    dialNumber = dialNumber.slice(0, -1);
    refreshDial();
  };
  Biz.dialCall = function () {
    var raw = dialNumber.trim();
    var digits = raw.replace(/\D/g, '');
    if (!digits) { toast('Введите номер'); return; }
    var last = digits.slice(-10);
    var hit = null;
    Object.keys(CONTACTS).forEach(function (id) {
      var d = CONTACTS[id].number.replace(/\D/g, '').slice(-10);
      if (d === last) hit = id;
    });
    dialNumber = '';
    if (hit === 'gov') { Biz.callGov(); return; }
    if (last === '70993282223' || last === '0993282223' || digits === '70993282223') {
      Biz.callPlot();
      return;
    }
    if (hit === 'taxi') { openMap('taxi'); return; }
    if (hit) { Biz.callContact(hit); return; }
    B.story.calls.unshift({ name: 'Неизвестный номер', number: raw, time: nowTime(), missed: false, dur: '0:07' });
    save();
    showCall({
      incoming: false, voicemail: true, from: 'Неизвестный номер', number: raw, ini: '?', color: '#64748b',
      lines: ['Гудки…', 'Абонент недоступен. Оставьте сообщение после сигнала.'],
      audio: ['audio/ring.mp3', 'audio/wrong-number.mp3'],
      autoLine: 1,
      autoDelay: 2300
    });
    if (phoneHost) renderPhone();
  };


  Biz.callContact = function (id) {
    if (id === 'taxi') { openMap('taxi'); return; }
    if (id === 'gov') { Biz.callGov(); return; }
    if (id === PLOT_ID) { Biz.callPlot(); return; }
    var c = CONTACTS[id];
    if (!c) return;
    var vm = {
      maks: { lines: ['Автоответчик: Привет, это Макс. Я на встрече.', 'Автоответчик: Если по делу — пиши в Пульс. Перезвоню вечером.'] },
      mom: {
        lines: ['Автоответчик: Привет, это мама. Ты опять пропал.', 'Автоответчик: Перезвони, когда сможешь. Люблю.'],
        audio: ['audio/mom-1.mp3', 'audio/mom-2.mp3'],
        autoAfterAudio: true
      },
      dad: {
        lines: ['Автоответчик: Привет. Это папа.', 'Автоответчик: Слышал, у тебя бизнес. Молодец. Позвони, поговорим.'],
        audio: ['audio/dad-1.mp3', 'audio/dad-2.mp3'],
        autoAfterAudio: true
      }
    }[id] || { lines: ['Автоответчик: Абонент недоступен.'] };
    B.story.calls.unshift({ name: c.name, number: c.number, time: nowTime(), missed: false, dur: '0:12' });
    save();
    voicemail(c.name, c.number, c.ini, c.color, vm.lines, vm.audio, vm.autoAfterAudio);
    if (phoneHost) renderPhone();
  };

  Biz.callPlot = function () {
    if (!B.story.flags.plotUnlocked) {
      if (B.story.step === 4) { B.story.flags.plotUnlocked = true; } else { toast('Номер ещё неизвестен'); return; }
    }
    B.story.calls.unshift({ name: 'Неизвестный', number: PLOT_NUMBER, time: nowTime(), missed: false, dur: '1:40' });
    save();
    var repeat = B.story.flags.contract
      ? 'Аркадий: Я уже дал задание. Контракт подписан — ларёк твой, работай.'
      : (B.story.flags.plotCalled || B.story.step >= 5)
        ? 'Аркадий: Я уже дал задание. Жду в БЦ «Сити», скажешь на ресепшене: к Аркадию.'
        : null;
    if (repeat) {
      showCall({
        incoming: false, from: 'Неизвестный', number: PLOT_NUMBER, ini: '?', color: '#8b5cf6',
        lines: [repeat]
      });
      return;
    }
    showCall({
      incoming: false, from: 'Неизвестный', number: PLOT_NUMBER, ini: '?', color: '#8b5cf6',
      lines: [
        'Неизвестный: Слушаю.',
        'Аркадий: Значит, Максим подсуетился. Меня зовут Аркадий.',
        'Аркадий: Есть ларёк в центре, документы готовы. Подъезжай в БЦ «Сити».',
        'Аркадий: Такси вызови сам — солиднее выглядеть будешь.',
        'Аркадий: Жду. Скажешь на ресепшене: к Аркадию.'
      ],
      onEnd: function () {
        B.story.flags.plotCalled = true;
        B.story.flags.contractVisible = true;
        B.events.unshift({ t: 'call', text: 'Разговор с Аркадием', time: nowTime() });
        save();
        storyTick();
        toast('Контракт ждёт в БЦ «Сити»');
        if (LV.current && LV.current.id === 'job' && jobHost) renderJob();
      }
    });
  };

  // ============================================================
  // SHEET
  // ============================================================
  function showSheet(html) {
    closeSheet();
    var phone = document.getElementById('phone');
    if (!phone) return;
    var el = document.createElement('div');
    el.className = 'bj-sheet';
    el.id = 'bj-sheet';
    el.innerHTML = '<div class="bj-sheet-card" onclick="event.stopPropagation()">' + html + '</div>';
    el.addEventListener('click', function (e) { if (e.target === el) closeSheet(); });
    phone.appendChild(el);
  }
  function closeSheet() {
    var el = document.getElementById('bj-sheet');
    if (el) el.remove();
  }
  Biz.closeSheet = closeSheet;

  // ============================================================
  // РЕГИСТРАЦИЯ ПРИЛОЖЕНИЙ
  // ============================================================
  function ensureRemoved(id) {
    if (!S.removed) S.removed = [];
    if (S.removed.indexOf(id) < 0) S.removed.push(id);
  }
  if (!B.installed.job) ensureRemoved('job');
  if (!B.installed.production && !B.story.flags.prodUnlocked) ensureRemoved('production');

  var origInstall = LV.installApp;
  LV.installApp = function (id) {
    origInstall(id);
    if (id === 'job' && !B.installed.job) {
      B.installed.job = true;
      save();
      storyTick();
    }
    if (id === 'production') {
      B.installed.production = true;
      save();
    }
  };

  LV.registerApp({
    id: 'job', name: 'Lavka Job', icon: 'fa-briefcase', bg: 'linear-gradient(140deg,#0f766e,#115e59)',
    page: 1, installable: true, status: 'white', desc: 'Точки, сотрудники и выручка',
    mount: function (body) {
      jobHost = body;
      B.installed.job = true;
      save();
      renderJob();
      storyTick();
      return function () { jobHost = null; };
    }
  });

  LV.registerApp({
    id: 'production', name: 'Производство', icon: 'fa-industry', bg: 'linear-gradient(140deg,#b45309,#7c2d12)',
    page: 2, installable: false, status: 'white', desc: 'Завод и свой продукт',
    mount: function (body) {
      prodHost = body;
      B.installed.production = true;
      save();
      renderProd();
      return function () { prodHost = null; };
    }
  });

  LV.registerApp({
    id: 'calls', name: 'Телефон', icon: 'fa-phone', bg: 'linear-gradient(140deg,#22c55e,#15803d)',
    page: 0, status: 'white', desc: 'Звонки, такси и контакты',
    mount: function (body) {
      phoneHost = body;
      renderPhone();
      return function () { phoneHost = null; };
    }
  });

  LV.registerApp({
    id: 'credit', name: 'Кредиты', icon: 'fa-hand-holding-dollar', bg: 'linear-gradient(140deg,#065f46,#064e3b)',
    page: 2, status: 'white', desc: 'Займы на развитие бизнеса',
    mount: function (body) {
      crHost = body;
      renderCredit();
      return function () { crHost = null; };
    }
  });

  LV.registerApp({
    id: 'admin', name: 'Админ', icon: 'fa-user-shield', bg: 'linear-gradient(140deg,#111827,#065f46)',
    page: isX8() ? 1 : null, status: 'white', desc: 'Выдача денег · X-8',
    mount: function (body) {
      adminHost = body;
      body.innerHTML = adminPanelHTML();
      return function () { adminHost = null; };
    }
  });

  // ============================================================
  // СТАРТ
  // ============================================================
  if (B.story.step === 0 && !B.story.flags.introCall) {
    B.story.flags.introCall = true;
    save();
    setTimeout(function () {
      queueCall({
        incoming: true, from: 'Макс', number: CONTACTS.maks.number, ini: 'М', color: '#0ea5e9',
        lines: [
          'Макс: Здорово! Ты уже в городе?',
          'Макс: Слушай, есть тема. Поставь Lavka Job из Магазина приложений.',
          'Макс: Я скинул стартовые. Откроешь пункт выдачи — пойдут заказы.',
          'Макс: Всё, я на связи. Не тормози.'
        ]
      });
      addSms('Макс', 'Поставь Lavka Job в Магазине приложений. Там всё по шагам. — Макс');
    }, 1800);
  }

  if (B.auto && B.auto.on && B.auto.left > 0) startAuto();

  LV.save();
})();
