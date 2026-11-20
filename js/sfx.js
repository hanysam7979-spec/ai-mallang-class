/* ══════════════════════════════════════════════════════════════
   sfx.js — 작은 효과음 (WebAudio, 파일 없이 합성)
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const CC = window.CC;
  const Sfx = (CC.sfx = {});
  let ac = null;
  let on = true;

  Sfx.enabled = (v) => { on = !!v; };
  Sfx.isOn = () => on;

  function ctx() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }

  function tone(freq, dur, type, vol, delay) {
    if (!on) return;
    const a = ctx(); if (!a) return;
    const t0 = a.currentTime + (delay || 0);
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol == null ? 0.14 : vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  Sfx.click = () => tone(620, 0.07, 'triangle', 0.09);
  Sfx.pop = () => { tone(880, 0.08, 'sine', 0.1); tone(1180, 0.07, 'sine', 0.06, 0.05); };
  Sfx.type = () => tone(1500 + Math.random() * 300, 0.03, 'square', 0.025);
  Sfx.err = () => { tone(220, 0.12, 'sawtooth', 0.07); tone(170, 0.16, 'sawtooth', 0.06, 0.09); };
  Sfx.join = () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, 'triangle', 0.1, i * 0.075)); };
  Sfx.cheer = () => {
    [659, 784, 988, 1319].forEach((f, i) => tone(f, 0.22, 'triangle', 0.11, i * 0.09));
    tone(1568, 0.5, 'sine', 0.07, 0.4);
  };
  Sfx.win = () => {
    [784, 988, 1175, 1568, 1568].forEach((f, i) => tone(f, 0.2, 'square', 0.07, i * 0.11));
  };
  Sfx.hit = () => tone(300 + Math.random() * 180, 0.06, 'square', 0.07);
  Sfx.tick = () => tone(1200, 0.04, 'square', 0.05);
})();
