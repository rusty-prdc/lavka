/* Лавка — короткие звуки интерфейса (WebAudio, без файлов) */
(function () {
  'use strict';
  var ctx = null;
  var CFG = {
    click: [520, 0.06, 'square', 0.05],
    pop: [660, 0.09, 'sine', 0.08],
    cash: [880, 0.20, 'triangle', 0.12],
    reward: [740, 0.30, 'sine', 0.12],
    level: [520, 0.55, 'triangle', 0.14]
  };

  function enabled() {
    var s = window.LV && window.LV.state && window.LV.state.settings;
    return !(s && s.sound === false);
  }
  function ac() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }
  function play(name) {
    if (!enabled()) return;
    var c = ac();
    if (!c) return;
    var cfg = CFG[name] || CFG.click;
    var t0 = c.currentTime;
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = cfg[2];
    o.frequency.setValueAtTime(cfg[0], t0);
    if (name === 'cash') o.frequency.exponentialRampToValueAtTime(cfg[0] * 2, t0 + cfg[1]);
    if (name === 'level') o.frequency.linearRampToValueAtTime(cfg[0] * 2, t0 + cfg[1]);
    g.gain.setValueAtTime(cfg[3], t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + cfg[1]);
    o.connect(g);
    g.connect(c.destination);
    o.start(t0);
    o.stop(t0 + cfg[1] + 0.03);
  }
  window.Sfx = { play: play };
})();
