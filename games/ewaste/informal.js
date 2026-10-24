/* District 4: THE INFORMAL SECTOR (source, trading, processing, destination, dumpyard, vicious cycle) */
import { THREE, C, mat, glow, sign, icon, rand } from './build.js';
import { makeDistrict, banner, label, bill, loopRing, tree, lamp, heap, bags, stall, container, fume, makePerson } from './props.js';

const PARTS = [
  { ico: '🟠', name: 'Copper wire', val: 10, ok: true, how: 'Cut and stripped by hand.' },
  { ico: '⬜', name: 'Aluminium frame', val: 6, ok: true, how: 'Pulled apart and hammered flat.' },
  { ico: '🟡', name: 'Gold-plated pins', val: 10, ok: true, how: 'Soaked in acid. Toxic fumes.', hurt: true },
  { ico: '⚪', name: 'Silver contacts', val: 14, ok: false, how: 'Lost. Needs a refinery.' },
  { ico: '🖥️', name: 'Indium in the screen', val: 18, ok: false, how: 'Lost. No technology to extract it.' },
  { ico: '🧩', name: 'Chips & capacitors', val: 12, ok: false, how: 'Heated in acid. Most metal lost.', hurt: true },
  { ico: '🔋', name: 'Lithium battery', val: 8, ok: false, how: 'Dumped as it is.' },
  { ico: '🧲', name: 'Magnets', val: 7, ok: false, how: 'Thrown away.' },
  { ico: '🔌', name: 'Plastic casing', val: 15, ok: false, how: 'Burned or dumped.', hurt: true },
];
const CYCLE = [
  'Mostly recycled again by the informal sector, because their livelihood depends on it.',
  'Due to lack of infrastructure, technologies and training...',
  '...only 20 to 30% of the metals are extracted from the e-waste.',
  'The rest of the material is thrown away and ends up in the dumpyard.',
  'Leftover hazardous metals and plastics affect human health and the environment.',
  'It is picked up again by ragpickers, kabadiwallas and others...',
  '...and sold to the formal and informal market again.',
];

function canvasPlane(w, h, draw) { const k = 80, cv = document.createElement('canvas'); cv.width = w * k; cv.height = h * k; const g = cv.getContext('2d'); draw(g, cv.width, cv.height); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, toneMapped: false })); }

export function build(W) {
  const d = makeDistrict(W, { i: 3, name: 'INFORMAL SECTOR', sub: 'About 90% of e-waste ends up here', x0: 340, x1: 520, zr: 36, zone: 1, face: 'scared', padColor: 0xf5c89c, roadColor: 0xe2c8a6, spawn: [346, 0],
    groups: [{ grp: 'zones', text: 'Walk the four stages of the flow' }, { grp: 'vs', text: 'Compare informal and formal practice' }, { grp: 'bench', text: 'Dismantle a phone at the workbench' }, { grp: 'cycle', text: 'Walk the vicious cycle' }, { grp: 'impact', text: 'See the impact' }] });
  const b = d.b, ST = W.ST, ui = W.ui, P = W.P;
  banner(W, d, 'Informal sector', 'Source · Trading · Processing · Destination', 352, 0, { w: 10, h: 6.5 });

  /* stage banners */
  const stage = (n, name, x, ico, html) => {
    banner(W, d, name, `Stage ${n} of 4`, x, 0, { w: 10, h: 6, border: '#e04b2c' });
    W.station({ d: 3, x: x + 3, z: 0, r: 3.6, grp: 'zones', id: 'stage-' + n, ico, title: `${n}. ${name}`, cls: '', html, ms: 11000 });
  };
  stage(1, 'SOURCE', 364, '📦', 'Producers, bulk consumers, imports and everyday consumers are the main sources. The journey of e-waste in the informal sector was mapped from source to destination with primary data. Some of it also arrives from outside the country.');
  stage(2, 'TRADING', 402, '🛻', 'Formal dealers, scrap dealers, kabadi shops and kabadiwallas trade it on. Scrap dealers are the largest source point: <b>38%</b> of the e-waste reaching the informal market.');
  stage(3, 'PROCESSING', 440, '🔧', 'Refurbishers and repairers, dismantlers, segregators and recyclers take things apart for metal, plastic and working parts. Units are small, often in backyards or homes.');
  stage(4, 'DESTINATION', 486, '🏪', 'What comes out is sold to formal dealers, consumers, scrap dealers, industries and formal WEEE units. What does not sell is dumped.');

  /* checkpoints for respawn */
  const CK = [346, 388, 432, 484];

  /* ---- stage 1 source: heaps, trucks, bags ---- */
  for (let i = 0; i < 4; i++) { bags(b, 350 + i * 6, -22 + (i % 2) * 6, 5); heap(b, 354 + i * 7, 24 + (i % 2) * 4, 2.4, 1.4, 20); }
  for (let i = 0; i < 3; i++) { b.box(0xd9d4c9, 6.5, 3.2, 3, 366 + i * 9, 0.6, -26 + (i % 2) * 2, 0.2); b.box(0xc9792a, 2, 2.6, 2.8, 362.7 + i * 9, 0.6, -26.1 + (i % 2) * 2, 0.2); for (const x of [-2, 2]) for (const z of [-1.5, 1.5]) b.cyl(0x22201e, 0.55, 0.55, 0.5, 366 + i * 9 + x, 0.55, -26 + (i % 2) * 2 + z, 8, 0, Math.PI / 2); }
  W.box(363, 391, -29.5, -22);
  label(W, 'Waste from outside the country', 362, 3.5, -20, 6, 1, { fs: 0.4, border: '#93a4ab', fixed: false });
  /* ---- stage 2 trading ---- */
  for (let i = 0; i < 5; i++) { stall(b, 392 + i * 7, -16, 4, [0xc9792a, 0x3a8a9a, 0xb5483a, 0x6a8a54, 0xd4a82a][i], 0); stall(b, 395 + i * 7, 17, 4, [0x3a8a9a, 0xc9792a, 0x6a8a54, 0xb5483a, 0xd4a82a][i], 0); heap(b, 392 + i * 7, -19.5, 1.3, 0.9, 8); }
  W.box(389, 427, -17, -14.5); W.box(392, 430, 15.8, 18.3);
  const p38 = sign('38%\nof it comes through scrap dealers', 7, 3, { fs: 0.9, border: '#e04b2c' }); p38.position.set(410, 5.8, 24); W.scene.add(p38); bill(W, p38);
  label(W, 'KABADI SHOP', 404, 3.6, -16, 4, 0.8, { fs: 0.42 });
  for (let i = 0; i < 3; i++) { const c = new THREE.Group(); c.position.set(398 + i * 12, 0, 8); W.scene.add(c); const bx = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 1.4), mat(0x8a6d4b)); bx.position.y = 0.9; c.add(bx); for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 12), mat(0x2a2623)); w.rotation.x = Math.PI / 2; w.position.set(0, 0.45, s * 0.75); c.add(w); } for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), mat([0x3a3d40, 0x93a4ab][k % 2])); m.position.set((k - 1.5) * 0.5, 1.3 + (k % 2) * 0.1, 0); c.add(m); } W.circ(398 + i * 12, 8, 1.4); }

  /* ---- stage 3 processing ---- */
  const workers = [];
  const work = (x, z, ry = 0, shirt = 0x8a7a5a) => { const p = makePerson({ shirt, pants: 0x4a4a4a, hat: null, scale: 1 }); p.g.position.set(x, 0.06, z); p.g.rotation.y = ry; W.scene.add(p.g); workers.push([p, rand() * 6]); return p; };
  // cable dismantling (z -14)
  label(W, 'DISMANTLING OF CABLES', 446, 4, -17, 6.4, 0.9, { fs: 0.4 });
  for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.35, 8, 16), mat([0xc9792a, 0x2a2623, 0xb87333, 0x93a4ab][i])); c.rotation.x = Math.PI / 2; c.position.set(441 + i * 2.2, 0.45, -13); c.castShadow = true; W.scene.add(c); }
  b.box(0x8a6d4b, 5, 0.9, 1.6, 446, 0, -10.8); work(444, -9.2, Math.PI); work(448, -9.2, Math.PI, 0x6a8a7a); W.box(443, 449, -11.6, -10);
  // PCB acid leaching (z 14)
  label(W, 'OPEN ACID LEACHING OF CIRCUIT BOARDS', 448, 4.4, 18, 8, 0.9, { fs: 0.38, border: '#9bd02e' });
  for (let i = 0; i < 4; i++) { b.cyl(0x4b6a2a, 1.0, 1.0, 0.9, 442 + i * 2.8, 0, 13, 14); b.cyl(0xb8e04a, 0.85, 0.85, 0.08, 442 + i * 2.8, 0.88, 13, 14); b.cyl(0x2f6aa0, 0.55, 0.55, 1.3, 441 + i * 2.8, 0, 16.2, 10); W.circ(442 + i * 2.8, 13, 1.1); }
  work(444, 10.5, 0, 0x7a6a5a);
  fume(W, 445, 15, 3.4, 0x9bd02e); fume(W, 451, 14, 2.8, 0xc2d63a);
  // CRT breaking (z -14, further)
  label(W, 'BREAKING OF CRT TELEVISIONS', 464, 4, -17, 7, 0.9, { fs: 0.4 });
  for (let i = 0; i < 5; i++) b.box(0x5b6063, 1.4, 1.2, 1.3, 460 + (i % 3) * 1.8, (i > 2 ? 1.2 : 0), -13 - (i > 2 ? 0 : 0), rand() * 0.5);
  for (let i = 0; i < 14; i++) b.box(0xaad4e6, 0.35, 0.05, 0.3, 458 + rand() * 6, 0.02, -10.5 - rand() * 2, rand() * 3, false);
  work(463, -9.4, Math.PI, 0xa05a3a); W.box(459, 465, -14.5, -12);
  // CFL blowtorch (z 14)
  label(W, 'BLOWTORCH ON CFL BOARDS', 463, 4.2, 18, 6.6, 0.9, { fs: 0.4, border: '#e08a2c' });
  heap(b, 462, 14, 2, 0.9, 16); work(465.5, 11.5, 0, 0x8a4a3a);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.3, 8), glow(0xff8a2c, 0.85)); flame.position.set(464.2, 1, 12.4); W.scene.add(flame);
  fume(W, 464, 15, 3, 0x8a8f93);
  W.tickers.push((dt, t) => { flame.scale.set(1 + Math.sin(t * 22) * 0.2, 1 + Math.sin(t * 31) * 0.3, 1); flame.rotation.z = Math.sin(t * 17) * 0.15; for (const [p, o] of workers) p.walk(t * 3.5 + o, 0.7, t); });
  // refurbishing and AC shop
  label(W, 'REPAIR & REFURBISHING', 452, 3.8, 24, 6.6, 0.9, { fs: 0.4 });
  for (let i = 0; i < 4; i++) b.box(0xd9dcde, 1.6, 1.1, 0.8, 448 + i * 2.2, 0, 26, 0.1);
  // lane hazards (drifting fumes beside the path)
  fume(W, 428, 0, 2.2, 0x9bd02e); fume(W, 466.5, -9.5, 2.2, 0xa8b24a); fume(W, 484, 3, 2.2, 0x9bd02e);    // these sit ON the track: side-step round them

  /* the workbench */
  b.box(0x8a6d4b, 5.4, 1.1, 2.4, 454, 0, 0); b.box(0x6a4a2a, 5.6, 0.15, 2.6, 454, 1.1, 0, 0, false);
  for (let i = 0; i < 5; i++) b.box([0xc9792a, 0x93a4ab, 0x2c6b46][i % 3], 0.5, 0.15, 0.7, 452.5 + i * 0.7, 1.25, (i % 2 - 0.5) * 0.7, rand(), false);
  W.box(451, 457, -1.4, 1.4);
  const bs = sign('WORKBENCH', 4, 0.8, { fs: 0.45 }); bs.position.set(454, 3.2, 0); W.scene.add(bs); bill(W, bs);
  const bench = W.station({ d: 3, x: 454, z: -2.6, r: 3.2, kind: 'press', grp: 'bench', id: 'bench', key: 'Dismantle an old phone', ico: '', zone: 1,
    onArrive(s) {
      const state = PARTS.map(() => false); let got = 0, left = PARTS.length;
      const grid = PARTS.map((p, i) => `<button class="part" data-i="${i}"><span>${p.ico}</span>${p.name}<em>&nbsp;</em></button>`).join('');
      const box = ui.card({ kick: 'Informal workbench', title: 'Take apart a phone like Ping', html: `<p>Hand tools, acid and a blowtorch are all there is. Tap each part to work on it. No safety gear.</p><div class="parts">${grid}</div><div class="meter"><b>By hand</b><u><i id="mHand" style="width:0;background:var(--red)"></i></u><b id="vHand">0%</b></div><div class="meter"><b>Formal</b><u><i style="width:88%;background:var(--cyan)"></i></u><b>80 to 97%</b></div><p id="bMsg" style="font-size:.88em;min-height:2.4em"></p>`,
        buttons: [{ t: 'Finish', id: 'bFin', cls: 'red', cb() { if (left > 0) { ui.toast('Work on every part first.'); return false; } ST.recovered = got; W.finish(bench); ui.note('Ping', `Only ${got}% saved. The rest is in the dump. That is a lot of metal wasted.`, { ico: '📱', ms: 6500 }); ['copper', 'alum', 'gold'].forEach((k, n) => setTimeout(() => W.stack.add(k, new THREE.Vector3(452.6 + n * 1.3, 1.5, 0)), 250 * n)); } }] });
      box.querySelectorAll('.part').forEach(el => el.onclick = () => {
        const i = +el.dataset.i, p = PARTS[i]; if (state[i]) return; state[i] = true; left--; if (p.ok) got += p.val;
        el.classList.add('done', p.ok ? 'ok' : 'no'); el.querySelector('em').textContent = p.ok ? 'Recovered' : 'Lost';
        box.querySelector('#bMsg').textContent = `${p.name}: ${p.how}`; box.querySelector('#mHand').style.width = got + '%'; box.querySelector('#vHand').textContent = got + '%';
        if (p.hurt) { P.health = Math.max(15, P.health - 9); ui.sfx('cough'); } else ui.sfx(p.ok ? 'pick' : 'bad');
        if (!left) box.querySelector('#bMsg').innerHTML = `<b>${got}% recovered by hand</b> against 80 to 97% in the formal sector with Meity's indigenous technology. The rest goes to the dump.`;
      });
      return { modal: true };
    } });

  /* ---- VS boards between processing and destination ---- */
  [['💰', 'PAY & SAFETY', 'No safety precautions. Informal recyclers are paid <b>Rs. 200 to 300</b>.', 'Gloves, masks, shoes and caps are given. <b>Rs. 5,000 a month</b> for unskilled workers.', -21],
    ['🏭', 'INVESTMENT', 'Minimal capital: the price of e-scrap, bribes to move it across state borders, rent for a workspace.', 'About <b>Rs. 30 lakh</b> for a dismantler and <b>Rs. 25 crore</b> for a recycling plant.', -8],
    ['🧪', 'CIRCUIT BOARDS', 'Pins and chips are separated by heating, and soaked in acid. The fumes are toxic. Gold-plated pins and chips are boiled in big acid containers.', 'Boards are shredded, sent to approved smelters where they melt at <b>1200°C</b> in closed chambers, and metals are electro-refined.', 8],
    ['📺', 'TV TUBES (CRT)', 'Broken by hand. The lead glass is sold to bakeries and bangle makers; phosphors are toxic if inhaled.', 'Separated by heating in a closed chamber that sucks out phosphors, then shredded. Lead glass goes back to CRT makers.', 21]].forEach(([ico, t, inf, frm, z], i) => {
    b.box(0xfffdf8, 2.4, 1.1, 2.4, 475, 0, z); b.box(C.orange, 2.4, 0.18, 2.4, 475, 1.1, z, 0, false);
    const s = sign('INFORMAL vs FORMAL\n' + t, 5.4, 1.5, { fs: 0.42 }); s.position.set(475, 3.7, z); W.scene.add(s); bill(W, s);
    W.station({ d: 3, x: 475, z, r: 3.3, grp: 'vs', id: 'vs-' + i, ico, title: t, cls: '', html: `<div class="vs"><div class="i"><h5>Informal</h5>${inf}</div><div class="f"><h5>Formal</h5>${frm}</div></div>`, ms: 13000 });
  });

  /* ---- stage 4: sold again + dumpyard ---- */
  for (let i = 0; i < 2; i++) { b.box(0xdfe8ea, 6.5, 3.2, 3, 488 + i * 9, 0.6, -28, 0); b.box(0x31b5d6, 2, 2.6, 2.8, 484.7 + i * 9, 0.6, -28, 0); }
  W.box(484, 502, -30, -26);
  label(W, 'SOLD TO THE FORMAL MARKET AGAIN', 495, 4.4, -24, 8, 0.9, { fs: 0.38, border: '#31b5d6' });
  const dump = [[514, -26, 5, 3.6], [516, -16, 4.2, 3], [515, 15, 4.4, 3.2], [515, 27, 5, 3.8], [505, 31, 4, 2.6], [506, -33, 3.6, 2.4]];
  dump.forEach(([x, z, r, h]) => { heap(b, x, z, r, h, 70); W.circ(x, z, r * 0.8); });
  [[509, -9, 3.4], [510, 7, 3.2], [496, 25, 3], [497, -18, 3]].forEach(([x, z, r]) => { b.disc(0x9bd02e, r, x, 0.07, z, 24); fume(W, x, z, r, 0x9bd02e, 1.6); });
  label(W, 'DUMPING IN LOW-LYING OPEN LAND', 506, 5.4, -4, 8.4, 0.9, { fs: 0.38, border: '#8a8f93' });

  // soil cutaway: from a heap, through soil, to groundwater
  const cx = 503, cz = 20;
  b.box(0x6a9a4a, 9, 0.9, 7, cx, 3.7, cz); b.box(0x8a6a4a, 9, 2.0, 7, cx, 1.7, cz); b.box(0x4a7aa8, 9, 1.4, 7, cx, 0.3, cz, 0, false);
  const lay = (t, y, col) => { const s = sign(t, 3.6, 0.7, { fs: 0.36, border: col }); s.position.set(cx - 4.6, y, cz); s.rotation.y = -Math.PI / 2; W.scene.add(s); };
  lay('BIOTA', 4.3, '#6a9a4a'); lay('SOIL', 2.5, '#8a6a4a'); lay('GROUNDWATER', 0.9, '#4a7aa8');
  W.box(cx - 4.5, cx + 4.5, cz - 3.5, cz + 3.5);
  const drops = []; for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), glow(0xb8e04a, 0.95)); m.userData = { o: rand(), x: (rand() - 0.5) * 6, z: (rand() - 0.5) * 4.4 }; W.scene.add(m); drops.push(m); }
  W.tickers.push((dt, t) => { for (const m of drops) { const u = m.userData, p = (t * 0.28 + u.o) % 1; m.position.set(cx + u.x, 5 - p * 4.4, cz + u.z); m.material.opacity = 0.95 * (1 - p * 0.6); } });
  W.station({ d: 3, x: cx - 7, z: cz, r: 3.6, grp: 'impact', id: 'leach', ico: '💧', title: 'From the dump to the groundwater', cls: '', html: 'Dumped boards leach hazardous metals and plastics into the soil, then into groundwater, surface water and sediments. Recycling units have no wastewater treatment, so chemicals also drain into drains and fields. Nobody takes the residue to a treatment, storage and disposal facility.' });

  // human health poster
  const hp = canvasPlane(6.4, 7.4, (g, w, h) => {
    g.fillStyle = '#1f2326'; g.fillRect(0, 0, w, h); g.strokeStyle = '#f2c230'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#f2c230'; g.font = '800 38px Poppins, Arial, sans-serif'; g.textAlign = 'center'; g.fillText('E-WASTE HAZARDS AND YOU', w / 2, 60);
    g.fillStyle = '#6a7378'; const cxp = w / 2; g.beginPath(); g.arc(cxp, 150, 38, 0, 7); g.fill(); g.fillRect(cxp - 52, 192, 104, 190); g.fillRect(cxp - 92, 196, 36, 150); g.fillRect(cxp + 56, 196, 36, 150); g.fillRect(cxp - 46, 380, 40, 140); g.fillRect(cxp + 6, 380, 40, 140);
    g.fillStyle = '#f2c230'; [[cxp, 140], [cxp - 18, 230], [cxp + 18, 238], [cxp, 290], [cxp - 70, 330], [cxp + 70, 330], [cxp - 24, 420], [cxp + 24, 420], [cxp, 190]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); });
    g.fillStyle = '#e8e8e8'; g.font = '600 22px Poppins, Arial, sans-serif'; g.fillText('lungs · skin · brain · kidneys · blood', w / 2, h - 36);
  });
  hp.position.set(498, 4.3, -14); hp.rotation.y = -Math.PI / 2; W.scene.add(hp); b.cyl(0x3a3f45, 0.1, 0.1, 4.2, 498.2, 0, -16.5, 6); b.cyl(0x3a3f45, 0.1, 0.1, 4.2, 498.2, 0, -11.5, 6);
  W.station({ d: 3, x: 494, z: -14, r: 3.4, grp: 'impact', id: 'health', ico: '🫁', title: 'Major impacts on human health', cls: '', html: 'Fumes from heated circuit boards are toxic and phosphors from CRTs are dangerous if inhaled. Untrained workers handle acids and open flames with no protective equipment, and children are used as cheap labour. In a nutshell: health and the environment both pay.', ms: 12000 });

  /* ---- the vicious cycle ---- */
  const cyc = loopRing(W, d, { x: 499, z: 0, r: 6, nodes: CYCLE.map((_, i) => String(i + 1)), arrows: 12, rot: 0 });
  W.vicious = cyc; let nextI = 0;
  cyc.nodes.forEach((n, i) => {
    const s = n.s; s.material.dispose(); // replace the number label with a bigger one
    const nl = sign(String(i + 1), 1.1, 1.1, { fs: 0.8, radius: 0.55, border: '#e04b2c' }); nl.position.copy(s.position); s.visible = false; W.scene.add(nl); bill(W, nl);
    W.station({ d: 3, x: n.x, z: n.z, r: 2.1, grp: 'cycle', id: 'cyc-' + i, ico: '', title: `Loop step ${i + 1} of 7`, cls: '', html: CYCLE[i], ms: 7000, zone: 1,
      onEnter(st) { if (i !== nextI) { if (i < nextI) return false; ui.toast(`Follow the arrows: step ${nextI + 1} first.`, 1600); return false; } nextI++; return true; },
      onDone() { if (i === 6) { ui.card({ kick: 'The vicious cycle', title: 'Back to step 1', html: '<p>With no infrastructure, technology or training, workers recover 20 to 30% of the metals, dump the rest, and the dump gets picked over again. Their livelihood depends on it, so <b>the cycle just continues</b>.</p><p>Shutting units down will not break it: they reopen. Something has to change around them.</p>', buttons: [{ t: 'Keep going', cls: 'red' }] }); } } });
  });
  label(W, 'THE VICIOUS CYCLE CONTINUES', 499, 4.4, 0, 7.6, 0.9, { fs: 0.4, border: '#e04b2c' });

  /* ---- hazards + health ---- */
  let cough = 0, haze = 0;
  W.tickers.push((dt, t) => {
    const here = W.cur === 3 && ST.phase === 'play'; haze += ((here ? 1 : 0) - haze) * Math.min(1, dt * 1.5); P.hazy = haze;
    if (!here) { P.health = Math.min(100, P.health + 20 * dt); P.slow = 1; ui.hurt(false); return; }
    let hit = false; for (const h of W.hazards || []) if (Math.hypot(P.x - h.x, P.z - h.z) < h.r) { hit = true; break; }
    if (hit) { P.health -= 17 * dt; ST.hits += dt; cough -= dt; if (cough <= 0) { ui.sfx('cough'); cough = 0.9; } W.shake = Math.max(W.shake, 0.05); P.slow = 0.55; W.ping && (W.ping.g.rotation.x = 0.2); }
    else { P.health = Math.min(100, P.health + 9 * dt); P.slow = 1; }
    ui.hurt(hit);
    if (P.health <= 0) {
      let ck = CK[0]; for (const c of CK) if (P.x >= c) ck = c; W.setS(W.rail.toX(3, ck + 1)); P.health = 70; ui.hurt(false);
      ui.note('You coughed your way out', 'Informal workers breathe this every working day, with no protection. Walk round the green clouds.', { ico: '😷', ms: 6000 });
    }
  });
  d.onComplete = () => { ui.toast('<b>Understanding red is done.</b> Now, who connects this world to the rest?', 4200); };
  return d;
}
