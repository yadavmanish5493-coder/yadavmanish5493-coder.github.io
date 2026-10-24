/* UNBOX · SEE mode. A scripted motion-graphic film of the whole project.
   Every scene builds its own DOM and registers Web Animations on a scene clock (paused, driven by the master clock),
   so play, pause, scrubbing and chapter jumps are exact. Pictures come from the design deck (see/img). */
window.UNBOX_SEE = (() => {
const BASE = (document.currentScript && document.currentScript.src || location.href).replace(/[^/]*$/, '');
const IMG = n => BASE + 'img/' + n + '.jpg';
const EASE = 'cubic-bezier(.2,.9,.3,1.18)', SOFT = 'cubic-bezier(.25,.8,.25,1)';
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const INK = '#1a1030', YEL = '#ffd21f', RED = '#e8374c', BLU = '#2d57b8';

/* ---------- scene context ---------- */
const FROM = {
  up: ['translateY(90px) scale(.92)', 'translateY(0) scale(1)'], pop: ['scale(.15) rotate(-14deg)', 'scale(1) rotate(0deg)'],
  left: ['translateX(-520px)', 'translateX(0)'], right: ['translateX(520px)', 'translateX(0)'], drop: ['translateY(-300px)', 'translateY(0)'],
  zoom: ['scale(1.7)', 'scale(1)'], spin: ['scale(.1) rotate(-200deg)', 'scale(1) rotate(0deg)'], slam: ['scale(3.2)', 'scale(1)'], fade: ['scale(1)', 'scale(1)']
};
function makeCtx(root, dur) {
  const anims = [], ticks = [], S = { root, dur };
  S.el = (cls, html, css, parent, tag) => { const e = document.createElement(tag || 'div'); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (css) e.style.cssText = css; (parent || root).append(e); return e; };
  S.a = (e, kf, at, d, ease) => { const an = e.animate(kf, { delay: at * 1000, duration: Math.max(1, d * 1000), fill: 'both', easing: ease || EASE }); an.pause(); anims.push(an); return an; };
  S.in = (e, at, d = .55, mode = 'up', ease) => { const [a, b] = FROM[mode]; return S.a(e, [{ opacity: 0, transform: `rotate(var(--r,0deg)) ${a}` }, { opacity: 1, transform: `rotate(var(--r,0deg)) ${b}` }], at, d, ease); };
  S.out = (e, at, d = .35) => S.a(e, [{ opacity: 1 }, { opacity: 0 }], at, d, 'linear');
  S.move = (e, kf, at, d, ease) => S.a(e, kf, at, d, ease || SOFT);
  S.count = (e, to, at, d, dec = 0, pre = '', suf = '') => ticks.push(lt => { const k = clamp((lt / 1000 - at) / d), v = to * (1 - Math.pow(1 - k, 3)); e.textContent = pre + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US')) + suf; });
  S.tick = f => ticks.push(f);
  S.render = lt => { for (const a of anims) a.currentTime = lt; for (const f of ticks) f(lt); };
  return S;
}

/* ---------- helpers ---------- */
function words(S, txt, css, at, size, o = {}) {
  const h = S.el('sv-h' + (o.stk ? ' stk' : ''), '', `${css};font-size:${size}px;${o.col ? 'color:' + o.col + ';' : ''}`);
  const hi = (o.hi || []).map(x => x.toUpperCase());
  txt.split(' ').forEach((w, i) => { const s = document.createElement('span'); s.className = 'w'; s.textContent = w + ' '; if (hi.includes(w.replace(/[^A-Za-z0-9$%&]/g, '').toUpperCase())) s.style.color = o.hiCol || YEL; h.append(s); S.in(s, at + i * (o.gap || .09), .45, o.mode || 'pop'); });
  return h;
}
function photo(S, n, x, y, w, h, at, o = {}) {
  const f = S.el('ph' + (o.contain ? ' ct' : ''), '', `left:${x}px;top:${y}px;width:${w}px;height:${h}px;--r:${o.r || 0}deg;${o.css || ''}`);
  const im = document.createElement('img'); im.src = IMG(n); im.alt = ''; if (o.pos) im.style.objectPosition = o.pos; f.append(im);
  if (o.lb) S.el('lb', o.lb, '', f); if (o.no) S.el('no', o.no, '', f);
  S.in(f, at, o.d || .6, o.mode || 'up');
  if (o.kb !== false) S.a(im, [{ transform: 'scale(1.01)' }, { transform: `scale(${o.kb || 1.13}) translate(${o.kx || 0}px,${o.ky || 0}px)` }], at, Math.max(.5, S.dur - at), 'linear');
  return f;
}
function chip(S, txt, x, y, at, o = {}) {
  const c = S.el('chip' + (o.sq ? ' sq' : ''), txt, `left:${x}px;top:${y}px;--r:${o.r || 0}deg;${o.bg ? '--bg:' + o.bg + ';' : ''}${o.fg ? '--fg:' + o.fg + ';' : ''}${o.size ? 'font-size:' + o.size + 'px;' : ''}${o.css || ''}`);
  S.in(c, at, o.d || .5, o.mode || 'pop'); return c;
}
function cap(S, txt, x, y, w, at, o = {}) { const c = S.el('cap', txt, `left:${x}px;top:${y}px;width:${w}px;--r:${o.r || 0}deg;${o.size ? 'font-size:' + o.size + 'px;' : ''}${o.col ? 'color:' + o.col + ';' : ''}`); S.in(c, at, .45, o.mode || 'up'); return c; }
function cutout(S, n, x, y, h, at, o = {}) { const im = S.el('', '', `left:${x}px;top:${y}px;height:${h}px;--r:${o.r || 0}deg;position:absolute`, null, 'img'); im.src = IMG(n); im.style.transform = 'rotate(var(--r,0deg))'; S.in(im, at, o.d || .6, o.mode || 'up'); return im; }
function tilt(S, e, at, amp = 1.5, per = 1.6) { S.tick(lt => { const k = Math.max(0, lt / 1000 - at); e.style.translate = `0 ${Math.sin(k / per * 6.283) * amp * 5}px`; }); }

/* ---------- scenes ---------- */
const SC = [];
const add = (title, dur, bg, build, dark) => SC.push({ title, dur, bg, build, dark });

/* 1 */ add('The project', 5.4, '#f4503a', S => {
  const bgi = S.el('', '', 'position:absolute;inset:0;overflow:hidden'), im = S.el('', '', 'width:100%;height:100%;object-fit:cover;transform-origin:30% 62%', bgi, 'img'); im.src = IMG('title');
  S.in(bgi, 0, .5, 'fade'); S.a(im, [{ transform: 'scale(1)' }, { transform: 'scale(1.09)' }], 0, S.dur, 'linear');
  const rb = chip(S, 'Graduation Project Jury', 60, 48, .5, { bg: YEL, r: -3, mode: 'drop', size: 56 });
  chip(S, 'Presented by Manish Yadav · TGD 2020', 72, 150, 1, { bg: '#fff', size: 36, r: -1, mode: 'left' });
  const row = (y, at, html) => { const r = S.el('', html, `position:absolute;right:50px;top:${y}px;display:flex;align-items:center;gap:20px;padding:12px 26px;background:#fff;border:5px solid ${INK};border-radius:999px;box-shadow:7px 8px 0 ${INK};font:400 40px Bangers;letter-spacing:.05em;color:${INK};text-transform:uppercase`); S.in(r, at, .5, 'right'); };
  row(790, 1.9, `<img src="${IMG('nid')}" style="height:62px;border-radius:8px"> National Institute of Design`);
  row(890, 2.5, `<img src="${IMG('bdl')}" style="height:62px;border-radius:50%"> Sponsored by Business Design Lab`);
  row(990, 3.1, `Guided by Mr. Shekhar Bhattacharjee`);
});

/* 2 */ add('The question', 6.4, '#62d8fe', S => {
  cutout(S, 'ninja', 50, 90, 1000, .2, { mode: 'left' });
  words(S, 'How do we build a secure & stable life after college?', 'left:620px;top:70px;width:1260px', .5, 108, { col: '#1b3a9c', hi: ['SECURE', 'STABLE'], hiCol: RED });
  const a = chip(S, 'Job', 640, 520, 2.5, { bg: RED, fg: '#fff', size: 104, mode: 'left' });
  const vs = chip(S, 'VS', 930, 548, 2.9, { bg: '#fff', size: 64, mode: 'spin' });
  const b = chip(S, 'Own business', 1110, 520, 3.2, { bg: YEL, size: 104, mode: 'right' });
  const c = photo(S, 'circle', 700, 780, 250, 250, 3.7, { r: -4, mode: 'zoom', kb: false, css: 'border-radius:50%;' });
  const n = S.el('sv-h', '9.5M', `left:975px;top:790px;font-size:150px;color:${INK}`); S.in(n, 3.9, .5, 'pop'); S.count(n, 9.5, 3.9, 1.2, 1, '', 'M');
  cap(S, 'graduates in one year', 975, 935, 400, 4.1, { size: 40, col: INK }).style.webkitTextStroke = '0';
  const bub = S.el('bubble', 'How do I gain real experience and upskill to build a business?', 'left:1410px;top:730px;width:460px;--r:2deg;font-size:38px'); S.in(bub, 4.7, .55, 'pop');
});

/* 3 */ add('The reality', 5.2, '#34415c', S => {
  words(S, 'The reality', 'left:90px;top:60px', .1, 130, { stk: true });
  const D = [[90, '%', 'of Indian startups fail within five years', '#e5545a', 0], [63, '%', 'of Gen Z want to start their own business', '#4aa1b2', 0], [1.24, 'M', 'direct jobs from 117,000 recognised startups', '#f4a62a', 2], [3, '×', 'more likely to create jobs than non-entrepreneurs', '#7a3cff', 0]];
  D.forEach(([v, u, t, col, dec], i) => {
    const x = 70 + i * 455, c = S.el('card', '', `left:${x}px;top:300px;width:420px;height:620px;background:${col};--r:${[-2, 1.5, -1.5, 2][i]}deg`); S.in(c, .5 + i * .35, .6, 'up');
    const num = S.el('big', '0', 'position:absolute;left:0;right:0;top:60px;text-align:center;color:#fff;font-size:190px;text-shadow:7px 8px 0 #1a1030', c); S.count(num, v, .8 + i * .35, 1.1, dec, '', u);
    S.el('', t, 'position:absolute;left:34px;right:34px;top:330px;text-align:center;font:800 44px/1.2 Nunito;color:#fff;text-shadow:3px 3px 0 #1a103077', c);
  });
}, true);

/* 4 */ add('What students told us', 8.4, '#4aa1b2', S => {
  words(S, '50 people · one survey', 'left:80px;top:34px', .1, 100, { stk: true });
  ['Designers', 'Graduates', 'Product managers', 'Management students', 'High-schoolers'].forEach((t, i) => chip(S, t, 80 + [0, 245, 490, 820, 1250][i], 175, .5 + i * .12, { bg: '#fff', size: 32, mode: 'up' }));
  /* donut */
  const R = 190, C = 2 * Math.PI * R, segs = [[62.5, '#3366cc'], [31.3, '#ff9900'], [6.2, '#dc3912']];
  const svg = S.el('', `<svg viewBox="0 0 520 520" width="560" height="560"><g transform="rotate(-90 260 260)">${(() => { let off = 0; return segs.map(([p, c], i) => { const len = C * p / 100, s = `<circle class="dn" data-i="${i}" cx="260" cy="260" r="${R}" fill="none" stroke="${c}" stroke-width="86" stroke-dasharray="${len} ${C}" stroke-dashoffset="${-off}"/>`; off += len; return s; }).join(''); })()}</g><circle cx="260" cy="260" r="${R - 43}" fill="none" stroke="#1a1030" stroke-width="5"/><circle cx="260" cy="260" r="${R + 43}" fill="none" stroke="#1a1030" stroke-width="5"/></svg>`, 'position:absolute;left:60px;top:260px;width:560px;height:560px');
  S.in(svg, .9, .5, 'zoom');
  svg.querySelectorAll('.dn').forEach((c, i) => { const len = C * segs[i][0] / 100; S.a(c, [{ strokeDasharray: `0 ${C}` }, { strokeDasharray: `${len} ${C}` }], 1.2 + i * .5, .8, SOFT); });
  const pc = S.el('big', '0%', `position:absolute;left:60px;width:560px;top:470px;text-align:center;color:#fff;font-size:150px;text-shadow:6px 7px 0 ${INK}`); S.count(pc, 62, 1.2, 1.2, 0, '', '%');
  cap(S, 'interested in entrepreneurship', 60, 640, 560, 1.6, { size: 36, col: '#fff' });
  chip(S, '31% confused · risk feels high', 70, 840, 2.4, { bg: '#ff9900', size: 34, r: -2 });
  chip(S, '7% happy with their job', 160, 920, 2.8, { bg: '#dc3912', fg: '#fff', size: 34, r: 1 });
  /* bars */
  const hdr = S.el('sv-h', 'Major problems', `left:720px;top:268px;font-size:78px;color:${YEL};text-shadow:5px 5px 0 ${INK}`); S.in(hdr, 3, .5, 'left');
  [[62, '#3366cc', 'Business knowledge & skills'], [34, '#ff9900', 'Mentorship · support · funding'], [21, '#dc3912', 'A business idea']].forEach(([v, col, t], i) => {
    const y = 380 + i * 150, lab = S.el('', t, `position:absolute;left:720px;top:${y - 6}px;font:400 44px Bangers;letter-spacing:.05em;color:#fff;text-shadow:3px 3px 0 ${INK};text-transform:uppercase`); S.in(lab, 3.3 + i * .5, .4, 'left');
    const track = S.el('', '', `position:absolute;left:720px;top:${y + 52}px;width:1100px;height:62px;border:5px solid ${INK};border-radius:99px;background:#fff3;overflow:hidden`); const bar = S.el('', '', `position:absolute;left:0;top:0;bottom:0;width:${v / 62 * 100}%;background:${col};transform-origin:0 50%`, track); S.a(bar, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], 3.5 + i * .5, .9, SOFT); S.in(track, 3.3 + i * .5, .3, 'fade');
    const pv = S.el('big', '0%', `position:absolute;left:${720 + 1100 * v / 62 + 14}px;top:${y + 36}px;font-size:84px;color:#fff;text-shadow:5px 5px 0 ${INK};transform:translateX(-170px)`); S.count(pv, v, 3.5 + i * .5, .9, 0, '', '%');
  });
  [['60%', 'would start with a job'], ['80%', 'job seekers want stable income'], ['55%', 'founders lack financial literacy']].forEach(([n, t], i) => {
    const c = S.el('card', `<b style="font:400 84px/1 Bangers;color:${YEL};text-shadow:4px 4px 0 ${INK}">${n}</b><span style="font:800 30px/1.1 Nunito;color:#fff">${t}</span>`, `left:${700 + i * 380}px;top:835px;width:360px;height:200px;background:#34415c;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 16px;--r:${[-1.5, 1, -1][i]}deg`); S.in(c, 5.6 + i * .5, .5, 'up');
  });
});

/* 5 */ add('Who plays', 6.2, '#5c8fde', S => {
  words(S, 'Who plays?', 'left:90px;top:50px', .1, 140, { stk: true });
  const P = [['teen', 'High-schooler', 'hands-on · visual', 420], ['grad', 'Graduate', 'hands-on + theory', 420], ['designer', 'Designer', 'visual · interactive', 420], ['pm', 'Product manager', 'real-world · practical', 420]];
  P.forEach(([n, who, need, h], i) => {
    const x = 90 + i * 450;
    const base = S.el('', '', `position:absolute;left:${x - 10}px;top:640px;width:360px;height:70px;border-radius:50%;background:#0003;filter:blur(4px)`); S.in(base, .5 + i * .45, .4, 'fade');
    const im = cutout(S, n, x + (n === 'pm' ? 40 : 90), 250, h, .5 + i * .45, { mode: 'up' }); im.style.height = h + 'px';
    chip(S, who, x, 680, .8 + i * .45, { bg: '#fff', size: 44, r: i % 2 ? 2 : -2 });
    chip(S, need, x + 10, 780, 1 + i * .45, { bg: YEL, size: 36, r: i % 2 ? -1 : 1 });
  });
  const f = chip(S, 'For', 90, 910, 3, { bg: RED, fg: '#fff', size: 52, mode: 'left' });
  ['students', 'entrepreneurs', 'designers', 'strategic thinkers', 'leaders'].forEach((t, i) => chip(S, t, 250 + [0, 270, 640, 940, 1330][i], 915, 3.3 + i * .25, { bg: '#fff', size: 42, mode: 'right' }));
});

/* 6 */ add('The brief', 5.2, '#fff1d0', S => {
  words(S, 'The brief', 'left:90px;top:50px', .1, 130, { col: RED });
  words(S, 'Design a gamified learning experience for aspiring entrepreneurs', 'left:90px;top:260px;width:780px', .5, 82, { col: INK, hi: ['GAMIFIED', 'ENTREPRENEURS'], hiCol: RED, gap: .11 });
  const CIR = [[1380, 370, '#f0584a', 'Games & simulations'], [1570, 560, '#7b8794', 'Mentorship'], [1380, 750, '#fbbf24', 'Visual content'], [1190, 560, '#33c1c1', 'Hands-on']];
  const g = S.el('', `<svg viewBox="0 0 1920 1080" width="1920" height="1080">${CIR.map(([x, y, c], i) => `<circle class="vc" cx="${x}" cy="${y}" r="215" fill="${c}" fill-opacity=".82" stroke="#1a1030" stroke-width="6"/>`).join('')}</svg>`, 'inset:0;position:absolute');
  g.querySelectorAll('.vc').forEach((c, i) => S.a(c, [{ transform: 'scale(0)', transformOrigin: '1380px 560px' }, { transform: 'scale(1)', transformOrigin: '1380px 560px' }], .6 + i * .35, .7));
  [[1380, 300, 'Games'], [1640, 545, 'Mentors'], [1380, 800, 'Visuals'], [1120, 545, 'Hands-on']].forEach(([x, y, t], i) => { const c = S.el('cap', t, `left:${x - 130}px;top:${y}px;width:260px;font-size:44px`); S.in(c, 1.2 + i * .3, .4, 'fade'); });
  const mid = chip(S, 'Unbox', 1280, 500, 2.8, { bg: '#fff', size: 66, mode: 'spin' });
});

/* 7 */ add('A growing market', 5.2, '#ffffff', S => {
  words(S, 'A growing market', 'left:90px;top:50px', .1, 130, { col: BLU });
  [['29.7', '$', 'B', 'game-based learning market by 2026', '#e5545a', 1], ['20.1', '', '%', 'growth a year (CAGR)', '#4aa1b2', 1], ['72', '', '%', 'of millennials want to start a business', '#f4a62a', 0]].forEach(([v, pre, u, t, col, dec], i) => {
    const c = S.el('card', '', `left:${90 + i * 590}px;top:300px;width:550px;height:560px;background:${col};--r:${[-1.5, 1.2, -1][i]}deg`); S.in(c, .5 + i * .4, .6, 'up');
    const num = S.el('big', '0', 'position:absolute;left:0;right:0;top:70px;text-align:center;color:#fff;font-size:170px;text-shadow:7px 8px 0 #1a1030', c); S.count(num, +v, .8 + i * .4, 1.1, dec, pre, u);
    S.el('', t, 'position:absolute;left:36px;right:36px;top:330px;text-align:center;font:800 46px/1.2 Nunito;color:#fff;text-shadow:3px 3px 0 #1a103077', c);
  });
  chip(S, 'The idea: learn by playing', 90, 920, 3.2, { bg: YEL, size: 56, mode: 'left' });
});

/* 8 */ add('Who is on the table', 6.2, '#fff6d6', S => {
  words(S, 'Who else is on the table?', 'left:70px;top:22px', .1, 92, { col: INK, hi: ['table'], hiCol: RED });
  const rows = [['Direct · board games', 165, ['comp1', 'comp2', 'comp3', 'comp4', 'comp5', 'comp6'], -1], ['Indirect · simulations & cards', 585, ['ind1', 'ind2', 'ind3', 'ind4', 'ind5', 'ind6'], 1]];
  rows.forEach(([lab, y, list, dir], r) => {
    const l = chip(S, lab, 70, y - 10, .3 + r * .4, { bg: r ? BLU : RED, fg: '#fff', size: 40, mode: 'left' });
    const strip = S.el('', '', `position:absolute;left:0;top:${y + 70}px;width:3300px;height:330px`);
    list.forEach((n, i) => { const f = S.el('ph', '', `left:${40 + i * 530}px;top:0;width:500px;height:320px;--r:${(i % 2 ? 1.5 : -1.5)}deg`, strip); const im = S.el('', '', '', f, 'img'); im.src = IMG(n); });
    S.in(strip, .6 + r * .3, .5, 'fade'); S.a(strip, [{ transform: `translateX(${dir > 0 ? -1100 : 0}px)` }, { transform: `translateX(${dir > 0 ? 0 : -1100}px)` }], 0, S.dur, 'linear');
  });
  const b = S.el('', `<span style="color:${RED}">Board</span> + <span style="color:${BLU}">cards</span> + <span style="color:#1f9c5a">digital</span><br><small style="font-size:46px;color:${INK}">one hybrid learning tool</small>`, `position:absolute;left:310px;top:395px;width:1300px;text-align:center;padding:30px 20px 24px;background:${YEL};border:7px solid ${INK};border-radius:30px;box-shadow:12px 14px 0 ${INK};font:400 112px/1 Bangers;letter-spacing:.04em;text-transform:uppercase;--r:-2deg`);
  S.in(b, 3.7, .6, 'pop');
});

/* 9 */ add('Three ideas', 5.4, '#fdf6ee', S => {
  words(S, 'Three ideas', 'left:90px;top:50px', .1, 130, { col: RED });
  [['idea1', '1 · Card game', 70], ['idea2', '2 · Startup board game', 660], ['idea3', '3 · Startup lifecycle', 1250]].forEach(([n, t, x], i) => {
    photo(S, n, x, 250, 600, 400, .5 + i * .45, { r: [-2, 1, -1.5][i], pos: 'center' });
    cap(S, t, x, 670, 600, .9 + i * .45, { size: 46, r: [-2, 1, -1.5][i] });
  });
  const ar = S.el('sv-h', '▼', `left:900px;top:735px;font-size:100px;color:${RED}`); S.in(ar, 2.8, .4, 'drop');
  const b = chip(S, 'One hybrid board game', 250, 880, 3.2, { bg: YEL, size: 90, mode: 'pop' });
  photo(S, 'box_red', 1320, 800, 540, 150, 3.7, { r: 2, mode: 'right', kb: 1.05 });
});

/* 10 */ add('Double diamond', 8.4, '#4aa1b2', S => {
  words(S, 'Double diamond · on Miro', 'left:80px;top:26px', .1, 96, { stk: true });
  const P = [['Discover', 0, 150, 420, 10, 420, 290, '#d22b2b'], ['Define', 420, 10, 840, 150, 420, 290, '#f4c542'], ['Develop', 860, 150, 1280, 10, 1280, 290, '#1f7a63'], ['Deploy', 1280, 10, 1700, 150, 1280, 290, '#2b3a3a']];
  const d = S.el('', `<svg viewBox="0 0 1700 300" width="1700" height="300">${P.map(([, a, b, c, d2, e, f, col]) => `<polygon class="dm" points="${a},${b} ${c},${d2} ${e},${f}" fill="${col}" stroke="#1a1030" stroke-width="8" stroke-linejoin="round"/>`).join('')}${P.map(([t, a, b, c, d2, e, f], i) => `<text x="${(a + c + e) / 3 + (i % 2 ? 8 : -8)}" y="170" text-anchor="middle" font-family="Bangers" font-size="64" fill="${i == 1 ? '#1a1030' : '#fff'}" letter-spacing="2">${t.toUpperCase()}</text>`).join('')}</svg>`, 'position:absolute;left:110px;top:140px;width:1700px;height:300px');
  d.querySelectorAll('.dm').forEach((p, i) => S.a(p, [{ transform: 'scale(.02)', transformOrigin: '50% 50%', opacity: 0 }, { transform: 'scale(1)', transformOrigin: '50% 50%', opacity: 1 }], .4 + i * .35, .6));
  S.in(d, .2, .3, 'fade');
  [['miro1', 60, 500, 560, 310, 'Discover', 'context · trends'], ['miro2', 660, 500, 540, 310, 'Define', 'blue ocean · strategy'], ['miro3', 1240, 500, 620, 310, 'Develop & deploy', 'assumptions · prototype · test']].forEach(([n, x, y, w, h, t, k], i) => {
    photo(S, n, x, y, w, h, 2.6 + i * 1.5, { r: [-1.5, 1, -1][i], mode: 'up', pos: 'top left' });
    chip(S, t, x + 10, y + h + 40, 3.1 + i * 1.5, { bg: '#fff', size: 44, r: [-1, 1, -1][i] });
    cap(S, k, x, y + h + 130, w, 3.4 + i * 1.5, { size: 38, r: 0 });
  });
});

/* 11 */ add('First playtest', 5.4, '#242a5c', S => {
  words(S, 'First playtest', 'left:60px;top:40px', .1, 124, { stk: true, col: YEL });
  chip(S, 'Butter community · online', 70, 190, .6, { bg: '#fff', size: 38, r: -1, mode: 'left' });
  [['butter1', 700, 130, 560, 310, -2], ['butter2', 1290, 150, 560, 310, 2], ['butter3', 700, 500, 560, 310, 1.5], ['butter4', 1290, 520, 560, 310, -1.5]].forEach(([n, x, y, w, h, r], i) => photo(S, n, x, y, w, h, .5 + i * .35, { r, mode: 'zoom' }));
  [['Flow', '#2fb870'], ['Templates', '#2d8cff'], ['Engagement', '#ff7b2c']].forEach(([t, col], i) => chip(S, '✓ ' + t, 90 + i * 40, 330 + i * 130, 1.8 + i * .5, { bg: col, fg: '#fff', size: 70, mode: 'left' }));
  const w = chip(S, 'Players jumped in with no product idea…', 90, 880, 3.9, { bg: RED, fg: '#fff', size: 72, mode: 'pop' });
}, true);

/* 12 */ add('The fix', 7.2, '#12b0e5', S => {
  words(S, 'What if players told their product story first?', 'left:70px;top:30px;width:1800px', .1, 92, { col: '#fff', stk: true, hi: ['product', 'story'] });
  photo(S, 'onboard', 70, 250, 780, 418, 1.8, { r: -1.5, mode: 'left', pos: 'top left' }); chip(S, 'Guided onboarding form', 110, 710, 2.3, { bg: YEL, size: 46, r: -1 });
  photo(S, 'decks', 900, 250, 560, 378, 3.4, { r: 1.2, mode: 'up' }); chip(S, 'Tactic + experiment cards', 910, 670, 3.9, { bg: YEL, size: 44, r: 1 });
  photo(S, 'task1', 900, 690, 560, 250, 4.8, { r: -1, mode: 'up', pos: 'top left' }); chip(S, 'Task cards', 1000, 965, 5.3, { bg: '#fff', size: 38, r: 1, css: 'z-index:2' });
  photo(S, 'tesla', 1520, 250, 340, 320, 5.5, { r: 2, mode: 'pop', kb: false, contain: true }); chip(S, 'Case: Tesla', 1530, 610, 5.9, { bg: RED, fg: '#fff', size: 44, r: -2 });
  photo(S, 'persona', 1520, 700, 340, 320, 6.2, { r: -2, mode: 'pop', kb: false, contain: true });
});

/* 13 */ add('From sketch to board', 5.4, '#eceff1', S => {
  words(S, 'From sketch to final board', 'left:70px;top:24px', .1, 96, { col: INK, hi: ['final'], hiCol: RED });
  ['board1', 'board2', 'board3', 'board4'].forEach((n, i) => {
    photo(S, n, 60 + i * 465, 170, 435, 305, .5 + i * .35, { r: [-1, 1, -1.5, 1][i], mode: 'up', css: 'border-width:7px' });
    const b = S.el('chip', 'Board ' + (i + 1), `left:${80 + i * 465}px;top:440px;font-size:34px;--bg:${YEL};--r:-2deg`); S.in(b, .8 + i * .35, .4, 'pop');
  });
  const ar = S.el('sv-h', '▼', `left:900px;top:495px;font-size:70px;color:${RED}`); S.in(ar, 2.3, .4, 'drop');
  [[1, 270], [2, 1010]].forEach(([k, x], i) => {
    const w = S.el('', '', `position:absolute;left:${x}px;top:575px;width:640px;height:${k === 1 ? 451 : 427}px;border:7px solid ${INK};border-radius:20px;overflow:hidden;box-shadow:12px 14px 0 rgba(0,0,0,.35);--r:${i ? 1 : -1}deg`); w.innerHTML = UNBOX_ART['board' + k](); w.firstChild.style.cssText = 'width:100%;height:100%;display:block'; S.in(w, 2.6 + i * .6, .6, 'zoom');
  });
  chip(S, 'Final · vector boards', 660, 530, 3.6, { bg: RED, fg: '#fff', size: 50, mode: 'spin' });
});

/* 14 */ add('Live playtest', 6.4, '#ff7b2c', S => {
  words(S, 'Live playtest · MIT Pune', 'left:70px;top:28px', .1, 104, { stk: true });
  photo(S, 'mit2', 70, 190, 880, 530, .5, { r: -2, mode: 'left' });
  photo(S, 'mit1', 1000, 190, 420, 330, .9, { r: 2, mode: 'up' });
  photo(S, 'mit3', 1450, 220, 420, 330, 1.3, { r: -3, mode: 'right' });
  [['✓ Engaged, no pushing', '#2fb870'], ['✓ Natural team roles', '#2d8cff'], ['✓ Cards well-received', '#7a3cff'], ['⏱ Wanted more time', '#e8374c']].forEach(([t, col], i) => chip(S, t, 1000 + (i % 2) * 20, 590 + i * 100, 2 + i * .45, { bg: col, fg: '#fff', size: 52, mode: 'right' }));
  chip(S, 'Then we refined', 90, 790, 3.9, { bg: YEL, size: 58, r: -1, mode: 'left' });
  ['Quick onboarding', 'Visual symbols', 'Time tweaks'].forEach((t, i) => chip(S, t, [90, 480, 830][i], 900, 4.3 + i * .35, { bg: '#fff', size: 42, r: [1, -1, 1][i] }));
});

/* 15 */ add('The box', 7.4, '#ffd801', S => {
  const A = S.el('', '', 'position:absolute;inset:0');
  const t = words(S, 'The master Unbox kit', 'left:80px;top:150px;width:700px', .2, 150, { col: '#1b3a8a', gap: .12 }); A.append(t);
  const sub = chip(S, 'A hybrid board game for business thinking', 80, 650, 1.4, { bg: '#fff', size: 44, r: -1, mode: 'left', css: 'white-space:normal;width:560px;text-align:center' }); S.out(sub, 3.1, .4);
  const hero = S.el('', '', 'position:absolute;left:760px;top:40px;height:1000px;width:700px'), hi = S.el('', '', 'height:100%;filter:drop-shadow(14px 18px 0 rgba(0,0,0,.28))', hero, 'img'); hi.src = IMG('box1'); hi.style.cssText += ';-webkit-mask-image:radial-gradient(ellipse 52% 54% at 50% 50%,#000 62%,transparent 100%);mask-image:radial-gradient(ellipse 52% 54% at 50% 50%,#000 62%,transparent 100%)'; S.in(hero, .3, .8, 'spin'); S.a(hi, [{ transform: 'scale(1) rotate(-2deg)' }, { transform: 'scale(1.06) rotate(2deg)' }], 1, 2, 'ease-in-out');
  const sm = [['boxB', 1480, 120, 440, 7, 1.8], ['boxC', 1480, 560, 440, -6, 2.2]].map(([n, x, y, h, r, at]) => { const c = cutout(S, n, x, y, h, at, { r, mode: 'right' }); c.style.webkitMaskImage = c.style.maskImage = 'radial-gradient(ellipse 54% 54% at 50% 50%,#000 60%,transparent 100%)'; return c; });
  [A, hero, ...sm].forEach(e => S.out(e, 3.1, .4));
  /* components */
  photo(S, 'kit', 60, 300, 900, 400, 3.6, { r: -1.5, mode: 'left', contain: true, css: 'background:#fff' });
  words(S, 'All components', 'left:70px;top:70px', 3.5, 120, { col: '#1b3a8a' });
  const L = ['2 boards', 'Tactic cards', 'Experiment cards', 'Assumption cards', 'Challenge · product · customer decks', 'Tesla case study', 'Task cards', 'Mega trend cards', 'Scoring cards', 'Sticky pads · pens · timer'];
  const pos = [[1000, 70], [1400, 150], [1000, 240], [1360, 320], [1000, 410], [1480, 490], [1000, 580], [1360, 660], [1000, 750], [1300, 830]];
  L.forEach((t, i) => chip(S, t, pos[i][0] - 30, pos[i][1] + 20, 3.7 + i * .3, { bg: ['#fff', '#ff4f9a', '#2d8cff', '#2fb870', '#ff7b2c', '#7a3cff', '#e8374c', '#14a3ad', '#fff', '#ffd21f'][i % 10], fg: [0, 1, 1, 1, 1, 1, 1, 1, 0, 0].map(v => v ? '#fff' : INK)[i], size: 44, r: (i % 2 ? 1.5 : -1.5), mode: 'pop' }));
  const pb = photo(S, 'comp_photo', 60, 760, 900, 215, 5.4, { r: 1, mode: 'up' });
});

/* 16 */ add('How to play', 11, '#1b1650', S => {
  words(S, 'How to play', 'left:60px;top:22px', .1, 104, { col: YEL });
  chip(S, '12 steps · 2 boards · 200 min', 560, 40, .6, { bg: '#fff', size: 44, r: -1, mode: 'right' });
  const slot = S.el('', '', `position:absolute;left:60px;top:170px;width:1030px;height:740px`);
  const mk = (k, w, h) => { const b = S.el('', '', `position:absolute;left:0;top:${(740 - h) / 2}px;width:${w}px;height:${h}px;border:7px solid ${INK};border-radius:22px;overflow:hidden;box-shadow:12px 14px 0 rgba(0,0,0,.45)`, slot); b.innerHTML = UNBOX_ART['board' + k](); b.firstChild.style.cssText = 'width:100%;height:100%;display:block'; return b; };
  const b1 = mk(1, 1030, 725), b2 = mk(2, 1030, 687);
  S.in(b1, .3, .6, 'left'); S.a(b1, [{ opacity: 1 }, { opacity: 0 }], 6.1, .4, 'linear'); S.in(b2, 6.1, .6, 'right');
  const lab1 = chip(S, 'Board 1 · Strategy', 100, 150, .8, { bg: RED, fg: '#fff', size: 44, mode: 'drop' }), lab2 = chip(S, 'Board 2 · Test it', 100, 150, 6.2, { bg: '#2d8cff', fg: '#fff', size: 44, mode: 'drop' });
  S.out(lab1, 6.1, .3);
  const ST = [['Product–customer fit', 10], ['Frame the challenge', 10], ['Innovation tactics', 20], ['Innovation tactics', 20], ['Secret sauce', 20], ['Frame the strategy', 20], ['Score the strategy', 20], ['Assumption finder', 20], ['Critical assumption', 10], ['XYZ hypothesis', 10], ['Experiment pitch', 20], ['Score the experiment', 20]];
  const tot = S.el('big', '0 min', `position:absolute;left:60px;top:925px;font-size:96px;color:${YEL};text-shadow:5px 5px 0 ${INK}`);
  let cum = 0; const marks = [];
  ST.forEach(([n, m], i) => {
    const at = .9 + i * .78; cum += m; marks.push([at, cum]);
    const r = S.el('row', `<b>${i + 1}</b>${n}<em>${m}′</em>`, `left:1130px;top:${170 + i * 73}px;width:730px;--r:0deg`); S.in(r, at, .4, 'right');
    S.a(r, [{ background: '#ffd21f', color: '#1a1030', offset: 0 }, { background: '#ffd21f', color: '#1a1030', offset: .5 }, { background: '#2a2480', color: '#fff', offset: 1 }], at, 1.2, 'linear');
  });
  S.tick(lt => { const t = lt / 1000; let v = 0; for (const [at, c] of marks) if (t >= at + .1) v = c; tot.textContent = v + ' min'; });
  S.el('', 'of focused play', `position:absolute;left:520px;top:960px;font:400 48px Bangers;color:#fff;letter-spacing:.06em`);
}, true);

/* 17 */ add('The product range', 5.4, '#7a1020', S => {
  words(S, 'The Unbox range', 'left:70px;top:26px', .1, 108, { stk: true });
  photo(S, 'products', 60, 150, 1200, 676, .4, { r: -1, mode: 'left', kb: 1.07, kx: -10, ky: -6 });
  photo(S, 'promo', 1330, 200, 540, 304, 1.6, { r: 2, mode: 'right' });
  ['Website', 'Logo & stickers', 'Banners & standees', 'Catalogue'].forEach((t, i) => chip(S, t, 1340 + (i % 2) * 120, 560 + i * 92, 2.2 + i * .3, { bg: ['#fff', YEL, '#fff', YEL][i], size: 44, r: i % 2 ? 2 : -2, mode: 'right' }));
  [['Card decks', 'Rs.1,199'], ['Strategy kit', 'Rs.3,499'], ['Professionals kit', 'Rs.7,999']].forEach(([t, p], i) => {
    const c = S.el('card', `<div style="font:400 40px Bangers;letter-spacing:.05em;color:${INK};text-transform:uppercase">${t}</div><div style="font:400 84px/1 Bangers;color:${RED};text-shadow:4px 4px 0 #fff">${p}</div>`, `left:${90 + i * 450}px;top:850px;width:420px;height:170px;background:${YEL};display:flex;flex-direction:column;align-items:center;justify-content:center;--r:${[-2, 1, -1][i]}deg`); S.in(c, 3 + i * .5, .5, 'pop');
  });
}, true);

/* 18 */ add('Leadership off-site · Xylem', 9.6, '#2f8ff0', S => {
  words(S, 'Leadership off-site', 'left:50px;top:36px;width:700px', .1, 100, { stk: true });
  chip(S, 'Xylem × Unbox', 60, 245, .6, { bg: YEL, size: 66, r: -2, mode: 'left' });
  photo(S, 'xylem_dev', 40, 340, 650, 556, .8, { r: -1.5, mode: 'left', contain: true, kb: 1.05, css: 'background:#4cc6f7;border-width:6px' });
  const live = chip(S, 'One live client challenge', 60, 940, 1.5, { bg: '#fff', size: 46, r: 1 });
  const G = [['xy1', 'Client project', null], ['xy2', 'Wake · make · model'], ['xy3', 'Context mapping'], ['xy4', 'Opportunity exploration'], ['xy5', 'Strategy framing'], ['xy6', 'Experiment design'], ['xy7', 'Execution roadmap'], ['xy8', 'Phygital kit delivered']];
  G.forEach(([n, t], i) => {
    const x = 770 + (i % 4) * 285, y = 150 + Math.floor(i / 4) * 440, at = 1.6 + i * .8;
    photo(S, n, x, y, 265, 330, at, { r: [-2, 1.5, -1, 2][i % 4], mode: 'up', lb: '', no: i ? String(i) : '★', pos: i === 7 ? 'center' : 'center' });
    const l = chip(S, t, x - 6, y + 340, at + .25, { bg: i === 7 ? RED : '#fff', fg: i === 7 ? '#fff' : INK, size: 28, sq: true, css: 'width:285px;padding:.15em .4em;border-width:4px;font-size:30px' });
  });
}, true);

/* 19 */ add('Launch event', 7.2, '#4cc6f7', S => {
  words(S, 'Unbox launch event', 'left:60px;top:30px', .1, 112, { stk: true });
  const ml = photo(S, 'minerva', 1500, 40, 380, 260, .5, { r: 2, mode: 'drop', contain: true, kb: false, css: 'background:#fff' });
  chip(S, 'One-day gamified workshop · start to end', 70, 195, .9, { bg: '#fff', size: 44, r: -1, mode: 'left' });
  [['poster1', 80, -3], ['poster2', 520, 2], ['agenda', 960, -2], ['dolphin', 1400, 3]].forEach(([n, x, r], i) => photo(S, n, x, 330, 420, 590, 1.4 + i * .65, { r, mode: 'up', contain: true, kb: 1.04, css: 'background:#fff' }));
  chip(S, 'Wisdom of the crowd · Dolphin Tank pitch', 130, 960, 4.4, { bg: YEL, size: 52, r: -1, mode: 'left' });
  const st = S.el('', `<div style="font:400 60px/1 Bangers;color:#fff;text-shadow:4px 4px 0 ${INK};letter-spacing:.05em">1 IDEA FUNDED</div><div class="big" style="font-size:96px;color:${YEL};text-shadow:5px 5px 0 ${INK}">Rs.10 lakh</div>`, `position:absolute;left:1180px;top:700px;width:560px;padding:20px 30px;text-align:center;background:${RED};border:7px solid ${INK};border-radius:40px;box-shadow:12px 14px 0 ${INK};--r:-4deg`); S.in(st, 5.4, .6, 'slam');
});

/* 20 */ add('In action', 5.4, '#0b0820', S => {
  words(S, 'In action', 'left:70px;top:30px', .1, 120, { stk: true, col: YEL });
  const L = [['ph2', 80, 170, -2], ['ph1', 690, 150, 1.5], ['ph3', 1300, 175, -1.5], ['ph7', 80, 590, 2], ['ph5', 690, 580, -1], ['ph6', 1300, 600, 2]];
  L.forEach(([n, x, y, r], i) => photo(S, n, x, y, 540, 390, .4 + i * .33, { r, mode: ['left', 'up', 'right', 'left', 'up', 'right'][i], kb: 1.2, kx: i % 2 ? 20 : -20 }));
  chip(S, 'Facilitating play · every session', 520, 985, 2.9, { bg: YEL, size: 50, r: -1 });
}, true);

/* 21 */ add('What we learned', 7.2, '#26b6f0', S => {
  words(S, 'What we learned', 'left:70px;top:36px', .1, 118, { col: '#fff', stk: true });
  const L = [['🎲', 'Structured play', 'Design thinking and business modelling, made fun'], ['🧠', 'A learnable skill', 'Not just for MBAs: cultivated through guided play'], ['🚪', 'Onboarding', 'A make-or-break moment'], ['🧪', 'Hypotheses', 'Idea to testable hypothesis builds strategic agility'], ['🎤', 'Facilitation', 'Guides take players beyond surface-level play'], ['🔁', 'Iteration', 'Every round of testing revealed something new']];
  L.forEach(([e, t, s], i) => {
    const x = 70 + (i % 3) * 610, y = 215 + Math.floor(i / 3) * 420, c = S.el('card', `<div style="font-size:110px;line-height:1">${e}</div><div style="font:400 66px/1 Bangers;letter-spacing:.04em;color:#fff;text-shadow:4px 4px 0 ${INK};text-transform:uppercase;margin:6px 0 8px">${t}</div><div style="font:800 34px/1.2 Nunito;color:#fff">${s}</div>`, `left:${x}px;top:${y}px;width:570px;height:380px;padding:26px 30px;background:${['#e5545a', '#7a3cff', '#2fb870', '#ff7b2c', '#2d57b8', '#d6336c'][i]};--r:${[-1.5, 1, -1, 1.2, -1.2, 1][i]}deg`); S.in(c, .7 + i * .55, .6, 'pop');
  });
});

/* 22 */ add('Can it be playful?', 8.2, '#285ac8', S => {
  words(S, 'Can business thinking be playful?', 'left:70px;top:50px;width:1780px', .2, 104, { stk: true });
  const y = S.el('sv-h stk', 'YES', `left:130px;top:250px;font-size:420px;color:${RED}`); S.in(y, 2.4, .5, 'slam');
  S.tick(lt => { const k = (lt / 1000 - 2.4); y.style.translate = k > 0.5 && k < 0.8 ? `${Math.sin(k * 70) * 8}px 0` : '0 0'; });
  const h = S.el('sv-h', 'Unbox taught how to', `left:960px;top:260px;font-size:70px;color:${YEL};text-shadow:4px 4px 0 ${INK}`); S.in(h, 3.5, .4, 'left');
  [['Think', 'like strategists'], ['Facilitate', 'like educators'], ['Design', 'like systems thinkers'], ['Play', 'like innovators']].forEach(([a, b], i) => {
    const l = S.el('sv-h', `<span style="color:${YEL}">${a}</span> ${b}`, `left:960px;top:${350 + i * 100}px;font-size:74px;text-shadow:4px 4px 0 ${INK}`); S.in(l, 4 + i * .5, .45, 'right');
  });
  const b1 = S.el('btnbig', '▶ Play the game', 'left:300px;top:850px;--r:-1deg'), b2 = S.el('btnbig alt', '↻ Watch again', 'left:1050px;top:850px;--r:1deg');
  S.in(b1, 6.2, .5, 'pop'); S.in(b2, 6.5, .5, 'pop');
  b1.onclick = () => API.onPlay && API.onPlay(); b2.onclick = () => API.restart();
  S.el('', 'Thank you · Manish Yadav', `position:absolute;left:0;right:0;top:1010px;text-align:center;font:400 40px Bangers;letter-spacing:.1em;color:#fff;opacity:.85`);
});

/* ---------- player ---------- */
const OFF = []; let TOTAL = 0; SC.forEach(s => { OFF.push(TOTAL); TOTAL += s.dur * 1000; });
const API = { onPlay: null, onClose: null };
let root, stage, view, wipe, poster, bar, ui = {}, cur = -1, ctx = null, t = 0, playing = false, started = false, last = 0, raf = 0, scale = 1, ready = false;

function fmt(ms) { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function sceneAt(ms) { let i = SC.length - 1; while (i > 0 && ms < OFF[i]) i--; return i; }
function enter(i, animate) {
  if (ctx) { const old = ctx.root; if (animate) { old.classList.add('leaving'); setTimeout(() => old.remove(), 320); } else old.remove(); }
  stage.querySelectorAll('.sv-scene.leaving').forEach(e => { if (!animate) e.remove(); });
  const r = document.createElement('div'); r.className = 'sv-scene' + (SC[i].dark ? ' dark' : ''); r.style.background = SC[i].bg;
  if (animate) r.classList.add('entering');
  stage.insertBefore(r, wipe); cur = i; ctx = makeCtx(r, SC[i].dur);
  try { SC[i].build(ctx); } catch (e) { console.error('scene', i, e); }
  if (animate) { wipe.classList.remove('go'); void wipe.offsetWidth; wipe.classList.add('go'); }
}
function show() {
  const i = sceneAt(t);
  if (i !== cur) enter(i, playing && i === cur + 1);
  ctx.render(t - OFF[i]);
  ui.fill.style.width = (t / TOTAL * 100) + '%'; ui.time.textContent = fmt(t) + ' / ' + fmt(TOTAL);
  ui.chap.textContent = String(i + 1).padStart(2, '0') + ' · ' + SC[i].title;
  ui.prev.disabled = i === 0 && t - OFF[0] < 1500; ui.next.disabled = i === SC.length - 1;
}
function seek(ms) { t = clamp(ms, 0, TOTAL - 1); show(); }
function loop(now) {
  raf = requestAnimationFrame(loop);
  const dt = Math.min(100, now - last); last = now;
  if (playing) { t += dt; if (t >= TOTAL) { t = TOTAL - 1; setPlaying(false); } show(); }
}
function setPlaying(p) { playing = p; ui.pl.textContent = p ? '❚❚ PAUSE' : (t >= TOTAL - 50 ? '↻ REPLAY' : '▶ PLAY'); }
function begin() { if (!started) { started = true; poster.hidden = true; } if (t >= TOTAL - 50) seek(0); setPlaying(true); }
function fit() { if (!view) return; const w = view.clientWidth, h = view.clientHeight; scale = Math.min(w / 1920, h / 1080); stage.style.transform = `translate(${(w - 1920 * scale) / 2}px,${(h - 1080 * scale) / 2}px) scale(${scale})`; }
function onKey(e) { if (!root.classList.contains('on')) return; if (e.key === ' ' || e.key === 'k') { e.preventDefault(); ui.pl.click(); } else if (e.key === 'ArrowRight') ui.next.click(); else if (e.key === 'ArrowLeft') ui.prev.click(); }

function build() {
  root = document.createElement('div'); root.id = 'see';
  root.innerHTML = `<div class="sv-view"><div class="sv-stage"><div class="sv-wipe"><i></i><i></i></div></div><div class="sv-poster" role="button" tabindex="0" aria-label="Play the Unbox film"><div class="pl"><small>THE PROJECT IN ${Math.round(TOTAL / 60000 * 2) / 2} MINUTES</small><b>▶</b></div></div></div>
  <div class="sv-bar"><button class="pl" type="button">▶ PLAY</button><button class="ghost pv" type="button" aria-label="Previous chapter">◀◀</button><button class="ghost nx" type="button" aria-label="Next chapter">▶▶</button><span class="sv-chap"></span><div class="sv-track" role="slider" aria-label="Film progress"><div class="sv-fill"></div></div><span class="sv-time"></span><button class="ghost md" type="button">⇄ MODES</button></div>`;
  document.body.append(root);
  view = root.querySelector('.sv-view'); stage = root.querySelector('.sv-stage'); wipe = root.querySelector('.sv-wipe'); poster = root.querySelector('.sv-poster');
  poster.style.backgroundImage = `url(${IMG('title')})`;
  ui = { pl: root.querySelector('.pl.pl, button.pl'), prev: root.querySelector('.pv'), next: root.querySelector('.nx'), chap: root.querySelector('.sv-chap'), time: root.querySelector('.sv-time'), fill: root.querySelector('.sv-fill'), track: root.querySelector('.sv-track'), modes: root.querySelector('.md') };
  ui.pl = root.querySelector('.sv-bar .pl');
  const tk = ui.track; OFF.forEach((o, i) => { if (!i) return; const e = document.createElement('i'); e.className = 'sv-tick'; e.style.left = (o / TOTAL * 100) + '%'; tk.append(e); });
  ui.pl.onclick = () => { if (!started || !playing) begin(); else setPlaying(false); };
  poster.onclick = begin; poster.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') begin(); };
  ui.prev.onclick = () => { const i = sceneAt(t); seek(t - OFF[i] > 1500 ? OFF[i] : OFF[Math.max(0, i - 1)]); };
  ui.next.onclick = () => { const i = sceneAt(t); if (i < SC.length - 1) seek(OFF[i + 1]); };
  tk.onpointerdown = e => { const f = ev => { const r = tk.getBoundingClientRect(); seek(clamp((ev.clientX - r.left) / r.width) * TOTAL); }; f(e); tk.setPointerCapture(e.pointerId); tk.onpointermove = f; tk.onpointerup = () => { tk.onpointermove = null; }; };
  ui.modes.onclick = () => { API.close(); API.onClose && API.onClose(); };
  addEventListener('resize', fit); document.addEventListener('keydown', onKey);
  new ResizeObserver(fit).observe(view);
}
function preload() { if (ready) return; ready = true; ['title', 'ninja', 'box1', 'boxB', 'boxC', 'board1', 'board2', 'board3', 'board4', 'mit1', 'mit2', 'mit3', 'ph1', 'ph2', 'ph3', 'ph5', 'ph6', 'ph7', 'products', 'promo'].concat(Array.from({ length: 8 }, (_, i) => 'xy' + (i + 1)), ['poster1', 'poster2', 'agenda', 'dolphin', 'idea1', 'idea2', 'idea3', 'miro1', 'miro2', 'miro3', 'onboard', 'decks', 'task1', 'kit', 'comp1', 'comp2', 'comp3', 'comp4', 'comp5', 'comp6', 'ind1', 'ind2', 'ind3', 'ind4', 'ind5', 'ind6', 'butter1', 'butter2', 'butter3', 'butter4', 'comp_photo', 'xylem_dev', 'minerva', 'nid', 'bdl', 'box_red', 'tesla', 'persona', 'teen', 'grad', 'designer', 'pm', 'circle']).forEach(n => { const i = new Image(); i.src = IMG(n); }); }

API.open = opts => { if (!root) build(); preload(); Object.assign(API, opts || {}); root.classList.add('on'); fit(); if (cur < 0) seek(0); else show(); cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(loop); if (!started) { poster.hidden = false; } };
API.close = () => { if (!root) return; setPlaying(false); root.classList.remove('on'); cancelAnimationFrame(raf); };
API.restart = () => { seek(0); begin(); };
API.scenes = SC; API.seek = seek; API.total = () => TOTAL; API.state = () => ({ t, cur, playing, started });
return API;
})();
