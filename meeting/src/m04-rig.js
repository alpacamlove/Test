
/* ================= silhouettes on a small rig (side view; +x = the way the figure faces) ================= */
const INK = '#0a0c14';
const HEAD = 'M-26,-4 C-38,-22 -38,-58 -18,-72 C0,-84 26,-76 33,-56 C36,-48 35,-42 37,-36 L42,-28 L36,-26 C37,-22 36,-18 34,-16 C35,-12 33,-8 27,-6 C19,-2 8,1 0,0 Z';
const FOOT = 'M-10,-8 L16,-8 C28,-8 36,-2 36,6 L36,11 L-12,11 Z';
const BODIES = {
  hinata: {
    TH: 126, SH: 118, TORSO: 150, NECK: 14, UA: 90, FA: 82, wTh: 36, wSh: 27, wUa: 27, wFa: 24, hand: 12,
    shoulder: [4, -136], neck: [6, -150], headK: 1, eye: '#ffc46b', eyeR: [8.5, 4.8], eyeAt: [23, -40],
    torso: 'M-22,10 C-27,-40 -30,-96 -26,-128 C-22,-148 -8,-156 6,-155 C22,-152 31,-136 30,-110 C32,-72 28,-30 26,10 Z',
    extra: ['M-18,-150 C-12,-164 10,-166 18,-156 L16,-144 L-16,-142 Z'],
    hair: ['M-30,-10 C-44,-32 -44,-66 -22,-80 C0,-94 30,-86 38,-64 C40,-58 38,-54 34,-52 C30,-60 22,-64 14,-62 C12,-56 8,-52 2,-50 C0,-58 -6,-62 -12,-62 C-18,-52 -22,-36 -22,-20 Z',
      'M36,-64 C45,-54 43,-44 39,-37 L34,-46 L30,-40 L28,-54 Z'],
    pony: 'M-10,-86 C-34,-108 -72,-102 -80,-70 C-86,-46 -78,-18 -90,6 C-68,-6 -62,-34 -58,-54 C-54,-70 -42,-80 -22,-76 Z',
    tie: [-16, -82], accent: '#ff8a2a'
  },
  tsukiko: {
    TH: 104, SH: 98, TORSO: 126, NECK: 12, UA: 78, FA: 72, wTh: 21, wSh: 17, wUa: 30, wFa: 31, hand: 16,
    shoulder: [0, -114], neck: [2, -126], headK: .92, eye: '#d8d2f6', eyeR: [8, 4.4], eyeAt: [23, -40], noBlink: true,
    torso: 'M-38,36 C-42,-8 -40,-62 -33,-98 C-44,-110 -48,-128 -38,-137 C-27,-147 -10,-143 -2,-133 C14,-131 29,-118 31,-94 C35,-54 37,-8 37,36 Z',
    hair: ['M-32,-2 L-36,-18 C-46,-40 -44,-70 -20,-82 C2,-94 32,-86 38,-62 L40,-50 L34,-54 L36,-42 L30,-48 L30,-38 L24,-46 L20,-60 C10,-62 0,-60 -6,-58 C-10,-40 -12,-20 -8,-4 L-14,-10 L-18,2 L-22,-10 L-26,4 Z',
      'M38,-60 L42,-48 L36,-51 L38,-40 L31,-46 L32,-36 L26,-44 Z'],
    cuff: true
  }
};
/* poses: thigh a / knee k (deg, a forward), arm shoulder s / elbow e (deg, forward), lean, head */
const POSES = {
  stand: { lean: 0, head: 0, legF: [5, 6], legN: [-4, 4], armF: [8, 14], armN: [-6, 12] },
  standBag: { lean: 0, head: 0, legF: [5, 6], legN: [-4, 4], armF: [-6, 10], armN: [10, 20] },
  walkA: { lean: 5, head: 0, legF: [24, 10], legN: [-18, 34], armF: [-22, 24], armN: [22, 30] },
  walkB: { lean: 5, head: 0, legF: [-18, 34], legN: [24, 10], armF: [22, 30], armN: [-22, 24] },
  runA: { lean: 18, head: -6, legF: [52, 70], legN: [-36, 90], armF: [-50, 80], armN: [60, 90] },
  runB: { lean: 18, head: -6, legF: [-36, 90], legN: [52, 70], armF: [60, 90], armN: [-50, 80] },
  eat: { lean: 2, head: 4, legF: [5, 6], legN: [-4, 4], armF: [-4, 12], armN: [36, 128] },
  crouch: { lean: 26, head: -14, legF: [104, 150], legN: [100, 146], armF: [42, 56], armN: [52, 66] },
  crouchOffer: { lean: 18, head: -6, legF: [104, 150], legN: [100, 146], armF: [42, 56], armN: [73, 65] },
  crouchKeys: { lean: 28, head: -8, legF: [104, 150], legN: [100, 146], armF: [42, 56], armN: [70, 40] },
  crouchPhone: { lean: 30, head: 18, legF: [104, 150], legN: [100, 146], armF: [52, 96], armN: [56, 104] },
  sit: { lean: 4, head: 0, legF: [86, 88], legN: [90, 92], armF: [26, 40], armN: [34, 50] },
  sitEat: { lean: 6, head: 6, legF: [86, 88], legN: [90, 92], armF: [26, 40], armN: [38, 130] },
  sitOffer: { lean: 10, head: -4, legF: [86, 88], legN: [90, 92], armF: [26, 40], armN: [72, 20] },
  sitPhone: { lean: 14, head: 22, legF: [86, 88], legN: [90, 92], armF: [48, 96], armN: [52, 104] },
  sitLean: { lean: 18, head: -4, legF: [86, 88], legN: [90, 92], armF: [26, 40], armN: [40, 60] },
  palms: { lean: 0, head: 0, legF: [86, 88], legN: [90, 92], armF: [66, 104], armN: [72, 110] },
  hug: { lean: 10, head: 26, legF: [142, 170], legN: [136, 164], armF: [38, 126], armN: [44, 122] },
  hugUp: { lean: 2, head: -16, legF: [142, 170], legN: [136, 164], armF: [38, 126], armN: [44, 122] },
  hugCan: { lean: 4, head: -6, legF: [142, 170], legN: [136, 164], armF: [20, 134], armN: [24, 130] },
  hugCanDown: { lean: 12, head: 28, legF: [142, 170], legN: [136, 164], armF: [28, 132], armN: [32, 128] },
  grab: { lean: 16, head: -8, legF: [142, 170], legN: [136, 164], armF: [20, 134], armN: [78, 24] },
  standCan: { lean: -4, head: -4, legF: [2, 4], legN: [-6, 6], armF: [12, 134], armN: [16, 130] },
  standTense: { lean: -8, head: -10, legF: [10, 14], legN: [-14, 10], armF: [8, 134], armN: [12, 130] },
  stance: { lean: 22, head: -10, legF: [44, 60], legN: [-26, 30], armF: [62, 72], armN: [74, 84] },
  backAway: { lean: -10, head: 4, legF: [-16, 20], legN: [14, 10], armF: [6, 134], armN: [10, 130] },
  reach: { lean: 20, head: 18, legF: [104, 150], legN: [100, 146], armF: [42, 56], armN: [58, 30] },
  reachHover: { lean: 26, head: 22, legF: [104, 150], legN: [100, 146], armF: [56, 120], armN: [84, 8] },
  walkEatA: { lean: 4, head: 2, legF: [24, 10], legN: [-18, 34], armF: [-22, 24], armN: [36, 128] },
  walkEatB: { lean: 4, head: 2, legF: [-18, 34], legN: [24, 10], armF: [22, 30], armN: [36, 128] },
  standEat: { lean: 2, head: 4, legF: [5, 6], legN: [-4, 4], armF: [-6, 10], armN: [36, 128] },
  rush: { lean: 14, head: -2, legF: [22, 24], legN: [-12, 22], armF: [-10, 30], armN: [72, 24] },
  sitGuard: { lean: 18, head: -10, legF: [70, 64], legN: [96, 98], armF: [62, 104], armN: [74, 116] },
  sitShout: { lean: 0, head: -16, legF: [86, 88], legN: [90, 92], armF: [30, 40], armN: [40, 70] },
  standCanDown: { lean: 2, head: 16, legF: [2, 4], legN: [-6, 6], armF: [16, 134], armN: [20, 130] }
};

function almond(rx, ry) { return `M${-rx},${ry * .15} Q${-rx * .1},${-ry * 1.35} ${rx},${-ry * .35} Q${rx * .1},${ry * 1.15} ${-rx},${ry * .15} Z`; }

/* build one copy of a figure; returns the joints so both copies can be posed together */
function buildCopy(parent, B, color, face, defs) {
  const g = el('g', { fill: color, stroke: color }, parent);
  const line = (p, x1, y1, x2, y2, w) => el('line', { x1, y1, x2, y2, 'stroke-width': w, 'stroke-linecap': 'round', fill: 'none' }, p);
  const J = {};
  const leg = () => {
    const hip = el('g', null, g);
    line(hip, 0, 0, 0, B.TH, B.wTh);
    const knee = el('g', { transform: `translate(0,${B.TH})` }, hip), kr = el('g', null, knee);
    line(kr, 0, 0, 0, B.SH, B.wSh);
    const ankle = el('g', { transform: `translate(0,${B.SH})` }, kr), foot = el('g', null, ankle);
    el('path', { d: FOOT, stroke: 'none' }, foot);
    return { hip, kr, foot };
  };
  const arm = torso => {
    const sh = el('g', { transform: `translate(${B.shoulder[0]},${B.shoulder[1]})` }, torso), su = el('g', null, sh);
    line(su, 0, 0, 0, B.UA, B.wUa);
    const elb = el('g', { transform: `translate(0,${B.UA})` }, su), er = el('g', null, elb);
    line(er, 0, 0, 0, B.FA, B.wFa);
    const hand = el('g', { transform: `translate(0,${B.FA})` }, er);
    el('circle', { r: B.hand, stroke: 'none' }, hand);
    const prop = el('g', null, hand);
    return { su, er, hand, prop };
  };
  J.legF = leg();
  const torso = el('g', null, g); J.torso = torso;
  J.armF = arm(torso);
  el('path', { d: B.torso, stroke: 'none' }, torso);
  for (const d of B.extra || []) el('path', { d, stroke: 'none' }, torso);
  const neck = el('g', { transform: `translate(${B.neck[0]},${B.neck[1]})` }, torso);
  line(neck, 0, 0, 2, -B.NECK, 18);
  const hg = el('g', { transform: `translate(2,${-B.NECK})` }, neck), head = el('g', null, hg); J.head = head;
  const hs = el('g', { transform: `scale(${B.headK})` }, head); J.hs = hs;
  if (B.pony) { const p = el('g', { class: 'sway' }, hs); el('path', { d: B.pony, stroke: 'none' }, p); }
  el('path', { d: HEAD, stroke: 'none' }, hs);
  for (const d of B.hair) el('path', { d, stroke: 'none' }, hs);
  J.armN = arm(torso);
  J.legN = leg();
  if (face) {
    if (B.tie) el('ellipse', { cx: B.tie[0], cy: B.tie[1], rx: 5, ry: 7, fill: B.accent, stroke: 'none' }, hs);
    const eg = el('g', { class: 'eyes', 'data-emo': 'neutral', transform: `translate(${B.eyeAt[0]},${B.eyeAt[1]})` }, hs);
    const bl = el('g', { class: B.noBlink ? '' : 'blink', style: `animation-delay:${(-Math.random() * 4).toFixed(2)}s` }, eg);
    const look = el('g', { class: 'look' }, bl);
    const e = el('g', { class: 'eye R' }, look);
    el('circle', { r: B.eyeR[0] * 3, fill: rad(defs, [[0, B.eye, .55], [.35, B.eye, .2], [1, B.eye, 0]]), class: 'eglow', stroke: 'none' }, e);
    const open = el('g', { class: 'open' }, e);
    el('path', { d: almond(B.eyeR[0], B.eyeR[1]), fill: B.eye, stroke: 'none' }, open);
    el('path', { d: `M${-B.eyeR[0]},${B.eyeR[1] * .4} Q0,${-B.eyeR[1] * 1.9} ${B.eyeR[0]},${B.eyeR[1] * .2}`, fill: 'none', stroke: B.eye, 'stroke-width': 2.6, 'stroke-linecap': 'round', class: 'happy' }, e);
    J.eyes = eg; J.look = look;
    J.brow = el('path', { d: 'M15,-51 Q23,-55 31,-51', fill: 'none', stroke: B.eye, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: .55, style: 'transition:transform .3s ease; transform-box: fill-box; transform-origin: 50% 50%' }, hs);
    J.mouth = el('path', { d: 'M33,-19 Q36,-17 38,-19', fill: 'none', stroke: B.eye, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0 }, hs);
  }
  return J;
}

const BROW = { neutral: '', angry: 'rotate(16deg) translateY(2px)', worried: 'rotate(-14deg) translateY(-2px)', up: 'translateY(-5px)', down: 'translateY(3px)', soft: 'rotate(-8deg)' };

/* a figure: two copies (rim light offset toward the light, ink on top), posed together */
function figure(parent, defs, kind, o = {}) {
  const B = BODIES[kind];
  const rimRoot = el('g', { opacity: o.rimA ?? .95 }, parent), inkRoot = el('g', null, parent);
  const R = buildCopy(rimRoot, B, o.rim || '#dff0d0', false, defs);
  const I = buildCopy(inkRoot, B, INK, true, defs);
  const st = { x: o.x || 0, y: o.y || 0, s: o.s || 1, f: o.f || 1, ground: o.ground ?? null, seat: o.seat ?? null, rimOff: o.rimOff || [4, -3], pose: {} };
  const cur = JSON.parse(JSON.stringify(POSES[o.pose || 'stand']));
  const fk = (a, k) => { const ar = a * Math.PI / 180, kr = (a - k) * Math.PI / 180; return B.TH * Math.cos(ar) + B.SH * Math.cos(kr) + 11; };
  const legExt = () => Math.max(fk(cur.legF[0], cur.legF[1]), fk(cur.legN[0], cur.legN[1]));
  /* where the hip sits: on a seat, on the ground (feet down), or free */
  const curY = () => st.seat != null ? st.seat - 6 * st.s : st.ground != null ? st.ground - st.s * legExt() : st.y;
  function apply() {
    const P = cur;
    for (const C of [R, I]) {
      C.legF.hip.setAttribute('transform', `rotate(${-P.legF[0]})`); C.legF.kr.setAttribute('transform', `rotate(${P.legF[1]})`); C.legF.foot.setAttribute('transform', `rotate(${P.legF[0] - P.legF[1]})`);
      C.legN.hip.setAttribute('transform', `rotate(${-P.legN[0]})`); C.legN.kr.setAttribute('transform', `rotate(${P.legN[1]})`); C.legN.foot.setAttribute('transform', `rotate(${P.legN[0] - P.legN[1]})`);
      C.torso.setAttribute('transform', `rotate(${P.lean})`);
      C.head.setAttribute('transform', `rotate(${P.head})`);
      C.armF.su.setAttribute('transform', `rotate(${-P.armF[0]})`); C.armF.er.setAttribute('transform', `rotate(${-P.armF[1]})`);
      C.armN.su.setAttribute('transform', `rotate(${-P.armN[0]})`); C.armN.er.setAttribute('transform', `rotate(${-P.armN[1]})`);
    }
    const y = curY();
    const tf = (dx, dy) => `translate(${(st.x + dx).toFixed(1)},${(y + dy).toFixed(1)}) scale(${st.f * st.s},${st.s})`;
    rimRoot.setAttribute('transform', tf(st.rimOff[0], st.rimOff[1]));
    inkRoot.setAttribute('transform', tf(0, 0));
  }
  apply();
  let tw = null, cyc = null;
  const F = {
    kind, st, ink: I, rim: R, rimRoot, inkRoot,
    headEl: I.hs, hipY: () => curY(), legExt,
    pose(p, dur = 450) {
      cyc = null;
      const to = typeof p === 'string' ? POSES[p] : p;
      if (!dur || REDUCED) { Object.assign(cur, JSON.parse(JSON.stringify(to))); apply(); tw = null; return F; }
      tw = { from: JSON.parse(JSON.stringify(cur)), to, t0: now(), dur };
      return F;
    },
    cycle(a, b, period) { cyc = { a: POSES[a], b: POSES[b], period, t0: now() }; tw = null; return F; },
    move(x, y, dur = 0, opts = {}) {
      if (!dur || REDUCED) { F._mv = null; if (x != null) st.x = x; if (y != null) st.y = y; if (opts.ground !== undefined) st.ground = opts.ground; if (opts.seat !== undefined) st.seat = opts.seat; apply(); return F; }
      F._mv = { x0: st.x, x1: x ?? st.x, y0: st.y, y1: y ?? st.y, t0: now(), dur, e: opts.linear ? (t => t) : ease };
      return F;
    },
    face(f) { st.f = f; apply(); return F; },
    set(o2) { Object.assign(st, o2); apply(); return F; },
    emo(e) { I.eyes.setAttribute('data-emo', e); I.brow.style.transform = BROW[{ angry: 'angry', slit: 'angry', worried: 'worried', wide: 'up', half: 'down', down: 'down', happy: 'soft' }[e] || 'neutral']; return F; },
    look(dx, dy = 0) { I.look.style.transform = `translate(${dx}px,${dy}px)`; return F; },
    talk(on) { I.mouth.style.opacity = on ? .85 : 0; return F; },
    hold(which, draw) { for (const C of [I]) { const pg = (which === 'F' ? C.armF : C.armN).prop; pg.textContent = ''; if (draw) draw(pg); } return F; },
    rimColor(c) { rimRoot.querySelector('g').setAttribute('fill', c); rimRoot.querySelector('g').setAttribute('stroke', c); return F; },
    step(t) {
      if (tw) {
        const k = clamp((t - tw.t0) / tw.dur, 0, 1), e = ease(k);
        for (const key of Object.keys(tw.to)) {
          const a = tw.from[key], b = tw.to[key];
          cur[key] = Array.isArray(b) ? b.map((v, i) => lerp(a[i], v, e)) : lerp(a, b, e);
        }
        apply();
        if (k >= 1) tw = null;
      } else if (cyc) {
        const ph = ((t - cyc.t0) / cyc.period) % 1, e = (1 - Math.cos(ph * Math.PI * 2)) / 2;
        for (const key of Object.keys(cyc.a)) { const a = cyc.a[key], b = cyc.b[key]; cur[key] = Array.isArray(b) ? b.map((v, i) => lerp(a[i], v, e)) : lerp(a, b, e); }
        apply();
      }
      if (F._mv) {
        const m = F._mv, k = clamp((t - m.t0) / m.dur, 0, 1), e = m.e(k);
        st.x = lerp(m.x0, m.x1, e); st.y = lerp(m.y0, m.y1, e); apply();
        if (k >= 1) F._mv = null;
      }
    },
    /* where the mouth is, in world units (for breath puffs) */
    mouthWorld() {
      const P = cur, s = st.s, f = st.f;
      const lean = P.lean * Math.PI / 180, nx = B.neck[0], ny = B.neck[1] - B.NECK - 18;
      const rx = nx * Math.cos(lean) - ny * Math.sin(lean), ry = nx * Math.sin(lean) + ny * Math.cos(lean);
      const y = curY();
      return [st.x + f * (rx + 38 * Math.cos(lean)) * s, y + (ry + 38 * Math.sin(lean)) * s];
    }
  };
  return F;
}

/* props held in a hand (drawn in the hand's local units) */
const HELD = {
  can: g => { el('rect', { x: -9, y: -4, width: 18, height: 30, rx: 3, fill: '#7a3e22' }, g); el('rect', { x: -9, y: 4, width: 18, height: 10, fill: '#e8c9a0' }, g); el('rect', { x: -9, y: -6, width: 18, height: 4, fill: '#b8bcc6' }, g); },
  bun: g => { el('ellipse', { cx: 4, cy: -2, rx: 16, ry: 12, fill: '#f4ede0' }, g); el('path', { d: 'M-8,-8 Q4,-16 16,-8', fill: 'none', stroke: '#d8c8aa', 'stroke-width': 2 }, g); },
  bag: g => { el('path', { d: 'M-16,6 C-18,30 -14,56 0,58 C14,56 18,30 16,6 Z', fill: '#e8ecf2', opacity: .85 }, g); el('path', { d: 'M-8,6 L-4,-6 M8,6 L4,-6', stroke: '#e8ecf2', 'stroke-width': 3, fill: 'none' }, g); el('rect', { x: -8, y: 20, width: 16, height: 18, rx: 3, fill: '#8a4a2a', opacity: .7 }, g); },
  phone: g => { el('rect', { x: -10, y: -18, width: 20, height: 34, rx: 4, fill: '#f0a8c0' }, g); el('rect', { x: -8, y: -16, width: 16, height: 30, rx: 2, fill: '#dfeaff', class: 'flicker' }, g); },
  keys: g => { el('circle', { cx: 0, cy: 4, r: 7, fill: 'none', stroke: '#9aa0ac', 'stroke-width': 2.5 }, g); el('rect', { x: 4, y: 6, width: 16, height: 6, rx: 2, fill: '#3a3446' }, g); el('circle', { cx: 20, cy: 9, r: 2.5, fill: '#e2b8ff' }, g); },
  onigiri: g => { el('path', { d: 'M-14,10 L0,-14 L14,10 Z', fill: '#f6f6f0' }, g); el('rect', { x: -6, y: -2, width: 12, height: 12, fill: '#1c2a22' }, g); },
  kairo: g => { el('rect', { x: -12, y: -8, width: 24, height: 18, rx: 2, fill: '#fbfbfb' }, g); el('rect', { x: -6, y: -2, width: 12, height: 4, fill: '#e84a3a' }, g); }
};
