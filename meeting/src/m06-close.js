
/* ================= close-ups ================= */
function darkBack(L, o = {}) {
  el('rect', { x: -600, y: -600, width: 2100, height: 2800, fill: lin(L.defs, [[0, o.top || '#0a0d18'], [1, o.bot || '#141826']]) }, L.g);
  if (o.lamp !== false) glow(L.g, L.defs, o.lx ?? 150, o.ly ?? 360, 560, LAMP, .34);
  if (o.vend !== false) glow(L.g, L.defs, o.vx ?? 820, o.vy ?? 1020, 360, VEND, .2);
  const rnd = mulberry(o.seed || 5);
  for (let i = 0; i < 7; i++) { const c = rnd() < .5 ? LAMP : '#ffd9a0'; glow(L.g, L.defs, rnd() * 900, 200 + rnd() * 900, 30 + rnd() * 60, c, .22 + rnd() * .15); }
}
/* two front-facing eyes; blink only when asked */
function eyesFront(parent, defs, o) {
  const wrap = el('g', { class: 'eyes', 'data-emo': o.emo || 'neutral' }, parent);
  const bl = el('g', { class: o.blink ? 'blink' : '' }, wrap);
  const look = el('g', { class: 'look' }, bl);
  for (const s of [-1, 1]) {
    const e = el('g', { class: 'eye ' + (s < 0 ? 'L' : 'R'), transform: `translate(${o.cx + s * o.dx},${o.cy})` }, look);
    el('circle', { r: o.rx * 2.8, fill: rad(defs, [[0, o.color, .5], [.35, o.color, .18], [1, o.color, 0]]), class: 'eglow' }, e);
    const open = el('g', { class: 'open' }, e);
    const rx = o.rx * (o.far && s < 0 ? .82 : 1), ry = o.ry;
    el('path', { d: `M${-rx},${ry * .1} Q${-s * rx * .1},${-ry * 1.5} ${rx},${ry * .05} Q${s * rx * .05},${ry * 1.2} ${-rx},${ry * .1} Z`, fill: o.color }, open);
    if (o.pupil) el('ellipse', { cx: 0, cy: ry * .1, rx: rx * .22, ry: ry * .5, fill: o.pupil, opacity: .55 }, open);
    if (o.glint) el('circle', { cx: -rx * .3, cy: -ry * .25, r: Math.max(2, rx * .1), fill: '#ffffff', opacity: .9 }, open);
    el('path', { d: `M${-rx},${ry * .45} Q0,${-ry * 1.8} ${rx},${ry * .45}`, fill: 'none', stroke: o.color, 'stroke-width': ry * .35, 'stroke-linecap': 'round', class: 'happy' }, e);
    el('path', { d: `M${-rx * 1.05},${-ry * .1} Q${-s * rx * .1},${-ry * 1.7} ${rx * 1.1},${-ry * .2}`, fill: 'none', stroke: INK, 'stroke-width': ry * .32, 'stroke-linecap': 'round' }, open);
  }
  return {
    set(emo) { wrap.setAttribute('data-emo', emo); },
    look(dx, dy = 0) { look.style.transform = `translate(${dx}px,${dy}px)`; }
  };
}
function brows(parent, o) {
  const g = el('g', { opacity: .6 }, parent), list = [];
  for (const s of [-1, 1]) list.push(el('path', { d: `M${o.cx + s * o.dx - o.w / 2},${o.cy} Q${o.cx + s * o.dx},${o.cy - 10} ${o.cx + s * o.dx + o.w / 2},${o.cy}`, fill: 'none', stroke: o.color, 'stroke-width': 5, 'stroke-linecap': 'round', style: 'transition: transform .3s ease; transform-box: fill-box; transform-origin: 50% 50%' }, g));
  return { set(kind) { list.forEach((p, i) => { const s = i ? 1 : -1; p.style.transform = kind === 'angry' ? `rotate(${-s * 16}deg) translateY(6px)` : kind === 'worried' ? `rotate(${s * 14}deg) translateY(-4px)` : kind === 'up' ? 'translateY(-10px)' : kind === 'down' ? 'translateY(6px)' : ''; }); } };
}

const GIRL_HOOD = 'M60,1700 C80,1420 190,1300 300,1250 C340,1180 380,1150 450,1150 C520,1150 560,1180 600,1250 C710,1300 820,1420 840,1700 Z M250,1262 C230,1160 300,1090 450,1090 C600,1090 670,1160 650,1262 C600,1212 520,1192 450,1192 C380,1192 300,1212 250,1262 Z';
const GIRL_FACE = 'M300,860 C300,720 370,650 450,650 C530,650 600,720 600,860 C600,960 560,1060 450,1112 C340,1060 300,960 300,860 Z';
const GIRL_HAIR = 'M280,900 C262,760 330,610 450,605 C570,610 638,760 620,900 L628,1010 L604,980 L600,1050 L578,1000 L566,1062 L548,1000 L556,880 L530,850 L520,892 L500,846 L484,888 L462,842 L444,896 L424,846 L404,886 L386,848 L370,890 L352,852 L344,1000 L326,1062 L316,1000 L296,1050 L292,980 L272,1012 Z';
function sceneFaceGirl() {
  const back = layer(.3), mid = layer(1);
  darkBack(back);
  const G = el('g', null, mid.g); /* no breathing idle for her */
  const draw = (p, c) => { el('path', { d: GIRL_HOOD, fill: c }, p); el('path', { d: GIRL_FACE, fill: c }, p); el('path', { d: GIRL_HAIR, fill: c }, p); };
  const rim = el('g', { transform: 'translate(-9,-8)', opacity: .92 }, G); draw(rim, '#e6f2e2');
  draw(el('g', null, G), INK);
  el('path', { d: GIRL_FACE, fill: rad(mid.defs, [[0, '#a8b6c6', .2], [1, '#a8b6c6', 0]], { cx: .32, cy: .42, r: .7 }) }, G);
  for (const s of [-1, 1]) el('line', { x1: 450 + s * 60, y1: 1196, x2: 450 + s * 52, y2: 1370, stroke: '#3a3e4a', 'stroke-width': 5, 'stroke-linecap': 'round' }, G);
  const eyes = eyesFront(G, mid.defs, { cx: 450, cy: 944, dx: 66, rx: 33, ry: 15, color: '#d8d2f6', pupil: '#5a5470', blink: false, emo: 'down' });
  const br = brows(G, { cx: 450, cy: 900, dx: 66, w: 52, color: '#d8d2f6' });
  const mouth = el('path', { d: 'M430,1052 Q450,1058 470,1052', fill: 'none', stroke: '#c8d0e0', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0 }, G);
  return {
    fx: {}, snd: { wind: .5, hum: .8, pad: 'night' }, cam: { x: 0, y: 40, z: 1.02 },
    h: { girl: { headEl: mid.g.querySelector('path:nth-of-type(2)'), eyes, br, mouth, talk: on => { mouth.style.opacity = on ? .8 : 0; } } }
  };
}

const HIN_JACKET = 'M40,1700 C60,1420 170,1320 300,1280 L600,1280 C730,1320 840,1420 860,1700 Z M322,1296 C330,1212 382,1170 462,1170 C542,1170 592,1212 602,1296 L562,1336 L362,1336 Z';
const HIN_FACE = 'M300,880 C298,730 370,660 450,660 C540,662 610,730 612,860 C614,940 600,1000 560,1062 C530,1102 490,1122 470,1124 C420,1112 360,1072 330,1012 C310,972 302,932 300,880 Z';
const HIN_HAIR = 'M288,900 C270,740 350,620 460,618 C580,622 640,730 628,880 L606,820 C600,780 580,760 560,752 C574,800 568,840 552,872 C540,820 520,790 496,780 C500,820 490,850 470,870 C460,820 440,796 410,790 C400,830 380,850 356,862 C350,830 340,812 318,806 C310,840 300,870 288,900 Z';
const HIN_PONY = 'M330,700 C250,640 150,660 120,760 C100,840 130,930 90,1010 C160,970 180,880 200,820 C220,760 270,730 330,740 Z';
function sceneFaceHinata() {
  const back = layer(.3), mid = layer(1);
  darkBack(back, { lx: 760, vx: 120 });
  const G = el('g', { class: 'breathe' }, mid.g);
  const draw = (p, c) => { const pony = el('g', { class: 'sway' }, p); el('path', { d: HIN_PONY, fill: c }, pony); el('path', { d: HIN_JACKET, fill: c }, p); el('path', { d: HIN_FACE, fill: c }, p); el('path', { d: HIN_HAIR, fill: c }, p); };
  const rim = el('g', { transform: 'translate(9,-8)', opacity: .95 }, G); draw(rim, '#ffd6a8');
  draw(el('g', null, G), INK);
  el('ellipse', { cx: 300, cy: 705, rx: 16, ry: 22, fill: '#ff8a2a' }, G);
  el('line', { x1: 462, y1: 1180, x2: 462, y2: 1700, stroke: '#1c1f2a', 'stroke-width': 4 }, G);
  const eyes = eyesFront(G, mid.defs, { cx: 462, cy: 936, dx: 62, rx: 32, ry: 17, color: '#ffc46b', blink: true, glint: 1, far: 1 });
  const br = brows(G, { cx: 462, cy: 886, dx: 62, w: 54, color: '#ffc46b' });
  const mouth = el('path', { d: 'M470,1058 Q488,1066 506,1056', fill: 'none', stroke: '#ffd6a8', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0 }, G);
  return {
    fx: {}, snd: { wind: .5, hum: .8, pad: 'night' }, cam: { x: 0, y: 40, z: 1.02 },
    h: { hinata: { headEl: mid.g.querySelector('path:nth-of-type(3)'), eyes, br, mouth, talk: on => { mouth.style.opacity = on ? .85 : 0; }, mouthVB: [500, 1070] } },
    puffAt: [540, 1070]
  };
}

/* extreme close-up: her eyes. They do not blink. */
function sceneEyes() {
  const back = layer(.4), mid = layer(1);
  el('rect', { x: -600, y: -600, width: 2100, height: 2800, fill: '#07080e' }, back.g);
  const G = el('g', null, mid.g);
  el('rect', { x: -300, y: 560, width: 1500, height: 520, fill: INK }, G);
  el('rect', { x: -300, y: 556, width: 1500, height: 6, fill: '#e6f2e2', opacity: .5 }, G);
  el('path', { d: 'M-300,560 L-300,300 L1200,300 L1200,560 L1100,640 L1060,580 L980,660 L920,590 L840,670 L780,600 L700,680 L640,590 L560,660 L500,600 L420,690 L360,600 L280,670 L220,590 L140,660 L60,600 L0,650 Z', fill: INK }, G);
  const eyes = eyesFront(G, mid.defs, { cx: 450, cy: 820, dx: 210, rx: 120, ry: 52, color: '#d8d2f6', pupil: '#4a4460', blink: false });
  for (const x of [240, 660]) el('circle', { cx: x - 30, cy: 800, r: 7, fill: '#e8f8d8', opacity: .85 }, G);
  return { fx: {}, snd: { wind: .3, hum: .5, pad: 'tense' }, cam: { x: 0, y: 40, z: 1 }, h: { eyes } };
}

/* two hands and the can */
function sceneHands() {
  const back = layer(.3), mid = layer(1);
  darkBack(back, { seed: 9 });
  const hin = el('g', null, mid.g), girl = el('g', { transform: 'translate(260,40)' }, mid.g), can = el('g', null, mid.g);
  const drawH = (p, c) => { el('path', { d: 'M-200,1080 L250,930 L300,1070 L-200,1240 Z', fill: c }, p); el('path', { d: 'M250,930 C290,900 350,905 372,940 L380,1060 C360,1090 300,1096 272,1070 Z', fill: c }, p); };
  el('g', { transform: 'translate(-6,-8)', opacity: .95 }, hin).appendChild(el('g', { fill: '#ffd6a8' })); drawH(hin.lastChild.lastChild, '#ffd6a8');
  drawH(hin, INK);
  const fingersH = el('g', null, hin);
  for (let i = 0; i < 4; i++) el('rect', { x: 356, y: 950 + i * 26, width: 50, height: 22, rx: 11, fill: INK }, fingersH);
  el('rect', { x: 360, y: 880, width: 90, height: 150, rx: 10, fill: '#7a3e22' }, can);
  el('rect', { x: 360, y: 918, width: 90, height: 50, fill: '#e8c9a0' }, can);
  el('rect', { x: 360, y: 930, width: 90, height: 12, fill: '#c0402a' }, can);
  el('rect', { x: 356, y: 872, width: 98, height: 14, rx: 6, fill: '#b8bcc6' }, can);
  el('rect', { x: 376, y: 890, width: 8, height: 130, fill: '#ffffff', opacity: .25 }, can);
  glow(can, mid.defs, 405, 960, 170, '#ffb35a', .3);
  const drawG = (p, c) => { el('path', { d: 'M1100,960 L640,930 L610,1080 L1100,1120 Z', fill: c }, p); el('ellipse', { cx: 636, cy: 1004, rx: 46, ry: 76, fill: c }, p); };
  const gr = el('g', { transform: 'translate(-6,-7)', opacity: .9 }, girl); drawG(gr, '#e6f2e2');
  drawG(girl, '#1c1e28');
  const fingersG = el('g', null, girl);
  for (let i = 0; i < 4; i++) el('rect', { x: 540, y: 950 + i * 24, width: 90, height: 16, rx: 8, fill: '#c8cfd8' }, fingersG);
  const taken = () => { FX.steam.at = () => project(685, 884, 1); mid.g.appendChild(girl); };
  return {
    fx: { steam: { at: () => project(405, 874, 1), rate: 7, w: 26, k: 2 } }, snd: { wind: .4, hum: .6, pad: 'night' }, cam: { x: 0, y: 60, z: 1.04 },
    h: { hin, girl, can, fingersG, fingersH },
    /* her hand comes in slowly, stops on the can, then takes it in one jerk */
    snatch(instant) {
      if (instant || REDUCED) { girl.style.transform = 'translate(170px,10px)'; can.style.transform = 'translate(280px,10px)'; taken(); return; }
      girl.animate([{ transform: 'translate(260px,40px)' }, { transform: 'translate(-110px,4px)' }], { duration: 900, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' }).onfinish = () => {
        if (!girl.isConnected) return;
        Snd.fx('grab');
        girl.animate([{ transform: 'translate(-110px,4px)' }, { transform: 'translate(170px,10px)' }], { duration: 160, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'forwards' });
        can.animate([{ transform: 'translate(0px,0px)' }, { transform: 'translate(280px,10px)' }], { duration: 160, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'forwards' });
        taken();
        flash(.25, 300, '#bcd8ff');
      };
    }
  };
}

/* the UV keyring: a violet beam over her hands, her wrist, her cheek */
const UV_HOOD = 'M548,560 C520,340 660,200 850,196 C1050,194 1170,340 1170,560 L1170,1500 L780,1500 C800,1300 830,1130 850,1020 Z';
const UV_HEAD = 'M650,420 C700,360 800,346 880,380 C950,412 990,490 990,590 L990,1000 L800,1000 C790,960 770,926 742,900 C700,882 652,850 626,818 C606,796 600,776 608,760 C596,754 588,744 592,732 C584,724 582,714 590,706 C580,702 576,692 582,682 C562,678 542,668 538,654 C536,640 550,628 568,618 C574,592 574,568 582,544 C592,500 612,450 650,420 Z';
const UV_HAIR = 'M578,560 C566,460 616,400 700,382 C760,370 830,376 880,400 L862,420 L846,406 L832,440 L812,412 L800,452 L780,416 L760,462 L744,422 L724,474 L708,428 L690,490 L672,444 L652,516 L634,470 L612,548 L600,506 Z';
function sceneUV() {
  const back = layer(.3), mid = layer(1);
  darkBack(back, { seed: 13, lx: 140, ly: 360 });
  const G = el('g', null, mid.g);
  const draw = (p, c) => {
    el('path', { d: UV_HOOD, fill: c }, p); el('path', { d: UV_HEAD, fill: c }, p); el('path', { d: UV_HAIR, fill: c }, p);
    el('path', { d: 'M1100,1200 L720,1150 L700,1320 L1100,1370 Z', fill: c }, p);
    el('ellipse', { cx: 716, cy: 1236, rx: 58, ry: 96, fill: c }, p);
  };
  const rim = el('g', { transform: 'translate(-9,-7)', opacity: .92 }, G); draw(rim, '#e6f2e2');
  draw(el('g', null, G), '#12141c');
  el('path', { d: 'M614,570 Q632,562 650,568', fill: 'none', stroke: '#d8d2f6', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: .5 }, G);
  el('rect', { x: 580, y: 1140, width: 110, height: 180, rx: 12, fill: '#6a3620' }, G);
  el('rect', { x: 580, y: 1180, width: 110, height: 60, fill: '#d8b890' }, G);
  for (let i = 0; i < 4; i++) el('rect', { x: 640, y: 1170 + i * 34, width: 80, height: 22, rx: 11, fill: '#c8cfd8' }, G);
  const eye = eyesFront(G, mid.defs, { cx: 1624, cy: 596, dx: 1000, rx: 20, ry: 9, color: '#d8d2f6', pupil: '#5a5470', blink: false });
  const hand = el('g', null, G);
  el('path', { d: 'M-200,1500 L140,1330 L200,1470 L-200,1640 Z', fill: INK }, hand);
  el('path', { d: 'M140,1330 C180,1300 240,1310 256,1350 L262,1440 C240,1470 190,1476 170,1450 Z', fill: INK }, hand);
  el('path', { d: 'M-200,1480 L140,1312', fill: 'none', stroke: '#ffd6a8', 'stroke-width': 5, opacity: .7 }, hand);
  el('circle', { cx: 270, cy: 1350, r: 16, fill: 'none', stroke: '#9aa0ac', 'stroke-width': 6 }, hand);
  el('rect', { x: 276, y: 1336, width: 56, height: 24, rx: 6, fill: '#3a3446' }, hand);
  const beamG = el('g', { style: 'mix-blend-mode: screen', opacity: 0 }, mid.g);
  const beam = el('path', { d: 'M332,1348 L1300,1180 L1300,1520 Z', fill: lin(mid.defs, [[0, '#d0a8ff', .85], [1, '#8a5aff', 0]], { x1: 0, y1: 0, x2: 1, y2: 0 }) }, beamG);
  el('circle', { cx: 334, cy: 1348, r: 10, fill: '#f0dcff' }, beamG);
  return {
    fx: {}, snd: { wind: .3, hum: .6, pad: 'tense' }, cam: { x: 0, y: 40, z: 1 },
    h: { beamG, beam, eye, girl: { mouthVB: [600, 716] } },
    sweep(instant) {
      beamG.style.opacity = 1;
      const set = a => beam.setAttribute('transform', `rotate(${a.toFixed(2)} 332 1348)`);
      if (instant || REDUCED) { set(-66); return; }
      Snd.fx('uv');
      FX.magic = { mode: 'uv', x0: 400, x1: 900, y0: 500, y1: 1300 };
      tween(3200, k => set(lerp(6, -66, ease(k))));
    },
    off() { beamG.style.opacity = 0; FX.magic = null; P.mag = []; }
  };
}

/* her phone in her hand; the chat is HTML laid over the glowing screen */
function scenePhone() {
  const back = layer(.3), mid = layer(1);
  darkBack(back, { seed: 21, lx: 140, ly: 240 });
  /* drawn at 400 wide, shown a bit bigger so the chat reads on a phone */
  const G = el('g', { transform: 'translate(450,700) scale(1.15) translate(-450,-700)' }, mid.g);
  glow(G, mid.defs, 450, 820, 520, '#cfe0ff', .3);
  el('rect', { x: 250, y: 330, width: 400, height: 860, rx: 48, fill: '#f0a8c0' }, G);
  el('rect', { x: 266, y: 346, width: 368, height: 828, rx: 36, fill: '#1a1622' }, G);
  el('rect', { x: 278, y: 380, width: 344, height: 770, rx: 26, fill: lin(mid.defs, [[0, '#f4f6fb'], [1, '#e2e8f4']]) }, G);
  const hand = el('g', null, G);
  el('path', { d: 'M160,1700 L250,1100 C270,1060 320,1060 330,1110 L340,1300 L600,1300 L600,1700 Z', fill: INK }, hand);
  el('path', { d: 'M650,1000 C700,990 720,1030 710,1070 L680,1220 C670,1260 620,1260 610,1230 Z', fill: INK }, hand);
  el('path', { d: 'M160,1700 L250,1100 C270,1060 320,1060 330,1110', fill: 'none', stroke: '#cfe0ff', 'stroke-width': 5, opacity: .7 }, hand);
  return { fx: {}, snd: { wind: .4, hum: .7, pad: 'night' }, cam: { x: 0, y: 30, z: 1 }, h: {}, screen: [266, 355, 634, 1206] };
}

/* the concrete edge: an onigiri in crinkly film / her wet sneakers */
function sceneEdge(kind) {
  const back = layer(.3), mid = layer(1), h = {};
  darkBack(back, { seed: 31, lx: 200, ly: 300 });
  const G = el('g', null, mid.g);
  el('rect', { x: -300, y: 960, width: 1500, height: 140, fill: '#2a2d38' }, G);
  el('rect', { x: -300, y: 960, width: 1500, height: 10, fill: '#5a6070' }, G);
  el('rect', { x: -300, y: 1100, width: 1500, height: 800, fill: '#141720' }, G);
  glow(G, mid.defs, 330, 980, 420, LAMP, .22);
  if (kind === 'onigiri') {
    const o = el('g', { style: 'transform: translate(450px,962px)' }, G); h.oni = o;
    el('path', { d: 'M-130,0 L0,-210 L130,0 Z', fill: '#f4f4ee' }, o);
    el('path', { d: 'M-130,0 L0,-210 L130,0 Z', fill: 'none', stroke: '#ffffff', 'stroke-width': 4, opacity: .6 }, o);
    el('rect', { x: -52, y: -96, width: 104, height: 96, fill: '#1a2820' }, o);
    for (const [x1, y1, x2, y2] of [[-100, -20, -60, -90], [40, -150, 80, -80], [-20, -180, 10, -150]]) el('line', { x1, y1, x2, y2, stroke: '#ffffff', 'stroke-width': 3, opacity: .7 }, o);
  } else {
    for (const dx of [-110, 110]) {
      const s = el('g', { transform: `translate(${450 + dx},1300)` }, G);
      el('path', { d: 'M-90,0 L-90,-60 C-90,-120 -20,-140 30,-120 L90,-80 C120,-60 130,-20 120,0 Z', fill: '#b8b4a8' }, s);
      el('path', { d: 'M-90,0 L-90,-50 C-60,-40 -20,-60 10,-50 L60,-30 L120,0 Z', fill: '#6e6a62', opacity: .8 }, s);
      el('rect', { x: -96, y: -6, width: 222, height: 14, rx: 6, fill: '#e8e4dc' }, s);
      el('rect', { x: -70, y: -210, width: 70, height: 110, fill: '#1c2030' }, s);
      el('rect', { x: -70, y: -120, width: 70, height: 24, fill: '#8a8a94' }, s);
    }
    el('ellipse', { cx: 450, cy: 1330, rx: 300, ry: 20, fill: '#3a4a6a', opacity: .5 }, G);
  }
  return { fx: {}, snd: { wind: .4, hum: .7, pad: 'night' }, cam: { x: 0, y: 40, z: 1 }, h };
}

/* the block opposite: one balcony lights up; nobody comes out */
function sceneBalcony() {
  const back = layer(0), mid = layer(.8);
  sky(back, { seed: 17 });
  block(mid, -100, 1500, 1100, 1200, { seed: 55, lit: .05, tv: .03, c: '#0c1020', balc: 1, cw: 110, ch: 150 });
  const win = el('g', { opacity: 0 }, mid.g);
  el('rect', { x: 400, y: 740, width: 120, height: 180, fill: '#f0c878' }, win);
  glow(win, mid.defs, 460, 830, 280, '#f0c878', .35);
  const man = el('path', { d: 'M424,920 L426,842 C428,818 444,810 460,810 C476,810 492,818 494,842 L496,920 Z M444,790 C444,768 476,768 476,790 C476,812 444,812 444,790 Z', fill: '#15121c', opacity: 0 }, win);
  el('rect', { x: 380, y: 918, width: 160, height: 12, fill: '#1c2238' }, mid.g);
  return { fx: {}, snd: { wind: .6, hum: .4, pad: 'tense' }, cam: { x: 0, y: 0, z: 1 }, h: { win, man } };
}

function sceneTitle() { const L = layer(0); el('rect', { x: -600, y: -600, width: 2100, height: 2800, fill: '#050509' }, L.g); return { fx: {}, snd: {}, cam: { x: 0, y: 0, z: 1 }, h: {} }; }
