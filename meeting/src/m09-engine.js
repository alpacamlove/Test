
/* ================= playback ================= */
const FLAT = [];
SHOTS.forEach((sh, si) => sh.beats.forEach((b, bi) => FLAT.push([si, bi])));
const beatAt = i => SHOTS[FLAT[i][0]].beats[FLAT[i][1]];
let cur = -1, scene = null, sceneIdx = -1, typing = null, busy = false, auto = false, autoTimer = 0, started = false, ended = false;
let breathT = 0, pantT = 0;
const timers = [];
/* a delayed step inside a beat; dropped when the reader moves on (the next beat settles the state) */
function after(ms, fn) { timers.push({ t: now() + (REDUCED ? Math.min(ms, 40) : ms), fn }); }
function stepTimers(t) { for (let i = 0; i < timers.length; i++) if (t >= timers[i].t) { const tm = timers.splice(i, 1)[0]; i--; tm.fn(); } }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const setDanger = on => $('danger').classList.toggle('on', !!on);

function build(si) {
  clearScene(); clearText(); dropChat(); tweens.length = 0; timers.length = 0;
  const sh = SHOTS[si];
  scene = sh.build.apply(null, sh.args || []); sceneIdx = si;
  resetFx(scene.fx); camSet(scene.cam);
  Snd.set(Object.assign({ wind: 0, hum: 0, store: 0, pad: null, heart: false, heartRate: 1.05 }, scene.snd, sh.snd));
  setDanger(sh.danger);
  if (sh.where) $('where').textContent = sh.where;
  if (sh.init) sh.init(scene);
  breathT = now() + 700;
}
/* everything a beat changes; with instant it jumps straight to the end state */
function applyBeat(b, instant, settle) {
  if (b.cam && !settle) instant ? camSet(b.cam[0]) : camTo(b.cam[0], b.cam[1] ?? 1600);
  if (b.snd) Snd.set(b.snd);
  if (b.danger != null) setDanger(b.danger);
  if (b.chat && !settle) chat(b.chat, instant);
  if (b.do) b.do(scene, instant);
  if (!instant) {
    if (b.fx) [].concat(b.fx).forEach(n => Snd.fx(n));
    if (b.shake) shake(b.shake[0], b.shake[1]);
    if (b.flash) flash(b.flash[0], b.flash[1], b.flash[2]);
  }
}
function runBeat(idx) {
  const b = beatAt(idx);
  clearText();
  applyBeat(b, false);
  if (b.title) titleCard(b.title[0], b.title[1]);
  if (b.clock) clockTag(b.clock, b.clockAt);
  const items = [], live = [];
  /* text is typed in the order it is written in the beat */
  for (const k of Object.keys(b)) {
    if (k === 'cap' || k === 'inner') { items.push(caption(b[k], { inner: k === 'inner', at: b[k + 'At'], bottom: b.bottom })); live.push(b[k]); }
    else if (k === 'say') for (const s of [].concat(b.say)) { items.push(bubble(s)); live.push(WHO[s.who][0] + ': ' + s.text); }
  }
  for (const s of [].concat(b.sfx || [])) s.delay && !REDUCED ? after(s.delay, () => sfxText(s)) : sfxText(s);
  layoutText();
  if (b.title) live.unshift(b.title.join('. '));
  $('live').textContent = live.join(' ');
  typing = items.length ? { items, i: 0, pos: 0, last: now() } : null;
  if (typing) talk(items[0].who, true);
  if (REDUCED || !typing) finishTyping(); else updateProgress();
}
async function go(idx) {
  if (busy || idx < 0) return;
  if (idx >= FLAT.length) return showEnd();
  clearTimeout(autoTimer);
  const si = FLAT[idx][0];
  if (si !== sceneIdx || idx < cur || cur < 0) {
    busy = true;
    finishTyping(true);
    $('fade').classList.add('on');
    await sleep(si !== sceneIdx || cur < 0 ? 430 : 200);
    build(si);
    for (let k = FLAT.findIndex(f => f[0] === si); k < idx; k++) applyBeat(beatAt(k), true);
    $('fade').classList.remove('on');
    busy = false;
  } else if (idx === cur + 1) {
    /* the reader moved on: whatever the last beat was still doing lands at its end */
    timers.length = 0; tweens.length = 0;
    applyBeat(beatAt(cur), true, true);
  }
  cur = idx;
  runBeat(idx);
}
const CPS = 32;
function stepTyping(t) {
  if (!typing) return;
  const it = typing.items[typing.i];
  typing.pos += (t - typing.last) / 1000 * CPS; typing.last = t;
  let n = it.n;
  while (n < it.str.length && it.cost[n] <= typing.pos) n++;
  if (n !== it.n) { it.n = n; it.shown.textContent = it.str.slice(0, n); it.rest.textContent = it.str.slice(n); }
  if (n >= it.str.length) {
    lineDone(it);
    typing.i++; typing.pos = 0;
    if (typing.i >= typing.items.length) finishTyping(); else talk(typing.items[typing.i].who, true);
  }
}
function finishTyping(silent) {
  if (typing) for (const it of typing.items) { it.n = it.str.length; it.shown.textContent = it.str; it.rest.textContent = ''; if (silent) talk(it.who, false); else lineDone(it); }
  typing = null;
  if (!silent) scheduleAuto();
}
function talk(who, on) {
  const h = who && scene && scene.h && scene.h[TAIL_OF[who]];
  if (h && h.talk) h.talk(on);
}
/* when a line is said: Hinata's breath shows; hers barely does */
function lineDone(it) {
  if (!it.who || it.said) return;
  it.said = true; talk(it.who, false);
  if (REDUCED || !scene || !scene.h) return;
  const f = scene.h[TAIL_OF[it.who]];
  if (f && f.mouthWorld && !f.hidden) {
    const [x, y] = project(...f.mouthWorld(), 1), girl = TAIL_OF[it.who] === 'girl';
    puff(x, y, f.st.f, girl ? .3 : cam.z * f.st.s * 1.35);
  } else if (it.who === 'hinata' && scene.puffAt) { const [x, y] = project(scene.puffAt[0], scene.puffAt[1], 1); puff(x, y, 1, 2.4); }
}
function stepBreath(t) {
  if (!scene || REDUCED) return;
  if (t >= breathT) {
    breathT = t + rand(2300, 3100);
    if (scene.puffAt) { const [x, y] = project(scene.puffAt[0], scene.puffAt[1], 1); puff(x, y, 1, 2.2); }
    for (const f of scene.breathe || []) {
      if (f.hidden) continue;
      const [x, y] = project(...f.mouthWorld(), 1);
      puff(x, y, scene.puffDir ?? f.st.f, cam.z * f.st.s * 1.25);
    }
  }
  if (scene.pant && !scene.pant.hidden && t >= pantT) {
    pantT = t + rand(600, 850);
    const f = scene.pant, [x, y] = project(...f.mouthWorld(), 1);
    puff(x, y, f.st.f, .3);
  }
}
function updateProgress() { $('bar').firstElementChild.style.width = (FLAT.length ? (cur + 1) / FLAT.length * 100 : 0).toFixed(2) + '%'; }
function holdFor(idx) {
  const b = beatAt(idx);
  let len = (b.cap || '').length + (b.inner || '').length;
  for (const s of [].concat(b.say || [])) len += s.text.length;
  return b.hold || clamp(1400 + len * 22, 2400, 6500);
}
function scheduleAuto() {
  clearTimeout(autoTimer);
  updateProgress();
  if (auto && started && !ended && cur >= 0) autoTimer = setTimeout(next, holdFor(cur));
}
function next() {
  if (!started || busy) return;
  if (typing) return finishTyping();
  if (!ended) go(cur + 1);
}
function prev() {
  if (!started || busy) return;
  if (ended) return hideEnd();
  if (cur > 0) go(cur - 1);
}
function start() {
  if (started) return;
  started = true;
  Snd.init();
  const intro = $('intro');
  intro.classList.add('gone'); setTimeout(() => { intro.hidden = true; }, 650);
  $('hint').style.opacity = 1; setTimeout(() => { $('hint').style.opacity = 0; }, 6500);
  go(0);
}
function showEnd() {
  ended = true; clearTimeout(autoTimer); clearText();
  const o = $('outro'); o.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => o.classList.remove('gone')));
  $('hint').style.opacity = 0;
  $('bar').firstElementChild.style.width = '100%';
  setTimeout(() => $('bAgain').focus({ preventScroll: true }), 650);
}
function hideEnd() {
  ended = false;
  const o = $('outro'); o.classList.add('gone'); setTimeout(() => { if (!ended) o.hidden = true; }, 600);
  updateProgress();
}
function setAuto(v) {
  auto = v; $('bAuto').setAttribute('aria-pressed', String(auto));
  if (auto && started && !typing && !busy && !ended) scheduleAuto();
  else clearTimeout(autoTimer);
}
function setSound(v) {
  Snd.toggle(v); $('bSound').setAttribute('aria-pressed', String(v));
  try { localStorage.setItem('hinata-sound', v ? '1' : '0'); } catch (e) {}
}

/* ================= controls ================= */
stage.addEventListener('click', e => {
  if (!started || e.target.closest('button, .card')) return;
  const r = stage.getBoundingClientRect();
  if (e.clientX - r.left < r.width * .3) prev(); else next();
});
$('intro').addEventListener('click', e => { if (!e.target.closest('button')) start(); });
$('bStart').addEventListener('click', start);
$('bAuto').addEventListener('click', () => setAuto(!auto));
$('bSound').addEventListener('click', () => { Snd.init(); setSound(!Snd.on); });
$('bAgain').addEventListener('click', () => { hideEnd(); cur = -1; go(0); });
document.addEventListener('keydown', e => {
  if (e.target.closest && e.target.closest('button')) return;
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter' || e.key === 'PageDown') { e.preventDefault(); started ? next() : start(); }
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
});

/* ================= go ================= */
let lastT = now();
function frame(t) {
  const dt = Math.min(.05, Math.max(0, (t - lastT) / 1000)); lastT = t;
  stepTimers(t);
  stepTweens(t);
  if (scene && scene.update) scene.update(dt, t);
  stepCam(t);
  stepBreath(t);
  stepFx(dt);
  drawFx();
  stepTyping(t);
  drawTails();
  if (chatEl) placeChat();
  requestAnimationFrame(frame);
}
try { if (localStorage.getItem('hinata-sound') === '0') setSound(false); } catch (e) {}
new ResizeObserver(() => measure()).observe(stage);
measure();
introScene();
updateProgress();
requestAnimationFrame(frame);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => layoutText());
})();
