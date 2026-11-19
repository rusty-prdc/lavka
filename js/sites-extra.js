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
        '<button class="edk-cart" type="button" onclick="Web.sitePage(\'edok\',\'cart\')"><i class="fa-solid fa-basket-shopping"></i><span data-edk-qty>0</span></button>' +
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
          '<div class="edk-bar"><div><span>Корзина</span><b data-edk-sum>0 ₽</b></div><button type="button" onclick="Web.sitePage(\'edok\',\'cart\')">Перейти <span data-edk-qty>0</span></button></div>';
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
        return wikiArticle('Лавка', 'Маркетплейс XPRODC',
          [['Тип', 'Маркетплейс'], ['Запуск', '2023'], ['Товары', '2 100'], ['Категории', '21'], ['Доставка', '1 день']],
          '<p><b>Лавка</b> — маркетплейс с доставкой и оплатой по XPRODC ID. Каталог включает технику, товары для дома, одежду и продукты.</p>' +
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

})();
