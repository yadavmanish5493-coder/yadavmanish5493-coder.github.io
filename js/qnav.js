/* Quick navigation (right edge): Resume = the wall with the resume board, All projects = the cassette ring, AI projects = the first project world (UNBOX), Art gallery = the start of the corridor, Contact = a panel of contact tiles (no jump).
   The jump is instant under a short dark fade, so the page never scrolls while the ninja moves. */
(() => {
  const nav = document.getElementById('qnav'), fade = document.getElementById('qnFade');
  if (!nav || !fade) return;
  const P = window.__page, root = document.documentElement, gal = document.getElementById('gallery');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RESUME_U = 1.15;                                       // the wall: the ninja has just come down to the ledge, the resume and ticker boards are in view
  const RING_U = 6.9;                                          // the cassette ring at rest (the handheld's "insert a cassette" screen scrolls here too)
  const target = {
    resume: () => (P.L1 + RESUME_U) * innerHeight,
    ring: () => (P.L1 + RING_U) * innerHeight,
    first: () => (P.L1 + (window.__hhSlideU ? window.__hhSlideU(0) : 9.6)) * innerHeight,
    gallery: () => gal.getBoundingClientRect().top + scrollY,
  };
  let busy = false;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  async function go(key) {
    if (busy || root.classList.contains('doc-open') || root.classList.contains('gal-open') || root.classList.contains('contact-open')) return;
    if (document.querySelector('#hhStage.playing')) return;
    busy = true;
    if (reduce) { scrollTo(0, target[key]()); if (window.__snapDescent) window.__snapDescent(); }
    else {
      fade.classList.add('on'); await wait(170);
      scrollTo(0, target[key]()); if (window.__snapDescent) window.__snapDescent(); await wait(300);
      fade.classList.remove('on'); await wait(220);
    }
    busy = false; mark();
  }
  nav.addEventListener('click', e => { const b = e.target.closest('.qn'); if (!b) return; if (b.dataset.go === 'contact') openContact(b); else go(b.dataset.go); });

  /* ---------- contact: tiles over the page; phone copies, email opens a new mail, LinkedIn opens the profile ---------- */
  const box = document.getElementById('contactBox'), phone = document.getElementById('ctPhone');
  let backTo = null;
  function openContact(from) {
    if (busy || !box.hidden) return;
    backTo = from; root.classList.add('contact-open');
    box.hidden = false; void box.offsetWidth; box.classList.add('shown');
    box.querySelector('.ct-close').focus({ preventScroll: true });
  }
  function closeContact() {
    if (box.hidden) return;
    root.classList.remove('contact-open'); box.classList.remove('shown');
    const f = () => { if (!box.classList.contains('shown')) box.hidden = true; };
    if (reduce) f(); else setTimeout(f, 220);
    if (backTo) backTo.focus({ preventScroll: true });
  }
  box.addEventListener('click', e => { if (e.target === box || e.target.closest('.ct-close')) closeContact(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !box.hidden) closeContact(); });
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (e) {                                                // older browsers / no permission: copy through a hidden field
      const t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;opacity:0;left:-9999px';
      document.body.appendChild(t); t.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e2) {} t.remove(); return ok;
    }
  }
  let copyT = 0;
  phone.addEventListener('click', async () => {
    const ok = await copy(phone.dataset.copy), h = phone.querySelector('.ct-h');
    h.textContent = ok ? 'Copied ✓' : phone.dataset.copy; phone.classList.toggle('copied', ok);
    clearTimeout(copyT); copyT = setTimeout(() => { h.textContent = 'Tap to copy'; phone.classList.remove('copied'); }, 1800);
  });
  const btns = [...nav.querySelectorAll('.qn')];
  let cur = null;
  function mark() {                                            // highlight the part of the page on screen
    const u = P.u, galTop = gal.getBoundingClientRect().top;
    const k = galTop < innerHeight * .5 ? 'gallery' : u > 8.7 ? 'first' : u > 5.3 ? 'ring' : u > 0.3 ? 'resume' : null;
    if (k === cur) return; cur = k;
    btns.forEach(b => { const on = b.dataset.go === k; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
  }
  addEventListener('scroll', mark, { passive: true }); addEventListener('resize', mark); mark();
})();
