/* Part D: places. Each place draws a background into the panel buffer; p.v picks the view, lights go to p._lights. */
(function (G) {
'use strict';
const { col, mix, bayer, dither, vgrad, spansPoly, spansEll } = G.PX;
const { PROP, BACK } = G.ART;
const rng = G.PX.rng;

/* ---------- building blocks ---------- */
function planks(b, y0, c1, c2, vx) {
  b.rect(0, y0, b.w, b.h - y0, c1);
  const c = col(c2), cx = vx ?? b.w / 2;
  for (let i = -12; i <= 12; i++) b.line(cx + i * 9, y0, cx + i * 30, b.h + 20, c);
}
function win(b, x, y, w, h, o = {}) {
  b.rect(x - 2, y - 2, w + 4, h + 4, o.frame || '#b8ad98');
  b.rect(x, y, w, h, vgrad(o.sky || [[0, '#9cc8f0'], [1, '#e4f2fb']], y, y + h));
  if (o.trees) { const rnd = rng(o.seed || 4); for (let i = 0; i < 6; i++) { const tx = x + rnd() * w, ty = y + h * (.6 + rnd() * .2), r = 5 + rnd() * 7; b.ell(tx, ty, r, r * .8, rnd() < .5 ? '#7fb06a' : '#5e9a54'); } b.rect(x, y + h * .82, w, h * .18, '#c8b48a'); }
  if (o.rain) { const rnd = rng(9); for (let i = 0; i < w * h / 18; i++) { const rx = x + rnd() * w, ry = y + rnd() * h; b.line(rx, ry, rx - 1, ry + 3, '#b8c8e0'); } }
  const f = col(o.frame || '#b8ad98');
  b.rect(x + Math.round(w / 2) - 1, y, 2, h, f);
  if (o.mid !== false) b.rect(x, y + Math.round(h * .45), w, 2, f);
}
function curtain(b, x, y, w, h, c, d) { b.shape(fn => spansPoly([[x, y], [x + w, y], [x + w * .8, y + h], [x + w * .1, y + h]], fn), c, null); for (let k = 1; k < 4; k++) b.line(x + k * w / 4, y, x + k * w / 4 - 1, y + h, d); }
function desk(b, x, y, w, o = {}) {
  const top = col(o.top || '#d8b27a'), side = col(o.side || '#a8845a'), metal = col('#6a6e78');
  b.rect(x, y, w, 3, top); b.rect(x, y + 3, w, 2, side);
  b.rect(x + 2, y + 5, 1, o.leg || 12, metal); b.rect(x + w - 3, y + 5, 1, o.leg || 12, metal);
}
function sunbeam(b, x0, x1, k = .18) {
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    const u = x - (x0 + (x1 - x0) * y / b.h);
    if (u > 0 && u < 26 && bayer(x, y) < k) { const p = b.get(x, y); if (p) b.px(x, y, mix(p, '#fff4d0', .35)); }
  }
}
function buildings(b, yBase, o = {}) {
  const rnd = rng(o.seed || 21); let x = -4;
  while (x < b.w) {
    const w = 12 + rnd() * 22, h = 18 + rnd() * (o.tall || 40), c = o.c || (rnd() < .5 ? '#7a8294' : '#8a90a0');
    b.rect(x, yBase - h, w, h, c);
    const lit = col(o.lit || '#ffe2a0'), dark = col(o.win || mix(c, '#000000', .25));
    for (let wy = yBase - h + 3; wy < yBase - 3; wy += 5) for (let wx = x + 2; wx < x + w - 2; wx += 4) {
      const on = rnd() < (o.litK || 0);
      b.px(Math.round(wx), Math.round(wy), on ? lit : dark); b.px(Math.round(wx) + 1, Math.round(wy), on ? lit : dark);
      if (on && o.emisWin) b.emis.push(bb => { bb.px(Math.round(wx), Math.round(wy), lit); bb.px(Math.round(wx) + 1, Math.round(wy), lit); });
    }
    x += w + (rnd() < .3 ? 2 : 0);
  }
}
function river(b, y0, y1, o = {}) {
  b.rect(0, y0, b.w, y1 - y0, vgrad(o.stops || [[0, '#5a6a6a'], [1, '#3a4848']], y0, y1));
  const rnd = rng(o.seed || 12), c = col(o.glint || '#8a9a98');
  for (let i = 0; i < b.w * (y1 - y0) / 40; i++) { const x = rnd() * b.w, y = y0 + rnd() * (y1 - y0); b.rect(x, y, 3 + rnd() * 6, 1, c); }
}
function railing(b, x0, x1, y, h, c, o = {}) {
  const cc = col(c);
  b.rect(x0, y, x1 - x0, 1, cc); b.rect(x0, y + Math.round(h * .5), x1 - x0, 1, cc);
  for (let x = x0; x < x1; x += (o.step || 6)) b.rect(x, y, 1, h, cc);
  if (o.rust) for (let x = x0; x < x1; x += 3) if (bayer(x, y) < .4) b.px(x, y, col(o.rust));
}
function lamp(b, p, x, y, h, o = {}) {
  const pole = col(o.pole || '#3a3e4a');
  b.rect(x, y - h, 1, h, pole); b.rect(x - (o.arm ? 5 : 0), y - h, o.arm ? 6 : 1, 1, pole);
  const lx = x - (o.arm ? 5 : 0), ly = y - h + 2, c = o.c || '#fff0c0';
  b.emis.push(bb => { bb.rect(lx - 1, ly - 1, 3, 2, c); });
  (p._lights = p._lights || []).push({ x: lx, y: ly + 4, r: o.r || 46, ry: (o.r || 46) * 1.1, c, k: o.k ?? .9, bands: 4 });
}
function reeds(b, x0, x1, y, c, seed) { const rnd = rng(seed || 5), cc = col(c); for (let x = x0; x < x1; x++) { const h = 3 + rnd() * 10; b.line(x, y, x + (rnd() - .5) * 3, y - h, cc); } }
function tape(b, x0, y0, x1, y1) { for (let i = 0; i <= Math.abs(x1 - x0); i++) { const t = i / Math.abs(x1 - x0 || 1), x = Math.round(x0 + (x1 - x0) * t), y = Math.round(y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 3); b.px(x, y, col((i >> 1) % 2 ? '#1a1a1a' : '#f2d22a')); b.px(x, y + 1, col((i >> 1) % 2 ? '#1a1a1a' : '#f2d22a')); } }
function puddles(b, y0, y1, seed, glint) { const rnd = rng(seed || 3); for (let i = 0; i < 6; i++) { const x = rnd() * b.w, y = y0 + rnd() * (y1 - y0), w = 8 + rnd() * 18; b.ell(x, y, w / 2, 1.5 + rnd() * 1.5, dither('#1a2032', glint || '#3a4a6a', .35)); } }

/* ---------- places ---------- */
const PLACE = {
  /* школьный класс: жарко, окна открыты, пыль в луче */
  classroom(b, p) {
    const v = p.v || 'wide';
    if (v === 'window') return BACK.window(b, p);
    if (v === 'board') {
      b.fill('#e9dfc8'); b.rect(10, 12, b.w - 20, Math.round(b.h * .5), '#2f4a3a'); b.rect(8, 10, b.w - 16, 2, '#8a6a44');
      const rnd = rng(8); for (let i = 0; i < 14; i++) b.rect(18 + rnd() * (b.w - 50), 18 + rnd() * (b.h * .4), 6 + rnd() * 18, 1, '#cfe0d4');
      b.rect(b.w - 30, 2, 10, 8, '#f4f4f4'); b.ell(b.w - 25, 6, 3, 3, '#ffffff');
      planks(b, Math.round(b.h * .72), '#b88a5a', '#9a7048');
      return;
    }
    if (v === 'desk') { b.fill(vgrad([[0, '#fbe9c4'], [1, '#e2c592']], 0, b.h)); win(b, 12, 4, 60, Math.round(b.h * .55), { trees: 1 }); win(b, 88, 4, 60, Math.round(b.h * .55), { trees: 1, seed: 6 }); curtain(b, 66, 2, 20, b.h * .62, '#f4efe4', '#dcd4c4'); b.rect(0, Math.round(b.h * .62), b.w, b.h, '#d8b27a'); b.rect(0, Math.round(b.h * .62), b.w, 2, '#b88f5c'); sunbeam(b, 40, 10, .2); return; }
    /* wide */
    b.fill(vgrad([[0, '#f3e6c8'], [1, '#e2cfa6']], 0, b.h));
    const wy = 8, wh = Math.round(b.h * .45);
    for (const x of [6, 58, 110]) win(b, x, wy, 44, wh, { trees: 1, seed: x });
    curtain(b, 50, 6, 10, wh + 6, '#f6f0e2', '#dcd2bc'); curtain(b, 102, 6, 10, wh + 6, '#f6f0e2', '#dcd2bc');
    planks(b, Math.round(b.h * .7), '#c49a66', '#a67c4c');
    for (const [x, y] of [[8, .66], [60, .64], [112, .66]]) desk(b, x, Math.round(b.h * y), 40, { leg: 14 });
    sunbeam(b, 70, 20, .22);
  },
  cafeteria(b, p) {
    b.fill(vgrad([[0, '#e6e2d6'], [1, '#cfc8b6']], 0, b.h));
    const tx = Math.round(b.w * .5 - 34), ty = 8;
    b.rect(tx - 3, ty - 3, 74, 50, '#26262e'); b.rect(tx, ty, 68, 44, '#3a5a8a');
    b.rect(tx, ty + 30, 68, 10, '#c0283c');
    b.rect(tx + 10, ty + 6, 26, 20, '#6a8a6a'); b.rect(tx + 12, ty + 18, 22, 6, '#4a6a8a');
    b.rect(tx + 30, ty - 12, 2, 9, '#26262e');
    b.emis.push(bb => { bb.rect(tx + 44, ty + 6, 18, 18, '#e8eef8'); bb.ell(tx + 53, ty + 13, 4, 4, '#c8b0a0'); bb.rect(tx + 49, ty + 18, 9, 6, '#2a2a3a'); });
    planks(b, Math.round(b.h * .78), '#b8b0a0', '#a0988a');
  },
  street(b, p) { // a residential street toward the river; late afternoon
    const v = p.v || 'fork';
    b.fill(vgrad([[0, '#f0c8a0'], [.5, '#f4dcc0'], [1, '#e8d8c8']], 0, b.h * .6));
    buildings(b, Math.round(b.h * .62), { seed: 31, c: '#c4a898', tall: 50 });
    b.rect(0, Math.round(b.h * .62), b.w, b.h, '#8a8a92');
    b.rect(0, Math.round(b.h * .62), b.w, 2, '#b8b0a4');
    for (let x = 4; x < b.w; x += 26) b.rect(x, Math.round(b.h * .8), 12, 1, '#e8e4dc');
    if (v === 'fork') { b.rect(96, Math.round(b.h * .5), 64, 3, '#6a5a50'); railing(b, 96, 160, Math.round(b.h * .46), 6, '#5a4a44'); }
    lamp(b, p, 30, Math.round(b.h * .62), 44, { arm: 1, r: 30, k: .2 });
  },
  embankment(b, p) { // набережная: река, столбы с листовками, лента у спуска, лавочка
    const t = p.t || 'eve', rain = t === 'rain';
    const skyS = rain ? [[0, '#1a2034'], [1, '#2e3650']] : [[0, '#e8b48a'], [.6, '#f2d2aa'], [1, '#d8c8b8']];
    const hz = Math.round(b.h * (p.hz ?? .38));
    b.rect(0, 0, b.w, hz, vgrad(skyS, 0, hz));
    buildings(b, hz, { seed: 17, c: rain ? '#232a3c' : '#9a8a90', tall: 30, litK: rain ? .35 : .05, emisWin: rain, lit: '#ffd88a' });
    river(b, hz, hz + Math.round(b.h * .16), rain ? { stops: [[0, '#1a2436'], [1, '#141c2c']], glint: '#3e4c6a' } : {});
    const wy = hz + Math.round(b.h * .16);
    b.rect(0, wy, b.w, 3, rain ? '#3a4050' : '#9a948a');
    railing(b, 0, b.w, wy - 8, 8, rain ? '#4a4e5a' : '#6a625a', { step: 8 });
    b.rect(0, wy + 3, b.w, b.h - wy, rain ? '#2a3040' : '#b0a898');
    for (let x = 0; x < b.w; x += 20) b.rect(x, wy + 3, 1, b.h, col(rain ? '#242a38' : '#a09888'));
    if (rain) puddles(b, wy + 8, b.h - 4, 7, '#6a7aa4');
    if (p.posts !== false) for (const x of (p.postX || [24, 118])) {
      b.rect(x, wy - 36, 5, 40, rain ? '#4a4e5c' : '#c8c2b6'); b.rect(x + 5, wy - 36, 1, 40, rain ? '#3a3e4a' : '#a8a296');
      if (!rain) PROP.poster(b, x + 2.5, wy - 16, 14);
    }
    if (p.tape) tape(b, p.tape[0], wy - 4, p.tape[1], wy - 2);
    if (p.bench) { const bx = p.bench; b.rect(bx, wy + 14, 34, 3, '#8a5a3a'); b.rect(bx, wy + 9, 34, 2, '#8a5a3a'); b.rect(bx + 3, wy + 17, 2, 6, '#3a3a40'); b.rect(bx + 29, wy + 17, 2, 6, '#3a3a40'); }
    if (p.stairs) { const sx = p.stairs; for (let k = 0; k < 5; k++) b.rect(sx + k * 2, wy - 2 + k * 3, 26 - k * 4, 2, rain ? '#3a4050' : '#a8a092'); }
    if (rain || t === 'night') for (const x of (p.lampX || [60, 140])) lamp(b, p, x, wy + 4, 40, { arm: 1, r: 52, c: '#ffe8b0', k: 1 });
  },
  bridge(b, p) { // старый пешеходный мост сбоку: настил над водой, ржавые перила, опора в граффити, глухая тень под настилом
    const rain = p.t === 'rain', H = b.h;
    b.fill(vgrad(rain ? [[0, '#0e1222'], [1, '#1e2438']] : [[0, '#dca07a'], [1, '#f0d2b0']], 0, H * .5));
    buildings(b, Math.round(H * .34), { seed: 23, c: rain ? '#1c2234' : '#a08a8c', tall: 22, litK: rain ? .3 : 0, emisWin: rain });
    river(b, Math.round(H * .34), H, rain ? { stops: [[0, '#141a28'], [1, '#0a0e16']], glint: '#34405a' } : { stops: [[0, '#6a7470'], [1, '#3e4846']] });
    const dy = Math.round(H * (p.deck ?? .44));
    for (let x = 0; x < b.w; x++) for (let y = dy + 6; y < dy + 26; y++) { const k = 1 - (y - dy - 6) / 20; if (bayer(x, y) < k * .9) b.px(x, y, col(rain ? '#05060a' : '#1c1a20')); }
    b.rect(0, dy, b.w, 6, rain ? '#2e323e' : '#6a625a'); b.rect(0, dy + 5, b.w, 1, rain ? '#1a1c24' : '#4a443e');
    railing(b, 0, b.w, dy - 9, 9, rain ? '#6a4a3a' : '#7a4a30', { step: 5, rust: '#a0582a' });
    const px0 = Math.round(b.w * .56);
    b.rect(px0, dy + 6, 18, H - dy, rain ? '#383c48' : '#76726a'); b.rect(px0 + 14, dy + 6, 4, H - dy, rain ? '#2a2e38' : '#5e5a54');
    const rnd = rng(3); for (let i = 0; i < 22; i++) b.px(px0 + 2 + Math.round(rnd() * 12), dy + 12 + Math.round(rnd() * (H - dy - 20)), col(['#c0402a', '#4a8ac0', '#e0c040', '#e070a0'][i % 4]));
    for (let k = 0; k < 7; k++) b.rect(4 + k * 5, dy - 1 + k * 4, 8, 2, rain ? '#3a404e' : '#9a9084');
    reeds(b, 0, b.w, H - 1, rain ? '#1a2418' : '#4a5a30', 9);
    if (rain) lamp(b, p, 16, dy, 30, { arm: 0, r: 54, c: '#ffe8b0' });
  },
  bridgeStairs(b, p) { // ступени на мост в дождь, перила, чернота внизу
    b.fill(vgrad([[0, '#0e1220'], [1, '#1a2032']], 0, b.h));
    for (let k = 0; k < 9; k++) { const y = b.h - 10 - k * 9, x = 30 + k * 7; b.rect(x, y, b.w, 3, '#3a404e'); b.rect(x, y + 3, b.w, 6, '#262a36'); }
    for (let k = 0; k < 9; k++) b.rect(24 + k * 7, b.h - 26 - k * 9, 2, 18, '#7a4a34');
    b.line(22, b.h - 28, 88, b.h - 110, '#9a5a3a'); b.line(22, b.h - 27, 88, b.h - 109, '#6a3a24');
    b.rect(0, b.h - 20, 30, 20, '#050608');
    lamp(b, p, 120, 30, 26, { r: 60, c: '#ffe8b0' });
  },
  genkan(b, p) { // прихожая дома Кирю: тёплый свет, дерево, стойка с боккэнами
    b.fill(vgrad([[0, '#6a4a30'], [1, '#4a3220']], 0, b.h));
    b.rect(0, Math.round(b.h * .72), b.w, b.h, '#2e2a28'); b.rect(0, Math.round(b.h * .72), b.w, 3, '#8a6a4a');
    for (let x = 0; x < b.w; x += 16) b.rect(x, 0, 1, Math.round(b.h * .72), '#5a3e28');
    if (p.rack !== false) { b.rect(120, Math.round(b.h * .3), 24, 3, '#3a2a1a'); for (let k = 0; k < 3; k++) PROP.bokken(b, 124 + k * 7, Math.round(b.h * .7), b.h * .45, -1.5); }
    (p._lights = p._lights || []).push({ x: b.w * .5, y: -10, r: 160, c: '#ffcf8a', k: .35 });
  },
  dojo(b, p) {
    b.fill(vgrad([[0, '#3a2c20'], [1, '#2a1e16']], 0, b.h));
    for (let x = 0; x < b.w; x += 26) b.rect(x, 0, 3, Math.round(b.h * .62), '#241810');
    b.rect(0, Math.round(b.h * .62), b.w, b.h, '#8a6a44'); for (let y = Math.round(b.h * .62); y < b.h; y += 6) b.rect(0, y, b.w, 1, '#6a4e30');
    if (p.rack !== false) { b.rect(8, Math.round(b.h * .2), 30, 2, '#1a120c'); for (let k = 0; k < 4; k++) PROP.bokken(b, 12 + k * 7, Math.round(b.h * .58), b.h * .38, -1.5); }
  },
  aoiRoom(b, p) { // маленькая чистая квартира, серое небо, низкий столик
    const v = p.v || 'table';
    b.fill(vgrad([[0, '#e8e4dc'], [1, '#d6d0c4']], 0, b.h));
    if (v !== 'door') {
      win(b, 92, 6, 56, Math.round(b.h * .42), { sky: p.t === 'rain' ? [[0, '#5a6278'], [1, '#7a8298']] : [[0, '#8a909c'], [1, '#b8bcc4']], mid: false, frame: '#d8d4cc', rain: p.t === 'rain' });
      curtain(b, 84, 4, 10, Math.round(b.h * .46), '#c8d8e0', '#a8bcc8');
      b.rect(8, Math.round(b.h * .18), 40, 3, '#c8a878'); b.rect(8, Math.round(b.h * .38), 40, 3, '#c8a878');
      for (let k = 0; k < 6; k++) b.rect(10 + k * 6, Math.round(b.h * .38) - 12, 5, 12, ['#c05a4a', '#4a7ac0', '#e8c060', '#6aa86a'][k % 4]);
      if (p.photo) PROP.frame(b, 30, Math.round(b.h * .18), 14);
      b.rect(0, Math.round(b.h * .64), b.w, b.h, '#cdb894'); for (let y = Math.round(b.h * .64); y < b.h; y += 7) b.rect(0, y, b.w, 1, '#b8a27c');
      if (v === 'table') { b.rect(20, Math.round(b.h * .74), 120, 5, '#9a6a44'); b.rect(26, Math.round(b.h * .74) + 5, 3, 10, '#6a4a2e'); b.rect(131, Math.round(b.h * .74) + 5, 3, 10, '#6a4a2e'); }
    } else {
      b.rect(50, 8, 60, b.h - 8, '#9a8a78'); b.rect(54, 12, 52, b.h - 12, '#b0a08c');
      b.rect(96, Math.round(b.h * .45), 4, 8, '#d0c8b8'); b.line(98, Math.round(b.h * .38), 104, Math.round(b.h * .5), '#c8c8d0');
      b.rect(0, Math.round(b.h * .86), b.w, b.h, '#7a6a5a');
    }
    (p._lights = p._lights || []).push({ x: 120, y: 20, r: 120, c: '#e8eef8', k: .15 });
  },
  kitchen(b, p) {
    b.fill(vgrad([[0, '#efe6d4'], [1, '#dccfb4']], 0, b.h));
    b.rect(0, Math.round(b.h * .55), b.w, 4, '#c8b89c'); b.rect(0, Math.round(b.h * .55) + 4, b.w, b.h, '#a88a64');
    b.rect(106, 8, 40, Math.round(b.h * .47), '#f4f4f0'); b.rect(146, 8, 2, Math.round(b.h * .47), '#c8c8c8');
    if (p.note) { b.rect(112, 18, 14, 10, '#fffbe0'); b.px(118, 16, col('#e84a3a')); }
    PROP.riceCooker(b, 40, Math.round(b.h * .55), 16);
  },
  stairwell(b, p) {
    b.fill(vgrad([[0, '#6a6a72'], [1, '#4a4a54']], 0, b.h));
    b.rect(0, Math.round(b.h * .8), b.w, b.h, '#3a3a42');
    b.rect(20, 10, 44, Math.round(b.h * .8) - 10, '#8a7e6e'); b.rect(24, 14, 36, Math.round(b.h * .8) - 14, '#9a8e7c');
    b.px(56, Math.round(b.h * .5), col('#d8d0c0'));
    lamp(b, p, 110, 12, 4, { r: 70, c: '#fff4d8', k: .5 });
  }
};

G.PLACE = PLACE;
G.PLACEKIT = { planks, win, curtain, desk, sunbeam, buildings, river, railing, lamp, reeds, tape, puddles };
})(window);
