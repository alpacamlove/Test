/* Part C: props, effects, simple close-up backdrops. */
(function (G) {
'use strict';
const { col, mix, bayer, dither, vgrad, spansPoly, spansEll, pathSpans } = G.PX;
const INK = '#16121c';

const ellS = (cx, cy, rx, ry) => fn => spansEll(cx, cy, rx, ry, fn);
const polyS = pts => fn => spansPoly(pts, fn);
const rectS = (x, y, w, h) => fn => spansPoly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], fn);

/* ---- props: (buf, x, y, s, o) — x,y = centre-bottom, s = size in px ---- */
const PROP = {
  phone(b, x, y, s, o = {}) { // held phone, portrait. o.screen: colour, o.cat: case doodle
    const w = s * .56, h = s;
    b.shape(rectS(x - w / 2, y - h, w, h), o.case || '#f0a8c0', INK);
    b.rect(x - w / 2 + 1, y - h + 1, w - 2, h - 2, o.case || '#f0a8c0');
    if (o.back) { // back side with the silly cat and the purikura sticker
      const cx = x, cy = y - h * .6;
      b.shape(ellS(cx, cy, w * .3, w * .24), '#fff4e0', INK);
      b.px(Math.round(cx - w * .12), Math.round(cy - 1), col(INK)); b.px(Math.round(cx + w * .1), Math.round(cy - 1), col(INK));
      b.shape(polyS([[cx - w * .28, cy - w * .12], [cx - w * .2, cy - w * .38], [cx - w * .08, cy - w * .2]]), '#fff4e0', INK);
      b.shape(polyS([[cx + w * .28, cy - w * .12], [cx + w * .2, cy - w * .38], [cx + w * .08, cy - w * .2]]), '#fff4e0', INK);
      if (o.sticker) b.shape(rectS(x - w * .3, y - h * .3, w * .6, h * .18), '#ffe36a', INK);
    } else b.rect(x - w / 2 + 2, y - h + 3, w - 4, h - 6, o.screen || '#9fd0ff');
  },
  can(b, x, y, s, o = {}) { // hot cocoa can
    const w = s * .55, h = s;
    b.shape(rectS(x - w / 2, y - h, w, h), o.c || '#8a4a2a', INK, { shade: [1, 0, '#5a2e1a'], depth: 2 });
    b.rect(x - w / 2, y - h * .72, w, h * .36, '#f2e2c8');
    b.rect(x - w / 2 + 1, y - h * .62, w - 2, Math.max(1, h * .14), '#c0402a');
    b.rect(x - w / 2, y - h, w, Math.max(1, h * .08), '#c8ccd6');
  },
  onigiri(b, x, y, s) {
    b.shape(polyS([[x - s * .55, y], [x, y - s * .9], [x + s * .55, y]]), '#fbfbf6', INK, { shade: [1, 1, '#d8dce4'] });
    b.shape(rectS(x - s * .22, y - s * .42, s * .44, s * .42), '#1c2a22', INK);
  },
  nikuman(b, x, y, s) {
    b.shape(ellS(x, y - s * .35, s * .55, s * .38), '#fbf6ec', INK, { shade: [1, 1, '#e2d6c0'] });
    b.px(Math.round(x), Math.round(y - s * .68), col('#d8c8aa'));
  },
  kairo(b, x, y, s) { b.shape(rectS(x - s * .4, y - s * .55, s * .8, s * .55), '#fbfbfb', INK, { shade: [1, 1, '#d4d8e0'] }); b.rect(x - s * .2, y - s * .4, s * .4, Math.max(1, s * .12), '#e84a3a'); },
  thermos(b, x, y, s) { b.shape(rectS(x - s * .2, y - s, s * .4, s), '#b8bcc6', INK, { shade: [1, 0, '#8a8e98'], depth: 2 }); b.rect(x - s * .22, y - s * 1.08, s * .44, s * .14, '#3a3e48'); },
  cup(b, x, y, s, o = {}) { b.shape(polyS([[x - s * .35, y - s * .7], [x + s * .35, y - s * .7], [x + s * .28, y], [x - s * .28, y]]), o.c || '#dfe2ea', INK, { shade: [1, 0, '#a8adb8'] }); if (o.steam) steam(b, x, y - s * .8, s); },
  mug(b, x, y, s, o = {}) {
    b.shape(fn => { spansEll(x + s * .45, y - s * .45, s * .22, s * .22, fn); }, o.c || '#f4f4f4', INK);
    b.shape(rectS(x - s * .4, y - s * .85, s * .8, s * .85), o.c || '#f4f4f4', INK, { shade: [1, 0, o.d || '#c8ccd8'], depth: 2 });
    if (o.logo) b.rect(x - s * .22, y - s * .6, s * .44, s * .2, o.logo);
    if (o.bunny) { b.shape(ellS(x - s * .05, y - s * .42, s * .2, s * .16), '#ffffff', '#b0b4c0'); b.line(x - s * .12, y - s * .56, x - s * .14, y - s * .74, '#b0b4c0'); b.line(x + s * .02, y - s * .56, x + s * .04, y - s * .74, '#b0b4c0'); }
    if (o.steam) steam(b, x, y - s, s);
  },
  bento(b, x, y, s, o = {}) {
    b.shape(rectS(x - s * .6, y - s * .45, s * 1.2, s * .45), '#3a2a2a', INK);
    b.rect(x - s * .55, y - s * .42, s * .6, s * .38, '#fbfbf4');
    for (let k = 0; k < 4; k++) b.shape(ellS(x + s * .15 + (k % 2) * s * .18, y - s * .3 + (k >> 1) * s * .14, s * .1, s * .08), '#c8782a', INK);
    if (o.egg) b.shape(rectS(x - s * .5, y - s * .2, s * .25, s * .12), '#ffd84a', INK);
  },
  chopsticks(b, x, y, s, ang = -.5) { const dx = Math.cos(ang) * s, dy = Math.sin(ang) * s; b.line(x, y, x + dx, y + dy, '#b07a4a'); b.line(x + 2, y + 1, x + dx + 2, y + dy + 1, '#8a5a34'); },
  umbrella(b, x, y, s, o = {}) {
    const pts = []; for (let i = 0; i <= 16; i++) { const a = Math.PI * i / 16; pts.push([x - Math.cos(a) * s, y - Math.sin(a) * s * .55 + (o.bent && i > 11 ? s * .08 * (i - 11) / 5 : 0)]); }
    for (let i = 16; i >= 0; i--) { const t = i / 16; pts.push([x - s + t * 2 * s, y + Math.sin(t * Math.PI * 4) * s * .03]); }
    b.shape(polyS(pts), o.c || '#27305a', INK, { shade: [0, 1, '#1a2040'], depth: 2 });
    for (const k of [-.55, 0, .55]) b.line(x, y - s * .55, x + k * s, y, '#141a36');
    b.line(x, y - s * .55, x, y + s * 1.1, '#3a3a44');
  },
  manga(b, x, y, s) { b.shape(rectS(x - s * .35, y - s, s * .7, s), '#e8d8b0', INK); b.rect(x - s * .3, y - s * .9, s * .6, s * .4, '#b83a2a'); b.rect(x - s * .3, y - s * .4, s * .6, s * .1, '#2a2a3a'); },
  frame(b, x, y, s) { // cheap frame with the summer photo and a potato-shaped cat
    b.shape(rectS(x - s * .5, y - s * .78, s, s * .78), '#c8a070', INK);
    b.rect(x - s * .38, y - s * .66, s * .76, s * .54, '#8ac0e8');
    for (const [dx, c] of [[-.24, '#1c1a22'], [0, '#6a4030'], [.24, '#8c4a2f']]) { b.ell(x + dx * s, y - s * .42, s * .07, s * .08, c); b.rect(x + dx * s - s * .08, y - s * .34, s * .16, s * .2, '#f3f2ee'); }
    b.ell(x + s * .36, y - s * .12, s * .12, s * .08, '#16121c'); b.px(Math.round(x + s * .31), Math.round(y - s * .2), col('#16121c')); b.px(Math.round(x + s * .41), Math.round(y - s * .2), col('#16121c'));
  },
  poster(b, x, y, s) { // «Разыскивается»
    b.shape(rectS(x - s * .35, y - s, s * .7, s), '#f4f0e4', '#6a6a6a');
    b.rect(x - s * .3, y - s * .94, s * .6, s * .12, '#c02a2a');
    b.rect(x - s * .16, y - s * .76, s * .32, s * .34, '#9a9aa4'); b.ell(x, y - s * .64, s * .1, s * .11, '#e0c8b0');
    b.rect(x - s * .1, y - s * .64, s * .2, Math.max(1, s * .03), '#2a2a2a');
    for (let k = 0; k < 3; k++) b.rect(x - s * .26, y - s * .34 + k * s * .09, s * .52, 1, '#8a8a8a');
  },
  bokken(b, x, y, s, ang = -1.1) { const dx = Math.cos(ang) * s, dy = Math.sin(ang) * s; for (let k = -1; k <= 1; k++) b.line(x + k, y, x + dx + k, y + dy, k ? '#6a4424' : '#9a6a3a'); },
  yakisoba(b, x, y, s) { b.shape(rectS(x - s * .5, y - s * .3, s, s * .3), '#f4f4f0', INK); b.rect(x - s * .45, y - s * .36, s * .9, s * .1, '#b0643a'); b.px(Math.round(x), Math.round(y - s * .4), col('#4a8a3a')); },
  keys(b, x, y, s, o = {}) {
    b.shape(ellS(x, y, s * .22, s * .22), '#c8ccd6', INK); b.rect(x - s * .05, y - s * .05, s * .1, s * .1, '#6a6e78');
    b.shape(rectS(x + s * .15, y - s * .12, s * .5, s * .24), '#3a3446', INK);
    if (o.uv) { b.px(Math.round(x + s * .64), Math.round(y), col('#e0b0ff')); }
  },
  riceCooker(b, x, y, s) { b.shape(fn => { spansEll(x, y - s * .55, s * .6, s * .5, fn); spansPoly([[x - s * .6, y - s * .55], [x + s * .6, y - s * .55], [x + s * .55, y], [x - s * .55, y]], fn); }, '#f4f4f0', INK, { shade: [1, 0, '#c8ccd4'], depth: 2 }); b.rect(x - s * .15, y - s * .4, s * .3, s * .12, '#e84a3a'); },
  bag(b, x, y, s, o = {}) { b.shape(rectS(x - s, y - s * .3, s * 2, s * .3), o.c || '#1e2230', INK, { shade: [0, 1, '#10121a'] }); b.line(x - s * .9, y - s * .3, x - s * .4, y - s * .6, '#2a2e3a'); }
};
function steam(b, x, y, s) { const c = col('#ffffff'); for (let k = 0; k < 3; k++) for (let i = 0; i < s * .5; i++) { const yy = Math.round(y - i), xx = Math.round(x + (k - 1) * s * .18 + Math.sin(i / 2 + k) * 1.2); if (bayer(xx, yy) < .5) b.px(xx, yy, c); } }

/* ---- effects drawn after lighting ---- */
const FX = {
  rain(b, o = {}) {
    const n = Math.round(b.w * b.h / (o.dense ? 55 : 110)), c = col(o.c || '#a8bce8'), c2 = col('#6a7cae'), ang = o.ang ?? .25, rnd = G.PX.rng(o.seed || 7);
    for (let i = 0; i < n; i++) { const x = rnd() * (b.w + 40) - 20, y = rnd() * b.h, l = 3 + rnd() * 5; b.line(x, y, x - ang * l, y + l, rnd() < .6 ? c : c2); }
  },
  sparkle(b, o = {}) {
    const rnd = G.PX.rng(o.seed || 3), c = col(o.c || '#fff6c8');
    for (let i = 0; i < (o.n || 10); i++) { const x = Math.round(rnd() * b.w), y = Math.round(rnd() * b.h), r = rnd() < .3 ? 2 : 1; b.px(x, y, c); for (let k = 1; k <= r; k++) { b.px(x + k, y, c); b.px(x - k, y, c); b.px(x, y + k, c); b.px(x, y - k, c); } }
  },
  speed(b, o = {}) { // manga focus lines toward (cx,cy)
    const cx = o.x ?? b.w / 2, cy = o.y ?? b.h / 2, c = col(o.c || '#1a1622'), rnd = G.PX.rng(o.seed || 5), inner = o.r ?? Math.min(b.w, b.h) * .32;
    for (let i = 0; i < (o.n || 70); i++) { const a = rnd() * Math.PI * 2, r0 = inner + rnd() * inner * .5, r1 = Math.max(b.w, b.h); b.line(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, c); }
  },
  vignette(b, o = {}) {
    const k = o.k ?? .5, c = col(o.c || '#05040a');
    for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
      const dx = (x - b.w / 2) / (b.w / 2), dy = (y - b.h / 2) / (b.h / 2), d = Math.sqrt(dx * dx * .8 + dy * dy * .8);
      if (d > 1 - k * .5 && bayer(x, y) < (d - (1 - k * .5)) * 2.2) { const p = b.get(x, y); if (p) b.px(x, y, mix(p, c, .55)); }
    }
  },
  tone(b, o = {}) { // halftone shade band (mood)
    const c = col(o.c || '#1a1622'), y0 = o.y0 ?? 0, y1 = o.y1 ?? b.h;
    for (let y = y0; y < y1; y++) for (let x = 0; x < b.w; x++) if (((x + (y % 4 < 2 ? 0 : 2)) % 4 === 0) && y % 2 === 0) b.px(x, y, c);
  },
  uv(b, o) { // violet UV beam from a keychain
    const c = col('#c89bff'), c2 = col('#8a5aff');
    const pts = [[o.x, o.y], [o.x2, o.y2 - o.spread], [o.x2, o.y2 + o.spread]];
    spansPoly(pts, (a, bb, y) => { for (let x = a; x <= bb; x++) { const p = b.get(x, y); if (p && bayer(x, y) < .6) b.px(x, y, mix(p, bayer(x, y) < .25 ? c : c2, .6)); } });
  },
  flash(b, o = {}) { const c = col(o.c || '#ffffff'); for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) if (bayer(x, y) < (o.k ?? .5)) b.px(x, y, c); }
};
G.PX.rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

/* ---- close-up backdrops ---- */
const BACK = {
  flat(b, o) { b.fill(typeof o === 'string' ? o : (o && o.c) || '#1a1624'); },
  window(b, o = {}) { // bright classroom window behind a close-up
    b.fill(vgrad([[0, '#fff6dc'], [.6, '#ffe6b0'], [1, '#f0c890']], 0, b.h));
    const fx = Math.round(b.w * (o.at ?? .7));
    b.rect(fx, 0, 3, b.h, '#c8b89a'); b.rect(0, Math.round(b.h * .35), b.w, 2, '#c8b89a');
    b.rect(o.curtainLeft ? 0 : b.w - 22, 0, 22, b.h, dither('#f4efe4', '#dcd4c4', .3));
  },
  wall(b, o = {}) { b.fill(vgrad([[0, o.top || '#e8e0d0'], [1, o.bot || '#cfc4b0']], 0, b.h)); },
  sky(b, o = {}) { b.fill(vgrad(o.stops || [[0, '#8fb8e8'], [1, '#e8f0f8']], 0, b.h)); },
  night(b, o = {}) {
    b.fill(vgrad(o.stops || [[0, '#0c0e1c'], [1, '#1c2238']], 0, b.h));
    const rnd = G.PX.rng(o.seed || 11);
    for (let i = 0; i < (o.bokeh ?? 7); i++) { const x = rnd() * b.w, y = rnd() * b.h * .8, r = 3 + rnd() * 6, c = rnd() < .5 ? '#ffd27a' : '#8fb4ff'; spansEll(x, y, r, r, (a, bb, yy) => { for (let xx = a; xx <= bb; xx++) if (bayer(xx, yy) < .35) b.px(xx, yy, col(c)); }); }
  },
  dark(b) { b.fill(vgrad([[0, '#08070c'], [1, '#141222']], 0, b.h)); },
  warm(b) { b.fill(vgrad([[0, '#6a4a34'], [1, '#3a2418']], 0, b.h)); },
  fluoro(b) { b.fill(vgrad([[0, '#e8f2f4'], [1, '#c4d4d8']], 0, b.h)); },
  rain(b) { b.fill(vgrad([[0, '#1a2238'], [1, '#2a3450']], 0, b.h)); }
};

G.ART = { PROP, FX, BACK, steam, INK };
})(window);
