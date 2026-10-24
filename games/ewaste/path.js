/* The rail: one smooth track through every district. Scrolling moves the collector along it (like a runner game). */
import { THREE, clamp } from './build.js';

export const LATERAL = 2.6;   // how far the collector can step to either side of the track

export function buildRail(W, SPEC) {
  const pts = [], firsts = [];
  SPEC.forEach((list, di) => {
    const d = W.districts[di]; firsts.push(pts.length);
    for (const w of list) {
      if (typeof w === 'string') { const s = W.stations.find(s => s.id === w); if (!s) throw new Error('rail: no station ' + w); pts.push(new THREE.Vector3(s.x, 0, s.z)); }
      else pts.push(new THREE.Vector3(w[0], 0, w[1]));
    }
    if (di < SPEC.length - 1) for (const dx of [3, 11, 19, 27]) pts.push(new THREE.Vector3(d.x1 + dx, 0, 0));
  });
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal'); curve.arcLengthDivisions = 6000;
  const len = curve.getLength(), N = Math.ceil(len / 0.4), sp = curve.getSpacedPoints(N), step = len / N;
  const X = new Float32Array(N + 1), Z = new Float32Array(N + 1), TX = new Float32Array(N + 1), TZ = new Float32Array(N + 1);
  sp.forEach((p, i) => { X[i] = p.x; Z[i] = p.z; });
  for (let i = 0; i <= N; i++) { const a = Math.max(0, i - 5), b = Math.min(N, i + 5); let dx = X[b] - X[a], dz = Z[b] - Z[a]; const l = Math.hypot(dx, dz) || 1; TX[i] = dx / l; TZ[i] = dz / l; }
  const nearest = (x, z, from = 0, to = N) => { let bi = from, bd = 1e9; for (let i = from; i <= to; i++) { const dd = (X[i] - x) ** 2 + (Z[i] - z) ** 2; if (dd < bd) { bd = dd; bi = i; } } return bi; };
  const rail = {
    len, step, N, X, Z, TX, TZ,
    at(s) { const f = clamp(s / step, 0, N - 1e-6), i = Math.floor(f), t = f - i, j = Math.min(N, i + 1); return { x: X[i] + (X[j] - X[i]) * t, z: Z[i] + (Z[j] - Z[i]) * t, tx: TX[i] + (TX[j] - TX[i]) * t, tz: TZ[i] + (TZ[j] - TZ[i]) * t }; },
    toX(di, x) { const d = W.districts[di]; for (let i = Math.floor(d.sStart / step); i <= Math.floor(d.gateS / step); i++) if (X[i] >= x) return i * step; return d.sStart; },
  };
  // where each district starts and where its gate is on the track
  W.districts.forEach((d, di) => {
    const first = pts[firsts[di]], i0 = nearest(first.x, first.z, di ? Math.floor(W.districts[di - 1].gateS / step) : 0);
    d.sStart = i0 * step;
    d.gateS = d.last ? len : nearest(d.x1 - 1.9, 0, i0 + 20, N) * step;
  });
  W.rail = rail; return rail;
}

/** Checks the centre line (and the side-step limits) against everything solid. */
export function validateRail(W, rail) {
  const bad = [], side = [];
  const hit = (o, x, z, R) => { if (o.off && !o.gate) return false; if (o.gate) return false; if (o.r !== undefined) return Math.hypot(x - o.x, z - o.z) < o.r + R; const cx = clamp(x, o.x0, o.x1), cz = clamp(z, o.z0, o.z1); return Math.hypot(x - cx, z - cz) < R; };
  for (let i = 0; i <= rail.N; i += 2) {
    const x = rail.X[i], z = rail.Z[i];
    for (const o of W.obstacles) { if (hit(o, x, z, 0.7)) bad.push([Math.round(x * 10) / 10, Math.round(z * 10) / 10, o.r !== undefined ? `circle ${o.x},${o.z}` : `box ${o.x0}..${o.x1},${o.z0}..${o.z1}`]); }
    let inWalk = false; for (const w of W.walk) if (x >= w[0] && x <= w[1] && z >= w[2] && z <= w[3]) { inWalk = true; break; } if (!inWalk) bad.push([Math.round(x * 10) / 10, Math.round(z * 10) / 10, 'off the pads']);
  }
  return bad;
}
