/* Real e-waste items (built from primitives) and the stack the collector carries on their back. */
import { THREE, mat, sign } from './build.js';

const box = (g, c, w, h, d, x, y, z, o = {}) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), o.basic ? new THREE.MeshBasicMaterial({ color: c }) : mat(c)); m.position.set(x, y, z); if (o.rx) m.rotation.x = o.rx; if (o.rz) m.rotation.z = o.rz; g.add(m); return m; };
const cyl = (g, c, rt, rb, h, x, y, z, o = {}) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, o.seg || 12), mat(c)); m.position.set(x, y, z); if (o.rx) m.rotation.x = o.rx; if (o.rz) m.rotation.z = o.rz; g.add(m); return m; };

/** returns { g, h }: base at y = 0, front faces +z, about 1 unit big */
export function makeItem(kind, o = {}) {
  const g = new THREE.Group(); let h = 1;
  switch (kind) {
    case 'phone': {
      box(g, 0x2a2623, 0.52, 0.98, 0.1, 0, 0.49, 0); box(g, 0x8fdcee, 0.44, 0.84, 0.02, 0, 0.5, 0.055, { basic: true }); cyl(g, 0x111111, 0.04, 0.04, 0.02, 0.0, 0.93, 0.065, { rx: Math.PI / 2 });
      box(g, 0x2a2623, 0.02, 0.9, 0.025, 0.07, 0.55, 0.07, { rz: 0.42, basic: true }); h = 0.98; break; }
    case 'battery': {
      box(g, 0x1f3a5a, 0.98, 0.56, 0.5, 0, 0.28, 0); box(g, 0xf2c230, 0.6, 0.2, 0.02, 0, 0.3, 0.26); cyl(g, 0xc0c4c8, 0.07, 0.07, 0.12, -0.3, 0.62, 0); cyl(g, 0xe04b2c, 0.07, 0.07, 0.12, 0.3, 0.62, 0); box(g, 0x14283e, 1.0, 0.08, 0.52, 0, 0.55, 0, { basic: false }); h = 0.68; break; }
    case 'tv': {
      box(g, 0xd9d3c1, 1.0, 0.78, 0.7, 0, 0.45, 0.1); box(g, 0x35505a, 0.7, 0.54, 0.05, -0.08, 0.47, 0.47); box(g, 0x9fc4cc, 0.6, 0.44, 0.02, -0.08, 0.47, 0.5, { basic: true });
      box(g, 0xc4bea9, 0.62, 0.5, 0.42, 0, 0.45, -0.46); cyl(g, 0x555555, 0.015, 0.015, 0.5, -0.12, 0.98, -0.1, { rz: 0.5, seg: 5 }); cyl(g, 0x555555, 0.015, 0.015, 0.5, 0.12, 0.98, -0.1, { rz: -0.5, seg: 5 });
      cyl(g, 0x555555, 0.04, 0.04, 0.04, 0.42, 0.62, 0.47, { rx: Math.PI / 2 }); cyl(g, 0x555555, 0.04, 0.04, 0.04, 0.42, 0.47, 0.47, { rx: Math.PI / 2 }); box(g, 0x777777, 0.8, 0.06, 0.55, 0, 0.03, 0.1); h = 0.98; break; }
    case 'fridge': {
      box(g, 0xf1f3f5, 0.78, 1.55, 0.72, 0, 0.8, 0); box(g, 0xc9ced3, 0.8, 0.025, 0.74, 0, 1.05, 0); box(g, 0x9aa1a8, 0.04, 0.3, 0.05, 0.3, 1.3, 0.38); box(g, 0x9aa1a8, 0.04, 0.4, 0.05, 0.3, 0.62, 0.38);
      box(g, 0xe04b2c, 0.12, 0.12, 0.02, -0.22, 1.35, 0.37, { basic: true }); box(g, 0x31b5d6, 0.1, 0.1, 0.02, -0.05, 1.25, 0.37, { basic: true }); box(g, 0x555555, 0.7, 0.05, 0.64, 0, 0.03, 0); h = 1.58; break; }
    case 'toaster': {
      box(g, 0xb9bec4, 0.88, 0.46, 0.5, 0, 0.24, 0); box(g, 0x222222, 0.3, 0.03, 0.08, -0.2, 0.48, 0); box(g, 0x222222, 0.3, 0.03, 0.08, 0.2, 0.48, 0); box(g, 0xe04b2c, 0.06, 0.14, 0.05, 0.47, 0.3, 0.1); box(g, 0x555555, 0.8, 0.06, 0.42, 0, 0.03, 0); h = 0.5; break; }
    case 'laptop': {
      box(g, 0x7a8288, 0.92, 0.06, 0.62, 0, 0.03, 0); const lid = new THREE.Group(); lid.position.set(0, 0.06, -0.3); lid.rotation.x = -0.35; g.add(lid); box(lid, 0x5d656b, 0.92, 0.62, 0.04, 0, 0.31, 0); box(lid, 0x9fd8e6, 0.82, 0.52, 0.02, 0, 0.31, 0.025, { basic: true }); h = 0.7; break; }
    case 'copper': { const t = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.12, 8, 16), mat(0xb87333)); t.rotation.x = Math.PI / 2; t.position.y = 0.14; g.add(t); h = 0.28; break; }
    case 'alum': { box(g, 0xcfd6dc, 0.8, 0.16, 0.4, 0, 0.08, 0); box(g, 0xe8edf0, 0.8, 0.03, 0.12, 0, 0.17, 0); h = 0.18; break; }
    case 'gold': { box(g, 0xf2c230, 0.5, 0.2, 0.28, 0, 0.1, 0); box(g, 0xffe28a, 0.4, 0.04, 0.2, 0, 0.21, 0); h = 0.22; break; }
    case 'poster': {
      box(g, 0xffffff, 0.98, 1.3, 0.06, 0, 0.65, 0); box(g, 0x31b5d6, 1.02, 0.08, 0.07, 0, 1.3, 0); const s = sign(o.label || 'Awareness', 0.84, 1.1, { fs: 0.3, border: '#31b5d6' }); s.position.set(0, 0.62, 0.04); g.add(s); h = 1.32; break; }
    default: box(g, 0x93a4ab, 0.6, 0.6, 0.6, 0, 0.3, 0); h = 0.6;
  }
  g.traverse(m => { if (m.isMesh) m.castShadow = false; });
  return { g, h };
}

const _v = new THREE.Vector3();
/** Items ride on the collector's back as a growing stack. */
export class Stack {
  constructor(scene, parent) {
    this.scene = scene; this.g = new THREE.Group(); this.g.position.set(0, 1.3, -0.7); this.k = 0.66; this.g.scale.setScalar(this.k); parent.add(this.g);
    this.items = []; this.fly = [];
  }
  top() { let y = 0; for (const it of this.items) y += it.h * 1.02; return y; }
  count() { return this.items.length; }
  add(kind, from, cb, o = {}) {
    const it = Object.assign(makeItem(kind, o), { kind }); it.g.position.copy(from); this.scene.add(it.g);
    this.fly.push({ it, from: from.clone(), t: 0, dur: o.dur || 0.8, mode: 'in', cb });
    return it;
  }
  /** detach the newest (or every) item and send it to targetFn() (a world position); cb runs on landing */
  takeLast(targetFn, cb, o = {}) { const it = this.items.pop(); if (!it) { cb && cb(); return false; } this._out(it, targetFn, cb, o.dur || 0.8, 0); return true; }
  takeAll(targetFn, cb, o = {}) {
    const all = this.items.splice(0).reverse(); if (!all.length) { cb && cb(); return; }
    all.forEach((it, i) => this._out(it, targetFn, i === all.length - 1 ? cb : null, o.dur || 0.75, i * (o.gap || 0.28)));
  }
  _out(it, targetFn, cb, dur, delay) {
    it.g.getWorldPosition(_v); const p = _v.clone(); this.g.remove(it.g); this.scene.add(it.g); it.g.position.copy(p); it.g.scale.setScalar(this.k); it.g.rotation.set(0, 0, 0);
    this.fly.push({ it, from: p, t: -delay, dur, mode: 'out', targetFn, cb });
  }
  update(dt, t, spd) {
    const lean = Math.min(1, spd / 12);
    this.items.forEach((it, i) => { it.g.rotation.z = Math.sin(t * 3 + i * 1.7) * 0.06 * (0.25 + lean); it.g.rotation.x = -0.05 * lean * (i + 1) * 0.3; });
    let y = 0; this.items.forEach(it => { it.g.position.set(0, y, 0); y += it.h * 1.02; });
    for (let i = this.fly.length - 1; i >= 0; i--) {
      const f = this.fly[i]; f.t += dt; if (f.t < 0) continue; const u = Math.min(1, f.t / f.dur), e = u * u * (3 - 2 * u);
      if (f.mode === 'in') {
        const slot = this.top(); this.g.localToWorld(_v.set(0, slot, 0));
        f.it.g.position.set(f.from.x + (_v.x - f.from.x) * e, f.from.y + (_v.y - f.from.y) * e + Math.sin(u * Math.PI) * 1.4, f.from.z + (_v.z - f.from.z) * e);
        f.it.g.scale.setScalar(1 + (this.k - 1) * e); f.it.g.rotation.y += dt * 6 * (1 - u);
        if (u >= 1) { this.scene.remove(f.it.g); this.g.add(f.it.g); f.it.g.scale.setScalar(1); f.it.g.rotation.set(0, 0, 0); this.items.push(f.it); this.fly.splice(i, 1); f.cb && f.cb(f.it); }
      } else {
        const tg = f.targetFn(); f.it.g.position.set(f.from.x + (tg.x - f.from.x) * e, f.from.y + (tg.y - f.from.y) * e + Math.sin(u * Math.PI) * 1.6, f.from.z + (tg.z - f.from.z) * e);
        f.it.g.rotation.y += dt * 5; f.it.g.scale.setScalar(this.k * (1 - 0.2 * e));
        if (u >= 1) { this.scene.remove(f.it.g); this.fly.splice(i, 1); f.cb && f.cb(f.it); }
      }
    }
  }
}
