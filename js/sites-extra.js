/* Лавка — дополнительные сайты браузера LACKUUN.COM
   Каждый сайт со своей вёрсткой, шапкой и навигацией. */
(function () {
  'use strict';

  var W = window.Web;
  if (!W || !W.sites) return;

  var LV = window.LV;
  var esc = LV.esc;
  var fmt = LV.fmt;

  /* ============================================================
     ПУЛЬС — соцсеть
     ============================================================ */
  W.sites.push({
    id: 'pulse', name: 'Пульс', host: 'pulse.net', cat: 'social', custom: true,
    icon: 'fa-bolt', color: '#7c3aed',
    slogan: 'Люди, мысли и немного хаоса',
    nav: [['feed', 'Лента'], ['trends', 'Тренды'], ['profile', 'Профиль']],
    chrome: function (body, page) {
      page = page || 'feed';
      var tabs = [['feed', 'Лента', 'fa-house'], ['trends', 'Тренды', 'fa-fire'], ['profile', 'Профиль', 'fa-user']].map(function (t) {
        return '<button class="pls-tab' + (t[0] === page ? ' on' : '') + '" type="button" onclick="Web.sitePage(\'pulse\',\'' + t[0] + '\')"><i class="fa-solid ' + t[2] + '"></i><span>' + t[1] + '</span></button>';
      }).join('');
      var name = LV.state.user.name || 'Гость';
      return '<div class="pls">' +
        '<header class="pls-top"><b class="pls-logo">пульс<span>.</span></b>' +
        '<div class="pls-top-act">' +
        '<button type="button" class="pls-ico" onclick="LV.toast(\'Поиск в Пульсе скоро\')"><i class="fa-solid fa-magnifying-glass"></i></button>' +
        '<button type="button" class="pls-ava" onclick="Web.sitePage(\'pulse\',\'profile\')">' + esc(LV.initials(name)) + '</button>' +
        '</div></header>' +
        '<nav class="pls-tabs">' + tabs + '</nav>' +
        '<div class="pls-body">' + body + '</div></div>';
    },
    pages: {
      feed: function () {
        var stories = [['Ваша история', '#7c3aed'], ['Спорт', '#22c55e'], ['Кино', '#ef4444'], ['Вести', '#0ea5e9'], ['Едок', '#f97316'], ['Игры', '#a855f7']].map(function (s, i) {
          return '<button class="pls-story" type="button" onclick="LV.toast(\'Истории скоро\')"><span style="background:linear-gradient(140deg,' + s[1] + ',#0b0f19)">' + (i ? esc(s[0][0]) : '+') + '</span><b>' + s[0] + '</b></button>';
        }).join('');
        var name = LV.state.user.name || 'Гость';
        return '<div class="pls-stories">' + stories + '</div>' +
          '<div class="pls-compose"><span class="pls-ava">' + esc(LV.initials(name)) + '</span>' +
          '<input id="pls-input" placeholder="Что происходит?"><button type="button" onclick="LV.toast(\'Опубликовано\')"><i class="fa-solid fa-paper-plane"></i></button></div>' +
          plsPost('p1', 'Марина К.', 'МК', '#ec4899', '@marina', 'Проверила новый «Едок»: пицца приехала за 24 минуты, курьер — легенда. Город всё-таки становится удобнее.', '24 минуты', 128, 'Едок', true) +
          plsPost('p2', 'Костя', 'К', '#0ea5e9', '@kostya', 'Купил на «Торге» велосипед за 12 000. Продавец оказался соседом из пятого подъезда. Мир тесен.', '1 час', 64, 'Торг') +
          plsPost('p3', 'Пульс Новости', 'П', '#f59e0b', '@pulse_news', 'В «Работе+» открыли 300 вакансий для студентов: гибкий график и оплата каждую неделю.', '2 часа', 210, 'Работа+');
      },
      trends: function () {
        var trends = [['#ЕдокЗаЧас', '4 218 постов', 'Еда и доставка'], ['#ТоргНаходки', '3 902 поста', 'Покупки'], ['#XPRODCID', '2 744 поста', 'Технологии'], ['#РаботаПлюс', '1 980 постов', 'Карьера'], ['#Авиатор', '1 431 пост', 'Путешествия'], ['#ПульсМемы', '998 постов', 'Юмор']].map(function (t) {
          return '<button class="pls-trend" type="button" onclick="LV.toast(\'Лента тренда скоро\')"><span>' + t[2] + '</span><b>' + t[0] + '</b><small>' + t[1] + '</small></button>';
        }).join('');
        return '<div class="pls-sec"><b>Что обсуждают</b><span>сегодня</span></div>' + trends +
          '<div class="pls-sec"><b>Кого читать</b><span>подборка</span></div>' +
          '<div class="pls-people">' + [
            ['Аня Ветрова', 'дизайнер', 'АВ', '#8b5cf6'],
            ['Максим Орлов', 'обзоры техники', 'МО', '#0ea5e9'],
            ['Лена Ким', 'ЛАВКА PAY', 'ЛК', '#ef4444']
          ].map(function (p) {
            return '<div class="pls-person"><span class="pls-ava" style="background:' + p[3] + '">' + p[2] + '</span><div><b>' + p[0] + '</b><span>' + p[1] + '</span></div><button type="button" onclick="LV.toast(\'Вы подписались\')">Читать</button></div>';
          }).join('') + '</div>';
      },
      profile: function () {
        var name = LV.state.user.name || 'Гость';
        var xid = LV.state.user.xid || 'XPRODC ID не подключён';
        return '<div class="pls-me">' +
          '<span class="pls-ava xl" style="background:linear-gradient(140deg,#7c3aed,#ec4899)">' + esc(LV.initials(name)) + '</span>' +
          '<h3>' + esc(name) + '</h3><p>' + esc(xid) + '</p>' +
          '<div class="pls-me-stats"><div><b>12</b><span>постов</span></div><div><b>148</b><span>читателей</span></div><div><b>37</b><span>подписок</span></div></div>' +
          '<button class="pls-edit" type="button" onclick="LV.toast(\'Профиль редактируется в XPRODC ID\')">Редактировать профиль</button></div>' +
          '<div class="pls-sec"><b>Мои посты</b><span>все</span></div>' +
          plsPost('mp1', esc(name), LV.initials(name), '#7c3aed', '@me', 'Первый заказ в «Лавке» — оплатил с карты BankFake за пару секунд. Единый ID реально экономит время.', '3 дня', 12, 'Лавка');
      }
    }
  });

  function plsPost(id, name, ini, color, handle, text, time, likes, tag, withImage) {
    return '<article class="pls-post">' +
      '<div class="pls-post-head"><span class="pls-ava" style="background:' + color + '">' + ini + '</span>' +
      '<div><b>' + name + '</b><span>' + handle + ' · ' + time + '</span></div>' +
      '<i class="fa-solid fa-ellipsis"></i></div>' +
      '<p>' + text + '</p>' +
      (withImage ? '<div class="pls-photo" style="background:linear-gradient(140deg,#f97316,#7c3aed)"><i class="fa-solid fa-burger"></i></div>' : '') +
      '<div class="pls-actions">' +
      '<button class="pls-act" type="button" data-like="' + id + '" onclick="Web.like(this)"><i class="fa-regular fa-heart"></i><b>' + likes + '</b></button>' +
      '<button class="pls-act" type="button" onclick="LV.toast(\'Комментарии скоро\')"><i class="fa-regular fa-comment"></i><b>18</b></button>' +
      '<button class="pls-act" type="button" onclick="LV.toast(\'Репост\')"><i class="fa-solid fa-retweet"></i></button>' +
      '<span class="pls-tag">' + tag + '</span></div></article>';
  }

  /* ============================================================
     ТОРГ — объявления
     ============================================================ */
  var TRG = {
    t1: { name: 'iPhone 15 Pro 256 ГБ', price: 54900, desc: 'Хорошее состояние, полный комплект: коробка, кабель, чек. Батарея 92%.', city: 'Москва', time: '5 минут назад', icon: 'fa-mobile-screen', color: '#0ea5e9', seller: 'Артём', rating: '4.9', reviews: 38 },
    t2: { name: 'Велосипед Trek 3', price: 12000, desc: 'Горный, 21 скорость, обслужен в мастерской. Рама L, подойдёт на рост 175–185.', city: 'Москва', time: '12 минут назад', icon: 'fa-bicycle', color: '#16a34a', seller: 'Ольга', rating: '5.0', reviews: 12 },
    t3: { name: 'Диван-кровать', price: 18500, desc: 'Мягкий, механизм «дельфин», есть небольшие потёртости на подлокотнике.', city: 'Химки', time: '20 минут назад', icon: 'fa-couch', color: '#b45309', seller: 'Денис', rating: '4.7', reviews: 21 },
    t4: { name: 'Кроссовки Nike 43', price: 4200, desc: 'Новые, с коробкой. Примерял — размер не подошёл.', city: 'Москва', time: '35 минут назад', icon: 'fa-shoe-prints', color: '#ef4444', seller: 'Кирилл', rating: '4.8', reviews: 9 },
    t5: { name: 'Кофемашина DeLonghi', price: 9800, desc: 'Работает идеально, есть чек и инструкция. Продаю из-за переезда.', city: 'Мытищи', time: '1 час назад', icon: 'fa-mug-hot', color: '#7c3aed', seller: 'Алина', rating: '4.9', reviews: 44 },
    t6: { name: 'Коллекционные часы', price: 27000, desc: 'СССР, в рабочем состоянии, ремешок заменён. Готов показать при встрече.', city: 'Москва', time: '2 часа назад', icon: 'fa-clock', color: '#f59e0b', seller: 'Виктор', rating: '5.0', reviews: 67 }
  };

  W.sites.push({
    id: 'torg', name: 'Торг', host: 'torg.net', cat: 'shop', custom: true,
    icon: 'fa-tags', color: '#16a34a',
    slogan: 'Объявления рядом с тобой',
    nav: [],
    chrome: function (body) {
      return '<div class="trg"><header class="trg-top">' +
        '<button class="trg-logo" type="button" onclick="Web.sitePage(\'torg\',\'index\')">торг</button>' +
        '<input class="trg-search" placeholder="Что ищете?" onkeydown="if(event.key===\'Enter\')LV.toast(\'Поиск по объявлениям\')">' +
        '<button class="trg-add" type="button" onclick="Web.sitePage(\'torg\',\'new\')"><i class="fa-solid fa-plus"></i></button>' +
        '</header><div class="trg-body">' + body + '</div></div>';
    },
    pages: {
      index: function () {
        var cats = ['Все', 'Электроника', 'Авто', 'Недвижимость', 'Дом', 'Одежда', 'Работа'];
        return '<div class="trg-chips">' + cats.map(function (c, i) {
          return '<button class="trg-chip' + (i === 0 ? ' on' : '') + '" type="button" onclick="Web.chip(this)">' + c + '</button>';
        }).join('') + '</div>' +
          '<div class="trg-grid">' + [['t1', 'Срочно'], ['t2', ''], ['t3', 'Торг'], ['t4', ''], ['t5', ''], ['t6', 'Редкость']].map(function (row) {
            var p = TRG[row[0]];
            return '<button class="trg-card" type="button" onclick="Web.sitePage(\'torg\',\'' + row[0] + '\')">' +
              '<span class="trg-thumb" style="background:' + p.color + '"><i class="fa-solid ' + p.icon + '"></i>' + (row[1] ? '<em>' + row[1] + '</em>' : '') + '</span>' +
              '<b>' + fmt(p.price) + '</b><span class="trg-name">' + esc(p.name) + '</span><small>' + esc(p.city) + ' · ' + p.time + '</small></button>';
          }).join('') + '</div>' +
          '<p class="trg-foot">Найдено 84 217 объявлений · показываем 6</p>';
      },
      t1: function () { return trgItem('t1'); },
      t2: function () { return trgItem('t2'); },
      t3: function () { return trgItem('t3'); },
      t4: function () { return trgItem('t4'); },
      t5: function () { return trgItem('t5'); },
      t6: function () { return trgItem('t6'); },
      new: function () {
        return '<button class="trg-back" type="button" onclick="Web.back()"><i class="fa-solid fa-chevron-left"></i> Назад</button>' +
          '<h2 class="trg-h2">Новое объявление</h2>' +
          '<div class="trg-form">' +
          '<label>Название<input placeholder="Например, велосипед Trek"></label>' +
          '<label>Цена<input placeholder="12 000" inputmode="numeric"></label>' +
          '<label>Город<input placeholder="Москва"></label>' +
          '<label>Описание<textarea placeholder="Расскажите о товаре"></textarea></label>' +
          '<button class="trg-submit" type="button" onclick="LV.toast(\'Объявление отправлено на проверку\')">Опубликовать</button>' +
          '<p class="trg-note">Публикация бесплатна. Объявления проверяются в течение 15 минут.</p></div>';
      }
    }
  });

  function trgItem(id) {
    var p = TRG[id];
    return '<button class="trg-back" type="button" onclick="Web.back()"><i class="fa-solid fa-chevron-left"></i> Назад</button>' +
      '<div class="trg-photo" style="background:linear-gradient(140deg,' + p.color + ',#0f172a)"><i class="fa-solid ' + p.icon + '"></i></div>' +
      '<h2 class="trg-price">' + fmt(p.price) + '</h2>' +
      '<h3 class="trg-title">' + esc(p.name) + '</h3>' +
      '<p class="trg-meta">' + esc(p.city) + ' · ' + p.time + '</p>' +
      '<div class="trg-seller"><span class="trg-ava">' + esc(p.seller[0]) + '</span>' +
      '<div><b>' + esc(p.seller) + '</b><span><i class="fa-solid fa-star"></i> ' + p.rating + ' · ' + p.reviews + ' отзывов</span></div>' +
      '<button type="button" onclick="LV.toast(\'Чат с продавцом\')">Написать</button></div>' +
      '<p class="trg-desc">' + esc(p.desc) + '</p>' +
      '<div class="trg-actions"><button type="button" onclick="LV.toast(\'Телефон скрыт в демо\')"><i class="fa-solid fa-phone"></i> Показать телефон</button>' +
      '<button type="button" onclick="LV.toast(\'Добавлено в избранное\')"><i class="fa-regular fa-heart"></i></button></div>';
  }

  /* ============================================================
     РАБОТА+ — вакансии
     ============================================================ */
  var VAC = {
    v1: { title: 'Frontend-разработчик', company: 'Лавка', salary: 'от 180 000 ₽', city: 'Москва · удалённо', icon: 'Л', color: '#10b981', tags: ['React', 'TypeScript', 'удалённо'], desc: 'Делаем интерфейсы маркетплейса для 2 млн пользователей: каталог, корзина, оплата по XPRODC ID.', req: ['Опыт от 3 лет', 'React и TypeScript', 'Понимание UX и доступности'], plus: 'Гибкий график, ДМС, техника на выбор.' },
    v2: { title: 'Курьер', company: 'Едок', salary: 'от 90 000 ₽', city: 'Москва', icon: 'Е', color: '#f97316', tags: ['смены', 'выплаты каждую неделю'], desc: 'Доставка заказов из ресторанов. Пешком или на самокате — как удобнее.', req: ['18+', 'Ответственность', 'Смартфон'], plus: 'Бонусы за смены, форма и термосумка.' },
    v3: { title: 'Менеджер по продажам', company: 'BankFake', salary: '120 000 ₽ + %', city: 'Москва · офис', icon: 'B', color: '#059669', tags: ['офис', 'бонусы'], desc: 'Работа с партнёрами и корпоративными клиентами банка.', req: ['Опыт в продажах от 1 года', 'Грамотная речь', 'CRM'], plus: 'Обучение за счёт компании.' },
    v4: { title: 'Повар-универсал', company: 'Едок', salary: '75 000 ₽', city: 'Москва', icon: 'Е', color: '#f97316', tags: ['кухня', 'график 2/2'], desc: 'Готовим пиццу и бургеры в открытой кухне. Обучим стандартам.', req: ['Опыт на кухне', 'Санитарные книжки'], plus: 'Питание, премии за смены.' },
    v5: { title: 'Аналитик данных', company: 'Лавка', salary: 'от 220 000 ₽', city: 'Удалённо', icon: 'Л', color: '#10b981', tags: ['SQL', 'Python', 'удалённо'], desc: 'Строим отчёты по заказам и доставке, ищем узкие места.', req: ['SQL', 'Python', 'Опыт с BI'], plus: 'ДМС, оплата обучения.' }
  };

  W.sites.push({
    id: 'rabota', name: 'Работа+', host: 'rabota.net', cat: 'service', custom: true,
    icon: 'fa-briefcase', color: '#0f4c81',
    slogan: 'Работа, которая подходит',
    nav: [],
    chrome: function (body) {
      return '<div class="rbt"><header class="rbt-top">' +
        '<button class="rbt-logo" type="button" onclick="Web.sitePage(\'rabota\',\'index\')">Работа<i>+</i></button>' +
        '<button class="rbt-resume" type="button" onclick="Web.sitePage(\'rabota\',\'resume\')">Резюме</button>' +
        '</header><div class="rbt-body">' + body + '</div></div>';
    },
    pages: {
      index: function () {
        var chips = ['Все', 'IT', 'Продажи', 'Доставка', 'Офис', 'Кухня'].map(function (c, i) {
          return '<button class="rbt-chip' + (i === 0 ? ' on' : '') + '" type="button" onclick="Web.chip(this)">' + c + '</button>';
        }).join('');
        return '<div class="rbt-search"><i class="fa-solid fa-magnifying-glass"></i><input placeholder="Профессия или компания"><button type="button" onclick="LV.toast(\'Ищем вакансии\')">Найти</button></div>' +
          '<div class="rbt-chips">' + chips + '</div>' +
          '<p class="rbt-count">Найдено 1 248 вакансий</p>' +
          ['v1', 'v2', 'v3', 'v5', 'v4'].map(function (id) { return rbtRow(id); }).join('');
      },
      v1: function () { return rbtVac('v1'); },
      v2: function () { return rbtVac('v2'); },
      v3: function () { return rbtVac('v3'); },
      v4: function () { return rbtVac('v4'); },
      v5: function () { return rbtVac('v5'); },
      resume: function () {
        return '<h2 class="rbt-h2">Моё резюме</h2>' +
          '<div class="rbt-card rbt-me"><span class="rbt-ava">' + esc(LV.initials(LV.state.user.name || 'Гость')) + '</span>' +
          '<div><b>' + esc(LV.state.user.name || 'Гость') + '</b><span>Frontend-разработчик</span></div><span class="rbt-pub">опубликовано</span></div>' +
          '<div class="rbt-block"><b>О себе</b><p>Делаю интерфейсы для веба, люблю понятные формы и быстрые страницы.</p></div>' +
          '<div class="rbt-block"><b>Опыт</b><div class="rbt-exp"><span>Лавка · Frontend-разработчик</span><small>2023 — сейчас</small></div><div class="rbt-exp"><span>Студия «Пиксель» · верстальщик</span><small>2021 — 2023</small></div></div>' +
          '<div class="rbt-block"><b>Навыки</b><div class="rbt-tags"><span>React</span><span>TypeScript</span><span>CSS</span><span>Figma</span></div></div>' +
          '<button class="rbt-apply" type="button" onclick="LV.toast(\'Резюме обновлено\')">Обновить резюме</button>';
      }
    }
  });

  function rbtRow(id) {
    var v = VAC[id];
    return '<button class="rbt-row" type="button" onclick="Web.sitePage(\'rabota\',\'' + id + '\')">' +
      '<span class="rbt-logo-sq" style="background:' + v.color + '">' + v.icon + '</span>' +
      '<span class="rbt-info"><b>' + esc(v.title) + '</b><span>' + esc(v.company) + ' · ' + esc(v.city) + '</span><small>' + esc(v.salary) + '</small></span>' +
      '<i class="fa-solid fa-chevron-right"></i></button>';
  }

  function rbtVac(id) {
    var v = VAC[id];
    return '<button class="rbt-back" type="button" onclick="Web.back()"><i class="fa-solid fa-chevron-left"></i> Все вакансии</button>' +
      '<div class="rbt-vac"><span class="rbt-logo-sq big" style="background:' + v.color + '">' + v.icon + '</span>' +
      '<h2>' + esc(v.title) + '</h2><p class="rbt-salary">' + esc(v.salary) + '</p><span class="rbt-city">' + esc(v.company) + ' · ' + esc(v.city) + '</span></div>' +
      '<div class="rbt-tags">' + v.tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' +
      '<div class="rbt-block"><b>О вакансии</b><p>' + esc(v.desc) + '</p></div>' +
      '<div class="rbt-block"><b>Требования</b><ul>' + v.req.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="rbt-block"><b>Условия</b><p>' + esc(v.plus) + '</p></div>' +
      '<button class="rbt-apply" type="button" onclick="LV.toast(\'Отклик отправлен\')">Откликнуться</button>' +
      '<button class="rbt-save" type="button" onclick="LV.toast(\'Вакансия сохранена\')"><i class="fa-regular fa-bookmark"></i> Сохранить</button>';
  }

  /* ============================================================
     ЕДОК — доставка еды
     ============================================================ */
  var edokCart = {};

  function edokItems() { return Object.keys(edokCart).map(function (k) { return edokCart[k]; }); }
  function edokQty() { return edokItems().reduce(function (s, x) { return s + x.qty; }, 0); }
  function edokSum() { return edokItems().reduce(function (s, x) { return s + x.price * x.qty; }, 0); }
  function edokRefresh() {
    document.querySelectorAll('[data-edk-qty]').forEach(function (el) { el.textContent = edokQty(); });
    document.querySelectorAll('[data-edk-sum]').forEach(function (el) { el.textContent = fmt(edokSum()); });
  }

  W.edokAdd = function (e, name, price) {
    if (e && e.stopPropagation) e.stopPropagation();
    var it = edokCart[name] || (edokCart[name] = { name: name, price: price, qty: 0 });
    it.qty++;
    edokRefresh();
    LV.toast('Добавлено: ' + name);
  };
  W.edokClear = function () { edokCart = {}; edokRefresh(); };
  var edokOrder = '';

  W.sites.push({
    id: 'edok', name: 'Едок', host: 'edok.net', cat: 'shop', custom: true,
    icon: 'fa-burger', color: '#f97316',
    slogan: 'Вкусная еда за 30 минут',
    nav: [],
    chrome: function (body) {
      return '<div class="edk"><header class="edk-top">' +
        '<button class="edk-logo" type="button" onclick="Web.sitePage(\'edok\',\'index\')">едок</button>' +
        '<button class="edk-cart" type="button" onclick="Web.sitePage(\'edok\',\'cart\')"><i class="fa-solid fa-basket-shopping"></i><span data-edk-qty>' + edokQty() + '</span></button>' +
        '</header><div class="edk-body">' + body + '</div></div>';
    },
    pages: {
      index: function () {
        return '<div class="edk-promo"><div><span>−25% на первый заказ</span><b>Ужин без готовки</b><small>до 30 ноября · промокод LAVKA25</small></div><i class="fa-solid fa-pizza-slice"></i></div>' +
          '<div class="edk-cats">' + [['Пицца', 'fa-pizza-slice', '#ef4444'], ['Бургеры', 'fa-burger', '#f59e0b'], ['Суши', 'fa-fish', '#0ea5e9'], ['Кофе', 'fa-mug-hot', '#b45309'], ['Десерты', 'fa-ice-cream', '#ec4899']].map(function (c) {
            return '<button class="edk-cat" type="button" onclick="LV.toast(\'Категория: ' + c[0] + '\')"><span style="background:' + c[2] + '"><i class="fa-solid ' + c[1] + '"></i></span>' + c[0] + '</button>';
          }).join('') + '</div>' +
          '<h3 class="edk-h3">Рядом с вами</h3>' +
          '<div class="edk-rests">' + [
            ['Пиццерия «Джо»', 'Пицца · 25–35 мин', '4.9', '#ef4444', 'fa-pizza-slice', '2 400 заказов', '1 200 м'],
            ['Бургерная «Смэш»', 'Бургеры · 20–30 мин', '4.8', '#f59e0b', 'fa-burger', '1 800 заказов', '900 м'],
            ['Суши-бар «Тори»', 'Суши · 30–40 мин', '4.7', '#0ea5e9', 'fa-fish', '980 заказов', '1 500 м'],
            ['Кофейня «Утро»', 'Кофе · 15–20 мин', '4.9', '#b45309', 'fa-mug-hot', '3 100 заказов', '400 м']
          ].map(function (r) {
            return '<button class="edk-rest" type="button" onclick="Web.sitePage(\'edok\',\'menu\')">' +
              '<span class="edk-rest-art" style="background:linear-gradient(140deg,' + r[3] + ',#7c2d12)"><i class="fa-solid ' + r[4] + '"></i></span>' +
              '<b>' + r[0] + '</b><small>' + r[1] + '</small>' +
              '<span class="edk-rest-meta"><i class="fa-solid fa-star"></i>' + r[2] + ' · ' + r[6] + '</span></button>';
          }).join('') + '</div>';
      },
      menu: function () {
        return '<button class="edk-back" type="button" onclick="Web.back()"><i class="fa-solid fa-chevron-left"></i> Все рестораны</button>' +
          '<div class="edk-head"><span class="edk-head-art" style="background:linear-gradient(140deg,#ef4444,#7c2d12)"><i class="fa-solid fa-pizza-slice"></i></span>' +
          '<div><h2>Пиццерия «Джо»</h2><p><i class="fa-solid fa-star"></i> 4.9 · Пицца · 25–35 мин · 1 200 м</p></div></div>' +
          [
            ['Маргарита', 'Томатный соус, моцарелла, базилик', 490, 'fa-pizza-slice'],
            ['Пепперони', 'Острая салями, сыр, томаты', 590, 'fa-pizza-slice'],
            ['Четыре сыра', 'Моцарелла, горгонзола, пармезан, чеддер', 690, 'fa-cheese'],
            ['Карбонара', 'Бекон, сливочный соус, пармезан', 640, 'fa-bacon'],
            ['Тирамису', 'Классический десерт', 290, 'fa-ice-cream'],
            ['Лимонад', 'Домашний, 0.5 л', 190, 'fa-lemon']
          ].map(function (d) {
            return '<div class="edk-dish"><span class="edk-dish-ic"><i class="fa-solid ' + d[3] + '"></i></span>' +
              '<div class="edk-dish-info"><b>' + d[0] + '</b><span>' + d[1] + '</span><small>' + fmt(d[2]) + '</small></div>' +
              '<button type="button" onclick="Web.edokAdd(event,\'' + d[0] + '\',' + d[2] + ')"><i class="fa-solid fa-plus"></i></button></div>';
          }).join('') +
          '<div class="edk-bar"><div><span>Корзина</span><b data-edk-sum>' + fmt(edokSum()) + '</b></div><button type="button" onclick="Web.sitePage(\'edok\',\'cart\')">Перейти <span data-edk-qty>' + edokQty() + '</span></button></div>';
      },
      cart: function () {
        var items = edokItems();
        if (!items.length) {
          return '<div class="edk-empty"><i class="fa-solid fa-basket-shopping"></i><h3>Корзина пуста</h3><p>Добавьте блюда из меню — доставим за 30 минут.</p><button type="button" onclick="Web.sitePage(\'edok\',\'index\')">К ресторанам</button></div>';
        }
        var sum = edokSum();
        var del = sum >= 1500 ? 0 : 149;
        return '<h2 class="edk-h2">Корзина</h2>' +
          items.map(function (x) {
            return '<div class="edk-line"><div><b>' + esc(x.name) + '</b><span>' + x.qty + ' × ' + fmt(x.price) + '</span></div><b>' + fmt(x.qty * x.price) + '</b></div>';
          }).join('') +
          '<div class="edk-total"><div><span>Товары</span><b>' + fmt(sum) + '</b></div><div><span>Доставка</span><b>' + (del ? fmt(del) : 'бесплатно') + '</b></div><div class="edk-grand"><span>Итого</span><b>' + fmt(sum + del) + '</b></div></div>' +
          '<button class="edk-pay" type="button" onclick="Web.edokPay()">Оформить заказ</button>' +
          '<button class="edk-back" type="button" onclick="Web.sitePage(\'edok\',\'index\')">Добавить ещё</button>';
      },
      done: function () {
        return '<div class="edk-done"><span><i class="fa-solid fa-check"></i></span><h3>Заказ принят</h3><p>Номер ' + (edokOrder || 'ED-000000') + '</p><small>Курьер уже собирает заказ. Доставка 25–35 минут.</small><button type="button" onclick="Web.sitePage(\'edok\',\'index\')">На главную</button></div>';
      }
    }
  });

  W.edokPay = function () {
    if (!edokQty()) { LV.toast('Корзина пуста'); return; }
    edokOrder = 'ED-' + String(100000 + Math.floor(Math.random() * 899999));
    edokCart = {};
    edokRefresh();
    LV.toast('Заказ ' + edokOrder + ' принят');
    W.sitePage('edok', 'done');
  };

  /* ============================================================
     АВИАТОР — билеты
     ============================================================ */
  W.sites.push({
    id: 'aviator', name: 'Авиатор', host: 'aviator.net', cat: 'service', custom: true,
    icon: 'fa-plane', color: '#0e7490',
    slogan: 'Билеты без лишних кликов',
    nav: [],
    chrome: function (body) {
      return '<div class="avt"><header class="avt-top">' +
        '<button class="avt-logo" type="button" onclick="Web.sitePage(\'aviator\',\'index\')"><i class="fa-solid fa-plane-up"></i> авиатор</button>' +
        '<span class="avt-phone"><i class="fa-solid fa-headset"></i> 24/7</span>' +
        '</header><div class="avt-body">' + body + '</div></div>';
    },
    pages: {
      index: function () {
        return '<div class="avt-hero"><h1>Куда летим?</h1><p>Билеты по России и миру. Оплата картой BankFake или с баланса XPRODC ID.</p></div>' +
          '<div class="avt-search">' +
          '<div class="avt-route"><label>Откуда<input value="Москва" readonly></label><i class="fa-solid fa-arrow-right-arrow-left"></i><label>Куда<input value="Сочи" readonly></label></div>' +
          '<div class="avt-row"><label>Дата<input value="24 ноября" readonly></label><label>Пассажиры<input value="1" readonly></label><label>Класс<input value="Эконом" readonly></label></div>' +
          '<button type="button" onclick="Web.sitePage(\'aviator\',\'results\')">Найти билеты</button></div>' +
          '<h3 class="avt-h3">Популярные направления</h3>' +
          [['Сочи', '8 490', '#0ea5e9', 'fa-umbrella-beach'], ['Стамбул', '14 200', '#ef4444', 'fa-mosque'], ['Дубай', '21 900', '#f59e0b', 'fa-sun'], ['Тбилиси', '11 300', '#22c55e', 'fa-mountain-sun']].map(function (d) {
            return '<button class="avt-dest" type="button" onclick="Web.sitePage(\'aviator\',\'results\')"><span style="background:' + d[2] + '"><i class="fa-solid ' + d[3] + '"></i></span><div><b>' + d[0] + '</b><small>от ' + d[1] + ' ₽</small></div><i class="fa-solid fa-chevron-right"></i></button>';
          }).join('') +
          '<p class="avt-note">Демо-поиск: реальные рейсы и оплата не выполняются.</p>';
      },
      results: function () {
        return '<button class="avt-back" type="button" onclick="Web.back()"><i class="fa-solid fa-chevron-left"></i> Новый поиск</button>' +
          '<div class="avt-res-head"><b>Москва → Сочи</b><span>24 ноября · 1 пассажир · эконом</span></div>' +
          [
            ['SU 1042', '07:40', '10:05', 'SVO', 'AER', '3 ч 25 мин', '8 490', '#0e7490'],
            ['UT 259', '09:15', '11:50', 'VKO', 'AER', '3 ч 35 мин', '7 190', '#7c3aed'],
            ['S7 1215', '12:30', '15:00', 'DME', 'AER', '3 ч 30 мин', '9 990', '#16a34a'],
            ['SU 1120', '18:05', '20:35', 'SVO', 'AER', '3 ч 30 мин', '11 450', '#0e7490']
          ].map(function (f) {
            return '<div class="avt-flight"><div class="avt-air"><span style="background:' + f[7] + '">' + f[0].slice(0, 2) + '</span><b>' + f[0] + '</b><small>прямой</small></div>' +
              '<div class="avt-times"><div><b>' + f[1] + '</b><span>' + f[3] + '</span></div><div class="avt-dur"><span>' + f[5] + '</span><i></i></div><div><b>' + f[2] + '</b><span>' + f[4] + '</span></div></div>' +
              '<div class="avt-buy"><b>' + f[6] + ' ₽</b><button type="button" onclick="Web.sitePage(\'aviator\',\'booking\')">Выбрать</button></div></div>';
          }).join('');
      },
      booking: function () {
        return '<button class="avt-back" type="button" onclick="Web.back()"><i class="fa-solid fa-chevron-left"></i> К рейсам</button>' +
          '<div class="avt-ticket"><div><b>SU 1042</b><span>Москва → Сочи</span></div><div><span>24 ноя, 07:40</span><b>8 490 ₽</b></div></div>' +
          '<h3 class="avt-h3">Данные пассажира</h3>' +
          '<div class="avt-form"><label>Имя и фамилия<input placeholder="Иван Петров"></label><label>Дата рождения<input placeholder="01.01.1990"></label><label>Паспорт<input placeholder="0000 000000"></label>' +
          '<button type="button" onclick="Web.sitePage(\'aviator\',\'done\')">Оплатить 8 490 ₽</button></div>' +
          '<p class="avt-note">Оплата демонстрационная. Билет не выпускается.</p>';
      },
      done: function () {
        return '<div class="avt-done"><span><i class="fa-solid fa-plane-up"></i></span><h3>Билет оформлен</h3><p>SU 1042 · Москва → Сочи · 24 ноября, 07:40</p><small>Код брони: A7K2LM. Демо-покупка, деньги не списаны.</small><button type="button" onclick="Web.sitePage(\'aviator\',\'index\')">На главную</button></div>';
      }
    }
  });

  /* ============================================================
     ВИКИ X — энциклопедия
     ============================================================ */
  W.sites.push({
    id: 'wiki', name: 'Вики X', host: 'wiki.xprodc.net', cat: 'service', custom: true,
    icon: 'fa-book-open', color: '#334155',
    slogan: 'Свободная энциклопедия XPRODC',
    nav: [],
    chrome: function (body) {
      return '<div class="wik"><header class="wik-top">' +
        '<button class="wik-logo" type="button" onclick="Web.sitePage(\'wiki\',\'id\')"><b>W</b><span>Вики X</span></button>' +
        '<div class="wik-search"><i class="fa-solid fa-magnifying-glass"></i><input placeholder="Поиск по статьям" onkeydown="if(event.key===\'Enter\')LV.toast(\'Поиск по вики\')"></div>' +
        '</header><div class="wik-body">' + body + '</div></div>';
    },
    pages: {
      id: function () {
        return wikiArticle('XPRODC ID', 'Учётная запись экосистемы XPRODC',
          [['Тип', 'Единый аккаунт'], ['Запущен', '2024'], ['Сервисы', 'Лавка, BankFake, Почта, Браузер'], ['Формат', 'X-число'], ['Владелец', 'XPRODC']],
          '<p><b>XPRODC ID</b> — единая учётная запись для сервисов XPRODC. Один аккаунт открывает доступ к маркетплейсу «Лавка», банку BankFake, почте и браузеру Lackuun.</p>' +
          '<h3>История</h3><p>Идея единого входа появилась после запуска «Лавки»: пользователи заводили отдельные аккаунты в каждом сервисе. В 2025 году XPRODC ID стал обязательным для оформления заказов и переводов.</p>' +
          '<h3>Как это работает</h3><p>При входе сервер выдаёт пару токенов: короткий access и длинный refresh. Access используется для запросов, refresh — для продления сессии без повторного ввода пароля.</p>' +
          '<h3>Безопасность</h3><p>Пароли хранятся в виде хеша, вход фиксируется в журнале с IP и устройством. Подозрительные входы можно увидеть в разделе «Безопасность» приложения.</p>' +
          '<p class="wik-links">См. также: <a onclick="Web.sitePage(\'wiki\',\'lavka\')">Лавка</a> · <a onclick="Web.sitePage(\'wiki\',\'bank\')">BankFake</a></p>');
      },
      lavka: function () {
        return wikiArticle('Лавка', 'Сеть магазинов XPRODC',
          [['Тип', 'Сеть магазинов'], ['Запуск', '2023'], ['Товары', '2 100'], ['Категории', '21'], ['Доставка', '1 день']],
          '<p><b>Лавка</b> — сеть магазинов с доставкой и оплатой по XPRODC ID. Каталог включает технику, товары для дома, одежду и продукты.</p>' +
          '<h3>Заказ</h3><p>Пользователь собирает корзину, выбирает адрес и способ оплаты. При оплате с BankFake сумма списывается с баланса или карты, операция попадает в историю банка.</p>' +
          '<h3>Пункты выдачи</h3><p>Первый офлайн-пункт открылся на Тверской: примерочные, кофейня и зона возврата.</p>' +
          '<p class="wik-links">См. также: <a onclick="Web.sitePage(\'wiki\',\'id\')">XPRODC ID</a> · <a onclick="Web.sitePage(\'wiki\',\'bank\')">BankFake</a></p>');
      },
      bank: function () {
        return wikiArticle('BankFake', 'Банк в экосистеме XPRODC',
          [['Тип', 'Симулятор банка'], ['Запуск', '2022'], ['Счета', 'Баланс и карты'], ['Оплата', 'XPRODC ID']],
          '<p><b>BankFake</b> — учебный банк, встроенный в экосистему XPRODC. Позволяет завести счёт, выпустить карты, платить и переводить по XPRODC ID.</p>' +
          '<h3>Счета и карты</h3><p>Основной счёт хранит баланс, карты — отдельные балансы. Премиальные карты не ограничены лимитом.</p>' +
          '<h3>Оплата в Лавке</h3><p>При оформлении заказа можно выбрать счёт или карту BankFake. Списание уходит в облачное сохранение аккаунта, поэтому покупка видна и в приложении банка.</p>' +
          '<p class="wik-links">См. также: <a onclick="Web.sitePage(\'wiki\',\'lavka\')">Лавка</a> · <a onclick="Web.sitePage(\'wiki\',\'id\')">XPRODC ID</a></p>');
      }
    }
  });

  function wikiArticle(title, sub, info, body) {
    return '<div class="wik-article"><h1>' + title + '</h1><p class="wik-sub">' + sub + '</p>' +
      '<div class="wik-info"><b>' + title + '</b><table>' + info.map(function (r) { return '<tr><th>' + r[0] + '</th><td>' + r[1] + '</td></tr>'; }).join('') + '</table></div>' +
      '<div class="wik-toc"><b>Содержание</b><ol><li>История</li><li>Как это работает</li><li>Безопасность</li></ol></div>' +
      body + '<p class="wik-foot">Материал демонстрационный · Вики X</p></div>';
  }

  /* ============================================================
     ФОРУМ — старый добрый форум
     ============================================================ */
  W.sites.push({
    id: 'forum', name: 'Форум', host: 'forum.lackuun.com', cat: 'social', custom: true,
    icon: 'fa-comments', color: '#2b4a7a',
    slogan: 'Общение без алгоритмов',
    nav: [],
    chrome: function (body) {
      var name = LV.state.user.name || 'Гость';
      return '<div class="frm"><header class="frm-top"><b class="frm-logo">LACKUUN FORUM</b>' +
        '<div class="frm-user"><i class="fa-solid fa-user"></i>' + esc(name) + '</div></header>' +
        '<nav class="frm-nav"><a onclick="Web.sitePage(\'forum\',\'index\')">Форум</a><a onclick="LV.toast(\'Поиск по форуму\')">Поиск</a><a onclick="LV.toast(\'Пользователи\')">Пользователи</a><a onclick="LV.toast(\'Правила\')">Правила</a></nav>' +
        '<div class="frm-body">' + body + '</div></div>';
    },
    pages: {
      index: function () {
        var sections = [
          ['Общение', 'Флудилка, знакомства, оффтоп', '12 480', '184 021', 'Сегодня, 17:42', 'kostya'],
          ['Покупки в Лавке', 'Отзывы, скидки, доставка', '3 241', '48 902', 'Сегодня, 16:18', 'marina_k'],
          ['BankFake и деньги', 'Карты, переводы, кэшбэк', '1 876', '22 450', 'Сегодня, 15:03', 'denis'],
          ['Технологии', 'XPRODC ID, браузер, гаджеты', '2 115', '31 760', 'Вчера, 22:11', 'maks'],
          ['Работа и учёба', 'Вакансии, резюме, стажировки', '964', '9 884', 'Вчера, 19:40', 'olga'],
          ['Барахолка', 'Куплю, продам, отдам', '5 302', '77 218', 'Вчера, 18:05', 'artem']
        ];
        return '<div class="frm-stats">Темы: 25 978 · Сообщения: 374 235 · Пользователи: 8 412 · Онлайн: 214</div>' +
          '<table class="frm-table"><thead><tr><th>Раздел</th><th>Темы</th><th>Сообщения</th><th>Последнее</th></tr></thead><tbody>' +
          sections.map(function (s) {
            return '<tr><td><b>' + s[0] + '</b><span>' + s[1] + '</span></td><td>' + s[2] + '</td><td>' + s[3] + '</td><td><span>' + s[4] + '</span><b>' + s[5] + '</b></td></tr>';
          }).join('') + '</tbody></table>' +
          '<div class="frm-online"><b>Сейчас на форуме:</b> 214 гостей, 37 пользователей. Новый участник: <a onclick="LV.toast(\'Профиль\')">pulse_fan</a></div>' +
          '<button class="frm-new" type="button" onclick="Web.sitePage(\'forum\',\'new\')">Создать тему</button>';
      },
      thread: function () {
        return '<div class="frm-crumb"><a onclick="Web.sitePage(\'forum\',\'index\')">Форум</a> → Общение → <b>Кто уже платил картой BankFake в Лавке?</b></div>' +
          '<div class="frm-thread-head"><h2>Кто уже платил картой BankFake в Лавке?</h2><span>Страница 1 из 3 · 42 сообщения</span></div>' +
          frmPost('kostya', 'Костя', 'К', '#0ea5e9', '12.03.2024', '1 204', 'Сегодня, 17:40',
            'Оформил заказ на 5 190 ₽, выбрал карту BankFake — списалось моментально, в истории банка появилась операция «Лавка». Удобно, что не нужно вводить реквизиты.', 12) +
          frmPost('marina_k', 'Марина К.', 'МК', '#ec4899', '08.11.2023', '3 876', 'Сегодня, 17:42',
            '<div class="frm-quote">Оформил заказ на 5 190 ₽, выбрал карту BankFake — списалось моментально...</div>А у меня не хватило на карте, и приложение показало «недостаточно средств». Ничего не зависло, просто предложило другой счёт.', 5) +
          frmPost('denis', 'Денис', 'Д', '#16a34a', '01.06.2022', '842', 'Сегодня, 17:44',
            'Главное — войти в лавку тем же XPRODC ID, что и в банке. Тогда видны все карты, и баланс общий.', 8) +
          '<div class="frm-reply"><b>Быстрый ответ</b><textarea placeholder="Ваше сообщение..."></textarea><button type="button" onclick="LV.toast(\'Сообщение отправлено\')">Отправить</button></div>';
      },
      new: function () {
        return '<div class="frm-crumb"><a onclick="Web.sitePage(\'forum\',\'index\')">Форум</a> → Новая тема</div>' +
          '<div class="frm-form"><label>Раздел<select><option>Общение</option><option>Покупки в Лавке</option><option>BankFake и деньги</option><option>Технологии</option></select></label>' +
          '<label>Заголовок<input placeholder="О чём тема?"></label><label>Сообщение<textarea placeholder="Текст сообщения..."></textarea></label>' +
          '<button type="button" onclick="LV.toast(\'Тема создана\')">Создать тему</button></div>';
      }
    }
  });

  function frmPost(id, name, ini, color, joined, posts, time, text, likes) {
    return '<article class="frm-post"><div class="frm-post-side"><span class="frm-ava" style="background:' + color + '">' + ini + '</span>' +
      '<b>' + name + '</b><span>на форуме с ' + joined + '</span><span>сообщений: ' + posts + '</span></div>' +
      '<div class="frm-post-body"><div class="frm-post-meta"><span>' + time + '</span><a onclick="LV.toast(\'Цитата\')">Цитировать</a></div>' +
      '<div class="frm-text">' + text + '</div>' +
      '<button class="frm-like" type="button" data-like="' + id + '" onclick="Web.like(this)"><i class="fa-regular fa-thumbs-up"></i> <b>' + likes + '</b></button></div></article>';
  }

  /* ============================================================
     ГОСПОРТАЛ — услуги
     ============================================================ */
  W.sites.push({
    id: 'gos', name: 'ГосПортал', host: 'gos.net', cat: 'service', custom: true,
    icon: 'fa-landmark', color: '#1d4ed8',
    slogan: 'Услуги онлайн, без очередей',
    nav: [],
    chrome: function (body) {
      return '<div class="gsp"><header class="gsp-top"><b class="gsp-logo"><i class="fa-solid fa-landmark"></i> ГосПортал</b>' +
        '<span class="gsp-badge">демо</span></header>' +
        '<nav class="gsp-nav"><a onclick="Web.sitePage(\'gos\',\'index\')">Услуги</a><a onclick="Web.sitePage(\'gos\',\'status\')">Заявления</a><a onclick="LV.toast(\'Помощь\')">Помощь</a></nav>' +
        '<div class="gsp-body">' + body + '</div></div>';
    },
    pages: {
      index: function () {
        var services = [
          ['Паспорт', 'Выдача и замена', 'fa-id-card', '#1d4ed8'],
          ['Налоги', 'Проверка и оплата', 'fa-file-invoice', '#16a34a'],
          ['Штрафы', 'Проверка по номеру', 'fa-car', '#ef4444'],
          ['Запись к врачу', 'Поликлиника рядом', 'fa-stethoscope', '#0ea5e9'],
          ['Транспорт', 'Права и техосмотр', 'fa-bus', '#f59e0b'],
          ['Дом и ЖКХ', 'Счётчики и платежи', 'fa-house', '#7c3aed']
        ];
        return '<div class="gsp-hero"><h1>Государственные услуги онлайн</h1><p>Без очередей и бумажных заявлений. Вход по XPRODC ID.</p>' +
          '<div class="gsp-search"><i class="fa-solid fa-magnifying-glass"></i><input placeholder="Название услуги"><button type="button" onclick="LV.toast(\'Поиск по услугам\')">Найти</button></div></div>' +
          '<div class="gsp-grid">' + services.map(function (s) {
            return '<button class="gsp-srv" type="button" onclick="Web.sitePage(\'gos\',\'service\')"><span style="background:' + s[3] + '"><i class="fa-solid ' + s[2] + '"></i></span><b>' + s[0] + '</b><small>' + s[1] + '</small></button>';
          }).join('') + '</div>' +
          '<div class="gsp-news"><b>Новое</b><p>С 1 декабря заявления на замену паспорта принимаются до 20:00.</p><a onclick="LV.toast(\'Все новости\')">Все новости →</a></div>';
      },
      service: function () {
        return '<button class="gsp-back" type="button" onclick="Web.back()"><i class="fa-solid fa-chevron-left"></i> Все услуги</button>' +
          '<h2 class="gsp-h2">Замена паспорта</h2><p class="gsp-sub">Для граждан старше 14 лет · срок 5 рабочих дней</p>' +
          '<div class="gsp-info"><div><b>0 ₽</b><span>госпошлина</span></div><div><b>5 дней</b><span>срок</span></div><div><b>онлайн</b><span>подача</span></div></div>' +
          '<h3 class="gsp-h3">Как получить</h3><ol class="gsp-steps"><li><b>Заполните заявление</b><span>Данные подтянутся из XPRODC ID.</span></li><li><b>Прикрепите фото</b><span>Требования — на сайте услуги.</span></li><li><b>Получите результат</b><span>Уведомление придёт в почту.</span></li></ol>' +
          '<button class="gsp-apply" type="button" onclick="Web.sitePage(\'gos\',\'status\')">Подать заявление</button>' +
          '<p class="gsp-note">Демонстрационная услуга. Реальные заявления не отправляются.</p>';
      },
      status: function () {
        return '<h2 class="gsp-h2">Заявление № 77-004512</h2><p class="gsp-sub">Замена паспорта · подано 14 ноября</p>' +
          '<div class="gsp-status"><div class="gsp-step done"><span><i class="fa-solid fa-check"></i></span><b>Подано</b><small>14 ноября, 10:22</small></div>' +
          '<div class="gsp-step now"><span><i class="fa-solid fa-hourglass-half"></i></span><b>В работе</b><small>проверка документов</small></div>' +
          '<div class="gsp-step"><span><i class="fa-solid fa-flag-checkered"></i></span><b>Готово</b><small>ожидается 19 ноября</small></div></div>' +
          '<div class="gsp-doc"><i class="fa-solid fa-file-lines"></i><div><b>Заявление</b><span>PDF · 248 КБ</span></div><button type="button" onclick="LV.toast(\'Файл сохранён\')">Скачать</button></div>' +
          '<p class="gsp-note">Статус обновляется автоматически. Вопросы — через раздел «Помощь».</p>';
      }
    }
  });

  /* ============================================================
     LAVKA ONLINE — анонс онлайн-города
     ============================================================ */
  var LO_PROMISES = [
    ['fa-map', 'Общая карта', 'Один город на всех: районы, точки, транспорт и пробки.'],
    ['fa-users', 'Живые игроки', 'Встречи, сделки и работа в паре — не в чате, а на улице.'],
    ['fa-people-group', 'Совместные смены', 'Берёте смену вдвоём и делите выручку и рейтинг.'],
    ['fa-store', 'Твоя сеть на карте', 'Другие видят твои точки, уровень и вывеску.'],
    ['fa-arrows-rotate', 'Сезоны', 'Каждые три месяца карта меняется: новые районы и события.'],
    ['fa-right-left', 'Перенос прогресса', 'Сеть из офлайна переедет в онлайн без потерь.']
  ];

  function loMapSVG() {
    var roadsA = '<path d="M0 100h480M0 208h480M126 0v300M364 0v300" stroke="#1e293b" stroke-width="11" fill="none"/>';
    var roadsB = '<path d="M0 50h480M0 154h480M0 262h480M63 0v300M240 0v300M428 0v300" stroke="#243247" stroke-width="3" fill="none"/>';
    var river = '<path d="M0 242c72-34 111 9 174-21s110-54 171-32 92 6 135-17v128H0z" fill="#0ea5e9" opacity=".16"/>';
    var park = '<circle cx="160" cy="72" r="38" fill="#16a34a" opacity=".16"/><circle cx="334" cy="178" r="46" fill="#16a34a" opacity=".13"/>';
    var pts = [
      [160, 72, '#10b981', 'Центр'],
      [82, 158, '#ffffff', 'ПВЗ'],
      [248, 112, '#10b981', 'Кофейня'],
      [390, 72, '#ffffff', 'ТРЦ'],
      [315, 225, '#0ea5e9', 'Порт']
    ];
    var marks = pts.map(function (p) {
      return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="13" fill="' + p[2] + '" opacity=".16"/>' +
        '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="6" fill="' + p[2] + '"/>';
    }).join('');
    var labels = pts.map(function (p) {
      return '<text x="' + (p[0] + 10) + '" y="' + (p[1] + 5) + '" fill="#cbd5e1" font-size="13" font-family="Inter,Segoe UI,Arial">' + p[3] + '</text>';
    }).join('');
    return '<svg class="lo-map" viewBox="0 0 480 300" role="img" aria-label="Карта онлайн-города">' +
      '<rect width="480" height="300" fill="#0b1220"/>' + river + park + roadsA + roadsB + marks + labels + '</svg>';
  }

  function loPromiseCards() {
    return LO_PROMISES.map(function (p) {
      return '<div class="lo-card"><i class="fa-solid ' + p[0] + '"></i><b>' + p[1] + '</b><span>' + p[2] + '</span></div>';
    }).join('');
  }

  W.sites.push({
    id: 'lavkaonline', name: 'Lavka Online', host: 'online.lavka', cat: 'service', custom: true,
    icon: 'fa-globe', color: '#10b981',
    slogan: 'Город, где играют все · выход в декабре 2026',
    nav: [['index', 'Главная'], ['map', 'Карта'], ['road', 'Планы']],
    chrome: function (body, page) {
      page = page || 'index';
      var tabs = [['index', 'Главная'], ['map', 'Карта'], ['road', 'Планы']].map(function (t) {
        return '<button class="lo-tab' + (t[0] === page ? ' on' : '') + '" type="button" onclick="Web.sitePage(\'lavkaonline\',\'' + t[0] + '\')">' + t[1] + '</button>';
      }).join('');
      return '<div class="lo">' +
        '<header class="lo-top">' +
        '<button class="lo-logo" type="button" onclick="Web.sitePage(\'lavkaonline\',\'index\')">' +
        '<img src="img/lavka-online-192.png" alt=""><span>LAVKA<b>ONLINE</b></span></button>' +
        '<nav class="lo-nav">' + tabs + '</nav>' +
        '<span class="lo-badge">декабрь 2026</span>' +
        '</header>' +
        '<div class="lo-body">' + body + '</div>' +
        '<footer class="lo-foot"><span>© 2026 XPRODC · проект «Лавка Online»</span><span>выход — декабрь 2026</span></footer>' +
        '</div>';
    },
    pages: {
      index: function () {
        return '<section class="lo-hero">' +
          '<div class="lo-hero-txt">' +
          '<span class="lo-kicker">онлайн-город · анонс</span>' +
          '<h1>Город, где<br>играют все</h1>' +
          '<p>Онлайн-мир поверх твоей сети: общая карта, живые игроки и совместные смены. Это не «ещё один магазин» — это город, в котором ты уже построил бизнес.</p>' +
          '<div class="lo-cta">' +
          '<button class="lo-btn" type="button" onclick="LavkaOnlineSite.join()">Записаться в бету</button>' +
          '<button class="lo-btn ghost" type="button" onclick="Web.sitePage(\'lavkaonline\',\'map\')">Посмотреть карту</button>' +
          '</div>' +
          '<div class="lo-date"><b>декабрь 2026</b><span>дата выхода</span></div>' +
          '</div>' +
          '<div class="lo-hero-map">' + loMapSVG() + '</div>' +
          '</section>' +
          '<section class="lo-grid">' + loPromiseCards() + '</section>' +
          '<section class="lo-strip">' +
          '<div><b>Что уже есть</b><span>сеть, точки, производство и сюжет в офлайне</span></div>' +
          '<div><b>Что добавим</b><span>общий город, игроки, транспорт и сезоны</span></div>' +
          '</section>';
      },
      map: function () {
        var dist = [
          ['Центр', 'офисы, ТРЦ, высокий спрос'],
          ['Спальный', 'ПВЗ, кофейни, доставка'],
          ['Промзона', 'склады и производство'],
          ['Порт', 'грузы, опт, ночные рейсы'],
          ['Парк', 'сезонные точки и события'],
          ['Вокзал', 'трафик и перехват клиентов']
        ].map(function (d) {
          return '<div class="lo-dist">' + d[0] + '<small>' + d[1] + '</small></div>';
        }).join('');
        return '<section class="lo-mapwrap">' +
          '<div class="lo-maptop"><h2>Карта города</h2>' +
          '<p>Один город на всех. Районы, помещения под аренду, транспорт и пробки — всё в одном мире. Точки из офлайна переедут на карту автоматически.</p></div>' +
          '<div class="lo-mapbig">' + loMapSVG() + '</div>' +
          '<div class="lo-legend">' +
          '<span><i class="dot green"></i>твои точки</span>' +
          '<span><i class="dot white"></i>точки других игроков</span>' +
          '<span><i class="dot blue"></i>транспорт</span>' +
          '<span><i class="dot gray"></i>свободные помещения</span>' +
          '</div>' +
          '<div class="lo-districts">' + dist + '</div>' +
          '</section>';
      },
      road: function () {
        var steps = [
          ['2026', 'Фундамент', 'Серверы, аккаунты и синхронизация сети с облаком.', 'готово', 'done'],
          ['лето 2026', 'Закрытая бета', 'Только владельцы 20+ уровня: тесты карты и экономики.', 'план', ''],
          ['осень 2026', 'Открытая бета', 'Все желающие, первые сезоны и городские события.', 'план', ''],
          ['декабрь 2026', 'Релиз', 'Полный запуск города и перенос прогресса из офлайна.', 'выход', 'rel']
        ].map(function (s) {
          return '<div class="lo-step ' + s[4] + '"><time>' + s[0] + '</time><div><b>' + s[1] + '</b><small>' + s[2] + '</small></div><i>' + s[3] + '</i></div>';
        }).join('');
        return '<section class="lo-roadwrap">' +
          '<h2>Планы</h2>' +
          '<p class="lo-sub">Выход — декабрь 2026. Даты беты можем сдвинуть, релиз — нет.</p>' +
          '<div class="lo-road">' + steps + '</div>' +
          '<div class="lo-warn"><i class="fa-solid fa-circle-info"></i><span>Всё, что на карте и в списке, — обещание, а не скриншоты готовой игры. Показываем, к чему идём.</span></div>' +
          '</section>';
      }
    }
  });

  window.LavkaOnlineSite = {
    join: function () {
      var S = LV.state;
      if (S.onlineWait) { LV.toast('Вы уже в списке предзаписи'); return; }
      S.onlineWait = true;
      try { LV.save(); } catch (e) {}
      if (window.Sfx) Sfx.play('reward');
      LV.toast('Вы в списке предзаписи Lavka Online');
      if (window.Web && document.getElementById('web-scroll')) Web.refresh();
    }
  };

  /* ============================================================
     ГОРОДОК.NET — городской портал образца 2003 года
     ============================================================ */
  function gorodokMenu(page) {
    var items = [['index', 'Главная'], ['news', 'Новости'], ['afisha', 'Афиша'], ['guestbook', 'Гостевая'], ['links', 'Ссылки']];
    return items.map(function (it) {
      return '<button class="old-menu-btn' + (it[0] === page ? ' on' : '') + '" type="button" onclick="Web.sitePage(\'gorodok\',\'' + it[0] + '\')">' + it[1] + '</button>';
    }).join('');
  }

  W.sites.push({
    id: 'gorodok', name: 'Городок', host: 'gorodok.net', cat: 'news', custom: true,
    era: 'old', manualAds: true,
    icon: 'fa-newspaper', color: '#1e3a8a',
    slogan: 'Городской портал: новости, афиша, гостевая книга',
    nav: [['index', 'Главная'], ['news', 'Новости'], ['afisha', 'Афиша'], ['guestbook', 'Гостевая'], ['links', 'Ссылки']],
    chrome: function (body, page) {
      page = page || 'index';
      return '<div class="old-site old-gorodok">' +
        '<div class="old-top">' +
        '<div class="old-brand"><span class="old-logo">Городок<span>.net</span></span>' +
        '<span class="old-since">в сети с 2001 года</span></div>' +
        '<div class="old-top-right"><span>Погода: −7 °C, снег</span><span>Курс $: 29,45 ₽</span></div>' +
        '</div>' +
        '<div class="old-strip"><span>★ Добро пожаловать на Городок.net! ★ Лучший городской сайт по версии конкурса «Сеть-2003» ★</span></div>' +
        '<div class="old-banner-row">' + W.ad('old', 0) + '</div>' +
        '<div class="old-layout">' +
        '<div class="old-side">' +
        '<div class="old-box"><div class="old-box-h">Меню</div>' + gorodokMenu(page) + '</div>' +
        '<div class="old-box"><div class="old-box-h">Статистика</div>' +
        '<div class="old-small">Вы посетитель №</div><div class="old-counter">148 271</div>' +
        '<div class="old-small">Сейчас на сайте: 12 чел.</div></div>' +
        '<div class="old-box"><div class="old-box-h">Наш баннер</div>' +
        '<div class="old-btn88"><b>GORODOK</b><span>NET</span></div>' +
        '<div class="old-small">Поставь к себе на сайт!</div></div>' +
        '<div class="old-small old-center">Best viewed in<br><b>Internet Explorer 6.0</b><br>1024×768</div>' +
        '</div>' +
        '<div class="old-main">' + body + '</div>' +
        '</div>' +
        '<div class="old-foot">© 2001—2004 Городок.net · При использовании материалов ссылка обязательна<br>' +
        'e-mail: admin@gorodok.net · ICQ 148-271-336 · Сайт работает на Apache/1.3.29 (Unix)</div>' +
        '</div>';
    },
    pages: {
      index: function () {
        var news = [
          ['14.10.2004', 'Открыт торговый центр «Северный»', 'В субботу состоялось торжественное открытие. Мэр перерезал ленточку, а вечером на площади играл духовой оркестр.'],
          ['12.10.2004', 'На Ленина меняют трамвайные пути', 'Ремонт продлится до конца месяца. Трамваи №3 и №7 пущены в объезд через Вокзальную.'],
          ['09.10.2004', 'Городские школы переходят на новую программу', 'С начала четверти в пяти школах вводят уроки информатики на новом оборудовании.'],
          ['05.10.2004', 'Фотоконкурс «Осень в городе»', 'Присылайте снимки на admin@gorodok.net до 25 октября. Победитель получит принтер.']
        ];
        return '<div class="old-h1">Новости города</div>' +
          '<div class="old-date">Сегодня: 14 октября 2004, четверг · обновлено в 09:12</div>' +
          news.map(function (n) {
            return '<div class="old-news"><div class="old-news-date">' + n[0] + '</div>' +
              '<div><b>' + n[1] + '</b><p>' + n[2] + '</p></div></div>';
          }).join('') +
          '<div class="old-h2">Погода</div>' +
          '<table class="old-table"><tr><th>Сегодня</th><th>Завтра</th><th>Послезавтра</th></tr>' +
          '<tr><td>−7 °C, снег</td><td>−4 °C, облачно</td><td>−2 °C, ясно</td></tr></table>' +
          '<div class="old-h2">Опрос</div>' +
          '<div class="old-poll">Как вам новый торговый центр?<br>' +
          '<button class="old-link" type="button" onclick="LV.toast(\'Спасибо, ваш голос учтён\')">Отлично, буду ходить</button>' +
          '<button class="old-link" type="button" onclick="LV.toast(\'Спасибо, ваш голос учтён\')">Обычный, как все</button>' +
          '<button class="old-link" type="button" onclick="LV.toast(\'Спасибо, ваш голос учтён\')">Не пойду, дорого</button>' +
          '</div><div class="old-small">Всего проголосовало: 1 204</div>';
      },
      news: function () {
        return '<div class="old-h1">Открыт торговый центр «Северный»</div>' +
          '<div class="old-date">14.10.2004 · автор: Редакция · просмотров: 3 482</div>' +
          '<div class="old-photo"><span>фото: архив редакции</span></div>' +
          '<p class="old-p">В субботу, 9 октября, на улице Северной открылся торговый центр «Северный». На церемонии присутствовали представители администрации, строители и первые покупатели.</p>' +
          '<p class="old-p">Мэр города отметил, что новый центр даст городу 400 рабочих мест, а жители северных микрорайонов смогут покупать продукты рядом с домом.</p>' +
          '<p class="old-p">В день открытия работали фонтан, детская площадка и выставка ретро-автомобилей. Вечером на площади выступил духовой оркестр.</p>' +
          '<div class="old-small">Обсудить новость можно в <button class="old-link inline" type="button" onclick="Web.sitePage(\'gorodok\',\'guestbook\')">гостевой книге</button>.</div>';
      },
      afisha: function () {
        var ev = [
          ['15.10—20.10', 'Выставка «Ретро-техника»', 'Дом культуры, 10:00—18:00', 'вход 20 руб.'],
          ['16.10', 'Концерт городского оркестра', 'Филармония, 19:00', 'билеты от 80 руб.'],
          ['17.10', 'Ярмарка мёда', 'Площадь Ленина, 9:00—16:00', 'бесплатно'],
          ['23.10', 'Кинопоказ «Ночной дозор»', 'Кинотеатр «Луч», 21:30', 'билет 120 руб.']
        ];
        return '<div class="old-h1">Афиша на неделю</div>' +
          '<table class="old-table"><tr><th>Дата</th><th>Событие</th><th>Место и время</th><th>Цена</th></tr>' +
          ev.map(function (e) {
            return '<tr><td>' + e[0] + '</td><td><b>' + e[1] + '</b></td><td>' + e[2] + '</td><td>' + e[3] + '</td></tr>';
          }).join('') + '</table>' +
          '<div class="old-small">Афиша обновляется каждую пятницу. Присылайте свои события на admin@gorodok.net.</div>';
      },
      guestbook: function () {
        var msg = [
          ['Людмила', '12.10.2004', 'Спасибо за новости! Наконец-то узнала, когда откроют «Северный».'],
          ['Сергей', '11.10.2004', 'А почему про трамваи ничего не писали? Я час добирался до работы.'],
          ['admin', '11.10.2004', 'Сергей, писали 12 октября. Смотрите архив новостей.'],
          ['Ольга', '10.10.2004', 'Кто знает, где можно скачать фотографии с открытия?'],
          ['Дмитрий', '09.10.2004', 'Сайт хороший, но грузится медленно. Поставьте счётчик получше.']
        ];
        return '<div class="old-h1">Гостевая книга</div>' +
          '<div class="old-small">Всего записей: 2 481 · страница 1 из 249</div>' +
          msg.map(function (m) {
            return '<div class="old-msg"><div class="old-msg-head"><b>' + m[0] + '</b><span>' + m[1] + '</span></div><p>' + m[2] + '</p></div>';
          }).join('') +
          '<div class="old-h2">Оставить запись</div>' +
          '<div class="old-form"><input placeholder="Ваше имя"><textarea rows="3" placeholder="Сообщение"></textarea>' +
          '<button class="old-submit" type="button" onclick="LV.toast(\'Запись отправлена на проверку администратору\')">Отправить</button></div>' +
          '<div class="old-small">Сообщения публикуются после проверки. Реклама в гостевой запрещена.</div>';
      },
      links: function () {
        var links = [
          ['Пульс', 'Дневники и сообщества', 'pulse'],
          ['Лавка', 'Магазин с доставкой', 'lavka'],
          ['Афиша', 'Куда пойти в выходные', 'afisha'],
          ['Городская библиотека', 'Каталог книг и читальный зал', ''],
          ['Почта города', 'Отделения и график работы', '']
        ];
        return '<div class="old-h1">Ссылки</div>' +
          '<div class="old-small">Мы обмениваемся ссылками с интересными сайтами. Пишите на admin@gorodok.net.</div>' +
          links.map(function (l) {
            return '<div class="old-link-row"><b>' + (l[2]
              ? '<button class="old-link inline" type="button" onclick="Web.open(\'' + l[2] + '\')">' + l[0] + '</button>'
              : '<button class="old-link inline" type="button" onclick="LV.toast(\'Сайт временно недоступен\')">' + l[0] + '</button>') +
              '</b><span>' + l[1] + '</span></div>';
          }).join('') +
          '<div class="old-h2">Наши кнопки 88×31</div>' +
          '<div class="old-btn-row"><span class="old-btn88 alt"><b>GORODOK</b><span>NET</span></span>' +
          '<span class="old-btn88 alt2"><b>СЕТЬ</b><span>2003</span></span>' +
          '<span class="old-btn88 alt3"><b>RU</b><span>TOP</span></span></div>';
      }
    }
  });

  /* ============================================================
     БАРАХОЛКА.NET — доска объявлений образца 2007 года
     ============================================================ */
  function baraholkaNav(page) {
    var items = [['index', 'Все объявления'], ['list', 'Свежие'], ['add', 'Подать объявление'], ['rules', 'Правила']];
    return items.map(function (it) {
      return '<button class="bh-tab' + (it[0] === page ? ' on' : '') + '" type="button" onclick="Web.sitePage(\'baraholka\',\'' + it[0] + '\')">' + it[1] + '</button>';
    }).join('');
  }

  W.sites.push({
    id: 'baraholka', name: 'Барахолка', host: 'baraholka.net', cat: 'shop', custom: true,
    era: 'old', manualAds: true, hidden: true,
    icon: 'fa-tags', color: '#b45309',
    slogan: 'Бесплатные объявления: продам, куплю, обменяю',
    nav: [['index', 'Все объявления'], ['list', 'Свежие'], ['add', 'Подать'], ['rules', 'Правила']],
    chrome: function (body, page) {
      page = page || 'index';
      return '<div class="bh">' +
        '<div class="bh-top">' +
        '<b class="bh-logo">БАРАХОЛКА<span>.net</span></b>' +
        '<span class="bh-since">бесплатные объявления с 2003 года</span>' +
        '<span class="bh-count">объявлений: 4 812</span>' +
        '</div>' +
        '<div class="bh-nav">' + baraholkaNav(page) +
        '<button class="bh-post" type="button" onclick="Web.sitePage(\'baraholka\',\'add\')">+ Подать объявление</button></div>' +
        '<div class="old-banner-row">' + W.ad('old', 1) + '</div>' +
        '<div class="bh-body">' + body + '</div>' +
        '<div class="bh-foot">© 2003—2007 Барахолка.net · Администрация не несёт ответственности за содержание объявлений<br>' +
        'По вопросам рекламы: reklama@baraholka.net · тел. 8 (912) 000-00-00</div>' +
        '</div>';
    },
    pages: {
      index: function () {
        var cats = [['Авто', '1 204'], ['Электроника', '986'], ['Мебель', '612'], ['Одежда', '455'], ['Животные', '128'], ['Дом и дача', '701']];
        var ads = [
          ['Nokia 3310, б/у, отличное состояние', '1 200 ₽', 'Центр', 'сегодня'],
          ['Холодильник «Бирюса», рабочий', '3 500 ₽', 'Спальный', 'сегодня'],
          ['Системный блок Pentium 4, 512 МБ', '6 800 ₽', 'Вокзал', 'вчера'],
          ['Диван-кровать, кожзам', '2 000 ₽', 'Парк', 'вчера'],
          ['Котята в добрые руки', 'бесплатно', 'Промзона', '12.11'],
          ['DVD-плеер Samsung', '1 450 ₽', 'Центр', '11.11']
        ];
        return '<div class="bh-h1">Все объявления</div>' +
          '<div class="bh-cats">' + cats.map(function (c) {
            return '<button class="bh-cat" type="button" onclick="LV.toast(\'Раздел «' + c[0] + '»: ' + c[1] + ' объявлений\')">' + c[0] + '<span>' + c[1] + '</span></button>';
          }).join('') + '</div>' +
          '<div class="bh-h2">Последние объявления</div>' +
          '<table class="bh-table"><tr><th>Объявление</th><th>Цена</th><th>Район</th><th>Дата</th></tr>' +
          ads.map(function (a) {
            return '<tr><td><button class="bh-ad-link" type="button" onclick="Web.sitePage(\'baraholka\',\'list\')">' + a[0] + '</button></td>' +
              '<td><b>' + a[1] + '</b></td><td>' + a[2] + '</td><td>' + a[3] + '</td></tr>';
          }).join('') + '</table>' +
          '<div class="bh-note">Хотите продать быстрее? <button class="old-link inline" type="button" onclick="Web.sitePage(\'baraholka\',\'add\')">Подайте объявление</button> — это бесплатно.</div>';
      },
      list: function () {
        var ads = [
          ['Nokia 3310', '1 200 ₽', 'Центр', 'сегодня, 14:20', 'Продам легендарный телефон. Работает без нареканий, заряд держит неделю. Чехол и зарядка в комплекте.', '8-912-XXX-XX-45', '128'],
          ['Холодильник «Бирюса»', '3 500 ₽', 'Спальный', 'сегодня, 11:05', 'Двухкамерный, 240 л. Морозилка работает. Самовывоз, помогу погрузить.', '8-912-XXX-XX-12', '96'],
          ['Pentium 4, 512 МБ', '6 800 ₽', 'Вокзал', 'вчера, 19:40', 'Собран в 2004 году. Windows XP, Office. Монитор 17" отдам за 1 500.', '8-912-XXX-XX-77', '204'],
          ['Диван-кровать', '2 000 ₽', 'Парк', 'вчера, 16:12', 'Раскладывается, кожзам без трещин. Причина продажи — переезд.', '8-912-XXX-XX-03', '61']
        ];
        return '<div class="bh-h1">Свежие объявления</div>' +
          '<div class="bh-small">Показано 4 из 4 812 · сортировка по дате</div>' +
          ads.map(function (a) {
            return '<div class="bh-item"><div class="bh-item-head"><button class="bh-ad-link" type="button" onclick="LV.toast(\'Телефон скрыт до подтверждения\')">' + a[0] + '</button>' +
              '<b>' + a[1] + '</b></div>' +
              '<div class="bh-item-meta">' + a[2] + ' · ' + a[3] + ' · просмотров: ' + a[6] + '</div>' +
              '<p>' + a[4] + '</p><div class="bh-item-foot">тел. ' + a[5] +
              ' <button class="old-submit small" type="button" onclick="LV.toast(\'Номер скопирован\')">Показать номер</button></div></div>';
          }).join('') +
          '<div class="bh-note">Объявление № 4 812 · пожаловаться на нарушение: help@baraholka.net</div>';
      },
      add: function () {
        return '<div class="bh-h1">Подать объявление</div>' +
          '<div class="bh-small">Заполните форму. Объявление появится после проверки модератором — обычно в течение часа.</div>' +
          '<div class="bh-form">' +
          '<label>Раздел<select><option>Электроника</option><option>Авто</option><option>Мебель</option><option>Одежда</option><option>Животные</option></select></label>' +
          '<label>Заголовок<input placeholder="Например: Nokia 3310, б/у"></label>' +
          '<label>Цена, ₽<input placeholder="1 200"></label>' +
          '<label>Город / район<input placeholder="Центр"></label>' +
          '<label>Телефон<input placeholder="8-912-000-00-00"></label>' +
          '<label>Описание<textarea rows="4" placeholder="Состояние, комплект, причина продажи"></textarea></label>' +
          '<button class="old-submit" type="button" onclick="LV.toast(\'Объявление отправлено на проверку\')">Отправить</button>' +
          '</div>' +
          '<div class="bh-note">Публикация бесплатная. Платное выделение — 50 ₽ за 7 дней.</div>';
      },
      rules: function () {
        return '<div class="bh-h1">Правила доски</div>' +
          '<ul class="bh-rules">' +
          '<li>Одно объявление — один товар. Не дублируйте объявления.</li>' +
          '<li>Запрещены оружие, лекарства, алкоголь и всё, что запрещено законом.</li>' +
          '<li>Указывайте реальную цену и состояние товара.</li>' +
          '<li>Не размещайте чужие фотографии и контакты без согласия.</li>' +
          '<li>Модератор может отклонить объявление без объяснения причин.</li>' +
          '</ul>' +
          '<div class="bh-note">Нарушения — на help@baraholka.net. Среднее время проверки: 40 минут.</div>';
      }
    }
  });

  /* ============================================================
     МИР ПК — компьютерный журнал образца 2004 года
     ============================================================ */
  function mirpkNav(page) {
    var items = [['index', 'Журнал'], ['articles', 'Статьи'], ['soft', 'Софт'], ['hosting', 'Хостинг'], ['forum', 'Форум']];
    return items.map(function (it) {
      return '<button class="mpk-tab' + (it[0] === page ? ' on' : '') + '" type="button" onclick="Web.sitePage(\'mirpk\',\'' + it[0] + '\')">' + it[1] + '</button>';
    }).join('');
  }

  W.sites.push({
    id: 'mirpk', name: 'Мир ПК', host: 'mirpk.net', cat: 'service', custom: true,
    era: 'old', manualAds: true, hidden: true,
    icon: 'fa-computer', color: '#334155',
    slogan: 'Компьютерный журнал: железо, софт, интернет',
    nav: [['index', 'Журнал'], ['articles', 'Статьи'], ['soft', 'Софт'], ['hosting', 'Хостинг'], ['forum', 'Форум']],
    chrome: function (body, page) {
      page = page || 'index';
      return '<div class="mpk">' +
        '<div class="mpk-top">' +
        '<b class="mpk-logo">МИР <span>ПК</span></b>' +
        '<span class="mpk-issue">№11 (128) · ноябрь 2004</span>' +
        '<span class="mpk-price">цена: 65 руб.</span>' +
        '</div>' +
        '<div class="mpk-nav">' + mirpkNav(page) + '</div>' +
        '<div class="old-banner-row">' + W.ad('old', 0) + '</div>' +
        '<div class="mpk-body">' + body + '</div>' +
        '<div class="mpk-foot">© 1998—2004 «Мир ПК» · тираж 42 000 экз. · редакция: Москва, ул. Правды, 24<br>' +
        'При перепечатке ссылка на mirpk.net обязательна</div>' +
        '</div>';
    },
    pages: {
      index: function () {
        var t = [
          ['12', 'Как выбрать DVD-ROM', 'Скорости, форматы и подводные камни привода за 1 500 рублей.'],
          ['18', 'Windows XP: 10 советов', 'Настройка системы, чтобы компьютер не тормозил.'],
          ['26', 'Собираем компьютер за 15 000 руб.', 'Три конфигурации: для дома, учёбы и игр.'],
          ['34', 'Интернет по карточкам', 'Как сэкономить на dial-up и не попасть на «дозвон».'],
          ['40', 'Цифровые фотоаппараты', 'Тест пяти моделей до 300 долларов.']
        ];
        return '<div class="mpk-cover"><div class="mpk-cover-top">МИР ПК</div>' +
          '<div class="mpk-cover-sub">ноябрь 2004</div>' +
          '<div class="mpk-cover-tag">DVD-ROM<br>Windows XP<br>Интернет</div>' +
          '<div class="mpk-cover-bottom">128 страниц · 65 руб.</div></div>' +
          '<div class="mpk-h1">В номере</div>' +
          '<table class="mpk-content">' + t.map(function (x) {
            return '<tr><td class="mpk-page">' + x[0] + '</td><td><b>' + x[1] + '</b><span>' + x[2] + '</span></td></tr>';
          }).join('') + '</table>' +
          '<div class="mpk-note">Свежий номер можно купить в киосках «Роспечать» или заказать с доставкой по почте.</div>';
      },
      articles: function () {
        return '<div class="mpk-h1">Как выбрать DVD-ROM</div>' +
          '<div class="mpk-meta">Автор: А. Смирнов · рубрика «Железо» · 12 ноября 2004</div>' +
          '<p class="old-p">Скорость чтения DVD — не главный параметр. Куда важнее поддержка форматов DVD±R/RW и качество привода. В бюджетном сегменте (до 1 500 руб.) стоит смотреть на NEC, LG и Samsung.</p>' +
          '<p class="old-p">Проверьте, чтобы привод читал CD-R с записью на высокой скорости: дешёвые модели часто «спотыкаются» на дисках, записанных в домашних условиях.</p>' +
          '<p class="old-p">Не забудьте про гарантию: в большинстве магазинов она составляет 12 месяцев, но при покупке «с рук» её может не быть вовсе.</p>' +
          '<div class="mpk-h2">Обсуждение</div>' +
          '<div class="mpk-comment"><b>Vladimir</b><span>12.11.2004</span><p>У меня NEC 3500 — уже год, полёт нормальный.</p></div>' +
          '<div class="mpk-comment"><b>Kostya</b><span>13.11.2004</span><p>А про прошивку забыли? Без неё некоторые диски не читает.</p></div>' +
          '<div class="mpk-note">Всего комментариев: 14 · <button class="old-link inline" type="button" onclick="LV.toast(\'Добавление комментариев доступно после регистрации\')">Добавить комментарий</button></div>';
      },
      soft: function () {
        var files = [
          ['WinRAR 3.42', 'архиватор', '1,1 МБ', '1 240'],
          ['ICQ 2003b', 'мессенджер', '4,8 МБ', '8 512'],
          ['AIDA32', 'диагностика', '3,2 МБ', '2 104'],
          ['Total Commander 6.03', 'файловый менеджер', '1,7 МБ', '3 908'],
          ['Opera 7.54', 'браузер', '3,9 МБ', '1 672']
        ];
        return '<div class="mpk-h1">Софт</div>' +
          '<div class="mpk-note">Скачать можно бесплатно. Скорость ограничена — пожалуйста, не качайте в несколько потоков.</div>' +
          '<table class="old-table mpk-soft"><tr><th>Программа</th><th>Назначение</th><th>Размер</th><th>Скачали</th><th></th></tr>' +
          files.map(function (f) {
            return '<tr><td><b>' + f[0] + '</b></td><td>' + f[1] + '</td><td>' + f[2] + '</td><td>' + f[3] + '</td>' +
              '<td><button class="old-submit small" type="button" onclick="LV.toast(\'Загрузка начнётся через 10 секунд\')">Скачать</button></td></tr>';
          }).join('') + '</table>' +
          '<div class="mpk-note">Зеркало: ftp.mirpk.net/pub/ · Логин: guest · Пароль: guest</div>';
      },
      hosting: function () {
        var plans = [
          ['Старт', '5 $', '100 МБ', 'PHP, MySQL, 1 почтовый ящик'],
          ['Бизнес', '10 $', '300 МБ', 'PHP, MySQL, 5 ящиков, статистика'],
          ['Профи', '20 $', '1 ГБ', 'CGI, MySQL, SSL, резервные копии']
        ];
        return '<div class="mpk-h1">Хостинг RUnet</div>' +
          '<div class="mpk-note">Надёжный хостинг для вашего сайта. Регистрация домена — бесплатно при оплате за год.</div>' +
          '<table class="old-table"><tr><th>Тариф</th><th>Цена</th><th>Место</th><th>Возможности</th></tr>' +
          plans.map(function (p) {
            return '<tr><td><b>' + p[0] + '</b></td><td>' + p[1] + '/мес.</td><td>' + p[2] + '</td><td>' + p[3] + '</td></tr>';
          }).join('') + '</table>' +
          '<div class="mpk-plans">' + plans.map(function (p) {
            return '<button class="mpk-plan" type="button" onclick="LV.toast(\'Заявка на тариф «' + p[0] + '» отправлена\')">' +
              '<b>' + p[0] + '</b><span>' + p[1] + ' в месяц</span><em>' + p[2] + '</em></button>';
          }).join('') + '</div>' +
          '<div class="mpk-note">Оплата: электронные деньги, банковский перевод или карта в офисе.</div>';
      },
      forum: function () {
        var th = [
          ['Какой привод DVD купить?', '14 ответов', '1 204 просмотра', 'сегодня'],
          ['Windows XP SP2: проблему с сетью решил', '8 ответов', '640 просмотров', 'вчера'],
          ['Собираю компьютер за 15 тысяч — помогите', '32 ответа', '2 108 просмотров', 'вчера'],
          ['Где скачать драйверы для Sound Blaster?', '3 ответа', '318 просмотров', '13.11'],
          ['Dial-up: как ускорить загрузку страниц', '21 ответ', '1 512 просмотров', '12.11']
        ];
        return '<div class="mpk-h1">Форум</div>' +
          '<div class="mpk-note">Всего тем: 12 481 · сообщений: 148 902 · зарегистрировано: 8 214</div>' +
          th.map(function (x) {
            return '<div class="mpk-thread"><b>' + x[0] + '</b><span>' + x[1] + ' · ' + x[2] + '</span><time>' + x[3] + '</time></div>';
          }).join('') +
          '<div class="mpk-note">Чтобы ответить, <button class="old-link inline" type="button" onclick="LV.toast(\'Регистрация временно закрыта\')">зарегистрируйтесь</button> или войдите.</div>';
      }
    }
  });

  /* ============================================================
     КВАНТ — ИИ-ассистент, 2026
     ============================================================ */
  function kvantNav(page) {
    var items = [['index', 'Главная'], ['chat', 'Чат'], ['pricing', 'Тарифы'], ['about', 'О нас']];
    return items.map(function (it) {
      return '<button class="kv-tab' + (it[0] === page ? ' on' : '') + '" type="button" onclick="Web.sitePage(\'kvant\',\'' + it[0] + '\')">' + it[1] + '</button>';
    }).join('');
  }

  W.sites.push({
    id: 'kvant', name: 'Квант', host: 'kvant.ai', cat: 'service', custom: true,
    era: 'modern', manualAds: true,
    icon: 'fa-wand-magic-sparkles', color: '#6366f1',
    slogan: 'ИИ-ассистент для текста, таблиц и кода',
    nav: [['index', 'Главная'], ['chat', 'Чат'], ['pricing', 'Тарифы'], ['about', 'О нас']],
    chrome: function (body, page) {
      page = page || 'index';
      return '<div class="kv">' +
        '<header class="kv-top">' +
        '<button class="kv-logo" type="button" onclick="Web.sitePage(\'kvant\',\'index\')">квант<span>·ai</span></button>' +
        '<nav class="kv-nav">' + kvantNav(page) + '</nav>' +
        '<span class="kv-status"><i></i> онлайн</span>' +
        '</header>' +
        '<div class="kv-body">' + body + '</div>' +
        '<footer class="kv-foot">© 2026 Квант · ООО «Квант» · help@kvant.ai<br>Сервис работает в тестовом режиме, ответы могут содержать ошибки.</footer>' +
        '</div>';
    },
    pages: {
      index: function () {
        var feats = [
          ['fa-pen-nib', 'Текст', 'Письма, посты, описания товаров и коммерческие предложения.'],
          ['fa-table', 'Таблицы', 'Сметы, отчёты и формулы для Excel — по описанию задачи.'],
          ['fa-code', 'Код', 'Пишет и объясняет код на Python, JS и SQL, ищет ошибки.'],
          ['fa-image', 'Картинки', 'Обложки, баннеры и иллюстрации для соцсетей.']
        ];
        return '<section class="kv-hero">' +
          '<span class="kv-kicker">квант 3.1 · новая модель</span>' +
          '<h1>Спроси. Сделай.<br>Проверь.</h1>' +
          '<p>Ассистент, который помогает с работой: от письма клиенту до таблицы на 200 строк. Без регистрации — 20 запросов в подарок.</p>' +
          '<div class="kv-prompt"><i class="fa-solid fa-wand-magic-sparkles"></i>' +
          '<input placeholder="Например: составь смету на открытие точки" onkeydown="if(event.key===\'Enter\')Web.sitePage(\'kvant\',\'chat\')">' +
          '<button type="button" onclick="Web.sitePage(\'kvant\',\'chat\')">Спросить</button></div>' +
          '<div class="kv-chips">' +
          ['Напиши письмо клиенту', 'Сделай таблицу расходов', 'Проверь договор', 'Придумай название'].map(function (c) {
            return '<button class="kv-chip" type="button" onclick="Web.sitePage(\'kvant\',\'chat\')">' + c + '</button>';
          }).join('') + '</div>' +
          '<div class="kv-trust"><span><b>1,2 млн</b> запросов в день</span><span><b>99,9%</b> аптайм</span><span><b>4,8</b> оценка</span></div>' +
          '</section>' +
          '<section class="kv-feats">' + feats.map(function (f) {
            return '<div class="kv-feat"><i class="fa-solid ' + f[0] + '"></i><b>' + f[1] + '</b><span>' + f[2] + '</span></div>';
          }).join('') + '</section>' +
          '<section class="kv-sect"><div class="kv-sect-head"><h2>Модели</h2><span>выберите под задачу</span></div>' +
          '<div class="kv-models">' +
          '<div class="kv-model on"><b>Квант 3.1</b><span>Универсальная</span><em>от 490 ₽/мес</em></div>' +
          '<div class="kv-model"><b>Квант mini</b><span>Быстрая и дешёвая</span><em>бесплатно</em></div>' +
          '<div class="kv-model"><b>Квант Код</b><span>Для разработчиков</span><em>от 990 ₽/мес</em></div>' +
          '</div></section>' +
          '<div class="web-ad-slot">' + W.ad('video', 3) + '</div>' +
          '<section class="kv-sect kv-cookie"><i class="fa-solid fa-cookie-bite"></i><div><b>Мы используем cookie</b>' +
          '<span>Чтобы запоминать диалоги и улучшать ответы. Продолжая, вы соглашаетесь с политикой.</span></div>' +
          '<button type="button" onclick="LV.toast(\'Настройки cookie сохранены\')">Принять</button></section>';
      },
      chat: function () {
        return '<div class="kv-chat">' +
          '<div class="kv-chat-top"><b>Новый диалог</b><span>Квант 3.1 · контекст 32k</span></div>' +
          '<div class="kv-msg user"><div>Составь смету на открытие пункта выдачи в спальном районе.</div></div>' +
          '<div class="kv-msg bot"><div class="kv-ava">к</div><div>Хорошо. Вот черновик сметы на 30 дней:<br><br>' +
          '1. Аренда 25 м² — 45 000 ₽<br>2. Ремонт и мебель — 120 000 ₽<br>3. Оборудование — 80 000 ₽<br>4. Первая партия товара — 60 000 ₽<br>5. Реклама на старте — 15 000 ₽<br><br>' +
          '<b>Итого: 320 000 ₽</b>. Могу разложить по месяцам или добавить зарплату сотрудника.</div></div>' +
          '<div class="kv-msg user"><div>Добавь зарплату и посчитай точку безубыточности.</div></div>' +
          '<div class="kv-msg bot"><div class="kv-ava">к</div><div>Сотрудник 2/2 — 38 000 ₽/мес. При средней выручке 240 000 ₽ и марже 22% точка выходит в ноль на третий месяц.' +
          '<span class="kv-code">payback = 320000 / (240000 * 0.22) ≈ 6.1 мес.</span></div></div>' +
          '<div class="kv-input"><input placeholder="Спросите что-нибудь ещё" onkeydown="if(event.key===\'Enter\')LV.toast(\'Это демо-диалог\')">' +
          '<button type="button" onclick="LV.toast(\'Это демо-диалог\')"><i class="fa-solid fa-paper-plane"></i></button></div>' +
          '<div class="kv-note">Квант может ошибаться. Проверяйте важные цифры и документы.</div>' +
          '</div>';
      },
      pricing: function () {
        var plans = [
          ['Старт', '0 ₽', '20 запросов в месяц', ['Квант mini', 'История 7 дней', 'Без карты']],
          ['Про', '490 ₽', 'в месяц', ['Квант 3.1', 'Безлимит текста', 'Файлы до 20 МБ', 'История 90 дней']],
          ['Бизнес', '1 990 ₽', 'в месяц', ['Всё из «Про»', '5 сотрудников', 'API и интеграции', 'Приоритетная поддержка']]
        ];
        return '<div class="kv-sect"><h1>Тарифы</h1><p class="kv-sub">Оплата картой или с баланса LAVKA PAY. Отмена в один клик.</p>' +
          '<div class="kv-plans">' + plans.map(function (p, i) {
            return '<div class="kv-plan' + (i === 1 ? ' hot' : '') + '">' +
              (i === 1 ? '<span class="kv-hot">выбирают чаще</span>' : '') +
              '<b>' + p[0] + '</b><div class="kv-price">' + p[1] + '<span>' + p[2] + '</span></div>' +
              '<ul>' + p[3].map(function (f) { return '<li><i class="fa-solid fa-check"></i>' + f + '</li>'; }).join('') + '</ul>' +
              '<button type="button" onclick="LV.toast(\'Тариф «' + p[0] + '» подключён (демо)\')">' + (i === 0 ? 'Начать бесплатно' : 'Подключить') + '</button></div>';
          }).join('') + '</div>' +
          '<div class="web-ad-slot">' + W.ad('tile', 0) + '</div>' +
          '<div class="kv-faq"><b>Частые вопросы</b>' +
          '<div><span>Можно оплатить с карты?</span><em>Да, картой или с баланса LAVKA PAY.</em></div>' +
          '<div><span>Что с моими данными?</span><em>Диалоги хранятся 90 дней, их можно удалить в настройках.</em></div>' +
          '<div><span>Есть API?</span><em>Да, на тарифе «Бизнес» — 100 запросов в минуту.</em></div></div></div>';
      },
      about: function () {
        return '<div class="kv-sect"><h1>О Кванте</h1>' +
          '<p class="kv-sub">Квант — российский ИИ-ассистент. Команда 34 человека, офисы в Москве и Екатеринбурге. Модель обучена на открытых данных и текстах партнёров.</p>' +
          '<div class="kv-stats"><div><b>2023</b><span>год основания</span></div><div><b>34</b><span>человека в команде</span></div>' +
          '<div><b>1,2 млн</b><span>запросов в день</span></div><div><b>99,9%</b><span>аптайм</span></div></div>' +
          '<h2>Контакты</h2><p class="kv-sub">Пресса: press@kvant.ai · Поддержка: help@kvant.ai · Партнёрам: partners@kvant.ai<br>' +
          'Москва, Пресненская набережная, 12 · Екатеринбург, ул. Малышева, 51</p>' +
          '<div class="kv-note">ООО «Квант», ИНН 7700000000. Сервис не является медицинским или юридическим консультантом.</div></div>';
      }
    }
  });

  /* ============================================================
     ГОРОД 24 — городское медиа, 2026
     ============================================================ */
  function gorod24Nav(page) {
    var items = [['index', 'Лента'], ['article', 'Главное'], ['live', 'Онлайн'], ['about', 'Редакция']];
    return items.map(function (it) {
      return '<button class="g24-tab' + (it[0] === page ? ' on' : '') + '" type="button" onclick="Web.sitePage(\'gorod24\',\'' + it[0] + '\')">' + it[1] + '</button>';
    }).join('');
  }

  W.sites.push({
    id: 'gorod24', name: 'Город 24', host: 'gorod24.live', cat: 'news', custom: true,
    era: 'modern', manualAds: true,
    icon: 'fa-tower-broadcast', color: '#0ea5e9',
    slogan: 'Городские новости без воды · 24/7',
    nav: [['index', 'Лента'], ['article', 'Главное'], ['live', 'Онлайн'], ['about', 'Редакция']],
    chrome: function (body, page) {
      page = page || 'index';
      return '<div class="g24">' +
        '<header class="g24-top">' +
        '<button class="g24-logo" type="button" onclick="Web.sitePage(\'gorod24\',\'index\')">ГОРОД<span>24</span></button>' +
        '<span class="g24-live"><i></i> прямой эфир</span>' +
        '<nav class="g24-nav">' + gorod24Nav(page) + '</nav>' +
        '<button class="g24-sub" type="button" onclick="LV.toast(\'Вы подписаны на уведомления Города 24\')">Подписаться</button>' +
        '</header>' +
        '<div class="g24-body">' + body + '</div>' +
        '<footer class="g24-foot">© 2026 Город 24 · сетевое издание · 16+<br>Главный редактор: А. Воронцова · redakciya@gorod24.live</footer>' +
        '</div>';
    },
    pages: {
      index: function () {
        var feed = [
          ['Транспорт', 'Автобусы №14 и №21 пустят по новому маршруту с 1 декабря', 'Маршрут продлят до нового микрорайона — время в пути вырастет на 7 минут.', '18 мин назад', '3 мин'],
          ['Город', 'На набережной закончили ремонт: открыли велодорожку и освещение', 'Работы шли с августа, подрядчик обещает гарантию на пять лет.', '1 час назад', '4 мин'],
          ['Экономика', 'Средняя ставка по ипотеке в регионе снизилась до 17,4%', 'Банки пересматривают условия после решения регулятора.', '2 часа назад', '2 мин'],
          ['Культура', 'В «Луче» покажут ретроспективу советского кино', 'В программе — восемь фильмов и лекции кинокритиков.', '3 часа назад', '5 мин']
        ];
        return '<section class="g24-lead">' +
          '<div class="g24-lead-art"><span>фото · Дмитрий Орлов</span></div>' +
          '<div class="g24-lead-body"><span class="g24-cat">Главное</span>' +
          '<h1>Город получил 120 новых автобусов: что изменится на маршрутах</h1>' +
          '<p>Первые 40 машин выйдут на линии уже в понедельник. Новые автобусы — низкопольные, с кондиционерами и зарядками для телефонов.</p>' +
          '<div class="g24-meta"><span>Ирина Ковалёва</span><time>14:20</time><span>4 мин чтения</span></div></div>' +
          '</section>' +
          '<div class="web-ad-slot">' + W.ad('ticker', 1) + '</div>' +
          '<div class="g24-sect-head"><h2>Лента</h2><span>обновляется каждые 10 минут</span></div>' +
          '<div class="g24-feed">' + feed.map(function (f) {
            return '<button class="g24-item" type="button" onclick="Web.sitePage(\'gorod24\',\'article\')">' +
              '<span class="g24-cat">' + f[0] + '</span><b>' + f[1] + '</b><p>' + f[2] + '</p>' +
              '<span class="g24-item-meta">' + f[3] + ' · ' + f[4] + '</span></button>';
          }).join('') + '</div>' +
          '<div class="g24-sect-head"><h2>Сейчас читают</h2></div>' +
          '<ol class="g24-top5">' +
          '<li><button type="button" onclick="Web.sitePage(\'gorod24\',\'article\')">Что изменится в оплате ЖКХ с декабря</button></li>' +
          '<li><button type="button" onclick="Web.sitePage(\'gorod24\',\'live\')">Онлайн: как проходит открытие нового моста</button></li>' +
          '<li><button type="button" onclick="Web.sitePage(\'gorod24\',\'article\')">Пять новых кофеен в центре — обзор</button></li>' +
          '<li><button type="button" onclick="Web.sitePage(\'gorod24\',\'article\')">Куда поехать на выходных: 6 идей</button></li>' +
          '</ol>';
      },
      article: function () {
        return '<article class="g24-article">' +
          '<span class="g24-cat">Главное</span>' +
          '<h1>Город получил 120 новых автобусов: что изменится на маршрутах</h1>' +
          '<div class="g24-meta"><span>Ирина Ковалёва</span><time>21 ноября, 14:20</time><span>4 мин чтения</span></div>' +
          '<div class="g24-art-art"><span>фото · Дмитрий Орлов</span></div>' +
          '<p class="g24-lead-p">Первые 40 машин выйдут на линии уже в понедельник. Новые автобусы — низкопольные, с кондиционерами и зарядками для телефонов.</p>' +
          '<p>Всего город получил 120 машин по программе обновления транспорта. Из них 60 — большого класса, которые пойдут на маршруты №14, №21 и №37, ещё 60 — средней вместимости для спальных районов.</p>' +
          '<blockquote>«Это первое такое обновление за восемь лет. Старые автобусы мы передадим на баланс техникумов», — рассказал заместитель мэра по транспорту.</blockquote>' +
          '<p>Оплата останется прежней: 35 ₽ за поездку картой и 40 ₽ наличными. В салонах появятся валидаторы с поддержкой оплаты телефоном.</p>' +
          '<h2>Что ещё изменится</h2>' +
          '<ul><li>интервал на маршруте №14 сократится с 18 до 12 минут;</li>' +
          '<li>на маршруте №21 появится остановка у нового микрорайона;</li>' +
          '<li>до конца года запустят онлайн-карту движения.</li></ul>' +
          '<div class="g24-tags"><span>#транспорт</span><span>#город</span><span>#автобусы</span></div>' +
          '<div class="web-ad-slot">' + W.ad('hero', 4) + '</div>' +
          '<div class="g24-sect-head"><h2>Читайте также</h2></div>' +
          '<div class="g24-more"><button type="button" onclick="Web.sitePage(\'gorod24\',\'article\')">Стоимость проезда в 2027 году</button>' +
          '<button type="button" onclick="Web.sitePage(\'gorod24\',\'live\')">Онлайн: открытие моста</button></div>' +
          '</article>';
      },
      live: function () {
        var up = [
          ['14:42', 'Мост официально открыт. По нему проехал первый троллейбус.', 'прямой эфир'],
          ['14:31', 'Мэр поблагодарил строителей и вручил награды.', ''],
          ['14:12', 'На месте работают 12 журналистов и три съёмочные группы.', ''],
          ['13:55', 'Очередь на вход: около 300 человек.', ''],
          ['13:20', 'Движение по мосту обещают открыть сразу после церемонии.', '']
        ];
        return '<div class="g24-livefeed"><div class="g24-live-head"><span class="g24-live-dot"><i></i> Онлайн</span>' +
          '<h1>Открытие нового моста через реку</h1><p>Следим за церемонией и первыми рейсами.</p></div>' +
          up.map(function (u) {
            return '<div class="g24-update' + (u[2] ? ' hot' : '') + '"><time>' + u[0] + '</time><div><b>' + u[1] + '</b>' +
              (u[2] ? '<span>' + u[2] + '</span>' : '') + '</div></div>';
          }).join('') +
          '<div class="g24-note">Трансляция закончится в 17:00. Обновления — каждые 5–10 минут.</div></div>';
      },
      about: function () {
        return '<div class="g24-about"><h1>Редакция</h1>' +
          '<p>«Город 24» — независимое городское медиа. Пишем о транспорте, стройке, культуре и людях. Не публикуем непроверенные новости.</p>' +
          '<div class="g24-team"><div><b>Анна Воронцова</b><span>главный редактор</span></div>' +
          '<div><b>Ирина Ковалёва</b><span>город и транспорт</span></div>' +
          '<div><b>Павел Гринь</b><span>экономика и ЖКХ</span></div>' +
          '<div><b>Мария Ли</b><span>культура</span></div></div>' +
          '<h2>Как с нами связаться</h2>' +
          '<p>Новости: news@gorod24.live · Реклама: ads@gorod24.live · Телефон: 8 (343) 000-24-24<br>Екатеринбург, ул. Ленина, 24, офис 305.</p>' +
          '<div class="g24-note">Учредитель: ООО «Город 24». Свидетельство СМИ ЭЛ № ФС 00-00000 от 12.01.2026.</div></div>';
      }
    }
  });

  /* ============================================================
     ПОТОК — короткие видео, 2026
     ============================================================ */
  function potokNav(page) {
    var items = [['index', 'Для вас'], ['trends', 'Тренды'], ['profile', 'Мой канал']];
    return items.map(function (it) {
      return '<button class="pt-tab' + (it[0] === page ? ' on' : '') + '" type="button" onclick="Web.sitePage(\'potok\',\'' + it[0] + '\')">' + it[1] + '</button>';
    }).join('');
  }

  W.sites.push({
    id: 'potok', name: 'Поток', host: 'potok.video', cat: 'social', custom: true,
    era: 'modern', manualAds: true,
    icon: 'fa-play', color: '#111827',
    slogan: 'Короткие видео города · 2026',
    nav: [['index', 'Для вас'], ['trends', 'Тренды'], ['profile', 'Мой канал']],
    chrome: function (body, page) {
      page = page || 'index';
      return '<div class="pt">' +
        '<header class="pt-top">' +
        '<button class="pt-logo" type="button" onclick="Web.sitePage(\'potok\',\'index\')">поток</button>' +
        '<nav class="pt-nav">' + potokNav(page) + '</nav>' +
        '<button class="pt-search" type="button" onclick="LV.toast(\'Поиск по видео скоро\')" aria-label="Поиск"><i class="fa-solid fa-magnifying-glass"></i></button>' +
        '</header>' +
        '<div class="pt-body">' + body + '</div>' +
        '<footer class="pt-foot">© 2026 Поток · рекомендации работают на демо-данных</footer>' +
        '</div>';
    },
    pages: {
      index: function () {
        var vids = [
          ['Как за 10 минут собрать витрину в Лавке', '@lavka', '24,8 тыс.', '2:14', 'linear-gradient(150deg,#10b981,#0f172a)', 'fa-bag-shopping'],
          ['Смена в ПВЗ: что реально происходит', '@job.daily', '58,1 тыс.', '3:02', 'linear-gradient(150deg,#0ea5e9,#312e81)', 'fa-box'],
          ['Три ошибки в самокате по городу', '@ride', '12,4 тыс.', '1:38', 'linear-gradient(150deg,#f59e0b,#7c2d12)', 'fa-person-scooter'],
          ['Кофе на 300 ₽ vs кофе на 1 200 ₽', '@taste', '31,6 тыс.', '4:12', 'linear-gradient(150deg,#b45309,#111827)', 'fa-mug-hot'],
          ['Стрит-арт во дворах: прогулка', '@gorodok', '7,9 тыс.', '2:41', 'linear-gradient(150deg,#ec4899,#4c1d95)', 'fa-spray-can']
        ];
        return '<div class="pt-stories">' +
          '<button class="pt-story add" type="button" onclick="LV.toast(\'Съёмка доступна в приложении Поток\')"><span>+</span>Снять</button>' +
          ['@lavka', '@job.daily', '@ride', '@taste', '@gorodok'].map(function (a) {
            return '<button class="pt-story" type="button" onclick="LV.toast(\'История ' + a + ' (демо)\')"><span>' + a.charAt(1).toUpperCase() + '</span>' + a + '</button>';
          }).join('') + '</div>' +
          '<div class="g24-sect-head"><h2>Для вас</h2><span>подобрано по интересам</span></div>' +
          '<div class="pt-grid">' + vids.slice(0, 3).map(function (v) {
            return '<button class="pt-card" type="button" style="background:' + v[4] + '" onclick="LV.toast(\'Видео «' + v[0] + '» (демо)\')">' +
              '<span class="pt-play"><i class="fa-solid fa-play"></i></span>' +
              '<span class="pt-dur">' + v[3] + '</span>' +
              '<span class="pt-card-info"><b>' + v[0] + '</b><span>' + v[1] + ' · ' + v[2] + ' просмотров</span></span></button>';
          }).join('') + '</div>' +
          '<div class="web-ad-slot">' + W.ad('tile', 2) + '</div>' +
          '<div class="g24-sect-head"><h2>Сейчас в трендах</h2></div>' +
          '<div class="pt-grid">' + vids.slice(3).map(function (v) {
            return '<button class="pt-card" type="button" style="background:' + v[4] + '" onclick="LV.toast(\'Видео «' + v[0] + '» (демо)\')">' +
              '<span class="pt-play"><i class="fa-solid fa-play"></i></span>' +
              '<span class="pt-dur">' + v[3] + '</span>' +
              '<span class="pt-card-info"><b>' + v[0] + '</b><span>' + v[1] + ' · ' + v[2] + ' просмотров</span></span></button>';
          }).join('') + '</div>';
      },
      trends: function () {
        var tags = [['#лавка', '128 тыс. видео'], ['#смена', '74 тыс.'], ['#город', '62 тыс.'], ['#кофе', '41 тыс.'], ['#пвз', '28 тыс.'], ['#самокат', '19 тыс.']];
        return '<div class="g24-sect-head"><h2>Тренды недели</h2><span>обновлено сегодня</span></div>' +
          '<div class="pt-tags">' + tags.map(function (t) {
            return '<button class="pt-tag" type="button" onclick="LV.toast(\'Лента ' + t[0] + ' (демо)\')">' + t[0] + '<span>' + t[1] + '</span></button>';
          }).join('') + '</div>' +
          '<div class="pt-chart"><b>Топ видео</b>' +
          [['Смена в ПВЗ: что реально происходит', '58,1 тыс.'], ['Как собрать витрину за 10 минут', '24,8 тыс.'],
            ['Кофе на 300 ₽ vs кофе на 1 200 ₽', '31,6 тыс.'], ['Три ошибки в самокате', '12,4 тыс.']].map(function (v, i) {
              return '<div class="pt-chart-row"><em>' + (i + 1) + '</em><span>' + v[0] + '</span><b>' + v[1] + '</b></div>';
            }).join('') + '</div>' +
          '<div class="web-ad-slot">' + W.ad('split', 7) + '</div>';
      },
      profile: function () {
        return '<div class="pt-profile"><div class="pt-ava">Л</div><div class="pt-profile-info">' +
          '<b>' + (LV.state.user.name || 'Мой канал') + '</b><span>@my.channel · 12 подписчиков</span>' +
          '<p>Показываю, как открыть точку и не сойти с ума. Новое видео — по вторникам.</p>' +
          '<div class="pt-profile-stats"><div><b>6</b><span>видео</span></div><div><b>1 248</b><span>просмотров</span></div><div><b>12</b><span>подписчиков</span></div></div>' +
          '</div><button class="pt-edit" type="button" onclick="LV.toast(\'Редактирование профиля (демо)\')">Редактировать</button></div>' +
          '<div class="g24-sect-head"><h2>Мои видео</h2></div>' +
          '<div class="pt-grid">' +
          ['Первая смена: как это было', 'Считаем смету точки', 'Что взять в ПВЗ'].map(function (t, i) {
            return '<button class="pt-card" type="button" style="background:linear-gradient(150deg,' + ['#10b981,#0f172a', '#6366f1,#111827', '#f59e0b,#7c2d12'][i] + ')" onclick="LV.toast(\'Видео «' + t + '» (демо)\')">' +
              '<span class="pt-play"><i class="fa-solid fa-play"></i></span><span class="pt-dur">' + ['2:14', '3:02', '1:48'][i] + '</span>' +
              '<span class="pt-card-info"><b>' + t + '</b><span>' + ['1,2 тыс.', '840', '610'][i] + ' просмотров</span></span></button>';
          }).join('') + '</div>' +
          '<div class="pt-empty"><i class="fa-solid fa-video"></i><b>Загрузите первое видео</b><span>Вертикальное, до 3 минут. Съёмка доступна в демо-режиме.</span>' +
          '<button type="button" onclick="LV.toast(\'Загрузка видео (демо)\')">Загрузить</button></div>';
      }
    }
  });
})();