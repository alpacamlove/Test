/* Хината и Цукико — pixel manhwa engine. Part A: pixels, shapes, light. */
(function (G) {
'use strict';

const hexCache = new Map();
function col(c) {
  if (typeof c !== 'string') return c;
  let v = hexCache.get(c);
  if (!v) { const n = parseInt(c.slice(1), 16); v = [n >> 16 & 255, n >> 8 & 255, n & 255]; hexCache.set(c, v); }
  return v;
}
const mix = (a, b, t) => { a = col(a); b = col(b); return [a[0] + (b[0] - a[0]) * t | 0, a[1] + (b[1] - a[1]) * t | 0, a[2] + (b[2] - a[2]) * t | 0]; };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);
const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
/* brushes: a colour, or (x, y) => colour | null */
const dither = (a, b, t) => { a = col(a); b = col(b); return (x, y) => bayer(x, y) < t ? b : a; };
const checker = (a, b) => { a = col(a); b = col(b); return (x, y) => ((x + y) & 1) ? b : a; };
function vgrad(stops, y0, y1) { // dithered vertical gradient brush
  stops = stops.map(([t, c]) => [t, col(c)]);
  return (x, y) => {
    let t = (y - y0) / (y1 - y0 || 1) + (bayer(x, y) - .5) / (stops.length * 2.2);
    t = Math.max(0, Math.min(1, t));
    for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) {
      const [ta, ca] = stops[i - 1], [tb, cb] = stops[i];
      return (t - ta) / (tb - ta || 1) < .5 ? ca : cb;
    }
    return stops[stops.length - 1][1];
  };
}

class Pix {
  constructor(w, h) {
    this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4);
    this.stamp = new Uint32Array(w * h); this.gen = 1;
    this.emis = [];
  }
  px(x, y, c) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || !c) return;
    const i = (y * this.w + x) << 2, d = this.d;
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
  get(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    const i = (y * this.w + x) << 2, d = this.d;
    return d[i + 3] ? [d[i], d[i + 1], d[i + 2]] : null;
  }
  span(a, b, y, br) {
    if (y < 0 || y >= this.h) return;
    a = Math.max(0, a); b = Math.min(this.w - 1, b);
    if (typeof br === 'function') { for (let x = a; x <= b; x++) this.px(x, y, br(x, y)); }
    else { br = col(br); for (let x = a; x <= b; x++) this.px(x, y, br); }
  }
  rect(x, y, w, h, br) { x = Math.round(x); y = Math.round(y); for (let j = 0; j < Math.round(h); j++) this.span(x, x + Math.round(w) - 1, y + j, br); }
  fill(br) { this.rect(0, 0, this.w, this.h, br); }
  line(x0, y0, x1, y1, br) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const f = typeof br === 'function' ? br : null, c = f ? null : col(br);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy;
    for (;;) {
      this.px(x0, y0, f ? f(x0, y0) : c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * e;
      if (e2 >= dy) { e += dy; x0 += sx; }
      if (e2 <= dx) { e += dx; y0 += sy; }
    }
  }
  poly(pts, br) { spansPoly(pts, (a, b, y) => this.span(a, b, y, br)); }
  ell(cx, cy, rx, ry, br) { spansEll(cx, cy, rx, ry, (a, b, y) => this.span(a, b, y, br)); }
  /* a shape with a 1px ink outline around it (drawn first, so it also lines whatever it overlaps) */
  shape(spansFn, br, ink, o) {
    const g = ++this.gen, st = this.stamp, w = this.w, h = this.h, list = [];
    spansFn((a, b, y) => {
      if (y < 0 || y >= h) return;
      a = Math.max(0, a); b = Math.min(w - 1, b);
      for (let x = a; x <= b; x++) { st[y * w + x] = g; list.push(x, y); }
    });
    if (ink) {
      ink = col(ink);
      const skip = o && o.noTop;
      for (let i = 0; i < list.length; i += 2) {
        const x = list[i], y = list[i + 1];
        if (x > 0 && st[y * w + x - 1] !== g) this.px(x - 1, y, ink);
        if (x < w - 1 && st[y * w + x + 1] !== g) this.px(x + 1, y, ink);
        if (!skip && y > 0 && st[(y - 1) * w + x] !== g) this.px(x, y - 1, ink);
        if (y < h - 1 && st[(y + 1) * w + x] !== g) this.px(x, y + 1, ink);
      }
    }
    const f = typeof br === 'function' ? br : null, c = f ? null : col(br);
    for (let i = 0; i < list.length; i += 2) this.px(list[i], list[i + 1], f ? f(list[i], list[i + 1]) : c);
    /* shade: darken pixels whose neighbour (dx,dy) steps outside the shape */
    if (o && o.shade) {
      const [dx, dy, sc] = o.shade, s = col(sc), depth = o.depth || 1;
      for (let i = 0; i < list.length; i += 2) {
        const x = list[i], y = list[i + 1];
        for (let k = 1; k <= depth; k++) {
          const nx = x + dx * k, ny = y + dy * k;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h || st[ny * w + nx] !== g) { this.px(x, y, s); break; }
        }
      }
    }
    return { g, list };
  }
  inShape(ref, x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h && this.stamp[y * this.w + x] === ref.g; }
  toCanvas(cv) {
    cv.width = this.w; cv.height = this.h;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(this.w, this.h);
    img.data.set(this.d); ctx.putImageData(img, 0, 0);
    return cv;
  }
}

function spansPoly(pts, fn) {
  let minY = Infinity, maxY = -Infinity;
  for (const p of pts) { if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; }
  const y0 = Math.ceil(minY - .5), y1 = Math.floor(maxY - .5), n = pts.length, xs = [];
  for (let y = y0; y <= y1; y++) {
    const sy = y + .5; xs.length = 0;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if ((yi > sy) !== (yj > sy)) xs.push(xi + (sy - yi) / (yj - yi) * (xj - xi));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const a = Math.ceil(xs[k] - .5), b = Math.floor(xs[k + 1] - .5);
      if (b >= a) fn(a, b, y);
    }
  }
}
function spansEll(cx, cy, rx, ry, fn) {
  if (rx <= 0 || ry <= 0) return;
  const y0 = Math.ceil(cy - ry - .5), y1 = Math.floor(cy + ry - .5);
  for (let y = y0; y <= y1; y++) {
    const t = (y + .5 - cy) / ry, k = 1 - t * t;
    if (k <= 0) continue;
    const dx = rx * Math.sqrt(k), a = Math.ceil(cx - dx - .5), b = Math.floor(cx + dx - .5);
    if (b >= a) fn(a, b, y);
  }
}

/* ---- tiny SVG-path parser (absolute M L H V Q C Z) → point lists ---- */
const pathCache = new Map();
function parsePath(d) {
  let r = pathCache.get(d);
  if (r) return r;
  const tok = d.match(/[MLHVQCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi), polys = [];
  let i = 0, cur = null, x = 0, y = 0, cmd = 'M';
  const num = () => parseFloat(tok[i++]);
  while (i < tok.length) {
    if (/[A-Za-z]/.test(tok[i])) cmd = tok[i++].toUpperCase();
    if (cmd === 'Z') { cur = null; continue; }
    if (cmd === 'M') { x = num(); y = num(); cur = [[x, y]]; polys.push(cur); cmd = 'L'; }
    else if (cmd === 'L') { x = num(); y = num(); cur.push([x, y]); }
    else if (cmd === 'H') { x = num(); cur.push([x, y]); }
    else if (cmd === 'V') { y = num(); cur.push([x, y]); }
    else if (cmd === 'Q') {
      const cx = num(), cy = num(), ex = num(), ey = num();
      for (let k = 1; k <= 8; k++) { const t = k / 8, u = 1 - t; cur.push([u * u * x + 2 * u * t * cx + t * t * ex, u * u * y + 2 * u * t * cy + t * t * ey]); }
      x = ex; y = ey;
    } else if (cmd === 'C') {
      const c1x = num(), c1y = num(), c2x = num(), c2y = num(), ex = num(), ey = num();
      for (let k = 1; k <= 10; k++) { const t = k / 10, u = 1 - t; cur.push([u * u * u * x + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * ex, u * u * u * y + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * ey]); }
      x = ex; y = ey;
    } else i++;
  }
  pathCache.set(d, polys);
  return polys;
}
/* transform: local (u,v) → pixel. T = {x, y, s, f (±1 flip), r (radians), sx (x squash)} */
function xf(T, u, v) {
  if (T.r) { const c = Math.cos(T.r), s = Math.sin(T.r); const u1 = u * c - v * s; v = u * s + v * c; u = u1; }
  return [T.x + (T.f || 1) * u * (T.sx || 1) * T.s, T.y + v * T.s];
}
function pathSpans(T, d) {
  const polys = parsePath(d).map(p => p.map(([u, v]) => xf(T, u, v)));
  return fn => { for (const p of polys) spansPoly(p, fn); };
}
function ellSpans(T, u, v, ru, rv) {
  const [cx, cy] = xf(T, u, v);
  return fn => spansEll(cx, cy, Math.abs(ru * T.s * (T.sx || 1)), Math.abs(rv * T.s), fn);
}

/* ---- lighting: ambient × colour + banded, dithered light pools; emissive drawn after ---- */
function lightPass(buf, L) {
  if (!L) return;
  const amb = L.amb || [1, 1, 1], lights = (L.lights || []).map(l => Object.assign({ ry: l.r, k: 1, bands: 4 }, l, { c: col(l.c || '#ffffff') }));
  const d = buf.d, w = buf.w;
  for (let y = 0; y < buf.h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) << 2;
    if (!d[i + 3]) continue;
    let r = amb[0], g = amb[1], b = amb[2];
    for (const l of lights) {
      const dx = (x + .5 - l.x) / l.r, dy = (y + .5 - l.y) / l.ry, dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= 1) continue;
      let f = Math.pow(1 - dist, l.pow || 1);
      f = Math.floor(f * l.bands + bayer(x, y) * .999) / l.bands;
      r += l.c[0] / 255 * l.k * f; g += l.c[1] / 255 * l.k * f; b += l.c[2] / 255 * l.k * f;
    }
    d[i] = d[i] * r; d[i + 1] = d[i + 1] * g; d[i + 2] = d[i + 2] * b;
  }
}

G.PX = { col, mix, bayer, dither, checker, vgrad, Pix, spansPoly, spansEll, parsePath, xf, pathSpans, ellSpans, lightPass };
})(window);
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
/* Part E: one panel = background (its own light), characters and props (lit to match), then effects. */
(function (G) {
'use strict';
const { Pix, lightPass } = G.PX;
const { drawChar } = G.BODY;
const { PROP, FX, BACK } = G.ART;
const PW = 160;

const LIGHT = {
  day: { amb: [1, 1, 1] }, warm: { amb: [1.04, 1, .9] }, eve: { amb: [1.02, .88, .78] }, gray: { amb: [.86, .88, .95] },
  rain: { amb: [.5, .52, .74] }, night: { amb: [.44, .4, .7] }, deep: { amb: [.26, .24, .46] }, home: { amb: [1, .9, .76] },
  fluoro: { amb: [.97, 1, 1.05] }, dim: { amb: [.72, .68, .84] }, dojo: { amb: [.62, .56, .54] }, sunset: { amb: [1.05, .82, .7] }
};

function drawProp(b, pr) {
  const f = PROP[pr.id];
  if (f) f(b, pr.x, pr.y, pr.s || 10, pr);
}

function renderPanel(p) {
  const W = Math.round(PW * (p.w || 1)), H = p.h;
  const b = new Pix(W, H); b.emis = []; b.after = [];
  p._lights = [];
  const bg = p.bg;
  if (typeof bg === 'function') bg(b, p);
  else if (G.PLACE[bg]) G.PLACE[bg](b, p);
  else if (G.CITY[bg]) G.CITY[bg](b, p);
  else if (BACK[bg]) BACK[bg](b, p.bgo || (p.bgc ? { c: p.bgc } : {}));
  else b.fill(bg || '#1a1624');
  const preset = typeof p.light === 'string' ? LIGHT[p.light] : (p.light || LIGHT.day);
  const lights = (p._lights || []).concat(p.lights || []);
  /* background: neutral ambient, only the light pools */
  const bgLights = lights.filter(l => l.bg !== false);
  if (bgLights.length) lightPass(b, { amb: [1, 1, 1], lights: bgLights.map(l => Object.assign({}, l, { k: (l.k ?? 1) * (l.bgk ?? .6) })) });
  if (p.bgAmb) lightPass(b, { amb: p.bgAmb, lights: [] });
  for (const e of b.emis) e(b);
  for (const a of b.after) a(b);
  for (const f of p.under || []) { const [n, o] = Array.isArray(f) ? f : [f, {}]; FX[n](b, o || {}); }
  /* characters and props on their own layer */
  const L = new Pix(W, H);
  for (const pr of p.props || []) if (pr.under) drawProp(L, pr);
  for (const c of p.chars || []) drawChar(L, c.id, c);
  for (const pr of p.props || []) if (!pr.under) drawProp(L, pr);
  if (p.draw) p.draw(L, p);
  lightPass(L, { amb: (preset && preset.amb) || [1, 1, 1], lights });
  const s = L.d, d = b.d;
  for (let i = 0; i < s.length; i += 4) if (s[i + 3]) { d[i] = s[i]; d[i + 1] = s[i + 1]; d[i + 2] = s[i + 2]; d[i + 3] = 255; }
  for (const f of p.fx || []) { const [n, o] = Array.isArray(f) ? f : [f, {}]; FX[n](b, o || {}); }
  if (p.post) p.post(b, p);
  return b;
}

/* where a character's head is, in panel pixels (for bubble tails) */
function headOf(p, who) {
  const c = (p.chars || []).find(c => c.id === who);
  if (!c) return null;
  return [c.x + (c.view === 'q' ? (c.f || 1) * c.H * .1 : 0), c.y - c.H * .15];
}

G.COMIC = Object.assign(G.COMIC || {}, { PW, LIGHT, renderPanel, headOf, chapters: (G.COMIC && G.COMIC.chapters) || {} });
})(window);
