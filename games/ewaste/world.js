/* Builds the whole journey: six districts side by side along +x. */
import { makePerson, makePing, setPingFace } from './props.js';
import { build as home } from './home.js';
import { build as port } from './port.js';
import { build as sectors } from './sectors.js';
import { build as informal } from './informal.js';
import { build as policy } from './policy.js';
import { build as awareness } from './awareness.js';
import { buildRail, validateRail } from './path.js';
import { populate } from './life.js';
export { makePerson, makePing, setPingFace };

export function buildWorld(W) {
  W.bills = []; W.hazards = []; W.later = [];
  for (const f of [home, port, sectors, informal, policy, awareness]) { const d = f(W); W.scene.add(d.b.build()); }
  const rail = buildRail(W, SPEC); W.validateRail = () => validateRail(W, rail);
  populate(W);
}

/* The single track through the world. Strings are station ids (the track passes through them); pairs are [x, z] points.
   Each list ends near the gate; the road to the next district is added automatically. */
const arc = (cx, cz, r, degs) => degs.map(a => [Math.round((cx + r * Math.cos(a * Math.PI / 180)) * 10) / 10, Math.round((cz + r * Math.sin(a * Math.PI / 180)) * 10) / 10]);
const SPEC = [
  /* 1 HOME */ [[7, 0], 'dev-0', [26, 2], 'dev-1', 'house-note-0', 'house-note-1', 'house-note-2', [33, 8], [27, 15], 'dev-2', [41, 23], 'dev-4', 'loop-demand', 'dev-3', 'manufacturers', 'kabadiwala', [68, -5], [72, -2], [77.5, 0]],
  /* 2 PORT */ [[116, 0], [120.5, 12], 'cont-0', [126, 8], 'cont-1', [141, 8], 'cont-2', 'cont-3', [156, 8], 'cont-4', [171, 8], 'cont-5', [174.6, 6.5], 'loop-policy', [183, 9.7], [186.5, 3], [187.5, 0]],
  /* 3 INDIA */ [[226, 0], [236.4, -4.6], [242.5, -9], [247.2, -9], [249.8, -13], [255.5, -7.2], [253.6, -4.2], [253.2, -1.2], [253, 6], [268, 3], 'split', [288, -10], [291, -20.8], [291.5, -12], [291.2, -5.2], [302, -5.2], [306, -1], [308, 0]],
  /* 4 INFORMAL */ [[346, 0], 'stage-1', 'stage-2', 'stage-3', [448, -4], 'bench', [462, -5], [470, -14], [472.6, -19.2], [472.6, -8.4], [472.6, 8.4], [472.6, 19.4], [480, 8], 'stage-4', [492.5, -11.5], 'cyc-0', 'cyc-1', 'cyc-2', 'cyc-3', 'cyc-4', 'cyc-5', 'cyc-6', [488, -7], [483.5, 3], [485, 14], [494, 17.5], [500, 11.5], [510, 2], [516.5, 0]],
  /* 5 MIDDLEMEN & POLICY */ [[556, 0], [570, 14], [578, 22], ...arc(580, 0, 11.8, [75, 37.5, 0, -37.5, -75]), [578, -22], [600, -21], 'flag-0', 'flag-1', 'flag-2', 'flag-3', 'flag-4', 'flag-5', [641, -9], [630.5, -4.3], [632, 2], 'schemes', [630.4, 20], [641, 10], [647, 0]],
  /* 6 AWARENESS */ [[686, 0], ...arc(722, 0, 14.6, [180, 143, 113, 83, 53, 23, -7, -37, -67, -97, -127, -157]), [706, -14], [718, -24], [740, -24], [750.4, -23], [750.4, -16.8], [750.4, -6.6], [750.4, -0.4], [750.4, 5.8], [762.5, 6.5]],
];
