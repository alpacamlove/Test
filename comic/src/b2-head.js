/* Part B2: heads and hair. Local units: head height ≈ 1, chin at (0,0), up is −y, +x = the side the face turns to. */
(function (G) {
'use strict';
const { col, mix, xf, pathSpans, ellSpans, spansPoly } = G.PX;
const { EXPR, drawEye, drawBrow, drawMouth, faceFx } = G.FACE;

const FACE_F = 'M-0.44,-0.62 C-0.45,-0.44 -0.41,-0.3 -0.31,-0.17 C-0.21,-0.06 -0.09,0 0,0 C0.09,0 0.21,-0.06 0.31,-0.17 C0.41,-0.3 0.45,-0.44 0.44,-0.62 C0.44,-1.18 -0.44,-1.18 -0.44,-0.62 Z';
const FACE_Q = 'M-0.43,-0.62 C-0.45,-0.42 -0.4,-0.26 -0.28,-0.14 C-0.17,-0.04 -0.02,0 0.09,0 C0.17,0 0.25,-0.07 0.32,-0.17 C0.39,-0.27 0.41,-0.35 0.42,-0.42 C0.45,-0.5 0.45,-0.56 0.44,-0.62 C0.44,-1.18 -0.43,-1.18 -0.43,-0.62 Z';

/* ---- hair styles: back (behind face), front (over it). Written for the front view;
        the three-quarter view reuses them with a squash and shift toward the facing side. ---- */
const HAIR = {
  /* Хината: side-swept bangs, strands framing the cheeks, high ponytail */
  pony: {
    back: [
      'M-0.5,-0.62 C-0.54,-1.02 -0.3,-1.22 0,-1.22 C0.3,-1.22 0.54,-1.02 0.5,-0.62 C0.5,-0.45 0.46,-0.32 0.42,-0.26 L0.34,-0.5 L-0.34,-0.5 L-0.42,-0.26 C-0.46,-0.32 -0.5,-0.45 -0.5,-0.62 Z',
      'M0.12,-1.16 C0.36,-1.34 0.62,-1.28 0.7,-1.02 C0.78,-0.74 0.66,-0.4 0.74,-0.08 C0.6,-0.26 0.62,-0.5 0.52,-0.7 C0.46,-0.86 0.32,-0.98 0.12,-1.02 Z'
    ],
    front: [
      'M-0.5,-0.6 C-0.52,-1 -0.28,-1.2 0.02,-1.2 C0.3,-1.2 0.52,-1.02 0.5,-0.64 L0.46,-0.5 C0.4,-0.62 0.36,-0.7 0.3,-0.74 L0.22,-0.52 C0.16,-0.68 0.06,-0.76 -0.04,-0.8 L-0.12,-0.6 C-0.16,-0.72 -0.24,-0.8 -0.3,-0.82 L-0.38,-0.58 L-0.42,-0.3 C-0.46,-0.4 -0.5,-0.5 -0.5,-0.6 Z',
      'M0.4,-0.66 C0.44,-0.5 0.44,-0.34 0.4,-0.18 L0.34,-0.34 L0.36,-0.6 Z',
      'M-0.4,-0.66 C-0.44,-0.5 -0.44,-0.34 -0.41,-0.16 L-0.34,-0.32 L-0.35,-0.6 Z'
    ],
    shine: 'M-0.34,-0.98 C-0.14,-1.08 0.14,-1.08 0.34,-0.98 L0.32,-0.93 C0.14,-1.01 -0.14,-1.01 -0.32,-0.93 Z',
    tie: [0.5, -1.05]
  },
  /* Цукико: black, cut unevenly "with kitchen scissors", jaw-length */
  choppy: {
    back: [
      'M-0.52,-0.6 C-0.56,-1.02 -0.3,-1.2 0,-1.2 C0.3,-1.2 0.56,-1.02 0.52,-0.6 L0.54,-0.1 L0.46,-0.18 L0.44,-0.02 L0.36,-0.14 L0.3,-0.3 L-0.3,-0.3 L-0.36,-0.12 L-0.42,-0.22 L-0.47,-0.04 L-0.52,-0.2 Z'
    ],
    front: [
      'M-0.5,-0.58 C-0.52,-1 -0.28,-1.18 0,-1.18 C0.28,-1.18 0.52,-1 0.5,-0.58 L0.46,-0.44 L0.4,-0.56 L0.34,-0.42 L0.28,-0.58 L0.2,-0.46 L0.12,-0.6 L0.04,-0.44 L-0.04,-0.6 L-0.12,-0.48 L-0.2,-0.62 L-0.26,-0.44 L-0.33,-0.57 L-0.38,-0.4 L-0.44,-0.5 Z',
      'M0.42,-0.62 L0.47,-0.3 L0.44,-0.1 L0.39,-0.26 L0.37,-0.06 L0.33,-0.34 Z',
      'M-0.42,-0.62 L-0.47,-0.28 L-0.43,-0.12 L-0.39,-0.28 L-0.36,-0.08 L-0.33,-0.36 Z'
    ],
    shine: 'M-0.3,-0.97 C-0.14,-1.05 0.1,-1.05 0.26,-0.98 L0.25,-0.94 C0.1,-1 -0.12,-1 -0.28,-0.93 Z'
  },
  /* Аой: long straight hair, neat bangs, a hairpin */
  long: {
    back: ['M-0.52,-0.62 C-0.56,-1.04 -0.3,-1.22 0,-1.22 C0.3,-1.22 0.56,-1.04 0.52,-0.62 C0.56,-0.2 0.6,0.4 0.62,0.9 L-0.62,0.9 C-0.6,0.4 -0.56,-0.2 -0.52,-0.62 Z'],
    front: [
      'M-0.5,-0.6 C-0.52,-1.02 -0.28,-1.2 0,-1.2 C0.28,-1.2 0.52,-1.02 0.5,-0.6 L0.44,-0.56 L0.36,-0.52 L0.28,-0.56 L0.18,-0.52 L0.08,-0.56 L-0.04,-0.52 L-0.14,-0.56 L-0.24,-0.52 L-0.34,-0.56 L-0.44,-0.52 Z',
      'M0.4,-0.62 C0.46,-0.4 0.46,-0.1 0.44,0.2 L0.36,0.02 L0.35,-0.5 Z',
      'M-0.4,-0.62 C-0.46,-0.4 -0.46,-0.1 -0.44,0.2 L-0.36,0.02 L-0.35,-0.5 Z'
    ],
    shine: 'M-0.34,-0.98 C-0.14,-1.07 0.14,-1.07 0.34,-0.98 L0.33,-0.94 C0.14,-1.02 -0.14,-1.02 -0.33,-0.94 Z',
    pin: [0.3, -0.72]
  },
  /* Рин: bob with a clip and a dyed streak */
  bob: {
    back: ['M-0.54,-0.62 C-0.58,-1.04 -0.3,-1.22 0,-1.22 C0.3,-1.22 0.58,-1.04 0.54,-0.62 C0.56,-0.4 0.56,-0.2 0.5,-0.08 L-0.5,-0.08 C-0.56,-0.2 -0.56,-0.4 -0.54,-0.62 Z'],
    front: [
      'M-0.52,-0.6 C-0.54,-1.04 -0.28,-1.2 0.02,-1.2 C0.3,-1.2 0.54,-1.02 0.52,-0.62 C0.4,-0.72 0.2,-0.76 0.04,-0.72 C-0.1,-0.7 -0.2,-0.62 -0.26,-0.52 C-0.34,-0.6 -0.44,-0.62 -0.52,-0.6 Z',
      'M0.44,-0.64 C0.52,-0.44 0.54,-0.24 0.5,-0.08 L0.4,-0.14 C0.42,-0.3 0.4,-0.46 0.36,-0.6 Z',
      'M-0.44,-0.64 C-0.52,-0.44 -0.54,-0.24 -0.5,-0.08 L-0.4,-0.14 C-0.42,-0.3 -0.4,-0.46 -0.36,-0.6 Z'
    ],
    streak: 'M-0.26,-1.1 C-0.3,-0.9 -0.3,-0.7 -0.26,-0.54 L-0.2,-0.6 C-0.22,-0.8 -0.2,-0.96 -0.16,-1.14 Z',
    shine: 'M0.02,-1.02 C0.16,-1.07 0.3,-1.03 0.4,-0.96 L0.38,-0.92 C0.28,-0.98 0.16,-1.01 0.03,-0.98 Z',
    clip: [-0.36, -0.8]
  },
  /* Кайто: short and spiky */
  spiky: {
    back: ['M-0.5,-0.6 C-0.54,-1 -0.3,-1.2 0,-1.2 C0.3,-1.2 0.54,-1 0.5,-0.6 L0.46,-0.4 L-0.46,-0.4 Z'],
    front: [
      'M-0.5,-0.58 L-0.6,-0.8 L-0.46,-0.86 L-0.56,-1.08 L-0.34,-1.08 L-0.36,-1.3 L-0.14,-1.2 L-0.04,-1.4 L0.1,-1.22 L0.3,-1.34 L0.34,-1.12 L0.58,-1.12 L0.5,-0.94 L0.64,-0.86 L0.5,-0.72 L0.5,-0.58 L0.4,-0.66 L0.34,-0.54 L0.26,-0.68 L0.14,-0.58 L0.06,-0.72 L-0.04,-0.6 L-0.14,-0.72 L-0.22,-0.6 L-0.32,-0.7 L-0.4,-0.56 Z'
    ],
    shine: 'M-0.3,-1.02 L-0.1,-1.1 L0.14,-1.06 L0.12,-1.02 L-0.1,-1.05 L-0.28,-0.98 Z'
  },
  /* Мама: pulled back, centre part, bun, two loose strands */
  bun: {
    back: [
      'M-0.49,-0.62 C-0.53,-1.02 -0.28,-1.19 0,-1.19 C0.28,-1.19 0.53,-1.02 0.49,-0.62 L0.44,-0.52 L-0.44,-0.52 Z',
      'M0.2,-1.28 C0.2,-1.46 0.56,-1.46 0.56,-1.26 C0.56,-1.08 0.2,-1.08 0.2,-1.28 Z'
    ],
    front: [
      'M-0.47,-0.6 C-0.5,-1 -0.28,-1.17 -0.02,-1.17 L0,-0.98 C-0.18,-0.96 -0.36,-0.84 -0.42,-0.64 Z',
      'M0.47,-0.6 C0.5,-1 0.28,-1.17 0.02,-1.17 L0,-0.98 C0.18,-0.96 0.36,-0.84 0.42,-0.64 Z',
      'M0.42,-0.66 C0.46,-0.52 0.46,-0.38 0.42,-0.24 L0.4,-0.26 C0.42,-0.4 0.42,-0.52 0.39,-0.64 Z'
    ],
    shine: 'M-0.36,-0.96 C-0.24,-1.06 -0.1,-1.09 0,-1.09 L0,-1.05 C-0.1,-1.05 -0.24,-1.02 -0.34,-0.93 Z'
  },
  /* Сэйдзи: messy, usually under a hood */
  messy: {
    back: ['M-0.52,-0.6 C-0.56,-1 -0.3,-1.2 0,-1.2 C0.3,-1.2 0.56,-1 0.52,-0.6 L0.5,-0.3 L-0.5,-0.3 Z'],
    front: [
      'M-0.52,-0.58 C-0.6,-0.9 -0.4,-1.2 -0.06,-1.22 C0.3,-1.24 0.58,-1.02 0.54,-0.6 L0.48,-0.42 L0.44,-0.58 L0.36,-0.46 L0.32,-0.66 L0.2,-0.5 L0.14,-0.7 L0.02,-0.54 L-0.06,-0.72 L-0.16,-0.52 L-0.24,-0.7 L-0.34,-0.5 L-0.4,-0.66 L-0.46,-0.4 Z'
    ],
    shine: 'M-0.3,-1.02 C-0.1,-1.1 0.16,-1.08 0.34,-1 L0.32,-0.96 C0.14,-1.03 -0.1,-1.05 -0.28,-0.98 Z'
  },
  /* Отец: short crop */
  crop: {
    back: ['M-0.48,-0.62 C-0.52,-1 -0.28,-1.16 0,-1.16 C0.28,-1.16 0.52,-1 0.48,-0.62 L0.46,-0.5 L-0.46,-0.5 Z'],
    front: ['M-0.47,-0.6 C-0.5,-0.98 -0.28,-1.15 0,-1.15 C0.28,-1.15 0.5,-0.98 0.47,-0.6 L0.44,-0.66 C0.3,-0.78 0.1,-0.82 0,-0.82 C-0.1,-0.82 -0.3,-0.78 -0.44,-0.66 Z'],
    shine: 'M-0.26,-1.02 C-0.1,-1.07 0.1,-1.07 0.26,-1.02 L0.24,-0.99 C0.1,-1.03 -0.1,-1.03 -0.24,-0.99 Z'
  },
  hood: { back: ['M-0.66,-0.5 C-0.72,-1.12 -0.36,-1.36 0,-1.36 C0.36,-1.36 0.72,-1.12 0.66,-0.5 C0.66,-0.2 0.6,0.1 0.52,0.24 L-0.52,0.24 C-0.6,0.1 -0.66,-0.2 -0.66,-0.5 Z'] }
};

/* squash a front-view path for the three-quarter view */
function qT(T, k, shift) { return Object.assign({}, T, { sx: (T.sx || 1) * k, x: T.x + (T.f || 1) * shift * T.s }); }

function drawHead(buf, D, o, part) {
  /* D: design; o: {x, y (chin px), H, view 'f'|'q', f, tilt, e, look, hood, fx...} */
  const H = o.H, q = o.view === 'q', f = o.f || 1;
  const T = { x: o.x, y: o.y, s: H, f, r: o.tilt || 0 };
  const E = Object.assign({}, EXPR[o.e] || EXPR.neutral, typeof o.e === 'object' ? o.e : null, o.fx || null);
  E.pal = D.pal; E.look = o.look || E.look || [0, 0];
  E.dead = o.dead !== undefined ? o.dead : !!(D.deadEyes && E.eye !== 'wide');
  if (E.eye === 'dead') { E.eye = 'open'; E.dead = o.dead !== undefined ? o.dead : true; }
  if (D.eyeArch) E.arch = D.eyeArch;
  const P = D.pal, ink = P.ink, hs = HAIR[D.hair];
  const hairT = q ? qT(T, .9, .06) : T, backT = q ? qT(T, .96, -.03) : T;
  const hairBr = G.PX.dither(P.hair, P.hairD, 0);
  if (part !== 'front') {
  /* hood or back hair */
  if (o.hood && HAIR.hood) for (const d of HAIR.hood.back) buf.shape(pathSpans(backT, d), P.hood || '#6a6f7a', ink, { shade: [-f, 1, P.hoodD || '#4a4e58'], depth: 2 });
  for (const d of hs.back) buf.shape(pathSpans(backT, d), P.hair, ink, { shade: [-f, 1, P.hairD], depth: Math.max(1, Math.round(H * .05)) });
  if (hs.tie && !o.hood) { const [tx, ty] = xf(backT, hs.tie[0] * (q ? -.3 : 1), hs.tie[1]); buf.shape(fn => G.PX.spansEll(tx, ty, Math.max(1, H * .05), Math.max(1, H * .07), fn), P.accent, ink); }
  }
  if (part === 'back') return { T };
  /* ears (visible side in 3q is the back one) */
  const earU = q ? -.43 : .45;
  for (const s of (q ? [1] : [-1, 1])) buf.shape(ellSpans(T, earU * s, -.42, .06, .1), P.skin, ink);
  /* face */
  const face = buf.shape(pathSpans(T, q ? FACE_Q : FACE_F), P.skin, ink, { shade: [q ? -f : 0, 1, P.skinD], depth: Math.max(1, Math.round(H * .03)) });
  const skinSet = new Set(); for (let i = 0; i < face.list.length; i += 2) skinSet.add(face.list[i + 1] * buf.w + face.list[i]);
  /* features */
  const eyW = (D.eyeW || .2) * H, eyH = (D.eyeH || .2) * H, ey = -.4 + (D.eyeY || 0);
  const eyes = q ? [[-0.12, .84, -1], [.22, 1, 1]] : [[-.195, 1, -1], [.195, 1, 1]];
  if (D.cheeks && H >= 16 && !E.blush) for (const [u, k] of eyes) {
    const [bx, by] = xf(T, u * 1.05, ey + .15);
    G.PX.spansEll(bx, by, eyW * k * .42, Math.max(1, eyH * .22), (a, b2, y) => { for (let x = a; x <= b2; x++) if (G.PX.bayer(x, y) < .5) buf.px(x, y, mix(P.skin, '#ff7a8a', .35)); });
  }
  /* nose */
  const [nx, ny] = xf(T, q ? .17 : .015, -.21);
  if (H >= 14) { buf.px(Math.round(nx), Math.round(ny), mix(P.skin, P.skinD, .9)); if (H >= 40) buf.px(Math.round(nx) - f, Math.round(ny) - 1, mix(P.skin, P.skinD, .5)); }
  const [mx, my] = xf(T, q ? .06 : 0, -.1);
  drawMouth(buf, mx, my, H, E);
  /* front hair, then the shadow it casts on the forehead */
  const fronts = [];
  for (const d of hs.front) fronts.push(buf.shape(pathSpans(hairT, d), hairBr, ink, { shade: [-f, 1, P.hairD], depth: Math.max(1, Math.round(H * .035)) }));
  if (hs.streak && P.streak) buf.shape(pathSpans(hairT, hs.streak), P.streak, null);
  if (hs.shine && H >= 16) buf.shape(pathSpans(hairT, hs.shine), P.hairL, null);
  const sh = Math.max(1, Math.round(H * .03)), skinS = col(P.skinD);
  for (const fr of fronts) for (let i = 0; i < fr.list.length; i += 2) {
    const x = fr.list[i], y = fr.list[i + 1];
    for (let k = 1; k <= sh + 1; k++) { const idx = (y + k) * buf.w + x; if (skinSet.has(idx) && !fronts.some(r => buf.inShape(r, x, y + k))) buf.px(x, y + k, skinS); }
  }
  if (D.tired && H >= 20) for (const [u, k] of eyes) {
    const [tx, ty] = xf(T, u, ey + .11);
    buf.line(Math.round(tx - eyW * k * .35), Math.round(ty), Math.round(tx + eyW * k * .3), Math.round(ty), mix(P.skin, D.tired, .55));
  }
  for (const [u, k, s] of eyes) {
    const [ex, eY] = xf(T, u, ey);
    drawEye(buf, ex, eY, eyW * k, eyH, s * f, E);
  }
  const browTh = Math.max(1, Math.round(H * (D.browT || .028)));
  if (E.brow !== undefined && H >= 12) for (const [u, k, s] of eyes) {
    const [bx, by] = xf(T, u, ey - (D.browY || .15));
    drawBrow(buf, bx, by, eyW * k * 1.05, s * f, E, browTh);
  }
  if (hs.pin && P.accent) { const [px, py] = xf(hairT, hs.pin[0], hs.pin[1]); buf.rect(px - H * .06, py, Math.max(2, H * .12), Math.max(1, H * .03), P.accent); }
  if (hs.clip && P.accent) { const [px, py] = xf(hairT, hs.clip[0], hs.clip[1]); buf.rect(px - H * .02, py - H * .05, Math.max(1, H * .04), Math.max(2, H * .1), P.accent); }
  faceFx(buf, T, H, E, q ? f : 0);
  return { T };
}

G.HEAD = { HAIR, drawHead, FACE_F, FACE_Q };
})(window);
