/* ---------- ninja VFX: motion lines while it moves sideways, dust + rings when it jumps and lands ----------
   One screen-space canvas over the stage. Each frame it finds whichever ninja sprite is on screen (room run,
   descent, cassette ride or the intro leap), reads where its feet are, and turns its pose changes into effects:
   on the ground → in the air = take-off, in the air → on the ground = landing. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const stage = document.getElementById('stage');
  const cv = document.createElement('canvas'); cv.id = 'njfx'; cv.setAttribute('aria-hidden', 'true'); stage.appendChild(cv);
  const g = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1;
  const size = () => { DPR = Math.min(2, devicePixelRatio || 1); W = cv.width = Math.round(stage.clientWidth * DPR); H = cv.height = Math.round(stage.clientHeight * DPR); };
  size(); addEventListener('resize', size);

  const WALK = new Set(['walkR', 'walkSE', 'walkNE']);           // sideways walking sheets
  const shown = el => el && el.isConnected && el.style.display !== 'none' && el.style.visibility !== 'hidden' &&
                      (el.style.opacity === '' || +el.style.opacity > 0.05);
  // the ninja on screen now: [element, feet ratio within the cell, is it in the air]
  function current() {
    const S1 = window.__s1, SHEETS = S1 && S1.kit.SHEETS;
    for (const id of ['njCass', 'njDescent', 'njHop']) {
      const el = document.getElementById(id);
      if (!shown(el) || !el.dataset.sheet || !SHEETS) continue;
      const sp = SHEETS[el.dataset.sheet];
      return { el, feet: sp.fy / sp.h, figure: sp.H / sp.h, sheet: el.dataset.sheet, air: el.dataset.sheet === 'runR' };
    }
    for (const id of ['sprRun', 'sprIdle', 'sprBack']) {          // the intro (runs out of the monitor, leaps to the desk)
      const el = document.getElementById(id);
      if (!shown(el)) continue;
      return { el, feet: 325 / 380, figure: 287 / 380, sheet: id, air: (el.dataset.air || (id === 'sprIdle' ? '0' : document.getElementById('sprRun').dataset.air)) === '1' };
    }
    return null;
  }
  const flipOf = el => { const m = /scale\(([-\d.]+)/.exec(el.style.transform); return m && +m[1] < 0 ? -1 : 1; };

  const P = [];   // particles: {kind, x, y, vx, vy, age, life, ...}
  const JUMP_FX = 0.5;   // size of the take-off / landing effects relative to the ninja (1 was too big)
  const add = o => P.push(Object.assign({ age: 0, vx: 0, vy: 0 }, o));
  function takeOff(x, y, h) {
    h *= JUMP_FX;
    add({ kind: 'ring', x, y, r0: h * .12, r1: h * .55, life: .42, col: '159,243,255' });
    for (let i = 0; i < 7; i++) {
      const a = Math.PI + (i / 6) * Math.PI;                       // a half fan of dust, low and sideways
      add({ kind: 'dust', x, y, vx: Math.cos(a) * h * (.9 + Math.random() * .7), vy: -Math.abs(Math.sin(a)) * h * .5 - h * .1, r: h * (.05 + Math.random() * .05), life: .5 + Math.random() * .2, grav: h * 1.5 });
    }
    for (let i = 0; i < 3; i++) add({ kind: 'streak', x: x + (i - 1) * h * .12, y: y + h * .02, vx: 0, vy: h * 2.2, len: h * .28, life: .22, dir: [0, 1], col: '200,240,255' });
  }
  function land(x, y, h) {
    h *= JUMP_FX;
    add({ kind: 'flash', x, y: y - h * .2, r: h * .55, life: .16 });
    add({ kind: 'ring', x, y, r0: h * .1, r1: h * .95, life: .5, col: '255,75,224' });
    add({ kind: 'ring', x, y, r0: h * .05, r1: h * .6, life: .38, col: '159,243,255' });
    for (let i = 0; i < 12; i++) {
      const side = i % 2 ? 1 : -1;
      add({ kind: 'dust', x, y, vx: side * h * (1 + Math.random() * 1.6), vy: -h * (.15 + Math.random() * .45), r: h * (.05 + Math.random() * .07), life: .55 + Math.random() * .25, grav: h * 1.5 });
    }
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (Math.random() - .5) * 2.2;
      add({ kind: 'spark', x, y: y - h * .05, vx: Math.cos(a) * h * (1.5 + Math.random() * 1.5), vy: Math.sin(a) * h * (2 + Math.random() * 1.2), r: Math.max(1.2 * DPR, h * .018), life: .5 + Math.random() * .3, col: Math.random() < .5 ? '255,180,245' : '170,245,255', grav: h * 9 });
    }
  }
  function motionLines(x, y, h, dir) {                            // dir: the way the ninja is moving (screen)
    const n = 1 + (Math.random() < .5);
    for (let i = 0; i < n; i++) {
      const yy = y - h * (.15 + Math.random() * .7), x0 = x - dir * h * (.22 + Math.random() * .12);
      add({ kind: 'streak', x: x0, y: yy, vx: -dir * h * 1.4, vy: 0, len: h * (.3 + Math.random() * .4), life: .26 + Math.random() * .12, dir: [-dir, 0], col: Math.random() < .3 ? '255,170,240' : '220,245,255' });
    }
  }

  let prev = null, lastGround = null, lineClock = 0, last = performance.now(), drawn = false;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const N = current(), sr = stage.getBoundingClientRect();
    if (N) {
      const r = N.el.getBoundingClientRect();
      const x = (r.left + r.width / 2 - sr.left) * DPR, y = (r.top + r.height * N.feet - sr.top) * DPR, h = r.height * N.figure * DPR;
      const same = !!prev;   // one ninja: the sprite may change (intro → desk, descent → cassette) and a landing still counts
      if (same && h > 6 && x > -h && x < W + h) {
        if (!prev.air && N.air) takeOff(lastGround ? lastGround.x : prev.x, lastGround ? lastGround.y : prev.y, h);
        if (prev.air && !N.air) land(x, y, h);
        // sideways: walking sheets, or a jump that travels sideways
        const vx = (x - prev.x) / Math.max(dt, 1e-3);
        const sideways = (WALK.has(N.sheet) && N.sheet === prev.sheet) || (N.air && Math.abs(vx) > h * .6);
        if (sideways) {
          lineClock -= dt;
          if (lineClock <= 0) { lineClock = N.air ? .04 : .07; motionLines(x, y, h, Math.abs(vx) > h * .15 ? Math.sign(vx) : flipOf(N.el)); }
        }
      }
      if (!N.air) lastGround = { x, y };
      prev = { el: N.el, x, y, air: N.air, sheet: N.sheet };
    } else prev = null;

    if (P.length || drawn) {
      g.clearRect(0, 0, W, H); drawn = P.length > 0;
      for (let i = P.length - 1; i >= 0; i--) {
        const q = P[i]; q.age += dt;
        if (q.age >= q.life) { P.splice(i, 1); continue; }
        const k = q.age / q.life, fade = 1 - k;
        if (q.grav) { q.vy += q.grav * dt; q.vx *= 1 - dt * 3; }
        q.x += q.vx * dt; q.y += q.vy * dt;
        if (q.kind === 'ring') {
          const rr = q.r0 + (q.r1 - q.r0) * (1 - (1 - k) * (1 - k));
          g.strokeStyle = `rgba(${q.col},${(.75 * fade).toFixed(3)})`; g.lineWidth = Math.max(1, DPR * 1.4 * fade);
          g.beginPath(); g.ellipse(q.x, q.y, rr, rr * .22, 0, 0, Math.PI * 2); g.stroke();
        } else if (q.kind === 'dust') {
          const rr = q.r * (1 + k * 1.6), gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, rr);
          gr.addColorStop(0, `rgba(196,178,255,${(.42 * fade).toFixed(3)})`); gr.addColorStop(1, 'rgba(196,178,255,0)');
          g.fillStyle = gr; g.fillRect(q.x - rr, q.y - rr, rr * 2, rr * 2);
        } else if (q.kind === 'spark') {
          g.fillStyle = `rgba(${q.col},${fade.toFixed(3)})`; g.beginPath(); g.arc(q.x, q.y, q.r, 0, Math.PI * 2); g.fill();
        } else if (q.kind === 'flash') {
          const gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r);
          gr.addColorStop(0, `rgba(255,255,255,${(.5 * fade).toFixed(3)})`); gr.addColorStop(.4, `rgba(159,243,255,${(.22 * fade).toFixed(3)})`); gr.addColorStop(1, 'rgba(159,243,255,0)');
          g.fillStyle = gr; g.fillRect(q.x - q.r, q.y - q.r, q.r * 2, q.r * 2);
        } else if (q.kind === 'streak') {                          // bright at the head, fading tail
          const tx = q.x + q.dir[0] * q.len * (.6 + .4 * k), ty = q.y + q.dir[1] * q.len * (.6 + .4 * k);
          const gr = g.createLinearGradient(q.x, q.y, tx, ty);
          gr.addColorStop(0, `rgba(${q.col},${(.8 * fade).toFixed(3)})`); gr.addColorStop(1, `rgba(${q.col},0)`);
          g.strokeStyle = gr; g.lineWidth = Math.max(1, DPR * 1.6); g.lineCap = 'round';
          g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(tx, ty); g.stroke();
        }
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.__fx = { P, takeOff, land };   // debug: fire an effect by hand
})();
