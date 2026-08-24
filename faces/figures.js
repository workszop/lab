/* The figures collection: its drawing code, registered for its own sheet and for the mix.
   Wrapped in an IIFE so collections can share a page without their names colliding. */
(() => {
/* the marker box: colours from the CSS tokens */
const SKINS = toks('--skin', 7), HAIR_DARK = toks('--hair', 4), HAIR_TINT = toks('--tint', 4);
const HATS = toks('--hat', 5), CLOTHS = toks('--cloth', 7), ACCENTS = toks('--accent', 3);
let P = {};         // the marker box for the figure being drawn: skinWash, hairFill, hairTint, hatWash, accent

/* ============================================================
   THE HEAD
   Same face machinery, but the head now knows who it belongs
   to: the figure passes in size, gaze, and also age and gender
   leaning — which steer hairstyles, lashes, facial hair,
   wrinkles, blush, and eyewear.
   ============================================================ */
/* who wears what: each age/gender leaning draws from its own pool */
function hairStyleFor(fem, age) {
  const child = age === 'child', elder = age === 'elder';
  if (fem) return child ? pick(['pigtails','pigtails','long','bob','pony','band'])
              : elder ? pick(['bun','bun','curly','bob','wisps','beanie'])
              : pick(['long','long','bob','bob','pony','bun','curly','band','beanie','shaggy']);
  return child ? pick(['bowl','bowl','spiky','buzz','curly','shaggy'])
       : elder ? pick(['bald','bald','wisps','wisps','comb','cap','cap','beanie'])
       : pick(['bowl','bowl','spiky','curly','buzz','comb','bald','cap','beanie','band','shaggy']);
}

/* helper: clip everything that follows to the inside of the head */
function clipHeadFront(F, fn) {
  const { head } = F;
  pen.ctx.save();
  tracePath(wobblePts(head, 1, true), true);
  pen.ctx.clip();
  fn();
  pen.ctx.restore();
}

/* the solid black mop that several styles start from */
function mop(F, edgeY) {
  const { cx, cy, rx, ry } = F;
  clipHeadFront(F, () => {
    const edge = [[cx - rx * 1.2, edgeY + rf(-6, 6)]];
    for (let i = 1; i < 6; i++)
      edge.push([cx - rx * 1.2 + (i / 6) * rx * 2.4, edgeY + rf(-7, 7)]);
    edge.push([cx + rx * 1.2, edgeY], [cx + rx * 1.2, cy - ry * 1.5], [cx - rx * 1.2, cy - ry * 1.5]);
    sketch(edge, { closed: true, fill: true, fillColor: P.hairFill, wob: 1.5, width: 2 });
  });
}

function shine(F) {
  const { cx, cy, hairTop, rx, ry } = F;
  for (let i = 0; i < 3; i++) {
    const x = cx + rf(-rx * 0.5, rx * 0.5);
    penStyle(1.4); pen.ctx.strokeStyle = pen.base;
    pen.ctx.beginPath(); pen.ctx.moveTo(x, cy - ry * 0.95); pen.ctx.lineTo(x + rf(-4, 4), hairTop - rf(6, 14)); pen.ctx.stroke();
  }
}

/* strand texture for a full hair fill: short strokes falling from a parting
   near the crown, so a solid mop reads as hair rather than a glued-on cap */
function hairStrands(F, opt = {}) {
  const { cx, hairTop, rx, ry } = F;
  const n = opt.count ?? ri(8, 13);
  const part = opt.part ?? rf(-rx * 0.3, rx * 0.2);
  for (let i = 0; i < n; i++) {
    const x = cx + part + rf(-rx, rx) * (opt.span ?? 0.5);
    const y0 = hairTop + rf(2, ry * 0.35);
    const len = rf(ry * 0.3, ry * 0.7) * (opt.len ?? 1);
    line(x, y0, x + rf(-rx * 0.16, rx * 0.16), y0 + len, { width: rf(0.8, 1.2), wob: 1.6, taper: false, color: opt.color });
  }
}

/* a wispy, uneven hairline — little downward tufts instead of a clean arc —
   so the hair doesn't sit on the skull like a helmet */
function wispyHairline(F, dy = 0) {
  const { cx, hairTop, rx } = F;
  const hy = hairTop + dy;
  const n = ri(5, 8);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = cx - rx * 0.84 * (1 - t * 2);                                  // inside the skull's width
    const r = rf(3.5, 6);
    arc(x, hy + rf(-1, 1), r, 0.15, Math.PI - 0.15, { width: rf(1, 1.5), wob: 1.4 });   // tufts hang below the hairline, in ink on the skin
  }
}

/* a layered, directional hair fill for the women's styles — instead of one flat mop
   blob (reads as a glued cap), draw curving arc-fills that sweep from the crown
   outward, then top them with forward strand strokes so the hair has depth and flow */
function hairFill(F, opt = {}) {
  const { cx, hairTop, rx, ry } = F;
  const n = opt.strands ?? ri(5, 9);
  const part = opt.part ?? rf(-rx * 0.2, rx * 0.2);
  for (let i = 0; i < n; i++) {
    const x = cx + part + rf(-rx, rx) * (opt.span ?? 0.7);
    const y0 = hairTop - ry * rf(0.1, 0.35);
    const len = ry * rf(0.35, 0.8) * (opt.len ?? 1);
    /* arcs that bow outward from the crown, then drift down around the face */
    const a = rf(-1.6, 1.6) + (opt.push ?? 0);
    arc(x, y0, len, Math.PI + a * 0.4, Math.PI + a * 0.4 + rf(0.7, 1.2),
        { width: rf(0.8, 1.2), wob: 1.6, taper: false, color: pen.base });   // light on the dark mop, like shine()
  }
}

/* ----- hair & headwear (drawn first so features sit on top) ----- */
function headHair(F) {
  const { age, cx, cy, fem, look, rx, ry } = F;
  const hairTop = cy - ry * rf(0.25, 0.45);    // hairline height
  Object.assign(F, { hairTop });   // a hoisted helper below reads this

  const style = hairStyleFor(fem, age);
  const hideEars = style === 'long' || style === 'bob';   // hair covers them

  if (style === 'bowl') {
    mop(F, hairTop);
    hairStrands(F, { color: pen.base });
    wispyHairline(F);
    if (chance(0.5)) shine(F);
  }
  else if (style === 'long') {                  // falls past the chin onto the shoulders
    mop(F, hairTop);
    for (const s of [-1, 1])
      sketch([[cx + s * rx * 0.5, hairTop - 4],
              [cx + s * rx * 1.02, cy - ry * 0.3],
              [cx + s * rx * rf(0.95, 1.2), cy + ry * rf(1.4, 1.8)],
              [cx + s * rx * rf(0.35, 0.5), cy + ry * rf(1.5, 1.85)],
              [cx + s * rx * 0.55, cy + ry * 0.5]],
             { closed: true, fill: true, fillColor: P.hairFill, wob: 1.6, width: 2 });
    hairFill(F, { part: -look * rx * 0.3, span: 1.0, len: 1.2 });   // direction toward the gaze; after the falls, so it stays visible
    hairStrands(F, { count: ri(12, 18), len: 1.2, span: 0.6, color: pen.base });
    wispyHairline(F);
    for (const s of [-1, 1]) if (chance(0.5))              // stray wisps off the falls
      line(cx + s * rx * rf(0.5, 1.1), cy + ry * rf(0.85, 1.4), cx + s * rx * rf(0.9, 1.3), cy + ry * rf(1.3, 1.8), { width: 1, wob: 1.8, taper: false });
    if (chance(0.5)) shine(F);
  }
  else if (style === 'bob') {                   // ends in a clean line at the jaw
    mop(F, hairTop);
    for (const s of [-1, 1])
      sketch([[cx + s * rx * 0.55, hairTop - 4],
              [cx + s * rx * 1.05, cy - ry * 0.2],
              [cx + s * rx * 1.02, cy + ry * rf(0.65, 0.8)],
              [cx + s * rx * 0.55, cy + ry * rf(0.7, 0.85)],
              [cx + s * rx * 0.6, cy + ry * 0.1]],
             { closed: true, fill: true, fillColor: P.hairFill, wob: 1.4, width: 2 });
    hairFill(F, { span: 0.8, len: 0.8 });                            // after the side falls, so it stays visible
    hairStrands(F, { count: ri(9, 14), len: 0.9, color: pen.base });
    wispyHairline(F);
    if (chance(0.5)) for (const s of [-1, 1])                    // a wisp flipped out at the jaw
      line(cx + s * rx * 1.0, cy + ry * 0.7, cx + s * rx * 1.12, cy + ry * rf(0.95, 1.1), { width: 1, wob: 1.8, taper: false });
  }
  else if (style === 'pony') {                  // tail swings out behind the gaze
    mop(F, hairTop);
    const s = look < 0 ? 1 : -1;
    const tail = [[cx + s * rx * 0.85, hairTop + 6],
                  [cx + s * rx * rf(1.15, 1.4), cy + ry * rf(0.2, 0.5)],
                  [cx + s * rx * rf(0.95, 1.25), cy + ry * rf(1.1, 1.5)],
                  [cx + s * rx * 0.8, cy + ry * rf(0.85, 1.1)]];
    sketch(tail, { closed: true, fill: true, fillColor: P.hairFill, wob: 1.5, width: 2 });
    line(cx + s * rx * 0.88, hairTop + 8, cx + s * rx * 1.02, hairTop + 16, { width: 2.4 });   // band
    hairFill(F, { span: 0.6, len: 0.9, part: -look * rx * 0.2 });   // crown toward the gaze; after the tail, so it stays visible
    hairStrands(F, { count: ri(7, 11), len: 0.8, color: pen.base });
    wispyHairline(F);
    for (let i = 0; i < 3; i++)                       // tail strands
      line(cx + s * rx * 1.05, cy + ry * rf(0.4, 1.0) , cx + s * rx * rf(1.15, 1.3), cy + ry * rf(1.2, 1.7), { width: 1, wob: 1.6, taper: false });
  }
  else if (style === 'bun') {
    arc(cx, hairTop + 2, rx * 0.9, Math.PI * 1.05, Math.PI * 1.95, { width: 1.8, wob: 1 });
    if (chance(0.5)) hatch(cx - rx * 0.7, cy - ry * 0.95, cx + rx * 0.7, hairTop, ri(8, 16), rf(-0.4, 0.4) - Math.PI / 2, 12);
    sketch(blobPts(cx + rf(-6, 6), cy - ry * rf(1.0, 1.12), rx * rf(0.3, 0.42), rx * rf(0.26, 0.36), 0.1, 12),
           { closed: true, fill: chance(0.7), fillColor: P.hairFill, wash: P.hairTint, width: 2, wob: 1 });
    line(cx - rx * 0.2, cy - ry * 0.98, cx - rx * 0.32, cy - ry * 1.15, { width: 1.2 });       // stray strands
    line(cx + rx * 0.22, cy - ry * 0.98, cx + rx * 0.36, cy - ry * 1.12, { width: 1.2 });
    wispyHairline(F);
    if (chance(0.7)) for (let i = 0; i < ri(2, 3); i++)   // curls on the bun
      arc(cx + rf(-5, 5), cy - ry * rf(1.04, 1.09), rf(4, 7), rf(0.5, 1.5), rf(3, 5.5), { width: 1, wob: 1 });
  }
  else if (style === 'pigtails') {
    arc(cx, hairTop + 2, rx * 0.9, Math.PI * 1.05, Math.PI * 1.95, { width: 1.8, wob: 1 });
    if (chance(0.6)) hatch(cx - rx * 0.7, cy - ry * 0.95, cx + rx * 0.7, hairTop, ri(8, 16), rf(-0.4, 0.4) - Math.PI / 2, 12);
    for (const s of [-1, 1]) {
      sketch(blobPts(cx + s * rx * 1.12, cy - ry * rf(0.0, 0.15), rx * rf(0.26, 0.36), ry * rf(0.3, 0.42), 0.12, 10),
             { closed: true, fill: chance(0.6), fillColor: P.hairFill, wash: P.hairTint, width: 1.8, wob: 1 });
      line(cx + s * rx * 0.92, cy - ry * 0.12, cx + s * rx * 1.0, cy + ry * 0.02, { width: 2.4 });  // band
    }
    wispyHairline(F);
    for (const s of [-1, 1]) if (chance(0.6))        // a stray curl off each pigtail
      arc(cx + s * rx * 1.12 + rf(-2, 2), cy - ry * rf(0.02, 0.1), rf(3, 5), 0.3, 5.5, { width: 1, wob: 1 });
  }
  else if (style === 'wisps') {                 // thinning, kept tidy over the ears
    for (const s of [-1, 1])
      for (let i = 0; i < ri(3, 5); i++)
        arc(cx + s * rx * 0.8, cy - ry * 0.1 + i * 6, rf(6, 12),
            s > 0 ? -1.2 : Math.PI - 0.6, s > 0 ? 0.9 : Math.PI + 1.5, { width: 1.3, wob: 0.8 });
    if (chance(0.6)) hatch(cx - rx * 0.4, cy - ry * 1.05, cx + rx * 0.4, cy - ry * 0.85, ri(2, 5), -Math.PI / 2, 9);
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
  }
  else if (style === 'buzz') {
    clipHeadFront(F, () => stipple(cx, hairTop - ry * 0.28, rx * 0.95, ry * 0.4, ri(120, 260), 1));
    arc(cx, hairTop + 2, rx * 0.9, Math.PI * 1.05, Math.PI * 1.95, { width: 1.6, wob: 1 });
  }
  else if (style === 'comb') {
    clipHeadFront(F, () => {
      const dir = pick([-1, 1]);
      for (let i = 0; i < ri(8, 14); i++) {
        const y = cy - ry + rf(0, ry * 0.55);
        line(cx - dir * rx, y + rf(-3, 3), cx + dir * rx * 0.9, y + rf(6, 18), { wob: 1.6, width: rf(1.2, 2) });
      }
    });
  }
  else if (style === 'bald') {
    if (chance(0.6)) hatch(cx - rx * 0.5, cy - ry * 1.05, cx + rx * 0.5, cy - ry * 0.8, ri(3, 7), -Math.PI / 2, 10);
  }
  else if (style === 'cap') {                   // flat tweed cap
    const capY = hairTop - rf(0, 8);
    const cap = blobPts(cx, capY - ry * 0.28, rx * 1.08, ry * 0.5, 0.06, 14)
      .filter(p => p[1] <= capY + ry * 0.18);
    cap.push([cx + rx * 1.15, capY + 4], [cx - rx * 1.15, capY + 4]);
    sketch(cap, { closed: true, fill: true, fillColor: pen.base, wash: P.hatWash, wob: 1.4, width: 2.2 });
    stipple(cx, capY - ry * 0.3, rx * 0.85, ry * 0.32, ri(80, 160), 0.9);
    const dir = look >= 0 ? 1 : -1;             // brim toward gaze
    sketch([[cx + dir * rx * 0.2, capY + 3], [cx + dir * rx * 1.15, capY + rf(0, 6)], [cx + dir * rx * 0.9, capY + rf(10, 14)], [cx + dir * rx * 0.1, capY + 8]], { closed: true, fill: true, fillColor: pen.base, wash: P.hatWash && { ...P.hatWash, mode: 'flat' }, width: 2.2 });
  }
  else if (style === 'beanie') {
    const by = hairTop + rf(-4, 6);
    /* ribbed band */
    sketch([[cx - rx * 1.02, by], [cx + rx * 1.02, by]], { width: 2.4, wob: 1.6 });
    sketch([[cx - rx * 1.05, by + 14], [cx + rx * 1.05, by + 14]], { width: 2.4, wob: 1.6 });
    for (let x = cx - rx * 0.95; x < cx + rx * 0.95; x += rf(6, 10))
      line(x, by + 1, x + rf(-2, 2), by + 13, { wob: 0.8, width: 1.4 });
    /* dome */
    const dome = blobPts(cx, by - ry * 0.18, rx * 1.02, ry * 0.42, 0.05, 14).filter(p => p[1] <= by + 2);
    dome.push([cx + rx * 1.02, by], [cx - rx * 1.02, by]);
    sketch(dome, { closed: true, fill: true, fillColor: pen.base, wash: P.hatWash, wob: 1.4, width: 2.2 });
    if (chance(0.5)) stipple(cx, by - ry * 0.25, rx * 0.8, ry * 0.25, ri(60, 120), 0.9);
    else hatch(cx - rx * 0.8, by - ry * 0.55, cx + rx * 0.8, by - 4, ri(15, 30), rf(0.5, 1.1), 12);
  }
  else if (style === 'band') {                  // headband + dark hair above
    const by = hairTop + rf(0, 8);
    clipHeadFront(F, () => {
      sketch([[cx - rx * 1.2, by - 10], [cx + rx * 1.2, by - 10], [cx + rx * 1.2, cy - ry * 1.5], [cx - rx * 1.2, cy - ry * 1.5]], { closed: true, fill: true, fillColor: P.hairFill, wob: 1.5, width: 2 });
    });
    sketch([[cx - rx * 1.02, by], [cx + rx * 1.02, by - rf(0, 4)]], { width: 3, wob: 1.6 });
    sketch([[cx - rx * 1.02, by - 10], [cx + rx * 1.02, by - 12]], { width: 3, wob: 1.6 });
    hairStrands(F, { count: ri(5, 9), len: 0.6, span: 0.7 });
  }
  Object.assign(F, { hairTop, hideEars });
}

/* ----- ears : little "C" marks on the cheeks ----- */
function headEars(F) {
  const { child, cx, cy, fem, hideEars, look, rx, ry, shift } = F;
  const earY = cy + ry * rf(-0.05, 0.12);
  const earR = Math.min(13, ry * rf(0.13, 0.17));                    // grows with the head, but never into the eye band
  const ears = [];
  if (!hideEars) {
    if (look >= -0.5) {
      arc(cx - rx * 0.68 + shift * 0.4, earY, earR, Math.PI * 0.6, Math.PI * 1.5, { width: 1.8, wob: 0.8 });
      ears.push(cx - rx * 0.68 + shift * 0.4);
    }
    if (look <= 0.5 && chance(0.8)) {
      arc(cx + rx * 0.68 + shift * 0.4, earY, earR, -Math.PI * 0.5, Math.PI * 0.45, { width: 1.8, wob: 0.8 });
      ears.push(cx + rx * 0.68 + shift * 0.4);
    }
  }
  /* earrings: a stud or a little dangler */
  if (fem && !child && ears.length && chance(0.45)) {
    for (const ex2 of ears) {
      penStyle(1);
      const lobe = earY + earR * 0.55;                             // earrings hang off the lobe, not the ear's whole radius
      if (chance(0.5)) { pen.ctx.beginPath(); pen.ctx.arc(ex2, lobe + 3, 2, 0, 7); pen.ctx.fill(); }
      else {
        line(ex2, lobe, ex2 + rf(-2, 2), lobe + 7, { width: 1 });
        penStyle(1); pen.ctx.beginPath(); pen.ctx.arc(ex2, lobe + 9, 2.2, 0, 7); pen.ctx.fill();
      }
    }
  }
}

/* ----- eyes ----- */
function headEyes(F) {
  const { child, cx, cy, fem, look, rx, ry, shift } = F;
  const eyeY = cy - ry * rf(0.02, 0.14);
  const gap = rx * rf(0.34, 0.5);
  const exL = cx - gap + shift, exR = cx + gap + shift;
  const eyeKind = child ? pick(['big','big','big','ring','dot','mix'])
                        : pick(['big','big','ring','ring','dot','mix','wink']);   // cartoon eyes run big

  function eye(x, kind, s) {
    if (kind === 'dot') { penStyle(1); pen.ctx.beginPath(); pen.ctx.arc(x, eyeY, rf(2, 3.2), 0, 7); pen.ctx.fill(); return; }
    if (kind === 'wink') { arc(x, eyeY, rf(5, 8), 0.15, Math.PI - 0.15, { width: 2 }); return; }
    const r = kind === 'big' ? rf(12, 19) * s : rf(7, 10) * s;
    arc(x, eyeY, r, 0, Math.PI * 2, { width: 1.8, wob: 0.9 });
    if (fem) {                                  // three little lashes, top-outer
      const so = x < cx + shift ? -1 : 1;
      for (let k = 0; k < 3; k++) {
        const a = -Math.PI / 2 + so * (0.35 + k * 0.35);
        line(x + Math.cos(a) * r, eyeY + Math.sin(a) * r,
             x + Math.cos(a) * (r + 5), eyeY + Math.sin(a) * (r + 5), { width: 1.2, wob: 0.4 });
      }
    }
    const px = x + look * r * 0.35 + rf(-1, 1), py = eyeY + rf(-1, 2);
    penStyle(1); pen.ctx.beginPath(); pen.ctx.arc(px, py, Math.max(2, r * rf(0.3, 0.45)), 0, 7); pen.ctx.fill();
  }
  if (eyeKind === 'mix') { eye(exL, 'ring', rf(0.7, 1)); eye(exR, pick(['big','dot','wink']), 1); }
  else if (eyeKind === 'wink') { eye(exL, 'wink'); eye(exR, 'ring', 1); }
  else { const s2 = rf(0.7, 1.35); eye(exL, eyeKind, 1); eye(exR, eyeKind, s2); }
  Object.assign(F, { exL, exR, eyeY, gap });
}

/* ----- eyebrows ----- */
function headBrows(F) {
  const { child, elder, exL, exR, eyeY, fem } = F;
  const browKind = elder ? pick(['thick','thick','arc','none'])
                 : child ? pick(['none','none','none','arc'])
                 : fem   ? pick(['arc','arc','none','none'])
                 : pick(['none','none','arc','thick','arc']);
  if (browKind !== 'none') {
    const by = eyeY - rf(11, 18);
    const bw = browKind === 'thick' ? rf(3, 5) : fem ? 1.6 : 2;
    if (chance(0.75)) arc(exL, by + 4, rf(8, 12), Math.PI * 1.15, Math.PI * 1.85, { width: bw });
    if (chance(0.75)) arc(exR, by + 4, rf(8, 12), Math.PI * 1.15, Math.PI * 1.85, { width: bw });
  }
}

/* ----- nose : a bent stroke with a hook (short on kids, long on elders) ----- */
function headNose(F) {
  const { child, cx, elder, eyeY, look, ry, shift } = F;
  const nx = cx + shift * 1.4, nTop = eyeY + rf(2, 8);
  const nLen = ry * rf(0.22, 0.4) * (child ? 0.65 : elder ? 1.15 : 1);
  const hook = pick([-1, 1]) * rf(4, elder ? 15 : 12) + look * 6;
  sketch([[nx + rf(-2, 2), nTop], [nx + hook * 0.3, nTop + nLen * 0.7], [nx + hook, nTop + nLen]], { width: 2, wob: 1 });
  if (chance(0.5)) arc(nx + hook * 0.4, nTop + nLen + 1, 3, 0, Math.PI, { width: 1.6 });  // nostril curl
  Object.assign(F, { nLen, nTop });
}

/* ----- mouth & facial hair ----- */
function headMouth(F) {
  const { child, cx, cy, elder, fem, nLen, nTop, rx, ry, shift, teen } = F;
  const mY = nTop + nLen + rf(12, 20);
  const mx = cx + shift;
  const mouthKind = child ? pick(['smile','smile','open','flat','open'])
                  : fem   ? pick(['lips','lips','smile','flat','open'])
                  : elder ? pick(['flat','flat','smile','frown','lips'])
                  : pick(['flat','flat','smile','lips','open','frown']);

  let stache = 'none', beard = 'none';
  if (!fem && !child) {
    if (teen) { stache = chance(0.12) ? 'thin' : 'none'; beard = chance(0.12) ? 'stubble' : 'none'; }
    else if (elder) {
      stache = pick(['none','thin','bushy','bushy','handlebar']);
      beard = pick(['none','none','full','stubble','goatee']);
    } else {
      stache = pick(['none','none','none','thin','bushy','handlebar']);
      beard = pick(['none','none','none','none','stubble','goatee','full']);
    }
  }

  if (stache === 'bushy') {
    sketch([[mx - rf(14, 20), mY - 4], [mx, mY - rf(8, 11)], [mx + rf(14, 20), mY - 4], [mx, mY - 2]], { closed: true, fill: true, width: 2, wob: 1 });
  } else if (stache === 'thin') {
    arc(mx - 7, mY - 4, 7, Math.PI * 1.1, Math.PI * 1.9, { width: 1.6 });
    arc(mx + 7, mY - 4, 7, Math.PI * 1.1, Math.PI * 1.9, { width: 1.6 });
  } else if (stache === 'handlebar') {
    arc(mx - 10, mY - 6, 9, Math.PI * 0.9, Math.PI * 1.9, { width: 2.4 });
    arc(mx + 10, mY - 6, 9, Math.PI * 1.1, Math.PI * 2.1, { width: 2.4 });
  }

  if (mouthKind === 'open') {
    sketch(blobPts(mx, mY + 4, rf(6, 10), rf(4, 7), 0.1, 10), { closed: true, fill: true, width: 1.5 });
  } else if (mouthKind === 'lips') {
    sketch([[mx - 10, mY + 2], [mx - 4, mY - 1], [mx, mY + 1], [mx + 4, mY - 1], [mx + 10, mY + 2]], { width: 1.8, wob: 0.8 });
    sketch([[mx - 8, mY + 2], [mx, mY + rf(4, 6)], [mx + 8, mY + 2]], { width: 1.8, wob: 0.8 });
  } else if (mouthKind === 'smile') {
    arc(mx, mY - 2, rf(8, 14), 0.25, Math.PI - 0.25, { width: 2 });
  } else if (mouthKind === 'frown') {
    arc(mx, mY + 8, rf(8, 12), Math.PI * 1.2, Math.PI * 1.8, { width: 2 });
  } else {
    line(mx - rf(6, 12), mY + rf(-2, 2), mx + rf(6, 12), mY + rf(-2, 2), { width: 2 });
  }

  if (beard === 'stubble') {
    clipHeadFront(F, () => stipple(cx + shift * 0.5, cy + ry * 0.62, rx * 0.8, ry * 0.42, ri(120, 240), 0.9));
  } else if (beard === 'goatee') {
    sketch(blobPts(mx, mY + rf(12, 16), rf(7, 11), rf(5, 9), 0.1, 10), { closed: true, fill: true, width: 1.5 });
  } else if (beard === 'full') {
    clipHeadFront(F, () => {
      const top = mY - 6;
      sketch([[cx - rx * 1.2, top], [cx + rx * 1.2, top], [cx + rx * 1.2, cy + ry * 1.5], [cx - rx * 1.2, cy + ry * 1.5]], { closed: true, fill: true, wob: 2, width: 2 });
    });
    /* redraw the mouth on top of the beard in paper colour */
    pen.ctx.strokeStyle = pen.base; pen.ctx.lineWidth = 4;
    pen.ctx.beginPath(); pen.ctx.moveTo(mx - 8, mY + 2); pen.ctx.lineTo(mx + 8, mY + 2); pen.ctx.stroke();
  }
  Object.assign(F, { beard, mY, mx });
}

/* ----- age marks ----- */
function headAge(F) {
  const { beard, child, cx, cy, elder, exL, exR, eyeY, gap, mY, mx, rx, ry, shift } = F;
  if (elder) {
    for (let i = 0; i < ri(2, 3); i++)          // forehead lines
      line(cx + shift - rx * 0.4, cy - ry * 0.58 + i * 7,
           cx + shift + rx * 0.4, cy - ry * 0.58 + i * 7 + rf(-3, 3), { width: 1.1, wob: 1.6 });
    for (const [ex2, s] of [[exL, -1], [exR, 1]])   // crow's feet
      for (let k = 0; k < 2; k++)
        line(ex2 + s * gap * 0.55, eyeY + k * 4 - 2, ex2 + s * (gap * 0.55 + 7), eyeY + k * 5 - 4, { width: 1 });
    if (beard === 'none') {                     // smile lines beside the mouth
      arc(mx - 14, mY - 2, 8, Math.PI * 0.6, Math.PI * 1.2, { width: 1.1 });
      arc(mx + 14, mY - 2, 8, Math.PI * 1.8, Math.PI * 2.4, { width: 1.1 });
    }
  }
  if (child && chance(0.35)) {                  // blush ticks on the cheeks
    for (const s of [-1, 1])
      for (let k = 0; k < 2; k++)
        line(mx + s * (16 + k * 5), mY - 12, mx + s * (20 + k * 5), mY - 6, { width: 1.1, wob: 0.5 });
  }

  /* freckles / cheek dots */
  if (chance(child ? 0.45 : 0.18)) { stipple(exL - 6, mY - 14, 9, 6, ri(4, 8), 0.8); stipple(exR + 6, mY - 14, 9, 6, ri(4, 8), 0.8); }
}

/* ----- eyewear (on top of everything) ----- */
function headEyewear(F) {
  const { child, cx, elder, exL, exR, eyeY, gap, rx, shift } = F;
  const specs = elder ? pick(['round','round','square','pince','monocle','none','none'])
              : child ? pick(['none','none','none','none','none','none','round'])
              : pick(['none','none','none','none','round','square','monocle','shades','pince']);
  const lensR = gap * rf(0.5, 0.65);
  if (specs === 'round' || specs === 'pince') {
    arc(exL, eyeY, lensR, 0, Math.PI * 2, { width: 2, wob: 1 });
    arc(exR, eyeY, lensR, 0, Math.PI * 2, { width: 2, wob: 1 });
    if (specs === 'round') {
      line(exL + lensR, eyeY, exR - lensR, eyeY, { width: 1.8 });
      line(exL - lensR, eyeY, cx - rx * 0.98 + shift * 0.3, eyeY - 3, { width: 1.6 });
      line(exR + lensR, eyeY, cx + rx * 0.98 + shift * 0.3, eyeY - 3, { width: 1.6 });
    } else {
      arc(cx + shift, eyeY - lensR * 0.4, lensR * 0.5, Math.PI * 1.1, Math.PI * 1.9, { width: 1.8 });
    }
  } else if (specs === 'square' || specs === 'shades') {
    const w2 = lensR * 1.1, h2 = lensR * 0.85;
    for (const ex of [exL, exR])
      sketch([[ex - w2, eyeY - h2], [ex + w2, eyeY - h2], [ex + w2, eyeY + h2], [ex - w2, eyeY + h2]],
             { closed: true, width: 2.2, wob: 1, fill: specs === 'shades' || chance(0.4) });
    line(exL + w2, eyeY - h2 * 0.5, exR - w2, eyeY - h2 * 0.5, { width: 2 });
    line(exL - w2, eyeY, cx - rx * 0.98 + shift * 0.3, eyeY - 3, { width: 1.6 });
    line(exR + w2, eyeY, cx + rx * 0.98 + shift * 0.3, eyeY - 3, { width: 1.6 });
  } else if (specs === 'monocle') {
    const ex = pick([exL, exR]);
    sketch([[ex - lensR, eyeY - lensR], [ex + lensR, eyeY - lensR], [ex + lensR, eyeY + lensR], [ex - lensR, eyeY + lensR]], { closed: true, width: 2.2, wob: 1 });
    line(ex, eyeY + lensR, ex + 4, eyeY + lensR + 12, { width: 1.4 });
  }
}

function drawHead(cx, cy, seed, rx, ry, tilt, look, fem, age, view = 'front') {
  pen.seed(seed);

  const child = age === 'child', teen = age === 'teen', elder = age === 'elder';
  const shift = look * rx * (view === 'quarter' ? 0.26 : 0.18);   // features slide toward gaze, more on a turned head

  pen.ctx.save();
  pen.ctx.translate(cx, cy);
  pen.ctx.rotate(tilt);
  pen.ctx.translate(-cx, -cy);

  /* ----- head ----- */
  const head = blobPts(cx, cy, rx, ry, rf(0.04, 0.09));
  sketch(head, { closed: true, fill: true, fillColor: pen.base, wash: P.skinWash, wob: 1.2, width: rf(2.2, 3.2) });

  const F = { cx, cy, seed, rx, ry, tilt, look, fem, age, view, child, teen, elder, shift, head };   // everything the parts need to know
  headHair(F);
  headEars(F);
  headEyes(F);
  headBrows(F);
  headNose(F);
  headMouth(F);
  headAge(F);
  headEyewear(F);

  pen.ctx.restore();
}




/* ============================================================
   ONE FIGURE
   The figure decides the big things (head size, gaze, overall
   scale), builds a small skeleton — shoulders, elbows, wrists,
   hips, knees, ankles — fleshes it out with tapered limbs and
   a curved torso, dresses it, and only then puts the head on
   top so the chin overlaps the collar like a quick sketch.
   ============================================================ */

/* a jointed, tapered limb: joint positions along the bone plus a
   width at each joint, outlined as one closed wobbly shape — so
   elbows and knees actually read as bends, not as two sticks.
   Filled with paper, so a limb drawn later sits in front of what
   was drawn before (an arm across a chest, a leg across a leg). */
function limb(joints, widths, opt = {}) {
  /* flesh out the bone: a point between each pair of joints, a little
     wider than either end, so the segment swells like a muscle */
  const J = [], Wd = [];
  for (let i = 0; i < joints.length; i++) {
    J.push(joints[i]); Wd.push(widths[i]);
    if (i < joints.length - 1) {
      const a = joints[i], b = joints[i + 1];
      J.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
      Wd.push(Math.max(widths[i], widths[i + 1]) * (opt.bulge ?? 1.12));
    }
  }
  const Lft = [], Rgt = [];
  for (let i = 0; i < J.length; i++) {
    const p = J[i];
    const a = J[Math.max(0, i - 1)], b = J[Math.min(J.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len, w = Wd[i] / 2;
    Lft.push([p[0] + nx * w, p[1] + ny * w]);
    Rgt.push([p[0] - nx * w, p[1] - ny * w]);
  }
  /* round the far end (wrist / ankle) with an extra point */
  const e = J[J.length - 1], pe = J[J.length - 2];
  const ex = e[0] - pe[0], ey = e[1] - pe[1], el = Math.hypot(ex, ey) || 1;
  const cap = [e[0] + ex / el * Wd[Wd.length - 1] * 0.35, e[1] + ey / el * Wd[Wd.length - 1] * 0.35];
  sketch(Lft.concat([cap], Rgt.reverse()), { closed: true, wob: opt.wob ?? 1.2, width: opt.width ?? 2.4, fill: opt.fill !== false, fillColor: pen.base, wash: opt.wash });
}

function clipTorso(F, fn) {
  const { torso } = F;
  pen.ctx.save();
  tracePath(wobblePts(torso, 1, true), true);
  pen.ctx.clip();
  fn();
  pen.ctx.restore();
}

function hand(F, x, y, ang, { sc = 1, thumbTo = [0, 0], fingers = true, point = false } = {}) {
  const { fill, grow, skinOn, unit } = F;
  /* oversize cartoon paw: big palm, chunky fingers — hands are a classic exaggeration */
  const BIG = 2.5;                              // how oversized the hands are
  const L = 14 * unit * sc * grow * BIG, Wd = 11 * unit * sc * grow * BIG;
  const ux = Math.cos(ang), uy = Math.sin(ang), px = -uy, py = ux;
  const ts = (px * thumbTo[0] + py * thumbTo[1]) >= 0 ? 1 : -1;
  const P = (a, b) => [x + ux * a + px * b, y + uy * a + py * b];
  const skinDab = skinOn && { ...skinOn, dx: rf(-2, 2), dy: rf(-2, 2) };
  /* the palm: a rounded pad from the wrist, the fingers grow out of it */
  sketch([P(-Wd * 0.1, Wd * 0.42), P(L * 0.3, Wd * 0.5), P(L * 0.56, Wd * 0.34),
          P(L * 0.6, Wd * 0.08), P(L * 0.6, -Wd * 0.08), P(L * 0.56, -Wd * 0.34),
          P(L * 0.3, -Wd * 0.5), P(-Wd * 0.1, -Wd * 0.42)],
         { closed: true, fill: true, fillColor: pen.base, wash: skinDab, width: 2, wob: 0.8 });
  if (fingers) {
    /* a few finger dispositions so palms don't all look alike — each hand picks
       one: extended fingers (how long they are) × tuck (ring/pinky folded in). */
    const config = pick([
      { e: [1, 1, 1, 1], cuff: 0 },                 // all open
      { e: [1, 1, 1, 0.6], cuff: 0 },               // pinky half-tucked
      { e: [0.7, 1, 1, 0.5], cuff: 0 },             // index & pinky relaxed
      { e: [0.7, 1, 1, 0], cuff: 1 },               // pinky folded wholly in
      { e: [1, 1, 0.8, 0.8], cuff: 0.4 },           // slight curl, even
      { e: [0.5, 0.9, 0.7, 0], cuff: 0.8 },         // clenched: pinky in, thumb forward
    ]);
    /* the four finger spines, in [lateral, length] — lengths driven by config;
       kept shorter than the palm so the paw reads chunky, not clawed */
    const spines = [[-1.35, 0.48], [-0.45, 0.72], [0.45, 0.65], [1.35, 0.45]];
    for (let k = 0; k < 4; k++) {
      const [off, base] = spines[k];
      const ext = config.e[k] * rf(0.9, 1.06);
      if (ext < 0.35) continue;                     // folded wholly in — don't draw
      const len = L * base * ext;
      const a0 = L * 0.42, b0 = (off / 1.35) * Wd * 0.34;
      const a1 = a0 + len;
      const b1 = b0 + off * (rf(0.6, 2.4) * 0.4 + config.cuff * 0.3); // splay shrinks as it clenches
      const da = a1 - a0, db = b1 - b0, dl = Math.hypot(da, db) || 1;
      const nA = -db / dl, nB = da / dl;
      const wB = Wd * 0.17, wT = Wd * 0.1;
      sketch([P(a0 + nA * wB, b0 + nB * wB), P(a1 + nA * wT, b1 + nB * wT),
              P(a1 - nA * wT, b1 - nB * wT), P(a0 - nA * wB, b0 - nB * wB)],
             { closed: true, fill: true, fillColor: pen.base, wash: skinDab, width: 1.2, wob: 0.6 });
    }
    /* a knuckle crease so the palm reads as a palm, not a plain oval */
    const [cxp, cyp] = P(L * 0.32, 0);
    arc(cxp, cyp - Wd * 0.05, rf(3, 4), Math.PI * 1.1, Math.PI * 1.9, { width: 1, wob: 0.6 });
  }
  /* the thumb: a short fat lobe off the side of the palm */
  sketch([P(L * 0.15, Wd * 0.45 * ts), P(L * 0.35, Wd * 1.0 * ts), P(L * 0.55, Wd * 0.95 * ts), P(L * 0.6, Wd * 0.5 * ts)],
         { width: 1.8, wob: 0.6 });
  if (point) {
    /* a pointing index: one long tapered finger growing out of the palm's edge */
    const a0 = L * 0.55, a1 = L * rf(1.1, 1.25), b1 = -Wd * rf(0, 0.12);
    const wB = Wd * 0.14, wT = Wd * 0.06;
    sketch([P(a0, wB), P(a1, b1 + wT), P(a1, b1 - wT), P(a0, -wB)],
           { closed: true, fill: true, fillColor: pen.base, wash: skinDab, width: 1.4, wob: 0.6 });
    return P(a1, b1);
  }
  return P(L * 0.62, 0);                        // the visible palm edge: where a grip or a prop sits
}

function arm(F, s, elbow, wrist) {
  const { angOf, armW, clothWash, shX, skinOn, sleeves, sy0 } = F;
  limb([[shX(s), sy0 - 2], elbow, wrist], [armW * 1.15, armW * 0.82, armW * 0.62], { width: 2.4, wash: sleeves ? clothWash : skinOn });
  return angOf(elbow, wrist);                  // the forearm's direction, for the hand
}

function armDown(F, s, swing = 0) {
  const { hipW, hipY, shW, sy0, torsoH } = F;
  const wx = s * (hipW + rf(12, 20)) + swing, wy = hipY + rf(-2, 8) - Math.abs(swing) * 0.2;
  const a = arm(F, s, [s * (shW + rf(0, 6)) + swing * 0.45, sy0 + torsoH * 0.5], [wx, wy]);
  return hand(F, wx, wy, a, { thumbTo: [-s, 0] });   // the palm edge: where a prop sits
}

function armWave(F, s) {
  const { chin, ry, shW, sy0 } = F;
  const wx = s * (shW + rf(12, 26)), wy = chin - rf(0, ry * 0.5);
  const a = arm(F, s, [s * (shW + rf(14, 24)), sy0 - rf(0, 8)], [wx, wy]);
  hand(F, wx, wy, a, { thumbTo: [-s, 0] });
  if (chance(0.6))                            // little motion arcs
    for (const r of [17, 25])
      arc(wx, wy - 6, r, s > 0 ? -0.8 : Math.PI - 0.4, s > 0 ? 0.4 : Math.PI + 0.8, { width: 1.2, wob: 0.6 });
}

function armPocket(F, s) {
  const { hipW, hipY, shW, sy0, torsoH } = F;
  const wx = s * hipW * 0.75, wy = hipY - rf(8, 16);
  const a = arm(F, s, [s * (shW + rf(2, 8)), sy0 + torsoH * 0.35], [wx, wy]);
  /* a small knuckle peek out of the pocket top so the hand still reads */
  hand(F, wx, wy - 2, a + s * 0.3, { sc: 0.22, thumbTo: [-s, -1], fingers: false });
}

function armHip(F, s) {
  const { shW, sy0, torsoH, waistW, waistY } = F;
  const wx = s * waistW * 0.95, wy = waistY - 2;
  const a = arm(F, s, [s * (shW + rf(14, 22)), sy0 + torsoH * 0.42], [wx, wy]);
  hand(F, wx, wy, a + s * 0.4, { sc: 0.9, thumbTo: [0, -1] });
}

function armsCrossed(F) {
  const { shW, shoulderY, torsoH } = F;
  const chestY = shoulderY + torsoH * 0.4;
  arm(F, -1, [-shW * 0.95, chestY], [shW * 0.32, chestY + 5]);
  const a = arm(F, 1, [shW * 0.95, chestY - 4], [-shW * 0.32, chestY - 2]);
  hand(F, -shW * 0.32, chestY - 2, a + 0.5, { sc: 0.85, thumbTo: [0, -1] });     // hand tucked over the far arm
}

function armShrug(F, s) {
  const { shW, sy0 } = F;
  const wx = s * (shW + rf(18, 26)), wy = sy0 - rf(4, 12);
  const a = arm(F, s, [s * (shW + rf(4, 10)), sy0 + 16], [wx, wy]);
  hand(F, wx, wy, a - s * 0.4, { thumbTo: [-s, -1] });
}

function armPoint(F, s) {
  const { shW, sy0 } = F;
  const wx = s * (shW + rf(30, 40)), wy = sy0 - rf(4, 18);
  const a = arm(F, s, [s * (shW + rf(10, 18)), sy0 - 2], [wx, wy]);
  hand(F, wx, wy, a, { sc: 0.9, fingers: false, point: true, thumbTo: [0, -1] });   // the index grows out of the palm
}

function armChin(F, s) {
  const { chin, rx, shW, waistY } = F;
  const a = arm(F, s, [s * shW * 0.92, waistY - 6], [s * rx * 0.38, chin + 8]);
  hand(F, s * rx * 0.38, chin + 8, a, { sc: 0.9, thumbTo: [-s, 0] });
  arm(F, -s, [-s * (shW + 4), waistY], [s * shW * 0.28, waistY + 2]);     // arm bracing the elbow
}

/* hands clasped behind the back — the wrist curves out around the hip so a
   peek of hand still shows on a figure facing us */
function armBehind(F, s) {
  const { hipW, hipY, shW, sy0, torsoH } = F;
  for (const d of [-1, 1]) {                   // both arms swing back, staying outside the hips
    const wx = d * (hipW + rf(2, 8)), wy = hipY - rf(4, 12);
    const a = arm(F, d, [d * (shW + rf(2, 8)), sy0 + torsoH * 0.45], [wx, wy]);
    /* a knuckle peek of the clasped hands shows past one hip, on the wrist it belongs to */
    if (d === s) hand(F, wx, wy, a + d * 0.4, { sc: 0.35, thumbTo: [-d, 0], fingers: false });
  }
}

function leg(F, s, kneeDX, kneeDY, ankleDX, ankleUp) {
  const { footY, hemY, hipW, hipY, legH, legKind, legWash, q, skinOn, thighW, view } = F;
  const hx = q(s * hipW * 0.52);
  const kneeY = hipY + legH * 0.52 + kneeDY;
  const kX = hx + kneeDX, aX = hx + ankleDX, aY = footY - ankleUp;
  if (legKind === 'shorts') {
    limb([[hx, hipY - 6], [kX, kneeY]], [thighW, thighW * 0.82], { width: 2.4, wash: legWash });
    line(kX - thighW * 0.4, kneeY, kX + thighW * 0.4, kneeY + 2, { width: 1.8 });       // hem
    limb([[kX, kneeY], [aX, aY]], [thighW * 0.58, thighW * 0.4], { width: 2.2, wash: skinOn });   // bare shin
  } else if (legKind === 'skirt' || legKind === 'coatlegs') {
    const topY = (legKind === 'skirt' ? hemY : hipY) - 6;
    limb([[(hx + kX) / 2, topY], [kX, (topY + aY) / 2], [aX, aY]],
         [thighW * 0.56, thighW * 0.46, thighW * 0.36], { width: 2.2, wash: legKind === 'skirt' ? skinOn : legWash });
  } else {                                    // trousers over the whole leg
    limb([[hx, hipY - 6], [kX, kneeY], [aX, aY]], [thighW, thighW * 0.76, thighW * 0.5], { width: 2.4, wash: legWash });
    if (chance(0.35) && Math.abs(kneeDX) < 6)                                            // knee crease
      line(kX - 4, kneeY, kX + 5, kneeY + rf(-2, 2), { width: 1.3 });
    if (chance(0.4))                                                                     // cuff
      line(aX - thighW * 0.25, aY - 8, aX + thighW * 0.25, aY - 7, { width: 1.4 });
  }
  return [aX, aY];
}

function drawOutfit(F) {
  const { armpitY, belly, child, coat, depth, dir, f, fem, hipW, hipY, neckW, outfit, shW, shoulderY, slope, torsoH, view, waistW, waistY } = F;
  if (outfit === 'buttons') {
    line(0, shoulderY + 12, 0, hipY - 6, { width: 1.6, wob: 1.2 });
    penStyle(1);
    for (let i = 0; i < ri(3, 5); i++) {
      const y = shoulderY + 20 + i * (torsoH - 30) / 4;
      pen.ctx.beginPath(); pen.ctx.arc(rf(-2, 2), y, 2.4, 0, 7); pen.ctx.fill();
    }
  }
  else if (outfit === 'stripes') {
    clipTorso(F, () => {
      for (let y = shoulderY + 12; y < hipY - 4; y += rf(12, 18))
        line(-shW * 1.1, y, shW * 1.1, y + rf(-5, 5), { width: 2, wob: 1.4 });
    });
  }
  else if (outfit === 'sweater') {
    clipTorso(F, () => hatch(-shW, shoulderY + 8, shW, hipY, ri(28, 48), rf(0.6, 1.0), 14));
    line(-neckW - 6, shoulderY + 2, neckW + 6, shoulderY + 2, { width: 2.6, wob: 1.2 });
  }
  else if (outfit === 'jacket') {
    sketch([[-neckW, shoulderY - 2], [-rf(4, 8), shoulderY + torsoH * 0.42], [0, shoulderY + torsoH * 0.52]], { width: 2, wob: 1 });
    sketch([[neckW, shoulderY - 2], [rf(4, 8), shoulderY + torsoH * 0.42], [0, shoulderY + torsoH * 0.52]], { width: 2, wob: 1 });
    line(0, shoulderY + torsoH * 0.52, 0, hipY - 4, { width: 1.8, wob: 1.2 });
    if (chance(0.5))                          // breast pocket square
      line(dir * shW * 0.5, shoulderY + torsoH * 0.35, dir * shW * 0.7, shoulderY + torsoH * 0.35, { width: 1.6 });
  }
  else if (outfit === 'overalls') {
    const bw = shW * 0.5, bibTop = shoulderY + torsoH * 0.28;
    {
      sketch([[-bw, hipY], [-bw, bibTop], [bw, bibTop], [bw, hipY]], { width: 2, wob: 1.2 });
      line(-neckW - 4, shoulderY, -bw + 6, bibTop + 2, { width: 2 });
      line(neckW + 4, shoulderY, bw - 6, bibTop + 2, { width: 2 });
      penStyle(1);
      pen.ctx.beginPath(); pen.ctx.arc(-bw + 8, bibTop + 8, 2.6, 0, 7); pen.ctx.fill();
      pen.ctx.beginPath(); pen.ctx.arc(bw - 8, bibTop + 8, 2.6, 0, 7); pen.ctx.fill();
    }
  }
  else if (outfit === 'coat') {
    {
      line(0, shoulderY + 12, 0, hipY - 8, { width: 1.8, wob: 1.4 });
      penStyle(1);
      for (const sx of [-7, 7])
        for (let i = 0; i < 3; i++) {
          const y = shoulderY + torsoH * 0.25 + i * torsoH * 0.18;
          pen.ctx.beginPath(); pen.ctx.arc(sx, y, 2.4, 0, 7); pen.ctx.fill();
        }
      for (const s of [-1, 1])                // pocket flaps
        line(s * hipW * 0.45, hipY - torsoH * 0.25, s * hipW * 0.85, hipY - torsoH * 0.25 + rf(-2, 2), { width: 1.8 });
    }
  }
  else if (outfit === 'seam') {               // a shirt seen from behind: yoke and centre seam
    arc(0, shoulderY + 2, shW * 0.7, 0.25, Math.PI - 0.25, { width: 1.6, wob: 1 });
    line(0, shoulderY + 10, 0, hipY - 6, { width: 1.4, wob: 1.4 });
  }
  else if (view === 'front' && chance(0.3)) {  // plain shirt, maybe a pocket
    arc(dir * shW * 0.45, shoulderY + torsoH * 0.4, 8, 0, Math.PI, { width: 1.4 });
  }
  if (belly && chance(0.5))   // a belt fighting the belly
    line(-waistW * 0.9, waistY + 8, waistW * 0.9, waistY + 6, { width: 2.6, wob: 1.4 });

  /* ----- anatomy under the cloth ----- */
  if (view === 'front' && !coat && !child) {
    if (fem && chance(0.5)) for (const s of [-1, 1]) arc(s * shW * 0.38, armpitY + 2, shW * 0.22, 0.25, Math.PI - 0.25, { width: 1.2, wob: 0.8 });   // bust sits at the armpit line, where the chest widens
    if (belly) arc(0, waistY - 8, waistW * 0.72, 0.35, Math.PI - 0.35, { width: 1.2, wob: 1 });   // belly fold
    if (chance(0.3)) for (const s of [-1, 1]) line(s * neckW * 1.2, shoulderY + 5, s * shW * 0.62, shoulderY + slope * 0.4 + 3, { width: 1.1, wob: 0.8 });   // clavicles
  }
}

function drawNeckwear(F) {
  const { child, depth, dir, fem, fill, neckW, neckwear, shoulderY, torsoH, view } = F;
  const accented = chance(0.7);
  if (neckwear === 'tie') {
    sketch([[0, shoulderY + 2], [5, shoulderY + 9], [3, shoulderY + torsoH * 0.5],
            [0, shoulderY + torsoH * 0.58], [-3, shoulderY + torsoH * 0.5], [-5, shoulderY + 9]],
           { closed: true, fill: !accented, wash: accented ? P.accent : null, width: 1.6, wob: 0.8 });
  } else if (neckwear === 'bow') {
    const by = shoulderY + 4;
    sketch([[-2, by], [-15, by - 7], [-15, by + 7]], { closed: true, fill: !accented, wash: accented ? P.accent : null, width: 1.5, wob: 0.6 });
    sketch([[2, by], [15, by - 7], [15, by + 7]], { closed: true, fill: !accented, wash: accented ? P.accent : null, width: 1.5, wob: 0.6 });
  } else if (neckwear === 'scarf') {
    const hw = neckW + 9;
    sketch([[-hw, shoulderY - 5], [hw, shoulderY - 7], [hw - 2, shoulderY + 8], [-hw + 2, shoulderY + 10]], { closed: true, fill: true, fillColor: pen.base, wash: accented ? P.accent : null, width: 2.2, wob: 1.2 });
    sketch([[dir * 6, shoulderY + 9], [dir * 15, shoulderY + 36], [dir * 3, shoulderY + 38]], { closed: true, width: 1.8, wob: 1 });
  }
  if (view === 'front' && fem && !child && neckwear === 'none' && chance(0.22)) {   // a simple necklace
    arc(0, shoulderY + 6, neckW + 9, Math.PI * 0.2, Math.PI * 0.8, { width: 1, wob: 0.6 });
    penStyle(1); pen.ctx.beginPath(); pen.ctx.arc(0, shoulderY + 15 + neckW, 2.4, 0, 7); pen.ctx.fill();
  }
}

/* ----- stance : how the two legs share the weight ----- */
function drawLegs(F) {
  const { depth, dir, f, fill, footPoint, hemY, hipW, hipY, legKind, legWash, longSkirt, q, shoes, stance, view, walking } = F;
  if (legKind === 'skirt') {
    const flare = rf(10, 26) * (longSkirt ? 1.3 : 1);
    sketch([[q(-hipW), hipY - 4], [q(-hipW - flare), hemY], [q(hipW + flare), hemY], [q(hipW), hipY - 4]], { closed: true, fill: true, fillColor: pen.base, wash: legWash, width: 2.2, wob: 1.4 });
    if (chance(0.4)) hatch(-hipW, hipY + 6, hipW, hemY - 4, ri(8, 16), rf(1.2, 1.6), 12);
  }
  if (stance === 'stand') {
    for (const s of [-1, 1]) {
      const a = leg(F, s, s * rf(0, 5), rf(-4, 4), s * rf(2, 10), 0);
      shoes.push({ x: a[0], y: a[1], point: footPoint(s), ang: 0, size: 1 });
    }
  } else if (stance === 'wide') {
    for (const s of [-1, 1]) {
      const a = leg(F, s, s * rf(8, 16), rf(-3, 3), s * rf(20, 34), 0);
      shoes.push({ x: a[0], y: a[1], point: s, ang: s * 0.12, size: 1 });
    }
  } else if (stance === 'walk') {
    const fw = leg(F, dir, dir * rf(12, 22), -6, dir * rf(28, 44), 0);            // striding leg
    shoes.push({ x: fw[0], y: fw[1], point: dir, ang: 0, size: 1 });
    const bk = leg(F, -dir, -dir * rf(8, 16), rf(0, 5), -dir * rf(24, 38), rf(4, 9)); // trailing leg, heel up
    shoes.push({ x: bk[0], y: bk[1], point: dir, ang: dir * rf(0.25, 0.5), size: 1 });
  } else if (stance === 'shift') {              // weight on one hip, other knee soft
    const st = leg(F, -dir, -dir * rf(0, 3), 0, -dir * rf(0, 6), 0);
    shoes.push({ x: st[0], y: st[1], point: footPoint(-dir), ang: 0, size: 1 });
    const bt = leg(F, dir, dir * rf(12, 20), rf(0, 6), dir * rf(4, 14), 0);
    shoes.push({ x: bt[0], y: bt[1], point: dir, ang: dir * rf(0.15, 0.3), size: 1 });
  } else if (stance === 'cross') {              // one ankle crossed over the other
    const st = leg(F, -dir, -dir * 2, 0, -dir * rf(0, 6), 0);
    shoes.push({ x: st[0], y: st[1], point: footPoint(-dir), ang: 0, size: 1 });
    const cr = leg(F, dir, -dir * rf(2, 10), rf(2, 8), -dir * (hipW * 1.0 + rf(0, 8)), -2);
    shoes.push({ x: cr[0], y: cr[1], point: -dir, ang: -dir * rf(0.6, 0.9), size: 0.8 });   // resting on the toe
  }
  /* trouser inseam */
  if ((legKind === 'pants' || legKind === 'shorts') && chance(0.8))
    sketch([[-hipW * 0.2, hipY - 3], [0, hipY + 9], [hipW * 0.2, hipY - 3]], { width: 1.6, wob: 0.8 });
}

function drawShoes(F) {
  const { child, f, fill, heels, shoes, view } = F;
  for (const sh of shoes) {
    pen.ctx.save(); pen.ctx.translate(sh.x, sh.y + 4); pen.ctx.rotate(sh.ang);
    const sz = sh.size * (heels ? 0.85 : 1) * (child ? 0.85 : 1) * 2;   // feet a chunky size too
    if (view === 'quarter') {                 // a turned shoe: heel behind, toe pointing the way the body faces
      const dy = 5 - 4 * sz;                  // sole anchored where the old shoe's was, not sunk through the ground
      sketch([[-f * 8 * sz, -5 * sz + dy], [-f * 9 * sz, 3 * sz + dy], [f * 9 * sz, 4 * sz + dy], [f * 15 * sz, 2 * sz + dy], [f * 6 * sz, -4 * sz + dy]],
             { closed: true, fill: chance(0.6), fillColor: INK, width: 1.8, wob: 0.8 });
      if (heels) line(-f * 6 * sz, 3 * sz + dy, -f * 6 * sz, 3 * sz + dy + 3 * sz, { width: 2.2, wob: 0.4 });
    } else {
      const ryv = rf(4.5, 6) * sz;
      sketch(blobPts(sh.point * 6 * sz, 5 - ryv, rf(8, 11) * sz, ryv, 0.12, 10),   // narrower, and its sole sits on the ground line
             { closed: true, fill: chance(0.6), fillColor: INK, width: 1.8, wob: 0.8 });
      if (heels) line(-sh.point * 8 * sz, 4, -sh.point * 8 * sz, 4 + 3 * sz, { width: 2.2, wob: 0.4 });
    }
    pen.ctx.restore();
  }
}

function drawArmsFront(F) {
  const { armPose, dir, swing, view } = F;
  if (armPose === 'down') { armDown(F, -dir); F.propHand = armDown(F, dir); }
  else if (armPose === 'swing') { armDown(F, -dir, dir * swing); F.propHand = armDown(F, dir, -dir * swing * 0.9); }
  else if (armPose === 'wave') { armDown(F, -dir); armWave(F, dir); }
  else if (armPose === 'pockets') { armPocket(F, -1); armPocket(F, 1); }
  else if (armPose === 'hips') { armHip(F, -1); armHip(F, 1); }
  else if (armPose === 'crossed') { armsCrossed(F); }
  else if (armPose === 'shrug') { armShrug(F, -1); armShrug(F, 1); }
  else if (armPose === 'point') { armDown(F, -dir); armPoint(F, dir); }
  else if (armPose === 'chin') { armChin(F, dir); }
  /* 'behind': hands clasped behind the back — one peek out at the hip so the
     figure still shows its hands */
  else if (armPose === 'behind') armBehind(F, dir);
}

function drawProp(F) {
  const { child, dir, elder, fill, footY, propHand } = F;
  const wantsProp = propHand && (elder ? chance(0.55) : chance(child ? 0.4 : 0.28));
  if (!wantsProp) return;
  const [hx, hy] = propHand;
  const prop = child ? pick(['balloon','balloon','lolly'])
             : elder ? pick(['cane','cane','cane','case'])
             : pick(['balloon','cane','case']);
  if (prop === 'balloon') {
    const bx = hx + rf(-12, 12), by = hy - rf(70, 100);
    sketch([[hx, hy - 4], [bx + rf(-6, 6), (hy + by) / 2], [bx, by + 18]], { width: 1.2, wob: 1.6 });
    sketch(blobPts(bx, by, rf(14, 19), rf(16, 22), 0.05, 12), { closed: true, fill: true, fillColor: pen.base, width: 2, wob: 1 });
    arc(bx - 5, by - 6, 5, Math.PI * 0.9, Math.PI * 1.5, { width: 1.2 });   // highlight
  } else if (prop === 'lolly') {
    const lx = hx + dir * 4, ly = hy - rf(28, 38);
    line(hx, hy - 2, lx, ly + 8, { width: 1.6, wob: 0.8 });
    arc(lx, ly, 9, 0, Math.PI * 2, { width: 1.8, wob: 0.8 });
    arc(lx, ly, 4.5, 0.5, Math.PI * 1.8, { width: 1.4, wob: 0.6 });          // swirl
  } else if (prop === 'cane') {
    line(hx + dir * 4, hy + 6, hx + dir * 10, footY + 6, { width: 2.6, wob: 1 });
    arc(hx + dir * 4 - 6, hy + 2, 7, Math.PI, Math.PI * 2, { width: 2.4, wob: 0.8 });
  } else {
    sketch([[hx - 15, hy + 12], [hx + 15, hy + 12], [hx + 15, hy + 34], [hx - 15, hy + 34]],
           { closed: true, fill: true, fillColor: pen.base, width: 2, wob: 1 });
    arc(hx, hy + 12, 6, Math.PI, Math.PI * 2, { width: 1.8 });
  }
}

/* ----- the torso's bones: trapezius slope, shoulder caps, armpits,
   ribcage tapering to the waist, flare of the hips ----- */
function figTorso(F) {
  const { belly, child, elder, f, fem, hipW, hipY, neckH, neckW, q, ry, shW, shoulderY, torsoH, view, waistW, waistY } = F;
  const slope = rf(5, 12) + (elder ? rf(4, 8) : 0);   // elders hunch a little
  const armpitY = shoulderY + slope + ry * rf(0.42, 0.58);
  const chestW = shW * 0.85;
  const depth = shW * rf(0.66, 0.8) * (belly ? 1.2 : 1);   // thickness of the body, seen from the side
  const hunch = elder ? rf(4, 10) : 0;
  let torso;
  {
    torso = [
      [-neckW, shoulderY - neckH * 0.35],
      [-shW * 0.55, shoulderY + slope * 0.5],
      [-shW * 0.95, shoulderY + slope],
      [-shW, shoulderY + slope + 12],                           // shoulder cap
      [-chestW, armpitY],                                       // armpit
      [-waistW, waistY],
      [-hipW, hipY - 10],
      [-hipW * 0.96, hipY],
      [hipW * 0.96, hipY],
      [hipW, hipY - 10],
      [waistW, waistY],
      [chestW, armpitY],
      [shW, shoulderY + slope + 12],
      [shW * 0.95, shoulderY + slope],
      [shW * 0.55, shoulderY + slope * 0.5],
      [neckW, shoulderY - neckH * 0.35]
    ];
  }
  torso = torso.map(([x, y]) => [q(x), y]);    // a turned body: the far side narrows
  Object.assign(F, { armpitY, depth, hunch, slope, torso });
}

/* ----- arms & hands (defined here, drawn in view order below) ----- */
function figArms(F) {
  const { child, depth, f, fem, grow, q, shW, shoulderY, slope, unit, view } = F;
  const armW = 20 * unit * grow * (fem ? 0.86 : 1) * (child ? 1.05 : 1);
  const sy0 = shoulderY + slope + 6;           // the shoulder joint
  const shX = s => q(s * shW * 0.8);    // where the arm hangs from (inside the shoulder cap)
  let propHand = null;                          // a free hand a prop can grab

  /* a hand: palm from the wrist along `ang`, two finger splits at the end,
     thumb on the side `thumbTo` points to (a world direction, e.g. toward the body) */

  const angOf = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);

  /* side view: the near arm in front of the body, the far arm behind it */
  Object.assign(F, { angOf, armW, propHand, shX, sy0 });
}

/* ----- legs : thigh + shin with a real knee between them ----- */
function figLegs(F) {
  const { child, coat, dir, elder, fem, hipW, hipY, legH, look } = F;
  const legKind = coat ? 'coatlegs'
                : child ? (fem ? pick(['shorts','skirt','skirt','pants']) : pick(['shorts','shorts','pants']))
                : fem ? pick(['skirt','skirt','skirt','pants','pants'])
                : elder ? pick(['pants','pants','pants','pants','shorts'])
                : pick(['pants','pants','pants','shorts']);
  const footY = hipY + legH;
  const thighW = hipW * rf(0.56, 0.68);
  const longSkirt = legKind === 'skirt' && (elder || chance(0.35));
  const hemY = hipY + legH * (longSkirt ? rf(0.68, 0.8) : rf(0.45, 0.55));
  const shoes = [];                             // {x, y, point, ang, size}
  const heels = fem && !child && legKind !== 'shorts' && chance(0.4);

  /* one leg, from a tiny skeleton: hip -> knee -> ankle.
     kneeDX/ankleDX bend the leg; ankleUp lifts the heel. */

  const footPoint = s => (look !== 0 ? dir : s);
  Object.assign(F, { footPoint, footY, heels, hemY, legKind, longSkirt, shoes, thighW });
}

/* ----- outfit ----- */
function figOutfit(F) {
  const { child, coat, elder, view } = F;
  let outfit = coat ? 'coat'
             : child ? pick(['plain','stripes','stripes','overalls','overalls','sweater'])
             : elder ? pick(['plain','buttons','sweater','sweater','jacket','jacket'])
             : pick(['plain','plain','buttons','stripes','sweater','jacket','overalls']);
  Object.assign(F, { outfit });
}

/* ----- neckwear & jewellery (front only, a scarf from any side) ----- */
function figNeckwear(F) {
  const { child, elder, fem, outfit, view } = F;
  let neckwear;
  if (outfit === 'jacket') neckwear = fem ? pick(['bow','none','none','scarf']) : pick(['tie','tie','bow','none']);
  else if (outfit === 'overalls' || outfit === 'coat') neckwear = elder && fem ? pick(['scarf','none']) : 'none';
  else if (child) neckwear = pick(['none','none','none','none','bow']);
  else neckwear = pick(['none','none','none','none','bow','scarf','tie']);
  if (fem && neckwear === 'tie') neckwear = pick(['bow','scarf','none']);
  if (view !== 'front' && neckwear !== 'scarf') neckwear = 'none';
  Object.assign(F, { neckwear });
}

/* ----- arm pose ----- */
function figArmPose(F) {
  const { child, elder, view, walking } = F;
  const armPose = walking ? pick(['swing','swing','swing','pockets','wave'])
    : child ? pick(['down','down','wave','wave','point','shrug','hips'])
    : elder ? pick(['down','down','behind','behind','pockets','chin','hips','crossed'])
    : pick(['down','down','wave','pockets','hips','behind','crossed','shrug','point','chin']);
  const swing = walking ? rf(16, 30) : 0;
  Object.assign(F, { armPose, swing });
}

/* ----- draw, in depth order ----- */
function figDraw(F) {
  const { age, armPose, chin, clothWash, dir, elder, f, fem, fill, footY, headCy, hunch, look, neckW, rx, ry, seed, shW, shoulderY, swing, tilt, torso, view } = F;
  {
    sketch(torso, { closed: true, fill: true, fillColor: pen.base, wash: clothWash, wob: 1.4, width: 2.8 });
    drawOutfit(F);
    drawNeckwear(F);
    drawLegs(F);
    drawShoes(F);
    drawArmsFront(F);
    drawProp(F);
    const lean = elder ? dir * rf(2, 8) : 0;    // an elder's head sits a touch forward
    line(-neckW * 0.8 + lean * 0.6, chin - 6, -neckW * 0.9, shoulderY, { width: 1.8, wob: 0.8 });
    line(neckW * 0.8 + lean * 0.6, chin - 6, neckW * 0.9, shoulderY, { width: 1.8, wob: 0.8 });
  }
  if (chance(0.5)) line(-shW * 0.7, footY + 10, shW * 0.7, footY + 10 + rf(-3, 3), { width: 1.3, wob: 2.2 });   // ground

  const headLean = elder ? dir * rf(2, 8) : 0;
  drawHead(headLean, headCy + (elder ? 4 : 0), seed ^ 0xFACE, rx, ry, tilt, look, fem, age, view);
}

function drawFigure(cx, cy, seed) {
  pen.seed(seed);

  /* ----- who is this? age and gender leaning come first,
     because everything else hangs off them ----- */
  const age = pick(['child','teen','adult','adult','adult','adult','elder','elder']);
  const fem = chance(0.46);
  const child = age === 'child', teen = age === 'teen', elder = age === 'elder';

  /* ----- where we see them from, and what they are doing -----
     front: facing us. quarter: turned three-quarters toward one side,
     the far half of the body foreshortened, feet and gaze that way. */
  const view = wpick({ front: 3, quarter: 2 });
  const rx = rf(58, 78);                       // head half-width: cartoon heads are big
  const ry = rx * rf(1.0, 1.08);               // a touch taller than wide, like a real skull
  const unit = rx / 56;                        // limb thickness scales with the head; a little chunky
  const tilt = rf(-0.08, 0.08) + (elder ? rf(0.0, 0.05) * pick([-1, 1]) : 0);
  const look = view === 'quarter' ? pick([-1, 1]) * pick([0.5, 1, 1]) : pick([-1, -0.5, 0, 0, 0.5, 1]); // gaze: -1 left ... 1 right
  const dir = look >= 0 ? 1 : -1;              // facing, handedness & stride follow gaze
  const f = dir;                               // three-quarter view: the body turns this way
  const far = view === 'quarter' ? rf(0.62, 0.74) : 1;   // how much the far side of a turned body shrinks
  const q = x => x * (Math.sign(x) === -f ? far : 1);    // squash an x on the far side
  const coat = !child && chance(elder ? 0.2 : 0.1);
  const stance = coat ? pick(['stand','stand','shift','walk'])
               : child ? pick(['stand','wide','wide','walk','walk','shift'])
               : elder ? pick(['stand','stand','stand','shift','shift','wide','walk'])
               : pick(['stand','stand','stand','walk','wide','shift','cross']);
  const walking = stance === 'walk';

  /* ----- the pen and the marker box for this figure ----- */
  pen.ink = pick(INKS);
  const coloured = chance(0.7);
  const washMode = chance(0.32) ? 'scribble' : 'flat';
  const skin = coloured && chance(0.85) ? pick(SKINS) : null;
  P = {
    skinWash: skin ? { color: skin, alpha: rf(0.5, 0.85), mode: washMode, grow: rf(0.95, 1.08) } : null,
    hairFill: pick(HAIR_DARK),
    hairTint: (coloured || chance(0.3)) && chance(0.7) ? { color: pick(HAIR_TINT), alpha: rf(0.4, 0.7), mode: washMode } : null,
    hatWash: (coloured || chance(0.35)) ? { color: pick(HATS), alpha: rf(0.55, 0.85), mode: washMode } : null,
    accent: { color: pick(ACCENTS), alpha: 0.8 }
  };
  const clothWash = coloured && chance(0.8) ? { color: pick(CLOTHS), alpha: rf(0.45, 0.8), mode: washMode } : null;
  const legWash = coloured && chance(0.7) ? { color: pick(CLOTHS), alpha: rf(0.45, 0.8), mode: chance(0.3) ? 'scribble' : 'flat' } : null;
  const sleeves = chance(0.65);                 // long sleeves take the shirt's colour, short sleeves show skin
  const skinOn = P.skinWash && { ...P.skinWash, grow: 1, mode: 'flat' };   // small skin areas: a flat dab

  /* ----- body proportions: kids are compact, elders settle,
     feminine figures narrow at the shoulder and waist ----- */
  const grow = child ? 0.72 : teen ? 0.9 : 1;  // body (not head!) shrinks with youth
  const neckH = rf(8, 16) * grow;              // cartoon necks stay short, but the chin clears the collar
  const shW = rx * rf(0.95, 1.25) * grow * (fem ? 0.9 : 1);      // shoulders about as wide as the head
  const torsoH = ry * (coat ? rf(1.7, 2.0) : rf(1.1, 1.35)) * grow;   // short torso
  const legH = ry * rf(1.35, 1.7) * (coat ? 0.5 : 1) * (child ? 0.62 : teen ? 0.9 : elder ? 0.9 : 1);   // legs a touch longer than the trunk, as in most cartoons
  const figH = ry * 2 + neckH + torsoH + legH + 16;

  /* ----- scale: fit the person to the cell -----
     Every figure is scaled so it fills most of its cell's height —
     tall builds and short builds alike — then age trims it: kids are
     shorter, teens and elders a touch shorter than adults. A width cap
     keeps broad shoulders and outstretched arms out of the neighbours. */
  const fill = child ? rf(0.66, 0.74) : teen ? rf(0.8, 0.86) : elder ? rf(0.8, 0.87) : rf(0.85, 0.92);
  let SCALE = (CELL_H * fill) / figH;
  SCALE = Math.min(SCALE, (CELL_W * 0.5 - 6) / Math.max(shW + 40 + 40 * unit * grow, rx * 1.3 + 40));   // widest reach: a pointing wrist (shW+40) plus the oversized hand and its index finger
  pen.w = 1.05 / SCALE;                        // ~2.3 px lines on the paper, whatever the scale: a bold cartoon line
  pen.wob = 0.55 / SCALE;                      // and a calmer one
  pen.minTaper = 1.5; pen.scribble = pen.w * 0.75; pen.stipple = 1.5;   // figures are drawn small: plain thin lines, bigger dots

  pen.ctx.save();
  /* everyone stands on the same ground line, so short and tall
     figures read as short and tall instead of just re-centred */
  const GROUND = CELL_H * 0.5 - 24;            // feet a little above the cell's bottom edge
  pen.ctx.translate(cx, cy + GROUND - (figH / 2 - 16) * SCALE);
  pen.ctx.scale(SCALE, SCALE);
  /* from here on, (0,0) is the figure's centre */

  const headCy = -figH / 2 + ry;
  const chin = headCy + ry;
  const shoulderY = chin + neckH;
  const hipY = shoulderY + torsoH;
  const waistY = shoulderY + torsoH * rf(0.55, 0.68);
  const neckW = rx * 0.32 * (child ? 0.9 : 1);

  /* some folks are slim at the waist, some carry a proud belly */
  const belly = !coat && chance(fem ? 0.08 : elder ? 0.32 : child ? 0.15 : 0.22);
  const waistW = belly ? shW * rf(0.85, 1.02) : shW * (fem ? rf(0.5, 0.62) : rf(0.58, 0.72));
  const hipW = belly ? Math.max(shW * rf(0.55, 0.75), waistW * 0.8)
             : shW * (fem ? rf(0.62, 0.85) : rf(0.55, 0.75));

  const F = { cx, cy, seed, age, fem, child, teen, elder, view, rx, ry, unit, tilt, look, dir, f, far, q, coat, stance, walking, skin, clothWash, legWash, sleeves, skinOn, grow, neckH, shW, torsoH, legH, fill, headCy, chin, shoulderY, hipY, waistY, neckW, belly, waistW, hipW };   // everything the parts need to know
  figTorso(F);
  figArms(F);
  figLegs(F);
  figOutfit(F);
  figNeckwear(F);
  figArmPose(F);
  figDraw(F);

  pen.ctx.restore();
  return { age, gender: fem ? 'fem' : 'masc', view, stance };
}


Sheet.register('figures', { name: 'figures', H: 2760, draw: drawFigure, census: ['age', 'gender', 'view'], jitter: [8, 6] });
})();
