/* Design-document book: a PDF shown as a page-turning book over the open game (pdf.js loaded on first use). */
(() => {
  const box = document.getElementById('hhBook');
  if (!box) return;
  const stage = box.querySelector('.bk-stage'), book = box.querySelector('.bk-book');
  const elL = box.querySelector('.bk-l'), elR = box.querySelector('.bk-r'), leaf = box.querySelector('.bk-leaf');
  const lf = leaf.querySelector('.bk-front'), lb = leaf.querySelector('.bk-back');
  const prev = box.querySelector('.bk-prev'), next = box.querySelector('.bk-next'), count = box.querySelector('.bk-count');
  const closeBtn = box.querySelector('.bk-close'), titleEl = box.querySelector('.bk-title'), msg = box.querySelector('.bk-msg');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PDFJS = 'js/pdf.min.js', WORKER = 'js/pdf.worker.min.js';
  let pdf = null, N = 0, asp = .7, loadingFor = null, isOpen = false, onClose = null;
  let started = false, spread = 0, single = false, pw = 0, ph = 0, busy = false, dpr = 1;
  const cache = new Map();                               // "n@h" -> rendered canvas
  const jobs = new Map();                                // "n@h" -> promise

  function loadLib() {
    if (window.pdfjsLib) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = PDFJS; s.onload = res; s.onerror = () => rej(new Error('pdf.js missing'));
      document.head.appendChild(s);
    });
  }
  async function load(url) {
    if (pdf && loadingFor === url) return;
    loadingFor = url; msg.textContent = 'Opening the book…'; msg.hidden = false;
    try {
      await loadLib();
      pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER;
      pdf = await pdfjsLib.getDocument({ url, disableAutoFetch: false }).promise;
      N = pdf.numPages;
      const p1 = await pdf.getPage(1), v = p1.getViewport({ scale: 1 });
      asp = v.width / v.height;
      msg.hidden = true;
    } catch (e) { pdf = null; loadingFor = null; msg.textContent = 'The design document could not be opened.'; }
  }

  /* ---- sizing: two pages side by side when they fit, otherwise one ---- */
  function layout() {
    const W = stage.clientWidth - 12, H = stage.clientHeight - 8;
    const hTwo = Math.min(H, W / (2 * asp)), hOne = Math.min(H, W / asp);
    const wasSingle = single;
    single = hTwo < .62 * hOne;
    ph = Math.floor(single ? hOne : hTwo); pw = Math.floor(ph * asp);
    book.style.width = (single ? pw : pw * 2) + 'px'; book.style.height = ph + 'px';
    book.style.setProperty('--pw', pw + 'px');
    box.classList.toggle('single', single);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    if (wasSingle !== single) spread = single ? Math.max(1, Math.min(N, spread * 2 + (spread ? 0 : 1))) : Math.floor(spread / 2);
    cache.clear(); jobs.clear();
  }

  /* ---- rendering ---- */
  const key = n => n + '@' + ph;
  function renderPage(n) {
    const k = key(n);
    if (cache.has(k)) return Promise.resolve(cache.get(k));
    if (jobs.has(k)) return jobs.get(k);
    const hh = ph;
    const job = pdf.getPage(n).then(page => {
      const v0 = page.getViewport({ scale: 1 });
      const scale = Math.min(pw / v0.width, ph / v0.height) * dpr, v = page.getViewport({ scale });
      const c = document.createElement('canvas'); c.width = Math.round(pw * dpr); c.height = Math.round(ph * dpr);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
      x.save(); x.translate((c.width - v.width) / 2, (c.height - v.height) / 2);
      return page.render({ canvasContext: x, viewport: v, transform: null }).promise.then(() => {
        x.restore();
        if (hh === ph) { cache.set(k, c); if (cache.size > 12) cache.delete(cache.keys().next().value); }
        jobs.delete(k); return c;
      });
    }).catch(() => { jobs.delete(k); return null; });
    jobs.set(k, job); return job;
  }
  // fill a page element (a .bk-pg) with page n; n outside 1..N leaves it empty
  function fill(el, n) {
    el.replaceChildren(); el.dataset.n = n; el.classList.toggle('empty', n < 1 || n > N);
    if (n < 1 || n > N) return Promise.resolve();
    el.classList.add('wait');
    return renderPage(n).then(c => {
      if (el.dataset.n != n || !c) return;
      const cv = document.createElement('canvas'); cv.width = c.width; cv.height = c.height;
      cv.getContext('2d').drawImage(c, 0, 0); el.replaceChildren(cv); el.classList.remove('wait');
    });
  }
  const pagesOf = s => single ? [s] : [2 * s, 2 * s + 1];
  const maxS = () => single ? N : Math.floor(N / 2);
  const minS = () => single ? 1 : 0;

  function show(s) {
    spread = Math.max(minS(), Math.min(maxS(), s));
    const [a, b] = pagesOf(spread);
    if (single) { fill(elR, a); elL.replaceChildren(); elL.className = 'bk-pg bk-l empty'; elR.classList.remove('empty'); }
    else { fill(elL, a); fill(elR, b); }
    book.classList.toggle('cover', !single && spread === 0);
    prev.disabled = spread <= minS(); next.disabled = spread >= maxS();
    count.textContent = single ? `${spread} / ${N}` : (spread === 0 ? `1 / ${N}` : `${a}${b <= N ? '–' + b : ''} / ${N}`);
    prefetch();
  }
  function prefetch() {
    [spread + 1, spread - 1].forEach(s => { if (s >= minS() && s <= maxS()) pagesOf(s).forEach(n => { if (n >= 1 && n <= N) renderPage(n); }); });
  }

  /* ---- turning ---- */
  function flip(dir) {
    if (busy || !pdf) return;
    const to = spread + dir; if (to < minS() || to > maxS()) return;
    if (reduce) { show(to); return; }
    busy = true;
    const done = () => { leaf.hidden = true; leaf.className = 'bk-leaf'; leaf.style.transition = ''; busy = false; show(to); };
    if (single) {                                          // one page: the page slides out, the next slides in
      leaf.hidden = false; leaf.className = 'bk-leaf slide'; lf.className = 'bk-pg bk-front'; lb.className = 'bk-pg bk-back'; lb.replaceChildren();
      fill(lf, spread); fill(elR, to);
      leaf.style.transform = 'translateX(0)'; leaf.style.opacity = 1;
      void leaf.offsetWidth;
      leaf.style.transition = 'transform .32s ease, opacity .32s ease';
      leaf.style.transform = `translateX(${-dir * 40}%)`; leaf.style.opacity = 0;
      setTimeout(() => { leaf.style.transition = ''; leaf.style.transform = ''; leaf.style.opacity = ''; leaf.hidden = true; leaf.className = 'bk-leaf'; busy = false; show(to); }, 340);
      return;
    }
    const [cl, cr] = pagesOf(spread), [nl, nr] = pagesOf(to);
    leaf.hidden = false; lf.className = lb.className = 'bk-pg';
    if (dir > 0) {                                         // right page lifts and lands on the left
      leaf.className = 'bk-leaf fwd'; fill(lf, cr); fill(lb, nl); fill(elR, nr);
      elR.classList.toggle('empty', nr > N);
    } else {                                               // left page lifts and lands on the right
      leaf.className = 'bk-leaf back'; fill(lf, cl); fill(lb, nr); fill(elL, nl);
      elL.classList.toggle('empty', nl < 1);
    }
    leaf.style.transform = 'rotateY(0deg)';
    void leaf.offsetWidth;
    leaf.style.transition = 'transform .7s cubic-bezier(.45,.05,.25,1)';
    leaf.style.transform = `rotateY(${dir > 0 ? -180 : 180}deg)`;
    const end = () => { leaf.removeEventListener('transitionend', end); clearTimeout(t); leaf.style.transform = ''; done(); };
    const t = setTimeout(end, 800);
    leaf.addEventListener('transitionend', end, { once: true });
  }

  /* ---- open / close ---- */
  async function open(url, title, closed) {
    if (isOpen) return;
    isOpen = true; onClose = closed || null; titleEl.textContent = title || 'Design document';
    box.hidden = false; box.classList.remove('shut'); void box.offsetWidth; box.classList.add('shown');
    box.focus({ preventScroll: true });
    await load(url);
    if (!isOpen || !pdf) return;
    layout(); show(started ? spread : 0); started = true;
    box.focus({ preventScroll: true });
  }
  function close() {
    if (!isOpen) return;
    isOpen = false; box.classList.remove('shown');
    const f = () => { if (!isOpen) box.hidden = true; };
    if (reduce) f(); else setTimeout(f, 260);
    if (onClose) onClose();
  }
  closeBtn.addEventListener('click', close);
  prev.addEventListener('click', () => flip(-1));
  next.addEventListener('click', () => flip(1));
  elR.addEventListener('click', () => { if (single) flip(1); else if (!elR.classList.contains('empty')) flip(1); });
  elL.addEventListener('click', () => { if (!single && !elL.classList.contains('empty')) flip(-1); });
  box.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { flip(1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { flip(-1); e.preventDefault(); }
  });
  let tx = null;                                            // swipe to turn
  box.addEventListener('touchstart', e => { tx = e.touches.length === 1 ? [e.touches[0].clientX, e.touches[0].clientY] : null; }, { passive: true });
  box.addEventListener('touchend', e => {
    if (!tx) return; const t = e.changedTouches[0], dx = t.clientX - tx[0], dy = t.clientY - tx[1]; tx = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4) flip(dx < 0 ? 1 : -1);
  }, { passive: true });
  new ResizeObserver(() => { if (isOpen && pdf && !busy) { layout(); show(spread); } }).observe(stage);

  /* ---- a web page (the Wix design document) as a scrolling overlay: over the game (#hhSite) or, for doc-only cassettes, over the whole stage (#docPane) ---- */
  // Wix lays out for a desktop width: on a narrower overlay render it at 1280px and scale it down to fit (very narrow phones keep Wix's own mobile layout)
  const VW = 1280;
  function mkSite(site, minWFor) {   // minWFor(url): on a narrower overlay render that page at this width and scale it down (pages that clip below their own design width)
    const sf = site.querySelector('iframe'), sMsg = site.querySelector('.bk-msg'), sFrame = site.querySelector('.st-frame');
    let open = false, closed = null, minW = 0;
    function show(url, title, cb, asPdf) {
      if (open) return;
      open = true; closed = cb || null; minW = minWFor ? minWFor(url) : 0;
      site.querySelector('.bk-title').textContent = title || 'Design document';
      site.querySelector('.st-ext').href = url;
      sMsg.hidden = false; sf.onload = () => { sMsg.hidden = true; };
      if (asPdf) { sf.onload = null; sf.dataset.url = ''; sf.removeAttribute('src'); }     // a PDF is drawn by pdf.js (openPdf), not by the iframe
      else if (sf.dataset.url !== url) { sf.dataset.url = url; sf.src = url; } else sMsg.hidden = true;
      site.hidden = false; void site.offsetWidth; fit(); site.classList.add('shown'); site.focus({ preventScroll: true });
    }
    function hide() {
      if (!open) return;
      open = false; site.classList.remove('shown');
      const f = () => { if (!open) site.hidden = true; };
      if (reduce) f(); else setTimeout(f, 260);
      if (closed) closed();
    }
    function fit() {
      const w = sFrame.clientWidth, h = sFrame.clientHeight; if (!w || !h) return;
      const k = w < VW && w >= 560 ? w / VW : minW && w < minW ? w / minW : 1;
      sf.style.width = (w / k) + 'px'; sf.style.height = (h / k) + 'px'; sf.style.transform = k < 1 ? `scale(${k})` : '';
    }
    site.querySelector('.bk-close').addEventListener('click', hide);
    new ResizeObserver(fit).observe(sFrame);
    return { show, hide, get isOpen() { return open; } };
  }
  const gameSite = mkSite(document.getElementById('hhSite'));
  // doc-only cassettes (no game, no world): the same page in a pane built from #hhSite's markup, appended to the page stage
  const pane = document.getElementById('hhSite').cloneNode(true);
  pane.id = 'docPane'; pane.hidden = true; pane.classList.remove('shown');
  pane.querySelector('.bk-close').setAttribute('aria-label', 'Close the design document');
  pane.querySelector('iframe').removeAttribute('src'); pane.querySelector('iframe').removeAttribute('data-url');
  document.getElementById('stage').appendChild(pane);
  const docSite = mkSite(pane, u => (/\.wixsite\.com/.test(u) ? 0 : 820));   // Wix keeps its own mobile layout; other sites (the Framer page) need their tablet layout, scaled
  addEventListener('keydown', e => { if (e.key === 'Escape' && docSite.isOpen) closeDoc(); });
  const holder = document.createElement('div'); holder.className = 'st-pdf'; holder.tabIndex = 0; holder.setAttribute('aria-label', 'Resume');
  pane.querySelector('.st-frame').appendChild(holder);
  const extLink = pane.querySelector('.st-ext'), pMsg = pane.querySelector('.bk-msg');
  let pdfToken = 0;
  async function drawPdf(url) {                                  // every page of the PDF as a canvas, fitted to the pane's width
    const tok = ++pdfToken; holder.textContent = ''; pMsg.textContent = 'Opening the resume…'; pMsg.hidden = false;
    try {
      await loadLib(); pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER;
      const doc = await pdfjsLib.getDocument({ url }).promise;
      const w = Math.min(980, holder.clientWidth - 20), ratio = Math.min(3, (window.devicePixelRatio || 1) * 1.5);
      for (let n = 1; n <= doc.numPages; n++) {
        const page = await doc.getPage(n), k = w / page.getViewport({ scale: 1 }).width, vp = page.getViewport({ scale: k * ratio });
        const cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
        cv.style.width = Math.round(vp.width / ratio) + 'px'; cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Resume, page ' + n);
        await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
        if (tok !== pdfToken) return;
        holder.appendChild(cv); pMsg.hidden = true;
      }
    } catch (e) { if (tok === pdfToken) { pMsg.textContent = 'The resume could not be opened here. Use "open / download" above.'; pMsg.hidden = false; } }
  }
  function openPdf(url, title, closed) {                         // a PDF in the same pane (the resume)
    if (docSite.isOpen) return;
    pane.classList.add('pdf-mode'); extLink.textContent = 'open / download ↗';
    document.documentElement.classList.add('doc-open');
    docSite.show(url, title, () => { document.documentElement.classList.remove('doc-open'); pdfToken++; if (closed) closed(); }, true);
    drawPdf(url); holder.scrollTop = 0;
  }
  function openDoc(url, title, closed) {
    pane.classList.remove('pdf-mode'); extLink.textContent = 'open in new tab ↗'; pMsg.textContent = 'Loading the design document…';
    document.documentElement.classList.add('doc-open');      // the page doesn't scroll behind the document
    docSite.show(url, title, () => { document.documentElement.classList.remove('doc-open'); if (closed) closed(); });
  }
  function closeDoc() { docSite.hide(); }

  // the digital RESUME board on the wall band opens the resume PDF in this pane
  const rb = document.getElementById('resumeBoard');
  if (rb) {
    const RESUME = 'assets/ManishYadav_Resume.pdf';   // replace this file to update the resume
    const openResume = () => openPdf(RESUME, 'Resume · Manish Yadav', () => rb.focus({ preventScroll: true }));
    rb.addEventListener('click', openResume);
    rb.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openResume(); } });
  }

  window.__book = { open, openSite: gameSite.show, openDoc, openPdf, close() { close(); gameSite.hide(); closeDoc(); }, get isOpen() { return isOpen || gameSite.isOpen || docSite.isOpen; } };
})();
