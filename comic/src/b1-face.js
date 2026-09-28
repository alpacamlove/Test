/* Part B1: faces — eyes, brows, mouths, face fx. Units: H = head size in px, origin at the chin. */
(function (G) {
'use strict';
const { col, mix, bayer, spansPoly, spansEll } = G.PX;

/* expression presets; any field can be overridden per panel */
const EXPR = {
  neutral: { eye: 'open', brow: 0, mouth: 'line' },
  talk: { eye: 'open', brow: 0, mouth: 'talk' },
  smile: { eye: 'open', brow: -1, mouth: 'smile' },
  soft: { eye: 'soft', brow: -2, mouth: 'smile' },
  grin: { eye: 'open', brow: -1, mouth: 'grin' },
  laugh: { eye: 'happy', brow: -1, mouth: 'laugh' },
  happy: { eye: 'happy', brow: -1, mouth: 'smile' },
  cheer: { eye: 'happy', brow: -1, mouth: 'grin' },
  smug: { eye: 'half', brow: -1, mouth: 'smirk' },
  smirk: { eye: 'open', brow: 0, mouth: 'smirk' },
  angry: { eye: 'narrow', brow: 3, mouth: 'frown' },
  shout: { eye: 'open', brow: 3, mouth: 'shout' },
  yell: { eye: 'squeeze', brow: 3, mouth: 'shout' },
  grit: { eye: 'narrow', brow: 3, mouth: 'grit' },
  annoyed: { eye: 'half', brow: 2, mouth: 'frown' },
  glare: { eye: 'narrow', brow: 2, mouth: 'line' },
  cold: { eye: 'half', brow: 1, mouth: 'line' },
  wary: { eye: 'dead', brow: 1, mouth: 'line' },
  blank: { eye: 'dead', brow: 0, mouth: 'line' },
  sad: { eye: 'soft', brow: -3, mouth: 'frown' },
  hurt: { eye: 'half', brow: -3, mouth: 'line' },
  cry: { eye: 'squeeze', brow: -3, mouth: 'wobble', tears: 2 },
  sob: { eye: 'teary', brow: -3, mouth: 'wobble', tears: 1 },
  teary: { eye: 'teary', brow: -2, mouth: 'line' },
  shock: { eye: 'wide', brow: -3, mouth: 'open' },
  gasp: { eye: 'wide', brow: -3, mouth: 'line' },
  surprised: { eye: 'open', brow: -3, mouth: 'open' },
  pain: { eye: 'squeeze', brow: -2, mouth: 'grit' },
  wince: { eye: 'wince', brow: -2, mouth: 'grit' },
  flustered: { eye: 'open', brow: -2, mouth: 'wavy', blush: 1 },
  embarrassed: { eye: 'half', brow: -2, mouth: 'wavy', blush: 1 },
  closed: { eye: 'closed', brow: -1, mouth: 'line' },
  calm: { eye: 'closed', brow: -1, mouth: 'smile' },
  eat: { eye: 'happy', brow: -1, mouth: 'full' },
  chew: { eye: 'dead', brow: 0, mouth: 'full' },
  pout: { eye: 'half', brow: 1, mouth: 'pout' },
  focus: { eye: 'narrow', brow: 1, mouth: 'line' },
  stern: { eye: 'half', brow: 2, mouth: 'line' },
  empty: { eye: 'wide', brow: 0, mouth: 'line', shine: 0 }
};

function eyeShape(cx, cy, w, h, side, open, tilt, arch) {
  /* returns { up: [...], lo: [...] } lid polylines from inner → outer corner */
  const up = [], lo = [], n = Math.max(6, Math.round(w * 1.5));
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = cx + side * (t - .5) * w, s = Math.sin(Math.PI * Math.min(1, t * 1.05));
    const corner = (t - .5) * -h * .12;
    up.push([x, cy + corner - h * open * .55 * Math.pow(Math.max(0, s), arch) + tilt * h * .45 * (1 - t) * open]);
    lo.push([x, cy + corner + h * open * .42 * Math.pow(Math.max(0, s), 1.4)]);
  }
  return { up, lo };
}
function polyline(buf, pts, c, th) {
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    for (let k = 0; k < th; k++) buf.line(x0, y0 + k, x1, y1 + k, c);
  }
}
function arc(buf, x0, x1, y, bulge, c, th = 1) {
  const pts = [], n = Math.max(4, Math.round(Math.abs(x1 - x0)));
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push([x0 + (x1 - x0) * t, y + bulge * 4 * t * (1 - t)]); }
  polyline(buf, pts, c, th);
}

/* one eye. side: -1 = on viewer's left, +1 = right. o: resolved expression + design */
function drawEye(buf, cx, cy, w, h, side, o) {
  const P = o.pal, lashT = Math.max(1, Math.round(h * .17));
  const lx = (o.look ? o.look[0] : 0), ly = (o.look ? o.look[1] : 0);
  const st = o.eye;
  if (w < 3.2 || h < 3) { // tiny: a dot or a dash
    const x = Math.round(cx), y = Math.round(cy);
    if (st === 'happy') { buf.px(x - 1, y, P.lash); buf.px(x, y - 1, P.lash); buf.px(x + 1, y, P.lash); }
    else if (st === 'closed' || st === 'squeeze' || st === 'wince') { buf.px(x - 1, y, P.lash); buf.px(x, y, P.lash); }
    else { buf.px(x, y - 1, P.lash); buf.px(x, y, P.iris); if (w >= 2.4) buf.px(x + side * -1, y - 1, P.lash); }
    return;
  }
  if (st === 'happy') { arc(buf, cx - w / 2, cx + w / 2, cy + h * .12, -h * .45, P.lash, lashT); return; }
  if (st === 'closed') { arc(buf, cx - w / 2, cx + w / 2, cy, h * .28, P.lash, lashT); if (w > 6) buf.px(Math.round(cx + side * w * .52), Math.round(cy + h * .05), P.lash); return; }
  if (st === 'squeeze' || st === 'wince') {
    const ix = cx - side * w * .45, ox = cx + side * w * .5;
    polyline(buf, [[ox, cy - h * .32], [ix, cy], [ox, cy + h * .3]], P.lash, lashT);
    if (st === 'wince') buf.line(ix, cy - h * .5, ox, cy - h * .38, P.lash);
    return;
  }
  const open = st === 'half' ? .55 : st === 'narrow' ? .48 : st === 'soft' ? .8 : st === 'wide' ? 1.1 : 1;
  const tilt = (o.brow > 1 && st === 'narrow') ? .5 : (o.brow < -1 && (st === 'soft' || st === 'teary')) ? -.25 : 0;
  const { up, lo } = eyeShape(cx, cy, w, h, side, open, tilt, o.arch || .8);
  const poly = up.concat(lo.slice().reverse());
  const g = ++buf.gen, stp = buf.stamp, W = buf.w, list = [];
  spansPoly(poly, (a, b, y) => { for (let x = Math.max(0, a); x <= Math.min(W - 1, b); x++) if (y >= 0 && y < buf.h) { stp[y * W + x] = g; list.push(x, y); } });
  const white = col(P.white), whiteS = mix(P.white, '#9aa6c8', .35);
  for (let i = 0; i < list.length; i += 2) buf.px(list[i], list[i + 1], stp[(list[i + 1] - 1) * W + list[i]] === g ? white : whiteS);
  /* iris: big, round-ish, sitting a little low so the lid cuts its top */
  const small = st === 'wide';
  const irx = w * (small ? .2 : .37), iry = h * (small ? .24 : .52);
  const icx = cx + lx * w * .16, icy = cy + ly * h * .1 + h * (small ? 0 : .1);
  const iris = col(o.dead ? P.irisD : P.iris), irisD = col(P.irisD), irisL = col(o.dead ? P.iris : P.irisL), pupil = col(P.pupil);
  const big = h >= 7;
  for (let i = 0; i < list.length; i += 2) {
    const x = list[i], y = list[i + 1], dx = (x + .5 - icx) / irx, dy = (y + .5 - icy) / iry, r = dx * dx + dy * dy;
    if (r > 1) continue;
    let c = iris;
    if (dy < -.25) c = irisD;
    else if (dy > .38 && r > .25) c = irisL;
    if (big && !small && dx * dx + (dy + .05) * (dy + .05) < .09) c = o.dead ? irisD : pupil;
    if (big && r > .82) c = irisD;
    buf.px(x, y, c);
  }
  /* shines: one big, one small */
  if (o.dead && w > 6 && o.shine !== 0) { const tx = Math.round(icx - irx * .4), ty = Math.round(icy - iry * .45); if (buf.inShape({ g }, tx, ty)) buf.px(tx, ty, col('#8e8a9c')); }
  if (o.shine !== 0 && !o.dead) {
    const s = Math.max(1, Math.round(w * (small ? .12 : .22)));
    const sx = Math.round(icx - irx * .55), sy = Math.round(icy - iry * .62);
    for (let yy = 0; yy < s; yy++) for (let xx = 0; xx < s; xx++) if (buf.inShape({ g }, sx + xx, sy + yy)) buf.px(sx + xx, sy + yy, col('#ffffff'));
    if (w > 6) { const tx = Math.round(icx + irx * .45), ty = Math.round(icy + iry * .35); if (buf.inShape({ g }, tx, ty)) buf.px(tx, ty, col('#ffffff')); }
  }
  /* upper lash: thick, thinning at the inner corner, flicking out at the outer corner */
  const n = up.length;
  for (let i = 1; i < n; i++) {
    const t = i / (n - 1), th = Math.max(1, Math.round(lashT * (t < .25 ? .6 : 1)));
    const [x0, y0] = up[i - 1], [x1, y1] = up[i];
    for (let k = 0; k < th; k++) buf.line(x0, y0 - th + 1 + k, x1, y1 - th + 1 + k, P.lash);
  }
  const oc = up[n - 1];
  if (w > 5) {
    const fl = Math.max(1, Math.round(w * .14));
    for (let k = 0; k < Math.max(1, lashT - 1); k++) buf.line(oc[0], oc[1] - k, oc[0] + side * fl, oc[1] - k - Math.round(fl * .45), P.lash);
  }
  if (w > 6) polyline(buf, lo.slice(Math.floor(lo.length * .6)), P.lash2, 1);
  if (st === 'teary' || o.tears) {
    const tc = col('#9fd4ff');
    for (let i = 1; i < lo.length - 1; i += 2) buf.px(Math.round(lo[i][0]), Math.round(lo[i][1]) - 1, tc);
  }
}

function drawBrow(buf, cx, cy, w, side, o, th) {
  const lift = (o.brow < 0 ? o.brow * .35 : 0), angry = o.brow > 0 ? o.brow : 0, sad = o.brow < -1 ? -o.brow - 1 : 0;
  const ix = cx - side * w * .5, ox = cx + side * w * .5;
  const iy = cy + lift + angry * .7 - sad * .9, oy = cy + lift - angry * .35 + sad * .5, my = Math.min(iy, oy) - w * .12;
  const pts = [];
  for (let i = 0; i <= 6; i++) { const t = i / 6, u = 1 - t; pts.push([u * u * ix + 2 * u * t * cx + t * t * ox, u * u * iy + 2 * u * t * my + t * t * oy]); }
  polyline(buf, pts, o.pal.brow, th);
}

function drawMouth(buf, mx, my, H, o) {
  const P = o.pal, mw = Math.max(2, H * .13), c = P.mouthLine;
  const x0 = Math.round(mx - mw / 2), x1 = Math.round(mx + mw / 2), y = Math.round(my);
  const big = H >= 26;
  switch (o.mouth) {
    case 'line': buf.line(Math.round(mx - mw * .3), y, Math.round(mx + mw * .3), y, c); break;
    case 'smile': arc(buf, x0, x1, y - 1, H >= 18 ? 2 : 1, c); break;
    case 'frown': arc(buf, x0 + 1, x1 - 1, y + 1, -Math.max(1, H * .04), c); break;
    case 'smirk': buf.line(Math.round(mx - mw * .35), y, Math.round(mx + mw * .2), y, c); buf.line(Math.round(mx + mw * .2), y, Math.round(mx + mw * .5), y - (big ? 2 : 1), c); break;
    case 'pout': arc(buf, x0 + 1, x1 - 1, y, -1, c); break;
    case 'wavy': for (let x = x0; x <= x1; x++) buf.px(x, y + ((x - x0) % 2 ? -0 : (big ? 1 : 0)), c); break;
    case 'talk': case 'open': case 'full': {
      const rx = mw * (o.mouth === 'open' ? .28 : .24), ry = H * (o.mouth === 'open' ? .06 : .04);
      if (o.mouth === 'full') { buf.ell(mx, my, rx * 1.2, Math.max(1, ry * .8), P.mouthIn); break; }
      buf.ell(mx, my + ry * .3, Math.max(1, rx), Math.max(1, ry), P.mouthIn);
      if (big) buf.ell(mx, my + ry * .9, rx * .6, ry * .35, P.tongue);
      break;
    }
    case 'grin': case 'laugh': case 'shout': {
      const w2 = mw * (o.mouth === 'shout' ? .55 : o.mouth === 'laugh' ? .6 : .55), h2 = H * (o.mouth === 'grin' ? .07 : o.mouth === 'laugh' ? .1 : .12);
      const pts = [];
      for (let i = 0; i <= 10; i++) { const t = i / 10, a = Math.PI * t; pts.push([mx - w2 * Math.cos(a), my + (o.mouth === 'shout' ? -h2 * .35 : 0) + h2 * Math.sin(a)]); }
      if (o.mouth === 'shout') for (let i = 10; i >= 0; i--) { const t = i / 10, a = Math.PI * t; pts.push([mx - w2 * .8 * Math.cos(a), my - h2 * .35 - h2 * .25 * Math.sin(a)]); }
      buf.poly(pts, P.mouthIn);
      if (big) {
        const ty = Math.round(my + (o.mouth === 'shout' ? -h2 * .4 : 0));
        buf.line(Math.round(mx - w2 * .75), ty, Math.round(mx + w2 * .75), ty, P.teeth);
        if (h2 > 3) buf.ell(mx, my + h2 * .75, w2 * .45, h2 * .25, P.tongue);
      }
      break;
    }
    case 'grit': {
      const w2 = mw * .45, h2 = Math.max(2, H * .05);
      buf.rect(Math.round(mx - w2), Math.round(my - h2 / 2), Math.round(w2 * 2), Math.round(h2), P.teeth);
      buf.line(Math.round(mx - w2), Math.round(my), Math.round(mx + w2 - 1), Math.round(my), P.mouthLine);
      break;
    }
    case 'wobble': { for (let x = x0; x <= x1; x++) buf.px(x, y + (((x - x0) >> 1) % 2 ? 1 : 0), c); break; }
  }
}

function faceFx(buf, T, H, o, side3q) {
  const P = o.pal;
  const at = (u, v) => G.PX.xf(T, u, v);
  if (o.blush) {
    const bc = col('#f0788a');
    for (const s of [-1, 1]) {
      const [bx, by] = at(s * .25 + side3q * .06, -.24);
      if (H >= 20) for (let k = 0; k < 3; k++) buf.line(bx - 2 + k * 2 * 1 + (s < 0 ? -1 : 0), by + 1, bx - 1 + k * 2, by - 1, bc);
      else buf.px(Math.round(bx), Math.round(by), bc);
    }
  }
  if (o.sweat) {
    const [sx, sy] = at(.42 * (o.sweat > 0 ? 1 : -1), -.72);
    const r = Math.max(1.5, H * .045);
    buf.shape(fn => { spansEll(sx, sy + r * .6, r, r * 1.1, fn); spansPoly([[sx - r * .7, sy + r * .2], [sx, sy - r * 1.6], [sx + r * .7, sy + r * .2]], fn); }, '#bfe6ff', '#3a6d9a');
    buf.px(Math.round(sx - r * .3), Math.round(sy + r * .3), col('#ffffff'));
  }
  if (o.tears) {
    const tc = col('#8fd0ff'), td = col('#5aa6e0');
    for (const s of (o.tears === 2 ? [-1, 1] : [1])) {
      const [tx, ty] = at(s * .19 + side3q * .05, -.3);
      const len = H * .32;
      for (let k = 0; k < len; k++) { buf.px(Math.round(tx + s * Math.sin(k / 3) * .6), Math.round(ty + k), k % 3 ? tc : td); if (H > 30) buf.px(Math.round(tx + 1), Math.round(ty + k), tc); }
    }
  }
  if (o.anger) {
    const [ax, ay] = at(.3, -.86), r = Math.max(2, H * .06), c = col('#e0283c');
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      buf.line(ax + dx * r * .3, ay + dy * r, ax + dx * r, ay + dy * r * .3, c);
    }
  }
  if (o.gloom) {
    for (let v = -.9; v < -.3; v += .02) for (let u = -.5; u < .5; u += .02) {
      const [x, y] = at(u, v); const p = buf.get(Math.round(x), Math.round(y));
      if (p && bayer(Math.round(x), Math.round(y)) < .55 + (v + .9) * .5 * -1 + .3) buf.px(Math.round(x), Math.round(y), mix(p, '#1a1030', .45));
    }
  }
  if (o.nose === 'red') { const [nx, ny] = at(side3q * .14, -.2); buf.ell(nx, ny, Math.max(1, H * .04), Math.max(1, H * .025), '#ff8a8a'); }
}

G.FACE = { EXPR, drawEye, drawBrow, drawMouth, faceFx, arc, polyline };
})(window);
