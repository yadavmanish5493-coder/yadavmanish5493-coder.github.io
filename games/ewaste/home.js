/* District 1: HOME (individual level) */
import { THREE, C, Batch, mat, glow, sign, icon, rand, clamp } from './build.js';
import { makePerson, makeDistrict, banner, label, bill, loopRing, tree, house, lamp, bags } from './props.js';
import { giver } from './life.js';

const DEVICES = [
  ['📱', 'Small IT & telecom equipment', 'Phones (one per family member, plus a spare), chargers and wires.', 18, 12, 'phone', { shirt: 0xe56bb0, pants: 0x2f4a6a, scale: 0.74, hair: 0x2a2623 }],
  ['🔋', 'Batteries & accumulators', 'Small, but full of metals that should never reach a dustbin.', 31, -26, 'battery', { shirt: 0x2f86c0, pants: 0x3a3f45, hair: 0x2a2623 }],
  ['📺', 'Screens & lighting equipment', 'Old TVs, monitors and bulbs.', 30, 22, 'tv', { shirt: 0xe0553c, pants: 0x5a4a3a, hair: 0x4a2a1a, skin: 0xd9a577 }],
  ['🧊', 'Large household equipment', 'Fridges and washing machines, the heaviest items in the pile.', 56, -4, 'fridge', { shirt: 0x4aa86a, pants: 0x3a3f45, hat: 0xf2c230, itemScale: 0.55, skin: 0xb07a52 }],
  ['🔌', 'Small household equipment', 'Mixers, irons and toasters: a new one arrives when the old one stops.', 53, 22, 'toaster', { shirt: 0xb06ad0, pants: 0x6a2f3a, hair: 0xeeeeee, scale: 0.95 }],
];
const N_DEV = DEVICES.length;

export function build(W) {
  const d = makeDistrict(W, { i: 0, name: 'HOME', sub: 'Individual level', x0: 0, x1: 80, zone: 0, face: 'happy', padColor: 0xcdeebd, spawn: [7, 0],
    groups: [{ grp: 'dev', text: 'Collect your 5 old devices' }, { grp: 'notes', text: 'Read the house notes' }, { grp: 'kab', text: 'Hand the pile to the kabadiwala' }] });
  const b = d.b, ST = W.ST;

  banner(W, d, 'Equation of E-waste management in India', 'Start with your own house', 14, 0, { w: 10, h: 6.5 });

  /* the house, after the giga map */
  b.box(0xf29a86, 10, 4.4, 15, 46, 0, -12); b.box(0xfde3b4, 8, 3.6, 10.5, 47, 4.4, -12);
  b.gable(0xc4452f, 9.4, 12, 2.6, 47, 8.0, -12);
  b.box(0xf6c26b, 7, 3.2, 5.5, 44.5, 0, -22.5); b.slab(0xc4452f, 8.4, 0.35, 7, 44.6, 3.15, -22.5, 0, 0.12);
  b.box(0xf3f0ea, 0.2, 2.6, 2.6, 41, 0, -12, 0, false); for (const z of [-13.6, -10.4]) b.box(0x8a6d4b, 0.35, 3, 0.35, 40.9, 0, z, 0, false);
  for (const z of [-17.5, -6.5]) b.box(0xbfe6f8, 0.2, 1.5, 2.2, 41, 1.4, z, 0, false);
  b.box(0xbfe6f8, 0.2, 1.6, 3.2, 42.9, 5.2, -12, 0, false);
  b.box(0x2f86c0, 1.8, 0.5, 15.4, 40.1, 3.3, -12);
  b.box(0x4aa86a, 12, 1.6, 0.6, 47, 0, -4.2, 0, false); b.box(0x4aa86a, 0.6, 1.6, 4, 52, 0, -20.2, 0, false);
  const s1 = sign('Starting with my own house\n(Individual level)', 13.6, 1.3, { fs: 0.5, bg: '#2f86c0', fg: '#fffdf8', border: null }); s1.position.set(39.15, 3.55, -12); s1.rotation.y = -Math.PI / 2; W.scene.add(s1);
  bags(b, 38.6, -4.2, 5);

  /* neighbourhood silhouettes, trees, lamps */
  for (let x = 6; x < 80; x += 8 + ((x * 7) % 5)) { house(b, x, -30.5, 6 + (x % 3), 5, 4 + (x % 4) * 0.6, {}); house(b, x + 3, 31, 6, 5, 3.8 + (x % 3) * .7, { turn: true }); }
  for (let x = 10; x < 78; x += 11) { tree(b, x + (x % 3), -26, 1 + (x % 2) * 0.3); tree(b, x + 4, 27, 1.1); lamp(b, x, 17.5); }

  /* factory in the corner: manufacturers and producers */
  b.box(0x6fb6d6, 14, 5, 13, 70, 0, -26); b.box(0xf7d56a, 8, 2.8, 7, 70, 5, -26); for (const x of [65, 70, 75]) b.cyl(0xe0553c, 0.7, 0.9, 10, x, 0, -31, 10);
  b.box(0x8a8178, 14.5, 0.5, 14, 70, 4.9, -26, 0, false);
  const fs = sign('MANUFACTURERS / PRODUCERS', 9, 1, { fs: 0.5 }); fs.position.set(62.9, 6.4, -26); fs.rotation.y = -Math.PI / 2; W.scene.add(fs);
  const smoke = []; for (let k = 0; k < 15; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 6), glow(0xffffff, 0.5)); m.userData = { c: k % 3, o: rand() }; W.scene.add(m); smoke.push(m); }
  W.tickers.push((dt, t) => { for (const m of smoke) { const u = m.userData, p = (t * 0.22 + u.o) % 1; m.position.set(65 + u.c * 5 + Math.sin(p * 6) * 0.5, 10 + p * 9, -31); m.scale.setScalar(0.6 + p * 1.8); m.material.opacity = 0.55 * (1 - p); } });
  const boxes = []; for (let k = 0; k < 6; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.9), mat([0xd9a066, 0x9aa7ab, 0xe8e0d0][k % 3])); m.castShadow = true; W.scene.add(m); boxes.push(m); }
  b.box(0x555a5d, 16, 0.4, 1.2, 70, 0.5, -17.5, 0, false);
  W.tickers.push((dt, t) => { boxes.forEach((m, k) => { m.position.set(62 + ((t * 1.4 + k * 2.7) % 16), 1.2, -17.5); }); });
  W.box(63, 77, -33, -19);
  W.station({ d: 0, x: 66, z: -15, r: 3.2, grp: 'bonus', req: false, id: 'manufacturers', ico: '🏭', title: 'Manufacturers', cls: 'gr', html: 'Manufacturers sell to consumers, bulk consumers and institutions, so they are a major source of e-waste even if the link is indirect. India\'s electronic revolution in the early 90s and a western consumer culture got this going.' });

  /* positive cause-and-effect loop */
  loopRing(W, d, { x: 60, z: 12, r: 4.4, nodes: ['Manufacturers / producers', 'Consumer-driven society', 'Constantly buying & upgrading', 'Constant demand & supply'], title: 'Positive loop', id: 'loop-demand', grp: 'bonus', req: false, ico: '🔁',
    html: 'In a consumer-driven society that is always buying and upgrading, demand and supply never pause. Manufacturing never halts, and more electrical and electronic equipment (EEE) appears every year.', rot: 0.4 });

  /* three house notes */
  [['🛒', 'Always buying', 'Electronics are bought all the time: speakers, new appliances, whatever is trending, the wires that come with each, a phone for every member of the house and often a spare.', -18],
    ['💤', 'Life ends, hoarding begins', 'Devices break, stop responding or go out of fashion. People find it hard to part with expensive appliances, so they hoard them at home.', -12],
    ['❓', 'No organised way out', 'When people finally let go there is no organised procedure to dispose of them. The pile ends up with a dismantler who strips it for every useful part.', -6]].forEach(([ico, t, h, z], i) => {
    const m = sign(t, 3.4, 1.3, { fs: 0.42 }); m.position.set(37, 2.3, z); m.rotation.y = -Math.PI / 2; W.scene.add(m); b.cyl(0x4b4a48, 0.07, 0.07, 1.8, 37, 0, z, 6);
    W.station({ d: 0, x: 36.2, z, r: 2.6, grp: 'notes', id: 'house-note-' + i, ico, title: t, html: h, cls: 'gr' });
  });

  /* five family members and neighbours hand you their old devices, one per equipment class */
  DEVICES.forEach(([ico, name, line, x, z, kind, look], i) => {
    const st = W.station({ d: 0, x, z, r: 1.7, grp: 'dev', id: 'dev-' + i, ico, title: name, html: line, cls: 'gr', stat: `Device ${i + 1} of ${N_DEV}`, noMarker: false });
    giver(W, st, Object.assign({ kind, hold: 3.4, onGive: () => { ST.devices++; } }, look));
  });

  /* the kabadiwala with his cart */
  const kab = makePerson({ shirt: 0x5a8a54, pants: 0x6a5a48, hat: null, scale: 1.05 }); kab.g.position.set(72, 0.06, -12); kab.g.rotation.y = -1.3; W.scene.add(kab.g);
  const cart = new THREE.Group(); cart.position.set(72, 0, -7.8); W.scene.add(cart);
  { const m = (c, w, h, dd, x, y, z) => { const e = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), mat(c)); e.position.set(x, y, z); e.castShadow = true; cart.add(e); return e; };
    m(0x8a6d4b, 3, 0.2, 1.8, 0, 0.9, 0); m(0x8a6d4b, 3, 0.7, 0.12, 0, 1.25, 0.9); m(0x8a6d4b, 3, 0.7, 0.12, 0, 1.25, -0.9); m(0x8a6d4b, 0.12, 0.7, 1.8, 1.5, 1.25, 0); m(0x8a6d4b, 0.12, 0.7, 1.8, -1.5, 1.25, 0);
    for (const x of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.15, 14), mat(0x2a2623)); w.rotation.x = Math.PI / 2; w.position.set(x, 0.5, 1.05); cart.add(w); const w2 = w.clone(); w2.position.z = -1.05; cart.add(w2); } }
  const pile = new THREE.Group(); pile.position.set(0, 1.05, 0); pile.visible = false; cart.add(pile);
  for (let k = 0; k < 9; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.5 + rand() * 0.5, 0.4, 0.5 + rand() * 0.4), mat([0x3a3d40, 0xb98a54, 0x93a4ab][k % 3])); m.position.set((rand() - 0.5) * 2.2, (k % 3) * 0.3, (rand() - 0.5) * 1.2); m.rotation.y = rand() * 3; pile.add(m); }
  W.circ(72, -7.8, 2.4); W.box(70.3, 73.7, -8.8, -6.8);
  const ks = sign('KABADIWALA', 4, 0.8, { fs: 0.45 }); ks.position.set(72, 3.4, -8.6); W.scene.add(ks); bill(W, ks);
  let kabBusy = false;
  const cartTop = () => cart.localToWorld(new THREE.Vector3(0, 1.5, 0));
  const kst = W.station({ d: 0, x: 68.5, z: -11, r: 3.4, grp: 'kab', id: 'kabadiwala', ico: '🛺', title: 'The only person who comes to the door', cls: 'gr', noMarker: false,
    html: 'He weighs your whole pile by hand and pays a small amount. There is no organised procedure for households: no collection point, nothing that says where to go. So this is where most e-waste leaves the house, headed for a dismantler. Your phone, <b>Ping</b>, goes along too.',
    onArrive() { kabBusy = true; W.stack.takeAll(cartTop, () => { pile.visible = true; W.ui.sfx('ok'); }); return { hold: 4.6 }; } });
  kst.faceStation = true; kst.anchorFn = v => v.set(72, 2.6, -10);
  W.tickers.push((dt, t) => { kab.walk(0, 0, t); if (kabBusy) kab.wave(t); });
  d.nodeStation = kst;
  d.onComplete = () => { W.ui.toast('<b>Imports ahead.</b> The same system is also fed from abroad.', 3600); };
  W.W = W; return d;
}
