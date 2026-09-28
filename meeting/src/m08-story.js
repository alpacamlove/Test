
/* ================= the story: chapter 2's last page and chapter 3, scenes 1–3 ================= */
const GROUND = 1450, SEAT = 1392;
/* a camera that puts world point (x, y) at screen (450, sy) with zoom z */
const CAM = (x, y, z, sy = 1090) => ({ x: x - 450, y: y - 800 - (sy - 800) / z, z });
const pz = (f, p, ms, i) => f.pose(p, i ? 0 : ms);

/* set a figure straight into a state */
function put(f, o) {
  if ('seat' in o) { if (o.seat != null) f.set({ seat: o.seat, ground: null }); else f.set({ seat: null, ground: o.ground ?? GROUND }); }
  else if ('ground' in o) f.set({ seat: null, ground: o.ground });
  if (o.s) f.set({ s: o.s });
  if (o.x != null) f.move(o.x, null, 0);
  if (o.f) f.face(o.f);
  if (o.pose) f.pose(o.pose, 0);
  if ('F' in o) f.hold('F', o.F && HELD[o.F]);
  if ('N' in o) f.hold('N', o.N && HELD[o.N]);
  if (o.emo) f.emo(o.emo);
  if (o.look) f.look(o.look[0], o.look[1]);
  if ('hidden' in o) { f.hidden = !!o.hidden; f.inkRoot.style.opacity = f.rimRoot.style.opacity = o.hidden ? 0 : ''; }
  return f;
}
function walk(f, x, ms, i, o = {}) {
  const end = o.end || 'stand';
  if (i || REDUCED) { f.move(x, null, 0); if (o.face) f.face(o.face); f.pose(end, 0); return; }
  f.face(o.face ?? (x < f.st.x ? -1 : 1));
  const g = o.run ? ['runA', 'runB', 440] : (o.gait || ['walkA', 'walkB', 1000]);
  f.cycle(g[0], g[1], g[2]);
  f.move(x, null, ms, { linear: true });
  after(ms, () => f.pose(end, o.endMs ?? 350));
}
/* sit on the concrete edge / get up, without the hip jumping */
function sitDown(f, x, i, p = 'sit', ms = 650) {
  if (i || REDUCED) { put(f, { seat: SEAT, x, pose: p }); return; }
  const s0 = f.hipY() + 6 * f.st.s;
  f.set({ ground: null, seat: s0 });
  f.move(x, null, ms * .7);
  f.pose(p, ms);
  tween(ms, k => { f.st.seat = lerp(s0, SEAT, ease(k)); });
}
function standUp(f, i, p = 'stand', ms = 450) {
  if (i || REDUCED) { put(f, { ground: GROUND, pose: p }); return; }
  const g0 = f.hipY() + f.st.s * f.legExt();
  f.set({ seat: null, ground: g0 });
  f.pose(p, ms);
  tween(ms, k => { f.st.ground = lerp(g0, GROUND, ease(k)); });
}
/* the yard in a given state: who is where, what lies on the edge */
function yard(st) {
  return s => {
    const { hinata: H, girl: G } = s.h;
    put(H, Object.assign({ f: 1, seat: null, F: null, N: null, hidden: false }, st.H));
    put(G, Object.assign({ f: -1, seat: SEAT, F: null, N: null, emo: 'down', look: [0, 0], hidden: false }, st.G));
    for (const k of ['onigiri', 'kairo', 'balcony']) s.h[k].style.opacity = st[k] ? 1 : 0;
    G.rimColor(st.warm ? '#f1e2cf' : LAMP_RIM);
    G.rimRoot.setAttribute('opacity', .72);
    s.pant = st.pant ? G : null;
    if (st.cam) camSet(st.cam);
  };
}
/* Hinata's three steps to her, counted without wanting to */
function marks(s, on, i) {
  if (!s.h.marks) {
    const chars = s.h.hinata.inkRoot.parentNode, g = s.h.marks = el('g', null);
    chars.insertBefore(g, chars.firstChild);
    for (let k = 0; k < 3; k++) el('ellipse', { cx: 548 + k * 74, cy: 1462, rx: 24, ry: 6, fill: '#ffb35a', style: 'opacity:0; transition: opacity .35s ease' }, g);
  }
  [...s.h.marks.children].forEach((m, k) => { m.style.transitionDelay = on && !i ? (.4 + k * .45) + 's' : '0s'; m.style.opacity = on ? .6 : 0; });
}
/* she runs off into the dark between the houses, getting smaller */
function runAway(s, G) {
  if (s.tick) return;
  const t0 = now(), T = REDUCED ? 1 : 18000, x0 = G.st.x, g0 = G.st.ground ?? GROUND, s0 = G.st.s;
  G.set({ seat: null, ground: g0 }); G.face(1); G.cycle('runA', 'runB', 440);
  s.tick = () => {
    const k = clamp((now() - t0) / T, 0, 1), e = 1 - Math.pow(1 - k, 1.6);
    G.st.x = lerp(x0, 1000, e); G.st.ground = lerp(g0, 1318, e); G.st.s = lerp(s0, .34, e);
  };
}
function liftOnigiri(s, i) {
  const o = s.h.oni; if (!o) return;
  o.style.transition = i ? 'none' : 'transform 1.8s cubic-bezier(.3,.8,.3,1)';
  o.style.transform = 'translate(450px,860px) rotate(-12deg) scale(.96)';
}
/* behind the title card: the yard, the lamp, somebody small in the corner */
function introScene() {
  clearScene(); clearText();
  scene = sceneYard(); sceneIdx = -1;
  resetFx(scene.fx);
  yard({ H: { x: -700, hidden: true }, G: { x: 650, pose: 'hug' }, cam: CAM(470, 1300, 1.05) })(scene);
  Snd.set(scene.snd);
}

const MUM = [['time', '21:51'], ['me', 'Встретила на площадке бездомную девочку лет четырнадцати, одна, замёрзла, задержусь'],
  ['mom', 'Где именно'], ['me', 'У комбини, по пути от Аой'], ['mom', 'Не трогай, вызови полицию, дома в 22:30']];
const BUZZ = (x, y) => ({ text: 'БЗЗ… БЗЗ…', x, y, rot: -6, size: 56, c: '#aebcff', c1: '#ffffff' });
const HUM = (x, y) => ({ text: 'ЖЖЖЖ…', x, y, rot: 5, size: 52, c: '#c8e8b8', c1: '#ffffff' });

const SHOTS = [
/* ---------- the end of chapter 2: on the way home ---------- */
{ build: sceneStreet, where: 'Глава 2 · Дорога домой', beats: [
  { cap: 'Суббота, 21:30. От Аой я сегодня ухожу последней. Не первой, как обычно. Последней.' },
  { inner: 'Короче всего через старый пешеходный мост. Но после вчерашней домашней тишины я к реке ночью одна не сунусь.' },
  { inner: 'Глаза работают на автомате: тут слепое пятно фонаря, тут густая тень, тут удобный подъезд. Ничего особенного.' }
] },
{ build: sceneKonbini, where: 'Глава 2 · Комбини', beats: [
  { sfx: { text: 'ДИНЬ-ДОН', x: 450, y: 520, rot: -4, size: 84, c: '#46d884', c1: '#eafff0' }, fx: 'chime', cap: 'По пути заруливаю в комбини.' }
] },
{ build: sceneCounter, where: 'Глава 2 · Комбини', beats: [
  { cap: 'Внутри обволакивает теплом и слепящим белым светом. За кассой клюёт носом студент в полусне.' },
  { cap: 'Горячий никуман. Железная банка какао из подогревателя.', inner: 'Я весь день жрала, а желудок всё равно своё требует. Ржу над собственной прорвой и докидываю онигири «на утро».' }
] },

/* ---------- scene 1: the playground ---------- */
{ build: sceneTitle, snd: { wind: .35 }, where: 'Глава 3', beats: [
  { title: ['Глава 3 · Сцена 1', 'Площадка'], hold: 2600 }
] },
{ build: sceneYard, where: 'Сцена 1 · Площадка', init: yard({
    H: { x: -170, pose: 'walkEatA', F: 'bag', N: 'bun' }, G: { x: 650, pose: 'hug' }, cam: CAM(250, 1300, 1.1) }), beats: [
  { cap: 'Маленькая детская площадка, зажатая между двумя домами. Горка, качели, песочница под сеткой. И один-единственный рабочий фонарь.',
    cam: [CAM(330, 1310, 1.05), 5200],
    do: (s, i) => walk(s.h.hinata, 170, 4000, i, { gait: ['walkEatA', 'walkEatB', 1000], end: 'standEat', face: 1 }) },
  { sfx: HUM(610, 640), cam: [CAM(330, 1190, 1.2), 3600],
    inner: 'Фонарь над лавочкой натужно гудит. Где-то в торговом автомате монотонно тарахтит компрессор — единственный звук на всю округу.' },
  { cap: 'Я прохожу мимо лавочки — и только тогда боковым зрением цепляю движение. В самом углу, там, где обрывается свет.',
    cam: [CAM(560, 1350, 1.55), 3200],
    do: (s, i) => walk(s.h.hinata, 330, 1500, i, { gait: ['walkEatA', 'walkEatB', 1000], end: 'standBag', face: 1 }) },
  { cam: [CAM(645, 1375, 2.2), 2600], inner: 'Кто-то сидит прямо на ледяном бетонном бортике, сжавшись в тугой комок. Колени к груди, руки спрятаны в рукава. Ребёнок. Лет четырнадцать на вид.' },
  { cam: [CAM(500, 1340, 1.45), 2600], inner: 'Поругалась с предками, психанула, сбежала. Классика. До десяти минут двадцать, батя голову открутит… Но проходить мимо я не умею.',
    do: (s, i) => walk(s.h.hinata, 420, 1300, i, { end: 'standBag', face: 1 }) },
  { say: { who: 'hinata', text: 'Эй. Ты в порядке? Где твои родители?', at: [50, 560] } },
  { cam: [CAM(625, 1360, 1.9), 450], shake: [8, 320], fx: 'thud', cap: 'Она вздрагивает всем телом, будто её ударили, и резко вскидывает голову.',
    do: (s, i) => { const G = s.h.girl; pz(G, 'hugUp', 120, i); G.emo('neutral'); G.look(2, -1); } }
] },
{ build: sceneFaceGirl, where: 'Сцена 1 · Площадка', init: s => { s.h.girl.eyes.set('neutral'); s.h.girl.br.set('down'); }, beats: [
  { cam: [{ z: 1.1 }, 9000], cap: 'Осунувшееся худое лицо. Чёрные волосы, криво обкромсанные, будто кухонными ножницами. Серая застиранная толстовка с чужого плеча — она в ней просто тонет.' },
  { say: { who: 'girl', text: 'Отстань. Иди куда шла.', at: [90, 360] }, inner: 'Голос тихий, глухой, хриплый. Так звучат люди, которые очень давно ни с кем не разговаривали.', innerAt: [60, 1320],
    do: s => { s.h.girl.br.set('angry'); s.h.girl.eyes.set('half'); } }
] },
{ build: sceneYard, where: 'Сцена 1 · Площадка', init: yard({
    H: { x: 420, pose: 'standBag', F: 'bag', N: 'bun' }, G: { x: 650, pose: 'hugUp', emo: 'neutral', look: [2, 0] }, cam: CAM(560, 1360, 1.7) }), beats: [
  { cam: [CAM(568, 1380, 2.0), 2600], cap: 'Я никуда не ухожу. Но и на рожон не лезу. Медленно опускаюсь на корточки — на расстоянии вытянутой руки.',
    do: (s, i) => walk(s.h.hinata, 470, 1000, i, { end: 'crouch', endMs: 700, face: 1 }) },
  { inner: 'И замечаю: она следит не за моим лицом. За моими руками. Так смотрят загнанные уличные коты. Или те, кого регулярно били.',
    do: s => s.h.girl.look(3, 3) },
  { fx: 'rustle', say: { who: 'hinata', text: 'Держи. Горячая, я не пила.', at: [50, 580] },
    do: (s, i) => { const H = s.h.hinata; H.hold('N', HELD.can); pz(H, 'crouchOffer', 600, i); } }
] },
{ build: sceneHands, where: 'Сцена 1 · Площадка', beats: [
  { cap: 'Она долго, затравленно смотрит на банку.', cam: [{ z: 1.08 }, 5000] },
  { sfx: { text: 'ХВАТЬ!', x: 470, y: 700, rot: -8, size: 124, c: '#8ab8ff', c1: '#f4faff', delay: 900 }, cap: 'А потом резко, рывком выхватывает её.',
    do: (s, i) => s.snatch(i) },
  { inner: 'Её пальцы на секунду задевают мою ладонь — и меня аж передёргивает. Ледяные. Реально холоднее, чем железная банка на морозе.', flash: [.25, 600, '#bcd8ff'] }
] },
{ build: sceneYard, where: 'Сцена 1 · Площадка', init: yard({
    H: { x: 470, pose: 'crouch', F: 'bag', N: 'bun' }, G: { x: 650, pose: 'hugCan', N: 'can', emo: 'neutral', look: [2, 2] }, cam: CAM(570, 1370, 2.05) }), beats: [
  { cam: [CAM(572, 1360, 2.2), 5000], cap: 'Она обхватывает банку обеими ладонями и прижимает к груди. Но кольцо не дёргает. Вцепилась, как в спасательный круг, и греется.' },
  { say: { who: 'hinata', text: 'Давно ты тут сидишь? Тебе идти-то вообще есть куда?', at: [40, 600] } },
  { cam: [CAM(562, 1310, 2.6), 2800], inner: 'Она молчит. Я считаю секунды. У меня изо рта при каждом выдохе — густое белое облачко. А от неё — ничего. Ни единого.' },
  { inner: 'Потом она коротко мотает головой и что-то бурчит в воротник. И крошечный парок всё-таки появляется. «Показалось», — отмахиваюсь я.',
    do: (s, i) => {
      const G = s.h.girl, b = POSES.hugCan;
      if (i) { G.pose(b, 0); return; }
      G.pose({ ...b, head: -26 }, 150); after(170, () => G.pose({ ...b, head: 6 }, 150)); after(340, () => G.pose({ ...b, head: -16 }, 140)); after(500, () => G.pose(b, 240));
      after(1000, () => { const [x, y] = project(...G.mouthWorld(), 1); puff(x, y, G.st.f, .6); });
    } }
] },
{ build: sceneEyes, where: 'Сцена 1 · Площадка', beats: [
  { cam: [{ z: 1.12 }, 9000], inner: 'Но тут же замечаю другое. Она не моргает. Ветер режет лицо, а её тёмные глаза неподвижные. Стеклянные.', innerAt: [60, 1230] }
] },
{ build: sceneFaceHinata, where: 'Сцена 1 · Площадка', snd: { pad: 'tense' }, beats: [
  { sfx: { text: 'ТУК', x: 650, y: 560, rot: 8, size: 110, c: '#ff3a4c', c1: '#ffc2c8' }, cap: 'И тут в голове щёлкает.', danger: true, flash: [.35, 500, '#ff2a3a'],
    snd: { heart: true, heartRate: .95 }, do: s => { s.h.hinata.eyes.set('slit'); s.h.hinata.br.set('angry'); } },
  { cap: 'Бледная.\nРуки как лёд.\nНе дышит, когда молчит.\nНе моргает.\nОдна. Ночью. На улице.' },
  { cam: [{ z: 1.1 }, 6000], inner: 'Тело само, на одних инстинктах, переключается в рабочий режим. Сердце бьёт ровно и тяжело. Вес плавно уходит на носки.' },
  { inner: 'Оружия нет. Выйти один на один против вампира с пустыми руками — это смерть.' },
  { inner: 'Твою мать, Хината. А если ты ошибаешься? Если перед тобой просто голодный, до смерти замёрзший ребёнок — а ты уже готовишься её убивать?',
    do: s => { s.h.hinata.br.set('worried'); s.h.hinata.eyes.set('worried'); } }
] },
{ build: sceneYard, where: 'Сцена 1 · Площадка', danger: true, snd: { pad: 'tense', heart: true, heartRate: .95 }, init: yard({
    H: { x: 470, pose: 'crouch', F: 'bag', N: 'bun' }, G: { x: 650, pose: 'hugCan', N: 'can', emo: 'neutral', look: [2, 2] }, cam: CAM(570, 1370, 2.0) }), beats: [
  { cap: 'Я не показываю ни капли напряжения.', say: { who: 'hinata', text: 'Блин, ты тут ничего не обронила? А то темно совсем.', at: [40, 600] }, fx: 'rustle',
    do: (s, i) => { const H = s.h.hinata; H.hold('N', HELD.keys); pz(H, 'crouchKeys', 500, i); } }
] },
{ build: sceneUV, where: 'Сцена 1 · Площадка', danger: true, snd: { heart: true, heartRate: .95 }, beats: [
  { sfx: { text: 'ЩЁЛК', x: 250, y: 1210, rot: -10, size: 76, c: '#a070ff', c1: '#f4e8ff' },
    cap: 'Щёлкаю УФ-брелоком. Фиолетовый луч как бы случайно ведёт по её рукам. По тонкому запястью. Прямо по бледной щеке.',
    do: (s, i) => s.sweep(i) },
  { cap: 'Ничего. Ни красного пятна, ни ожога, ни дымка. Кожа не дёргается, плоть не шипит.', danger: false, snd: { heart: false, pad: 'night' },
    do: s => s.h.eye.set('slit') },
  { say: { who: 'girl', text: '…Ты чего? Убери.', at: [80, 360] }, inner: 'Она морщит нос и прячет лицо. Для неё я сейчас просто какая-то поехавшая дура.', innerAt: [60, 1320],
    do: s => { s.off(); s.h.eye.set('half'); s.h.eye.look(-6, 2); } }
] },
{ build: sceneYard, where: 'Сцена 1 · Площадка', snd: { pad: 'sad' }, init: yard({
    H: { x: 470, pose: 'crouch', F: 'bag', N: 'bun' }, G: { x: 650, pose: 'hugCanDown', N: 'can', emo: 'down', look: [-2, 0] }, cam: CAM(570, 1370, 2.0) }), beats: [
  { cam: [CAM(568, 1360, 1.85), 5000], inner: 'Напряжение отпускает так резко, что колени на секунду становятся ватными. А вместо боевого куража — жгучий, удушливый стыд. Чуть не кинулась на ребёнка.' },
  { inner: 'Где-то на задворках ещё скребётся упрямое «что-то не так». Я давлю его на корню. Ультрафиолет не врёт.' },
  { sfx: BUZZ(300, 880), fx: 'buzz', clock: '21:51', inner: 'Никуман в руке совсем остыл. Я сижу на корточках перед этим ребёнком и понятия не имею, что делать дальше.' }
] },

/* ---------- scene 2: Banka ---------- */
{ build: sceneTitle, snd: { wind: .35 }, where: 'Глава 3', beats: [
  { title: ['Сцена 2', 'Банка'], hold: 2600 }
] },
{ build: scenePhone, where: 'Сцена 2 · Банка', beats: [
  { bottom: true, chat: MUM.slice(0, 2), cap: 'Если сейчас не подорвусь домой, батя устроит такую тренировку, что неделю не встану. Но и уйти просто так я не могу.' },
  { bottom: true, fx: 'buzz', chat: MUM.slice(2, 4), cap: 'Мама пишет в своём стиле: ни точек, ни смайликов. Только жёсткий контроль.' },
  { bottom: true, chat: [['dots']], cap: 'Пауза. Три прыгающие точки.', hold: 2200 },
  { bottom: true, fx: 'buzz', chat: MUM.slice(4), inner: 'Дали время. Почти полчаса — это много. А про полицию я подумаю потом.' }
] },
{ build: sceneYard, where: 'Сцена 2 · Банка', init: yard({
    H: { x: 470, pose: 'crouch', F: 'bag', N: 'bun' }, G: { x: 650, pose: 'hugCan', N: 'can', look: [0, 1] }, cam: CAM(570, 1360, 1.85) }), beats: [
  { cam: [CAM(580, 1345, 1.75), 2400], cap: 'Ноги уже затекли. Я выпрямляюсь и сажусь на бортик примерно в метре от неё — чтобы не нависать сверху.',
    do: (s, i) => { const H = s.h.hinata; if (i) { sitDown(H, 470, true); return; } standUp(H, false, 'stand', 450); after(520, () => sitDown(H, 470, false, 'sit', 700)); } },
  { inner: 'Она тут же отодвигается ещё сантиметров на двадцать. И замирает, словно перестаёт дышать. Зашугали ребёнка. Делаю вид, что ничего не заметила.',
    do: (s, i) => { const G = s.h.girl; G.move(690, null, i ? 0 : 420); G.look(-1, 0); } },
  { say: { who: 'hinata', text: 'Пипец, остыл совсем… Весь день жру как не в себя, а всё равно голодная. Прям прорва какая-то.', at: [40, 560] },
    do: (s, i) => pz(s.h.hinata, 'sitEat', 500, i) },
  { inner: 'Это не хитрый план по установлению доверия. Я просто по жизни такая. Она косится из-под неровной чёлки. Во взгляде читается: «ты сумасшедшая».',
    do: (s, i) => { pz(s.h.hinata, 'sit', 500, i); s.h.girl.look(2, 0); s.h.girl.emo('half'); } },
  { say: { who: 'hinata', text: 'Я Хината.', at: [70, 620] } },
  { sfx: HUM(330, 660), cap: 'В ответ — тишина. Только трещит фонарь над головой да гудит компрессор.', hold: 2800, do: s => s.h.girl.look(0, 1) },
  { say: { who: 'hinata', text: 'Ну ладно. Тогда будешь «Банка», раз вы с ней не расстаётесь.', at: [40, 560] } },
  { shake: [5, 240], say: { who: 'banka', text: 'Не называй меня так.', at: [390, 660] }, cap: 'Она вздрагивает. И впервые отвечает не колючим «отстань».',
    do: (s, i) => { const G = s.h.girl; G.emo('angry'); G.look(2, -1); if (i) { G.pose('hugCan', 0); return; } G.pose('hugUp', 110); after(320, () => G.pose('hugCan', 420)); } },
  { say: { who: 'hinata', text: 'А как тогда?', at: [70, 620] }, inner: 'Молчит, упрямо сжав губы. Ну и ладно. Я даже довольна: хоть что-то, кроме глухой обороны.',
    do: s => s.h.girl.emo('down') },
  { say: { who: 'hinata', text: 'Открыть не можешь? Пальцы замёрзли совсем? Давай помогу.', at: [40, 580] } },
  { say: { who: 'banka', text: 'Мне так теплее.', at: [430, 660] }, inner: 'Я моргаю. Блин. А ведь это логично: горячая банка вместо грелки. И от того, насколько это обыденно, внутри становится совсем тоскливо.' },
  { fx: 'rustle', say: { who: 'hinata', text: 'Будешь?', at: [120, 640] },
    do: (s, i) => { const H = s.h.hinata; H.hold('N', HELD.onigiri); pz(H, 'sitOffer', 600, i); } },
  { inner: 'Она долго смотрит на онигири. В её тёмных глазах мелькает какая-то странная, тяжёлая тоска. Будто хочет взять…',
    do: s => { s.h.girl.look(3, 3); s.h.girl.emo('neutral'); } },
  { say: { who: 'banka', text: 'Не хочу.', at: [450, 660] }, do: (s, i) => { const G = s.h.girl; pz(G, 'hugCanDown', 500, i); G.emo('down'); G.look(-3, 0); } },
  { say: { who: 'hinata', text: 'Ну, положу тут. Вдруг передумаешь. Он ничей.', at: [40, 580] },
    do: (s, i) => { const H = s.h.hinata; H.hold('N', null); s.h.onigiri.style.opacity = 1; pz(H, 'sit', 500, i); } }
] },
{ build: sceneEdge, args: ['onigiri'], where: 'Сцена 2 · Банка', beats: [
  { cam: [{ x: 0, y: -14, z: 1.35 }, 6000], cap: 'Он так и остаётся лежать там.', hold: 2800 }
] },
{ build: sceneYard, where: 'Сцена 2 · Банка', init: yard({
    H: { x: 470, seat: SEAT, pose: 'sit', F: 'bag' }, G: { x: 690, pose: 'hugCanDown', N: 'can', look: [-3, 0] }, onigiri: true, cam: CAM(580, 1345, 1.8) }), beats: [
  { cap: 'Ветер снова кусает за плечи сквозь куртку. И тут она задаёт вопрос сама. Впервые.',
    do: (s, i) => { const G = s.h.girl; pz(G, 'hugCan', 600, i); G.look(2, 0); G.emo('neutral'); } },
  { say: { who: 'banka', text: 'Зачем ты мне в лицо светила?', whisper: true, at: [380, 640] } },
  { inner: 'Врать я умею. Вдалбливают с детства.', say: { who: 'hinata', text: 'Да я подумала, ты под чем-то. Хотела зрачки посмотреть, у брата друга так было, тоже сидел зависал…', at: [30, 580] } },
  { shake: [9, 320], flash: [.12, 300], say: { who: 'banka', text: 'Я ни под чем!', shout: true, at: [420, 620] },
    do: (s, i) => { const G = s.h.girl; G.emo('angry'); if (i) { G.pose('hugCan', 0); return; } G.pose('hugUp', 110); after(350, () => G.pose('hugCan', 420)); } },
  { say: { who: 'hinata', text: 'Извини. Правда, прости. Сглупила.', at: [50, 600] }, inner: 'Это по-честному. Меня саму бесит, что из-за паранойи клана пришлось нагло врать зашуганному ребёнку.',
    do: s => { s.h.girl.emo('down'); s.h.girl.look(0, 1); } },
  { cap: 'Чтобы заполнить тишину, я болтаю обо всём подряд. День рождения Аой, магазинный торт, дурацкие свечки. Аркада. Кайто, который прилип к автомату-груше.',
    do: (s, i) => pz(s.h.hinata, 'sitLean', 700, i) },
  { say: { who: 'hinata', text: 'А я ему поддалась. Никому не говори.', whisper: true, at: [60, 620] },
    do: (s, i) => pz(s.h.hinata, { ...POSES.sitLean, lean: 26, head: 4 }, 500, i) },
  { inner: 'Она делает вид, что ей плевать и она не слушает. Но я чётко вижу, как её голова поворачивается на пару миллиметров в мою сторону.',
    do: (s, i) => { const G = s.h.girl; pz(G, { ...POSES.hugCan, head: -13 }, 1500, i); G.look(2, 0); pz(s.h.hinata, 'sit', 600, i); } },
  { say: { who: 'hinata', text: 'Тебе пойти-то есть куда на ночь?', at: [40, 600] }, inner: 'Она только пожимает плечами. Будто я спросила несусветную глупость.',
    do: (s, i) => { const G = s.h.girl, b = { ...POSES.hugCan, head: -13 }; if (i) { G.pose(b, 0); return; } after(1500, () => G.pose({ ...b, lean: 10, head: -18 }, 180)); after(1760, () => G.pose(b, 320)); } }
] },
{ build: sceneEdge, args: ['sneakers'], where: 'Сцена 2 · Банка', beats: [
  { cam: [{ x: 0, y: 280, z: 1.25 }, 6000], cap: 'Я опускаю взгляд. Стоптанные кеды, тонкие дешёвые носки. Насквозь мокрые — ещё с четвергового ливня. В октябрьский холод.' }
] },
{ build: sceneYard, where: 'Сцена 2 · Банка', init: yard({
    H: { x: 470, seat: SEAT, pose: 'sit', F: 'bag' }, G: { x: 690, pose: 'hugCan', N: 'can', look: [0, 1] }, onigiri: true, cam: CAM(560, 1340, 1.6) }), beats: [
  { say: { who: 'hinata', text: 'Сиди тут. Я сейчас.', at: [60, 600] },
    do: (s, i) => { const H = s.h.hinata; if (i) { put(H, { ground: GROUND, x: -560, f: -1, pose: 'stand', hidden: true }); return; }
      standUp(H, false, 'stand', 380); after(650, () => walk(H, -560, 1800, false, { run: true, face: -1 })); after(2500, () => put(H, { hidden: true })); } },
  { cam: [CAM(662, 1372, 2.05), 3200], inner: 'Бегу к комбини — метров пятьдесят. А в голове крутится: вернусь, а её уже нет. Сбежит. И, может, это было бы даже правильно.' }
] },
{ build: sceneCounter, args: ['kairo'], where: 'Сцена 2 · Банка', beats: [
  { sfx: { text: 'ДЗЫНЬ!', x: 440, y: 960, rot: 6, size: 80, c: '#e0b840', c1: '#fffbe0' }, fx: 'coins',
    cap: 'Сонный студент всё там же. Грелки-кайро со стенда. Ещё одна горячая банка — не глядя. Мелочь на кассу, чуть не рассыпаю.' }
] },
{ build: sceneYard, where: 'Сцена 2 · Банка', init: yard({
    H: { x: -380, pose: 'runA', F: 'bag', N: 'kairo' }, G: { x: 690, pose: 'hugCan', N: 'can', look: [0, 1] }, onigiri: true, cam: CAM(662, 1372, 2.05) }), beats: [
  { cam: [CAM(600, 1360, 1.7), 1800], cap: 'Обратно лечу бегом. Сворачиваю за угол. Она на месте.',
    do: (s, i) => walk(s.h.hinata, 510, 2000, i, { run: true, face: 1, end: 'crouch', endMs: 450 }) },
  { inner: 'Меня отпускает. Сама не ожидала, как сильно, оказывается, боялась, что она исчезнет.', do: s => s.h.girl.look(2, 0) },
  { sfx: { text: 'ШУРХ!', x: 520, y: 900, rot: -8, size: 88, c: '#ffc070', c1: '#ffffff' }, fx: 'rustle',
    say: { who: 'hinata', text: 'Вот. Суёшь в карман или прямо в кеды. Греет часов десять.', at: [40, 580] },
    do: (s, i) => pz(s.h.hinata, 'crouchOffer', 500, i) },
  { cap: 'Она берёт одну. Осторожно, недоверчиво, будто оттуда сейчас выскочит игла. Пакет теплеет прямо у неё в ладонях…',
    do: (s, i) => { const H = s.h.hinata, G = s.h.girl; G.look(3, 3);
      if (i) { H.hold('N', null); G.hold('F', HELD.kairo); G.pose('hugCan', 0); H.pose('crouch', 0); return; }
      G.pose('grab', 500); after(750, () => { H.hold('N', null); G.hold('F', HELD.kairo); G.pose('hugCan', 600); H.pose('crouch', 600); }); } },
  { snd: { pad: 'tender' }, inner: '…и в её лице что-то едва уловимо меняется. Брови чуть опускаются. Плечи отпускает на какой-то жалкий миллиметр.',
    do: (s, i) => { const G = s.h.girl; G.emo('half'); G.look(1, 1); pz(G, { ...POSES.hugCan, lean: 13, head: -2 }, 1600, i); G.rimColor('#f1e2cf'); } },
  { cap: 'Остальные пакетики я молча кладу на бортик, рядом с нетронутым онигири.', say: { who: 'banka', text: '…Зачем ты это делаешь?', whisper: true, at: [400, 660] },
    do: (s, i) => { const H = s.h.hinata; s.h.kairo.style.opacity = 1; if (i) { sitDown(H, 470, true); return; } standUp(H, false, 'stand', 380); after(420, () => sitDown(H, 470, false, 'sit', 650)); } },
  { say: { who: 'hinata', text: 'Потому что ты сидишь тут ночью одна, насквозь мокрая. И это неправильно.', at: [40, 580] }, inner: 'Без пафоса. Без жалости. Просто как есть.' }
] },
{ build: sceneFaceGirl, where: 'Сцена 2 · Банка', snd: { pad: 'tender' }, init: s => s.h.girl.eyes.set('down'), beats: [
  { cam: [{ z: 1.1 }, 8000], cap: 'Она молчит. Но и не огрызается. А потом поднимает голову — и это самый долгий её взгляд мне в лицо. Без злости. Просто пытливо.',
    do: (s, i) => { const E = s.h.girl.eyes; if (i) { E.set('neutral'); return; } after(1300, () => { E.set('neutral'); E.look(0, -3); }); } }
] },
{ build: sceneYard, where: 'Сцена 2 · Банка', snd: { pad: 'tender' }, init: yard({
    H: { x: 470, seat: SEAT, pose: 'sit', F: 'bag' }, G: { x: 690, pose: { ...POSES.hugCan, lean: 13, head: -2 }, N: 'can', F: 'kairo', emo: 'neutral', look: [2, 0] },
    onigiri: true, kairo: true, warm: true, cam: CAM(580, 1345, 1.8) }), beats: [
  { sfx: BUZZ(290, 900), fx: 'buzz', clock: '22:08', snd: { pad: 'night' },
    inner: 'Всё. Если не пойду сейчас, к половине одиннадцатого не успею никак. А мамино «в 22:30 дома» — приказ, который не обсуждается.' },
  { inner: 'Остаётся то, что написала мама. Если отбросить эмоции — это самый разумный выход. В кобане тепло. Там еда. Там взрослые, которые знают, что делать.' },
  { say: { who: 'hinata', text: 'Слушай… тут недалеко кобан. Там тепло. Давай я тебя провожу? Я сама с тобой посижу, никуда не уйду, пока не разберутся…', at: [30, 470] },
    do: (s, i) => pz(s.h.hinata, 'sitLean', 700, i) },
  { shake: [18, 520], fx: 'hit', flash: [.18, 300], snd: { pad: 'tense' }, cam: [CAM(625, 1330, 1.6), 300],
    say: { who: 'banka', text: 'Да что ты ко мне пристала?!', shout: true, at: [330, 470] },
    do: (s, i) => { const G = s.h.girl; G.emo('wide'); G.rimColor(LAMP_RIM); pz(s.h.hinata, { ...POSES.sit, lean: -6 }, 250, i);
      if (i) { put(G, { seat: null, x: 760, pose: 'standTense' }); return; }
      standUp(G, false, 'standTense', 220); G.move(760, null, 380); } },
  { shake: [10, 360], say: { who: 'banka', text: 'Отстань! Отвали от меня!', shout: true, at: [380, 560] }, cap: 'Отчаянный, надрывный детский крик. Ни капли угрозы — только животная паника и боль.',
    do: s => s.h.girl.emo('angry') },
  { inner: 'Меня прошибает. Инстинкты быстрее мозга: вес на носки, тело само принимает боевую стойку. Я тут же заставляю себя опустить руки. Но уже поздно.',
    do: (s, i) => { const H = s.h.hinata; if (i) { setDanger(false); H.pose('sit', 0); return; }
      setDanger(true); H.pose('sitGuard', 130); after(900, () => H.pose('sit', 700)); after(1150, () => setDanger(false)); } },
  { inner: 'Одним словом я сломала всё то крошечное доверие, которое только начало у нас получаться. Её крик — не агрессия. Это злость на себя за то, что на секунду мне поверила.' },
  { cam: [CAM(700, 1300, 2.3), 2600], cap: 'Она стоит в шаге от песочницы, прижимая к груди банку и кайро. Дышит часто, рывками — а пар изо рта еле видно.',
    do: s => { s.pant = s.h.girl; s.h.girl.emo('neutral'); } },
  { sfx: { text: 'СКРИИИП…', x: 560, y: 690, rot: -4, size: 62, c: '#f0b840', c1: '#fff4d0' }, fx: 'creak', clock: '22:10', cam: [CAM(560, 1180, 1.12), 2600],
    cap: 'В доме напротив зажигается окно. Скрипит балконная дверь.',
    do: (s, i) => { s.h.balcony.style.transition = i ? '' : 'opacity .5s'; s.h.balcony.style.opacity = 1; } }
] },

/* ---------- scene 3: tomorrow at seven ---------- */
{ build: sceneTitle, snd: { wind: .35 }, where: 'Глава 3', beats: [
  { title: ['Сцена 3', 'Завтра в семь'], hold: 2600 }
] },
{ build: sceneBalcony, where: 'Сцена 3 · Завтра в семь', init: s => { s.h.win.style.opacity = 1; s.h.man.style.opacity = .95; }, beats: [
  { cam: [{ z: 1.08 }, 7000], cap: 'Я замираю и жду, что сейчас начнётся. Кто-то высунется, рявкнет на нас, пригрозит полицией. Спросит, какого хрена тут происходит…' },
  { cap: 'Секунда. Две.', hold: 2400 },
  { sfx: { text: 'ХЛОП.', x: 460, y: 1080, rot: 4, size: 84, c: '#8a90a8', c1: '#ffffff' }, fx: 'thud',
    cap: 'Никто не выходит. Дверь с глухим хлопком закрывается. Окно ещё пару мгновений равнодушно горит жёлтым…',
    do: (s, i) => { s.h.man.style.opacity = 0; const w = s.h.win; w.style.transition = 'opacity .8s'; if (i) { w.style.opacity = 0; return; } after(2400, () => { w.style.opacity = 0; }); } },
  { inner: '…и гаснет. Всем просто насрать. Огромному спящему городу абсолютно всё равно, кто тут кричит и кому плохо.', do: s => { s.h.win.style.opacity = 0; } }
] },
{ build: sceneYard, where: 'Сцена 3 · Завтра в семь', snd: { pad: 'tense' }, init: yard({
    H: { x: 470, seat: SEAT, pose: 'sit' }, G: { x: 760, seat: null, pose: 'standTense', N: 'can', F: 'kairo', emo: 'neutral', look: [2, 0] },
    onigiri: true, kairo: true, pant: true, cam: CAM(612, 1330, 1.7) }), beats: [
  { cap: 'Я остаюсь сидеть на ледяном бетоне. Медленно, чтобы она видела каждое движение, поднимаю раскрытые ладони.', say: { who: 'hinata', text: 'Ладно, никакой полиции. Я никому не звоню.', at: [40, 600] },
    do: (s, i) => pz(s.h.hinata, 'palms', 900, i) },
  { inner: 'А правда ли? Я сама не знаю, что сделаю через десять минут. Я просто пытаюсь не дать этой мелкой гранате рвануть прямо здесь и сейчас.' },
  { danger: true, inner: 'Тело уже всё посчитало само. Я догоню её ровно за три шага. Перехвачу за мешковатый рукав, заломлю руки — никуда она не денется.',
    do: (s, i) => marks(s, true, i) },
  { danger: false, inner: 'Но нельзя. Её уже ловили. Хватали, тащили, пугали. Схватишь такого зверька один раз — и доверия больше не будет никогда. Ни к кому.',
    do: (s, i) => marks(s, false, i) },
  { snd: { pad: 'sad' }, cap: 'Правильного варианта здесь просто нет. Любой шаг — дерьмовый.' },
  { cap: 'Постепенно она переводит дыхание. Паника уходит, остаётся только звенящая усталость.', say: { who: 'banka', text: '…Спасибо.', whisper: true, at: [440, 660] },
    do: (s, i) => { const G = s.h.girl; s.pant = null; pz(G, 'standCanDown', 900, i); G.emo('down'); G.look(0, 2); } },
  { inner: 'Неуклюже, почти беззвучно. Видно, что это слово для неё совсем чужое. Оно царапает ей горло.' },
  { say: { who: 'banka', text: 'Со мной всё будет нормально. Мне есть где спать.', at: [360, 620] },
    do: (s, i) => { const G = s.h.girl; pz(G, 'standCan', 500, i); G.emo('neutral'); G.look(2, 0); } },
  { inner: 'Меня аж передёргивает. Заготовка. Гладкая, отрепетированная ложь для приставучих взрослых. Я узнаю этот тон с первых нот — потому что сама точно такая же.' },
  { say: [{ who: 'hinata', text: 'Точно?', at: [110, 660] }, { who: 'banka', text: 'Точно.', at: [560, 720] }] },
  { cam: [CAM(615, 1285, 2.0), 2600], cap: 'Она смотрит на меня. Я смотрю на неё. И мы обе прекрасно знаем, что это полная, абсолютная неправда.' },
  { cam: [CAM(620, 1360, 1.9), 900], fx: 'rustle', cap: 'Она молниеносно наклоняется и сгребает с бортика все кайро до единой. Торопливо запихивает в карман толстовки.',
    do: (s, i) => { const G = s.h.girl; if (i) { put(G, { x: 650, pose: 'reachHover' }); s.h.kairo.style.opacity = 0; return; }
      G.move(650, null, 420); G.pose('reach', 420); after(700, () => { s.h.kairo.style.opacity = 0; }); after(1500, () => G.pose('reachHover', 900)); } },
  { inner: 'А к онигири не прикасается. Рука на долю секунды зависает над хрустящей плёнкой… пальцы чуть подрагивают… и уходит обратно к груди.',
    do: (s, i) => { const G = s.h.girl; if (i) { put(G, { x: 700, pose: 'standCan' }); return; }
      const b = POSES.reachHover; G.pose({ ...b, armN: [87, 3] }, 300); after(360, () => G.pose(b, 260)); after(680, () => G.pose({ ...b, armN: [86, 5] }, 260));
      after(1600, () => { G.pose('standCan', 700); G.move(700, null, 700); }); } },
  { cap: 'Она отступает на пару шагов. Спиной, не поворачиваясь. Как от чужой бродячей собаки, которая в любой момент может броситься.',
    do: (s, i) => { const G = s.h.girl; if (i) { put(G, { x: 860, f: -1, pose: 'backAway' }); return; }
      G.cycle('backAway', 'standCan', 900); G.move(860, null, 2200, { linear: true }); after(2200, () => G.pose('backAway', 300)); } },
  { sfx: { text: 'ШЛЁП-ШЛЁП', x: 600, y: 1030, rot: -6, size: 58, c: '#aebcff', c1: '#ffffff', delay: 700 }, fx: 'slap', cam: [CAM(740, 1300, 1.0), 2200],
    cap: 'Потом резко разворачивается и уходит. А через несколько метров срывается на бег. Самый обычный, угловатый подростковый бег. Мокрые кеды жалко шлёпают по асфальту.',
    do: s => { s.pant = null; runAway(s, s.h.girl); } },
  { inner: 'Моё тело предаёт меня: мышцы сами дёргают вперёд, я почти срываюсь с бетона. Стой, придурочная. Ногти впиваются в ладони. Я приказываю себе остаться.',
    do: (s, i) => { const H = s.h.hinata; if (i) { H.pose('sit', 0); return; } H.pose({ ...POSES.sitLean, lean: 32, armN: [60, 30] }, 140); after(650, () => H.pose('sit', 700)); } },
  { say: { who: 'hinata', text: 'Я завтра тут буду! В семь! Приходи, слышишь?!', shout: true, at: [40, 520] }, do: (s, i) => pz(s.h.hinata, 'sitShout', 300, i) },
  { say: { who: 'hinata', text: 'Банка!', shout: true, at: [180, 620] }, inner: 'На какую-то долю секунды мне кажется, что на этом слове шаг у неё сбивается. Едва заметный спотыкач на ровном асфальте.', innerAt: [60, 240],
    do: (s, i) => { const G = s.h.girl; if (i) return; after(1100, () => { G.pose({ ...POSES.runA, lean: 4, head: 8 }, 90); after(200, () => G.cycle('runA', 'runB', 440)); }); } },
  { cap: 'А может, мне просто до одури хочется, чтобы она меня услышала. Серая толстовка ныряет за угол дома и исчезает.',
    do: (s, i) => { const G = s.h.girl; G.inkRoot.style.transition = G.rimRoot.style.transition = i ? '' : 'opacity 1.2s ease 1.4s'; put(G, { hidden: true }); } },
  { cam: [CAM(470, 1260, 1.3), 4000], snd: { pad: 'sad' }, inner: 'Я остаюсь совершенно одна. Гудит белёсый фонарь. Тарахтит компрессор. Изо рта при каждом выдохе — густые белые облака пара.',
    do: s => pz(s.h.hinata, 'sit', 600, false) }
] },
{ build: sceneEdge, args: ['onigiri'], where: 'Сцена 3 · Завтра в семь', snd: { pad: 'sad' }, beats: [
  { cam: [{ x: 0, y: -14, z: 1.35 }, 6000], cap: 'Я опускаю глаза. На промёрзшем бетоне одиноко лежит онигири. Всё тепло она забрала, до единой кайро. А еду оставила.' },
  { inner: 'Почему? Гордость. Взять грелку не стыдно — холодно ведь всем. А взять чужую еду — значит признать вслух, что ты голодная.', do: (s, i) => liftOnigiri(s, i) }
] },
{ build: scenePhone, where: 'Сцена 3 · Завтра в семь', snd: { pad: 'sad' },
  init: () => chat(MUM.slice(0, 4).concat([['mom', MUM[4][1], 1], ['time', '22:13']]), true), beats: [
  { bottom: true, flash: [.3, 500, '#dfe8ff'], cap: 'Экран больно бьёт по глазам. 22:13. Под большим пальцем всё ещё светится её последнее, жёсткое: «вызови полицию».' },
  { bottom: true, inner: 'Если не сорвусь прямо сейчас, к 22:30 не успею даже короткими дворами. А дома мама посмотрит своим немигающим взглядом и спросит, звонила ли я в полицию. Как она велела.' }
] },
{ build: sceneYard, where: 'Сцена 3 · Завтра в семь', snd: { pad: 'sad' }, init: yard({
    H: { x: 470, seat: SEAT, pose: 'sit', F: 'bag' }, G: { x: 1200, hidden: true }, onigiri: true, cam: CAM(470, 1300, 1.4) }), beats: [
  { fx: 'rustle', cap: 'Я закидываю шуршащий пакет на плечо и прячу холодный ничейный онигири в карман.',
    do: (s, i) => { const H = s.h.hinata; s.h.onigiri.style.opacity = 0; if (i) { H.hold('N', null); put(H, { ground: GROUND, pose: 'standBag' }); return; }
      H.hold('N', HELD.onigiri); H.pose('sitOffer', 400); after(800, () => { H.hold('N', null); standUp(H, false, 'standBag', 500); }); } },
  { cam: [CAM(300, 1280, 1.15), 5200], inner: 'Последний тяжёлый взгляд на тёмный угол, за которым пропала Банка. И широким, быстрым шагом — к дому.',
    do: (s, i) => { const H = s.h.hinata; if (i) { put(H, { x: -420, f: -1, pose: 'standBag', hidden: true }); return; }
      H.face(1); after(1500, () => walk(H, -420, 5000, false, { face: -1, end: 'standBag' })); } },
  { clock: '22:14', inner: 'Мой палец так и висит над экраном.', innerAt: [60, 330], hold: 4500 }
] }
];
