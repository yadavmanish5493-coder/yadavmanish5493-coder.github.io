/* ---------- the handheld universe: a synthwave world below the building, and the cassette drop ----------
   Tapping a project cassette on the ring: the cassette pops off, the ninja leaps onto it, the page slides down
   to the handheld and the cassette slams into the cartridge slot (impact: quake, flash, rings, sparks, a ripple
   across the grid floor), then the screen boots with the project. Pressing the screen opens the details. */
(() => {
  const $ = id => document.getElementById(id);
  const hh = $('hhStage'), rig = $('hhRig'), shake = $('hhShake'), slot = $('hhSlot'), scr = $('hhScreen'), hNinja = $('hhNinja');
  const stage = $('stage');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const DPR = () => Math.min(2, devicePixelRatio || 1);
  // rig units (the art is 1728 x 843, placed 300 units down so the cartridge has room above it)
  const CART = { x: 865, bottom: 382, h: 262, ridge: 22 };   // cartridge in the slot (scale 1.6 of a ring cassette)
  const PERCH = { x: 455, y: 314 };                          // where the ninja waits: on the left index finger
  const NINJA_H = 170;

  /* ---------- layout ---------- */
  let rigS = 1, beamH = 60;
  function layout() {
    const w = hh.clientWidth, h = hh.clientHeight, portrait = w < h;
    beamH = clamp(h * 0.09, 46, 110);
    rigS = Math.min((portrait ? w * 1.4 : w * 0.98) / 1728, (h - beamH - 14) / 1143);
    rig.style.transform = `translateX(-50%) scale(${rigS.toFixed(5)})`;
    hh.style.setProperty('--beam', beamH.toFixed(1) + 'px');
    hh.style.setProperty('--hdrop', (h * .06).toFixed(1) + 'px');   // hands sit a little lower
    const geo = window.__wall && window.__wall.geo;
    if (geo) {
      hh.style.setProperty('--bl', Math.max(0, w / 2 - bayW() / 2).toFixed(1) + 'px');   // the game runs under the pillars: no gap
      const inner = Math.max(8, w / 2 - bayW() / 2 + geo.pw / 2 + 10);   // inside edge of the bay's pillars
      hh.style.setProperty('--gl', inner.toFixed(1) + 'px');
      hh.style.setProperty('--cx', inner.toFixed(1) + 'px');
      hh.style.setProperty('--cs', clamp(geo.pw * .84 / 250, .1, .5).toFixed(3));   // the parked cassette sits on the pillar, clear of the game's text
      hh.style.setProperty('--pc', (w / 2 - bayW() / 2).toFixed(1) + 'px');          // the bay's left pillar centre
    }
    sizeWorld(); buildFrame();
  }
  const rigToScreen = (x, y) => { const r = rig.getBoundingClientRect(), k = r.width / 1728; return [r.left + x * k, r.top + y * k]; };

  /* ---------- the frame: the building's lintel above, its two pillars carrying down ---------- */
  const bayW = () => { const w = hh.clientWidth; return w < hh.clientHeight ? w * .9 : w * .84; };
  function buildFrame() {
    const W = window.__wall, svg = $('hhFrame'); if (!W || !W.geo) return;
    svg.textContent = '';
    const w = hh.clientWidth, h = hh.clientHeight, { px, pw } = W.geo, [x0, y0] = W.colPos(hh);
    const defs = W.mk('defs', {}, svg); W.cylGrad(defs, 'hhCyl');
    const sh = W.mk('linearGradient', { id: 'hhSoffit', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    W.mk('stop', { offset: 0, 'stop-color': '#06021a', 'stop-opacity': .85 }, sh); W.mk('stop', { offset: 1, 'stop-color': '#06021a', 'stop-opacity': 0 }, sh);
    const clip = W.mk('clipPath', { id: 'hhBeamClip' }, defs); W.mk('rect', { x: 0, y: 0, width: w, height: beamH }, clip);   // the panel rows run past the beam: cut them so they don't hide the game's top bar
    W.panels(W.mk('g', { 'clip-path': 'url(#hhBeamClip)' }, svg), x0, y0, w, beamH, W.panelW(), false);
    W.mk('rect', { x: 0, y: beamH, width: w, height: 34, fill: 'url(#hhSoffit)' }, svg);
    W.mk('rect', { x: 0, y: beamH - 5, width: w, height: 5, fill: '#2a1f70' }, svg);
    W.neon(svg, [[px + pw * 1.4, beamH + 9], [w - px - pw * 1.4, beamH + 9]], Math.max(1.3, pw * .03));
    // a row of pillars, one between every two worlds; the row slides with the worlds (see the loop)
    const B = bayW(), n = window.__hhSlides || 10, row = W.mk('g', { id: 'hhPillars' }, svg);
    for (let k = 0; k <= n; k++) W.pillar(row, 'hhCyl', w / 2 + (k - .5) * B - pw / 2, pw, beamH, h + 4, { capital: true });
  }

  /* ---------- the world: a retro arcade universe (sunset, striped sun, wireframe hills, grid floor) ---------- */
  const cv = $('hhWorld'), g = cv.getContext('2d');
  let W = 0, H = 0, d = 1, flare = 0, gridBoost = 0;
  const ripples = [];
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const STARS = Array.from({ length: 110 }, () => ({ x: rnd(), y: rnd() * .55, r: .5 + rnd() * 1.3, ph: rnd() * 6.3, tw: .8 + rnd() * 2 }));
  const hills = n => Array.from({ length: n + 1 }, (_, i) => (i === 0 || i === n) ? .15 : .25 + rnd() * .75);
  const FAR = hills(14), NEAR = hills(9);
  const SHAPES = Array.from({ length: 6 }, (_, i) => ({ x: [.12, .86, .24, .74, .06, .93][i], y: [.16, .12, .34, .3, .44, .42][i], s: 14 + rnd() * 22,
    sp: (rnd() - .5) * .8, ph: rnd() * 6.3, col: i % 2 ? '61,224,255' : '255,75,224', k: .3 + rnd() * .5 }));
  function sizeWorld() { d = DPR(); W = cv.width = Math.round(hh.clientWidth * d); H = cv.height = Math.round(hh.clientHeight * d); }
  function ridge(pts, base, amp, off, fill, stroke) {
    const n = pts.length - 1, span = W * 1.3, x0 = -W * .15 + off;
    g.beginPath(); g.moveTo(x0, base);
    pts.forEach((v, i) => g.lineTo(x0 + span * i / n, base - v * amp));
    g.lineTo(x0 + span, base); g.closePath(); g.fillStyle = fill; g.fill();
    g.strokeStyle = stroke; g.lineWidth = 1.6 * d; g.stroke();
    g.globalAlpha = .35; g.beginPath();                      // wireframe: peaks down to the foot
    pts.forEach((v, i) => { const x = x0 + span * i / n; g.moveTo(x, base - v * amp); g.lineTo(x + (i % 2 ? 1 : -1) * span / n * .5, base); });
    g.stroke(); g.globalAlpha = 1;
  }
  let gridPhase = 0;
  function drawSynth(t, lag) {
    lag *= d;
    const hz = H * .55 + lag * .22;                          // the horizon settles as the section slides in
    const sky = g.createLinearGradient(0, 0, 0, hz);
    sky.addColorStop(0, '#04000f'); sky.addColorStop(.45, '#2a0754'); sky.addColorStop(.8, '#8a1470'); sky.addColorStop(1, '#ff6a3d');
    g.fillStyle = sky; g.fillRect(0, 0, W, hz + 1);
    for (const s of STARS) {
      const a = (.35 + .65 * (.5 + .5 * Math.sin(t * s.tw + s.ph))) * clamp(1 - s.y / .5);
      g.fillStyle = `rgba(255,235,255,${(a * .9).toFixed(3)})`; g.beginPath(); g.arc(s.x * W, s.y * H - lag * .05, s.r * d, 0, 6.2832); g.fill();
    }
    // the sun rises as you arrive; flares on impact
    const R = Math.min(W, H) * .2, sx = W / 2, sy = hz - R * .5 + lag * .45;
    const halo = g.createRadialGradient(sx, sy, R * .6, sx, sy, R * (2.4 + flare));
    halo.addColorStop(0, `rgba(255,90,170,${(.42 + flare * .4).toFixed(3)})`); halo.addColorStop(1, 'rgba(255,90,170,0)');
    g.fillStyle = halo; g.fillRect(0, 0, W, hz);
    g.save(); g.beginPath(); g.rect(0, 0, W, hz); g.clip();
    const sun = g.createLinearGradient(0, sy - R, 0, sy + R);
    sun.addColorStop(0, '#fff6a0'); sun.addColorStop(.45, '#ffb04a'); sun.addColorStop(1, '#ff3fa0');
    g.fillStyle = sun; g.beginPath(); g.arc(sx, sy, R, 0, 6.2832); g.fill();
    g.fillStyle = sky;                                       // the retro stripes cut through its lower half
    for (let i = 0; i < 7; i++) { const y = sy + R * (.08 + i * .14), hgt = R * (.02 + i * .018); g.fillRect(sx - R, y, R * 2, hgt); }
    g.restore();
    // floating wireframe shapes
    for (const s of SHAPES) {
      const x = s.x * W, y = s.y * H + Math.sin(t * .6 + s.ph) * 10 * d - lag * s.k * .4, a = t * s.sp + s.ph, r = s.s * d;
      g.strokeStyle = `rgba(${s.col},.75)`; g.lineWidth = 1.4 * d; g.beginPath();
      const p = [0, 1, 2].map(k => [x + Math.cos(a + k * 2.094) * r, y + Math.sin(a + k * 2.094) * r * .8]);
      g.moveTo(...p[0]); g.lineTo(...p[1]); g.lineTo(...p[2]); g.closePath(); g.moveTo(x, y - r * 1.3); p.forEach(q => { g.moveTo(x, y - r * 1.3); g.lineTo(...q); }); g.stroke();
    }
    ridge(FAR, hz + 1, H * .13, -lag * .1 + Math.sin(t * .05) * 8 * d, '#2a0a5a', 'rgba(255,75,224,.8)');
    ridge(NEAR, hz + 1, H * .08, -lag * .25 - W * .05, '#150330', 'rgba(61,224,255,.8)');
    // grid floor
    const fl = g.createLinearGradient(0, hz, 0, H);
    fl.addColorStop(0, '#2a0050'); fl.addColorStop(1, '#07000f');
    g.fillStyle = fl; g.fillRect(0, hz, W, H - hz);
    g.save(); g.beginPath(); g.rect(0, hz, W, H - hz); g.clip();
    const fh = H - hz;
    for (let j = 0; j < 16; j++) {                           // rows rushing toward the viewer
      const p = (j + gridPhase) / 16, y = hz + fh * Math.pow(p, 2.3), a = .15 + .7 * p;
      g.strokeStyle = `rgba(255,75,224,${(a * .35).toFixed(3)})`; g.lineWidth = (4 + 6 * p) * d; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
      g.strokeStyle = `rgba(255,160,240,${a.toFixed(3)})`; g.lineWidth = (1 + 1.4 * p) * d; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
    }
    g.strokeStyle = 'rgba(255,110,230,.55)'; g.lineWidth = 1.3 * d; g.beginPath();
    for (let i = -14; i <= 14; i++) { g.moveTo(W / 2 + i * W * .018, hz); g.lineTo(W / 2 + i * W * .2, H); }
    g.stroke();
    for (const q of ripples) {                                // impact ripple across the floor (pruned in the loop)
      const k = (t - q.t0) / 1.4;
      if (k < 0 || k >= 1) continue;
      const rx = W * (.05 + k * .8), cy = hz + fh * .62;
      g.strokeStyle = `rgba(159,243,255,${(.9 * (1 - k)).toFixed(3)})`; g.lineWidth = (3 - 2 * k) * d;
      g.beginPath(); g.ellipse(W / 2, cy, rx, rx * .16, 0, 0, 6.2832); g.stroke();
    }
    g.restore();
    const hl = g.createLinearGradient(0, hz - 6 * d, 0, hz + 6 * d);
    hl.addColorStop(0, 'rgba(255,200,240,0)'); hl.addColorStop(.5, `rgba(255,200,240,${(.8 + flare * .2).toFixed(3)})`); hl.addColorStop(1, 'rgba(255,200,240,0)');
    g.fillStyle = hl; g.fillRect(0, hz - 6 * d, W, 12 * d);
    const vg = g.createRadialGradient(W / 2, H * .55, Math.min(W, H) * .4, W / 2, H * .55, Math.max(W, H) * .8);
    vg.addColorStop(0, 'rgba(4,0,15,0)'); vg.addColorStop(1, 'rgba(4,0,15,.65)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }

  /* ---------- SPACEX world: Earth from orbit, the Moon, rockets climbing past, stars streaming down ---------- */
  const SXSTARS = Array.from({ length: 170 }, () => ({ x: rnd(), y: rnd(), r: .4 + rnd() * 1.6, k: .2 + rnd() * .8, ph: rnd() * 6.3 }));
  const LAND = Array.from({ length: 9 }, (_, i) => ({ a: i / 9 * 6.283 + rnd() * .4, w: .18 + rnd() * .28, h: .05 + rnd() * .07 }));
  const ROCKETS = Array.from({ length: 4 }, (_, i) => ({ x: [.2, .78, .4, .63][i], per: 7 + i * 1.9, ph: rnd() * 10, s: .7 + rnd() * .5 }));
  function rocket(x, y, s, t) {
    g.save(); g.translate(x, y); g.scale(s * d, s * d);
    const fl = 14 + Math.sin(t * 40) * 4;                    // flame
    const fg = g.createLinearGradient(0, 18, 0, 18 + fl * 2);
    fg.addColorStop(0, '#fff6c0'); fg.addColorStop(.4, '#ffb04a'); fg.addColorStop(1, 'rgba(255,60,120,0)');
    g.fillStyle = fg; g.beginPath(); g.moveTo(-6, 18); g.quadraticCurveTo(0, 18 + fl * 2.4, 6, 18); g.fill();
    g.fillStyle = '#ff4b6e'; g.strokeStyle = '#12052b'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(-8, 6); g.lineTo(-15, 20); g.lineTo(-7, 18); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(8, 6); g.lineTo(15, 20); g.lineTo(7, 18); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#f3f0ff'; g.beginPath(); g.moveTo(0, -26); g.quadraticCurveTo(11, -10, 8, 18); g.lineTo(-8, 18); g.quadraticCurveTo(-11, -10, 0, -26); g.fill(); g.stroke();
    g.fillStyle = '#3de0ff'; g.beginPath(); g.arc(0, -6, 4.5, 0, 6.283); g.fill(); g.stroke();
    g.restore();
  }
  function drawSpacex(t, lag) {
    lag *= d;
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#01020c'); sky.addColorStop(.55, '#06123a'); sky.addColorStop(1, '#0d2a6e');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    const neb = (x, y, r, c, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
    neb(W * .2, H * .25, W * .35, '60,120,255', .16); neb(W * .82, H * .2, W * .3, '120,80,255', .14); neb(W * .6, H * .45, W * .25, '40,200,220', .08);
    for (const st of SXSTARS) {                              // streaming down: we are climbing
      const y = ((st.y * H + t * 40 * st.k * d - lag * .3 * st.k) % H + H) % H, a = .45 + .55 * Math.sin(t * 2 + st.ph);
      g.fillStyle = `rgba(230,240,255,${(a * .9).toFixed(3)})`; g.fillRect(st.x * W, y, st.r * d, st.r * d * (1 + st.k * 2));
    }
    // the Moon
    const mr = Math.min(W, H) * .07, mx = W * .82, my = H * .2 - lag * .15;
    neb(mx, my, mr * 2.6, '200,220,255', .12);
    const mg = g.createRadialGradient(mx - mr * .4, my - mr * .4, mr * .1, mx, my, mr);
    mg.addColorStop(0, '#f4f2ff'); mg.addColorStop(1, '#9a98c8'); g.fillStyle = mg; g.beginPath(); g.arc(mx, my, mr, 0, 6.283); g.fill();
    g.fillStyle = 'rgba(110,105,160,.45)';
    [[-.3, -.2, .22], [.25, .15, .16], [-.1, .35, .12], [.35, -.3, .1]].forEach(([a, b, r]) => { g.beginPath(); g.arc(mx + a * mr, my + b * mr, r * mr, 0, 6.283); g.fill(); });
    // a ringed planet, far away
    const px = W * .14, py = H * .32 - lag * .1, pr = Math.min(W, H) * .045;
    g.strokeStyle = 'rgba(255,200,140,.55)'; g.lineWidth = 2 * d; g.beginPath(); g.ellipse(px, py, pr * 2, pr * .55, -.35, 0, 6.283); g.stroke();
    g.fillStyle = '#d98a5a'; g.beginPath(); g.arc(px, py, pr, 0, 6.283); g.fill();
    // Earth: a huge curve along the bottom
    const er = Math.max(W, H) * 1.1, ex = W / 2, ey = H * .78 + er + lag * .35;
    neb(ex, ey - er, W * .9, '80,200,255', .22 + flare * .3);
    g.save(); g.beginPath(); g.arc(ex, ey, er, 0, 6.283); g.clip();
    const eg = g.createLinearGradient(0, ey - er, 0, ey - er + H * .4);
    eg.addColorStop(0, '#3aa0ff'); eg.addColorStop(1, '#0a2a7a'); g.fillStyle = eg; g.fillRect(0, ey - er, W, H);
    for (const L of LAND) {                                   // continents drifting by as it turns
      const lx = ((L.a / 6.283 + t * .006) % 1) * W * 1.6 - W * .3, ly = ey - er + H * (.05 + L.h);
      g.fillStyle = 'rgba(70,190,120,.85)'; g.beginPath(); g.ellipse(lx, ly, W * L.w * .5, H * L.h, .2, 0, 6.283); g.fill();
    }
    g.fillStyle = 'rgba(255,255,255,.35)';                    // cloud bands
    for (let i = 0; i < 5; i++) { const cx = ((i * .23 + t * .01) % 1) * W * 1.4 - W * .2; g.beginPath(); g.ellipse(cx, ey - er + H * (.04 + i * .025), W * .14, H * .008, 0, 0, 6.283); g.fill(); }
    g.restore();
    g.strokeStyle = `rgba(150,230,255,${(.8 + flare * .2).toFixed(3)})`; g.lineWidth = (3 + flare * 4) * d;   // atmosphere rim
    g.beginPath(); g.arc(ex, ey, er + 2 * d, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    // orbit lanes + impact ripples around the planet
    g.setLineDash([6 * d, 10 * d]); g.strokeStyle = 'rgba(159,243,255,.25)'; g.lineWidth = 1.2 * d;
    for (const k of [1.06, 1.14]) { g.beginPath(); g.ellipse(ex, ey - er * .02, er * k * .55, er * (k - .9), 0, Math.PI, 2 * Math.PI); g.stroke(); }
    g.setLineDash([]);
    for (const q of ripples) {
      const k = (t - q.t0) / 1.4; if (k < 0 || k >= 1) continue;
      g.strokeStyle = `rgba(159,243,255,${(.9 * (1 - k)).toFixed(3)})`; g.lineWidth = (3 - 2 * k) * d;
      g.beginPath(); g.arc(ex, ey, er + k * H * .5, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    }
    // rockets climbing out of the atmosphere, with smoke
    for (const R of ROCKETS) {
      const k = ((t + R.ph) % R.per) / R.per, x = R.x * W + Math.sin(k * 3) * 10 * d, y = H * (.95 - k * 1.2);
      for (let i = 1; i < 10; i++) { g.fillStyle = `rgba(220,225,255,${(.18 * (1 - i / 10)).toFixed(3)})`; g.beginPath(); g.arc(x, y + (26 + i * 14) * R.s * d, (5 + i * 2) * R.s * d, 0, 6.283); g.fill(); }
      rocket(x, y, R.s, t);
    }
    const vg = g.createRadialGradient(W / 2, H * .5, Math.min(W, H) * .4, W / 2, H * .5, Math.max(W, H) * .8);
    vg.addColorStop(0, 'rgba(1,2,12,0)'); vg.addColorStop(1, 'rgba(1,2,12,.6)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  /* ---------- UNICEF world: Project Play. A sunny cardboard playground, RUTF boxes, Boxy hopping, toys and coins floating by ---------- */
  const UCLOUDS = Array.from({ length: 6 }, (_, i) => ({ x: i / 6 + rnd() * .08, y: .1 + rnd() * .3, s: .6 + rnd() * .7, v: .004 + rnd() * .006 }));
  const UCOINS = Array.from({ length: 7 }, (_, i) => ({ x: .12 + i * .125, ph: rnd() * 6.3 }));
  function kraftBox(x, y, w, h, band) {                       // a cardboard box standing on y, with flaps and an optional blue band
    g.fillStyle = '#c99a62'; g.strokeStyle = '#7d5428'; g.lineWidth = 2.5 * d;
    g.beginPath(); g.roundRect(x - w / 2, y - h, w, h, 4 * d); g.fill(); g.stroke();
    g.fillStyle = '#e2c290'; g.beginPath(); g.moveTo(x - w / 2, y - h); g.lineTo(x - w / 2 - w * .1, y - h - h * .22); g.lineTo(x - w * .04, y - h - h * .22); g.lineTo(x, y - h); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x + w / 2, y - h); g.lineTo(x + w / 2 + w * .1, y - h - h * .2); g.lineTo(x + w * .04, y - h - h * .22); g.lineTo(x, y - h); g.fill(); g.stroke();
    if (band) { g.fillStyle = '#1cabe2'; g.fillRect(x - w * .3, y - h * .42, w * .6, h * .2); }
  }
  function drawUnicef(t, lag) {
    lag *= d;
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#7ec8ee'); sky.addColorStop(1, '#e9f7fb');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    const sr = Math.min(W, H) * .09, sx = W * .8, sy = H * .2 - lag * .1;                  // sun
    const halo = g.createRadialGradient(sx, sy, sr * .5, sx, sy, sr * 3.2); halo.addColorStop(0, 'rgba(255,236,150,.7)'); halo.addColorStop(1, 'rgba(255,236,150,0)');
    g.fillStyle = halo; g.fillRect(sx - sr * 3.2, sy - sr * 3.2, sr * 6.4, sr * 6.4);
    g.fillStyle = '#ffe27a'; g.beginPath(); g.arc(sx, sy, sr, 0, 6.2832); g.fill();
    g.fillStyle = 'rgba(255,255,255,.92)';                                                 // clouds drifting by
    for (const c of UCLOUDS) {
      const cx = (((c.x + t * c.v) % 1.3) - .15) * W - lag * .2 * c.s, cy = c.y * H, r = Math.min(W, H) * .045 * c.s;
      g.beginPath(); g.arc(cx, cy, r, 0, 6.2832); g.arc(cx + r * 1.1, cy - r * .35, r * 1.2, 0, 6.2832); g.arc(cx + r * 2.3, cy, r * .95, 0, 6.2832); g.rect(cx, cy, r * 2.3, r * .95); g.fill();
    }
    const gh = H * .17, gy = H - gh;                                                      // cardboard ground
    const gg = g.createLinearGradient(0, gy, 0, H); gg.addColorStop(0, '#d9ad72'); gg.addColorStop(1, '#a8773f');
    g.fillStyle = gg; g.fillRect(0, gy, W, gh);
    g.strokeStyle = 'rgba(125,84,40,.55)'; g.lineWidth = 2 * d;
    g.beginPath(); g.moveTo(0, gy); g.lineTo(W, gy); g.stroke();
    g.setLineDash([14 * d, 12 * d]); g.lineDashOffset = -(t * 26 * d) + lag * .3;
    g.beginPath(); g.moveTo(0, gy + gh * .5); g.lineTo(W, gy + gh * .5); g.stroke(); g.setLineDash([]); g.lineDashOffset = 0;
    const bw = Math.min(W, H) * .17;                                                       // RUTF boxes, and Boxy hopping between them
    kraftBox(W * .72, gy, bw * 1.15, bw * 1.0, true); kraftBox(W * .72 + bw * .25, gy - bw, bw * .8, bw * .7, true); kraftBox(W * .9, gy, bw * .9, bw * .8, true);
    const hp = (t % 2.6) / 2.6, hop = hp < .45 ? Math.sin(hp / .45 * Math.PI) : 0, bx = W * (.2 + .22 * ((t / 5.2) % 1));
    kraftBox(bx, gy - hop * bw * .9, bw * .6, bw * .62, false);
    const fy = gy - hop * bw * .9 - bw * .36; g.fillStyle = '#3a2817'; g.beginPath(); g.arc(bx - bw * .1, fy, 3 * d, 0, 6.2832); g.arc(bx + bw * .1, fy, 3 * d, 0, 6.2832); g.fill();
    g.strokeStyle = '#3a2817'; g.lineWidth = 2 * d; g.beginPath(); g.arc(bx, fy + 4 * d, 5 * d, .15, Math.PI - .15); g.stroke();
    const tr = Math.min(W, H) * .06;                                                       // toys floating in the air: play-r-ings, a tunnel, a skittle
    [['#e8604c', .3, .3, 0], ['#f2b31b', .34, .27, 1.3], ['#1cabe2', .38, .31, 2.6]].forEach(([c, x, y, ph]) => {
      g.strokeStyle = c; g.lineWidth = tr * .3; g.beginPath(); g.arc(W * x, H * y + Math.sin(t * 1.4 + ph) * 6 * d - lag * .15, tr * .6, 0, 6.2832); g.stroke();
    });
    const ty = H * .5 + Math.sin(t * 1.1) * 7 * d - lag * .2;
    g.strokeStyle = '#7cb342'; g.lineWidth = tr * .34; g.beginPath(); g.arc(W * .52, ty, tr * .8, Math.PI, 0); g.stroke();
    g.fillStyle = '#e57fa6'; g.beginPath(); g.roundRect(W * .56, ty - tr * .5, tr * .55, tr * 1.3, tr * .2); g.fill();
    for (const c of UCOINS) {                                                              // coins to collect
      const cx = c.x * W, cy = gy - bw * 1.35 - Math.sin(t * 2 + c.ph) * 7 * d - lag * .1, sq = Math.abs(Math.cos(t * 1.6 + c.ph));
      g.fillStyle = '#f2b31b'; g.beginPath(); g.ellipse(cx, cy, 9 * d * (.35 + .65 * sq), 9 * d, 0, 0, 6.2832); g.fill();
    }
  }
  /* ---------- UNBOX world: a comic-book box lid. Sunburst rays, floating cards, lightning bolts and a board where a card slams into a slot ---------- */
  const UBCOL = ['#7a3cff', '#e8374c', '#2d8cff', '#2fb870', '#ff7b2c', '#ff4f9a', '#14a3ad', '#d99a00'];
  const UBCARDS = Array.from({ length: 8 }, (_, i) => ({ x: [.1, .86, .2, .78, .06, .92, .34, .66][i], y: [.18, .22, .46, .5, .72, .76, .1, .12][i], r: (rnd() - .5) * .6, s: .8 + rnd() * .4, ph: rnd() * 6.3, c: UBCOL[i] }));
  let UBDOTS = null;
  function bolt(x, y, s, rot) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s * d, s * d);
    g.fillStyle = '#ffd21f'; g.strokeStyle = '#1b1650'; g.lineWidth = 3; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(14, -30); g.lineTo(-6, 4); g.lineTo(7, 4); g.lineTo(0, 30); g.lineTo(26, -8); g.lineTo(12, -8); g.closePath(); g.fill(); g.stroke(); g.restore();
  }
  function drawUnbox(t, lag) {
    lag *= d;
    g.fillStyle = '#ffc800'; g.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H * .6 - lag * .1, n = 24, R = Math.hypot(W, H);                  // sunburst rays, turning slowly
    g.fillStyle = '#ffdb3a';
    for (let i = 0; i < n; i += 2) { const a0 = t * .04 + i / n * 6.2832, a1 = a0 + 6.2832 / n; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R); g.lineTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R); g.fill(); }
    if (!UBDOTS) { const c = document.createElement('canvas'); c.width = c.height = 12; const x = c.getContext('2d'); x.fillStyle = 'rgba(150,70,0,.2)'; x.beginPath(); x.arc(3, 3, 1.5, 0, 6.2832); x.fill(); UBDOTS = g.createPattern(c, 'repeat'); }
    g.fillStyle = UBDOTS; g.fillRect(0, 0, W, H);                                            // halftone print dots
    const vg = g.createRadialGradient(cx, cy, Math.min(W, H) * .3, cx, cy, Math.max(W, H) * .75); vg.addColorStop(0, 'rgba(120,40,0,0)'); vg.addColorStop(1, 'rgba(120,40,0,.3)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    // the board along the bottom: nine slots, and a card slamming into one of them
    const bw = Math.min(W * .86, H * 1.3), bh = bw * .36, bx = cx - bw / 2, by = H - bh * .8 + lag * .3;
    g.fillStyle = '#1d5e55'; g.strokeStyle = '#1b1650'; g.lineWidth = 4 * d; g.beginPath(); g.roundRect(bx, by, bw, bh * 1.2, 10 * d); g.fill(); g.stroke();
    g.strokeStyle = '#ffd21f'; g.lineWidth = 3 * d; g.beginPath(); g.roundRect(bx + 5 * d, by + 5 * d, bw - 10 * d, bh * 1.2 - 10 * d, 7 * d); g.stroke();
    const sw = bw * .27, sh = bh * .36, k = Math.floor(t / 1.6) % 9, ph = (t % 1.6) / 1.6;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const sx = bx + bw * .06 + c * (sw + bw * .035), sy = by + bh * .1 + r * (sh + bh * .06), idx = r * 3 + c, done = idx < k;
      g.setLineDash(done ? [] : [6 * d, 5 * d]); g.strokeStyle = done ? '#1b1650' : 'rgba(255,255,255,.55)'; g.lineWidth = 2 * d;
      g.fillStyle = done ? UBCOL[idx % 8] : 'rgba(0,0,0,.25)'; g.beginPath(); g.roundRect(sx, sy, sw, sh, 5 * d); g.fill(); g.stroke(); g.setLineDash([]);
      if (done) { g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(sx + sw * .1, sy + sh * .22, sw * .8, sh * .14); g.fillRect(sx + sw * .1, sy + sh * .5, sw * .55, sh * .12); }
      if (idx === k) {                                                                      // the card dropping in
        const e = Math.min(1, ph / .35), yy = sy - (1 - e * e) * H * .5, sc = 1 + (1 - e) * .5;
        g.save(); g.translate(sx + sw / 2, yy + sh / 2); g.scale(sc, sc); g.rotate((1 - e) * .5);
        g.fillStyle = UBCOL[idx % 8]; g.strokeStyle = '#1b1650'; g.lineWidth = 2.5 * d; g.beginPath(); g.roundRect(-sw / 2, -sh / 2, sw, sh, 5 * d); g.fill(); g.stroke(); g.restore();
        if (ph > .35 && ph < .6) { g.strokeStyle = `rgba(27,22,80,${(1 - (ph - .35) / .25).toFixed(3)})`; g.lineWidth = 3 * d; g.beginPath(); g.arc(sx + sw / 2, sy + sh / 2, (ph - .35) / .25 * sw * .7, 0, 6.2832); g.stroke(); }
      }
    }
    for (const c of UBCARDS) {                                                              // cards floating around
      const w = Math.min(W, H) * .1 * c.s, h = w * 1.35, x = c.x * W - lag * .25 * c.s, y = c.y * H + Math.sin(t * 1.2 + c.ph) * 8 * d - lag * .15;
      g.save(); g.translate(x, y); g.rotate(c.r + Math.sin(t * .8 + c.ph) * .08);
      g.fillStyle = 'rgba(80,30,0,.25)'; g.beginPath(); g.roundRect(-w / 2 + 4 * d, -h / 2 + 5 * d, w, h, 6 * d); g.fill();
      g.fillStyle = c.c; g.strokeStyle = '#1b1650'; g.lineWidth = 3 * d; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 6 * d); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(-w * .38, -h * .38, w * .76, h * .36); g.fillRect(-w * .38, h * .1, w * .6, h * .07); g.fillRect(-w * .38, h * .24, w * .45, h * .07);
      g.restore();
    }
    bolt(W * .16, H * .1 - lag * .1, 1.5, -.3); bolt(W * .86, H * .56, 1.2, .35);
    g.save(); g.translate(cx, H * .2 - lag * .12); g.rotate(-.05); g.textAlign = 'center'; g.textBaseline = 'middle';             // the logo
    g.font = `${Math.min(W * .22, H * .14)}px Bangers, Impact, sans-serif`; g.lineJoin = 'round';
    g.fillStyle = '#e8374c'; g.strokeStyle = '#1b1650'; g.lineWidth = Math.min(W, H) * .02; g.strokeText('Unbox', 5 * d, 7 * d); g.fillText('Unbox', 5 * d, 7 * d);
    g.fillStyle = '#ffd21f'; g.strokeText('Unbox', 0, 0); g.fillText('Unbox', 0, 0); g.restore();
  }
  function drawTabletop(t, lag) {
    lag *= d;
    const cx = W / 2, hz = H * .3, TC = ['#ff6b6b', '#ff9f43', '#ffd43b', '#51cf66', '#3bc9db', '#9775fa'];
    const wall = g.createLinearGradient(0, 0, 0, hz); wall.addColorStop(0, '#1e1008'); wall.addColorStop(1, '#4a2a14'); g.fillStyle = wall; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 8; k++) {                                                            // table planks, wider towards the viewer
      const y0 = hz + (H - hz) * Math.pow(k / 8, 1.5), y1 = hz + (H - hz) * Math.pow((k + 1) / 8, 1.5);
      g.fillStyle = ['#8a5028', '#7c4521', '#905a2e'][k % 3]; g.fillRect(0, y0, W, y1 - y0 + 1); g.fillStyle = 'rgba(30,12,2,.5)'; g.fillRect(0, y1, W, 2 * d);
    }
    const rows = 4, cols = 8, yT = H * .46 - lag * .08, yB = H * .94 - lag * .08;
    for (let r = 0; r < rows; r++) {                                                         // a tilted board of number tiles that hop in a wave
      const f0 = r / rows, f1 = (r + 1) / rows, ya = lerp3(yT, yB, f0), yb = lerp3(yT, yB, f1), wa = W * (.5 + f0 * .42), wb = W * (.5 + f1 * .42);
      for (let c = 0; c < cols; c++) {
        const n = (r * cols + c) % 29 + 1, up = Math.max(0, Math.sin(t * 2.4 - c * .6 - r * .9)) * 12 * d * (.5 + f1);
        const xa = cx - wa / 2 + wa * c / cols, xa2 = cx - wa / 2 + wa * (c + 1) / cols, xb = cx - wb / 2 + wb * c / cols, xb2 = cx - wb / 2 + wb * (c + 1) / cols;
        const col = TC[n % 6]; g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.moveTo(xa + 4 * d, ya); g.lineTo(xa2 + 4 * d, ya); g.lineTo(xb2 + 6 * d, yb + 6 * d); g.lineTo(xb + 6 * d, yb + 6 * d); g.fill();
        g.fillStyle = col; g.strokeStyle = '#2a1608'; g.lineWidth = 2 * d; g.beginPath(); g.moveTo(xa + 2, ya - up); g.lineTo(xa2 - 2, ya - up); g.lineTo(xb2 - 2, yb - up); g.lineTo(xb + 2, yb - up); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.moveTo(xb + 2, yb - up); g.lineTo(xb2 - 2, yb - up); g.lineTo(xb2 - 2, yb - up + 7 * d * (.5 + f1)); g.lineTo(xb + 2, yb - up + 7 * d * (.5 + f1)); g.fill();
        g.fillStyle = '#2a1608'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${(yb - ya) * .62}px Bangers, Impact, sans-serif`; g.fillText(n, (xa + xa2 + xb + xb2) / 4, (ya + yb) / 2 - up);
      }
    }
    const nums = ['×', '7×8=56', '9×6', '12', '×', '4×7', '81', '6×6=36', '×', '3×9'];
    g.textAlign = 'center'; g.fillStyle = 'rgba(255,243,214,.3)';
    for (let i = 0; i < 12; i++) { const s = Math.min(W, H) * (.05 + (i % 4) * .012), x = ((i * 137) % 100) / 100 * W - lag * .2 * (1 + i % 3 * .3), y = ((i * 61) % 38 + 4) / 100 * H + Math.sin(t * .9 + i) * 8 * d; g.font = `${s}px Bangers, Impact, sans-serif`; g.fillText(nums[i % nums.length], x, y); }
    g.save(); g.translate(cx, H * .2 - lag * .12); g.rotate(-.05); g.textAlign = 'center'; g.textBaseline = 'middle';          // the logo
    g.font = `${Math.min(W * .17, H * .13)}px Bangers, Impact, sans-serif`; g.lineJoin = 'round'; g.lineWidth = Math.min(W, H) * .02;
    g.fillStyle = '#2a1608'; g.strokeStyle = '#2a1608'; g.strokeText('TABLE TOP', 4 * d, 8 * d); g.fillText('TABLE TOP', 4 * d, 8 * d);
    g.fillStyle = '#ffd43b'; g.strokeText('TABLE TOP', 0, 0); g.fillText('TABLE TOP', 0, 0); g.restore();
  }
  function drawEwaste(t, lag) {
    lag *= d;
    g.fillStyle = '#ece9e2'; g.fillRect(0, 0, W, H);                                         // paper, like the giga map
    g.fillStyle = '#d6d2c8'; const gs = 38 * d; for (let y = gs / 2; y < H; y += gs) for (let x = gs / 2 - (lag * .1 % gs); x < W; x += gs) { g.beginPath(); g.arc(x, y, 1.6 * d, 0, 6.2832); g.fill(); }
    const lanes = [['#93a4ab', .2], ['#e04b2c', .46], ['#31b5d6', .72]], s = Math.min(W, H) * .045;
    lanes.forEach(([col, fy], li) => {                                                       // the map's flow arrows: grey start, red understanding, cyan solution
      for (let i = 0; i < 9; i++) {
        const u = (t * .06 + i / 9 + li * .11) % 1, x = u * (W + 240 * d) - 120 * d - lag * .15, y = H * fy + Math.sin(u * 6.2832 + li * 2) * H * .06 - lag * .05, a = Math.cos(u * 6.2832 + li * 2) * .35;
        g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s); g.fillStyle = col; g.beginPath();
        g.moveTo(-1, -.3); g.lineTo(.3, -.3); g.lineTo(.3, -.8); g.lineTo(1.4, 0); g.lineTo(.3, .8); g.lineTo(.3, .3); g.lineTo(-1, .3); g.lineTo(-.7, 0); g.closePath(); g.fill(); g.restore();
      }
    });
    for (let i = 0; i < 6; i++) {                                                            // old phones drifting through
      const w = Math.min(W, H) * .07, x = ((i * 173 + 40) % 100) / 100 * W - lag * .25, y = (.12 + (i * 37 % 60) / 100) * H + Math.sin(t * 1.1 + i) * 10 * d;
      g.save(); g.translate(x, y); g.rotate(Math.sin(t * .7 + i) * .4); g.fillStyle = '#2a2623'; g.beginPath(); g.roundRect(-w / 2, -w * .85, w, w * 1.7, w * .14); g.fill();
      g.fillStyle = '#bfeaf2'; g.fillRect(-w * .42, -w * .72, w * .84, w * 1.3); g.strokeStyle = '#2a2623'; g.lineWidth = 2 * d; g.beginPath(); g.moveTo(w * .25, -w * .72); g.lineTo(0, -w * .1); g.lineTo(w * .2, w * .2); g.stroke(); g.restore();
    }
    g.fillStyle = '#3a3d40'; g.beginPath(); g.moveTo(0, H);                                  // the heap at the bottom
    for (let x = 0; x <= W; x += W / 24) g.lineTo(x, H * .9 - Math.abs(Math.sin(x / W * 9 + 1)) * H * .07 - lag * .04);
    g.lineTo(W, H); g.closePath(); g.fill();
    for (let i = 0; i < 40; i++) { g.fillStyle = ['#2c6b46', '#8a8f93', '#a7752f', '#5b6063'][i % 4]; g.fillRect(((i * 97) % 100) / 100 * W, H * (.93 + (i * 13 % 6) / 100), 9 * d, 5 * d); }
    g.save(); g.translate(W / 2, H * .5); g.rotate(-.04); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.font = `800 ${Math.min(W * .16, H * .13)}px Poppins, Arial Black, sans-serif`; g.fillStyle = '#2a2623'; g.fillText('E-WASTE', 0, 0);
    g.font = `800 ${Math.min(W * .075, H * .06)}px Poppins, Arial Black, sans-serif`; g.fillStyle = '#e04b2c'; g.fillText('THE JOURNEY', 0, Math.min(W * .1, H * .085)); g.restore();
  }
  function drawAr(t, lag) {
    lag *= d;
    const hz = H * .58, cx = W / 2;
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#040712'); sky.addColorStop(.6, '#0a1a3a'); sky.addColorStop(1, '#07102a'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) { const a = .3 + .7 * Math.abs(Math.sin(t * (.5 + i % 5 * .3) + i)); g.fillStyle = `rgba(190,245,255,${a * .7})`; g.fillRect(((i * 211) % 100) / 100 * W - lag * .15, ((i * 67) % 70) / 100 * H, (1 + i % 3) * d, (1 + i % 3) * d); }
    g.strokeStyle = 'rgba(53,224,255,.28)'; g.lineWidth = d;                                 // perspective floor grid
    g.beginPath(); for (let i = -12; i <= 12; i++) { g.moveTo(cx + i * W * .012 - lag * .1, hz); g.lineTo(cx + i * W * .17 - lag * .1, H); } g.stroke();
    for (let k = 0; k < 12; k++) { const f = (k + (t * .25 % 1)) / 12, y = hz + (H - hz) * f * f; g.globalAlpha = .15 + f * .5; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } g.globalAlpha = 1;
    const ph = H * .5, pw = ph * .476, px = cx - pw / 2 - lag * .2, py = H * .08;               // a phone in the middle with a tracked cube hovering over its screen
    g.fillStyle = 'rgba(53,224,255,.12)'; g.beginPath(); g.ellipse(cx - lag * .2, py + ph + 6 * d, pw * .7, 9 * d, 0, 0, 6.2832); g.fill();
    g.fillStyle = '#10182c'; g.strokeStyle = '#4e638c'; g.lineWidth = 2 * d; g.beginPath(); g.roundRect(px, py, pw, ph, pw * .14); g.fill(); g.stroke();
    g.fillStyle = '#0a2a4a'; g.beginPath(); g.roundRect(px + pw * .04, py + pw * .04, pw * .92, ph - pw * .08, pw * .11); g.fill();
    const cs = pw * .2, ccx = cx - lag * .2, ccy = py + ph * .45 + Math.sin(t * 1.4) * 5 * d, a = t * .8, b = .55;
    const P = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(([x, y, z]) => { const x1 = x * Math.cos(a) - z * Math.sin(a), z1 = x * Math.sin(a) + z * Math.cos(a), y1 = y * Math.cos(b) - z1 * Math.sin(b); return [ccx + x1 * cs, ccy + y1 * cs]; });
    g.strokeStyle = '#35e0ff'; g.lineWidth = 2 * d; g.beginPath(); [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]].forEach(([i, j]) => { g.moveTo(P[i][0], P[i][1]); g.lineTo(P[j][0], P[j][1]); }); g.stroke();
    g.strokeStyle = '#9dff6b'; const L = pw * .09, bx = pw * .36; g.beginPath(); [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx, sy]) => { const x = ccx + sx * bx, y = ccy + sy * bx; g.moveTo(x - sx * L, y); g.lineTo(x, y); g.lineTo(x, y - sy * L); }); g.stroke();
    g.save(); g.translate(cx - lag * .1, H * .86); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `800 ${Math.min(W * .09, H * .075)}px Orbitron, Arial Black, sans-serif`; g.fillStyle = '#fff'; g.shadowColor = '#35e0ff'; g.shadowBlur = 14 * d; g.fillText('AR PROJECTS', 0, 0); g.restore();
  }
  function drawLudo(t, lag) {
    lag *= d;
    const cx = W / 2 - lag * .12, cy = H * .5, R = Math.min(W * .5, H * .62) * .62, COLS = ['#e8180c', '#f2e200', '#0a6a0a', '#0a2f7a'];
    const sea = g.createLinearGradient(0, 0, 0, H); sea.addColorStop(0, '#c6ecfa'); sea.addColorStop(.6, '#8fdaf6'); sea.addColorStop(1, '#5fc2ec'); g.fillStyle = sea; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(60,150,190,.35)';                                                    // seaweed
    [[.06, .55, 36], [.12, .36, 28], [.92, .6, 40], [.86, .34, 26]].forEach(([fx, fh, w], i) => { const x = W * fx - lag * .2, h = H * fh, ww = w * d, sw = Math.sin(t * .8 + i) * 8 * d;
      g.beginPath(); g.moveTo(x - ww, H); g.bezierCurveTo(x - ww * 1.3 + sw, H - h * .5, x - ww * .6 + sw * 1.4, H - h * .85, x + sw * 1.6, H - h); g.bezierCurveTo(x + ww * .8 + sw * 1.4, H - h * .8, x + ww * 1.4 + sw, H - h * .5, x + ww, H); g.fill(); });
    g.save(); g.translate(cx, cy); g.rotate(t * .06);
    g.fillStyle = 'rgba(255,255,255,.32)'; g.beginPath(); g.arc(0, 0, R * 1.18, 0, 6.2832); g.fill();
    g.lineCap = 'butt'; g.strokeStyle = '#eef8fb';
    [[R * .88, R * .2, 48], [R * .58, R * .15, 24]].forEach(([r, w, n]) => { g.lineWidth = w; const seg = 6.2832 * r / n; g.setLineDash([seg * .86, seg * .14]); g.beginPath(); g.arc(0, 0, r, 0, 6.2832); g.stroke(); });
    g.setLineDash([]);
    for (let i = 0; i < 4; i++) { g.save(); g.rotate((45 + i * 90) * Math.PI / 180); g.fillStyle = COLS[i]; g.fillRect(R * .2, -R * .07, R * .95, R * .14); g.restore(); }
    for (let i = 0; i < 4; i++) { g.fillStyle = COLS[i]; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R * .2, (i * 90 + 180) * Math.PI / 180, (i * 90 + 270) * Math.PI / 180); g.closePath(); g.fill(); }
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(0, 0, R * .09, R * .06, 0, 0, 6.2832); g.fill();
    for (let i = 0; i < 4; i++) { const a = t * .9 + i * 1.5708, r = R * .88, x = Math.cos(a) * r, y = Math.sin(a) * r - Math.abs(Math.sin(t * 7 + i)) * 5 * d;
      g.fillStyle = COLS[(i + 3) % 4]; g.strokeStyle = '#fff'; g.lineWidth = 2 * d; g.beginPath(); g.arc(x, y, R * .06, 0, 6.2832); g.fill(); g.stroke(); }
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,.65)'; g.lineWidth = 2 * d;
    for (let i = 0; i < 12; i++) { const u = (t * .05 + i * .157) % 1; g.beginPath(); g.arc(W * ((i * .29) % 1), H * (1.05 - u * 1.15), (5 + i % 4 * 4) * d, 0, 6.2832); g.stroke(); }
    g.save(); g.translate(W / 2 - lag * .1, H * .12); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.font = `${Math.min(W * .13, H * .11)}px Bangers, Impact, sans-serif`; g.lineWidth = Math.min(W, H) * .018; g.strokeStyle = '#0d4a63'; g.fillStyle = '#fff'; g.strokeText('LUDO 2.0', 0, 0); g.fillText('LUDO 2.0', 0, 0); g.restore();
  }
  const lerp3 = (a, b, f) => a + (b - a) * f;
  // Navarasa: a dusk sky over clouds, a slowly turning halo of the nine rasa colours, nine orbs drifting round it
  function drawNavarasa(t, lag) {
    lag *= d;
    const RASA = ['#D9493A', '#3F7FC4', '#E5A10F', '#6E7C99', '#E0700F', '#7E62D8', '#7F8E45', '#D9467A', '#C49A1E'];
    const cx = W / 2 - lag * .12, cy = H * .46, R = Math.min(W * .42, H * .5) * .62;
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#1b1233'); sky.addColorStop(.55, '#4a2350'); sky.addColorStop(.85, '#c8642c'); sky.addColorStop(1, '#f1a04a');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) { const a = .25 + .6 * Math.abs(Math.sin(t * (.4 + i % 5 * .25) + i)); g.fillStyle = `rgba(255,236,210,${a * .6})`; g.fillRect(((i * 197) % 100) / 100 * W - lag * .05, ((i * 61) % 46) / 100 * H, 1.6 * d, 1.6 * d); }
    const glow = g.createRadialGradient(cx, cy, R * .2, cx, cy, R * 1.9); glow.addColorStop(0, 'rgba(255,190,110,.55)'); glow.addColorStop(1, 'rgba(255,150,80,0)');
    g.fillStyle = glow; g.fillRect(0, 0, W, H);
    g.save(); g.translate(cx, cy); g.rotate(t * .08);                                        // the halo: nine petals, one per rasa
    for (let i = 0; i < 9; i++) { g.save(); g.rotate(i * 6.2832 / 9); g.fillStyle = RASA[i]; g.globalAlpha = .55;
      g.beginPath(); g.ellipse(0, -R * .78, R * .16, R * .36, 0, 0, 6.2832); g.fill(); g.restore(); }
    g.globalAlpha = 1; g.strokeStyle = 'rgba(255,230,190,.7)'; g.lineWidth = 2 * d;
    g.beginPath(); g.arc(0, 0, R * .42, 0, 6.2832); g.stroke(); g.setLineDash([4 * d, 7 * d]); g.beginPath(); g.arc(0, 0, R * 1.18, 0, 6.2832); g.stroke(); g.setLineDash([]);
    g.restore();
    for (let i = 0; i < 9; i++) {                                                           // nine orbs drifting round the halo
      const a = t * .35 + i * 6.2832 / 9, x = cx + Math.cos(a) * R * 1.45, y = cy + Math.sin(a) * R * .55 + Math.sin(t * 1.3 + i) * 6 * d, r = (7 + (i % 3) * 2) * d;
      const og = g.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r * 2.2); og.addColorStop(0, '#fff'); og.addColorStop(.35, RASA[i]); og.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = og; g.beginPath(); g.arc(x, y, r * 2.2, 0, 6.2832); g.fill();
    }
    g.fillStyle = 'rgba(255,248,240,.92)';                                                  // a bank of clouds along the bottom
    for (let i = 0; i < 9; i++) { const x = ((i * .14 + t * .006) % 1.26 - .13) * W - lag * .2, y = H * (.86 + (i % 3) * .035), r = H * (.07 + (i % 4) * .018);
      g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.arc(x + r * .9, y + r * .15, r * .8, 0, 6.2832); g.arc(x - r * .9, y + r * .2, r * .7, 0, 6.2832); g.fill(); }
    g.save(); g.translate(W / 2 - lag * .1, H * .2); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `800 ${Math.min(W * .1, H * .09)}px "Baloo 2", "Kohinoor Devanagari", "Noto Sans Devanagari", sans-serif`; g.fillStyle = '#fff4e2';
    g.shadowColor = 'rgba(255,150,60,.8)'; g.shadowBlur = 18 * d; g.fillText('नवरस', 0, 0);
    g.shadowBlur = 0; g.font = `700 ${Math.min(W * .032, H * .03)}px ui-monospace, Menlo, monospace`; g.fillStyle = 'rgba(255,236,210,.9)'; g.fillText('NAVARASA SAINT · NINE MOODS', 0, Math.min(W * .1, H * .09) * .75);
    g.restore();
  }
  const WORLDS = { synth: drawSynth, spacex: drawSpacex, unicef: drawUnicef, unbox: drawUnbox, tabletop: drawTabletop, ewaste: drawEwaste, ar: drawAr, ludo: drawLudo, navarasa: drawNavarasa };
  // draw world `kind` shifted sideways by ox (device px), clipped to the screen
  // draw world `kind` centred on bay centre cx (device px), clipped to that bay
  function drawWorldAt(kind, cx, bw, t, lag) {
    g.save(); g.beginPath(); g.rect(cx - bw / 2, 0, bw, H); g.clip(); g.translate(cx - W / 2, 0);
    (WORLDS[kind] || drawSynth)(t, lag); g.restore();
  }

  /* ---------- the screen ---------- */
  let cur = null;   // the project cassette in the slot
  function screenShow(c) {
    const it = c && c.item;
    scr.innerHTML = c
      ? `<span class="hs-kick"></span><span class="hs-title"></span><span class="hs-hint">${it.game ? '▶ PRESS TO PLAY' : '▶ PRESS TO OPEN'}</span>`
      : `<span class="hs-kick">INSERT A CASSETTE</span><span class="hs-title">Tap a project above</span><span class="hs-hint">▲ SCROLL UP</span>`;
    if (c) { scr.querySelector('.hs-kick').textContent = it.screen ? it.title.toUpperCase() : 'NOW PLAYING'; scr.querySelector('.hs-title').textContent = it.screen || it.title; }
    scr.setAttribute('aria-label', !c ? 'No cassette inserted. Press to go back up to the projects.'
      : it.game ? `${it.screen || it.title} is loaded. Press to play it.` : `Now playing ${it.title}. Press to open the project details.`);
  }
  screenShow(null);
  scr.addEventListener('click', () => { if (!cur) scrollToU(6.9, 900); else if (cur.item.game) enterGame(cur); else window.__vr.openCard(cur, false); });

  /* ---------- scrolling for the drop ---------- */
  let scrollRaf = 0;
  function scrollToU(u, dur) {
    cancelAnimationFrame(scrollRaf);
    const y0 = scrollY, y1 = (window.__page.L1 + u) * innerHeight;
    if (reduce || dur <= 0) { scrollTo(0, y1); return; }
    const t0 = performance.now();
    const step = now => { const k = clamp((now - t0) / dur); scrollTo(0, y0 + (y1 - y0) * easeIO(k)); if (k < 1) scrollRaf = requestAnimationFrame(step); };
    scrollRaf = requestAnimationFrame(step);
  }

  /* ---------- effects (drawn by the ninja VFX canvas) ---------- */
  const fxPt = (x, y) => { const s = stage.getBoundingClientRect(), k = DPR(); return [(x - s.left) * k, (y - s.top) * k]; };
  const fxAdd = o => window.__fx && window.__fx.P.push(Object.assign({ age: 0, vx: 0, vy: 0 }, o));
  function impactFx(sxp, syp, wpx) {
    const [x, y] = fxPt(sxp, syp), w = wpx * DPR();
    fxAdd({ kind: 'flash', x, y: y - w * .15, r: w * 1.2, life: .24 });
    fxAdd({ kind: 'ring', x, y, r0: w * .25, r1: w * 1.7, life: .65, col: '255,75,224' });
    fxAdd({ kind: 'ring', x, y, r0: w * .12, r1: w * 1.15, life: .5, col: '159,243,255' });
    for (let i = 0; i < 14; i++) {                           // impact lines bursting out of the slot
      const a = -Math.PI * (i + .5) / 14, c = Math.cos(a), s = Math.sin(a);
      fxAdd({ kind: 'streak', x: x + c * w * .35, y: y + s * w * .2, vx: c * w * 2.6, vy: s * w * 1.8, len: w * (.25 + Math.random() * .2), life: .32, dir: [-c, -s], col: i % 3 ? '255,220,250' : '159,243,255' });
    }
    for (let i = 0; i < 20; i++) {
      const a = -Math.PI / 2 + (Math.random() - .5) * 2.6;
      fxAdd({ kind: 'spark', x, y: y - w * .05, vx: Math.cos(a) * w * (1 + Math.random() * 1.4), vy: Math.sin(a) * w * (1.4 + Math.random()), r: Math.max(1.5, w * .012), life: .6 + Math.random() * .35, col: Math.random() < .5 ? '255,180,245' : '170,245,255', grav: w * 5 });
    }
    for (let i = 0; i < 14; i++) {
      const side = i % 2 ? 1 : -1;
      fxAdd({ kind: 'dust', x: x + side * w * .4, y, vx: side * w * (.6 + Math.random()), vy: -w * (.1 + Math.random() * .3), r: w * (.06 + Math.random() * .06), life: .6 + Math.random() * .3, grav: w });
    }
  }
  function trailFx(sxp, syp, wpx, vy) {                     // speed lines streaming off the falling cassette
    const [x, y] = fxPt(sxp + (Math.random() - .5) * wpx, syp), k = DPR();
    fxAdd({ kind: 'streak', x, y, vx: 0, vy: -Math.abs(vy) * .15 * k, len: Math.min(220, Math.abs(vy) * .12) * k + 20 * k, life: .22, dir: [0, -1], col: Math.random() < .35 ? '255,170,240' : '220,245,255' });
  }

  /* ---------- the ninja in this universe ---------- */
  const N = { mode: 'none', x: PERCH.x, y: PERCH.y, from: null, to: null, t0: 0, dur: .5, flip: 1, cheer: 0 };
  function drawNinja(t) {
    const K = window.__s1 && window.__s1.kit;
    if (!K || N.mode === 'none') { hNinja.style.display = 'none'; return; }
    hNinja.style.display = 'block';
    if (N.mode === 'cart') {                                  // riding the cartridge as it slides into the slot
      const rr = rig.getBoundingClientRect(), cr = N.cartEl.getBoundingClientRect();
      N.y = (cr.top - rr.top) / (rr.width / 1728) - CART.ridge;
      K.sheetSprite(hNinja, 'idleD', Math.floor(t * 12) % 25, N.x, N.y, NINJA_H);
    } else if (N.mode === 'hop') {
      const k = clamp((t - N.t0) / N.dur), x = lerp(N.from[0], N.to[0], k), y = lerp(N.from[1], N.to[1], k) - 150 * 4 * k * (1 - k);
      K.sheetSprite(hNinja, 'runR', k < .1 ? 12 : k < .5 ? 4 : k < .9 ? 20 : 28, x, y, NINJA_H, N.flip * 7 * Math.sin(Math.PI * k) * (k < .5 ? -1 : .6), N.flip);
      if (k >= 1) {
        N.mode = 'idle'; N.x = N.to[0]; N.y = N.to[1];
        const [lx, ly] = rigToScreen(N.x, N.y), r = rig.getBoundingClientRect().width / 1728;
        if (window.__fx) window.__fx.land(...fxPt(lx, ly), NINJA_H * r * DPR());
      }
    } else {                                                  // idle on the finger, with a little cheer after a hit
      const c = clamp(1 - (t - N.cheer) / .55), jump = c > 0 ? Math.sin(Math.PI * (1 - c)) * 60 : 0;
      K.sheetSprite(hNinja, c > 0 ? 'runR' : 'idleR', c > 0 ? 4 : Math.floor(t * 12) % 25, N.x, N.y - jump, NINJA_H, 0, 1);
    }
  }

  /* ---------- the drop ---------- */
  const dropLayer = document.createElement('div'); dropLayer.id = 'dropLayer'; stage.appendChild(dropLayer);
  const fallNinja = document.createElement('div'); fallNinja.className = 'hop'; dropLayer.appendChild(fallNinja);
  let busy = false, drop = null;
  const cassette = c => {                                    // a look-alike of a ring cassette, without its ring state
    const el = c.el.cloneNode(true);
    el.removeAttribute('aria-label'); el.setAttribute('aria-hidden', 'true'); el.tabIndex = -1;
    ['transform', 'opacity', 'z-index'].forEach(p => el.style.removeProperty(p));
    el.classList.remove('out'); return el;
  };
  function ejectOld() {
    const old = slot.querySelector('.pcard'); if (!old) return;
    old.classList.add('eject'); old.style.transform = `translate(-50%,-100%) translate(${(Math.random() < .5 ? -1 : 1) * 520}px,-520px) rotate(${Math.random() < .5 ? -40 : 40}deg) scale(1.3)`;
    setTimeout(() => old.remove(), 600);
  }
  window.__drop = c => {
    const P = window.__page, VR = window.__vr;
    if (busy || !P || !VR) return;
    if (playing) exitGame();
    if (cur === c) { scrollToU(slideU(SLIDES.indexOf(c)), 900); return; }   // already in: just go down to it
    busy = true;
    const keyboard = document.activeElement === c.el;
    if (cur) cur.ghost = false;
    c.ghost = true;
    const r = c.el.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    const sc0 = (c.pos ? c.pos.sc : 1) * VR.S;
    const clone = cassette(c); dropLayer.appendChild(clone);
    const bw = 250, bh = 164;
    // the ninja leaps aboard if it's riding the ring
    let nj = null;
    const cn = VR.cNinja, NJ = VR.NJ;
    if (NJ.on && !NJ.away && cn.isConnected && cn.style.display !== 'none' && window.__s1) {
      const nr = cn.getBoundingClientRect(), sp = window.__s1.kit.SHEETS[cn.dataset.sheet || 'idleR'];
      nj = { x: nr.left + nr.width / 2 - sr.left, y: nr.top + nr.height * sp.fy / sp.h - sr.top, h: nr.height * sp.H / sp.h };
      NJ.away = true;
    }
    const startNinjaHere = N.mode !== 'none';                 // the ninja is already down here (on the finger)
    drop = { c, clone, x0: r.left + r.width / 2 - sr.left, y0: r.top + r.height / 2 - sr.top, sc0, bw, bh, nj, t0: performance.now(), lastTrail: 0, startNinjaHere, keyboard, lastY: null };
    scrollToU(slideU(SLIDES.indexOf(c)), reduce ? 0 : 1050);
  };
  const T_POP = .26, T_FALL = 1.2;
  function stepDrop(now) {
    const D = drop, t = (now - D.t0) / 1000, sr = stage.getBoundingClientRect();
    const [txs, tys] = rigToScreen(CART.x, CART.bottom - CART.h / 2 - 70);   // just above the slot
    const tx = txs - sr.left, ty = Math.min(tys - sr.top, innerHeight * .9), tsc = rigS * 1.6;
    let x, y, sc, rot;
    if (reduce) { finishDrop(); return; }
    if (t < T_POP) {                                          // pop off the ring
      const k = t / T_POP;
      x = D.x0; y = D.y0 - 60 * Math.sin(k * Math.PI / 2); sc = D.sc0 * (1 + .2 * k); rot = -10 * k;
    } else {                                                  // fall, following the handheld as it scrolls up into view
      const k = clamp((t - T_POP) / T_FALL), xp = D.x0, yp = D.y0 - 60, kk = k * k;
      x = lerp(xp, tx, easeIO(k)); y = lerp(yp, ty, kk); sc = lerp(D.sc0 * 1.2, tsc, easeIO(k));
      rot = -10 * (1 - k) + 16 * Math.sin(k * Math.PI * 2.5) * (1 - k);
      if (D.lastY !== null && now - D.lastTrail > 30) { D.lastTrail = now; trailFx(x + sr.left, y + sr.top - D.bh * sc / 2, D.bw * sc, (y - D.lastY) * 60); }
      if (k >= 1) { finishDrop(); return; }
    }
    D.lastY = y;
    D.clone.style.transform = `translate(${(x - D.bw / 2).toFixed(1)}px,${(y - D.bh / 2).toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
    // the ninja: leaps onto the cassette, then rides it down crouched
    const K = window.__s1 && window.__s1.kit;
    if (D.nj && K) {
      const cs = Math.cos(rot * Math.PI / 180), sn = Math.sin(rot * Math.PI / 180), up = D.bh * sc / 2 + 18 * sc;
      const fx = x + sn * up, fy = y - cs * up, hN = lerp(D.nj.h, NINJA_H * rigS, clamp((t - T_POP) / T_FALL));
      const k = clamp(t / (T_POP + .12));
      fallNinja.style.display = 'block';
      if (k < 1) K.sheetSprite(fallNinja, 'runR', k < .5 ? 4 : 20, lerp(D.nj.x, fx, k), lerp(D.nj.y, fy, k) - 70 * 4 * k * (1 - k), hN, 0, fx >= D.nj.x ? 1 : -1);
      else K.sheetSprite(fallNinja, 'runR', 20, fx, fy, hN, rot, 1);
    }
  }
  function finishDrop() {
    const D = drop; drop = null;
    D.clone.remove(); fallNinja.style.display = 'none';
    ejectOld();
    const el = cassette(D.c); el.style.setProperty('--ins', '-90px'); slot.appendChild(el);
    if (D.nj) { N.mode = 'cart'; N.x = CART.x; N.cartEl = el; }
    requestAnimationFrame(() => requestAnimationFrame(() => el.style.setProperty('--ins', '82px')));
    setTimeout(() => {                                         // slammed home
      cur = D.c; busy = false;
      shake.classList.remove('hit'); hh.classList.remove('quake'); scr.classList.remove('boot'); void shake.offsetWidth;
      shake.classList.add('hit'); hh.classList.add('quake');
      screenShow(cur); scr.classList.add('boot');
      const [sx, sy] = rigToScreen(CART.x, CART.bottom - 20);
      impactFx(sx, sy, CART.h * 1.5 * rigS);
      flare = 1; gridBoost = 1; ripples.push({ t0: performance.now() / 1000 });
      const t = performance.now() / 1000;
      if (D.nj) { N.mode = 'hop'; N.from = [CART.x, CART.bottom - CART.h - CART.ridge]; N.to = [PERCH.x, PERCH.y]; N.t0 = t + .28; N.dur = .55; N.flip = -1; }
      else if (N.mode === 'idle') N.cheer = t;
      if (D.keyboard) scr.focus({ preventScroll: true });
    }, reduce ? 0 : 150);
  }

  /* ---------- project worlds: one slide per project; scrolling on moves sideways through them ---------- */
  // projects with a world of their own come first; the rest use the synthwave world until theirs is made
  const SLIDES = window.__vr.cards.filter(c => c.kind === 'PROJECT' && c.item.world).sort((a, b) => (b.item.world ? 1 : 0) - (a.item.world ? 1 : 0));
  window.__hhSlides = SLIDES.length; buildFrame();
  const U0 = 9.6, STEP = 1;                                   // u of the first slide; scroll per slide
  const slideU = i => U0 + Math.max(0, i) * STEP;
  window.__hhSlideU = slideU;                                 // the quick-nav (js/qnav.js) jumps to the first world
  document.getElementById('scroller').style.height = ((window.__page.L1 + U0 + (SLIDES.length - 1) * STEP + 1) * 100) + 'vh';   // ends on the last slide: further scrolling carries the stage away to the gallery
  $('hnCount').textContent = String(SLIDES.length).padStart(2, '0');
  function slidePos(u) {                                      // continuous slide index, holding still around each slide
    const f = clamp((u - U0) / STEP, 0, SLIDES.length - 1), i = Math.floor(f), fr = f - i;
    const k = clamp((fr - .3) / .4);
    return Math.min(SLIDES.length - 1, i + k * k * (3 - 2 * k));
  }
  const hnIdx = $('hnIdx');
  hh.querySelector('.hn-prev').addEventListener('click', () => scrollToU(slideU(Math.max(0, Math.round(slidePos(window.__page.u)) - 1)), 700));
  hh.querySelector('.hn-next').addEventListener('click', () => scrollToU(slideU(Math.min(SLIDES.length - 1, Math.round(slidePos(window.__page.u)) + 1)), 700));

  // scrolling onto another slide swaps the cassette in the slot (a lighter thunk than a drop from the ring)
  let swapUntil = 0;
  function swapIn(c) {
    ejectOld();
    if (cur) cur.ghost = false;
    c.ghost = true; cur = c;
    const el = cassette(c); el.classList.add('swap'); el.style.setProperty('--ins', '-460px'); slot.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.style.setProperty('--ins', '82px')));
    swapUntil = performance.now() + 420;
    setTimeout(() => {
      shake.classList.remove('hit'); scr.classList.remove('boot'); void shake.offsetWidth;
      shake.classList.add('hit'); screenShow(c); scr.classList.add('boot');
      const [sx, sy] = rigToScreen(CART.x, CART.bottom - 20);
      if (!reduce) impactFx(sx, sy, CART.h * .8 * rigS);
      flare = Math.max(flare, .5); gridBoost = Math.max(gridBoost, .5); ripples.push({ t0: performance.now() / 1000 });
      if (N.mode === 'idle') N.cheer = performance.now() / 1000;
    }, reduce ? 0 : 270);
  }

  let snapT = 0;
  addEventListener('scroll', () => {
    clearTimeout(snapT);
    snapT = setTimeout(() => {
      const u = window.__page.u; if (playing || drop || busy || u < U0 - .3 || u > slideU(SLIDES.length - 1) + .02) return;   // past the last slide = on the way to the gallery: no snap back
      const raw = (u - U0) / STEP, i = Math.floor(raw), fr = raw - i;
      const to = clamp(fr < .08 ? i : fr > .92 ? i + 1 : (slideDir > 0 ? (fr > .15 ? i + 1 : i) : (fr < .85 ? i : i + 1)), 0, SLIDES.length - 1);
      if (Math.abs(u - slideU(to)) > .02) scrollToU(slideU(to), 520);
    }, 160);
  }, { passive: true });

  /* ---------- playing a project's game, between the pillars ---------- */
  const gameBox = $('hhGame'), cartBtn = $('hhCart'), exitBtn = $('hhExit');
  let playing = null, playY = 0;
  function enterGame(c) {
    if (playing || !c.item.game) return;
    cancelAnimationFrame(scrollRaf); clearTimeout(snapT);      // a slide snap still under way must not carry the page off
    playing = c;
    playY = Math.round((window.__page.L1 + slideU(SLIDES.indexOf(c))) * innerHeight);   // sit exactly on this world (past the last one the stage would scroll away)
    if (Math.abs(scrollY - playY) > 1) scrollTo(0, playY);
    // the cassette leaves the slot and parks top left (FLIP from where it sits now)
    cartBtn.querySelector('.pcard') && cartBtn.querySelector('.pcard').remove();
    cartBtn.prepend(cassette(c));
    cartBtn.setAttribute('aria-label', `${c.item.screen || c.item.title}: open the design document${c.item.book ? ' as a book' : c.item.site ? ' over the game' : ' (opens in a new tab)'}`);
    cartBtn.querySelector('.hc-cap').textContent = c.item.book || c.item.site ? 'DESIGN\nDOC ▸' : 'DESIGN\nDOC ↗';
    cartBtn.classList.toggle('nodoc', !(c.item.doc || c.item.book || c.item.site));
    const from = slot.querySelector('.pcard:last-child');
    cartBtn.hidden = false; exitBtn.hidden = false;
    if (from && !reduce) {
      const a = from.getBoundingClientRect(), b = cartBtn.getBoundingClientRect(), k = a.width / b.width;
      cartBtn.style.transition = 'none';
      cartBtn.style.transform = `translate(${(a.left - b.left).toFixed(1)}px,${(a.top - b.top).toFixed(1)}px) scale(${(k * parseFloat(getComputedStyle(hh).getPropertyValue('--cs'))).toFixed(4)})`;
      void cartBtn.offsetWidth; cartBtn.style.transition = ''; cartBtn.style.transform = '';
    }
    hh.classList.add('playing');
    const f = ensureGame(c);                                  // already loaded behind the hands: just start the run
    const go = () => { try { const w = f.contentWindow; (w.gameStart || w.spacexStart)(); w.focus(); } catch (e) {} };
    if (f.dataset.ready) go(); else f.addEventListener('load', go, { once: true });
  }
  // a project's game is loaded behind the hands in background-only mode: its real world, no UI
  function gameUrl(c, bg) {
    const inset = Math.round(parseFloat(getComputedStyle(hh).getPropertyValue('--gl')) - parseFloat(getComputedStyle(hh).getPropertyValue('--bl')) || 0);
    return c.item.game + (bg ? '&bg' : '') + '&inset=' + inset;
  }
  function ensureGame(c) {
    let f = gameBox.querySelector('iframe');
    if (f && f.dataset.for === c.item.id) return f;
    f = document.createElement('iframe');
    f.dataset.for = c.item.id; f.src = gameUrl(c, true); f.title = `${c.item.screen || c.item.title}: playable prototype`;
    f.setAttribute('allow', 'autoplay; accelerometer; gyroscope'); f.tabIndex = -1;
    f.addEventListener('load', () => { f.dataset.ready = '1'; });
    gameBox.replaceChildren(f); return f;
  }
  function exitGame() {
    if (!playing) return;
    if (window.__book) window.__book.close();
    playing = null;
    hh.classList.remove('playing');
    cartBtn.hidden = true; exitBtn.hidden = true;
    const f = gameBox.querySelector('iframe');                // back to its background: reload in bg mode (stops the run and its music)
    if (f) { const c = SLIDES.find(x => x.item.id === f.dataset.for); delete f.dataset.ready; f.src = gameUrl(c, true); }
    scr.focus({ preventScroll: true });
  }
  cartBtn.addEventListener('click', () => {
    if (!playing) return;
    const it = playing.item;
    if (it.book && window.__book) {                          // the design document opens as a book over the game
      const f = gameBox.querySelector('iframe');
      window.__book.open(it.book, `${it.screen || it.title} · design document`, () => { try { f.contentWindow.focus(); } catch (e) {} });
    } else if (it.site && window.__book) {                   // the design document page scrolls in an overlay over the game
      const f = gameBox.querySelector('iframe');
      window.__book.openSite(it.site, `${it.screen || it.title} · design document`, () => { try { f.contentWindow.focus(); } catch (e) {} });
    } else if (it.doc) window.open(it.doc, '_blank', 'noopener');
  });
  exitBtn.addEventListener('click', exitGame);
  addEventListener('keydown', e => { if (e.key === 'Escape' && playing) { if (window.__book && window.__book.isOpen) window.__book.close(); else exitGame(); } });
  // while a game is open the page is locked: no scrolling to another project, the only way out is the × (or Esc)
  const lockEv = e => { if (playing && e.cancelable) e.preventDefault(); };
  addEventListener('wheel', lockEv, { passive: false });
  addEventListener('touchmove', lockEv, { passive: false });
  addEventListener('keydown', e => { if (playing && /^(ArrowUp|ArrowDown|PageUp|PageDown|Home|End| )$/.test(e.key) && !/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test((e.target && e.target.tagName) || '')) e.preventDefault(); });
  addEventListener('scroll', () => { if (playing && Math.abs(scrollY - playY) > 1) scrollTo(0, playY); }, { passive: true });

  /* ---------- loop ---------- */
  let last = performance.now(), lastF = 0, slideDir = 1;
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const t = now / 1000;
    if (drop) stepDrop(now);
    gridBoost *= Math.exp(-dt * 2.5); gridPhase = (gridPhase + dt * (.35 + gridBoost * 2.5)) % 1; flare *= Math.exp(-dt * 3);
    for (let i = ripples.length - 1; i >= 0; i--) if (t - ripples[i].t0 > 1.4) ripples.splice(i, 1);
    document.body.classList.toggle('in-hh', window.__page.u > 8.7);
    const PG = window.__page, f = slidePos(PG.u), i0 = Math.floor(f), p = f - i0;
    const r = hh.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) {
      const lag = Math.max(0, r.top - stage.getBoundingClientRect().top);
      const B = bayW() * d;                                   // every world in its own bay; the strip slides with the pillars
      g.fillStyle = '#07021a'; g.fillRect(0, 0, W, H);
      // slides: while moving, only the two worlds in the move are drawn; at rest, just this world and the one
      // in the direction we were scrolling (the next, or the previous), never both neighbours
      if (Math.abs(f - lastF) > 1e-4) slideDir = Math.sign(f - lastF);
      lastF = f;
      const cur = Math.round(f), moving = Math.abs(f - cur) > 0.001;
      const show = moving ? [i0, i0 + 1] : [cur, cur + (slideDir >= 0 ? 1 : -1)];
      for (const i of show) {
        if (i < 0 || i >= SLIDES.length) continue;
        const cx = W / 2 + (i - f) * B;
        if (cx + B / 2 > 0 && cx - B / 2 < W) drawWorldAt(SLIDES[i].item.world, cx, B + 2, t, lag);
      }
    }
    const row = document.getElementById('hhPillars');
    if (row) row.setAttribute('transform', `translate(${(-f * bayW()).toFixed(1)} 0)`);
    const gf = gameBox.querySelector('iframe'), gi = gf ? SLIDES.findIndex(x => x.item.id === gf.dataset.for) : -1;
    if (SLIDES[Math.round(f)].item.game && PG.u > 8.8) ensureGame(SLIDES[Math.round(f)]);
    if (gi >= 0) { gameBox.style.transform = `translateX(${((gi - f) * bayW()).toFixed(1)}px)`; gameBox.style.visibility = Math.abs(gi - f) < 1 ? 'visible' : 'hidden'; }
    const want = Math.round(f);
    hnIdx.textContent = String(want + 1).padStart(2, '0');
    if (!drop && !busy && !playing && PG.u > 9.25 && now > swapUntil && SLIDES[want] !== cur) swapIn(SLIDES[want]);
    if (N.mode === 'hop' && t < N.t0) { /* waits on the cartridge for a beat */ const K = window.__s1 && window.__s1.kit; if (K) K.sheetSprite(hNinja, 'idleD', Math.floor(t * 12) % 25, N.from[0], N.from[1], NINJA_H); hNinja.style.display = 'block'; }
    else drawNinja(t);
    // the ninja goes back up to the ring once the handheld is out of view
    const VR = window.__vr, P = window.__page;
    if (VR && P && VR.NJ.away && !drop && !busy && P.u < 8.55) { VR.NJ.away = false; N.mode = 'none'; }
    requestAnimationFrame(frame);
  }
  layout();
  addEventListener('resize', () => requestAnimationFrame(layout));
  setTimeout(layout, 400);
  requestAnimationFrame(frame);
})();
