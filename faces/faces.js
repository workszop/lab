/* The faces collection: its drawing code, registered for its own sheet and for the mix.
   Wrapped in an IIFE so collections can share a page without their names colliding. */
(() => {
/* the marker box: colours from the CSS tokens */
const SKINS = toks('--skin', 7), HAIR_DARK = toks('--hair', 4), HAIR_TINT = toks('--tint', 4);
const HATS = toks('--hat', 5), ACCENTS = toks('--accent', 3), BLUSH = tok('--blush', '#d98a85');

/* ============================================================
   ONE FACE
   ============================================================ */
/* helper: clip everything that follows to the inside of the head */
function clipHead(F, fn) {
  const { head } = F;
  pen.ctx.save();
  tracePath(wobblePts(head, 1, true), true);
  pen.ctx.clip();
  fn();
  pen.ctx.restore();
}

/* curtain of hair behind the head, bottom at cy + ry*bottomK */
function hairCurtain(F, bottomK) {
  const { cx, cy, dark, hairFill, hairTint, rx, ry } = F;
  const wide = rx * rf(1.12, 1.3), bottom = cy + ry * bottomK;
  const pts = [[cx - wide, bottom], [cx - wide * 0.98, cy - ry * 0.15]];
  pts.push(...arcPts(cx, cy - ry * 0.05, wide * 0.98, ry * 1.06, Math.PI, Math.PI * 2, 0.03, 12));
  pts.push([cx + wide * 0.98, cy - ry * 0.15], [cx + wide, bottom]);
  for (let i = 1; i < 6; i++) pts.push([cx + wide - wide * 2 * i / 6, bottom + rf(-6, 8)]);
  sketch(pts, { closed: true, fill: dark, fillColor: hairFill, wash: dark ? null : hairTint, wob: 1.6, width: 2.2 });
  for (let i = 0, n = ri(4, 9); i < n; i++) {           // loose strands down the sides
    const s = pick([-1, 1]), x0 = cx + s * rf(rx * 1.03, wide - 3);
    line(x0, cy - ry * rf(0, 0.5), x0 + s * rf(-2, 6), bottom - rf(6, 24), { wob: 1.6, width: 1.3, color: dark ? pen.base : pen.ink });
  }
}

/* a tapered hank of hair from (x0,y0) to (x1,y1), tied at the start */
function tail(F, x0, y0, x1, y1, w) {
  const { dark, hairFill, hairTint } = F;
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  const pts = [
    [x0 - nx * w * 0.5, y0 - ny * w * 0.5], [x0 + nx * w * 0.5, y0 + ny * w * 0.5],
    [x0 + dx * 0.5 + nx * w * 0.7, y0 + dy * 0.5 + ny * w * 0.7], [x1 + nx * w * 0.2, y1 + ny * w * 0.2],
    [x1 - nx * w * 0.3, y1 - ny * w * 0.3], [x0 + dx * 0.5 - nx * w * 0.6, y0 + dy * 0.5 - ny * w * 0.6]
  ];
  sketch(pts, { closed: true, fill: dark, fillColor: hairFill, wash: dark ? null : hairTint, wob: 1.4, width: 2 });
  for (let i = 0; i < 3; i++) {
    const t0 = rf(0.08, 0.3), t1 = rf(0.6, 0.95), off = rf(-w * 0.3, w * 0.3);
    line(x0 + dx * t0 + nx * off, y0 + dy * t0 + ny * off, x0 + dx * t1 + nx * off * 0.6, y0 + dy * t1 + ny * off * 0.6,
         { wob: 1.4, width: 1.3, color: dark ? pen.base : pen.ink });
  }
  line(x0 + dx * 0.06 - nx * w * 0.55, y0 + dy * 0.06 - ny * w * 0.55,
       x0 + dx * 0.06 + nx * w * 0.55, y0 + dy * 0.06 + ny * w * 0.55, { width: 2.6, wob: 0.6 });
}

/* a plait: two edges with a zigzag between, tied with a tuft at the end */
function braid(F, x0, y0, x1, y1) {
  const { dark, hairFill, hairTint } = F;
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  const n = Math.max(4, Math.round(L / 9));
  const strip = [[x0 + nx * 7, y0 + ny * 7], [x1 + nx * 4, y1 + ny * 4], [x1 - nx * 4, y1 - ny * 4], [x0 - nx * 7, y0 - ny * 7]];
  if (dark) sketch(strip, { closed: true, fill: true, fillColor: hairFill, wob: 1, width: 1.6 });
  else {
    if (hairTint) washPts(strip, hairTint);
    line(x0 + nx * 7, y0 + ny * 7, x1 + nx * 4, y1 + ny * 4, { width: 1.6 });
    line(x0 - nx * 7, y0 - ny * 7, x1 - nx * 4, y1 - ny * 4, { width: 1.6 });
  }
  const zig = [];
  for (let i = 0; i <= n; i++) { const t = i / n, s = i % 2 ? 1 : -1; zig.push([x0 + dx * t + nx * s * 4.5, y0 + dy * t + ny * s * 4.5]); }
  sketch(zig, { wob: 0.7, width: 1.6, color: dark ? pen.base : pen.ink });
  line(x1 - nx * 6, y1 - ny * 6, x1 + nx * 6, y1 + ny * 6, { width: 2.6, wob: 0.6 });
  for (let k = -1; k <= 1; k++) line(x1, y1, x1 + dx / L * 12 + nx * k * 5, y1 + dy / L * 12 + ny * k * 5, { width: 1.4 });
}

/* hair on the forehead: yAt(t) gives the hairline for t in [-1,1] across the head */
function fringe(F, yAt, filled, sweep = 0) {
  const { cx, cy, hairFill, hairTint, rx, ry } = F;
  clipHead(F, () => {
    const edge = [];
    for (let i = 0; i <= 8; i++) { const t = -1 + i / 4; edge.push([cx + t * rx * 1.25, yAt(t) + rf(-3, 3)]); }
    if (filled && chance(0.35)) {               // scribbled dark hair: two directions of dense hatch
      const closedEdge = [...edge, [cx + rx * 1.3, cy - ry * 1.6], [cx - rx * 1.3, cy - ry * 1.6]];
      washPts(closedEdge, { color: hairFill, alpha: rf(0.25, 0.45), mode: 'flat', grow: 1 });
      sketch(edge, { wob: 1.5, width: 2.2 });
      const top = cy - ry * 1.05, bot = yAt(0) - 4, a1 = rf(0.5, 0.9), a2 = a1 + rf(1.2, 1.8);
      hatch(cx - rx, top, cx + rx, bot, ri(24, 40), a1, 20);
      hatch(cx - rx, top, cx + rx, bot, ri(18, 30), a2, 18);
    } else if (filled) {
      edge.push([cx + rx * 1.3, cy - ry * 1.6], [cx - rx * 1.3, cy - ry * 1.6]);
      sketch(edge, { closed: true, fill: true, fillColor: hairFill, wob: 1.5, width: 2 });
      if (chance(0.5))                          // shine lines in the black
        for (let i = 0; i < 3; i++) {
          const x = cx + rf(-rx * 0.5, rx * 0.5);
          line(x, cy - ry * 0.95, x + rf(-4, 4), yAt(0) - rf(8, 16), { wob: 0.6, width: 1.4, color: pen.base });
        }
    } else {
      if (hairTint) washPts([...edge, [cx + rx * 1.3, cy - ry * 1.6], [cx - rx * 1.3, cy - ry * 1.6]], hairTint);
      sketch(edge, { wob: 1.5, width: 2 });
      hatch(cx - rx, cy - ry * 1.05, cx + rx, yAt(0) - 8, ri(14, 26), -Math.PI / 2 + sweep, 16);
    }
  });
}

function drawBow(F) {
  const { accent, cx, hairTop, rx, ry } = F;
  const s = pick([-1, 1]), bx = cx + s * rx * 0.55, by = hairTop - ry * 0.1;
  const filled = chance(0.5);
  const bowWash = !filled && chance(0.7) ? accent : null;
  for (const d of [-1, 1]) sketch([[bx, by], [bx + d * 13, by - 8], [bx + d * 12, by + 7]], { closed: true, fill: filled, wash: bowWash, wob: 1, width: 1.8 });
  dot(bx, by, 3);
}

/* ----- back hair: drawn before the head, so the face covers it ----- */
function faceBackHair(F) {
  const { cx, cy, dark, hairFill, hairTint, rx, ry, style } = F;
  if (style === 'long') hairCurtain(F, rf(1.1, 1.4));
  else if (style === 'bob') hairCurtain(F, rf(0.55, 0.85));
  else if (style === 'afro') {
    const fro = blobPts(cx, cy - ry * 0.2, rx * 1.38, ry * 1.3, 0.05, 22);
    sketch(fro, { closed: true, fill: dark, fillColor: hairFill, wash: dark ? null : hairTint, wob: 2.2, width: 2.2 });
    penStyle(1.6, dark ? pen.base : pen.ink);
    for (const [x, y] of fro.filter((_, i) => !dark || i % 2 === 0)) {   // curls along the rim
      const ix = x + (cx - x) * 0.06, iy = y + (cy - ry * 0.2 - y) * 0.06;
      pen.ctx.beginPath(); pen.ctx.arc(ix + rf(-3, 3), iy + rf(-3, 3), rf(3, 6), rf(0, 3), rf(4, 8)); pen.ctx.stroke();
    }
    if (!dark) stipple(cx, cy - ry * 0.3, rx * 1.25, ry * 1.1, ri(150, 300), 1.1);
  }
  else if (style === 'pigtails') for (const s of [-1, 1]) tail(F, cx + s * rx * 0.92, cy - ry * 0.05, cx + s * rx * rf(1.15, 1.3), cy + ry * rf(0.7, 1.0), rf(14, 20));
  else if (style === 'ponytail') { const s = pick([-1, 1]); tail(F, cx + s * rx * 0.8, cy - ry * 0.7, cx + s * rx * rf(1.2, 1.35), cy + ry * rf(0.5, 1.0), rf(16, 22)); }
  else if (style === 'braids') for (const s of [-1, 1]) braid(F, cx + s * rx * 0.9, cy - ry * 0.05, cx + s * rx * rf(1.1, 1.25), cy + ry * rf(1.0, 1.3));
}

/* ----- head (filled with paper so back hair stays behind it) ----- */
function faceHead(F) {
  const { head, skinWash } = F;
  sketch(head, { closed: true, fill: true, fillColor: pen.base, wash: skinWash, wob: 1.2, width: rf(2.2, 3.4) });
  if (chance(0.35)) sketch(head, { closed: true, wob: 2, width: rf(0.9, 1.5) });   // a second, searching line
}

/* ----- neck, shoulders, collar ----- */
function faceNeck(F) {
  const { accent, cx, cy, isChild, isOld, masc, rough, rx, ry, soft, style } = F;
  const hairBelowChin = ['long', 'pigtails', 'braids'].includes(style);
  if (!hairBelowChin && chance(0.4)) {
    const chinY = cy + ry * 0.98, nW = rx * (isChild ? 0.25 : masc ? 0.38 : 0.3);
    const ny2 = chinY + ry * rf(0.12, 0.2), shW = rx * rf(1.15, 1.3);
    for (const s of [-1, 1]) {
      line(cx + s * nW, chinY - 4, cx + s * nW, ny2, { width: 2 });
      sketch([[cx + s * nW, ny2], [cx + s * (nW + 10), ny2 + 4], [cx + s * shW, ny2 + 16]], { width: 2.2, wob: 1.2 });
    }
    if (isOld && chance(0.6)) for (let i = 0; i < 2; i++) { const y = chinY + 6 + i * 7; line(cx - nW + 3, y, cx + nW - 3, y + rf(-1, 2), { width: 1.1, wob: 0.8 }); }
    const collar = wpick({ none: 1.5, vneck: 1, crew: 1, tie: isChild ? 0.1 : rough, bowtie: 0.5, necklace: 1.2 * soft });
    if (collar === 'vneck') for (const s of [-1, 1]) line(cx + s * (nW + 4), ny2, cx, ny2 + 18, { width: 2 });
    else if (collar === 'crew') arc(cx, ny2 - 2, nW + 4, 0.1, Math.PI - 0.1, { width: 2 });
    else if (collar === 'tie') {
      for (const s of [-1, 1]) line(cx + s * (nW + 4), ny2, cx + s * 5, ny2 + 6, { width: 2 });
      sketch([[cx - 4, ny2 + 4], [cx + 4, ny2 + 4], [cx + 5, ny2 + 24], [cx, ny2 + 30], [cx - 5, ny2 + 24]], { closed: true, fill: chance(0.4), wash: chance(0.7) ? accent : null, width: 1.8, wob: 0.8 });
    } else if (collar === 'bowtie') {
      { const f = chance(0.4), w = !f && chance(0.7) ? accent : null;
        for (const d of [-1, 1]) sketch([[cx, ny2 + 5], [cx + d * 12, ny2 - 1], [cx + d * 12, ny2 + 11]], { closed: true, fill: f, wash: w, wob: 0.8, width: 1.8 }); }
      dot(cx, ny2 + 5, 2.5);
    } else if (collar === 'necklace') {
      for (let a = 0.15; a < Math.PI - 0.1; a += 0.18) dot(cx + Math.cos(a) * (nW + 10), ny2 - 4 + Math.sin(a) * 16, 1.6);
      if (chance(0.5)) dot(cx, ny2 + 14, 3);
    }
  }
}

/* ----- front hair & headwear ----- */
function faceFrontHair(F) {
  const { accent, bangsLine, bow, cx, cy, dark, eyeY, flatLine, hairFill, hairTint, hairTop, hatWash, isOld, look, middlePart, partDir, rx, ry, sidePart, soft, style } = F;
  if (style === 'bowl') fringe(F, flatLine, true);
  else if (style === 'bangs') fringe(F, bangsLine, dark);
  else if (style === 'sidepart') fringe(F, sidePart, dark, partDir * 0.5);
  else if (style === 'long' || style === 'bob') fringe(F, pick([middlePart, bangsLine, sidePart]), dark, chance(0.5) ? partDir * 0.4 : 0);
  else if (style === 'ponytail' || style === 'braids') fringe(F, pick([middlePart, sidePart]), dark, partDir * 0.3);
  else if (style === 'pigtails') fringe(F, pick([bangsLine, middlePart]), dark);
  else if (style === 'bun') {
    fringe(F, pick([middlePart, sidePart, flatLine]), dark);
    const bx = cx + rf(-0.35, 0.35) * rx, by = cy - ry * 1.08, br = rx * rf(0.26, 0.36);
    sketch(blobPts(bx, by, br, br * 0.85, 0.1, 12), { closed: true, fill: true, fillColor: dark ? hairFill : pen.base, wash: dark ? null : hairTint, wob: 1.5, width: 2 });
    if (!dark) for (let i = 0; i < 4; i++) arc(bx + rf(-3, 3), by + rf(-3, 3), br * rf(0.3, 0.7), rf(0, 3), rf(3, 6), { width: 1.3 });
    if (isOld) for (let i = 0; i < 4; i++) { const s = pick([-1, 1]); line(bx + s * br * 0.8, by + rf(-4, 4), bx + s * (br + rf(6, 14)), by + rf(-10, 8), { width: 1.2 }); }
  }
  else if (style === 'afro') {
    if (dark) fringe(F, flatLine, true);
    else { penStyle(1.6); for (let i = 0; i < 10; i++) { const t = -1 + i / 4.5; pen.ctx.beginPath(); pen.ctx.arc(cx + t * rx * 0.9, hairTop + rf(-3, 3), rf(3, 5.5), rf(0, 3), rf(4, 8)); pen.ctx.stroke(); } }
  }
  else if (style === 'spiky' || style === 'shaggy') {
    const n = ri(14, 24), sweep = rf(-0.5, 0.5);
    for (let i = 0; i < n; i++) {
      const t = i / n, a = Math.PI + t * Math.PI;   // across the crown
      const x = cx + Math.cos(a) * rx * 0.95, y = cy + Math.sin(a) * ry * 0.9;
      const l = rf(10, style === 'shaggy' ? 34 : 22);
      line(x, y, x + Math.cos(a + sweep) * l * 0.6, y + Math.sin(a) * l, { wob: 1, width: rf(1.2, 2) });
    }
    if (style === 'shaggy') hatch(cx - rx * 0.8, cy - ry, cx + rx * 0.8, hairTop, ri(10, 20), rf(-0.4, 0.4) - Math.PI / 2, 16);
  }
  else if (style === 'curly') {
    const n = ri(12, 22);
    penStyle(1.6);
    for (let i = 0; i < n; i++) {
      const a = Math.PI + (i / n) * Math.PI + rf(-0.1, 0.1);
      const x = cx + Math.cos(a) * rx * rf(0.8, 1.02);
      const y = cy + Math.sin(a) * ry * rf(0.8, 1.02);
      pen.ctx.beginPath(); pen.ctx.arc(x, y, rf(3, 6.5), rf(0, 3), rf(4, 8)); pen.ctx.stroke();
    }
    if (soft > 0 && chance(0.5)) clipHead(F, () => { for (let i = 0; i < 8; i++) { const t = -1 + i / 3.5; pen.ctx.beginPath(); pen.ctx.arc(cx + t * rx * 0.85, hairTop + rf(-4, 4), rf(3, 5), rf(0, 3), rf(4, 8)); pen.ctx.stroke(); } });
  }
  else if (style === 'buzz') {
    clipHead(F, () => stipple(cx, hairTop - ry * 0.28, rx * 0.95, ry * 0.4, ri(120, 260), 1));
    arc(cx, hairTop + 2, rx * 0.9, Math.PI * 1.05, Math.PI * 1.95, { width: 1.6, wob: 1 });
  }
  else if (style === 'comb') {
    clipHead(F, () => {
      const dir = pick([-1, 1]);
      for (let i = 0, n = ri(8, 14); i < n; i++) {
        const y = cy - ry + rf(0, ry * 0.55);
        line(cx - dir * rx, y + rf(-3, 3), cx + dir * rx * 0.9, y + rf(6, 18), { wob: 1.6, width: rf(1.2, 2) });
      }
    });
  }
  else if (style === 'bald') {
    if (chance(0.6)) hatch(cx - rx * 0.5, cy - ry * 1.05, cx + rx * 0.5, cy - ry * 0.8, ri(3, 7), -Math.PI / 2, 10);
    if (isOld && chance(0.7))                      // grey fuzz round the sides
      for (const s of [-1, 1]) for (let i = 0, n = ri(4, 8); i < n; i++) {
        const y = rf(cy - ry * 0.35, cy + ry * 0.15);
        const x = cx + s * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2)) * rx;
        line(x - s * 4, y, x + s * rf(6, 14), y + rf(2, 10), { width: 1.3, wob: 1.2 });
      }
  }
  else if (style === 'wisps') {                 // thin hair at the temples, bare on top
    for (const s of [-1, 1]) for (let i = 0, n = ri(5, 10); i < n; i++) {
      const y = rf(hairTop, cy + ry * 0.15);
      const x = cx + s * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2)) * rx;
      line(x - s * rf(0, 6), y, x + s * rf(8, 20), y + rf(4, 14), { width: rf(1.2, 1.8), wob: 1.4 });
    }
    if (chance(0.6)) for (let i = 0, n = ri(2, 5); i < n; i++) { const x = cx + rf(-rx * 0.4, rx * 0.4); line(x, cy - ry * 0.98, x + rf(-6, 6), cy - ry - rf(8, 18), { width: 1.3, wob: 1.2 }); }
  }
  else if (style === 'mohawk') {
    clipHead(F, () => { for (const s of [-1, 1]) stipple(cx + s * rx * 0.6, cy - ry * 0.55, rx * 0.45, ry * 0.4, ri(50, 90), 1); });
    for (let i = 0, n = ri(10, 16); i < n; i++) {
      const t = -1 + 2 * i / n, x = cx + t * rx * 0.32;
      const yTop = cy - Math.sqrt(Math.max(0, 1 - (t * 0.32) ** 2)) * ry;
      line(x, yTop + 2, x + rf(-4, 4), yTop - rf(18, 34), { width: rf(1.5, 2.4), wob: 1 });
    }
  }
  else if (style === 'cap') {                   // flat tweed cap
    const capY = Math.min(hairTop, eyeY - 26) - rf(0, 8);   // sit above the brows
    const crown = arcPts(cx, capY - ry * 0.25, rx * 1.08, ry * 0.55, Math.PI * 0.9, Math.PI * 2.1, 0.06, 14);
    crown.push([cx + rx * 1.15, capY + 4], [cx - rx * 1.15, capY + 4]);
    sketch(crown, { closed: true, fill: true, fillColor: pen.base, wash: hatWash, wob: 1.4, width: 2.2 });
    stipple(cx, capY - ry * 0.3, rx * 0.85, ry * 0.32, ri(80, 160), 0.9);
    const dir = look >= 0 ? 1 : -1;             // brim toward gaze
    sketch([[cx + dir * rx * 0.2, capY + 3], [cx + dir * rx * 1.15, capY + rf(0, 6)], [cx + dir * rx * 0.9, capY + rf(10, 14)], [cx + dir * rx * 0.1, capY + 8]], { closed: true, fill: true, fillColor: pen.base, wash: hatWash && { ...hatWash, mode: 'flat' }, width: 2.2 });
  }
  else if (style === 'beanie') {
    const by = hairTop + rf(-4, 6);
    const dome = arcPts(cx, by - 6, rx * 1.02, ry * 0.72, Math.PI, Math.PI * 2, 0.05, 14);
    dome.push([cx + rx * 1.02, by], [cx - rx * 1.02, by]);
    sketch(dome, { closed: true, fill: true, fillColor: pen.base, wash: hatWash, wob: 1.4, width: 2.2 });
    if (chance(0.5)) stipple(cx, by - ry * 0.35, rx * 0.8, ry * 0.3, ri(60, 120), 0.9);
    else hatch(cx - rx * 0.8, by - ry * 0.65, cx + rx * 0.8, by - 4, ri(15, 30), rf(0.5, 1.1), 12);
    /* ribbed band */
    sketch([[cx - rx * 1.02, by], [cx + rx * 1.02, by]], { width: 2.4, wob: 1.6 });
    sketch([[cx - rx * 1.05, by + 14], [cx + rx * 1.05, by + 14]], { width: 2.4, wob: 1.6 });
    for (let x = cx - rx * 0.95; x < cx + rx * 0.95; x += rf(6, 10)) line(x, by + 1, x + rf(-2, 2), by + 13, { wob: 0.8, width: 1.4 });
    if (chance(0.4)) { const py = by - 6 - ry * 0.72; sketch(blobPts(cx, py, 9, 8, 0.12, 10), { closed: true, fill: true, fillColor: pen.base, width: 1.8 }); stipple(cx, py, 7, 6, 18, 0.8); }
  }
  else if (style === 'band') {                  // headband + dark hair above
    const by = hairTop + rf(0, 8);
    clipHead(F, () => sketch([[cx - rx * 1.2, by - 10], [cx + rx * 1.2, by - 10], [cx + rx * 1.2, cy - ry * 1.5], [cx - rx * 1.2, cy - ry * 1.5]], { closed: true, fill: true, fillColor: hairFill, wob: 1.5, width: 2 }));
    sketch([[cx - rx * 1.02, by - 10], [cx + rx * 1.02, by - 10], [cx + rx * 1.02, by], [cx - rx * 1.02, by]], { closed: true, taper: false, width: 0.1, wash: hatWash && accent });
    sketch([[cx - rx * 1.02, by], [cx + rx * 1.02, by - rf(0, 4)]], { width: 3, wob: 1.6 });
    sketch([[cx - rx * 1.02, by - 10], [cx + rx * 1.02, by - 12]], { width: 3, wob: 1.6 });
  }
  else if (style === 'fedora') {
    const by = Math.min(hairTop, eyeY - 28) - rf(2, 8);   // brim clear of the brows
    const crown = arcPts(cx, by, rx * 0.95, ry * 0.78, Math.PI, Math.PI * 2, 0.04, 12);
    crown.push([cx + rx * 0.95, by + 2], [cx - rx * 0.95, by + 2]);
    sketch(crown, { closed: true, fill: true, fillColor: pen.base, wash: hatWash, wob: 1.3, width: 2.2 });
    arc(cx, by - ry * 0.72, rx * 0.22, Math.PI * 0.15, Math.PI * 0.85, { width: 1.6 });   // pinch
    line(cx - rx * 0.95, by - 10, cx + rx * 0.95, by - 12, { width: 3 });                  // band
    sketch([[cx - rx * 1.5, by + rf(-4, 2)], [cx, by - 5], [cx + rx * 1.5, by + rf(-4, 2)], [cx, by + 9]], { closed: true, fill: true, fillColor: pen.base, wash: hatWash && { ...hatWash, mode: 'flat' }, wob: 1.4, width: 2.2 });
  }
  else if (style === 'beret') {
    if (chance(0.6)) fringe(F, flatLine, dark);
    const s = pick([-1, 1]), bx = cx + s * rx * 0.15, by = hairTop - ry * 0.38;
    sketch(blobPts(bx, by, rx * 1.22, ry * 0.45, 0.07, 16), { closed: true, fill: true, fillColor: pen.base, wash: hatWash, wob: 1.5, width: 2.2 });
    line(bx, by - ry * 0.44, bx + 2, by - ry * 0.44 - 8, { width: 2 });
  }
  else if (style === 'headscarf') {
    const outer = arcPts(cx, cy - ry * 0.05, rx * 1.22, ry * 1.22, Math.PI * 0.85, Math.PI * 2.15, 0.03, 16);
    const inner = [[cx + rx * 1.0, cy + ry * 0.35], [cx + rx * 0.97, cy - ry * 0.3], [cx + rx * 0.55, hairTop - 8], [cx, hairTop - 14],
                   [cx - rx * 0.55, hairTop - 8], [cx - rx * 0.97, cy - ry * 0.3], [cx - rx * 1.0, cy + ry * 0.35]];
    sketch([...outer, ...inner], { closed: true, fill: true, fillColor: pen.base, wash: hatWash, wob: 1.4, width: 2.2 });
    if (chance(0.6)) for (let i = 0; i < 70; i++) {       // polka dots on the band
      const a = rf(Math.PI * 0.85, Math.PI * 2.15), d = rf(0, 1);
      const x = cx + Math.cos(a) * rx * 1.18 * d, y = cy - ry * 0.05 + Math.sin(a) * ry * 1.18 * d;
      const onFace = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1 && y > hairTop - 14;
      if (!onFace) dot(x, y, 1.3);
    }
    const ky = cy + ry * 1.02;                              // knot under the chin
    arc(cx - 7, ky + 5, 6, 0, Math.PI * 2, { width: 1.8, wob: 0.8 });
    arc(cx + 7, ky + 5, 6, 0, Math.PI * 2, { width: 1.8, wob: 0.8 });
    line(cx - 4, ky + 9, cx - 12, ky + 24, { width: 1.8 });
    line(cx + 4, ky + 9, cx + 12, ky + 24, { width: 1.8 });
  }
  if (bow) drawBow(F);
}

/* ----- ears : little "C" marks on the cheeks ----- */
function faceEars(F) {
  const { cx, cy, isChild, look, rx, ry, shift, skinWash, soft, style } = F;
  const earY = cy + ry * rf(-0.05, 0.12);
  const earR = isChild ? rf(6, 9) : rf(6, 11);
  const hideEars = ['long', 'bob', 'afro', 'headscarf'].includes(style) && chance(0.85);
  /* the ear on the side the face turns toward slips out of view */
  const leftEar = !hideEars && look >= -0.5 && (look < 0.5 || chance(0.8));
  const rightEar = !hideEars && look <= 0.5 && (look > -0.5 || chance(0.8));
  /* two kinds of ear: the quick "C" on the cheek, or a real ear sticking
     out of the head's silhouette (paper-filled, washed like the skin) */
  const earOut = !hideEars && chance(0.55);
  const earPos = {};                            // where each ear ends up, for the earrings
  for (const [on, s] of [[leftEar, -1], [rightEar, 1]]) {
    if (!on) continue;
    if (earOut) {
      const r = earR * 1.25;
      /* the head's edge at ear height, then the ear hangs off it */
      const edgeX = cx + s * rx * Math.sqrt(Math.max(0.2, 1 - ((earY - cy) / ry) ** 2)) + shift * 0.25;
      const ex = edgeX + s * r * 0.55;
      const ear = blobPts(ex, earY, r * 0.75, r * 1.05, 0.1, 10);
      sketch(ear, { closed: true, fill: true, fillColor: pen.base, wash: skinWash && { ...skinWash, grow: 1, dx: s * 2, dy: 1, mode: 'flat' }, width: rf(1.8, 2.4), wob: 0.9 });
      arc(ex + s * r * 0.1, earY + r * 0.1, r * 0.45, s > 0 ? -Math.PI * 0.6 : Math.PI * 0.4, s > 0 ? Math.PI * 0.5 : Math.PI * 1.6, { width: 1.3, wob: 0.6 });   // the inner fold
      earPos[s] = [ex, earY + r * 1.05];
    } else {
      const x = cx + s * rx * 0.55 + shift * 0.4;
      if (s < 0) arc(x, earY, earR, Math.PI * 0.6, Math.PI * 1.5, { width: 1.8, wob: 0.8 });
      else arc(x, earY, earR, -Math.PI * 0.5, Math.PI * 0.45, { width: 1.8, wob: 0.8 });
      earPos[s] = [x, earY + earR];
    }
  }
  if (soft > 0 && chance(0.45 * soft + 0.1)) {   // earrings
    const kind = wpick({ stud: 1, hoop: 1, drop: 1 });
    for (const [on, s] of [[leftEar, -1], [rightEar, 1]]) {
      if (!on) continue;
      const [x, y] = earPos[s];
      if (kind === 'stud') dot(x, y, 2.2);
      else if (kind === 'hoop') arc(x, y + 4, rf(3, 5), 0, Math.PI * 2, { width: 1.6, wob: 0.6 });
      else { line(x, y, x + rf(-2, 2), y + rf(8, 14), { width: 1.3 }); dot(x, y + 14, 2.5); }
    }
  }
}

/* ----- eyes ----- */
function faceEyes(F) {
  const { exL, exR, expr, eyeY, isChild, isOld, look, soft } = F;
  let eyeKind = wpick({ ring: 3, big: isChild ? 3 : 1, dot: isOld ? 2 : 1, mix: 0.6 });
  if (expr === 'happy' && chance(0.45)) eyeKind = 'wink2';
  if (expr === 'surprised') eyeKind = 'big';
  if (expr === 'sleepy') eyeKind = 'closed';
  if (expr === 'sly') eyeKind = 'wink';
  if (isOld && eyeKind === 'big') eyeKind = 'ring';
  const lashes = chance(0.85 * soft);

  function eye(x, kind, s, side) {
    if (kind === 'dot') { dot(x, eyeY, rf(2, 3.2) * (isChild ? 1.3 : 1)); return; }
    if (kind === 'wink') { arc(x, eyeY, rf(5, 8), 0.15, Math.PI - 0.15, { width: 2 }); return; }
    let r;
    if (kind === 'closed') {
      r = rf(5, 8);
      arc(x, eyeY, r, Math.PI + 0.15, Math.PI * 2 - 0.15, { width: 2 });
    } else {
      r = (kind === 'big' ? rf(10, 16) : rf(5.5, 9)) * s * (isOld ? 0.85 : 1);
      arc(x, eyeY, r, 0, Math.PI * 2, { width: 1.8, wob: 0.9 });
      const px = x + look * r * 0.35 + rf(-1, 1), py = eyeY + rf(-1, 2);
      dot(px, py, Math.max(1.6, r * (isChild ? rf(0.35, 0.5) : rf(0.22, 0.4))));
      if (isChild && kind === 'big' && chance(0.5)) dot(px - r * 0.15, py - r * 0.15, Math.max(0.8, r * 0.09), pen.base);  // sparkle
    }
    if (lashes) {                                 // three ticks on the outer upper rim
      const base = side < 0 ? Math.PI * 1.12 : Math.PI * 1.58;
      for (let k = 0; k < 3; k++) {
        const a = base + k * 0.15;
        line(x + Math.cos(a) * r, eyeY + Math.sin(a) * r, x + Math.cos(a) * (r + 5), eyeY + Math.sin(a) * (r + 5), { width: 1.4, wob: 0.5 });
      }
    }
    if (isOld) {
      if (chance(0.6)) arc(x, eyeY + 1, r + 3.5, Math.PI * 1.1, Math.PI * 1.9, { width: 1.3, wob: 0.8 });   // heavy lid
      if (chance(0.5)) arc(x, eyeY + 2, r + 4.5, Math.PI * 0.2, Math.PI * 0.8, { width: 1.1, wob: 0.8 });   // bag
    }
  }
  if (eyeKind === 'mix') { eye(exL, 'ring', rf(0.7, 1), -1); eye(exR, pick(['big', 'dot', 'wink']), 1, 1); }
  else if (eyeKind === 'wink') { eye(exL, 'wink', 1, -1); eye(exR, 'ring', 1, 1); }
  else if (eyeKind === 'wink2') { eye(exL, 'wink', 1, -1); eye(exR, 'wink', 1, 1); }
  else { const s2 = rf(0.75, 1.3); eye(exL, eyeKind, 1, -1); eye(exR, eyeKind, s2, 1); }
}

/* ----- eyebrows ----- */
function faceBrows(F) {
  const { exL, exR, expr, eyeY, isChild, isOld, rough, soft } = F;
  let browKind = wpick({ none: isChild ? 2 : 1.2, arc: 3, thick: 0.4 + 2.2 * rough });
  if (expr === 'grumpy') browKind = 'angry';
  if (expr === 'surprised') browKind = 'raised';
  if (isOld && browKind !== 'none' && chance(0.45)) browKind = 'bushy';
  if (browKind !== 'none') {
    const lift = browKind === 'raised' ? 8 : soft > 0.5 ? 3 : 0;
    const by = eyeY - rf(11, 18) - lift;
    const bw = browKind === 'thick' || browKind === 'bushy' ? rf(3, 5) : soft > 0.5 ? 1.6 : 2;
    for (const [ex, s] of [[exL, -1], [exR, 1]]) {
      if (browKind !== 'angry' && !chance(0.8)) continue;
      if (browKind === 'angry') line(ex - s * 9, by + 8, ex + s * 9, by + 1, { width: 2.6 });
      else arc(ex, by + 4, rf(8, 12) * (browKind === 'raised' ? 1.2 : 1), Math.PI * 1.15, Math.PI * 1.85, { width: bw });
      if (browKind === 'bushy') hatch(ex - 9, by - 8, ex + 9, by + 2, ri(5, 9), -Math.PI / 2 + s * 0.5, 7);
    }
  }
}

/* ----- nose ----- */
function faceNose(F) {
  const { cx, eyeY, isChild, isOld, look, rough, ry, shift, soft } = F;
  const noseKind = wpick({ hook: 3, button: isChild ? 3 : 0.3 + 1.5 * soft, straight: 1, big: isOld ? 1.5 * rough : 0 });
  const nx = cx + shift * 1.4, nTop = eyeY + rf(2, 8);
  const nLen = ry * (isChild ? rf(0.14, 0.24) : rf(0.22, 0.4)) * (noseKind === 'big' ? 1.2 : 1);
  const hookDir = pick([-1, 1]);
  const hook = hookDir * rf(4, 12) * (noseKind === 'big' ? 1.5 : 1) + look * 6;
  if (noseKind === 'button') {
    arc(nx + look * 3, nTop + nLen * 0.8, rf(3.5, 5.5), Math.PI * 0.15, Math.PI * 0.85, { width: 1.8 });
    if (chance(0.4)) line(nx + look * 3, nTop, nx + look * 3 + hookDir * 2, nTop + nLen * 0.6, { width: 1.4 });
  } else if (noseKind === 'straight') {
    line(nx, nTop, nx + look * 4, nTop + nLen, { width: 2, wob: 0.8 });
    line(nx + look * 4, nTop + nLen, nx + look * 4 + hookDir * 7, nTop + nLen + 1, { width: 2, wob: 0.8 });
  } else {
    sketch([[nx + rf(-2, 2), nTop], [nx + hook * 0.3, nTop + nLen * 0.7], [nx + hook, nTop + nLen]], { width: noseKind === 'big' ? 2.4 : 2, wob: 1 });
    if (chance(0.5)) arc(nx + hook * 0.4, nTop + nLen + 1, 3, 0, Math.PI, { width: 1.6 });  // nostril curl
    if (noseKind === 'big') arc(nx - hook * 0.4, nTop + nLen + 1, 3, 0, Math.PI, { width: 1.6 });
  }
  Object.assign(F, { nLen, nTop, nx });
}

/* ----- mouth & facial hair ----- */
function faceMouth(F) {
  const { cx, cy, expr, isChild, isOld, nLen, nTop, rough, rx, ry, shift, soft } = F;
  const mY = nTop + nLen + rf(12, 20) * (isChild ? 0.85 : 1);
  const mx = cx + shift;
  const mS = isChild ? 0.75 : 1;                 // mouth scale
  let mouthKind = wpick({ flat: 2, smile: 1.5, lips: 1, open: 0.7, frown: 0.7, pout: 1.2 * soft, grin: isChild ? 1 : 0.4 });
  if (expr === 'happy') mouthKind = chance(0.7) ? 'smile' : 'grin';
  if (expr === 'surprised') mouthKind = 'open';
  if (expr === 'sleepy') mouthKind = 'flat';
  if (expr === 'grumpy') mouthKind = 'frown';
  if (expr === 'sly') mouthKind = 'smile';
  const stache = (!isChild && chance(0.45 * rough)) ? wpick({ thin: 1, bushy: 1, handlebar: 0.6, walrus: isOld ? 1 : 0.2 }) : 'none';
  const beard = (!isChild && chance(0.4 * rough)) ? wpick({ stubble: 1.2, goatee: 1, full: 1 }) : 'none';
  const grey = isOld && chance(0.75);

  if (stache === 'bushy') {
    sketch([[mx - rf(14, 20), mY - 4], [mx, mY - rf(8, 11)], [mx + rf(14, 20), mY - 4], [mx, mY - 2]], { closed: true, fill: !grey, width: 2, wob: 1 });
    if (grey) hatch(mx - 14, mY - 9, mx + 14, mY - 3, 14, Math.PI / 2, 5);
  } else if (stache === 'thin') {
    arc(mx - 7, mY - 4, 7, Math.PI * 1.1, Math.PI * 1.9, { width: 1.6 });
    arc(mx + 7, mY - 4, 7, Math.PI * 1.1, Math.PI * 1.9, { width: 1.6 });
  } else if (stache === 'handlebar') {
    arc(mx - 10, mY - 6, 9, Math.PI * 0.9, Math.PI * 1.9, { width: 2.4 });
    arc(mx + 10, mY - 6, 9, Math.PI * 1.1, Math.PI * 2.1, { width: 2.4 });
  } else if (stache === 'walrus') {
    sketch([[mx - 22, mY + 2], [mx, mY - 9], [mx + 22, mY + 2], [mx + 14, mY + 7], [mx, mY + 2], [mx - 14, mY + 7]], { closed: true, fill: !grey, width: 2, wob: 1.2 });
    if (grey) hatch(mx - 18, mY - 7, mx + 18, mY + 4, 24, Math.PI / 2 + rf(-0.2, 0.2), 7);
  }

  if (mouthKind === 'open') {
    sketch(blobPts(mx, mY + 4, rf(6, 10) * mS, rf(4, 7) * mS, 0.1, 10), { closed: true, fill: true, width: 1.5 });
  } else if (mouthKind === 'lips') {
    if (soft > 0 && chance(0.5)) washPts([[mx - 10 * mS, mY + 2], [mx, mY - 2], [mx + 10 * mS, mY + 2], [mx, mY + 7]], { color: ACCENTS[0], alpha: 0.8, dx: rf(-2, 2), dy: rf(-1, 1) });
    sketch([[mx - 10 * mS, mY + 2], [mx - 4 * mS, mY - 1], [mx, mY + 1], [mx + 4 * mS, mY - 1], [mx + 10 * mS, mY + 2]], { width: 1.8, wob: 0.8 });
    sketch([[mx - 8 * mS, mY + 2], [mx, mY + rf(4, 6)], [mx + 8 * mS, mY + 2]], { width: 1.8, wob: 0.8 });
  } else if (mouthKind === 'pout') {
    const lipRed = chance(0.6);
    sketch([[mx - 9, mY], [mx - 4, mY - 3], [mx, mY - 1], [mx + 4, mY - 3], [mx + 9, mY], [mx, mY + 5]],
           { closed: true, fill: !lipRed, wash: lipRed ? { color: ACCENTS[0], alpha: 0.9, grow: 1.2, dx: rf(-2, 2), dy: rf(-1, 1) } : null, width: 1.6, wob: 0.7 });
    line(mx - 7, mY + 0.5, mx + 7, mY + 0.5, { width: 1, wob: 0.4, color: pen.base });
  } else if (mouthKind === 'smile') {
    arc(mx, mY - 2, rf(8, 14) * mS, 0.25, Math.PI - 0.25, { width: 2 });
  } else if (mouthKind === 'grin') {
    const r = rf(9, 14) * mS, pts = [[mx - r, mY]];
    for (let i = 0; i <= 8; i++) { const a = 0.1 + (Math.PI - 0.2) * i / 8; pts.push([mx + Math.cos(a) * r, mY + Math.sin(a) * r * 0.8]); }
    sketch(pts, { closed: true, fill: true, fillColor: pen.base, width: 1.8, wob: 0.8 });
    for (const k of [-0.5, 0, 0.5]) line(mx + k * r, mY, mx + k * r, mY + 4, { width: 1.2, wob: 0.4 });
    if (isChild && chance(0.4)) { const gx = mx + pick([-0.25, 0.25]) * r; penStyle(1); pen.ctx.fillRect(gx - 3, mY + 0.5, 6, 4.5); }   // missing tooth
  } else if (mouthKind === 'frown') {
    arc(mx, mY + 8, rf(8, 12) * mS, Math.PI * 1.2, Math.PI * 1.8, { width: 2 });
  } else {
    line(mx - rf(6, 12) * mS, mY + rf(-2, 2), mx + rf(6, 12) * mS, mY + rf(-2, 2), { width: 2 });
  }

  if (beard === 'stubble') {
    clipHead(F, () => stipple(cx + shift * 0.5, cy + ry * 0.62, rx * 0.8, ry * 0.42, ri(120, 240), 0.9));
  } else if (beard === 'goatee') {
    sketch(blobPts(mx, mY + rf(12, 16), rf(7, 11), rf(5, 9), 0.1, 10), { closed: true, fill: !grey, width: 1.5 });
    if (grey) hatch(mx - 6, mY + 8, mx + 6, mY + 20, 10, Math.PI / 2, 6);
  } else if (beard === 'full') {
    const top = mY - 6;
    clipHead(F, () => {
      if (grey) {
        sketch(arcPts(cx, cy, rx * 1.02, ry * 1.02, Math.PI * 0.1, Math.PI * 0.9, 0.04, 14), { wob: 2, width: 2 });
        hatch(cx - rx, top, cx + rx, cy + ry * 1.05, ri(60, 110), Math.PI / 2 + rf(-0.3, 0.3), 10);
      } else {
        sketch([[cx - rx * 1.2, top], [cx + rx * 1.2, top], [cx + rx * 1.2, cy + ry * 1.5], [cx - rx * 1.2, cy + ry * 1.5]], { closed: true, fill: true, wob: 2, width: 2 });
        /* redraw the mouth on top of the beard in paper colour */
        line(mx - 8, mY + 2, mx + 8, mY + 2, { width: 2.4, wob: 0.6, color: pen.base });
      }
    });
  }
  Object.assign(F, { beard, mY, mx });
}

/* ----- age lines ----- */
function faceAge(F) {
  const { age, beard, cx, cy, exL, exR, eyeY, hairTop, isOld, mY, mx, nLen, nTop, nx, rx, ry, shift } = F;
  const fine = { width: 1.2, wob: 0.9 };
  if (isOld) {
    if (chance(0.8)) for (let i = 0, n = ri(2, 4); i < n; i++) {      // forehead
      const y = hairTop + 8 + (eyeY - 24 - hairTop - 8) * (i + 0.5) / n, w = rx * rf(0.35, 0.55);
      sketch([[cx + shift * 0.6 - w, y + 2], [cx + shift * 0.6 - w / 2, y - 1], [cx + shift * 0.6, y - 2], [cx + shift * 0.6 + w / 2, y - 1], [cx + shift * 0.6 + w, y + 2]], fine);
    }
    if (chance(0.7)) for (const [ex, s] of [[exL, -1], [exR, 1]])     // crow's feet
      for (let k = -1; k <= 1; k++) { const ox = ex + s * 11; line(ox, eyeY + k * 3, ox + s * 8, eyeY + k * 7, fine); }
    if (chance(0.7)) for (const s of [-1, 1])                          // nasolabial folds
      sketch([[nx + s * 8, nTop + nLen - 2], [nx + s * 14, nTop + nLen + 10], [mx + s * 16, mY + 6]], fine);
    if (chance(0.5)) for (const s of [-1, 1])                          // hollow cheeks
      sketch([[cx + s * rx * 0.62 + shift * 0.5, cy + ry * 0.25], [cx + s * rx * 0.66 + shift * 0.5, cy + ry * 0.45], [cx + s * rx * 0.58 + shift * 0.5, cy + ry * 0.62]], fine);
    if (chance(0.4) && beard === 'none') arc(mx, mY + 24, 8, Math.PI * 1.2, Math.PI * 1.8, fine);   // chin crease
  } else if (age === 'adult' && chance(0.25)) {
    for (const s of [-1, 1]) sketch([[nx + s * 9, nTop + nLen + 2], [mx + s * 14, mY + 2]], fine);
  }
}

/* ----- cheeks: freckles, blush ----- */
function faceCheeks(F) {
  const { exL, exR, eyeY, isChild, mY, soft } = F;
  if (chance(isChild ? 0.35 : 0.12)) { stipple(exL - 6, mY - 14, 9, 6, ri(4, 8), 0.8); stipple(exR + 6, mY - 14, 9, 6, ri(4, 8), 0.8); }
  if ((isChild || soft > 0) && chance(0.45)) {
    const cyk = eyeY + (mY - eyeY) * 0.55;
    if (chance(0.6)) {                            // a dab of marker on each cheek
      washPts(blobPts(exL - 9, cyk + 1, 9, 6, 0.1, 10), { color: BLUSH, alpha: rf(0.35, 0.6), grow: 1 });
      washPts(blobPts(exR + 9, cyk + 1, 9, 6, 0.1, 10), { color: BLUSH, alpha: rf(0.35, 0.6), grow: 1 });
    } else {
      hatch(exL - 14, cyk - 3, exL - 6, cyk + 5, 4, 0.7, 7);
      hatch(exR + 6, cyk - 3, exR + 14, cyk + 5, 4, 0.7, 7);
    }
  }
}

/* ----- eyewear (on top of everything) ----- */
function faceEyewear(F) {
  const { cx, exL, exR, eyeY, gap, isChild, isOld, rx, shift, soft } = F;
  const specs = wpick(isChild ? { none: 7, round: 1, square: 0.3 }
                    : isOld   ? { none: 2.5, round: 2, square: 1.2, halfmoon: 2, pince: 0.4, monocle: 0.4 }
                              : { none: 5, round: 1, square: 1, shades: 0.8, monocle: 0.25, pince: 0.25, cateye: soft });
  const lensR = gap * rf(0.5, 0.65);
  const temple = (x, y, s) => line(x, y, cx + s * rx * 0.98 + shift * 0.3, y - 3, { width: 1.6 });
  if (specs === 'round' || specs === 'pince') {
    arc(exL, eyeY, lensR, 0, Math.PI * 2, { width: 2, wob: 1 });
    arc(exR, eyeY, lensR, 0, Math.PI * 2, { width: 2, wob: 1 });
    if (specs === 'round') {
      line(exL + lensR, eyeY, exR - lensR, eyeY, { width: 1.8 });
      temple(exL - lensR, eyeY, -1); temple(exR + lensR, eyeY, 1);
    } else {
      arc(cx + shift, eyeY - lensR * 0.4, lensR * 0.5, Math.PI * 1.1, Math.PI * 1.9, { width: 1.8 });
    }
  } else if (specs === 'square' || specs === 'shades') {
    const w2 = lensR * 1.1, h2 = lensR * 0.85;
    for (const ex of [exL, exR])
      sketch([[ex - w2, eyeY - h2], [ex + w2, eyeY - h2], [ex + w2, eyeY + h2], [ex - w2, eyeY + h2]],
             { closed: true, width: 2.2, wob: 1, fill: specs === 'shades' || chance(0.4) });
    line(exL + w2, eyeY - h2 * 0.5, exR - w2, eyeY - h2 * 0.5, { width: 2 });
    temple(exL - w2, eyeY, -1); temple(exR + w2, eyeY, 1);
  } else if (specs === 'cateye') {
    const w2 = lensR * 1.1, h2 = lensR * 0.8;
    for (const [ex, s] of [[exL, -1], [exR, 1]])
      sketch([[ex - s * w2, eyeY - h2 * 0.5], [ex, eyeY - h2], [ex + s * w2 * 1.05, eyeY - h2 * 1.35], [ex + s * w2, eyeY + h2 * 0.6], [ex - s * w2 * 0.9, eyeY + h2 * 0.8]],
             { closed: true, width: 2.2, wob: 0.9 });
    line(exL + w2, eyeY - h2 * 0.3, exR - w2, eyeY - h2 * 0.3, { width: 2 });
    temple(exL - w2, eyeY - h2 * 0.8, -1); temple(exR + w2, eyeY - h2 * 0.8, 1);
  } else if (specs === 'halfmoon') {
    const r = lensR * 0.78, y = eyeY + 3;
    for (const ex of [exL, exR]) { arc(ex, y, r, 0.05, Math.PI - 0.05, { width: 2, wob: 0.8 }); line(ex - r, y, ex + r, y, { width: 1.8, wob: 0.6 }); }
    line(exL + r, y, exR - r, y, { width: 1.8 });
    temple(exL - r, y, -1); temple(exR + r, y, 1);
  } else if (specs === 'monocle') {
    const ex = pick([exL, exR]);
    sketch([[ex - lensR, eyeY - lensR], [ex + lensR, eyeY - lensR], [ex + lensR, eyeY + lensR], [ex - lensR, eyeY + lensR]], { closed: true, width: 2.2, wob: 1 });
    line(ex, eyeY + lensR, ex + 4, eyeY + lensR + 12, { width: 1.4 });
  }
}

function drawFace(cx, cy, seed) {
  pen.seed(seed);

  /* ----- who is this? ----- */
  const age = wpick({ child: 1.2, young: 2.5, adult: 3, old: 2 });
  const gender = wpick({ masc: 1, fem: 1, neutral: 0.35 });
  const isChild = age === 'child', isOld = age === 'old';
  const fem = gender === 'fem', masc = gender === 'masc';
  const soft = fem ? 1 : masc ? 0 : 0.5;        // feminine styling weight
  const rough = masc ? 1 : fem ? 0 : 0.5;       // masculine styling weight
  const expr = wpick({ neutral: 3, happy: 2.2, surprised: 0.7, sleepy: 0.7, grumpy: isChild ? 0.4 : 1, sly: 0.5 });
  const dark = chance(isOld ? 0.2 : 0.55);       // ink-filled hair vs light/grey hatched hair

  /* ----- the pen and the marker box for this face ----- */
  pen.ink = pick(INKS);
  pen.w = rf(0.75, 1.45);                         // some faces are drawn with a fat nib, some fine
  const coloured = chance(0.62);
  const skin = coloured && chance(0.85) ? pick(SKINS) : null;
  const washMode = chance(0.32) ? 'scribble' : 'flat';
  const skinWash = skin ? { color: skin, alpha: rf(0.5, 0.85), mode: washMode, grow: rf(0.94, 1.1) } : null;
  const hairFill = pick(HAIR_DARK);              // ink-filled hair takes a near-black colour
  const hairTint = (coloured || chance(0.3)) && chance(0.7) ? { color: pick(HAIR_TINT), alpha: rf(0.4, 0.7), mode: washMode } : null;
  const hatWash = (coloured || chance(0.35)) ? { color: pick(HATS), alpha: rf(0.55, 0.85), mode: washMode } : null;
  const accent = { color: pick(ACCENTS), alpha: 0.8 };

  /* ----- geometry ----- */
  const rx = isChild ? rf(46, 60) : isOld ? rf(54, 74) : rf(56, 76);   // head half-width
  const ry = rx * (isChild ? rf(0.92, 1.1) : rf(1.0, 1.3));            // heads are a bit tall
  const tilt = rf(-0.09, 0.09);                // whole head leans
  const look = pick([-1, -0.5, 0, 0, 0.5, 1]); // gaze: -1 left … 1 right
  const shift = look * rx * 0.18;              // features slide toward gaze
  const hairTop = cy - ry * (isOld && masc ? rf(0.45, 0.7) : isChild ? rf(0.3, 0.5) : rf(0.25, 0.45));
  const eyeY = cy - ry * (isChild ? rf(-0.08, 0.04) : rf(0.02, 0.14));   // children carry their eyes lower
  const gap = rx * (isChild ? rf(0.4, 0.52) : rf(0.34, 0.5));
  const exL = cx - gap + shift, exR = cx + gap + shift;
  const partDir = pick([-1, 1]);

  /* ----- hair style, weighted by persona ----- */
  function hairTable() {
    const t = {};
    const add = (k, w) => { if (w > 0) t[k] = (t[k] || 0) + w; };
    add('curly', 1.5); add('afro', 0.7); add('cap', 0.7); add('beanie', 0.7); add('shaggy', 0.8);
    if (isChild) {
      add('bowl', 3); add('spiky', 2); add('bangs', 2.5); add('buzz', 0.8); add('mohawk', 0.3);
      add('pigtails', 3 * soft); add('bob', 2 * soft); add('braids', 1.5 * soft); add('ponytail', 1.5 * soft); add('long', 1 * soft);
    } else if (isOld) {
      add('bald', 3 * rough); add('comb', 2 * rough); add('wisps', 2); add('fedora', 1); add('beret', 0.5); add('cap', 0.6);
      add('bun', 3 * soft); add('bob', 1.5 * soft); add('headscarf', 1.5 * soft); add('long', 0.6 * soft); add('curly', 1.5 * soft);
    } else {
      add('bowl', 1.2); add('spiky', 1.5); add('buzz', 1); add('comb', 1); add('sidepart', 1.5); add('band', 0.7);
      add('mohawk', 0.35); add('fedora', 0.5); add('beret', 0.5); add('bald', 0.8 * rough);
      add('long', 3 * soft); add('bob', 2.5 * soft); add('bun', 1.5 * soft); add('ponytail', 2 * soft);
      add('braids', 1.5 * soft); add('pigtails', 0.3 * soft); add('headscarf', 0.8 * soft); add('bangs', 1 * soft);
    }
    return t;
  }
  const style = wpick(hairTable());
  const hats = ['cap', 'beanie', 'fedora', 'beret', 'headscarf'];
  const bow = !hats.includes(style) && !['bald', 'wisps', 'buzz', 'mohawk', 'band'].includes(style)
              && (isChild || soft > 0) && chance(0.12 + 0.12 * soft);

  pen.ctx.save();
  pen.ctx.translate(cx, cy);
  pen.ctx.rotate(tilt);
  pen.ctx.translate(-cx, -cy);

  const head = blobPts(cx, cy, rx, ry, rf(0.04, 0.09));

  /* hairlines: yAt(t) gives the hair's edge on the forehead for t in [-1,1] across the head */
  const bangsY = eyeY - rf(16, 24);
  const flatLine   = () => hairTop;
  const bangsLine  = () => bangsY;
  const middlePart = t => hairTop + 12 * Math.abs(t);
  const sidePart   = t => hairTop + 7 + 9 * t * partDir;

  const F = { cx, cy, seed, age, gender, isChild, isOld, fem, masc, soft, rough, expr, dark, skin, skinWash, hairFill, hairTint, hatWash, accent, rx, ry, look, shift, hairTop, eyeY, gap, exL, exR, partDir, style, hats, bow, head, flatLine, bangsLine, middlePart, sidePart };   // everything the parts need to know
  faceBackHair(F);
  faceHead(F);
  faceNeck(F);
  faceFrontHair(F);
  faceEars(F);
  faceEyes(F);
  faceBrows(F);
  faceNose(F);
  faceMouth(F);
  faceAge(F);
  faceCheeks(F);
  faceEyewear(F);

  pen.ctx.restore();
  return { age, gender, expr, style };
}


Sheet.register('faces', { name: 'faces', H: 2420, draw: drawFace, census: ['age', 'gender'], zoom: 1.2 });
})();
