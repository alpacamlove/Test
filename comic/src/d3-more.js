/* Part D3: places and props for chapters 2–5. */
(function (G) {
'use strict';
const { col, mix, bayer, dither, vgrad, spansPoly, spansEll } = G.PX;
const { PROP, BACK } = G.ART;
const K = G.PLACEKIT, CITY = G.CITY, N = CITY.N;
const rng = G.PX.rng;
const INK = '#16121c';
const rectS = (x, y, w, h) => fn => spansPoly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], fn);
const ellS = (cx, cy, rx, ry) => fn => spansEll(cx, cy, rx, ry, fn);

/* ---------- extra props ---------- */
Object.assign(PROP, {
  socks(b, x, y, s) { b.shape(ellS(x, y - s * .4, s * .6, s * .4), '#9a9aa4', INK, { shade: [1, 1, '#72727c'] }); b.line(x - s * .4, y - s * .45, x + s * .4, y - s * .35, '#b8b8c2'); },
  gloves(b, x, y, s) { b.shape(ellS(x, y - s * .45, s * .45, s * .5), '#8a3a44', INK, { shade: [1, 1, '#62262e'] }); b.rect(x - s * .1, y - s * .95, s * .2, s * .3, '#8a3a44'); b.rect(x - s * .08, y - s * .9, s * .16, s * .12, '#d8a0a8'); },
  cake(b, x, y, s) { b.shape(rectS(x - s * .6, y - s * .55, s * 1.2, s * .55), '#fbf2e4', INK, { shade: [1, 1, '#e0d0b8'] }); b.rect(x - s * .6, y - s * .38, s * 1.2, s * .08, '#e8506a'); for (let k = -2; k <= 2; k++) { b.rect(x + k * s * .22, y - s * .8, 1, s * .25, '#8ac8f0'); b.emis.push(bb => bb.px(Math.round(x + k * s * .22), Math.round(y - s * .84), col('#ffd060'))); } },
  takoyaki(b, x, y, s) { b.shape(rectS(x - s * .6, y - s * .2, s * 1.2, s * .2), '#f4f0e0', INK); for (let k = 0; k < 4; k++) b.shape(ellS(x - s * .42 + k * s * .28, y - s * .3, s * .14, s * .12), '#c8843a', INK); },
  ramen(b, x, y, s) { b.shape(fn => { spansEll(x, y - s * .25, s * .6, s * .25, fn); }, '#f4f4f0', INK); b.ell(x, y - s * .38, s * .5, s * .12, '#e8b060'); b.ell(x + s * .2, y - s * .4, s * .1, s * .06, '#fff6c8'); },
  workbook(b, x, y, s) { b.shape(rectS(x - s * .7, y - s * .5, s * 1.4, s * .5), '#f8f6ee', INK); b.rect(x - s * .02, y - s * .5, 1, s * .5, '#c8c4b8'); for (let k = 0; k < 4; k++) { b.rect(x - s * .6, y - s * .4 + k * s * .1, s * .5, 1, '#9a98a8'); b.rect(x + s * .1, y - s * .4 + k * s * .1, s * .5, 1, '#9a98a8'); } b.line(x - s * .5, y - s * .15, x - s * .2, y - s * .35, '#6a6a7a'); },
  coin(b, x, y, s) { b.shape(ellS(x, y, s * .5, s * .5), '#d8dce4', INK); b.px(Math.round(x), Math.round(y), col('#9aa0ac')); },
  newspaper(b, x, y, s) { b.shape(rectS(x - s * .7, y - s, s * 1.4, s), '#e8e4d8', INK); for (let k = 0; k < 6; k++) b.rect(x - s * .6, y - s * .85 + k * s * .14, s * 1.2, 1, '#9a968c'); b.rect(x - s * .6, y - s * .95, s * .7, s * .12, '#3a3a3a'); },
  boots(b, x, y, s) { for (const dx of [-.35, .35]) b.shape(fn => spansPoly([[x + dx * s - s * .2, y - s * .7], [x + dx * s + s * .15, y - s * .7], [x + dx * s + s * .18, y - s * .2], [x + dx * s + s * .4, y - s * .15], [x + dx * s + s * .4, y], [x + dx * s - s * .2, y]], fn), '#2a2420', INK, { shade: [0, 1, '#1a1612'] }); },
  bowl(b, x, y, s, o = {}) { b.shape(fn => { spansEll(x, y - s * .2, s * .5, s * .3, fn); }, o.c || '#3a2a2a', INK); b.ell(x, y - s * .38, s * .42, s * .1, o.fill || '#c8783a'); if (o.steam) G.ART.steam(b, x, y - s * .5, s); },
  cigarette(b, x, y, s) { b.line(x, y, x + s, y - s * .2, '#f4f4f0'); b.emis.push(bb => bb.px(Math.round(x + s), Math.round(y - s * .2), col('#ff7a3a'))); },
  towelProp(b, x, y, s) { b.shape(rectS(x - s * .6, y - s * .5, s * 1.2, s * .5), '#f4f1ea', INK, { shade: [1, 1, '#cfc8bc'] }); },
  pajamaProp(b, x, y, s) { b.shape(rectS(x - s * .6, y - s * .4, s * 1.2, s * .4), '#7fa2d6', INK); for (let k = 0; k < 5; k++) b.rect(x - s * .6 + k * s * .25, y - s * .4, 1, s * .4, '#4f6ea0'); }
});

/* ---------- extra places ---------- */
Object.assign(G.PLACE, {
  /* детская площадка ночью: один гудящий фонарь над лавочкой, горка, качели, песочница под сеткой, торговый автомат */
  playground(b, p) {
    const v = p.v || 'wide';
    CITY.nightBlock(b, Object.assign({ seed: 7, ground: v === 'bench' ? .6 : .56 }, p));
    const g = Math.round(b.h * (v === 'bench' ? .6 : .56));
    b.rect(0, g, b.w, b.h - g, '#221e30');
    for (let x = 0; x < b.w; x += 12) for (let y = g + 4; y < b.h; y += 9) if (bayer(x, y) < .3) b.px(x + (y % 3), y, col('#2c2740'));
    const lampX = p.lampX ?? (v === 'bench' ? 110 : 96);
    if (v === 'wide' || v === 'corner') {
      /* slide */
      const sx = p.slideX ?? 22;
      b.rect(sx, g - 30, 3, 30, '#6a7a9a'); b.rect(sx + 14, g - 30, 3, 30, '#6a7a9a');
      for (let k = 0; k < 5; k++) b.rect(sx, g - 28 + k * 6, 17, 1, '#8a9aba');
      b.shape(fn => spansPoly([[sx + 16, g - 30], [sx + 20, g - 30], [sx + 44, g - 2], [sx + 38, g - 2]], fn), '#c05a5a', INK);
      /* swings */
      const wx = p.swingX ?? 118;
      b.rect(wx, g - 34, 36, 2, '#4a5470'); b.rect(wx, g - 34, 2, 34, '#4a5470'); b.rect(wx + 34, g - 34, 2, 34, '#4a5470');
      for (const cx of [wx + 10, wx + 25]) { for (let y = g - 32; y < g - 10; y += 2) b.px(cx, y, col('#8a92aa')); b.rect(cx - 3, g - 10, 7, 2, '#b86a3a'); }
      /* sandbox under a net */
      const bx = p.sandX ?? 58, bw = 44;
      b.rect(bx, g + 8, bw, 12, '#a88a64'); b.rect(bx, g + 8, bw, 3, '#8a8a92'); b.rect(bx, g + 17, bw, 3, '#8a8a92');
      for (let x = bx; x < bx + bw; x += 3) b.line(x, g + 11, x + 2, g + 17, '#5a5a66');
    }
    if (v === 'wide' || v === 'bench') {
      const bx = v === 'bench' ? 50 : lampX - 20;
      const by = v === 'bench' ? b.h - 34 : g + 12;
      const L = v === 'bench' ? 110 : 36;
      b.rect(bx, by, L, v === 'bench' ? 5 : 3, '#6a4a34'); b.rect(bx, by - (v === 'bench' ? 12 : 6), L, v === 'bench' ? 3 : 2, '#6a4a34');
      b.rect(bx + 3, by + 3, 2, v === 'bench' ? 30 : 7, '#2a2a34'); b.rect(bx + L - 5, by + 3, 2, v === 'bench' ? 30 : 7, '#2a2a34');
    }
    /* vending machine glowing in the corner */
    const vx = p.vendX ?? (v === 'bench' ? 8 : 138), vw = 18, vh = 30;
    if (vx != null && vx !== false) {
      b.rect(vx - 1, g - vh - 1, vw + 2, vh + 2, '#101018');
      b.emis.push(bb => { bb.rect(vx, g - vh, vw, vh, '#e8eef6'); for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) bb.rect(vx + 2 + k * 4, g - vh + 3 + r * 7, 2, 4, ['#e84a4a', '#4a8ae8', '#f0c040', '#6ac06a'][(k + r) % 4]); bb.rect(vx + 2, g - 6, vw - 4, 3, '#2a2a36'); });
      (p._lights = p._lights || []).push({ x: vx + vw / 2, y: g - vh / 2, r: 40, c: '#dfeaff', k: .6 });
    }
    /* the humming lamp: whitish, a bit green */
    if (lampX != null) K.lamp(b, p, lampX, g + 2, v === 'bench' ? 70 : 44, { arm: 1, r: v === 'bench' ? 90 : 56, c: '#e8f4d8', k: 1 });
  },
  /* комбини: снаружи — яркая витрина; внутри — белый свет и полки */
  konbini(b, p) {
    if ((p.v || 'out') === 'out') { CITY.nightStreet(b, Object.assign({ seed: 31, shops: ['closed', 'konbini', 'konbini', 'closed'], ground: .72, neon: false }, p)); return; }
    b.fill(vgrad([[0, '#f2f6f6'], [1, '#dce6e8']], 0, b.h));
    for (let r = 0; r < 4; r++) { const y = 12 + r * Math.round(b.h * .18); b.rect(0, y + 10, b.w, 2, '#a8b4b8'); const rnd = rng(r + 3); for (let x = 2; x < b.w - 4; x += 5) b.rect(x, y + 2, 4, 8, ['#e84a4a', '#4a8ae8', '#f0c040', '#6ac06a', '#e070b0', '#f4f4f4'][Math.floor(rnd() * 6)]); }
    b.rect(0, Math.round(b.h * .8), b.w, b.h, '#c8d0d4');
    if (p.counter) { b.rect(0, Math.round(b.h * .62), b.w, b.h, '#b8c0c8'); b.rect(0, Math.round(b.h * .62), b.w, 3, '#8a949c'); }
  },
  /* круглосуточная прачечная: белые лампы, сушилки, пластиковая скамья, пробковая доска «Ищу кота», камера с красной точкой */
  laundromat(b, p) {
    const v = p.v || 'in';
    if (v === 'out') { CITY.nightStreet(b, Object.assign({ seed: 41, shops: ['closed', 'laundry', 'konbini', 'closed'], ground: .72, neon: false }, p)); return; }
    b.fill(vgrad([[0, '#eef2f4'], [1, '#d6dee2']], 0, b.h));
    const fl = Math.round(b.h * (p.floor ?? .78));
    b.rect(0, fl, b.w, b.h - fl, '#b8c0c4'); for (let x = 0; x < b.w; x += 10) b.rect(x, fl, 1, b.h - fl, '#a4acb0'); for (let y = fl; y < b.h; y += 8) b.rect(0, y, b.w, 1, '#a4acb0');
    const top = Math.round(b.h * .18), row = v === 'dryers' ? 1 : 2;
    for (let k = 0; k < 5; k++) {
      const x = 4 + k * 31, y = v === 'dryers' ? top : fl - 30;
      b.shape(rectS(x, y, 28, 28), '#f4f4f2', '#7a8288', { shade: [1, 1, '#d4d8dc'] });
      b.shape(ellS(x + 14, y + 15, 9, 9), '#3a4048', '#1a1e24');
      b.ell(x + 12, y + 12, 3, 2, '#8a96a4');
      if (p.on === k) b.emis.push(bb => { bb.ell(x + 14, y + 15, 7, 7, '#f0c878'); bb.ell(x + 11, y + 12, 2, 2, '#fff4d0'); });
      b.rect(x + 3, y + 3, 8, 2, '#8a9298');
    }
    if (v !== 'dryers') {
      b.rect(6, top, 34, 22, '#c89a6a'); b.rect(6, top, 34, 22, dither('#c89a6a', '#b88a5a', .3));
      b.rect(10, top + 4, 12, 9, '#fffbe8'); b.rect(12, top + 6, 6, 1, '#6a6a6a'); b.rect(12, top + 8, 8, 1, '#9a9a9a');
      b.rect(26, top + 5, 10, 12, '#f4f0e0');
    }
    b.rect(b.w - 16, 4, 8, 5, '#3a3e44'); b.emis.push(bb => bb.px(b.w - 10, 6, col('#ff2a3a')));
    for (let x = 8; x < b.w; x += 40) b.emis.push(bb => bb.rect(x, 0, 28, 2, '#ffffff'));
    (p._lights = p._lights || []).push({ x: b.w / 2, y: -20, r: 220, c: '#e8f4ff', k: .25 });
  },
  /* дом Кирю снаружи: фонарь над воротами, тёмный массивный силуэт додзё */
  houseOut(b, p) {
    b.fill(vgrad([[0, N.sky0], [1, N.sky1]], 0, b.h));
    CITY.clouds(b, 2, b.h * .25, 91);
    const g = Math.round(b.h * .76);
    b.shape(fn => spansPoly([[70, g - 44], [100, g - 60], [160, g - 60], [170, g - 44], [170, g], [70, g]], fn), '#1c1828', null);
    b.rect(70, g - 44, 100, 3, '#2a2438');
    b.shape(fn => spansPoly([[0, g - 34], [26, g - 48], [64, g - 48], [72, g - 34], [72, g], [0, g]], fn), '#2a2438', null);
    b.emis.push(bb => { bb.rect(20, g - 24, 8, 10, '#ffd88a'); bb.rect(44, g - 24, 8, 10, '#ffd88a'); });
    b.rect(0, g, b.w, b.h - g, '#1a1624');
    K.lamp(b, p, 66, g - 6, 20, { arm: 0, r: 60, c: '#ffe0a0', k: 1 });
    if (p.van) { const vx = p.van; b.shape(fn => spansPoly([[vx, g - 22], [vx + 36, g - 22], [vx + 44, g - 12], [vx + 44, g + 2], [vx, g + 2]], fn), '#dcdcdc', INK, { shade: [0, 1, '#a8a8b0'] }); b.rect(vx + 4, g - 19, 12, 7, '#5a6a8a'); b.rect(vx + 20, g - 19, 14, 7, '#5a6a8a'); b.ell(vx + 8, g + 2, 4, 4, '#1a1a1a'); b.ell(vx + 36, g + 2, 4, 4, '#1a1a1a'); }
  },
  /* салон старенького кей-вэна ночью */
  van(b, p) {
    b.fill('#1a1826');
    b.rect(0, 0, b.w, Math.round(b.h * .42), '#0e0c18');
    const rnd = rng(8); for (let i = 0; i < 9; i++) { const x = rnd() * b.w, y = rnd() * b.h * .38, r = 2 + rnd() * 4; spansEll(x, y, r, r, (a, bb, yy) => { for (let xx = a; xx <= bb; xx++) if (bayer(xx, yy) < .35) b.px(xx, yy, col(rnd() < .5 ? '#ffd27a' : '#8fb4ff')); }); }
    b.rect(0, Math.round(b.h * .42), b.w, 3, '#2a2838');
    b.rect(0, Math.round(b.h * .7), b.w, b.h, '#2c2a38'); b.rect(0, Math.round(b.h * .7), b.w, 2, '#3a3848');
    (p._lights = p._lights || []).push({ x: b.w * .5, y: b.h, r: 110, c: '#ff9a5a', k: .35 });
  },
  /* кухня дома Кирю: тёплый свет, раковина, стол */
  homeKitchen(b, p) {
    b.fill(vgrad([[0, '#8a6a4a'], [1, '#6a4e36']], 0, b.h));
    b.rect(0, Math.round(b.h * .5), b.w, 3, '#b89a74'); b.rect(0, Math.round(b.h * .5) + 3, b.w, b.h, '#7a5a3e');
    b.rect(100, 10, 50, Math.round(b.h * .38), '#3a4a5a'); b.rect(102, 12, 46, Math.round(b.h * .38) - 4, vgrad([[0, '#1a2034'], [1, '#2a3048']], 12, b.h * .38));
    b.rect(124, 12, 1, Math.round(b.h * .38) - 4, '#3a4a5a');
    for (let x = 6; x < 90; x += 14) b.rect(x, 18, 10, 2, '#5a3e28');
    (p._lights = p._lights || []).push({ x: 60, y: -10, r: 150, c: '#ffcf8a', k: .4 });
    if (p.table) { const y = Math.round(b.h * (p.table)); b.rect(0, y, b.w, 4, '#a07a52'); b.rect(0, y, b.w, 1, '#c89a6a'); b.rect(0, y + 4, b.w, b.h, '#6a4a30'); }
  },
  /* комната Хинаты: футон, полка с книгами, стена */
  hinataRoom(b, p) {
    b.fill(vgrad([[0, '#d8c8b0'], [1, '#c4b294']], 0, b.h));
    b.rect(0, Math.round(b.h * .66), b.w, b.h, '#b0a07a'); for (let y = Math.round(b.h * .66); y < b.h; y += 10) b.rect(0, y, b.w, 1, '#9a8a66');
    b.rect(8, 14, 40, 3, '#8a6a44'); b.rect(8, 34, 40, 3, '#8a6a44');
    for (let k = 0; k < 7; k++) b.rect(10 + k * 5, 22, 4, 12, ['#c05a4a', '#4a7ac0', '#e8c060', '#6aa86a', '#8a5ac0'][k % 5]);
    if (p.futon) { b.shape(rectS(40, Math.round(b.h * .7), 110, 18), '#e8e8f0', INK, { shade: [0, 1, '#c8c8d4'] }); b.rect(44, Math.round(b.h * .7) + 2, 20, 8, '#f4f4f8'); }
    (p._lights = p._lights || []).push({ x: 120, y: -10, r: 140, c: p.night ? '#9ab0ff' : '#ffe0b0', k: p.night ? .15 : .3 });
    if (p.night) (p._lights).push({ x: 150, y: 40, r: 60, c: '#b8d0ff', k: .3 });
  },
  /* раздевалка перед ванной: стиралка, корзина, зеркало в пару; за матовой дверью — пар */
  bathroom(b, p) {
    const v = p.v || 'changing';
    if (v === 'bath') {
      b.fill(vgrad([[0, '#c8dce4'], [1, '#a8c0cc']], 0, b.h));
      for (let x = 0; x < b.w; x += 10) b.rect(x, 0, 1, b.h, '#b8ccd6'); for (let y = 0; y < b.h; y += 10) b.rect(0, y, b.w, 1, '#b8ccd6');
      b.shape(rectS(70, Math.round(b.h * .55), 90, b.h), '#e8eef2', INK, { shade: [0, 1, '#c8d4dc'] });
      b.rect(72, Math.round(b.h * .55) + 2, 86, 4, '#9ac8e0');
      for (let i = 0; i < 40; i++) { const x = (i * 37) % b.w, y = (i * 53) % b.h; spansEll(x, y, 8, 5, (a, bb, yy) => { for (let xx = a; xx <= bb; xx++) if (bayer(xx, yy) < .25) b.px(xx, yy, col('#f4f8fa')); }); }
      return;
    }
    b.fill(vgrad([[0, '#e8e4dc'], [1, '#d4cec2']], 0, b.h));
    b.rect(0, Math.round(b.h * .8), b.w, b.h, '#b8b0a2');
    b.shape(rectS(6, Math.round(b.h * .42), 40, Math.round(b.h * .38)), '#f4f4f2', INK, { shade: [1, 1, '#d4d8dc'] }); b.shape(ellS(26, Math.round(b.h * .62), 11, 11), '#8a96a4', INK);
    b.rect(56, 10, 34, 26, '#d8e4ea'); for (let x = 56; x < 90; x++) for (let y = 10; y < 36; y++) if (bayer(x, y) < .4 && (y < 14 || x < 60 || x > 86)) b.px(x, y, col('#f4f8fa'));
    b.shape(rectS(100, 6, 56, Math.round(b.h * .8) - 6), '#dfe8ee', '#8a96a0');
    for (let i = 0; i < 24; i++) { const x = 102 + (i * 13) % 52, y = 8 + (i * 29) % (b.h * .7); spansEll(x, y, 6, 4, (a, bb, yy) => { for (let xx = a; xx <= bb; xx++) if (bayer(xx, yy) < .3) b.px(xx, yy, col('#f8fbfc')); }); }
    b.rect(60, Math.round(b.h * .66), 26, 14, dither('#c8a878', '#a88858', .3));
  },
  /* торговый центр: фудкорт, игровые автоматы, будка пурикуры */
  mall(b, p) {
    const v = p.v || 'food';
    b.fill(vgrad([[0, '#f4ece0'], [1, '#e0d4c2']], 0, b.h));
    b.rect(0, Math.round(b.h * .74), b.w, b.h, '#cfc2ae'); for (let x = 0; x < b.w; x += 16) b.rect(x, Math.round(b.h * .74), 1, b.h, '#bcae98');
    if (v === 'food') { for (const [x, c] of [[4, '#e84a4a'], [56, '#f0a030'], [108, '#4aa0e0']]) { b.rect(x, 8, 48, 12, c); b.rect(x, 20, 48, 24, '#fbf6ec'); b.rect(x + 4, 24, 40, 6, '#e8dcc8'); } }
    if (v === 'arcade') {
      b.fill(vgrad([[0, '#1a1430'], [1, '#2a2048']], 0, b.h));
      for (let k = 0; k < 4; k++) { const x = 6 + k * 40; b.rect(x, 20, 30, b.h - 30, '#2a2440'); b.emis.push(bb => { bb.rect(x + 3, 24, 24, 16, ['#ff5a9a', '#5af0ff', '#ffe05a', '#9a6aff'][k]); }); }
      (p._lights = p._lights || []).push({ x: 80, y: 30, r: 120, c: '#c080ff', k: .4 });
    }
    if (v === 'punch') {
      b.fill(vgrad([[0, '#1a1430'], [1, '#2a2048']], 0, b.h));
      b.rect(96, 10, 44, b.h - 20, '#c02a3a'); b.emis.push(bb => { bb.rect(102, 16, 32, 14, '#1a0a0a'); CITY.text3(bb, p.score || '087', 108, 20, '#ff4a3a', 1); });
      b.shape(ellS(118, 62, 14, 14), '#e8e0d0', INK, { shade: [1, 1, '#b8ac98'] });
    }
    if (v === 'purikura') {
      b.fill(vgrad([[0, '#ffd8ec'], [1, '#f4b0d8']], 0, b.h));
      for (let i = 0; i < 20; i++) { const x = (i * 29) % b.w, y = (i * 17) % b.h; b.px(x, y, col('#ffffff')); b.px(x + 1, y, col('#ffffff')); b.px(x - 1, y, col('#ffffff')); b.px(x, y + 1, col('#ffffff')); b.px(x, y - 1, col('#ffffff')); }
    }
  },
  /* спальный район ночью: тихие улицы, синие окна телевизоров */
  nightRes(b, p) {
    CITY.nightBlock(b, Object.assign({ seed: 17, ground: .72 }, p));
    const g = Math.round(b.h * .72);
    const rnd = rng(5); for (let i = 0; i < 6; i++) { const x = 6 + rnd() * (b.w - 12), y = g - 20 - rnd() * 30; b.emis.push(bb => bb.rect(x, y, 3, 3, rnd() < .5 ? '#6a8aff' : '#8ab0ff')); }
    K.lamp(b, p, 40, g + 2, 40, { arm: 1, r: 44, c: '#ffcf8a', k: .8 });
  },
  /* додзё ночью: холодно, одна тусклая лампа */
  dojoNight(b, p) {
    b.fill(vgrad([[0, '#141018'], [1, '#221a18']], 0, b.h));
    for (let x = 0; x < b.w; x += 26) b.rect(x, 0, 3, Math.round(b.h * .6), '#0c0a0c');
    b.rect(0, Math.round(b.h * .6), b.w, b.h, '#4a3a28'); for (let y = Math.round(b.h * .6); y < b.h; y += 6) b.rect(0, y, b.w, 1, '#3a2c1e');
    b.rect(8, Math.round(b.h * .2), 30, 2, '#0e0a08'); for (let k = 0; k < 4; k++) PROP.bokken(b, 12 + k * 7, Math.round(b.h * .56), b.h * .34, -1.5);
    b.rect(79, 0, 2, 12, '#3a3030'); b.emis.push(bb => { bb.rect(76, 12, 8, 3, '#ffe6b0'); });
    (p._lights = p._lights || []).push({ x: 80, y: 14, r: 120, c: '#ffd8a0', k: .7 });
  }
});

/* arm poses used from chapter 2 on */
Object.assign(G.BODY.ARM, {
  pocket: [.08, 1.0, -.2, 1.7], around: [.7, .5, 1.6, .7], cupTwo: [.05, 1.0, -.3, .7],
  rubHands: [.1, 1.0, -.1, 1.2], offer: [.3, .9, .8, .6], headPat: [.5, .2, 1.3, -.8], hands2chest: [.08, 1.0, -.3, .78]
});
})(window);
