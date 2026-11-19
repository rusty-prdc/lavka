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
    listings: [], nextListId: 0,
    licenses: { alcohol: false, tobacco: false, weapon: false, pharma: false, finance: false, transport: false },
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
    tobacconist: { name: 'Табачная лавка', cost: 190000, rent: 4400, avg: 950, base: 50, icon: 'fa-smoking', color: '#a16207', desc: 'Табак, вейпы и аксессуары', license: 'tobacco', level: 9 },
    medical: { name: 'Медицинский центр', cost: 600000, rent: 11000, avg: 2200, base: 64, icon: 'fa-hospital', color: '#0ea5e9', desc: 'Приёмы, анализы и справки', license: 'pharma', level: 13 },
    pawnshop: { name: 'Ломбард', cost: 700000, rent: 12000, avg: 2400, base: 68, icon: 'fa-hand-holding-dollar', color: '#eab308', desc: 'Залоги, оценка и выкуп', license: 'finance', level: 16 },
    taxifleet: { name: 'Таксопарк', cost: 1100000, rent: 18000, avg: 3600, base: 76, icon: 'fa-taxi', color: '#f59e0b', desc: 'Автопарк и корпоративные поездки', license: 'transport', level: 20 },
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
    tobacconist: 'shop', medical: 'cross', pawnshop: 'rub', taxifleet: 'car',
    gym: 'dumbbell', boutique: 'shirt', electronics: 'phone', cinema: 'film',
    hotel: 'house', autosalon: 'car', mall: 'shop'
  };
  var SERVICES = {
    hospital: { kind: 'cross', color: '#ef4444', icon: 'fa-hospital', label: 'Больница' },
    police: { kind: 'shield', color: '#3b82f6', icon: 'fa-shield-halved', label: 'Полиция' },
    port: { kind: 'anchor', color: '#0ea5e9', icon: 'fa-anchor', label: 'Порт' }
  };
  var MAP_YOU = { x: 380, y: 340 };

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
    { id: 'c4', name: 'Лена', role: 'Кассир', salary: 1000, eff: 0.1, ini: 'Л', color: '#f59e0b' },
    { id: 'c5', name: 'Руслан', role: 'Охранник', salary: 1600, eff: 0.14, ini: 'Р', color: '#dc2626' },
    { id: 'c6', name: 'Марина', role: 'Администратор', salary: 2000, eff: 0.22, ini: 'М', color: '#8b5cf6' },
    { id: 'c7', name: 'Костя', role: 'Логист', salary: 1400, eff: 0.13, ini: 'К', color: '#0891b2' },
    { id: 'c8', name: 'Алия', role: 'Фармацевт', salary: 2100, eff: 0.18, ini: 'А', color: '#10b981' },
    { id: 'c9', name: 'Денис', role: 'Водитель', salary: 1300, eff: 0.11, ini: 'Д', color: '#f97316' }
  ];

  var PLOT_NUMBER = '+7 099 328-22-23';
  var PLOT_ID = 'plot';

  var GOV_NUMBER = '+7 099 000-00-01';
  var LICENSES = {
    alcohol: { name: 'Алкоголь', level: 7, fee: 60000, point: 'alcohol' },
    tobacco: { name: 'Табак', level: 9, fee: 90000, requires: 'alcohol', point: 'tobacconist' },
    weapon: { name: 'Оружие', level: 12, fee: 150000, requires: 'alcohol', point: 'weapon' },
    pharma: { name: 'Фармацевтика', level: 13, fee: 180000, point: 'medical' },
    finance: { name: 'Финансы', level: 16, fee: 260000, point: 'pawnshop' },
    transport: { name: 'Перевозки', level: 20, fee: 380000, point: 'taxifleet' }
  };
  var LICENSE_ORDER = ['alcohol', 'tobacco', 'weapon', 'pharma', 'finance', 'transport'];

  var CONTACTS = {
    maks: { name: 'Макс', number: '+7 999 120-45-67', ini: 'М', color: '#0ea5e9', kind: 'friend' },
    mom: { name: 'Мама', number: '+7 916 555-01-24', ini: 'М', color: '#ec4899', kind: 'family' },
    dad: { name: 'Папа', number: '+7 916 555-77-02', ini: 'П', color: '#f59e0b', kind: 'family' },
    liza: { name: 'Лиза', number: '+7 999 640-12-88', ini: 'Л', color: '#db2777', kind: 'lawyer' },
    vera: { name: 'Виктория', number: '+7 916 202-44-10', ini: 'В', color: '#0ea5e9', kind: 'doctor' },
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
    if (lvl === 7) govIntro();
    notifyLicenses(lvl);
    if (lvl === 20 || lvl === MAX_LEVEL) {
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

  function unlockProduction(quiet) {
    B.story.flags.prodUnlocked = true;
    var def = LV.apps.filter(function (a) { return a.id === 'production'; })[0];
    if (def) def.installable = true;
    if (LV.current && LV.current.id === 'store' && window.Store) Store.refresh();
    save();
    if (!quiet) toast('Открыто приложение «Производство»');
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
    'Получи лицензию на табак',
    'Открой табачную лавку',
    'Получи фармацевтическую лицензию',
    'Открой медицинский центр',
    'Дорасти до 16 уровня',
    'Получи финансовую лицензию',
    'Открой ломбард',
    'Дорасти до 20 уровня',
    'Получи лицензию на перевозки',
    'Открой таксопарк',
    'Дорасти до 30 уровня',
    'Открой ТРЦ',
    'Проведи смену — ОПГ требует 5 000 ₽',
    'Отбей точку от бандитов — реши, когда драться',
    'Вызови 112 и выбери скорую',
    'Довези Макса до больницы на скорой',
    'Дождись новостей от врачей',
    'Поговори с Лизой — изучи камеры БЦ',
    'Найди зацепку в ломбарде',
    'Собери команду из 5 человек',
    'Купи снаряжение в оружейном',
    'Защити ломбард от налёта',
    'Допроси задержанного бандита',
    'Проверь груз в порту',
    'Поезжай в порт «Северный»',
    'Обезвредь босса в порту',
    'Передай босса полиции',
    'Дай показания в отделении',
    'Восстанови разрушенные точки',
    'Открой мемориал Макса',
    'Запусти фонд имени Макса',
    'Расширь сеть до 15 точек',
    'Дай интервью о своём пути',
    'Сюжет пройден — город помнит Макса'
  ];

  function migrateStoryV2() {
    if (B.story.v2) return;
    var st = Number(B.story.step) || 0;
    if (st >= 17) B.story.step = 28;
    else if (st === 16) B.story.step = 26;
    B.story.v2 = true;
    save();
  }

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
    else if (st === 16 && B.licenses.tobacco) nxt = 17;
    else if (st === 17 && countType('tobacconist') >= 1) nxt = 18;
    else if (st === 18 && B.licenses.pharma) nxt = 19;
    else if (st === 19 && countType('medical') >= 1) nxt = 20;
    else if (st === 20 && B.level >= 16) nxt = 21;
    else if (st === 21 && B.licenses.finance) nxt = 22;
    else if (st === 22 && countType('pawnshop') >= 1) nxt = 23;
    else if (st === 23 && B.level >= 20) nxt = 24;
    else if (st === 24 && B.licenses.transport) nxt = 25;
    else if (st === 25 && countType('taxifleet') >= 1) nxt = 26;
    else if (st === 26 && B.level >= MAX_LEVEL) nxt = 27;
    else if (st === 27 && countType('mall') >= 1) nxt = 28;
    else if (st === 28 && B.story.flags.extortDone) nxt = 29;
    else if (st === 29 && B.story.flags.shootoutWon) nxt = 30;
    else if (st === 30 && B.story.flags.called112) nxt = 31;
    else if (st === 31 && B.story.flags.hospital) nxt = 32;
    else if (st === 33 && B.story.flags.lizaCam) nxt = 34;
    else if (st === 34 && B.story.flags.clue) nxt = 35;
    else if (st === 35 && B.staff.length >= 5) nxt = 36;
    else if (st === 36 && B.story.flags.gear) nxt = 37;
    else if (st === 37 && B.story.flags.defense) nxt = 38;
    else if (st === 38 && B.story.flags.interrogated) nxt = 39;
    else if (st === 39 && B.story.flags.portClue) nxt = 40;
    else if (st === 40 && B.story.flags.portArrived) nxt = 41;
    else if (st === 41 && B.story.flags.bossDown) nxt = 42;
    else if (st === 42 && B.story.flags.policeCalled) nxt = 43;
    else if (st === 43 && B.story.flags.testimony) nxt = 44;
    else if (st === 44 && B.story.flags.rebuilt) nxt = 45;
    else if (st === 45 && B.story.flags.memorial) nxt = 46;
    else if (st === 46 && B.story.flags.foundation) nxt = 47;
    else if (st === 47 && B.points.length >= 15) nxt = 48;
    else if (st === 48 && B.story.flags.interview) nxt = 49;
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
      var liza = { incoming: true, from: 'Лиза', number: CONTACTS.liza.number, ini: 'Л', color: '#db2777' };
      queueCall(Object.assign({}, liza, { lines: [
        'Лиза: Привет. Я Лиза, юрист Аркадия.',
        'Лиза: Оружейный уже работает — значит, пора расширять ассортимент.',
        'Лиза: Табак — отдельная лицензия. Оформи в Job → Лицензии, правительство в курсе.',
        'Лиза: Дальше будут фармацевтика, финансы и перевозки. Но обо всём по порядку.'
      ] }));
      addSms('Лиза', 'Я на связи по лицензиям и документам. Табак — следующая лицензия.');
    } else if (step === 17) {
      queueCall(Object.assign({}, ark, { lines: [
        'Аркадий: Табачная лавка — маленькая точка, а маржа серьёзная.',
        'Аркадий: Помещение найдёшь на карте. Лицензия у тебя уже есть.'
      ] }));
      addSms('Аркадий', 'Табачная лавка доступна на карте. Не забудь завести товар через «Опт».');
    } else if (step === 18) {
      var vera = { incoming: true, from: 'Виктория', number: CONTACTS.vera.number, ini: 'В', color: '#0ea5e9' };
      queueCall(Object.assign({}, vera, { lines: [
        'Виктория: Здравствуйте. Меня зовут Виктория, я отвечаю за медицинское направление.',
        'Виктория: Лиза передала ваши документы. Фармацевтическая лицензия — с 13 уровня.',
        'Виктория: Получите её в Job → Лицензии. Потом поговорим о медицинском центре.'
      ] }));
      addSms('Виктория', 'Фармацевтическая лицензия — с 13 уровня. Оформите в Job → Лицензии.');
    } else if (step === 19) {
      queueCall(Object.assign({}, vera, { lines: [
        'Виктория: Лицензия есть. Теперь медицинский центр.',
        'Виктория: Это приёмы, анализы и справки. Помещение подберём в центре города.',
        'Виктория: Открывайте точку на карте — и заказывайте оборудование через «Опт».'
      ] }));
      addSms('Виктория', 'Медицинский центр доступен на карте. Оборудование и медикаменты — на сайте «Опт».');
    } else if (step === 20) {
      queueCall(Object.assign({}, liza, { lines: [
        'Лиза: 16 уровень. Поздравляю, вы уже крупный предприниматель.',
        'Лиза: Пора в финансы. Ломбард — это залоги, оценка и выкуп.',
        'Лиза: Финансовая лицензия уже доступна. Загляните в Job → Лицензии.'
      ] }));
      addSms('Лиза', 'Финансовая лицензия доступна с 16 уровня. Ломбард ждёт.');
    } else if (step === 21) {
      queueCall(Object.assign({}, liza, { lines: [
        'Лиза: Финансы — самый зарегулированный рынок.',
        'Лиза: Пошлина выше, но и сделки крупнее. Звоните в правительство и приезжайте.',
        'Лиза: После лицензии подберём помещение под ломбард.'
      ] }));
      addSms('Лиза', 'Финансовая лицензия — в Job → Лицензии. Пошлина ' + fmt(LICENSES.finance.fee) + '.');
    } else if (step === 22) {
      queueCall(Object.assign({}, ark, { lines: [
        'Аркадий: Ломбард — это деньги, которые работают даже без покупателей.',
        'Аркадий: Только с оценкой не халтурь. Репутация дороже.',
        'Аркадий: Открывай точку и заводи товар. Дальше — масштаб.'
      ] }));
      addSms('Аркадий', 'Ломбард доступен на карте. Сейфы и бланки — на сайте «Опт».');
    } else if (step === 23) {
      queueCall(Object.assign({}, maks, { lines: [
        'Макс: 20 уровень?! Ты уже город двигаешь.',
        'Макс: Слушай, у меня знакомый держит таксопарк. Тема рабочая.',
        'Макс: Но сначала лицензия на перевозки. Без неё — никак.'
      ] }));
      addSms('Макс', 'Перевозки — с 20 уровня. Лицензия в Job → Лицензии.');
    } else if (step === 24) {
      queueCall(Object.assign({}, liza, { lines: [
        'Лиза: Лицензия на перевозки — финальная в моём списке.',
        'Лиза: Машины, водители, корпоративные контракты. Пошлина — ' + fmt(LICENSES.transport.fee) + '.',
        'Лиза: Звоните в правительство. Дальше я помогу с таксопарком.'
      ] }));
      addSms('Лиза', 'Лицензия на перевозки — в Job → Лицензии. Это последняя лицензия в сюжете.');
    } else if (step === 25) {
      queueCall(Object.assign({}, maks, { lines: [
        'Макс: Таксопарк! Вот это размах.',
        'Макс: Машины, топливо, сервис — всё через «Опт».',
        'Макс: Открывай точку. Осталось дойти до 30 уровня.'
      ] }));
      addSms('Макс', 'Таксопарк доступен на карте. Автомобили и топливо — на сайте «Опт».');
    } else if (step === 26) {
      queueCall(Object.assign({}, ark, { lines: [
        'Аркадий: 30 уровень. Ты собрал почти всё.',
        'Аркадий: Остался один шаг — ТРЦ. Целый торговый центр под твоим именем.',
        'Аркадий: Деньги серьёзные, но и отдача другая. Решайся.'
      ] }));
      addSms('Аркадий', 'Финальная цель — открыть ТРЦ. Это вершина бизнеса.');
    } else if (step === 27) {
      queueCall(Object.assign({}, ark, { lines: [
        'Аркадий: ТРЦ открыт. Арендаторы, фудкорт, кино — всё работает на тебя.',
        'Аркадий: Помнишь ларёк у метро? Вот оттуда всё началось.',
        'Аркадий: Город у твоих ног. Дальше — только твои решения.'
      ] }));
      addSms('Аркадий', 'ТРЦ открыт. Ты построил целую империю.');
    } else if (step === 28) {
      queueCall(Object.assign({}, maks, { lines: [
        'Макс: ТРЦ открыт. Ты построил империю, но расслабляться рано.',
        'Макс: Мне шепнули: Тима с района снова точит зуб на твою точку.',
        'Макс: На смене будь на связи. Если что — я рядом.'
      ] }));
      addSms('Тима', 'Пять тысяч — и работаешь спокойно. Жду на смене.\n— Тима');
    } else if (step === 29) {
      addSms('Макс', 'Бандиты у входа. Я рядом. Скажи, когда будешь готов — прикрою.');
    } else if (step === 30) {
      queueCall(Object.assign({}, maks, { lines: [
        'Макс: Всё, они ушли... но меня зацепило.',
        'Макс: Плечо. Кровь не останавливается.',
        'Макс: Вызывай 112. Только быстро. И выбери скорую.'
      ] }));
      addSms('Макс', 'Я ранен. Вызови 112 и выбери медицинскую службу.');
    } else if (step === 31) {
      queueCall({ incoming: true, from: 'Лиза', number: CONTACTS.liza.number, ini: 'Л', color: '#db2777', lines: [
        'Лиза: Слышала, что случилось. Скорая едет к вам.',
        'Лиза: Но там пробки, а Макс не дождётся. Угоняй бригаду и вези его сам.',
        'Лиза: Я предупрежу больницу. Только не разбей машину.'
      ] });
      addSms('Лиза', 'Скорая у входа. Садись за руль и вези Макса в городскую больницу.');
    } else if (step === 32) {
      setTimeout(maxDeathScene, 500);
      addSms('Больница', 'Пациент доставлен в реанимацию. Врачи борются за жизнь.');
    } else if (step === 33) {
      queueCall({ incoming: true, from: 'Лиза', number: CONTACTS.liza.number, ini: 'Л', color: '#db2777', lines: [
        'Лиза: Мне жаль Макса. Он был хорошим человеком.',
        'Лиза: Камеры БЦ записали, как Тима встречался с кем-то из порта.',
        'Лиза: Приезжай в БЦ. Посмотрим записи вместе.'
      ] });
      addSms('Лиза', 'Камеры БЦ записали Тима и человека из порта. Жду тебя в офисе.');
    } else if (step === 34) {
      queueCall({ incoming: true, from: 'Лиза', number: CONTACTS.liza.number, ini: 'Л', color: '#db2777', lines: [
        'Лиза: На записи Тима передал папку человеку по кличке Штырь.',
        'Лиза: Штырь держит ломбард на Садовой. Там может быть зацепка.',
        'Лиза: Загляни туда под видом клиента.'
      ] });
      addSms('Лиза', 'Ищи Штыря в ломбарде на Садовой. Он связан с портом.');
    } else if (step === 35) {
      queueCall({ incoming: true, from: 'Лиза', number: CONTACTS.liza.number, ini: 'Л', color: '#db2777', lines: [
        'Лиза: Один ты не справишься. Нужны люди, которым можно доверять.',
        'Лиза: Собери команду из пяти человек. Не обязательно бойцов — нужны те, кто прикроет.',
        'Лиза: Как соберёшь — начнём готовиться.'
      ] });
      addSms('Лиза', 'Собери команду из 5 сотрудников. Это не только про бизнес.');
    } else if (step === 36) {
      queueCall(Object.assign({}, ark, { lines: [
        'Аркадий: Слышал про Макса. Соболезную.',
        'Аркадий: Если собираешься идти до конца — купи снаряжение в оружейном.',
        'Аркадий: Бронежилет и аптечка стоят 15 000 ₽. Это не роскошь.'
      ] }));
      addSms('Аркадий', 'Снаряжение — 15 000 ₽ в оружейном. Без него дальше лучше не соваться.');
    } else if (step === 37) {
      queueCall({ incoming: true, from: 'Лиза', number: CONTACTS.liza.number, ini: 'Л', color: '#db2777', lines: [
        'Лиза: Штырь понял, что ты копаешь. Он послал людей в ломбард.',
        'Лиза: Если они уничтожат документы — ниточка оборвётся.',
        'Лиза: Защити ломбард. Только не переусердствуй.'
      ] });
      addSms('Лиза', 'Люди Штыря идут в ломбард за документами. Останови их.');
    } else if (step === 38) {
      addSms('Лиза', 'Один из нападавших жив. Он готов говорить. Допроси его.');
    } else if (step === 39) {
      addSms('Тима', 'Ты не знаешь, во что лезешь. Штырь — не главный.\n— Тима');
    } else if (step === 40) {
      addSms('Лиза', 'Груз в порту «Северный». Приезжай, я буду на связи.');
    } else if (step === 41) {
      addSms('Лиза', 'В порту Штырь и его люди. Полиция будет через пятнадцать минут. Держись.');
    } else if (step === 42) {
      addSms('Полиция', 'Задержанный доставлен в отделение. Дайте показания — и дело пойдёт в суд.');
    } else if (step === 43) {
      addSms('Полиция', 'Показания приняты. Штырь даёт признательные. Дело закрыто.');
    } else if (step === 44) {
      addSms('Лиза', 'Точки после перестрелки надо восстановить. Это 20 000 ₽. Я помогу с бумагами.');
    } else if (step === 45) {
      addSms('Лиза', 'Пора открыть мемориал Макса. Он это заслужил.');
    } else if (step === 46) {
      queueCall({ incoming: true, from: 'Лиза', number: CONTACTS.liza.number, ini: 'Л', color: '#db2777', lines: [
        'Лиза: Юристы готовы. Фонд имени Макса — 50 000 ₽ на старт.',
        'Лиза: Он хотел, чтобы город был добрее. Сделаем это за него.',
        'Лиза: Как будешь готов — запускаем.'
      ] });
      addSms('Лиза', 'Фонд имени Макса — 50 000 ₽. Дальше город будет помнить его.');
    } else if (step === 47) {
      addSms('Лиза', 'Империя должна расти. Открой 15 точек — и о тебе заговорят.');
    } else if (step === 48) {
      addSms('Лиза', 'Журналисты хотят интервью. Покажи городу, кем ты стал.');
    } else if (step === 49) {
      queueCall({ incoming: true, from: 'Лиза', number: CONTACTS.liza.number, ini: 'Л', color: '#db2777', lines: [
        'Лиза: Сегодня в городе открыли улицу Макса.',
        'Лиза: Ты сделал невозможное — построил бизнес и не забыл друга.',
        'Лиза: Спасибо. Он бы гордился.'
      ] });
      addSms('Лиза', 'Сюжет пройден. Город помнит Макса — и тебя.');
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
    if (st === 12 || st === 14 || st === 16 || st === 18 || st === 21 || st === 24) return 'Biz.jobTab(\'licenses\')';
    if (st === 13 || st === 15 || st === 17 || st === 19 || st === 22 || st === 25 || st === 27) return 'Biz.openMap(\'rent\')';
    if (st === 20 || st === 23 || st === 26 || st === 28) return 'Biz.shift()';
    if (st === 35) return 'Biz.jobTab(\'staff\')';
    if (st === 47) return 'Biz.openMap(\'rent\')';
    if (st >= 29 && st <= 48 && st !== 32 && st !== 35 && st !== 47) return 'Biz.storyAction()';
    if (st === 32) return 'Biz.storyAction()';
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
    if (st === 12 || st === 14 || st === 16 || st === 18 || st === 21 || st === 24) return 'Лицензии';
    if (st === 13 || st === 15 || st === 17 || st === 19 || st === 22 || st === 25 || st === 27) return 'Открыть точку';
    if (st === 20 || st === 23 || st === 26 || st === 28) return 'Смена';
    if (st === 29) return 'Налёт';
    if (st === 30) return 'Вызвать 112';
    if (st === 31) return 'Скорая';
    if (st === 32) return 'Больница';
    if (st === 33) return 'Лиза';
    if (st === 34) return 'Ломбард';
    if (st === 35) return 'Команда';
    if (st === 36) return 'Снаряжение';
    if (st === 37) return 'Оборона';
    if (st === 38) return 'Допрос';
    if (st === 39) return 'Зацепка';
    if (st === 40) return 'В порт';
    if (st === 41) return 'Босс';
    if (st === 42) return 'Полиция';
    if (st === 43) return 'Показания';
    if (st === 44) return 'Восстановить';
    if (st === 45) return 'Мемориал';
    if (st === 46) return 'Фонд';
    if (st === 47) return 'Открыть точку';
    if (st === 48) return 'Интервью';
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
      var svc = SERVICES[sp.serviceKind];
      if (sp.service && svc) {
        if (mapMode === 'view' || mapMode === 'taxi') {
          list.push({ x: sp.x, y: sp.y, kind: svc.kind, color: svc.color, id: id });
        }
        return;
      }
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
    if (mapSel === 'contract') return SPOTS.bc || null;
    return SPOTS[mapSel] || null;
  }

  function renderMapCanvas() {
    var c = document.getElementById('mp-canvas');
    if (!c) return;
    var svg = window.CityMap ? window.CityMap.svg(mapMarkers(), { you: MAP_YOU, route: mapRoutePoint() }) : '';
    c.innerHTML = svg + '<span class="mp-tag">Пункты выдачи Лавки</span>';
  }

  function mapHTML() {
    return '<div class="mp-head"><button class="mp-back" type="button" onclick="Biz.closeMap()"><i class="fa-solid fa-chevron-left"></i></button>' +
      '<div><b>' + mapTitle() + '</b><span>Москва · демо</span></div><span class="mp-cash">' + fmt(B.cash) + '</span></div>' +
      '<div class="mp-canvas" id="mp-canvas">' +
      (window.CityMap ? window.CityMap.svg(mapMarkers(), { you: MAP_YOU, route: mapRoutePoint() }) : '') +
      '<span class="mp-tag">Пункты выдачи Лавки</span></div>' +
      '<div class="mp-legend"><span><i class="fa-solid fa-shop"></i> помещения</span><span><i class="fa-solid fa-taxi"></i> такси</span><span><i class="fa-solid fa-hospital"></i> службы</span><span><i class="fa-solid fa-file-signature"></i> контракт</span></div>' +
      '<div class="mp-sheet" id="mp-sheet"></div>';
  }

  function spotPin(sp) {
    var svc = SERVICES[sp.serviceKind];
    if (sp.service && svc) return { kind: svc.kind, color: svc.color, icon: svc.icon };
    if (sp.factory) return { kind: 'factory', color: '#475569', icon: 'fa-industry' };
    if (sp.gov) return { kind: 'columns', color: '#64748b', icon: 'fa-building-columns' };
    if (sp.office) return { kind: 'flag', color: '#8b5cf6', icon: 'fa-building' };
    return { kind: 'shop', color: '#22c55e', icon: 'fa-shop' };
  }

  function mpSpotRow(id) {
    var sp = SPOTS[id];
    if (!sp) return '';
    var pin = spotPin(sp);
    var extra = sp.service ? ' · городская служба' : (sp.gov || sp.office ? ' · по записи' : ' · спрос ×' + sp.mult);
    return '<button class="mp-spot" type="button" onclick="Biz.mapPick(\'' + id + '\')">' +
      '<span class="mp-spot-ic" style="background:' + pin.color + '"><i class="fa-solid ' + pin.icon + '"></i></span>' +
      '<div><b>' + sp.name + '</b><small>' + sp.area + extra + '</small></div>' +
      '<i class="fa-solid fa-chevron-right"></i></button>';
  }

  function mapSheetDefault() {
    var el = document.getElementById('mp-sheet');
    if (!el) return;
    var ids = Object.keys(SPOTS);
    var serviceIds = ids.filter(function (id) { return SPOTS[id].service; });
    if (mapMode === 'rent') {
      var free = ids.filter(function (id) { return !pointAtSpot(id) && !SPOTS[id].gov && !SPOTS[id].office && !SPOTS[id].service; });
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
      rows += ids.filter(function (id) { return !SPOTS[id].gov && !SPOTS[id].office && !SPOTS[id].service; }).map(mpSpotRow).join('');
      el.innerHTML = '<div class="mp-sheet-h">Куда едем? <span>300 ₽</span></div>' + rows +
        (serviceIds.length ? '<div class="mp-sheet-h" style="margin-top:10px">Городские службы <span>круглосуточно</span></div>' + serviceIds.map(mpSpotRow).join('') : '');
    } else {
      var pts = B.points.map(function (p) {
        var id = spotOf(p), sp = SPOTS[id];
        if (!sp) return '';
        return '<button class="mp-spot" type="button" onclick="Biz.mapPick(\'' + id + '\')"><span class="mp-spot-ic" style="background:' + TYPES[p.type].color + '"><i class="fa-solid ' + TYPES[p.type].icon + '"></i></span><div><b>' + TYPES[p.type].name + '</b><small>' + sp.name + ' · заказов ' + (p.orders || 0) + '</small></div><i class="fa-solid fa-chevron-right"></i></button>';
      }).join('');
      el.innerHTML = '<div class="mp-sheet-h">Мои точки <span>' + B.points.length + '</span></div>' + (pts || '<p class="mp-sheet-note">Точек пока нет.</p>') +
        (serviceIds.length ? '<div class="mp-sheet-h" style="margin-top:10px">Городские службы <span>на карте</span></div>' + serviceIds.map(mpSpotRow).join('') : '');
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
        '<p class="mp-sheet-note">Лицензии: алкоголь, табак, оружие, фарма, финансы, перевозки. Приём по записи.</p>' +
        (mapMode === 'taxi' ? '<button class="mp-go" type="button" onclick="Biz.taxiGo()">Вызвать такси · 300 ₽</button>' : '') +
        (mapMode === 'taxi' && !B.story.flags.govCalled ? '<p class="mp-sheet-note">Сначала позвоните в правительство — контакт в телефоне.</p>' : '');
      return;
    }
    var s = SPOTS[id];
    if (!s) return;
    if (s.service) {
      var svc = SERVICES[s.serviceKind] || { label: 'Служба', icon: 'fa-location-dot', color: '#0ea5e9' };
      var texts = {
        hospital: 'Приёмный покой и реанимация работают круглосуточно. Сюда везут Макса после ранения.',
        police: 'Дежурная часть, приём заявлений и изолятор временного содержания.',
        port: 'Грузовые причалы, склады и таможенный пост. Ночью здесь почти никого.'
      };
      el.innerHTML = '<div class="mp-sheet-h">' + s.name + ' <span>' + s.area + '</span></div>' +
        '<div class="mp-point"><span style="background:' + svc.color + '"><i class="fa-solid ' + svc.icon + '"></i></span><div><b>' + svc.label + '</b><small>городская служба · ' + s.area + '</small></div></div>' +
        '<p class="mp-sheet-note">' + (texts[s.serviceKind] || 'Городская служба.') + '</p>' +
        (mapMode === 'taxi' ? '<button class="mp-go" type="button" onclick="Biz.taxiGo()">Вызвать такси · 300 ₽</button>' : '');
      return;
    }
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
    toast('Открыта точка: ' + t.name);
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
      scene: 'street',
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

  // ============================================================
  // СЮЖЕТ · ОПГ, ПЕРЕСТРЕЛКА, МАКС
  // ============================================================
  function shiftExtortion() {
    showCutscene({
      kicker: 'Смена · ОПГ',
      scene: 'street',
      slides: [
        { who: 'Тима', ini: 'Т', color: '#dc2626', text: 'Работаешь? Хорошо. Пять тысяч — и никто не мешает.' },
        { who: 'Тима', ini: 'Т', color: '#dc2626', text: 'Откажешься — пеняй на себя. Люди у точки уже стоят.' },
        { who: 'Ты', ini: 'Т', color: '#0ea5e9', text: '...' }
      ],
      choices: [
        { label: 'Заплатить 5 000 ₽', primary: true, action: shiftPay },
        { label: 'Отказаться', action: shiftRefuse }
      ]
    });
  }

  function shiftPay() {
    if (B.cash < 5000) {
      B.story.flags.extort = 'debt';
      addSms('Тима', 'Денег нет? Ладно. Должок растёт, бизнесмен.');
    } else {
      B.cash -= 5000;
      B.story.flags.extort = 'paid';
      addSms('Тима', 'Красавчик. Пока не трогаем. Но мы вернёмся проверить.');
    }
    B.events.unshift({ t: 'opg', text: 'ОПГ: дань на смене', time: nowTime() });
    B.story.flags.extortDone = true;
    save();
    advanceStory(29);
    setTimeout(function () { if (!shift) Biz.shift(); }, 420);
  }

  function shiftRefuse() {
    B.story.flags.extort = 'refused';
    B.story.flags.extortDone = true;
    B.events.unshift({ t: 'opg', text: 'ОПГ: отказ на смене', time: nowTime() });
    B.stats.rating = Math.max(3, Math.round(((Number(B.stats.rating) || 4.8) - 0.1) * 100) / 100);
    save();
    addSms('Тима', 'Ну смотри. Мы вернёмся — и не одни.');
    advanceStory(29);
    setTimeout(function () { if (!shift) Biz.shift(); }, 420);
  }

  function maxDeathScene() {
    showCutscene({
      kicker: 'Больница · реанимация',
      scene: 'office',
      slides: [
        { who: 'Врач', ini: 'В', color: '#0ea5e9', text: 'Мы сделали всё, что могли. Ранение оказалось слишком тяжёлым.' },
        { who: 'Ты', ini: 'Т', color: '#0ea5e9', text: 'Макс... Ты же обещал, что мы ещё поработаем.' },
        { who: 'Врач', ini: 'В', color: '#0ea5e9', text: 'Он просил передать: не бросай это дело. И не прощай их.' }
      ],
      choices: [
        { label: 'Проститься', primary: true, action: function () {
          B.story.flags.maxDead = true;
          save();
          advanceStory(33);
        } }
      ]
    });
  }

  function storyLizaCam() {
    showCutscene({
      kicker: 'БЦ «Сити» · камеры',
      scene: 'office',
      slides: [
        { who: 'Лиза', ini: 'Л', color: '#db2777', text: 'Вот запись. Тима передаёт папку человеку по кличке Штырь.' },
        { who: 'Лиза', ini: 'Л', color: '#db2777', text: 'Штырь держит ломбард на Садовой и людей в порту.' },
        { who: 'Ты', ini: 'Т', color: '#0ea5e9', text: 'Значит, ищем ломбард.' }
      ],
      choices: [
        { label: 'Дальше', primary: true, action: function () {
          B.story.flags.lizaCam = true;
          save();
          advanceStory(34);
        } }
      ]
    });
  }

  function storyClue() {
    showCutscene({
      kicker: 'Ломбард · Садовая',
      scene: 'office',
      slides: [
        { who: 'Оценщик', ini: 'О', color: '#b45309', text: 'Штырь? Был тут. Оставлял папку в сейфе, а забрать не успел.' },
        { who: 'Ты', ini: 'Т', color: '#0ea5e9', text: 'Накладные на груз. Порт «Северный», причал семь.' },
        { who: 'Оценщик', ini: 'О', color: '#b45309', text: 'Только учти: за этой папкой придут. И не одни.' }
      ],
      choices: [
        { label: 'Забрать документы', primary: true, action: function () {
          B.story.flags.clue = true;
          save();
          advanceStory(35);
        } }
      ]
    });
  }

  function storyGear() {
    if (B.cash < 15000) { toast('Не хватает ' + fmt(15000 - B.cash) + ' на снаряжение'); return; }
    B.cash -= 15000;
    B.story.flags.gear = true;
    B.events.unshift({ t: 'gear', text: 'Снаряжение: бронежилет и аптечка', time: nowTime() });
    save();
    toast('Снаряжение куплено');
    advanceStory(37);
  }

  function storyInterrogation() {
    showCutscene({
      kicker: 'Ломбард · подсобка',
      scene: 'street',
      slides: [
        { who: 'Бандит', ini: 'Б', color: '#dc2626', text: 'Я просто работал за деньги. Штырь сказал — забрать папку.' },
        { who: 'Ты', ini: 'Т', color: '#0ea5e9', text: 'Кто за Штырём?' },
        { who: 'Бандит', ini: 'Б', color: '#dc2626', text: 'Человек из порта. Его все зовут Босс. Он и заказал Макса.' }
      ],
      choices: [
        { label: 'Понятно', primary: true, action: function () {
          B.story.flags.interrogated = true;
          save();
          advanceStory(39);
        } }
      ]
    });
  }

  function storyPortClue() {
    showCutscene({
      kicker: 'Порт · документы',
      scene: 'city',
      slides: [
        { who: 'Лиза', ini: 'Л', color: '#db2777', text: 'Накладные сходятся. Через причал семь идёт нелегальный груз.' },
        { who: 'Лиза', ini: 'Л', color: '#db2777', text: 'Штырь и Босс будут там сегодня. Полиция уже в курсе.' },
        { who: 'Ты', ini: 'Т', color: '#0ea5e9', text: 'Значит, пора заканчивать.' }
      ],
      choices: [
        { label: 'Ехать в порт', primary: true, action: function () {
          B.story.flags.portClue = true;
          save();
          advanceStory(40);
        } }
      ]
    });
  }

  function storyPortArrive() {
    showCutscene({
      kicker: 'Порт «Северный» · ночь',
      scene: 'city',
      slides: [
        { who: 'Лиза', ini: 'Л', color: '#db2777', text: 'Я на связи. Босс у седьмого причала, с ним люди Штыря.' },
        { who: 'Ты', ini: 'Т', color: '#0ea5e9', text: 'Макс, это за тебя.' },
        { who: 'Лиза', ini: 'Л', color: '#db2777', text: 'Полиция будет через пятнадцать минут. Держись.' }
      ],
      choices: [
        { label: 'Войти в порт', primary: true, action: function () {
          B.story.flags.portArrived = true;
          save();
          advanceStory(41);
        } }
      ]
    });
  }

  function storyPoliceHandover() {
    showCutscene({
      kicker: 'Порт · полиция',
      scene: 'office',
      slides: [
        { who: 'Полиция', ini: 'П', color: '#3b82f6', text: 'Босса и Штыря забираем. Вам придётся дать показания.' },
        { who: 'Ты', ini: 'Т', color: '#0ea5e9', text: 'Я всё расскажу. У меня есть документы и свидетели.' }
      ],
      choices: [
        { label: 'Передать задержанных', primary: true, action: function () {
          B.story.flags.policeCalled = true;
          save();
          advanceStory(43);
        } }
      ]
    });
  }

  function storyTestimony() {
    showCutscene({
      kicker: 'Отделение полиции',
      scene: 'office',
      slides: [
        { who: 'Следователь', ini: 'С', color: '#3b82f6', text: 'Показания записаны. Штырь начал давать признательные.' },
        { who: 'Следователь', ini: 'С', color: '#3b82f6', text: 'Заказ на Макса шёл от Босса. Дело пойдёт в суд.' },
        { who: 'Ты', ini: 'Т', color: '#0ea5e9', text: 'Спасибо. Теперь можно и о бизнесе подумать.' }
      ],
      choices: [
        { label: 'Выйти', primary: true, action: function () {
          B.story.flags.testimony = true;
          save();
          advanceStory(44);
        } }
      ]
    });
  }

  function storyRebuild() {
    if (B.cash < 20000) { toast('Не хватает ' + fmt(20000 - B.cash) + ' на восстановление'); return; }
    B.cash -= 20000;
    B.story.flags.rebuilt = true;
    B.events.unshift({ t: 'rebuild', text: 'Восстановление точек после перестрелки', time: nowTime() });
    save();
    toast('Точки восстановлены');
    advanceStory(45);
  }

  function storyMemorial() {
    showCutscene({
      kicker: 'Сквер · мемориал',
      scene: 'city',
      slides: [
        { who: 'Лиза', ini: 'Л', color: '#db2777', text: 'Город выделил место. Здесь будет мемориал Макса.' },
        { who: 'Ты', ini: 'Т', color: '#0ea5e9', text: 'Он всегда говорил, что бизнес — это про людей.' },
        { who: 'Лиза', ini: 'Л', color: '#db2777', text: 'Теперь город это запомнит.' }
      ],
      choices: [
        { label: 'Открыть мемориал', primary: true, action: function () {
          B.story.flags.memorial = true;
          save();
          advanceStory(46);
        } }
      ]
    });
  }

  function storyFoundation() {
    if (B.cash < 50000) { toast('Не хватает ' + fmt(50000 - B.cash) + ' на фонд'); return; }
    B.cash -= 50000;
    B.story.flags.foundation = true;
    B.events.unshift({ t: 'found', text: 'Фонд имени Макса', time: nowTime() });
    save();
    toast('Фонд имени Макса запущен');
    advanceStory(47);
  }

  function storyInterview() {
    showCutscene({
      kicker: 'Телевидение · интервью',
      scene: 'office',
      slides: [
        { who: 'Журналист', ini: 'Ж', color: '#8b5cf6', text: 'Вы построили империю с нуля. Что помогло?' },
        { who: 'Ты', ini: 'Т', color: '#0ea5e9', text: 'Друг. Он не дожил до этого дня, но он часть всего.' },
        { who: 'Журналист', ini: 'Ж', color: '#8b5cf6', text: 'Город запомнит и его, и вас.' }
      ],
      choices: [
        { label: 'Завершить', primary: true, action: function () {
          B.story.flags.interview = true;
          save();
          advanceStory(49);
        } }
      ]
    });
  }

  function raidBrief() {
    showCutscene({
      kicker: 'Точка · налёт',
      scene: 'street',
      slides: [
        { who: 'Тима', ini: 'Т', color: '#dc2626', text: 'Последний раз: пять тысяч — и мы уходим. Нет — пеняй на себя.' },
        { who: 'Макс', ini: 'М', color: '#0ea5e9', text: 'Их четверо, у тебя одна обойма. Я подъеду, но не мгновенно.' },
        { who: 'Ты', ini: 'Т', color: '#0ea5e9', text: 'Значит, держимся.' }
      ],
      choices: [
        { label: 'Драться', primary: true, action: function () { setTimeout(function () { Biz.startShootout('shop'); }, 120); } },
        { label: 'Ещё не готов', action: function () {} }
      ]
    });
  }

  Biz.startShootout = function (scene) {
    if (!window.BizAction) { toast('Перестрелка недоступна'); return; }
    var st = B.story.step;
    window.BizAction.shooter({
      scene: scene,
      waves: scene === 'shop' ? 2 : 3,
      perWave: scene === 'shop' ? 4 : 5,
      onWin: function () {
        if (st === 29) {
          B.story.flags.shootoutWon = true;
          B.events.unshift({ t: 'fight', text: 'Точка удержана в перестрелке', time: nowTime() });
        } else if (st === 37) {
          B.story.flags.defense = true;
          B.events.unshift({ t: 'fight', text: 'Ломбард защищён', time: nowTime() });
        } else if (st === 41) {
          B.story.flags.bossDown = true;
          B.events.unshift({ t: 'fight', text: 'Босс обезврежен в порту', time: nowTime() });
        }
        addXp(40);
        save();
        storyTick();
        if (LV.current && LV.current.id === 'job' && jobHost) renderJob();
      }
    });
  };

  Biz.storyAction = function () {
    var st = B.story.step;
    if (st === 28) { Biz.shift(); return; }
    if (st === 29) { raidBrief(); return; }
    if (st === 30) {
      if (!window.BizAction) { toast('112 недоступен'); return; }
      window.BizAction.call112({
        address: (SPOTS.center1 && SPOTS.center1.name ? SPOTS.center1.name : 'Тверская, 12') + ' · Лавка',
        onDone: function () {
          B.story.flags.called112 = true;
          save();
          advanceStory(31);
        }
      });
      return;
    }
    if (st === 31) {
      if (!window.BizAction) { toast('Скорая недоступна'); return; }
      window.BizAction.drive({
        onWin: function () {
          B.story.flags.hospital = true;
          addXp(35);
          save();
          advanceStory(32);
        }
      });
      return;
    }
    if (st === 32) { maxDeathScene(); return; }
    if (st === 33) { storyLizaCam(); return; }
    if (st === 34) { storyClue(); return; }
    if (st === 35) { Biz.jobTab('staff'); return; }
    if (st === 36) { storyGear(); return; }
    if (st === 37) { Biz.startShootout('lombard'); return; }
    if (st === 38) { storyInterrogation(); return; }
    if (st === 39) { storyPortClue(); return; }
    if (st === 40) { storyPortArrive(); return; }
    if (st === 41) { Biz.startShootout('port'); return; }
    if (st === 42) { storyPoliceHandover(); return; }
    if (st === 43) { storyTestimony(); return; }
    if (st === 44) { storyRebuild(); return; }
    if (st === 45) { storyMemorial(); return; }
    if (st === 46) { storyFoundation(); return; }
    if (st === 47) { Biz.openMap('rent'); return; }
    if (st === 48) { storyInterview(); return; }
  };

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

  function cutSceneHTML(scene) {
    if (scene !== 'street') return '';
    var houses = [[6, 34, 56], [26, 30, 74], [46, 26, 48], [62, 34, 66], [82, 16, 40]].map(function (h, i) {
      return '<i class="st-b st-b' + (i + 1) + '" style="left:' + h[0] + '%;width:' + h[1] + '%;height:' + h[2] + '%"></i>';
    }).join('');
    var fig = function (cls) {
      return '<div class="st-fig ' + cls + '"><span class="st-head"></span><span class="st-body"></span>' +
        '<span class="st-leg l"></span><span class="st-leg r"></span></div>';
    };
    return '<div class="st-sky"><span class="st-moon"></span></div>' +
      '<div class="st-city">' + houses + '</div>' +
      '<div class="st-lamp"><b></b><i></i></div>' +
      '<div class="st-road"><em></em><em></em><em></em></div>' +
      fig('st-fig1') + fig('st-fig2');
  }

  function showCutscene(opts) {
    var host = document.getElementById('phone');
    if (!host) return;
    cutClose();
    cutOpts = opts || {};
    cutSlides = cutOpts.slides || [];
    cutIndex = 0;
    cutEl = document.createElement('div');
    cutEl.className = 'cut';
    cutEl.innerHTML = '<div class="cut-top"><span class="cut-kicker">' + esc(cutOpts.kicker || 'Сцена') + '</span>' +
      '<button class="cut-skip" type="button" onclick="Biz.cutClose()">Пропустить</button></div>' +
      '<div class="cut-stage ' + (opts.scene || 'office') + '">' + cutSceneHTML(opts.scene) + '<div class="cut-window"></div><div class="cut-portrait" id="cut-avatar">?</div><div class="cut-name" id="cut-name"></div></div>' +
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
    else {
      var nextLic = LICENSE_ORDER.filter(function (t) { return !B.licenses[t]; })[0];
      if (!nextLic) text = 'Аркадий: Все лицензии оформлены. Дальше — только масштаб. Открывай точки и расти до 30.';
      else {
        var licState = licenseReady(nextLic);
        text = 'Аркадий: Следующая лицензия — «' + LICENSES[nextLic].name + '». ' +
          (licState.ok ? 'Уже доступна: звони в правительство, Лиза подскажет.' : 'Пока ' + licState.reason + '. Подрастёшь — оформим.');
      }
    }
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
    tobacconist: [
      { id: 'cigarettes', name: 'Сигареты', desc: 'Основные бренды', qty: 60, price: 16000, icon: 'fa-smoking', color: '#a16207' },
      { id: 'vapes', name: 'Вейпы и жидкости', desc: 'Устройства и картриджи', qty: 40, price: 14000, icon: 'fa-cloud', color: '#0ea5e9' },
      { id: 'accessories', name: 'Аксессуары', desc: 'Зажигалки, пепельницы', qty: 50, price: 5000, icon: 'fa-fire', color: '#f59e0b' }
    ],
    medical: [
      { id: 'equipment', name: 'Оборудование', desc: 'Диагностика и приёмы', qty: 15, price: 60000, icon: 'fa-stethoscope', color: '#0ea5e9' },
      { id: 'meds', name: 'Медикаменты', desc: 'Расходные препараты', qty: 50, price: 24000, icon: 'fa-capsules', color: '#10b981' },
      { id: 'supplies', name: 'Расходники', desc: 'Перчатки, шприцы, бинты', qty: 60, price: 12000, icon: 'fa-kit-medical', color: '#64748b' }
    ],
    pawnshop: [
      { id: 'valuation', name: 'Оценка и экспертиза', desc: 'Ювелирка и техника', qty: 30, price: 15000, icon: 'fa-magnifying-glass-dollar', color: '#eab308' },
      { id: 'safe', name: 'Сейфы и витрины', desc: 'Хранение залогов', qty: 10, price: 25000, icon: 'fa-vault', color: '#334155' },
      { id: 'forms', name: 'Документы и бланки', desc: 'Договоры и квитанции', qty: 60, price: 6000, icon: 'fa-file-lines', color: '#64748b' }
    ],
    taxifleet: [
      { id: 'cars', name: 'Автомобили', desc: 'Новые машины, 2 шт', qty: 2, price: 700000, icon: 'fa-taxi', color: '#f59e0b' },
      { id: 'fuel', name: 'Топливо', desc: 'Заправка парка', qty: 80, price: 32000, icon: 'fa-gas-pump', color: '#ef4444' },
      { id: 'service', name: 'Сервис и шины', desc: 'ТО и комплекты резины', qty: 30, price: 45000, icon: 'fa-screwdriver-wrench', color: '#64748b' }
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
        'Макс: Есть сайт «Опт» — у каждого бизнеса там свой раздел. Открой браузер и зайди на opt.lackuun.com.',
        'Макс: Запомни главное: без товара смену не откроешь. Кнопка просто скажет «Нет товара» — и всё.',
        'Макс: Для ПВЗ — коробки и упаковка. Для кофейни — зерно и молоко. Для автосалона — машины.',
        'Макс: Заходи в раздел своего бизнеса и закажи первую партию. Дальше сам.'
      ]
    });
    addSms('Макс', 'Открой Браузер → opt.lackuun.com. Без товара смена не запустится. У каждого бизнеса свой раздел.');
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
      id: 'opt', name: 'Опт', host: 'opt.lackuun.com', cat: 'shop', custom: true,
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
  function notifyLicenses(lvl) {
    var list = LICENSE_ORDER.filter(function (t) { return LICENSES[t].level === lvl && !B.licenses[t]; });
    if (!list.length) return;
    ensureGov();
    list.forEach(function (t) {
      addSms('Правительство', 'Доступна лицензия «' + LICENSES[t].name + '». Позвоните в правительство и приезжайте.');
    });
    LV.toast(list.length === 1 ? 'Доступна лицензия: ' + LICENSES[list[0]].name : 'Доступны новые лицензии');
  }

  function licenseReady(type) {
    var L = LICENSES[type];
    if (!L) return { ok: false, reason: 'недоступно' };
    if (B.level < L.level) return { ok: false, reason: 'с ' + L.level + ' уровня' };
    if (L.requires && !B.licenses[L.requires]) return { ok: false, reason: 'сначала «' + LICENSES[L.requires].name + '»' };
    return { ok: true, reason: 'открыто' };
  }

  function govPickType() {
    var ready = LICENSE_ORDER.filter(function (t) { return !B.licenses[t] && licenseReady(t).ok; });
    if (ready.length) return ready[0];
    return LICENSE_ORDER.filter(function (t) { return !B.licenses[t]; })[0] || null;
  }

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
        'Аркадий: Дальше без лицензий нельзя: алкоголь, табак, оружие, фарма, финансы, перевозки.',
        'Аркадий: Я скинул контакт правительства. Позвони, договорись и съезди на такси.',
        'Аркадий: Скажешь, что от меня. Дальше сам.'
      ]
    });
  }

  function callGovReal(type) {
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
    if (!type) type = govPickType();
    if (!type) {
      showCall({
        incoming: false, from: 'Правительство', number: GOV_NUMBER, ini: 'П', color: '#64748b',
        lines: [
          'Сергей Петрович: Все лицензии у вас оформлены.',
          'Сергей Петрович: Работайте. Больше мне нечего предложить.'
        ]
      });
      return;
    }
    var L = LICENSES[type];
    var ready = licenseReady(type);
    if (!ready.ok) {
      showCall({
        incoming: false, from: 'Правительство', number: GOV_NUMBER, ini: 'П', color: '#64748b',
        lines: [
          'Сергей Петрович: Лицензия «' + L.name + '» — ' + ready.reason + '.',
          'Сергей Петрович: Выполните условие — и звоните.'
        ]
      });
      return;
    }
    if (B.licenses[type]) {
      showCall({
        incoming: false, from: 'Правительство', number: GOV_NUMBER, ini: 'П', color: '#64748b',
        lines: ['Сергей Петрович: Лицензия «' + L.name + '» уже оформлена. Не тратьте моё время.']
      });
      return;
    }
    if (B.story.flags.govVisitType === type) {
      showCall({
        incoming: false, from: 'Правительство', number: GOV_NUMBER, ini: 'П', color: '#64748b',
        lines: [
          'Сергей Петрович: Я уже дал задание по лицензии «' + L.name + '».',
          'Сергей Петрович: Приезжайте в правительство, Тверская, 1. Такси через телефон.'
        ]
      });
      return;
    }
    B.story.flags.govCalled = true;
    B.story.flags.govCallType = type;
    B.story.flags.govVisitType = type;
    save();
    showCall({
      incoming: false, from: 'Правительство', number: GOV_NUMBER, ini: 'П', color: '#64748b',
      lines: [
        'Сергей Петрович: Слушаю.',
        'Сергей Петрович: Лицензия «' + L.name + '». Пошлина — ' + fmt(L.fee) + '.',
        'Сергей Петрович: Приезжайте в правительство, Тверская, 1.',
        'Сергей Петрович: Такси вызовите через телефон.'
      ],
      onEnd: function () {
        toast('Запись: ' + L.name.toLowerCase() + ' · приезжайте в правительство');
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
        { who: 'Сергей Петрович', ini: 'С', color: '#64748b', text: 'Лицензия «' + L.name + '». Пошлина — ' + fmt(L.fee) + '.' },
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
    if (!L) return;
    if (B.licenses[type]) {
      showCall({
        incoming: false, from: 'Правительство', number: GOV_NUMBER, ini: 'П', color: '#64748b',
        lines: ['Сергей Петрович: Лицензия «' + L.name + '» уже оформлена. Не тратьте моё время.']
      });
      return;
    }
    var ready = licenseReady(type);
    if (!ready.ok) {
      showCall({
        incoming: false, from: 'Правительство', number: GOV_NUMBER, ini: 'П', color: '#64748b',
        lines: ['Сергей Петрович: Пока нельзя. Лицензия «' + L.name + '» — ' + ready.reason + '.']
      });
      return;
    }
    govCutscene();
  }

  function callGovEntry() {
    callGovReal();
  }

  Biz.callGov = callGovEntry;
  Biz.callGovLicense = function (type) { callGovReal(type); };
  Biz.taxiToGov = function () {
    if (!B.story.flags.govCalled || !B.story.flags.govVisitType) { toast('Сначала позвоните в правительство'); return; }
    mapSel = 'gov';
    Biz.taxiGo();
  };

  // ============================================================
  // JOB
  // ============================================================
  var jobHost = null;
  var jobTab = 'main';

  function licCard(type) {
    var L = LICENSES[type], ty = TYPES[L.point || type];
    var licensed = !!B.licenses[type];
    var ready = licenseReady(type);
    var assigned = B.story.flags.govVisitType === type;
    var called = B.story.flags.govCallType === type || assigned || licensed;
    var opened = countType(L.point || type) > 0;
    var steps = [
      ['Позвонить в правительство', called],
      ['Приехать на такси', licensed],
      ['Оплатить пошлину', licensed],
      ['Открыть точку', opened]
    ];
    var action;
    if (!ready.ok && !licensed) {
      action = '<button class="lic-btn" type="button" disabled>Доступно ' + ready.reason + '</button>';
    } else if (!licensed && (called || assigned)) {
      action = '<button class="lic-btn" type="button" onclick="Biz.taxiToGov()">Такси к правительству · 300 ₽</button>';
    } else if (!licensed) {
      action = '<button class="lic-btn" type="button" onclick="Biz.callGovLicense(\'' + type + '\')">Позвонить в правительство</button>';
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
    var got = LICENSE_ORDER.filter(function (t) { return B.licenses[t]; }).length;
    return '<div class="lic-intro"><b>Лицензии · ' + got + ' из ' + LICENSE_ORDER.length + '</b>' +
      '<p>Позвоните в правительство, приезжайте на такси и оплатите пошлину. Лицензия открывает новую точку — от алкомаркета до таксопарка.</p></div>' +
      LICENSE_ORDER.map(licCard).join('') +
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
        (B.story.flags.govUnlocked ? '<button class="bj-lic-banner" type="button" onclick="Biz.jobTab(\'licenses\')"><i class="fa-solid fa-file-signature"></i><div><b>Лицензии</b><span>' + LICENSE_ORDER.length + ' направлений · от алкоголя до перевозок</span></div><i class="fa-solid fa-chevron-right"></i></button>' : '') +
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
    tobacconist: ['Сигареты', 'Вейп', 'Табак', 'Аксессуар', 'Крупный заказ'],
    pharmacy: ['Лекарства', 'Витамины', 'Заказ', 'Консультация', 'Доставка'],
    medical: ['Приём', 'Анализы', 'Справка', 'Процедура', 'Корпоративный'],
    pawnshop: ['Залог', 'Оценка', 'Выкуп', 'Кредит', 'Крупная сделка'],
    taxifleet: ['Поездка', 'Корпоратив', 'Аэропорт', 'Доставка', 'Смена'],
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
    if (B.story.step === 28 && !B.story.flags.extortDone) { shiftExtortion(); return; }
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
    if (!B.points.length) { toast('Сначала откройте точку'); return; }
    var free = B.points.filter(function (p) { return !B.staff.some(function (s) { return s.pointId === p.id; }); });
    if (B.cash < 3000) { toast('Найм стоит 3 000 ₽'); return; }
    B.cash -= 3000;
    var point = free[0] || B.points.slice().sort(function (a, b) {
      return shiftStaffCount(a.id) - shiftStaffCount(b.id);
    })[0];
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

  var PROD_CATS = [
    { id: 'home', name: 'Дом и уют', icon: 'fa-house', color: '#0f766e' },
    { id: 'care', name: 'Уход', icon: 'fa-pump-soap', color: '#0284c7' },
    { id: 'kitchen', name: 'Кухня', icon: 'fa-utensils', color: '#b45309' },
    { id: 'textile', name: 'Текстиль', icon: 'fa-shirt', color: '#7c3aed' },
    { id: 'eco', name: 'Эко', icon: 'fa-leaf', color: '#16a34a' },
    { id: 'kids', name: 'Детям', icon: 'fa-child', color: '#ec4899' }
  ];

  var PROD_ITEMS = [
    { id: 'home_set', cat: 'home', name: 'Набор для дома Lavka Home', price: 1490, cost: 640, icon: 'fa-couch', color: '#0f766e', desc: 'Плед, свеча и органайзер в подарочной упаковке.' },
    { id: 'home_candle', cat: 'home', name: 'Свечи «Уют»', price: 590, cost: 210, icon: 'fa-fire', color: '#0f766e', desc: 'Пара свечей из соевого воска с ароматом ванили.' },
    { id: 'home_plaid', cat: 'home', name: 'Плед «Тепло»', price: 1890, cost: 780, icon: 'fa-bed', color: '#0f766e', desc: 'Мягкий плед 150×200 из микрофибры.' },

    { id: 'care_set', cat: 'care', name: 'Набор ухода Lavka Care', price: 990, cost: 390, icon: 'fa-pump-soap', color: '#0284c7', desc: 'Гель, крем и мыло — три шага ежедневного ухода.' },
    { id: 'care_soap', cat: 'care', name: 'Мыло ручной работы', price: 290, cost: 90, icon: 'fa-soap', color: '#0284c7', desc: 'Натуральное мыло с мягким ароматом.' },
    { id: 'care_cream', cat: 'care', name: 'Крем для рук', price: 490, cost: 170, icon: 'fa-hand-holding-droplet', color: '#0284c7', desc: 'Питательный крем с глицерином, 75 мл.' },

    { id: 'kitchen_set', cat: 'kitchen', name: 'Кухонный набор Lavka Kitchen', price: 1690, cost: 720, icon: 'fa-utensils', color: '#b45309', desc: 'Лопатка, полотенце и банка для специй.' },
    { id: 'kitchen_board', cat: 'kitchen', name: 'Разделочная доска', price: 790, cost: 320, icon: 'fa-table-cells-large', color: '#b45309', desc: 'Доска из берёзы с масляным покрытием.' },
    { id: 'kitchen_jar', cat: 'kitchen', name: 'Набор банок', price: 690, cost: 240, icon: 'fa-jar', color: '#b45309', desc: 'Три стеклянные банки с деревянными крышками.' },

    { id: 'textile_towel', cat: 'textile', name: 'Полотенца «Мягкость»', price: 690, cost: 260, icon: 'fa-layer-group', color: '#7c3aed', desc: 'Комплект из двух вафельных полотенец.' },
    { id: 'textile_apron', cat: 'textile', name: 'Фартук «Кухня»', price: 890, cost: 340, icon: 'fa-shirt', color: '#7c3aed', desc: 'Плотный фартук с карманом и регулировкой.' },
    { id: 'textile_plaid', cat: 'textile', name: 'Плед-покрывало', price: 1590, cost: 620, icon: 'fa-bed', color: '#7c3aed', desc: 'Покрывало с фактурной вязкой, 180×200.' },

    { id: 'eco_bag', cat: 'eco', name: 'Шоппер «Эко»', price: 450, cost: 150, icon: 'fa-bag-shopping', color: '#16a34a', desc: 'Хлопковый шоппер, выдерживает до 10 кг.' },
    { id: 'eco_bottle', cat: 'eco', name: 'Бутылка для воды', price: 990, cost: 380, icon: 'fa-bottle-water', color: '#16a34a', desc: 'Стальная бутылка 600 мл, не держит запах.' },
    { id: 'eco_kit', cat: 'eco', name: 'Эко-набор', price: 1290, cost: 480, icon: 'fa-seedling', color: '#16a34a', desc: 'Шоппер, бутылка и бамбуковая щётка.' },

    { id: 'kids_art', cat: 'kids', name: 'Набор для творчества', price: 1090, cost: 410, icon: 'fa-palette', color: '#ec4899', desc: 'Краски, кисти и альбом для юных художников.' },
    { id: 'kids_plush', cat: 'kids', name: 'Мягкая игрушка', price: 790, cost: 300, icon: 'fa-shapes', color: '#ec4899', desc: 'Плюшевый зверь, гипоаллергенный наполнитель.' },
    { id: 'kids_blocks', cat: 'kids', name: 'Конструктор', price: 1390, cost: 520, icon: 'fa-cubes', color: '#ec4899', desc: '80 деталей, совместим с популярными наборами.' }
  ];

  var PROD_BATCHES = [
    { qty: 20, off: 0 },
    { qty: 50, off: 0.03 },
    { qty: 100, off: 0.07 },
    { qty: 250, off: 0.12 }
  ];

  var PROD_ALIAS = { home: 'home_set', care: 'care_set', kitchen: 'kitchen_set' };

  function prodCat(id) {
    return PROD_CATS.filter(function (c) { return c.id === id; })[0] || null;
  }
  function prodItem(id) {
    id = PROD_ALIAS[id] || id;
    return PROD_ITEMS.filter(function (i) { return i.id === id; })[0] || null;
  }
  function prodLine(id) {
    return prodItem(id) || PROD_ITEMS[0];
  }
  function prodBatch(n) {
    return PROD_BATCHES.filter(function (b) { return b.qty === Number(n); })[0] || PROD_BATCHES[1];
  }
  function prodUnitCost(item, batch) {
    var off = (batch && batch.off) || 0;
    var lvl = Math.min(0.1, Math.max(0, (B.level - 10) * 0.01));
    return Math.max(1, Math.round(item.cost * (1 - off) * (1 - lvl)));
  }
  function wholesalePrice(item) {
    return Math.max(item.cost + 1, Math.round(item.price * 0.6));
  }
  function prodStockTotal() {
    var f = B.factory;
    if (!f || !f.goods) return 0;
    var n = 0;
    Object.keys(f.goods).forEach(function (k) { n += Number(f.goods[k]) || 0; });
    f.stock = n;
    return n;
  }
  function migrateFactory() {
    var f = B.factory;
    if (!f || !f.built) return null;
    if (!f.goods || typeof f.goods !== 'object') {
      f.goods = {};
      if (Number(f.stock) > 0) f.goods.home_set = Number(f.stock);
    }
    Object.keys(f.goods).forEach(function (k) {
      var item = prodItem(k);
      if (!item) {
        f.goods.home_set = (f.goods.home_set || 0) + (Number(f.goods[k]) || 0);
        delete f.goods[k];
      } else if (PROD_ALIAS[k]) {
        f.goods[item.id] = (f.goods[item.id] || 0) + (Number(f.goods[k]) || 0);
        delete f.goods[k];
      }
    });
    prodStockTotal();
    if (!prodCat(f.cat)) f.cat = prodItem(f.line) ? prodItem(f.line).cat : 'home';
    if (!prodItem(f.line) || prodItem(f.line).cat !== f.cat) {
      var first = PROD_ITEMS.filter(function (i) { return i.cat === f.cat; })[0] || PROD_ITEMS[0];
      f.line = first.id;
      f.cat = first.cat;
    }
    f.batch = prodBatch(f.batch).qty;
    return f;
  }
  function activeListings() {
    return (B.listings || []).filter(function (l) { return l.active !== false; });
  }

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
      migrateFactory();
      var cat = prodCat(f.cat) || PROD_CATS[0];
      var items = PROD_ITEMS.filter(function (i) { return i.cat === cat.id; });
      var sel = prodItem(f.line);
      if (!sel || sel.cat !== cat.id) sel = items[0];
      f.cat = cat.id;
      f.line = sel.id;
      var batch = prodBatch(f.batch);
      var unit = prodUnitCost(sel, batch);
      var total = unit * batch.qty;
      var margin = Math.max(0, sel.price - unit);
      var stockTotal = prodStockTotal();
      var rows = PROD_ITEMS.filter(function (i) { return (Number(f.goods[i.id]) || 0) > 0; });
      var wholesale = rows.reduce(function (s, i) { return s + (Number(f.goods[i.id]) || 0) * wholesalePrice(i); }, 0);

      var catHTML = PROD_CATS.map(function (c) {
        var cnt = PROD_ITEMS.filter(function (i) { return i.cat === c.id; }).length;
        return '<button class="pr-cat' + (c.id === cat.id ? ' on' : '') + '" type="button" onclick="Biz.prodCat(\'' + c.id + '\')">' +
          '<span style="background:' + c.color + '"><i class="fa-solid ' + c.icon + '"></i></span>' +
          '<b>' + esc(c.name) + '</b><small>' + cnt + ' тов.</small></button>';
      }).join('');

      var lineHTML = items.map(function (i) {
        var has = Number(f.goods[i.id]) || 0;
        return '<button class="pr-line' + (i.id === sel.id ? ' on' : '') + '" type="button" onclick="Biz.prodPick(\'' + i.id + '\')">' +
          '<span class="pr-line-ic" style="background:' + i.color + '"><i class="fa-solid ' + i.icon + '"></i></span>' +
          '<span class="pr-line-info"><b>' + esc(i.name) + '</b><small>' + fmt(i.price) + ' · склад ' + has + ' шт</small></span>' +
          (i.id === sel.id ? '<i class="fa-solid fa-check pr-line-ok"></i>' : '') +
          '</button>';
      }).join('');

      var whHTML = '<div class="pr-wh">' +
        '<div class="pr-wh-head"><b>Склад</b><span>' + stockTotal + ' шт</span></div>' +
        (rows.length ? rows.map(function (i) {
          var q = Number(f.goods[i.id]) || 0;
          return '<div class="pr-wrow"><span class="pr-wic" style="background:' + i.color + '"><i class="fa-solid ' + i.icon + '"></i></span>' +
            '<div><b>' + esc(i.name) + '</b><span>' + q + ' шт · опт ' + fmt(wholesalePrice(i)) + '/шт</span></div>' +
            '<button type="button" onclick="Biz.openListing(\'' + i.id + '\')">В Лавку</button></div>';
        }).join('') : '<p class="pr-note" style="margin:2px 0 10px">Склад пуст — запустите партию.</p>') +
        (stockTotal ? '<button class="pr-wh-sell" type="button" onclick="Biz.sell()"><i class="fa-solid fa-truck-fast"></i> Продать всё оптом · ' + fmt(wholesale) + '</button>' : '') +
        '</div>';

      var selHTML = '<div class="pr-sel">' +
        '<div class="pr-sel-head"><span class="pr-sel-ic" style="background:' + sel.color + '"><i class="fa-solid ' + sel.icon + '"></i></span>' +
        '<div><b>' + esc(sel.name) + '</b><span>' + esc(sel.desc) + '</span></div></div>' +
        '<div class="pr-money">' +
        '<div><span>Себестоимость</span><b>' + fmt(unit) + '<small>/шт</small></b></div>' +
        '<div><span>Цена в Лавке</span><b>' + fmt(sel.price) + '</b></div>' +
        '<div><span>Прибыль</span><b class="up">+' + fmt(margin) + '</b></div>' +
        '</div>' +
        '<div class="pr-batch-head"><span>Размер партии</span><span>себестоимость</span></div>' +
        '<div class="pr-batches">' + PROD_BATCHES.map(function (b) {
          var u = prodUnitCost(sel, b), t = u * b.qty;
          return '<button class="pr-batch' + (b.qty === batch.qty ? ' on' : '') + '" type="button" onclick="Biz.prodBatch(' + b.qty + ')">' +
            '<b>' + b.qty + ' шт</b><span>' + fmt(t) + '</span>' + (b.off ? '<em>−' + Math.round(b.off * 100) + '%</em>' : '') + '</button>';
        }).join('') + '</div>' +
        '<button class="pr-go" type="button" onclick="Biz.produce()"><i class="fa-solid fa-gears"></i> Запустить партию · ' + fmt(total) + '</button>' +
        '<p class="pr-hint">Партия ' + batch.qty + ' шт · потенциал ' + fmt(margin * batch.qty) + ' при продаже по цене Лавки</p>' +
        '</div>';

      var ls = activeListings();
      var marketBlock = '<div class="pr-market">' +
        '<div class="pr-market-head"><b>Витрина Лавки</b><span>' + ls.length + ' поз. · продано ' + ls.reduce(function (n, l) { return n + (Number(l.sold) || 0); }, 0) + '</span></div>' +
        (ls.length ? ls.map(function (l) {
          var line = prodLine(l.line);
          return '<div class="pr-mrow"><span class="pr-mic" style="background:' + line.color + '"><i class="fa-solid ' + line.icon + '"></i></span>' +
            '<div style="flex:1;min-width:0"><b>' + esc(l.name) + '</b><span>' + fmt(l.price) + ' · остаток ' + l.stock + ' шт · продано ' + (l.sold || 0) + '</span></div>' +
            '<button type="button" class="pr-mx" onclick="Biz.unlist(' + l.id + ')">Снять</button></div>';
        }).join('') : '<p class="pr-note">Пока пусто. Выставьте партию — её увидят покупатели Лавки.</p>') +
        '<button class="pr-list-btn" type="button" onclick="Biz.openListing()"><i class="fa-solid fa-store"></i> Выставить в Лавку</button></div>';

      body = '<div class="pr-factory"><div class="pr-factory-top"><span>ЦЕХ №4</span><i class="fa-solid fa-industry"></i></div>' +
        '<b>Лавка Продакшн</b><span>Промзона · линия №1</span></div>' +
        whHTML +
        '<div class="pr-prod"><div class="pr-prod-head"><b>Что производим</b><span>категория и товар</span></div>' +
        '<div class="pr-cats">' + catHTML + '</div>' +
        '<div class="pr-lines">' + lineHTML + '</div>' +
        selHTML + '</div>' +
        marketBlock +
        '<div class="pr-stats"><div><b>' + (B.stats.sold || 0) + '</b><span>опт. сделок</span></div><div><b>' + fmt(B.stats.revenue) + '</b><span>выручка</span></div><div><b>' + stockTotal + '</b><span>на складе</span></div></div>' +
        '<p class="pr-note">Себестоимость падает с уровнем и размером партии. Товар можно продать в Лавке или сдать оптом.</p>';
    }
    prodHost.innerHTML = '<div class="pr">' +
      '<header class="pr-top"><button class="pr-back" type="button" data-back><i class="fa-solid fa-chevron-left"></i></button>' +
      '<div><b>ПРОИЗВОДСТВО</b><span>свой продукт</span></div><span class="pr-lvl">ур. ' + B.level + '</span></header>' +
      '<div class="app-scroll pb pr-body">' + body + '</div></div>';
  }

  Biz.prodCat = function (id) {
    var f = migrateFactory();
    if (!f || !prodCat(id)) return;
    var first = PROD_ITEMS.filter(function (i) { return i.cat === id; })[0];
    if (!first) return;
    f.cat = id;
    f.line = first.id;
    save();
    renderProd();
  };

  Biz.prodPick = function (id) {
    var f = migrateFactory();
    var item = prodItem(id);
    if (!f || !item) return;
    f.line = item.id;
    f.cat = item.cat;
    save();
    renderProd();
  };

  Biz.prodBatch = function (n) {
    var f = migrateFactory();
    if (!f) return;
    f.batch = prodBatch(n).qty;
    save();
    renderProd();
  };

  Biz.produce = function () {
    var f = migrateFactory();
    if (!f) { toast('Сначала постройте завод'); return; }
    var item = prodItem(f.line) || PROD_ITEMS[0];
    var batch = prodBatch(f.batch);
    var unit = prodUnitCost(item, batch);
    var total = unit * batch.qty;
    if (B.cash < total) { toast('Нужно ' + fmt(total)); return; }
    B.cash -= total;
    f.goods[item.id] = (Number(f.goods[item.id]) || 0) + batch.qty;
    prodStockTotal();
    B.events.unshift({ t: 'prod', text: 'Выпущено ' + batch.qty + ' шт · ' + item.name, time: nowTime() });
    addXp(12 + Math.round(batch.qty / 10));
    save();
    renderProd();
    if (jobHost) renderJob();
    toast('Партия готова: ' + batch.qty + ' шт · ' + item.name);
  };

  Biz.sell = function () {
    var f = migrateFactory();
    if (!f) { toast('Сначала постройте завод'); return; }
    var rows = PROD_ITEMS.filter(function (i) { return (Number(f.goods[i.id]) || 0) > 0; });
    if (!rows.length) { toast('Склад пуст — запустите партию'); return; }
    var total = 0, units = 0;
    var listHTML = rows.map(function (i) {
      var q = Number(f.goods[i.id]) || 0;
      var sum = q * wholesalePrice(i);
      total += sum;
      units += q;
      return '<div class="pr-opl-row"><span>' + esc(i.name) + ' · ' + q + ' шт</span><b>' + fmt(sum) + '</b></div>';
    }).join('');
    showSheet('<div class="bj-sheet-grab"></div><h3>Продать оптом</h3>' +
      '<p class="bj-sheet-sub">Скупщик заберёт весь склад: ' + units + ' шт. В Лавке продавать выгоднее.</p>' +
      '<div class="pr-opl">' + listHTML + '</div>' +
      '<div class="summary-total"><span>Итого</span><b>' + fmt(total) + '</b></div>' +
      '<button class="btn btn-primary btn-block" style="margin-top:10px" type="button" onclick="Biz.sellGo()">Продать · ' + fmt(total) + '</button>' +
      '<button class="btn btn-block" style="margin-top:8px" type="button" onclick="Biz.closeSheet()">Отмена</button>');
  };

  Biz.sellGo = function () {
    var f = migrateFactory();
    if (!f) return;
    var total = 0, units = 0;
    PROD_ITEMS.forEach(function (i) {
      var q = Number(f.goods[i.id]) || 0;
      if (q > 0) { units += q; total += q * wholesalePrice(i); }
    });
    if (!units) { closeSheet(); return; }
    B.cash += total;
    B.stats.sold = (B.stats.sold || 0) + 1;
    f.goods = {};
    prodStockTotal();
    B.events.unshift({ t: 'sold', text: 'Опт: ' + units + ' шт · +' + fmt(total), time: nowTime() });
    addXp(Math.min(90, 10 + Math.round(units / 10)));
    closeSheet();
    storyTick();
    save();
    renderProd();
    if (jobHost) renderJob();
    toast('Опт: ' + units + ' шт · +' + fmt(total));
  };

  Biz.openListing = function (id) {
    var f = migrateFactory();
    if (!f) { toast('Сначала постройте завод'); return; }
    var avail = PROD_ITEMS.filter(function (i) { return (Number(f.goods[i.id]) || 0) > 0; });
    if (!avail.length) { toast('На складе нет товара — запустите партию'); return; }
    var want = id ? prodItem(id) : prodItem(f.line);
    var pick = want && (Number(f.goods[want.id]) || 0) > 0 ? want : avail[0];
    var opts = avail.map(function (i) {
      return '<option value="' + i.id + '"' + (i.id === pick.id ? ' selected' : '') + '>' +
        esc(i.name) + ' · ' + (Number(f.goods[i.id]) || 0) + ' шт · от ' + fmt(i.price) + '</option>';
    }).join('');
    var have = Number(f.goods[pick.id]) || 0;
    showSheet('<div class="bj-sheet-grab"></div><h3>Выставить в Лавку</h3>' +
      '<p class="bj-sheet-sub">Товар появится в маркетплейсе. Покупатели увидят его в разделе «Мой завод».</p>' +
      '<label class="pr-field"><span>Товар</span><select class="field" id="lst-line" onchange="Biz.listingFill()">' + opts + '</select></label>' +
      '<label class="pr-field"><span>Цена за штуку, ₽</span><input class="field" id="lst-price" type="number" value="' + pick.price + '" min="100" step="10"></label>' +
      '<label class="pr-field"><span id="lst-have">Количество · на складе ' + have + ' шт</span>' +
      '<input class="field" id="lst-qty" type="number" value="' + Math.min(100, have) + '" min="1" max="' + have + '"></label>' +
      '<button class="btn btn-primary btn-block" style="margin-top:10px" type="button" onclick="Biz.listAdd()">Выставить</button>' +
      '<button class="btn btn-block" style="margin-top:8px" type="button" onclick="Biz.closeSheet()">Отмена</button>');
  };

  Biz.listingFill = function () {
    var f = migrateFactory();
    if (!f) return;
    var sel = document.getElementById('lst-line');
    var item = prodItem(sel ? sel.value : '');
    if (!item) return;
    var have = Number(f.goods[item.id]) || 0;
    var pr = document.getElementById('lst-price');
    var qt = document.getElementById('lst-qty');
    var lbl = document.getElementById('lst-have');
    if (pr) pr.value = item.price;
    if (lbl) lbl.textContent = 'Количество · на складе ' + have + ' шт';
    if (qt) {
      qt.max = have;
      if (Number(qt.value) > have || Number(qt.value) < 1) qt.value = Math.min(100, have);
    }
  };

  Biz.listAdd = function () {
    var f = migrateFactory();
    if (!f) return;
    var sel = document.getElementById('lst-line');
    var pr = document.getElementById('lst-price');
    var qt = document.getElementById('lst-qty');
    var item = prodItem(sel ? sel.value : f.line);
    if (!item) return;
    var have = Number(f.goods[item.id]) || 0;
    var price = Math.round(Number(pr ? pr.value : item.price) || item.price);
    var qty = Math.round(Number(qt ? qt.value : 0) || 0);
    if (price < 100) { toast('Цена — не меньше 100 ₽'); return; }
    if (qty < 1) { toast('Укажите количество'); return; }
    if (qty > have) { toast('На складе только ' + have + ' шт'); return; }
    var same = activeListings().filter(function (l) { return (prodItem(l.line) || PROD_ITEMS[0]).id === item.id; })[0];
    if (same) {
      same.price = price;
      same.stock += qty;
    } else {
      B.nextListId = (B.nextListId || 0) + 1;
      B.listings.push({ id: B.nextListId, line: item.id, name: item.name, price: price, stock: qty, sold: 0, active: true });
    }
    f.goods[item.id] = have - qty;
    prodStockTotal();
    B.events.unshift({ t: 'prod', text: 'В Лавку выставлено ' + qty + ' шт · ' + item.name, time: nowTime() });
    closeSheet();
    save();
    renderProd();
    toast('Товар выставлен в Лавку');
  };

  Biz.unlist = function (id) {
    var l = (B.listings || []).filter(function (x) { return x.id === Number(id); })[0];
    if (!l) return;
    var f = migrateFactory();
    var item = prodItem(l.line);
    if (f && item) {
      f.goods[item.id] = (Number(f.goods[item.id]) || 0) + (Number(l.stock) || 0);
      prodStockTotal();
    }
    B.listings = B.listings.filter(function (x) { return x !== l; });
    save();
    renderProd();
    toast('Товар снят с витрины');
  };

  Biz.marketListings = function () {
    return activeListings().filter(function (l) { return Number(l.stock) > 0; }).map(function (l) {
      var line = prodLine(l.line);
      return { id: l.id, name: l.name, price: l.price, stock: l.stock, sold: l.sold || 0, line: line.id, icon: line.icon, color: line.color };
    });
  };

  Biz.checkStock = function (id, qty) {
    var l = (B.listings || []).filter(function (x) { return x.id === Number(id); })[0];
    return !!l && l.active !== false && Number(l.stock) >= Number(qty);
  };

  Biz.fulfill = function (items) {
    var earned = 0, sold = 0;
    (items || []).forEach(function (it) {
      var l = (B.listings || []).filter(function (x) { return x.id === Number(it.biz); })[0];
      var q = Number(it.qty) || 0;
      if (!l || q <= 0 || Number(l.stock) < q) return;
      l.stock = Number(l.stock) - q;
      l.sold = (Number(l.sold) || 0) + q;
      if (l.stock <= 0) l.active = false;
      earned += (Number(it.price) || 0) * q;
      sold += q;
    });
    if (!earned) return;
    B.cash += earned;
    B.stats.orders = (B.stats.orders || 0) + sold;
    B.stats.revenue = (B.stats.revenue || 0) + earned;
    B.events.unshift({ t: 'sold', text: 'Продажа через Лавку · +' + fmt(earned), time: nowTime() });
    addXp(Math.min(120, 20 + sold * 2));
    storyTick();
    save();
    if (prodHost) renderProd();
    if (jobHost) renderJob();
    toast('Продажа через Лавку · +' + fmt(earned));
  };

  Biz.resetState = function () {
    var fresh = JSON.parse(JSON.stringify(DEFAULTS));
    Object.keys(B).forEach(function (k) { delete B[k]; });
    Object.keys(fresh).forEach(function (k) { B[k] = fresh[k]; });
    try { save(); } catch (e) {}
    if (prodHost) { try { renderProd(); } catch (e) {} }
    if (jobHost) { try { renderJob(); } catch (e) {} }
  };

  Biz.buildFactory = function () {
    if (B.factory && B.factory.built) { toast('Завод уже построен'); return; }
    if (B.cash < 150000) { toast('Нужно 150 000 ₽. Проведите ещё смены'); return; }
    B.cash -= 150000;
    B.factory = { built: true, district: 'industrial', stock: 0, goods: {}, cat: 'home', line: 'home_set', batch: 50 };
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
  Biz.migrateStory = function (force) {
    if (force) B.story.v2 = false;
    migrateStoryV2();
  };
  migrateStoryV2();

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
  if (B.level >= 10) unlockProduction(true);

  LV.save();
})();
