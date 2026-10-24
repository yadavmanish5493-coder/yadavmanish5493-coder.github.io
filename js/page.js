/* ===== page: scroll → which part of the building is on screen =====
   u = viewport-heights scrolled after the room scene (16 screens). The column slides between views,
   and holds still while the ninja moves (the scroll and the ninja never move at the same time). */
window.__page = (() => {
  const L1 = 16;
  const PH = { T1: [0, 0.6], W1: [0.6, 3.6], T2: [3.6, 4.2], W2: [4.2, 4.7], T3: [4.7, 5.3], VR: [5.3, 8.5], T4: [8.6, 9.2], HH: [9.2, 10] };
  const stage = document.getElementById('stage'), column = document.getElementById('column'), band = document.getElementById('eduBand');
  const ease = t => t * t * (3 - 2 * t), clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const st = { u: 0, V: 0, Vt: 0 };
  function target() {
    const vh = stage.clientHeight, bandH = band.offsetHeight;
    const V1 = Math.min(vh, bandH + (+band.dataset.extra || 0)), V2 = vh, V3 = vh + bandH;   // boards (no cassettes yet; the boards may sit a little below the band) · board 2 + front cassettes · cassette room
    const u = st.u = scrollY / vh - L1;
    const k = (p, a) => ease(clamp((u - a[0]) / (a[1] - a[0])));
    if (u <= PH.T1[0]) return 0;
    if (u < PH.T1[1]) return V1 * k(u, PH.T1);
    if (u < PH.T2[0]) return V1;
    if (u < PH.T2[1]) return V1 + (V2 - V1) * k(u, PH.T2);
    if (u < PH.T3[0]) return V2;
    if (u < PH.T3[1]) return V2 + (V3 - V2) * k(u, PH.T3);
    if (u < PH.T4[0]) return V3;
    if (u < PH.T4[1]) return V3 + vh * k(u, PH.T4);   // slide down to the handheld universe
    return V3 + vh;
  }
  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    st.Vt = target();
    st.V += (st.Vt - st.V) * (1 - Math.exp(-dt * 12));
    if (Math.abs(st.Vt - st.V) < 0.3) st.V = st.Vt;
    column.style.transform = `translate3d(0,${(-st.V).toFixed(1)}px,0)`;
    requestAnimationFrame(tick);
  }
  st.V = target(); requestAnimationFrame(tick);
  return { get u() { return st.u; }, get V() { return st.V; }, L1, PH };
})();
