/* DOM overlay helpers: cards, notes, toasts, objectives, sound */
export const $ = s => document.querySelector(s);
export const HTML = document.documentElement;

/* ---------- sound (soft synth blips) ---------- */
let ac = null, muted = false;
export function sfx(kind) {
  if (muted) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume();
    const t = ac.currentTime, tone = (f, d, type = 'sine', v = 0.06, at = 0, f2 = null) => {
      const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t + at); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + at + d);
      g.gain.setValueAtTime(0.0001, t + at); g.gain.exponentialRampToValueAtTime(v, t + at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + at + d); o.connect(g); g.connect(ac.destination); o.start(t + at); o.stop(t + at + d + 0.05);
    };
    if (kind === 'fact') { tone(660, 0.12, 'triangle'); tone(990, 0.18, 'triangle', 0.05, 0.08); }
    else if (kind === 'pick') { tone(520, 0.08, 'square', 0.04); tone(780, 0.14, 'square', 0.04, 0.06); }
    else if (kind === 'ok') { tone(523, 0.1, 'triangle'); tone(659, 0.1, 'triangle', 0.06, 0.09); tone(784, 0.2, 'triangle', 0.06, 0.18); }
    else if (kind === 'bad') { tone(220, 0.25, 'sawtooth', 0.05, 0, 110); }
    else if (kind === 'gate') { tone(330, 0.2, 'triangle'); tone(495, 0.2, 'triangle', 0.06, 0.15); tone(660, 0.2, 'triangle', 0.06, 0.3); tone(990, 0.4, 'triangle', 0.06, 0.45); }
    else if (kind === 'cough') { tone(140, 0.12, 'sawtooth', 0.05, 0, 90); tone(120, 0.12, 'sawtooth', 0.05, 0.14, 80); }
    else if (kind === 'click') tone(420, 0.06, 'square', 0.03);
  } catch (e) { /* audio unavailable */ }
}
export const isMuted = () => muted;
export function toggleMute() { muted = !muted; $('#snd').style.opacity = muted ? 0.45 : 1; }

/* ---------- side notes (non-blocking facts) ---------- */
let noteT = 0;
export function note(title, html, o = {}) {
  const n = $('#note'); n.className = o.cls || ''; n.querySelector('.chip').innerHTML = `<h4>${o.ico ? `<span>${o.ico}</span>` : ''}${title}</h4>${html}${o.key ? `<span class="k">${o.key}</span>` : ''}`;
  void n.offsetWidth; n.classList.add('on'); clearTimeout(noteT); noteT = setTimeout(() => n.classList.remove('on'), o.ms || 9000);
}
export const hideNote = () => $('#note').classList.remove('on');
let toastT = 0;
export function toast(msg, ms = 2600) { const t = $('#toast'); t.querySelector('.chip').innerHTML = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms); }

/* ---------- the info card: a big, readable callout pinned to the point you stopped at ---------- */
let coOn = false;
export function callout(o) {
  const c = $('#callout'), b = c.querySelector('.co-box'); b.className = 'co-box ' + (o.cls || '');
  c.querySelector('.co-ico').textContent = o.ico || ''; c.querySelector('.co-ico').style.display = o.ico ? '' : 'none';
  c.querySelector('h3').textContent = o.title || ''; c.querySelector('.co-body').innerHTML = o.html || '';
  const k = c.querySelector('.co-key'); k.innerHTML = o.stat || ''; k.style.display = o.stat ? '' : 'none';
  c.classList.add('on'); coOn = true;
}
export function hideCallout() { if (!coOn) return; $('#callout').classList.remove('on'); $('#leader').classList.remove('on'); coOn = false; }
/** ax, ay: where the subject is on screen (px). Puts the card on the emptier side and draws a leader line to the subject. */
export function placeCallout(ax, ay) {
  if (!coOn) return; const c = $('#callout'), ld = $('#leader'), w = innerWidth;
  const right = ax < w * 0.5; c.classList.toggle('r', right); c.classList.toggle('l', !right);
  const r = c.getBoundingClientRect(), ex = right ? r.left : r.right, ey = Math.min(r.bottom - 18, Math.max(r.top + 18, ay));
  ld.querySelector('line').setAttribute('x1', ex); ld.querySelector('line').setAttribute('y1', ey); ld.querySelector('line').setAttribute('x2', ax); ld.querySelector('line').setAttribute('y2', ay);
  ld.querySelector('circle').setAttribute('cx', ax); ld.querySelector('circle').setAttribute('cy', ay); ld.classList.add('on');
}
export const calloutOn = () => coOn;
export function scrollHint(on) { const h = $('#scrollHint'); if (h) h.classList.toggle('gone', !on); }

/* ---------- big card ---------- */
let cardCb = null;
export const cardOpen = () => $('#card').classList.contains('on');
/** buttons: [{t, cls, cb, keep}] cb may return false to keep the card open */
export function card({ kick, title, html, buttons, cls }) {
  const c = $('#card'), b = c.querySelector('.box'); c.className = 'scr on ' + (cls || '');
  b.innerHTML = `${kick ? `<div class="kick">${kick}</div>` : ''}<h3>${title}</h3>${html || ''}<div class="btns"></div>`;
  const bt = b.querySelector('.btns');
  for (const x of buttons || [{ t: 'OK' }]) {
    const e = document.createElement('button'); e.className = 'btn ' + (x.cls || ''); e.textContent = x.t; if (x.id) e.id = x.id;
    e.onclick = () => { sfx('click'); if (x.cb && x.cb() === false) return; if (!x.keep) closeCard(); }; bt.appendChild(e);
  }
  b.scrollTop = 0; cardCb = null; return b;
}
export function closeCard() { $('#card').classList.remove('on'); }

/* ---------- objectives ---------- */
export function setObjectives(list) {
  $('#obj').innerHTML = list.map(o => `<li class="${o.done ? 'ok' : ''}"><i>${o.done ? '✓' : ''}</i><span>${o.text}${o.need > 1 ? `<em>${Math.min(o.have, o.need)}/${o.need}</em>` : ''}</span></li>`).join('');
}
export function setDistrict(i, name, sub) { $('#dNum').textContent = i + 1; $('#dName').textContent = name; $('#dSub').textContent = sub || ''; }
export function setHealth(v, show) { const h = $('#hp'); h.classList.toggle('on', show); h.querySelector('i').style.width = Math.max(0, v) + '%'; }
export function setCarry(txt) { const c = $('#carry'); c.classList.toggle('on', !!txt); c.innerHTML = txt || ''; }
export function hurt(on) { $('#vig').classList.toggle('hurt', on); }
export function fade(on) { $('#vig').classList.toggle('fade', on); }
