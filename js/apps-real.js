/* Лавка — рабочие версии приложений (замена заглушек) */
(function () {
  'use strict';
  var LV = window.LV;
  if (!LV) return;
  var S = LV.state;
  var esc = LV.esc;

  function el(id) { return document.getElementById(id); }
  function save() { try { LV.save(); } catch (e) {} }
  function scroll(html) { return '<div class="app-scroll pb">' + html + '</div>'; }
  function today() {
    var d = new Date();
    return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0');
  }

  window.AppsReal = {};

  /* ============================================================
     КОНТАКТЫ
     ============================================================ */
  var CONTACTS_APP = [
    { id: 'maks', name: 'Макс', num: '+7 999 120-45-67', ini: 'М', color: '#0ea5e9', tag: 'друг' },
    { id: 'mom', name: 'Мама', num: '+7 916 555-01-24', ini: 'М', color: '#ec4899', tag: 'семья' },
    { id: 'dad', name: 'Папа', num: '+7 916 555-77-02', ini: 'П', color: '#f59e0b', tag: 'семья' },
    { id: 'liza', name: 'Лиза', num: '+7 999 640-12-88', ini: 'Л', color: '#db2777', tag: 'юрист' },
    { id: 'vera', name: 'Виктория', num: '+7 916 202-44-10', ini: 'В', color: '#0ea5e9', tag: 'врач' }
  ];

  function roster() {
    var list = CONTACTS_APP.slice();
    var staff = (S.biz && S.biz.staff) || [];
    staff.forEach(function (p, i) {
      list.push({ id: 'staff' + i, name: p.name || ('Сотрудник ' + (i + 1)), num: 'смена · ' + (p.role || 'сотрудник'),
        ini: LV.initials(p.name || 'С'), color: '#10b981', tag: 'команда', staff: true });
    });
    return list;
  }

  AppsReal.contacts = {
    q: '',
    filter: function (v) { this.q = String(v || '').toLowerCase(); renderContacts(); },
    call: function (id, staff) {
      if (staff) { LV.toast('Сотрудник на смене — связь через Job'); return; }
      if (window.Biz && Biz.callContact) Biz.callContact(id);
      else LV.toast('Звонок недоступен');
    }
  };

  function renderContacts() {
    var host = el('ct-list');
    if (!host) return;
    var q = AppsReal.contacts.q;
    var list = roster().filter(function (c) {
      return !q || c.name.toLowerCase().indexOf(q) >= 0 || String(c.num).toLowerCase().indexOf(q) >= 0;
    });
    if (!list.length) {
      host.innerHTML = '<div class="ct-empty">Ничего не найдено</div>';
      return;
    }
    host.innerHTML = list.map(function (c) {
      return '<div class="ct-row">' +
        '<span class="ct-ava" style="background:' + c.color + '">' + esc(c.ini) + '</span>' +
        '<div class="ct-main"><b>' + esc(c.name) + '</b><small>' + esc(c.num) + ' · ' + esc(c.tag) + '</small></div>' +
        '<button class="ct-call" type="button" onclick="AppsReal.contacts.call(\'' + c.id + '\',' + (c.staff ? 'true' : 'false') + ')">' +
        '<i class="fa-solid fa-phone"></i></button></div>';
    }).join('');
  }

  LV.registerApp({
    id: 'contacts', name: 'Контакты', icon: 'fa-address-book', bg: 'linear-gradient(140deg,#14b8a6,#0f766e)', page: 0,
    mount: function (body) {
      body.innerHTML = LV.appbar({ title: 'Контакты', sub: roster().length + ' контактов · XPRODC ID' }) + scroll(
        '<div class="ct-search"><i class="fa-solid fa-magnifying-glass"></i>' +
        '<input id="ct-q" placeholder="Имя или номер" oninput="AppsReal.contacts.filter(this.value)"></div>' +
        '<div id="ct-list"></div>'
      );
      AppsReal.contacts.q = '';
      renderContacts();
    }
  });

  /* ============================================================
     НАПОМИНАНИЯ
     ============================================================ */
  function remEnsure() { if (!Array.isArray(S.reminders)) S.reminders = []; return S.reminders; }

  function renderReminders() {
    var host = el('rm-list');
    if (!host) return;
    var list = remEnsure();
    if (!list.length) {
      host.innerHTML = '<div class="rm-empty"><i class="fa-regular fa-bell"></i><b>Пока пусто</b>' +
        '<small>Добавь напоминание — оно сохранится в профиле</small></div>';
      return;
    }
    host.innerHTML = list.map(function (r) {
      return '<div class="rm-row' + (r.done ? ' done' : '') + '">' +
        '<button class="rm-check" type="button" onclick="AppsReal.rem.toggle(' + r.id + ')">' +
        '<i class="fa-solid ' + (r.done ? 'fa-check' : 'fa-circle') + '"></i></button>' +
        '<div class="rm-main"><b>' + esc(r.text) + '</b><small>' + esc(r.date || '') + '</small></div>' +
        '<button class="rm-del" type="button" onclick="AppsReal.rem.del(' + r.id + ')"><i class="fa-solid fa-xmark"></i></button></div>';
    }).join('');
  }

  AppsReal.rem = {
    add: function () {
      var input = el('rm-text');
      var text = input ? input.value.trim() : '';
      if (!text) { LV.toast('Напиши, о чём напомнить'); return; }
      remEnsure().unshift({ id: Date.now(), text: text, date: today(), done: false });
      if (input) input.value = '';
      save();
      renderReminders();
    },
    toggle: function (id) {
      remEnsure().forEach(function (r) { if (r.id === id) r.done = !r.done; });
      save();
      renderReminders();
    },
    del: function (id) {
      S.reminders = remEnsure().filter(function (r) { return r.id !== id; });
      save();
      renderReminders();
    }
  };

  LV.registerApp({
    id: 'reminders', name: 'Напоминания', icon: 'fa-list-check', bg: 'linear-gradient(140deg,#f59e0b,#b45309)',
    page: 0, installable: true,
    mount: function (body) {
      body.innerHTML = LV.appbar({ title: 'Напоминания', sub: 'хранятся в профиле' }) + scroll(
        '<div class="rm-form"><input id="rm-text" placeholder="Например: оплатить налог" maxlength="80" ' +
        'onkeydown="if(event.key===\'Enter\')AppsReal.rem.add()">' +
        '<button type="button" onclick="AppsReal.rem.add()"><i class="fa-solid fa-plus"></i></button></div>' +
        '<div id="rm-list"></div>'
      );
      renderReminders();
    }
  });

  /* ============================================================
     ПЕРЕВОДЧИК
     ============================================================ */
  var DICT = {
    'привет': 'hello', 'здравствуйте': 'hello', 'спасибо': 'thank you', 'пока': 'bye',
    'да': 'yes', 'нет': 'no', 'пожалуйста': 'please', 'извините': 'sorry',
    'магазин': 'store', 'точка': 'point', 'товар': 'product', 'заказ': 'order',
    'доставка': 'delivery', 'цена': 'price', 'скидка': 'discount', 'оплата': 'payment',
    'карта': 'card', 'деньги': 'money', 'бизнес': 'business', 'работа': 'work',
    'смена': 'shift', 'склад': 'warehouse', 'налог': 'tax', 'лицензия': 'license',
    'открыть': 'open', 'закрыть': 'close', 'купить': 'buy', 'продать': 'sell',
    'город': 'city', 'улица': 'street', 'дом': 'house', 'машина': 'car',
    'сегодня': 'today', 'завтра': 'tomorrow', 'вчера': 'yesterday', 'сейчас': 'now',
    'хорошо': 'good', 'плохо': 'bad', 'большой': 'big', 'маленький': 'small',
    'быстро': 'fast', 'медленно': 'slow', 'новый': 'new', 'старый': 'old'
  };
  var DICT_REV = (function () {
    var r = {};
    Object.keys(DICT).forEach(function (k) { if (!r[DICT[k]]) r[DICT[k]] = k; });
    return r;
  })();

  function trText(text, dir) {
    var map = dir === 'en' ? DICT_REV : DICT;
    return String(text || '').split(/(\s+)/).map(function (part) {
      var m = part.match(/^([^A-Za-zА-Яа-яЁё-]*)([A-Za-zА-Яа-яЁё-]+)([^A-Za-zА-Яа-яЁё-]*)$/);
      if (!m) return part;
      var key = m[2].toLowerCase();
      var hit = map[key];
      if (!hit) return part;
      if (m[2][0] === m[2][0].toUpperCase()) hit = hit.charAt(0).toUpperCase() + hit.slice(1);
      return m[1] + hit + m[3];
    }).join('');
  }

  AppsReal.tr = {
    dir: 'ru',
    setDir: function (d) { this.dir = d; save(); renderTranslate(); },
    run: function () {
      var src = el('tr-in');
      var out = el('tr-out');
      if (!src || !out) return;
      var text = src.value.trim();
      if (!text) { out.innerHTML = '<span class="tr-hint">Введите текст</span>'; return; }
      out.textContent = trText(text, this.dir);
    },
    copy: function () {
      var out = el('tr-out');
      if (out && out.textContent) LV.copyText(out.textContent, 'Перевод скопирован');
    }
  };

  function renderTranslate() {
    var host = el('tr-body');
    if (!host) return;
    host.innerHTML =
      '<div class="tr-switch">' +
      '<button type="button" class="' + (AppsReal.tr.dir === 'ru' ? 'on' : '') + '" onclick="AppsReal.tr.setDir(\'ru\')">Русский → English</button>' +
      '<button type="button" class="' + (AppsReal.tr.dir === 'en' ? 'on' : '') + '" onclick="AppsReal.tr.setDir(\'en\')">English → Русский</button>' +
      '</div>' +
      '<textarea id="tr-in" class="tr-in" rows="4" placeholder="Введите текст…" oninput="AppsReal.tr.run()"></textarea>' +
      '<div class="tr-out" id="tr-out"><span class="tr-hint">Перевод появится здесь</span></div>' +
      '<div class="tr-actions"><button class="btn btn-primary" type="button" onclick="AppsReal.tr.run()">Перевести</button>' +
      '<button class="btn btn-block" type="button" onclick="AppsReal.tr.copy()">Скопировать</button></div>' +
      '<p class="tr-note">Офлайн-словарь: 44 слова. Работает без интернета.</p>';
  }

  LV.registerApp({
    id: 'translate', name: 'Переводчик', icon: 'fa-language', bg: 'linear-gradient(140deg,#06b6d4,#0e7490)',
    page: 1, installable: true,
    mount: function (body) {
      body.innerHTML = LV.appbar({ title: 'Переводчик', sub: 'офлайн-словарь' }) + scroll('<div id="tr-body"></div>');
      renderTranslate();
    }
  });
})();
