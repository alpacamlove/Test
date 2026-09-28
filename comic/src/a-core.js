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
