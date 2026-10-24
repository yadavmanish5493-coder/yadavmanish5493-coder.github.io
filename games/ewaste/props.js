/* People, Ping the phone, district frames, gates, cause-and-effect loops and common props. */
import { THREE, C, Batch, mat, glow, sign, icon, arrow, rand, clamp } from './build.js';

/* ---------- people ---------- */
export function makePerson(o = {}) {
  const s = o.scale || 1, g = new THREE.Group(), inner = new THREE.Group(); inner.scale.setScalar(s); g.add(inner);
  const sh = o.shadow === true;
  const M = (c, w, h, d, x, y, z, par = inner) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c)); m.position.set(x, y, z); m.castShadow = sh; par.add(m); return m; };
  const mkLimb = (x, y, w, h, c) => { const p = new THREE.Group(); p.position.set(x, y, 0); inner.add(p); M(c, w, h, w * 1.05, 0, -h / 2, 0, p); return p; };
  const legL = mkLimb(-0.15, 0.8, 0.23, 0.8, o.pants ?? 0x3a3f45), legR = mkLimb(0.15, 0.8, 0.23, 0.8, o.pants ?? 0x3a3f45);
  M(0x22201e, 0.26, 0.12, 0.34, -0.15, 0.06, 0.04); M(0x22201e, 0.26, 0.12, 0.34, 0.15, 0.06, 0.04);
  M(o.shirt ?? 0xe8572f, 0.64, 0.74, 0.38, 0, 1.18, 0);
  const armL = mkLimb(-0.4, 1.5, 0.17, 0.64, o.sleeve ?? o.shirt ?? 0xe8572f), armR = mkLimb(0.4, 1.5, 0.17, 0.64, o.sleeve ?? o.shirt ?? 0xe8572f);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 14, 10), mat(o.skin ?? 0xf0c8a0)); head.position.y = 1.8; head.castShadow = sh; inner.add(head);
  for (const x of [-0.09, 0.09]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), mat(0x22201e)); e.position.set(x, 1.83, 0.245); inner.add(e); }
  if (o.hair !== undefined) { const hr = new THREE.Mesh(new THREE.SphereGeometry(0.285, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52), mat(o.hair)); hr.position.y = 1.82; hr.rotation.x = -0.25; inner.add(hr); }
  if (o.hat !== null && o.hat !== undefined) { const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.29, 0.13, 14), mat(o.hat)); cap.position.y = 2.0; inner.add(cap); M(o.hat, 0.4, 0.04, 0.22, 0, 1.97, 0.3); }
  if (o.pack) { M(o.pack, 0.5, 0.6, 0.22, 0, 1.2, -0.3); }
  if (o.extra) o.extra(inner, M);
  const out = { g, inner, head, armL, armR,
    walk(step, moving, t) { const a = Math.sin(step) * 0.75 * moving; legL.rotation.x = a; legR.rotation.x = -a; armL.rotation.x = -a * 0.8; armR.rotation.x = a * 0.8; armL.rotation.z = armR.rotation.z = 0; inner.position.y = Math.abs(Math.sin(step)) * 0.07 * moving + Math.sin(t * 2) * 0.01; },
    wave(t) { armR.rotation.x = -2.6 + Math.sin(t * 9) * 0.28; armR.rotation.z = -0.25; },
    hold() { armL.rotation.x = armR.rotation.x = -1.25; },
    cheer(t) { armL.rotation.x = armR.rotation.x = -2.7 + Math.sin(t * 8) * 0.3; armL.rotation.z = 0.25; armR.rotation.z = -0.25; } };
  return out;
}

/* ---------- Ping, the discarded phone ---------- */
const FACES = {
  happy: g => { eyes(g, 0, 0); g.beginPath(); g.arc(128, 270, 60, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); },
  worry: g => { eyes(g, 1, 0); g.beginPath(); g.moveTo(88, 310); g.quadraticCurveTo(128, 270, 168, 310); g.stroke(); },
  scared: g => { eyes(g, 2, 0); g.beginPath(); for (let i = 0; i <= 8; i++) g.lineTo(80 + i * 12, 300 + (i % 2 ? -12 : 12)); g.stroke(); g.fillStyle = '#4aa8d8'; g.beginPath(); g.ellipse(190, 190, 7, 12, 0, 0, 7); g.fill(); },
  hope: g => { eyes(g, 3, 0); g.beginPath(); g.arc(128, 262, 70, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke(); },
};
function eyes(g, kind) {
  g.fillStyle = '#2a2623'; g.lineWidth = 9; g.lineCap = 'round';
  for (const x of [90, 166]) {
    if (kind === 3) { g.beginPath(); g.moveTo(x, 205); g.lineTo(x, 235); g.moveTo(x - 15, 220); g.lineTo(x + 15, 220); g.stroke(); continue; }
    g.beginPath(); g.ellipse(x, 220, kind === 2 ? 17 : 12, kind === 2 ? 22 : 16, 0, 0, 7); g.fill();
    if (kind === 1) { g.beginPath(); g.moveTo(x - 16, x < 128 ? 186 : 176); g.lineTo(x + 16, x < 128 ? 176 : 186); g.stroke(); }
  }
}
export function makePing() {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.05, 0.14), mat(0x2a2623)); body.castShadow = true; inner.add(body);
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 420; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.9), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); scr.position.z = 0.075; inner.add(scr);
  const back = scr.clone(); back.material = new THREE.MeshBasicMaterial({ color: 0x4a4540 }); back.position.z = -0.075; back.rotation.y = Math.PI; inner.add(back);
  const p = { g, inner, cv, tex, face: '' }; setPingFace(p, 'happy'); return p;
}
export function setPingFace(p, f) {
  if (!p || p.face === f) return; p.face = f; const g = p.cv.getContext('2d'); g.clearRect(0, 0, 256, 420);
  g.fillStyle = '#bfeaf2'; g.fillRect(0, 0, 256, 420); g.fillStyle = '#9fd8e6'; g.fillRect(0, 0, 256, 56); g.strokeStyle = '#2a2623'; (FACES[f] || FACES.happy)(g);
  g.strokeStyle = 'rgba(42,38,35,.55)'; g.lineWidth = 3; g.beginPath(); g.moveTo(190, 0); g.lineTo(168, 70); g.lineTo(186, 96); g.lineTo(150, 170); g.stroke(); p.tex.needsUpdate = true;
}

/* ---------- districts ---------- */
const ZC = [C.grey, C.red, C.cyan];
/** Creates the frame of a district: pad slab, walkable area, road to the next one, flowing arrows and a gate. */
export function makeDistrict(W, o) {
  const d = Object.assign({ zr: 34, zone: 0, face: 'happy', groups: [], padColor: 0xe6e1da, roadColor: 0xcfd3d5, last: false }, o);
  d.cx = (d.x0 + d.x1) / 2; d.b = new Batch(); d.W = W;
  d.b.box(d.padColor, d.x1 - d.x0, 0.14, d.zr * 2, d.cx, -0.08, 0);
  W.pad(d.x0, d.x1 + 0.01, -d.zr, d.zr);
  const ed = new THREE.Color(d.padColor).offsetHSL(0, 0.1, -0.32).getHex(), L = d.x1 - d.x0;                                   // raised kerb round the pad, open at the road mouths
  d.b.box(ed, L, 0.5, 0.7, d.cx, 0, -d.zr + 0.35); d.b.box(ed, L, 0.5, 0.7, d.cx, 0, d.zr - 0.35);
  const side = (x, open) => { if (!open) { d.b.box(ed, 0.7, 0.5, d.zr * 2, x, 0, 0); return; } const zl = d.zr - 5.5; for (const q of [-1, 1]) d.b.box(ed, 0.7, 0.5, zl, x, 0, q * (5.5 + zl / 2)); };
  side(d.x0 + 0.35, d.i > 0); side(d.x1 - 0.35, !d.last);
  if (!d.last) {
    const rl = 30;
    d.b.box(d.roadColor, rl, 0.14, 11, d.x1 + rl / 2, -0.08, 0); W.pad(d.x1, d.x1 + rl + 0.01, -5, 5);
    const n = 6, arrows = [];
    for (let i = 0; i < n; i++) { const a = arrow(ZC[d.zone], 1.25, 1); a.position.set(d.x1 + 3 + i * 5, 0.09, 0); W.scene.add(a); arrows.push(a); }
    W.tickers.push((dt, t) => { for (let i = 0; i < n; i++) arrows[i].material.opacity = 0.25 + 0.75 * Math.max(0, Math.sin(t * 3 - i * 0.9)); });
    // gate across the road mouth
    const rect = W.box(d.x1 - 1.3, d.x1 - 0.5, -5.2, 5.2); rect.gate = true;
    const gm = new THREE.Group(); gm.position.set(d.x1 - 0.9, 0, 0);
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.2, 10.4), glow(ZC[Math.min(2, d.zone + (d.i === 4 ? 1 : 0))], 0.34)); wall.position.y = 2.1; gm.add(wall);
    for (const z of [-5.1, 5.1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.6, 4.6, 0.6), mat(C.ink)); p.position.set(0, 2.3, z); gm.add(p); }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 10.8), mat(C.ink)); beam.position.y = 4.6; gm.add(beam);
    const sg = sign('GATE LOCKED\nfinish the tasks', 5.6, 1.5, { fs: 0.5, border: '#e04b2c' }); sg.position.set(-0.4, 6.1, 0); sg.rotation.y = -Math.PI / 2; gm.add(sg);
    W.scene.add(gm); d.gate = { rect, mesh: gm, wall, sign: sg, open: false };
    W.tickers.push((dt, t) => { const g = d.gate; if (g.open) { wall.scale.y += (0.001 - wall.scale.y) * Math.min(1, dt * 4); wall.position.y = 2.1 * wall.scale.y; sg.visible = wall.scale.y > 0.2; } else wall.material.opacity = 0.3 + Math.sin(t * 3) * 0.06; });
  }
  W.districts.push(d); return d;
}
/** Title board hanging over a district entrance */
export function banner(W, d, text, sub, x, z, o = {}) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  for (const dz of [-(o.w || 9) / 2, (o.w || 9) / 2]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, o.h || 7, 8), mat(C.ink)); p.position.set(0, (o.h || 7) / 2, dz); g.add(p); }
  const s = sign(text + (sub ? '\n' + sub : ''), (o.w || 9) + 1.2, 2.6, { fs: sub ? 0.6 : 0.85, border: o.border || '#d4472a' }); s.position.set(0, (o.h || 7) + 0.4, 0); s.rotation.y = -Math.PI / 2; g.add(s); W.scene.add(g); (W.fades = W.fades || []).push(s); return g;
}
export function bill(W, m) { W.bills = W.bills || []; W.bills.push(m); return m; }
export function label(W, text, x, y, z, w = 3, h = 1, o = {}) { const s = sign(text, w, h, o); s.position.set(x, y, z); W.scene.add(s); if (!o.fixed) bill(W, s); else s.rotation.y = o.ry ?? -Math.PI / 2; return s; }

/* ---------- cause-and-effect loop ---------- */
export function loopRing(W, d, o) {
  const R = o.r || 6, col = o.color ?? C.red, N = o.nodes.length, g = new THREE.Group(); g.position.set(o.x, 0, o.z); W.scene.add(g);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(R + 1.6, R + 1.6, 0.08, 48), mat(0xfffdf8)); disc.position.y = 0.06; disc.receiveShadow = true; g.add(disc);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R + 1.6, 0.07, 6, 64), mat(C.orange)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.1; g.add(rim);
  const spin = new THREE.Group(); spin.position.y = 0.12; g.add(spin); const arrows = [];
  const A = o.arrows || 10;
  for (let i = 0; i < A; i++) { const a = (i / A) * Math.PI * 2, m = arrow(col, 0.95, 1); m.position.set(Math.cos(a) * R, 0, Math.sin(a) * R); m.rotation.y = -(a + Math.PI / 2) - 0.2; m.position.y = 0; spin.add(m); arrows.push(m); }
  const nodes = [];
  o.nodes.forEach((txt, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2 + (o.rot || 0), x = o.x + Math.cos(a) * (R + 0.2), z = o.z + Math.sin(a) * (R + 0.2);
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 0.5, 14), mat(0xffffff)); p.position.set(Math.cos(a) * R, 0.3, Math.sin(a) * R); g.add(p);
    const s = sign(txt, 3.6, 1.2, { fs: 0.4, border: o.color === C.cyan ? '#31b5d6' : '#e04b2c' }); s.position.set(x, 2.4, z); W.scene.add(s); bill(W, s);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.7, 6), mat(C.ink)); post.position.set(x, 1.1, z); W.scene.add(post);
    nodes.push({ x, z, a, p, s });
  });
  W.tickers.push((dt, t) => { spin.rotation.y -= dt * 0.55 * (o.dir || 1); });
  const loop = { g, spin, arrows, nodes, R, setColor(c) { arrows.forEach(m => m.material.color.set(c)); } };
  if (o.title) {
    loop.st = W.station({ d: d.i, x: o.x, z: o.z, r: R * 0.55, kind: 'auto', grp: o.grp, req: o.req !== false, id: o.id, title: o.title, html: o.html, ico: o.ico || '🔁', cls: o.cls ?? 'gr', zone: d.zone });
  }
  return loop;
}

/* ---------- common props ---------- */
const LEAF = [0x62b85a, 0x4aa86a, 0x86c850, 0x3f9a5a];
export function tree(b, x, z, s = 1, col) { b.cyl(0x8a5a36, 0.12 * s, 0.17 * s, 1.2 * s, x, 0, z, 6); b.sphere(col ?? LEAF[(Math.abs(Math.floor(x * 3 + z)) % 4)], 0.9 * s, x, 1.7 * s, z, 1, 1.05, 1, 9); }
const WALLS = [0xf7b7a3, 0xa9d6f5, 0xf9e08a, 0xb9e3b0, 0xe5b7f0, 0xfbc98a], ROOFS = [0xd9534f, 0x3d7fbf, 0xe08a2c, 0x4a9a6a];
export function house(b, x, z, w, dd, h, o = {}) {
  const k = Math.abs(Math.floor(x * 7 + z * 3)); b.box(o.wall ?? WALLS[k % 6], w, h, dd, x, 0, z); b.gable(o.roof ?? ROOFS[k % 4], w + 0.5, dd + 0.5, h * 0.42, x, h, z, Math.PI / 2 * (o.turn ? 1 : 0));
  for (let i = 0; i < Math.max(1, Math.floor(w / 3)); i++) b.box(0xf2f0ea, 0.9, 1.0, 0.1, x - w / 2 + 1.5 + i * 2.8, h * 0.45, z - dd / 2 - 0.03, 0, false);
  b.box(0x8b8279, 0.9, 1.7, 0.12, x, 0, z - dd / 2 - 0.04, 0, false);
}
export function container(b, x, z, col, ry = 0, len = 6, hh = 2.6, wd = 2.4) {
  b.box(col, len, hh, wd, x, 0, z, ry);
  const c = Math.cos(ry), s = Math.sin(ry);
  for (let i = -Math.floor(len / 2) + 1; i < len / 2; i++) { const dx = i * 0.8 * c, dz = -i * 0.8 * s; if (Math.abs(i * 0.8) < len / 2 - 0.2) b.box(0x000000, 0.05, hh - 0.2, wd + 0.05, x + dx, 0.1, z + dz, ry, false); }
}
export function lamp(b, x, z, h = 4.5) { b.cyl(0x4b4a48, 0.07, 0.09, h, x, 0, z, 6); b.sphere(0xfff1c2, 0.25, x, h + 0.2, z, 1, 1, 1, 8); }
/** mound of electronic scrap */
export function heap(b, x, z, r = 3, h = 1.6, n = 36) {
  const cols = [0x3a3d40, 0x5b6063, 0x2c9b56, 0x8a8f93, 0xe0553c, 0xe0a42c, 0x3a82c8, 0xb5b8bb, 0x2c9b56, 0xf2c230];
  b.sphere(0x4c4a46, r, x, 0.1, z, 1, h / r * 0.9, 1, 10);
  for (let i = 0; i < n; i++) { const a = rand() * 6.283, rr = Math.sqrt(rand()) * r * 0.85, y = Math.max(0, h * (1 - (rr / r) ** 1.6) * 0.8); b.box(cols[(rand() * cols.length) | 0], 0.5 + rand() * 0.9, 0.2 + rand() * 0.4, 0.4 + rand() * 0.7, x + Math.cos(a) * rr, y, z + Math.sin(a) * rr, rand() * 3, false, (rand() - 0.5) * 0.7, (rand() - 0.5) * 0.7); }
}
export function bags(b, x, z, n = 4) { for (let i = 0; i < n; i++) b.sphere(0x1b1c1e, 0.5 + rand() * 0.15, x + (rand() - 0.5) * 1.6, 0.4, z + (rand() - 0.5) * 1.6, 1, 0.8, 1, 8); }
export function stall(b, x, z, w, col, ry = 0) {
  b.box(0x8a6d4b, w, 0.9, 1.4, x, 0, z, ry); for (const s of [-1, 1]) b.cyl(0x5a4a3a, 0.06, 0.06, 2.5, x + s * (w / 2 - 0.1) * Math.cos(ry), 0, z - s * (w / 2 - 0.1) * Math.sin(ry), 5);
  b.box(col, w + 0.5, 0.14, 2.2, x, 2.5, z, ry, false, 0.18);
}
/** toxic fume cloud: dynamic puffs; returns hazard record {x,z,r} */
export function fume(W, x, z, r = 2.6, col = 0x9bd02e, h = 2.2) {
  const g = new THREE.Group(); g.position.set(x, 0, z); const puffs = [];
  for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(r * (0.35 + rand() * 0.25), 10, 8), glow(col, 0.28)); m.userData = { a: rand() * 6.28, rr: rand() * r * 0.55, sp: 0.4 + rand() * 0.6, y0: 0.5 + rand() * h }; g.add(m); puffs.push(m); }
  W.scene.add(g);
  W.tickers.push((dt, t) => { for (const m of puffs) { const u = m.userData; m.position.set(Math.cos(u.a + t * u.sp) * u.rr, u.y0 + Math.sin(t * u.sp * 2 + u.a) * 0.4, Math.sin(u.a + t * u.sp) * u.rr); const s = 1 + Math.sin(t * 1.3 + u.a) * 0.12; m.scale.setScalar(s); } });
  const hz = { x, z, r: r * 0.85 }; (W.hazards = W.hazards || []).push(hz); return hz;
}
