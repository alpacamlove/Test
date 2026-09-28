(() => {
'use strict';

/* ================= basics ================= */
const VW = 900, VH = 1600, NS = 'http://www.w3.org/2000/svg';
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = id => document.getElementById(id);
const stage = $('stage'), sceneEl = $('scene'), canvas = $('fx'), cx2 = canvas.getContext('2d');
const ovG = $('ovG'), ovDefs = $('ovDefs'), uiEl = $('ui'), tailsEl = $('tails');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const now = () => performance.now();
const rand = (a, b) => a + Math.random() * (b - a);

function el(tag, attrs, parent) {
  const n = document.createElementNS(NS, tag);
  if (attrs) for (const k in attrs) { const v = attrs[k]; if (v != null) n.setAttribute(k, v); }
  if (parent) parent.appendChild(n);
  return n;
}
function mulberry(a) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
let uid = 0;
const gradCache = new WeakMap();
function grad(defs, kind, stops, attrs) {
  let m = gradCache.get(defs); if (!m) gradCache.set(defs, m = new Map());
  const key = kind + JSON.stringify(stops) + JSON.stringify(attrs || 0);
  if (m.has(key)) return m.get(key);
  const id = 'gr' + (++uid);
  const g = el(kind === 'r' ? 'radialGradient' : 'linearGradient', Object.assign({ id }, kind === 'r' ? {} : { x1: 0, y1: 0, x2: 0, y2: 1 }, attrs), defs);
  for (const [o, c, a] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a == null ? 1 : a }, g);
  const url = `url(#${id})`; m.set(key, url); return url;
}
const lin = (defs, stops, attrs) => grad(defs, 'l', stops, attrs);
const rad = (defs, stops, attrs) => grad(defs, 'r', stops, attrs);
function glow(parent, defs, x, y, r, color, a = .6, cls) {
  return el('circle', { cx: x, cy: y, r, fill: rad(defs, [[0, color, a], [.3, color, a * .5], [1, color, 0]]), class: cls }, parent);
}

/* ================= stage metrics ================= */
let W = 1, H = 1, S = 1, OX = 0, OY = 0, DPR = 1, hudBottom = 60;
let onRelayout = () => {};
function measure() {
  const r = stage.getBoundingClientRect();
  W = r.width || 1; H = r.height || 1;
  S = Math.max(W / VW, H / VH); OX = (W - VW * S) / 2; OY = (H - VH * S) / 2;
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
  stage.style.setProperty('--u', S.toFixed(4) + 'px');
  hudBottom = $('hud').getBoundingClientRect().bottom - r.top;
  tailsEl.setAttribute('viewBox', `0 0 ${W} ${H}`);
  onRelayout();
}
const visBox = () => ({ x0: -OX / S, y0: -OY / S, x1: (W - OX) / S, y1: (H - OY) / S });
/* screen px (relative to the stage) → viewBox units */
const toVB = (px, py) => [(px - OX) / S, (py - OY) / S];

/* ================= camera with parallax layers ================= */
const cam = { x: 0, y: 0, z: 1 };
let camTw = null, shakeT = 0, shakeA = 0, layers = [];
function camTo(t, dur) {
  if (REDUCED) dur = Math.min(dur, 300);
  camTw = { from: { ...cam }, to: { x: t.x ?? cam.x, y: t.y ?? cam.y, z: t.z ?? cam.z }, t0: now(), dur: Math.max(1, dur), e: t.out ? easeOut : ease };
}
function camSet(t) { camTw = null; cam.x = t.x ?? cam.x; cam.y = t.y ?? cam.y; cam.z = t.z ?? cam.z; }
function shake(a = 14, ms = 500) { if (!REDUCED) { shakeA = a; shakeT = now() + ms; } }
function stepCam(t) {
  if (camTw) {
    const k = clamp((t - camTw.t0) / camTw.dur, 0, 1), e = camTw.e(k);
    for (const p of ['x', 'y', 'z']) cam[p] = lerp(camTw.from[p], camTw.to[p], e);
    if (k >= 1) camTw = null;
  }
  let sx = 0, sy = 0;
  if (t < shakeT) { const f = (shakeT - t) / 500; sx = (Math.random() - .5) * shakeA * f; sy = (Math.random() - .5) * shakeA * f; }
  for (const L of layers) {
    const d = L.d, s = 1 + (cam.z - 1) * d;
    const tx = (-cam.x * d * s + sx * d) * S, ty = (-cam.y * d * s + sy * d) * S;
    L.svg.style.transform = `translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0) scale(${s.toFixed(4)})`;
  }
}
function project(x, y, d) {
  const s = 1 + (cam.z - 1) * d;
  return [450 + (x - 450 - cam.x * d) * s, 800 + (y - 800 - cam.y * d) * s];
}
function layer(d) {
  const svg = el('svg', { viewBox: `0 0 ${VW} ${VH}`, preserveAspectRatio: 'xMidYMid slice', class: 'layer' }, sceneEl);
  const L = { svg, d, defs: el('defs', null, svg), g: el('g', null, svg) };
  layers.push(L);
  return L;
}
function clearScene() { sceneEl.textContent = ''; layers = []; }
/* where an SVG element currently sits on screen, in viewBox units (centre of its box) */
function whereIs(node, dy = 0) {
  if (!node || !node.getBoundingClientRect) return null;
  const r = node.getBoundingClientRect(), s = stage.getBoundingClientRect();
  if (!r.width && !r.height) return null;
  return toVB(r.left - s.left + r.width / 2, r.top - s.top + r.height / 2 + dy * r.height);
}

/* ================= particles (canvas) ================= */
let FX = {};
const P = { dust: [], puff: [], steam: [], mag: [], star: [], snow: [] };
function resetFx(cfg) {
  FX = Object.assign({}, cfg || {});
  for (const k in P) P[k] = [];
}
/* a breath puff at (x, y) in viewBox units drifting along dir */
function puff(x, y, dir = 1, k = 1) {
  if (P.puff.length > 40) return;
  for (let i = 0; i < 3; i++) P.puff.push({ x: x + rand(-6, 6), y: y + rand(-4, 4), vx: dir * rand(30, 60) * k, vy: -rand(8, 22), a: 0, life: rand(1.2, 2.1), r: rand(10, 18) * k });
}
function stepFx(dt) {
  const du = FX.dust;
  if (du && !P.dust.length) for (let i = 0; i < (REDUCED ? du.n / 3 : du.n); i++)
    P.dust.push({ x: lerp(du.x0, du.x1, Math.random()), y: lerp(du.y0, du.y1, Math.random()), vx: rand(-6, 6), vy: rand(-8, 6), ph: rand(0, 6), r: rand(1.5, 3.5) });
  for (const p of P.dust) { p.x += p.vx * dt; p.y += p.vy * dt; p.ph += dt; if (p.y < du.y0) p.y = du.y1; if (p.y > du.y1) p.y = du.y0; }
  for (const p of P.puff) { p.a += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .985; p.r += dt * 14; }
  P.puff = P.puff.filter(p => p.a < p.life);
  const st = FX.steam;
  if (st) {
    st.acc = (st.acc || 0) + dt * (st.rate || 6);
    while (st.acc > 1) { st.acc--; const [x, y] = st.at ? st.at() : [st.x, st.y]; if (x != null) P.steam.push({ x: x + rand(-st.w || -8, st.w || 8), y, vx: rand(-6, 6), vy: -rand(20, 40), a: 0, life: rand(1, 1.8), r: rand(4, 8) * (st.k || 1) }); }
  }
  for (const p of P.steam) { p.a += dt; p.x += (p.vx + Math.sin(p.a * 4) * 8) * dt; p.y += p.vy * dt; p.r += dt * 5; }
  P.steam = P.steam.filter(p => p.a < p.life);
  const m = FX.magic;
  if (m && m.mode === 'uv') { /* violet motes drifting in the beam */
    while (P.mag.length < 40) P.mag.push({ x: rand(m.x0, m.x1), y: rand(m.y0, m.y1), vx: rand(-10, 10), vy: rand(-10, 10), a: rand(0, 3), sz: rand(1.5, 3.5), hue: Math.random() });
    for (const p of P.mag) { p.a += dt; p.x += p.vx * dt; p.y += p.vy * dt; }
  }
  const sp = FX.sparkle;
  if (sp) {
    sp.acc = (sp.acc || 0) + dt * sp.rate * (REDUCED ? .3 : 1);
    while (sp.acc > 1) { sp.acc--; P.star.push({ x: lerp(sp.x0, sp.x1, Math.random()), y: lerp(sp.y0, sp.y1, Math.random()), a: 0, life: rand(.7, 1.6), r: rand(5, 12) }); }
  }
  for (const s of P.star) s.a += dt;
  P.star = P.star.filter(s => s.a < s.life);
}
const sprites = {};
function sprite(rgb) {
  if (sprites[rgb]) return sprites[rgb];
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(.28, `rgba(${rgb},.5)`); g.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return sprites[rgb] = c;
}
function drawFx() {
  const c = cx2;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, canvas.width, canvas.height);
  c.setTransform(DPR * S, 0, 0, DPR * S, DPR * OX, DPR * OY);
  const dr = (img, x, y, r, a) => { c.globalAlpha = clamp(a, 0, 1); c.drawImage(img, x - r, y - r, r * 2, r * 2); };
  if (P.puff.length) { const img = sprite('226,234,248'); for (const p of P.puff) { const k = p.a / p.life; dr(img, p.x, p.y, p.r, (k < .15 ? k / .15 : 1 - (k - .15) / .85) * .42); } }
  if (P.steam.length) { const img = sprite('240,240,236'); for (const p of P.steam) { const k = p.a / p.life; dr(img, p.x, p.y, p.r, Math.sin(k * Math.PI) * .45); } }
  c.globalCompositeOperation = 'lighter';
  if (P.dust.length) { const img = sprite(FX.dust.c || '220,240,210'); for (const p of P.dust) dr(img, p.x, p.y, p.r * 3, .18 + .18 * Math.sin(p.ph * 1.7)); }
  if (P.mag.length) { const a = sprite('176,122,255'), b = sprite('240,220,255'); for (const p of P.mag) dr(p.hue < .7 ? a : b, p.x, p.y, p.sz * 3, .5 + .4 * Math.sin(p.a * 3)); }
  if (P.star.length) {
    const img = sprite('235,220,255');
    for (const s of P.star) {
      const al = Math.sin(s.a / s.life * Math.PI);
      dr(img, s.x, s.y, s.r * 2, al);
      c.globalAlpha = al * .9; c.strokeStyle = '#fff'; c.lineWidth = 1.3; c.beginPath();
      c.moveTo(s.x - s.r, s.y); c.lineTo(s.x + s.r, s.y); c.moveTo(s.x, s.y - s.r); c.lineTo(s.x, s.y + s.r); c.stroke();
    }
  }
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}
function flash(peak = .85, ms = 650, color) {
  if (REDUCED) peak *= .25;
  const f = $('flash'); f.style.background = color || '#fff';
  f.animate([{ opacity: 0 }, { opacity: peak, offset: .08 }, { opacity: peak * .12, offset: .3 }, { opacity: peak * .55, offset: .42 }, { opacity: 0 }], { duration: ms, easing: 'ease-out' });
}
(function makeGrain() {
  const c = document.createElement('canvas'); c.width = c.height = 160;
  const x = c.getContext('2d'), img = x.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255 | 0; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  x.putImageData(img, 0, 0);
  $('grain').style.backgroundImage = `url(${c.toDataURL()})`;
})();

/* ================= sound: synthesized ambience, a heartbeat, small effects ================= */
const Snd = {
  on: true, c: null, pad: null, padName: undefined, heartT: 0,
  state: { wind: 0, hum: 0, store: 0, pad: null, heart: false },
  CH: {
    night: [55, 82.41, 110, 130.81], tense: [55, 77.78, 110, 116.54], tender: [98, 146.83, 196, 246.94, 293.66],
    sad: [73.42, 110, 146.83, 174.61], soft: [87.31, 130.81, 174.61, 220, 261.63], store: [130.81, 196, 261.63]
  },
  init() {
    if (this.c) { if (this.c.state === 'suspended') this.c.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = this.c = new AC();
    const comp = c.createDynamicsCompressor(); comp.connect(c.destination);
    this.out = c.createGain(); this.out.gain.value = this.on ? .9 : 0; this.out.connect(comp);
    const len = c.sampleRate * 2;
    const wb = c.createBuffer(1, len, c.sampleRate), wd = wb.getChannelData(0);
    for (let i = 0; i < len; i++) wd[i] = Math.random() * 2 - 1;
    const bb = c.createBuffer(1, len, c.sampleRate), bd = bb.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; bd[i] = last * 3.5; }
    this.noise = wb; this.brown = bb;
    this.windG = this.bed(bb, [['lowpass', 520]]);
    this.storeG = this.bed(wb, [['bandpass', 2400]]);
    /* the lamp buzz and the vending machine compressor */
    const hum = c.createGain(); hum.gain.value = 0; hum.connect(this.out); this.humG = hum;
    const o1 = c.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 100;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 2;
    const g1 = c.createGain(); g1.gain.value = .05; o1.connect(bp); bp.connect(g1); g1.connect(hum); o1.start();
    const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = 49;
    const g2 = c.createGain(); g2.gain.value = .5; o2.connect(g2); g2.connect(hum); o2.start();
    setInterval(() => this.tick(), 60);
    this.apply();
  },
  bed(buf, filters) {
    const c = this.c, s = c.createBufferSource(); s.buffer = buf; s.loop = true;
    let n = s;
    for (const [type, f] of filters) { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; n.connect(b); n = b; }
    const g = c.createGain(); g.gain.value = 0; n.connect(g); g.connect(this.out); s.start();
    return g;
  },
  set(st) { Object.assign(this.state, st); this.apply(); },
  apply() {
    const c = this.c; if (!c) return;
    const t = c.currentTime, st = this.state;
    this.windG.gain.setTargetAtTime(st.wind * .22, t, .8);
    this.storeG.gain.setTargetAtTime(st.store * .015, t, .4);
    this.humG.gain.setTargetAtTime(st.hum * .09, t, .6);
    if (st.pad !== this.padName) this.padTo(st.pad);
  },
  tick() {
    const c = this.c;
    if (!c || !this.on || document.hidden || !this.state.heart) return;
    const t = c.currentTime;
    if (t < this.heartT) return;
    this.heartT = t + (this.state.heartRate || 1.05);
    this.thump(t, .9); this.thump(t + .22, .6);
  },
  thump(t, k) {
    const c = this.c, o = c.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(38, t + .16);
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.55 * k, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + .24);
    o.connect(g); g.connect(this.out); o.start(t); o.stop(t + .3);
  },
  padTo(name) {
    const c = this.c, t = c.currentTime;
    if (this.pad) { const old = this.pad; old.g.gain.setTargetAtTime(0, t, .9); setTimeout(() => old.oscs.forEach(o => { try { o.stop(); } catch (e) {} }), 5000); }
    this.pad = null; this.padName = name;
    if (!name) return;
    const g = c.createGain(); g.gain.value = 0;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = name === 'tender' || name === 'soft' ? 1400 : 800;
    f.connect(g); g.connect(this.out);
    const oscs = [];
    for (const hz of this.CH[name]) for (const det of [-6, 6]) {
      const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = hz; o.detune.value = det;
      const og = c.createGain(); og.gain.value = .04; o.connect(og); og.connect(f); o.start(); oscs.push(o);
    }
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = .15; lg.gain.value = .02; lfo.connect(lg); lg.connect(g.gain); lfo.start(); oscs.push(lfo);
    g.gain.setTargetAtTime(name === 'store' ? .3 : .7, t, 1.8);
    this.pad = { g, oscs };
  },
  env(p, t, a, peak, dec) { p.setValueAtTime(0, t); p.linearRampToValueAtTime(peak, t + a); p.exponentialRampToValueAtTime(.0001, t + a + dec); },
  hit({ type = 'lowpass', f0 = 200, f1, q = 1, a = .02, dec = 1, peak = .5, delay = 0, buf }) {
    const c = this.c, t = c.currentTime + delay;
    const s = c.createBufferSource(); s.buffer = buf || this.noise; s.loop = true;
    const fl = c.createBiquadFilter(); fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f0, t);
    if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + a + dec * .6);
    const g = c.createGain(); this.env(g.gain, t, a, peak, dec);
    s.connect(fl); fl.connect(g); g.connect(this.out); s.start(t); s.stop(t + a + dec + .1);
  },
  tone(hz, { type = 'sine', t = 0, a = .01, dec = 1.2, peak = .12, to } = {}) {
    const c = this.c, t0 = c.currentTime + t;
    const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(hz, t0);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + a + dec * .5);
    const g = c.createGain(); this.env(g.gain, t0, a, peak, dec);
    o.connect(g); g.connect(this.out); o.start(t0); o.stop(t0 + a + dec + .1);
  },
  fx(name) {
    const c = this.c;
    if (!c || !this.on) return;
    if (name === 'chime') { this.tone(659.25, { dec: .7, peak: .09 }); this.tone(523.25, { t: .32, dec: .9, peak: .09 }); }
    else if (name === 'buzz') { for (let i = 0; i < 3; i++) this.tone(170, { type: 'square', t: i * .16, a: .005, dec: .09, peak: .04 }); }
    else if (name === 'click') this.hit({ type: 'highpass', f0: 3000, a: .002, dec: .04, peak: .25 });
    else if (name === 'uv') { this.hit({ type: 'highpass', f0: 3000, a: .002, dec: .04, peak: .25 }); this.tone(6200, { t: .02, a: .05, dec: 1.4, peak: .012 }); }
    else if (name === 'hit') { this.hit({ buf: this.brown, f0: 180, a: .01, dec: .6, peak: .9 }); this.hit({ type: 'bandpass', f0: 900, f1: 300, q: .8, a: .01, dec: .4, peak: .35 }); }
    else if (name === 'grab') this.hit({ type: 'bandpass', f0: 1800, f1: 600, q: 1.2, a: .005, dec: .18, peak: .3 });
    else if (name === 'rustle') { for (let i = 0; i < 6; i++) this.hit({ type: 'bandpass', f0: rand(2500, 5000), q: 2, a: .004, dec: .05, peak: .12, delay: i * .07 + rand(0, .03) }); }
    else if (name === 'steps') { for (let i = 0; i < 8; i++) this.hit({ buf: this.brown, type: 'lowpass', f0: 400, a: .004, dec: .09, peak: .45, delay: i * .19 }); }
    else if (name === 'crackle') { for (let i = 0; i < 5; i++) this.hit({ type: 'highpass', f0: 2000, a: .002, dec: .03, peak: .2, delay: i * .05 + rand(0, .1) }); }
    else if (name === 'creak') {
      const t = c.currentTime, o = c.createOscillator(); o.type = 'sawtooth';
      [[26, 0], [48, .3], [30, .7], [22, 1.1]].forEach(([f, dt], i) => i ? o.frequency.linearRampToValueAtTime(f, t + dt) : o.frequency.setValueAtTime(f, t));
      const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = 1150; b.Q.value = 7;
      const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.28, t + .08); g.gain.setValueAtTime(.28, t + .9); g.gain.linearRampToValueAtTime(0, t + 1.2);
      o.connect(b); b.connect(g); g.connect(this.out); o.start(t); o.stop(t + 1.3);
    }
    else if (name === 'thud') { this.hit({ buf: this.brown, f0: 120, a: .01, dec: .5, peak: .6 }); }
    else if (name === 'coins') { [2400, 3150, 2780, 3620].forEach((hz, i) => this.tone(hz, { type: 'triangle', t: i * .07 + rand(0, .03), a: .002, dec: .3, peak: .05 })); }
    else if (name === 'slap') { for (let i = 0; i < 7; i++) this.hit({ type: 'bandpass', f0: 1100, q: 1.4, a: .003, dec: .07, peak: .32 * (1 - i * .11), delay: i * .21 }); }
  },
  toggle(on) { this.on = on; if (this.c) this.out.gain.setTargetAtTime(on ? .9 : 0, this.c.currentTime, .15); }
};
document.addEventListener('visibilitychange', () => {
  if (!Snd.c) return;
  if (document.hidden) Snd.c.suspend(); else if (Snd.on) Snd.c.resume();
});
