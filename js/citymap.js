/* Городская карта LAVKA — общая для приложения и сайта «Карты» */
(function () {
  'use strict';

  var W = 720, H = 640;
  var seed = 1;
  var THEMES = [
    { bg: '#edf6e9', grid: '#e1eddd', inner: '#eef6ea', blockStroke: '#cfe0c8', road: '#c9dac2', roadFill: '#ffffff', park: '#bfe0b0', parkStroke: '#a9d398', tree: ['#8fc97e', '#9bcf8a', '#a9d398', '#97cc86'], river: '#b7dcf4', riverStroke: '#9ecae8', label: '#8ea487', district: '#a3b59c', accent: '#7fb16f', block: ['#dbead5', '#d5e6ce', '#e0eeda', '#d9e8d2', '#e2efe0', '#d6e7cf'] },
    { bg: '#f7f1e5', grid: '#eadfce', inner: '#fbf2e4', blockStroke: '#d8c2a4', road: '#d8c7ae', roadFill: '#fffaf1', park: '#c9d9a0', parkStroke: '#b4c785', tree: ['#9fb96e', '#b6c981', '#c4d694', '#a8bd78'], river: '#b8d8e8', riverStroke: '#9cc4d7', label: '#9a8f76', district: '#b0a488', accent: '#8c9a63', block: ['#e8d6bd', '#e3cdae', '#f0dfc8', '#dbc6a8', '#efdfc9', '#e6d2b7'] },
    { bg: '#dbe6ee', grid: '#cddae4', inner: '#e6eef4', blockStroke: '#aebfcd', road: '#aebdca', roadFill: '#f3f8fb', park: '#b4cfa9', parkStroke: '#9dbd92', tree: ['#87aa7b', '#97b78a', '#a6c49b', '#7f9f74'], river: '#a9cce0', riverStroke: '#8fb8cf', label: '#7d8f9d', district: '#96a6b2', accent: '#6f8f86', block: ['#c5d5e0', '#b9cbd8', '#d2dfe8', '#b3c6d5', '#cbd9e3', '#c0d0dc'] }
  ];
  function rngFor(s) {
    s = (Number(s) || 1) >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  var SPOTS = {
    center1: { name: 'Тверская, 12', area: 'Центр', x: 280, y: 240, mult: 1.2 },
    center2: { name: 'Садовая, 8', area: 'Центр', x: 500, y: 300, mult: 1.25 },
    center3: { name: 'Тверская, 40', area: 'Центр', x: 350, y: 180, mult: 1.15 },
    station: { name: 'Привокзальная, 3', area: 'Вокзал', x: 90, y: 420, mult: 1.1 },
    station2: { name: 'Вокзальная площадь, 2', area: 'Вокзал', x: 50, y: 350, mult: 1.05 },
    sleep1: { name: 'Ленина, 45', area: 'Спальный', x: 600, y: 160, mult: 1.0 },
    sleep2: { name: 'Мира, 21', area: 'Спальный', x: 560, y: 430, mult: 0.95 },
    sleep3: { name: 'Солнечная, 14', area: 'Спальный', x: 690, y: 120, mult: 1.05 },
    elite: { name: 'Набережная, 5', area: 'Элита', x: 120, y: 150, mult: 1.6 },
    elite2: { name: 'Клубная, 3', area: 'Элита', x: 200, y: 110, mult: 1.7 },
    park: { name: 'Парковая, 2', area: 'Парк', x: 80, y: 520, mult: 0.9 },
    park2: { name: 'Лесная, 7', area: 'Парк', x: 160, y: 600, mult: 0.85 },
    industrial: { name: 'Заводская, 1', area: 'Промзона', x: 520, y: 550, mult: 0.8, factory: true },
    industrial2: { name: 'Цеховая, 9', area: 'Промзона', x: 600, y: 480, mult: 0.85 },
    gov: { name: 'Правительство', area: 'Центр', x: 650, y: 260, mult: 1, gov: true },
    bc: { name: 'БЦ «Сити»', area: 'Центр', x: 380, y: 340, mult: 1, office: true },
    hospital: { name: 'Городская больница', area: 'Центр', x: 430, y: 470, mult: 1, service: true, serviceKind: 'hospital' },
    police: { name: 'Отделение полиции', area: 'Центр', x: 240, y: 440, mult: 1, service: true, serviceKind: 'police' },
    port: { name: 'Порт «Северный»', area: 'Порт', x: 660, y: 590, mult: 1.15, service: true, serviceKind: 'port' }
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
    film: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 9h16M8 5v14M16 5v14"/>',
    anchor: '<path d="M12 7v13"/><path d="M8 10h8"/><path d="M5 15a7 7 0 0 0 14 0"/><path d="M12 3v4"/>',
    train: '<rect x="6" y="4" width="12" height="12" rx="3"/><path d="M9 20l2-4m4 4-2-4M6 10h12"/>',
    market: '<path d="M4 8h16l-1 12H5L4 8Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/><path d="M4 8l2-3h12l2 3"/>'
  };

  function icon(kind) {
    return '<g fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[kind] || ICONS.shop) + '</g>';
  }

  function pin(m) {
    var click = m.id ? ' onclick="Biz.mapPick(\'' + m.id + '\')" style="cursor:pointer"' : '';
    return '<g class="cm-pin" transform="translate(' + m.x + ',' + m.y + ')"' + click + '>' +
      '<ellipse cx="0" cy="27" rx="16" ry="5" fill="rgba(20,40,20,.16)"/>' +
      '<rect x="-22" y="-22" width="44" height="44" rx="14" fill="' + (m.color || '#22c55e') + '" stroke="#fff" stroke-width="3"/>' +
      '<g transform="translate(-14,-14) scale(1.15)">' + icon(m.kind) + '</g></g>';
  }

  function poi(x, y, kind, color) {
    return '<g class="cm-poi" transform="translate(' + x + ',' + y + ')">' +
      '<circle r="17" fill="' + color + '" stroke="#fff" stroke-width="2.4"/>' +
      '<g transform="translate(-11,-11) scale(0.9)">' + icon(kind) + '</g></g>';
  }

  function buildings(theme, R) {
    var blocks = [
      [16, 18, 62, 62, '#dbead5'], [118, 18, 100, 62, '#d5e6ce'], [258, 18, 100, 62, '#e0eeda'], [398, 18, 100, 62, '#d9e8d2'], [538, 18, 92, 62, '#e2efe0'], [672, 18, 32, 62, '#d6e7cf'],
      [16, 120, 62, 80, '#e3efe0'], [118, 120, 100, 80, '#d8e8d1'], [258, 120, 100, 80, '#e2efe0'], [398, 120, 100, 80, '#d9e8d2'], [538, 120, 92, 80, '#e0eeda'], [672, 120, 32, 80, '#d6e7cf'],
      [16, 238, 62, 82, '#e3efe0'], [118, 238, 100, 82, '#dcebd6'], [258, 238, 100, 82, '#d8e8d1'], [398, 238, 100, 82, '#e2efe0'], [538, 238, 92, 82, '#dbead5'], [672, 238, 32, 82, '#d9e8d2'],
      [118, 358, 100, 82, '#dcebd6'], [258, 358, 100, 82, '#e0eeda'], [398, 358, 100, 82, '#d8e8d1'], [538, 358, 92, 82, '#e2efe0'], [672, 358, 32, 82, '#d6e7cf'],
      [118, 478, 100, 62, '#d9e8d2'], [258, 478, 100, 62, '#dcebd6'], [398, 478, 72, 62, '#d6e7cf'], [538, 478, 92, 62, '#e0eeda'], [672, 478, 32, 62, '#d9e8d2']
    ];
    var out = '';
    blocks.forEach(function (b, i) {
      var fill = theme.block[Math.floor(R() * theme.block.length)];
      out += '<rect x="' + b[0] + '" y="' + b[1] + '" width="' + b[2] + '" height="' + b[3] + '" rx="10" fill="' + fill + '" stroke="' + theme.blockStroke + '" stroke-width="1.5"/>';
      if (b[2] > 80 && b[3] > 55) {
        out += '<rect x="' + (b[0] + 12) + '" y="' + (b[1] + 12) + '" width="' + (b[2] - 24) + '" height="' + (b[3] - 24) + '" rx="7" fill="' + theme.inner + '" opacity=".78"/>';
        if (i % 3 === 0) out += '<path d="M' + (b[0] + 24) + ' ' + (b[1] + 18) + 'v' + (b[3] - 36) + 'M' + (b[0] + b[2] - 24) + ' ' + (b[1] + 18) + 'v' + (b[3] - 36) + '" stroke="' + theme.blockStroke + '" stroke-width="2"/>';
      }
    });
    return out;
  }

  function roads(theme) {
    var major = [
      'M0 100H720', 'M0 220H720', 'M0 340H720', 'M0 460H720', 'M0 560H720',
      'M100 0V640', 'M240 0V640', 'M380 0V640', 'M520 0V640', 'M650 0V640'
    ];
    var minor = ['M0 160H720', 'M0 400H720', 'M160 0V640', 'M300 0V640', 'M440 0V640', 'M580 0V640'];
    var ring = 'M84 70H636 Q676 70 676 110V500 Q676 540 636 540H84 Q44 540 44 500V110 Q44 70 84 70Z';
    var diag = 'M0 500L360 250L540 250';
    var casing = major.concat([ring, diag]).join(' ');
    var lanes = major.concat([ring]).join(' ');
    return '<g stroke="' + theme.road + '" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="' + casing + '" stroke-width="34"/>' +
      '<path d="' + minor.join(' ') + '" stroke-width="18"/>' +
      '</g>' +
      '<g stroke="' + theme.roadFill + '" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="' + casing + '" stroke-width="26"/>' +
      '<path d="' + minor.join(' ') + '" stroke-width="12"/>' +
      '</g>' +
      '<g stroke="' + theme.grid + '" fill="none" stroke-width="1.7" stroke-dasharray="8 10" stroke-linecap="round">' +
      '<path d="' + lanes + '"/>' +
      '</g>' +
      '<g stroke="' + theme.inner + '" fill="none" stroke-width="1.3" stroke-dasharray="5 8" stroke-linecap="round">' +
      '<path d="' + minor.join(' ') + '"/></g>';
  }

  function park(theme) {
    return '<path d="M14 350 Q120 330 170 380 Q210 430 150 462 Q80 500 16 470Z" fill="' + theme.park + '" stroke="' + theme.parkStroke + '" stroke-width="2"/>' +
      '<path d="M52 448 Q120 420 156 392" fill="none" stroke="' + theme.inner + '" stroke-width="5" stroke-linecap="round"/>' +
      '<circle cx="52" cy="382" r="12" fill="' + theme.tree[0] + '"/><circle cx="92" cy="402" r="10" fill="' + theme.tree[1] + '"/><circle cx="132" cy="428" r="12" fill="' + theme.tree[0] + '"/><circle cx="70" cy="442" r="9" fill="' + theme.tree[2] + '"/><circle cx="118" cy="458" r="8" fill="' + theme.tree[3] + '"/>';
  }

  function river(theme) {
    return '<path d="M0 592 C120 560 220 624 340 602 C454 582 566 628 720 578 L720 640 L0 640Z" fill="' + theme.river + '"/>' +
      '<path d="M0 592 C120 560 220 624 340 602 C454 582 566 628 720 578" fill="none" stroke="' + theme.riverStroke + '" stroke-width="4"/>' +
      '<path d="M0 612 C130 588 226 640 350 618 C470 598 584 640 720 600" fill="none" stroke="' + theme.inner + '" stroke-width="2" stroke-dasharray="10 12"/>';
  }

  function bridges(theme) {
    var xs = [100, 240, 380, 520, 650];
    return '<g stroke="' + theme.roadFill + '" stroke-width="34" stroke-linecap="butt">' +
      xs.map(function (x) { return '<path d="M' + x + ' 574V640"/>'; }).join('') +
      '</g><g stroke="' + theme.blockStroke + '" stroke-width="2">' +
      xs.map(function (x) { return '<path d="M' + (x - 19) + ' 578V640M' + (x + 19) + ' 578V640"/>'; }).join('') +
      '</g><g stroke="' + theme.grid + '" stroke-width="1.6" stroke-dasharray="7 8">' +
      xs.map(function (x) { return '<path d="M' + x + ' 578V640"/>'; }).join('') +
      '</g>';
  }

  function svg(markers, opts) {
    opts = opts || {};
    markers = markers || [];
    var R = rngFor(seed);
    var theme = THEMES[Math.floor(R() * THEMES.length)];
    var route = '';
    if (opts.route) {
      var sx = opts.you ? opts.you.x : W / 2, sy = opts.you ? opts.you.y : H / 2;
      route = '<path d="M' + sx + ' ' + sy + ' Q' + ((sx + opts.route.x) / 2 + 34) + ' ' + ((sy + opts.route.y) / 2 - 34) + ' ' + opts.route.x + ' ' + opts.route.y + '" fill="none" stroke="#3b82f6" stroke-width="5" stroke-dasharray="10 9" stroke-linecap="round" opacity=".8"/>';
    }

    var you = opts.you
      ? '<g class="cm-you" transform="translate(' + opts.you.x + ',' + opts.you.y + ')">' +
        '<circle r="34" fill="rgba(59,130,246,.14)"/>' +
        '<circle r="20" fill="#3b82f6" stroke="#fff" stroke-width="4"/>' +
        '<g transform="translate(-9,-9) scale(0.75)">' + icon('nav') + '</g></g>'
      : '';

    return '<svg class="cm-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="' + W + '" height="' + H + '" fill="' + theme.bg + '"/>' +
      '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="url(#cm-grid)" opacity=".35"/>' +
      '<defs><pattern id="cm-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="' + theme.grid + '" stroke-width="1"/></pattern></defs>' +
      river(theme) +
      park(theme) +
      '<path d="M560 18 Q620 12 668 28 Q690 60 676 92 Q640 110 584 96 Q552 70 560 18Z" fill="' + theme.park + '" stroke="' + theme.parkStroke + '" stroke-width="2"/>' +
      '<path d="M572 76 Q610 50 652 60" fill="none" stroke="' + theme.inner + '" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="590" cy="54" r="11" fill="' + theme.tree[0] + '"/><circle cx="626" cy="42" r="9" fill="' + theme.tree[1] + '"/><circle cx="652" cy="74" r="10" fill="' + theme.tree[0] + '"/>' +
      buildings(theme, R) +
      roads(theme) +
      bridges(theme) +
      '<g font-family="Inter, sans-serif" fill="' + theme.label + '" letter-spacing=".6">' +
      '<text x="300" y="92" font-size="12">ТВЕРСКАЯ</text><text x="402" y="334" font-size="12">САДОВАЯ</text><text x="552" y="212" font-size="12">ЛЕНИНА</text>' +
      '<text x="20" y="330" font-size="12">НАБЕРЕЖНАЯ</text><text x="206" y="624" font-size="12">ПРИВОКЗАЛЬНАЯ</text>' +
      '<text x="278" y="300" font-size="15" fill="' + theme.district + '" letter-spacing="2">ЦЕНТР</text>' +
      '<text x="118" y="212" font-size="13" fill="' + theme.accent + '" letter-spacing="1.4">ЭЛИТА</text>' +
      '<text x="540" y="230" font-size="13" fill="' + theme.accent + '" letter-spacing="1.2">СПАЛЬНЫЙ</text>' +
      '<text x="26" y="490" font-size="13" fill="' + theme.accent + '" letter-spacing="1.4">ПАРК</text>' +
      '<text x="544" y="506" font-size="13" fill="' + theme.district + '" letter-spacing="1.2">ПРОМЗОНА</text>' +
      '<text x="28" y="404" font-size="12" fill="' + theme.district + '" letter-spacing="1.2">ВОКЗАЛ</text>' +
      '<text x="612" y="620" font-size="12" fill="' + theme.riverStroke + '" letter-spacing="1.2">ПОРТ</text>' +
      '<text x="350" y="632" font-size="13" fill="' + theme.riverStroke + '" letter-spacing="1.6">РЕКА</text>' +
      '</g>' +
      poi(160, 520, 'tree', '#16a34a') +
      poi(300, 120, 'train', '#0ea5e9') +
      poi(470, 500, 'cross', '#ef4444') +
      poi(194, 404, 'shield', '#3b82f6') +
      poi(650, 260, 'columns', '#64748b') +
      poi(560, 390, 'market', '#f59e0b') +
      poi(660, 610, 'anchor', '#0ea5e9') +
      route +
      you +
      markers.map(pin).join('') +
      '</svg>';
  }

  window.CityMap = {
    SPOTS: SPOTS, svg: svg, W: W, H: H,
    setSeed: function (n) { seed = (Number(n) || 1) >>> 0; },
    getSeed: function () { return seed; }
  };
})();
