
/* ================= lettering: captions, bubbles, chat, titles ================= */
const BUB = '#fffdf6', BUB_INK = '#15121b';
const WHO = { hinata: ['Хината', '#ffb35a'], girl: ['Девочка', '#cfc6ff'], banka: ['Банка', '#cfc6ff'] };
const TAIL_OF = { hinata: 'hinata', girl: 'girl', banka: 'girl' };
let texts = [], chatEl = null;
function clearText() { uiEl.textContent = ''; tailsEl.textContent = ''; ovG.textContent = ''; texts = []; }
function typed(container, str) {
  const shown = document.createElement('span'), rest = document.createElement('span');
  rest.className = 'rest'; rest.textContent = str; container.append(shown, rest);
  const cost = []; let acc = 0;
  for (const ch of str) { acc += /[.!?…]/.test(ch) ? 7 : /[,—:;]/.test(ch) ? 3.5 : ch === '\n' ? 5 : 1; cost.push(acc); }
  return { str, shown, rest, cost, n: 0 };
}
/* place every text item in order; a later item slides out of the way of the earlier ones */
function layoutText() {
  const m = 12, gap = 10 + 28 * S, yMin = hudBottom + 6, placed = [];
  const hits = (x, y, w, h) => placed.find(r => x < r.x + r.w && x + w > r.x && y < r.y + r.h + gap && y + h + gap > r.y);
  for (const it of texts) {
    const w = it.el.offsetWidth, h = it.el.offsetHeight, yMax = Math.max(yMin, H - h - 40);
    let x = OX + it.x * S, y = OY + it.y * S;
    if (it.alignR) x -= w; else if (it.alignC) x -= w / 2;
    if (it.alignB) y -= h;
    x = clamp(x, m, Math.max(m, W - w - m)); y = clamp(y, yMin, yMax);
    for (let pass = 0; pass < 5; pass++) {
      const r = hits(x, y, w, h);
      if (!r) break;
      const down = r.y + r.h + gap, up = r.y - h - gap;
      y = it.alignB ? (up >= yMin ? up : down) : (down <= yMax ? down : up);
      if (y < yMin || y > yMax) { y = clamp(y, yMin, yMax); break; }
    }
    it.el.style.left = x.toFixed(1) + 'px'; it.el.style.top = y.toFixed(1) + 'px';
    it.rect = { x, y, w, h }; placed.push(it.rect);
    if (it.tailLine) it.tailLine.setAttribute('stroke-width', Math.max(2, 5 * S));
  }
}
onRelayout = () => { layoutText(); if (chatEl) placeChat(); };
function caption(text, o = {}) {
  const d = document.createElement('div'); d.className = 'caption' + (o.inner ? ' inner' : '');
  const t = typed(d, text); uiEl.appendChild(d);
  const at = o.at || [60, o.bottom ? 1480 : 240];
  texts.push({ el: d, x: at[0], y: at[1], alignB: !o.at && !!o.bottom });
  return t;
}
function bubble(b) {
  const d = document.createElement('div'); d.className = 'bubble' + (b.whisper ? ' whisper' : '') + (b.shout ? ' shout' : '');
  const [name, color] = WHO[b.who];
  const tag = document.createElement('b'); tag.className = 'who'; tag.textContent = name; tag.style.setProperty('--c', color);
  const p = document.createElement('p'); d.append(tag, p);
  const t = typed(p, b.text); uiEl.appendChild(d);
  const at = b.at || [b.who === 'hinata' ? 60 : 300, 520];
  const it = { el: d, x: at[0], y: at[1], who: b.who, tail: b.tail === false ? null : (b.tail || TAIL_OF[b.who]) };
  if (it.tail) {
    it.tailFill = el('path', { fill: BUB, style: 'opacity:0' }, tailsEl);
    it.tailLine = el('path', { fill: 'none', stroke: BUB_INK, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': b.whisper ? '7 6' : null, style: 'opacity:0' }, tailsEl);
    requestAnimationFrame(() => { it.tailFill.style.opacity = 1; it.tailLine.style.opacity = 1; });
  }
  texts.push(it);
  t.who = b.who;
  return t;
}
/* where a speaker's mouth is right now, in viewBox units */
function tailTarget(it) {
  const h = scene && scene.h && scene.h[it.tail];
  if (!h || h.hidden) return null;
  if (h.mouthVB) return project(h.mouthVB[0], h.mouthVB[1], 1);
  if (h.mouthWorld) { const [x, y] = h.mouthWorld(); return project(x, y, 1); }
  return whereIs(h.headEl, .15);
}
function drawTails() {
  for (const it of texts) {
    if (!it.tail || !it.rect) continue;
    const tgt = tailTarget(it);
    if (!tgt) { it.tailFill.setAttribute('d', ''); it.tailLine.setAttribute('d', ''); continue; }
    const tx = OX + tgt[0] * S, ty = OY + tgt[1] * S, r = it.rect;
    const bw = Math.max(2, 5 * S), corner = 48 * S, base = Math.max(14, 42 * S);
    const below = ty > r.y + r.h / 2, ey = below ? r.y + r.h : r.y, dir = below ? 1 : -1;
    const bx = clamp(tx, r.x + corner + base / 2, r.x + r.w - corner - base / 2);
    const dx = tx - bx, dy = ty - ey, dist = Math.hypot(dx, dy) || 1;
    const len = clamp(dist - 40 * S, 22 * S, 150 * S);
    const px = (bx + dx / dist * len).toFixed(1), py = (ey + dy / dist * len).toFixed(1);
    const x1 = (bx - base / 2).toFixed(1), x2 = (bx + base / 2).toFixed(1);
    const yIn = (ey - dir * (bw + 1)).toFixed(1), yEdge = (ey - dir * bw / 2).toFixed(1);
    it.tailFill.setAttribute('d', `M${x1},${yIn} L${px},${py} L${x2},${yIn} Z`);
    it.tailLine.setAttribute('d', `M${x1},${yEdge} L${px},${py} L${x2},${yEdge}`);
  }
}
function sfxText(o) {
  const size = o.size || 110;
  const g = el('g', { transform: `rotate(${o.rot ?? -6} ${o.x} ${o.y})` }, ovG);
  const t = el('text', { x: o.x, y: o.y, 'text-anchor': 'middle', 'dominant-baseline': 'middle', class: 'sfx sfx-in', 'font-size': size,
    fill: lin(ovDefs, [[0, o.c1 || '#fff6a8'], [1, o.c || '#ffb13b']]), stroke: '#1a0f05', 'stroke-width': size * .12, 'stroke-linejoin': 'round', 'paint-order': 'stroke' }, g);
  t.textContent = o.text;
}
function titleCard(k, n) {
  const d = document.createElement('div'); d.className = 'title-beat';
  const a = document.createElement('div'); a.className = 'k'; a.textContent = k;
  const b = document.createElement('div'); b.className = 'n'; b.textContent = n;
  d.append(a, b); uiEl.appendChild(d);
}
function clockTag(text, at) {
  const d = document.createElement('div'); d.className = 'clock';
  d.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/></svg>';
  const s = document.createElement('span'); s.textContent = text; d.appendChild(s);
  uiEl.appendChild(d);
  texts.push({ el: d, x: at ? at[0] : 450, y: at ? at[1] : 236, alignC: true });
}
/* the chat with Mum is HTML laid over the phone's glowing screen */
function placeChat() {
  const [x0, y0, x1, y1] = scene.screen;
  const [a, b] = project(x0, y0, 1), [c, d] = project(x1, y1, 1);
  chatEl.style.left = (OX + a * S).toFixed(1) + 'px'; chatEl.style.top = (OY + b * S).toFixed(1) + 'px';
  chatEl.style.width = ((c - a) * S).toFixed(1) + 'px'; chatEl.style.height = ((d - b) * S).toFixed(1) + 'px';
  chatEl.style.padding = (18 * S).toFixed(1) + 'px';
}
function chat(lines, instant) {
  if (!scene || !scene.screen) return;
  if (!chatEl) {
    chatEl = document.createElement('div'); chatEl.className = 'chat';
    stage.insertBefore(chatEl, uiEl);
    const hd = document.createElement('div'); hd.className = 'hd'; hd.textContent = 'Мама'; chatEl.appendChild(hd);
    placeChat();
  }
  chatEl.querySelectorAll('.dots').forEach(n => n.remove());
  for (const [who, text, hl] of lines) {
    const m = document.createElement('div');
    if (who === 'time') { m.className = 't'; m.textContent = text; }
    else if (who === 'dots') { m.className = 'm mom dots'; m.textContent = '•••'; }
    else { m.className = 'm ' + who + (hl ? ' hl' : ''); m.textContent = text; }
    if (instant && who !== 'dots') m.style.animation = 'none';
    chatEl.appendChild(m);
  }
}
function dropChat() { if (chatEl) chatEl.remove(); chatEl = null; }

const tweens = [];
function tween(ms, fn) { if (REDUCED) { fn(1); return; } tweens.push({ t0: now(), ms, fn }); }
function stepTweens(t) { for (let i = tweens.length - 1; i >= 0; i--) { const tw = tweens[i], k = clamp((t - tw.t0) / tw.ms, 0, 1); tw.fn(k); if (k >= 1) tweens.splice(i, 1); } }
