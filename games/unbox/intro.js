/* Unbox: the interactive intro that plays before the board game (what it is, who it is for, the two boards,
   a hands-on practice, scoring, the challenge card). UNBOX_INTRO.open({ panel, label, onStart, onSkip }) fills the game's #panel. */
window.UNBOX_INTRO = (() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let timers = [];
const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
const stopTimers = () => { timers.forEach(clearTimeout); timers = []; };
const HAND = '<svg viewBox="0 0 64 84" aria-hidden="true"><use href="#hand-ico"/></svg>';

function confetti(host, x, y) {
  if (reduce) return;
  const cols = ['#ffd21f', '#e8374c', '#2d8cff', '#2fb870', '#ff7b2c', '#ff4f9a'];
  for (let i = 0; i < 22; i++) {
    const s = el('i', 'cf'); s.style.cssText = `left:${x}px;top:${y}px;background:${cols[i % 6]}`; host.append(s);
    const a = Math.random() * 6.283, d = 40 + Math.random() * 90;
    s.animate([{ transform: 'translate(-50%,-50%) rotate(0)', opacity: 1 }, { transform: `translate(${Math.cos(a) * d - 3}px,${Math.sin(a) * d - 30}px) rotate(${Math.random() * 540}deg)`, opacity: 0 }], { duration: 900 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => s.remove();
  }
}

/* ---------- slide 1: what is Unbox ---------- */
function vWelcome(txt, vis) {
  vis.className = 'in-vis w-vis';
  vis.innerHTML = '<div class="w-logo">Unbox</div><div class="w-tag">BUSINESS THINKING, AS A GAME</div><div class="w-hint">Tap to shuffle the deck</div>';
  const WORDS = ['CUSTOMER', 'PRODUCT', 'TACTIC', 'IDEA', 'RISK', 'TEST', 'SCORE', 'STRATEGY'], COLS = ['#7a3cff', '#e8374c', '#2d8cff', '#2fb870', '#ff7b2c', '#ff4f9a', '#14a3ad', '#c9a400'];
  const cards = WORDS.map((w, i) => { const c = el('div', 'w-c', `<span>${w}</span>`); c.style.setProperty('--c', COLS[i]); vis.append(c); return c; });
  const place = () => cards.forEach((c, i) => {
    const a = i / cards.length * 6.283 + Math.random() * .5, rx = 36 + Math.random() * 8, ry = 30 + Math.random() * 10;
    c.style.left = (50 + Math.cos(a) * rx).toFixed(1) + '%'; c.style.top = (52 + Math.sin(a) * ry).toFixed(1) + '%';
    c.style.transform = `translate(-50%,-50%) rotate(${(Math.random() * 50 - 25).toFixed(0)}deg)`; c.style.animationDelay = (-Math.random() * 3).toFixed(2) + 's';
  });
  place(); vis.addEventListener('click', () => { place(); const r = vis.getBoundingClientRect(); confetti(vis, r.width / 2, r.height * .4); });
}

/* ---------- slide 2: who is it for ---------- */
const ROLES = [
  ['\u{1F393}', 'Students & learners', 'See how a strategy is built and tested, hands-on, with no textbook.'],
  ['\u{1F680}', 'Founders & makers', 'Pressure-test an idea and find the assumptions that could sink it.'],
  ['\u{1F9D1}‍\u{1F3EB}', 'Workshop facilitators', 'Run a playful, structured session with a clear flow and scoring.'],
  ['\u{1F91D}', 'Teams & intrapreneurs', 'Agree on one strategy sentence and one experiment to try next.']];
function vWho(txt, vis) {
  vis.className = 'in-vis r-vis';
  vis.innerHTML = '<div class="r-grid"></div><div class="r-det"></div>';
  const grid = $('.r-grid', vis), det = $('.r-det', vis); let auto = true;
  const btns = ROLES.map(([ic, t], i) => { const b = el('button', 'r', `<span class="ic">${ic}</span><b>${t}</b>`); b.type = 'button'; grid.append(b); b.onclick = () => { auto = false; show(i); }; return b; });
  const show = i => { btns.forEach((b, k) => b.classList.toggle('on', k === i)); det.innerHTML = `<b>${ROLES[i][1]}</b> ${ROLES[i][2]}`; det.classList.remove('pop'); void det.offsetWidth; det.classList.add('pop'); };
  let i = 0; show(0); const loop = () => { later(() => { if (!auto) return; i = (i + 1) % ROLES.length; show(i); loop(); }, 2600); }; loop();
}

/* ---------- slide 3: the two boards ---------- */
const AR = { 1: [649, 457], 2: [676, 451] };
const BSTEPS = {
  1: [['Customer segment', 'Who are you solving for?', [20, 325, 135, 446]], ['Product', 'What do you offer them?', [20, 190, 135, 311]], ['Challenge', 'The problem to solve.', [20, 55, 135, 177]],
      ['Tactics', 'Fill every zone of the board.', [147, 21, 533, 262]], ['Top 3', 'Pick the three that make your secret sauce.', [550, 62, 630, 382]], ['Statement', 'Write your strategy as one sentence.', [162, 394, 524, 449]]],
  2: [['Assumptions', 'What could go wrong? Fill every zone.', [20, 79, 423, 414]], ['Most critical', 'Pick the riskiest assumption.', [437, 123, 534, 325]],
      ['Hypothesis', 'We believe that X will Y because Z.', [543, 230, 663, 348]], ['Experiment', 'Choose how you will test it.', [543, 85, 667, 203]]] };
function vBoards(txt, vis) {
  vis.className = 'in-vis bd-vis';
  txt.querySelector('.in-b').remove();
  const list = el('div', 'in-b st'); txt.append(list);
  vis.innerHTML = '<div class="bd-tabs"></div><div class="bd-wrap"><div class="bd-art"></div></div><div class="bd-hint">Tap a number to see what you do there</div>';
  const tabs = $('.bd-tabs', vis), art = $('.bd-art', vis); let board = 0, cur = -1, run = 0;
  [[1, 'BOARD 1 · STRATEGY'], [2, 'BOARD 2 · TEST IT']].forEach(([n, t]) => { const b = el('button', '', t); b.type = 'button'; b.onclick = () => draw(n, true); tabs.append(b); });
  function draw(n, manual) {
    board = n; cur = -1; const id = ++run; stopTimers();
    $$('.bd-tabs button', vis).forEach((b, k) => b.classList.toggle('on', k === n - 1));
    const [W, H] = AR[n]; art.style.setProperty('--ar', W + '/' + H);
    art.innerHTML = UNBOX_ART['board' + n]() + '<div class="zn"></div>';
    const zn = $('.zn', art);
    list.replaceChildren(); const mks = [], its = [];
    BSTEPS[n].forEach(([t, d, r], i) => {
      const cx = (r[0] + r[2]) / 2 / W * 100, cy = (r[1] + r[3]) / 2 / H * 100;
      const m = el('button', 'mk', String(i + 1)); m.type = 'button'; m.style.left = cx + '%'; m.style.top = cy + '%'; m.setAttribute('aria-label', t); art.append(m); mks.push(m);
      const it = el('button', 'it', `<b class="n">${i + 1}</b><span><b>${t}</b> ${d}</span>`); it.type = 'button'; it.style.setProperty('--i', i); list.append(it); its.push(it);
      const pick = () => { run++; stopTimers(); sel(i); }; m.onclick = pick; it.onclick = pick;
    });
    const sel = i => {
      cur = i; const r = BSTEPS[n][i][2];
      zn.style.cssText = `left:${r[0] / W * 100}%;top:${r[1] / H * 100}%;width:${(r[2] - r[0]) / W * 100}%;height:${(r[3] - r[1]) / H * 100}%;opacity:1`;
      mks.forEach((m, k) => { m.classList.add('show'); m.classList.toggle('on', k === i); }); its.forEach((x, k) => x.classList.toggle('on', k === i));
    };
    // one automatic pass through the steps, then it waits for taps
    const walk = i => { if (id !== run) return; if (i >= BSTEPS[n].length) { zn.style.opacity = 0; mks.forEach(m => m.classList.remove('on')); its.forEach(x => x.classList.remove('on')); return; } mks[i].classList.add('show'); sel(i); later(() => walk(i + 1), 1500); };
    if (reduce) mks.forEach(m => m.classList.add('show')); else later(() => walk(0), manual ? 250 : 700);
  }
  draw(1);
}

/* ---------- slide 4: try it (drag, then tap) ---------- */
function vPractice(txt, vis) {
  vis.className = 'in-vis p-vis';
  vis.innerHTML = `<div class="p-cap"></div><div class="p-area"><div class="pz"><b>CUSTOMER SEGMENT</b><span>Place your card/tile</span></div><div class="pc"><div class="tg">PERSONA 1</div><div class="t">Eco-Conscious Enthusiast</div><div class="d">Age 25–35, urban. Needs greener transport.</div></div><div class="ih">${HAND}</div></div>`;
  const cap = $('.p-cap', vis), area = $('.p-area', vis), zone = $('.pz', vis), card = $('.pc', vis), hand = $('.ih', vis);
  cap.innerHTML = '<b>TRY IT:</b> drag the card onto the glowing zone.';
  let done = false, anim = null;
  const hint = () => { if (done || reduce) return; const a = area.getBoundingClientRect(), c = card.getBoundingClientRect(), z = zone.getBoundingClientRect();
    const sx = c.left + c.width / 2 - a.left, sy = c.top + c.height / 2 - a.top, ex = z.left + z.width / 2 - a.left, ey = z.top + z.height / 2 - a.top;
    hand.style.opacity = 1; anim = hand.animate([{ transform: `translate(${sx}px,${sy}px)`, opacity: 0 }, { transform: `translate(${sx}px,${sy}px)`, opacity: 1, offset: .15 }, { transform: `translate(${sx}px,${sy}px) scale(.85)`, opacity: 1, offset: .3 },
      { transform: `translate(${ex}px,${ey}px) scale(.85)`, opacity: 1, offset: .75 }, { transform: `translate(${ex}px,${ey}px)`, opacity: 0 }], { duration: 2600, iterations: Infinity, easing: 'ease-in-out' }); };
  later(hint, 1800);
  const stopHint = () => { if (anim) { anim.cancel(); anim = null; } hand.style.opacity = 0; };
  const ok = () => {
    if (done) return; done = true; stopHint();
    const a = area.getBoundingClientRect(), z = zone.getBoundingClientRect(), now = card.style.transform;
    card.style.transition = 'none'; card.style.transform = ''; const c = card.getBoundingClientRect();      // where the card rests, before any drag
    card.style.transform = now; void card.offsetWidth;
    card.style.transition = 'transform .45s cubic-bezier(.2,1.2,.4,1)'; card.style.transform = `translate(${z.left + z.width / 2 - (c.left + c.width / 2)}px,${z.top + z.height / 2 - (c.top + c.height / 2)}px) scale(.62)`;
    zone.classList.add('hit'); confetti(area, z.left - a.left + z.width / 2, z.top - a.top + z.height / 2);
    cap.innerHTML = '<b>NICE!</b> A plain <b>tap</b> on a card works too.'; later(() => tapStage(), 1900);
  };
  card.addEventListener('pointerdown', ev => {
    if (done) return; stopHint(); card.setPointerCapture(ev.pointerId); const sx = ev.clientX, sy = ev.clientY; let moved = false; card.style.transition = 'none';
    const mv = m => { const dx = m.clientX - sx, dy = m.clientY - sy; if (Math.hypot(dx, dy) > 6) moved = true; card.style.transform = `translate(${dx}px,${dy}px) rotate(${Math.max(-8, Math.min(8, dx / 12))}deg)`; };
    const up = u => { card.removeEventListener('pointermove', mv); card.removeEventListener('pointerup', up); card.removeEventListener('pointercancel', up);
      const z = zone.getBoundingClientRect(), inside = u.clientX > z.left && u.clientX < z.right && u.clientY > z.top && u.clientY < z.bottom;
      if (!moved || inside) { ok(); return; }
      card.style.transition = 'transform .35s cubic-bezier(.2,1.4,.4,1)'; card.style.transform = ''; zone.classList.remove('bad'); void zone.offsetWidth; zone.classList.add('bad'); later(hint, 2500); };
    card.addEventListener('pointermove', mv); card.addEventListener('pointerup', up); card.addEventListener('pointercancel', up);
  });
  // part two: tap cards that are already on the board to choose them
  function tapStage() {
    area.innerHTML = '<div class="pk"></div>'; const row = $('.pk', area); const chosen = [];
    cap.innerHTML = '<b>NOW TAP:</b> choose your <b>top 2</b> tactics.';
    ['Local assembly', 'Online ordering', 'Owner community', 'Battery second life'].forEach(t => {
      const c = el('button', 'pt', `<span class="tg">TACTIC</span><span class="t">${t}</span><i class="rk"></i>`); c.type = 'button'; row.append(c);
      c.onclick = () => { const k = chosen.indexOf(c); if (k >= 0) chosen.splice(k, 1); else if (chosen.length < 2) chosen.push(c); else return;
        $$('.pt', row).forEach(x => { x.classList.toggle('sel', chosen.includes(x)); $('.rk', x).textContent = chosen.indexOf(x) + 1; });
        if (chosen.length === 2) { cap.innerHTML = '<b>YOU’RE READY!</b> Press next to read your challenge.'; const r = row.getBoundingClientRect(); confetti(area, r.width / 2, r.height / 2); $('.in-next').classList.add('go'); } else cap.innerHTML = '<b>NOW TAP:</b> choose your <b>top 2</b> tactics.'; };
    });
  }
}

/* ---------- slide 5: scoring ---------- */
function vScore(txt, vis) {
  vis.className = 'in-vis s-vis';
  const Q = ['Is the direction clear?', 'Does it foster innovation?', 'Can it scale?'];
  vis.innerHTML = `<div class="s-cap">Tap a dot for each question</div><div class="s-rows"></div><div class="s-meter"><div class="s-bar"><i class="lo"></i><i class="md"></i><i class="hi"></i><span class="s-pin"></span></div><div class="s-ticks"><span>0</span><span>10</span><span>25</span><span>50</span></div><div class="s-out">RATING: <b>–</b></div></div>`;
  const rows = $('.s-rows', vis), pin = $('.s-pin', vis), out = $('.s-out', vis), R = [0, 0, 0];
  const head = el('div', 's-h', '<span></span><b>Low</b><b>Med</b><b>High</b>'); rows.append(head);
  Q.forEach((q, r) => { const row = el('div', 's-r', `<span>${r + 1}. ${q}</span>`); for (let c = 0; c < 3; c++) { const d = el('button', 's-d'); d.type = 'button'; d.setAttribute('aria-label', `${q} ${['Low', 'Med', 'High'][c]}`);
      d.onclick = () => { R[r] = c + 1; $$('.s-d', row).forEach((x, i) => x.classList.toggle('sel', i === c)); upd(); }; row.append(d); } rows.append(row); });
  let shown = 0;
  const upd = () => {
    if (R.some(x => !x)) { out.innerHTML = 'RATING: <b>–</b>'; return; }
    const sum = R[0] + R[1] + R[2], pts = Math.round((sum - 3) / 6 * 50), lvl = pts <= 10 ? 'LOW' : pts <= 25 ? 'MED' : 'HIGH';
    pin.style.left = (pts / 50 * 100) + '%'; pin.classList.add('on');
    const from = shown, t0 = performance.now(); shown = pts;
    const tick = n => { const k = Math.min(1, (n - t0) / 500), v = Math.round(from + (pts - from) * k); out.innerHTML = `RATING: <b class="${lvl.toLowerCase()}">${lvl}</b> · <b>${v}</b> PTS`; if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };
}

/* ---------- slide 6: the challenge ---------- */
function vChallenge(txt, vis) {
  vis.className = 'in-vis c-vis';
  vis.innerHTML = `<button class="flip" type="button" aria-label="Turn the challenge card over"><div class="fl-in"><div class="fl-f"><b>CHALLENGE</b><span>CARD</span><em>Tap to turn over</em></div><div class="fl-b"><b>TESLA</b><i>goes to India</i><span>Market entry strategy in India. How might Tesla win its first customers?</span></div></div></button>`;
  const f = $('.flip', vis); f.onclick = () => f.classList.toggle('up'); later(() => f.classList.add('up'), 1500);
}

const SLIDES = [
  { k: 'A board game for business thinking', t: 'Welcome to Unbox', b: ['<b>Unbox</b> turns a real business challenge into a card game.', 'You place cards on <b>two boards</b>: first <b>build a strategy</b>, then <b>test it</b>.', 'You <b>score your thinking</b> and defend it to a jury.', 'A hybrid board game from Manish Yadav’s M.Des Game Design degree project.'], v: vWelcome },
  { k: 'Anyone who wants to think like a business designer', t: 'Who is it for?', b: ['<b>No business degree needed.</b> The cards guide every move.', 'Play <b>solo</b> here, or <b>together at a table</b> and talk each choice through.', '<b>Tap a player type</b> to see how Unbox helps.'], v: vWho },
  { k: 'What you will do', t: 'Two boards, one journey', b: ['x'], v: vBoards },
  { k: 'Learn the moves', t: 'Try it: move a card', b: ['<b>DRAG</b> a card onto the glowing zone.', 'Or just <b>TAP</b> the card and it flies there.', 'Wrong zone? It shakes. Nothing breaks, try again.', '<b>TAP</b> cards already on the board to choose them.'], v: vPractice },
  { k: 'How you are judged', t: 'Scoring & the jury', b: ['Rate every question <b>Low, Med or High</b>.', 'Each group of 3 answers becomes <b>one rating</b> and points.', '<b>Low 0–10 · Med 11–25 · High 26–50</b> points.', 'Add up both boards, then <b>defend your points</b> to the jury.'], v: vScore },
  { k: 'Challenge card', t: 'Your challenge', b: ['Your team gets a <b>real business challenge</b>: <b>Tesla goes to India</b>.', 'Work through <b>6 steps on Board 1</b>, then <b>4 on Board 2</b>.', 'The deck’s other case is <b>Airbnb’s growth</b> in urban and rural markets.'], v: vChallenge }];

function open({ panel, label = 'START BOARD 1 ▶', skip = true, onStart, onSkip }) {
  stopTimers(); let i = 0;
  const root = el('div', 'intro', `<div class="in-top"><span class="lg">UNBOX</span><div class="in-dots"></div>${skip ? '<button class="in-skip" type="button">SKIP INTRO ▶</button>' : '<button class="in-skip" type="button">CLOSE ×</button>'}</div><div class="in-stage"></div><div class="in-nav"><button class="in-back btn y" type="button">◀ BACK</button><span class="in-n"></span><button class="in-next btn" type="button" id="go">NEXT ▶</button></div>`);
  panel.replaceChildren(root); panel.classList.add('on');
  const stage = $('.in-stage', root), dots = $('.in-dots', root), back = $('.in-back', root), next = $('.in-next', root);
  SLIDES.forEach((s, k) => { const d = el('button', ''); d.type = 'button'; d.setAttribute('aria-label', s.t); d.onclick = () => show(k); dots.append(d); });
  const end = fn => { stopTimers(); document.removeEventListener('keydown', key, true); fn && fn(); };
  function show(n) {
    stopTimers(); i = n; const s = SLIDES[n], dir = 1;
    $$('button', dots).forEach((d, k) => d.className = k === n ? 'on' : k < n ? 'done' : '');
    stage.replaceChildren(); const sl = el('div', 'in-slide'), txt = el('div', 'in-txt'), vis = el('div', 'in-vis');
    txt.innerHTML = `<div class="in-k">${s.k}</div><h2>${s.t}</h2><div class="in-b">${s.b.map((x, k) => `<div class="li" style="--i:${k}"><b class="n">${k + 1}</b><span>${x}</span></div>`).join('')}</div>`;
    sl.append(txt, vis); stage.append(sl); s.v(txt, vis);
    back.style.visibility = n ? 'visible' : 'hidden'; $('.in-n', root).textContent = `${n + 1} / ${SLIDES.length}`;
    next.textContent = n === SLIDES.length - 1 ? label : 'NEXT ▶'; next.classList.toggle('go', n === SLIDES.length - 1);
  }
  const go = d => { const n = i + d; if (n < 0) return; if (n >= SLIDES.length) return end(onStart); show(n); };
  back.onclick = () => go(-1); next.onclick = () => go(1); $('.in-skip', root).onclick = () => end(onSkip || onStart);
  const key = e => { if (e.key === 'ArrowRight') { go(1); e.preventDefault(); } else if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'Escape') { end(onSkip || onStart); e.stopPropagation(); } };
  document.addEventListener('keydown', key, true);
  show(0);
}
return { open };
})();
