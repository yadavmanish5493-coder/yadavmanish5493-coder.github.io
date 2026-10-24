/* ===== art gallery: a pinned 3D corridor after the project worlds =====
   The section is 10 screens tall and its view is pinned. When it pins, the ninja jumps down onto the floor (fixed-speed jump,
   never stops mid-air); after that the scroll walks him into the corridor and the camera follows him at a fixed distance
   (the one place where scroll and ninja move together: the user's choice). Artworks hang on the left and right walls: each
   is lowered from the ceiling as it comes into range and swings open on a hinge to face the visitor. Obsidian pillars with
   neon tubes line both walls. The corridor is drawn on one canvas with its own perspective (a CSS 3D scene of this size
   lost layers); tap an artwork (or use the hidden buttons with the keyboard) to view it large. */
(() => {
  const sec = document.getElementById('gallery'), box = document.getElementById('galBox');
  if (!sec || !box) return;
  const $ = id => document.getElementById(id);
  const pin = $('galPin'), cv = $('galCv'), ctx = cv.getContext('2d'), list = $('galList');
  const ninja = $('galNinja'), shadow = $('galShadow'), countEl = $('galCount'), hintEl = $('galHint'), titleEl = $('galTitle');
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, t) => a + (b - a) * t, ease = t => t * t * (3 - 2 * t);

  // [file, width, height] (web copies, 1600 px on the long side, from the Wix "Artworks" gallery)
  const ART = [
    ['art-01.jpg', 1131, 1600], ['art-02.jpg', 1131, 1600], ['art-03.jpg', 1600, 1131], ['art-04.jpg', 1600, 1131],
    ['art-05.jpg', 1131, 1600], ['art-06.jpg', 1131, 1600], ['art-07.jpg', 1600, 1200], ['art-08.jpg', 1370, 1600],
    ['art-09.jpg', 1131, 1600], ['art-10.jpg', 1600, 1131], ['art-11.jpg', 1600, 1131], ['art-12.jpg', 1600, 1131],
    ['art-13.jpg', 1600, 532]
  ];
  const NEON = ['#ff4be0', '#3de0ff', '#a58bff', '#ff8a5c', '#3bff9a', '#ffd23b'];
  const src = f => 'assets/gallery/' + f;
  const label = i => `Artwork ${i + 1} of ${ART.length} by Manish Yadav`;
  let dirty = true;
  const IMGS = ART.map(([f]) => { const im = new Image(); im.decoding = 'async'; im.onload = () => { dirty = true; }; im.src = src(f); return im; });

  /* ---------- scene (world units; x right, y down, z toward the viewer; the corridor runs into -z) ---------- */
  // W×H = reference frame (scaled to cover the screen), P = focal length, eye = eye height on screen, W2 = half width,
  // FY / CY = floor / ceiling, artH = artwork height, dN = how far ahead of the screen plane the ninja walks, NH = his height
  const SCENES = {
    wide: { W: 1600, H: 900, P: 900, eye: 0.45, W2: 760, FY: 380, CY: -560, artH: 330, artY: -60, dN: 360, NH: 300 },
    tall: { W: 900, H: 1500, P: 1100, eye: 0.45, W2: 440, FY: 520, CY: -760, artH: 250, artY: -90, dN: 430, NH: 300 }
  };
  const GAP = 720, START = 1300, LEN = START + (ART.length - 1) * GAP + 1900;   // artwork spacing (walls alternate), first one, open end onto deep space
  const BOARD_Z = -420, HANG = [5400, 3600], NEAR = 40, PW = 140, PD = 110, HINGE = 40;
  // section progress (#gallery is 10 screens): jump down, walk start, walk end (the bottom of the page: he stands at the open end)
  const Q_DOWN = 0.012, Q_W0 = 0.03, Q_W1 = 0.99;
  // deep space beyond the open end: a 3D star field you fly into as you scroll on (x, y spread around the vanishing point, z = depth 0..1, recycled);
  // about one in six is a shining star with a halo and a twinkling cross
  const STARS = [];
  { let sd = 11; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 520; i++) {
      const ang = r() * 6.2832, rad = 0.08 + Math.sqrt(r()) * 0.92;   // keep the very centre clear so nothing sits still on the vanishing point
      STARS.push({ x: Math.cos(ang) * rad, y: Math.sin(ang) * rad * 0.8, z: r(), r: 0.6 + r() * 1.2, c: r() < 0.18 ? '159,243,255' : r() < 0.3 ? '255,170,240' : '255,255,255',
                   shine: r() < 0.17, tw: 1 + r() * 2.5, ph: r() * 6.28 });
    } }
  const TRAVEL = 0.45;                                          // depth units flown per screen height of forward scroll
  let spaceY = 0, spaceT = 0, spaceV = 0, tNow = 0;
  // at the bottom of the page every forward scroll (wheel, touch drag, ↓ / PageDown / Space / End) moves deep space on, endlessly;
  // scrolling back scrolls the page, so he walks back at once (the space stays where it got to)
  const atEnd = () => {
    const r = sec.getBoundingClientRect(), root = document.documentElement;
    return S && r.bottom <= innerHeight + 2 && !root.classList.contains('gal-open') && !root.classList.contains('contact-open') && !root.classList.contains('doc-open');
  };
  const push = px => { if (px > 0 && atEnd()) spaceT += px; };
  addEventListener('wheel', e => push(e.deltaY * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? innerHeight : 1)), { passive: true });
  let touchY = null;
  addEventListener('touchstart', e => { touchY = e.touches.length === 1 ? e.touches[0].clientY : null; }, { passive: true });
  addEventListener('touchmove', e => { if (touchY === null || e.touches.length !== 1) return; const y = e.touches[0].clientY; push(touchY - y); touchY = y; }, { passive: true });
  addEventListener('keydown', e => { if (['ArrowDown', 'PageDown', ' ', 'End'].includes(e.key) && !e.target.closest('input,textarea,[contenteditable]')) push(e.key === 'ArrowDown' ? innerHeight * 0.25 : innerHeight * 0.8); });
  const JUMP = 0.9;                                            // seconds in the air
  let S = null, tall = null, vw = 0, vh = 0, dpr = 1, k = 1, f = 1, cx = 0, cy = 0, eyeZ = 0;
  const arts = [], pillars = [];

  function build() {
    tall = innerWidth < innerHeight; S = tall ? SCENES.tall : SCENES.wide;
    arts.length = 0; pillars.length = 0;
    ART.forEach(([fl, w, h], i) => {
      const aw = Math.round(S.artH * w / h) + 28, ah = S.artH + 28;
      arts.push({ i, side: i % 2 === 0 ? -1 : 1, z: -(START + i * GAP), w: aw, h: ah, neon: NEON[i % NEON.length], hk: -1, open: 0, lift: 760, th: Math.PI / 2, quad: null });
    });
    for (let i = -1; i <= ART.length; i++) {                   // on each wall, opposite the other wall's artworks
      const z = -(START + i * GAP);
      if (z > -START + GAP) continue;
      pillars.push({ side: i % 2 === 0 ? 1 : -1, z, neon: NEON[(i + 6) % NEON.length] });
    }
    if (!list.children.length) ART.forEach((a, i) => {        // keyboard / screen-reader access to the artworks
      const li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.textContent = `${label(i)}: open it large`; b.addEventListener('click', () => open(i, b));
      li.appendChild(b); list.appendChild(li);
    });
    layout();
  }
  function layout() {
    vw = pin.clientWidth; vh = pin.clientHeight; dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
    k = Math.max(vw / S.W, vh / S.H); f = S.P * k;
    cx = vw / 2; cy = (vh - S.H * k) / 2 + k * S.eye * S.H;
    dirty = true;
  }
  addEventListener('resize', () => { if (!S) return; if (tall !== (innerWidth < innerHeight)) build(); else layout(); });

  /* ---------- projection helpers ---------- */
  const P = (x, y, z) => { const d = eyeZ - z; return [cx + x * f / d, cy + y * f / d, d]; };
  const fog = d => clamp((d - 1800) / 6500) * 0.9;            // 0 = clear, ~0.9 = lost in the dark
  // polygon of world points, clipped to d ≥ NEAR, projected
  function poly(pts) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], da = eyeZ - a[2], db = eyeZ - b[2];
      if (da >= NEAR) out.push(a);
      if ((da >= NEAR) !== (db >= NEAR)) { const t = (da - NEAR) / (da - db); out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]); }
    }
    return out.map(p => P(p[0], p[1], p[2]));
  }
  function path(pp) { ctx.beginPath(); pp.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); }
  function line3(a, b, color, width, glow) {                   // world-space segment, clipped at the near plane
    let da = eyeZ - a[2], db = eyeZ - b[2];
    if (da < NEAR && db < NEAR) return;
    if (da < NEAR) { const t = (NEAR - da) / (db - da); a = [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; da = NEAR; }
    if (db < NEAR) { const t = (NEAR - db) / (da - db); b = [lerp(b[0], a[0], t), lerp(b[1], a[1], t), lerp(b[2], a[2], t)]; db = NEAR; }
    const pa = P(...a), pb = P(...b);
    ctx.strokeStyle = color; ctx.lineWidth = Math.max(0.6, width * f / Math.max(da, db));
    if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 12; }
    ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke();
    if (glow) ctx.shadowBlur = 0;
  }
  function shade(pp, d) { const fk = fog(d); if (fk > 0.01 && pp.length) { path(pp); ctx.fillStyle = `rgba(8,1,26,${fk.toFixed(3)})`; ctx.fill(); } }

  /* ---------- drawing ---------- */
  function draw() {
    const { W2, FY, CY } = S, zN = eyeZ - NEAR, zE = -LEN;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const vp = P(0, 0, zE);
    drawSpace(vp);                                             // seen through the open end of the corridor
    // floor
    let g = ctx.createLinearGradient(0, vh, 0, vp[1]); g.addColorStop(0, '#1d0b58'); g.addColorStop(1, '#0c0329');
    path(poly([[-W2, FY, zN], [W2, FY, zN], [W2, FY, zE], [-W2, FY, zE]])); ctx.fillStyle = g; ctx.fill();
    // ceiling
    g = ctx.createLinearGradient(0, 0, 0, vp[1]); g.addColorStop(0, '#120543'); g.addColorStop(1, '#090222');
    path(poly([[-W2, CY, zN], [W2, CY, zN], [W2, CY, zE], [-W2, CY, zE]])); ctx.fillStyle = g; ctx.fill();
    // walls
    for (const sd of [-1, 1]) {
      g = ctx.createLinearGradient(sd < 0 ? 0 : vw, 0, vp[0], 0); g.addColorStop(0, '#2c1276'); g.addColorStop(1, '#12053a');
      path(poly([[sd * W2, CY, zN], [sd * W2, CY, zE], [sd * W2, FY, zE], [sd * W2, FY, zN]])); ctx.fillStyle = g; ctx.fill();
    }
    // floor grid, wall seams, ceiling beams (fading into the distance)
    const z0 = Math.floor(zN / 250) * 250;
    for (let z = z0; z > zE; z -= 250) {
      const a = 1 - fog(eyeZ - z);
      if (a < 0.04) continue;
      line3([-W2, FY, z], [W2, FY, z], `rgba(61,224,255,${(0.45 * a).toFixed(3)})`, 3);
      for (const sd of [-1, 1]) line3([sd * W2, CY, z], [sd * W2, FY, z], `rgba(255,255,255,${(0.05 * a).toFixed(3)})`, 2);
      if (Math.round(z / 250) % 2 === 0) line3([-W2, CY, z], [W2, CY, z], `rgba(150,110,255,${(0.25 * a).toFixed(3)})`, 8);
    }
    for (let x = -W2 + 50; x < W2; x += 190) line3([x, FY, zN], [x, FY, zE], 'rgba(255,75,224,.7)', 4);
    for (const sd of [-1, 1]) {
      line3([sd * W2, FY - 6, zN], [sd * W2, FY - 6, zE], '#ff4be0', 10, '#ff4be0');     // baseboard
      line3([sd * W2, CY + 4, zN], [sd * W2, CY + 4, zE], '#3de0ff', 6, '#3de0ff');      // crown
    }
    line3([0, CY + 2, zN], [0, CY + 2, zE], '#bff7ff', 10, '#3de0ff');                    // ceiling light strip
    // no end wall: the corridor opens onto deep space, framed by a neon doorway
    line3([-W2, FY, zE], [W2, FY, zE], '#3de0ff', 10, '#3de0ff');                        // edge of the floor
    line3([-W2, CY, zE], [W2, CY, zE], '#ff4be0', 10, '#ff4be0');
    for (const sd of [-1, 1]) line3([sd * W2, CY, zE], [sd * W2, FY, zE], '#ff4be0', 10, '#ff4be0');
    // fog toward the far end
    g = ctx.createRadialGradient(vp[0], vp[1], 0, vp[0], vp[1], Math.max(vw, vh) * 0.32);
    g.addColorStop(0, `rgba(8,1,26,${(0.6 * fog(eyeZ - zE) / 0.9).toFixed(3)})`); g.addColorStop(1, 'rgba(8,1,26,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, vw, vh);   // clears as you reach the end

    // lamp glows on the walls behind the artworks (they light up as each artwork opens)
    for (const a of arts) {
      if (a.open <= 0.01) continue;
      const d = eyeZ - a.z; if (d < NEAR + a.w) continue;
      const pl = P(a.side * W2, S.artY - 30, a.z + a.w), pr = P(a.side * W2, S.artY - 30, a.z - a.w), pc = P(a.side * W2, S.artY - 30, a.z);
      const rx = Math.max(1, Math.abs(pl[0] - pr[0]) / 2), ry = a.h * 0.9 * f / d;
      ctx.save(); ctx.globalAlpha = a.open * (1 - fog(d)); ctx.translate(pc[0], pc[1]); ctx.scale(rx / ry, 1);
      const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, ry); gg.addColorStop(0, a.neon + '66'); gg.addColorStop(1, a.neon + '00');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0, 0, ry, 0, 6.2832); ctx.fill(); ctx.restore();
    }
    // pillars and artworks, far to near
    const items = [...pillars.map(p => ({ p, d: eyeZ - p.z })), ...arts.map(a => ({ a, d: eyeZ - a.z })), { b: 1, d: eyeZ - BOARD_Z }].sort((x, y) => y.d - x.d);
    for (const it of items) it.p ? drawPillar(it.p) : it.a ? drawArt(it.a) : drawBoard();
  }

  // deep space, flown into: depth D = 1 (far, at the vanishing point) … 0.04 (passing the viewer); a point at offset (x, y) shows at vp + (x, y)·spread·0.12 / D,
  // so as the scroll moves you forward everything streams out from the centre and grows (near things faster: the parallax)
  const wrap = (v, m) => ((v % m) + m) % m;
  function drawSpace(vp) {
    let g = ctx.createLinearGradient(0, 0, 0, vh); g.addColorStop(0, '#010006'); g.addColorStop(0.55, '#07021c'); g.addColorStop(1, '#0a0228');
    ctx.fillStyle = g; ctx.fillRect(0, 0, vw, vh);
    const M = Math.max(vw, vh), spread = M * 0.55, travel = spaceY * TRAVEL / vh, dv = spaceV * TRAVEL / vh;
    const proj = (x, y, D) => [vp[0] + x * spread * 0.12 / D, vp[1] + y * spread * 0.12 / D];
    // nebula clouds: each swells from the centre, brightest halfway, and fades as you pass through it; three in turn
    for (const [i, ox, oy, rr, col] of [[0, -0.5, -0.3, 0.32, '255,75,224'], [1, 0.6, 0.25, 0.3, '61,224,255'], [2, 0.1, 0.55, 0.36, '120,80,255']]) {
      const p = wrap(travel * 0.35 + i / 3, 1), sc = 0.3 + p * p * 2.6, a = Math.sin(p * Math.PI) * 0.2;
      const x = vp[0] + ox * vw * 0.35 * sc, y = vp[1] + oy * vh * 0.35 * sc, R = rr * M * sc;
      g = ctx.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, `rgba(${col},${a.toFixed(3)})`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.fillRect(0, 0, vw, vh);
    }
    // stars: streaks while you move
    for (const st of STARS) {
      const d = wrap(st.z - travel, 1), D = 0.04 + d * 0.96, [x, y] = proj(st.x, st.y, D);
      if (x < -40 || x > vw + 40 || y < -40 || y > vh + 40) continue;
      const near = 1 - d, R = st.r * (0.35 + near * near * 2.4);
      const a = Math.min(1, near * near * 2.2) * (0.7 + 0.3 * Math.sin(tNow * st.tw + st.ph));   // far stars stay faint, so the centre isn't crowded
      const tail = Math.min(0.25, dv * 4);
      if (tail > 0.004 && d + tail < 1) {
        const [x2, y2] = proj(st.x, st.y, 0.04 + (d + tail) * 0.96);
        ctx.strokeStyle = `rgba(${st.c},${(a * 0.6).toFixed(3)})`; ctx.lineWidth = R * 0.9;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
      }
      if (st.shine && near > 0.45) {
        const tw = 0.5 + 0.5 * Math.sin(tNow * st.tw * 1.6 + st.ph), arm = R * (3 + 4 * tw);
        const h = ctx.createRadialGradient(x, y, 0, x, y, R * 6); h.addColorStop(0, `rgba(${st.c},${(a * .6).toFixed(3)})`); h.addColorStop(1, `rgba(${st.c},0)`);
        ctx.fillStyle = h; ctx.fillRect(x - R * 6, y - R * 6, R * 12, R * 12);
        ctx.strokeStyle = `rgba(255,255,255,${(a * (0.5 + 0.4 * tw)).toFixed(3)})`; ctx.lineWidth = Math.max(1, R * 0.35);
        ctx.beginPath(); ctx.moveTo(x - arm, y); ctx.lineTo(x + arm, y); ctx.moveTo(x, y - arm); ctx.lineTo(x, y + arm); ctx.stroke();
      }
      ctx.fillStyle = `rgba(${st.c},${a.toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y, R, 0, 6.2832); ctx.fill();
    }
    // a ringed planet and a cyan moon come toward you, grow and pass by the side, then a new one appears far ahead
    const bodies = [
      { p: wrap(travel * 0.5 + 0.15, 1), ox: tall ? 0.7 : 0.9, oy: 0.15, R0: 0.075, ring: true },
      { p: wrap(travel * 0.5 + 0.65, 1), ox: tall ? -0.75 : -0.95, oy: -0.35, R0: 0.03, ring: false },
    ].map(b => Object.assign(b, { D: 1.05 - b.p })).sort((u, w) => w.D - u.D);
    for (const b of bodies) {
      const [px, py] = proj(b.ox, b.oy, b.D), R = b.R0 * M * 0.25 / b.D, fade = Math.min(1, b.p / 0.12);
      if (px + R * 2 < 0 || px - R * 2 > vw || py + R * 2 < 0 || py - R * 2 > vh) continue;
      ctx.save(); ctx.globalAlpha = fade;
      if (b.ring) {
        g = ctx.createRadialGradient(px - R * 0.35, py - R * 0.35, R * 0.1, px, py, R); g.addColorStop(0, '#ffb3f1'); g.addColorStop(0.55, '#a33bd6'); g.addColorStop(1, '#2a0b5c');
        const ringArc = (from, to, al) => { ctx.save(); ctx.translate(px, py); ctx.rotate(-0.35); ctx.scale(1, 0.22); ctx.strokeStyle = `rgba(159,243,255,${al})`; ctx.lineWidth = R * 0.45; ctx.beginPath(); ctx.arc(0, 0, R * 1.75, from, to); ctx.stroke(); ctx.restore(); };
        ringArc(Math.PI, 6.2832, .35);                         // back half of the ring
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, R, 0, 6.2832); ctx.fill();
        ringArc(0, Math.PI, .75);                              // front half
      } else {
        g = ctx.createRadialGradient(px - R * 0.3, py - R * 0.3, R * 0.1, px, py, R); g.addColorStop(0, '#dffcff'); g.addColorStop(0.6, '#3db8e0'); g.addColorStop(1, '#0d2a6a');
        ctx.shadowColor = '#3de0ff'; ctx.shadowBlur = Math.min(40, R * 0.8); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, R, 0, 6.2832); ctx.fill();
      }
      ctx.restore();
    }
  }

  // the entrance board: hangs from the ceiling in the middle, just beyond where the ninja lands; the walk passes under it
  function drawBoard() {
    const d = eyeZ - BOARD_Z; if (d < NEAR + 10) return;
    const bw = Math.min(760, S.W2 * 1.55), bh = bw * 0.27, top = S.CY + 40, bot = top + bh, sc = f / d;
    const q = [P(-bw / 2, top, BOARD_Z), P(bw / 2, top, BOARD_Z), P(bw / 2, bot, BOARD_Z), P(-bw / 2, bot, BOARD_Z)];
    ctx.strokeStyle = 'rgba(201,191,255,.6)'; ctx.lineWidth = Math.max(0.6, 3 * sc);   // two cords
    for (const x of [-bw * 0.36, bw * 0.36]) { const a = P(x, S.CY, BOARD_Z), b = P(x, top, BOARD_Z); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    const g = ctx.createLinearGradient(0, q[0][1], 0, q[3][1]); g.addColorStop(0, '#6a3be0'); g.addColorStop(1, '#3d1aa0');
    ctx.save(); ctx.shadowColor = '#ff4be0'; ctx.shadowBlur = 30 * sc + 4;
    path(q); ctx.fillStyle = g; ctx.fill(); ctx.restore();
    path(q); ctx.strokeStyle = '#ff4be0'; ctx.lineWidth = Math.max(1.5, 6 * sc); ctx.stroke();
    const [mx, my] = P(0, top + bh * 0.46, BOARD_Z), fs = bh * 0.58 * sc;
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 ${fs}px Quicksand, "Avenir Next", "Trebuchet MS", system-ui, sans-serif`;
    ctx.shadowColor = '#ff4be0'; ctx.shadowBlur = 18 * sc + 3; ctx.fillStyle = '#fff';
    ctx.fillText('Art Gallery', mx, my);
    ctx.font = `700 ${fs * 0.2}px ui-monospace, Menlo, monospace`; ctx.shadowColor = '#3de0ff'; ctx.fillStyle = '#bff7ff';
    ctx.fillText('HAND-DRAWN ARTWORKS', mx, my + fs * 0.66);
    ctx.restore();
    shade(q, d);
  }
  function drawPillar(p) {
    const { W2, FY, CY } = S, x0 = p.side * (W2 - PD), z0 = p.z - PW / 2, z1 = p.z + PW / 2, d = eyeZ - p.z;
    if (eyeZ - z0 < NEAR) return;
    const inner = poly([[x0, CY, z1], [x0, CY, z0], [x0, FY, z0], [x0, FY, z1]]);
    const front = poly([[x0, CY, z1], [p.side * W2, CY, z1], [p.side * W2, FY, z1], [x0, FY, z1]]);
    if (front.length) { path(front); ctx.fillStyle = '#0c0329'; ctx.fill(); }
    if (inner.length) {
      const g = ctx.createLinearGradient(inner[0][0], 0, inner[1][0], 0); g.addColorStop(0, '#3a1f92'); g.addColorStop(1, '#170642');
      path(inner); ctx.fillStyle = g; ctx.fill();
    }
    for (const y of [CY + 62, FY - 62]) {                       // glowing rings near the top and the bottom
      line3([x0, y, z1], [x0, y, z0], p.neon, 30, p.neon);
      line3([x0, y, z1], [p.side * W2, y, z1], p.neon, 30, p.neon);
    }
    line3([x0, CY + 110, p.z], [x0, FY - 110, p.z], '#fff', 9, p.neon);                // neon tube
    shade(inner, d); shade(front, d);
  }
  function drawArt(a) {
    a.quad = null;
    const d = eyeZ - a.z; if (eyeZ - (a.z + a.w) < NEAR + 20) return;
    const hw = a.w, cs = Math.cos(a.th), sn = Math.sin(a.th), hx = a.side * (S.W2 - HINGE), zh = a.z + a.w / 2;
    // point on the panel at u (0 = the image's left edge, 1 = its right edge) and height y
    const at = (u, y) => a.side < 0 ? [hx + u * hw * cs, y, zh - u * hw * sn] : [hx - (1 - u) * hw * cs, y, zh - (1 - u) * hw * sn];
    const top = S.artY - a.h / 2 - a.lift, bot = S.artY + a.h / 2 - a.lift;
    const q = [P(...at(0, top)), P(...at(1, top)), P(...at(1, bot)), P(...at(0, bot))];
    if (q.some(p => p[2] < NEAR)) return;
    const sc = f / d;
    // everything above the ceiling is hidden (artworks are lowered out of it)
    const ceilY = P(0, S.CY, a.z)[1];
    ctx.save(); ctx.beginPath(); ctx.rect(0, ceilY, vw, vh - ceilY); ctx.clip();
    // cord from the ceiling
    const hook = P(...at(0.5, top - 46)), ceil = P(...at(0.5, S.CY));
    ctx.strokeStyle = 'rgba(201,191,255,.55)'; ctx.lineWidth = Math.max(0.6, 2 * sc);
    ctx.beginPath(); ctx.moveTo(hook[0], hook[1]); ctx.lineTo(ceil[0], ceil[1]); ctx.stroke();
    // frame with a neon rim
    ctx.save(); ctx.shadowColor = a.neon; ctx.shadowBlur = 22 * sc + 2;
    path(q); ctx.fillStyle = '#1b0b52'; ctx.fill(); ctx.restore();
    path(q); ctx.strokeStyle = a.neon; ctx.lineWidth = Math.max(1, 4 * sc); ctx.stroke();
    // the picture, in vertical strips (each strip is at one depth, so this is exact for a panel turned about a vertical axis)
    const im = IMGS[a.i], pad = 14 / a.w, padY = 14;
    if (im.complete && im.naturalWidth) {
      const pxw = Math.abs(q[1][0] - q[0][0]), n = clamp(Math.round(pxw / 3), 6, 140), iw = im.naturalWidth, ih = im.naturalHeight;
      for (let j = 0; j < n; j++) {
        const u0 = pad + (1 - 2 * pad) * j / n, u1 = pad + (1 - 2 * pad) * (j + 1) / n;
        const t0 = P(...at(u0, top + padY)), b0 = P(...at(u0, bot - padY)), t1 = P(...at(u1, top + padY)), b1 = P(...at(u1, bot - padY));
        const w = t1[0] - t0[0];
        if (Math.abs(w) < 0.01) continue;
        // a strip is a thin trapezoid; drawn as its average rectangle (under a pixel of error at this width)
        const yt = (t0[1] + t1[1]) / 2, yb = (b0[1] + b1[1]) / 2;
        ctx.drawImage(im, (j / n) * iw, 0, iw / n, ih, Math.min(t0[0], t1[0]) - 0.3, yt, Math.abs(w) + 0.6, yb - yt);
      }
    }
    // plaque
    const pl = P(...at(0.5, bot + 30));
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 ${Math.max(6, 17 * sc)}px ui-monospace, Menlo, monospace`;
    const txt = `No. ${String(a.i + 1).padStart(2, '0')}`, tw = ctx.measureText(txt).width;
    ctx.fillStyle = 'rgba(20,10,60,.85)'; ctx.fillRect(pl[0] - tw / 2 - 8 * sc, pl[1] - 12 * sc, tw + 16 * sc, 24 * sc);
    ctx.fillStyle = '#cfc8ff'; ctx.fillText(txt, pl[0], pl[1]); ctx.restore();
    // lamp above it
    const l0 = P(...at(0.35, top - 46)), l1 = P(...at(0.65, top - 46));
    ctx.save(); ctx.strokeStyle = a.neon; ctx.shadowColor = a.neon; ctx.shadowBlur = 14 * sc + 2; ctx.lineWidth = Math.max(1.5, 9 * sc);
    ctx.beginPath(); ctx.moveTo(l0[0], l0[1]); ctx.lineTo(l1[0], l1[1]); ctx.stroke(); ctx.restore();
    shade(q, d);
    ctx.restore();
    a.quad = q[0][1] < ceilY ? null : q;                        // only tappable once it is down
  }

  /* ---------- picking an artwork on the canvas ---------- */
  function inQuad(q, x, y) {
    let inside = false;
    for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
      const [xi, yi] = q[i], [xj, yj] = q[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function artAt(e) {
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    let best = null;
    for (const a of arts) if (a.quad && inQuad(a.quad, x, y) && (!best || a.z > best.z)) best = a;   // the nearest one wins
    return best;
  }
  cv.addEventListener('click', e => { const a = artAt(e); if (a) open(a.i, list.children[a.i].firstChild); });
  cv.addEventListener('mousemove', e => cv.classList.toggle('over-art', !!artAt(e)));

  /* ---------- the loop: jump down, walk with the scroll, camera follows ---------- */
  let jt = 0, jdir = 0, landAt = -9, s = 0, sPrev = 0, sDrawn = NaN, walkPhase = 0, faceAway = true, last = performance.now(), lastCount = '';
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    requestAnimationFrame(frame);
    const r = sec.getBoundingClientRect(), wh = innerHeight;
    if (r.bottom < 0 || r.top > wh) { ninja.style.display = 'none'; shadow.style.opacity = 0; return; }
    if (!S) build();
    const q = clamp(-r.top / Math.max(1, r.height - wh));
    // the jump plays at its own speed; a new one starts only when the last has landed
    const want = q >= Q_DOWN ? 1 : 0;
    if (jdir === 0 && jt !== want && (want === 1 || s < 3)) jdir = want ? 1 : -1;
    if (jdir) {
      jt = clamp(jt + jdir * dt / JUMP);
      if (jt === 0 || jt === 1) { if (jt === 1) landAt = now / 1000; jdir = 0; }
    }
    // the walk follows the scroll once he is on the floor; the camera keeps a fixed distance behind him
    const walkLen = LEN - 700 - S.dN;
    const sT = jt === 1 && jdir === 0 ? ease(clamp((q - Q_W0) / (Q_W1 - Q_W0))) * walkLen : 0;
    sPrev = s; s += (sT - s) * (1 - Math.exp(-dt * 5)); if (Math.abs(sT - s) < 0.5) s = sT;
    // deep space: you fly toward where the forward scrolls at the end have pushed you (spaceT only grows)
    const y0 = spaceY;
    spaceY += (spaceT - spaceY) * (1 - Math.exp(-dt * 3.5)); if (Math.abs(spaceT - spaceY) < 0.5) spaceY = spaceT;   // a softer glide: it feels like flying on
    spaceV = spaceY - y0;
    tNow = now / 1000;
    if (spaceY !== y0 || s > walkLen * 0.55) dirty = true;     // the stars twinkle once the open end is close enough to see
    const v = (s - sPrev) / Math.max(dt, 1e-3);
    eyeZ = S.P - s;

    // artworks: lowered from the ceiling flat against the wall, then swung open on the hinge nearer the viewer
    let near = 0, nd = 1e9;
    for (const a of arts) {
      const dist = -(a.z + s), hk = clamp((HANG[0] - dist) / (HANG[0] - HANG[1]));
      if (Math.abs(dist - S.dN) < nd) { nd = Math.abs(dist - S.dN); near = a.i; }
      if (hk === a.hk) continue; a.hk = hk; dirty = true;
      const down = ease(clamp(hk / 0.6));
      a.open = ease(clamp((hk - 0.5) / 0.5));
      a.lift = (1 - down) * 760;
      a.th = (90 - 52 * a.open) * Math.PI / 180;               // angle away from facing the viewer
    }
    if (s !== sDrawn) { sDrawn = s; dirty = true; }
    if (dirty) { dirty = false; draw(); }
    const c = `${String(near + 1).padStart(2, '0')} / ${ART.length}`;
    if (c !== lastCount) { lastCount = c; countEl.textContent = s > 50 ? `Artwork ${c}` : ''; }
    hintEl.style.opacity = s > 400 ? 0 : 1;
    titleEl.style.opacity = s > 520 ? 1 : 0;                   // the entrance board is the title until you have passed under it

    // the ninja sprite, in screen space (he always stands dN ahead of the screen plane)
    const K = window.__s1 && window.__s1.kit;
    if (!K || jt === 0) { ninja.style.display = 'none'; shadow.style.opacity = 0; return; }
    ninja.style.display = 'block';
    const sc = S.P / (S.P + S.dN), fx = cx, fy = cy + k * S.FY * sc, hgt = k * S.NH * sc, t = now / 1000;
    if (jt < 1 || jdir) {
      // in the air: from above the top of the screen (the handheld) down onto the floor
      const u = jt, x = lerp(fx + hgt * 0.5, fx, u), y = lerp(-hgt * 0.3, fy, u * u) - Math.sin(Math.PI * u) * hgt * 0.25;
      K.sheetSprite(ninja, 'runR', 26, x, y, hgt * 1.02, -10 * (1 - u), -1);
      shadow.style.opacity = (0.6 * u).toFixed(2);
    } else {
      const moving = Math.abs(v) > 25;
      if (moving) faceAway = v > 0;
      walkPhase += Math.abs(s - sPrev);
      const sq = 1 - 0.12 * Math.max(0, 1 - (t - landAt) / 0.18);   // landing squash
      if (moving) K.sheetSprite(ninja, faceAway ? 'walkU' : 'walkD', Math.floor(walkPhase / 22) % 24, fx, fy, hgt * (faceAway ? 1 : 1.04), 0, 1, sq);
      else K.sheetSprite(ninja, faceAway ? 'idleU' : 'idleD', Math.floor(t * 12) % 25, fx, fy, hgt * (faceAway ? 1 : 1.04), 0, 1, sq);
      shadow.style.opacity = 0.6;
    }
    shadow.style.transform = `translate(${fx.toFixed(1)}px,${fy.toFixed(1)}px) scale(${(hgt / 300).toFixed(3)})`;
  }
  requestAnimationFrame(frame);

  /* ---------- viewer ---------- */
  const img = box.querySelector('.gb-img'), cap = box.querySelector('.gb-cap');
  let cur = 0, opener = null;
  function show(i) {
    cur = (i + ART.length) % ART.length;
    img.src = src(ART[cur][0]); img.alt = label(cur);
    cap.textContent = `No. ${String(cur + 1).padStart(2, '0')} / ${String(ART.length).padStart(2, '0')}`;
    box.style.setProperty('--neon', NEON[cur % NEON.length]);
  }
  function open(i, from) {
    opener = from; show(i);
    box.hidden = false; void box.offsetWidth; box.classList.add('on');
    document.documentElement.classList.add('gal-open');      // the page doesn't scroll behind the viewer
    box.querySelector('.gb-close').focus({ preventScroll: true });
  }
  function close() {
    if (box.hidden) return;
    box.classList.remove('on'); document.documentElement.classList.remove('gal-open');
    setTimeout(() => { if (!box.classList.contains('on')) box.hidden = true; }, 220);
    if (opener) opener.focus({ preventScroll: true });
  }
  box.querySelector('.gb-close').addEventListener('click', close);
  box.querySelector('.gb-prev').addEventListener('click', () => show(cur - 1));
  box.querySelector('.gb-next').addEventListener('click', () => show(cur + 1));
  box.addEventListener('click', e => { if (e.target === box) close(); });
  addEventListener('keydown', e => {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(cur - 1);
    else if (e.key === 'ArrowRight') show(cur + 1);
    else return;
    e.preventDefault();
  });
  let tx = null;                                             // swipe between artworks
  box.addEventListener('touchstart', e => { tx = e.touches.length === 1 ? [e.touches[0].clientX, e.touches[0].clientY] : null; }, { passive: true });
  box.addEventListener('touchend', e => {
    if (!tx) return; const t = e.changedTouches[0], dx = t.clientX - tx[0], dy = t.clientY - tx[1]; tx = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4) show(cur + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();
