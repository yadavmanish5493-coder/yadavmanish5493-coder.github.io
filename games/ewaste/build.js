/* Geometry helpers for the e-waste world: a vertex-coloured batch (one draw call per district), text signs, icons, arrows. */
import * as THREE from './three.module.min.js';
export { THREE };

export const C = { grey: 0x93a4ab, red: 0xe04b2c, cyan: 0x31b5d6, ink: 0x2a2623, line: 0x3b2a22, paper: 0xf4f1ea, orange: 0xd4472a, yellow: 0xf2c230 };

const gradient = (() => { const t = new THREE.DataTexture(new Uint8Array([80, 155, 255]), 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
export const staticMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradient, side: THREE.DoubleSide });
const lineMat = new THREE.LineBasicMaterial({ color: C.line, transparent: true, opacity: 0.42 });
const matCache = new Map();
export const mat = (color, o = {}) => { const k = color + JSON.stringify(o); let m = matCache.get(k); if (!m) { m = new THREE.MeshToonMaterial(Object.assign({ color, gradientMap: gradient }, o)); matCache.set(k, m); } return m; };
export const glow = (color, op = 0.5) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false });

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(1, 1, 1), _p = new THREE.Vector3(), _v = new THREE.Vector3();
const BOX_EDGES = [[0, 1], [1, 3], [3, 2], [2, 0], [4, 5], [5, 7], [7, 6], [6, 4], [0, 4], [1, 5], [2, 6], [3, 7]];

/** Merges many coloured primitives into one BufferGeometry (positions/normals/colours) plus one set of outline segments. */
export class Batch {
  constructor() { this.p = []; this.n = []; this.c = []; this.e = []; }
  geo(g, color, x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) {
    _e.set(rx, ry, rz); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(sx, sy, sz); _m.compose(_p, _q, _s);
    const ng = g.index ? g.toNonIndexed() : g; ng.applyMatrix4(_m);
    const P = ng.attributes.position.array, N = ng.attributes.normal.array, col = new THREE.Color(color);
    this.p.push(P); this.n.push(N); const c = new Float32Array(P.length); for (let i = 0; i < c.length; i += 3) { c[i] = col.r; c[i + 1] = col.g; c[i + 2] = col.b; } this.c.push(c);
    if (ng !== g) g.dispose();
  }
  /** box: centre x,z; bottom y */
  box(color, w, h, d, x, y, z, ry = 0, edges = true, rx = 0, rz = 0) {
    this.geo(new THREE.BoxGeometry(w, h, d), color, x, y + h / 2, z, ry, 1, 1, 1, rx, rz);
    if (edges) {
      _e.set(rx, ry, rz); _q.setFromEuler(_e); _p.set(x, y + h / 2, z); _s.set(1, 1, 1); _m.compose(_p, _q, _s);
      const cs = []; for (let i = 0; i < 8; i++) cs.push(_v.set(i & 1 ? w / 2 : -w / 2, i & 2 ? h / 2 : -h / 2, i & 4 ? d / 2 : -d / 2).clone().applyMatrix4(_m));
      for (const [a, b] of BOX_EDGES) this.e.push(cs[a].x, cs[a].y, cs[a].z, cs[b].x, cs[b].y, cs[b].z);
    }
  }
  cyl(color, rt, rb, h, x, y, z, seg = 14, ry = 0, rx = 0, rz = 0) { this.geo(new THREE.CylinderGeometry(rt, rb, h, seg), color, x, y + h / 2, z, ry, 1, 1, 1, rx, rz); }
  cone(color, r, h, x, y, z, seg = 14) { this.geo(new THREE.ConeGeometry(r, h, seg), color, x, y + h / 2, z); }
  sphere(color, r, x, y, z, sx = 1, sy = 1, sz = 1, seg = 12) { this.geo(new THREE.SphereGeometry(r, seg, Math.max(6, seg - 4)), color, x, y, z, 0, sx, sy, sz); }
  /** ground disc */
  disc(color, r, x, y, z, seg = 40) { this.geo(new THREE.CylinderGeometry(r, r, 0.08, seg), color, x, y + 0.04, z); }
  /** gable roof: ridge along local z, bottom at y */
  gable(color, w, d, h, x, y, z, ry = 0) {
    const a = [-w / 2, 0, -d / 2, -w / 2, 0, d / 2, 0, h, d / 2, -w / 2, 0, -d / 2, 0, h, d / 2, 0, h, -d / 2,
      w / 2, 0, d / 2, w / 2, 0, -d / 2, 0, h, -d / 2, w / 2, 0, d / 2, 0, h, -d / 2, 0, h, d / 2,
      -w / 2, 0, d / 2, w / 2, 0, d / 2, 0, h, d / 2, w / 2, 0, -d / 2, -w / 2, 0, -d / 2, 0, h, -d / 2];
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); g.computeVertexNormals();
    this.geo(g, color, x, y, z, ry);
  }
  /** lean-to / sloped slab: a box tilted around z by rz */
  slab(color, w, h, d, x, y, z, ry = 0, rz = 0) { this.box(color, w, h, d, x, y, z, ry, false, 0, rz); }
  build(shadow = true) {
    const cat = a => { let n = 0; for (const x of a) n += x.length; const r = new Float32Array(n); let o = 0; for (const x of a) { r.set(x, o); o += x.length; } return r; };
    const grp = new THREE.Group();
    if (this.p.length) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(cat(this.p), 3)); g.setAttribute('normal', new THREE.BufferAttribute(cat(this.n), 3)); g.setAttribute('color', new THREE.BufferAttribute(cat(this.c), 3));
      g.computeBoundingSphere(); const m = new THREE.Mesh(g, staticMat); m.castShadow = shadow; m.receiveShadow = true; grp.add(m);
    }
    if (this.e.length) {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.e, 3)); g.computeBoundingSphere();
      grp.add(new THREE.LineSegments(g, lineMat));
    }
    return grp;
  }
}

/* ---------- text / icon textures ---------- */
const tc = new Map();
function wrap(ctx, text, maxW) {
  const out = [];
  for (const para of String(text).split('\n')) {
    let line = ''; for (const w of para.split(' ')) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; }
    out.push(line);
  }
  return out;
}
/** A flat sign plane, w x h world units. o: bg, fg, border, fs (font size in world units), bold, align, radius, pad */
export function sign(text, w, h, o = {}) {
  const key = 's' + text + w + h + JSON.stringify(o); let tex = tc.get(key);
  if (!tex) {
    const k = 56, cv = document.createElement('canvas'); cv.width = Math.ceil(w * k); cv.height = Math.ceil(h * k); const g = cv.getContext('2d');
    const pad = (o.pad ?? 0.12) * k, r = (o.radius ?? 0.18) * k;
    if (o.bg !== null) { g.fillStyle = o.bg || '#fffdf8'; g.beginPath(); g.roundRect(1, 1, cv.width - 2, cv.height - 2, r); g.fill(); }
    if (o.border !== null) { g.lineWidth = (o.bw ?? 0.07) * k; g.strokeStyle = o.border || '#d4472a'; g.beginPath(); g.roundRect(g.lineWidth / 2, g.lineWidth / 2, cv.width - g.lineWidth, cv.height - g.lineWidth, r); g.stroke(); }
    let fs = (o.fs ?? 0.5) * k; const font = s => `${o.bold === false ? 500 : 800} ${s}px Poppins, "Helvetica Neue", Arial, sans-serif`;
    let lines; for (let tries = 0; tries < 30; tries++) { g.font = font(fs); lines = wrap(g, text, cv.width - 2 * pad); if (lines.length * fs * 1.16 <= cv.height - 2 * pad || fs < 9) break; fs *= 0.92; }
    g.fillStyle = o.fg || '#2a2623'; g.textBaseline = 'middle'; g.textAlign = o.align || 'center';
    const lh = fs * 1.16, y0 = cv.height / 2 - (lines.length - 1) * lh / 2, x = o.align === 'left' ? pad : o.align === 'right' ? cv.width - pad : cv.width / 2;
    lines.forEach((l, i) => g.fillText(l, x, y0 + i * lh));
    tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tc.set(key, tex);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, toneMapped: false, fog: false }));
  return m;
}
/** an emoji on a transparent plane */
export function icon(ch, size = 1, bg = null) {
  const key = 'i' + ch + (bg || ''); let tex = tc.get(key);
  if (!tex) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
    if (bg) { g.fillStyle = bg; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill(); g.lineWidth = 6; g.strokeStyle = '#d4472a'; g.stroke(); }
    g.font = '78px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 64, 70);
    tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tc.set(key, tex);
  }
  return new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, toneMapped: false, fog: false, depthWrite: false }));
}
/** Block arrow lying on the ground, pointing +x, length ~ 2.6 * s */
let arrowGeo;
export function arrow(color, s = 1, op = 1) {
  if (!arrowGeo) {
    const sh = new THREE.Shape(); sh.moveTo(0, -0.34); sh.lineTo(1.1, -0.34); sh.lineTo(1.1, -0.85); sh.lineTo(2.5, 0); sh.lineTo(1.1, 0.85); sh.lineTo(1.1, 0.34); sh.lineTo(0, 0.34); sh.lineTo(0.32, 0); sh.closePath();
    arrowGeo = new THREE.ShapeGeometry(sh); arrowGeo.rotateX(-Math.PI / 2);
  }
  const m = new THREE.Mesh(arrowGeo, new THREE.MeshBasicMaterial({ color, transparent: op < 1, opacity: op, side: THREE.DoubleSide, depthWrite: false }));
  m.scale.setScalar(s); m.position.y = 0.06; return m;
}
export const rand = (() => { let s = 12345; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
