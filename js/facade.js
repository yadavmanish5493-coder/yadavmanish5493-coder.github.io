/* ---------- building walls: the plain walls become a monumental facade (dark stone panels, thin magenta neon) ----------
   One panel grid in #column coordinates runs through the board band and the facade, so it reads as one building.
   The facade around the cassette window is drawn as a portal: chamfered arch, nested neon frames that rise up a
   stepped central tower, round pillars at both sides and steps at the foot. The room's front wall gets the same
   panels in its own (world) units. */
(() => {
  const NS = 'http://www.w3.org/2000/svg', $ = id => document.getElementById(id);
  const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent && parent.appendChild(e); return e; };
  const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const pts = a => a.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const SHADES = ['#120b38', '#140c3d', '#100932', '#130b3b'];   // dark stone: the lit sky reads against it
  const PINK = '#ff4be0', PINK_CORE = '#ffc4f6';
  let uid = 0;

  // a neon line: wide soft glow + bright core
  function neon(parent, points, w = 2, breathe = true) {
    const g = mk('g', { class: breathe ? 'neon' : '', fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
    mk('polyline', { points: pts(points), stroke: PINK, 'stroke-width': w * 6, opacity: .13 }, g);
    mk('polyline', { points: pts(points), stroke: PINK, 'stroke-width': w * 2.4, opacity: .5 }, g);
    mk('polyline', { points: pts(points), stroke: PINK_CORE, 'stroke-width': w * .8 }, g);
    return g;
  }

  // stone panels for the region (x0,y0,w,h) of the grid, drawn at the root's origin; PW = panel width
  function panels(root, x0, y0, w, h, PW, slits = true) {
    root.textContent = '';
    const PH = PW * 0.78, seam = Math.max(1.5, PW * 0.025);
    mk('rect', { x: 0, y: 0, width: w, height: h, fill: '#06021a' }, root);              // the seams
    const c0 = Math.floor(x0 / PW), c1 = Math.ceil((x0 + w) / PW), r0 = Math.floor(y0 / PH), r1 = Math.ceil((y0 + h) / PH);
    const g = mk('g', {}, root), lines = mk('g', { fill: 'none', 'stroke-width': Math.max(1, seam * .6) }, root);
    for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) {
      const x = c * PW - x0 + seam / 2, y = r * PH - y0 + seam / 2, pw = PW - seam, ph = PH - seam;
      mk('rect', { x: x.toFixed(1), y: y.toFixed(1), width: pw.toFixed(1), height: ph.toFixed(1), fill: SHADES[Math.floor(hash(c, r) * SHADES.length)] }, g);
      mk('polyline', { points: pts([[x, y + ph], [x, y], [x + pw, y]]), stroke: '#221958', opacity: .9 }, lines);      // lit edges
      mk('polyline', { points: pts([[x + pw, y], [x + pw, y + ph], [x, y + ph]]), stroke: '#08031d', opacity: .9 }, lines); // shaded edges
      if (slits && hash(c + 31, r - 17) < 0.035) {                                       // a rare neon slit, like the side wings
        const sw = pw * 0.62, sy = y + ph * (hash(r, c + 3) < .5 ? .3 : .7);
        neon(root, [[x + (pw - sw) / 2, sy], [x + (pw + sw) / 2, sy]], Math.max(1.2, PW * .02));
      }
    }
  }

  const column = $('column'), band = $('eduBand'), vr = $('vrStage'), facade = $('vrFacade');
  const panelW = () => Math.max(56, Math.min(120, innerWidth / 9));
  const wallSvg = parent => { const sv = mk('svg', { class: 'wallsvg', 'aria-hidden': 'true' }); parent.prepend(sv); return sv; };
  const bandSvg = wallSvg(band);
  const fc = {}; for (const el of facade.querySelectorAll('.fc')) fc[el.className.split('fc-')[1]] = { el, sv: wallSvg(el) };
  const art = mk('svg', { id: 'facadeArt', 'aria-hidden': 'true' }); facade.appendChild(art);
  const colPos = el => { let x = 0, y = 0; for (let e = el; e && e !== column; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; } return [x, y]; };

  let geo = null;
  // the tower and its two neon lines carried up the board wall (behind the boards), so the central building rises tall
  function towerUp(root, w, h) {
    if (!geo) return;
    const { tx, tw, d2, c, L, R, k } = geo, id = 'tu' + (++uid);   // id + 'c': the pillars' gradient
    const defs = mk('defs', {}, root), gr = mk('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    mk('stop', { offset: 0, 'stop-color': '#1a1150', 'stop-opacity': .0 }, gr); mk('stop', { offset: .45, 'stop-color': '#1a1150', 'stop-opacity': .75 }, gr);
    mk('stop', { offset: 1, 'stop-color': '#1a1150', 'stop-opacity': .95 }, gr);
    mk('rect', { x: tx, y: 0, width: tw, height: h, fill: `url(#${id})` }, root);
    mk('line', { x1: tx, x2: tx, y1: h * .3, y2: h, stroke: '#3a2d8c', 'stroke-width': 1.5 }, root);
    mk('line', { x1: tx + tw, x2: tx + tw, y1: h * .3, y2: h, stroke: '#08031d', 'stroke-width': 1.5 }, root);
    const xl = L + c - d2 * k, xr = R - c + d2 * k, nw = Math.max(1.3, geo.pw * .03);
    neon(root, [[xl, h * .18], [xl, h + 2]], nw); neon(root, [[xr, h * .18], [xr, h + 2]], nw);

  }
  // the portal around the window
  // a futuristic pillar: segmented cylinder, stepped base on the ground, collar or a domed top
  function pillar(root, gid, x, pw, y0, y1, { base = false, dome = false, collarAt = null, capital = false } = {}) {
    mk('rect', { x, y: y0, width: pw, height: y1 - y0, fill: `url(#${gid})` }, root);
    mk('line', { x1: x + pw * .5, x2: x + pw * .5, y1: y0, y2: y1, stroke: '#07021a', 'stroke-width': 1, opacity: .35 }, root);
    for (let y = y1 - pw * 1.4; y > y0 + pw * .4; y -= pw * 1.6)                         // segment joints
      mk('rect', { x, y, width: pw, height: Math.max(2, pw * .05), fill: '#0a0426', opacity: .8 }, root);
    if (dome) {                                                                          // rounded top, like the reference
      mk('path', { d: `M${x} ${y0} A${pw / 2} ${pw * .42} 0 0 1 ${x + pw} ${y0} Z`, fill: `url(#${gid})` }, root);
      for (const [dy, grow] of [[pw * .25, .08], [pw * .55, .12]])
        mk('rect', { x: x - pw * grow, y: y0 + dy, width: pw * (1 + 2 * grow), height: Math.max(3, pw * .1), fill: '#2a1f70', stroke: '#0b0528', 'stroke-width': 1.2 }, root);
      neon(root, [[x + pw * .2, y0 + pw * .9], [x + pw * .8, y0 + pw * .9]], Math.max(1, pw * .02));
    }
    if (collarAt !== null)                                                               // where the lintel rests on it
      mk('rect', { x: x - pw * .12, y: collarAt - pw * .1, width: pw * 1.24, height: Math.max(4, pw * .18), fill: '#2a1f70', stroke: '#0b0528', 'stroke-width': 1.5 }, root);
    if (capital) for (let i = 0; i < 3; i++) {                                           // stepped capital under the lintel
      const g = pw * (.3 - i * .1), hh = Math.max(4, pw * .12);
      mk('rect', { x: x - g, y: y0 + hh * i, width: pw + 2 * g, height: hh, fill: i % 2 ? '#22185e' : '#2a1f70', stroke: '#0b0528', 'stroke-width': 1.2 }, root);
    }
    if (base) for (let i = 0; i < 3; i++) {                                              // stepped footing
      const g = pw * (.1 + i * .1), hh = Math.max(4, pw * .12);
      mk('rect', { x: x - g, y: y1 - hh * (3 - i), width: pw + 2 * g, height: hh, fill: i % 2 ? '#22185e' : '#2a1f70', stroke: '#0b0528', 'stroke-width': 1.2 }, root);
    }
  }
  const cylGrad = (defs, id) => {
    const g = mk('linearGradient', { id, x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
    [['0', '#05021a'], ['.22', '#2a1f70'], ['.36', '#4a3bb0'], ['.5', '#2a1f70'], ['.75', '#120b3a'], ['1', '#040114']].forEach(([o, col]) => mk('stop', { offset: o, 'stop-color': col }, g));
  };
  // the building's front: the upper block stands on two tall pillars; deep space shows either side of them
  function drawFacade() {
    art.textContent = '';
    const W = facade.offsetWidth, H = facade.offsetHeight;
    const T = fc.top.el.offsetHeight, FB = fc.bottom.el.offsetHeight, B = H - FB;
    const pw = Math.max(22, W * 0.075), px = W * 0.025;                      // pillar width; gap to the screen edge
    const L = px + pw, R = W - px - pw;                                       // inner faces of the pillars
    const c = Math.min(0.09 * (R - L), 0.22 * (B - T), 95), k = Math.SQRT2 - 1;
    const id = 'fa' + (++uid), defs = mk('defs', {}, art);
    cylGrad(defs, id + 'c');
    const tower = mk('linearGradient', { id: id + 't', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    mk('stop', { offset: 0, 'stop-color': '#1a1150' }, tower); mk('stop', { offset: 1, 'stop-color': '#0f0835' }, tower);

    // stepped central tower above the arch (it continues up the board wall: see towerUp)
    const tw = (R - L) - 2 * c * 0.4, tx = L + c * 0.4;
    const d1 = pw * 0.2, d2 = pw * 0.55;
    geo = { tx, tw, d2, c, L, R, k, pw, px };
    // centre the boards in the wall between the room's ledge and the arch: the band plus the strip above the arch
    const boards = band.querySelectorAll('.board'), bh = band.offsetHeight;
    const bTop = boards[0].offsetTop, bBot = boards[boards.length - 1].offsetTop + boards[boards.length - 1].offsetHeight;
    const zone = bh + Math.max(0, T - d2 - 10), shift = Math.max(0, (zone - (bBot - bTop)) / 2 - bTop);
    band.style.setProperty('--bshift', shift.toFixed(1) + 'px');
    band.dataset.extra = Math.max(0, bBot + shift + 10 - bh).toFixed(1);    // how far the boards now reach below the band
    mk('rect', { x: tx, y: -2, width: tw, height: T + 2, fill: `url(#${id}t)` }, art);
    for (const [inset, alpha] of [[0, .9], [Math.min(26, tw * .05), .6]]) {
      mk('polyline', { points: pts([[tx + inset, T], [tx + inset, 0]]), stroke: '#3a2d8c', 'stroke-width': 1.5, opacity: alpha, fill: 'none' }, art);
      mk('polyline', { points: pts([[tx + tw - inset, T], [tx + tw - inset, 0]]), stroke: '#08031d', 'stroke-width': 1.5, opacity: alpha, fill: 'none' }, art);
    }
    for (let y = T - 14; y > 4; y -= Math.max(18, T / 4)) mk('line', { x1: tx, x2: tx + tw, y1: y, y2: y, stroke: '#0b0528', 'stroke-width': 1.5 }, art);

    // the lintel's underside haunches, where it springs from the pillars
    for (const s of [1, -1]) {
      const x = s > 0 ? L : R;
      mk('polygon', { points: pts([[x, T - 1], [x + s * (c + 1), T - 1], [x, T + c + 1]]), fill: '#120b38' }, art);
      mk('polygon', { points: pts([[x + s * c, T], [x, T + c], [x + s * 10, T + c + 4], [x + s * (c + 4), T + 12]]), fill: s > 0 ? '#22127a' : '#1d0f66' }, art);
    }

    // ground: steps across the whole front
    const stepH = Math.max(5, Math.min(12, FB / 5));
    for (let i = 0; i < 3; i++) {
      const y = B + i * stepH;
      mk('rect', { x: -2, y, width: W + 4, height: stepH, fill: i % 2 ? '#150e40' : '#1a114c', stroke: '#06021a', 'stroke-width': 1 }, art);
      mk('line', { x1: 0, x2: W, y1: y + .5, y2: y + .5, stroke: '#3a2d8c', 'stroke-width': 1, opacity: .8 }, art);
    }

    // the two pillars: from the ground up to the window top, where the building rests on their capitals
    pillar(art, id + 'c', px, pw, T, B + 2, { base: true, capital: true });
    pillar(art, id + 'c', W - px - pw, pw, T, B + 2, { base: true, capital: true });

    // neon: an arch that rises up the pillars' inner faces and across the lintel, and an outer line that climbs the
    // pillars, turns in over the lintel and runs up the tower
    const nw = Math.max(1.3, pw * .03);
    const arch = d => [[L - d, B - pw * .3], [L - d, T + c - d * k], [L + c - d * k, T - d], [R - c + d * k, T - d], [R + d, T + c - d * k], [R + d, B - pw * .3]];
    neon(art, arch(d1), nw);
    const o = arch(d2), up = Math.max(0, T - d2);
    neon(art, [o[0], o[1], o[2], [o[2][0], o[2][1] - up]], nw);
    neon(art, [o[5], o[4], o[3], [o[3][0], o[3][1] - up]], nw);
    const rung = Math.min(16, T * .12);
    neon(art, [[L + c, T - d1 - rung], [R - c, T - d1 - rung]], 1.1).setAttribute('opacity', '.55');
  }

  let last = '';
  function layout() {
    const PW = panelW();
    const sig = [PW, innerWidth, innerHeight, band.offsetHeight, ...Object.values(fc).map(f => f.el.offsetWidth + 'x' + f.el.offsetHeight + '@' + f.el.offsetLeft + ',' + f.el.offsetTop)].join('|');
    if (sig === last) return; last = sig;
    for (const f of Object.values(fc)) { const [x, y] = colPos(f.el); panels(f.sv, x, y, f.el.offsetWidth, f.el.offsetHeight, PW, false); }
    drawFacade();
    const [bx, by] = colPos(band);
    panels(bandSvg, bx, by, band.offsetWidth, band.offsetHeight, PW);
    towerUp(bandSvg, band.offsetWidth, band.offsetHeight);
  }
  window.__wall = { mk, panels, pillar, cylGrad, neon, panelW, colPos, get geo() { return geo; } };   // the handheld frame reuses these
  // the room's front wall, below the LED strip: world x −1600…2900, y 768…1908
  { const g = $('faceHex'); panels(g, 1600 - 55, -768, 4500, 1140, 150); g.setAttribute('transform', 'translate(-1600 768)'); }
  layout();
  addEventListener('resize', () => requestAnimationFrame(layout));
  const ro = new ResizeObserver(() => requestAnimationFrame(layout));   // fit() changes the facade's --top/--fb
  ro.observe(vr); Object.values(fc).forEach(f => ro.observe(f.el));
  setTimeout(layout, 300);
})();
