/* The space collection: its drawing code, registered for its own sheet and for the mix.
   Wrapped in an IIFE so collections can share a page without their names colliding. */
(() => {
/* ============================================================
   SPACE – rockets, stations, probes, robots, aliens and a few worlds,
   drawn with a rough hand: lumpy outlines, thick wobbly ink, scribbled
   washes that miss the line, and the pen gone over again where a fin
   leaves a hull, a dome sits on its base, and on the shadow side.
   ============================================================ */

/* ─── Constants ─── */
const SP = Object.fromEntries([
  'ink', 'navy', 'blue', 'teal', 'green', 'lime', 'gold', 'orange', 'coral', 'lilac', 'silver', 'cream', 'rust',
].map(key => [key, tok(`--space-${key}`, INK)]));
const SPACE_INKS = [INK, INK, SP.ink, SP.navy, tok('--ink-sepia', INK), tok('--ink-blue', INK)];

/* ─── The rough marker box ─── */
let MARKER = { mode: 'flat', alpha: 0.7, grow: 1 };
const DAB = 16;
function wash(pts, color, alpha = MARKER.alpha) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return Math.max(x1 - x0, y1 - y0) < DAB
    ? { color, alpha, grow: 1, mode: 'flat', wob: 3, dx: rf(-3, 3), dy: rf(-3, 3) }
    : { color, alpha, grow: MARKER.grow, mode: MARKER.mode, dx: rf(-10, 10), dy: rf(-8, 8), wob: rf(5, 9) };   // well off the line
}
/* a shape in rough ink: paper fill, a careless wash, a thick wobbly outline in the weight its `role` asks for. `again` is a blanket second pass,
   off by default: the pen goes round again only where retrace() says so */
function shape(pts, color, { alpha = MARKER.alpha, width = 3, wob = 1.4, closed = true, inkFill = false, again = 0, role } = {}) {
  if (inkFill) sketch(pts, { closed, fill: true, wob, width, role });
  else sketch(pts, { closed, fill: true, fillColor: pen.base, wash: color ? wash(pts, color, alpha) : null, wob, width, role });
  if (again > 0 && chance(again)) sketch(pts, { closed, width: width * 0.55, wob: wob * 1.6, role });
}
function stroke(pts, { width = 2.4, wob = 1.3, color, closed = false, again = 0, taper, role } = {}) {
  sketch(pts, { closed, width, wob, color, taper, role });
  if (again > 0 && chance(again)) sketch(pts, { closed, width: width * 0.5, wob: wob * 1.6, color, role });
}
/* a hand firms up a joint: the half of the stroke a→b nearest a (where a leg, a fin or a mast
   leaves the mass it is fixed to) is gone over again */
function joint(a, b, opts = {}) { retrace([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], b], { span: 0.5, at: 0, width: 2.4, ...opts }); }
function inside(pts, fn) { pen.ctx.save(); tracePath(wobblePts(pts, 1, true), true); pen.ctx.clip(); fn(); pen.ctx.restore(); }
/* lumpy circles and boxes: nothing on this sheet is drawn with a compass or a ruler */
function blob(cx, cy, rx, ry, lump = 0.08, n = 14, rot = 0) {
  const pts = blobPts(0, 0, rx, ry, lump, n);
  return pts.map(([x, y]) => [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
}
function box(cx, cy, w, h, rot = 0, skew = 3) {
  const c = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => [x + rf(-skew, skew), y + rf(-skew, skew)]);
  return c.map(([x, y]) => [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
}
function starPts(cx, cy, rOut, rIn, n = 5, rot = -Math.PI / 2) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) { const r = i % 2 ? rIn : rOut, a = rot + i * Math.PI / n; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return pts;
}
function tube(c, w) {
  const L = [], Rg = [];
  for (let i = 0; i < c.length; i++) {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    L.push([c[i][0] + nx * w[i] / 2, c[i][1] + ny * w[i] / 2]); Rg.push([c[i][0] - nx * w[i] / 2, c[i][1] - ny * w[i] / 2]);
  }
  return L.concat(Rg.reverse());
}
/* a half-ellipse dome standing on y = base, from left to right */
function domePts(cx, base, rx, ry, n = 14) {
  const pts = []; for (let i = 0; i <= n; i++) { const a = Math.PI + i / n * Math.PI; pts.push([cx + Math.cos(a) * rx, base + Math.sin(a) * ry]); }
  return pts;
}
/* little marks: stars, specks, rivets, dashes — texture weight, all of them */
function sparkle(x, y, size = 5, color) {
  if (chance(0.5)) { line(x - size, y, x + size, y, { width: 1.6, wob: 0.6, color, taper: false }); line(x, y - size, x, y + size, { width: 1.6, wob: 0.6, color, taper: false }); }
  else shape(starPts(x, y, size, size * 0.38, 4, Math.PI / 4), color || SP.gold, { width: 1.4, wob: 0.6 });
}
function specks(S, count = 4) {
  pen.phase('detail');
  for (let i = 0; i < count; i++) {
    const a = rf(0, Math.PI * 2), r = rf(S * 0.8, S * 1.1), x = Math.cos(a) * r, y = Math.sin(a) * r * 0.85;
    if (chance(0.4)) dot(x, y, rf(1.2, 2.4), pick([SP.gold, SP.blue, pen.ink])); else sparkle(x, y, rf(2.5, 5), pick([SP.gold, SP.blue, SP.coral, null]));
  }
}
function rivets(pts, r = 1.6) { for (const [x, y] of pts) dot(x, y, r, thinInk(pen.ink, ROLE.texture.thin)); }
function dashes(x1, y1, x2, y2, count = 5, opt = {}) {
  for (let i = 0; i < count; i++) { const a = i / count + 0.04, b = a + 0.11; line(x1 + (x2 - x1) * a, y1 + (y2 - y1) * a, x1 + (x2 - x1) * b, y1 + (y2 - y1) * b, { width: 1.4, wob: 0.6, taper: false, role: 'texture', ...opt }); }
}
function crater(x, y, r, color) {
  arc(x, y, r, 0.15, Math.PI * 1.75, { width: 1.6, wob: 1, color, role: 'texture' });
  if (chance(0.5)) dot(x - r * 0.25, y - r * 0.2, Math.max(1, r * 0.2), color);
}
function ground(y, w = 85) {
  pen.phase('detail');
  const pts = []; for (let i = 0; i <= 12; i++) pts.push([-w + i * w * 2 / 12, y + (i % 2 ? rf(-3, 3) : rf(-1.5, 1.5))]);
  stroke(pts, { width: 2.2, wob: 1.2 });
  for (let i = 0, n = ri(2, 5); i < n; i++) { const x = rf(-w, w); crater(x, y + rf(4, 12), rf(3, 7)); }
}
/* panel lines, seams, ribs: the thin marks that tell the material is built, not grown */
const SEAM = { width: 1.1, wob: 0.6, taper: false, role: 'texture' };
/* solar panels: a frame of cells, the tech detail every probe and station shares */
function panel(cx, cy, w, h, rot = 0, color = SP.blue) {
  const p = box(cx, cy, w, h, rot, 2);
  shape(p, color, { width: 2.2, wob: 1 });
  const cols = Math.max(2, Math.round(w / 14)), rows = Math.max(1, Math.round(h / 14));
  inside(p, () => {
    for (let i = 1; i < cols; i++) { const t = i / cols, x = cx + (t - 0.5) * w; stroke([[x + Math.sin(rot) * h / 2, cy - Math.cos(rot) * h / 2], [x - Math.sin(rot) * h / 2, cy + Math.cos(rot) * h / 2]], SEAM); }
    for (let i = 1; i < rows; i++) { const y = cy + (i / rows - 0.5) * h; stroke([[cx - w / 2, y], [cx + w / 2, y]], SEAM); }
  });
}
function dish(cx, cy, r, ang = -Math.PI / 2, color = SP.silver, role) {
  /* a radio dish: a shallow cup facing `ang`, a feed on a stalk */
  pen.ctx.save(); pen.ctx.translate(cx, cy); pen.ctx.rotate(ang + Math.PI / 2);
  const cup = []; for (let i = 0; i <= 10; i++) { const t = i / 10; cup.push([(t - 0.5) * 2 * r, -Math.sin(t * Math.PI) * r * 0.55]); }
  shape([...cup, [r, 0], [-r, 0]], color, { width: 2.4, wob: 1.2, role });
  for (let i = 1; i < 4; i++) { const t = i / 4; stroke([[(t - 0.5) * 2 * r * 0.9, -Math.sin(t * Math.PI) * r * 0.5], [(t - 0.5) * 2 * r * 0.9, 0]], { ...SEAM, width: 1 }); }
  stroke([[0, -r * 0.5], [0, -r * 1.2]], { width: 1.6, wob: 0.6 }); dot(0, -r * 1.24, 2.6);
  pen.ctx.restore();
}
function flame(x, y, w, len, dir = 1) {
  const col = pick([SP.gold, SP.orange, SP.coral]);
  shape([[x - w / 2, y], [x + w / 2, y], [x + w * 0.2, y + dir * len * 0.6], [x, y + dir * len * rf(0.9, 1.3)], [x - w * 0.2, y + dir * len * 0.6]], col, { width: 2, wob: 1.6 });
  shape([[x - w / 4, y], [x + w / 4, y], [x, y + dir * len * 0.5]], SP.gold, { width: 1.4, wob: 1.2 });
  for (let i = 0; i < 3; i++) dot(x + rf(-w, w), y + dir * len * rf(1.1, 1.6), rf(1.5, 3), col);
}
function flag(x, y, h, color = SP.coral, dir = 1) {
  stroke([[x, y], [x, y - h]], { width: 2, wob: 0.8 });
  shape([[x, y - h], [x + dir * h * 0.55, y - h * 0.96 + rf(-2, 2)], [x + dir * h * 0.52, y - h * 0.62], [x, y - h * 0.66]], color, { width: 1.8, wob: 1.2});   // cloth: the scribble falls
}
function smallRocket(x, y, k, rot = 0, M = {}) { pen.ctx.save(); pen.ctx.translate(x, y); pen.ctx.rotate(rot); MOTIFS.rocket(k, { ...M, sub: true }); pen.ctx.restore(); }

/* a random bit of livestock, hardware or soul being hoisted up an abduction beam */
function liftedCargo(S) {
  const thing = wpick({ cow: 2, sheep: 1, tractor: 1, sleeper: 1, tree: 1, mailbox: 0.8 });
  const y = 0.62 * S, x0 = -0.04 * S;
  if (thing === 'cow') {
    const cow = blob(x0, y, 0.2 * S, 0.13 * S, 0.1, 12); shape(cow, null, { width: 2.2, wob: 1.2 });
    inside(cow, () => { for (let i = 0; i < 2; i++) shape(blob(rf(-0.14, 0.04) * S, y + rf(-0.06, 0.06) * S, 0.05 * S, 0.04 * S, 0.1, 8), null, { inkFill: true, width: 1 }); });
    shape(blob(0.2 * S, y - 0.06 * S, 0.07 * S, 0.06 * S, 0.08, 10), null, { width: 2, wob: 1 });                             // the head
    for (const d of [-1, 1]) stroke([[0.2 * S + d * 0.05 * S, y - 0.11 * S], [0.2 * S + d * 0.08 * S, y - 0.16 * S]], { width: 1.6 });   // horns
    dot(0.22 * S, y - 0.07 * S, 1.2); shape(blob(0.23 * S, y - 0.02 * S, 0.03 * S, 0.02 * S, 0.1, 6), SP.coral, { width: 1 });          // eye and muzzle
    for (const x of [-0.16, -0.08, 0.02, 0.1]) stroke([[x * S, y + 0.11 * S], [x * S, y + 0.21 * S]], { width: 1.8 });   // legs
    stroke([[-0.24 * S, y], [-0.32 * S, y + 0.08 * S]], { width: 1.4 });                                                // tail
  } else if (thing === 'sheep') {
    const wool = blob(x0, y, 0.22 * S, 0.15 * S, 0.14, 12); shape(wool, null, { width: 2.2, wob: 1.3 });
    for (let i = 0; i < 6; i++) { const a = rf(0, Math.PI * 2), r = rf(0.02, 0.08) * S; shape(blob(x0 + Math.cos(a) * r, y + Math.sin(a) * r * 0.6, 0.05 * S, 0.04 * S, 0.15, 8), null, { width: 1, role: 'texture' }); }   // fluff lumps
    shape(blob(x0 + 0.24 * S, y - 0.08 * S, 0.07 * S, 0.09 * S, 0.1, 10), null, { width: 2, wob: 1 });   // dark head
    for (const d of [-1, 1]) stroke([[x0 + 0.24 * S + d * 0.05 * S, y - 0.16 * S], [x0 + 0.24 * S + d * 0.07 * S, y - 0.22 * S]], { width: 1.5 });   // ears
    for (const x of [-0.14, 0.04]) stroke([[x * S, y + 0.14 * S], [x * S, y + 0.24 * S]], { width: 1.6 });   // legs
  } else if (thing === 'tractor') {
    shape(blob(x0, y + 0.1 * S, 0.24 * S, 0.12 * S, 0.08, 12), SP.coral, { width: 2.2, wob: 1.2 });   // the body
    shape(blob(x0 - 0.24 * S, y + 0.04 * S, 0.08 * S, 0.14 * S, 0.1, 10), SP.rust, { width: 2, wob: 1 });   // engine
    shape(blob(x0 - 0.24 * S, y - 0.1 * S, 0.06 * S, 0.08 * S, 0.1, 8), SP.navy, { width: 1.6, wob: 1 });   // cab
    for (const x of [x0 - 0.2 * S, x0 + 0.16 * S]) { shape(blob(x, y + 0.24 * S, 0.09 * S, 0.09 * S, 0.08, 10), SP.navy, { width: 2, wob: 1 }); stroke([[x, y + 0.16 * S], [x, y + 0.2 * S]], { width: 1.8 }); }   // wheels
  } else if (thing === 'sleeper') {
    shape(blob(x0, y, 0.24 * S, 0.14 * S, 0.08, 12), SP.cream, { width: 2.4, wob: 1.3});   // the sleeping sack
    shape(blob(x0 + 0.26 * S, y - 0.05 * S, 0.08 * S, 0.09 * S, 0.08, 10), SP.cream, { width: 2, wob: 1 });   // head
    shape(blob(x0 + 0.2 * S, y + 0.05 * S, 0.09 * S, 0.05 * S, 0.1, 8), SP.silver, { width: 1.6, wob: 1 });   // an arm dangling
    for (let i = 0; i < 3; i++) dot(x0 + 0.02 * S + i * 0.09 * S, y, 1.6, SP.coral);   // zzz...
    for (const s of [-1, 1]) shape(blob(x0 + s * 0.1 * S, y + 0.16 * S, 0.06 * S, 0.04 * S, 0.1, 8), SP.navy, { width: 1.6, wob: 1 });   // feet
  } else if (thing === 'tree') {
    stroke([[x0, y + 0.22 * S], [x0, y - 0.12 * S]], { width: 2.2 });   // trunk
    for (const s of [-1, 1]) shape(blob(x0 + s * 0.13 * S, y - 0.2 * S, 0.16 * S, 0.12 * S, 0.12, 10), pick([SP.green, SP.lime, SP.teal]), { width: 2.2, wob: 1.3 });   // canopy
    for (let i = 0; i < 3; i++) dot(x0 + rf(-0.2, 0.2) * S, y - 0.2 * S + rf(-0.1, 0.1) * S, rf(1.5, 2.5), SP.coral);   // fruit
  } else {   // mailbox
    stroke([[x0 - 0.08 * S, y + 0.2 * S], [x0 - 0.08 * S, y - 0.05 * S]], { width: 2 });   // post
    shape(box(x0, y - 0.16 * S, 0.26 * S, 0.16 * S, 0, 2), SP.rust, { width: 2.2, wob: 1.2 });   // box
    shape([[-0.13 * S + x0, y - 0.16 * S], [0.13 * S + x0, y - 0.16 * S], [0.13 * S + x0, y - 0.24 * S], [-0.13 * S + x0, y - 0.24 * S]], SP.navy, { width: 1.8, wob: 1 });   // cap
    dot(x0 + 0.02 * S, y - 0.08 * S, 1.6, SP.gold);   // the little flag
  }
}

/* ─── The faces of aliens and robots: the lid of an eye and the line of a mouth are where the
   pen goes back — drawn in the expression phase by whoever calls them ─── */
function alienEye(x, y, r, style, look = 0) {
  if (style === 'black') { const e = blob(x, y, r, r * 1.5, 0.05, 12, rf(-0.3, 0.3)); shape(e, null, { inkFill: true, width: 1.6 }); dot(x + look * r * 0.3 - r * 0.3, y - r * 0.4, r * 0.28, pen.base); if (chance(0.5)) retrace(e, { closed: true, width: 1.8, span: 0.35, at: 0.75 }); }
  else if (style === 'round') { const e = blob(x, y, r, r, 0.05, 10); shape(e, null, { width: 1.8 }); dot(x + look * r * 0.4, y + r * 0.1, r * 0.5); dot(x + look * r * 0.4 - r * 0.2, y - r * 0.15, r * 0.15, pen.base); if (chance(0.6)) retrace(e, { closed: true, width: 1.8, span: 0.4, at: 0.75 }); }   // the lid
  else if (style === 'stalk') { stroke([[x, y + r * 2], [x + look * r, y]], { width: 2 }); shape(blob(x + look * r, y, r * 0.8, r * 0.8, 0.05, 10), null, { width: 1.6 }); dot(x + look * r, y, r * 0.35); }
  else { const e = blob(x, y, r * 1.2, r * 0.7, 0.05, 10, look * 0.3); shape(e, SP.lime, { width: 1.6 }); dot(x + look * r * 0.3, y, r * 0.35); if (chance(0.5)) retrace(e, { closed: true, width: 1.6, span: 0.4, at: 0.75 }); }   // slit, lit
}
function mouthOf(x, y, w, kind) {
  let p;
  if (kind === 'smile') { p = arcPts(x, y - w * 0.2, w * 0.5, w * 0.5, 0.2, Math.PI - 0.2, 0, 8); stroke(p, { width: 2, wob: 1 }); }
  else if (kind === 'o') { shape(blob(x, y, w * 0.18, w * 0.25, 0.1, 8), null, { inkFill: true, width: 1.6 }); return; }
  else if (kind === 'teeth') { p = [[x - w * 0.45, y], [x + w * 0.45, y]]; stroke(p, { width: 2 }); for (let i = -2; i <= 2; i++) stroke([[x + i * w * 0.18, y - w * 0.1], [x + i * w * 0.18, y + w * 0.12]], { width: 1.2 }); }
  else if (kind === 'zigzag') { p = []; for (let i = 0; i <= 6; i++) p.push([x - w * 0.45 + i * w * 0.15, y + (i % 2 ? w * 0.1 : -w * 0.05)]); stroke(p, { width: 1.8, wob: 0.8 }); }
  else { p = [[x - w * 0.3, y], [x + w * 0.3, y + rf(-3, 3)]]; stroke(p, { width: 2, wob: 0.8 }); }
  if (chance(0.6)) retrace(p, { width: 2, span: 0.6 });   // the mouth, gone over
}

/* ─── Motifs: each draws centred on (0,0) within about ±S; M carries facing, look, the shade side, a sub flag.
   Every motif rolls in phases: silhouette (kind, pose, the main geometry) → palette (colours) →
   accessories (props, decorations) → expression (a face, where there is one) → detail (the drawing itself,
   craters, sparkles, ground). Each phase is entered unconditionally, so a lock can hold its stream. ─── */
const MOTIFS = {
  /* ---------- tech ---------- */
  rocket(S, M = {}) {
    pen.phase('silhouette');
    const kind = M.sub ? 'classic' : wpick({ classic: 2, stages: 1, retro: 1.2, stubby: 1 });
    const tilt = M.sub ? 0 : rf(-0.35, 0.35);
    const W = kind === 'stubby' ? 0.4 : kind === 'retro' ? 0.28 : 0.26, H = kind === 'stubby' ? 0.6 : 0.78;
    const fins = [-1, 1].map(s => [[s * W * 0.8 * S, H * 0.3 * S], [s * (W + 0.34) * S, (H + 0.12) * S], [s * (W + 0.1) * S, (H + 0.05) * S], [s * W * 0.9 * S, (H - 0.2) * S]]);
    const body = kind === 'stages'
      ? [[-W * S, -H * 0.3 * S], [W * S, -H * 0.3 * S], [W * 1.15 * S, H * 0.2 * S], [W * 1.15 * S, H * S], [-W * 1.15 * S, H * S], [-W * 1.15 * S, H * 0.2 * S]]
      : blob(0, 0, W * S, H * S, 0.03, 16);
    const nose = [[-W * S, -H * 0.45 * S], [0, -(H + 0.32) * S], [W * S, -H * 0.45 * S]];
    const tower = (kind === 'classic' || kind === 'stages') && chance(0.3);
    const portN = kind === 'stubby' ? 1 : pick([1, 1, 2]);
    pen.phase('palette');
    const bodyC = pick([SP.coral, SP.orange, SP.blue, SP.silver, SP.teal]), trimC = pick([SP.gold, SP.navy, SP.coral]);
    pen.phase('accessories');
    const deco = wpick({ stripe: 1, rings: 1, logo: 1, plain: 1 });                       // body decoration varies per figure
    const bottomPort = chance(0.4), spent = kind === 'stages' && !M.sub && chance(0.45), spentRot = rf(-0.4, 0.4);
    pen.phase('detail');
    pen.ctx.save(); pen.ctx.rotate(tilt);
    for (const fin of fins) shape(fin, SP.navy, { width: 2.4, wob: 1.2 });   // fins
    if (kind === 'retro') shape([[0, H * 0.3 * S], [0.05 * S, (H + 0.14) * S], [-0.05 * S, (H + 0.14) * S]], SP.navy, { width: 2, wob: 1 });   // a third fin, end on
    shape(body, bodyC, { width: 3.2, wob: 1.4, role: 'silhouette'});   // the hull, its scribble along the long axis
    for (const fin of fins) joint(fin[0], fin[1], { width: 2.4 });                  // where each fin leaves the hull
    if (kind === 'stages') { stroke([[-W * 1.15 * S, H * 0.2 * S], [W * 1.15 * S, H * 0.2 * S]], { width: 2, role: 'texture' }); rivets([[-W * 0.8 * S, H * 0.5 * S], [0, H * 0.5 * S], [W * 0.8 * S, H * 0.5 * S]]); }
    if (deco === 'stripe' && kind !== 'retro') stroke([[0, -H * 0.5 * S], [0, H * 0.55 * S]], { width: 1.8, wob: 1.2, color: trimC });   // a racing stripe
    else if (deco === 'rings') for (let i = 0; i < 3; i++) stroke([[-W * 1.08 * S, (0.0 + i * 0.22) * S], [W * 1.08 * S, (0.0 + i * 0.22) * S]], { width: 1.4, wob: 1, color: trimC, role: 'texture' });   // band rings
    else if (deco === 'logo') { shape(blob(0, H * 0.05 * S, W * 0.42 * S, W * 0.42 * S, 0.06, 10), trimC, { width: 2, wob: 1 }); shape(starPts(0, H * 0.05 * S, W * 0.3 * S, W * 0.12 * S), SP.gold, { width: 1.6, wob: 0.8 }); }   // a star logo
    shape(nose, trimC, { width: 2.6, wob: 1.2, role: 'silhouette' });   // nose cone
    if (tower) { stroke([[0, -(H + 0.32) * S], [0, -(H + 0.6) * S]], { width: 1.6 }); shape([[0, -(H + 0.6) * S], [-0.05 * S, -(H + 0.78) * S], [0.05 * S, -(H + 0.78) * S]], trimC, { width: 1.6, wob: 0.8 }); }   // an escape tower
    if (kind === 'retro') for (let i = 0; i < 2; i++) stroke([[-W * S, (0.1 + i * 0.25) * S], [W * S, (0.1 + i * 0.25) * S]], { width: 1.6, wob: 1, role: 'texture' });   // bands
    for (let pi = 0; pi < portN; pi++) { const py = pi === 0 ? -H * 0.45 * S : H * 0.08 * S, pr = pi === 0 ? W * 0.45 * S : W * 0.32 * S; const port = blob(0, py, pr, pr, 0.05, 12); shape(port, SP.navy, { width: 2, wob: 1 }); dot(-pr * 0.33, py - pr * 0.1, pr * 0.27, pen.base); }   // one or two portholes
    if (bottomPort) shape(blob(0, H * 0.35 * S, W * 0.24 * S, W * 0.24 * S, 0.05, 10), SP.navy, { width: 1.6, wob: 1 });
    formShade(body, 0, 0, W * 1.1 * S, H * S, M.shade, 12, 9);                       // the hull turns away from the light
    retrace(body, { closed: true, width: 3.2, span: 0.18, at: kind === 'stages' ? 0.55 : 0.25 });   // the base, where the flame leaves the nozzle
    if (spent) {                                                                       // the spent lower stage tumbling off
      pen.ctx.rotate(spentRot);
      shape(box(0.32 * S, H * S + 0.62 * S, 0.42 * S, 0.22 * S, 0.4), SP.navy, { width: 2, wob: 1.2 });
      for (let i = 0; i < 4; i++) dot(0.24 * S + rf(-0.2, 0.2) * S, H * S + 0.72 * S + rf(-0.2, 0.2) * S, rf(1.5, 3), SP.silver);
    }
    if (!M.sub) flame(0, H * S + 2, W * 1.4 * S, 0.42 * S);
    else flame(0, H * S + 2, W * 1.2 * S, 0.35 * S);
    pen.ctx.restore();
    if (!M.sub) specks(S, 3);
    return kind;
  },
  shuttle(S, M) {
    pen.phase('silhouette');
    const f = M.f, lean = -f * rf(0.2, 0.5);
    const wing = [[-f * 0.1 * S, -0.35 * S], [-f * 0.7 * S, 0.55 * S], [-f * 0.1 * S, 0.55 * S], [f * 0.1 * S, 0.55 * S], [f * 0.7 * S, 0.55 * S], [f * 0.1 * S, -0.35 * S]];
    const body = [[-0.16 * S, -0.55 * S], [0, -0.95 * S], [0.16 * S, -0.55 * S], [0.2 * S, 0.55 * S], [-0.2 * S, 0.55 * S]];
    pen.phase('detail');
    pen.ctx.save(); pen.ctx.rotate(lean);
    shape(wing, SP.silver, { width: 2.8, wob: 1.2, role: 'silhouette'});
    shape(body, null, { width: 3, wob: 1.3, role: 'silhouette' });
    shape([[-0.16 * S, -0.55 * S], [0, -0.95 * S], [0.16 * S, -0.55 * S]], SP.ink, { width: 2, wob: 1 });   // black nose
    shape([[-0.22 * S, 0.55 * S], [0.22 * S, 0.55 * S], [0.16 * S, 0.66 * S], [-0.16 * S, 0.66 * S]], SP.ink, { width: 2, wob: 1 });   // engine bells
    retrace([[-0.2 * S, 0.55 * S], [0, 0.55 * S], [0.2 * S, 0.55 * S]], { width: 2.6, span: 0.7 });   // where the bells meet the hull
    shape([[-0.05 * S, 0.1 * S], [0.05 * S, 0.1 * S], [0.03 * S, 0.55 * S], [-0.03 * S, 0.55 * S]], SP.silver, { width: 1.6, wob: 0.8 });   // tail fin
    for (const s of [-1, 1]) stroke([[s * 0.08 * S, -0.5 * S], [s * 0.1 * S, -0.3 * S]], { width: 2 });   // cockpit windows
    formShade(body, 0, 0, 0.2 * S, 0.75 * S, M.shade, 8, 8);
    for (let i = 0; i < 3; i++) flame(-0.1 * S + i * 0.1 * S, 0.68 * S, 0.1 * S, 0.4 * S);
    for (const s of [-1, 1]) stroke([[s * 0.2 * S, 0.3 * S], [s * 0.6 * S, 0.5 * S]], { width: 1.4, role: 'texture' });   // wing edges
    pen.ctx.restore();
    specks(S, 3);
  },
  satellite(S, M) {
    pen.phase('silhouette');
    const kind = wpick({ dish: 1.5, cube: 1, tube: 1 }), rot = rf(-0.5, 0.5);
    const bodyPts = kind === 'tube' ? box(0, 0, 0.38 * S, 1.1 * S, 0) : kind === 'cube' ? box(0, 0, 0.42 * S, 0.42 * S, 0) : box(0, 0, 0.5 * S, 0.36 * S, 0);
    pen.phase('accessories');
    const orbit = chance(0.5);
    pen.phase('detail');
    pen.ctx.save(); pen.ctx.rotate(rot);
    if (kind === 'tube') {
      shape(bodyPts, SP.silver, { width: 3, wob: 1.2, role: 'silhouette'});   // a Hubble
      for (let i = 0; i < 3; i++) stroke([[-0.19 * S, -0.3 * S + i * 0.25 * S], [0.19 * S, -0.3 * S + i * 0.25 * S]], { width: 1.4, role: 'texture' });
      formShade(bodyPts, 0, 0, 0.19 * S, 0.55 * S, M.shade, 8, 8);
      shape(blob(0, -0.55 * S, 0.19 * S, 0.07 * S, 0.05, 12), SP.navy, { width: 2, wob: 1 });   // the open end
      for (const s of [-1, 1]) panel(s * 0.55 * S, 0, 0.55 * S, 0.22 * S, 0);
      stroke([[-0.3 * S, 0], [0.3 * S, 0]], { width: 1.6 });
    } else {
      for (const s of [-1, 1]) { stroke([[s * 0.2 * S, 0], [s * 0.35 * S, 0]], { width: 2 }); panel(s * 0.68 * S, 0, 0.62 * S, 0.26 * S, 0); }
      shape(bodyPts, SP.gold, { width: 3, wob: 1.3, role: 'silhouette'});
      joint([M.shade * 0.2 * S, 0], [M.shade * 0.35 * S, 0], { width: 2 });                    // the wing strut leaving the bus
      formShade(bodyPts, 0, 0, 0.24 * S, 0.2 * S, M.shade, 6, 7);
      rivets([[-0.14 * S, -0.12 * S], [0.14 * S, -0.12 * S], [0.14 * S, 0.12 * S], [-0.14 * S, 0.12 * S]]);
      if (kind === 'dish') { stroke([[0, -0.18 * S], [0, -0.32 * S]], { width: 2 }); dish(0, -0.45 * S, 0.26 * S, -Math.PI / 2); }
      else { stroke([[0, -0.21 * S], [0, -0.6 * S]], { width: 1.8 }); dot(0, -0.64 * S, 3.2, SP.coral); for (const s of [-1, 1]) stroke([[s * 0.1 * S, 0.21 * S], [s * 0.16 * S, 0.45 * S]], { width: 1.6 }); }
      if (orbit) { const o = []; for (let i = 0; i <= 16; i++) { const a = Math.PI * 0.15 + i / 16 * Math.PI * 1.2; o.push([Math.cos(a) * 1.05 * S, Math.sin(a) * 0.35 * S + 0.2 * S]); } stroke(o, { width: 1.2, wob: 1.2, color: SP.lilac, role: 'texture' }); }   // an orbit line
    }
    pen.ctx.restore();
    specks(S, 2);
    return kind;
  },
  station(S, M) {
    pen.phase('silhouette');
    const rot = rf(-0.3, 0.3), modules = ri(2, 4);
    const boxes = Array.from({ length: modules }, (_, i) => box((i - (modules - 1) / 2) * 0.3 * S, 0, 0.28 * S, 0.2 * S, 0));
    pen.phase('palette');
    const cols = boxes.map(() => pick([SP.silver, SP.cream, SP.gold]));
    pen.phase('accessories');
    const node = chance(0.6), hasDish = chance(0.6), dishAng = -Math.PI / 2 + rf(-0.6, 0.6), docking = chance(0.4);
    pen.phase('detail');
    pen.ctx.save(); pen.ctx.rotate(rot);
    stroke([[-1.0 * S, 0], [1.0 * S, 0]], { width: 3, wob: 1, role: 'silhouette' });                       // the truss
    for (let i = -4; i <= 4; i++) stroke([[i * 0.22 * S, -0.05 * S], [i * 0.22 * S + 0.11 * S, 0.05 * S]], { ...SEAM, width: 1.2 });
    for (const x of [-0.75, 0.75]) for (const s of [-1, 1]) panel(x * S, s * 0.36 * S, 0.36 * S, 0.5 * S, 0);   // four big wings
    boxes.forEach((b, i) => { shape(b, cols[i], { width: 2.6, wob: 1.2, role: 'silhouette'}); dot(b[0][0] / 2 + b[2][0] / 2, 0, 2.6, SP.navy); });
    if (node) { shape(box(0, 0.28 * S, 0.16 * S, 0.34 * S, 0), SP.silver, { width: 2.2, wob: 1.1 }); shape(blob(0, 0.5 * S, 0.12 * S, 0.1 * S, 0.06, 10), SP.navy, { width: 2, wob: 1 }); joint([0, 0.1 * S], [0, 0.45 * S], { width: 2.2 }); }   // a node hanging below
    if (hasDish) dish(0, -0.32 * S, 0.16 * S, dishAng);
    if (docking) smallRocket(0.1 * S, -0.62 * S, 0.2 * S, Math.PI / 2, M);   // a capsule docking
    pen.ctx.restore();
    specks(S, 3);
  },
  probe(S, M) {
    pen.phase('silhouette');
    const rot = rf(-0.6, 0.6), f = M.f, bus = box(0, 0.12 * S, 0.36 * S, 0.26 * S, 0);
    pen.phase('palette');
    const dishC = pick([SP.silver, SP.cream]), worldC = pick([SP.teal, SP.coral, SP.lilac]);
    pen.phase('accessories');
    const record = chance(0.5), world = chance(0.6);
    pen.phase('detail');
    pen.ctx.save(); pen.ctx.rotate(rot);
    dish(0, -0.15 * S, 0.5 * S, -Math.PI / 2, dishC, 'silhouette');                 // the big Voyager dish
    shape(bus, SP.gold, { width: 2.6, wob: 1.2, role: 'silhouette'});       // the bus
    rivets([[-0.1 * S, 0.06 * S], [0.1 * S, 0.06 * S], [0, 0.18 * S]]);
    stroke([[f * 0.18 * S, 0.1 * S], [f * 0.9 * S, 0.35 * S]], { width: 2.2 });                // the long boom
    joint([f * 0.18 * S, 0.1 * S], [f * 0.9 * S, 0.35 * S], { width: 2.2 });                    // where it leaves the bus
    for (let i = 1; i < 6; i++) stroke([[f * (0.18 + i * 0.12) * S, (0.1 + i * 0.04) * S], [f * (0.18 + i * 0.12) * S, (0.16 + i * 0.04) * S]], SEAM);
    shape(box(f * 0.95 * S, 0.37 * S, 0.14 * S, 0.2 * S, 0.3 * f), SP.navy, { width: 2, wob: 1 });   // instruments at the end
    stroke([[-f * 0.18 * S, 0.2 * S], [-f * 0.6 * S, 0.55 * S]], { width: 2 }); shape(box(-f * 0.66 * S, 0.6 * S, 0.16 * S, 0.3 * S, -0.6 * f), SP.silver, { width: 2, wob: 1 });   // the RTG
    if (record) shape(blob(0, 0.35 * S, 0.1 * S, 0.1 * S, 0.05, 10), SP.gold, { width: 1.8, wob: 1 });   // the golden record
    pen.ctx.restore();
    if (world) { const pl = blob(-f * 0.7 * S, -0.55 * S, 0.22 * S, 0.2 * S, 0.08, 12); shape(pl, worldC, { width: 2.2, wob: 1.3}); }   // a world passed by
    specks(S, 3);
  },
  lander(S, M) {
    pen.phase('silhouette');
    const f = M.f;
    const legs = [-1, 1].map(s => [[s * 0.3 * S, 0.12 * S], [s * 0.62 * S, 0.62 * S]]);
    const pads = [-1, 1].map(s => blob(s * 0.64 * S, 0.66 * S, 0.11 * S, 0.04 * S, 0.05, 10));
    const stage = [[-0.4 * S, 0.12 * S], [0.4 * S, 0.12 * S], [0.46 * S, 0.4 * S], [-0.46 * S, 0.4 * S]];
    const cabin = [[-0.3 * S, 0.12 * S], [-0.36 * S, -0.2 * S], [-0.2 * S, -0.42 * S], [0.2 * S, -0.42 * S], [0.36 * S, -0.2 * S], [0.3 * S, 0.12 * S]];
    pen.phase('palette');
    const flagC = pick([SP.coral, SP.blue]);
    pen.phase('accessories');
    const hasDish = chance(0.6), hasFlag = chance(0.5), ladder = chance(0.5);
    ground(0.7 * S, 0.95 * S);
    pen.phase('detail');
    legs.forEach((leg, i) => {                                                            // legs with pads
      stroke(leg, { width: 2.4 }); stroke([[leg[0][0], 0.3 * S], [leg[0][0] * 1.83, 0.5 * S]], { width: 1.6 });
      shape(pads[i], SP.gold, { width: 1.8, wob: 1 });
    });
    shape(stage, SP.gold, { width: 2.8, wob: 1.3, role: 'silhouette'});   // descent stage, gold foil
    inside(stage, () => hatch(-0.46 * S, 0.12 * S, 0.46 * S, 0.4 * S, 14, 0.9, 7, SP.rust));   // the foil crinkles
    for (const leg of legs) joint(leg[0], leg[1], { width: 2.4 });                        // where the legs leave the stage
    shape([[-0.1 * S, 0.4 * S], [0.1 * S, 0.4 * S], [0.15 * S, 0.56 * S], [-0.15 * S, 0.56 * S]], SP.navy, { width: 2, wob: 1 });   // the engine bell
    retrace([[-0.1 * S, 0.4 * S], [0, 0.4 * S], [0.1 * S, 0.4 * S]], { width: 2.4, span: 0.7 });   // where it meets the stage
    shape(cabin, SP.silver, { width: 2.8, wob: 1.3, role: 'silhouette'});
    formShade(cabin, 0, -0.15 * S, 0.36 * S, 0.28 * S, M.shade, 8, 8);
    for (const s of [-1, 1]) shape([[s * 0.08 * S, -0.32 * S], [s * 0.2 * S, -0.28 * S], [s * 0.18 * S, -0.14 * S], [s * 0.06 * S, -0.16 * S]], SP.navy, { width: 1.8, wob: 1 });   // triangle windows
    shape([[-0.04 * S, 0.12 * S], [0.04 * S, 0.12 * S], [0.04 * S, -0.1 * S], [-0.04 * S, -0.1 * S]], SP.ink, { width: 1.6, wob: 0.8 });   // the hatch
    stroke([[0, -0.42 * S], [0, -0.68 * S]], { width: 1.6 }); dot(0, -0.7 * S, 2.8, SP.coral);
    if (hasDish) dish(f * 0.25 * S, -0.55 * S, 0.1 * S, -Math.PI / 2 + f * 0.5);
    if (hasFlag) flag(-f * 0.8 * S, 0.7 * S, 0.45 * S, flagC, f);
    if (ladder) { for (let i = 0; i < 4; i++) stroke([[f * 0.36 * S, 0.15 * S + i * 0.12 * S], [f * 0.5 * S, 0.25 * S + i * 0.12 * S]], { ...SEAM, width: 1.4 }); }   // ladder
  },
  rover(S, M) {
    pen.phase('silhouette');
    const wheels = pick([4, 6]), f = M.f;
    const xs = wheels === 4 ? [-0.5, 0.5] : [-0.62, 0, 0.62];
    const rims = xs.map(x => blob(x * S, 0.52 * S, 0.18 * S, 0.17 * S, 0.06, 12));
    const body = box(0, 0.1 * S, 1.1 * S, 0.42 * S, 0, 4);
    pen.phase('palette');
    const bodyC = pick([SP.orange, SP.silver, SP.cream, SP.rust]);
    pen.phase('accessories');
    const arm = chance(0.6), hasDish = chance(0.5), dishAng = -Math.PI / 2 + f * 0.6, antenna = chance(0.4);
    ground(0.72 * S, 0.95 * S);
    pen.phase('detail');
    xs.forEach((x, wi) => {                                                                 // wheels, spokes, tread
      shape(rims[wi], SP.navy, { width: 2.6, wob: 1.2 });
      for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3 + rf(-0.2, 0.2); stroke([[x * S - Math.cos(a) * 0.12 * S, 0.52 * S - Math.sin(a) * 0.12 * S], [x * S + Math.cos(a) * 0.12 * S, 0.52 * S + Math.sin(a) * 0.12 * S]], { width: 1.2, role: 'texture' }); }
      if (chance(0.5)) for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; line(x * S + Math.cos(a) * 0.16 * S, 0.52 * S + Math.sin(a) * 0.16 * S, x * S + Math.cos(a) * 0.21 * S, 0.52 * S + Math.sin(a) * 0.21 * S, { width: 1.6, wob: 0.4, taper: false, role: 'texture' }); }
    });
    stroke([[-0.65 * S, 0.36 * S], [0.65 * S, 0.36 * S]], { width: 2.6, wob: 0.8 });             // the axle bar
    for (const x of xs) stroke([[x * S, 0.36 * S], [x * S, 0.5 * S]], { width: 2 });
    shape(body, bodyC, { width: 3, wob: 1.4, role: 'silhouette'});
    formShade(body, 0, 0.1 * S, 0.55 * S, 0.21 * S, M.shade, 10, 10);
    retrace(body, { closed: true, width: 3, span: 0.3, at: M.shade > 0 ? 0.4 : 0.9 });        // the shadow side of the body
    rivets([[-0.45 * S, -0.05 * S], [0.45 * S, -0.05 * S], [-0.45 * S, 0.25 * S], [0.45 * S, 0.25 * S]]);
    panel(-f * 0.25 * S, -0.18 * S, 0.5 * S, 0.16 * S, 0);                                       // deck panel
    stroke([[f * 0.3 * S, -0.1 * S], [f * 0.32 * S, -0.7 * S]], { width: 2.4 });                  // the mast
    joint([f * 0.3 * S, -0.1 * S], [f * 0.32 * S, -0.7 * S], { width: 2.4 });                     // where it leaves the deck
    shape(box(f * 0.32 * S, -0.78 * S, 0.24 * S, 0.16 * S, 0), SP.navy, { width: 2, wob: 1 }); dot(f * 0.26 * S, -0.78 * S, 2.2, SP.gold); dot(f * 0.38 * S, -0.78 * S, 2.2, SP.gold);   // camera head
    if (arm) { stroke([[-f * 0.55 * S, 0.0], [-f * 0.85 * S, 0.15 * S], [-f * 0.92 * S, 0.45 * S]], { width: 2.2 }); stroke([[-f * 0.98 * S, 0.42 * S], [-f * 0.86 * S, 0.48 * S]], { width: 1.6 }); }   // the arm
    if (hasDish) dish(f * 0.05 * S, -0.3 * S, 0.1 * S, dishAng);
    if (antenna) stroke([[-f * 0.3 * S, -0.1 * S], [-f * 0.3 * S, -0.5 * S]], { width: 1.4 }), dot(-f * 0.3 * S, -0.53 * S, 2.4, SP.coral);
    return wheels === 4 ? 'four-wheel' : 'six-wheel';
  },
  astronaut(S, M) {
    pen.phase('silhouette');
    const pose = wpick({ float: 1.5, flag: 1, jetpack: 1, wave: 1, salute: 0.8, point: 0.7 }), f = M.f;
    const lean = pose === 'float' ? rf(-0.7, 0.7) : rf(-0.08, 0.08);
    const helmet = blob(0, -0.55 * S, 0.34 * S, 0.34 * S, 0.05, 14);
    const torso = [[-0.3 * S, -0.24 * S], [0.3 * S, -0.24 * S], [0.36 * S, 0.42 * S], [-0.36 * S, 0.42 * S]];
    const backpack = chance(0.6);
    const arms = pose === 'flag' ? [[-0.32, -0.16, -0.55, 0.2, -0.75, 0.0], [0.32, -0.16, 0.62, -0.4, 0.7, -0.7]]
      : pose === 'wave' ? [[-0.32, -0.16, -0.6, 0.2, -0.5, 0.35], [0.32, -0.16, 0.55, -0.5, 0.45, -0.85]]
      : pose === 'salute' ? [[-0.32, -0.16, -0.48, -0.5, -0.5, -0.75], [0.32, -0.16, 0.5, 0.0, 0.45, 0.3]]
      : pose === 'point' ? [[-0.32, -0.16, -0.5, -0.4, -0.55, -0.6], [0.32, -0.16, 0.7, 0.3, 0.95, 0.4]]
      : [[-0.32, -0.16, -0.62, 0.0, -0.7, 0.3], [0.32, -0.16, 0.6, 0.05, 0.55, 0.38]];
    const visor = blob(0, -0.56 * S, 0.24 * S, 0.19 * S, 0.05, 12);
    pen.phase('palette');
    const suit = pick([SP.cream, SP.silver, null]), accent = pick([SP.coral, SP.teal, SP.gold, SP.navy, SP.orange]);
    const visorC = chance(0.3) ? SP.gold : SP.navy, lampA = pick([SP.gold, SP.lime]), lampB = pick([SP.teal, SP.coral]), flagC = pick([SP.coral, SP.blue]), rockC = pick([SP.rust, SP.silver, null]);
    pen.phase('accessories');
    const waist = chance(0.5), collar = chance(0.5), band = chance(0.4), reflection = chance(0.5);
    pen.phase('detail');
    pen.ctx.save(); pen.ctx.rotate(lean);
    if (pose === 'jetpack') { shape(box(0, 0.05 * S, 0.62 * S, 0.5 * S, 0), SP.navy, { width: 2.4, wob: 1.2 }); for (const s of [-1, 1]) flame(s * 0.22 * S, 0.32 * S, 0.1 * S, 0.3 * S); }
    for (const s of [-1, 1]) {                                                            // legs and boots
      shape(tube([[s * 0.15 * S, 0.4 * S], [s * 0.2 * S, 0.62 * S], [s * 0.22 * S, 0.84 * S]], [0.18 * S, 0.16 * S, 0.15 * S]), suit, { width: 2.4, wob: 1.2});
      shape(blob(s * 0.24 * S, 0.88 * S, 0.14 * S, 0.08 * S, 0.06, 10), SP.navy, { width: 2, wob: 1 });
    }
    if (backpack) shape(blob(-f * 0.42 * S, 0.1 * S, 0.12 * S, 0.3 * S, 0.06, 12), SP.silver, { width: 2, wob: 1 });   // a PLSS backpack behind
    shape(torso, suit, { width: 3, wob: 1.4, role: 'silhouette'});
    formShade(torso, 0, 0.09 * S, 0.36 * S, 0.33 * S, M.shade, 8, 9);
    if (waist) stroke([[-0.3 * S, 0.1 * S], [0.3 * S, 0.1 * S]], { width: 1.6, wob: 0.8, color: accent });   // a waist stripe
    shape(box(0, 0.05 * S, 0.26 * S, 0.22 * S, 0, 2), accent, { width: 1.8, wob: 1 }); dot(-0.05 * S, 0.02 * S, 2, lampA); dot(0.05 * S, 0.02 * S, 2, lampB); stroke([[-0.08 * S, 0.1 * S], [0.08 * S, 0.1 * S]], { width: 1.2, role: 'texture' });   // chest pack, in an accent colour
    for (const [sx, sy, ex, ey, hx, hy] of arms) { shape(tube([[sx * S, sy * S], [ex * S, ey * S], [hx * S, hy * S]], [0.17 * S, 0.15 * S, 0.12 * S]), suit, { width: 2.4, wob: 1.2}); shape(blob(hx * S, hy * S, 0.09 * S, 0.08 * S, 0.08, 10), SP.silver, { width: 1.8, wob: 1 }); }
    joint([arms[M.shade > 0 ? 1 : 0][0] * S, arms[M.shade > 0 ? 1 : 0][1] * S], [arms[M.shade > 0 ? 1 : 0][2] * S, arms[M.shade > 0 ? 1 : 0][3] * S], { width: 2.4 });   // the shoulder on the shade side
    shape(helmet, suit, { width: 3, wob: 1.3, role: 'silhouette' });
    retrace(helmet, { closed: true, width: 3, span: 0.3, at: 0.25 });                        // where the helmet sits on the torso
    if (collar) shape(blob(0, -0.33 * S, 0.28 * S, 0.07 * S, 0.05, 10), accent, { width: 1.8, wob: 1 });   // a collar ring
    if (band) stroke([[-0.3 * S, -0.6 * S], [0.3 * S, -0.6 * S]], { width: 1.6, wob: 0.8, color: accent });   // a helmet band
    shape(visor, visorC, { width: 2.2, wob: 1 });
    retrace(visor, { closed: true, width: 2.2, span: 0.35, at: 0.75 });                      // the brow of the visor
    if (reflection) inside(visor, () => { shape(blob(0.06 * S, -0.5 * S, 0.08 * S, 0.06 * S, 0.1, 8), null, { width: 1.2 }); });   // a reflection
    else inside(visor, () => { for (const s of [-1, 1]) dot(s * 0.08 * S, -0.58 * S, 2.2, pen.base); arc(0, -0.5 * S, 0.06 * S, 0.2, Math.PI - 0.2, { width: 1.4, wob: 0.6, color: pen.base }); });   // a face inside
    if (pose === 'flag') flag(f * 0 + 0.7 * S, 0.0, 0.5 * S, flagC, 1);
    pen.ctx.restore();
    if (pose === 'float') { const t = []; for (let i = 0; i <= 6; i++) t.push([0.3 * S + i * 0.12 * S, 0.3 * S + Math.sin(i * 1.4) * 0.12 * S]); stroke(t, { width: 1.6, wob: 1.4, color: SP.lilac }); }   // the tether
    if (pose === 'point') { const p = blob(1.05 * S, 0.45 * S, 0.13 * S, 0.1 * S, 0.16, 10); shape(p, rockC, { width: 2.2, wob: 1.4 }); for (let i = 0; i < 2; i++) dot(1.05 * S + rf(-0.2, 0.2) * S, 0.45 * S + rf(-0.15, 0.15) * S, rf(1, 2), SP.gold); }   // what it's pointing at
    specks(S, 3);
    return pose;
  },
  robot(S, M) {
    pen.phase('silhouette');
    const kind = wpick({ boxy: 1.5, round: 1, tall: 1 });
    const hw = kind === 'tall' ? 0.22 : 0.32, hh = kind === 'round' ? 0.3 : 0.28, headY = -0.55 * S;
    const body = kind === 'round' ? blob(0, 0.15 * S, 0.38 * S, 0.36 * S, 0.06, 14) : box(0, 0.15 * S, kind === 'tall' ? 0.46 * S : 0.66 * S, 0.6 * S, 0, 3);
    const head = kind === 'round' ? blob(0, headY, hw * S, hh * S, 0.05, 12) : box(0, headY, hw * 2 * S, hh * 1.8 * S, 0, 3);
    const arms = [-1, 1].map(s => [[s * (kind === 'round' ? 0.36 : 0.33) * S, -0.05 * S], [s * 0.58 * S, 0.1 * S + s * rf(-0.1, 0.1) * S], [s * 0.6 * S, 0.4 * S]]);
    pen.phase('expression');
    const eye = wpick({ two: 2, one: 1, visor: 1 }), mouth = pick(['teeth', 'zigzag', 'line', 'smile']);
    pen.phase('palette');
    const metal = pick([SP.silver, SP.cream, SP.teal, SP.gold]), lamps = [0, 1, 2].map(() => pick([SP.coral, SP.gold, SP.lime]));
    pen.phase('accessories');
    const ears = chance(0.4), elbows = [chance(0.5), chance(0.5)];
    pen.phase('detail');
    /* the face is a quiet zone: no scribble or shading runs through the eyes and mouth */
    pen.quiet = [[-hw * 0.85 * S, headY - 0.14 * S], [hw * 0.85 * S, headY - 0.14 * S], [hw * 0.85 * S, headY + hh * 0.7 * S], [-hw * 0.85 * S, headY + hh * 0.7 * S]];
    /* legs / wheels, body, arms, head, antenna */
    if (kind === 'round') { shape(blob(0, 0.72 * S, 0.26 * S, 0.12 * S, 0.06, 12), SP.navy, { width: 2.4, wob: 1.2 }); }
    else for (const s of [-1, 1]) { shape(box(s * 0.16 * S, 0.62 * S, 0.14 * S, 0.3 * S, 0), metal, { width: 2.2, wob: 1.1}); shape(box(s * 0.18 * S, 0.82 * S, 0.24 * S, 0.08 * S, 0), SP.navy, { width: 2, wob: 1 }); }
    shape(body, metal, { width: 3, wob: 1.4, role: 'silhouette'});
    formShade(body, 0, 0.15 * S, kind === 'tall' ? 0.23 * S : 0.35 * S, 0.32 * S, M.shade, 10, 8);
    if (kind !== 'round') joint([M.shade * 0.16 * S, 0.45 * S], [M.shade * 0.16 * S, 0.77 * S], { width: 2.2 });   // where the leg leaves the body
    shape(box(0, 0.08 * S, 0.26 * S, 0.2 * S, 0, 2), SP.navy, { width: 1.8, wob: 1 }); for (let i = 0; i < 3; i++) dot(-0.08 * S + i * 0.08 * S, 0.04 * S, 2.2, lamps[i]); stroke([[-0.08 * S, 0.13 * S], [0.08 * S, 0.13 * S]], { width: 1.2, role: 'texture' });   // the panel
    arms.forEach((arm, i) => {
      const s = i ? 1 : -1;
      stroke(arm, { width: 3, wob: 1 });
      for (const d of [-1, 1]) stroke([[s * 0.6 * S, 0.4 * S], [s * 0.6 * S + d * 0.07 * S, 0.52 * S]], { width: 2 });   // a claw
      if (elbows[i]) dot(arm[1][0], arm[1][1], 3);
    });
    stroke([[0, headY + hh * S], [0, -0.25 * S]], { width: 3 });
    shape(head, metal, { width: 3, wob: 1.3, role: 'silhouette'});
    joint([0, headY + hh * S], [0, -0.25 * S], { width: 3 });                             // the neck, where the head sits
    pen.phase('expression');
    if (eye === 'visor') { const v = box(0, headY - 0.02 * S, hw * 1.5 * S, 0.12 * S, 0); shape(v, SP.navy, { width: 1.8, wob: 1 }); for (let i = 0; i < 3; i++) dot(-hw * 0.5 * S + i * hw * 0.5 * S, headY - 0.02 * S, 2, SP.lime); retrace(v.slice(0, 2), { width: 1.8, span: 0.7 }); }
    else if (eye === 'one') { const e = blob(0, headY - 0.02 * S, 0.1 * S, 0.1 * S, 0.05, 10); shape(e, SP.coral, { width: 2, wob: 1 }); dot(0, headY - 0.02 * S, 0.04 * S); retrace(e, { closed: true, width: 2, span: 0.4, at: 0.75 }); }
    else for (const s of [-1, 1]) { const e = blob(s * hw * 0.5 * S, headY - 0.04 * S, 0.07 * S, 0.07 * S, 0.05, 10); shape(e, null, { width: 1.8 }); dot(s * hw * 0.5 * S + M.look * 0.02 * S, headY - 0.04 * S, 0.03 * S); if (chance(0.5)) retrace(e, { closed: true, width: 1.8, span: 0.4, at: 0.75 }); }
    mouthOf(0, headY + hh * 0.5 * S, 0.3 * S, mouth);
    pen.quiet = null;
    pen.phase('detail');
    stroke([[0, headY - hh * S], [0, headY - hh * S - 0.2 * S]], { width: 1.8 }); dot(0, headY - hh * S - 0.23 * S, 3, SP.coral);   // antenna
    if (ears) for (const s of [-1, 1]) shape(box(s * (hw + 0.05) * S, headY, 0.08 * S, 0.14 * S, 0), SP.navy, { width: 1.6, wob: 1 });   // ears
    return kind;
  },
  moonBase(S, M) {
    pen.phase('silhouette');
    const dome = domePts(0, 0.65 * S, 0.55 * S, 0.6 * S);
    const mastAng = -Math.PI / 2 + rf(-0.8, 0.8);
    pen.phase('palette');
    const flagC = pick([SP.coral, SP.blue]), homeC = pick([SP.teal, SP.coral]);
    pen.phase('accessories');
    const hasFlag = chance(0.5), hasPanel = chance(0.5), home = chance(0.5);
    ground(0.65 * S, 0.95 * S);
    pen.phase('detail');
    shape(dome, SP.silver, { width: 3, wob: 1.3, role: 'silhouette'});
    retrace(dome, { width: 3, span: 0.25, at: M.shade > 0 ? 1 : 0 });                          // where the dome meets the ground, shade side
    for (let i = 1; i < 4; i++) { const a = Math.PI + i / 4 * Math.PI; stroke([[Math.cos(a) * 0.55 * S, 0.65 * S + Math.sin(a) * 0.6 * S], [0, 0.65 * S]], { ...SEAM, width: 1.2 }); }   // dome ribs
    for (let i = 0; i < 3; i++) arc(0, 0.65 * S, 0.55 * S * (0.35 + i * 0.3), Math.PI + 0.2, Math.PI * 2 - 0.2, { width: 1.2, wob: 0.8, taper: false, role: 'texture' });
    formShade(dome, 0, 0.65 * S, 0.55 * S, 0.6 * S, M.shade, 8, 10);
    shape(blob(-0.15 * S, 0.35 * S, 0.1 * S, 0.1 * S, 0.05, 10), SP.navy, { width: 1.8, wob: 1 }); shape(blob(0.18 * S, 0.4 * S, 0.08 * S, 0.08 * S, 0.05, 10), SP.gold, { width: 1.8, wob: 1 });   // windows, one lit
    shape(box(0.72 * S, 0.55 * S, 0.34 * S, 0.2 * S, 0), SP.cream, { width: 2.4, wob: 1.2 }); shape(box(0.72 * S, 0.55 * S, 0.1 * S, 0.12 * S, 0), SP.navy, { width: 1.6, wob: 0.8 });   // the airlock
    stroke([[-0.7 * S, 0.65 * S], [-0.7 * S, -0.1 * S]], { width: 2.2 }); dish(-0.7 * S, -0.2 * S, 0.16 * S, mastAng);   // the antenna mast
    if (hasFlag) flag(0.62 * S, 0.35 * S, 0.3 * S, flagC);
    if (hasPanel) panel(-0.5 * S, -0.25 * S, 0.3 * S, 0.14 * S, -0.4);
    if (home) { const b = blob(0.6 * S, -0.55 * S, 0.16 * S, 0.15 * S, 0.1, 12); shape(b, homeC, { width: 2, wob: 1.2}); }   // the home planet in the sky
    specks(S, 2);
  },
  dishArray(S, M) {
    pen.phase('silhouette');
    const n = pick([1, 2, 3]), angs = Array.from({ length: n }, () => -Math.PI / 2 + rf(-0.7, 0.7));
    pen.phase('palette');
    const cols = angs.map(() => pick([SP.silver, SP.cream]));
    pen.phase('accessories');
    const signal = chance(0.5);
    ground(0.75 * S, 0.95 * S);
    pen.phase('detail');
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * 0.62 * S, k = n === 1 ? 1 : 0.62, r = 0.42 * S * k;
      stroke([[x - 0.12 * S * k, 0.75 * S], [x, 0.35 * S * k], [x + 0.12 * S * k, 0.75 * S]], { width: 2.6 });   // the mount
      stroke([[x, 0.35 * S * k], [x, 0.15 * S * k]], { width: 2.4 });
      dish(x, 0.05 * S * k, r, angs[i], cols[i], 'silhouette');
      joint([x, 0.15 * S * k], [x, 0.35 * S * k], { width: 2.4 });                        // where the stalk carries the dish
    }
    if (signal) for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + rf(-0.5, 0.5); stroke([[Math.cos(a) * 0.6 * S, -0.5 * S + Math.sin(a) * 0.2 * S], [Math.cos(a) * 0.8 * S, -0.5 * S + Math.sin(a) * 0.5 * S]], { width: 1.2, wob: 1.4, color: SP.blue, role: 'texture' }); }   // a signal
    specks(S, 3);
  },
  capsule(S, M) {
    pen.phase('silhouette');
    const chute = chance(0.7);
    const canopy = domePts(0, -0.55 * S, 0.75 * S, 0.5 * S, 12);
    for (let i = 12; i >= 0; i--) canopy.push([Math.cos(Math.PI + i / 12 * Math.PI) * 0.75 * S, -0.55 * S + (i % 2 ? 0.06 : 0) * S]);
    const cap = [[-0.22 * S, 0.15 * S], [0.22 * S, 0.15 * S], [0.42 * S, 0.6 * S], [-0.42 * S, 0.6 * S]];
    pen.phase('palette');
    const canopyC = pick([SP.coral, SP.gold, SP.blue]), capC = pick([SP.silver, SP.cream]);
    pen.phase('accessories');
    const sea = chance(0.5);
    pen.phase('detail');
    if (chute) {
      shape(canopy, canopyC, { width: 2.6, wob: 1.3, role: 'silhouette'});   // cloth: the scribble runs down the gores
      for (let i = 1; i < 4; i++) { const a = Math.PI + i / 4 * Math.PI; stroke([[Math.cos(a) * 0.75 * S, -0.55 * S + Math.sin(a) * 0.5 * S], [Math.cos(a) * 0.75 * S * 0.98, -0.53 * S]], { ...SEAM, width: 1.2 }); }
      for (const x of [-0.7, -0.25, 0.25, 0.7]) stroke([[x * S, -0.52 * S], [x * 0.25 * S, 0.15 * S]], { width: 1.2, wob: 0.8, taper: false, role: 'texture' });   // lines
    }
    shape(cap, capC, { width: 3, wob: 1.3, role: 'silhouette'});
    formShade(cap, 0, 0.38 * S, 0.42 * S, 0.22 * S, M.shade, 10, 10);
    shape([[-0.44 * S, 0.6 * S], [0.44 * S, 0.6 * S], [0.4 * S, 0.72 * S], [-0.4 * S, 0.72 * S]], SP.rust, { width: 2.4, wob: 1.2 });   // heat shield
    retrace([[-0.42 * S, 0.6 * S], [0, 0.6 * S], [0.42 * S, 0.6 * S]], { width: 2.6, span: 0.6 });   // the seam where the shield meets the hull
    shape(blob(0, 0.38 * S, 0.08 * S, 0.08 * S, 0.05, 10), SP.navy, { width: 1.8, wob: 1 });
    if (!chute) for (let i = 0; i < 5; i++) stroke([[rf(-0.4, 0.4) * S, 0.75 * S], [rf(-0.5, 0.5) * S, 0.95 * S]], { width: 1.8, wob: 1.4, color: pick([SP.orange, SP.gold]) });   // re-entry fire
    if (sea) { const w = []; for (let i = 0; i <= 8; i++) w.push([-0.9 * S + i * 0.225 * S, 0.9 * S + (i % 2 ? -0.04 : 0.04) * S]); stroke(w, { width: 2, wob: 1, color: SP.blue }); }   // the sea below
    specks(S, 2);
  },
  rayGun(S, M) {
    pen.phase('silhouette');
    const f = M.f, lean = -f * rf(0.1, 0.4);
    pen.phase('palette');
    const body = pick([SP.silver, SP.coral, SP.teal]);
    pen.phase('detail');
    pen.ctx.save(); pen.ctx.rotate(lean); if (f < 0) pen.ctx.scale(-1, 1);
    const housing = [[-0.5 * S, -0.2 * S], [0.25 * S, -0.24 * S], [0.3 * S, 0.02 * S], [-0.5 * S, 0.05 * S]];
    shape(housing, body, { width: 3, wob: 1.3, role: 'silhouette'});   // the barrel housing
    formShade(housing, -0.1 * S, -0.09 * S, 0.4 * S, 0.13 * S, M.shade, 6, 7);
    const grip = [[-0.45 * S, 0.05 * S], [-0.2 * S, 0.02 * S], [-0.12 * S, 0.5 * S], [-0.38 * S, 0.55 * S]];
    shape(grip, SP.navy, { width: 2.6, wob: 1.2 });   // grip
    joint(grip[3], grip[0], { width: 2.6 });          // where the grip meets the housing
    stroke([[-0.1 * S, 0.1 * S], [-0.02 * S, 0.22 * S]], { width: 2 });                     // trigger
    for (let i = 0; i < 3; i++) shape(blob((0.35 + i * 0.12) * S, -0.11 * S, 0.05 * S, (0.16 - i * 0.03) * S, 0.05, 10), SP.gold, { width: 2, wob: 1 });   // rings
    stroke([[0.3 * S, -0.11 * S], [0.72 * S, -0.11 * S]], { width: 3 });
    shape(blob(0.75 * S, -0.11 * S, 0.06 * S, 0.06 * S, 0.05, 8), SP.coral, { width: 1.8, wob: 1 });
    shape(blob(-0.1 * S, -0.38 * S, 0.12 * S, 0.12 * S, 0.06, 10), SP.lime, { width: 2, wob: 1 }); stroke([[-0.1 * S, -0.26 * S], [-0.1 * S, -0.22 * S]], { width: 2 });   // the power bulb
    for (let i = 0; i < 3; i++) { const a = -0.5 + i * 0.5; stroke([[0.85 * S, -0.11 * S], [(1.0 + rf(0, 0.15)) * S, -0.11 * S + a * 0.2 * S]], { width: 1.6, wob: 1, color: SP.lime, role: 'texture' }); }   // zap
    pen.ctx.restore();
    if (!M.sub) specks(S, 2);
  },
  telescope(S, M) {
    pen.phase('silhouette');
    const f = M.f, ang = -f * rf(0.25, 0.6), tubePts = box(0, -0.25 * S, 1.0 * S, 0.3 * S, 0, 3);
    pen.phase('palette');
    const tubeC = pick([SP.blue, SP.rust, SP.silver]);
    pen.phase('accessories');
    const finder = chance(0.6), star = chance(0.6), worldC = pick([SP.teal, SP.coral]);
    pen.phase('detail');
    pen.ctx.save(); pen.ctx.rotate(ang);
    shape(tubePts, tubeC, { width: 3, wob: 1.3, role: 'silhouette'});
    formShade(tubePts, 0, -0.25 * S, 0.5 * S, 0.15 * S, M.shade, 8, 8);
    shape(box(-0.55 * S, -0.25 * S, 0.12 * S, 0.4 * S, 0, 2), SP.gold, { width: 2.2, wob: 1 });
    shape(box(0.52 * S, -0.25 * S, 0.1 * S, 0.22 * S, 0, 2), SP.navy, { width: 2, wob: 1 });
    if (finder) shape(box(0, -0.5 * S, 0.18 * S, 0.2 * S, 0, 2), SP.coral, { width: 1.8, wob: 1 });
    pen.ctx.restore();
    stroke([[0, 0.05 * S], [-0.42 * S, 0.78 * S]], { width: 2.4 }); stroke([[0, 0.05 * S], [0.42 * S, 0.78 * S]], { width: 2.4 }); stroke([[0, 0.05 * S], [0, 0.82 * S]], { width: 2.4 });
    joint([0, 0.05 * S], [M.shade * 0.42 * S, 0.78 * S], { width: 2.4 });                    // where the tripod carries the tube
    stroke([[-0.2 * S, 0.45 * S], [0.2 * S, 0.45 * S]], { width: 1.4, role: 'texture' });
    ground(0.82 * S, 0.62 * S);
    pen.phase('detail');
    if (star) sparkle(-f * 0.9 * S, -0.75 * S, 7, SP.gold);
    else { const b = blob(-f * 0.75 * S, -0.7 * S, 0.16 * S, 0.15 * S, 0.1, 12); shape(b, worldC, { width: 2, wob: 1.2}); }
  },
  observatory(S, M) {
    /* a big segmented gold mirror behind a pleated silver sunshield, like JWST */
    pen.phase('silhouette');
    const lean = -rf(0, 0.25);
    const shields = [0, 1, 2].map(i => box(0, 0.18 * S + i * 0.05 * S, 1.25 * S, 0.1 * S, 0, 2));
    const mirror = []; for (let k = 0; k <= 12; k++) { const a = k / 12 * Math.PI * 2; mirror.push([Math.cos(a) * 0.34 * S, -0.4 * S + Math.sin(a) * 0.34 * S]); }
    pen.phase('detail');
    pen.ctx.save(); pen.ctx.rotate(lean);
    shields.forEach((sh, i) => shape(sh, SP.silver, { width: 1.8, wob: 1, role: i === 2 ? 'silhouette' : 'structure'}));   // the sunshield
    shape(box(0, -0.05 * S, 0.5 * S, 0.16 * S, 0, 2), SP.cream, { width: 2, wob: 1 });   // the bus
    shape(mirror, SP.gold, { width: 2.6, wob: 1.3, role: 'silhouette'});
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + rf(-0.2, 0.2); shape(blob(Math.cos(a) * 0.17 * S, -0.4 * S + Math.sin(a) * 0.17 * S, 0.1 * S, 0.1 * S, 0.08, 8), null, { width: 1.4, wob: 1, role: 'texture' }); }   // the mirror segments
    pen.ctx.restore();
    stroke([[0, -0.05 * S], [-0.34 * S, -0.4 * S]], { width: 1.6 }); stroke([[0, -0.05 * S], [0.34 * S, -0.4 * S]], { width: 1.6 });   // the struts
    joint([0, -0.05 * S], [M.shade * 0.34 * S, -0.4 * S], { width: 1.6 });
    specks(S, 3);
  },
  freighter(S, M) {
    /* a long 2001-style cargo spine, a slow ring, fuel cans and a little bridge */
    pen.phase('silhouette');
    const rot = rf(-0.15, 0.15), ringRot = rf(0.4, 0.9), spine = box(0, 0, 1.15 * S, 0.16 * S, 0, 3);
    pen.phase('palette');
    const cans = [-0.6, -0.15, 0.15].map(() => pick([SP.cream, SP.rust, SP.teal, SP.gold]));
    pen.phase('detail');
    pen.ctx.save(); pen.ctx.rotate(rot);
    shape(spine, SP.silver, { width: 3, wob: 1.3, role: 'silhouette'});   // the spine
    pen.ctx.save(); pen.ctx.translate(0.4 * S, 0); pen.ctx.rotate(ringRot);
    const ring = []; for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI * 2; ring.push([Math.cos(a) * 0.24 * S, Math.sin(a) * 0.24 * S]); }
    stroke(ring, { width: 2.4, wob: 1.1 });
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; shape(blob(Math.cos(a) * 0.24 * S, Math.sin(a) * 0.24 * S, 0.04 * S, 0.04 * S, 0.1, 8), SP.coral, { width: 1.2 }); }
    pen.ctx.restore();
    [-0.6, -0.15, 0.15].forEach((x, i) => shape(box(x * S, 0, 0.26 * S, 0.24 * S, 0, 2), cans[i], { width: 2.4, wob: 1.2}));   // cargo nodules
    for (let i = 0; i < 4; i++) rivets([[-0.9 * S + i * 0.6 * S, -0.1 * S]]);
    shape(box(-0.85 * S, 0, 0.16 * S, 0.3 * S, 0, 2), SP.navy, { width: 2.4, wob: 1.2 });   // the engine can
    joint([-0.77 * S, -0.08 * S], [-0.77 * S, 0.08 * S], { width: 2.4 });                  // where the can bolts to the spine
    shape(blob(0.95 * S, 0, 0.12 * S, 0.1 * S, 0.1, 10), SP.silver, { width: 2, wob: 1 });   // the bridge
    pen.ctx.restore();
    specks(S, 3);
  },
  /* ---------- aliens and saucers ---------- */
  alien(S, M) {
    pen.phase('silhouette');
    const body = wpick({ grey: 2, blob: 1.4, bug: 1.2, cyclops: 1, squid: 1, tall: 1 });
    const f = M.f, look = M.look;
    let headY, headRx, headRy;
    if (body === 'grey') { headY = -0.28 * S; headRx = 0.42 * S; headRy = 0.5 * S; }
    else if (body === 'tall') { headY = -0.6 * S; headRx = 0.2 * S; headRy = 0.3 * S; }
    else if (body === 'blob' || body === 'squid') { headY = -0.15 * S; headRx = 0.5 * S; headRy = 0.45 * S; }
    else if (body === 'cyclops') { headY = -0.3 * S; headRx = 0.36 * S; headRy = 0.4 * S; }
    else { headY = -0.3 * S; headRx = 0.34 * S; headRy = 0.3 * S; }
    const head = blob(0, headY, headRx, headRy, body === 'blob' ? 0.14 : 0.06, 16);
    const upright = body === 'grey' || body === 'bug' || body === 'cyclops' || body === 'tall';
    const top = headY + headRy * 0.7, h = body === 'tall' ? 1.0 * S : 0.6 * S, w = body === 'tall' ? 0.14 * S : 0.22 * S;
    const arms = [-1, 1].map(s => [[s * w * 0.8, top + h * 0.2], [s * (w + 0.22 * S), top + h * rf(0.1, 0.6)], [s * (w + 0.32 * S), top + h * rf(0.0, 0.7)]]);
    const nT = body === 'squid' ? ri(5, 7) : ri(3, 5);
    const tentacles = Array.from({ length: nT }, (_, i) => {
      const x = (i - (nT - 1) / 2) / (nT - 1 || 1) * headRx * 1.6, sway = rf(-0.2, 0.2) * S, len = rf(0.35, 0.6) * S;
      return [[x, top], [x + sway, top + len * 0.5], [x + sway * 2 + rf(-0.1, 0.1) * S, top + len]];
    });
    pen.phase('expression');
    const eyeStyle = body === 'grey' ? 'black' : body === 'cyclops' ? 'round' : wpick({ round: 2, black: 1, stalk: 1, slit: 1 });
    const nEyes = body === 'cyclops' ? 1 : body === 'bug' ? ri(3, 5) : body === 'grey' ? 2 : pick([2, 2, 3]);
    const mouth = pick(['smile', 'o', 'teeth', 'zigzag', 'line']), cheeks = chance(0.3);
    pen.phase('palette');
    const skin = pick([SP.green, SP.lime, SP.teal, SP.lilac, SP.coral, SP.silver]);
    const suitC = body === 'cyclops' ? skin : pick([SP.silver, SP.navy, skin]);
    const tipC = [pick([SP.gold, SP.coral, SP.lime]), pick([SP.gold, SP.coral, SP.lime])], flagC = pick([SP.lime, SP.coral, SP.gold]), balloonC = pick([SP.coral, SP.gold]);
    pen.phase('accessories');
    const antennae = body === 'bug' ? 2 : body === 'grey' ? 0 : pick([0, 1, 2]);
    const tips = [0, 1].map(i => ({ x: antennae === 1 ? 0 : (i ? 1 : -1) * headRx * 0.5, dx: (i ? 1 : -1) * rf(0, 0.15) * S, dy: rf(0.2, 0.35) * S, bulb: chance(0.7) }));
    const thing = wpick({ none: 3, gun: 1, flag: 0.8, balloon: 0.5 });
    pen.phase('detail');
    /* the body first */
    if (upright) {
      shape([[-w * 0.7, top], [w * 0.7, top], [w, top + h], [-w, top + h]], suitC, { width: 2.8, wob: 1.4});
      arms.forEach((a, i) => {                                                           // thin arms, long fingers
        const s = i ? 1 : -1;
        stroke(a, { width: 2.4, wob: 1.2 });
        for (const d of [-0.6, 0, 0.6]) stroke([[a[2][0], a[2][1]], [a[2][0] + s * 0.08 * S * Math.cos(d), a[2][1] + 0.08 * S * Math.sin(d) + 0.04 * S]], { width: 1.6 });
        stroke([[s * w * 0.5, top + h], [s * (w * 0.5 + 0.06 * S), top + h + 0.22 * S]], { width: 2.4 }); shape(blob(s * (w * 0.5 + 0.08 * S), top + h + 0.25 * S, 0.09 * S, 0.05 * S, 0.06, 8), SP.navy, { width: 1.8, wob: 1 });   // legs & feet
      });
      joint(arms[M.shade > 0 ? 1 : 0][0], arms[M.shade > 0 ? 1 : 0][1], { width: 2.4 });    // the shoulder on the shade side
      if (body === 'bug') for (let i = 0; i < 3; i++) stroke([[-w * 0.9, top + h * (0.3 + i * 0.22)], [w * 0.9, top + h * (0.3 + i * 0.22)]], { width: 1.4, role: 'texture' });   // segments
    } else {
      /* a blob or a squid: tentacles below the head */
      for (const t of tentacles) {
        shape(tube(t, [0.12 * S, 0.09 * S, 0.04 * S]), skin, { width: 2.2, wob: 1.4});
        if (body === 'squid') for (let k = 1; k < 3; k++) dot(t[k][0], t[k][1], 1.8, pen.base);
      }
    }
    /* the head: the face is a quiet zone while the skin is washed and shaded */
    const eyeR = body === 'grey' ? 0.13 * S : body === 'cyclops' ? 0.16 * S : body === 'bug' ? 0.05 * S : 0.07 * S, eyeY = headY - headRy * (body === 'grey' ? 0.05 : 0.1);
    const mouthY = headY + headRy * 0.5;
    pen.quiet = [[-headRx * 0.8, eyeY - eyeR * 1.9], [headRx * 0.8, eyeY - eyeR * 1.9], [headRx * 0.6, mouthY + headRx * 0.2], [-headRx * 0.6, mouthY + headRx * 0.2]];
    shape(head, skin, { width: 3, wob: 1.5, role: 'silhouette'});
    formShade(head, 0, headY, headRx, headRy, M.shade, 10, headRx * 0.3);
    retrace(head, { closed: true, width: 3, span: 0.25, at: M.shade > 0 ? 0.05 : 0.5 });     // the shadow side of the head
    if (body === 'blob') inside(head, () => { for (let i = 0; i < 4; i++) dot(rf(-0.4, 0.4) * S, headY + rf(-0.3, 0.3) * S, rf(2, 4), pen.base); });
    for (let i = 0; i < antennae; i++) {
      const t = tips[i], x = t.x, tip = [x + t.dx, headY - headRy - t.dy];
      stroke([[x, headY - headRy * 0.9], [tip[0], tip[1]]], { width: 2, wob: 1.2 }); if (t.bulb) shape(blob(tip[0], tip[1], 0.04 * S, 0.04 * S, 0.05, 8), tipC[i], { width: 1.6, wob: 0.8 }); else dot(tip[0], tip[1], 3);
    }
    pen.phase('expression');
    if (nEyes === 1) alienEye(0, eyeY, eyeR, eyeStyle, look);
    else if (nEyes === 2) for (const s of [-1, 1]) alienEye(s * headRx * 0.42, eyeY, eyeR, eyeStyle, look);
    else for (let i = 0; i < nEyes; i++) { const a = (i / (nEyes - 1) - 0.5) * Math.PI * 0.9; alienEye(Math.sin(a) * headRx * 0.6, eyeY - Math.cos(a) * headRy * 0.15 + 0.1 * headRy, eyeR * (i === Math.floor(nEyes / 2) ? 1.3 : 1), eyeStyle, look); }
    mouthOf(0, mouthY, headRx * 0.8, mouth);
    if (cheeks) for (const s of [-1, 1]) { const e = blob(s * headRx * 0.6, headY + headRy * 0.25, 0.06 * S, 0.04 * S, 0.1, 8); washPts(e, { color: SP.coral, alpha: 0.4, grow: 1, mode: 'flat' }); }   // cheeks
    pen.quiet = null;
    pen.phase('detail');
    /* what it carries */
    if (thing === 'gun') { pen.ctx.save(); pen.ctx.translate(f * 0.62 * S, 0.25 * S); pen.ctx.scale(0.35, 0.35); MOTIFS.rayGun(S, { ...M, sub: true }); pen.ctx.restore(); }
    else if (thing === 'flag') flag(f * 0.6 * S, 0.8 * S, 0.7 * S, flagC, -f);
    else if (thing === 'balloon') { stroke([[-f * 0.5 * S, 0.5 * S], [-f * 0.62 * S, -0.3 * S]], { width: 1.2, wob: 1 }); shape(blob(-f * 0.64 * S, -0.45 * S, 0.14 * S, 0.17 * S, 0.06, 12), balloonC, { width: 2, wob: 1.2 }); }
    specks(S, 2);
    return body;
  },
  ufo(S, M) {
    pen.phase('silhouette');
    const kind = wpick({ saucer: 2, pilot: 1.5, beam: 1.2, landed: 1 });
    const tilt = kind === 'landed' ? 0 : rf(-0.25, 0.25);
    const hullPts = blob(0, 0, 0.85 * S, 0.24 * S, 0.04, 18), dome = blob(0, -0.16 * S, 0.4 * S, 0.3 * S, 0.05, 14);
    pen.phase('palette');
    const hull = pick([SP.silver, SP.teal, SP.cream, SP.lilac]), pilotC = pick([SP.green, SP.lime, SP.lilac]), lights = [0, 1, 2, 3, 4].map(() => pick([SP.gold, SP.coral, SP.lime]));
    pen.phase('accessories');
    const pilot = kind === 'pilot' || chance(0.3), antenna = chance(0.5), speed = kind !== 'landed' && chance(0.5), cargo = chance(0.7);
    pen.phase('detail');
    if (kind === 'landed') { ground(0.72 * S, 0.95 * S); pen.phase('detail'); for (const x of [-0.4, 0, 0.4]) stroke([[x * S, 0.3 * S], [x * 1.2 * S, 0.7 * S]], { width: 2.4 }); }
    if (kind === 'beam') {
      shape([[-0.4 * S, 0.2 * S], [0.4 * S, 0.2 * S], [0.75 * S, 1.0 * S], [-0.75 * S, 1.0 * S]], SP.gold, { alpha: 0.3, width: 1.6, wob: 1.6});
      if (cargo) liftedCargo(S);                                                                  // something going up
      else for (let i = 0; i < 4; i++) dot(rf(-0.4, 0.4) * S, rf(0.35, 0.9) * S, rf(1.5, 3), SP.gold);
    }
    pen.ctx.save(); pen.ctx.rotate(tilt);
    shape(hullPts, hull, { width: 3.2, wob: 1.5, role: 'silhouette'});          // the hull
    formShade(hullPts, 0, 0, 0.85 * S, 0.24 * S, M.shade, 8, 10);
    if (kind === 'landed') joint([M.shade * 0.4 * S, 0.3 * S], [M.shade * 0.48 * S, 0.7 * S], { width: 2.4 });   // where the leg leaves the hull
    stroke([[-0.6 * S, 0.02 * S], [0.6 * S, 0.02 * S]], { width: 1.4, role: 'texture' });
    shape(dome, SP.blue, { alpha: 0.45, width: 2.6, wob: 1.3, role: 'silhouette'});
    retrace(dome, { closed: true, width: 2.6, span: 0.35, at: 0.25 });                          // where the dome sits on the hull
    if (pilot) { pen.phase('expression'); inside(dome, () => {                                  // the pilot inside
      const hy = -0.2 * S; shape(blob(0, hy, 0.16 * S, 0.17 * S, 0.06, 12), pilotC, { width: 2, wob: 1.2 }); for (const s of [-1, 1]) alienEye(s * 0.07 * S, hy - 0.02 * S, 0.045 * S, 'black', M.look); for (const s of [-1, 1]) stroke([[s * 0.06 * S, hy - 0.16 * S], [s * 0.1 * S, hy - 0.3 * S]], { width: 1.6 });
    }); pen.phase('detail'); }
    for (let i = 0; i < 5; i++) { const x = -0.6 * S + i * 0.3 * S; shape(blob(x, 0.1 * S, 0.05 * S, 0.04 * S, 0.1, 8), lights[i], { width: 1.4, wob: 0.8 }); }   // the lights
    if (antenna) { stroke([[0, -0.46 * S], [0, -0.7 * S]], { width: 1.6 }); dot(0, -0.73 * S, 3, SP.coral); }
    pen.ctx.restore();
    if (speed) for (let i = 0; i < 3; i++) stroke([[-0.9 * S - i * 0.02 * S, -0.1 * S + i * 0.12 * S], [-1.08 * S, -0.1 * S + i * 0.12 * S]], { width: 1.4, wob: 1, taper: false, role: 'texture' });   // speed
    if (!M.sub) specks(S, 2);
    return kind;
  },
  /* ---------- worlds, kept few ---------- */
  moon(S, M) {
    pen.phase('silhouette');
    const r = 0.6 * S, m = blob(0, 0, r, r, 0.05, 18);
    pen.phase('palette');
    const moonC = pick([SP.cream, SP.gold, SP.silver]);
    pen.phase('accessories');
    const hasFlag = chance(0.5), visitor = chance(0.5);
    pen.phase('detail');
    shape(m, moonC, { width: 3, wob: 1.5, role: 'silhouette'});
    for (let i = 0, n = ri(4, 7); i < n; i++) { const a = rf(0, Math.PI * 2), d = rf(0, r * 0.7); crater(Math.cos(a) * d, Math.sin(a) * d, rf(r * 0.06, r * 0.16)); }
    formShade(m, 0, 0, r, r, M.shade, 12, 10);
    retrace(m, { closed: true, width: 3, span: 0.3, at: M.shade > 0 ? 0.05 : 0.5 });   // the shadow side, gone over
    if (hasFlag) flag(r * 0.2, -r * 0.1, r * 0.5, SP.coral);
    if (visitor) smallRocket(r * 0.9, -r * 0.9, 0.22 * S, 0.7, M);
    specks(S, 4);
  },
  planet(S, M) {
    pen.phase('silhouette');
    const ringed = M.ringed ?? chance(0.55), lumpy = rf(0.05, 0.12), tilt = rf(-0.4, 0.4);
    const r = ringed ? 0.5 * S : 0.58 * S, ry = r * rf(0.92, 1);
    const body = blob(0, 0, r, ry, lumpy, 16);
    pen.phase('palette');
    const color = pick([SP.teal, SP.coral, SP.blue, SP.lilac, SP.orange, SP.rust]);
    const bandC = [-2, -1, 0, 1, 2].map(() => pick([SP.gold, SP.navy, SP.cream, null])), spotC = [0, 1, 2, 3, 4].map(() => pick([SP.gold, SP.cream, SP.navy]));
    pen.phase('accessories');
    const moons = !ringed && chance(0.6), second = chance(0.5), visitor = chance(0.3);
    pen.phase('detail');
    const detail = wpick({ bands: 1.5, spots: 1, craters: 0.8, storm: 0.8, ice: 0.8 });
    const halfRing = (a0) => { const p = []; for (let i = 0; i <= 14; i++) { const a = a0 + i / 14 * Math.PI; p.push([Math.cos(a) * 1.0 * S, Math.sin(a) * 0.26 * S]); } return p; };
    if (ringed) { const back = halfRing(Math.PI); pen.ctx.save(); pen.ctx.rotate(tilt); stroke(back, { width: 3, wob: 1.2, color: SP.gold }); stroke(back.map(([x, y]) => [x * 0.82, y * 0.7]), { width: 1.6, wob: 1, role: 'texture' }); pen.ctx.restore(); }
    shape(body, color, { width: 3.2, wob: 1.6, role: 'silhouette'});
    inside(body, () => {
      if (detail === 'bands') for (let i = -2; i <= 2; i++) { const p = []; for (let k = 0; k <= 6; k++) p.push([-r + k * r / 3, i * r * 0.3 + Math.sin(k * 1.3 + i) * r * 0.06]); stroke(p, { width: rf(1.6, 3.5), wob: 1.4, color: bandC[i + 2] }); }
      else if (detail === 'spots') for (let i = 0; i < 5; i++) shape(blob(rf(-0.7, 0.7) * r, rf(-0.7, 0.7) * r, rf(0.08, 0.22) * r, rf(0.06, 0.14) * r, 0.15, 10), spotC[i], { width: 1.4, wob: 1 });
      else if (detail === 'craters') for (let i = 0; i < 6; i++) crater(rf(-0.7, 0.7) * r, rf(-0.7, 0.7) * r, rf(0.05, 0.14) * r);
      else if (detail === 'ice') { for (const s of [-1, 1]) shape(blob(s * r * 0.5, -s * r * 0.55, r * 0.62, r * 0.24, 0.1, 12, s * 0.4), SP.cream, { width: 1.6, wob: 1 }); for (let i = 0; i < 3; i++) { const p = []; for (let k = 0; k <= 6; k++) p.push([-r + k * r / 3, rf(-0.4, 0.4) * r]); stroke(p, { width: 1.4, wob: 1.2, color: SP.cream, role: 'texture' }); } }   // an ice world: polar caps + frost bands
      else { shape(blob(-r * 0.2, r * 0.15, r * 0.3, r * 0.18, 0.1, 12, 0.3), SP.coral, { width: 1.6, wob: 1.2 }); for (let i = -1; i <= 1; i++) stroke([[-r, i * r * 0.35], [r, i * r * 0.35 + rf(-5, 5)]], { width: 1.6, wob: 1.2, role: 'texture' }); }   // storm
    });
    formShade(body, 0, 0, r, ry, M.shade, 12, 10);
    retrace(body, { closed: true, width: 3.2, span: 0.3, at: M.shade > 0 ? 0.05 : 0.5 });   // the shadow side, gone over
    if (ringed) { const front = halfRing(0); pen.ctx.save(); pen.ctx.rotate(tilt); stroke(front, { width: 3, wob: 1.2, color: SP.gold }); stroke(front.map(([x, y]) => [x * 0.82, y * 0.7]), { width: 1.6, wob: 1, role: 'texture' }); pen.ctx.restore(); }
    if (moons) { shape(blob(0.8 * S, -0.55 * S, 0.12 * S, 0.12 * S, 0.1, 10), SP.silver, { width: 2, wob: 1.2 }); if (second) shape(blob(-0.75 * S, 0.5 * S, 0.08 * S, 0.08 * S, 0.1, 10), SP.cream, { width: 1.8, wob: 1 }); }   // a moon (sometimes two)
    if (visitor) smallRocket(-0.8 * S, 0.5 * S, 0.18 * S, -0.8, M);
    specks(S, 3);
    return ringed ? 'ringed' : detail;
  },
  saturn(S, M) { return MOTIFS.planet(S, { ...M, ringed: true }) && 'ringed'; },
  comet(S, M) {
    pen.phase('silhouette');
    const f = M.f;
    const tail = [[f * 0.12 * S, -0.24 * S], [-f * 1.15 * S, -0.32 * S], [-f * 0.92 * S, 0.02 * S], [-f * 1.12 * S, 0.38 * S], [f * 0.12 * S, 0.26 * S]];   // a wedge streaming back, split once
    const rock = blob(f * 0.25 * S, 0.08 * S, 0.34 * S, 0.3 * S, 0.14, 14);
    pen.phase('palette');
    const rockC = pick([SP.gold, SP.silver, SP.rust]), streakC = [0, 1, 2, 3, 4].map(() => pick([SP.blue, SP.lilac, SP.teal]));
    pen.phase('detail');
    shape(tail, SP.blue, { alpha: 0.35, width: 2, wob: 2});   // the tail streams
    for (let i = 0; i < 5; i++) { const sy = rf(-0.5, 0.5) * S, sx = -f * rf(0.5, 1.1) * S; stroke([[sx, sy], [sx - f * rf(0.2, 0.45) * S, sy + rf(-0.1, 0.1) * S]], { width: rf(1.2, 2.6), wob: 1.4, color: streakC[i], role: 'texture' }); }
    shape(rock, rockC, { width: 3, wob: 1.6, role: 'silhouette'});
    for (let i = 0; i < 4; i++) crater(f * 0.25 * S + rf(-0.2, 0.2) * S, 0.08 * S + rf(-0.15, 0.15) * S, rf(2.5, 6));
    formShade(rock, f * 0.25 * S, 0.08 * S, 0.34 * S, 0.3 * S, M.shade, 8, 8);
    specks(S, 3);
  },
  asteroid(S, M) {
    pen.phase('silhouette');
    const n = pick([1, 1, 2, 3]);
    const rocks = Array.from({ length: n }, () => {
      const k = n === 1 ? 1 : rf(0.35, 0.6), x = n === 1 ? 0 : rf(-0.6, 0.6) * S, y = n === 1 ? 0 : rf(-0.5, 0.5) * S;
      return { k, x, y, pts: blob(x, y, 0.55 * S * k, 0.42 * S * k, 0.18, 12, rf(0, 3)) };
    });
    pen.phase('palette');
    const cols = rocks.map(() => pick([SP.silver, SP.rust, SP.cream, null]));
    pen.phase('accessories');
    const visitor = chance(0.4);
    pen.phase('detail');
    rocks.forEach(({ k, x, y, pts }, i) => {
      shape(pts, cols[i], { width: 3, wob: 1.7, role: 'silhouette'});
      for (let j = 0, m = ri(2, 5); j < m; j++) crater(x + rf(-0.35, 0.35) * S * k, y + rf(-0.25, 0.25) * S * k, rf(3, 8) * k);
      formShade(pts, x, y, 0.55 * S * k, 0.42 * S * k, M.shade, 8, 9);
      if (i === 0) retrace(pts, { closed: true, width: 3, span: 0.3, at: M.shade > 0 ? 0.05 : 0.5 });   // the shadow side of the big one
    });
    if (visitor) smallRocket(0.7 * S, -0.6 * S, 0.2 * S, 1.2, M);
    specks(S, 4);
  },
  galaxy(S, M) {
    pen.phase('silhouette');
    const core = blob(0, 0, 0.16 * S, 0.12 * S, 0.1, 10);
    pen.phase('palette');
    const armC = [pick([SP.lilac, SP.blue, SP.teal]), pick([SP.lilac, SP.blue, SP.teal])];
    pen.phase('detail');
    for (let arm = 0; arm < 2; arm++) {
      const p = []; for (let i = 0; i <= 14; i++) { const t = i / 14, a = arm * Math.PI + t * Math.PI * 1.6, r = 0.12 * S + t * 0.85 * S; p.push([Math.cos(a) * r, Math.sin(a) * r * 0.55]); }
      shape(tube(p, p.map((_, i) => (0.12 - i * 0.006) * S)), armC[arm], { alpha: 0.4, width: 1.8, wob: 1.8 });
      for (let i = 0; i < 6; i++) { const t = rf(0.2, 1), a = arm * Math.PI + t * Math.PI * 1.6 + rf(-0.2, 0.2), r = 0.12 * S + t * 0.85 * S; dot(Math.cos(a) * r, Math.sin(a) * r * 0.55, rf(1, 2.2), pick([SP.gold, pen.ink])); }
    }
    shape(core, SP.gold, { width: 2.2, wob: 1.4, role: 'silhouette' });
    specks(S, 5);
  },
  constellation(S, M) {
    pen.phase('silhouette');
    const n = ri(5, 8), pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + rf(-0.3, 0.3), r = rf(0.35, 0.85) * S; pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.9]); }
    pen.phase('accessories');
    const cross = chance(0.6), visitor = chance(0.3);
    pen.phase('detail');
    for (let i = 0; i < n; i++) dashes(pts[i][0], pts[i][1], pts[(i + 1) % n][0], pts[(i + 1) % n][1], 4, { color: SP.blue });
    if (cross) dashes(pts[0][0], pts[0][1], pts[Math.floor(n / 2)][0], pts[Math.floor(n / 2)][1], 4, { color: SP.blue });
    pts.forEach(([x, y], i) => sparkle(x, y, i % 3 ? rf(4, 6) : rf(6, 9), i % 2 ? SP.gold : SP.coral));
    for (let i = 0; i < 5; i++) dot(rf(-1, 1) * S, rf(-1, 1) * S, rf(1, 2), SP.lilac);
    if (visitor) { pen.ctx.save(); pen.ctx.translate(0, 0); MOTIFS.ufo(0.35 * S, { ...M, sub: true }); pen.ctx.restore(); }
  },
  eclipse(S, M) {
    /* a total eclipse: a bright sun ringed by a dark moon, corona rays bursting out */
    pen.phase('silhouette');
    const sun = blob(0, 0, 0.62 * S, 0.62 * S, 0.04, 18), moon = blob(0.1 * S, 0.02 * S, 0.6 * S, 0.6 * S, 0.04, 18);
    pen.phase('detail');
    shape(sun, SP.gold, { width: 3, wob: 1.4, role: 'silhouette' });
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + rf(-0.2, 0.2); stroke([[Math.cos(a) * 0.7 * S, Math.sin(a) * 0.7 * S], [Math.cos(a) * (0.85 + rf(0, 0.2)) * S, Math.sin(a) * (0.85 + rf(0, 0.2)) * S]], { width: 2, wob: 1.4, color: SP.gold }); }   // corona rays
    shape(moon, null, { inkFill: true, width: 3.4, wob: 1.4, role: 'silhouette' });   // the moon
    arc(0.1 * S, 0.02 * S, 0.6 * S, 0.2, Math.PI - 0.2, { width: 2.4, wob: 1, color: SP.coral });   // a thin rim of light
    specks(S, 4);
  },
  alienCity(S, M) {
    /* an alien town on the cratered plain: staggered domes and towers with lit windows */
    pen.phase('silhouette');
    const n = pick([4, 5, 6]);
    const towers = Array.from({ length: n }, (_, i) => {
      const x = (i - (n - 1) / 2) * 0.5 * S + rf(-0.1, 0.1) * S, h = (0.25 + (i % 2) * 0.3) * S, r = (0.16 + ((i * 7) % 3) * 0.04) * S, w = r * (i % 3 === 0 ? 1.6 : 1);
      return { x, h, w, pts: blob(x, 0.8 * S - h, w, h, 0.1, 12) };
    });
    pen.phase('palette');
    const cols = towers.map(() => pick([SP.lilac, SP.teal, SP.coral, SP.silver]));
    pen.phase('accessories');
    const saucer = chance(0.6);
    ground(0.8 * S, 0.95 * S);
    pen.phase('detail');
    towers.forEach(({ x, h, w, pts }, i) => {
      shape(pts, cols[i], { width: 2.6, wob: 1.3, role: 'silhouette'});
      for (let k = 0; k < 2; k++) dot(x + rf(-w * 0.4, w * 0.4) * S, 0.8 * S - h + rf(0.1, 0.6) * h, 1.8, pick([SP.gold, SP.lime]));   // windows
    });
    retrace(towers[0].pts, { closed: true, width: 2.6, span: 0.2, at: 0.25 });   // where the first dome meets the plain
    if (saucer) { pen.ctx.save(); pen.ctx.translate(-0.3 * S, -0.55 * S); pen.ctx.scale(0.5, 0.5); MOTIFS.ufo(S, { ...M, sub: true }); pen.ctx.restore(); }   // a saucer loitering
    specks(S, 3);
  },
  greenhouse(S, M) {
    /* a domed lunar farm: a greenhouse full of green, with a habitat module and a flag */
    pen.phase('silhouette');
    const dome = domePts(0, 0.72 * S, 0.5 * S, 0.55 * S);
    pen.phase('palette');
    const bushC = [pick([SP.lime, SP.green]), pick([SP.lime, SP.green])], flagC = pick([SP.coral, SP.blue]);
    pen.phase('accessories');
    const hasFlag = chance(0.5), earth = chance(0.5);
    ground(0.72 * S, 0.95 * S);
    pen.phase('detail');
    shape(dome, SP.silver, { alpha: 0.35, width: 2.6, wob: 1.3, role: 'silhouette'});   // the glass, see-through
    retrace(dome, { width: 2.6, span: 0.25, at: M.shade > 0 ? 1 : 0 });                              // where the glass meets the ground
    for (let i = 1; i < 4; i++) { const a = Math.PI + i / 4 * Math.PI; stroke([[Math.cos(a) * 0.5 * S, 0.72 * S + Math.sin(a) * 0.55 * S], [0, 0.72 * S]], { ...SEAM, width: 1.2 }); }
    stroke([[-0.2 * S, 0.72 * S], [-0.2 * S, 0.42 * S]], { width: 2 }); shape(blob(-0.2 * S, 0.36 * S, 0.1 * S, 0.1 * S, 0.12, 10), SP.green, { width: 1.8, wob: 1.2 });   // a tree
    [-1, 1].forEach((s, i) => shape(blob(0.15 * S + s * 0.05 * S, 0.6 * S, 0.07 * S, 0.14 * S, 0.12, 10), bushC[i], { width: 1.6, wob: 1.2 }));   // bush rows
    for (let i = 0; i < 3; i++) stroke([[-0.02 * S + i * 0.05 * S, 0.72 * S], [-0.02 * S + i * 0.05 * S, 0.68 * S]], { width: 1.2, role: 'texture' });   // sprouts
    shape(box(-0.5 * S, 0.55 * S, 0.2 * S, 0.34 * S, 0), SP.cream, { width: 2.2, wob: 1.2 }); shape(box(-0.5 * S, 0.55 * S, 0.08 * S, 0.2 * S, 0), SP.navy, { width: 1.6, wob: 0.8 });   // the habitat module
    if (hasFlag) flag(-0.78 * S, 0.3 * S, 0.3 * S, flagC);
    if (earth) { const b = blob(0.6 * S, -0.55 * S, 0.16 * S, 0.15 * S, 0.1, 12); shape(b, SP.teal, { width: 2, wob: 1.2}); }   // earth in the sky
    specks(S, 2);
  },
  /* ---------- combinations ---------- */
  launch(S, M) {
    ground(0.85 * S, 0.95 * S);
    pen.phase('detail');
    stroke([[0.45 * S, 0.85 * S], [0.45 * S, -0.7 * S]], { width: 3, role: 'silhouette' }); for (let i = 0; i < 5; i++) stroke([[0.45 * S, -0.6 * S + i * 0.28 * S], [0.3 * S, -0.5 * S + i * 0.28 * S]], { width: 1.6 }); for (let i = 0; i < 6; i++) stroke([[0.45 * S, -0.7 * S + i * 0.25 * S], [0.58 * S, -0.6 * S + i * 0.25 * S]], { ...SEAM, width: 1.2 });   // the gantry
    pen.ctx.save(); pen.ctx.translate(-0.1 * S, -0.05 * S); MOTIFS.rocket(0.75 * S, { ...M, sub: true }); pen.ctx.restore();
    pen.phase('detail');
    for (let i = 0; i < 6; i++) shape(blob(rf(-0.7, 0.4) * S, 0.75 * S + rf(-0.05, 0.1) * S, rf(0.1, 0.2) * S, rf(0.08, 0.14) * S, 0.15, 10), SP.silver, { alpha: 0.35, width: 1.6, wob: 1.6 });   // smoke
  },
  alienSaucer(S, M) { pen.ctx.save(); pen.ctx.translate(0.1 * S, -0.35 * S); MOTIFS.ufo(0.55 * S, { ...M, sub: true }); pen.ctx.restore(); pen.ctx.save(); pen.ctx.translate(-0.35 * S, 0.45 * S); pen.ctx.scale(0.55, 0.55); MOTIFS.alien(S, { ...M, sub: true }); pen.ctx.restore(); ground(0.9 * S, 0.95 * S); },
  walk(S, M) { pen.ctx.save(); pen.ctx.translate(-0.3 * S, 0.1 * S); pen.ctx.scale(0.7, 0.7); MOTIFS.astronaut(S, { ...M, sub: true }); pen.ctx.restore(); pen.ctx.save(); pen.ctx.translate(0.55 * S, -0.3 * S); MOTIFS.satellite(0.45 * S, { ...M, sub: true }); pen.ctx.restore(); },
};
const MOTIF_WEIGHTS = {
  rocket: 2, shuttle: 1, satellite: 1.6, station: 1.3, probe: 1.1, lander: 1.2, rover: 1.2, astronaut: 1.7, robot: 1.5, moonBase: 0.9, dishArray: 0.8, capsule: 0.9, rayGun: 0.8, telescope: 0.8, observatory: 0.8, freighter: 0.8,
  alien: 2.6, ufo: 1.6,
  moon: 0.6, planet: 0.9, saturn: 0.5, comet: 0.7, asteroid: 0.8, galaxy: 0.5, constellation: 0.6, eclipse: 0.5,
  alienCity: 0.8, greenhouse: 0.6,
  launch: 0.7, alienSaucer: 0.7, walk: 0.5,
};

/* ─── Render ─── */
function drawSpace(cx, cy, seed, { big = false } = {}) {
  pen.seed(seed);
  /* what it is, which way it faces and looks, which side the light leaves: the silhouette */
  pen.phase('silhouette');
  const kind = pooled(MOTIF_WEIGHTS);
  const M = { f: pick([-1, 1]), look: pick([-1, -0.5, 0, 0, 0.5, 1]), shade: pick([-1, 1]) };
  const S = rf(92, 106), rot = rf(-0.05, 0.05);
  /* a rough hand: a fat nib more often than not, a looser wobble, and a careless marker */
  pen.phase('palette');
  pen.ink = pick(SPACE_INKS);
  pen.w = rf(0.9, 1.45);
  pen.wob = rf(1.0, 1.35);
  MARKER = { mode: chance(0.45) ? 'scribble' : 'flat', alpha: rf(0.45, 0.8), grow: rf(0.9, 1.12) };
  pen.ctx.save();
  pen.ctx.translate(cx, cy);
  if (!big) pen.ctx.rotate(rot);
  const variant = MOTIFS[kind](S, M);
  pen.quiet = null;
  pen.ctx.restore();
  return typeof variant === 'string' ? { kind, variant } : { kind };
}

Sheet.register('space', { name: 'space', H: 2420, draw: drawSpace, census: ['kind'], zoom: 1.2,
                          locks: ['silhouette', 'expression', 'palette', 'accessories'], pool: MOTIF_WEIGHTS });
})();
