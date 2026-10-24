/* Unbox: the two game boards and the two scoring cards, redrawn as crisp vector art (SVG strings).
   Each drawing lives in the pixel space of the original board image from the design document (B1 649x457, B2 676x451,
   score cards 722x511 / 706x500), so the slot rectangles and scoring-dot coordinates in index.html line up with it. */
window.UNBOX_ART = (() => {
const INK = '#14102e', Y = '#ffd21f', NAVY = '#16206b', RED = '#c8102e';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

/* text: lines split on \n, centred on x by default */
function T(x, y, str, o = {}) {
  const { size = 7, fill = '#fff', weight = 800, anchor = 'middle', font = 'Nunito,system-ui,sans-serif', style = '', lh = 1.18, ls = 0, extra = '' } = o;
  const lines = String(str).split('\n');
  return `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${weight}" font-style="${style || 'normal'}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${ls}" ${extra}>` +
    lines.map((l, i) => `<tspan x="${x}" dy="${i ? size * lh : 0}">${esc(l)}</tspan>`).join('') + '</text>';
}
/* a yellow comic ribbon with a hard black shadow */
function ribbon(x, y, w, h, str, size = 9, o = {}) {
  const n = String(str).split('\n').length, cy = y + h / 2 - ((n - 1) * size * 1.05) / 2 + size * .36;
  return `<rect x="${x + 2}" y="${y + 2}" width="${w}" height="${h}" fill="#0a0a0a"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${o.fill || Y}" stroke="#0a0a0a" stroke-width="1.6"/>` +
    T(x + w / 2, cy, str, { size, fill: INK, font: 'Bangers,Impact,sans-serif', weight: 400, ls: .35, lh: 1.05, style: o.style || '' });
}
/* the shared dark sunburst backdrop with halftone corners and white lightning lines */
function backdrop(p, W, H) {
  const cx = W * .5, cy = H * .55, n = 40, R = Math.hypot(W, H); let rays = '';
  for (let i = 0; i < n; i += 2) {
    const a0 = i / n * 6.2832, a1 = (i + 1) / n * 6.2832;
    rays += `<path d="M${cx} ${cy}L${(cx + R * Math.cos(a0)).toFixed(1)} ${(cy + R * Math.sin(a0)).toFixed(1)}L${(cx + R * Math.cos(a1)).toFixed(1)} ${(cy + R * Math.sin(a1)).toFixed(1)}Z"/>`;
  }
  const zig = (x0, dir) => `<path d="M${x0} ${H * .3}L${x0 + dir * 26} ${H * .5}L${x0} ${H * .7}M${x0} ${H * .36}L${x0 + dir * 16} ${H * .5}L${x0} ${H * .64}" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="1.1"/>`;
  return `<defs>
    <radialGradient id="${p}bg" cx=".5" cy=".55" r=".8"><stop offset="0" stop-color="#14506e"/><stop offset="1" stop-color="#07203a"/></radialGradient>
    <pattern id="${p}ht" width="5.2" height="5.2" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="2.6" cy="2.6" r="1.05" fill="#7fd8ee"/></pattern>
    <radialGradient id="${p}vg" cx=".5" cy=".5" r=".72"><stop offset=".5" stop-color="#000"/><stop offset="1" stop-color="#fff"/></radialGradient>
    <mask id="${p}mk"><rect width="${W}" height="${H}" fill="url(#${p}vg)"/></mask>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#${p}bg)"/>
  <g fill="#a8ecf6" opacity=".11">${rays}</g>
  <rect width="${W}" height="${H}" fill="url(#${p}ht)" mask="url(#${p}mk)" opacity=".4"/>
  ${zig(2, 1)}${zig(W - 2, -1)}
  <path d="M${W * .36} ${H} L${W * .42} ${H * .86} L${W * .47} ${H}M${W * .6} 0L${W * .66} ${H * .1}L${W * .71} 0" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1"/>`;
}
/* the Unbox logo: yellow comic lettering with a dark outline, a red drop shadow and two lightning bolts */
function logo(x, y, s = 1) {
  const bolt = (tx, ty, r) => `<path transform="translate(${tx} ${ty}) rotate(${r})" d="M7 0L0 14h5L2 24 12 9H7z" fill="${Y}" stroke="#2a1500" stroke-width="1.4" stroke-linejoin="round"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})">${bolt(44, -2, 14)}${bolt(56, 2, 22)}
    <text x="3" y="45" font-family="Bangers,Impact,sans-serif" font-size="46" fill="#e8742c" stroke="#2a1500" stroke-width="3.4" stroke-linejoin="round" textLength="84" lengthAdjust="spacingAndGlyphs">Unbox</text>
    <text x="0" y="42" font-family="Bangers,Impact,sans-serif" font-size="46" fill="${Y}" stroke="#2a1500" stroke-width="3" stroke-linejoin="round" paint-order="stroke" textLength="84" lengthAdjust="spacingAndGlyphs">Unbox</text></g>`;
}
function bdl(cx, cy, r) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${Y}"/><circle cx="${cx}" cy="${cy}" r="${r * .86}" fill="none" stroke="#d99a00" stroke-width=".8"/>
    <path d="M${cx - r * .42} ${cy - r * .56}v${r * 1.12}M${cx - r * .42} ${cy + r * .02}a${r * .34} ${r * .34} 0 1 1 0 ${r * .5}M${cx + r * .42} ${cy - r * .56}v${r * 1.12}M${cx + r * .42} ${cy + r * .02}a${r * .34} ${r * .34} 0 1 0 0 ${r * .5}" fill="none" stroke="${INK}" stroke-width="${r * .17}" stroke-linecap="round"/>` +
    T(cx, cy + r + 8.5, 'Business Design Lab', { size: 5.2, fill: '#cfe9f7', weight: 700 });
}
/* defs shared by the boards: green frame + teal tactic cards */
function boardDefs(p) {
  return `<defs>
    <linearGradient id="${p}gr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3f9558"/><stop offset="1" stop-color="#2f7f49"/></linearGradient>
    <pattern id="${p}gp" width="4.4" height="4.4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="2.2" cy="2.2" r=".85" fill="#9bdca0" opacity=".45"/></pattern>
    <linearGradient id="${p}cd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f6a6c"/><stop offset="1" stop-color="#0a4457"/></linearGradient>
    <linearGradient id="${p}cb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1480a3"/><stop offset="1" stop-color="#0c5a7e"/></linearGradient>
    <filter id="${p}sh" x="-10%" y="-10%" width="125%" height="125%"><feDropShadow dx="1.2" dy="1.6" stdDeviation="1.2" flood-color="#000" flood-opacity=".5"/></filter></defs>`;
}
const card = (p, x, y, w, h, fill = 'cd') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="url(#${p}${fill})" stroke="#c9f0e6" stroke-width="1.3" filter="url(#${p}sh)"/>`;
const dot = (x, y, c) => `<circle cx="${x}" cy="${y}" r="3.6" fill="${c}" stroke="#d8f4ee" stroke-width=".9"/>`;
const tag = (x, y, s, c = '#ffc82e') => T(x, y, s, { size: 5.6, fill: c, weight: 900, style: 'italic', lh: 1.15 });
const sub = (x, y, s) => T(x, y, s, { size: 5.6, fill: '#eaf8f6', weight: 700, lh: 1.25 });
const frosted = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="11" fill="#dcecf8" fill-opacity=".52" stroke="#fff" stroke-opacity=".85" stroke-width="1.4"/>`;
const wrap = svg => svg;

/* ---------------- board 1: strategy and tactics (649 x 457) ---------------- */
function board1() {
  const p = 'ua';
  return `<svg viewBox="0 0 649 457" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Unbox board 1: strategy and tactics" preserveAspectRatio="xMidYMid meet">
  ${backdrop(p, 649, 457)}${boardDefs(p)}${logo(30, 14)}
  <!-- left glass panels -->
  ${frosted(20, 55, 115, 122)}${frosted(20, 190, 115, 121)}${frosted(20, 325, 115, 121)}
  ${[['CHALLENGE', 'Choose your challenge or\nFrame your own', 55, 177], ['PRODUCT', 'Your offer to the world', 190, 311], ['CUSTOMER SEGMENT', 'Your target customer', 325, 446]].map(([t, s, y0, y1]) => {
    const m = (y0 + y1) / 2; return T(77.5, m - 4, t, { size: 11.5, fill: '#15263f', font: 'Bangers,Impact,sans-serif', weight: 400, ls: .3, style: 'italic' }) + T(77.5, m + 6.5, s, { size: 5.4, fill: '#1d3550', weight: 700 }) + T(77.5, y1 - 22, 'Place your card/tile', { size: 5.4, fill: '#1d3550', weight: 700 });
  }).join('')}
  <!-- strategy frame -->
  <rect x="143" y="17" width="394" height="250" fill="#0a0a0a"/><rect x="147" y="21" width="386" height="242" fill="url(#${p}gr)"/><rect x="147" y="21" width="386" height="242" fill="url(#${p}gp)"/>
  <g stroke="#e8b02e" stroke-width=".9" opacity=".9" fill="none"><path d="M247 23V260M344 23V260M440 23V260M149 23H531"/><path d="M148 160 L246 118M345 190 L439 150" opacity=".5"/></g>
  ${ribbon(222, 13, 240, 17, 'CRAFT YOUR STRATEGY - CREATE YOUR SECRET SAUCE', 10.6)}
  ${ribbon(160, 37, 78, 23, 'ETHICAL SUPPLY CHAIN\nAND PARTNER NETWORKS', 6.1)}
  ${ribbon(354, 37, 79, 23, 'RESPONSIBLE VALUE\nPROPOSITION DESIGN', 6.1)}
  ${T(295, 44, 'PROCESS INNOVATION', { size: 6.2, fill: '#fff', style: 'italic', weight: 900 })}
  ${T(487, 37.5, 'CUSTOMER ENGAGEMENT\nINNOVATION', { size: 6.2, fill: '#fff', style: 'italic', weight: 900 })}
  ${T(295, 155, 'ORGANISATION STRUCTURE\nINNOVATION', { size: 6.2, fill: '#fff', style: 'italic', weight: 900 })}
  ${T(487, 167, 'CHANNEL INNOVATION', { size: 6.2, fill: '#fff', style: 'italic', weight: 900 })}
  ${card(p, 160, 63, 80, 180)}${card(p, 354, 63, 79, 180)}${card(p, 255, 51, 80, 84)}${card(p, 447, 51, 80, 84)}${card(p, 255, 173, 80, 84)}${card(p, 447, 173, 80, 84)}
  ${dot(231, 72, '#59b8e8')}${dot(326, 60, '#e0336b')}${dot(425, 72, '#14a899')}${dot(519, 60, '#4a6fe0')}${dot(326, 182, '#e8604c')}${dot(519, 182, '#f2a31b')}
  ${tag(200, 77, 'NETWORK\nTACTIC')}${sub(200, 106, 'Partners and\ncollaborators')}
  ${tag(200, 168, 'SUPPLY CHAIN\nTACTIC')}${sub(200, 197, 'Value Co-creator\nand delivery\nsuccess')}
  ${tag(295, 66, 'PROCESS\nTACTIC')}${sub(295, 93, 'Key activity\nand process')}
  ${tag(295, 188, 'STRUCTURE\nTACTIC')}${sub(295, 213, 'Teams and\norganisations')}
  ${tag(393, 77, 'ECO DESIGN\nTACTIC')}${sub(393, 106, 'Responsible\ndesigns')}
  ${tag(393, 168, 'CIRCULAR MATERIAL\nAND ENERGY TACTIC')}${sub(393, 197, 'Responsible\nmaterials')}
  ${tag(487, 66, 'ENGAGEMENT\nTACTIC')}${sub(487, 93, '')}
  ${tag(487, 188, 'CHANNEL\nTACTIC')}${sub(487, 213, 'Value delivery\nand experience')}
  <!-- profit and social mission -->
  <rect x="191" y="263" width="303" height="111" fill="#0a0a0a"/><rect x="195" y="267" width="295" height="103" fill="url(#${p}gr)"/><rect x="195" y="267" width="295" height="103" fill="url(#${p}gp)"/>
  <path d="M200 372 L258 318M404 372 L470 305" stroke="#e8b02e" stroke-width=".9" opacity=".55" fill="none"/>
  ${ribbon(277, 260, 130, 16, 'PROFIT AND SOCIAL MISSION', 9.4)}
  ${T(218, 316, 'ADOPT A\nSOCIAL\nMISSION', { size: 6.2, fill: '#fff', style: 'italic', weight: 900 })}${T(468, 316, 'REVENUE\nMODEL\nINNOVATION', { size: 6.2, fill: '#fff', style: 'italic', weight: 900 })}
  ${card(p, 241, 278, 201, 84)}${dot(433, 288, '#9b3fc4')}
  ${tag(290, 292, 'SOCIAL MISSION\nTACTIC')}${sub(290, 318, 'Social\nresponsibility')}${tag(392, 292, 'REVENUE\nTACTIC')}${sub(392, 318, 'Value\nrealisation')}
  <!-- top 3 -->
  ${ribbon(553, 31, 80, 27, 'YOUR TOP 3\nINNOVATION', 9.4)}
  ${[[62, 140], [176, 261], [297, 382]].map(([a, b]) => `<rect x="550" y="${a}" width="80" height="${b - a}" rx="9" fill="#e6dc9e" stroke="#fff" stroke-width="1.6"/>`).join('')}
  ${T(590, 99, 'Choose your combination of\ntactics and create your\nsecret sauce', { size: 5.2, fill: '#2a2440', weight: 700 })}
  <!-- strategy statement -->
  <rect x="162" y="394" width="362" height="55" rx="6" fill="#3da4d8" fill-opacity=".55" stroke="#fff" stroke-opacity=".7" stroke-width="1.2"/>
  <path d="M170 449 L215 402 L262 449 M330 449 L372 404 L416 449 M440 449 L478 410 L518 449" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.2"/>
  ${ribbon(249, 387, 187, 15, 'SECRET SAUCE AND STRATEGY STATEMENT', 8.6)}
  ${T(343, 428, 'Your strategy for a statement, your angle, your brand, your position in the world', { size: 5, fill: '#e8f6ff', weight: 700 })}
  ${bdl(589, 419, 16)}
  </svg>`;
}

/* ---------------- board 2: assumption finder and experiment design (676 x 451) ---------------- */
function board2() {
  const p = 'ub';
  const cols = [[30, 114], [130, 215], [231, 315], [329, 414]];
  const hd = (x, y, s) => T(x, y, s, { size: 6.1, fill: '#fff', style: 'italic', weight: 900, lh: 1.1 });
  const filler = (x0, y0, x1, y1) => T((x0 + x1) / 2, (y0 + y1) / 2 - 3, 'Your assumption\nstatement', { size: 5.6, fill: '#e6f4ee', weight: 700, lh: 1.2 }) + T((x0 + x1) / 2, (y0 + y1) / 2 + 9, 'Place post-it here', { size: 5.2, fill: '#9fc9bf', weight: 700 });
  const cards = [];
  [[0, 112, 197, 1], [1, 112, 197, 1], [2, 112, 197, 1], [3, 112, 197, 1], [0, 224, 295, 0], [1, 224, 295, 1], [2, 224, 295, 0], [3, 224, 295, 1]].forEach(([c, y0, y1, f]) => {
    cards.push(card(p, cols[c][0], y0, cols[c][1] - cols[c][0], y1 - y0) + (f ? filler(cols[c][0], y0, cols[c][1], y1) : ''));
  });
  [[27, 112, 1], [130, 215, 0], [227, 312, 1], [329, 414, 0]].forEach(([a, b, f]) => cards.push(card(p, a, 332, 85, 75) + (f ? filler(a, 332, a + 85, 407) : '')));
  return `<svg viewBox="0 0 676 451" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Unbox board 2: assumption finder and experiment design" preserveAspectRatio="xMidYMid meet">
  ${backdrop(p, 676, 451)}${boardDefs(p)}${logo(32, 16)}
  <rect x="18" y="77" width="407" height="339" fill="#0a0a0a"/><rect x="20" y="79" width="403" height="335" fill="url(#${p}gr)"/><rect x="20" y="79" width="403" height="335" fill="url(#${p}gp)"/>
  <rect x="20.5" y="79.5" width="402" height="334" fill="none" stroke="#e8b02e" stroke-width="1.3"/>
  <g stroke="#e8b02e" stroke-width="1.1" fill="none"><path d="M122 79V414M223 79V414M323 79V308M20 308H423M122 204H223M323 204H423"/><path d="M30 300 L118 240M250 330 L320 400" opacity=".4"/></g>
  ${ribbon(98, 67, 248, 16, 'ASSUMPTION FINDER AND EXPERIMENT DESIGN', 10)}
  ${hd(72, 94, 'PARTNER\nASSUMPTION')}${hd(172.5, 94, 'PROCESS\nASSUMPTION')}${hd(273, 94, 'VALUE PROPOSITION\nASSUMPTION')}${hd(371.5, 94, 'CUSTOMER NEED\nASSUMPTION')}
  ${hd(172.5, 213, 'ORGANISATION\nASSUMPTION')}${hd(371.5, 213, 'CUSTOMER PROBLEM\nASSUMPTION')}
  ${hd(121, 319, 'WILLINGNESS TO PAY')}${hd(322, 319, 'REVENUE ASSUMPTION')}
  ${cards.join('')}
  <!-- most critical -->
  <rect x="437" y="123" width="97" height="202" rx="8" fill="#e6dc9e" stroke="#fff" stroke-width="1.6"/>
  ${ribbon(445, 99, 82, 26, 'MOST CRITICAL\nASSUMPTION', 8.6)}
  ${card(p, 443, 138, 82, 81, 'cb')}${card(p, 443, 236, 82, 82, 'cb')}
  ${T(484, 174, 'Place the most\ncritical assumption\nstatement here', { size: 5.5, fill: '#e8f6ff', weight: 700 })}
  <!-- experiment + xyz -->
  ${frosted(543, 85, 124, 118)}${frosted(543, 230, 120, 118)}
  ${ribbon(570, 63, 95, 26, 'EXPERIMENT\nMETHOD', 9.4)}${ribbon(575, 226, 85, 26, 'XYZ\nHYPOTHESIS', 9.4)}
  ${T(605, 140, 'Your experiment\nmethod to falsify\nthe assumption', { size: 5.5, fill: '#1d3550', weight: 700 })}
  ${T(603, 285, 'Frame your XYZ\nHypothesis that helps\nmeasure the success\nof the experiment', { size: 5.5, fill: '#1d3550', weight: 700 })}
  ${bdl(611, 414, 16)}
  </svg>`;
}

/* ---------------- the two scoring cards ---------------- */
const SCORE = {
  1: { title: 'Strategy has 3 criteria’s', fx: 280, field: 'Strategy statement :', sub: 'BIZ\nSTRATEGY TACTICS', blue: ['Determine your\noverall strategic\nalignment to\nyour challenge', 'Determine if\nyour strategy\nis novel and\nunique?', 'Determine if\nyour strategy\nis defensible\nagainst\ncompetitors?'],
    cats: ['Strategic Direction :', 'Competitive Differentiation :', 'Defensibility :'],
    q: [['Direction Clarity:', 'Is the direction clear and easily understood?'], ['Innovation Focus:', 'Does the strategy foster innovation?'], ['Scalability:', 'How well can the strategy scale for future growth?'],
        ['Uniqueness:', 'How distinct is your differentiation from competitors?'], ['Market Positioning:', 'Is the product’s positioning clear in the market?'], ['Relevance:', 'How well does differentiation meet the target market’s needs?'],
        ['Protection Measures:', 'Are measures in place to defend the strategy?'], ['Barrier to Entry:', 'How challenging is it for competitors to replicate the strategy?'], ['Adaptability:', 'Can the strategy adapt to changing conditions?']] },
  2: { title: 'Experiment has 3 criteria’s', fx: 272, field: 'Experiment Pitch :', sub: 'BIZ\nEXPERIMENT METHODS', blue: ['Is your\nassumption\nreally critical\nand aligned to\nyour strategy?', 'Is your\nexperiment plan\nmeasurable and\neffective to\nfalsify the\nassumption?', 'Is your\nexperiment fast\nand efficient to\ndeliver a strong\nevidence?'],
    cats: ['Assumption Clarity :', 'Testable and Measurable Hypothesis :', 'Experiment Speed and Efficiency :'],
    q: [['Clarity of assumptions:', 'Are assumptions articulated clearly and unambiguously ?'], ['Alignment with strategy:', 'Do the assumptions align to the strategy ?'], ['Criticality:', 'How essential are these assumptions to the strategy ?'],
        ['Measurability:', 'Are the hypothesis measurable with clear success criteria ?'], ['Alignment with assumptions:', 'Do hypothesis correspond to the critical assumptions ?'], ['Effectiveness:', 'How likely are the hypothesis to provide valid results ?'],
        ['Experiment speed:', 'How fast can experiments be performed to gather data?'], ['Resource efficiency:', 'Are experiments resource-efficient in terms of time & cost?'], ['Evidence strength:', 'How strong and reliable are the experimental results likely to be?']] }
};
function score(n, C) {
  const S = SCORE[n], p = 's' + n, W = C.W, H = C.H, RX = C.tot[0] - 70, left = 10, aL = C.cols[0] - 24, top = C.rows[0][0] - 61, bot = H - 24;
  const xo0 = C.ox[0] - 18, xo1 = C.ox[2] + 18, hy = C.rows[0][0] - 48;
  let g = '';
  for (let k = 0; k < 3; k++) {
    const r = C.rows[k], yc = r[1], y0 = r[0] - 17, y1 = r[2] + 17, oyc = C.oy[k];
    const b1 = C.cols[2] + 28, b2 = C.ox[0] - 60, xt = C.sx - 37, xs = xt - 34;
    // category band + the three questions
    g += `<rect x="${left}" y="${r[0] - 35}" width="${aL - left + 4}" height="18" fill="url(#${p}rd)"/>` + T(left + 8, r[0] - 22.5, S.cats[k], { size: 8.8, fill: '#fff', weight: 800, anchor: 'start' });
    for (let j = 0; j < 3; j++) {
      const [lab, txt] = S.q[k * 3 + j];
      g += `<foreignObject x="${left + 8}" y="${r[j] - 13}" width="${aL - left - 14}" height="28"><div xmlns="http://www.w3.org/1999/xhtml" style="font:700 8.1px/1.22 Nunito,system-ui,sans-serif;color:${NAVY}"><span style="color:#d0262d;font-weight:800">${k * 3 + j + 1}. ${esc(lab)}</span> ${esc(txt)}</div></foreignObject>`;
    }
    // red - blue - red arrows
    g += `<path d="M${b2 - 6} ${oyc - 33}H${xs}L${xt} ${oyc}L${xs} ${oyc + 33}H${b2 - 6}Z" fill="url(#${p}rd)" stroke="#8e0e22" stroke-width="1"/>`;
    g += `<path d="M${b1} ${yc - 31}H${b2}L${b2 + 26} ${yc}L${b2} ${yc + 31}H${b1}Z" fill="url(#${p}bl)" stroke="#12125e" stroke-width="1"/>`;
    g += `<path d="M${aL} ${y0}H${b1 + 4}L${b1 + 24} ${yc}L${b1 + 4} ${y1}H${aL}Z" fill="url(#${p}rd)" stroke="#8e0e22" stroke-width="1"/>`;
    g += T((b1 + b2) / 2 + 4, yc - (S.blue[k].split('\n').length - 1) * 4.7 + 2.2, S.blue[k], { size: 7.6, fill: '#fff', weight: 800, lh: 1.17 });
    for (let j = 0; j < 3; j++) for (let c = 0; c < 3; c++) g += `<circle cx="${C.cols[c]}" cy="${r[j]}" r="8.6" fill="#fff" stroke="#8e0e22" stroke-width=".8"/>`;
    for (let c = 0; c < 3; c++) g += `<circle cx="${C.ox[c]}" cy="${oyc}" r="8.6" fill="#fff" stroke="#8e0e22" stroke-width=".8"/>`;
    g += T(C.sx, C.sy[k] - 23, 'Score', { size: 11.5, fill: NAVY, weight: 900 }) + `<path d="M${C.sx - 32} ${C.sy[k] + 7}H${C.sx + 32}" stroke="${NAVY}" stroke-width="1.2" stroke-dasharray="4 2.2"/>`;
  }
  const fx = S.fx, line = (a, b, y) => `<path d="M${a} ${y}H${b}" stroke="${NAVY}" stroke-width="1.1" stroke-dasharray="4 2.4"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Unbox scoring card" preserveAspectRatio="xMidYMid meet">
  <defs><linearGradient id="${p}rd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0283f"/><stop offset=".5" stop-color="#c8102e"/><stop offset="1" stop-color="#a50c26"/></linearGradient>
    <linearGradient id="${p}bl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a35b0"/><stop offset="1" stop-color="#1c1a80"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="#fbfbfe"/>
  <rect x="${RX}" y="0" width="${W - RX}" height="${H}" fill="#eceaf8"/>
  ${T(22, 38, 'SCORING', { size: 23, fill: RED, font: 'Bangers,Impact,sans-serif', weight: 400, anchor: 'start', ls: .5 })}${T(22, 60, 'CARD', { size: 23, fill: RED, font: 'Bangers,Impact,sans-serif', weight: 400, anchor: 'start', ls: .5 })}
  ${logo(104, 14, .95)}
  <rect x="${106}" y="58" width="${n === 1 ? 70 : 74}" height="10" rx="2" fill="#2a5ab8" transform="rotate(-2 106 58)"/>
  ${T(n === 1 ? 141 : 143, 66.4, S.sub.replace('\n', ' '), { size: 5.4, fill: '#fff', font: 'Bangers,Impact,sans-serif', weight: 400, ls: .3 })}
  ${T(fx, 22, 'Name :', { size: 10, fill: NAVY, weight: 800, anchor: 'start' })}${line(fx + 40, fx + 172, 22)}${T(fx + 184, 22, 'Date :', { size: 10, fill: NAVY, weight: 800, anchor: 'start' })}${line(fx + 222, RX - 6, 22)}
  ${T(fx, 44, S.field, { size: 10, fill: NAVY, weight: 800, anchor: 'start' })}${line(C.txt[0], RX - 6, 46)}${line(fx + 30, RX - 6, 64)}
  ${T(RX + (W - RX) / 2, 24, 'Overall Rating : Point\nConversion', { size: 9.6, fill: RED, weight: 800, lh: 1.15 })}
  ${T(RX + (W - RX) / 2, 55, 'Low : 0-10 Pts\nMed : 11-25 Pts\nHigh : 26-50 Pts', { size: 9.6, fill: RED, weight: 800, lh: 1.18 })}
  <rect x="${left}" y="${top}" width="${xo1 + 4 - left}" height="${bot - top}" rx="4" fill="#fff" stroke="${RED}" stroke-width="2.6"/>
  <rect x="${xo0}" y="${top + 1}" width="${xo1 - xo0}" height="${bot - top - 2}" fill="#fff" stroke="#c9c7e0" stroke-width="1"/>
  ${T(left + 9, hy + 3, S.title, { size: 9.4, fill: NAVY, weight: 800, anchor: 'start' })}
  ${['Low', 'Med', 'High'].map((t, i) => T(C.cols[i], hy + 3, t, { size: 8.8, fill: INK, weight: 800 })).join('')}
  ${T(C.ox[1], hy + 2, 'Overall Rating', { size: 9.4, fill: NAVY, weight: 800 })}${['Low', 'Med', 'High'].map((t, i) => T(C.ox[i], hy + 26, t, { size: 8.6, fill: INK, weight: 800 })).join('')}
  ${g}
  <rect x="${C.tot[0] - 46}" y="${C.tot[1] - 33}" width="${W - C.tot[0] + 46}" height="${H - C.tot[1] + 33}" rx="4" fill="#cfcbef"/>
  ${T(C.tot[0], C.tot[1] - 17, 'Total score', { size: 10.6, fill: NAVY, weight: 900 })}<path d="M${C.tot[0] - 32} ${C.tot[1] + 8}H${C.tot[0] + 32}" stroke="${NAVY}" stroke-width="1.2" stroke-dasharray="4 2.2"/>
  ${T(W * .43, H - 10, 'BE READY TO DEFEND YOUR SCORE TO A JURY PANEL OF COLLABORATORS, CUSTOMERS & POSSIBLE INVESTORS', { size: 10.4, fill: '#1f2f9a', font: 'Bangers,Impact,sans-serif', weight: 400, ls: .35, extra: `textLength="${W * .8}" lengthAdjust="spacingAndGlyphs"` })}
  </svg>`;
}
return { board1, board2, score };
})();
