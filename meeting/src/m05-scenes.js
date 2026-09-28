
/* ================= places ================= */
const NIGHT = { sky0: '#070914', sky1: '#141a34', sky2: '#232a4a', far: '#10142a', mid: '#0d1122', near: '#0a0d1a', ground: '#12151f' };
const LAMP = '#e4f4d6', LAMP_RIM = '#dff0d0', VEND = '#e6f0ff';

function sky(L, o = {}) {
  el('rect', { x: -900, y: -700, width: 2700, height: 3000, fill: lin(L.defs, [[0, NIGHT.sky0], [.4, NIGHT.sky1], [.62, NIGHT.sky2], [1, NIGHT.sky1]]) }, L.g);
  const rnd = mulberry(o.seed || 3), cl = el('g', { class: 'drift slow' }, L.g);
  for (let i = 0; i < 9; i++) el('ellipse', { cx: -300 + rnd() * 1500, cy: 120 + rnd() * 520, rx: 240 + rnd() * 260, ry: 26 + rnd() * 40, fill: rad(L.defs, [[0, '#2e3658', .55], [1, '#2e3658', 0]]) }, cl);
  glow(L.g, L.defs, 450, 1060, 900, '#3a3a66', .35);
}
/* a block of flats: dark mass, rows of windows (some warm, some with blue TV light) */
function block(L, x, y, w, h, o = {}) {
  const rnd = mulberry(o.seed || x * 7 + 3), g = el('g', null, L.g);
  el('rect', { x, y: y - h, width: w, height: h, fill: o.c || NIGHT.far }, g);
  el('rect', { x, y: y - h, width: w, height: 4, fill: o.trim || '#1c2240' }, g);
  const cw = o.cw || 46, ch = o.ch || 62;
  for (let wy = y - h + 26; wy < y - 30; wy += ch) for (let wx = x + 16; wx + 22 < x + w - 8; wx += cw) {
    const r = rnd();
    const lit = r < (o.lit ?? .18), tv = !lit && r < (o.lit ?? .18) + (o.tv ?? .06);
    if (lit) { el('rect', { x: wx, y: wy, width: 22, height: 30, fill: ['#e8b25a', '#f0c870', '#f4e8c8'][Math.floor(rnd() * 3)], class: rnd() < .15 ? 'flicker' : null }, g); }
    else if (tv) el('rect', { x: wx, y: wy, width: 22, height: 30, fill: '#6a8cff', class: 'tv', style: `animation-delay:${(-rnd() * 2).toFixed(2)}s` }, g);
    else el('rect', { x: wx, y: wy, width: 22, height: 30, fill: o.win || '#161b30' }, g);
    if (o.balc && rnd() < .5) el('rect', { x: wx - 6, y: wy + 30, width: 34, height: 5, fill: '#1c2238' }, g);
  }
  return g;
}
function lampPost(L, x, groundY, h, o = {}) {
  const g = el('g', null, L.g);
  el('rect', { x: x - 4, y: groundY - h, width: 8, height: h, fill: '#1a1e2a' }, g);
  el('path', { d: `M${x},${groundY - h} q2,-30 34,-34 l18,0`, fill: 'none', stroke: '#1a1e2a', 'stroke-width': 7 }, g);
  const lx = x + 52, ly = groundY - h - 30;
  const halo = el('g', { class: o.buzz === false ? 'flicker' : 'buzz' }, g);
  glow(halo, L.defs, lx, ly + 6, o.r || 520, o.c || LAMP, .32);
  glow(halo, L.defs, lx, ly + 6, 90, '#ffffff', .6);
  el('path', { d: `M${lx - 20},${ly} L${lx + 20},${ly} L${lx + 14},${ly + 10} L${lx - 14},${ly + 10} Z`, fill: '#262a36' }, g);
  el('rect', { x: lx - 12, y: ly + 9, width: 24, height: 5, rx: 2, fill: '#ffffff', class: 'buzz' }, g);
  return { g, lx, ly, halo };
}

/* --- the playground: a wide world the camera moves around in --- */
function sceneYard() {
  const skyL = layer(0), far = layer(.2), near = layer(.5), yard = layer(1), chars = layer(1), fg = layer(1.25);
  sky(skyL, { seed: 5 });
  let x = -900; const rnd = mulberry(11);
  while (x < 1800) { const w = 220 + rnd() * 260; block(far, x, 1020, w, 280 + rnd() * 320, { seed: x | 0, lit: .12, tv: .05, c: NIGHT.far, cw: 38, ch: 50 }); x += w + 20; }
  /* the block opposite, with the balcony that will light up; the brick corner on the left; the right block */
  const opp = block(near, 40, 1190, 880, 560, { seed: 77, lit: .1, tv: .06, c: '#0c1020', balc: 1 });
  const balcony = el('g', { opacity: 0 }, near.g);
  el('rect', { x: 560, y: 820, width: 60, height: 90, fill: '#f0c878' }, balcony);
  el('path', { d: 'M580,910 L580,850 C580,836 600,836 600,850 L600,910 Z', fill: '#15121c' }, balcony);
  el('rect', { x: 548, y: 908, width: 84, height: 8, fill: '#2a2438' }, balcony);
  glow(balcony, near.defs, 590, 870, 160, '#f0c878', .35);
  const brick = el('g', null, near.g);
  el('rect', { x: -900, y: 560, width: 960, height: 700, fill: '#140f14' }, brick);
  for (let by = 580; by < 1250; by += 22) for (let bx = -900 + ((by / 22) % 2) * 20; bx < 60; bx += 40) el('rect', { x: bx, y: by, width: 36, height: 18, fill: '#1c1418' }, brick);
  el('rect', { x: 52, y: 560, width: 12, height: 700, fill: '#241a1e' }, brick);
  block(near, 960, 1250, 900, 700, { seed: 91, lit: .16, tv: .06, c: '#0b0e1c' });
  /* ground */
  el('rect', { x: -900, y: 1180, width: 2800, height: 1000, fill: lin(yard.defs, [[0, '#0e111a'], [1, '#161a26']]) }, yard.g);
  el('ellipse', { cx: 300, cy: 1420, rx: 520, ry: 120, fill: rad(yard.defs, [[0, LAMP, .28], [.6, LAMP, .08], [1, LAMP, 0]]) }, yard.g);
  el('ellipse', { cx: 920, cy: 1350, rx: 260, ry: 70, fill: rad(yard.defs, [[0, VEND, .22], [1, VEND, 0]]) }, yard.g);
  /* swings (left, near the corner) */
  const sw = el('g', null, yard.g);
  el('path', { d: 'M-240,1330 L-200,1120 L-40,1120 L0,1330', fill: 'none', stroke: '#2a3046', 'stroke-width': 8 }, sw);
  for (const cx of [-160, -80]) { el('line', { x1: cx, y1: 1122, x2: cx, y2: 1270, stroke: '#3a425c', 'stroke-width': 2, 'stroke-dasharray': '4 3' }, sw); el('rect', { x: cx - 18, y: 1268, width: 36, height: 7, rx: 2, fill: '#3a2a30' }, sw); }
  /* slide (back right) */
  const sl = el('g', null, yard.g);
  el('rect', { x: 700, y: 1060, width: 8, height: 200, fill: '#2c3450' }, sl); el('rect', { x: 760, y: 1060, width: 8, height: 200, fill: '#2c3450' }, sl);
  for (let k = 0; k < 6; k++) el('rect', { x: 700, y: 1072 + k * 30, width: 68, height: 5, fill: '#34405e' }, sl);
  el('path', { d: 'M700,1064 L660,1064 L560,1250 L590,1256 Z', fill: '#241c26' }, sl);
  el('path', { d: 'M660,1064 L560,1250', stroke: '#3c3446', 'stroke-width': 4, fill: 'none' }, sl);
  /* sandbox under a net, with its low concrete edge */
  const sb = el('g', null, yard.g);
  el('path', { d: 'M440,1300 L860,1300 L900,1392 L400,1392 Z', fill: '#1c1a20' }, sb);
  for (let k = 0; k < 14; k++) el('line', { x1: 440 + k * 30, y1: 1300, x2: 400 + k * 36, y2: 1392, stroke: '#2a2a34', 'stroke-width': 2 }, sb);
  for (let k = 0; k < 4; k++) el('line', { x1: 430 - k * 8, y1: 1320 + k * 20, x2: 868 + k * 8, y2: 1320 + k * 20, stroke: '#2a2a34', 'stroke-width': 2 }, sb);
  el('rect', { x: 390, y: 1390, width: 520, height: 26, fill: '#2a2d38' }, sb);
  el('rect', { x: 390, y: 1390, width: 520, height: 4, fill: '#454a5c' }, sb);
  /* bench under the lamp */
  const bench = el('g', null, yard.g);
  el('rect', { x: 110, y: 1350, width: 230, height: 12, rx: 2, fill: '#2a2026' }, bench);
  el('rect', { x: 110, y: 1318, width: 230, height: 9, rx: 2, fill: '#2a2026' }, bench);
  for (const bx of [128, 312]) el('rect', { x: bx, y: 1362, width: 8, height: 50, fill: '#181820' }, bench);
  const lamp = lampPost(yard, 300, 1360, 470, { r: 560 });
  /* vending machine (right corner) */
  const vm = el('g', null, yard.g);
  el('rect', { x: 870, y: 1110, width: 96, height: 220, rx: 4, fill: '#10121a' }, vm);
  el('rect', { x: 878, y: 1118, width: 80, height: 170, fill: VEND }, vm);
  const rnd2 = mulberry(4); for (let r = 0; r < 4; r++) for (let k = 0; k < 5; k++) el('rect', { x: 884 + k * 15, y: 1130 + r * 34, width: 10, height: 20, rx: 3, fill: ['#e84a4a', '#4a8ae8', '#f0c040', '#6ac06a', '#f4f4f4'][Math.floor(rnd2() * 5)] }, vm);
  el('rect', { x: 884, y: 1296, width: 68, height: 16, fill: '#262a36' }, vm);
  glow(vm, yard.defs, 918, 1210, 240, VEND, .3);
  /* bushes and the passage by the brick corner */
  for (const [bx, by, r] of [[-360, 1300, 110], [40, 1296, 90], [1080, 1320, 140]]) el('ellipse', { cx: bx, cy: by, rx: r, ry: r * .45, fill: '#0a0d14' }, yard.g);
  /* foreground: a low fence rail framing the bottom */
  el('rect', { x: -900, y: 1560, width: 2800, height: 400, fill: '#05060a' }, fg.g);
  for (let fx = -880; fx < 1900; fx += 70) el('rect', { x: fx, y: 1500, width: 10, height: 80, fill: '#05060a' }, fg.g);
  el('rect', { x: -900, y: 1508, width: 2800, height: 8, fill: '#05060a' }, fg.g);
  /* the two of them */
  const hinata = figure(chars.g, chars.defs, 'hinata', { x: -120, ground: 1450, s: .62, f: 1, rim: '#ffd6a8', rimOff: [-4, -3], pose: 'walkA' });
  const girl = figure(chars.g, chars.defs, 'tsukiko', { x: 650, seat: 1392, s: .62, f: -1, rim: LAMP_RIM, rimOff: [-3, -3], pose: 'hug' });
  girl.emo('down');
  const onigiri = el('g', { opacity: 0, transform: 'translate(570,1386) scale(1.2)' }, chars.g); HELD.onigiri(onigiri);
  const kairo = el('g', { opacity: 0, transform: 'translate(596,1388)' }, chars.g); HELD.kairo(kairo);
  const beam = el('path', { d: '', fill: lin(chars.defs, [[0, '#c89bff', .75], [1, '#8a5aff', 0]], { x1: 0, y1: 0, x2: 1, y2: 0 }), opacity: 0, style: 'mix-blend-mode:screen' }, chars.g);
  return {
    fx: { dust: { x0: 60, x1: 560, y0: 380, y1: 1380, n: 30, c: '228,244,214' } },
    snd: { wind: .6, hum: 1, store: 0, pad: 'night', heart: false },
    cam: { x: -120, y: 120, z: 1.3 },
    h: { hinata, girl, onigiri, kairo, beam, balcony, lamp },
    breathe: [hinata],
    /* the rim light sits on the side that faces the lamp */
    update(dt, t) { if (this.tick) this.tick(dt, t); for (const f of [hinata, girl]) { f.st.rimOff[0] = clamp((352 - f.st.x) / 50, -1, 1) * 4; f.step(t); } }
  };
}

/* --- a quiet street of flats; she walks from Aoi's --- */
function sceneStreet() {
  const skyL = layer(0), far = layer(.25), near = layer(.6), chars = layer(1);
  sky(skyL, { seed: 9 });
  let x = -900; const rnd = mulberry(21);
  while (x < 2000) { const w = 240 + rnd() * 220; block(far, x, 1180, w, 360 + rnd() * 260, { seed: x | 0, lit: .14, tv: .12 }); x += w + 30; }
  x = -800;
  while (x < 2900) { const w = 320 + rnd() * 200; block(near, x, 1300, w, 300 + rnd() * 200, { seed: (x | 0) + 5, lit: .1, tv: .14, c: NIGHT.mid }); x += w + 60; }
  el('rect', { x: -900, y: 1300, width: 4000, height: 700, fill: '#10131c' }, near.g);
  el('rect', { x: -900, y: 1300, width: 4000, height: 6, fill: '#1c2232' }, near.g);
  for (let lx = -200; lx < 3400; lx += 620) lampPost(chars, lx, 1440, 400, { r: 380, c: '#ffd9a0', buzz: false });
  el('rect', { x: -900, y: 1440, width: 4400, height: 600, fill: '#141824' }, chars.g);
  const hinata = figure(chars.g, chars.defs, 'hinata', { x: 120, ground: 1440, s: .6, f: 1, rim: '#ffd9a0', rimOff: [-4, -3], pose: 'walkA' });
  hinata.cycle('walkA', 'walkB', 1000);
  hinata.hold('F', HELD.bag);
  let walking = true;
  return {
    fx: {}, snd: { wind: .5, hum: 0, store: 0, pad: 'night' }, cam: { x: -260, y: 260, z: 1.25 },
    h: { hinata }, breathe: [hinata], puffDir: -1.6,
    /* a tracking shot: the camera keeps her a little left of centre */
    update(dt, t) {
      if (walking) { hinata.st.x += dt * 105; if (hinata.st.x > 2700) { walking = false; hinata.pose('standBag', 500); } }
      hinata.step(t);
      cam.x = hinata.st.x - 380;
    }
  };
}

/* --- the konbini from the street: a white window, «24H», light on the pavement --- */
function sceneKonbini() {
  const skyL = layer(0), near = layer(.6), chars = layer(1);
  sky(skyL, { seed: 13 });
  block(near, -300, 900, 700, 500, { seed: 4, lit: .1, tv: .1 }); block(near, 820, 900, 600, 560, { seed: 8, lit: .1, tv: .1 });
  const s = el('g', null, chars.g);
  el('rect', { x: 60, y: 760, width: 780, height: 560, fill: '#161a26' }, s);
  el('rect', { x: 60, y: 760, width: 780, height: 90, fill: '#0e1018' }, s);
  el('text', { x: 450, y: 830, 'text-anchor': 'middle', 'font-family': '"Russo One", "Arial Black", sans-serif', 'font-size': 64, fill: '#8af0b0', style: 'filter: drop-shadow(0 0 10px #5ae090)' }, s).textContent = '24H';
  for (let k = 0; k < 26; k++) el('rect', { x: 60 + k * 30, y: 852, width: 30, height: 16, fill: k % 2 ? '#f4f4f4' : '#2aa860' }, s);
  el('rect', { x: 90, y: 880, width: 720, height: 420, fill: lin(chars.defs, [[0, '#f4f8fb'], [1, '#d8e6ee']]) }, s);
  const rnd = mulberry(6);
  for (let r = 0; r < 5; r++) for (let k = 0; k < 34; k++) el('rect', { x: 100 + k * 21, y: 900 + r * 70, width: 14, height: 40, rx: 3, fill: ['#e84a4a', '#4a8ae8', '#f0c040', '#6ac06a', '#e070b0', '#f4f4f4'][Math.floor(rnd() * 6)], opacity: .85 }, s);
  el('rect', { x: 380, y: 880, width: 140, height: 420, fill: '#e6f0f6', opacity: .6 }, s);
  el('rect', { x: 448, y: 880, width: 4, height: 420, fill: '#9aa8b4' }, s);
  el('rect', { x: -900, y: 1300, width: 2700, height: 700, fill: '#12151e' }, chars.g);
  el('ellipse', { cx: 450, cy: 1360, rx: 560, ry: 110, fill: rad(chars.defs, [[0, '#eaf4ff', .45], [1, '#eaf4ff', 0]]) }, chars.g);
  const hinata = figure(chars.g, chars.defs, 'hinata', { x: 120, ground: 1400, s: .7, f: 1, rim: '#ffffff', rimOff: [5, -3], pose: 'walkA' });
  hinata.cycle('walkA', 'walkB', 1100);
  return {
    fx: {}, snd: { wind: .4, hum: .3, store: .3, pad: 'night' }, cam: { x: 0, y: 150, z: 1.1 },
    h: { hinata }, breathe: [hinata],
    update(dt, t) { if (hinata.st.x < 400) hinata.st.x += dt * 60; else if (!this._stop) { this._stop = 1; hinata.pose('stand', 400); } hinata.step(t); }
  };
}

/* --- inside the konbini: white light, a sleepy student at the till --- */
function sceneCounter(kind = 'first') {
  const back = layer(.4), chars = layer(1);
  el('rect', { x: -600, y: -600, width: 2100, height: 2800, fill: lin(back.defs, [[0, '#eef4f8'], [1, '#d4e0e8']]) }, back.g);
  const rnd = mulberry(8);
  for (let r = 0; r < 7; r++) { el('rect', { x: -300, y: 380 + r * 120, width: 1500, height: 8, fill: '#a8b6c0' }, back.g); for (let k = 0; k < 60; k++) el('rect', { x: -290 + k * 25, y: 320 + r * 120, width: 16, height: 56, rx: 3, fill: ['#e84a4a', '#4a8ae8', '#f0c040', '#6ac06a', '#e070b0', '#f4f4f4'][Math.floor(rnd() * 6)], opacity: .8 }, back.g); }
  const cashier = figure(chars.g, chars.defs, 'hinata', { x: 620, ground: 1500, s: .66, f: -1, rim: '#ffffff', rimOff: [4, -3], pose: 'stand' });
  cashier.ink.hs.querySelectorAll('path')[0] && cashier.ink.hs.setAttribute('class', 'nod'); cashier.rim.hs.setAttribute('class', 'nod');
  cashier.ink.eyes.setAttribute('data-emo', 'closed');
  for (const C of [cashier.ink, cashier.rim]) { const p = C.hs.querySelector('.sway'); if (p) p.remove(); }
  el('rect', { x: -400, y: 1270, width: 1700, height: 600, fill: '#2a3440' }, chars.g);
  el('rect', { x: -400, y: 1270, width: 1700, height: 10, fill: '#8a9aa8' }, chars.g);
  const items = el('g', null, chars.g);
  let fx = {};
  if (kind === 'first') {
    el('rect', { x: 300, y: 1206, width: 70, height: 64, rx: 6, fill: '#f0c080', opacity: .9 }, items);
    el('ellipse', { cx: 335, cy: 1236, rx: 26, ry: 20, fill: '#fbf6ea' }, items);
    const can = el('g', { transform: 'translate(410,1234) scale(1.4)' }, items); HELD.can(can);
    const oni = el('g', { transform: 'translate(470,1254) scale(1.3)' }, items); HELD.onigiri(oni);
    fx = { steam: { at: () => project(335, 1212, 1), rate: 4, w: 10 } };
  } else {
    /* the second run: a pack of kairo, one more hot can, coins on the counter */
    for (const [x, y, r] of [[300, 1244, -8], [336, 1250, 6]]) { const k = el('g', { transform: `translate(${x},${y}) rotate(${r}) scale(1.6)` }, items); HELD.kairo(k); }
    const can = el('g', { transform: 'translate(420,1234) scale(1.4)' }, items); HELD.can(can);
    for (const [x, y] of [[470, 1266], [486, 1262], [500, 1267], [478, 1256]]) el('ellipse', { cx: x, cy: y, rx: 8, ry: 3.5, fill: '#e8c860' }, items);
  }
  const hinata = figure(chars.g, chars.defs, 'hinata', { x: kind === 'first' ? 170 : 200, ground: 1640, s: .82, f: 1, rim: '#ffffff', rimOff: [5, -3], pose: kind === 'first' ? 'stand' : 'rush' });
  return {
    fx, snd: { wind: 0, hum: .2, store: 1, pad: 'store' }, cam: { x: 0, y: 150, z: 1.05 },
    h: { hinata, cashier }, breathe: [],
    update(dt, t) { hinata.step(t); cashier.step(t); }
  };
}
