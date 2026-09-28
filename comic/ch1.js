/* Глава 1. Панель: ширина 160 px арта, высота h. Персонаж: x,y — подбородок, H — размер головы.
   Реплики: at = [x, y] — верхний центр облачка (ay: 1 — нижний край). */
(function (C) {
'use strict';
const PX = window.PX, ART = window.ART;
const T = (t, who, s, at, o) => Object.assign({ t, who, s, at, ay: 0 }, o);
const say = (who, s, at, o) => T('say', who, s, at, o);
const shout = (who, s, at, o) => T('shout', who, s, at, o);
const whisper = (who, s, at, o) => T('whisper', who, s, at, o);
const think = (s, at, o) => T('think', 'hinata', s, at, o);
const cap = (s, at, o) => Object.assign({ t: 'cap', s, at, ax: 0, ay: 0 }, o);
const capD = (s, at, o) => cap(s, at, Object.assign({ cls: 'day' }, o));
const capB = (s, h, o) => cap(s, [4, h - 3], Object.assign({ ay: 1 }, o));
const sfx = (s, at, o) => Object.assign({ t: 'sfx', s, at }, o);
const clock = (s, at) => ({ t: 'time', s, at, ax: 0, ay: 0 });
const txtPanel = (s, h = 40, o) => Object.assign({ h, bg: 'dark', txt: [cap(s, [6, 5], { mw: 148 })] }, o);

/* ---- small drawings ---- */
const slab = (y, c = '#d8b27a', d = '#a8845a') => b => { b.rect(0, y, b.w, 4, c); b.rect(0, y + 4, b.w, b.h, d); b.rect(0, y, b.w, 1, PX.mix(c, '#ffffff', .3)); };
function forearm(b, o = {}) {
  const skin = '#f7d2b4', skinD = '#dfa586', ink = '#2a1812';
  b.shape(fn => PX.spansPoly([[-10, 34], [170, 22], [170, 66], [-10, 78]], fn), skin, ink, { shade: [0, 1, skinD], depth: 3 });
  PX.spansEll(92, 49, 20, 10, (a, bb, y) => { for (let x = a; x <= bb; x++) { const t = Math.hypot((x - 92) / 20, (y - 49) / 10); b.px(x, y, PX.col(t < .45 ? '#7a4a86' : t < .75 ? (PX.bayer(x, y) < .5 ? '#9a5a8e' : '#b5873a') : (PX.bayer(x, y) < .4 ? '#c8a050' : skin))); } });
  for (const [x, y, l] of [[40, 44, 9], [52, 54, 6], [132, 38, 8], [142, 48, 5]]) b.line(x, y, x + l, y - 2, '#fbe9dc');
  if (o.grab) { const kc = '#f0c8a6', kd = '#d49e7c', kk = '#1a1418'; b.shape(fn => PX.spansPoly([[46, -4], [122, -4], [120, 24], [52, 26]], fn), kc, kk, { shade: [0, 1, kd] }); for (let i = 0; i < 4; i++) b.shape(fn => PX.spansEll(62 + i * 13, 30 + i, 5.5, 10, fn), kc, kk, { shade: [1, 1, kd] }); }
}
function phoneHand(b, o) {
  const x = o.x, y = o.y, s = o.s;
  b.shape(fn => PX.spansPoly([[x - s * .5, y - s * 1.05], [x + s * .5, y - s * 1.05], [x + s * .5, y], [x - s * .5, y]], fn), '#f0a8c0', '#2a1a22');
  b.rect(x - s * .44, y - s * .99, s * .88, s * .93, o.screen || '#e8eef8');
  b.rect(x - s * .44, y - s * .99, s * .88, s * .1, '#c8d0e0');
  b.shape(fn => { PX.spansEll(x + s * .56, y - s * .3, s * .16, s * .34, fn); PX.spansPoly([[x + s * .3, y - s * .1], [x + s * .7, y - s * .2], [x + s * .7, y + s * .3], [x + s * .3, y + s * .3]], fn); }, '#f7d2b4', '#2a1812', { shade: [1, 1, '#dfa586'] });
}
const desks = y => b => { b.rect(0, y, b.w, 3, '#d8b27a'); b.rect(0, y + 3, b.w, 3, '#b48a5a'); for (const x of [6, 50, 104, 150]) b.rect(x, y + 6, 1, b.h, '#6a6e78'); };
function harness(b) { // Сэйдзи со спины: под ветровкой — прямая жёсткая линия вдоль позвоночника
  b.fill(PX.vgrad([[0, '#e6b890'], [1, '#caa27c']], 0, b.h));
  const c = '#5b6158', d = '#3f443d', ink = '#1a1612';
  b.shape(fn => PX.spansPoly([[20, b.h + 4], [30, 30], [60, 12], [100, 12], [130, 30], [140, b.h + 4]], fn), c, ink, { shade: [1, 0, d], depth: 3 });
  b.shape(fn => PX.spansPoly([[52, 16], [80, -6], [108, 16], [96, 28], [64, 28]], fn), c, ink, { shade: [0, 1, d] });
  for (let y = 20; y < b.h; y++) { b.px(78, y, PX.col(d)); b.px(81, y, PX.col(d)); if (y % 7 === 0) { b.px(79, y, PX.col('#262a24')); b.px(80, y, PX.col('#262a24')); } }
  b.rect(70, 36, 20, 2, '#2a2d28');
}
function crossroads(b) { // слева — светлая дорога домой, справа — сырая тень под опорой
  b.fill('#e8c8a4');
  b.rect(0, 50, 80, b.h, '#8a8a92'); b.rect(0, 48, 80, 2, '#b8b0a4'); for (let x = 6; x < 76; x += 20) b.rect(x, 70, 10, 1, '#e8e4dc');
  b.rect(0, 10, 80, 38, PX.vgrad([[0, '#f0c8a0'], [1, '#f4dcc0']], 10, 48));
  b.rect(80, 0, 80, b.h, PX.dither('#16161c', '#1f1f26', .3));
  b.rect(120, 0, 18, b.h, '#4a4a50'); for (let i = 0; i < 12; i++) b.px(122 + (i * 5) % 14, 20 + i * 5, PX.col(['#c0402a', '#4a8ac0', '#e0c040'][i % 3]));
  for (let x = 80; x < 160; x++) { const h = 4 + (x * 7) % 11; b.line(x, b.h - 1, x + ((x % 3) - 1), b.h - 1 - h, '#2a3420'); }
  b.rect(79, 0, 2, b.h, '#0c0a16');
}

/* ================= Сцена 1. Обычный вторник ================= */
const s1 = [
  { h: 120, bg: 'classroom', v: 'wide', light: 'warm',
    chars: [
      { id: 'rin', x: 50, y: 72, H: 11, view: 'q', f: 1, e: 'talk', armR: 'phone' },
      { id: 'kaito', x: 76, y: 73, H: 11, view: 'q', f: 1, e: 'grin' },
      { id: 'aoi', x: 100, y: 73, H: 11, view: 'q', f: -1, e: 'smile' },
      { id: 'hinata', x: 124, y: 72, H: 11, view: 'q', f: -1, e: 'grin' }],
    draw: desks(90), fx: [['sparkle', { n: 14, c: '#fff4d0', seed: 4 }]],
    txt: [capD('Жара стоит такая, будто лето просто забыло уйти.', [5, 4], { mw: 92 }), sfx('тук… тук…', [134, 30], { size: .8, rot: -6 })] },
  { h: 96, bg: 'flat', light: 'warm',
    draw: b => { b.fill(PX.vgrad([[0, '#e8c898'], [1, '#c89a64']], 0, b.h)); ART.PROP.bento(b, 46, 90, 54); ART.PROP.bento(b, 126, 88, 36, { egg: 1 }); ART.PROP.chopsticks(b, 64, 44, 56, .42); },
    txt: [capD('Мой бэнто — гора риса и куча жареной курицы. Мама кладёт мне вдвое больше: после закалки есть хочется всегда.', [4, 3], { mw: 150 })] },
  { h: 112, bg: 'classroom', v: 'desk', light: 'warm',
    chars: [{ id: 'kaito', x: 42, y: 84, H: 30, view: 'q', f: 1, e: 'shout', armR: 'reach', fist: 1 },
            { id: 'hinata', x: 122, y: 86, H: 30, view: 'q', f: -1, e: 'grin', armR: 'mouth' }],
    draw: slab(100),
    txt: [shout('kaito', 'Эй, я не сдамся без боя! Требую реванш!', [44, 4], { mw: 78 }),
          say('hinata', 'Смирись, Нисида!', [118, 18], { mw: 70 })] },
  { h: 84, bg: 'window', bgo: { at: .22 }, light: 'warm',
    chars: [{ id: 'hinata', x: 104, y: 84, H: 50, view: 'q', f: -1, e: 'laugh', noBody: true }],
    txt: [say('hinata', 'Ты продул мне вчера в армрестлинг на физре — продуешь и в битве за еду. Умей проигрывать красиво!', [48, 5], { mw: 84 })] },
  { h: 72, bg: 'window', bgo: { at: .78, curtainLeft: 1 }, light: 'warm',
    chars: [{ id: 'hinata', x: 58, y: 70, H: 46, view: 'q', f: 1, e: 'eat', noBody: true }],
    txt: [think('Проиграть ему нарочно было бы честнее. Но он же обидится ещё сильнее.', [116, 5], { mw: 76 })] },
  { h: 100, bg: 'classroom', v: 'desk', light: 'warm',
    chars: [{ id: 'rin', x: 48, y: 76, H: 30, view: 'q', f: 1, e: 'talk', armR: 'phone', hold: { id: 'phone', s: .5, dy: .05 }, look: [.4, .7] }],
    draw: slab(96),
    txt: [say('rin', 'Так, народ, слушайте сюда. В пятницу у нашей Аой день рождения!', [112, 4], { mw: 84, name: 1 }),
          say('rin', 'Бронирую вип-комнату в караоке. Гуляем всей толпой!', [112, 50], { mw: 84 })] },
  { h: 74, w: .7, align: 'l', bg: 'window', bgo: { at: .9 }, light: 'warm',
    chars: [{ id: 'hinata', x: 60, y: 74, H: 40, view: 'q', f: 1, e: 'cheer', armR: 'wave' }],
    txt: [shout('hinata', 'Я в деле!', [34, 5])] },
  { h: 66, w: .7, align: 'r', bg: 'wall', bgo: { top: '#f2e2c4', bot: '#e0c89c' }, light: 'warm',
    chars: [{ id: 'rin', x: 74, y: 66, H: 38, view: 'q', f: -1, e: 'smug' }],
    txt: [say('rin', 'Отлично. Аой поёт первой, это закон.', [40, 5], { mw: 66 })] },
  { h: 100, bg: 'window', bgo: { at: .86 }, light: 'warm',
    chars: [{ id: 'rin', x: 58, y: 92, H: 44, view: 'q', f: 1, e: 'annoyed', armR: 'phone', hold: { id: 'phone', s: .5, dy: .05 }, look: [.4, .8] }],
    txt: [say('rin', 'Ого, прикиньте. В районе у реки уже третий день ищут мужика.', [112, 5], { mw: 84 }),
          say('rin', 'Пошёл вечером за сигаретами и тупо исчез.', [112, 56], { mw: 84 })] },
  { h: 92, bg: 'classroom', v: 'desk', light: 'warm',
    chars: [{ id: 'kaito', x: 42, y: 76, H: 30, view: 'q', f: 1, e: 'smug', armR: 'cross', armL: 'cross' },
            { id: 'rin', x: 120, y: 76, H: 30, view: 'q', f: -1, e: 'surprised', armR: 'point' }],
    draw: slab(90),
    txt: [say('kaito', 'Стопудово маньяк завёлся.', [44, 4], { mw: 70 }),
          say('rin', 'Вот именно! Так что не ходите у реки по одному, ясно вам?', [112, 88], { mw: 84, ay: 1 })] },
  txtPanel('Я смеюсь вместе со всеми, но мозг на долю секунды словно отрубается от реальности.', 34),
  { h: 40, bg: 'dark', light: 'dim',
    chars: [{ id: 'hinata', x: 80, y: 60, H: 100, view: 'f', e: { eye: 'open', brow: 1, mouth: 'line', shine: 0 }, noBody: true }] },
  txtPanel('Район у реки… Мужик пропал. Я начинаю считать дни и прикидывать, чья сейчас там смена на дежурствах клана.', 42),
  { h: 84, bg: 'window', bgo: { at: .15 }, light: 'warm',
    chars: [{ id: 'hinata', x: 96, y: 84, H: 48, view: 'q', f: -1, e: 'cold', noBody: true }],
    txt: [say('hinata', 'Три дня — это долго.', [40, 8], { mw: 60 })] },
  { h: 96, bg: 'classroom', v: 'desk', light: 'warm',
    chars: [{ id: 'hinata', x: 80, y: 90, H: 40, view: 'f', e: 'laugh', armR: 'hip', armL: 'wave', fx: { sweat: 1 } }],
    txt: [cap('Фраза выходит слишком спокойной, почти деловой. Я тут же её заминаю:', [4, 4], { mw: 90 }),
          shout('hinata', 'Наверное, просто забухал и боится жене на глаза показаться!', [112, 30], { mw: 88 })] },
  { h: 84, bg: 'flat', light: 'warm',
    draw: b => { b.fill(PX.vgrad([[0, '#e8d0a8'], [1, '#d0a878']], 0, b.h)); forearm(b, { grab: 1 }); },
    txt: [cap('Кайто хватает меня за предплечье. Пальцы ложатся ровно на вчерашний синяк. Не болит: я почти ничего не чувствую.', [4, 58], { mw: 150 }),
          shout('kaito', 'Твою мать, Кирю, это что?', [118, 4], { mw: 74, to: [96, 20] })] },
  { h: 88, bg: 'window', light: 'warm',
    chars: [{ id: 'hinata', x: 64, y: 86, H: 40, view: 'q', f: 1, e: 'grin', armR: 'raise', bruise: -1 }],
    txt: [say('hinata', 'С велика убралась. Отец гоняет в додзё, сами знаете.', [122, 5], { mw: 68 })] },
  { h: 88, bg: 'wall', bgo: { top: '#efdcbc', bot: '#d9bf92' }, light: 'warm',
    chars: [{ id: 'aoi', x: 56, y: 82, H: 42, view: 'q', f: 1, e: { eye: 'half', brow: -1, mouth: 'line' }, look: [.5, .7] }],
    draw: b => ART.PROP.chopsticks(b, 70, 88, 24, -.9),
    txt: [cap('Кайто верит и смеётся. Аой смотрит на синяк чуть дольше, чем нужно. И молчит.', [102, 5], { mw: 56 })] },
  { h: 104, bg: 'classroom', v: 'desk', light: 'warm',
    chars: [{ id: 'aoi', x: 56, y: 84, H: 34, view: 'q', f: 1, e: 'soft', tilt: .12 },
            { id: 'hinata', x: 126, y: 86, H: 34, view: 'q', f: -1, e: 'smile' }],
    draw: slab(100),
    txt: [whisper('aoi', 'А можно в пятницу потом к тебе? Мама на смене, а я не хочу одна.', [60, 4], { mw: 92 })] },
  { h: 96, bg: 'window', bgo: { at: .2 }, light: 'warm',
    chars: [{ id: 'hinata', x: 104, y: 94, H: 46, view: 'q', f: -1, e: 'soft', armR: 'raise' }],
    txt: [say('hinata', 'Блин, Аой, прости, у нас дома ремонт, пылища жуткая, да и родители строгие.', [50, 4], { mw: 84 }),
          say('hinata', 'Давай лучше я к тебе?', [44, 58], { mw: 70 })] },
  txtPanel('Внутри этот отказ не стоит мне ничего. И вот это как раз неприятно: осознавать, как легко получается врать людям, которых любишь.', 46),
  { h: 92, bg: 'wall', bgo: { top: '#efdcbc', bot: '#d9bf92' }, light: 'warm',
    chars: [{ id: 'aoi', x: 104, y: 92, H: 46, view: 'q', f: -1, e: { eye: 'open', brow: -1, mouth: 'line' } }],
    txt: [say('aoi', 'Ты всегда уходишь первой. Я не жалуюсь. Просто заметила.', [48, 8], { mw: 72 })] },
  { h: 104, bg: 'flat', light: 'warm',
    draw: b => { b.fill(PX.vgrad([[0, '#d8b27a'], [1, '#b48a5a']], 0, b.h)); phoneHand(b, { x: 80, y: 98, s: 84 }); },
    txt: [sfx('бз-з', [26, 18], { size: .9, rot: -10 }),
          { t: 'phone', who: 'Мама', s: 'Сегодня в 18:00. В пятницу вечером будь дома.', at: [80, 42], mw: 70 }] },
  { h: 118, bg: 'dark', light: 'night', lights: [{ x: 80, y: 136, r: 96, c: '#b8d0ff', k: 1 }],
    chars: [{ id: 'hinata', x: 80, y: 104, H: 54, view: 'f', e: 'focus', noBody: true }],
    txt: [cap('Тренировку перенесли на шесть. А пятница без объяснений — это точно не про семейный ужин.', [4, 4], { mw: 150 }),
          cap('Возможно, меня наконец-то возьмут на подхват. Возможно, из-за того мужика у реки.', [4, 115], { mw: 150, ay: 1, cls: 'moon' })] },
  { h: 104, bg: 'classroom', v: 'desk', light: 'warm',
    chars: [{ id: 'rin', x: 36, y: 86, H: 30, view: 'q', f: 1, e: 'talk', armR: 'phone', hold: { id: 'phone', s: .5, dy: .05 }, look: [.8, 0] },
            { id: 'aoi', x: 84, y: 88, H: 30, view: 'q', f: 1, e: 'neutral', look: [.8, 0] },
            { id: 'hinata', x: 134, y: 88, H: 30, view: 'q', f: -1, e: 'surprised' }],
    draw: slab(100),
    txt: [say('rin', 'Так, бронирую на семь, нас четверо. Хината, ты точно?', [62, 4], { mw: 100 })] },
  txtPanel('Аой тоже поворачивается и ждёт. На экране моего телефона всё ещё горит сообщение матери.', 40)
];

/* ================= Сцена 2. Набережная ================= */
const s2 = [
  { h: 96, bg: 'window', bgo: { at: .12 }, light: 'warm',
    chars: [{ id: 'hinata', x: 100, y: 94, H: 44, view: 'q', f: -1, e: 'talk', armR: 'raise', armL: 'raise' }],
    txt: [say('hinata', 'Не-а, вычёркивай. В пятницу семейное, отец припахал.', [48, 4], { mw: 84 }),
          say('hinata', 'Если сбегу — меня дома на ремни пустят.', [44, 52], { mw: 74 })] },
  { h: 80, w: .72, align: 'r', bg: 'wall', bgo: { top: '#f2e2c4', bot: '#e0c89c' }, light: 'warm',
    chars: [{ id: 'rin', x: 70, y: 80, H: 40, view: 'q', f: -1, e: 'annoyed', armR: 'phone', hold: { id: 'phone', s: .5, dy: .05 } }],
    txt: [say('rin', 'Вечно ты со своими предками…', [44, 5], { mw: 70 })] },
  { h: 90, bg: 'window', bgo: { at: .8 }, light: 'warm',
    chars: [{ id: 'kaito', x: 60, y: 90, H: 44, view: 'q', f: 1, e: 'cheer', armR: 'wave' }],
    txt: [shout('kaito', 'О, кайф! Наконец-то спою по-человечески, без твоих птеродактильих воплей!', [114, 5], { mw: 80 })] },
  { h: 118, bg: 'classroom', v: 'desk', light: 'warm',
    chars: [{ id: 'hinata', x: 44, y: 102, H: 32, view: 'q', f: 1, e: 'annoyed', armR: 'point' },
            { id: 'aoi', x: 126, y: 104, H: 32, view: 'q', f: -1, e: 'neutral' }],
    draw: slab(114),
    txt: [say('hinata', 'Зато твоё блеяние теперь никто заглушать не будет, придурок.', [56, 4], { mw: 96 }),
          say('hinata', 'Аой, подарок вручу в четверг, железно. А всю субботу я твоя!', [100, 46], { mw: 96 })] },
  { h: 92, bg: 'wall', bgo: { top: '#efdcbc', bot: '#d9bf92' }, light: 'warm',
    chars: [{ id: 'aoi', x: 58, y: 92, H: 46, view: 'q', f: 1, e: 'smile' }],
    txt: [say('aoi', 'Всё нормально.', [114, 8], { mw: 60 }),
          cap('Слишком быстро. Слишком вежливо, будто выставила стеклянный щит.', [94, 50], { mw: 64 })] },
  { h: 90, bg: 'classroom', v: 'board', light: 'warm',
    chars: [{ id: 'hinata', x: 116, y: 84, H: 22, view: 'q', f: -1, e: 'annoyed', armR: 'chest' }],
    draw: desks(86),
    txt: [cap('Остаток уроков — как в тумане. В башке крутится река, пропавший мужик и мамино «будь дома».', [4, 4], { mw: 96 })] },
  { h: 110, bg: 'street', v: 'fork', light: 'eve',
    chars: [{ id: 'aoi', x: 70, y: 70, H: 9, view: 'q', f: 1, pose: 'walk', e: 'talk' },
            { id: 'hinata', x: 88, y: 69, H: 9, view: 'q', f: 1, pose: 'walk', e: 'grin' }],
    txt: [clock('16:40', [4, 4]), capD('До моста мы с Аой идём вместе. Болтаем про тупую дораму и надвигающиеся экзамены.', [44, 4], { mw: 112 })] },
  { h: 92, bg: 'sky', bgo: { stops: [[0, '#f0b890'], [1, '#f8e0c4']] }, light: 'eve',
    chars: [{ id: 'aoi', x: 58, y: 92, H: 44, view: 'q', f: 1, e: { eye: 'half', brow: -2, mouth: 'line' }, look: [0, 1] }],
    txt: [say('aoi', 'Я не обиделась на караоке, правда.', [116, 8], { mw: 66 })] },
  txtPanel('Я же вижу, что обиделась. И исправить ничего нельзя: чтобы её успокоить, придётся нагородить ещё тонну вранья.', 44),
  { h: 100, bg: 'sky', bgo: { stops: [[0, '#eaa87c'], [1, '#f8dcc0']] }, light: 'eve',
    chars: [{ id: 'aoi', x: 104, y: 100, H: 50, view: 'q', f: -1, e: 'soft' }],
    txt: [say('aoi', 'Правда нормально. Ты же не виновата, что у тебя такая семья.', [50, 5], { mw: 80 })] },
  { h: 120, bg: 'embankment', t: 'eve', tape: [120, 158], stairs: 118, light: 'eve',
    chars: [{ id: 'hinata', x: 60, y: 94, H: 12, view: 'q', f: 1, pose: 'stand', e: 'neutral', bruise: -1 }],
    txt: [capD('Она машет рукой и сворачивает к дому. А я остаюсь на набережной одна.', [4, 4], { mw: 110 })] },
  { h: 96, bg: 'flat', light: 'eve',
    draw: b => { b.fill(PX.vgrad([[0, '#d8c8b0'], [1, '#b8a890']], 0, b.h)); b.rect(52, 0, 30, b.h, '#c8c2b6'); b.rect(82, 0, 3, b.h, '#a8a296'); ART.PROP.poster(b, 67, 84, 60); b.rect(100, 60, 60, 36, '#a8a090'); },
    txt: [capD('На столбах — свежие ориентировки: «Разыскивается». Мужик лет сорока в нелепом узком галстуке. Скотч уже отклеивается от жары.', [96, 4], { mw: 62 })] },
  { h: 60, bg: 'embankment', t: 'eve', hz: .2, tape: [20, 140], posts: false, light: 'eve',
    txt: [capD('У ступеней к воде трепещет жёлтая лента. Ни ментов, ни зевак — ни души.', [4, 3], { mw: 150 })] },
  { h: 100, bg: 'dark', light: 'dim', under: [['speed', { x: 80, y: 60, c: '#3a3456', n: 90, r: 40 }]],
    chars: [{ id: 'hinata', x: 80, y: 100, H: 58, view: 'f', e: 'focus', noBody: true }],
    txt: [cap('Глаза сами переключаются в рабочий режим: слепые зоны фонарей, тени от парапета, окна, что выходят к воде.', [4, 4], { mw: 150 })] },
  txtPanel('Натаскивают как ищейку, вдалбливают с пелёнок, а толку? Держат взаперти, как сопливую малолетку.', 42),
  { h: 120, bg: 'embankment', t: 'eve', bench: 70, stairs: 116, posts: false, light: 'eve',
    chars: [{ id: 'seiji', x: 92, y: 47, H: 13, view: 'q', f: -1, pose: 'sit', e: 'smug', hood: 1, armR: 'mouth', hold: { id: 'yakisoba', s: .6, dy: .1 } }],
    txt: [capD('У широкой лестницы к реке, на скамейке, развалился Сэйдзи.', [4, 4], { mw: 110 })] },
  { h: 96, bg: 'sky', bgo: { stops: [[0, '#eaa87c'], [1, '#f8dcc0']] }, light: 'eve',
    chars: [{ id: 'seiji', x: 70, y: 96, H: 46, view: 'q', f: 1, e: { eye: 'half', brow: 0, mouth: 'full' }, hood: 1, look: [.8, 0] }],
    txt: [capD('Двадцать четыре года, наглая физиономия, вид абсолютного бездельника. Одно ухо заткнуто наушником: слушает улицу.', [100, 4], { mw: 58 })] },
  { h: 70, bg: 'sky', bgo: { stops: [[0, '#eaa87c'], [1, '#f8dcc0']] }, light: 'eve',
    chars: [{ id: 'seiji', x: 80, y: 88, H: 70, view: 'f', e: { eye: 'open', brow: 0, mouth: 'line' }, hood: 1, noBody: true, look: [.9, 0] }],
    txt: [cap('Он поднимает глаза ровно за секунду до того, как я его окликну. Это бесит меня отдельно.', [4, 3], { mw: 150, cls: 'day' })] },
  { h: 84, bg: 'flat', light: 'eve', draw: harness,
    txt: [capD('Под курткой, строго вдоль позвоночника, угадывается жёсткая прямая линия. Оружейная сбруя. Настоящий клинок, а не боккэн.', [4, 3], { mw: 88 })] },
  { h: 100, bg: 'sky', bgo: { stops: [[0, '#eaa87c'], [1, '#f8dcc0']] }, light: 'eve',
    chars: [{ id: 'hinata', x: 104, y: 100, H: 46, view: 'q', f: -1, e: 'annoyed', armR: 'hip', bruise: -1 }],
    txt: [say('hinata', 'Ты чё тут расселся? Наше дежурство? Это из-за того мужика с листовки?', [52, 4], { mw: 90 }),
          say('hinata', 'И какого хрена мать пишет мне сидеть в пятницу дома?', [48, 56], { mw: 80 })] },
  { h: 90, bg: 'sky', bgo: { stops: [[0, '#e0a078'], [1, '#f4d4b8']] }, light: 'eve',
    chars: [{ id: 'seiji', x: 56, y: 90, H: 44, view: 'q', f: 1, e: 'smug', hood: 1 }],
    txt: [say('seiji', 'Обедаю я. Вид красивый, погода кайф. А ты чего не на уроках, малая?', [112, 5], { mw: 86 })] },
  { h: 84, bg: 'flat', bgc: '#f4d8b8', light: 'eve', under: [['speed', { x: 80, y: 60, c: '#e8a878', n: 60 }]],
    chars: [{ id: 'hinata', x: 80, y: 84, H: 46, view: 'f', e: 'yell', armR: 'raise', fist: 1 }],
    txt: [shout('hinata', 'Какая я тебе малая! Мне восемнадцать! Я тебя на татами в узел завяжу, забыл?', [80, 3], { mw: 140 })] },
  { h: 90, bg: 'sky', bgo: { stops: [[0, '#e0a078'], [1, '#f4d4b8']] }, light: 'eve',
    chars: [{ id: 'seiji', x: 104, y: 90, H: 44, view: 'q', f: -1, e: 'smirk', hood: 1 }],
    txt: [say('seiji', 'Ага, во сне. Ты пока только на подхвате годна, тряпки в додзё подавать.', [50, 5], { mw: 84 })] },
  { h: 96, bg: 'embankment', t: 'eve', bench: 80, posts: false, hz: .3, light: 'eve',
    chars: [{ id: 'hinata', x: 42, y: 74, H: 24, view: 'q', f: 1, e: 'glare', armR: 'hip' },
            { id: 'seiji', x: 110, y: 80, H: 24, view: 'q', f: -1, e: 'smug', hood: 1 }],
    txt: [say('hinata', 'Сэй, не беси меня. Что в пятницу?', [46, 4], { mw: 76 }),
          say('seiji', 'Спроси у тёти.', [120, 30], { mw: 56 })] },
  { h: 76, bg: 'flat', bgc: '#e89a70', under: [['speed', { x: 80, y: 50, c: '#b85a3a', n: 90 }]], light: 'eve',
    chars: [{ id: 'hinata', x: 80, y: 80, H: 50, view: 'f', e: 'shout', fx: { anger: 1 }, noBody: true }],
    txt: [shout('hinata', 'Сэйдзи, блядь!', [80, 4], { mw: 90 })] },
  { h: 100, bg: 'dark', light: 'dim',
    chars: [{ id: 'seiji', x: 80, y: 100, H: 56, view: 'f', e: 'cold', hood: 1, noBody: true }],
    txt: [say('seiji', 'Малая, иди домой. Здесь не гуляют.', [80, 4], { mw: 84 }),
          cap('Голос низкий, тяжёлый. Голос действующего охотника, а не брата-раздолбая.', [4, 97], { mw: 150, ay: 1 })] },
  { h: 120, bg: 'bridge', t: 'eve', light: 'eve',
    txt: [cap('Его взгляд дважды срывается вниз по течению. Туда, где над мутной водой горбится старый пешеходный мост.', [4, 4], { mw: 150, cls: 'day' })] },
  { h: 80, bg: 'sky', bgo: { stops: [[0, '#e0a078'], [1, '#f4d4b8']] }, light: 'eve',
    chars: [{ id: 'seiji', x: 60, y: 84, H: 40, view: 'q', f: -1, e: 'closed', hood: 1 }],
    txt: [capD('Он сминает пакет из-под якисобы, засовывает второй наушник в ухо и отворачивается к воде. Разговор окончен.', [96, 4], { mw: 62 })] },
  { h: 96, bg: 'flat', light: 'eve',
    draw: b => { b.fill(PX.vgrad([[0, '#c8a888'], [1, '#a88868']], 0, b.h)); phoneHand(b, { x: 80, y: 94, s: 74, screen: '#dfe6f4' }); },
    txt: [{ t: 'time', s: '17:22', at: [80, 40], size: 1 },
          cap('Тренировка в шесть. Отец опозданий не прощает. До дома — минимум полчаса.', [4, 4], { mw: 62, cls: 'day' })] },
  { h: 96, bg: 'flat', light: 'eve', draw: crossroads,
    txt: [capD('Слева — пустая дорога домой.', [4, 4], { mw: 70 }), cap('Справа — сырая, пахнущая гнилью тень под опорой.', [84, 64], { mw: 72 })] }
];

/* ================= Сцена 3. Подарок ================= */
const s3 = [
  { h: 100, bg: 'genkan', light: 'home',
    chars: [{ id: 'hinata', x: 70, y: 36, H: 12, view: 'q', f: 1, pose: 'run', e: 'yell', fx: { sweat: 1 } }],
    props: [{ id: 'bag', x: 112, y: 84, s: 12 }],
    txt: [clock('17:58', [4, 4]), capD('Во вторник я всё-таки разворачиваюсь и почти бегу домой.', [52, 4], { mw: 104 })] },
  { h: 110, bg: 'dojo', light: 'dojo', under: [['speed', { x: 80, y: 62, c: '#4a3a2c', n: 80 }]],
    chars: [{ id: 'father', x: 44, y: 34, H: 12, view: 'q', f: 1, pose: 'walk', e: 'stern', outfit: 'dogi', armR: 'point', armL: 'forward' },
            { id: 'hinata', x: 116, y: 36, H: 11, view: 'q', f: -1, pose: 'crouch', e: 'grit', outfit: 'dogi', armR: 'raise', armL: 'raise' }],
    draw: b => { ART.PROP.bokken(b, 66, 46, 30, -.3); ART.PROP.bokken(b, 108, 52, 26, -2.2); },
    txt: [sfx('КЛАК!', [86, 12], { size: 1.1, rot: -8 }),
          cap('Отец гоняет меня до девяти — молча, методично, вбивая деревянный боккэн в блок. Про реку он не роняет ни звука.', [4, 107], { mw: 150, ay: 1 })] },
  { h: 100, bg: 'cafeteria', light: 'day',
    txt: [capD('В среду телевизор в столовой орёт новостями: тело пропавшего выловили. В реке, у старого пешеходного моста.', [4, 60], { mw: 150 }),
          { t: 'sign', s: 'ТЕЛО НАЙДЕНО У МОСТА', at: [80, 41], cls: 'light', mw: 64 }] },
  { h: 90, bg: 'wall', bgo: { top: '#e6e2d6', bot: '#cfc8b6' }, light: 'day',
    chars: [{ id: 'kaito', x: 58, y: 90, H: 44, view: 'q', f: 1, e: { eye: 'half', brow: 0, mouth: 'full' } }],
    txt: [say('kaito', 'Ну вот, я же говорил.', [114, 8], { mw: 60 }),
          cap('Менты втирают про несчастный случай: был пьян, оступился, утонул.', [92, 44], { mw: 66, cls: 'day' })] },
  { h: 96, bg: 'dark', light: 'dim',
    chars: [{ id: 'hinata', x: 80, y: 96, H: 54, view: 'f', e: { eye: 'dead', brow: 0, mouth: 'full' } }],
    txt: [cap('Я запихиваю в себя двойную порцию и не чувствую вкуса. Будто жую сухой картон. Перед глазами — взгляд брата и липкая тень под мостом.', [4, 4], { mw: 150 })] },
  txtPanel('Я всё сделала правильно, что развернулась во вторник. Правильно, чёрт возьми. Но легче почему-то не становится.', 42),
  { h: 110, bg: 'aoiRoom', v: 'table', light: 'gray',
    chars: [{ id: 'aoi', x: 54, y: 66, H: 18, view: 'q', f: 1, e: 'smile' },
            { id: 'hinata', x: 110, y: 66, H: 18, view: 'q', f: -1, e: 'grin' }],
    draw: b => { b.rect(14, 86, 132, 4, '#9a6a44'); b.rect(14, 86, 132, 1, '#c09068'); b.rect(14, 90, 132, 20, '#6a4a2e'); ART.PROP.mug(b, 70, 86, 9, { bunny: 1, steam: 1 }); ART.PROP.mug(b, 96, 86, 9, { logo: '#2a5ab0' }); },
    txt: [capD('В четверг около пяти мы сидим в квартире у Аой. Жара наконец-то сдохла. С улицы тянет влажным запахом близкого дождя.', [4, 4], { mw: 150 })] },
  { h: 72, w: .7, align: 'l', bg: 'kitchen', note: 1, light: 'gray',
    txt: [{ t: 'sign', s: 'Рис в рисоварке. Закрой на цепочку.', at: [84, 22], mw: 50 },
          capD('Тётя Морита ушла на ночную смену в больницу.', [4, 50], { mw: 66 })] },
  { h: 92, w: .8, align: 'r', bg: 'wall', bgo: { top: '#e8e4dc', bot: '#d6d0c4' }, light: 'gray',
    chars: [{ id: 'hinata', x: 70, y: 96, H: 40, view: 'q', f: 1, e: 'annoyed' }],
    txt: [cap('Я по инерции плюхаюсь спиной к стене, чтобы видеть коридор и дверь. Тупая привычка.', [4, 4], { mw: 120, cls: 'day' })] },
  { h: 88, bg: 'flat', light: 'gray',
    draw: b => { b.fill(PX.vgrad([[0, '#b88a5c'], [1, '#9a6a44']], 0, b.h)); ART.PROP.manga(b, 48, 80, 50); ART.PROP.frame(b, 112, 80, 60); },
    txt: [capD('Свежий том исторической манги, за которым она гонялась два месяца. И дешёвая рамка с нашей фоткой с летнего фестиваля.', [4, 3], { mw: 150 })] },
  { h: 96, bg: 'wall', bgo: { top: '#e8e4dc', bot: '#d6d0c4' }, light: 'gray',
    chars: [{ id: 'hinata', x: 104, y: 96, H: 48, view: 'q', f: -1, e: 'flustered', armR: 'face' }],
    txt: [say('hinata', 'Рамка косая, а кот вообще на картошку похож, не суди строго.', [50, 5], { mw: 84 })] },
  { h: 100, bg: 'window', bgo: { at: .88 }, light: 'gray', fx: [['sparkle', { n: 12, seed: 9 }]],
    chars: [{ id: 'aoi', x: 70, y: 100, H: 48, view: 'q', f: 1, e: 'laugh', armR: 'hold', armL: 'hold', hold: { id: 'frame', s: .7, dy: .05 } }],
    txt: [say('aoi', 'Это самый лучший подарок, Хината, правда.', [118, 5], { mw: 68 })] },
  { h: 84, bg: 'aoiRoom', v: 'table', light: 'gray',
    chars: [{ id: 'hinata', x: 104, y: 70, H: 26, view: 'q', f: -1, e: 'eat', armR: 'reach' }],
    props: [{ id: 'mug', x: 70, y: 82, s: 12, bunny: 1, steam: 1 }, { id: 'mug', x: 124, y: 82, s: 12, c: '#f0f0f0', logo: '#2a5ab0' }],
    draw: b => { b.rect(10, 82, 140, 4, '#9a6a44'); b.rect(10, 82, 140, 1, '#c09068'); },
    txt: [capD('У Аой — кружка с пузатым зайцем. Мне досталась мамина, с потёртым логотипом больницы. Печенье я уплетаю горстями.', [4, 3], { mw: 96 })] },
  { h: 90, bg: 'flat', bgc: '#f0e0c8', under: [['speed', { x: 80, y: 50, c: '#d8a880', n: 70 }]], light: 'gray',
    chars: [{ id: 'hinata', x: 80, y: 90, H: 46, view: 'q', f: -1, e: 'wince', armR: 'side' }],
    txt: [sfx('!', [126, 18], { size: 1.6 }), cap('Я тянусь за последним печеньем — и по рёбрам стреляет тупая, жгучая боль. Привет от батиного боккэна.', [4, 4], { mw: 80, cls: 'day' })] },
  { h: 92, bg: 'wall', bgo: { top: '#e8e4dc', bot: '#d6d0c4' }, light: 'gray',
    chars: [{ id: 'aoi', x: 60, y: 92, H: 46, view: 'q', f: 1, e: { eye: 'open', brow: 1, mouth: 'line' }, armR: 'rub' }],
    txt: [capD('Аой всё видит. Она медленно ставит кружку с зайцем и начинает крутить в пальцах ложку.', [100, 4], { mw: 58 })] },
  { h: 96, bg: 'window', bgo: { at: .9 }, light: 'gray',
    chars: [{ id: 'aoi', x: 60, y: 100, H: 50, view: 'q', f: 1, e: { eye: 'open', brow: 1, mouth: 'talk' } }],
    txt: [say('aoi', 'Я давно хотела спросить. Синяки, которые у тебя никогда не сходят. Шрамы на руках.', [114, 4], { mw: 84 })] },
  { h: 80, w: .8, align: 'l', bg: 'wall', bgo: { top: '#dcd6ca', bot: '#c8c0b0' }, light: 'gray',
    chars: [{ id: 'aoi', x: 96, y: 84, H: 44, view: 'q', f: -1, e: { eye: 'half', brow: 1, mouth: 'talk' } }],
    txt: [say('aoi', 'Ты ни разу не позвала нас к себе. И всегда уходишь первой, стоит часам подойти к вечеру.', [52, 4], { mw: 92 })] },
  { h: 96, bg: 'wall', bgo: { top: '#dcd6ca', bot: '#c8c0b0' }, light: 'gray',
    chars: [{ id: 'aoi', x: 104, y: 96, H: 50, view: 'q', f: -1, e: { eye: 'open', brow: 2, mouth: 'talk' } }],
    txt: [say('aoi', 'А во вторник ты сказала «три дня — это долго». Будто точно знаешь, как люди пропадают и чем это заканчивается.', [52, 4], { mw: 90 })] },
  { h: 72, bg: 'dark', light: 'dim',
    chars: [{ id: 'aoi', x: 80, y: 86, H: 72, view: 'f', e: { eye: 'open', brow: 1, mouth: 'line' }, noBody: true }],
    txt: [say('aoi', 'Можешь не говорить. Только не ври мне, ладно?', [80, 3], { mw: 110 })] },
  { h: 100, bg: 'wall', bgo: { top: '#dcd6ca', bot: '#c8c0b0' }, light: 'gray',
    chars: [{ id: 'hinata', x: 80, y: 62, H: 36, view: 'f', e: 'gasp', armR: 'hold', armL: 'hold', hold: { id: 'mug', s: .5, c: '#f0f0f0', logo: '#2a5ab0' } }],
    txt: [cap('Дежурная ложь про спарринг и неловкое падение уже лежит на кончике языка.', [4, 4], { mw: 150, cls: 'day' })] },
  { h: 60, bg: 'kitchen', light: 'gray',
    txt: [clock('18:40', [4, 4]), sfx('щёлк', [52, 30], { size: .8, rot: -8 }), capD('Дома нужно быть к восьми. В тишине щёлкает остывающая рисоварка.', [68, 4], { mw: 88 })] }
];

/* ================= Сцена 4. Дождь ================= */
const s4 = [
  { h: 118, bg: 'window', bgo: { at: .1 }, light: 'gray',
    chars: [{ id: 'hinata', x: 106, y: 120, H: 48, view: 'q', f: -1, e: 'talk' }],
    txt: [say('hinata', 'У нас старая семья. Со своими жёсткими заморочками и традициями.', [52, 4], { mw: 86 }),
          say('hinata', 'Отец тренирует меня всерьёз. Отсюда синяки и шрамы. Но я сама этого хочу. Я этим горжусь.', [50, 58], { mw: 88 })] },
  { h: 92, bg: 'wall', bgo: { top: '#e8e4dc', bot: '#d6d0c4' }, light: 'gray',
    chars: [{ id: 'hinata', x: 58, y: 92, H: 46, view: 'q', f: 1, e: 'soft' }],
    txt: [say('hinata', 'А домой никого не зову, потому что у нас так заведено. Не потому что мне за вас стыдно.', [112, 4], { mw: 86 })] },
  { h: 76, bg: 'dark', light: 'dim',
    chars: [{ id: 'hinata', x: 80, y: 92, H: 72, view: 'f', e: 'neutral', noBody: true }],
    txt: [say('hinata', 'Я не могу тебе всё рассказать. Но я тебе не вру.', [80, 3], { mw: 120 })] },
  { h: 96, bg: 'window', bgo: { at: .9 }, light: 'gray',
    chars: [{ id: 'aoi', x: 62, y: 96, H: 50, view: 'q', f: 1, e: 'sad', tilt: .1 }],
    txt: [whisper('aoi', 'Тебя дома никто не обижает?', [118, 8], { mw: 64 })] },
  { h: 92, bg: 'flat', bgc: '#f4e6d0', under: [['speed', { x: 80, y: 46, c: '#e8c8a0', n: 70 }]], light: 'gray',
    chars: [{ id: 'hinata', x: 80, y: 92, H: 50, view: 'f', e: 'shock', fx: { sweat: 1 } }],
    txt: [cap('Меня словно бьёт током. Синяки, шрамы, закрытый дом, строгий отец… Твою мать, она решила, что меня бьют!', [4, 3], { mw: 150, cls: 'day' })] },
  { h: 118, bg: 'wall', bgo: { top: '#e8e4dc', bot: '#d6d0c4' }, light: 'gray',
    chars: [{ id: 'hinata', x: 106, y: 120, H: 50, view: 'q', f: -1, e: 'smile' }],
    txt: [say('hinata', 'Нет, Аой. Никто. Батя, конечно, строгий до усрачки, но он лучший человек, которого я знаю.', [52, 4], { mw: 90 }),
          say('hinata', 'Если кто кого и обижает, так это я Кайто.', [50, 72], { mw: 80 })] },
  { h: 116, bg: 'window', bgo: { at: .88 }, light: 'gray', fx: [['sparkle', { n: 8, seed: 5 }]],
    chars: [{ id: 'aoi', x: 60, y: 118, H: 50, view: 'q', f: 1, e: 'soft' }],
    txt: [say('aoi', 'Хорошо. Я больше не буду спрашивать.', [116, 4], { mw: 70 }),
          say('aoi', 'Но если что… просто знай, что ты всегда можешь прийти ко мне.', [112, 54], { mw: 80 })] },
  { h: 70, w: .7, align: 'r', bg: 'wall', bgo: { top: '#e8e4dc', bot: '#d6d0c4' }, light: 'gray',
    chars: [{ id: 'hinata', x: 70, y: 72, H: 40, view: 'q', f: -1, e: 'grin' }],
    txt: [say('hinata', 'Обещаю.', [30, 6], { mw: 50 })] },
  { h: 80, bg: 'aoiRoom', v: 'shelf', photo: 1, light: 'gray',
    txt: [capD('Аой ставит мою дешёвую рамку с котом-картошкой на полку у кровати. На самое видное место.', [58, 4], { mw: 98 })] },
  { h: 100, bg: 'aoiRoom', v: 'door', light: 'gray',
    chars: [{ id: 'aoi', x: 80, y: 46, H: 16, view: 'f', pose: 'stand', e: 'laugh' }],
    txt: [clock('19:15', [4, 4]), say('aoi', 'Не забудь про субботу.', [118, 4], { mw: 60 }),
          say('hinata', 'Куда ж я денусь. И закрой на цепочку.', [42, 40], { mw: 64, to: [0, 60] }),
          say('aoi', 'Ты прям как моя мама!', [124, 62], { mw: 56 })] },
  { h: 90, bg: 'stairwell', light: 'dim',
    chars: [{ id: 'hinata', x: 104, y: 36, H: 13, view: 'q', f: -1, pose: 'stand', e: 'happy' }],
    txt: [sfx('клац', [42, 40], { size: .9, rot: -6 }), cap('Тяжёлая дверь закрывается, и внутри щёлкает та самая цепочка. Мне так легко.', [4, 4], { mw: 96 })] },
  { h: 132, bg: 'nightStreet', seed: 13, shops: ['konbini', 'closed', 'karaoke', 'closed'], ground: .7, lampX: [120], light: 'rain',
    chars: [{ id: 'hinata', x: 58, y: 84, H: 9, view: 'q', f: 1, pose: 'walk', e: 'neutral', armR: 'raise', hold: { id: 'umbrella', s: 1.9, dy: -2.1 } }],
    fx: [['rain', { seed: 8, dense: 1 }]],
    txt: [cap('На улице уже накрапывает. Мамин железный порядок: зонт всегда с собой. Одна спица погнута, и капли стекают мне прямо на плечо.', [4, 4], { mw: 150 })] },
  txtPanel('Первый настоящий осенний вечер после двух недель жары. А я в одной школьной рубашке.', 36),
  { h: 124, bg: 'nightStreet', seed: 21, shops: ['closed', 'laundry', 'closed', 'netcafe'], ground: .74, neon: false, light: 'rain', fx: [['rain', { seed: 3 }]],
    txt: [cap('Короче всего — прямо через старый пешеходный мост. В обход, через большой автомобильный, — крюк минут на двадцать. К восьми я так не успею.', [4, 4], { mw: 150 })] },
  { h: 76, bg: 'dark', light: 'rain', lights: [{ x: 120, y: -10, r: 110, c: '#ffe0a0', k: .6 }],
    chars: [{ id: 'hinata', x: 80, y: 92, H: 66, view: 'q', f: 1, e: 'focus', noBody: true }],
    fx: [['rain', { seed: 6 }]],
    txt: [cap('Мост общественный. Фонари горят. Это не дурная храбрость — это сухой расчёт.', [4, 3], { mw: 150 })] },
  { h: 120, bg: 'embankment', t: 'rain', tape: [124, 158], stairs: 120, posts: true, light: 'rain', fx: [['rain', { seed: 11, dense: 1 }]],
    txt: [cap('Набережная под дождём совсем дохлая. Лента провисла под водой. Листовок на столбах уже нет. Река шумит злее обычного.', [4, 4], { mw: 150 })] },
  { h: 120, bg: 'bridgeStairs', light: 'rain', fx: [['rain', { seed: 4 }]],
    chars: [{ id: 'hinata', x: 56, y: 60, H: 12, view: 'q', f: 1, pose: 'stand', e: 'wary', armR: 'raise', hold: { id: 'umbrella', s: 1.9, dy: -2.1 } }],
    txt: [cap('Ржавые чугунные перила усеяны ледяными каплями. Металл под пальцами холодный и шершавый.', [60, 4], { mw: 96 })] },
  { h: 110, bg: 'bridge', t: 'rain', deck: .22, light: 'rain', fx: [['rain', { seed: 9 }]],
    txt: [sfx('шшшшш', [94, 70], { size: 1, c: '#9fb0e0', rot: -4 }), cap('А там, внизу, куда не достаёт свет фонаря, — густая, глухая чернота. И тяжёлый шум воды о бетонную опору.', [4, 4], { mw: 150 })] },
  { h: 96, bg: 'flat', bgc: '#0c0e18', light: 'rain', lights: [{ x: 90, y: 0, r: 90, c: '#ffe0a0', k: .7 }], fx: [['rain', { seed: 14 }]],
    draw: b => { for (let k = 0; k < 4; k++) { b.rect(0, 62 + k * 9, b.w, 3, '#3a404e'); b.rect(0, 65 + k * 9, b.w, 6, '#262a36'); } b.shape(fn => PX.spansPoly([[60, 60], [104, 60], [106, 70], [58, 70]], fn), '#e8e4dc', '#16121c', { shade: [0, 1, '#b8b4ac'] }); },
    txt: [cap('Я ставлю ногу на первую мокрую ступеньку. Дождь барабанит по зонту. Внизу, в темноте под настилом, шумит река.', [4, 4], { mw: 150 })] }
];

C.chapters[1] = {
  title: '',
  cover: { h: 200, bg: 'nightStreet', seed: 5, shops: ['netcafe', 'konbini', 'laundry', 'ramen'], ground: .74, fx: [['rain', { seed: 2, dense: 1 }]],
    chars: [{ id: 'hinata', x: 66, y: 163, H: 8, view: 'q', f: 1, pose: 'stand', e: 'neutral', outfit: 'jacket', armR: 'raise', hold: { id: 'umbrella', s: 1.9, dy: -2.1 } },
            { id: 'tsukiko', x: 92, y: 165, H: 7, view: 'q', f: -1, pose: 'stand', e: 'blank' }],
    light: 'night', frame: false, gap: 0 },
  scenes: [
    { title: 'Обычный вторник', panels: s1 },
    { title: 'Набережная', panels: s2 },
    { title: 'Подарок', panels: s3 },
    { title: 'Дождь', panels: s4 }
  ]
};
})(window.COMIC);
