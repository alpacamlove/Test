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
