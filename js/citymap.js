/* Городская карта LAVKA — общая для приложения и сайта «Карты» */
(function () {
  'use strict';

  var SPOTS = {
    center1: { name: 'Тверская, 12', area: 'Центр', x: 120, y: 100, mult: 1.2 },
    center2: { name: 'Садовая, 8', area: 'Центр', x: 235, y: 130, mult: 1.25 },
    station: { name: 'Привокзальная, 3', area: 'Вокзал', x: 40, y: 175, mult: 1.1 },
    sleep1: { name: 'Ленина, 45', area: 'Спальный', x: 320, y: 55, mult: 1.0 },
    sleep2: { name: 'Мира, 21', area: 'Спальный', x: 300, y: 250, mult: 0.95 },
    elite: { name: 'Набережная, 5', area: 'Элита', x: 55, y: 55, mult: 1.6 },
    park: { name: 'Парковая, 2', area: 'Парк', x: 40, y: 230, mult: 0.9 },
    industrial: { name: 'Заводская, 1', area: 'Промзона', x: 265, y: 275, mult: 0.8, factory: true },
    gov: { name: 'Правительство', area: 'Центр', x: 330, y: 120, mult: 1, gov: true },
    bc: { name: 'БЦ «Сити»', area: 'Центр', x: 165, y: 150, mult: 1, office: true }
  };

  var ICONS = {
    shop: '<path d="M5 9h14l-1 11H6L5 9Z"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/>',
    box: '<path d="M4 8l8-4 8 4v8l-8 4-8-4V8Z"/><path d="M4 8l8 4 8-4M12 12v8"/>',
    house: '<path d="M4 11 12 4l8 7v9H4v-9Z"/><path d="M9 20v-6h6v6"/>',
    factory: '<path d="M4 20V10l5 3V9l5 3V9l5 3v8H4Z"/>',
    flag: '<path d="M6 20V4"/><path d="M6 4h10l-2 4 2 4H6"/>',
    car: '<path d="M4 15h16l-2-6H6l-2 6Z"/><path d="M6 15v3m12-3v3"/>',
    shield: '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z"/>',
    cross: '<path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6V4Z" fill="#fff" stroke="none"/>',
    columns: '<path d="M4 9h16M6 9v9m4-9v9m4-9v9m4-9v9M4 20h16"/>',
    rub: '<text x="12" y="17" text-anchor="middle" font-size="14" font-weight="700" fill="#fff" stroke="none">₽</text>',
    nav: '<path d="M12 3l7 18-7-4-7 4 7-18Z" fill="#fff" stroke="none"/>',
    tree: '<circle cx="12" cy="9" r="5"/><path d="M12 14v6"/>',
    cup: '<path d="M5 8h11v6a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V8Z"/><path d="M16 9h2a3 3 0 0 1 0 6h-2"/>',
    scissors: '<circle cx="7" cy="17" r="2.5"/><circle cx="7" cy="7" r="2.5"/><path d="M9 8.5 19 17M9 15.5 19 7"/>',
    pc: '<rect x="4" y="4" width="16" height="11" rx="2"/><path d="M9 20h6M12 15v5"/>',
    dumbbell: '<path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/>',
    shirt: '<path d="M8 4 5 7l2 3 1-1v11h8V9l1 1 2-3-3-3-3 2-3-2Z"/>',
    phone: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
    film: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 9h16M8 5v14M16 5v14"/>'
  };

  function icon(kind) {
    return '<g fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[kind] || ICONS.shop) + '</g>';
  }

  function pin(m) {
    var click = m.id ? ' onclick="Biz.mapPick(\'' + m.id + '\')" style="cursor:pointer"' : '';
    return '<g class="cm-pin" transform="translate(' + m.x + ',' + m.y + ')"' + click + '>' +
      '<ellipse cx="0" cy="16" rx="9" ry="3" fill="rgba(20,40,20,.18)"/>' +
      '<rect x="-12" y="-12" width="24" height="24" rx="8" fill="' + (m.color || '#22c55e') + '" stroke="#fff" stroke-width="2"/>' +
      '<g transform="translate(-7.5,-7.5) scale(0.62)">' + icon(m.kind) + '</g></g>';
  }

  function poi(x, y, kind, color) {
    return '<g class="cm-poi" transform="translate(' + x + ',' + y + ')">' +
      '<circle r="9" fill="' + color + '" stroke="#fff" stroke-width="1.6"/>' +
      '<g transform="translate(-6,-6) scale(0.5)">' + icon(kind) + '</g></g>';
  }

  function buildings() {
    var blocks = [
      [12, 12, 58, 50, '#dcebd6'], [92, 12, 96, 50, '#d6e7cf'], [212, 12, 88, 50, '#e0eeda'],
      [322, 12, 26, 62, '#d9e8d2'], [12, 92, 58, 76, '#e3efe0'], [92, 92, 96, 76, '#d8e8d1'],
      [212, 92, 88, 76, '#e2efe0'], [322, 92, 26, 76, '#d6e7cf'], [12, 200, 58, 62, '#cfe7c0'],
      [92, 200, 96, 70, '#dcebd6'], [212, 200, 88, 70, '#e0eeda'], [322, 200, 26, 70, '#d9e8d2'],
      [92, 288, 60, 20, '#d6e7cf'], [160, 288, 60, 20, '#e0eeda'], [228, 288, 72, 20, '#d9e8d2']
    ];
    var out = '';
    blocks.forEach(function (b) {
      out += '<rect x="' + b[0] + '" y="' + b[1] + '" width="' + b[2] + '" height="' + b[3] + '" rx="9" fill="' + b[4] + '" stroke="#cfe0c8" stroke-width="1"/>';
      if (b[2] > 50 && b[3] > 40) {
        out += '<rect x="' + (b[0] + 10) + '" y="' + (b[1] + 10) + '" width="' + (b[2] - 20) + '" height="' + (b[3] - 20) + '" rx="6" fill="#eef6ea" opacity=".8"/>';
      }
    });
    return out;
  }

  function svg(markers, opts) {
    opts = opts || {};
    markers = markers || [];
    var roads =
      '<g stroke="#dfe9dc" fill="none" stroke-linecap="round">' +
      '<path d="M0 80H360" stroke-width="20"/><path d="M0 190H360" stroke-width="24"/><path d="M0 280H360" stroke-width="16"/>' +
      '<path d="M80 0V320" stroke-width="20"/><path d="M200 0V320" stroke-width="24"/><path d="M310 0V320" stroke-width="16"/>' +
      '<path d="M-10 235 L205 75" stroke-width="10"/>' +
      '</g>' +
      '<g stroke="#fff" fill="none" stroke-linecap="round">' +
      '<path d="M0 80H360" stroke-width="16"/><path d="M0 190H360" stroke-width="20"/><path d="M0 280H360" stroke-width="12"/>' +
      '<path d="M80 0V320" stroke-width="16"/><path d="M200 0V320" stroke-width="20"/><path d="M310 0V320" stroke-width="12"/>' +
      '<path d="M-10 235 L205 75" stroke-width="7"/>' +
      '</g>' +
      '<g stroke="#e6efe3" fill="none" stroke-width="1.4" stroke-dasharray="5 7" stroke-linecap="round">' +
      '<path d="M0 80H360"/><path d="M0 190H360"/><path d="M0 280H360"/>' +
      '<path d="M80 0V320"/><path d="M200 0V320"/><path d="M310 0V320"/>' +
      '</g>';

    var route = '';
    if (opts.route) {
      route = '<path d="M180 150 Q' + ((180 + opts.route.x) / 2 + 20) + ' ' + ((150 + opts.route.y) / 2 - 20) + ' ' + opts.route.x + ' ' + opts.route.y + '" fill="none" stroke="#3b82f6" stroke-width="3" stroke-dasharray="6 6" stroke-linecap="round" opacity=".7"/>';
    }

    var you = opts.you
      ? '<g class="cm-you" transform="translate(' + opts.you.x + ',' + opts.you.y + ')">' +
        '<circle r="19" fill="rgba(59,130,246,.16)"/>' +
        '<circle r="11" fill="#3b82f6" stroke="#fff" stroke-width="2.5"/>' +
        '<g transform="translate(-5.5,-5.5) scale(0.46)">' + icon('nav') + '</g></g>'
      : '';

    return '<svg class="cm-svg" viewBox="0 0 360 320" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="360" height="320" fill="#e9f3e6"/>' +
      '<path d="M0 276 C45 258 75 306 128 299 C186 291 205 255 262 260 C300 263 332 254 360 246 L360 320 L0 320 Z" fill="#b7dcf4"/>' +
      '<path d="M0 276 C45 258 75 306 128 299 C186 291 205 255 262 260 C300 263 332 254 360 246" fill="none" stroke="#a4cce8" stroke-width="2.5"/>' +
      buildings() +
      '<rect x="12" y="200" width="58" height="62" rx="9" fill="#cfe7c0" stroke="#bfd9b2" stroke-width="1"/>' +
      '<circle cx="27" cy="222" r="7" fill="#a9d398"/><circle cx="48" cy="232" r="6" fill="#9bca8a"/><circle cx="34" cy="246" r="5.5" fill="#a9d398"/><circle cx="52" cy="254" r="4.5" fill="#9bca8a"/>' +
      roads +
      '<g font-family="Inter, sans-serif" font-size="6" fill="#8ea487" letter-spacing=".4">' +
      '<text x="92" y="76">ТВЕРСКАЯ</text><text x="212" y="186">САДОВАЯ</text><text x="318" y="76">ЛЕНИНА</text>' +
      '<text x="24" y="258" fill="#79a36a">ПАРК</text><text x="300" y="303" fill="#7fa8c4">РЕКА</text>' +
      '<text x="150" y="122" fill="#a3b59c" font-size="7" letter-spacing="1.2">ЦЕНТР</text>' +
      '</g>' +
      poi(150, 55, 'shield', '#3b82f6') +
      poi(235, 55, 'cross', '#ef4444') +
      poi(330, 120, 'columns', '#64748b') +
      poi(150, 140, 'rub', '#059669') +
      poi(235, 220, 'shop', '#f59e0b') +
      poi(330, 230, 'car', '#facc15') +
      route +
      you +
      markers.map(pin).join('') +
      '</svg>';
  }

  window.CityMap = { SPOTS: SPOTS, svg: svg };
})();
