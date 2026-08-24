/* The animals collection: its drawing code, registered for its own sheet and for the mix.
   Wrapped in an IIFE so collections can share a page without their names colliding. */
(() => {
/* the marker box: colours from the CSS tokens */
const HATS = toks('--hat', 5), ACCENTS = toks('--accent', 3), BLUSH = tok('--blush', '#d98a85');
const furOf = k => tok('--' + k, '#aaa'), PINK = tok('--pink', '#e4a5a0');

/* ============================================================
   ONE CRITTER
   ============================================================ */
const SPECIES = {
  cat:     { w: 3,   ry: [0.85, 0.98], fur: ['fur-1','fur-2','fur-3','fur-4','fur-6','fur-7'], taper: 0.18 },
  dog:     { w: 3,   ry: [0.95, 1.12], fur: ['fur-3','fur-4','fur-5','fur-6','fur-7','fur-2'], taper: 0.1 },
  rabbit:  { w: 2,   ry: [1.05, 1.2],  fur: ['fur-4','fur-2','fur-3','fur-7'], taper: 0.12 },
  bear:    { w: 2,   ry: [0.92, 1.05], fur: ['fur-3','fur-5','fur-6','fur-4'], taper: 0 },
  fox:     { w: 1.5, ry: [0.95, 1.08], fur: ['fur-10','fur-1'], taper: 0.4 },
  owl:     { w: 1.5, ry: [1.0, 1.15],  fur: ['fur-3','fur-5','fur-2','fur-4'], taper: 0.05 },
  pig:     { w: 1.5, ry: [0.92, 1.02], fur: ['fur-8'], taper: 0.05 },
  mouse:   { w: 1.5, ry: [0.92, 1.05], fur: ['fur-2','fur-4','fur-3'], taper: 0.25 },
  lion:    { w: 1,   ry: [0.9, 1.02],  fur: ['fur-11','fur-5'], taper: 0.08 },
  sheep:   { w: 1.2, ry: [1.0, 1.15],  fur: ['fur-7','fur-4','fur-6'], taper: 0.1 },
  frog:    { w: 1,   ry: [0.7, 0.82],  fur: ['fur-9'], taper: -0.1 },
  cow:     { w: 1,   ry: [1.0, 1.12],  fur: ['fur-7','fur-4','fur-3'], taper: 0.05 },
  tiger:   { w: 1,   ry: [0.9, 1.02],  fur: ['fur-10','fur-1'], taper: 0.12 },
  giraffe: { w: 1,   ry: [1.15, 1.3],  fur: ['fur-4','fur-11'], taper: 0.18 },
  panda:   { w: 0.8, ry: [0.92, 1.02], fur: ['fur-7'], taper: 0 },
  raccoon: { w: 0.8, ry: [0.92, 1.05], fur: ['fur-2','fur-4'], taper: 0.2 },
};
const SPECIES_WEIGHTS = Object.fromEntries(Object.entries(SPECIES).map(([k, v]) => [k, v.w]));

function drawAnimal(cx, cy, seed) {
  pen.seed(seed);

  /* ----- who is this? ----- */
  const sp = wpick(SPECIES_WEIGHTS), S = SPECIES[sp];
  const is = (...k) => k.includes(sp);
  const age = wpick({ young: 1.5, adult: 3, old: 1 });
  const young = age === 'young', old = age === 'old';
  const expr = wpick({ neutral: 3, happy: 2.4, surprised: 0.8, sleepy: 1, grumpy: 1, sly: 0.6 });

  /* ----- the pen and the marker box ----- */
  pen.ink = pick(INKS);
  pen.w = rf(0.8, 1.4);
  const coloured = chance(0.72);
  const washMode = chance(0.35) ? 'scribble' : 'flat';
  const furKey = old && chance(0.4) ? 'fur-2' : pick(S.fur);
  const fur = furOf(furKey);
  const white = furKey === 'fur-7';
  const furWash = coloured && !white ? { color: fur, alpha: furKey === 'fur-6' ? rf(0.55, 0.75) : rf(0.5, 0.85), mode: washMode, grow: rf(0.95, 1.08) } : null;
  const dab = furWash && { ...furWash, grow: 1, mode: 'flat' };     // small fur areas: a flat dab
  const pink = { color: PINK, alpha: rf(0.45, 0.8), grow: 1, mode: 'flat' };
  const accent = { color: pick(ACCENTS), alpha: 0.8 };

  /* ----- geometry ----- */
  const look = pick([-1, -0.5, 0, 0, 0.5, 1]);
  const rx = rf(60, 80) * (young ? 0.9 : 1);      // head half-width: fills the cell the way the faces do
  const ry = rx * rf(S.ry[0], S.ry[1]) * (young ? 0.96 : 1);
  const shift = look * rx * 0.15;
  const tilt = rf(-0.08, 0.08);
  const eyeY = is('frog') ? cy - ry * 0.92 : cy - ry * (young ? 0.02 : is('owl') ? 0.2 : 0.1);
  const gap = rx * (is('frog') ? rf(0.5, 0.6) : is('owl') ? rf(0.42, 0.5) : young ? rf(0.36, 0.46) : rf(0.32, 0.44));
  const exL = cx - gap + shift, exR = cx + gap + shift;
  const nx = cx + shift * 1.2, nY = eyeY + ry * (is('frog') ? 0.85 : young ? 0.3 : 0.38);

  pen.ctx.save();
  pen.ctx.translate(cx, cy); pen.ctx.rotate(tilt); pen.ctx.translate(-cx, -cy);

  /* head: a blob, narrowed toward the chin by the species' taper */
  const head = blobPts(cx, cy, rx, ry, rf(0.03, 0.08), 18).map(([x, y]) => {
    const t = Math.max(0, (y - cy) / ry);
    return [cx + (x - cx) * (1 - S.taper * t * t), y];
  });
  function clipHead(fn) { pen.ctx.save(); tracePath(wobblePts(head, 1, true), true); pen.ctx.clip(); fn(); pen.ctx.restore(); }

  /* an ear: pointed or round, with an inner pink */
  function ear(x, y, w, h, ang, { round = false, inner = true, dark = false, tint = dab } = {}) {
    pen.ctx.save(); pen.ctx.translate(x, y); pen.ctx.rotate(ang);
    const pts = round ? blobPts(0, -h * 0.45, w, h * 0.55, 0.08, 12) : [[-w, h * 0.1], [-w * 0.55, -h * 0.55], [0, -h], [w * 0.55, -h * 0.55], [w, h * 0.1]];
    sketch(pts, { closed: true, fill: true, fillColor: dark ? pen.ink : pen.base, wash: dark ? null : tint, width: rf(2, 2.8), wob: 1.2 });
    if (inner && !dark) {
      const ip = round ? blobPts(0, -h * 0.45, w * 0.55, h * 0.3, 0.1, 10) : [[-w * 0.5, 0], [0, -h * 0.7], [w * 0.5, 0]];
      sketch(ip, { closed: true, wash: pink, width: 1.3, wob: 0.8 });
    }
    pen.ctx.restore();
  }

  /* ----- behind the head: manes, wool, ears, horns, frog eyes ----- */
  const flop = is('rabbit') && chance(0.35);
  if (is('lion')) {
    const mane = blobPts(cx, cy + ry * 0.05, rx * 1.6, ry * 1.55, 0.1, 26);
    sketch(mane, { closed: true, fill: true, fillColor: pen.base, wash: coloured ? { color: furOf(chance(0.5) ? 'fur-10' : 'fur-3'), alpha: rf(0.5, 0.8), mode: washMode } : null, wob: 3, width: 2.4 });
    for (let i = 0, n = ri(18, 30); i < n; i++) {           // shaggy edge
      const a = pen.R() * Math.PI * 2;
      const x = cx + Math.cos(a) * rx * 1.5, y = cy + ry * 0.05 + Math.sin(a) * ry * 1.45;
      line(x, y, x + Math.cos(a + rf(-0.4, 0.4)) * rf(10, 22), y + Math.sin(a + rf(-0.4, 0.4)) * rf(10, 22), { width: rf(1.2, 2.2), wob: 1 });
    }
    hatch(cx - rx * 1.4, cy - ry * 1.4, cx + rx * 1.4, cy + ry * 1.3, ri(20, 40), rf(0, 3.1), 14);
  }
  if (is('sheep')) {
    const wool = blobPts(cx, cy - ry * 0.15, rx * 1.35, ry * 1.3, 0.06, 22);
    sketch(wool, { closed: true, fill: true, fillColor: pen.base, wob: 2.5, width: 2.2 });
    penStyle(1.6);
    for (const [x, y] of wool) { pen.ctx.beginPath(); pen.ctx.arc(x + rf(-3, 3), y + rf(-3, 3), rf(4, 8), rf(0, 3), rf(4, 8)); pen.ctx.stroke(); }
    for (let i = 0; i < ri(10, 20); i++) { const a = pen.R() * 6.28, d = Math.sqrt(pen.R()); pen.ctx.beginPath(); pen.ctx.arc(cx + Math.cos(a) * rx * 1.2 * d, cy - ry * 0.15 + Math.sin(a) * ry * 1.15 * d, rf(3, 6), rf(0, 3), rf(4, 8)); pen.ctx.stroke(); }
  }
  if (is('cat', 'raccoon')) for (const s of [-1, 1]) ear(cx + s * rx * 0.62, cy - ry * 0.72, rx * 0.3, ry * 0.55, s * 0.35);
  if (is('fox')) for (const s of [-1, 1]) ear(cx + s * rx * 0.6, cy - ry * 0.7, rx * 0.34, ry * 0.78, s * 0.3, { tint: dab && { ...dab, alpha: Math.min(1, dab.alpha + 0.15) } });
  if (is('rabbit')) for (const s of [-1, 1]) ear(cx + s * rx * 0.38, cy - ry * 0.85, rx * 0.24, ry * 1.2, flop && s === (look >= 0 ? 1 : -1) ? s * 1.1 : s * rf(0.08, 0.25), { round: true });
  if (is('bear')) for (const s of [-1, 1]) ear(cx + s * rx * 0.72, cy - ry * 0.72, rx * 0.28, ry * 0.5, s * 0.2, { round: true });
  if (is('panda')) for (const s of [-1, 1]) ear(cx + s * rx * 0.72, cy - ry * 0.72, rx * 0.28, ry * 0.5, s * 0.2, { round: true, dark: true });
  if (is('tiger')) for (const s of [-1, 1]) ear(cx + s * rx * 0.68, cy - ry * 0.72, rx * 0.3, ry * 0.5, s * 0.25, { round: true });
  if (is('giraffe')) {
    for (const s of [-1, 1]) {                              // the ossicones, knobs on stalks
      const x = cx + s * rx * 0.3, y0 = cy - ry * 0.88;
      line(x, y0, x + s * 3, y0 - ry * 0.3, { width: rf(2.5, 3.5), wob: 0.8 });
      dot(x + s * 3, y0 - ry * 0.32, rf(4, 5.5), coloured ? furOf('fur-3') : pen.ink);
    }
    for (const s of [-1, 1]) ear(cx + s * rx * 0.85, cy - ry * 0.52, rx * 0.26, ry * 0.5, s * 1.25, { round: true });
  }
  if (is('mouse')) for (const s of [-1, 1]) ear(cx + s * rx * 0.88, cy - ry * 0.42, rx * 0.42, ry * 0.8, s * 0.15, { round: true });
  if (is('pig')) for (const s of [-1, 1]) ear(cx + s * rx * 0.7, cy - ry * 0.78, rx * 0.3, ry * 0.5, s * rf(0.7, 1.0), { tint: pink });
  if (is('sheep')) for (const s of [-1, 1]) ear(cx + s * rx * 0.95, cy - ry * 0.15, rx * 0.18, ry * 0.55, s * 1.35, { round: true });
  if (is('cow')) {
    for (const s of [-1, 1]) ear(cx + s * rx * 0.98, cy - ry * 0.25, rx * 0.2, ry * 0.6, s * 1.4, { round: true });
    for (const s of [-1, 1]) sketch([[cx + s * rx * 0.5, cy - ry * 0.9], [cx + s * rx * 0.85, cy - ry * 1.2], [cx + s * rx * 0.95, cy - ry * 1.05], [cx + s * rx * 0.7, cy - ry * 0.82]], { closed: true, fill: true, fillColor: pen.base, width: 2, wob: 1 });
  }
  if (is('owl') && chance(0.6)) for (const s of [-1, 1]) ear(cx + s * rx * 0.62, cy - ry * 0.85, rx * 0.16, ry * 0.35, s * 0.45, { inner: false });
  if (is('dog')) {
    var floppy = chance(0.6);
    if (!floppy) for (const s of [-1, 1]) ear(cx + s * rx * 0.66, cy - ry * 0.72, rx * 0.3, ry * 0.5, s * 0.4, { round: chance(0.5) });
  }
  if (is('frog')) for (const s of [-1, 1]) sketch(blobPts(cx + s * rx * 0.55 + shift, eyeY, rx * 0.32, ry * 0.42, 0.06, 12), { closed: true, fill: true, fillColor: pen.base, wash: dab, width: rf(2, 2.6), wob: 1 });

  /* ----- the head ----- */
  sketch(head, { closed: true, fill: true, fillColor: pen.base, wash: furWash, wob: 1.2, width: rf(2.2, 3.4) });
  if (chance(0.3)) sketch(head, { closed: true, wob: 2, width: rf(0.9, 1.5) });   // a second, searching line

  /* floppy dog ears hang over the sides of the head */
  if (is('dog') && floppy) for (const s of [-1, 1]) {
    const x = cx + s * rx * 0.78, y0 = cy - ry * 0.55;
    sketch([[x - s * rx * 0.05, y0], [x + s * rx * 0.35, y0 + ry * 0.2], [x + s * rx * 0.32, y0 + ry * 0.85], [x - s * rx * 0.02, y0 + ry * 0.8], [x - s * rx * 0.1, y0 + ry * 0.25]],
           { closed: true, fill: true, fillColor: pen.base, wash: dab && { ...dab, alpha: Math.min(1, dab.alpha + 0.15) }, width: rf(2, 2.6), wob: 1.3 });
  }

  /* ----- markings ----- */
  const muzzleSp = is('dog', 'bear', 'fox', 'panda', 'raccoon', 'lion', 'cow', 'mouse', 'sheep', 'tiger', 'giraffe') || (is('cat') && chance(0.4));
  if (muzzleSp && !white && chance(0.8)) {                 // a lighter muzzle
    const mw = is('fox') ? rx * 0.72 : is('cow') ? rx * 0.6 : is('giraffe') ? rx * 0.55 : rx * rf(0.4, 0.5), mh = is('fox') ? ry * 0.5 : is('giraffe') ? ry * 0.32 : ry * rf(0.28, 0.36);
    sketch(blobPts(nx, nY + mh * 0.45, mw, mh, 0.08, 14), { closed: true, fill: true, fillColor: pen.base, width: 1.2, wob: 1.2, taper: false });
  }
  if (is('panda')) for (const ex of [exL, exR]) sketch(blobPts(ex, eyeY + 2, rx * 0.26, ry * 0.3, 0.1, 12), { closed: true, fill: true, width: 1.6, wob: 1 });
  if (is('raccoon')) sketch([[cx - rx * 0.98 + shift, eyeY - ry * 0.18], [cx + shift, eyeY - ry * 0.1], [cx + rx * 0.98 + shift, eyeY - ry * 0.18], [cx + rx * 0.85 + shift, eyeY + ry * 0.22], [cx + shift, eyeY + ry * 0.12], [cx - rx * 0.85 + shift, eyeY + ry * 0.22]],
                           { closed: true, fill: true, width: 1.6, wob: 1.2 });
  if (is('cat') && chance(0.6)) {                          // tabby M and cheek stripes
    for (const k of [-1, 0, 1]) line(cx + shift + k * rx * 0.22, cy - ry * 0.95, cx + shift + k * rx * 0.2 + rf(-3, 3), cy - ry * rf(0.5, 0.62), { width: rf(1.6, 2.6), wob: 1 });
    if (chance(0.6)) for (const s of [-1, 1]) for (let i = 0; i < 3; i++) line(cx + s * rx * 0.95, cy + ry * (0.1 + i * 0.15), cx + s * rx * rf(0.6, 0.75), cy + ry * (0.12 + i * 0.15), { width: 1.6, wob: 0.8 });
  }
  if (is('tiger')) clipHead(() => {                        // ink stripes: the forehead, then the flanks
    for (const k of [-1, 0, 1]) {
      const x = cx + shift + k * rx * 0.24;
      sketch([[x - 3.5, cy - ry], [x + 3.5, cy - ry], [x + k * 3, cy - ry * rf(0.5, 0.62)]], { closed: true, fill: true, width: 1.2, wob: 0.8 });
    }
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
      const y = cy + ry * (-0.25 + i * 0.28) + rf(-4, 4);
      sketch([[cx + s * rx * 1.05, y - 4.5], [cx + s * rx * 1.05, y + 4.5], [cx + s * rx * rf(0.5, 0.68), y + rf(-2, 2)]], { closed: true, fill: true, width: 1.2, wob: 0.8 });
    }
  });
  if (is('giraffe')) clipHead(() => {                      // brown patches, kept off the face
    for (let i = 0, n = ri(5, 8); i < n; i++) {
      const px = cx + rf(-rx, rx), py = cy + rf(-ry * 0.85, ry * 0.45);
      if (Math.abs(px - cx - shift) < rx * 0.45 && py > eyeY - 14 && py < nY + 14) continue;
      sketch(blobPts(px, py, rx * rf(0.12, 0.2), ry * rf(0.08, 0.14), 0.2, 8), { closed: true, wash: { color: furOf('fur-3'), alpha: rf(0.5, 0.75), grow: 1 }, width: 1.1, wob: 0.8 });
    }
  });
  if (is('cow')) clipHead(() => { for (let i = 0, n = ri(2, 4); i < n; i++) sketch(blobPts(cx + rf(-rx, rx), cy + rf(-ry * 0.9, ry * 0.2), rx * rf(0.18, 0.32), ry * rf(0.15, 0.28), 0.15, 10), { closed: true, fill: true, fillColor: pen.ink, width: 1.4, wob: 1.2 }); });
  if (is('dog') && chance(0.3)) washPts(blobPts(look >= 0 ? exR : exL, eyeY, rx * 0.25, ry * 0.28, 0.1, 10), { color: furOf('fur-3'), alpha: 0.6, grow: 1 });
  if (is('frog') && chance(0.5)) clipHead(() => stipple(cx, cy + ry * 0.1, rx * 0.8, ry * 0.5, ri(6, 14), 1.6));
  if (is('owl')) {
    for (const ex of [exL, exR]) arc(ex, eyeY, rx * 0.38, 0, Math.PI * 2, { width: 1.6, wob: 1.4 });   // facial disc
    clipHead(() => { for (let i = 0, n = ri(10, 18); i < n; i++) { const x = cx + rf(-rx, rx), y = cy + rf(ry * 0.3, ry); sketch([[x - 4, y - 3], [x, y + 2], [x + 4, y - 3]], { width: 1.3, wob: 0.5, taper: false }); } });   // feathers
  }
  if (is('dog', 'bear', 'cat', 'lion', 'tiger') && chance(0.4)) clipHead(() => hatch(cx - rx * 0.95, cy + ry * 0.25, cx + rx * 0.95, cy + ry * 0.95, ri(10, 18), rf(1.2, 1.9), 8));   // fur along the jaw

  /* ----- eyes ----- */
  let eyeKind = wpick({ ring: 3, big: young || is('owl') ? 3 : 1, dot: is('mouse', 'pig', 'sheep') ? 2 : 0.6 });
  if (expr === 'happy' && chance(0.4)) eyeKind = 'wink2';
  if (expr === 'surprised') eyeKind = 'big';
  if (expr === 'sleepy') eyeKind = 'closed';
  if (expr === 'sly') eyeKind = 'wink';
  const slit = is('cat', 'fox', 'tiger') && chance(0.6);
  const onDark = is('panda', 'raccoon');
  function eye(x, kind, s) {
    if (onDark) dot(x, eyeY, rf(5.5, 8) * s + 1.5, pen.base);
    if (kind === 'dot') { dot(x, eyeY, rf(2.4, 3.6) * s); return; }
    if (kind === 'wink') { arc(x, eyeY, rf(5, 8), 0.15, Math.PI - 0.15, { width: 2 }); return; }
    if (kind === 'closed') { arc(x, eyeY, rf(5, 8), Math.PI + 0.15, Math.PI * 2 - 0.15, { width: 2 }); return; }
    const r = (kind === 'big' ? rf(9, 14) : rf(5.5, 8)) * s * (is('owl') ? 1.3 : 1);
    arc(x, eyeY, r, 0, Math.PI * 2, { width: 1.8, wob: 0.9 });
    const px = x + look * r * 0.35 + rf(-1, 1), py = eyeY + rf(-1, 1.5);
    if (slit) { pen.ctx.save(); pen.ctx.translate(px, py); pen.ctx.scale(0.45, 1); dot(0, 0, Math.max(2, r * 0.6)); pen.ctx.restore(); }
    else dot(px, py, Math.max(1.8, r * (young || is('owl') ? rf(0.4, 0.55) : rf(0.25, 0.4))));
    if ((young || kind === 'big') && chance(0.5)) dot(px - r * 0.15, py - r * 0.18, Math.max(0.8, r * 0.1), pen.base);   // sparkle
  }
  if (eyeKind === 'wink') { eye(exL, 'wink', 1); eye(exR, 'ring', 1); }
  else if (eyeKind === 'wink2') { eye(exL, 'wink', 1); eye(exR, 'wink', 1); }
  else { const s2 = rf(0.8, 1.2); eye(exL, eyeKind, 1); eye(exR, eyeKind, s2); }

  /* ----- brows ----- */
  if (!is('owl', 'frog') && (expr === 'grumpy' || expr === 'surprised' || chance(0.35))) {
    const by = eyeY - rf(12, 18) - (expr === 'surprised' ? 6 : 0);
    for (const [ex, s] of [[exL, -1], [exR, 1]]) {
      if (expr === 'grumpy') line(ex - s * 8, by + 8, ex + s * 8, by + 1, { width: 2.6 });
      else arc(ex, by + 4, rf(7, 11), Math.PI * 1.15, Math.PI * 1.85, { width: old ? rf(2.5, 3.5) : 2 });
    }
  }

  /* ----- nose & mouth ----- */
  const noseTri = is('cat', 'rabbit', 'mouse', 'lion', 'tiger');
  if (noseTri) {
    const w = is('lion', 'tiger') ? 8 : 5.5;
    sketch([[nx - w, nY - 3], [nx + w, nY - 3], [nx, nY + 4]], { closed: true, fill: !is('rabbit', 'mouse') || chance(0.3), wash: is('rabbit', 'mouse') ? pink : null, width: 1.6, wob: 0.6 });
  } else if (is('dog', 'bear', 'panda', 'raccoon', 'fox', 'sheep')) {
    const w = rx * (is('fox') ? 0.14 : 0.2), h = ry * 0.12;
    sketch(blobPts(nx, nY, w, h, 0.1, 10), { closed: true, fill: true, width: 1.6, wob: 0.8 });
    dot(nx - w * 0.35, nY - h * 0.35, Math.max(1, w * 0.18), pen.base);   // a shine
  } else if (is('pig')) {
    sketch(blobPts(nx, nY + 2, rx * 0.32, ry * 0.22, 0.06, 12), { closed: true, fill: true, fillColor: pen.base, wash: { ...pink, alpha: 0.9 }, width: 2, wob: 1 });
    for (const s of [-1, 1]) sketch(blobPts(nx + s * rx * 0.12, nY + 2, 3, 4, 0.1, 8), { closed: true, fill: true, width: 1, wob: 0.4 });
  } else if (is('cow')) {
    sketch(blobPts(nx, cy + ry * 0.52, rx * 0.58, ry * 0.3, 0.06, 14), { closed: true, fill: true, fillColor: pen.base, wash: { ...pink, alpha: 0.6 }, width: 2, wob: 1.2 });
    for (const s of [-1, 1]) arc(nx + s * rx * 0.22, cy + ry * 0.5, 4, 0, Math.PI * 2, { width: 1.6, wob: 0.5 });
  } else if (is('giraffe')) {
    for (const s of [-1, 1]) { pen.ctx.save(); pen.ctx.translate(nx + s * rx * 0.16, nY + 4); pen.ctx.rotate(s * 0.4); pen.ctx.scale(0.5, 1); dot(0, 0, 3); pen.ctx.restore(); }
  } else if (is('owl')) {
    sketch([[nx - 6, eyeY + ry * 0.12], [nx + 6, eyeY + ry * 0.12], [nx, eyeY + ry * 0.38]], { closed: true, fill: chance(0.4), wash: { color: ACCENTS[2], alpha: 0.85, grow: 1.1 }, width: 1.8, wob: 0.6 });
  } else if (is('frog')) {
    dot(nx - 5, cy - ry * 0.15, 1.6); dot(nx + 5, cy - ry * 0.15, 1.6);
  }

  const mY = nY + (is('pig') ? ry * 0.3 : is('cow') ? ry * 0.55 : 6);
  if (is('owl')) { /* beak says it all */ }
  else if (is('frog')) {
    const r = rx * 0.6;
    if (expr === 'grumpy') arc(nx, cy + ry * 0.45, r, Math.PI * 1.15, Math.PI * 1.85, { width: 2.4 });
    else if (expr === 'surprised') sketch(blobPts(nx, cy + ry * 0.3, rx * 0.2, ry * 0.18, 0.1, 10), { closed: true, fill: true, width: 1.6 });
    else arc(nx, cy + ry * 0.05, r, 0.3, Math.PI - 0.3, { width: 2.4 });
  }
  else if (expr === 'surprised') sketch(blobPts(nx, mY + 8, rf(5, 8), rf(4, 6), 0.1, 10), { closed: true, fill: true, width: 1.5 });
  else if (noseTri || is('fox')) {                         // the little "w"
    line(nx, nY + 4, nx, mY + 4, { width: 1.8, wob: 0.6 });
    const r = is('lion', 'tiger') ? 9 : 6.5;
    if (expr === 'grumpy') { arc(nx - r, mY + 4 + r, r, Math.PI * 1.15, Math.PI * 1.9, { width: 1.8 }); arc(nx + r, mY + 4 + r, r, Math.PI * 1.1, Math.PI * 1.85, { width: 1.8 }); }
    else { arc(nx - r, mY + 2, r, 0.1, Math.PI - 0.35, { width: 1.8 }); arc(nx + r, mY + 2, r, 0.35, Math.PI - 0.1, { width: 1.8 }); }
  } else {
    if (!is('pig', 'cow')) line(nx, nY + 4, nx, mY + 6, { width: 1.8, wob: 0.6 });
    const r = rf(7, 11) * (expr === 'happy' ? 1.3 : 1);
    if (expr === 'grumpy') arc(nx, mY + 14, r, Math.PI * 1.2, Math.PI * 1.8, { width: 2 });
    else if (expr === 'sleepy' || (expr === 'neutral' && chance(0.4))) line(nx - r * 0.7, mY + 7, nx + r * 0.7, mY + 7, { width: 2 });
    else arc(nx, mY + 4, r, 0.25, Math.PI - 0.25, { width: 2 });
    if (is('dog') && expr === 'happy' && chance(0.6)) sketch(blobPts(nx + rf(-3, 3), mY + 4 + r * 0.9, 5, 7, 0.1, 8), { closed: true, fill: true, fillColor: pen.base, wash: { ...pink, alpha: 0.9 }, width: 1.4, wob: 0.5 });   // tongue
  }
  if (is('rabbit') && chance(0.6)) for (const s of [-1, 1]) sketch([[nx + s * 1, mY + 5], [nx + s * 6, mY + 5], [nx + s * 6, mY + 13], [nx + s * 1, mY + 13]], { closed: true, fill: true, fillColor: pen.base, width: 1.4, wob: 0.4, taper: false });   // teeth

  /* ----- whiskers ----- */
  if (is('cat', 'mouse', 'rabbit', 'lion', 'tiger') || (is('fox') && chance(0.4))) {
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
      const y0 = nY + (i - 1) * 5, len = rx * rf(0.45, 0.65) * (old ? 1.15 : 1);
      line(nx + s * 10, y0, nx + s * (10 + len), y0 + (i - 1) * 4 + (old ? 4 : 0) + rf(-2, 2), { width: rf(1, 1.5), wob: 1 });
    }
    if (chance(0.5)) for (const s of [-1, 1]) for (let i = 0; i < 3; i++) dot(nx + s * (8 + i * 5), nY + 3 + rf(-2, 2), 0.9);
  }

  /* ----- age, cheeks ----- */
  if (old) {
    for (const [ex, s] of [[exL, -1], [exR, 1]]) for (let k = -1; k <= 1; k++) line(ex + s * 11, eyeY + k * 3, ex + s * 18, eyeY + k * 6, { width: 1.1, wob: 0.8 });
    if (chance(0.5)) for (let i = 0; i < 2; i++) { const y = cy - ry * (0.55 + i * 0.12); sketch([[cx + shift - rx * 0.3, y + 2], [cx + shift, y - 1], [cx + shift + rx * 0.3, y + 2]], { width: 1.1, wob: 0.8 }); }
  }
  if ((young || is('pig')) && chance(0.45)) {
    const cyk = eyeY + (nY - eyeY) * 0.7;
    washPts(blobPts(exL - 10, cyk, 8, 5, 0.1, 10), { color: BLUSH, alpha: rf(0.35, 0.6), grow: 1 });
    washPts(blobPts(exR + 10, cyk, 8, 5, 0.1, 10), { color: BLUSH, alpha: rf(0.35, 0.6), grow: 1 });
  }

  /* ----- accessories: specs, a hat, something round the neck ----- */
  const lensR = gap * rf(0.5, 0.62);
  const specs = wpick({ none: old ? 2 : 6, round: 1.2, square: 0.8, halfmoon: old ? 1.5 : 0.2 });
  if (specs === 'round') {
    for (const ex of [exL, exR]) arc(ex, eyeY, lensR, 0, Math.PI * 2, { width: 2, wob: 1 });
    line(exL + lensR, eyeY, exR - lensR, eyeY, { width: 1.8 });
    line(exL - lensR, eyeY, cx - rx * 0.98 + shift * 0.3, eyeY - 3, { width: 1.6 }); line(exR + lensR, eyeY, cx + rx * 0.98 + shift * 0.3, eyeY - 3, { width: 1.6 });
  } else if (specs === 'square') {
    const w2 = lensR * 1.1, h2 = lensR * 0.85;
    for (const ex of [exL, exR]) sketch([[ex - w2, eyeY - h2], [ex + w2, eyeY - h2], [ex + w2, eyeY + h2], [ex - w2, eyeY + h2]], { closed: true, width: 2.2, wob: 1 });
    line(exL + w2, eyeY - h2 * 0.5, exR - w2, eyeY - h2 * 0.5, { width: 2 });
    line(exL - w2, eyeY, cx - rx * 0.98 + shift * 0.3, eyeY - 3, { width: 1.6 }); line(exR + w2, eyeY, cx + rx * 0.98 + shift * 0.3, eyeY - 3, { width: 1.6 });
  } else if (specs === 'halfmoon') {
    const r = lensR * 0.8, y = eyeY + 3;
    for (const ex of [exL, exR]) { arc(ex, y, r, 0.05, Math.PI - 0.05, { width: 2, wob: 0.8 }); line(ex - r, y, ex + r, y, { width: 1.8, wob: 0.6 }); }
    line(exL + r, y, exR - r, y, { width: 1.8 });
  }

  const topY = cy - ry * (is('frog') ? 1.0 : 0.98);
  const hat = !chance(0.35) ? 'none'
            : is('lion') ? 'bow'
            : wpick({ party: 1, bow: 1, flower: 0.8, crown: is('frog') ? 3 : 0.4, tophat: is('owl', 'pig', 'sheep', 'cow', 'frog') ? 1.5 : 0, beanie: is('owl', 'pig', 'sheep', 'cow') ? 1 : 0 });
  if (hat === 'party') {
    const h = ry * rf(0.5, 0.7), w = rx * 0.28, lean = rf(-0.2, 0.2);
    sketch([[cx - w, topY + 4], [cx + w, topY + 4], [cx + lean * h, topY - h]], { closed: true, fill: true, fillColor: pen.base, wash: { ...accent, mode: washMode }, width: 2, wob: 1 });
    if (chance(0.7)) for (let i = 0; i < 3; i++) line(cx - w + (i + 0.5) * w * 0.66 - lean * 2, topY + 2 - i * h * 0.18, cx - w * 0.6 + (i + 0.5) * w * 0.4 + lean * h * 0.3, topY - i * h * 0.2 - h * 0.12, { width: 1.6, wob: 0.6, taper: false });
    dot(cx + lean * h, topY - h, 3.5);
  } else if (hat === 'bow') {
    const s = pick([-1, 1]), bx = cx + s * rx * 0.45, by = topY + ry * 0.12;
    for (const d of [-1, 1]) sketch([[bx, by], [bx + d * 13, by - 8], [bx + d * 12, by + 7]], { closed: true, wash: accent, wob: 1, width: 1.8 });
    dot(bx, by, 3);
  } else if (hat === 'flower') {
    const s = pick([-1, 1]), fx = cx + s * rx * 0.7, fy = topY + ry * 0.25;
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; sketch(blobPts(fx + Math.cos(a) * 6, fy + Math.sin(a) * 6, 4, 4, 0.1, 8), { closed: true, fill: true, fillColor: pen.base, wash: { color: ACCENTS[0], alpha: 0.7, grow: 1 }, width: 1.2, wob: 0.4, taper: false }); }
    dot(fx, fy, 3, ACCENTS[2]);
  } else if (hat === 'crown') {
    const w = rx * 0.38, h = ry * 0.32;
    sketch([[cx - w, topY + 6], [cx - w, topY - h], [cx - w * 0.5, topY - h * 0.45], [cx, topY - h], [cx + w * 0.5, topY - h * 0.45], [cx + w, topY - h], [cx + w, topY + 6]], { closed: true, fill: true, fillColor: pen.base, wash: { color: ACCENTS[2], alpha: 0.85 }, width: 2, wob: 0.8 });
    for (const k of [-1, 0, 1]) dot(cx + k * w, topY - h - 1, 2.2);
  } else if (hat === 'tophat') {
    const w = rx * 0.5, h = ry * 0.6;
    sketch([[cx - w, topY + 2], [cx + w, topY + 2], [cx + w * 0.95, topY - h], [cx - w * 0.95, topY - h]], { closed: true, fill: true, fillColor: pen.base, wash: { color: pick(HATS), alpha: 0.8, mode: washMode }, width: 2.2, wob: 1 });
    sketch([[cx - w * 1.5, topY + 4], [cx + w * 1.5, topY + 2]], { width: 3, wob: 1 });
    line(cx - w * 0.95, topY - h * 0.25, cx + w * 0.95, topY - h * 0.27, { width: 2.6 });
  } else if (hat === 'beanie') {
    const by = topY + ry * 0.2;
    const dome = arcPts(cx, by - 4, rx * 1.02, ry * 0.6, Math.PI, Math.PI * 2, 0.05, 14);
    dome.push([cx + rx * 1.02, by], [cx - rx * 1.02, by]);
    sketch(dome, { closed: true, fill: true, fillColor: pen.base, wash: { color: pick(HATS), alpha: 0.8, mode: washMode }, wob: 1.4, width: 2.2 });
    sketch([[cx - rx * 1.02, by], [cx + rx * 1.02, by]], { width: 2.4, wob: 1.6 }); sketch([[cx - rx * 1.05, by + 12], [cx + rx * 1.05, by + 12]], { width: 2.4, wob: 1.6 });
    dot(cx, by - 4 - ry * 0.6, 6);
  }

  const neckY = cy + ry * 1.0;
  const neck = wpick({ none: 4, collar: is('dog', 'cat') ? 2 : 0.4, bowtie: 1, scarf: 0.8, necklace: is('rabbit', 'cat', 'sheep') ? 0.6 : 0.2 });
  if (neck === 'collar') {
    sketch([[cx - rx * 0.55, neckY - 6], [cx + rx * 0.55, neckY - 6], [cx + rx * 0.58, neckY + 4], [cx - rx * 0.58, neckY + 4]], { closed: true, fill: true, fillColor: pen.base, wash: accent, width: 2, wob: 1 });
    sketch(blobPts(cx, neckY + 10, 5, 5, 0.1, 8), { closed: true, fill: true, fillColor: pen.base, width: 1.6, wob: 0.4 });   // the tag
  } else if (neck === 'bowtie') {
    for (const d of [-1, 1]) sketch([[cx, neckY + 2], [cx + d * 13, neckY - 5], [cx + d * 13, neckY + 9]], { closed: true, fill: chance(0.3), wash: accent, wob: 0.8, width: 1.8 });
    dot(cx, neckY + 2, 2.6);
  } else if (neck === 'scarf') {
    sketch([[cx - rx * 0.6, neckY - 8], [cx + rx * 0.6, neckY - 10], [cx + rx * 0.58, neckY + 6], [cx - rx * 0.58, neckY + 8]], { closed: true, fill: true, fillColor: pen.base, wash: { ...accent, mode: washMode }, width: 2.2, wob: 1.2 });
    const d = look >= 0 ? 1 : -1;
    sketch([[cx + d * 6, neckY + 6], [cx + d * 16, neckY + 30], [cx + d * 2, neckY + 32]], { closed: true, fill: true, fillColor: pen.base, wash: { ...accent, mode: washMode }, width: 1.8, wob: 1 });
  } else if (neck === 'necklace') {
    for (let a = 0.2; a < Math.PI - 0.15; a += 0.2) dot(cx + Math.cos(a) * rx * 0.5, neckY - 8 + Math.sin(a) * 14, 1.8);
  }

  pen.ctx.restore();
  return { species: sp, age, expr };
}


Sheet.register('animals', { name: 'animals', H: 2420, draw: drawAnimal, census: ['species'], zoom: 1.2 });
})();
