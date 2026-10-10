/* The tattoo collection: its drawing code, registered for its own sheet and for the mix.
   Wrapped in an IIFE so collections can share a page without their names colliding. */
(() => {
/* the flash palette: red, yellow, green, blue, orange, grey, brown, skin-pink */
const TAT = Object.fromEntries(['red','yellow','green','blue','orange','grey','brown','pink'].map(k => [k, tok('--tat-' + k, '#888')]));


/* ============================================================
   FLASH TOOLS
   ============================================================ */
/* a flat colour inside bold lines: paper fill, colour wash, outline */
/* the marker box for the design being drawn — the same one the faces use: flat marker or crayon
   scribble, a little translucent, a little the wrong size and off register; rolled per design */
let MARKER = { mode: 'flat', alpha: 0.75, grow: 1 };
const DAB = 16;   // areas smaller than this get a flat dab, tight on the line (cherries, eyes, rivets)
function wash(pts, color, alpha = MARKER.alpha) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return Math.max(x1 - x0, y1 - y0) < DAB
    ? { color, alpha, grow: 1, mode: 'flat', wob: 3, dx: rf(-3, 3), dy: rf(-3, 3) }
    : { color, alpha, grow: MARKER.grow, mode: MARKER.mode };   // the shared marker box (WASH) keeps it loose and off register
}
/* role picks the line's place in the hierarchy: the main mass of a motif is drawn 'silhouette'
   (heavier, steadier), its parts 'structure', its scales and veins 'texture' */
function shape(pts, color, { alpha = MARKER.alpha, width = 3.2, wob = 0.8, closed = true, inkFill = false, role = 'structure' } = {}) {
  if (inkFill) { sketch(pts, { closed, fill: true, wob, width, role }); return; }
  sketch(pts, { closed, fill: true, fillColor: pen.base, wash: color ? wash(pts, color, alpha) : null, wob, width, role });
}
/* black whip-shading: hatch inside a shape, within a box; ang may be a direction field, so on a
   rounded mass the strokes turn with the form instead of all leaning the same way */
function shadeIn(pts, x0, y0, x1, y1, n, ang, len = 10) {
  pen.ctx.save(); tracePath(wobblePts(pts, 1, true), true); pen.ctx.clip();
  hatch(x0, y0, x1, y1, n, ang, len);
  pen.ctx.restore();
}
/* the contour of a shape's bounding ellipse: shading on a skull, a heart, a cherry follows its curve */
function contourOf(pts) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return field.contour((x0 + x1) / 2, (y0 + y1) / 2, Math.max(1, (x1 - x0) / 2), Math.max(1, (y1 - y0) / 2));
}
/* the run of a spine: (x, y) → the angle of the nearest piece of the polyline, so a snake's
   scales lie along its body wherever it bends */
function alongSpine(spine) {
  return (x, y) => {
    let best = 1e18, ang = 0;
    for (let i = 0; i + 1 < spine.length; i++) {
      const [ax, ay] = spine[i], [bx, by] = spine[i + 1];
      const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
      const d = Math.hypot(x - ax - dx * t, y - ay - dy * t);
      if (d < best) { best = d; ang = Math.atan2(dy, dx); }
    }
    return ang;
  };
}
function ellipsePts(cx, cy, rx, ry, n = 22, rot = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, x = Math.cos(a) * rx, y = Math.sin(a) * ry; pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); }
  return pts;
}
function starPts(cx, cy, rOut, rIn, n = 5, rot = -Math.PI / 2) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) { const r = i % 2 ? rIn : rOut, a = rot + i * Math.PI / n; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return pts;
}
/* a polygon around a polyline with a width at each point (a snake, a fish) */
function tube(c, w) {
  const L = [], Rg = [];
  for (let i = 0; i < c.length; i++) {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
    L.push([c[i][0] + nx * w[i] / 2, c[i][1] + ny * w[i] / 2]); Rg.push([c[i][0] - nx * w[i] / 2, c[i][1] - ny * w[i] / 2]);
  }
  return L.concat(Rg.reverse());
}
const WORDS = ['LOVE', 'DEATH', 'FREE'];   // the only three words a flash banner ever says
/* hand-lettering: block capitals as strokes in a 1×1 box (y down), drawn with the same wobbly pen
   as everything else, so no computer font ever touches the paper */
const GLYPHS = {
  A: [[[0, 1], [0.5, 0], [1, 1]], [[0.22, 0.64], [0.78, 0.64]]],
  D: [[[0, 0], [0, 1], [0.5, 1], [0.86, 0.84], [0.98, 0.5], [0.86, 0.16], [0.5, 0], [0, 0]]],
  E: [[[0.92, 0], [0, 0], [0, 1], [0.92, 1]], [[0, 0.5], [0.7, 0.5]]],
  F: [[[0.92, 0], [0, 0], [0, 1]], [[0, 0.5], [0.68, 0.5]]],
  H: [[[0, 0], [0, 1]], [[1, 0], [1, 1]], [[0, 0.5], [1, 0.5]]],
  L: [[[0, 0], [0, 1], [0.9, 1]]],
  N: [[[0, 1], [0, 0], [1, 1], [1, 0]]],
  O: [[[0.5, 0], [0.86, 0.12], [1, 0.5], [0.86, 0.88], [0.5, 1], [0.14, 0.88], [0, 0.5], [0.14, 0.12], [0.5, 0]]],
  R: [[[0, 1], [0, 0], [0.62, 0], [0.9, 0.14], [0.9, 0.38], [0.62, 0.52], [0, 0.52]], [[0.5, 0.52], [0.98, 1]]],
  S: [[[0.92, 0.14], [0.62, 0], [0.22, 0.04], [0.04, 0.24], [0.2, 0.44], [0.76, 0.56], [0.96, 0.76], [0.8, 0.97], [0.36, 1], [0.06, 0.86]]],
  T: [[[0, 0], [1, 0]], [[0.5, 0], [0.5, 1]]],
  V: [[[0, 0], [0.5, 1], [1, 0]]],
  W: [[[0, 0], [0.24, 1], [0.5, 0.3], [0.76, 1], [1, 0]]],
};
/* letter `text`, block capitals about `lh` tall, centred on (x, y): hand-lettered, so every
   letter leans, sits and sizes a little differently, the strokes wobble and taper, and now
   and then the pen goes over a stroke a second time */
function lettering(x, y, text, lh, { width = 0, wob = 1.1, color } = {}) {
  const lw = lh * 0.62, gap = lh * 0.24;
  const total = text.length * lw + (text.length - 1) * gap;
  const w = width || Math.max(1.4, lh * 0.2);
  let x0 = x - total / 2;
  for (const ch of text) {
    const g = GLYPHS[ch];
    if (g) {
      const k = rf(0.86, 1.14), dy = rf(-0.08, 0.08) * lh, lean = rf(-0.12, 0.12);   // this letter's size, seat, lean
      const cxl = x0 + lw / 2, cyl = y + dy;
      const map = ([px, py]) => {
        const ux = (px - 0.5) * lw * k, uy = (py - 0.5) * lh * k;
        return [cxl + ux + uy * lean, cyl + uy];
      };
      for (const stroke of g) {
        sketch(stroke.map(map), { width: w * rf(0.8, 1.25), wob, color });
        if (chance(0.22)) sketch(stroke.map(map), { width: w * 0.6, wob: wob * 1.3, color });   // gone over again
      }
    }
    x0 += lw + gap * rf(0.6, 1.5);
  }
}
/* a ribbon with a word on it; it lies over the motif, so the hand firms up part of its edge */
function banner(x, y, w, text, color = TAT.red) {
  const h = 19, c = 5;
  for (const s of [-1, 1])                                  // the folded tails behind
    shape([[x + s * w / 2, y - h / 2 + c + 3], [x + s * (w / 2 + 16), y - h / 2 + c - 4], [x + s * (w / 2 + 10), y + c + 1], [x + s * (w / 2 + 16), y + h / 2 + c + 5], [x + s * w / 2, y + h / 2 + c]], color, { width: 2.4, wob: 0.6 });
  const ribbon = [[x - w / 2, y - h / 2 + c], [x, y - h / 2 - c], [x + w / 2, y - h / 2 + c], [x + w / 2, y + h / 2 + c], [x, y + h / 2 - c], [x - w / 2, y + h / 2 + c]];
  shape(ribbon, color, { width: 2.6, wob: 0.6 });
  if (chance(0.7)) retrace(ribbon, { closed: true, width: 2.6, wob: 0.8, span: 0.35 });   // the ribbon over the motif: gone over
  /* the word, hand-lettered to fit the ribbon */
  const lh = Math.min(h * 0.68, (w * 0.82) / (text.length * 0.62 + (text.length - 1) * 0.24));
  lettering(x, y + 1, text, lh, { width: Math.max(1.6, lh * 0.22) });
}
/* a few sparkles round a design */
function sparkles(S) {
  for (let i = 0, n = ri(2, 4); i < n; i++) {
    const x = rf(-S, S), y = rf(-S, S);
    if (Math.hypot(x, y) < S * 0.7) continue;
    if (chance(0.5)) dot(x, y, rf(1.5, 2.5)); else { line(x - 5, y, x + 5, y, { width: 1.6, wob: 0.3, taper: false }); line(x, y - 5, x, y + 5, { width: 1.6, wob: 0.3, taper: false }); }
  }
}

/* ============================================================
   THE MOTIFS — each draws centred on (0,0) within ±S.
   Each rolls its colours in the palette phase, its geometry in silhouette, its shading in detail
   and its banners, ropes, hats and clovers in accessories, so the sheet can lock any of them.
   ============================================================ */
const MOTIFS = {
  anchor(S, f) {
    pen.phase('palette');
    const c = pick([TAT.blue, TAT.grey, TAT.green, TAT.blue]), ribbon = pick([TAT.red, TAT.yellow]);
    pen.phase('silhouette');
    /* arms: a thick arc with flukes */
    const arm = []; for (let i = 0; i <= 14; i++) { const a = Math.PI * 0.12 + i / 14 * Math.PI * 0.76; arm.push([Math.cos(a) * 0.62 * S, 0.05 * S + Math.sin(a) * 0.58 * S]); }
    for (let i = 14; i >= 0; i--) { const a = Math.PI * 0.12 + i / 14 * Math.PI * 0.76; arm.push([Math.cos(a) * 0.46 * S, 0.05 * S + Math.sin(a) * 0.42 * S]); }
    shape(arm, c, { role: 'silhouette' });
    for (const s of [-1, 1]) shape([[s * 0.54 * S, 0.34 * S], [s * 0.66 * S, 0.02 * S], [s * 0.34 * S, 0.22 * S]], c, { role: 'silhouette' });        // flukes
    shape([[-0.07 * S, 0.62 * S], [0.07 * S, 0.62 * S], [0, 0.8 * S]], c);                                                   // crown
    shape([[-0.06 * S, -0.5 * S], [0.06 * S, -0.5 * S], [0.06 * S, 0.66 * S], [-0.06 * S, 0.66 * S]], c, { role: 'silhouette' });   // shank
    shape([[-0.42 * S, -0.52 * S], [0.42 * S, -0.52 * S], [0.42 * S, -0.42 * S], [-0.42 * S, -0.42 * S]], c, { role: 'silhouette' });   // stock
    for (const s of [-1, 1]) shape(ellipsePts(s * 0.42 * S, -0.47 * S, 0.07 * S, 0.07 * S, 12), c);
    shape(ellipsePts(0, -0.7 * S, 0.15 * S, 0.15 * S, 16), c); shape(ellipsePts(0, -0.7 * S, 0.07 * S, 0.07 * S, 12), null, { width: 2.4 });   // ring
    pen.phase('detail');
    shadeIn(arm, -0.7 * S, 0.2 * S, 0, 0.7 * S, 10, field.contour(0, 0.05 * S, 0.54 * S, 0.5 * S), 9);   // round the curve of the arm
    pen.phase('accessories');
    if (chance(0.6)) {                                                                                                          // a rope round the shank
      sketch([[f * 0.12 * S, -0.7 * S], [f * 0.35 * S, -0.3 * S], [f * 0.1 * S, 0.1 * S], [f * 0.3 * S, 0.55 * S]], { wob: 1, width: 2.2 });
      for (let i = 0; i < 4; i++) { const y = -0.25 * S + i * 0.14 * S; shape([[-0.1 * S, y], [0.1 * S, y - 0.05 * S], [0.1 * S, y + 0.01 * S], [-0.1 * S, y + 0.06 * S]], TAT.yellow, { width: 2, wob: 0.5 }); }
    }
    if (chance(0.7)) banner(0, 0.12 * S, 1.25 * S, pick(WORDS), ribbon);
  },
  ship(S, f) {
    pen.phase('palette');
    const hullC = pick([TAT.brown, TAT.red, TAT.blue]), sea = pick([TAT.blue, TAT.green]);
    pen.phase('silhouette');
    if (chance(0.4)) shape(ellipsePts(f * 0.45 * S, -0.55 * S, 0.28 * S, 0.28 * S, 20), TAT.yellow, { width: 2.4 });      // a sun behind
    /* masts & sails first, hull over their feet */
    const masts = [[-0.32, -0.72], [0.02, -0.92], [0.34, -0.68]];
    for (const [mx, top] of masts) {
      line(mx * S, 0.3 * S, mx * S, top * S, { width: 3, wob: 0.5 });
      shape([[(mx - 0.13) * S, (top + 0.08) * S], [(mx + 0.13) * S, (top + 0.08) * S], [(mx + 0.16) * S, (top + 0.42) * S], [(mx - 0.16) * S, (top + 0.42) * S]], null, { width: 2.4 });
      shape([[(mx - 0.17) * S, (top + 0.48) * S], [(mx + 0.17) * S, (top + 0.48) * S], [(mx + 0.2) * S, (top + 0.92) * S], [(mx - 0.2) * S, (top + 0.92) * S]], null, { width: 2.4 });
      hatch((mx - 0.15) * S, (top + 0.5) * S, (mx - 0.07) * S, (top + 0.9) * S, 6, 1.3, 8);
      shape([[mx * S, top * S], [(mx + f * 0.18) * S, (top + 0.05) * S], [mx * S, (top + 0.1) * S]], TAT.red, { width: 2, wob: 0.5 });   // pennant
    }
    line(-0.32 * S, -0.6 * S, 0.02 * S, -0.86 * S, { width: 1.4, wob: 0.5, role: 'texture' }); line(0.02 * S, -0.86 * S, 0.34 * S, -0.58 * S, { width: 1.4, wob: 0.5, role: 'texture' });   // rigging
    line(-0.62 * S, 0.22 * S, -0.32 * S, -0.55 * S, { width: 1.2, wob: 0.5, role: 'texture' }); line(0.62 * S, 0.22 * S, 0.34 * S, -0.5 * S, { width: 1.2, wob: 0.5, role: 'texture' });
    const hull = [[-0.68 * S, 0.22 * S], [-0.52 * S, 0.56 * S], [0.52 * S, 0.56 * S], [0.7 * S, 0.18 * S], [0.5 * S, 0.3 * S], [-0.5 * S, 0.3 * S]];
    shape(hull, hullC, { role: 'silhouette' });
    pen.phase('detail');
    line(-0.5 * S, 0.4 * S, 0.52 * S, 0.4 * S, { width: 1.6, wob: 0.6 });
    for (let i = 0; i < 5; i++) dot(-0.35 * S + i * 0.17 * S, 0.48 * S, 2.4);                                                   // portholes
    shadeIn(hull, -0.7 * S, 0.4 * S, 0.7 * S, 0.6 * S, 10, 0.3, 10);
    for (let k = 0; k < 3; k++) {                                                                                                   // the sea
      const y = 0.6 * S + k * 0.12 * S, pts = [];
      for (let i = 0; i <= 8; i++) pts.push([-0.8 * S + i * 0.2 * S, y + (i % 2 ? -0.05 : 0.05) * S]);
      sketch(pts, { wob: 0.8, width: 3, color: k === 1 ? sea : pen.ink });
    }
  },
  swallow(S, f) {
    pen.phase('palette');
    const wing = pick([TAT.blue, TAT.blue, TAT.green, TAT.grey]);
    pen.phase('silhouette');
    const rot = -0.5 * f;                                          // diving
    pen.ctx.save(); pen.ctx.rotate(rot);
    const tail1 = [[-f * 0.25 * S, 0.08 * S], [-f * 0.8 * S, 0.12 * S], [-f * 0.55 * S, 0.0], [-f * 0.3 * S, -0.04 * S]];
    const tail2 = [[-f * 0.25 * S, 0.1 * S], [-f * 0.72 * S, 0.4 * S], [-f * 0.5 * S, 0.18 * S]];
    shape(tail1, wing, { role: 'silhouette' }); shape(tail2, wing, { role: 'silhouette' });
    const wTop = [[f * 0.05 * S, -0.1 * S], [-f * 0.12 * S, -0.5 * S], [-f * 0.3 * S, -0.9 * S], [-f * 0.48 * S, -0.55 * S], [-f * 0.3 * S, -0.12 * S]];
    shape(wTop, wing, { role: 'silhouette' });
    for (let i = 0; i < 3; i++) line(-f * (0.15 + i * 0.08) * S, -0.2 * S - i * 0.08 * S, -f * (0.22 + i * 0.1) * S, -0.6 * S - i * 0.1 * S, { width: 1.4, wob: 0.5, color: pen.base });
    const body = ellipsePts(0, 0.05 * S, 0.4 * S, 0.19 * S, 22, -0.1 * f);
    shape(body, wing, { role: 'silhouette' });
    pen.ctx.save(); tracePath(wobblePts(body, 1, true), true); pen.ctx.clip(); { const belly = ellipsePts(f * 0.1 * S, 0.14 * S, 0.3 * S, 0.14 * S, 16); washPts(belly, wash(belly, TAT.red)); } pen.ctx.restore();
    const wLow = [[-f * 0.02 * S, 0.12 * S], [-f * 0.32 * S, 0.45 * S], [-f * 0.55 * S, 0.5 * S], [-f * 0.28 * S, 0.16 * S]];
    shape(wLow, wing, { role: 'silhouette' });
    const headP = ellipsePts(f * 0.36 * S, -0.12 * S, 0.15 * S, 0.14 * S, 16);
    shape(headP, wing, { role: 'silhouette' });
    pen.phase('detail');
    { const throat = ellipsePts(f * 0.36 * S, -0.05 * S, 0.11 * S, 0.06 * S, 12); washPts(throat, wash(throat, TAT.yellow)); }       // a yellow throat
    shape([[f * 0.48 * S, -0.15 * S], [f * 0.66 * S, -0.1 * S], [f * 0.48 * S, -0.05 * S]], TAT.yellow, { width: 2, wob: 0.4 }); // beak
    dot(f * 0.39 * S, -0.16 * S, 2.6); dot(f * 0.4 * S, -0.17 * S, 1, pen.base);
    pen.ctx.restore();
  },
  koi(S, f) {
    pen.phase('palette');
    const c = pick([TAT.orange, TAT.red, TAT.orange, TAT.yellow]);
    pen.phase('detail');
    for (let k = 0; k < 3; k++) { const x = -f * 0.7 * S + k * f * 0.25 * S, y = 0.45 * S + k * 0.12 * S; arc(x, y, 0.14 * S, Math.PI * 1.1, Math.PI * 2.4, { width: 3, color: TAT.blue, wob: 0.6 }); }   // water curls
    for (let i = 0; i < 5; i++) dot(rf(-0.8, 0.8) * S, rf(0.3, 0.75) * S, rf(1.5, 3), TAT.blue);
    pen.phase('silhouette');
    const spine = [[f * 0.62 * S, -0.28 * S], [f * 0.3 * S, -0.12 * S], [-f * 0.05 * S, 0.0], [-f * 0.32 * S, 0.12 * S], [-f * 0.55 * S, 0.3 * S]];
    const body = tube(spine, [0.14 * S, 0.36 * S, 0.34 * S, 0.22 * S, 0.08 * S]);
    /* tail fin, dorsal and pectoral fins first */
    shape([[-f * 0.5 * S, 0.28 * S], [-f * 0.85 * S, 0.05 * S], [-f * 0.8 * S, 0.32 * S], [-f * 0.95 * S, 0.6 * S], [-f * 0.62 * S, 0.45 * S]], c, { width: 2.6 });
    shape([[f * 0.15 * S, -0.28 * S], [f * 0.05 * S, -0.55 * S], [-f * 0.12 * S, -0.45 * S], [-f * 0.2 * S, -0.12 * S]], c, { width: 2.4 });
    shape([[f * 0.2 * S, 0.08 * S], [f * 0.1 * S, 0.35 * S], [-f * 0.08 * S, 0.25 * S], [f * 0.05 * S, 0.1 * S]], c, { width: 2.4 });
    shape(body, c, { role: 'silhouette' });
    pen.phase('detail');
    if (chance(0.6)) { pen.ctx.save(); tracePath(wobblePts(body, 1, true), true); pen.ctx.clip(); for (let i = 0; i < 3; i++) sketch(ellipsePts(rf(-0.3, 0.3) * S, rf(-0.1, 0.1) * S, rf(0.1, 0.18) * S, rf(0.07, 0.12) * S, 12), { closed: true, fill: true, fillColor: pen.base, width: 1.8, wob: 0.6 }); pen.ctx.restore(); }   // white patches
    pen.ctx.save(); tracePath(wobblePts(body, 1, true), true); pen.ctx.clip();                                                         // scales: texture, thin
    for (let row = 0; row < 5; row++) for (let k = 0; k < 8; k++) arc(f * (0.35 - k * 0.12) * S + (row % 2) * 0.06 * S * f, -0.22 * S + row * 0.11 * S + k * 0.03 * S, 0.05 * S, 0.15, Math.PI - 0.15, { width: 1.4, wob: 0.4, taper: false, role: 'texture' });
    pen.ctx.restore();
    dot(f * 0.52 * S, -0.3 * S, 3.2); dot(f * 0.53 * S, -0.31 * S, 1.1, pen.base);
    line(f * 0.68 * S, -0.22 * S, f * 0.82 * S, -0.12 * S, { width: 1.6, wob: 0.5 }); line(f * 0.66 * S, -0.15 * S, f * 0.78 * S, -0.02 * S, { width: 1.6, wob: 0.5 });   // barbels
    arc(f * 0.64 * S, -0.18 * S, 0.05 * S, f > 0 ? -0.5 : Math.PI - 1, f > 0 ? 1 : Math.PI + 0.5, { width: 2 });   // mouth
  },
  heart(S) {
    pen.phase('palette');
    const ribbon = pick([TAT.yellow, TAT.red, TAT.blue]);
    pen.phase('silhouette');
    const k = S * 0.046, pts = [];
    for (let i = 0; i < 40; i++) { const t = i / 40 * Math.PI * 2; pts.push([16 * Math.pow(Math.sin(t), 3) * k, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * k]); }
    const dagger = chance(0.35), wings = !dagger && chance(0.25);
    if (wings) for (const s of [-1, 1]) { shape([[s * 0.45 * S, -0.1 * S], [s * 1.0 * S, -0.5 * S], [s * 0.95 * S, -0.2 * S], [s * 0.85 * S, 0.1 * S], [s * 0.5 * S, 0.2 * S]], null, { width: 2.4, role: 'silhouette' }); for (let i = 0; i < 3; i++) line(s * (0.55 + i * 0.12) * S, -0.12 * S + i * 0.08 * S, s * (0.9 - i * 0.05) * S, -0.35 * S + i * 0.12 * S, { width: 1.4, wob: 0.5, role: 'texture' }); }
    if (dagger) shape([[-0.32 * S, 0.55 * S], [-0.45 * S, 0.95 * S], [-0.22 * S, 0.62 * S]], null, { width: 2.4 });   // the tip below
    shape(pts, TAT.red, { role: 'silhouette' });
    if (dagger) {
      const blade = [[0.2 * S, -0.55 * S], [0.35 * S, -0.6 * S], [-0.18 * S, 0.55 * S], [-0.3 * S, 0.5 * S]];
      shape(blade, null, { width: 2.4 });                                                                                    // blade through
      retrace(blade.slice(1, 3), { width: 2.4, wob: 0.8, span: 0.5, at: 0.85 });                                             // where it comes out of the heart: gone over
      shape([[0.1 * S, -0.62 * S], [0.5 * S, -0.7 * S], [0.52 * S, -0.6 * S], [0.14 * S, -0.52 * S]], TAT.yellow, { width: 2.2 });   // guard
      shape([[0.34 * S, -0.68 * S], [0.52 * S, -0.98 * S], [0.6 * S, -0.95 * S], [0.44 * S, -0.66 * S]], TAT.brown, { width: 2.2 });  // grip
      shape(ellipsePts(0.58 * S, -1.0 * S, 0.06 * S, 0.06 * S, 10), TAT.yellow, { width: 2 });
    }
    pen.phase('detail');
    shadeIn(pts, -0.8 * S, 0.1 * S, 0, 0.9 * S, 12, contourOf(pts), 9);                                                    // round the lobe
    sketch(ellipsePts(-0.3 * S, -0.32 * S, 0.1 * S, 0.06 * S, 10, -0.5), { closed: true, fill: true, fillColor: pen.base, width: 1.6, wob: 0.5 });   // the shine
    if (dagger) for (let i = 0; i < 3; i++) shape(ellipsePts(-0.4 * S + i * 0.06 * S, 0.95 * S + i * 0.08 * S, 0.03 * S, 0.04 * S, 8), TAT.red, { width: 1.6 });   // drops
    pen.phase('accessories');
    banner(0, 0.05 * S, 1.2 * S, pick(WORDS), ribbon);
  },
  dagger(S) {
    pen.phase('silhouette');
    const snake = chance(0.35);
    const blade = [[-0.1 * S, -0.12 * S], [0.1 * S, -0.12 * S], [0, 0.9 * S]];
    shape(blade, null, { role: 'silhouette' });
    pen.phase('detail');
    shadeIn(blade, -0.1 * S, -0.12 * S, 0, 0.9 * S, 12, 1.4, 7);
    line(0, -0.1 * S, 0, 0.7 * S, { width: 1.4, wob: 0.5 });
    shape([[-0.36 * S, -0.14 * S], [0.36 * S, -0.14 * S], [0.3 * S, -0.02 * S], [-0.3 * S, -0.02 * S]], TAT.yellow);
    const grip = [[-0.09 * S, -0.58 * S], [0.09 * S, -0.58 * S], [0.09 * S, -0.14 * S], [-0.09 * S, -0.14 * S]];
    shape(grip, TAT.red);
    for (let i = 0; i < 4; i++) shape([[-0.09 * S, (-0.54 + i * 0.1) * S], [0.09 * S, (-0.56 + i * 0.1) * S], [0.09 * S, (-0.52 + i * 0.1) * S], [-0.09 * S, (-0.5 + i * 0.1) * S]], null, { inkFill: true, width: 1.4 });
    shape(ellipsePts(0, -0.66 * S, 0.1 * S, 0.1 * S, 12), TAT.yellow);
    if (snake) {
      pen.phase('silhouette');
      const spine = []; for (let i = 0; i <= 8; i++) { const t = i / 8; spine.push([Math.sin(t * Math.PI * 2.5) * 0.3 * S, -0.45 * S + t * 1.2 * S]); }
      const body = tube(spine, [0.08 * S, 0.12 * S, 0.15 * S, 0.16 * S, 0.16 * S, 0.15 * S, 0.12 * S, 0.08 * S, 0.04 * S]);
      shape(body, TAT.green, { width: 2.6, role: 'silhouette' });
      retrace(body, { closed: true, width: 2.6, wob: 0.8, span: 0.2, at: 0.25 });                                           // where the coil crosses the blade: gone over
      shape([[-0.02 * S, -0.62 * S], [0.16 * S, -0.5 * S], [0.02 * S, -0.36 * S], [-0.14 * S, -0.5 * S]], TAT.green, { width: 2.4 });
      pen.phase('detail');
      dot(0.03 * S, -0.52 * S, 1.8); line(-0.02 * S, -0.62 * S, -0.06 * S, -0.74 * S, { width: 1.4, color: TAT.red }); line(-0.06 * S, -0.74 * S, -0.11 * S, -0.78 * S, { width: 1.2, color: TAT.red });
    }
    pen.phase('accessories');
    if (chance(0.4)) banner(0, 0.35 * S, 1.1 * S, pick(WORDS), TAT.red);
  },
  rose(S) {
    pen.phase('palette');
    const c = pick([TAT.red, TAT.red, TAT.yellow, TAT.pink]);
    pen.phase('silhouette');
    /* stem & leaves first */
    sketch([[0, 0.25 * S], [0.05 * S, 0.6 * S], [-0.02 * S, 0.9 * S]], { width: 4, wob: 0.8, color: TAT.green });
    sketch([[0, 0.25 * S], [0.05 * S, 0.6 * S], [-0.02 * S, 0.9 * S]], { width: 1.4, wob: 0.8 });
    for (let i = 0; i < 3; i++) shape([[0.04 * S, (0.4 + i * 0.15) * S], [0.14 * S, (0.36 + i * 0.15) * S], [0.05 * S, (0.46 + i * 0.15) * S]], null, { inkFill: true, width: 1 });   // thorns
    for (const s of [-1, 1]) {
      const lx = s * 0.12 * S, ly = 0.45 * S + (s > 0 ? 0.12 : 0) * S, ang = s * 0.4 + 0.2;
      const leaf = [[0, 0], [0.22 * S, -0.12 * S], [0.5 * S, -0.02 * S], [0.22 * S, 0.12 * S]].map(([x, y]) => [lx + s * (x * Math.cos(ang) - y * Math.sin(ang)), ly + x * Math.sin(ang) + y * Math.cos(ang)]);
      shape(leaf, TAT.green, { width: 2.6 });
      line(leaf[0][0], leaf[0][1], leaf[2][0], leaf[2][1], { width: 1.2, wob: 0.5, role: 'texture' });
    }
    /* outer petals round the cup */
    const petals = [];
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * 0.1 + i * Math.PI * 0.4 + rf(-0.1, 0.1);
      const pet = ellipsePts(Math.cos(a) * 0.28 * S, -0.05 * S + Math.sin(a) * 0.22 * S, 0.3 * S, 0.2 * S, 16, a);
      shape(pet, c, { width: 2.6, role: 'silhouette' });
      petals.push(pet);
    }
    const cup = ellipsePts(0, -0.1 * S, 0.33 * S, 0.26 * S, 20);
    shape(cup, c, { role: 'silhouette' });
    pen.phase('detail');
    for (const pet of petals) shadeIn(pet, -S, -S, S, S, 5, contourOf(pet), 8);                                            // each petal shaded round its own curl
    arc(0, -0.1 * S, 0.2 * S, Math.PI * 0.9, Math.PI * 2.3, { width: 2.2, wob: 0.6 });
    arc(0.04 * S, -0.08 * S, 0.11 * S, Math.PI * 1.2, Math.PI * 2.9, { width: 2, wob: 0.6 });
    arc(-0.02 * S, -0.1 * S, 0.04 * S, 0, Math.PI * 1.6, { width: 1.8, wob: 0.5 });
    shadeIn(cup, -0.35 * S, -0.1 * S, 0.35 * S, 0.2 * S, 8, field.contour(0, -0.1 * S, 0.33 * S, 0.26 * S), 8);
  },
  skull(S) {
    pen.phase('silhouette');
    const bones = chance(0.4), shade = pick([-1, 1]);                                     // crossbones behind; which side the light leaves
    if (bones) for (const s of [-1, 1]) {
      const bone = [[-s * 0.8 * S, 0.75 * S], [s * 0.8 * S, -0.55 * S]];
      sketch(bone, { width: 9, wob: 0.4, color: pen.base, taper: false }); sketch(bone, { width: 3, wob: 0.6 });
      for (const [x, y] of bone) for (const k of [-1, 1]) shape(ellipsePts(x + k * 0.06 * S * (y > 0 ? 1 : -1) * s, y + k * 0.05 * S, 0.06 * S, 0.06 * S, 10), null, { width: 2.2 });
    }
    const sk = [];
    for (let i = 0; i <= 14; i++) { const a = Math.PI + i / 14 * Math.PI; sk.push([Math.cos(a) * 0.46 * S, -0.18 * S + Math.sin(a) * 0.44 * S]); }
    sk.push([0.46 * S, 0.0], [0.34 * S, 0.22 * S], [0.3 * S, 0.46 * S], [0.16 * S, 0.58 * S], [-0.16 * S, 0.58 * S], [-0.3 * S, 0.46 * S], [-0.34 * S, 0.22 * S], [-0.46 * S, 0.0]);
    shape(sk, null, { width: 3.4, role: 'silhouette' });
    for (const s of [-1, 1]) shape(ellipsePts(s * 0.18 * S, -0.04 * S, 0.13 * S, 0.11 * S, 14, s * 0.3), null, { inkFill: true });   // sockets
    shape([[0, 0.1 * S], [0.06 * S, 0.24 * S], [0, 0.2 * S], [-0.06 * S, 0.24 * S]], null, { inkFill: true, width: 2 });           // nose
    line(-0.18 * S, 0.42 * S, 0.18 * S, 0.42 * S, { width: 2, wob: 0.5 });
    for (let i = -2; i <= 2; i++) line(i * 0.07 * S, 0.34 * S, i * 0.07 * S, 0.56 * S, { width: 1.6, wob: 0.4 });                  // teeth
    for (const s of [-1, 1]) line(s * 0.34 * S, 0.22 * S, s * 0.22 * S, 0.3 * S, { width: 1.6, wob: 0.6 });                        // cheekbones
    pen.phase('detail');
    /* the shadow side: whip-shading round the dome, and the outline gone over there */
    shadeIn(sk, shade < 0 ? -0.5 * S : 0.1 * S, -0.5 * S, shade < 0 ? -0.1 * S : 0.5 * S, 0.6 * S, 14, field.contour(0, -0.1 * S, 0.46 * S, 0.5 * S), 9);
    if (chance(0.7)) retrace(sk, { closed: true, width: 3.4, wob: 0.8, span: 0.22, at: shade < 0 ? 0.1 : 0.55 });
    if (chance(0.5)) sketch([[-0.1 * S, -0.6 * S], [-0.02 * S, -0.45 * S], [-0.1 * S, -0.35 * S]], { width: 1.4, wob: 0.5, role: 'texture' });     // a crack
    pen.phase('accessories');
    if (!bones && chance(0.3)) {                                                                                                    // a top hat
      shape([[-0.5 * S, -0.42 * S], [0.5 * S, -0.42 * S], [0.45 * S, -0.62 * S], [-0.45 * S, -0.62 * S]], TAT.blue);
      shape([[-0.3 * S, -0.62 * S], [0.3 * S, -0.62 * S], [0.25 * S, -0.9 * S], [-0.25 * S, -0.9 * S]], null, { width: 2.6 });
      for (const s of [-1, 1]) sketch([[s * 0.5 * S, -0.45 * S], [s * 0.7 * S, -0.2 * S]], { width: 3, wob: 0.6, color: TAT.blue });
    }
  },
  snake(S, f) {
    pen.phase('palette');
    const c = pick([TAT.green, TAT.green, TAT.orange, TAT.yellow]);
    pen.phase('silhouette');
    const spine = []; for (let i = 0; i <= 10; i++) { const t = i / 10; spine.push([f * Math.sin(t * Math.PI * 2.2 + 0.3) * 0.42 * S, -0.7 * S + t * 1.45 * S]); }
    const w = spine.map((_, i) => (0.06 + 0.16 * Math.sin(i / 10 * Math.PI)) * S);
    const body = tube(spine, w);
    shape(body, c, { role: 'silhouette' });
    const [hx, hy] = spine[0];
    shape([[hx, hy + 0.05 * S], [hx + f * 0.2 * S, hy - 0.1 * S], [hx + f * 0.05 * S, hy - 0.3 * S], [hx - f * 0.16 * S, hy - 0.18 * S]], c, { role: 'silhouette' });   // head
    pen.phase('detail');
    pen.ctx.save(); tracePath(wobblePts(body, 1, true), true); pen.ctx.clip();
    for (let i = 0; i < 10; i++) { const [x, y] = spine[i]; const [x2, y2] = spine[i + 1]; const mx = (x + x2) / 2, my = (y + y2) / 2; if (i % 2) { const band = ellipsePts(mx, my, 0.12 * S, 0.05 * S, 10, Math.atan2(y2 - y, x2 - x) + Math.PI / 2); washPts(band, wash(band, TAT.yellow, MARKER.alpha * 0.9)); } }   // bands
    const run = alongSpine(spine);                                                                                                  // diamond scales, laid along the body
    hatch(-S, -S, S, S, 30, (x, y) => run(x, y) + 0.8, 7); hatch(-S, -S, S, S, 30, (x, y) => run(x, y) - 0.8, 7);
    pen.ctx.restore();
    dot(hx + f * 0.04 * S, hy - 0.18 * S, 2.4); dot(hx + f * 0.05 * S, hy - 0.19 * S, 0.9, pen.base);
    line(hx + f * 0.08 * S, hy - 0.32 * S, hx + f * 0.12 * S, hy - 0.5 * S, { width: 1.6, color: TAT.red }); line(hx + f * 0.12 * S, hy - 0.5 * S, hx + f * 0.2 * S, hy - 0.56 * S, { width: 1.4, color: TAT.red }); line(hx + f * 0.12 * S, hy - 0.5 * S, hx + f * 0.08 * S, hy - 0.58 * S, { width: 1.4, color: TAT.red });
    pen.phase('accessories');
    if (chance(0.4)) banner(0, 0.85 * S, 1.0 * S, pick(WORDS), TAT.red);
  },
  star(S) {
    pen.phase('palette');
    const light = pick([TAT.red, TAT.yellow, pen.base, TAT.blue]);
    pen.phase('silhouette');
    const ro = 0.82 * S, ri2 = 0.36 * S;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * Math.PI * 0.4, o = [Math.cos(a) * ro, Math.sin(a) * ro];
      const iL = [Math.cos(a - Math.PI / 5) * ri2, Math.sin(a - Math.PI / 5) * ri2], iR = [Math.cos(a + Math.PI / 5) * ri2, Math.sin(a + Math.PI / 5) * ri2];
      shape([[0, 0], iL, o], null, { inkFill: true, width: 2.2, wob: 0.4 });
      shape([[0, 0], o, iR], light, { width: 2.2, wob: 0.4 });
    }
    sketch(starPts(0, 0, ro, ri2), { closed: true, width: 3.2, wob: 0.5, role: 'silhouette' });
    pen.phase('accessories');
    if (chance(0.4)) { sketch(ellipsePts(0, 0, 0.95 * S, 0.95 * S, 30), { closed: true, width: 2, wob: 0.5 }); sketch(ellipsePts(0, 0, 1.0 * S, 1.0 * S, 30), { closed: true, width: 1.2, wob: 0.5 }); }
  },
  lighthouse(S) {
    pen.phase('silhouette');
    const tower = [[-0.24 * S, 0.5 * S], [0.24 * S, 0.5 * S], [0.16 * S, -0.45 * S], [-0.16 * S, -0.45 * S]];
    for (const s of [-1, 1]) shape([[s * 0.14 * S, -0.66 * S], [s * 0.95 * S, -0.98 * S], [s * 0.95 * S, -0.3 * S]], TAT.yellow, { alpha: MARKER.alpha * 0.7, width: 1.6, wob: 0.6 });   // beams
    shape(tower, null, { role: 'silhouette' });
    pen.ctx.save(); tracePath(wobblePts(tower, 1, true), true); pen.ctx.clip();
    for (let i = 0; i < 3; i++) { const band = [[-0.3 * S, (0.32 - i * 0.32) * S], [0.3 * S, (0.32 - i * 0.32) * S], [0.3 * S, (0.16 - i * 0.32) * S], [-0.3 * S, (0.16 - i * 0.32) * S]]; washPts(band, wash(band, TAT.red)); }
    pen.ctx.restore();
    shape([[-0.24 * S, -0.45 * S], [0.24 * S, -0.45 * S], [0.24 * S, -0.53 * S], [-0.24 * S, -0.53 * S]], TAT.grey, { width: 2.4 });   // gallery
    shape([[-0.14 * S, -0.53 * S], [0.14 * S, -0.53 * S], [0.14 * S, -0.75 * S], [-0.14 * S, -0.75 * S]], TAT.yellow, { width: 2.4 });   // lantern
    line(-0.05 * S, -0.53 * S, -0.05 * S, -0.75 * S, { width: 1.4 }); line(0.05 * S, -0.53 * S, 0.05 * S, -0.75 * S, { width: 1.4 });
    shape([[-0.18 * S, -0.75 * S], [0.18 * S, -0.75 * S], [0, -0.95 * S]], TAT.red, { width: 2.4 });                                // roof
    shape([[-0.1 * S, 0.35 * S], [0.1 * S, 0.35 * S], [0.1 * S, 0.5 * S], [-0.1 * S, 0.5 * S]], TAT.brown, { width: 2 });            // door
    pen.phase('detail');
    shadeIn(tower, -0.25 * S, -0.45 * S, -0.08 * S, 0.5 * S, 10, 1.5, 7);
    for (const [x, y, r] of [[-0.5, 0.62, 0.2], [0.45, 0.6, 0.25], [0, 0.68, 0.3]]) shape(ellipsePts(x * S, y * S, r * S, r * 0.5 * S, 12), TAT.grey, { width: 2.4 });   // rocks
    for (let k = 0; k < 2; k++) { const y = 0.78 * S + k * 0.1 * S, pts = []; for (let i = 0; i <= 8; i++) pts.push([-0.85 * S + i * 0.21 * S, y + (i % 2 ? -0.04 : 0.04) * S]); sketch(pts, { wob: 0.8, width: 3, color: k ? pen.ink : TAT.blue }); }
  },
  horseshoe(S) {
    pen.phase('palette');
    const c = pick([TAT.yellow, TAT.grey, TAT.yellow]);
    pen.phase('silhouette');
    const pts = [];
    for (let i = 0; i <= 18; i++) { const a = -Math.PI * 0.15 + i / 18 * Math.PI * 1.3; pts.push([Math.cos(a) * 0.62 * S, -0.12 * S + Math.sin(a) * 0.62 * S]); }
    for (let i = 18; i >= 0; i--) { const a = -Math.PI * 0.15 + i / 18 * Math.PI * 1.3; pts.push([Math.cos(a) * 0.42 * S, -0.12 * S + Math.sin(a) * 0.42 * S]); }
    shape(pts, c, { role: 'silhouette' });
    pen.phase('detail');
    shadeIn(pts, -0.7 * S, 0.1 * S, 0.7 * S, 0.6 * S, 10, field.contour(0, -0.12 * S, 0.52 * S, 0.52 * S), 9);                   // round the bend of the shoe
    for (let i = 1; i < 8; i++) { const a = -Math.PI * 0.12 + i / 8 * Math.PI * 1.24; dot(Math.cos(a) * 0.52 * S, -0.12 * S + Math.sin(a) * 0.52 * S, 2.8); }   // nail holes
    pen.phase('accessories');
    if (chance(0.5)) for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; shape(ellipsePts(Math.cos(a) * 0.09 * S, -0.12 * S + Math.sin(a) * 0.09 * S, 0.1 * S, 0.08 * S, 10, a), TAT.green, { width: 2 }); }   // clover
    banner(0, 0.35 * S, 1.05 * S, pick(WORDS), TAT.red);
  },
  compass(S) {
    pen.phase('silhouette');
    const ring = ellipsePts(0, 0, 0.85 * S, 0.85 * S, 32);
    shape(ring, null, { width: 3.2, role: 'silhouette' });
    sketch(ellipsePts(0, 0, 0.72 * S, 0.72 * S, 30), { closed: true, width: 2, wob: 0.5 });
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 4, ro = (i % 2 ? 0.42 : 0.66) * S, rin = 0.12 * S;
      const o = [Math.cos(a) * ro, Math.sin(a) * ro], l = [Math.cos(a - Math.PI / 8) * rin, Math.sin(a - Math.PI / 8) * rin], r = [Math.cos(a + Math.PI / 8) * rin, Math.sin(a + Math.PI / 8) * rin];
      shape([[0, 0], l, o], i === 0 ? TAT.red : null, { inkFill: i !== 0 && i % 2 === 0, width: 2, wob: 0.4 });
      shape([[0, 0], o, r], i === 0 ? TAT.red : null, { width: 2, wob: 0.4 });
    }
    pen.phase('detail');
    dot(0, 0, 4);
    for (const [t, x, y] of [['N', 0, -0.78], ['E', 0.78, 0], ['S', 0, 0.8], ['W', -0.78, 0]]) lettering(x * S, y * S + 1, t, 0.14 * S, { width: 1.6 });
  },
  cherries(S) {
    pen.phase('silhouette');
    for (const [x0, x1, y1] of [[-0.02, -0.34, 0.32], [0.02, 0.36, 0.26]]) sketch([[x0 * S, -0.7 * S], [x1 * 0.5 * S, -0.2 * S], [x1 * S, y1 * S]], { width: 3, wob: 0.7, color: TAT.green });
    const leaf = [[0, -0.7 * S], [0.25 * S, -0.9 * S], [0.55 * S, -0.82 * S], [0.28 * S, -0.62 * S]];
    shape(leaf, TAT.green, { width: 2.4 }); line(0, -0.7 * S, 0.5 * S, -0.82 * S, { width: 1.2, wob: 0.5, role: 'texture' });
    const fruit = [];
    for (const [x, y] of [[-0.34, 0.32], [0.36, 0.26]]) {
      const ch = ellipsePts(x * S, (y + 0.25) * S, 0.28 * S, 0.28 * S, 20);
      shape(ch, TAT.red, { role: 'silhouette' });
      fruit.push([ch, x, y]);
    }
    pen.phase('detail');
    for (const [ch, x, y] of fruit) {
      shadeIn(ch, (x - 0.3) * S, (y + 0.15) * S, (x + 0.3) * S, (y + 0.55) * S, 8, field.contour(x * S, (y + 0.25) * S, 0.28 * S, 0.28 * S), 8);   // round the fruit
      sketch(ellipsePts((x - 0.1) * S, (y + 0.14) * S, 0.07 * S, 0.045 * S, 10, -0.6), { closed: true, fill: true, fillColor: pen.base, width: 1.4, wob: 0.4 });
    }
  }
};
const MOTIF_WEIGHTS = { anchor: 2.5, ship: 1.8, swallow: 2.5, koi: 1.8, heart: 2.5, dagger: 1.8, rose: 2.2, skull: 1.8, snake: 1.4, star: 1.3, lighthouse: 1.1, horseshoe: 1.3, compass: 1.1, cherries: 1.3 };

/* ---------- composites: motifs combined into bigger designs ---------- */
function sub(kind, x, y, k, S, f, rot = 0) { pen.ctx.save(); pen.ctx.translate(x, y); pen.ctx.rotate(rot); MOTIFS[kind](S * k, f); pen.ctx.restore(); }
function burst(S, n = 12, color = TAT.yellow) {          // sun rays behind a design
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, a2 = a + Math.PI / n * 0.7;
    shape([[Math.cos(a) * 0.5 * S, Math.sin(a) * 0.5 * S], [Math.cos(a) * 1.1 * S, Math.sin(a) * 1.1 * S], [Math.cos(a2) * 1.1 * S, Math.sin(a2) * 1.1 * S], [Math.cos(a2) * 0.5 * S, Math.sin(a2) * 0.5 * S]], color, { width: 2, wob: 0.6 });
  }
}
function ropeRing(S, r = 0.98) {                          // a twisted rope circle
  sketch(ellipsePts(0, 0, r * S, r * S, 40), { closed: true, width: 8, wob: 0.5, color: TAT.yellow, taper: false });
  sketch(ellipsePts(0, 0, (r + 0.045) * S, (r + 0.045) * S, 40), { closed: true, width: 2.2, wob: 0.5 });
  sketch(ellipsePts(0, 0, (r - 0.045) * S, (r - 0.045) * S, 40), { closed: true, width: 2.2, wob: 0.5 });
  for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; line(Math.cos(a) * (r - 0.04) * S, Math.sin(a) * (r - 0.04) * S, Math.cos(a + 0.09) * (r + 0.04) * S, Math.sin(a + 0.09) * (r + 0.04) * S, { width: 1.6, wob: 0.3, taper: false, role: 'texture' }); }
}
function lifeRing(S, r = 0.95) {                          // a red-and-white life ring
  const ring = ellipsePts(0, 0, r * S, r * S, 40);
  shape(ring, null, { width: 3, role: 'silhouette' });
  pen.ctx.save(); tracePath(wobblePts(ring, 1, true), true); pen.ctx.clip();
  for (const q of [0, 2]) { const pts = [[0, 0]]; for (let i = 0; i <= 8; i++) { const a = q * Math.PI / 2 + i / 8 * Math.PI / 2 + 0.4; pts.push([Math.cos(a) * 1.1 * S, Math.sin(a) * 1.1 * S]); } washPts(pts, wash(pts, TAT.red)); }
  pen.ctx.restore();
  shape(ellipsePts(0, 0, r * 0.68 * S, r * 0.68 * S, 32), null, { width: 2.6 });
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; line(Math.cos(a) * r * 0.68 * S, Math.sin(a) * r * 0.68 * S, Math.cos(a) * r * S, Math.sin(a) * r * S, { width: 1.6, wob: 0.4 }); }
}
/* the frames and bursts are accessories round the motif; the composites' own banners too */
Object.assign(MOTIFS, {
  anchorSwallows(S, f) { sub('anchor', 0, 0.1 * S, 0.8, S, f); for (const s of [-1, 1]) sub('swallow', s * 0.72 * S, -0.55 * S, 0.42, S, -s); },
  heartSwallows(S, f) { for (const s of [-1, 1]) sub('swallow', s * 0.74 * S, -0.3 * S, 0.45, S, -s); sub('heart', 0, 0.08 * S, 0.7, S, f); },
  heartRoses(S, f) { sub('rose', -0.5 * S, 0.32 * S, 0.5, S, f, 0.3); sub('rose', 0.55 * S, 0.36 * S, 0.5, S, f, -0.3); sub('heart', 0, -0.1 * S, 0.7, S, f); },
  skullSnake(S, f) { sub('skull', 0, -0.05 * S, 0.85, S, f); sub('snake', f * 0.25 * S, 0.1 * S, 0.7, S, f, f * 0.5); pen.phase('accessories'); banner(0, 0.78 * S, 1.1 * S, pick(WORDS), TAT.red); },
  skullDagger(S, f) { sub('dagger', 0, 0.12 * S, 0.95, S, f); sub('skull', 0, -0.15 * S, 0.6, S, f); },
  daggerRose(S, f) { sub('dagger', 0.05 * S, 0, 1.0, S, f, 0.55 * f); sub('rose', 0, 0.05 * S, 0.75, S, f); },
  shipRing(S, f) { pen.phase('accessories'); lifeRing(S); sub('ship', 0, 0.08 * S, 0.52, S, f); },
  koiPair(S, f) { sub('koi', -0.12 * S, -0.22 * S, 0.62, S, 1, 0.5); sub('koi', 0.12 * S, 0.25 * S, 0.62, S, -1, 0.5); },
  horseshoeCherries(S, f) { sub('horseshoe', 0, 0.08 * S, 0.9, S, f); sub('cherries', 0, -0.25 * S, 0.4, S, f); },
  lighthouseShip(S, f) { sub('lighthouse', -0.25 * S, 0, 0.85, S, f); sub('ship', 0.55 * S, 0.45 * S, 0.38, S, -f); },
  starAnchor(S, f) { sub('star', 0, 0, 1.0, S, f); sub('anchor', 0, 0.05 * S, 0.55, S, f); },
  burstHeart(S, f) { pen.phase('accessories'); burst(0.85 * S, 14); sub('heart', 0, 0.05 * S, 0.7, S, f); },
  burstSkull(S, f) { pen.phase('accessories'); burst(0.8 * S, 12, TAT.red); sub('skull', 0, 0, 0.75, S, f); },
  framedSwallow(S, f) { pen.phase('accessories'); ropeRing(S); sub('swallow', 0, 0.05 * S, 0.68, S, f); },
  framedRose(S, f) { pen.phase('accessories'); ropeRing(S); sub('rose', 0, 0, 0.68, S, f); },
  compassAnchor(S, f) { sub('compass', 0, 0, 0.95, S, f); sub('anchor', 0, 0.05 * S, 0.45, S, f); },
  snakeRose(S, f) { sub('rose', 0, 0.05 * S, 0.8, S, f); sub('snake', f * 0.3 * S, 0, 0.75, S, f, f * 0.9); },
  starSwallow(S, f) { for (const s of [-1, 1]) sub('star', s * 0.7 * S, 0.5 * S, 0.3, S, f); sub('swallow', 0, -0.1 * S, 0.8, S, f); }
});
Object.assign(MOTIF_WEIGHTS, { anchorSwallows: 1.2, heartSwallows: 1.2, heartRoses: 1, skullSnake: 1, skullDagger: 0.8, daggerRose: 1.2, shipRing: 0.8, koiPair: 0.8, horseshoeCherries: 0.7, lighthouseShip: 0.6, starAnchor: 0.7, burstHeart: 0.8, burstSkull: 0.6, framedSwallow: 0.7, framedRose: 0.7, compassAnchor: 0.6, snakeRose: 0.8, starSwallow: 0.7 });

/* ============================================================
   ONE DESIGN
   ============================================================ */
/* big > 0: draw the design so it spans ±big pixels round (cx, cy) — used by the viewer.
   The random rolls are identical either way, so the enlarged design is the one that was clicked.
   Decisions are rolled in phases (silhouette, palette, accessories, detail) so the sheet can lock
   any of them while varying one design; the motif itself is dealt from the sheet's deck. */
function drawTattoo(cx, cy, seed, { big = false } = {}) {
  pen.seed(seed);
  pen.phase('silhouette');
  const kind = pooled(MOTIF_WEIGHTS);
  const S = rf(96, 112), f = pick([-1, 1]);      // design radius: fills the cell the way the faces do
  const rot = rf(-0.04, 0.04);
  /* the pen and the marker box for this design, rolled the way the faces roll theirs */
  pen.phase('palette');
  pen.ink = pick(INKS);
  pen.w = rf(0.95, 1.25);
  MARKER = { mode: chance(0.32) ? 'scribble' : 'flat', alpha: rf(0.5, 0.85), grow: rf(0.94, 1.1) };
  pen.phase('silhouette');
  pen.ctx.save();
  pen.ctx.translate(cx, cy);
  if (!big) pen.ctx.rotate(rot);                 // the viewer scales; a straight design exports cleaner
  MOTIFS[kind](S, f);
  pen.phase('detail');
  if (chance(0.35)) sparkles(S);
  pen.ctx.restore();
  return { kind };
}


Sheet.register('tattoo', { name: 'tattoo', H: 2420, draw: drawTattoo, census: ['kind'], zoom: 1.2,
  locks: ['silhouette', 'palette', 'accessories'], pool: MOTIF_WEIGHTS });
})();
