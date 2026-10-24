/* Everything that makes the world feel alive: people who hand you e-waste, walkers, vehicles, birds, clouds. */
import { THREE, C, mat, glow, sign, rand } from './build.js';
import { makePerson } from './props.js';
import { makeItem } from './items.js';

const _v = new THREE.Vector3();
const ease = u => u * u * (3 - 2 * u);
const angTo = (dx, dz) => Math.atan2(dx, dz);
const lerpAng = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * k; };

/* ---------- a person who hands you something when you stop next to them ---------- */
export function giver(W, st, o) {
  const p = makePerson({ shirt: o.shirt, pants: o.pants, skin: o.skin, hair: o.hair, hat: o.hat ?? null, scale: o.scale || 1 }); W.scene.add(p.g);
  const held = makeItem(o.kind, o.opts); held.g.scale.setScalar(o.itemScale || 0.75); held.g.position.set(0, 0.9, 0.62); p.inner.add(held.g);
  const home = new THREE.Vector3(), S = { ph: 'idle', t: 0, step: 0 }; let target = new THREE.Vector3();
  W.later.push(() => {
    const a = W.rail.at(st.stopS), side = (o.side ?? 1) * (o.dist ?? 2.7);
    home.set(a.x - a.tz * side, 0.06, a.z + a.tx * side); p.g.position.copy(home); p.g.rotation.y = angTo(a.x - home.x, a.z - home.z); p.hold();
  });
  st.onArrive = () => { S.ph = 'give'; S.t = 0; S.flew = false; target.set(W.P.x, 0, W.P.z); return { hold: o.hold || 3.2 }; };
  st.faceStation = true; st.anchorFn = v => v.set(p.g.position.x, 2.3, p.g.position.z);
  W.tickers.push((dt, t) => {
    if (S.ph === 'idle') { p.walk(0, 0, t); p.hold(); p.g.position.y = 0.06; return; }
    S.t += dt; const away = _v.set(home.x - target.x, 0, home.z - target.z).normalize(), meet = new THREE.Vector3(target.x + away.x * 1.5, 0.06, target.z + away.z * 1.5);
    let moving = 0, pos = null;
    if (S.t < 0.9) { pos = home.clone().lerp(meet, ease(S.t / 0.9)); moving = 1; }
    else if (S.t < 1.6) { pos = meet; }
    else if (S.t < 2.6) { pos = meet.clone().lerp(home, ease((S.t - 1.6) / 1.0)); moving = 1; }
    else { pos = home; }
    const prev = p.g.position.clone(); p.g.position.copy(pos);
    if (S.t < 1.6) p.g.rotation.y = lerpAng(p.g.rotation.y, angTo(target.x - pos.x, target.z - pos.z), 0.25);
    else if (S.t < 2.6) p.g.rotation.y = lerpAng(p.g.rotation.y, angTo(prev.x - pos.x || 1e-3, prev.z - pos.z), 0.2);
    else p.g.rotation.y = lerpAng(p.g.rotation.y, angTo(target.x - home.x, target.z - home.z), 0.1);
    S.step += moving * dt * 6; p.walk(S.step, moving, t);
    if (S.t < 1.6) p.hold(); else if (S.t >= 2.6) p.wave(t);
    if (S.t > 1.45 && !S.flew) {
      S.flew = true; held.g.visible = false; held.g.getWorldPosition(_v);
      W.stack.add(o.kind, _v.clone(), () => { W.ui.sfx('pick'); o.onGive && o.onGive(); }, o.opts);
    }
    if (S.t > 4.5 && S.ph === 'give') S.ph = 'done';
  });
  return p;
}

/* ---------- people standing about, who wave when you come near ---------- */
export function idler(W, o) {
  const p = makePerson({ shirt: o.shirt, pants: o.pants, skin: o.skin, hair: o.hair, hat: o.hat ?? null, scale: o.scale || 1, pack: o.pack }); p.g.position.set(o.x, o.y ?? 0.06, o.z); p.g.rotation.y = o.ry ?? 0; W.scene.add(p.g);
  if (o.hold) { const it = makeItem(o.hold); it.g.scale.setScalar(0.55); it.g.position.set(0, 1.0, 0.45); p.inner.add(it.g); }
  const ph = rand() * 6;
  W.tickers.push((dt, t) => {
    p.walk(0, 0, t + ph);
    if (o.hold) p.hold();
    const near = Math.hypot(W.P.x - o.x, W.P.z - o.z) < (o.range || 14);
    if (near && !o.hold) { p.wave(t + ph); p.g.rotation.y = lerpAng(p.g.rotation.y, angTo(W.P.x - o.x, W.P.z - o.z), 0.08); }
    else if (!o.hold) p.g.rotation.y = lerpAng(p.g.rotation.y, o.ry ?? 0, 0.05);
  });
  return p;
}

/* ---------- walkers: ping-pong along a polyline ---------- */
export function walker(W, o) {
  const p = makePerson({ shirt: o.shirt, pants: o.pants, skin: o.skin, hair: o.hair, hat: o.hat ?? null, scale: o.scale || 1, pack: o.pack }); W.scene.add(p.g);
  if (o.carry) { const it = makeItem(o.carry); it.g.scale.setScalar(o.carryScale || 0.5); it.g.position.set(0, 0.95, 0.5); p.inner.add(it.g); }
  const pts = o.pts.map(q => new THREE.Vector2(q[0], q[1])), segs = [], lens = []; let total = 0;
  for (let i = 0; i < pts.length - 1; i++) { const l = pts[i].distanceTo(pts[i + 1]); lens.push(l); total += l; }
  let d = (o.phase ?? rand()) * total * 2, step = rand() * 6, pause = 0;
  W.tickers.push((dt, t) => {
    const sp = o.speed || 1.6;
    d += dt * sp; const m = d % (2 * total), u = m < total ? m : 2 * total - m, dir = m < total ? 1 : -1;
    let acc = 0, i = 0; while (i < lens.length - 1 && acc + lens[i] < u) { acc += lens[i]; i++; }
    const f = lens[i] ? (u - acc) / lens[i] : 0, a = pts[i], b = pts[i + 1], x = a.x + (b.x - a.x) * f, z = a.y + (b.y - a.y) * f;
    p.g.position.set(x, 0.06, z); p.g.rotation.y = lerpAng(p.g.rotation.y, angTo((b.x - a.x) * dir, (b.y - a.y) * dir), 0.15);
    step += dt * sp * 3.4; p.walk(step, 1, t); if (o.carry) p.hold();
    if (o.cheer) p.cheer(t);
  });
  return p;
}

/* ---------- vehicles ---------- */
function vehicleModel(kind, color) {
  const g = new THREE.Group(), M = (c, w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c)); m.position.set(x, y, z); g.add(m); return m; };
  const wheel = (x, z, r = 0.45) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.35, 12), mat(0x22201e)); w.rotation.x = Math.PI / 2; w.position.set(x, r, z); g.add(w); };
  if (kind === 'car') { M(color, 3.6, 0.9, 1.7, 0, 0.75, 0); M(0xdff3fa, 1.9, 0.75, 1.5, -0.2, 1.5, 0); M(color, 2.0, 0.12, 1.55, -0.2, 1.9, 0); for (const x of [-1.1, 1.1]) for (const z of [-0.85, 0.85]) wheel(x, z, 0.4); }
  else if (kind === 'truck') { M(0xf2f2ee, 4.8, 2.6, 2.3, -1.2, 1.9, 0); M(color, 4.85, 0.3, 2.35, -1.2, 0.8, 0); M(0xe04b2c, 1.8, 1.9, 2.2, 2.1, 1.45, 0); M(0x9fd8e6, 0.08, 0.8, 1.8, 3.02, 1.8, 0); for (const x of [-2.6, -0.4, 2.2]) for (const z of [-1.1, 1.1]) wheel(x, z, 0.5); }
  else if (kind === 'forklift') { M(color, 1.6, 0.9, 1.1, 0, 0.75, 0); M(0x333333, 0.1, 2.0, 0.9, 1.0, 1.2, 0); M(0xc8c8c8, 1.0, 0.08, 0.14, 1.5, 0.35, -0.3); M(0xc8c8c8, 1.0, 0.08, 0.14, 1.5, 0.35, 0.3); M(0x333333, 0.9, 0.06, 0.9, -0.1, 2.0, 0); const b = M(0xc29358, 0.8, 0.7, 0.8, 1.5, 0.78, 0); for (const x of [-0.5, 0.5]) for (const z of [-0.55, 0.55]) wheel(x, z, 0.28); }
  else if (kind === 'cart') { M(0x8a6d4b, 2.4, 0.18, 1.3, 0, 0.9, 0); M(0x8a6d4b, 2.4, 0.5, 0.1, 0, 1.2, 0.6); M(0x8a6d4b, 2.4, 0.5, 0.1, 0, 1.2, -0.6); for (const [x, y, z, c] of [[-0.5, 1.3, 0, 0x3a3d40], [0.1, 1.35, 0.1, 0x93a4ab], [0.6, 1.3, -0.1, 0x2c9b56], [-0.1, 1.7, 0, 0xe0553c]]) M(c, 0.6, 0.5, 0.6, x, y, z); for (const z of [-0.7, 0.7]) wheel(0, z, 0.45); }
  g.traverse(m => { if (m.isMesh) m.castShadow = false; });
  return g;
}
export function vehicle(W, o) {
  const g = vehicleModel(o.kind || 'car', o.color ?? 0xe04b2c); W.scene.add(g);
  const pts = o.pts.map(q => new THREE.Vector2(q[0], q[1])), lens = []; let total = 0;
  for (let i = 0; i < pts.length - 1; i++) { const l = pts[i].distanceTo(pts[i + 1]); lens.push(l); total += l; }
  let d = (o.phase ?? rand()) * total * 2;
  W.tickers.push((dt, t) => {
    d += dt * (o.speed || 4); const m = d % (2 * total), u = m < total ? m : 2 * total - m, dir = m < total ? 1 : -1;
    let acc = 0, i = 0; while (i < lens.length - 1 && acc + lens[i] < u) { acc += lens[i]; i++; }
    const f = lens[i] ? (u - acc) / lens[i] : 0, a = pts[i], b = pts[i + 1];
    g.position.set(a.x + (b.x - a.x) * f, 0.06 + Math.abs(Math.sin(t * 20 + d)) * 0.02, a.y + (b.y - a.y) * f);
    g.rotation.y = lerpAng(g.rotation.y, Math.atan2(-(b.y - a.y) * dir, (b.x - a.x) * dir), 0.2);   // models point along +x
  });
  return g;
}

/* ---------- birds and clouds ---------- */
export function flock(W, cx, cz, r, n, y = 16, color = 0xffffff) {
  const birds = [];
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group(), body = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.6, 5), new THREE.MeshBasicMaterial({ color })); body.rotation.x = Math.PI / 2; g.add(body);
    const wl = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.28), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })), wr = wl.clone(); wl.position.x = -0.42; wr.position.x = 0.42; wl.rotation.x = wr.rotation.x = Math.PI / 2; g.add(wl, wr);
    W.scene.add(g); birds.push({ g, wl, wr, a: rand() * 6.28, rr: r * (0.7 + rand() * 0.5), yy: y + rand() * 5, sp: 0.18 + rand() * 0.1 });
  }
  W.tickers.push((dt, t) => { for (const b of birds) { b.a += dt * b.sp; const x = cx + Math.cos(b.a) * b.rr, z = cz + Math.sin(b.a) * b.rr * 0.7; b.g.position.set(x, b.yy + Math.sin(t * 1.3 + b.a * 3) * 0.8, z); b.g.rotation.y = Math.atan2(-Math.sin(b.a) * b.rr, Math.cos(b.a) * b.rr * 0.7); const f = Math.sin(t * 11 + b.a * 5) * 0.7; b.wl.rotation.z = f; b.wr.rotation.z = -f; } });
}
export function clouds(W, x0, x1) {
  const cl = [], mt = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92, fog: false });
  for (let i = 0; i < 26; i++) {
    const g = new THREE.Group(), n = 3 + (i % 3); for (let k = 0; k < n; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(3 + rand() * 3, 10, 8), mt); s.position.set((k - n / 2) * 4.2, rand() * 2, rand() * 3); s.scale.y = 0.62; g.add(s); }
    g.position.set(x0 + (x1 - x0) * (i / 26) + rand() * 20, 34 + rand() * 12, (rand() - 0.5) * 150); W.scene.add(g); cl.push(g);
  }
  W.tickers.push((dt) => { for (const c of cl) { c.position.x += dt * 1.4; if (c.position.x > x1 + 60) c.position.x = x0 - 60; } });
}
/** balloons that bob above a point */
export function balloons(W, x, y, z, n = 7) {
  const cols = [0xe04b2c, 0x31b5d6, 0xf2c230, 0x4aa86a, 0xe56bb0, 0x8e44ad, 0xff8a2c], bs = [];
  for (let i = 0; i < n; i++) { const g = new THREE.Group(), b = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 10), mat(cols[i % cols.length])); b.scale.y = 1.2; g.add(b); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 3, 4), new THREE.MeshBasicMaterial({ color: 0x444444 })); l.position.y = -2; g.add(l); W.scene.add(g); bs.push({ g, a: i / n * 6.28, r: 2 + (i % 3) * 1.3 }); }
  W.tickers.push((dt, t) => { for (const b of bs) b.g.position.set(x + Math.cos(b.a + t * 0.2) * b.r, y + 3 + Math.sin(t * 1.1 + b.a * 2) * 0.9 + (b.r % 2), z + Math.sin(b.a + t * 0.2) * b.r); });
}
/** sparks rising from a point */
export function sparks(W, x, y, z, n = 14, col = 0xffc24a) {
  const ps = []; for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: col })); W.scene.add(m); ps.push({ m, o: rand(), vx: (rand() - 0.5) * 1.6, vz: (rand() - 0.5) * 1.6 }); }
  W.tickers.push((dt, t) => { for (const p of ps) { const u = (t * 1.6 + p.o) % 1; p.m.position.set(x + p.vx * u * 1.4, y + u * 2.6 - u * u * 1.2, z + p.vz * u * 1.4); p.m.scale.setScalar(1 - u); } });
}

/* ---------- populate the districts ---------- */
const SHIRTS = [0x2f86c0, 0xe0553c, 0x4aa86a, 0xf2c230, 0x8e44ad, 0xe56bb0, 0x1aa39a, 0xff8a2c];
const SK = [0xf0c8a0, 0xd9a577, 0xb07a52, 0x8a5a3c, 0xf7d9bd];
export function populate(W) {
  const rs = () => ({ shirt: SHIRTS[(rand() * SHIRTS.length) | 0], skin: SK[(rand() * SK.length) | 0], pants: [0x3a3f45, 0x2f4a6a, 0x5a4a3a, 0x6a2f3a][(rand() * 4) | 0] });
  clouds(W, -40, 800);

  /* road traffic between districts */
  [80, 190, 310, 520, 650].forEach((x1, i) => {
    const cols = [0xe04b2c, 0x2f86c0, 0xf2c230, 0x4aa86a, 0x8e44ad];
    vehicle(W, { kind: 'car', color: cols[i % 5], pts: [[x1 + 2, 3.7], [x1 + 29, 3.7]], speed: 5.5, phase: 0.2 });
    vehicle(W, { kind: i % 2 ? 'truck' : 'car', color: cols[(i + 2) % 5], pts: [[x1 + 29, -3.7], [x1 + 2, -3.7]], speed: 4.5, phase: 0.55 });
    walker(W, { pts: [[x1 + 5, 4.4], [x1 + 24, 4.4]], speed: 1.3, ...rs() });
  });

  /* 1 HOME */
  flock(W, 40, 0, 24, 6, 17);
  walker(W, { pts: [[8, -20], [33, -18]], speed: 2.3, ...rs(), hat: 0xe0553c });
  walker(W, { pts: [[10, 26], [48, 26]], speed: 1.7, ...rs() });
  walker(W, { pts: [[62, 25], [40, 25]], speed: 1.5, ...rs(), carry: 'laptop', carryScale: 0.4 });
  walker(W, { pts: [[14, -9], [24, -12], [14, -16]], speed: 3.2, scale: 0.7, ...rs() });
  walker(W, { pts: [[15, -16], [25, -9], [15, -8]], speed: 3.0, scale: 0.65, ...rs() });
  vehicle(W, { kind: 'cart', pts: [[66, 4], [76, 4]], speed: 1.5 });
  idler(W, { x: 6, z: -8, ry: 1.3, ...rs() }); idler(W, { x: 6, z: 9, ry: 1.9, ...rs() }); idler(W, { x: 70, z: 14, ry: -1.5, ...rs() });

  /* 2 PORT */
  flock(W, 150, -18, 28, 7, 15);
  vehicle(W, { kind: 'forklift', color: 0xf2c230, pts: [[114, 19], [160, 19]], speed: 4, phase: 0.1 });
  vehicle(W, { kind: 'forklift', color: 0xe04b2c, pts: [[162, 20.8], [116, 20.8]], speed: 3.4, phase: 0.6 });
  vehicle(W, { kind: 'truck', color: 0x2f86c0, pts: [[112, 15.5], [186, 15.5]], speed: 5, phase: 0.3 });
  [[118, -15, 132], [138, -14.5, 156], [150, -16, 166], [160, -15.2, 182]].forEach(([a, z, b], i) => walker(W, { pts: [[a, z], [b, z]], speed: 1.6 + i * 0.1, carry: 'toaster', carryScale: 0.45, shirt: 0xf2c230, pants: 0x2f4a6a, hat: 0xf2c230, skin: SK[i % 5] }));
  for (let i = 0; i < 6; i++) idler(W, { x: 126 + i * 10 + 2.8, z: -5.4, ry: Math.PI, shirt: 0x2f4a6a, hat: 0x1f3a5a, pants: 0x22304a, skin: SK[i % 5], hold: 'laptop', range: 9 });

  /* 3 INDIA */
  flock(W, 262, 0, 28, 6, 16);
  walker(W, { pts: [[236, -12], [262, -13]], speed: 1.7, shirt: 0x31b5d6, hat: 0x31b5d6, pants: 0x3a3f45, skin: SK[1], carry: 'laptop', carryScale: 0.4 });
  walker(W, { pts: [[262, 12], [236, 11]], speed: 1.5, shirt: 0xe56bb0, hat: 0xe56bb0, pants: 0x3a3f45, skin: SK[3], carry: 'laptop', carryScale: 0.4 });
  vehicle(W, { kind: 'truck', color: 0xe04b2c, pts: [[222, -30], [258, -30]], speed: 4.2 });
  idler(W, { x: 288, z: -29, ry: 1.2, shirt: 0x31b5d6, hat: 0xf2f2ee, pants: 0x2f4a6a, skin: SK[0] }); idler(W, { x: 288, z: -15, ry: 1.9, shirt: 0x31b5d6, hat: 0xf2f2ee, pants: 0x2f4a6a, skin: SK[2] });
  walker(W, { pts: [[300, 20], [286, 22]], speed: 1.4, ...rs() }); walker(W, { pts: [[296, 29], [312, 28]], speed: 1.8, ...rs(), carry: 'tv', carryScale: 0.4 });

  /* 4 INFORMAL */
  flock(W, 430, 0, 34, 7, 18, 0x3a3d40);
  walker(W, { pts: [[392, 11], [428, 11]], speed: 1.5, ...rs(), carry: 'toaster', carryScale: 0.45 });
  walker(W, { pts: [[428, 12.8], [392, 12.8]], speed: 1.3, ...rs(), carry: 'tv', carryScale: 0.4 });
  walker(W, { pts: [[342, -19], [384, -19]], speed: 1.9, ...rs(), carry: 'battery', carryScale: 0.45 });
  vehicle(W, { kind: 'truck', color: 0xc9792a, pts: [[342, -18.5], [388, -18.5]], speed: 3.2, phase: 0.5 });
  vehicle(W, { kind: 'cart', pts: [[394, 6], [430, 6]], speed: 2 }); vehicle(W, { kind: 'cart', pts: [[430, -7], [396, -7]], speed: 1.7, phase: 0.4 });
  walker(W, { pts: [[470, 30], [470, 12]], speed: 1.6, ...rs(), carry: 'toaster', carryScale: 0.45 }); walker(W, { pts: [[514, -4], [480, -6]], speed: 1.4, ...rs(), carry: 'battery', carryScale: 0.45 });
  sparks(W, 464.2, 1.1, 12.4);

  /* 5 MIDDLEMEN & POLICY */
  flock(W, 600, 0, 30, 6, 17);
  walker(W, { pts: [[587, -17], [587, 17]], speed: 1.5, shirt: 0x22304a, pants: 0x22304a, hat: 0x22304a, skin: SK[1], carry: 'laptop', carryScale: 0.4 });
  walker(W, { pts: [[603, 14], [618, -9]], speed: 1.6, shirt: 0x7a2a18, pants: 0x3a3f45, hat: null, skin: SK[3] });
  walker(W, { pts: [[640, -14], [606, -14]], speed: 1.4, ...rs() });
  vehicle(W, { kind: 'car', color: 0x31b5d6, pts: [[553, 31.5], [646, 31.5]], speed: 5.5 });

  /* 6 AWARENESS */
  flock(W, 725, 0, 32, 8, 17);
  balloons(W, 722, 12, 0, 8);
  for (let k = 0; k < 4; k++) { const a0 = k * 1.57, pts = []; for (let j = 0; j <= 8; j++) pts.push([722 + Math.cos(a0 + j * 0.25) * 23, Math.sin(a0 + j * 0.25) * 23]); walker(W, { pts, speed: 1.5, cheer: false, ...rs() }); }
  for (let k = 0; k < 3; k++) idler(W, { x: 748 + k * 4, z: 20 + (k % 2) * 4, ry: -2, ...rs(), range: 22 });
}
