(() => {
  'use strict';

  /* ---------- helpers ---------- */
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp  = (a, b, t) => a + (b - a) * t;
  const ease  = t => t * t * (3 - 2 * t);
  const seg   = (p, a, b) => clamp((p - a) / (b - a));
  const snap  = x => Math.round(x * 1e7) / 1e7;   // kills float noise at segment boundaries
  const bump  = (p, a, peak, b) => p <= peak ? ease(seg(p, a, peak)) : 1 - ease(seg(p, peak, b));

  // Hermite track through [p, value] keys (no stop-and-go at keys)
  function track(p, k) {
    if (p <= k[0][0]) return k[0][1];
    const n = k.length;
    if (p >= k[n - 1][0]) return k[n - 1][1];
    let i = 0; while (p > k[i + 1][0]) i++;
    const [p0, v0] = k[i], [p1, v1] = k[i + 1];
    const m = j => {
      const a = k[Math.max(0, j - 1)], b = k[Math.min(n - 1, j + 1)];
      return (b[1] - a[1]) / Math.max(1e-6, b[0] - a[0]);
    };
    const h = p1 - p0, t = (p - p0) / h, t2 = t * t, t3 = t2 * t;
    return (2*t3 - 3*t2 + 1) * v0 + (t3 - 2*t2 + t) * h * m(i)
         + (-2*t3 + 3*t2) * v1 + (t3 - t2) * h * m(i + 1);
  }

  /* ---------- story timing (scroll progress 0..1) ---------- */
  const T_LEAP = 0.38;   // ninja reaches the front of the screen and jumps out
  const T_LAND = 0.50;   // lands on the desk
  const T_WIDE = 0.88;   // full room reveal reached

  /* ---------- desk-rig space (1920x1080 units, scaled into the room) ---------- */
  const RIG = { x: 408.4, y: 244, s: 0.2023 };
  const toRoom = (x, y) => [RIG.x + x * RIG.s, RIG.y + y * RIG.s];
  const SCR  = { x: 780, horizon: 548, yFar: 621, sFar: 0.17, sNear: 0.46 };
  const DESK = { x: 860, y: 866, s: 0.875 };   // feet just behind the desk's front edge (y 880), clear of the monitors
  const K_PERSP = 197 / SCR.sNear;   // ground plane: y - horizon ∝ scale

  // sprite cell geometry (repacked atlas: 320x380 cells, 5 columns)
  const CELL = { w: 320, h: 380, cols: 5 };
  const RUN  = { n: 21, fx: 156, fy: 345, k: 1.0 };
  const IDLE = { n: 25, fx: 157, fy: 325, k: 1.157 };   // idle content is shorter; match heights

  /* ---------- camera (room pixel space) ---------- */
  const [scrCx, scrCy] = toRoom(780, 623);
  const cam = {
    cx: [[0, scrCx], [T_LEAP, toRoom(785, 0)[0]], [0.44, toRoom(815, 0)[0]], [T_LAND, toRoom(850, 0)[0]], [0.68, 610], [T_WIDE, 640], [1, 640]],
    cy: [[0, scrCy], [T_LEAP, toRoom(0, 650)[1]], [0.44, toRoom(0, 570)[1]], [T_LAND, toRoom(0, 725)[1]], [0.68, 412], [T_WIDE, 450], [1, 450]],
    ls: [],   // log of total scale, filled on resize
    roll: [[0, 0], [T_LEAP - 0.02, 0], [T_LEAP + 0.04, -2.2], [T_LAND + 0.03, 0.6], [0.7, 0], [1, 0]]
  };
  let sWide = 1;

  const $ = id => document.getElementById(id);
  const camEl = $('cam'), stage = $('stage'), scroller = $('scroller');
  const Lroom = $('Lroom'), Lfront = $('Lfront'), card = $('card');
  const sprRun = $('sprRun'), sprIdle = $('sprIdle'), sprBack = $('sprBack');
  const shadow = $('shadow'), aura = $('aura'), dust = $('dust'), ring1 = $('ring1'), ring2 = $('ring2');
  const vignette = $('vignette'), grain = $('grain');
  const flash = $('flash'), hint = $('hint'), barFill = document.querySelector('#bar b'), dbg = $('dbg');
  const spkRing = $('spkRing'), caret = $('caret');

  /* ---------- procedural screen art ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };

  // perspective grid (left monitor)
  const gridV = $('gridV'), gridH = $('gridH');
  for (let xb = -900; xb <= 2500; xb += 110) mk('line', { x1: SCR.x, y1: SCR.horizon, x2: xb, y2: 820 }, gridV);
  const H_LINES = 14, hLines = [];
  for (let i = 0; i < H_LINES; i++) hLines.push(mk('line', { x1: 560, x2: 1000 }, gridH));

  // code editor (right monitor)
  const code = $('codeLines');
  const pal = ['#ff4be0', '#3de0ff', '#ffd23b', '#9b7bff', '#3bff9a', '#ff8a5c'];
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let r = 0; r < 14; r++) {
    let x = 1120 + (r % 4 === 1 || r % 4 === 2 ? 22 : 0);
    const y = 522 + r * 17;
    const parts = 2 + Math.floor(rnd() * 3);
    for (let j = 0; j < parts; j++) {
      const w = 22 + rnd() * 70;
      mk('line', { x1: x, x2: x + w, y1: y, y2: y, stroke: pal[Math.floor(rnd() * pal.length)], opacity: .9 }, code);
      x += w + 10;
    }
  }
  for (let r = 0; r < 9; r++) mk('line', { x1: 1050, x2: 1050 + 20 + rnd() * 28, y1: 520 + r * 24, y2: 520 + r * 24, stroke: '#4b3cc4', 'stroke-width': 6, 'stroke-linecap': 'round' }, code);

  // room: neon light bars on the side and back walls, placed in perspective (vanishing point 620,330)
  const tubes = $('tubes');
  const tube = (x, top, bot, w) => {
    mk('ellipse', { cx: x, cy: (top + bot) / 2, rx: w * 5, ry: (bot - top) * 0.75, fill: 'url(#rgTube)' }, tubes);
    mk('rect', { x: x - w / 2, y: top, width: w, height: bot - top, rx: w / 2, fill: 'url(#gTube)', stroke: '#12052b', 'stroke-width': Math.max(1.2, w * 0.2) }, tubes);
    mk('rect', { x: x - w * 0.12, y: top + w, width: w * 0.24, height: bot - top - w * 2, rx: w * 0.12, fill: '#fff', opacity: .9 }, tubes);
  };
  for (const F of [1.04, 1.95, 2.6, 3.5]) {
    const top = 330 - 92 * F, bot = 330 + 26 * F, w = 6.5 * F;
    tube(620 + 240 * F, top, bot, w);   // left wall is covered by the cabinet
  }
  tube(412, 250, 352, 6); tube(828, 250, 352, 6);

  // floating shelves on the side walls. A point on a side wall at depth F (1 = back wall) and height h
  // (0 = floor, 350 = ceiling), d units out from the wall, projects to x = 620 ± (240 - d)F, y = 330 + (190 - h)F.
  const shelvesG = $('shelves');
  const proj = (side, F, h, d = 0) => [620 + side * (240 - d) * F, 330 + (190 - h) * F];
  const shelfFront = $('shelfFront');
  const poly = (pts, fill, g = shelvesG) => mk('polygon', { points: pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' '), fill, stroke: '#12052b', 'stroke-width': 2, 'stroke-linejoin': 'round' }, g);
  const SHELVES = [
    { id: 'L2', side: -1, F1: 1.20, F2: 1.65, h: 305, books: false },
    { id: 'R1', side:  1, F1: 1.10, F2: 1.50, h: 240 },
    { id: 'R2', side:  1, F1: 1.30, F2: 1.75, h: 300, books: false },
  ];
  const D = 46, TH = 8;
  window.HOP_SPOTS = {};   // where the ninja can land later: room coords + scale factor (≈ depth F)
  for (const sh of SHELVES) {
    const { side, F1, F2, h } = sh;
    const P = (F, hh, d) => proj(side, F, hh, d);
    // LED wash on the wall under the shelf
    const [gx, gy] = P((F1 + F2) / 2, h - 30, 0);
    mk('ellipse', { cx: gx, cy: gy, rx: 60 * F2, ry: 26 * F2, fill: 'url(#rgCool)' }, shelvesG);
    // Above eye level we see the underside; the lip, underside and near end are drawn in front of the
    // ninja (shelfFront) so its feet disappear behind the edge like they would on a real high shelf.
    const above = 330 + (190 - h) * F1 < 330, front = above ? shelfFront : shelvesG;
    if (above) poly([P(F1, h - TH, 0), P(F2, h - TH, 0), P(F2, h - TH, D), P(F1, h - TH, D)], '#1d0c5e', front);   // underside
    else poly([P(F1, h, 0), P(F2, h, 0), P(F2, h, D), P(F1, h, D)], '#6a52e4');                                   // top
    poly([P(F1, h, D), P(F2, h, D), P(F2, h - TH, D), P(F1, h - TH, D)], '#3a22a8', front);                      // inner edge (lip)
    poly([P(F2, h, 0), P(F2, h, D), P(F2, h - TH, D), P(F2, h - TH, 0)], '#2c1880', front);                      // near end
    const a = P(F1, h - TH, D), b = P(F2, h - TH, D);
    mk('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#3de0ff', 'stroke-width': 2, 'stroke-linecap': 'round' }, front);
    // a few books at the near end; the start of the shelf stays free for landing
    const cols = ['#ff4be0', '#ffd23b', '#9b7bff', '#3bff9a'];
    if (sh.books !== false) for (let k = 0; k < 3; k++) {
      const F = F2 - 0.11 + k * 0.03, [bx, by] = P(F, h, D * 0.5);
      const bw = 6 * F, bh = (k === 1 ? 26 : 30) * F;
      mk('rect', { x: bx - bw / 2, y: by - bh, width: bw, height: bh, fill: cols[(k + (side > 0 ? 1 : 0)) % 4], stroke: '#12052b', 'stroke-width': 1.5 }, shelvesG);
    }
    const Fm = F1 + 0.04, [hx, hy] = P(Fm, h, D * 0.5);   // landing spot: the start (back end) of the shelf
    window.HOP_SPOTS[sh.id] = { x: +hx.toFixed(1), y: +hy.toFixed(1), scale: +Fm.toFixed(3) };
  }
  // glass collectible cabinet covering the left wall. Front glass is parallel to the wall, D units into the room.
  {
    const g = $('sideCabinet');
    const CAB = { Fa: 1.0, Fb: 3.4, D: 62, H: 250, base: 30, top: 238, shelves: [85, 140, 195],
                  bays: [1.0, 1.176, 1.43, 1.82, 2.5, 3.4] };               // equal depth steps (1/F linear)
    const { Fa, Fb, D, H, base, top } = CAB;
    const P = (F, h, d) => [620 - (240 - d) * F, 330 + (190 - h) * F];
    const lerp2 = (a, b, t) => a + (b - a) * t;
    const quad = (pts, attrs) => mk('polygon', { points: pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' '), ...attrs }, g);
    const seg2 = (a, b, attrs) => mk('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], 'stroke-linecap': 'round', ...attrs }, g);
    const plane = (F1, F2, h1, h2, d) => [P(F1, h1, d), P(F2, h1, d), P(F2, h2, d), P(F1, h2, d)];
    const flat = (F1, F2, h, d1, d2) => [P(F1, h, d1), P(F2, h, d1), P(F2, h, d2), P(F1, h, d2)];
    const ink = { stroke: '#12052b', 'stroke-width': 2 };

    quad(flat(Fa, Fb, 0, 0, D + 14), { fill: '#0a0328', opacity: .35 });                 // floor shadow
    quad([P(Fa, 0, 0), P(Fa, 0, D), P(Fa, H, D), P(Fa, H, 0)], { fill: '#1b0d55', ...ink });   // far end panel
    quad(plane(Fa, Fb, base, top, 0), { fill: '#2b1785' });                                // lit back panel
    quad(flat(Fa, Fb, top, 0, D), { fill: '#14083f' });                                    // underside of the top
    quad(flat(Fa, Fb, base, 0, D), { fill: '#3a22a8' });                                   // bottom deck

    // soft spot glow in every compartment
    const levels = [base, ...CAB.shelves, top];
    for (let i = 0; i < CAB.bays.length - 1; i++) {
      const Fm = (CAB.bays[i] + CAB.bays[i + 1]) / 2;
      for (let r = 0; r < levels.length - 1; r++) {
        const [x, y] = P(Fm, levels[r + 1] - 14, 4);
        mk('ellipse', { cx: x, cy: y, rx: 26 * Fm, ry: 30 * Fm, fill: 'url(#rgCab)' }, g);
      }
    }
    // LED strip under the top
    seg2(P(Fa, top, D - 6), P(Fb, top, D - 6), { stroke: '#9ff3ff', 'stroke-width': 3 });
    seg2(P(Fa, top, D - 6), P(Fb, top, D - 6), { stroke: '#3de0ff', 'stroke-width': 12, opacity: .18 });

    // glass shelves (translucent surfaces + bright front edge)
    for (const h of CAB.shelves) {
      quad(flat(Fa, Fb, h, 0, D), { fill: '#bfe9ff', opacity: .3 });
      seg2(P(Fa, h, 0), P(Fb, h, 0), { stroke: '#9fdcff', 'stroke-width': 1.4, opacity: .6 });
      seg2(P(Fa, h, D), P(Fb, h, D), { stroke: '#d6f4ff', 'stroke-width': 2.2 });
      seg2(P(Fa, h - 3, D), P(Fb, h - 3, D), { stroke: '#3de0ff', 'stroke-width': 1.2 });
    }

    // collectibles: billboards scaled by depth, far bays first
    const ROWS = [
      ['robot', 'astronaut-helmet', 'big-head-figure', 'crystal', 'mech', 'trophy', 'mini-globe', 'mini-dragon', 'controller'],
      ['trophy', 'mini-knight', 'car-model', 'robot', 'katana', 'astronaut-helmet', 'crystal', 'big-head-figure', 'mini-globe'],
      ['mini-globe', 'controller', 'mini-dragon', 'big-head-figure', 'trophy', 'mech', 'mini-knight', 'robot', 'car-model'],
      ['crystal', 'boxes-0', 'mech', 'boxes-1', 'mini-knight', 'astronaut-helmet', 'boxes-0', 'trophy', 'boxes-1'],
    ];
    const rowBase = [base, ...CAB.shelves];
    for (let i = 0; i < CAB.bays.length - 1; i++) {
      const F1 = CAB.bays[i], F2 = CAB.bays[i + 1];
      const slots = (240 - D) * (F2 - F1) > 60 ? [0.3, 0.72] : [0.5];
      for (let r = 0; r < rowBase.length; r++) {
        slots.forEach((u, j) => {
          const F = lerp2(F1, F2, u), [x, y] = P(F, rowBase[r], D * 0.45);
          const name = ROWS[r][(i * 2 + j) % ROWS[r].length];
          const k = (F / 1.7) * (name.startsWith('boxes') ? 0.55 : 0.92);
          mk('ellipse', { cx: x, cy: y, rx: 15 * k, ry: 3.5 * k, fill: '#0a0328', opacity: .4 }, g);
          mk('use', { href: '#fig-' + name, transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${k.toFixed(3)})` }, g);
        });
      }
    }

    // glass fronts with reflections
    for (let i = 0; i < CAB.bays.length - 1; i++) {
      const F1 = CAB.bays[i], F2 = CAB.bays[i + 1];
      const Q = (u, v) => P(lerp2(F1, F2, u), lerp2(base, top, v), D);
      quad(plane(F1, F2, base, top, D), { fill: '#cfe3ff', opacity: .07 });
      quad([Q(0.12, 1), Q(0.34, 1), Q(0.06, 0.55), Q(0, 0.55)], { fill: '#fff', opacity: .14 });
      quad([Q(0.44, 1), Q(0.52, 1), Q(0, 0.3), Q(0, 0.22)], { fill: '#fff', opacity: .08 });
      quad([Q(1, 0.4), Q(1, 0.2), Q(0.7, 0), Q(0.55, 0)], { fill: '#fff', opacity: .05 });
    }
    // frame: top rail, plinth, posts, handles
    quad(plane(Fa, Fb, top, H, D), { fill: '#1b0d55', ...ink });
    seg2(P(Fa, H, D), P(Fb, H, D), { stroke: '#b3a6ff', 'stroke-width': 2 });
    quad(plane(Fa, Fb, 0, base, D), { fill: '#241470', ...ink });
    seg2(P(Fa, base * 0.45, D), P(Fb, base * 0.45, D), { stroke: '#ff4be0', 'stroke-width': 9, opacity: .2 });
    seg2(P(Fa, base * 0.45, D), P(Fb, base * 0.45, D), { stroke: '#ff7bea', 'stroke-width': 2.5 });
    for (const F of CAB.bays) {
      seg2(P(F, 0, D), P(F, H, D), { stroke: '#12052b', 'stroke-width': 5.5 * F });
      seg2(P(F, 0, D), P(F, H, D), { stroke: '#a9b8ff', 'stroke-width': 2.2 * F });
    }
    for (const F of CAB.bays.slice(0, -1)) seg2(P(F + 0.03 * F, 118, D), P(F + 0.03 * F, 152, D), { stroke: '#e2ddff', 'stroke-width': 2.2 * F });

    // the cabinet top is a landing spot too (seen from below, the ninja stands on its front edge)
    const [cx, cy] = P(1.55, H, D * 0.7);
    window.HOP_SPOTS.cabinet = { x: +cx.toFixed(1), y: +cy.toFixed(1), scale: 1.55 };
  }
  window.HOP_SPOTS.desk = { x: +toRoom(DESK.x, 0)[0].toFixed(1), y: +toRoom(0, DESK.y)[1].toFixed(1), scale: 1 };

  // front wall: a row of LEDs under the ledge; below that the wall is one plain surface that continues
  // seamlessly into the board band and the building below
  const panels = $('facePanels');
  for (let x = -1600, i = 0; x < 2900; x += 150, i++) {
    mk('circle', { cx: x + 75, cy: 738, r: 3, fill: i % 2 ? '#ff7bea' : '#9ff3ff' }, panels);
    mk('circle', { cx: x + 75, cy: 738, r: 9, fill: i % 2 ? '#ff7bea' : '#9ff3ff', opacity: .18 }, panels);
  }

  // wind: hair / sleeve / jacket hem are separate pieces of the character art. Each frame they are redrawn
  // row by row with a sideways sway that is zero where the piece joins the body and largest at its free end.
  const DY = 32;   // the character is lowered this much (matches the CSS)
  const WIND = {
    hair:   { x: 838.152, y: 296.448, w: 137.333, h: 50.0,    root: 346, tip: 296, amp: 3.0, bias: 1.3, ph: 0.0 },
    sleeve: { x: 676.485, y: 512.115, w: 108.0,   h: 194.0,   root: 512, tip: 702, amp: 6.0, bias: 2.2, ph: 1.7 },
    hem:    { x: 782.152, y: 470.115, w: 36.333,  h: 144.333, root: 478, tip: 610, amp: 3.4, bias: 1.4, ph: 3.1 },
  };
  const windPieces = Object.entries(WIND).map(([name, w]) => {
    const pad = Math.ceil((w.amp * 1.3 + w.bias) * 3) + 4;          // canvas px of sway room on each side
    const cv = document.createElement('canvas');
    cv.className = 'wind';
    Object.assign(cv.style, { left: (w.x - pad / 3) + 'px', top: (w.y + DY) + 'px', width: (w.w + 2 * pad / 3) + 'px', height: w.h + 'px' });
    Lfront.insertBefore(cv, card);
    const piece = { w, cv, ctx: cv.getContext('2d'), pad, img: new Image(), ready: false };
    piece.img.onload = () => { cv.width = piece.img.width + 2 * pad; cv.height = piece.img.height; piece.ready = true; };
    piece.img.src = `assets/wind-${name}.webp`;
    return piece;
  });
  function drawWind(t) {
    const gust = 0.75 + 0.25 * Math.sin(t * 0.45) + 0.12 * Math.sin(t * 1.3);
    for (const { w, ctx, pad, img, ready } of windPieces) {
      if (!ready) continue;
      const W = img.width, H = img.height, root = (w.root - w.y) * 3, tip = (w.tip - w.y) * 3;
      ctx.clearRect(0, 0, W + 2 * pad, H);
      for (let y = 0; y < H; y++) {
        const r = clamp((y - root) / (tip - root));
        let off = 0;
        if (r > 0) {
          const yy = y / 3, e = Math.pow(r, 1.5);
          off = (w.amp * gust * (0.65 * Math.sin(t * 2.6 - yy * 0.09 + w.ph) + 0.35 * Math.sin(t * 5.3 - yy * 0.17 + w.ph * 2))
                + w.bias * (0.7 + 0.3 * Math.sin(t * 0.7 + w.ph))) * e * 3;
        }
        ctx.drawImage(img, 0, y, W, 1, pad + off, y, W, 1);
      }
    }
  }

  /* ---------- the ninja's run through the room (after the intro; h 0..1) ----------
     desk → speaker → right shelves → right table → wall ledge → over the shoe → onto the card.
     Positions are room coords; F is the depth factor (sprite size ∝ F). */
  const NINJA_H = 55;   // figure height at depth F = 1 (matches the intro ninja standing on the desk)
  const SHEETS = {
    runR:   { url: 'assets/ninja-run-right.webp',     n: 64, cols: 8, w: 232,   h: 248,   aw: 1856, ah: 1984, fx: 118.6, fy: 242.0, H: 232.8 },
    walkR:  { url: 'assets/ninja-walk-right.webp',    n: 25, cols: 8, w: 171.2, h: 252,   aw: 1370, ah: 1008, fx: 87.2,  fy: 246.4, H: 236.8 },
    idleR:  { url: 'assets/ninja-idle-right.webp',    n: 25, cols: 8, w: 143.2, h: 256.8, aw: 1146, ah: 1027, fx: 71.6,  fy: 253.6, H: 247.2 },
    walkSE: { url: 'assets/ninja-walk-southeast.webp', n: 13, cols: 8, w: 191.2, h: 304,   aw: 1530, ah: 608,  fx: 90.0,  fy: 288.8, H: 280.8 },
    walkD:  { url: 'assets/ninja-walk-down.webp',     n: 24, cols: 8, w: 181.6, h: 340,   aw: 1453, ah: 1020, fx: 90.6,  fy: 324.0, H: 313.2 },
    // back-facing / away-from-camera versions, used when the visitor scrolls back
    walkU:  { url: 'assets/ninja-walk-up.webp',        n: 24, cols: 8, w: 160,   h: 286.4, aw: 1280, ah: 859,  fx: 78.8,  fy: 275.6, H: 268.8 },
    walkNE: { url: 'assets/ninja-walk-northeast.webp', n: 12, cols: 8, w: 156.8, h: 256,   aw: 1254, ah: 512,  fx: 78.2,  fy: 248.4, H: 239.6 },
    idleU:  { url: 'assets/ninja-idle-up.webp',        n: 25, cols: 8, w: 143.2, h: 255.2, aw: 1146, ah: 1021, fx: 71.6,  fy: 251.2, H: 245.6 },
    idleNE: { url: 'assets/ninja-idle-northeast.webp', n: 25, cols: 8, w: 114.4, h: 243.2, aw: 915,  ah: 973,  fx: 56.4,  fy: 240.0, H: 234.4 },
    runU:   { url: 'assets/ninja-run-up.webp',         n: 24, cols: 8, w: 171.2, h: 310.4, aw: 1370, ah: 931,  fx: 80.8,  fy: 298.4, H: 282.4 },
    idleD:  { url: 'assets/ninja-idle-down.png',      n: 25, cols: 5, w: 320,   h: 380,   aw: 1600, ah: 1900, fx: 157,   fy: 325,   H: 287 },
  };
  for (const sp of Object.values(SHEETS)) new Image().src = sp.url;   // preload so switches never flash

  const WP = {   // [x, y (feet), F]
    desk:  [582.4, 419.2, 1.07],  deskR: [692, 419.2, 1.07],  spk: [733, 364.5, 1.04],
    r1:    [867.4, 273.0, 1.14],  r2a:   [908.6, 183.7, 1.33], r2b: [988.9, 143.0, 1.70],   // shelf landings at their back (start) end
    t1:    [1032.7, 525.8, 2.05], t2:    [1113.2, 564.0, 2.45],   // t2 = the table's front edge
    w1:    [1050, 698, 1.95],     w2:    [985, 698, 1.95],     w3:  [842, 698, 1.95],
  };
  const CARD_F = 1.95;
  // [h0, h1, kind, from, to, options]  —  'card:u' = point u (0 left … 1 right) on the card's top edge
  const ROUTE = [
    [0.000, 0.015, 'idle', 'desk',      'desk',      { sheet: 'idleD' }],
    [0.015, 0.080, 'move', 'desk',      'deskR',     { sheet: 'walkR', cycles: 2.2 }],
    [0.080, 0.125, 'jump', 'deskR',     'spk',       { apex: 40 }],
    [0.125, 0.150, 'idle', 'spk',       'spk',       { sheet: 'idleR' }],
    [0.150, 0.235, 'jump', 'spk',       'r1',        { apex: 55, swing: 30 }],
    [0.235, 0.255, 'idle', 'r1',        'r1',        { sheet: 'idleR' }],
    [0.255, 0.320, 'jump', 'r1',        'r2a',       { apex: 45, swing: 40 }],
    [0.320, 0.400, 'move', 'r2a',       'r2b',       { sheet: 'walkSE', cycles: 1.5 }],
    [0.400, 0.480, 'jump', 'r2b',       't1',        { apex: 30, layer: 'front' }],                   // drop on the top layer
    [0.480, 0.550, 'move', 't1',        't2',        { sheet: 'walkD', cycles: 1.6, layer: 'front' }],  // walk toward the camera to the edge
    [0.550, 0.610, 'jump', 't2',        'w1',        { apex: 30, flip: -1, layer: 'front' }],
    [0.610, 0.665, 'move', 'w1',        'w2',        { sheet: 'walkR', flip: -1, cycles: 1.2, layer: 'front' }],
    [0.665, 0.745, 'jump', 'w2',        'w3',        { apex: 92, flip: -1, layer: 'front' }],
    [0.745, 0.765, 'idle', 'w3',        'w3',        { sheet: 'idleR', flip: -1, layer: 'front' }],
    [0.765, 0.845, 'jump', 'w3',        'card:0.86', { apex: 70, flip: -1, layer: 'front' }],
    [0.845, 0.875, 'idle', 'card:0.86', 'card:0.86', { sheet: 'idleR', flip: -1, layer: 'front' }],
    [0.875, 0.955, 'move', 'card:0.86', 'card:0.16', { sheet: 'walkR', flip: -1, cycles: 2.2, layer: 'front' }],
    [0.955, 1.001, 'idle', 'card:0.16', 'card:0.16', { sheet: 'idleD', layer: 'front' }],
  ];
  const cardU = name => name.startsWith('card:') ? parseFloat(name.slice(5)) : null;
  // Poses by direction of travel: [sheet, mirror]. Scrolling back turns the ninja around.
  const WALK_FWD = { walkR: ['walkR', 1], runR: ['runR', 1], walkSE: ['walkSE', 1], walkD: ['walkD', 1] };
  const WALK_REV = { walkR: ['walkR', -1], runR: ['runR', -1], walkSE: ['walkNE', -1], walkD: ['walkU', 1] };   // back = away from camera
  const IDLE_FWD = { walkR: ['idleR', 1], runR: ['idleR', 1], walkSE: ['idleD', 1], walkD: ['idleD', 1] };
  const IDLE_REV = { walkR: ['idleR', -1], runR: ['idleR', -1], walkSE: ['idleNE', -1], walkD: ['idleU', 1] };

  const playShift = (i, v) => i === ROUTE.length - 1 ? play.off : i === ROUTE.length - 2 ? play.off * ease(v) : 0;
  function hopSegment(hh) {
    let i = ROUTE.findIndex(r => hh < r[1]); if (i < 0) i = ROUTE.length - 1;
    // resting exactly on a take-off point counts as standing there, not as frame 0 of the jump
    if (i > 0 && ROUTE[i][2] === 'jump' && hh <= ROUTE[i][0]) i--;
    const r = ROUTE[i], v = seg(hh, r[0], r[1]);
    const u0 = cardU(r[3]), u1 = cardU(r[4]);
    // on the card once a jump onto it has landed (or any later segment that starts on it)
    const onCard = hh > 0 && u0 !== null || (r[2] === 'jump' && u1 !== null && v >= 1);
    let u = u0 !== null && u1 !== null ? lerp(u0, u1, r[2] === 'move' ? ease(v) : v) : (u1 ?? u0);
    // where the visitor walked the ninja to (blended in along the last walk so scrolling back stays continuous)
    u += playShift(i, v);
    return { i, r, v, onCard, u };
  }

  // floating card: a damped spring tilts it toward the side the ninja stands on, with a dip on landing
  const cardEl = $('card'), cardSlab = $('cardSlab'), slabTop = $('slabTop'), slabSide = $('slabSide'), slabSheen = $('slabSheen');
  const VP = [620, 330], SLAB_F = 0.86;   // slab thickness: back face = front face pulled 14% toward the vanishing point
  const CARD_TILT = 8;   // deg at the very edge
  const phys = { a: 0, va: 0, d: 0, vd: 0, on: false };
  let cardFree = false;   // the descent ninja has jumped off: the card springs back to level
  // visitor play: press or drag the card to tilt it; the ninja standing on it walks downhill
  const PLAY_HOME = 0.16;   // where the room run leaves the ninja on the card
  const play = { off: 0, v: 0, dir: 0, push: 0, pushS: 0, held: false, t0: 0, until: 0 };
  window.__play = play;   // debug: inspect the card play state
  function updateCard(dt, t, hs) {
    const ce = ease(seg(p, 0.84, 0.94));
    const on = h > 0 && hs.onCard && !cardFree;
    if (on && !phys.on) { phys.va += 140 * Math.sign(2 * hs.u - 1 || 1); phys.vd += 70; }   // landing kick
    phys.on = on;
    // the visitor's press: held (or a tap, kept briefly) tilts the card toward the pressed side
    const pressing = play.held || performance.now() < play.until;
    play.pushS += ((pressing ? play.push : 0) - play.pushS) * (1 - Math.exp(-dt * 10));
    // the ninja on the card walks downhill while the visitor tilts it (only once the room run has ended)
    const canWalk = on && hs.i === ROUTE.length - 1 && !s1Hidden;
    const tv = canWalk ? Math.max(-1, Math.min(1, play.pushS / 12)) * 0.6 : 0;   // card widths per second
    play.v += (tv - play.v) * (1 - Math.exp(-dt * 6));
    let pu = PLAY_HOME + play.off + play.v * dt;
    if (pu < 0.06 || pu > 0.94) { pu = clamp(pu, 0.06, 0.94); play.v = 0; }   // stops at the card's ends
    play.off = pu - PLAY_HOME;
    if (Math.abs(play.v) > 0.03) play.dir = Math.sign(play.v);
    const aT = Math.max(-15, Math.min(15, (on ? CARD_TILT * (2 * hs.u - 1) : 0) + play.pushS)), dT = on ? 5 : 0;
    const steps = Math.max(1, Math.ceil(dt / 0.008)), sdt = dt / steps;
    for (let k = 0; k < steps; k++) {
      phys.va += (-46 * (phys.a - aT) - 7 * phys.va) * sdt; phys.a += phys.va * sdt;
      phys.vd += (-60 * (phys.d - dT) - 9 * phys.vd) * sdt; phys.d += phys.vd * sdt;
    }
    const calm = on ? 0.3 : 1;
    const ty = (1 - ce) * 24 + Math.sin(t * 1.3) * 4 * calm + phys.d;
    const deg = Math.sin(t * 0.9) * 0.7 * calm + phys.a;
    const sc = 0.92 + 0.08 * ce;
    cardEl.style.opacity = ce.toFixed(3);
    cardEl.style.pointerEvents = ce > 0.5 ? 'auto' : 'none';
    cardEl.style.transform = `translateY(${ty.toFixed(2)}px) rotate(${deg.toFixed(3)}deg) scale(${sc.toFixed(3)})`;
    const W = cardEl.offsetWidth, H = cardEl.offsetHeight, rad = deg * Math.PI / 180;
    const cx0 = cardEl.offsetLeft + W / 2, cy0 = cardEl.offsetTop + H / 2 + ty;
    // front-face corners in the world, then the slab's back face shrunk toward the room's vanishing point
    const corner = (lx, ly) => [cx0 + (lx * Math.cos(rad) - ly * Math.sin(rad)) * sc, cy0 + (lx * Math.sin(rad) + ly * Math.cos(rad)) * sc];
    const back = q => [VP[0] + SLAB_F * (q[0] - VP[0]), VP[1] + SLAB_F * (q[1] - VP[1])];
    const TL = corner(-W / 2, -H / 2), TR = corner(W / 2, -H / 2), BR = corner(W / 2, H / 2), BL = corner(-W / 2, H / 2);
    const pts = a => a.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ');
    slabTop.setAttribute('points', pts([TL, TR, back(TR), back(TL)]));
    // whichever end faces the camera: right end when the slab is left of the vanishing point
    slabSide.setAttribute('points', TR[0] < VP[0] ? pts([TR, BR, back(BR), back(TR)]) : pts([TL, BL, back(BL), back(TL)]));
    const s0 = [lerp(TL[0], back(TL)[0], 0.18) + 6, lerp(TL[1], back(TL)[1], 0.18)], s1 = [lerp(TR[0], back(TR)[0], 0.18) - 6, lerp(TR[1], back(TR)[1], 0.18)];
    slabSheen.setAttribute('x1', s0[0]); slabSheen.setAttribute('y1', s0[1]); slabSheen.setAttribute('x2', s1[0]); slabSheen.setAttribute('y2', s1[1]);
    cardSlab.style.opacity = ce.toFixed(3);
    return {
      deg,
      top: u => {   // world point in the middle (depth-wise) of the slab's top face — where the ninja walks
        const f = corner((u - 0.5) * W, -H / 2), b = back(f);
        return [lerp(f[0], b[0], 0.5), lerp(f[1], b[1], 0.5), CARD_F];
      }
    };
  }

  const pressAt = e => {
    const b = cardEl.getBoundingClientRect(), fx = clamp((e.clientX - b.left) / b.width);
    play.push = CARD_TILT * 1.7 * (2 * fx - 1);
  };
  cardEl.addEventListener('pointerdown', e => {
    play.held = true; play.t0 = performance.now(); pressAt(e);
    phys.va += 50 * Math.sign(play.push);                      // the press knocks it a little
    try { cardEl.setPointerCapture(e.pointerId); } catch (_) {}
  });
  cardEl.addEventListener('pointermove', e => { if (play.held) pressAt(e); });
  const letGo = () => {   // a quick tap keeps the tilt for a moment so the ninja gets a few steps in
    if (!play.held) return;
    play.held = false; play.until = performance.now() + Math.max(0, 500 - (performance.now() - play.t0));
  };
  cardEl.addEventListener('pointerup', letGo);
  cardEl.addEventListener('pointercancel', letGo);

  function hopPlace(hs, t, pose) {
    const { r, v, i } = hs, [, , kind, from, to, o] = r;
    const at = name => cardU(name) !== null ? pose.top(cardU(name)) : WP[name];
    const A = at(from), B = at(to);
    const st = { flip: (o.flip || 1) * (kind === 'jump' || o.sheet === 'idleR' ? travel : 1), layer: o.layer || 'room', rot: 0, sy: 1, grounded: true };
    if (kind === 'jump') {
      st.x = lerp(A[0], B[0], v) - (o.swing || 0) * Math.sin(Math.PI * v);   // swing out into the room, over the shelf lip
      st.y = lerp(A[1], B[1], v) - o.apex * 4 * v * (1 - v);
      st.F = lerp(A[2], B[2], v);
      st.sheet = 'runR';
      st.frame = v < 0.1 ? 12 : v < 0.5 ? 4 : v < 0.9 ? 20 : 28;
      st.rot = st.flip * 7 * Math.sin(Math.PI * v) * (v < 0.5 ? -1 : 0.6);
      st.grounded = v < 0.04 || v > 0.96;
    } else {
      const e = kind === 'move' ? v : 0;
      st.x = lerp(A[0], B[0], e); st.y = lerp(A[1], B[1], e); st.F = lerp(A[2], B[2], e);
      const sh = playShift(i, v);
      if (sh && cardU(from) !== null && cardU(to) !== null) {   // walked along the card by the visitor's tilt
        [st.x, st.y, st.F] = pose.top(lerp(cardU(from), cardU(to), e) + sh);
      }
      const walking = kind === 'move' && moving;
      if (kind === 'move') {
        const [sheet, m] = (walking ? (travel < 0 ? WALK_REV : WALK_FWD) : (travel < 0 ? IDLE_REV : IDLE_FWD))[o.sheet];
        st.sheet = sheet; st.flip = (o.flip || 1) * m;
      } else st.sheet = o.sheet;
      if (st.sheet === 'idleD' || st.sheet === 'idleU' || st.sheet === 'walkU') st.flip = 1;
      const sp = SHEETS[st.sheet];
      // walking backward still plays the cycle forward in time (no moonwalk)
      st.frame = walking ? Math.floor((travel < 0 ? 1 - v : v) * o.cycles * sp.n) % sp.n : Math.floor(t * 12) % sp.n;
      if (i === ROUTE.length - 1 && play.dir) {   // walked by the visitor's tilt: face the way it went
        const w = Math.abs(play.v) > 0.03;
        st.sheet = w ? 'walkR' : 'idleR'; st.flip = play.dir;
        st.frame = Math.floor(t * (w ? 16 : 12)) % SHEETS[st.sheet].n;
      }
      if (i > 0 && ROUTE[i - 1][2] === 'jump') st.sy = 1 - 0.12 * bump(v, 0, 0.06, 0.4);   // landing squash
      if (cardU(from) !== null) st.rot = pose.deg * 0.6;                                // lean with the card
    }
    return st;
  }

  const hopRoom = $('hopRoom'), hopFront = $('hopFront');
  const hopEl = document.createElement('div'); hopEl.className = 'hop'; hopEl.id = 'njHop';   // ids: read by the ninja VFX layer
  const hopShadow = document.createElement('div'); hopShadow.className = 'hopShadow';
  const camFollow = { x: 0, y: 0 };
  // draw frame `frame` of sheet `key` with its feet at (x, y), figure height `height` (in the element's units)
  function sheetSprite(el, key, frame, x, y, height, rot = 0, flip = 1, sy = 1) {
    const sp = SHEETS[key];
    if (el.dataset.sheet !== key) {
      Object.assign(el.style, { backgroundImage: `url(${sp.url})`, backgroundSize: `${sp.aw}px ${sp.ah}px`, width: sp.w + 'px', height: sp.h + 'px' });
      el.dataset.sheet = key;
    }
    const col = frame % sp.cols, row = Math.floor(frame / sp.cols), k = height / sp.H;
    el.style.backgroundPosition = `${(-col * sp.w).toFixed(1)}px ${(-row * sp.h).toFixed(1)}px`;
    el.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) rotate(${rot.toFixed(2)}deg) scale(${(k * flip).toFixed(4)},${(k * sy).toFixed(4)}) translate(${-sp.fx}px,${-sp.fy}px)`;
  }

  // markers the page-level continuation reads (feet on the card, two spots on the wall ledge)
  const mark = (x, y) => { const m = document.createElement('div'); m.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:1px;height:1px`; hopFront.appendChild(m); return m; };
  const feetMark = mark(0, 0), ledgeMarks = [mark(330, 698), mark(195, 698)];
  let s1Hidden = false;
  window.__s1 = {
    get done() { return g >= 0.99999; },               // the room run has finished (ninja standing on the card)
    feet: feetMark, ledges: ledgeMarks,
    release(b) { cardFree = b; },
    hide(b) { s1Hidden = b; hopEl.style.visibility = hopShadow.style.visibility = b ? 'hidden' : 'visible'; },
    kit: { SHEETS, sheetSprite },
    ninjaPx: () => NINJA_H * CARD_F * sWide,          // on-screen height of the ninja on the card
  };

  function drawHop(st) {
    if (!st) { hopEl.style.display = hopShadow.style.display = 'none'; return; }
    hopEl.style.display = hopShadow.style.display = 'block';
    const parent = st.layer === 'front' ? hopFront : hopRoom;
    if (hopEl.parentNode !== parent) parent.append(hopShadow, hopEl);
    sheetSprite(hopEl, st.sheet, st.frame, st.x, st.y, NINJA_H * st.F, st.rot, st.flip, st.sy);
    if (st.layer === 'front') feetMark.style.transform = `translate(${st.x.toFixed(1)}px,${st.y.toFixed(1)}px)`;
    hopShadow.style.opacity = st.grounded ? 0.55 : 0;
    hopShadow.style.transform = `translate(${(st.x - 20).toFixed(1)}px,${(st.y - 5).toFixed(1)}px) rotate(${st.rot.toFixed(2)}deg) scale(${(0.95 * st.F).toFixed(3)},${(0.9 * st.F).toFixed(3)})`;
  }

  function updateGrid(off) {
    for (let i = 0; i < H_LINES; i++) {
      const t = ((i + off) % H_LINES + H_LINES) % H_LINES / H_LINES;      // 0 = horizon, 1 = viewer
      const y = SCR.horizon + 262 * Math.pow(t, 2.3);
      const l = hLines[i];
      l.setAttribute('y1', y.toFixed(2)); l.setAttribute('y2', y.toFixed(2));
      l.setAttribute('opacity', (0.12 + 0.85 * t).toFixed(2));
      l.setAttribute('stroke-width', (0.6 + 1.8 * t).toFixed(2));
    }
  }

  /* ---------- floor text: chunky 3D words standing on the monitor's ground plane ---------- */
  // Every word is an upright board at ground depth D = F/s (s = the ninja's scale at that depth), placed and scaled exactly like
  // the ninja: x = SCR.x + X*s, y = horizon + K_PERSP*s. Its thickness is a stack of copies from the front face back to
  // D + thickness, each smaller and nearer the vanishing point (the sides). The cast shadow lies on the floor in front.
  // The words slide in along the floor from the right, one after another, into one straight row (left to right);
  // "AI", the last, is the only big one.
  const FLOOR = {
    F: 260,           // focal length in ground px: smaller = deeper-looking thickness and shadows
    layers: 16,       // slices of the thickness
    cap: 72,          // cap height of the 100px font, in its own px
    depth: 0.8,       // thickness, in cap heights
    shadow: { len: 1.3, lean: 0.7 },    // floor shadow cast toward the viewer: length and lean to the right, in cap heights
    slide: { t0: 0.05, step: 0.052, dur: 0.05 },   // word i starts sliding at t0 + step*i (p); the last (AI) is in at 0.36 < T_LEAP
    // neon faces (deep-space palette of the monitor); sides fade from a darker shade of the face into deep violet
    faces: [[255, 40, 212], [30, 226, 255], [150, 96, 255], [255, 84, 150], [40, 255, 176], [255, 226, 50]],
    deep: [14, 6, 52],
    // desktop: one straight row near the horizon (y = baseline, H = cap height before fitting, kAI = AI's size factor)
    desktop: { y: 574, H: 13, kAI: 2.3, w: [586, 974], words: ['Let’s', 'build', 'something', 'great', 'with', 'AI'] },
    // a phone shows only the middle third of the monitor: one centred word per row, AI biggest
    portrait: { C: 780, W: 152, rows: [['Let’s', 598, 14], ['build', 626, 14], ['something', 654, 14], ['great', 682, 14], ['with', 710, 14], ['AI', 750, 30]] }
  };
  const floorEl = $('floorText'), floorGroups = [];
  let floorPortrait = null, floorBase = 80;
  const rgb = c => `rgb(${c.join(',')})`;
  const mixC = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
  const easeOut3 = t => 1 - Math.pow(1 - t, 3);
  function quadMatrix(q, w, h) {   // CSS matrix3d taking the box (0,0)-(w,h) onto quad q = [tl, tr, br, bl]
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
    const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
    const den = dx1 * dy2 - dx2 * dy1, g = (dx3 * dy2 - dx2 * dy3) / den, hh = (dx1 * dy3 - dx3 * dy1) / den;
    const a = x1 - x0 + g * x1, b = x3 - x0 + hh * x3, d = y1 - y0 + g * y1, e = y3 - y0 + hh * y3;
    return `matrix3d(${a / w},${d / w},0,${g / w},${b / h},${e / h},0,${hh / h},0,0,1,0,${x0},${y0},0,1)`;
  }
  const groundPt = (X, D) => { const s = FLOOR.F / D; return [SCR.x + X * s, SCR.horizon + K_PERSP * s]; };
  function buildFloorText() {
    floorPortrait = vw < vh;
    const F = FLOOR;
    floorEl.replaceChildren(); floorGroups.length = 0;
    const shLayer = document.createElement('div'), ltLayer = document.createElement('div');
    shLayer.className = 'fsl'; ltLayer.className = 'fll'; floorEl.append(shLayer, ltLayer);
    const measure = txt => { const m = document.createElement('div'); m.className = 'fw'; m.textContent = txt; ltLayer.appendChild(m); const w = m.offsetWidth; m.remove(); return w; };
    // baseline of the 100px font inside its line box (so the letters, not the box, stand on the floor)
    const probe = document.createElement('div'); probe.className = 'fw'; probe.innerHTML = 'Hg<i style="display:inline-block;width:0;height:0"></i>'; ltLayer.appendChild(probe);
    floorBase = probe.querySelector('i').offsetTop; probe.remove();
    // layout: each word gets its baseline y, cap height H and left end xl (screen, rig units)
    const defs = [];
    if (!floorPortrait) {
      const c = F.desktop, n = c.words.length, ws = c.words.map(measure);
      const hs = c.words.map((t, i) => c.H * (i === n - 1 ? c.kAI : 1));
      const gap = 0.55 * c.H;
      const total = ws.reduce((a, w, i) => a + w * hs[i] / F.cap, 0) + gap * (n - 1);
      const f = Math.min(1, (c.w[1] - c.w[0]) / total);   // fit the row to the screen
      let x = SCR.x - total * f / 2;
      c.words.forEach((t, i) => { const H = hs[i] * f; defs.push({ text: t, y: c.y, H, xl: x }); x += ws[i] * H / F.cap + gap * f; });
    } else {
      const c = F.portrait;
      for (const [t, y, H] of c.rows) {
        const w = measure(t); let h = H; const wScr = w * h / F.cap; if (wScr > c.W) h *= c.W / wScr;
        defs.push({ text: t, y, H: h, xl: c.C - w * h / F.cap / 2 });
      }
    }
    defs.forEach((d, i) => {
      const s = (d.y - SCR.horizon) / K_PERSP, ai = d.text === 'AI';
      const face = F.faces[ai ? F.faces.length - 1 : i % (F.faces.length - 1)];
      const s0 = mixC(face, F.deep, 0.35), s1 = mixC(face, F.deep, 0.85);
      const w = measure(d.text), c = d.H / s / F.cap;                       // c: ground px per font px
      const g = { d, w, c, X0: (d.xl - SCR.x) / s, Dn: F.F / s, T: F.depth * F.cap * c * (ai ? 0.7 : 1), sh: null, ls: [], k: -1, span: (992 - d.xl) / s, t: F.slide.t0 + F.slide.step * i };
      g.sh = document.createElement('div'); g.sh.className = 'fw fsh'; g.sh.textContent = d.text; g.sh.setAttribute('aria-hidden', 'true'); shLayer.appendChild(g.sh);
      const box = document.createElement('div'); box.className = 'fg'; box.setAttribute('aria-hidden', 'true'); ltLayer.appendChild(box);
      for (let k = F.layers; k >= 0; k--) {
        const e = document.createElement('div'); e.className = 'fw' + (k === 0 ? ' ffront' : ''); e.textContent = d.text;
        e.style.color = e.style.webkitTextStrokeColor = k === 0 ? rgb(face) : rgb(mixC(s0, s1, k / F.layers));
        if (k === 0) e.style.textShadow = `0 -4px 0 rgba(255,255,255,.55),0 0 7px ${rgb(face)}`;
        box.appendChild(e); g.ls[k] = e;
      }
      placeFloorGroup(g, g.span);
      floorGroups.push(g);
    });
  }
  // positions the slices and the floor shadow of a word; dx = sideways offset along the floor (ground px)
  function placeFloorGroup(g, dx) {
    const F = FLOOR, X0 = g.X0 + dx;
    for (let j = 0; j <= F.layers; j++) {                       // j = 0 is the front face
      const sk = F.F / (g.Dn + g.T * j / F.layers), sc = g.c * sk;
      g.ls[j].style.transform = `translate(${(SCR.x + X0 * sk).toFixed(3)}px,${(SCR.horizon + K_PERSP * sk).toFixed(3)}px) scale(${sc.toFixed(5)}) translate(0,${-floorBase}px)`;
    }
    const L = F.shadow.len * floorBase * g.c, lean = F.shadow.lean * floorBase * g.c, W = g.w * g.c;
    g.sh.style.transform = quadMatrix([groundPt(X0 + lean, g.Dn - L), groundPt(X0 + W + lean, g.Dn - L), groundPt(X0 + W, g.Dn), groundPt(X0, g.Dn)], g.w, floorBase);
    g.sh.style.opacity = 0.9;
  }
  function updateFloorText(p) {
    if (floorPortrait !== (vw < vh)) buildFloorText();
    for (const g of floorGroups) {
      const k = seg(p, g.t, g.t + FLOOR.slide.dur);
      if (k !== g.k) { g.k = k; placeFloorGroup(g, (1 - easeOut3(k)) * g.span); }
    }
  }

  /* ---------- viewport / framing ---------- */
  let vw = innerWidth, vh = innerHeight;
  function resize() {
    vw = stage.clientWidth; vh = stage.clientHeight;
    const portrait = vw < vh;
    // final shot: hand → character, desk centred
    const endCx = portrait ? 676 : 640, endCy = portrait ? 460 : 442;
    sWide = portrait ? vw / 650 : Math.max(Math.min(vw / 1180, vh / 600), vw / 1280);
    // wide, short windows: zoom out just enough that the open roof and a band of sky (world y ≈ 40) stay in view
    if (!portrait) sWide = Math.min(sWide, vh / (2 * (endCy - 40)));
    cam.cx[5][1] = cam.cx[6][1] = endCx;
    cam.cy[5][1] = cam.cy[6][1] = endCy;
    // opening shot: the left monitor's screen fills the view
    const sStart = Math.max(vw / 88, vh / 64);
    const sLand = sStart * 2.45 / 4.2;
    cam.ls = [[0, sStart], [T_LEAP, sStart * 3.7 / 4.2], [T_LAND, sLand], [0.68, Math.sqrt(sLand * sWide)], [T_WIDE, sWide], [1, sWide]]
      .map(([q, s]) => [q, Math.log(s)]);
  }
  addEventListener('resize', resize);

  /* ---------- state ---------- */
  const params = new URLSearchParams(location.search);
  // g = whole-page scroll progress. The intro story (p 0..1) uses the first Q_INTRO of it,
  // the ninja's run through the room (h 0..1) the rest.  ?p= / ?h= freeze either part for tuning.
  const Q_INTRO = 0.42;
  const frozen = params.has('h') ? Q_INTRO + clamp(parseFloat(params.get('h'))) * (1 - Q_INTRO)
               : params.has('p') ? clamp(parseFloat(params.get('p'))) * Q_INTRO : null;
  if (params.has('debug')) dbg.style.display = 'block';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let target = 0, g = frozen ?? 0, p = 0, h = 0, lastT = performance.now();

  // Jumps (the intro leap out of the monitor + every jump of the room run) in whole-page progress.
  // The playhead g chases the scroll, but it can never come to rest inside one of these: if the scroll
  // stops mid-jump, the jump finishes (or falls back) at its own speed — gravity, not scroll, decides.
  const JUMPS = [[T_LEAP * Q_INTRO, T_LAND * Q_INTRO],
    ...ROUTE.filter(r => r[2] === 'jump').map(r => [Q_INTRO + r[0] * (1 - Q_INTRO), Q_INTRO + r[1] * (1 - Q_INTRO)])];
  const JUMP_TIME = 0.6, LEAP_TIME = 1.1;   // seconds in the air (room jumps / intro leap)
  let speed = 0, moving = frozen !== null;    // moving = the scroll is still going (else: hold an idle pose)
  let scrollDir = 1;                          // direction the visitor last scrolled
  let travel = params.get('dir') === '-1' ? -1 : 1;   // direction the ninja last moved (−1 = scrolling back)
  function advance(dt) {
    const g0 = g;
    let goal = target;
    // scroll stopped inside a jump: land where the scroll was heading (forward → far side, back → take-off)
    for (const [a, b] of JUMPS) if (goal > a && goal < b) { goal = scrollDir > 0 ? b : a; break; }
    const d = Math.sign(goal - g);
    if (d) {
      const J = JUMPS.find(([a, b]) => d > 0 ? g >= a && g < b : g > a && g <= b);
      if (J) {                                   // airborne: fixed speed until the feet touch down
        g += d * (J[1] - J[0]) / (J === JUMPS[0] ? LEAP_TIME : JUMP_TIME) * dt;
        g = d > 0 ? Math.min(g, J[1], goal) : Math.max(g, J[0], goal);
      } else {                                   // on the ground: follow the scroll smoothly
        let ng = reduce ? goal : g + (goal - g) * (1 - Math.exp(-dt * 8));
        if (Math.abs(goal - ng) < 0.00002) ng = goal;
        for (const [a, b] of JUMPS) {            // stop at the take-off point; the jump then plays at its own speed
          if (d > 0 && g < a && ng > a) ng = a;
          if (d < 0 && g > b && ng < b) ng = b;
        }
        g = ng;
      }
    }
    if (Math.abs(g - g0) > 1e-9) travel = Math.sign(g - g0);
    speed += (Math.abs(g - g0) / Math.max(dt, 1e-3) - speed) * (1 - Math.exp(-dt * 10));
    moving = speed > (moving ? 0.003 : 0.006);   // hysteresis so the pose doesn't flicker
  }
  const readScroll = () => {
    const max = window.__page.L1 * stage.clientHeight;
    const nt = max > 0 ? clamp(scrollY / max) : 0;
    if (nt !== target) scrollDir = Math.sign(nt - target);
    target = nt;
  };
  addEventListener('scroll', readScroll, { passive: true });
  window.__setP = v => { g = target = clamp(v) * Q_INTRO; };
  window.__setH = v => { g = target = Q_INTRO + clamp(v) * (1 - Q_INTRO); };
  // debug: step the playhead n frames of dt seconds against the current scroll position
  window.__sim = (n, dt = 1 / 60) => { readScroll(); for (let i = 0; i < n; i++) advance(dt);
    p = snap(clamp(g / Q_INTRO)); h = snap(seg(g, Q_INTRO, 1));
    const hs = hopSegment(h), st = h > 0 ? hopPlace(hs, 0, updateCard(0, 0, hs)) : null;
    return { p: +p.toFixed(4), h: +h.toFixed(4), moving, travel, pose: st ? `${st.sheet}${st.flip < 0 ? '(mirrored)' : ''} (${Math.round(st.x)},${Math.round(st.y)})` : null }; };

  function setSprite(el, spec, i, x, y, s, rot, sy) {
    const col = i % CELL.cols, row = Math.floor(i / CELL.cols);
    el.style.backgroundPosition = `${-col * CELL.w}px ${-row * CELL.h}px`;
    el.style.transform =
      `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) rotate(${rot.toFixed(2)}deg) scale(${(s * spec.k).toFixed(4)},${(s * spec.k * sy).toFixed(4)}) translate(${-spec.fx}px,${-spec.fy}px)`;
  }
  const place = (el, cx, cy, w, h, sx = 1, sy = 1) =>
    el.style.transform = `translate(${(cx - w / 2).toFixed(1)}px,${(cy - h / 2).toFixed(1)}px) scale(${sx.toFixed(3)},${sy.toFixed(3)})`;

  /* ---------- render ---------- */
  function render(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    if (frozen === null) advance(dt);
    if (window.__page.V > stage.clientHeight + 40) { requestAnimationFrame(render); return; }   // the room has slid off screen
    p = snap(clamp(g / Q_INTRO));
    h = snap(seg(g, Q_INTRO, 1));
    const t = now / 1000;

    // --- ninja room run (needs the card pose, and feeds the camera) ---
    const hs = hopSegment(h);
    const pose = updateCard(dt, t, hs);
    const hop = h > 0 ? hopPlace(hs, t, pose) : null;

    // --- camera ---
    let cx = track(p, cam.cx), cy = track(p, cam.cy);
    let S = Math.exp(track(p, cam.ls)), roll = track(p, cam.roll);
    // during the run the camera only pans when the ninja would leave the frame
    const halfW = vw / (2 * S), halfH = vh / (2 * S);
    let fx = 0, fy = 0;
    if (hop) {
      const head = hop.y - NINJA_H * hop.F;
      fx = clamp(cx, hop.x + 70 - halfW, hop.x - 70 + halfW) - cx;
      fy = Math.max(Math.min(cy, head - 40 + halfH), hop.y + 40 - halfH) - cy;
    }
    const kf = 1 - Math.exp(-dt * 3.5);
    camFollow.x += (fx - camFollow.x) * kf; camFollow.y += (fy - camFollow.y) * kf;
    cx += camFollow.x; cy += camFollow.y;
    if (window.__cam) ({ cx, cy, S } = { cx, cy, S, ...window.__cam });   // debug: window.__cam = { cx, cy, S }
    const sh = bump(p, T_LAND - 0.002, T_LAND + 0.006, T_LAND + 0.05);
    const offX = Math.sin(t * 61) * 6 * sh + Math.sin(t * 0.45) * 2.5;   // landing shake + handheld drift (screen px)
    const offY = Math.cos(t * 53) * 8 * sh + Math.cos(t * 0.38) * 2;
    const layerT = (el, k) => {
      const Sk = sWide * (1 + (S / sWide - 1) * k);   // depth k > 1 = closer to camera
      el.style.transform = `translate3d(${(vw / 2 - cx * Sk + offX * k).toFixed(2)}px,${(vh / 2 - cy * Sk + offY * k).toFixed(2)}px,0) scale(${Sk.toFixed(5)})`;
    };
    layerT(Lroom, 1);
    layerT(Lfront, 1.15);
    camEl.style.transform = `rotate(${roll.toFixed(3)}deg)`;

    // --- ninja (rig units) ---
    let mode = 'idle', x, y, s, rot = 0, sy = 1, frame = 0, blur = 0, backSheet = null;
    const rev = travel < 0;   // scrolling back: the ninja runs back into the screen, back turned
    if (p < 0.004) {
      // waiting: idle on the screen
      x = SCR.x; s = SCR.sFar; y = SCR.yFar;
      frame = Math.floor(t * 12) % IDLE.n;
    } else if (p <= T_LEAP) {
      // running toward the viewer inside the screen (depth is linear → scale accelerates like real perspective)
      const u = seg(p, 0, T_LEAP);
      s = 1 / lerp(1 / SCR.sFar, 1 / SCR.sNear, u);
      y = SCR.horizon + K_PERSP * s;
      x = SCR.x + Math.sin(u * 15) * 7 * (1 - u * 0.5);
      frame = Math.floor((p / T_LEAP) * 5.5 * RUN.n) % RUN.n;
      mode = 'run';
      if (!moving) { mode = 'idle'; frame = Math.floor(t * 12) % IDLE.n; }   // scroll stopped: stand still
      if (rev) { backSheet = moving ? 'runU' : 'idleU'; frame = moving ? Math.floor((1 - p / T_LEAP) * 5.5 * 24) % 24 : Math.floor(t * 12) % 25; }
    } else if (p < T_LAND) {
      // the leap: arc out of the screen and onto the desk
      const v = seg(p, T_LEAP, T_LAND), e = ease(v), arc = Math.sin(Math.PI * v);
      const yIn = SCR.horizon + K_PERSP * SCR.sNear;
      x = lerp(SCR.x, DESK.x, e);
      y = lerp(yIn, DESK.y, e) - 60 * arc;
      s = lerp(SCR.sNear, DESK.s, e) + 0.18 * Math.pow(arc, 1.3);
      rot = -9 * arc * (1 - v * 0.6);
      frame = 3;
      blur = 2.0 * arc;
      mode = 'run';
      if (rev) { backSheet = 'runU'; frame = 6; rot = -rot; }
    } else {
      // landed: little squash, then idle
      const q = bump(p, T_LAND, T_LAND + 0.012, T_LAND + 0.045);
      x = DESK.x; y = DESK.y; s = DESK.s;
      sy = 1 - 0.10 * q;
      frame = Math.floor(t * 12) % IDLE.n;
    }

    if (backSheet) {   // back-facing pose (scrolling back); same figure height as the front-facing sprites
      sheetSprite(sprBack, backSheet, frame, x, y, 332 * s, rot, 1, sy);
      sprBack.style.display = 'block'; sprRun.style.opacity = 0; sprIdle.style.opacity = 0;
      sprBack.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
    } else {
      sprBack.style.display = 'none';
      if (mode === 'run') { setSprite(sprRun, RUN, frame, x, y, s, rot, sy); sprRun.style.opacity = 1; sprIdle.style.opacity = 0; }
      else { setSprite(sprIdle, IDLE, frame, x, y, s, rot, sy); sprIdle.style.opacity = 1; sprRun.style.opacity = 0; }
      (mode === 'run' ? sprRun : sprIdle).style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
    }
    if (hop) { sprRun.style.opacity = 0; sprIdle.style.opacity = 0; sprBack.style.display = 'none'; }
    sprRun.dataset.air = sprBack.dataset.air = p > T_LEAP + 0.004 && p < T_LAND ? '1' : '0';   // the leap out of the monitor (for the VFX layer)
    drawHop(hop);

    // shadow / aura follow the feet; during the leap the shadow waits on the desk
    const e = ease(seg(p, T_LEAP, T_LAND));
    const yNear = SCR.horizon + K_PERSP * SCR.sNear;
    const gy = p < T_LEAP ? y : lerp(yNear, DESK.y, e);
    const gs = p < T_LEAP ? s : lerp(SCR.sNear, DESK.s, e);
    place(shadow, x, gy + 2, 240, 56, gs * 1.5, gs * 1.4);
    shadow.style.opacity = p < T_LEAP ? 0.55 : lerp(0.35, 0.8, e);
    place(aura, x, y - 160 * s, 420, 420, s * 1.6 + 0.2, s * 1.6 + 0.2);
    aura.style.opacity = hop ? 0 : p < T_LAND ? 0.9 : 0.5;
    if (hop) shadow.style.opacity = 0;

    // portal ripple on the monitor at the moment of the jump
    const rp = seg(p, T_LEAP - 0.02, T_LEAP + 0.09);
    const rr = delay => { const k = clamp((rp - delay) / (1 - delay)); return [0.15 + 2.1 * Math.pow(k, 0.7), k > 0 && k < 1 ? (1 - k) * 0.9 : 0]; };
    const [r1, o1] = rr(0), [r2, o2] = rr(0.18);
    place(ring1, SCR.x, 640, 300, 230, r1, r1); ring1.style.opacity = o1;
    place(ring2, SCR.x, 640, 300, 230, r2, r2); ring2.style.opacity = o2;

    // landing dust ring on the desk
    const dk = seg(p, T_LAND, T_LAND + 0.06), dr = 0.3 + 1.3 * Math.pow(dk, 0.6);
    place(dust, DESK.x, DESK.y + 4, 300, 56, dr, dr);
    dust.style.opacity = dk > 0 && dk < 1 ? (1 - dk) * 0.85 : 0;

    // flash on exit
    flash.style.opacity = (0.85 * bump(p, T_LEAP - 0.012, T_LEAP + 0.006, T_LEAP + 0.05)).toFixed(3);

    // runway scrolls toward the viewer; keeps drifting slowly while idle
    updateGrid(p * 70 + t * 0.6);
    updateFloorText(p);

    // wind on the character + floating card (only once the room is in view)
    if (p > 0.55) drawWind(t);

    // ambient: speaker ring hue spin, caret blink
    spkRing.style.filter = `hue-rotate(${(t * 70) % 360}deg)`;
    caret.setAttribute('opacity', Math.floor(t * 2) % 2 ? 0 : 1);

    // UI
    hint.classList.toggle('off', g >= 0.005);
    // vignette/grain fade out at the end so the wall continues seamlessly into the board band below
    const edgeFade = (1 - ease(seg(p, 0.86, 1))).toFixed(3);
    vignette.style.opacity = edgeFade; grain.style.opacity = (0.06 * edgeFade).toFixed(3);
    barFill.style.height = (g * 100).toFixed(1) + '%';
    if (dbg.style.display === 'block') dbg.textContent = `${moving ? 'moving' : 'still'} p=${p.toFixed(3)} h=${h.toFixed(3)} S=${S.toFixed(2)} ${hop ? 'hop:' + hs.i + ' ' + hop.sheet : 'mode=' + mode}`;

    requestAnimationFrame(render);
  }

  resize(); readScroll();
  if (frozen === null) g = target;
  requestAnimationFrame(render);
})();
