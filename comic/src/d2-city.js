/* Part D2: the night city, after the user's reference — indigo sky with cloud bands, lit windows,
   neon signs, shop fronts, wet asphalt with reflections, slanted rain. */
(function (G) {
'use strict';
const { col, mix, bayer, dither, vgrad, spansPoly, spansEll } = G.PX;
const rng = G.PX.rng;

/* 3×5 pixel font for signs */
const F3 = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
  G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101',
  S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
  4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001110',
  ':': '000010000010000', '-': '000000111000000', '!': '010010010000010', '.': '000000000000010', ' ': '000000000000000', '/': '001001010100100'
};
function text3(b, s, x, y, c, scale = 1) {
  c = col(c); let cx = x;
  for (const ch of String(s).toUpperCase()) {
    const g = F3[ch] || F3[' '];
    for (let r = 0; r < 5; r++) for (let k = 0; k < 3; k++) if (g[r * 3 + k] === '1')
      for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) b.px(cx + k * scale + sx, y + r * scale + sy, c);
    cx += 4 * scale;
  }
  return cx - x;
}
const textW = (s, scale = 1) => String(s).length * 4 * scale - scale;

/* night palette */
const N = {
  sky0: '#0d0a1c', sky1: '#1c1636', sky2: '#2e2450', cloud: '#3a2c5e', cloudHi: '#8a4a8a',
  far: '#2a2446', far2: '#332b55', mid: '#3a3060', mid2: '#433868', near: '#2c2440', trim: '#4e4478',
  winOff: '#1c1830', lit: ['#e8b25a', '#f0c870', '#6aa0e0', '#e888b8', '#f4f0e0', '#88d0e0'],
  road: '#15121f', walk: '#28223c', curb: '#4a4270', rain: '#b4a8e0', rain2: '#6c62a0'
};

function clouds(b, y0, y1, seed) {
  const rnd = rng(seed);
  for (let i = 0; i < 7; i++) {
    const cy = y0 + rnd() * (y1 - y0), len = 30 + rnd() * 70, x0 = rnd() * b.w - 20, amp = 1 + rnd() * 1.5;
    for (let x = Math.floor(x0); x < x0 + len; x++) {
      const y = Math.round(cy + Math.sin(x * .25 + i) * amp);
      b.px(x, y, col(N.cloud)); if (bayer(x, y) < .5) b.px(x, y + 1, col(N.cloud));
      if ((x + i) % 3 === 0) b.px(x, y - 1, col(N.cloudHi));
    }
  }
}
function tower(b, x, yBase, w, h, c, rnd, o = {}) {
  b.rect(x, yBase - h, w, h, c);
  b.rect(x, yBase - h, w, 1, mix(c, '#ffffff', .12));
  if (o.roof && rnd() < .6) { const rx = x + 2 + rnd() * (w - 6); b.rect(rx, yBase - h - 3, 4, 3, mix(c, '#000000', .2)); }
  if (o.antenna && rnd() < .4) { const ax = Math.round(x + w * rnd()); b.rect(ax, yBase - h - 8, 1, 8, c); b.emis.push(bb => bb.px(ax, yBase - h - 8, col('#ff4a5a'))); }
  const litK = o.litK ?? .28, cw = o.cell || 4, ch = o.cellH || 5;
  for (let wy = yBase - h + 3; wy < yBase - 3; wy += ch) for (let wx = x + 2; wx + 2 <= x + w - 1; wx += cw) {
    const on = rnd() < litK, c2 = on ? N.lit[Math.floor(rnd() * N.lit.length)] : N.winOff;
    const ww = o.big ? 2 : 1, wh = o.big ? 3 : 2;
    if (on) b.emis.push(bb => bb.rect(wx, wy, ww + (o.big ? 0 : 1), wh, c2)); else b.rect(wx, wy, ww + (o.big ? 0 : 1), wh, c2);
  }
}
function neonV(b, x, y, h, c) { // vertical sign with a glowing border and blocky glyph strokes
  const cc = col(c);
  b.emis.push(bb => {
    bb.rect(x, y, 7, h, '#1a1428');
    for (let k = 0; k < h; k++) { bb.px(x, y + k, cc); bb.px(x + 6, y + k, cc); }
    for (let k = 0; k < 7; k++) { bb.px(x + k, y, cc); bb.px(x + k, y + h - 1, cc); }
    for (let gy = y + 3; gy < y + h - 4; gy += 6) { bb.rect(x + 2, gy, 3, 1, cc); bb.rect(x + 3, gy + 1, 1, 3, cc); bb.rect(x + 2, gy + 3, 3, 1, cc); }
  });
}
function shop(b, p, x, yBase, w, kind, rnd) {
  const signY = yBase - 34, h = 24;
  const K = {
    laundry: { name: 'LAUNDRY', sign: '#d8e4ff', awn: ['#3a5ad0', '#e8ecff'], glass: ['#e8eef8', '#c8d4ec'] },
    konbini: { name: '24H', sign: '#7ae8a0', awn: ['#2aa860', '#f4f4f4'], glass: ['#f4f8f8', '#dce8ec'] },
    ramen: { name: 'RAMEN', sign: '#ffc870', awn: ['#d83a3a', '#f4e8e0'], glass: ['#f0b060', '#c07a34'] },
    netcafe: { name: 'NETCAFE', sign: '#7ae0e8', awn: ['#1a9aa8', '#d8f4f4'], glass: ['#3ac0c0', '#1a8a90'] },
    karaoke: { name: 'KARAOKE', sign: '#ff8ad0', awn: ['#a83a9a', '#f4e0f4'], glass: ['#c86ac0', '#8a3a8a'] },
    closed: { name: '', sign: '#3a3458', awn: ['#2a2440', '#3a3458'], glass: ['#1c1830', '#161226'] }
  }[kind];
  b.rect(x, yBase - 44, w, 44, N.near);
  b.rect(x, signY - 2, w, 11, '#120e1e');
  const tw = textW(K.name);
  b.emis.push(bb => {
    if (K.name) { text3(bb, K.name, x + Math.round((w - tw) / 2), signY, K.sign); for (let k = 0; k < w - 2; k++) { if (bayer(x + k, signY - 2) < .35) bb.px(x + 1 + k, signY - 2, col(K.sign)); if (bayer(x + k, signY + 8) < .35) bb.px(x + 1 + k, signY + 8, col(K.sign)); } }
    for (let k = 0; k < w; k++) bb.rect(x + k, signY + 10, 1, 3, (k >> 1) % 2 ? K.awn[1] : K.awn[0]);
    if (kind !== 'closed') {
      bb.rect(x + 2, signY + 14, w - 12, h - 4, vgrad([[0, K.glass[0]], [1, K.glass[1]]], signY + 14, signY + 10 + h));
      bb.rect(x + Math.round((w - 12) / 2) + 1, signY + 14, 1, h - 4, '#2a2440');
      if (kind === 'laundry') for (let k = 0; k < Math.floor((w - 16) / 7); k++) { bb.ell(x + 7 + k * 7, signY + 25, 2.5, 2.5, '#2a2a3a'); bb.px(x + 6 + k * 7, signY + 24, col('#8a8aa0')); }
      if (kind === 'konbini') for (let r = 0; r < 3; r++) for (let k = 0; k < w - 16; k += 2) bb.px(x + 4 + k, signY + 17 + r * 5, col(N.lit[(k + r) % 6]));
      if (kind === 'ramen') for (let k = 0; k < w - 16; k += 5) bb.rect(x + 4 + k, signY + 26, 1, 4, '#6a3a1a');
    }
  });
  b.rect(x + w - 9, signY + 14, 6, h - 4, '#1a1428');
  if (kind !== 'closed') {
    const gc = K.glass[0];
    (p._lights = p._lights || []).push({ x: x + w / 2, y: yBase + 2, r: w * .75, ry: 16, c: gc, k: .55, bands: 3 });
  }
}

/* reflections: mirror the lit rows above the waterline into the wet road, darkened and jittered */
function reflect(b, yLine, depth, k = .4) {
  const src = new Uint8ClampedArray(b.d);
  for (let dy = 1; dy < depth; dy++) {
    const ys = yLine - dy, yd = yLine + dy;
    if (ys < 0 || yd >= b.h) break;
    const jit = ((dy >> 1) % 3) - 1;
    for (let x = 0; x < b.w; x++) {
      const xs = Math.min(b.w - 1, Math.max(0, x + jit)), i = (ys * b.w + xs) << 2, j = (yd * b.w + x) << 2;
      if (!src[i + 3] || (dy % 3 === 0)) continue;
      const fade = k * (1 - dy / depth);
      const bright = (src[i] + src[i + 1] + src[i + 2]) / 3;
      if (bright < 70) continue;
      b.d[j] = b.d[j] + (src[i] - b.d[j]) * fade; b.d[j + 1] = b.d[j + 1] + (src[i + 1] - b.d[j + 1]) * fade; b.d[j + 2] = b.d[j + 2] + (src[i + 2] - b.d[j + 2]) * fade;
    }
  }
}

/* a full night street. p: {seed, shops: [...kinds], ground (0..1 of height), lampX} */
function nightStreet(b, p) {
  const rnd = rng(p.seed || 42), g = Math.round(b.h * (p.ground ?? .72));
  b.fill(vgrad([[0, N.sky0], [.6, N.sky1], [1, N.sky2]], 0, g));
  clouds(b, 2, g * .35, (p.seed || 42) + 1);
  let x = -6;
  while (x < b.w) { const w = 16 + rnd() * 20, h = g * (.35 + rnd() * .4); tower(b, x, g - 30, w, h, rnd() < .5 ? N.far : N.far2, rnd, { roof: 1, antenna: 1, litK: .22 }); x += w + 1; }
  if (p.neon !== false) { neonV(b, Math.round(b.w * .18), Math.round(g * .38), 22, '#ff5a9a'); neonV(b, Math.round(b.w * .78), Math.round(g * .3), 26, '#9a6aff'); }
  x = -4;
  while (x < b.w) { const w = 26 + rnd() * 24, h = g * (.22 + rnd() * .16); tower(b, x, g - 30, w, h, rnd() < .5 ? N.mid : N.mid2, rnd, { litK: .35, cell: 6, cellH: 7, big: 1 }); x += w; }
  const kinds = p.shops || ['netcafe', 'konbini', 'laundry', 'ramen'];
  const sw = Math.ceil(b.w / kinds.length);
  kinds.forEach((k, i) => shop(b, p, i * sw, g, sw, k, rnd));
  b.rect(0, g, b.w, 5, N.walk); b.rect(0, g + 5, b.w, 1, N.curb);
  b.rect(0, g + 6, b.w, b.h - g - 6, N.road);
  for (let lx = 6; lx < b.w; lx += 30) b.rect(lx, Math.round(g + (b.h - g) * .6), 12, 1, '#3a3458');
  if (p.lampX !== null) for (const lx of (p.lampX || [Math.round(b.w * .62)])) G.PLACEKIT.lamp(b, p, lx, g + 1, 40, { arm: 1, r: 44, c: '#ffb45a', k: .85 });
  b.after = b.after || [];
  b.after.push(bb => reflect(bb, g + 6, b.h - g, .45));
}

/* a quiet residential night (the playground block): low houses, one lamp, a vending machine */
function nightBlock(b, p) {
  const rnd = rng(p.seed || 7), g = Math.round(b.h * (p.ground ?? .74));
  b.fill(vgrad([[0, N.sky0], [1, N.sky1]], 0, g));
  clouds(b, 2, g * .3, (p.seed || 7) + 5);
  let x = -4;
  while (x < b.w) { const w = 30 + rnd() * 26, h = g * (.4 + rnd() * .25); tower(b, x, g, w, h, rnd() < .5 ? N.mid : N.far2, rnd, { litK: .14, cell: 7, cellH: 8, big: 1 }); x += w + 2; }
  b.rect(0, g, b.w, b.h - g, '#1e1a2c');
  if (p.after !== false) { b.after = b.after || []; b.after.push(bb => reflect(bb, g, 20, .25)); }
}

G.CITY = { text3, textW, N, clouds, tower, neonV, shop, reflect, nightStreet, nightBlock };
})(window);
