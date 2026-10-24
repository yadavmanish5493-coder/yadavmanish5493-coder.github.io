/* District 5: MIDDLEMEN and POLICY (red turns to cyan) */
import { THREE, C, mat, glow, sign, icon, rand } from './build.js';
import { makeDistrict, banner, label, bill, loopRing, tree, lamp, makePerson } from './props.js';
import { idler } from './life.js';

const FLAGS = [
  [0xd35f9d, 'Collection & channelisation', 'Producers collect their end-of-life products and channel them to an authorised dismantler or recycler for environmentally sound management.'],
  [0xe08a2c, 'Public information', 'Information on returning end-of-life equipment, its hazardous constituents and the dangers of improper handling must be public.'],
  [0xd93a30, 'Collection targets', 'Producers must collect <b>30%</b> of what they put on the market in the first year, rising to <b>70%</b>. They must also create awareness.'],
  [0x9aaa2c, 'EPR authorisation', 'Every producer needs an EPR authorisation from the Central Pollution Control Board, with a plan stating the e-waste expected that year.'],
  [0x2b6cb0, 'No hazardous substances (RoHS)', 'Products made after implementation cannot contain lead, mercury, hexavalent chromium, PBBs or PBDEs beyond set limits.'],
  [0xd93a30, 'Producer responsibility', 'Collection centres, storage, transport, environmentally sound dismantling and recycling, refurbishment and random RoHS sampling are all producers\' duty.'],
];
const PLAYERS = [
  ['🏛️', 'Government', 'Government schemes and agencies reach informal workers through middlemen, who know the market and the people.'],
  ['🏢', 'Companies', 'Companies buy recovered parts and products from the informal sector through them.'],
  ['🤝', 'Organizations', 'Organizations use middlemen as the medium of communication between maker and buyer.'],
  ['🚢', 'Export houses', 'Export houses use middlemen to bring informal sector goods to markets abroad.'],
  ['💚', 'NGOs', 'NGOs work through middlemen to reach workers. Support from family, word of mouth and ease of approach are how middlemen win trust.'],
];

export function build(W) {
  const d = makeDistrict(W, { i: 4, name: 'MIDDLEMEN & POLICY', sub: 'Who connects, who regulates', x0: 550, x1: 650, zone: 2, face: 'hope', padColor: 0xf6c6de, roadColor: 0xe4d2dc, spawn: [556, 0],
    groups: [{ grp: 'stake', text: 'Meet the middleman\'s five partners' }, { grp: 'pc', text: 'Weigh the pros and cons' }, { grp: 'rules', text: 'Walk the E-waste Rules 2016 road' }, { grp: 'schemes', text: 'Visit the schemes circle' }] });
  const b = d.b;
  banner(W, d, 'Middlemen', 'a bridge between informal and formal', 562, 0, { w: 10, h: 6.5 });

  /* the middleman */
  b.box(0xe8dcc8, 7, 0.9, 7, 580, 0, 0); b.box(C.orange, 7, 0.14, 7, 580, 0.9, 0, 0, false);
  const mm = makePerson({ shirt: 0xd4472a, pants: 0x7a2a18, hat: 0x5a2a18, skin: 0xf0c8a0, scale: 3.4 }); mm.g.position.set(580, 0.95, 0); mm.g.rotation.y = -Math.PI / 2; W.scene.add(mm.g);
  W.tickers.push((dt, t) => { mm.inner.rotation.y = Math.sin(t * 0.6) * 0.25; });
  W.circ(580, 0, 3.6);
  const ms = sign('MIDDLEMEN', 7, 1.2, { fs: 0.7 }); ms.position.set(580, 9.6, 0); W.scene.add(ms); bill(W, ms);
  W.station({ d: 4, x: 575, z: 0, r: 3.6, grp: 'bonus', req: false, id: 'middleman', ico: '🧑‍💼', title: 'Middlemen', cls: '', html: 'They create a hierarchy between the informal and the formal sector: they buy from the informal sector at a minimal price and share only a small part of the profit with the workers. They also give greater opportunity to connect to the market.' });

  /* five partners in a fan */
  PLAYERS.forEach(([ico, name, html], i) => {
    const a = -1.309 + i * 0.654, x = 580 + Math.cos(a) * 14, z = Math.sin(a) * 14;
    b.cyl(0xffffff, 1.3, 1.5, 0.9, x, 0, z, 16); b.cyl(C.orange, 1.3, 1.3, 0.14, x, 0.9, z, 16);
    const s = sign(name, 4, 0.9, { fs: 0.5 }); s.position.set(x, 3.1, z); W.scene.add(s); bill(W, s);
    W.station({ d: 4, x, z, r: 3, grp: 'stake', id: 'player-' + i, ico, title: name, cls: '', html });
    idler(W, { x, z, y: 1.06, ry: -a * 0 + Math.PI * 0.5 + 0.0, shirt: [0x22304a, 0x2f86c0, 0x4aa86a, 0xf2c230, 0x1aa39a][i], pants: 0x22304a, hat: i === 3 ? 0xf2c230 : null, skin: [0xf0c8a0, 0xd9a577, 0xb07a52, 0x8a5a3c, 0xf7d9bd][i], range: 16 });
  });

  /* pros and cons pads */
  [['PROS', 0x3a9a6a, -25, '✅', 'They bring the informal sector into the outer world, revive and preserve useful electronics, and act as a medium between maker and buyer. They give workers exposure and create a channel of income.'],
    ['CONS', C.red, 25, '⛔', 'They exploit workers\' illiteracy, sell products to buyers at exorbitant prices, dominate the sector and take most of the commission, which gives workers less exposure.']].forEach(([t, col, z, ico, html], i) => {
    b.box(col, 9, 0.3, 9, 578, 0, z); b.box(0xffffff, 8, 0.1, 8, 578, 0.3, z, 0, false);
    const s = sign(t, 4.2, 1.4, { fs: 0.9, border: '#' + col.toString(16).padStart(6, '0') }); s.position.set(578, 3.2, z); W.scene.add(s); bill(W, s);
    W.station({ d: 4, x: 578, z, r: 4.2, grp: 'pc', id: 'pc-' + i, ico, title: t + ' of middlemen', cls: i ? '' : 'cy', html });
  });

  /* E-waste Rules 2016 road */
  b.box(0xb4b7b9, 44, 0.12, 4.2, 624, -0.02, -20); for (let i = 0; i < 10; i++) b.box(0xffffff, 1.6, 0.04, 0.2, 604 + i * 4, 0.1, -20, 0, false);
  const rs = sign('Base of the E-waste Rules 2016:\nExtended Producer Responsibility (EPR)', 11, 2, { fs: 0.55 }); rs.position.set(600, 4.5, -20); rs.rotation.y = -Math.PI / 2; W.scene.add(rs); b.cyl(0x3a3f45, 0.1, 0.1, 3.5, 600.3, 0, -25, 6); b.cyl(0x3a3f45, 0.1, 0.1, 3.5, 600.3, 0, -15, 6);
  FLAGS.forEach(([col, t, html], i) => {
    const x = 607 + i * 7.4, z = -24.5 + (i % 2) * 0.0;
    b.cyl(0x3a3f45, 0.07, 0.07, 5, x, 0, z, 6); { const cloth = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 0.06), mat(col)); cloth.geometry.translate(1.1, 0, 0); cloth.position.set(x, 3.9, z); W.scene.add(cloth); W.tickers.push((dt, t) => { cloth.rotation.y = Math.sin(t * 3.2 + i) * 0.35; cloth.rotation.z = Math.sin(t * 4 + i) * 0.06; }); }
    const s = sign(`${i + 1}. ${t}`, 5.6, 1.3, { fs: 0.4, border: '#' + col.toString(16).padStart(6, '0') }); s.position.set(x, 6.2, z); W.scene.add(s); bill(W, s);
    W.station({ d: 4, x, z: -21, r: 3.2, grp: 'rules', id: 'flag-' + i, ico: '🚩', title: t, cls: 'cy', html, stat: `Rule ${i + 1} of 6`, ms: 10000 });
  });

  /* schemes circle */
  const ring = loopRing(W, d, { x: 628, z: 8, r: 7, color: C.cyan, nodes: ['Policies guarantee payment', 'Support the informal sector', 'Equal pay for equal work', 'Support women\'s education', 'Aid physical health'], arrows: 14, title: 'Government policies and schemes', id: 'schemes', grp: 'schemes', ico: '🏛️', cls: 'cy', dir: -1,
    html: 'These policies and schemes aim at wages, women\'s education, support in old age and physical health, through hospitals and clinics. <b>But inaccessibility of the schemes, and little awareness of them, holds a barrier</b> to ultimately using any of it.' });
  [['FINANCIAL AID', '💵', 628, 21.5, 'Health insurance, home loans and other financial facilities, to give informal workers what they need to work safely and grow.'], ['RESERVATION', '⚖️', 628, -4.5, 'Reservation by religion, caste, age or skill gives privileges to minorities, removes the isolation of an informal worker, uplifts skilled labour and keeps equality in society.']].forEach(([t, ico, x, z, html], i) => {
    b.cyl(0xffffff, 1.5, 1.7, 0.9, x, 0, z, 16); b.cyl(C.cyan, 1.5, 1.5, 0.14, x, 0.9, z, 16);
    const s = sign(t, 4.4, 0.9, { fs: 0.5, border: '#31b5d6' }); s.position.set(x, 3.2, z); W.scene.add(s); bill(W, s);
    W.station({ d: 4, x, z, r: 3, grp: 'schemes', id: 'scheme-' + i, ico, title: t, cls: 'cy', html });
  });
  /* chevrons: why inflow dropped */
  [['GST & demonetisation', 'Formal companies cannot sell WEEE to the informal market because of GST requirements. Almost every unit said GST and demonetisation cut the waste inflow.'], ['Import ban on WEEE', 'The E-waste Rules 2016 banned imports of WEEE.'], ['New technologies, less demand', 'The market shifted and new technologies reduced demand.'], ['E-waste (Management) Rules 2016', 'The rules reduced the flow into the informal market.']].forEach(([t, html], i) => {
    const x = 612 + i * 8, z = 23 + (i % 2) * 2;
    b.box(i % 2 ? 0xc9cdd0 : 0xdfe2e4, 6, 1.6, 2.2, x, 0, z); const s = sign(t, 5.6, 1.1, { fs: 0.36, border: '#93a4ab' }); s.position.set(x, 2.6, z); W.scene.add(s); bill(W, s);
    W.station({ d: 4, x, z: z - 3, r: 2.6, grp: 'bonus', req: false, id: 'chev-' + i, ico: '📉', title: t, cls: 'gr', html });
  });
  for (let x = 556; x < 650; x += 14) { lamp(b, x, 33); lamp(b, x, -33); }
  d.onComplete = () => { W.ui.toast('<b>Policy is only half the story.</b> Next: reach the people it never reached.', 4200); };
  return d;
}
