/* Part B3: cast designs, bodies, outfits, arms and poses. Same units as heads (H), origin at the chin. */
(function (G) {
'use strict';
const { col, mix, xf, pathSpans, ellSpans, spansPoly, spansEll, dither } = G.PX;
const { drawHead } = G.HEAD;

const base = {
  white: '#fffaf6', mouthLine: '#8a3a3a', mouthIn: '#5e1c2a', tongue: '#e0707a', teeth: '#ffffff', lash2: '#6a4a44'
};
const pal = o => Object.assign({}, base, o);
const CAST = {
  hinata: { name: 'Хината', hair: 'pony', cheeks: 1, eyeW: .21, eyeH: .21, bw: 1, h: 7, outfit: 'uniform', pal: pal({
    ink: '#2a1812', skin: '#f7d2b4', skinD: '#dfa586', hair: '#8c4a2f', hairD: '#5c2d1d', hairL: '#c4744a',
    iris: '#c9822e', irisD: '#7a4516', irisL: '#f2c462', pupil: '#3a1c0c', lash: '#2a1510', brow: '#5c2d1d', accent: '#ff8a2a' }) },
  tsukiko: { name: 'Цукико', hair: 'choppy', eyeW: .2, eyeH: .205, eyeArch: .7, bw: .92, h: 6.1, deadEyes: true, tired: '#8a7a9a', outfit: 'hoodie', pal: pal({
    ink: '#14121c', skin: '#e7e8ee', skinD: '#bcc0d0', hair: '#1f1d28', hairD: '#0f0e16', hairL: '#44425a',
    iris: '#5c5068', irisD: '#2c2434', irisL: '#82768c', pupil: '#0c0a10', white: '#e9eaf0', lash: '#0f0e16', lash2: '#3a3848', brow: '#1f1d28',
    mouthLine: '#5e4450', mouthIn: '#4a2830' }) },
  aoi: { name: 'Аой', hair: 'long', cheeks: 1, eyeW: .2, eyeH: .2, bw: .95, h: 6.8, outfit: 'uniform', pal: pal({
    ink: '#1a1626', skin: '#f8dcc6', skinD: '#e2b29a', hair: '#222843', hairD: '#13162a', hairL: '#44527e',
    iris: '#6a4a36', irisD: '#3a2618', irisL: '#a47c5a', pupil: '#221208', lash: '#16121e', brow: '#222843', accent: '#8fd8c4' }) },
  rin: { name: 'Рин', hair: 'bob', cheeks: 1, eyeW: .21, eyeH: .2, bw: .95, h: 6.7, outfit: 'uniform', pal: pal({
    ink: '#22160f', skin: '#f7d8c0', skinD: '#e0ac90', hair: '#6a4030', hairD: '#44261c', hairL: '#a06a4a', streak: '#ff80b0',
    iris: '#5a3c2a', irisD: '#321e12', irisL: '#8e6a4c', pupil: '#1c0e06', lash: '#22140c', brow: '#44261c', accent: '#ffd23f' }) },
  kaito: { name: 'Кайто', hair: 'spiky', eyeW: .2, eyeH: .17, bw: 1.1, h: 7.1, outfit: 'uniformB', pal: pal({
    ink: '#1a1418', skin: '#f0c8a6', skinD: '#d49e7c', hair: '#1c1a22', hairD: '#0e0d12', hairL: '#44425a',
    iris: '#4a3222', irisD: '#2a1a10', irisL: '#7a5a3e', pupil: '#140a04', lash: '#140f14', brow: '#1c1a22' }) },
  mom: { name: 'Мама', hair: 'bun', eyeW: .19, eyeH: .14, eyeArch: .55, bw: .98, h: 7.2, outfit: 'home', pal: pal({
    ink: '#1a1214', skin: '#f2d0b6', skinD: '#d6a488', hair: '#1a1618', hairD: '#0b090b', hairL: '#3e343c',
    iris: '#3a2a22', irisD: '#1e1410', irisL: '#5e4a3c', pupil: '#0e0806', lash: '#0e0a0c', brow: '#1a1618' }) },
  seiji: { name: 'Сэйдзи', hair: 'messy', eyeW: .2, eyeH: .13, eyeArch: .5, bw: 1.18, h: 7.4, outfit: 'windbreaker', pal: pal({
    ink: '#1a1612', skin: '#eec6a4', skinD: '#cf9a78', hair: '#3a2a22', hairD: '#22160f', hairL: '#62493a',
    iris: '#4a3a2a', irisD: '#2a1e14', irisL: '#6e5a44', pupil: '#120c06', lash: '#18100a', brow: '#2a1c14', hood: '#5b6158', hoodD: '#3f443d', accent: '#f4f4f4' }) },
  father: { name: 'Отец', hair: 'crop', eyeW: .2, eyeH: .1, eyeArch: .4, browT: .05, bw: 1.3, h: 7.5, outfit: 'dark', pal: pal({
    ink: '#141010', skin: '#e2b492', skinD: '#c08a68', hair: '#1a1614', hairD: '#0c0a0a', hairL: '#34302c',
    iris: '#2a201a', irisD: '#140e0a', irisL: '#44382e', pupil: '#0a0604', lash: '#0e0a08', brow: '#141010' }) }
};

/* outfits: colours + torso details */
const CLOTH = {
  uniform: { c: '#f3f2ee', d: '#c4c6d4', sleeve: 'short', collar: 'sailor', ribbon: '#c0283c', skirt: '#2c3558', skirtD: '#1c2340' },
  uniformB: { c: '#f3f2ee', d: '#c4c6d4', sleeve: 'short', collar: 'shirt', pants: '#262b3e' },
  hoodie: { c: '#8b8e98', d: '#62656f', sleeve: 'cover', hood: true, strings: '#d8d8dc', pocket: true, pants: '#3a4660', shoes: '#cfc9bb', wide: 1.12 },
  jacket: { c: '#58623e', d: '#3c4428', sleeve: 'long', collar: 'rib', zip: '#2a2e1e', pants: '#2c3558', shoes: '#e8e4dc' },
  hoodieH: { c: '#c86a3a', d: '#9a4c26', sleeve: 'long', hood: true, strings: '#f2e6d8', pocket: true, pants: '#2c3040', shoes: '#e8e4dc' },
  pajama: { c: '#7fa2d6', d: '#56779f', sleeve: 'cover', collar: 'shirt', check: '#4f6ea0', pants: '#7fa2d6', wide: 1.1 },
  home: { c: '#8a7a70', d: '#645650', sleeve: 'long', collar: 'round', pants: '#3a3638' },
  downcoat: { c: '#262a34', d: '#171a22', sleeve: 'long', collar: 'high', quilt: '#3a404e', pants: '#3a3638' },
  windbreaker: { c: '#5b6158', d: '#3f443d', sleeve: 'long', collar: 'high', zip: '#2a2d28', wire: '#f4f4f4', pants: '#2a2c30' },
  dark: { c: '#2c2e34', d: '#1c1d22', sleeve: 'long', collar: 'round', pants: '#22232a', shoes: '#1a1614' },
  dogi: { c: '#f0ede4', d: '#c8c2b4', sleeve: 'long', collar: 'shirt', pants: '#232838', shoes: '#f0ede4' },
  towel: { c: '#f4f1ea', d: '#cfc8bc', sleeve: 'none', collar: 'none', towel: true }
};

/* arm poses for the arm on the character's own right in a front view (viewer's left is mirrored).
   [elbow u, elbow v, hand u, hand v] relative to the shoulder joint, +u = outward */
const ARM = {
  down: [.14, 1.1, .2, 2.1], hip: [.52, .95, .05, 1.6], chest: [.12, 1.05, -.42, .95],
  hold: [.06, 1.02, -.36, .82], raise: [.4, .95, .42, .12], wave: [.55, .15, .6, -.85],
  face: [.2, 1.0, -.32, -.34], mouth: [.14, 1.0, -.3, .02], phone: [.06, 1.02, -.22, .5],
  cross: [.06, 1.05, -.58, 1.12], point: [.6, .55, 1.55, .3], reach: [.55, .72, 1.3, .92],
  side: [.34, .92, .06, 1.22], behind: [.12, 1.0, .02, 1.72], knee: [.2, 1.05, .1, 1.95],
  hug: [.28, .92, -.1, 1.55], forward: [.2, .9, .3, .5], lap: [.18, 1.05, -.2, 1.9], rub: [.12, 1.02, -.12, .78]
};

function capsule(ax, ay, bx, by, r) {
  const dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1, nx = -dy / l * r, ny = dx / l * r;
  return fn => { spansPoly([[ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny]], fn); spansEll(ax, ay, r, r, fn); spansEll(bx, by, r, r, fn); };
}

function drawArm(buf, D, C, T, side, spec, o) {
  /* side: +1 = arm on viewer's right in the unflipped front view */
  const P = D.pal, sw = .6 * (D.bw || 1) * (C.wide || 1);
  const a = typeof spec === 'string' ? ARM[spec] : spec;
  if (!a) return;
  const sh = [side * (sw - .08), .42], el = [sh[0] + side * a[0], sh[1] + a[1]], ha = [sh[0] + side * a[2], sh[1] + a[3]];
  const S = xf(T, sh[0], sh[1]), E = xf(T, el[0], el[1]), Hd = xf(T, ha[0], ha[1]);
  const r = .13 * T.s * (C.wide ? 1.15 : 1) * (D.bw > 1.1 ? 1.15 : 1);
  const ink = P.ink, cl = C.c;
  if (C.sleeve === 'short') {
    const mid = [S[0] + (E[0] - S[0]) * .55, S[1] + (E[1] - S[1]) * .55];
    buf.shape(capsule(mid[0], mid[1], E[0], E[1], r * .85), P.skin, ink);
    buf.shape(capsule(E[0], E[1], Hd[0], Hd[1], r * .78), P.skin, ink, { shade: [1, 1, P.skinD] });
    buf.shape(capsule(S[0], S[1], mid[0], mid[1], r * 1.05), cl, ink, { shade: [side, 1, C.d] });
    if (o.bruise && side === o.bruise) { const bx = E[0] + (Hd[0] - E[0]) * .35, by = E[1] + (Hd[1] - E[1]) * .35; buf.ell(bx, by, r * .55, r * .4, dither('#b58a3a', '#7a4a86', .5)); }
  } else {
    buf.shape(capsule(S[0], S[1], E[0], E[1], r * 1.05), cl, ink, { shade: [side, 1, C.d] });
    const cover = C.sleeve === 'cover' && !o.hands;
    buf.shape(capsule(E[0], E[1], Hd[0], Hd[1], r * (cover ? 1.08 : .98)), cl, ink, { shade: [side, 1, C.d] });
    if (cover) { const hand = () => buf.shape(fn => spansEll(Hd[0], Hd[1], r * 1.05, r * 1.05, fn), cl, ink, { shade: [1, 1, C.d] }); if (o.hold && side === 1) return { Hd, hand }; hand(); return { Hd }; }
  }
  const hr = r * (o.fist ? .95 : 1.05);
  const hand = () => {
    if (o.glove) buf.shape(fn => spansEll(Hd[0], Hd[1] + hr * .2, hr, hr * 1.1, fn), o.glove, ink, { shade: [1, 1, mix(o.glove, '#000000', .3)] });
    else buf.shape(fn => spansEll(Hd[0], Hd[1] + hr * .2, hr, hr * 1.1, fn), P.skin, ink, { shade: [1, 1, P.skinD] });
  };
  if (o.hold && side === 1) return { Hd, hand };
  hand();
  return { Hd };
}

function drawTorso(buf, D, C, T, o) {
  const P = D.pal, w = (D.bw || 1) * (C.wide || 1), ink = P.ink;
  const t = (u, v) => `${(u * w).toFixed(3)},${v}`;
  const TORSO = `M${t(-.13, .18)} L${t(-.2, .3)} C${t(-.45, .31)} ${t(-.6, .36)} ${t(-.64, .52)} L${t(-.62, 1.2)} C${t(-.58, 1.6)} ${t(-.47, 1.84)} ${t(-.47, 1.96)} L${t(-.54, 2.6)} L${t(.54, 2.6)} L${t(.47, 1.96)} C${t(.47, 1.84)} ${t(.58, 1.6)} ${t(.62, 1.2)} L${t(.64, .52)} C${t(.6, .36)} ${t(.45, .31)} ${t(.2, .3)} L${t(.13, .18)} Z`;
  let br = C.c;
  if (C.check) { const a = col(C.c), b = col(C.check), s = Math.max(2, Math.round(T.s * .16)); br = (x, y) => ((Math.floor(x / s) + Math.floor(y / s)) % 2 && (x % s < s / 2 || y % s < s / 2)) ? b : a; }
  if (C.hood) buf.shape(pathSpans(T, `M${t(-.46, .38)} C${t(-.5, .06)} ${t(-.3, -.04)} ${t(0, -.02)} C${t(.3, -.04)} ${t(.5, .06)} ${t(.46, .38)} Z`), C.d, ink);
  buf.shape(pathSpans(T, TORSO), br, ink, { shade: [-(T.f || 1), 0, C.d], depth: Math.max(1, Math.round(T.s * .06)) });
  if (C.quilt) for (let v = .75; v < 2.6; v += .38) { const [a1, b1] = xf(T, -.6 * w, v), [a2, b2] = xf(T, .6 * w, v); buf.line(a1, b1, a2, b2, C.quilt); }
  /* neck */
  buf.shape(pathSpans(T, 'M-0.12,-0.12 L0.12,-0.12 L0.13,0.3 C0.06,0.36 -0.06,0.36 -0.13,0.3 Z'), P.skin, ink);
  buf.shape(pathSpans(T, 'M-0.12,-0.1 L0.12,-0.1 L0.12,0.04 C0.04,0.1 -0.04,0.1 -0.12,0.04 Z'), P.skinD, null);
  /* collars */
  if (C.collar === 'sailor') {
    buf.shape(pathSpans(T, `M${t(-.13, .16)} L${t(-.4, .34)} L${t(-.2, .62)} L0,0.5 Z M${t(.13, .16)} L${t(.4, .34)} L${t(.2, .62)} L0,0.5 Z`), C.c, ink);
    buf.shape(pathSpans(T, 'M-0.13,0.52 L0,0.44 L0.13,0.52 L0.18,0.74 L0.06,0.66 L0,0.8 L-0.06,0.66 L-0.18,0.74 Z'), C.ribbon, ink);
  } else if (C.collar === 'shirt') {
    buf.shape(pathSpans(T, `M${t(-.13, .14)} L${t(-.32, .3)} L${t(-.12, .5)} L0,0.34 Z M${t(.13, .14)} L${t(.32, .3)} L${t(.12, .5)} L0,0.34 Z`), C.c, ink);
    if (!C.check) for (let v = .7; v < 2.4; v += .45) { const [bx, by] = xf(T, 0, v); buf.px(Math.round(bx), Math.round(by), col(C.d)); }
  } else if (C.collar === 'rib' || C.collar === 'high') {
    buf.shape(pathSpans(T, `M${t(-.2, .02)} L${t(.2, .02)} L${t(.26, .34)} L${t(-.26, .34)} Z`), C.collar === 'rib' ? C.d : C.c, ink);
    if (C.zip) { const [a1, b1] = xf(T, 0, .1), [a2, b2] = xf(T, 0, 2.6); buf.line(a1, b1, a2, b2, C.zip); }
  } else if (C.collar === 'round') {
    buf.shape(pathSpans(T, `M${t(-.2, .2)} C${t(-.14, .36)} ${t(.14, .36)} ${t(.2, .2)} L${t(.24, .26)} C${t(.14, .46)} ${t(-.14, .46)} ${t(-.24, .26)} Z`), C.d, null);
  }
  if (C.strings) for (const s of [-1, 1]) { const [a1, b1] = xf(T, s * .12, .3), [a2, b2] = xf(T, s * .15, 1.05); buf.line(a1, b1, a2, b2, C.strings); }
  if (C.pocket) buf.shape(pathSpans(T, `M${t(-.4, 1.62)} L${t(.4, 1.62)} L${t(.48, 2.2)} L${t(-.48, 2.2)} Z`), C.c, ink, { shade: [0, 1, C.d] });
  if (C.wire) { const [a1, b1] = xf(T, .36, -.42), [a2, b2] = xf(T, .2, .9); buf.line(a1, b1, a2, b2, C.wire); }
  if (C.towel) {
    buf.shape(pathSpans(T, `M${t(-.7, .3)} C${t(-.5, .1)} ${t(.5, .1)} ${t(.7, .3)} L${t(.62, 2.6)} L${t(-.62, 2.6)} Z`), C.c, ink, { shade: [1, 1, C.d], depth: 2 });
  }
}

/* legs for full-body poses; returns nothing, draws in place. Units from the chin. */
const LEGS = {
  stand: { hip: 2.55, l: [[-.2, 4.4], [-.22, 6.1]], r: [[.2, 4.4], [.22, 6.1]] },
  walk: { hip: 2.55, l: [[-.1, 4.35], [-.45, 6.0]], r: [[.26, 4.3], [.5, 6.05]] },
  run: { hip: 2.5, l: [[-.5, 4.0], [-1.1, 5.2]], r: [[.6, 3.8], [.9, 5.6]] },
  sit: { hip: 2.55, l: [[-.28, 3.3], [-.3, 4.9]], r: [[.2, 3.3], [.22, 4.9]], short: true },
  sitQ: { hip: 2.5, l: [[.7, 2.72], [.8, 4.25]], r: [[.95, 2.78], [1.05, 4.3]], front: true },
  crouch: { hip: 2.5, l: [[-.56, 2.2], [-.42, 3.6]], r: [[.56, 2.2], [.42, 3.6]], front: true },
  hugknees: { hip: 2.6, l: [[-.2, 1.25], [-.24, 2.62]], r: [[.2, 1.25], [.24, 2.62]], front: true },
  seiza: { hip: 2.55, l: [[-.32, 3.0], [-.24, 3.12]], r: [[.32, 3.0], [.24, 3.12]], kneel: true, front: true }
};

function drawLegs(buf, D, C, T, pose, view) {
  const L = (view === 'q' && LEGS[pose + 'Q']) || LEGS[pose]; if (!L) return;
  const P = D.pal, ink = P.ink, r = .15 * T.s * (D.bw || 1);
  const pantsC = C.pants || null, skirt = C.skirt;
  const shoe = C.shoes || '#f0ece4';
  for (const [side, pts] of [[-1, L.l], [1, L.r]]) {
    const hip = xf(T, side * .22 * (D.bw || 1), L.hip), kn = xf(T, pts[0][0], pts[0][1]), ft = xf(T, pts[1][0], pts[1][1]);
    const legC = pantsC || P.skin, legD = pantsC ? mix(pantsC, '#000000', .3) : P.skinD;
    buf.shape(capsule(hip[0], hip[1], kn[0], kn[1], r * 1.1), legC, ink, { shade: [1, 0, legD] });
    buf.shape(capsule(kn[0], kn[1], ft[0], ft[1], r * .95), skirt && !pantsC ? (C.socks || '#2a2a36') : legC, ink, { shade: [1, 0, legD] });
    if (!L.kneel) buf.shape(fn => spansEll(ft[0] + side * r * .4, ft[1] + r * .2, r * 1.5, r * .8, fn), shoe, ink, { shade: [0, 1, mix(shoe, '#000000', .25)] });
  }
  if (skirt) {
    const [cx, cy] = xf(T, 0, 2.15);
    const s = T.s, top = cy, len = (pose === 'sit' ? .9 : pose === 'crouch' ? .8 : 1.15) * s, wv = .58 * s * (D.bw || 1);
    buf.shape(fn => spansPoly([[cx - wv * .82, top], [cx + wv * .82, top], [cx + wv * 1.18, top + len], [cx - wv * 1.18, top + len]], fn), skirt, ink, { shade: [0, 1, C.skirtD] });
    for (let k = -2; k <= 2; k++) buf.line(cx + k * wv * .35, top + len * .25, cx + k * wv * .45, top + len - 1, C.skirtD);
  }
}

/* the whole figure. o: {x, y (chin px), H (head px), view, f, pose (legs), armL, armR, e, look, tilt, outfit, hood, hands, glove, bruise, noBody} */
function drawChar(buf, id, o) {
  const D = CAST[id], C = CLOTH[o.outfit || D.outfit], f = o.f || 1;
  const T = { x: o.x, y: o.y, s: o.H, f, sx: o.view === 'q' ? .88 : 1 };
  const aL = o.armL || 'down', aR = o.armR || 'down';
  const opts = { hands: o.hands, glove: o.glove, fist: o.fist, bruise: o.bruise, hold: o.hold };
  const held = r => { if (!r || !r.hand) return; const h = o.hold, f2 = G.ART && G.ART.PROP[h.id]; if (f2) f2(buf, r.Hd[0] + (h.dx || 0) * o.H, r.Hd[1] + (h.dy ?? .25) * o.H, (h.s || .45) * o.H, h); r.hand(); };
  const head = Object.assign({}, o, { tilt: o.tilt || 0 });
  drawHead(buf, D, head, 'back');
  if (!o.noBody) {
    const L = o.pose && ((o.view === 'q' && LEGS[o.pose + 'Q']) || LEGS[o.pose]);
    if (L && !L.front) drawLegs(buf, D, C, T, o.pose, o.view);
    /* in a 3/4 view the far arm goes behind the torso */
    const far = o.view === 'q' ? -1 : 0;
    if (far) drawArm(buf, D, C, T, -1, aL, opts);
    drawTorso(buf, D, C, T, o);
    if (L && L.front) drawLegs(buf, D, C, T, o.pose, o.view);
    if (!far) { drawArm(buf, D, C, T, -1, aL, opts); held(drawArm(buf, D, C, T, 1, aR, opts)); }
    else held(drawArm(buf, D, C, T, 1, aR, opts));
  }
  drawHead(buf, D, head, 'front');
  if (o.arms2) { drawArm(buf, D, C, T, -1, o.arms2[0], opts); drawArm(buf, D, C, T, 1, o.arms2[1], opts); }
  if (o.breath) breath(buf, o.x + f * o.H * .45, o.y - o.H * .1, o.H);
}
function breath(buf, x, y, H) {
  const c = col('#e8eef8');
  for (let k = 0; k < 3; k++) { const r = H * (.06 + k * .03); G.PX.spansEll(x + k * H * .09, y - k * H * .05, r, r * .8, (a, b, yy) => { for (let xx = a; xx <= b; xx++) if (G.PX.bayer(xx, yy) < .55 - k * .12) buf.px(xx, yy, c); }); }
}

G.BODY = { CAST, CLOTH, ARM, LEGS, drawChar, drawArm, drawTorso, capsule, breath };
})(window);
