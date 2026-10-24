/* E-WASTE: THE JOURNEY: engine, player, camera, stations, game flow. The world itself is built in world.js. */
import { THREE, C, mat, glow, icon, clamp, lerp } from './build.js';
import * as ui from './ui.js';
import { buildWorld, makePerson, makePing, setPingFace } from './world.js';
import { LATERAL } from './path.js';
import { Stack } from './items.js';
const { $, HTML } = ui;

const Q = new URLSearchParams(location.search), EMBED = Q.has('embed');
const cv = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(52, 1, 0.3, 420);
const hemi = new THREE.HemisphereLight(0xffffff, 0xcfc8bb, 1.3); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff4e0, 1.55); sun.position.set(-30, 60, 25); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = sc.bottom = -46; sc.right = sc.top = 46; sc.near = 1; sc.far = 160; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
scene.add(sun, sun.target);

/* ---------- state shared with the world ---------- */
const ST = { facts: new Set(), devices: 0, customsOk: 0, customsN: 0, recovered: 0, hits: 0, posters: 0, loopBroken: false, phase: 'title', t0: 0 };
const P = { x: 0, z: 0, vx: 0, vz: 0, tx: 1, tz: 0, ry: 0, health: 100, step: 0, carry: null, y: 0.06 };
const W = { scene, camera, ST, P, ui, THREE, stations: [], obstacles: [], walk: [], tickers: [], districts: [], cur: 0, hint: null, frozen: false, t: 0, shake: 0 };

/* ground: pale paper with a faint dot grid */
{
  const g = document.createElement('canvas'); g.width = g.height = 64; const c = g.getContext('2d'); c.fillStyle = '#e2f2f8'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#b9dbe8'; c.beginPath(); c.arc(32, 32, 2.2, 0, 7); c.fill();
  const t = new THREE.CanvasTexture(g); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(800, 120); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(3200, 480), new THREE.MeshLambertMaterial({ map: t })); m.rotation.x = -Math.PI / 2; m.position.set(400, -0.02, 0); m.receiveShadow = true; scene.add(m);
  W.ground = m;
}

/* ---------- stations ---------- */
W.station = o => {
  const st = Object.assign({ r: 2.4, kind: 'auto', req: true, done: false, on: true, y: 0, ico: '', cls: '' }, o);
  const g = new THREE.Group(); g.position.set(st.x, 0, st.z); st.marker = g;
  if (!o.mesh && !o.noMarker) {
    const col = [C.grey, C.red, C.cyan][st.zone || 0];
    st.ring = new THREE.Mesh(new THREE.RingGeometry(Math.min(st.r, 1.5) * 0.62, Math.min(st.r, 1.5) * 0.78, 40), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false })); st.ring.rotation.x = -Math.PI / 2; st.ring.position.y = 0.1; g.add(st.ring);
    if (st.ico) { st.sprite = icon(st.ico, 1.15, '#fffdf8'); st.sprite.position.y = 2.1 + st.y; g.add(st.sprite); }
    else { st.sprite = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), new THREE.MeshBasicMaterial({ color: col })); st.sprite.position.y = 1.7 + st.y; g.add(st.sprite); }
  }
  if (o.mesh) g.add(o.mesh);
  scene.add(g); W.stations.push(st); return st;
};
W.finish = (st, quiet) => {
  if (st.done) return; st.done = true;
  if (st.ring) { st.ring.material.color.set(0x6dbf8a); st.ring.material.opacity = 0.45; }
  if (st.sprite) st.sprite.visible = false;
  if (st.mesh2) st.mesh2.visible = false;
  if (st.marker) st.marker.visible = false;
  if (st.onDone) st.onDone(st);
  if (!quiet) refresh();
};
W.box = (x0, x1, z0, z1) => { const o = { x0, x1, z0, z1, off: false }; W.obstacles.push(o); return o; };
W.circ = (x, z, r) => { const o = { x, z, r, off: false }; W.obstacles.push(o); return o; };
W.pad = (x0, x1, z0, z1) => W.walk.push([x0, x1, z0, z1]);

/* ---------- objectives / districts ---------- */
function groupStats(d) {
  return d.groups.map(g => { const sts = W.stations.filter(s => s.d === d.i && s.grp === g.grp && s.req); const have = sts.filter(s => s.done).length; const need = g.need || sts.length; return { text: typeof g.text === 'function' ? g.text() : g.text, have, need, done: have >= need && need > 0, grp: g.grp }; });
}
function refresh() {
  const d = W.districts[W.cur]; if (!d) return;
  const gs = groupStats(d); ui.setObjectives(gs);
  if (gs.every(g => g.done) && !d.complete) completeDistrict(d);
  document.querySelectorAll('#route .pip').forEach((p, i) => { p.classList.toggle('ok', !!W.districts[i].complete); p.classList.toggle('cur', i === W.cur); });
}
function completeDistrict(d) {
  d.complete = true; ui.sfx('gate');
  if (d.gate) { d.gate.rect.off = true; d.gate.open = true; }
  if (d.onComplete) d.onComplete();
  if (d.i === W.districts.length - 1) { ui.toast('The loop is broken. Walk to the pencil to finish.', 4000); }
  else ui.toast(`<b>District ${d.i + 1} complete.</b> The gate to ${W.districts[d.i + 1].name} is open.`, 4200);
  document.querySelectorAll('#route .pip').forEach((p, i) => p.classList.toggle('ok', !!W.districts[i].complete));
}
function setCur(i) {
  if (i === W.cur && W.districts[i].shown) return; W.cur = i; const d = W.districts[i]; d.shown = true;
  ui.setDistrict(i, d.name, d.sub); refresh(); if (d.enter) d.enter();
  setPingFace(W.ping, d.face || 'happy');
  if (ST.phase === 'play') ui.toast(`<b>District ${i + 1}</b> · ${d.name}`, 2200);
}

/* ---------- build everything ---------- */
const avatar = makePerson({ shirt: 0xe8572f, pants: 0x3a3f45, skin: 0xf0c8a0, hat: 0x31b5d6, pack: 0x7b8a90, scale: 1, shadow: true }); scene.add(avatar.g);
const ping = makePing(); scene.add(ping.g); W.ping = ping; W.avatar = avatar;
const stack = new Stack(scene, avatar.g); W.stack = stack;
buildWorld(W);
W.districts.forEach((d, i) => { d.i = i; });
/* every reachable station becomes a STOP on the rail: the collector halts there until it has played out */
W.stops = []; W.dropped = [];
for (const st of W.stations) {
  if (st.kind === 'none' || !st.on) continue;
  const R = W.rail; let bi = 0, bd = 1e9; for (let i = 0; i <= R.N; i++) { const dd = (R.X[i] - st.x) ** 2 + (R.Z[i] - st.z) ** 2; if (dd < bd) { bd = dd; bi = i; } }
  if (Math.sqrt(bd) > st.r * 0.97 + 0.01) { st.on = false; st.marker.visible = false; W.dropped.push(st.id || st.title); continue; }
  st.stopS = bi * R.step; W.stops.push(st);
}
W.stops.sort((a, b) => a.stopS - b.stopS);
for (const f of W.later) f();      // things that need the track (people who wait beside a stop)
// route strip
{
  const bar = $('#bar'), total = W.districts[W.districts.length - 1].x1;
  W.districts.forEach((d, i) => { const p = document.createElement('div'); p.className = 'pip'; p.style.left = (d.cx / total * 100) + '%'; p.textContent = i + 1; p.title = d.name; bar.appendChild(p); });
  const me = document.createElement('div'); me.className = 'me'; bar.appendChild(me); W.me = me; W.total = total;
}

/* ---------- input ---------- */
const keys = {};
let cyaw = 0, cpitch = 0.56, cdist = 12.5, camYawOff = 0;     // the camera rides the track: no free orbit
const RAIL = { s: 0, target: 0, vel: 0, off: 0, offT: 0, warn: 0 };
const STOP = { cur: null, t: 0, shown: null, cf: 0, idle: 0 };
const scrolled = () => { STOP.idle = 0; ui.scrollHint(false); if (!STOP.began) { STOP.began = true; ui.hideNote(); } };
const canMove = () => ST.phase === 'play' && !ui.cardOpen() && !STOP.cur && !W.frozen;
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.code === 'Escape') { if ($('#how').classList.contains('on')) { $('#how').classList.remove('on'); return; } if (EMBED) { try { parent.document.getElementById('hhExit').click(); } catch (x) { /* standalone */ } } return; }
  if (e.code === 'KeyM') { ui.toggleMute(); return; }
  if (e.code === 'KeyH') { $('#how').classList.toggle('on'); return; }
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (['KeyW', 'KeyS', 'ArrowUp', 'ArrowDown'].includes(e.code) && canMove()) scrolled();
  keys[e.code] = true;
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
/* scrolling walks the collector to the next stop; dragging does the same (up = forward) and also side-steps */
addEventListener('wheel', e => { if ($('#how').classList.contains('on')) return; e.preventDefault(); if (canMove()) { RAIL.target += clamp(e.deltaY, -160, 160) * 0.08; scrolled(); } }, { passive: false });
let drag = null;
cv.addEventListener('pointerdown', e => { drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); cv.focus(); });
cv.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return;
  if (canMove()) { RAIL.target -= (e.clientY - drag.y) * 0.07; RAIL.offT = clamp(RAIL.offT + (e.clientX - drag.x) * 0.03, -LATERAL, LATERAL); scrolled(); }
  drag.x = e.clientX; drag.y = e.clientY;
});
const dragEnd = e => { if (drag && e.pointerId === drag.id) drag = null; };
cv.addEventListener('pointerup', dragEnd); cv.addEventListener('pointercancel', dragEnd);
$('#snd').onclick = () => ui.toggleMute(); $('#hlp').onclick = () => $('#how').classList.add('on'); $('#hOk').onclick = () => $('#how').classList.remove('on'); $('#bHow').onclick = () => $('#how').classList.add('on');
$('#bPlay').onclick = () => startPlay();

/* ---------- the collector walks the rail, one stop at a time ---------- */
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
W.setS = s => { RAIL.s = RAIL.target = s; RAIL.vel = 0; RAIL.off = RAIL.offT = 0; };
const nextStop = () => { for (const s of W.stops) if (!s.done) return s; return null; };
function sMax() { let top = W.rail.len; for (const d of W.districts) if (!d.complete) { top = d.last ? W.rail.len : d.gateS - 0.9; break; } const n = nextStop(); return n ? Math.min(top, n.stopS) : top; }
function engage(st) {
  STOP.cur = st; STOP.t = 0; st.hold = 1.4; st.modal = false; if (st.marker) st.marker.visible = false; ST.facts.add(st.id || st.title || 'stop' + Math.round(st.stopS)); ui.sfx('fact');
  if (st.onArrive) { const r = st.onArrive(st); if (r) { if (r.hold) st.hold = r.hold; if (r.modal) st.modal = true; } }
}
function updateStop(dt) {
  const st = STOP.cur; if (!st) return; STOP.t += dt;
  const ready = st.modal ? st.done && !ui.cardOpen() : STOP.t >= st.hold && !ui.cardOpen();
  if (ready) { if (!st.done) W.finish(st); STOP.cur = null; STOP.idle = 0; }
}
W.skipTo = s => { for (const st of W.stops) if (st.stopS < s - 0.5 && !st.done) W.finish(st, true); refresh(); W.setS(s); };
function stepPlayer(dt) {
  const rail = W.rail, live = canMove();
  if (live) {
    if (keys.KeyW || keys.ArrowUp) RAIL.target += (keys.ShiftLeft || keys.ShiftRight ? 16 : 10) * dt;
    if (keys.KeyS || keys.ArrowDown) RAIL.target -= 10 * dt;
    const lat = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
    if (lat) RAIL.offT = lat * LATERAL; else if (!drag) RAIL.offT = 0;
  } else if (STOP.cur) RAIL.target = RAIL.s;
  const top = sMax(); if (RAIL.target > top + 0.01 && live) {
    const n = nextStop(); const d = W.districts[W.cur];
    if (!n || n.stopS > top + 0.01) { RAIL.warn -= dt; if (RAIL.warn <= 0 && d) { const gs = groupStats(d), left = gs.filter(g => !g.done).length; if (left) ui.toast(`<b>Gate locked.</b> ${left} task${left === 1 ? '' : 's'} left in ${d.name}.`, 1800); RAIL.warn = 2.4; } }
  }
  RAIL.target = clamp(RAIL.target, 0, top);
  const maxv = 14 * (P.slow || 1), want = clamp((RAIL.target - RAIL.s) * 4.2, -maxv, maxv);
  RAIL.vel += (want - RAIL.vel) * Math.min(1, dt * 8); RAIL.s = clamp(RAIL.s + RAIL.vel * dt, 0, top);
  RAIL.off += (RAIL.offT - RAIL.off) * Math.min(1, dt * 9);
  const a = rail.at(RAIL.s); P.x = a.x - a.tz * RAIL.off; P.z = a.z + a.tx * RAIL.off;
  const spd = Math.abs(RAIL.vel), sg = RAIL.vel < 0 ? -1 : 1; P.spd = spd; P.vx = a.tx * RAIL.vel; P.vz = a.tz * RAIL.vel; P.tx = a.tx; P.tz = a.tz;
  if (spd > 0.4) { P.ry += angDiff(Math.atan2(a.tx * sg, a.tz * sg), P.ry) * Math.min(1, dt * 10); P.step += spd * dt * 1.5; }
  else if (STOP.cur && STOP.cur.faceStation) { const q = pointOf(STOP.cur); P.ry += angDiff(Math.atan2(q.x - P.x, q.z - P.z), P.ry) * Math.min(1, dt * 6); }
  avatar.g.position.set(P.x, P.y, P.z); avatar.g.rotation.y = P.ry; avatar.walk(P.step, spd > 0.4 ? 1 : 0, W.t);
  if (ST.phase === 'play' && !STOP.cur) { const n = nextStop(); if (n && Math.abs(RAIL.s - n.stopS) < 0.22 && spd < 4.5) engage(n); }
  updateStop(dt);
  if (ST.phase === 'play' && !STOP.cur && !ui.cardOpen() && spd < 0.3) { STOP.idle += dt; if (STOP.idle > 2.4) ui.scrollHint(true); } else if (spd >= 0.3) STOP.idle = 0;
}
function pingFollow(dt, t) {
  const g = ping.g, fx = Math.cos(cyaw), fz = Math.sin(cyaw); // hovers at the player's right shoulder so it never hides them
  const bx = P.x + fx * 0.2 - fz * 1.9, bz = P.z + fz * 0.2 + fx * 1.9;
  g.position.x += (bx - g.position.x) * Math.min(1, dt * 4.5); g.position.z += (bz - g.position.z) * Math.min(1, dt * 4.5);
  g.position.y = 2.6 + Math.sin(t * 2.2) * 0.15; g.rotation.y += angDiff(Math.atan2(-fx, -fz), g.rotation.y) * Math.min(1, dt * 5);   // screen faces the camera
  g.rotation.z = Math.sin(t * 1.7) * 0.08;
}

/* ---------- station markers and the info card ---------- */
const _pv = new THREE.Vector3(), _q = new THREE.Vector3();
function pointOf(st) { if (st.anchorFn) { st.anchorFn(_q); return _q; } return _q.set(st.x, 1.9, st.z); }
function animateStations(t) {
  for (const s of W.stations) {
    if (!s.on || !s.marker) continue;
    if (s.sprite && s.sprite.visible) { s.sprite.position.y = (s.base ?? (s.ico ? 2.1 : 1.7)) + s.y + Math.sin(t * 2.4 + s.x) * 0.14; if (!s.ico) s.sprite.rotation.y = t * 2; else s.sprite.lookAt(camera.position); }
    if (s.ring && !s.done) { const p = 1 + Math.sin(t * 3 + s.x) * 0.06; s.ring.scale.set(p, p, p); }
  }
}
function infoFor() {
  if (ST.phase !== 'play' || ui.cardOpen()) return null;
  if (STOP.cur) return STOP.cur.modal ? null : STOP.cur;
  if (Math.abs(RAIL.vel) < 1.2) for (const s of W.stops) if (s.done && Math.abs(RAIL.s - s.stopS) < 0.7) return s;      // scroll back to read a stop again
  return null;
}
function updateInfo(dt) {
  const sh = infoFor(), st = sh && sh.title ? sh : null;
  if (st !== STOP.shown) { STOP.shown = st; if (st) ui.callout({ title: st.title, html: st.html || '', ico: st.ico, cls: st.cls, stat: st.stat }); else ui.hideCallout(); }
  STOP.cf += ((st ? 1 : 0) - STOP.cf) * Math.min(1, dt * 3);
  if (st) { _pv.copy(pointOf(st)).project(camera); ui.placeCallout((_pv.x * 0.5 + 0.5) * innerWidth, (-_pv.y * 0.5 + 0.5) * innerHeight); }
}

/* ---------- hint arrow, palette ---------- */
const hint = new THREE.Group(); { const a = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.9, 4), new THREE.MeshBasicMaterial({ color: 0xf2c230 })); a.rotation.x = Math.PI / 2; a.position.set(0, 0.35, 1.9); hint.add(a); }
scene.add(hint);
function hintTarget() { const n = nextStop(); return n ? [n.x, n.z] : null; }
const PAL = [
  { bg: 0xa9dcff, fog: 0xbfe6ff, hemi: 0xffffff, ground: 0xa6d49a },     // home: sunny sky, green lawn
  { bg: 0x8fd3f0, fog: 0xa8dcf0, hemi: 0xf2f8ff, ground: 0x8fc0d8 },     // port: sea blue
  { bg: 0xffe39a, fog: 0xffeab8, hemi: 0xfffbea, ground: 0xe8c878 },     // india: golden
  { bg: 0xf3b878, fog: 0xf3c890, hemi: 0xfff0d8, ground: 0xc89a68 },     // informal: hazy orange
  { bg: 0xffb8d8, fog: 0xffcfe4, hemi: 0xfff4f8, ground: 0xd89ab8 },     // middlemen / policy: pink
  { bg: 0x8ff0e6, fog: 0xb0f2ea, hemi: 0xf4fcff, ground: 0x88d0c8 },     // awareness: aqua
];
const _c1 = new THREE.Color(), _c2 = new THREE.Color(), _wp = new THREE.Vector3();
function palette(px, dt) {
  const ds = W.districts, n = ds.length; let f = 0;
  if (px <= ds[0].cx) f = 0; else if (px >= ds[n - 1].cx) f = n - 1; else for (let i = 0; i < n - 1; i++) if (px < ds[i + 1].cx) { f = i + clamp((px - ds[i].cx) / (ds[i + 1].cx - ds[i].cx)); break; }
  const i = Math.min(n - 2, Math.floor(f)), t = f - i, a = PAL[i], b = PAL[i + 1], s = t * t * (3 - 2 * t);
  _c1.set(a.bg).lerp(_c2.set(b.bg), s); scene.background = scene.background || new THREE.Color(); scene.background.copy(_c1);
  scene.fog = scene.fog || new THREE.Fog(0xffffff, 40, 150); scene.fog.color.set(a.fog).lerp(_c2.set(b.fog), s); scene.fog.near = 38; scene.fog.far = 135 + 20 * (1 - clamp(P.hazy || 0));
  hemi.color.set(a.hemi).lerp(_c2.set(b.hemi), s); hemi.groundColor.set(a.ground).lerp(_c2.set(b.ground), s);
}

/* ---------- game flow ---------- */
function startPlay() {
  ST.phase = 'play'; ST.t0 = performance.now(); ui.fade(false); $('#title').classList.remove('on'); document.body.classList.remove('title'); $('#how').classList.remove('on'); ui.sfx('ok');
  const d = W.districts[0]; W.setS(0); P.health = 100; { const a0 = W.rail.at(0); P.x = a0.x; P.z = a0.z; P.tx = a0.tx; P.tz = a0.tz; P.ry = Math.atan2(a0.tx, a0.tz); cyaw = Math.atan2(a0.tz, a0.tx); } ping.g.position.set(P.x - 2, 2, P.z - 2);
  W.cur = -1; setCur(0); canvasFocus();
  ui.scrollHint(true); ui.note('Welcome', 'Scroll to walk. The collector stops at every point so you can read the info card, then scroll again to carry on.', { ms: 8000 });
}
const canvasFocus = () => { try { cv.focus(); } catch (e) { /* ignore */ } };
W.end = () => {
  if (ST.phase === 'end') return; ST.phase = 'end'; ui.sfx('gate');
  const secs = Math.round((performance.now() - ST.t0) / 1000), mm = Math.floor(secs / 60), ss = String(secs % 60).padStart(2, '0');
  const e = $('#end'); e.querySelector('.box').innerHTML = `<div class="kick" style="font-size:.72em;letter-spacing:.14em;font-weight:700;color:var(--cyan)">LOOP BROKEN</div><h3>You followed the journey.</h3>
    <p>Awareness campaigns on e-waste trucks reach the informal workers who handle most of India's e-waste, and show them safer, better-paid ways to earn from it.</p>
    <div class="stats"><div><b>${ST.facts.size}</b>facts found</div><div><b>${ST.devices}/5</b>old devices</div><div><b>${ST.customsOk}/${ST.customsN || 6}</b>containers judged right</div><div><b>${ST.recovered}%</b>metals recovered by hand</div><div><b>${ST.posters}/6</b>posters on trucks</div><div><b>${mm}:${ss}</b>time</div></div>
    <div class="oa"><b>Opportunity area 1: awareness campaign.</b> Posters on garbage and e-waste transport vehicles reach informal labourers and show pathways to employment.</div>
    <div class="oa"><b>Opportunity area 2.</b> Talks with organisations and ground research are still going on.</div>
    <div class="btns"><button class="btn ghost" id="eAgain">PLAY AGAIN</button><button class="btn cy" id="eKeep">KEEP EXPLORING</button></div>`;
  e.classList.add('on'); $('#eKeep').onclick = () => { e.classList.remove('on'); ST.phase = 'play'; };
  $('#eAgain').onclick = () => { const u = new URL(location.href); u.searchParams.delete('bg'); location.href = u.href; };
};
window.gameStart = () => { HTML.classList.remove('bgonly'); };

/* ---------- main loop ---------- */
function resize() { const w = cv.clientWidth || innerWidth, h = cv.clientHeight || innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); new ResizeObserver(resize).observe(cv); resize();
let last = performance.now(), attractT = 0, attractI = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now; W.t += dt; const t = W.t;
  const play = ST.phase !== 'title';
  if (play) {
    stepPlayer(dt); pingFollow(dt, t); stack.update(dt, t, P.spd || 0);
    let ci = 0; W.districts.forEach((d, i) => { if (P.x >= d.x0 - 16) ci = i; }); if (ci !== W.cur) setCur(ci);
    animateStations(t); updateInfo(dt);
  }
  for (const f of W.tickers) f(dt, t);
  for (const m of W.fades || []) { m.getWorldPosition(_wp); m.material.opacity = clamp((camera.position.distanceTo(_wp) - 7) / 8, 0.1, 1); }   // overhead banners fade out as the camera passes through them
  for (const m of W.bills) m.rotation.y = Math.atan2(camera.position.x - m.position.x, camera.position.z - m.position.z);
  // camera
  if (play) {
    const hy = Math.atan2(P.tz, P.tx) + camYawOff; cyaw += angDiff(hy, cyaw) * Math.min(1, dt * 3.2);
    const tx = P.x, ty = 1.7, tz = P.z, cp = Math.cos(cpitch);
    camera.position.set(tx - Math.cos(cyaw) * cdist * cp, ty + Math.sin(cpitch) * cdist, tz - Math.sin(cyaw) * cdist * cp);
    if (W.shake > 0) { W.shake -= dt; camera.position.x += (Math.random() - 0.5) * 0.25; camera.position.y += (Math.random() - 0.5) * 0.25; }
    const fl = STOP.shown, fp = fl ? pointOf(fl) : null, fx = fp ? (fp.x - tx) * 0.45 * STOP.cf : 0, fz = fp ? (fp.z - tz) * 0.45 * STOP.cf : 0;      // at a stop the view leans toward what you are reading about
    camera.lookAt(tx + Math.cos(cyaw) * (3.5 + 2.5 * STOP.cf) + fx * 0.6, ty - 0.4, tz + Math.sin(cyaw) * (3.5 + 2.5 * STOP.cf) + fz * 0.6);   // looking a little ahead keeps the collector in the lower half, under the card
    palette(P.x, dt);
    sun.position.set(P.x - 30, 60, P.z + 25); sun.target.position.set(P.x, 0, P.z);
    // hint
    const ht = ST.phase === 'play' && !ui.cardOpen() && !STOP.cur ? hintTarget() : null;
    if (ht) { const a = Math.atan2(ht[0] - P.x, ht[1] - P.z), far = Math.hypot(ht[0] - P.x, ht[1] - P.z) > 5; hint.visible = far; hint.position.set(P.x, 0.06, P.z); hint.rotation.y = a; hint.children[0].position.y = 0.35 + Math.sin(t * 5) * 0.08; } else hint.visible = false;
    W.me.style.left = clamp(P.x / W.total * 100, 0, 100) + '%';
    ui.setHealth(P.health, P.health < 100);
  } else {
    // attract: orbit the districts one by one
    attractT += dt; if (attractT > 11) { attractT = 0; attractI = (attractI + 1) % W.districts.length; }
    const d = W.districts[attractI], a = Math.sin(attractT * 0.12 + attractI) * 0.9, r = 40;   // swings about the entrance side so signs stay readable
    camera.position.set(d.cx - Math.cos(a) * r, 17 + Math.sin(attractT * .3) * 2, Math.sin(a) * r * 0.8); camera.lookAt(d.cx, 1, 0);
    palette(d.cx, dt); sun.position.set(d.cx - 30, 60, 25); sun.target.position.set(d.cx, 0, 0);
    ui.fade(attractT < 0.5 || attractT > 10.5);
    avatar.g.position.set(d.cx, P.y, 8); avatar.walk(t * 4, 0, t); ping.g.position.set(d.cx + 1.6, 2.2 + Math.sin(t * 2) * .15, 7);
  }
  renderer.render(scene, camera);
}
window.EW = { ST, W, P, renderer, RAIL, STOP, stack, tp: i => W.skipTo(W.districts[i].sStart), start: startPlay, setCam: (y, p, d) => { camYawOff = y; cpitch = p; cdist = d; } };
requestAnimationFrame(frame);
