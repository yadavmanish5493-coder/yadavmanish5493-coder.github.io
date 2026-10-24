/* District 6: AWARENESS CAMPAIGN (towards a solution) and the finale */
import { THREE, C, mat, glow, sign, icon, rand, clamp } from './build.js';
import { makeDistrict, banner, label, bill, tree, lamp } from './props.js';
import { giver } from './life.js';

const TOPICS = [['💼', 'Opportunities'], ['💡', 'New technology'], ['🏪', 'New & existing market'], ['🩺', 'Health & medication'], ['🌱', 'Resources & environment'], ['🧼', 'Hygiene & sanitation']];
const CERT = [['♿', 'Accessibility', 'Schemes can be availed easily.'], ['🧭', 'Governance', 'Third-party independence when the certification agency is supported by organisations.'], ['📋', 'Compliance', 'A trustworthy compliance system.'],
  ['🔍', 'Monitoring', 'A monitoring system that is not too costly or onerous.'], ['📢', 'Transparency', 'Information is clearly communicated and publicly available.']];
const HEAD = { x: 722, z: 0 }, TR = 17.2;

export function build(W) {
  const d = makeDistrict(W, { i: 5, name: 'AWARENESS', sub: 'Towards a solution', x0: 680, x1: 770, zone: 2, last: true, face: 'hope', padColor: 0xb4ece4, spawn: [686, 0],
    groups: [{ grp: 'posters', text: 'Put six awareness posters on trucks' }, { grp: 'cert', text: 'Read the five certification principles' }, { grp: 'finale', text: 'Walk to the pencil and break the loop' }] });
  const b = d.b, ST = W.ST, ui = W.ui, P = W.P;
  banner(W, d, 'Awareness campaign', 'inspiration, health, market understanding', 694, 0, { w: 10, h: 6.5, border: '#31b5d6' });

  /* the head */
  b.cyl(0xe4e6e8, 2.2, 2.8, 1, HEAD.x, 0, HEAD.z, 20); b.cyl(0x8a9498, 1.1, 1.4, 2.4, HEAD.x, 1, HEAD.z, 12);
  const head = new THREE.Group(); head.position.set(HEAD.x, 6.6, HEAD.z); W.scene.add(head);
  const back = new THREE.Mesh(new THREE.SphereGeometry(3.6, 22, 16), mat(0x41464a)); back.position.x = 1.0; back.castShadow = true; head.add(back);
  const top = new THREE.Mesh(new THREE.SphereGeometry(3.7, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(C.cyan)); top.position.set(0.2, 0.2, 0); top.rotation.y = 0; head.add(top);
  const face = new THREE.Mesh(new THREE.BoxGeometry(2.6, 4.6, 5.2), mat(0xe4e6e8)); face.position.set(-2.4, -1.1, 0); face.castShadow = true; head.add(face);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 1.0), mat(0xe4e6e8)); nose.position.set(-4, -1.6, 0); nose.rotation.z = -0.3; head.add(nose);
  for (let k = 0; k < 6; k++) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.3), mat(k % 2 ? C.cyan : 0xffffff)); p.position.set(-0.6, 2.6 + (k > 2 ? -0 : 0), -2.4 + k * 0.96); p.visible = false; head.add(p); }
  W.tickers.push((dt, t) => { head.rotation.y = Math.sin(t * 0.5) * 0.35; head.position.y = 6.6 + Math.sin(t * 1.3) * 0.2; });
  W.circ(HEAD.x, HEAD.z, 3);
  const hs = sign('AWARENESS\nCAMPAIGN', 8, 2.2, { fs: 0.9, border: '#31b5d6', fg: '#176a80' }); hs.position.set(HEAD.x, 13.5, HEAD.z); W.scene.add(hs); bill(W, hs);

  /* outcomes behind the head */
  [['Inspiration to continue the craft', -14], ['Increased health status', 0], ['Better understanding about market', 14]].forEach(([t, z]) => {
    b.cyl(0x3a3f45, 0.1, 0.1, 5, 738, 0, z, 6); const s = sign(t, 5.6, 1.4, { fs: 0.44, border: '#93a4ab' }); s.position.set(738, 5.4, z); s.rotation.y = -Math.PI / 2; W.scene.add(s);
  });

  /* trucks driving round the head: each takes two posters, one on each side */
  const trucks = [], beams = [];
  for (let k = 0; k < 3; k++) {
    const g = new THREE.Group(); W.scene.add(g);
    const mk = (c, w, h, dd, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), mat(c)); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
    mk(0xe8e8e4, 6.2, 3.4, 3, -1.2, 2.1, 0); mk(C.cyan, 6.25, 0.3, 3.05, -1.2, 0.55, 0); mk(0xe04b2c, 2.2, 2.4, 2.8, 3.1, 1.7, 0); mk(0x9fd8e6, 0.1, 1.1, 2.2, 4.2, 2.1, 0); mk(0x22201e, 7, 0.4, 2.6, 0.2, 0.5, 0);
    for (const x of [-3, 0.6, 3.4]) for (const z of [-1.5, 1.5]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.45, 14), mat(0x22201e)); w.rotation.x = Math.PI / 2; w.position.set(x, 0.62, z); g.add(w); }
    const lbl = sign('E-WASTE', 4, 0.9, { fs: 0.5, bg: '#2a2623', fg: '#f2c230', border: null }); lbl.position.set(-1.2, 3.55, 1.52); g.add(lbl); const lb2 = lbl.clone(); lb2.position.z = -1.52; lb2.rotation.y = Math.PI; g.add(lb2);
    trucks.push({ g, a: k * 2.094, slots: [null, null], slotWorld: si => g.localToWorld(new THREE.Vector3(-1.2, 2.1, si ? -1.6 : 1.6)) });
  }
  W.tickers.push((dt, t) => { for (const tr of trucks) { tr.a += dt * 0.2; const x = HEAD.x + Math.cos(tr.a) * TR, z = HEAD.z + Math.sin(tr.a) * TR; tr.g.position.set(x, 0, z); tr.g.rotation.y = -tr.a - Math.PI / 2 + Math.PI; } });
  const sendToTruck = (i, name, ico) => {
    let best = null, bd = 1e9; for (const tr of trucks) { const si = tr.slots.indexOf(null); if (si < 0) continue; const dd = tr.g.position.distanceTo(new THREE.Vector3(P.x, 0, P.z)); if (dd < bd) { bd = dd; best = [tr, si]; } }
    if (!best) return; const [tr, si] = best; tr.slots[si] = i;
    W.stack.takeLast(() => tr.slotWorld(si), () => {
      const pm = sign(name, 3.0, 2.1, { fs: 0.5, border: '#31b5d6' }); pm.position.set(-1.2, 2.1, si ? -1.56 : 1.56); if (si) pm.rotation.y = Math.PI; tr.g.add(pm);
      const ic = icon(ico, 0.9); ic.position.set(0, 0.85, 0.02); pm.add(ic); ST.posters++; ui.sfx('ok'); beams[i].material.opacity = 0.55;
    });
  };

  /* six volunteers at the racks hand you a poster each; a passing truck takes it */
  const VOL = [[0x2f86c0, 0xf2c230], [0xe56bb0, 0x31b5d6], [0x4aa86a, 0xe0553c], [0x8e44ad, 0xf2c230], [0xe0553c, 0x31b5d6], [0x1aa39a, 0xe56bb0]];
  TOPICS.forEach(([ico, name], i) => {
    const a = i / 6 * Math.PI * 2 + 0.4, x = HEAD.x + Math.cos(a) * 12.5, z = HEAD.z + Math.sin(a) * 12.5;
    b.box(0x8a9498, 0.5, 2.4, 0.5, x, 0, z, 0, false); b.box(0xfffdf8, 3.4, 2.4, 0.25, x, 2.4, z, -a + Math.PI / 2);
    const s = sign(name, 3, 1.8, { fs: 0.44, border: '#31b5d6' }); s.position.set(x, 3.6, z); W.scene.add(s); bill(W, s);
    W.circ(x, z, 0.9);
    const bm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 6), glow(C.cyan, 0.15)); W.scene.add(bm); beams.push(bm);
    const from = new THREE.Vector3(HEAD.x, 6.6, HEAD.z), to = new THREE.Vector3(x, 4.2, z), mid = from.clone().add(to).multiplyScalar(0.5);
    bm.position.copy(mid); bm.scale.y = from.distanceTo(to); bm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
    const st = W.station({ d: 5, x, z, r: 2.8, grp: 'posters', id: 'rack-' + i, ico, title: `Poster: ${name}`, cls: 'cy', zone: 2, stat: `Poster ${i + 1} of 6`,
      html: `A volunteer hands you the <b>${name}</b> poster. A passing e-waste truck carries it through the neighbourhoods where informal workers live and work, so the message reaches the people who never see the schemes.` });
    giver(W, st, { kind: 'poster', opts: { label: name }, shirt: VOL[i][0], hat: VOL[i][1], pants: 0x2f4a6a, side: -1, dist: 3.2, itemScale: 0.7, hold: 4.6, skin: [0xf0c8a0, 0xd9a577, 0xb07a52][i % 3], onGive: () => setTimeout(() => sendToTruck(i, name, ico), 250) });
  });

  /* certification row */
  b.box(0xffffff, 5, 3.6, 5, 757, 0, -30); b.box(C.cyan, 5.4, 0.4, 5.4, 757, 3.6, -30, 0, false);
  const cs = sign('CERTIFICATION\nUpliftment of the informal sector', 8.4, 2, { fs: 0.55, border: '#31b5d6' }); cs.position.set(757, 6.4, -30); W.scene.add(cs); bill(W, cs);
  CERT.forEach(([ico, t, html], i) => {
    const z = -23 + i * 6.2 + (i > 1 ? 4 : 0), x = 753; b.cyl(0xffffff, 1.2, 1.4, 0.8, x, 0, z, 14); b.cyl(C.cyan, 1.2, 1.2, 0.12, x, 0.8, z, 14);
    const s = sign(t, 3.6, 0.8, { fs: 0.46, border: '#31b5d6' }); s.position.set(x, 2.8, z); W.scene.add(s); bill(W, s);
    W.station({ d: 5, x, z, r: 2.8, grp: 'cert', id: 'cert-' + i, ico, title: t, cls: 'cy', html });
  });

  /* the pencil */
  const pen = new THREE.Group(); pen.position.set(764, 0, 12); W.scene.add(pen);
  const cols = [0x41464a, C.orange, C.cyan, 0x41464a, C.orange, C.cyan, 0x41464a, C.orange, C.cyan];
  cols.forEach((c, i) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 1.5, 6), mat(c)); m.position.y = 0.75 + i * 1.5; m.castShadow = true; pen.add(m); });
  const wood = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.4, 6), mat(0xe2c08c)); wood.position.y = 13.5 + 1.2; pen.add(wood); const lead = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.9, 6), mat(0x222222)); lead.position.y = 13.5 + 2.4 + 0.2; pen.add(lead);
  const ps = sign('WELFARE OF THE\nINFORMAL SECTOR', 7, 2.0, { fs: 0.7, border: '#31b5d6' }); ps.position.set(764, 18.4, 12); W.scene.add(ps); bill(W, ps); W.circ(764, 12, 1.8);
  const fin = W.station({ d: 5, x: 764, z: 8.6, r: 3.4, grp: 'finale', id: 'pencil', ico: '', zone: 2,
    onArrive() {
      const open = W.stations.filter(s => s.d === 5 && (s.grp === 'posters' || s.grp === 'cert') && s.req && !s.done).length === 0;
      if (!open) { ui.toast('Finish the posters and the certification principles first.'); ui.sfx('bad'); return; }
      ST.loopBroken = true; if (W.vicious) W.vicious.setColor(C.cyan); ui.sfx('gate'); W.finish(fin);
      ui.card({ kick: 'Towards the solution', cls: 'cy', title: 'You broke the loop', html: '<p>The posters on e-waste trucks reach informal labourers where they work, and show pathways to employment. Awareness leads to inspiration to continue the craft, better health and a better understanding of the market.</p><p>Out in the dumpyard, the red loop has turned cyan.</p>', buttons: [{ t: 'See the summary', cls: 'cy', cb() { W.end(); } }] });
      return { modal: true };
    } });
  d.onComplete = () => { ui.toast('Everything done. Walk to the <b>pencil</b>.', 3600); };
  return d;
}
