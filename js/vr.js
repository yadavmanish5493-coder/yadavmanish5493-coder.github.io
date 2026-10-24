/* ===================== section 2: projects revolving around the VR character ===================== */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

  // Projects (big cards, ring around the head) and skills (chips, ring around the shoulders).
  // Edit these later: `body` shows in the panel; add `url` to link out.
  const PROJECTS = [
    { id: 'board-game',    title: 'Board Game Design',      icon: 'dice',    c: ['#5a1fd0', '#2b0f7a'],
      screen: 'UNBOX', world: 'unbox', game: 'games/unbox/index.html?embed',
      book: 'games/unbox/design-doc.pdf' },           // playable how-to-play; add `doc` when the design document has a link
    { id: 'digital-game',  title: 'Digital Game Design',    icon: 'pad',     c: ['#e0347a', '#7a1aa8'],
      screen: 'SPACEX', world: 'spacex', game: 'games/spacex/index.html?embed',          // playable prototype + its own world below
      site: 'https://manishy.wixsite.com/my-site-4/copy-of-loneliness-2' },    // design document shown as a scrolling overlay (`site`); `book` = PDF book; `doc` = new tab
    { id: 'unicef',        title: 'UNICEF',                 icon: 'globe',   c: ['#2a9ae0', '#3a1aa0'],
      screen: 'PROJECT PLAY', world: 'unicef', game: 'games/unicef/index.html?embed',      // playable case study + its own world
      site: 'https://manishy.wixsite.com/my-site-4/project-1' },
    { id: 'table-top',    title: 'Table Top',              icon: 'table',   c: ['#d8741f', '#6a2a10'],
      screen: 'TABLE TOP', world: 'tabletop', game: 'games/tabletop/index.html?embed',      // playable 3D tabletop version + its own world
      site: 'https://manishy.wixsite.com/my-site-4/copy-of-project-2' },
    { id: 'e-waste',      title: 'E-Waste',                icon: 'chip',    c: ['#2fae8a', '#14543f'],
      screen: 'E-WASTE', world: 'ewaste', game: 'games/ewaste/index.html?embed',          // explorable 3D world built from the giga map
      site: 'https://manishy.wixsite.com/my-site-4/copy-of-unicef' },
    { id: 'ar-projects',  title: 'AR Projects',            icon: 'ar',      c: ['#18b8e8', '#0d3b8a'],
      screen: 'AR PROJECTS', world: 'ar', game: 'games/ar/index.html?embed',                  // five Unity AR clips played inside a phone
      site: 'https://manishy.wixsite.com/my-site-4/copy-of-loneliness' },
    { id: 'ludo',         title: 'Ludo 2.0',               icon: 'wheel',   c: ['#16b8a6', '#0b5a66'],
      screen: 'LUDO 2.0', world: 'ludo', game: 'games/ludo/index.html?embed',                    // the redesigned underwater Ludo, 2 to 4 players
      site: 'https://manishy.wixsite.com/my-site-4/copy-of-loneliness-1' },
    { id: 'character',    title: 'Character Design',       icon: 'person',  c: ['#f08a2c', '#7a2a5a'],
      screen: 'NAVARASA', world: 'navarasa', game: 'games/navarasa/index.html?embed',          // Navarasa Saint: tap him through the nine rasas
      site: 'https://manishy.wixsite.com/my-site-4/project-2' },
    // design documents only: no game, no world on the handheld. Tapping the cassette opens the page in a scrolling overlay (`site`).
    { id: 'coin-collector', title: 'Coin Collector',        icon: 'pad',     c: ['#f0b323', '#7a4a0a'],
      site: 'https://manishy.wixsite.com/my-site-4/copy-of-ar-projects-1' },
    { id: 'play-product',  title: 'Play Product Design',    icon: 'cube',    c: ['#e8467c', '#6a1a52'],
      site: 'https://manishy.wixsite.com/my-site-4/project-3' },
    { id: 'book-design',   title: 'Book Design',            icon: 'book',    c: ['#7a5cf0', '#2a1a8a'],
      site: 'https://manishy.wixsite.com/my-site-4/copy-of-digital-game-design-1' },    // wanted as a page-turning book: needs a PDF export (`book`), until then a scrolling page
    { id: 'pm-vs-pm',      title: 'PM vs PM',               icon: 'nodes',   c: ['#2fb7d8', '#1b3a8a'],
      site: 'https://youthful-slides-852084.framer.app/pmvspm' },                       // book print layout + the UNBOX landing page
  ];
  const SKILLS = ['Prototyping', 'Research Methodology', 'Design Management', 'Aesthetics', 'User Research', 'Play Elements',
                  'Concepts', 'Gameplay', 'Story Boarding', 'Interactive AR', 'System Thinking', 'Levels'];
  // cassette faces: the title, thumbnail and keywords of each project card on the Wix home page (manishy.wixsite.com/my-site-4)
  // thumbnails are 480 px WebP copies of the cards' default images (assets/thumbs/<id>.webp); fit 'contain' = a logo / cut-out on white
  const FACES = {
    'board-game': { name: 'Unbox (Physical + Digital game)',
      tags: 'Problem solving | Business Thinking | Collabrative game | Insight Generator Tool | Business Innovation' },
    'digital-game': { name: 'Game Design (SpaceX)',
      tags: 'Game Design Document | Game Idea | Game Mechanics | Gameplay | Game Art' },
    'unicef': { name: 'Project Play (UNICEF collab.)', fit: 'contain',
      tags: 'User-centric research | Sustainable design | Toy design' },
    'table-top': { name: 'Table Top',
      tags: 'Board game design | Gameplay design | Design Thinking and Prototyping' },
    'e-waste': { name: 'E-Waste (System Design)',
      tags: 'System Design | User -Centric | Live Project | Visualization | Gigamapping' },
    'ar-projects': { name: 'AR Experiences (Made in Unity)',
      tags: 'UX AR Experience | UI | Problem Solving | AR Design' },
    'ludo': { name: 'Re-designing Ludo (Chowka-Bara)',
      tags: 'Board Game Design | Gameplay design | Mechanics | Storyboarding | Layout' },
    'character': { name: 'Character Design (Real Inspiration)',
      tags: 'User Centric Research | Character design | Clay Modeling' },
    'coin-collector': { name: 'Digital Game (Coin collector)',
      tags: 'Digital Game | Unity3D | Mechanics | Gameplay | Level Design | Animations' },
    'play-product': { name: 'Loneliness (Play Product Design)', fit: 'contain',
      tags: 'UX design | Problem-solving | Product design | User Research | Toy Design | Research Tools' },
    'book-design': { name: 'BookDesign (Craft documentation)',
      tags: 'Craft Document | Layouting | In Design | Documenting Stories | Book Design' },
    'pm-vs-pm': { name: 'Comic Book Print Design & UX/UI Landing Page',
      tags: 'Book Design | UX/UI | Cover Design | Visualization | Visual Design' },
  };
  PROJECTS.forEach(p => { const f = FACES[p.id]; if (f) Object.assign(p, f, { thumb: `assets/thumbs/${p.id}.webp` }); });
  window.PROJECTS = PROJECTS;

  const ICONS = {
    cube:    '<path d="M12 2 3 7v10l9 5 9-5V7z"/><path d="M3 7l9 5 9-5M12 12v10"/>',
    dice:    '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.4" fill="#fff"/><circle cx="16" cy="16" r="1.4" fill="#fff"/><circle cx="12" cy="12" r="1.4" fill="#fff"/><circle cx="16" cy="8" r="1.4" fill="#fff"/><circle cx="8" cy="16" r="1.4" fill="#fff"/>',
    person:  '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    book:    '<path d="M3 5c3-1.5 6-1.5 9 0v15c-3-1.5-6-1.5-9 0zM21 5c-3-1.5-6-1.5-9 0v15c3-1.5 6-1.5 9 0z"/>',
    goggles: '<rect x="2" y="7" width="20" height="10" rx="4"/><path d="M9 17l1.5-3h3L15 17"/><circle cx="7.5" cy="12" r="1.6"/><circle cx="16.5" cy="12" r="1.6"/>',
    pad:     '<path d="M6 8h12a4 4 0 0 1 4 4l.5 4a2.5 2.5 0 0 1-4.4 1.8L16 15H8l-2.1 2.8A2.5 2.5 0 0 1 1.5 16L2 12a4 4 0 0 1 4-4z"/><path d="M7 10.5v3M5.5 12h3"/><circle cx="16" cy="11" r="1" fill="#fff"/><circle cx="18" cy="13" r="1" fill="#fff"/>',
    nodes:   '<circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="5" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M7.3 11 16.7 6M7.3 13l9.4 5"/>',
    cursor:  '<path d="M5 3l14 7-6 2-2 6z"/><path d="M13 12l5 5"/>',
    globe:   '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
    table:   '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/><path d="M10.6 10.6l2.8 2.8M13.4 10.6l-2.8 2.8"/>',
    chip:    '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9.5 3v4M14.5 3v4M9.5 17v4M14.5 17v4M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4"/><path d="M10 12h4"/>',
    ar:      '<path d="M12 7.5l4 2.2v4.6l-4 2.2-4-2.2V9.7z"/><path d="M12 12v4.5M8 9.7l4 2.3 4-2.3"/><path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/>',
    wheel:   '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.2"/><path d="M12 3v4.8M12 16.2V21M3 12h4.8M16.2 12H21"/>',
    eye:     '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  };
  // cartridge shell colours (shell light, shell dark, glow) — cycled across the cards
  const SHELLS = [['#3fa7b8', '#1d5a73', 'rgba(80,220,255,.45)'], ['#c046b8', '#6a1a7a', 'rgba(255,80,220,.45)'],
                  ['#7a5cf0', '#35208f', 'rgba(140,110,255,.45)'], ['#4a7cf0', '#1f3a9a', 'rgba(90,150,255,.45)'],
                  ['#ff5c9a', '#8a1f5a', 'rgba(255,90,160,.45)'], ['#3ad0b0', '#16705f', 'rgba(60,255,200,.4)'],
                  ['#ff8a4a', '#8a3a1a', 'rgba(255,150,80,.4)']];
  const shell = (el, i) => { const [a, b, gl] = SHELLS[i % SHELLS.length]; el.style.setProperty('--s1', a); el.style.setProperty('--s2', b); el.style.setProperty('--glow', gl); };
  const iconSvg = k => `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg>`;

  /* ---------- build the two rings ---------- */
  const ringA = $('ringA'), ringB = $('ringB');
  const RING_A = { cx: 640, cy: 280, rx: 680, ry: 125, minS: 0.55, maxS: 1.24, tilt: 7 };   // front at the forehead (and out over the top band), back dips behind the head
  const RING_B = { cx: 640, cy: 600, rx: 530, ry: 50, minS: 0.58, maxS: 1.14, tilt: 6 };   // front at chest level, back behind the shoulders
  const cards = [];
  PROJECTS.forEach((pr, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pcard'; b.dataset.id = pr.id;
    b.style.setProperty('--c1', pr.c[0]); b.style.setProperty('--c2', pr.c[1]);
    shell(b, i);
    const face = pr.thumb   // thumbnail + site title on the label, the keywords scrolling in a strip under it (two copies loop seamlessly)
      ? `<span class="label thumb${pr.fit === 'contain' ? ' contain' : ''}"><img src="${pr.thumb}" alt="" loading="lazy" decoding="async" draggable="false"><span class="lt">${pr.name}</span></span>` +
        `<span class="tags" aria-hidden="true"><span class="tt" style="--td:${(pr.tags.length * .22).toFixed(1)}s"><span>${pr.tags}</span><span>${pr.tags}</span></span></span>`
      : `<span class="label">${iconSvg(pr.icon)}<span>${pr.title}</span></span>`;
    b.innerHTML = `<span class="cart"><span class="grip l"></span><span class="grip r"></span>${face}<span class="contacts"></span></span>`;
    b.setAttribute('aria-label', `Open project: ${pr.name || pr.title}${pr.tags ? '. ' + pr.tags.replace(/ *\| */g, ', ') : ''}`);
    ringA.appendChild(b);
    cards.push({ el: b, ring: RING_A, base: (i / PROJECTS.length) * Math.PI * 2, dir: 1, item: pr, kind: 'PROJECT', idx: i });
  });
  const chipColors = [['#3a2bd0', '#1f1070'], ['#6a1fb0', '#2a1070'], ['#1f6fb0', '#22106a'], ['#b02b9a', '#3a1080']];
  SKILLS.forEach((name, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pcard chip';
    const c = chipColors[i % chipColors.length];
    b.style.setProperty('--c1', c[0]); b.style.setProperty('--c2', c[1]);
    shell(b, i + 3);
    b.innerHTML = `<span class="cart"><span class="label"><span>${name}</span></span></span>`;
    b.setAttribute('aria-label', `Open skill: ${name}`);
    ringB.appendChild(b);
    cards.push({ el: b, ring: RING_B, base: (i / SKILLS.length) * Math.PI * 2 + 0.2, dir: -1.3, item: { id: name, title: name }, kind: 'SKILL' });
  });

  /* ---------- sparkles ---------- */
  const sparkHost = $('v2Sparkles');
  const SPARKS = [[250, 300, '#ff4be0'], [215, 380, '#7a5cff'], [1060, 270, '#ff4be0'], [1100, 420, '#3de0ff'], [520, 170, '#b06bff'],
                  [760, 160, '#7a5cff'], [300, 520, '#3de0ff'], [990, 560, '#ff7bea'], [880, 600, '#9ff3ff'], [160, 250, '#3de0ff']];
  SPARKS.forEach(([x, y, c], i) => {
    const d = document.createElement('div'); d.className = 'spark';
    d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.animationDelay = (i * 0.37) + 's';
    d.innerHTML = `<svg viewBox="-13 -13 26 26" width="26" height="26"><path d="M0-12 C1 -3 3 -1 12 0 C3 1 1 3 0 12 C-1 3 -3 1 -12 0 C-3 -1 -1 -3 0 -12Z" fill="${c}"/></svg>`;
    sparkHost.appendChild(d);
  });

  /* ---------- details panel ---------- */
  const panel = $('cardPanel'), cpTitle = $('cpTitle'), cpKicker = $('cpKicker'), cpBody = $('cpBody');
  let lastFocus = null;
  function openCard(c, spin = true) {
    lastFocus = spin ? c.el : document.getElementById('hhScreen');
    cpKicker.textContent = c.kind;
    cpTitle.textContent = c.item.title;
    cpBody.textContent = c.item.body || (c.kind === 'PROJECT' ? 'Project details coming soon.' : 'More about this coming soon.');
    panel.hidden = false;
    panel.querySelector('.cp-close').focus();
    if (spin) spinTo(c);                                   // bring the tapped card round to the front
  }
  function closePanel() { panel.hidden = true; if (lastFocus) lastFocus.focus({ preventScroll: true }); }
  // project cassettes drop into the handheld below (handheld script); skill chips open the details panel
  const docOnly = c => c.kind === 'PROJECT' && !c.item.world && c.item.site && window.__book;   // a cassette with only a design document
  cards.forEach(c => c.el.addEventListener('click', () => {
    if (docOnly(c)) window.__book.openDoc(c.item.site, `${c.item.title} · design document`, () => c.el.focus({ preventScroll: true }));
    else if (c.kind === 'PROJECT' && window.__drop) window.__drop(c);
    else openCard(c);
  }));
  $('stage').appendChild(panel);                           // screen space: opens over the handheld too
  panel.addEventListener('click', e => { if (e.target === panel || e.target.closest('.cp-close')) closePanel(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) closePanel(); });

  /* ======== the ninja continues below the room: card → wall ledge → board 1 → board 2 → cassettes ========
     Driven by scroll once the first scene starts moving away (Y0). Positions are page coordinates read
     live from the elements, so every jump lands where the target really is. Same rules as the room run:
     jumps can't stop mid-air, idle when the scroll stops, turns round when scrolling back. */
  let frontProject = null;
  const dLayer = document.createElement('div'); dLayer.id = 'descent';   // screen space, above the sliding column
  const dNinja = document.createElement('div'); dNinja.className = 'hop'; dNinja.id = 'njDescent'; dLayer.appendChild(dNinja);
  $('stage').appendChild(dLayer);
  const cNinja = document.createElement('div'); cNinja.className = 'hop'; cNinja.id = 'njCass';   // rides on a cassette
  const band = $('eduBand');
  // [start, end (u: viewport-heights after the room), kind, from, to, options] — moves only during the page's holds
  const DROUTE = [
    [0.00, 0.70, 'idle', 'card',   'card',   { sheet: 'idleD' }],                    // view slides down to the boards
    [0.70, 0.90, 'jump', 'card',   'ledgeA', { apex: 60, flip: -1 }],
    [0.90, 1.25, 'move', 'ledgeA', 'ledgeB', { sheet: 'walkR', flip: -1, cycles: 1.4 }],
    [1.25, 1.45, 'jump', 'ledgeB', 'b1L',    { apex: 60, flip: -1 }],
    [1.45, 2.45, 'move', 'b1L',    'b1R',    { sheet: 'walkR', cycles: 5 }],
    [2.45, 2.65, 'jump', 'b1R',    'b2R',    { apex: 45 }],
    [2.65, 3.55, 'move', 'b2R',    'b2M',    { sheet: 'walkR', flip: -1, cycles: 3 }],
    [3.55, 4.30, 'idle', 'b2M',    'b2M',    { sheet: 'idleR', flip: -1 }],          // view slides to show the cassettes
    [4.30, 4.60, 'jump', 'b2M',    'cass',   { apex: 90 }],
  ];
  const D_END = 4.60, DJUMPS = DROUTE.filter(r => r[2] === 'jump').map(r => [r[0], r[1]]);
  const IDLE_OF = { walkR: 'idleR' };
  let snapNext = false;
  window.__snapDescent = () => { snapNext = true; };
  let pd = 0, pdTarget = 0, pdSpeed = 0, pdMoving = false, pdTravel = 1, pdScrollDir = 1, landI = 0, prevNow = performance.now();

  function pdAdvance(dt) {
    const g0 = pd, dur = 0.6 / Math.max(0.3, Math.min(1.2, innerHeight / 800));   // seconds in the air
    let goal = pdTarget;
    for (const [a, b] of DJUMPS) if (goal > a && goal < b) { goal = pdScrollDir > 0 ? b : a; break; }
    const d = Math.sign(goal - pd);
    if (d) {
      const J = DJUMPS.find(([a, b]) => d > 0 ? pd >= a && pd < b : pd > a && pd <= b);
      if (J) { pd += d * (J[1] - J[0]) / 0.6 * dt; pd = d > 0 ? Math.min(pd, J[1], goal) : Math.max(pd, J[0], goal); }
      else {
        let n = pd + (goal - pd) * (1 - Math.exp(-dt * 8)); if (Math.abs(goal - n) < 1e-4) n = goal;
        for (const [a, b] of DJUMPS) { if (d > 0 && pd < a && n > a) n = a; if (d < 0 && pd > b && n < b) n = b; }
        pd = n;
      }
    }
    pd = Math.round(pd * 1e7) / 1e7;
    if (Math.abs(pd - g0) > 1e-9) pdTravel = Math.sign(pd - g0);
    pdSpeed += (Math.abs(pd - g0) / Math.max(dt, 1e-3) - pdSpeed) * (1 - Math.exp(-dt * 10));
    pdMoving = pdSpeed > (pdMoving ? 0.004 : 0.008);
  }
  const docPt = el => { const r = el.getBoundingClientRect(); return [r.left, r.top]; };   // screen coords (the layer is screen space)
  function spot(name) {
    const S1 = window.__s1, boards = band.querySelectorAll('.board:not(.board-resume)');   // the ninja walks on the education and AI boards only
    if (name === 'card') return docPt(S1.feet);
    if (name === 'ledgeA') return docPt(S1.ledges[0]);
    if (name === 'ledgeB') return docPt(S1.ledges[1]);
    const box = el => { const r = el.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top + 2, w: r.width }; };
    if (name === 'b1L') { const b = box(boards[0]); return [b.l + b.w * 0.12, b.t]; }
    if (name === 'b1R') { const b = box(boards[0]); return [b.r - b.w * 0.06, b.t]; }
    if (name === 'b2R') { const b = box(boards[1]); return [b.r - b.w * 0.06, b.t]; }
    if (name === 'b2M') { const b = box(boards[1]); return [b.l + b.w * 0.6, b.t]; }
    if (name === 'cass') { const r = cards[landI].el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height * 0.07]; }
  }

  function descent(now) {
    const dt = Math.min(0.05, (now - prevNow) / 1000); prevNow = now;
    const S1 = window.__s1;
    if (S1) {
      const nt = S1.done ? clamp(window.__page.u, 0, D_END + 6) : 0;
      if (nt !== pdTarget) pdScrollDir = Math.sign(nt - pdTarget);
      pdTarget = nt;
      if (snapNext) {                                           // quick nav: the page was jumped under a fade, so put the ninja straight where the scroll says
        snapNext = false;
        if (pd <= 4.30 && pdTarget > 4.30 && frontProject) landI = frontProject.idx;
        pd = pdTarget; pdTravel = 1;
      }
      const before = pd;
      pdAdvance(dt);
      // choose which cassette to land on just as the last jump starts (the one facing the viewer)
      if (before <= 4.30 && pd > 4.30 && frontProject) landI = frontProject.idx;
      const active = pd > 0.0005;
      S1.hide(active);
      S1.release(pd > 0.70);   // took off from the card: its weight is gone
      const onCass = pd >= D_END - 1e-6;
      if (!active || onCass) dNinja.style.display = 'none';
      else {
        dNinja.style.display = 'block';
        let i = DROUTE.findIndex(r => pd < r[1]); if (i < 0) i = DROUTE.length - 1;
        if (i > 0 && DROUTE[i][2] === 'jump' && pd <= DROUTE[i][0]) i--;
        const [a, b, kind, from, to, o] = DROUTE[i], v = clamp((pd - a) / (b - a));
        const A = spot(from), B = spot(to), H = S1.ninjaPx(), t = now / 1000;
        let x, y, sheet, frame, flip = (o.flip || 1) * (kind === 'idle' && o.sheet === 'idleD' ? 1 : pdTravel), rot = 0;
        if (kind === 'jump') {
          if (to === 'cass' || from === 'cass') flip = Math.sign(B[0] - A[0]) * pdTravel || 1;
          x = A[0] + (B[0] - A[0]) * v; y = A[1] + (B[1] - A[1]) * v - o.apex * 4 * v * (1 - v);
          sheet = 'runR'; frame = v < 0.1 ? 12 : v < 0.5 ? 4 : v < 0.9 ? 20 : 28;
          rot = flip * 7 * Math.sin(Math.PI * v) * (v < 0.5 ? -1 : 0.6);
        } else {
          x = A[0] + (B[0] - A[0]) * (kind === 'move' ? v : 0); y = A[1] + (B[1] - A[1]) * (kind === 'move' ? v : 0);
          const walking = kind === 'move' && pdMoving;
          sheet = kind === 'move' ? (walking ? o.sheet : IDLE_OF[o.sheet]) : o.sheet;
          const sp = S1.kit.SHEETS[sheet];
          frame = walking ? Math.floor((pdTravel < 0 ? 1 - v : v) * o.cycles * sp.n) % sp.n : Math.floor(t * 12) % sp.n;
        }
        S1.kit.sheetSprite(dNinja, sheet, frame, x, y, H, rot, flip);
      }
      cassMode(onCass);
    }
    requestAnimationFrame(descent);
  }
  requestAnimationFrame(descent);

  /* ---------- riding the cassettes ---------- */
  const NJ = { on: false, mode: 'card', i: 0, j: 0, v: 0, u: 0.5, uFrom: 0.5, hLocal: 150, lastS: null, face: 1, moving: false, spd: 0 };
  const ringStep = (Math.PI * 2) / PROJECTS.length;
  const wrapIdx = k => ((k % PROJECTS.length) + PROJECTS.length) % PROJECTS.length;
  function cassMode(on) {
    if (on && !NJ.on) {
      const c = cards[landI];
      Object.assign(NJ, { on: true, mode: 'card', i: landI, u: 0.5, lastS: null });
      NJ.hLocal = window.__s1.ninjaPx() / (S * ((c.pos && c.pos.sc) || 1));
      c.dipV = (c.dipV || 0) + 260;                   // landing: the cassette takes the weight
      c.el.appendChild(cNinja);
    } else if (!on && NJ.on) {
      NJ.on = false; cNinja.remove();
    }
  }
  // world point on top of cassette c at u (0 left … 1 right)
  const topOf = (c, u) => [c.pos.x + (u - 0.5) * 250 * c.pos.sc * Math.cos(c.pos.sx * 0.9), c.pos.y - 92 * c.pos.sc];
  function rideCassettes(dt, t) {
    cNinja.style.display = NJ.away ? 'none' : '';          // away: it rode a cassette down into the handheld
    if (!NJ.on || NJ.away || !cards[NJ.i].pos) return;
    const K = window.__s1.kit;
    const s = -(angle + offset + drift) / ringStep;           // which cassette faces the viewer (continuous)
    const ds = NJ.lastS === null ? 0 : s - NJ.lastS; NJ.lastS = s;
    NJ.spd += (Math.abs(ds) / Math.max(dt, 1e-3) - NJ.spd) * (1 - Math.exp(-dt * 10));
    NJ.moving = NJ.spd > (NJ.moving ? 0.05 : 0.1);
    if (Math.abs(ds) > 1e-5) NJ.face = Math.sign(ds);
    if (NJ.mode === 'card') {
      let diff = s - NJ.i; diff -= Math.round(diff / PROJECTS.length) * PROJECTS.length;
      NJ.u = 0.5 + Math.max(-0.62, Math.min(0.62, diff)) * 0.55;       // walks along the top as the cassette turns
      if (Math.abs(diff) > 0.62) {                                    // next cassette has come round: jump to it
        NJ.mode = 'hop'; NJ.j = wrapIdx(NJ.i + Math.sign(diff)); NJ.v = 0; NJ.uFrom = NJ.u;
        if (cNinja.parentNode !== frontLayer) frontLayer.appendChild(cNinja);
      } else {
        if (cNinja.parentNode !== cards[NJ.i].el) cards[NJ.i].el.appendChild(cNinja);
        const sheet = NJ.moving ? 'walkR' : 'idleR', sp = K.SHEETS[sheet];
        const frame = NJ.moving ? Math.floor(Math.abs(s) * 2.2 * sp.n) % sp.n : Math.floor(t * 12) % sp.n;
        K.sheetSprite(cNinja, sheet, frame, NJ.u * 250, 4, NJ.hLocal, 0, NJ.face);
        cNinja.style.zIndex = '5';
        return;
      }
    }
    // hop between cassettes (fixed speed, always lands)
    NJ.v += dt / 0.55;
    const A = topOf(cards[NJ.i], NJ.uFrom), uTo = NJ.j === wrapIdx(NJ.i + 1) ? 0.2 : 0.8, B = topOf(cards[NJ.j], uTo);
    const v = Math.min(1, NJ.v), flip = Math.sign(B[0] - A[0]) || 1;
    const x = A[0] + (B[0] - A[0]) * v, y = A[1] + (B[1] - A[1]) * v - 70 * 4 * v * (1 - v);
    const sc = cards[NJ.i].pos.sc + (cards[NJ.j].pos.sc - cards[NJ.i].pos.sc) * v;
    K.sheetSprite(cNinja, 'runR', v < 0.1 ? 12 : v < 0.5 ? 4 : v < 0.9 ? 20 : 28, x, y, NJ.hLocal * sc, flip * 7 * Math.sin(Math.PI * v) * (v < 0.5 ? -1 : 0.6), flip);
    cNinja.style.zIndex = '200';
    if (NJ.v >= 1) {
      NJ.i = NJ.j; NJ.mode = 'card';
      cards[NJ.i].dipV = (cards[NJ.i].dipV || 0) + 220;              // land: press the cassette down
      cards[NJ.i].el.appendChild(cNinja);
    }
  }

  /* ---------- deep space behind the character (canvas, parallax with the revolving cards) ---------- */
  const space = $('space');
  let sx = space.getContext('2d'), SW = 0, SH = 0, DPR = 1, nebula = null;
  const useSky = o => { sx = o.sx; SW = o.SW; SH = o.SH; nebula = o.nebula; };
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const STAR_TINTS = ['255,255,255', '214,200,255', '170,235,255', '255,200,240'];
  // three star layers: far → near (k = how much the layer moves with the scroll)
  const STARS = [
    { k: 0.10, n: 340, r: [0.4, 1.0], a: [0.30, 0.75] },
    { k: 0.35, n: 150, r: [0.8, 1.6], a: [0.55, 0.95] },
    { k: 0.75, n: 45,  r: [1.2, 2.3], a: [0.80, 1.00] },
    { k: 1.30, n: 22,  r: [1.6, 2.8], a: [0.95, 1.00], glow: true },   // near, bright, fast
  ].map(L => ({ ...L, stars: Array.from({ length: L.n }, () => ({
      x: rnd(), y: rnd(), r: L.r[0] + rnd() * (L.r[1] - L.r[0]), a: L.a[0] + rnd() * (L.a[1] - L.a[0]),
      tw: 0.6 + rnd() * 2.2, ph: rnd() * 6.28, c: STAR_TINTS[Math.floor(rnd() * STAR_TINTS.length)] })) }));
  // small, muted planets at different depths: [x, y (0..1 of the sky), radius px, colours, k, ring?]
  const PLANETS = [
    { x: 0.13, y: 0.22, r: 22, c: ['#8f7cff', '#2a1680'], k: 0.18, alpha: 0.55 },
    { x: 0.86, y: 0.16, r: 11, c: ['#ff9ad8', '#6a1a7a'], k: 0.12, alpha: 0.5 },
    { x: 0.90, y: 0.62, r: 34, c: ['#5fd6e8', '#173a7a'], k: 0.32, alpha: 0.42, ring: true },
    { x: 0.24, y: 0.70, r: 7,  c: ['#ffd2a0', '#7a3a2a'], k: 0.24, alpha: 0.5 },
    { x: 0.62, y: 0.08, r: 5,  c: ['#c9c3ff', '#3a2a8a'], k: 0.08, alpha: 0.45 },
  ];
  const planetSprites = PLANETS.map(P => {
    const pad = P.ring ? P.r * 1.2 : 6, size = Math.ceil((P.r + pad) * 2 * 2), c = document.createElement('canvas');
    c.width = c.height = size; const g = c.getContext('2d'); g.scale(2, 2); const m = size / 4;
    if (P.ring) { g.save(); g.translate(m, m); g.rotate(-0.35); g.scale(1, 0.32); g.beginPath(); g.arc(0, 0, P.r * 1.75, Math.PI, 2 * Math.PI);
                  g.strokeStyle = 'rgba(190,240,255,.45)'; g.lineWidth = 3.2; g.stroke(); g.restore(); }
    const body = g.createRadialGradient(m - P.r * 0.4, m - P.r * 0.45, P.r * 0.1, m, m, P.r);
    body.addColorStop(0, P.c[0]); body.addColorStop(1, P.c[1]);
    g.beginPath(); g.arc(m, m, P.r, 0, Math.PI * 2); g.fillStyle = body; g.fill();
    const shade = g.createLinearGradient(m - P.r, m - P.r, m + P.r, m + P.r);   // night side
    shade.addColorStop(0.45, 'rgba(6,2,26,0)'); shade.addColorStop(1, 'rgba(6,2,26,.75)');
    g.fillStyle = shade; g.fill();
    g.lineWidth = 1.2; g.strokeStyle = 'rgba(255,160,240,.35)'; g.beginPath(); g.arc(m, m, P.r - 0.5, Math.PI * 0.9, Math.PI * 1.6); g.stroke();
    if (P.ring) { g.save(); g.translate(m, m); g.rotate(-0.35); g.scale(1, 0.32); g.beginPath(); g.arc(0, 0, P.r * 1.75, 0, Math.PI);
                  g.strokeStyle = 'rgba(190,240,255,.55)'; g.lineWidth = 3.2; g.stroke(); g.restore(); }
    return { c, half: size / 4 };
  });
  function buildNebula() {   // big, soft, dim clouds + a faint galaxy band, painted once per resize
    nebula = document.createElement('canvas');
    nebula.width = Math.ceil(SW * 1.4); nebula.height = Math.ceil(SH * 1.4);
    const g = nebula.getContext('2d'), W = nebula.width, H = nebula.height;
    const blob = (x, y, r, col, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
    blob(W * 0.22, H * 0.30, W * 0.30, '110,50,220', 0.12);
    blob(W * 0.78, H * 0.38, W * 0.26, '200,50,190', 0.08);
    blob(W * 0.55, H * 0.75, W * 0.34, '40,80,210', 0.09);
    blob(W * 0.40, H * 0.15, W * 0.18, '255,90,210', 0.04);
    g.save(); g.translate(W * 0.5, H * 0.45); g.rotate(-0.38);                    // faint milky band
    const band = g.createLinearGradient(0, -H * 0.12, 0, H * 0.12);
    band.addColorStop(0, 'rgba(180,160,255,0)'); band.addColorStop(0.5, 'rgba(180,160,255,.07)'); band.addColorStop(1, 'rgba(180,160,255,0)');
    g.fillStyle = band; g.fillRect(-W, -H * 0.12, W * 2, H * 0.24);
    for (let i = 0; i < 900; i++) { const x = (rnd() - 0.5) * W * 2, y = (rnd() + rnd() + rnd() - 1.5) * H * 0.08;
      g.fillStyle = `rgba(220,210,255,${(0.05 + rnd() * 0.25).toFixed(2)})`; g.fillRect(x, y, 1.2 * DPR, 1.2 * DPR); }
    g.restore();
  }
  // two skies share the drawing code: the cassette room's and the room's open roof
  const skyVR = { cv: space, sx: space.getContext('2d') }, roomSkyEl = $('roomSky');
  const skyRoom = { cv: roomSkyEl, sx: roomSkyEl.getContext('2d') }, roomView = $('roomView');
  function sizeSky(o, host) {
    o.SW = Math.round(host.clientWidth * DPR); o.SH = Math.round(host.clientHeight * DPR);
    o.cv.width = o.SW; o.cv.height = o.SH; useSky(o); buildNebula(); o.nebula = nebula;
  }
  function sizeSpace() {
    DPR = Math.min(Math.min(innerWidth, innerHeight) < 600 ? 1.5 : 2, devicePixelRatio || 1);   // phones: a little less sharp, far fewer pixels to repaint (the sky is soft anyway)
    sizeSky(skyRoom, roomView); sizeSky(skyVR, stage);
  }
  let meteor = null, nextMeteor = 6;
  function drawSpace(t, turn, prog, top = 0, shine = false) {
    // turn: how far the ring has revolved (radians); prog: 0..1 through the section;
    // top: where the section sits on screen (px). While the view slides the building passes at full speed and the
    // sky only follows part of the way — far layers least — so the sky reads as deep behind the building.
    if (!SW || !SH) return;                                   // the sky was sized while its box had no size yet (page loaded in a hidden / zero-size window)
    const panX = turn * 110 * DPR + t * 8 * DPR, panY = prog * 420 * DPR, lag = top * DPR;
    const follow = k => Math.min(0.9, 0.2 + k * 0.5);      // share of the slide a layer at depth k follows
    const bg = sx.createLinearGradient(0, 0, 0, SH);
    bg.addColorStop(0, '#010006'); bg.addColorStop(0.55, '#040116'); bg.addColorStop(1, '#090228');
    sx.fillStyle = bg; sx.fillRect(0, 0, SW, SH);
    // nebula (slowest), slightly breathing
    const nb = 1 + Math.sin(t * 0.12) * 0.015, nx = -(panX * 0.05) % (SW * 0.4) - SW * 0.2,
          ny = Math.min(0, -panY * 0.05 - SH * 0.2 - lag * (1 - follow(0)));
    sx.save(); sx.globalAlpha = 0.9; sx.translate(SW / 2, SH / 2); sx.scale(nb, nb); sx.translate(-SW / 2, -SH / 2);
    sx.drawImage(nebula, nx, ny); sx.restore();
    // stars
    for (const L of STARS) {
      const ox = panX * L.k, oy = panY * L.k + lag * (1 - follow(L.k));
      for (const s of L.stars) {
        const x = ((s.x * SW - ox) % SW + SW) % SW, y = ((s.y * SH - oy) % SH + SH) % SH;
        const a = s.a * (0.7 + 0.3 * Math.sin(t * s.tw + s.ph));
        // shiny stars: halo + a four-point sparkle (shine: the roof turns most mid/near stars into sparklers)
        if (L.glow || (shine && (L.k >= 0.7 || s.r > 1.25))) {
          const R = s.r * DPR, tw = 0.5 + 0.5 * Math.sin(t * s.tw * 1.6 + s.ph), arm = R * (shine ? 3 + 4 * tw : 4.5);
          const h = sx.createRadialGradient(x, y, 0, x, y, R * 6);
          h.addColorStop(0, `rgba(${s.c},${(a * .6).toFixed(3)})`); h.addColorStop(1, `rgba(${s.c},0)`);
          sx.fillStyle = h; sx.fillRect(x - R * 6, y - R * 6, R * 12, R * 12);
          sx.strokeStyle = `rgba(255,255,255,${(a * (shine ? .55 + .4 * tw : .7)).toFixed(3)})`; sx.lineWidth = Math.max(1, R * .35);
          sx.beginPath(); sx.moveTo(x - arm, y); sx.lineTo(x + arm, y); sx.moveTo(x, y - arm); sx.lineTo(x, y + arm); sx.stroke();
        }
        sx.fillStyle = `rgba(${s.c},${a.toFixed(3)})`;
        sx.beginPath(); sx.arc(x, y, s.r * DPR, 0, 6.2832); sx.fill();
      }
    }
    // planets
    PLANETS.forEach((P, i) => {
      const sp = planetSprites[i], W2 = SW + 200 * DPR;
      const H2 = SH + 200 * DPR;                            // planets wrap like the stars, so fast scrolling never empties the sky
      const x = (((P.x * SW - panX * P.k) % W2) + W2) % W2 - 100 * DPR, y = (((P.y * SH - panY * P.k - lag * (1 - follow(P.k)) + 100 * DPR) % H2) + H2) % H2 - 100 * DPR;
      sx.globalAlpha = P.alpha; sx.drawImage(sp.c, x - sp.half * DPR, y - sp.half * DPR, sp.half * 2 * DPR, sp.half * 2 * DPR); sx.globalAlpha = 1;
    });
    // a rare, faint shooting star
    if (!meteor && t > nextMeteor) meteor = { t0: t, x: (0.15 + rnd() * 0.6) * SW, y: (0.05 + rnd() * 0.25) * SH };
    if (meteor) {
      const k = (t - meteor.t0) / 0.9;
      if (k >= 1) { meteor = null; nextMeteor = t + 7 + rnd() * 8; }
      else {
        const hx = meteor.x + k * 260 * DPR, hy = meteor.y + k * 110 * DPR, a = Math.sin(Math.PI * k) * 0.55;
        const tr = sx.createLinearGradient(hx, hy, hx - 90 * DPR, hy - 38 * DPR);
        tr.addColorStop(0, `rgba(230,220,255,${a.toFixed(3)})`); tr.addColorStop(1, 'rgba(230,220,255,0)');
        sx.strokeStyle = tr; sx.lineWidth = 1.4 * DPR; sx.beginPath(); sx.moveTo(hx, hy); sx.lineTo(hx - 90 * DPR, hy - 38 * DPR); sx.stroke();
      }
    }
  }

  /* ---------- scroll → revolve ---------- */
  const stage = $('vrStage'), world = $('vrWorld'), csTitle = $('csTitle'), facade = $('vrFacade'), frontLayer = $('vrFront');
  let vw = 0, vh = 0, S = 1, cx = 640, cy = 560;
  function fit() {
    vw = stage.clientWidth; vh = stage.clientHeight;
    // fit the scene (world y 120 = top of the orbit … 1000 = into the front wall) inside the window opening
    const TOP = 0.14, portrait = vw < vh;
    RING_A.rx = portrait ? 385 : 680; RING_B.rx = portrait ? 310 : 530;          // phones: tighter rings
    S = Math.min(portrait ? vw / 850 : vw * 0.84 / 1110, (vh * (1 - TOP) - 10) / 880);
    cx = 640;
    // leave headroom for the ninja riding the front cassettes (world y ≈ −120); tall screens: centre the window vertically
    const topPx = Math.max(vh * TOP, 240 * S - 10, (vh - 880 * S) / 2 - 10);
    facade.style.setProperty('--top', topPx.toFixed(1) + 'px');
    const ty = topPx + 10 - 120 * S;
    world.style.transform = frontLayer.style.transform = `translate(${(vw / 2 - cx * S).toFixed(2)}px,${ty.toFixed(2)}px) scale(${S.toFixed(5)})`;
    facade.style.setProperty('--fb', Math.max(0, vh - (ty + 900 * S)).toFixed(1) + 'px');   // window sill at the scene's floor line
  }
  addEventListener('resize', () => { fit(); sizeSpace(); });

  let angle = 0, target = 0, offset = 0, offsetTarget = 0, drift = 0, last = performance.now();
  const TURNS = 1.25;                                      // full revolutions across the section
  const vrProg = () => { const P = window.__page, a = P.PH.VR, v = clamp((P.u - a[0]) / (a[1] - a[0])); return v === v ? v : 0; };   // NaN while the page has no height: it would stick in the ring's angle
  function readScroll() { target = vrProg() * Math.PI * 2 * TURNS; }
  addEventListener('scroll', readScroll, { passive: true });

  // tapping a card spins the ring (on top of the scroll angle) so that card faces the viewer
  function spinTo(c) {
    const a = c.base + (angle + offset + drift) * c.dir;
    const wrap = x => Math.atan2(Math.sin(x), Math.cos(x));
    offsetTarget = offset - wrap(a) / c.dir;
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    readScroll();
    const r = stage.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight + 200) {        // only work while the cassette room is near the screen
      angle += (target - angle) * (1 - Math.exp(-dt * 6));
      offset += (offsetTarget - offset) * (1 - Math.exp(-dt * 5));
      const t = now / 1000;
      if (!NJ.on) drift += dt * 0.06;                    // slow idle drift (paused while the ninja rides the cassettes)
      let front = null, frontD = -2;
      for (const c of cards) {
        const R = c.ring, a = c.base + (angle + offset + drift) * c.dir;
        const d = Math.cos(a), sx = Math.sin(a);           // d: 1 = facing the viewer, −1 = behind the head
        // the ninja's weight: a spring pushes the cassette down while it stands on it
        const dipT = NJ.on && NJ.mode === 'card' && NJ.i === c.idx ? 10 : 0;
        c.dipV = (c.dipV || 0) + (-90 * ((c.dip || 0) - dipT) - 11 * (c.dipV || 0)) * dt; c.dip = (c.dip || 0) + c.dipV * dt;
        const x = R.cx + R.rx * sx, y = R.cy - R.ry * d + Math.sin(t * 1.4 + c.base * 3) * 3 * (NJ.on ? 0.3 : 1) + c.dip;   // back of the ring sits lower
        const sc = R.minS + (R.maxS - R.minS) * (d + 1) / 2;
        c.pos = { x, y, sc, sx, d };
        c.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-50%) perspective(700px) rotateY(${(-sx * 52).toFixed(1)}deg) rotateZ(${(sx * R.tilt).toFixed(2)}deg) scale(${sc.toFixed(3)})`;
        c.el.style.zIndex = String(50 + Math.round(d * 40));   // behind / in front of the character
        // the orbit passes through the building wall where d ≈ 0: in front of it the cassette leaves the building
        const out = d > (c.out ? -0.02 : 0.02);
        if (out !== c.out) {
          c.out = out; c.el.classList.toggle('out', out);
          (out ? frontLayer : c.ring === RING_A ? ringA : ringB).appendChild(c.el);
        }
        c.el.style.opacity = ((out ? clamp(d / 0.22) : 0.75 + 0.25 * (d + 1) / 2) * (c.ghost ? 0.3 : 1)).toFixed(2);   // ghost: it's in the handheld
        const ti = d > -0.2 ? 0 : -1;                      // only visible cards are in the tab order
        if (c.el.tabIndex !== ti) c.el.tabIndex = ti;
        if (c.kind === 'PROJECT' && d > frontD) { frontD = d; front = c; }
      }
      if (front && csTitle.textContent !== front.item.title) csTitle.textContent = front.item.title;
      frontProject = front;
      rideCassettes(dt, t);
      if (!skyVR.SW && stage.clientWidth) sizeSpace();         // it has a size now: size the skies
      useSky(skyVR); drawSpace(t, angle + offset, vrProg(), r.top);
    }
    requestAnimationFrame(frame);
  }
  fit(); sizeSpace(); readScroll(); angle = target;
  window.__vr = { cards, NJ, cNinja, openCard, get S() { return S; } };   // for the handheld drop
  (function roomSkyFrame(now) {
    const r = roomView.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) {
      const screens = scrollY / innerHeight;               // fast: tied to every screen scrolled, not the whole room scene
      if (!skyRoom.SW && roomView.clientWidth) sizeSpace();
      useSky(skyRoom); drawSpace(now / 1000, screens * 0.6, screens * 0.7, r.top, true);
    }
    requestAnimationFrame(roomSkyFrame);
  })(performance.now());

  /* ---------- education & experience ticker: drifts on its own, speeds up while scrolling ---------- */
  {
    const band = $('eduBand');
    // each board repeats its list until it's comfortably wider than the screen, then loops one copy's width
    const tracks = [...band.querySelectorAll('.board-track')].map(track => {
      const items = [...track.children];
      let copies = 1;
      while (copies < 4 || track.scrollWidth < innerWidth * 2.2) {
        items.forEach(li => { const c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
        copies++; if (copies > 12) break;
      }
      return { track, copies, dir: +(track.dataset.dir || 1), loop: 0 };
    });
    // one copy's width is measured once (and again after a resize or the fonts arriving), not every frame
    const remeasure = () => tracks.forEach(T => { T.loop = 0; });
    addEventListener('resize', remeasure);
    if (document.fonts) document.fonts.ready.then(remeasure);
    let x = 0, lastY = scrollY, boost = 0, prev = performance.now();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    function tick(now) {
      const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
      const r = band.getBoundingClientRect();
      if (!reduce && r.bottom > -50 && r.top < innerHeight + 50) {
        boost += (Math.abs(scrollY - lastY) * 4 - boost) * (1 - Math.exp(-dt * 6));
        x += (55 + boost) * dt;   // a calm drift so the lines can be read
        for (const T of tracks) {
          const loop = T.loop || (T.loop = T.track.scrollWidth / T.copies);   // one copy of the list
          const off = ((x % loop) + loop) % loop;
          T.track.style.transform = `translateX(${(T.dir > 0 ? -off : off - loop).toFixed(1)}px)`;
        }
      }
      lastY = scrollY;
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(frame);
})();
