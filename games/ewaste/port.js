/* District 2: PORT (imports: e-waste at national level) */
import { THREE, C, Batch, mat, glow, sign, icon, rand, clamp } from './build.js';
import { makeDistrict, banner, label, bill, loopRing, container, lamp, tree } from './props.js';

const CASES = [
  { cargo: 'Second-hand laptops', purpose: 'Donation to a school', age: '6 years', cert: true, ok: true, why: 'Allowed. Second-hand computers up to 10 years old may be imported as donations, and the certificate is in order.' },
  { cargo: '"Second-hand" computers, mixed lot', purpose: 'Reuse', age: '14 years', cert: false, ok: false, why: 'Illegal. Over 10 years old, no certificate, and the valuable parts were already removed. This is e-waste brokering, so it earns a penalty.' },
  { cargo: 'New desktop computers', purpose: 'Trade', age: 'new', cert: true, ok: true, why: 'Fine. New equipment with papers in order.' },
  { cargo: 'Broken monitors', purpose: '"For repair"', age: '12 years', cert: false, ok: false, why: 'Repair is only a pretext here. Too old and no certificate, so a penalty applies.' },
  { cargo: 'Scrap, "municipal residues"', purpose: 'Transfer of skills', age: 'unknown', cert: false, ok: false, corrupt: true, why: 'Illegal. Containers like this are often released after a payment under the table. Corruption is one reason scrap slips in.' },
  { cargo: 'Used phones', purpose: 'Reuse', age: '4 years', cert: true, ok: true, why: 'Allowed. Reuse is what the rules are for, and the certificate is in order.' },
];

export function build(W) {
  const d = makeDistrict(W, { i: 1, name: 'PORT', sub: 'Imports, a national level', x0: 110, x1: 190, zone: 0, face: 'worry', padColor: 0xbfe3f5, roadColor: 0xd9e4ea, spawn: [116, 0],
    groups: [{ grp: 'board', text: 'Read the four import boards' }, { grp: 'insp', text: 'Inspect the six containers' }, { grp: 'loop', text: 'Find the policy loop' }] });
  const b = d.b, ST = W.ST;
  banner(W, d, 'Imports', 'can be seen as e-waste on a national level', 124, 0, { w: 10, h: 6.5 });

  /* sea, quay, ship and crane */
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(80, 16), new THREE.MeshLambertMaterial({ color: 0x3fb0e6 })); sea.rotation.x = -Math.PI / 2; sea.position.set(150, 0.13, -26.5); W.scene.add(sea);
  W.box(110, 190, -34, -19.2);
  b.box(0xf1e1c4, 80, 0.5, 1.2, 150, 0, -18.6); for (let x = 114; x < 190; x += 8) b.cyl(0x3a3f45, 0.25, 0.25, 0.7, x, 0.4, -18.6, 8);
  b.box(0x2b5f9a, 44, 3.2, 8, 152, 0.1, -27.5); b.box(0xfff3d0, 5, 6.5, 6, 134, 3.3, -27.5); b.box(0xe0553c, 5, 1, 7, 132, 3, -27.5);
  const cc = [0xe04b2c, 0x31b5d6, 0xf2c230, 0x6a8a54, 0xd4d7d9, 0xe08a2c];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) container(b, 142 + i * 4.8, -29.5 + j * 2.6, cc[(i + j * 2 + k) % 6], 0, 4.5, 2.2, 2.1);
  for (let i = 0; i < 6; i++) container(b, 142 + i * 4.8, -27.2, cc[(i * 5 + 1) % 6], 0, 4.5, 2.2, 2.1);
  for (const z of [-17, -21.5]) for (const x of [164, 172]) b.box(0xe04b2c, 0.8, 11, 0.8, x, 0, z, 0, false);
  b.box(0xe04b2c, 10, 0.9, 6, 168, 11, -19.5); b.box(0xe04b2c, 0.7, 0.7, 20, 168, 10.2, -27, 0, false);
  const hook = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 0.3), mat(C.ink)); W.scene.add(hook); const hc = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.2, 1.2), mat(0x31b5d6)); hc.castShadow = true; W.scene.add(hc);
  W.tickers.push((dt, t) => { const z = -24 - Math.sin(t * 0.35) * 5, y = 6 + Math.sin(t * 0.7) * 2; hook.position.set(168, y + 3, z); hc.position.set(168, y, z); });
  W.station({ d: 1, x: 168, z: -14, r: 3.4, grp: 'bonus', req: false, id: 'ports', ico: '⚓', title: 'Porous ports', cls: 'gr', html: 'Major and intermediate ports have scanners and technology that cannot check everything. Under assessment, containers get released with scrap inside, and corruption adds to the pile.' });

  /* customs arch at the entrance */
  b.box(0x4b5358, 1, 5.6, 1, 117, 0, -6, 0, false); b.box(0x4b5358, 1, 5.6, 1, 117, 0, 6, 0, false); b.box(0x4b5358, 1.4, 1.1, 13, 117, 5.4, 0);
  const asg = sign('CUSTOMS\nSCANNER', 4.6, 1.1, { fs: 0.4 }); asg.position.set(116.2, 6.2, 0); asg.rotation.y = -Math.PI / 2; W.scene.add(asg);

  /* container yard scenery */
  for (let i = 0; i < 7; i++) for (let k = 0; k < 2 + (i % 2); k++) { container(b, 115 + i * 7, 26 + (i % 2) * 3, cc[(i * 3 + k) % 6], 0, 6, 2.6, 2.4); }
  for (let i = 0; i < 4; i++) container(b, 118 + i * 7, 31, cc[(i * 2) % 6], 0, 6, 2.6, 2.4);
  W.box(111, 164, 23.4, 33.5);
  for (const x of [128, 148, 168]) lamp(b, x, 14);

  /* the four import boards */
  [['📁', 'POLICY', 'India customs tariff act, EXIM', 'Second-hand and new computers sit under the same EXIM code. Import is allowed only for repair, reuse and reprocessing, and second-hand computers up to 10 years old can come in as donations. Computers older than that still arrive, mixed in with new ones, with the valuable parts already removed: illegal e-waste brokering.', 126],
    ['📖', 'AGREEMENTS', 'FTA and EPA', 'Free Trade and Economic Partnership agreements are "unspoken quid pro quo deals". Japan accepted waste in return for access to domestic and nursing labour from the Philippines. Brokers misuse these agreements to import junk rather than good quality products.', 141],
    ['🗄️', 'REGULATIONS (ZONES)', 'Foreign Trade Development Act', 'Zones set up for exports: export processing units, software technology parks, electronics hardware technology parks and export-oriented units. Weak checking facilities and scanner limits let more junk in under the pretext of second-hand technology transfer.', 156],
    ['🛂', 'IMPORT RULES', 'The procedure of importing e-waste', 'If a consignment is illegal or lacks the right certificates, the party pays a penalty. But containers under assessment get released anyway with scrap inside, and corruption lets illegal containers through for a payment.', 171]].forEach(([ico, t, sub, h, x], i) => {
    b.box(0xffffff, 2.4, 1.1, 2.4, x, 0, 11); b.box(C.orange, 2.4, 0.18, 2.4, x, 1.1, 11, 0, false);
    const s = sign(t, 5, 1.2, { fs: 0.5 }); s.position.set(x, 3.6, 11); bill(W, s); W.scene.add(s);
    W.station({ d: 1, x, z: 11, r: 3.3, grp: 'board', id: 'board-' + i, ico, title: t + ': ' + sub, html: h, cls: 'gr', ms: 12000 });
  });

  /* global bodies: golden globe with orbiting labels */
  const gl = new THREE.Group(); gl.position.set(120, 0, 17); W.scene.add(gl);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(2.4, 20, 14), new THREE.MeshToonMaterial({ color: 0xf2c230, wireframe: true })); globe.position.y = 4.3; gl.add(globe);
  const core = new THREE.Mesh(new THREE.SphereGeometry(2.2, 16, 12), mat(0xfff0b8)); core.position.y = 4.3; gl.add(core);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.7, 1.4, 12), mat(0x8a8178)); base.position.y = 0.7; gl.add(base);
  const orb = new THREE.Group(); orb.position.y = 4.3; gl.add(orb);
  ['UNEP', 'Basel Convention', 'IEMN', 'Umicore', 'GESP', 'FICCI', 'MoEFCC', 'DGFT'].forEach((n, i) => { const a = i / 8 * 6.283, s = sign(n, 2.6, 0.6, { fs: 0.34, border: '#f2c230' }); s.position.set(Math.cos(a) * 4.6, Math.sin(i * 1.7) * 0.5, Math.sin(a) * 4.6); orb.add(s); });
  const gs = sign('GLOBAL E-WASTE MANAGEMENT', 7, 0.8, { fs: 0.42, border: '#f2c230' }); gs.position.set(120, 9.2, 17); W.scene.add(gs); bill(W, gs);
  W.tickers.push((dt, t) => { orb.rotation.y = t * 0.3; globe.rotation.y = t * 0.2; for (const s of orb.children) s.rotation.y = -orb.rotation.y + Math.atan2(W.camera.position.x - 120, W.camera.position.z - 17); });
  W.circ(120, 17, 1.8);
  W.station({ d: 1, x: 120, z: 17, r: 6, grp: 'bonus', req: false, id: 'global', ico: '🌍', title: 'Global e-waste management', cls: 'gr', html: 'E-waste is the fastest growing part of the world\'s municipal waste stream. Bodies working on it include the UN Environment Programme, the Basel Convention, the International E-Waste Management Network, Umicore, the Global E-waste Statistics Partnership, FICCI, India\'s environment ministry and the Directorate General of Foreign Trade.' });

  /* policy loop */
  loopRing(W, d, { x: 178, z: 13, r: 4.6, nodes: ['Policy allows import of EEE', 'Misused by brokers', 'More junk imported as "e-waste"', 'Fuels the brokering system'], title: 'Policy loop', id: 'loop-policy', grp: 'loop', rot: 0.2, ico: '🔁',
    html: 'The import policy allows electronics in, but brokers misuse it, so more e-waste is dumped on developing countries. The cycle keeps going under the pretext of donations and charity: a negative loop that is enforced by itself.' });

  /* the six containers */
  const junk = new THREE.Group(); junk.position.set(184, 0, 10); W.scene.add(junk); let junkN = 0;
  const addJunk = () => { for (let k = 0; k < 5; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.5 + rand() * 0.6, 0.3 + rand() * 0.3, 0.5 + rand() * 0.6), mat([0x3a3d40, 0x5b6063, 0x2c6b46, 0xa7752f][k % 4])); m.position.set((rand() - 0.5) * 3, 0.2 + junkN * 0.08, (rand() - 0.5) * 3); m.rotation.set(rand(), rand() * 3, rand()); m.castShadow = true; junk.add(m); } junkN++; };
  const done = [];
  CASES.forEach((c, i) => {
    const x = 126 + i * 10, z = -7, col = [0x31b5d6, 0xe08a2c, 0x6a8a54, 0xe04b2c, 0x8a8f93, 0xf2c230][i];
    const g = new THREE.Group(); g.position.set(x, 0, z); W.scene.add(g);
    const cont = new THREE.Group(); g.add(cont);
    const bx = new THREE.Mesh(new THREE.BoxGeometry(6, 2.6, 2.4), mat(col)); bx.position.y = 1.3; bx.castShadow = true; cont.add(bx);
    for (let k = -2; k <= 2; k++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.4, 2.5), mat(0x000000, { transparent: true, opacity: 0.25 })); r.position.set(k * 1.1, 1.3, 0); cont.add(r); }
    const tag = sign(`No. ${i + 1}`, 1.6, 0.7, { fs: 0.45 }); tag.position.set(0, 3.4, 0); g.add(tag); bill(W, tag);
    W.box(x - 3, x + 3, z - 1.2, z + 1.2);
    const st = W.station({ d: 1, x, z: z + 3.2, r: 2.8, kind: 'press', grp: 'insp', id: 'cont-' + i, key: `Inspect container ${i + 1}`, ico: '', zone: 0,
      onArrive(s) {
        const man = `<div class="man"><b>Cargo</b><span>${c.cargo}</span><b>Declared use</b><span>${c.purpose}</span><b>Age</b><span>${c.age}</span><b>Certificate</b><span class="${c.cert ? 'yes' : 'no'}">${c.cert ? 'Present' : 'Missing'}</span></div>`;
        const dec = ok => {
          const right = ok === c.ok; ST.customsN++; if (right) ST.customsOk++; else if (!c.ok && ok) { addJunk(); W.shake = 0.4; }
          W.ui.sfx(right ? 'ok' : 'bad'); W.finish(s);
          W.ui.card({ kick: right ? 'Good call' : 'Not quite', title: ok ? 'Released' : 'Penalty issued', cls: right ? 'cy' : '', html: `<p>${c.why}</p>${!right && !c.ok && ok ? '<p><b>That container is now in the country: junk released.</b></p>' : ''}<p style="opacity:.7">${ST.customsOk} of ${ST.customsN} judged right.</p>`, buttons: [{ t: 'Continue', cls: 'red' }] });
          if (right) bx.material = mat(col); cont.position.y = 0; cont.rotation.y = 0;
        };
        W.ui.card({ kick: `Container ${i + 1} of 6`, title: 'Customs desk', html: `<p>Import is allowed only for repair, reuse and reprocessing. Second-hand computers must be under 10 years old and have a certificate.</p>${man}${c.corrupt ? '<p><b>A man slides an envelope across the desk: "Release it quietly."</b></p>' : ''}`,
          buttons: [{ t: c.corrupt ? 'Take it and release' : 'Release', cls: 'ghost', cb: () => { dec(true); return false; } }, { t: c.corrupt ? 'Refuse. Penalty' : 'Penalty', cls: 'red', cb: () => { dec(false); return false; } }] });
        return { modal: true };
      } });
    done.push(st);
  });
  d.onComplete = () => { W.ui.toast('<b>Gate open.</b> Next: how India sorts what stays.', 3600); };
  return d;
}
