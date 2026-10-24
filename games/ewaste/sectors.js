/* District 3: INDIA (where e-waste is made, and the formal / informal split) */
import { THREE, C, mat, glow, sign, icon, rand } from './build.js';
import { makeDistrict, banner, label, bill, loopRing, tree, house, lamp, heap, stall, makePerson } from './props.js';

// rough outline of India, lon / lat
const OUT = [[68.2, 23.6], [69.0, 22.4], [70.5, 20.8], [72.8, 21.2], [72.7, 19.0], [73.2, 16.2], [74.2, 13.5], [75.4, 11.4], [76.5, 9.0], [77.5, 8.1], [78.6, 9.2], [79.8, 10.3], [80.2, 13.2], [80.0, 15.5], [82.0, 16.8], [84.6, 19.2], [86.9, 21.2], [88.1, 21.7], [88.9, 22.2],
  [88.1, 24.9], [88.3, 26.2], [89.8, 26.2], [92.0, 25.1], [92.2, 23.6], [93.4, 22.7], [94.5, 23.8], [95.0, 25.8], [97.3, 28.0], [95.3, 29.2], [92.0, 27.8], [89.8, 28.2], [88.8, 27.4], [88.0, 27.8], [84.0, 28.6], [81.0, 30.2], [79.0, 31.0], [78.7, 32.5], [79.0, 34.2], [77.0, 35.6], [75.0, 36.8], [74.2, 35.0], [74.7, 33.0], [74.5, 31.0], [73.5, 29.8], [70.0, 27.5], [70.4, 25.3], [68.8, 24.3]];
const STATES = [['Maharashtra', 19.8, 19.7, 75.7, 0xc9302c], ['Tamil Nadu', 13, 11.1, 78.6, 0x2b6cb0], ['Uttar Pradesh', 10.1, 26.8, 80.9, 0x7a9a3a], ['West Bengal', 9.8, 23.0, 87.9, 0x8e44ad],
  ['Delhi', 9.5, 28.6, 77.2, 0x2f9e6b], ['Karnataka', 8.9, 14.9, 75.7, 0x1aa39a], ['Gujarat', 8.8, 22.3, 71.8, 0xd97706], ['Madhya Pradesh', 7.6, 23.5, 78.0, 0xb83280]];
const K = 1.05, X0 = 250;

export function build(W) {
  const d = makeDistrict(W, { i: 2, name: 'INDIA', sub: 'Formal and informal sector', x0: 220, x1: 310, zone: 1, face: 'worry', padColor: 0xfbe6a6, roadColor: 0xe6dcc0, spawn: [226, 0],
    groups: [{ grp: 'states', text: 'Stand on the eight biggest states' }, { grp: 'split', text: 'See the 10 / 90 split' }, { grp: 'formal', text: 'Read the formal sector boards' }] });
  const b = d.b;
  banner(W, d, 'E-waste in India', 'IT & telecom and consumer electricals & electronics', 232, 0, { w: 10, h: 6.5 });

  /* the map on the floor */
  const sh = new THREE.Shape(); OUT.forEach(([lo, la], i) => { const u = (la - 22) * K, v = -(lo - 82) * K; if (!i) sh.moveTo(u, v); else sh.lineTo(u, v); }); sh.closePath();
  const eg = new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: false }); eg.rotateX(-Math.PI / 2);
  const map = new THREE.Mesh(eg, mat(0xbfe8c0)); map.position.set(X0, 0.06, 0); map.receiveShadow = true; W.scene.add(map);
  const ol = new THREE.LineSegments(new THREE.EdgesGeometry(eg, 20), new THREE.LineBasicMaterial({ color: 0x3b3835 })); ol.position.copy(map.position); W.scene.add(ol);
  const ts = sign('Total e-waste generation in India\n= 2 million tonnes / year', 11, 2.1, { fs: 0.62 }); ts.position.set(236.5, 4, -17); ts.rotation.y = -Math.PI / 2; W.scene.add(ts); b.cyl(0x3a3f45, 0.1, 0.1, 3.2, 236.8, 0, -17, 6);
  const ts2 = sign('Share of e-waste by state (%)', 8, 1.1, { fs: 0.5, border: '#93a4ab' }); ts2.position.set(266, 5.6, 0); W.scene.add(ts2); bill(W, ts2);
  STATES.forEach(([name, share, la, lo, col], i) => {
    const x = X0 + (la - 22) * K, z = (lo - 82) * K, h = share * 0.42;
    b.cyl(0xe9e9e9, 0.5, 0.55, h, x, 0.14, z, 12); b.sphere(col, 0.85, x, h + 0.7, z, 1, 1, 1, 12); b.cone(col, 0.5, 0.9, x, h - 0.1 + 0.0, z, 8);
    const s = sign(`${name}\n${share}%`, 3.2, 1.2, { fs: 0.44, border: '#' + col.toString(16).padStart(6, '0') }); s.position.set(x, h + 2.4, z); W.scene.add(s); bill(W, s);
    W.circ(x, z, 0.9);
    W.station({ d: 2, x, z, r: 2.6, grp: 'states', id: 'state-' + name, ico: '', title: `${name}: ${share}% of India's e-waste`, stat: `${share}%`, cls: 'gr', html: `The eight biggest states together generate about 87% of India's roughly 2 million tonnes a year. ${name} alone produces ${share}%.`, noMarker: false });
  });

  /* 10 / 90 pie */
  const pie = new THREE.Group(); pie.position.set(283, 0, 4); W.scene.add(pie);
  const inf = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 0.3, 48, 1, false, 0, Math.PI * 2 * 0.9), mat(C.red)), frm = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6.5, 0.3, 24, 1, false, Math.PI * 2 * 0.9, Math.PI * 2 * 0.1), mat(C.cyan));
  inf.position.y = 0.2; frm.position.y = 0.2; pie.add(inf, frm);
  const l1 = sign('90%\nINFORMAL', 4.2, 1.7, { fs: 0.62, border: '#e04b2c' }); l1.position.set(283 - 1, 3.4, 4 + 2); W.scene.add(l1); bill(W, l1);
  const l2 = sign('10%\nFORMAL', 3.6, 1.7, { fs: 0.62, border: '#31b5d6' }); l2.position.set(283 + 5.5, 3.4, 4 - 7.2); W.scene.add(l2); bill(W, l2);
  W.station({ d: 2, x: 283, z: 4, r: 4.5, grp: 'split', id: 'split', ico: '⚖️', title: 'Only 10% goes the formal way', stat: '10% formal · 90% informal', cls: 'gr', html: 'E-waste in India falls into the hands of handlers, both formal and informal. The formal chain includes manufacturers, producers, dealers, bulk consumers, dismantlers, refurbishers and recyclers, all needing authorisation from the State Pollution Control Board. Yet about 90% of e-waste is processed by the informal sector.', ms: 14000 });

  /* the formal sector building */
  const fx = 300, fz = -24;
  b.box(0xf6f9fa, 9, 9.5, 17, fx, 0, fz); b.box(0xe4eef1, 9.6, 0.6, 17.6, fx, 9.5, fz);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) b.box(0x31b5d6, 0.2, 1.7, 2.6, fx - 4.5, 2.2 + r * 2.7, fz - 6.4 + c * 4.2, 0, false);
  for (let c = 0; c < 8; c++) b.box(c % 2 ? 0xd8dfe2 : 0xc3ccd0, 0.2, 1.1, 2, fx - 4.5, 0, fz - 7.5 + c * 2.15, 0, false);
  b.box(0x31b5d6, 0.3, 2.4, 3.4, fx - 4.5, 0, fz, 0, false);
  const fl = sign('FORMAL SECTOR', 9, 1.2, { fs: 0.62, border: '#31b5d6', fg: '#176a80' }); fl.position.set(fx - 4.9, 10.9, fz); fl.rotation.y = -Math.PI / 2; W.scene.add(fl);
  W.box(fx - 4.5, fx + 4.5, fz - 8.5, fz + 8.5);
  W.station({ d: 2, x: fx - 8, z: fz, r: 4, grp: 'formal', id: 'formal-why', ico: '🏢', title: 'Formal sector: why only 10%?', cls: 'cy', html: 'There is no proper collection system or disposal mechanism, so households and institutions end up storing old products in warehouses and storerooms. The formal sector also lacks refineries for precious-metal recovery.' });
  // capacity vs processed gauges
  const gauge = (x, z, cap, got, name, line) => {
    b.box(0xe4eef1, 2, 0.4, 3.6, x, 0, z, 0, false);
    const t1 = new THREE.Mesh(new THREE.BoxGeometry(1.1, cap, 1.1), glow(C.cyan, 0.3)); t1.position.set(x, cap / 2 + 0.4, z - 0.7); W.scene.add(t1);
    const t2 = new THREE.Mesh(new THREE.BoxGeometry(1.1, Math.max(0.12, got), 1.1), mat(C.red)); t2.position.set(x, Math.max(0.12, got) / 2 + 0.4, z + 0.7); t2.castShadow = true; W.scene.add(t2);
    const s = sign(name + '\n' + line, 5.4, 1.9, { fs: 0.4 }); s.position.set(x, cap + 2.3, z); W.scene.add(s); bill(W, s);
  };
  gauge(293, -8, 6, 2.4, 'TIC Group, Noida', 'capacity 500 t · did 200 t');
  gauge(302, -8, 6, 0.1, 'Attero, Roorkee', 'capacity 36,000 t · got 600 t');
  W.station({ d: 2, x: 293, z: -8, r: 3, grp: 'formal', id: 'tic', ico: '📉', title: 'TIC Group unit, Noida', stat: '200 of 500 t used', cls: 'cy', html: 'A 10,000 sq. ft. formal dismantling unit, launched in June 2008, that can process up to 500 tonnes of e-waste a year. It has processed only 200 tonnes in total. <b>Blue: capacity. Red: what it handled.</b>' });
  W.station({ d: 2, x: 302, z: -8, r: 3, grp: 'formal', id: 'attero', ico: '📉', title: 'Attero recycling unit, Roorkee', stat: '600 of 36,000 t used', cls: 'cy', html: 'A 35 crore plant that can process 36,000 tonnes of waste a year. It currently gets only 600 tonnes.' });

  /* locked formal door and the open informal road */
  b.box(0xdfe8ea, 6, 3.4, 4, 296, 0, 14); b.box(0x31b5d6, 6.6, 0.4, 4.6, 296, 3.4, 14, 0, false); b.box(0x3a3f45, 0.2, 2.4, 1.6, 292.95, 0, 14, 0, false);
  const lk = sign('FORMAL DEALERS', 5, 0.9, { fs: 0.42, border: '#31b5d6' }); lk.position.set(292.8, 4.3, 14); lk.rotation.y = -Math.PI / 2; W.scene.add(lk);
  const lock = icon('🔒', 1.4); lock.position.set(292.6, 1.6, 14); lock.rotation.y = -Math.PI / 2; W.scene.add(lock);
  W.station({ d: 2, x: 291, z: 14, r: 3, kind: 'press', repeat: true, grp: 'bonus', req: false, id: 'locked', key: 'Try the formal door', ico: '',
    onUse() { W.ui.card({ kick: 'Consumers and the formal sector', title: 'The door is locked to you', html: '<p>Consumers cannot reach formal dealers directly. The CPCB website gives no specific information on authorised dismantlers and recyclers, so people hoard their e-waste or hand it to whoever comes to the door.</p><p>So the only road for your pile leads on to the informal sector.</p>', buttons: [{ t: 'OK', cls: 'red' }] }); } });
  for (let i = 0; i < 3; i++) { stall(b, 300 + i * 4.5, 24 + (i % 2) * 2, 3.2, [0xc9792a, 0x8a8f93, 0xb5483a][i], 0); }
  heap(b, 305, 31, 2.6, 1.4, 22); heap(b, 292, 31, 2.2, 1.2, 18);
  const is = sign('INFORMAL SECTOR: the open road', 8, 0.9, { fs: 0.44 }); is.position.set(300, 5.6, 22); W.scene.add(is); bill(W, is);

  /* loops */
  loopRing(W, d, { x: 270, z: 26, r: 4.4, nodes: ['E-waste from many sources, formal too', 'Informal sector used (lesser profits)', 'Formal stakeholders thrive', 'Sold to the formal market again', 'Processed & recovered parts'], title: 'Formal and informal loop', id: 'loop-fi', grp: 'bonus', req: false, ico: '🔁', cls: 'gr',
    html: 'E-waste moves from the formal sector to informal trading and processing units, and the recovered materials and dismantled parts are sold to the formal market again. The informal sector keeps holding up the formal stakeholders.' });
  loopRing(W, d, { x: 270, z: -27, r: 4.4, nodes: ['Consumers', 'Cannot reach formal dealers', 'CPCB site has no info on recyclers', 'Hoarding: no idea what to do'], title: 'Consumers loop', id: 'loop-cons', grp: 'bonus', req: false, ico: '🔁', cls: 'gr', color: C.red, rot: 0.3,
    html: 'Consumers cannot reach formal dealers, no information is available on the central or state pollution board websites, so they start hoarding e-waste without knowing what to do with it.' });
  for (let x = 224; x < 308; x += 14) { lamp(b, x, 33); lamp(b, x, -33); }
  d.onComplete = () => { W.ui.toast('<b>The informal road is open.</b> It is where 90% of it goes.', 3800); };
  return d;
}
