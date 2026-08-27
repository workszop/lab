/* The creatures collection: odd doodle beings after the two inspiration
   sheets — bold ink outlines, white bodies, solid-black accents (stripes, hair,
   patches), hatching, stipple and short fur dashes for shading, colour only as
   a rare, pale wash. Every creature is an exquisite corpse: a body, whatever
   grew on top, a face, limbs and a pocketful of extras, each rolled on its own.
   Beside the plain beings live the disfigured humans (third eyes, opened
   skulls, ribcage reveals), the myths (mermaids, hydras, dragons) and the
   horrors (skeletons, vampires, reapers, spiders, a walking eyeball). The hand
   is deadpan rather than cute: shaded sides, lidded eyes, jointed limbs.
   Wrapped in an IIFE so collections can share a page without names colliding. */
(() => {
/* the marker box: pale accents under the ink, a fern and a sea tint for the myths, fire and blood */
const ACCENTS = toks('--crt', 6), PINK = tok('--pink', '#e4a5a0');
const FERN = tok('--crt-fern', '#7a9a5a'), SEA = tok('--crt-sea', '#6fa39d');
const FIRE = tok('--crt-fire', '#d0782f'), BLOOD = tok('--crt-blood', '#a8352d');

const BODY_WEIGHTS = { blob: 2.4, tall: 1.8, pear: 1.6, imp: 1.5, longneck: 1.2, giant: 1.2,
                       human: 1.6, skeleton: 0.9, vampire: 0.9, reaper: 0.8, mermaid: 0.8,
                       hydra: 0.8, spider: 0.9, eyeball: 0.7, dragon: 0.9, cat: 1.1 };

/* trace `pts` and run `fn` clipped inside them */
function clipTo(pts, fn) { pen.ctx.save(); tracePath(wobblePts(pts, 1, true), true); pen.ctx.clip(); fn(); pen.ctx.restore(); }

/* parallel hatching, clipped inside `pts` AND the box — the shaded side of a form */
function shade(pts, x0, y0, x1, y1) {
  pen.ctx.save();
  tracePath(wobblePts(pts, 1, true), true); pen.ctx.clip();
  pen.ctx.beginPath(); pen.ctx.rect(x0, y0, x1 - x0, y1 - y0); pen.ctx.clip();
  const ang = rf(1.05, 1.4), step = rf(4.5, 6.5);
  const ux = Math.cos(ang), uy = Math.sin(ang), px = -uy, py = ux;
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, diag = Math.hypot(x1 - x0, y1 - y0) / 2 + 4;
  for (let d = -diag; d <= diag; d += step)
    line(mx + px * d - ux * diag, my + py * d - uy * diag, mx + px * d + ux * diag, my + py * d + uy * diag, { width: rf(0.8, 1.1), wob: 0.9, taper: false });
  pen.ctx.restore();
}

/* a tall slab: domed top, straight sides, a flat seat on the ground */
function slabPts(x, y0, y1, w) {
  const pts = [];
  for (let i = 0; i <= 10; i++) { const a = Math.PI * (1 + i / 10); pts.push([x + Math.cos(a) * w, y0 + w * 0.9 + Math.sin(a) * w * 0.9]); }
  pts.push([x + w, y1 - 6], [x + w * 0.78, y1], [x - w * 0.78, y1], [x - w, y1 - 6]);
  return pts;
}

/* a bell: a small dome flaring to a hem — wavy for a ghost, straight for a gown */
function bellPts(x, y0, y1, wTop, wHem, wavy) {
  const pts = [];
  for (let i = 0; i <= 8; i++) { const a = Math.PI * (1 + i / 8); pts.push([x + Math.cos(a) * wTop, y0 + wTop + Math.sin(a) * wTop]); }
  const yA = y0 + wTop;
  for (const t of [0.35, 0.65, 0.88]) pts.push([x + wTop + (wHem - wTop) * t * t, yA + (y1 - yA) * t]);
  pts.push([x + wHem, y1]);
  const n = ri(4, 6);
  for (let i = 1; i < n; i++) pts.push([x + wHem - 2 * wHem * (i / n), y1 + (wavy ? (i % 2 ? rf(5, 8) : rf(-6, -3)) : rf(-2, 2))]);
  pts.push([x - wHem, y1]);
  for (const t of [0.88, 0.65, 0.35]) pts.push([x - wTop - (wHem - wTop) * t * t, yA + (y1 - yA) * t]);
  return pts;
}

/* a heart, from its parametric curve */
function heartPts(x, y, s) {
  const pts = [];
  for (let i = 0; i < 16; i++) {
    const t = i / 16 * Math.PI * 2;
    pts.push([x + s * Math.pow(Math.sin(t), 3),
              y - s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16]);
  }
  return pts;
}

/* a sternum, a collarbone and five rib pairs, curving down and out */
function ribCage(x, y0, h, w) {
  line(x, y0, x, y0 + h, { width: 1.8, wob: 0.8 });
  for (const s of [-1, 1]) sketch([[x, y0 + 1], [x + s * w * 0.6, y0 - 2], [x + s * w * 0.9, y0 + 1]], { width: 1.3, wob: 0.7 });   // collarbone
  for (let i = 0; i < 5; i++) for (const s of [-1, 1])
    sketch([[x, y0 + 3 + i * h / 5], [x + s * w * 0.7, y0 + 6 + i * h / 5], [x + s * w, y0 + 10 + i * h / 5]], { width: 1.5, wob: 0.8 });
}

/* hair on a round head: an ink cap, side falls (a bob), curls or a scribble */
function hairBits(hx, hy, hr, style, fall) {
  if (style === 'none') return;
  if (style === 'curls') {
    for (let i = 0; i < 6; i++) { const a = Math.PI * (1.1 + i * 0.16); arc(hx + Math.cos(a) * hr * 0.9, hy + Math.sin(a) * hr * 0.9, rf(4, 6), rf(0, 3), rf(4, 7), { width: 1.6, wob: 0.6 }); }
    return;
  }
  if (style === 'messy') {
    for (let i = 0, n = ri(10, 18); i < n; i++) { const a = Math.PI * rf(1.05, 1.95); const x = hx + Math.cos(a) * hr, y = hy + Math.sin(a) * hr; line(x, y, x + Math.cos(a) * rf(5, 12), y + Math.sin(a) * rf(5, 12), { width: rf(1.1, 1.8), wob: 0.8 }); }
    return;
  }
  const cap = arcPts(hx, hy, hr * 1.06, hr * 1.06, Math.PI * 0.95, Math.PI * 2.05, 0.04, 12);
  cap.push([hx + hr * 1.02, hy - hr * 0.1], [hx, hy - hr * 0.42], [hx - hr * 1.02, hy - hr * 0.1]);
  sketch(cap, { closed: true, fill: true, width: 1.4, wob: 0.8 });
  if (fall > 0) for (const s of [-1, 1]) {
    sketch([[hx + s * hr * 0.95, hy - hr * 0.15], [hx + s * hr * 1.25, hy + fall], [hx + s * hr * 0.62, hy + fall * 0.85], [hx + s * hr * 0.85, hy + hr * 0.3]], { closed: true, fill: true, width: 1.3, wob: 0.8 });
    if (chance(0.5)) line(hx + s * hr * 1.05, hy + hr * 0.1, hx + s * hr * 1.05, hy + fall * 0.7, { width: 1, wob: 0.9, color: pen.base });   // a strand of light in the ink
  }
}

function drawCreature(cx, cy, seed) {
  pen.seed(seed);

  /* ----- who is this? ----- */
  const kind = wpick(BODY_WEIGHTS);
  const is = (...k) => k.includes(kind);
  const figure = is('human', 'skeleton', 'vampire', 'mermaid');   // a real head above a body
  const mood = wpick({ deadpan: is('reaper') ? 7 : 3.5, happy: 1.2,
                       mischief: is('imp', 'vampire', 'spider', 'skeleton') ? 2.6 : 1,
                       grumpy: 1.4, surprised: is('eyeball') ? 1.6 : 0.7, sleepy: is('reaper') ? 0.1 : 0.6 });
  const odd = is('human') ? wpick({ third: 1, brain: 1, ribs: 1, twohead: 0.8, blank: 0.7 }) : null;

  /* ----- the pen and the (mostly shut) marker box ----- */
  pen.ink = pick(INKS);
  pen.w = rf(0.9, 1.4);
  const washCol = is('dragon', 'hydra') && chance(0.7) ? FERN
                : is('mermaid') && chance(0.6) ? SEA
                : pick(ACCENTS);
  const wash = chance(is('dragon', 'hydra', 'mermaid') ? 0.5 : 0.32) ? { color: washCol, alpha: rf(0.3, 0.5), mode: chance(0.5) ? 'scribble' : 'flat', grow: rf(0.95, 1.05) } : null;

  /* ----- the rest of the corpse, rolled before any geometry ----- */
  const look = pick([-1, -0.5, 0, 0, 0.5, 1]);
  const SHADE = pick([-1, 1]);                                    // which side the light leaves
  const texture = is('giant') ? 'fur' : is('cat') ? 'plain' : is('spider') ? (chance(0.6) ? 'fur' : 'plain')
                : is('blob', 'tall', 'pear', 'imp', 'longneck') ? wpick({ plain: 4, stipple: 0.9, fur: 0.5 }) : 'plain';
  let dress = is('human') ? wpick({ none: 2, shirt: 2, stripes: 1, dots: 0.7 })
            : is('hydra') ? wpick({ none: 3, stripes: 0.7 })
            : is('longneck') ? wpick({ none: 3, stripes: 0.6 })
            : is('giant', 'skeleton', 'vampire', 'reaper', 'mermaid', 'spider', 'eyeball', 'dragon', 'cat') ? 'none'
            : wpick({ none: 2.6, shirt: 1.4, stripes: 0.8, dots: 0.6 });
  if (odd === 'ribs') dress = 'none';                             // the coat hangs open instead
  const caped = is('vampire') && chance(0.3);                     // a cape all in ink now and then
  const gear = figure || is('reaper', 'hydra', 'spider', 'eyeball', 'dragon', 'cat') ? 'none'
             : wpick(is('blob') ? { none: 1.5, cat: 1, rabbit: 1, round: 0.8, horns: 1, antlers: 0.6, antenna: 0.8, curl: 0.6, sprout: 0.6 }
                   : is('tall') ? { none: 1.2, rabbit: 2, cat: 0.8, horns: 0.6, antenna: 0.6, curl: 0.4 }
                   : is('pear') ? { none: 2, horns: 0.8, curl: 0.8, antenna: 0.8, sprout: 0.5 }
                   : is('imp') ? { horns: 2.5, cat: 0.6, antenna: 0.5, none: 0.6 }
                   : is('longneck') ? { none: 3, horns: 0.4, antenna: 0.4 }
                   : { none: 2, round: 1.5, horns: 0.8 });
  let eyeKind = wpick({ ring: 3, dot: 1.2, big: 0.8, cyclops: is('imp') ? 0.8 : 0.35, flower: is('human') ? 0.8 : 0.22 });
  if (mood === 'surprised') eyeKind = eyeKind === 'cyclops' ? 'cyclops' : 'big';
  if (mood === 'sleepy') eyeKind = 'lids';
  const arms = is('longneck', 'giant', 'reaper', 'vampire', 'hydra', 'spider', 'dragon', 'cat') ? 'none'
             : is('eyeball') ? (chance(0.4) ? 'out' : 'none')
             : is('mermaid') ? pick(['down', 'out', 'up'])
             : wpick({ down: 2, out: 1.4, up: 0.8, none: 1 });
  const held = arms !== 'none' && chance(0.2) ? wpick({ dagger: 1, flower: 0.7, head: 0.7 }) : null;
  const tail = is('imp') ? (chance(0.75) ? 'devil' : 'none')
             : is('blob') ? wpick({ none: 3, curl: 1, tuft: 0.6 })
             : is('tall') ? wpick({ none: 4, tuft: 0.6 }) : 'none';
  const wings = (is('blob', 'pear', 'imp') && chance(0.1)) || (is('vampire') && chance(0.3));
  const hair = is('human') ? wpick({ bob: 1.2, messy: 1, curls: 0.8, none: 1.2 })
             : is('mermaid') ? wpick({ bob: 2, curls: 0.6, none: 0.4 }) : 'none';
  const extra = is('human') ? wpick({ none: 3, heart: 0.3, buttons: 1.1 })
              : figure || is('reaper', 'spider', 'eyeball', 'hydra', 'dragon', 'cat') ? 'none'
              : wpick({ none: 3, heart: 0.5, buttons: 0.9, patch: is('blob', 'giant') ? 0.9 : 0.3, stitch: is('imp', 'pear') ? 0.8 : 0.3 });
  /* a scary face now and then: hollowed, staring, mismatched or crossed-out eyes over a
     scream, a stitched mouth, or a grin with far too many teeth */
  const dread = chance(0.22);
  const dreadEye = wpick({ hollow: 1.2, stare: 1, mismatch: 0.8, crossed: 0.6 });
  const dreadMouth = wpick({ scream: 1, grin: 1.1, stitched: 0.9, plain: 0.5 });
  /* and a little ink gore, in the flash tradition */
  const gore = is('vampire') ? (chance(0.45) ? 'drip' : null)
             : is('blob', 'tall', 'pear', 'imp', 'giant', 'human') && chance(0.16)
             ? wpick({ drip: 1, axe: 1, wound: 1.2, bones: 0.8 }) : null;

  /* ----- geometry: the stack, centred in its cell ----- */
  const S = rf(1.0, 1.16);
  let body, topY, hem, bw, bh, bodY, fx, fy, fs = 1, legH = 0, legStyle = 'none';
  let hr = 0, hx = cx, hy = 0, neckY = 0;                        // the figures' head and neck
  if (is('blob')) {
    bw = rf(50, 66) * S; bh = rf(66, 90) * S;
    legStyle = wpick({ stick: 2, nub: 1.4, none: 0.6 });
    legH = (legStyle === 'stick' ? rf(20, 32) : legStyle === 'nub' ? rf(8, 13) : 0) * S;
    topY = cy - (2 * bh + legH) / 2; bodY = topY + bh; hem = topY + 2 * bh;
    body = blobPts(cx, bodY, bw, bh, rf(0.04, 0.09), 18);
    fy = bodY - bh * 0.38;
  } else if (is('tall')) {
    bw = rf(30, 42) * S; const H2 = rf(185, 222) * S;
    topY = cy - H2 / 2; hem = topY + H2; bodY = (topY + hem) / 2;
    body = slabPts(cx, topY, hem, bw);
    legStyle = 'toes';
    fy = topY + bw * 1.2 + rf(6, 14);
    bh = H2 / 2;
  } else if (is('pear')) {
    bw = rf(52, 72) * S; const wTop = bw * rf(0.42, 0.55), H2 = rf(125, 165) * S;
    topY = cy - H2 / 2; hem = topY + H2; bodY = (topY + hem) / 2;
    body = bellPts(cx, topY, hem, wTop, bw, chance(0.65));
    fy = topY + wTop + rf(8, 16);
    bh = H2 / 2;
  } else if (is('imp')) {
    bw = bh = rf(33, 43) * S;
    legStyle = 'stick'; legH = rf(52, 72) * S;
    topY = cy - (2 * bh + legH) / 2; bodY = topY + bh; hem = topY + 2 * bh;
    body = blobPts(cx, bodY, bw, bh, rf(0.04, 0.08), 16);
    fy = bodY - bh * 0.15;
  } else if (is('longneck')) {
    bw = rf(46, 60) * S; bh = rf(27, 36) * S;
    legStyle = 'nub'; legH = rf(12, 18) * S;
    const neckH = rf(68, 92) * S, headR = rf(13, 17) * S;
    const H2 = legH + 2 * bh + neckH + headR;
    topY = cy - H2 / 2; hem = topY + H2 - legH; bodY = hem - bh;
    body = blobPts(cx, bodY, bw, bh, rf(0.03, 0.07), 16);
    var neck = { d: look >= 0 ? 1 : -1, h: neckH, r: headR };
    fx = cx + neck.d * bw * 0.55 + neck.d * neckH * 0.18; fy = topY + headR;
    fs = 0.5;
  } else if (is('giant')) {
    bw = rf(58, 76) * S; bh = rf(78, 98) * S;
    topY = cy - bh; hem = cy + bh * 0.94; bodY = cy;
    body = blobPts(cx, bodY, bw, bh, rf(0.05, 0.1), 20).map(([x, y]) => [x, Math.min(y, hem)]);
    legStyle = 'paws';
    fy = bodY - bh * 0.45; fs = 0.85;
  } else if (is('human')) {
    hr = rf(18, 22) * S;
    const shW = rf(26, 34) * S, hipW = shW * rf(0.75, 0.95), torsoH = rf(58, 76) * S;
    legStyle = 'stick'; legH = rf(44, 60) * S;
    const H2 = 2 * hr + 6 + torsoH + legH;
    topY = cy - H2 / 2; hy = topY + hr;
    neckY = topY + 2 * hr + 6; hem = neckY + torsoH; bodY = (neckY + hem) / 2;
    bw = shW; bh = torsoH / 2;
    body = [[cx - shW, neckY], [cx + shW, neckY], [cx + hipW, hem - 4], [cx + hipW * 0.9, hem], [cx - hipW * 0.9, hem], [cx - hipW, hem - 4]];
    fx = hx + look * hr * 0.15; fy = hy; fs = 0.6;
  } else if (is('skeleton')) {
    hr = rf(15, 18) * S;
    const rw = rf(18, 24) * S, ribH = rf(44, 56) * S;
    legStyle = 'stick'; legH = rf(44, 58) * S;
    const H2 = 2 * hr + 5 + ribH + 10 + legH;
    topY = cy - H2 / 2; hy = topY + hr;
    neckY = topY + 2 * hr + 5; hem = neckY + ribH + 10; bodY = neckY + ribH / 2;
    bw = rw; bh = ribH / 2;
    body = null;                                                 // all bone, no silhouette
    fx = hx; fy = hy; fs = 0.6;
  } else if (is('vampire')) {
    hr = rf(16, 19) * S; bw = rf(36, 48) * S;
    const capeH = rf(105, 135) * S, wTop = hr * 1.2;
    topY = cy - (2 * hr + 2 + capeH) / 2; hy = topY + hr;
    neckY = topY + 2 * hr + 2; hem = neckY + capeH; bodY = (neckY + hem) / 2; bh = capeH / 2;
    body = bellPts(cx, neckY - wTop, hem, wTop, bw, chance(0.7));
    fx = hx + look * hr * 0.15; fy = hy; fs = 0.6;
  } else if (is('reaper')) {
    bw = rf(48, 62) * S; const wTop = bw * rf(0.45, 0.55), H2 = rf(120, 150) * S;
    topY = cy - H2 / 2; hem = topY + H2; bodY = (topY + hem) / 2; bh = H2 / 2;
    body = bellPts(cx, topY, hem, wTop, bw, true);               // always tattered
    fx = cx; fy = topY + wTop + rf(4, 10); fs = 0.6;
  } else if (is('mermaid')) {
    hr = rf(14, 17) * S;
    const shW = rf(19, 25) * S, torsoH = rf(42, 56) * S, tailH = rf(60, 80) * S;
    const H2 = 2 * hr + 4 + torsoH + tailH;
    topY = cy - H2 / 2; hy = topY + hr;
    neckY = topY + 2 * hr + 4; hem = neckY + torsoH;             // hem = the waist
    bodY = (neckY + hem) / 2; bw = shW; bh = torsoH / 2;
    const waistW = shW * rf(0.5, 0.62);                          // an hourglass: bust, a drawn-in waist
    body = [[cx - shW, neckY], [cx + shW, neckY], [cx + shW * 0.92, neckY + torsoH * 0.38],
            [cx + waistW, hem - torsoH * 0.12], [cx + waistW * 1.06, hem],
            [cx - waistW * 1.06, hem], [cx - waistW, hem - torsoH * 0.12], [cx - shW * 0.92, neckY + torsoH * 0.38]];
    fx = hx + look * hr * 0.15; fy = hy; fs = 0.55;
    var mer = { waistW, tailH, d: look >= 0 ? 1 : -1, bust: shW * rf(0.42, 0.5), bustY: neckY + torsoH * 0.32 };
  } else if (is('hydra')) {
    bw = rf(42, 56) * S; bh = rf(34, 46) * S;
    legStyle = 'nub'; legH = rf(10, 16) * S;
    const neckH = rf(45, 65) * S, hr2 = rf(9.5, 12.5) * S;
    const H2 = legH + 2 * bh + neckH + 2 * hr2;
    topY = cy - H2 / 2; hem = topY + H2 - legH; bodY = hem - bh;
    body = blobPts(cx, bodY, bw, bh, rf(0.04, 0.08), 16);
    var hyd = { n: chance(0.75) ? 3 : 2, neckH, hr: hr2 };
    fx = cx; fy = bodY - bh - neckH; fs = 0.5;
  } else if (is('spider')) {
    bw = rf(30, 40) * S; bh = bw * rf(0.85, 1.0);
    var thread = chance(0.5) ? rf(24, 40) * S : 0;
    topY = cy - (thread + 2 * bh + 14) / 2; bodY = topY + thread + bh; hem = bodY + bh;
    body = blobPts(cx, bodY, bw, bh, rf(0.05, 0.1), 16);
    fx = cx + look * bw * 0.1; fy = bodY - bh * 0.15; fs = 0.8;
  } else if (is('dragon')) {
    bw = rf(42, 54) * S; bh = rf(24, 32) * S;
    legStyle = 'nub'; legH = rf(12, 18) * S;
    const neckH = rf(48, 66) * S, headR = rf(16, 20) * S;
    const H2 = legH + 2 * bh + neckH + headR * 1.6;
    topY = cy - H2 / 2; hem = topY + H2 - legH; bodY = hem - bh;
    body = blobPts(cx, bodY, bw, bh, rf(0.03, 0.07), 16);
    var drg = { d: look >= 0 ? 1 : -1, neckH, r: headR };
    fx = cx + drg.d * (bw * 0.5 + neckH * 0.22); fy = topY + headR;
    fs = 0.55;
  } else if (is('cat')) {                                        // a black cat, all in ink
    var catP = { pose: chance(0.65) ? 'sit' : 'arch', d: look >= 0 ? 1 : -1 };
    if (catP.pose === 'sit') {
      bw = rf(33, 43) * S; bh = rf(48, 60) * S;
      catP.hr = rf(19, 24) * S; legH = rf(13, 19) * S;
      topY = cy - (catP.hr * 1.7 + 2 * bh + legH) / 2;
      catP.hy = topY + catP.hr;
      bodY = catP.hy + catP.hr * 0.7 + bh; hem = bodY + bh;
      body = blobPts(cx, bodY, bw, bh, rf(0.03, 0.06), 16).map(([x, y]) => {   // a teardrop: narrow shoulders
        const t = Math.max(0, (bodY - y) / bh);
        return [cx + (x - cx) * (1 - 0.4 * t * t), y];
      });
      fx = cx + catP.d * catP.hr * 0.1; fy = catP.hy; fs = 0.6;
    } else {                                                     // the arched hiss
      const aw = rf(72, 90) * S, ah = rf(62, 76) * S, d = catP.d;
      catP.aw = aw; catP.ah = ah;
      hem = cy + (ah + 22) / 2; topY = hem - ah - 14;
      bodY = hem - ah * 0.5; bw = aw * 0.55; bh = ah * 0.5;
      body = [                                               // the body ends at the belly: the legs stand on their own
        [cx + d * aw * 0.52, hem - ah * 0.2], [cx + d * aw * 0.6, hem - ah * 0.35], [cx + d * aw * 0.58, hem - ah * 0.5],
        [cx + d * aw * 0.72, hem - ah * 0.55], [cx + d * aw * 0.7, hem - ah * 0.78], [cx + d * aw * 0.48, hem - ah * 0.72],
        [cx + d * aw * 0.1, hem - ah], [cx - d * aw * 0.3, hem - ah * 0.8], [cx - d * aw * 0.52, hem - ah * 0.35],
        [cx - d * aw * 0.5, hem - ah * 0.18], [cx - d * aw * 0.2, hem - ah * 0.24], [cx + d * aw * 0.2, hem - ah * 0.26]];
      fx = cx + d * aw * 0.6; fy = hem - ah * 0.64; fs = 0.5;
    }
  } else {                                                       // the eyeball, out for a walk
    bw = bh = rf(34, 46) * S;
    legStyle = 'stick'; legH = rf(28, 44) * S;
    topY = cy - (2 * bh + legH) / 2; bodY = topY + bh; hem = topY + 2 * bh;
    body = blobPts(cx, bodY, bw, bh, 0.03, 18);
    fx = cx; fy = bodY;
  }
  if (fx === undefined) fx = cx + look * bw * 0.08;
  const topW = is('longneck') ? neck.r : is('dragon') ? drg.r : is('cat') ? (catP.hr || 16) : is('tall') ? bw * 0.75 : is('pear') ? bw * rf(0.42, 0.55) * 0.9 : figure ? hr : bw * 0.62;
  const gearX = is('longneck') ? fx : cx;
  const gearY = is('longneck') ? fy - neck.r * 0.8 : topY + 4;
  const dab = wash && { ...wash, mode: 'flat', grow: 1 };

  const tilt = rf(-0.05, 0.05);
  pen.ctx.save();
  pen.ctx.translate(cx, cy); pen.ctx.rotate(tilt); pen.ctx.translate(-cx, -cy);

  /* ----- behind the body: tail, wings, whatever grew on top ----- */
  if (tail === 'devil') {
    const d = look >= 0 ? -1 : 1, x0 = cx + d * bw * 0.5, y0 = hem - 6;
    sketch([[x0, y0], [x0 + d * rf(18, 28), y0 + rf(6, 14)], [x0 + d * rf(30, 42), y0 - rf(8, 20)]], { width: 2.2, wob: 1 });
    const tx = x0 + d * rf(30, 42), ty = y0 - rf(8, 20);
    sketch([[tx - 4, ty + 3], [tx + d * 6, ty - 7], [tx + 5, ty + 4]], { closed: true, fill: true, width: 1.2, wob: 0.5 });
  } else if (tail === 'curl') {
    const d = look >= 0 ? -1 : 1, x0 = cx + d * bw * 0.85, y0 = bodY + bh * 0.45;
    const pts = [];
    for (let i = 0; i <= 14; i++) { const a = (d > 0 ? 0.5 : 2.6) + d * i / 14 * 3.6, r = rf(16, 22) * (1 - i / 20); pts.push([x0 + d * 14 + Math.cos(a) * r, y0 - 10 + Math.sin(a) * r]); }
    sketch(pts, { width: rf(2, 2.8), wob: 0.8 });
  } else if (tail === 'tuft') {
    const d = look >= 0 ? -1 : 1, x0 = cx + d * bw * (is('tall') ? 0.9 : 0.8), y0 = hem - rf(10, 20);
    for (let i = 0; i < 3; i++) line(x0, y0, x0 + d * rf(10, 18), y0 - 4 + i * 5, { width: 1.6, wob: 0.8 });
  }
  if (is('cat')) {                                          // the tail, a fat curling stroke
    const d = catP.d;
    if (catP.pose === 'sit')
      sketch([[cx - d * bw * 0.8, hem - 8], [cx - d * (bw + rf(8, 14)), bodY + bh * rf(-0.1, 0.3)], [cx - d * (bw + rf(4, 12)), bodY - bh * rf(0.3, 0.55)]], { width: rf(4.2, 5.6), wob: 0.8 });
    else {
      const rx2 = cx - d * catP.aw * 0.45, ry2 = hem - catP.ah * 0.6;
      sketch([[rx2, ry2], [rx2 - d * rf(6, 12), ry2 - rf(14, 20)], [rx2 - d * rf(0, 8), ry2 - rf(26, 36)]], { width: rf(4, 5.2), wob: 0.9 });
      for (let i = 0; i < 4; i++) { const ty2 = ry2 - 8 - i * 7; line(rx2 - d * (4 + i), ty2, rx2 - d * (12 + i), ty2 - 4, { width: 1.2, wob: 0.5 }); }   // bristled
    }
  }
  if (wings) for (const s of [-1, 1]) {
    const x0 = cx + s * bw * 0.8, y0 = bodY - bh * 0.25;
    sketch([[x0, y0 + 8], [x0 + s * 16, y0 - 10], [x0 + s * 8, y0 + 2], [x0 + s * 20, y0 + 2], [x0 + s * 9, y0 + 8], [x0 + s * 16, y0 + 14]], { closed: true, fill: true, fillColor: pen.base, width: 1.8, wob: 0.8 });
    line(x0 + s * 2, y0 + 6, x0 + s * 14, y0 - 6, { width: 1, wob: 0.6 });   // a strut in the membrane
  }
  if (gear === 'cat') for (const s of [-1, 1]) {
    sketch([[gearX + s * topW * 0.9, gearY + 6], [gearX + s * topW * rf(0.9, 1.15), gearY - rf(16, 24)], [gearX + s * topW * 0.35, gearY + 2]], { closed: true, fill: true, fillColor: pen.base, wash: dab, width: 2.2, wob: 0.9 });
    sketch([[gearX + s * topW * 0.78, gearY + 3], [gearX + s * topW * rf(0.85, 1), gearY - rf(9, 14)], [gearX + s * topW * 0.5, gearY + 1]], { width: 1.1, wob: 0.7 });   // the inner ear
  }
  if (gear === 'rabbit') for (const s of [-1, 1]) {
    const eh = rf(34, 52), ex = gearX + s * topW * 0.45, bend = s * rf(-0.12, 0.3);
    sketch(blobPts(ex + bend * eh, gearY - eh * 0.5, rf(7, 10), eh * 0.55, 0.06, 12), { closed: true, fill: true, fillColor: pen.base, wash: dab, width: 2.2, wob: 1 });
    if (chance(0.7)) sketch(blobPts(ex + bend * eh, gearY - eh * 0.5, rf(2.5, 4), eh * 0.3, 0.1, 8), { closed: true, width: 1.2, wob: 0.8 });
  }
  if (gear === 'round') for (const s of [-1, 1])
    sketch(blobPts(gearX + s * topW * 0.85, gearY - 6, rf(9, 13), rf(9, 13), 0.08, 10), { closed: true, fill: true, fillColor: pen.base, wash: dab, width: 2.2, wob: 0.9 });
  if (gear === 'horns') for (const s of [-1, 1]) {
    const hx2 = gearX + s * topW * 0.6, hh = rf(12, 22) * fs * 2 * 0.5 + 8;
    sketch([[hx2 - s * 5, gearY + 5], [hx2 + s * rf(4, 9), gearY - hh], [hx2 + s * 8, gearY + 6]], { closed: true, fill: chance(0.5), fillColor: pen.ink, width: 1.8, wob: 0.7 });
    if (chance(0.5)) for (let i = 1; i < 3; i++) line(hx2 - s * 4 + s * i * 2, gearY + 5 - i * hh * 0.28, hx2 + s * 6, gearY + 4 - i * hh * 0.24, { width: 1, wob: 0.5 });   // growth rings
  }
  if (gear === 'antlers') for (const s of [-1, 1]) {
    const hx2 = gearX + s * topW * 0.5, hy2 = gearY + 2, hh = rf(22, 34);
    line(hx2, hy2, hx2 + s * 8, hy2 - hh, { width: 2.2, wob: 0.8 });
    line(hx2 + s * 3, hy2 - hh * 0.45, hx2 + s * 13, hy2 - hh * 0.75, { width: 1.8, wob: 0.8 });
    line(hx2 + s * 6, hy2 - hh * 0.8, hx2 + s * 15, hy2 - hh * 1.05, { width: 1.8, wob: 0.8 });
    line(hx2 + s * 1, hy2 - hh * 0.6, hx2 - s * 6, hy2 - hh * 0.85, { width: 1.6, wob: 0.8 });   // a back tine
  }
  if (gear === 'antenna') for (const s of (chance(0.4) ? [0] : [-1, 1])) {
    const ax = gearX + s * topW * 0.35, ah = rf(16, 28);
    line(ax, gearY + 4, ax + s * 6 + rf(-3, 3), gearY - ah, { width: 1.8, wob: 1 });
    dot(ax + s * 6, gearY - ah - 2, rf(2.5, 4));
  }
  if (gear === 'curl') {
    const pts = [];
    for (let i = 0; i <= 14; i++) { const a = -Math.PI / 2 + i / 14 * 4.6, r = rf(9, 13) * (1 - i / 20); pts.push([gearX + Math.cos(a) * r, gearY - 9 + Math.sin(a) * r]); }
    sketch(pts, { width: 2, wob: 0.7 });
  }
  if (gear === 'sprout') {
    const sy = gearY + 3, sh = rf(12, 20);
    line(gearX, sy, gearX + rf(-3, 3), sy - sh, { width: 1.8, wob: 1 });
    for (const s of [-1, 1]) {
      sketch(blobPts(gearX + s * 7, sy - sh - 2, 7, 3.5, 0.15, 8), { closed: true, wash: dab, width: 1.4, wob: 0.6 });
      line(gearX + s * 2, sy - sh - 1, gearX + s * 11, sy - sh - 3, { width: 0.9, wob: 0.5 });   // the midrib
    }
  }

  /* ----- the body ----- */
  const inkFill = caped || is('cat');
  if (body) {
    sketch(body, { closed: true, fill: true, fillColor: inkFill ? pen.ink : pen.base, wash: inkFill ? null : wash, wob: 1.2, width: rf(2.4, 3.4) });
    if (!inkFill && chance(0.4)) sketch(body, { closed: true, wob: 2, width: rf(0.9, 1.4) });   // a second, searching line
  }

  /* ----- fur, stipple, clothes, the shaded side ----- */
  const myY = fy + rf(13, 18) * fs;                        // where the mouth will sit: textures keep clear
  if (texture === 'fur') clipTo(body, () => {
    for (let y = topY + 8; y < hem - 4; y += rf(5.5, 7.5))
      for (let x = cx - bw; x < cx + bw; x += rf(5.5, 8)) {
        if (Math.abs(x - fx) < 26 * fs + 8 && y > fy - 16 * fs - 6 && y < myY + 10) continue;
        if (chance(0.85)) line(x + rf(-2, 2), y + rf(-2, 2), x + rf(-2, 2), y + rf(4, 7), { width: rf(0.9, 1.3), wob: 0.6, taper: false });
      }
  });
  if (texture === 'stipple') clipTo(body, () => {
    for (let i = 0, n = ri(70, 140); i < n; i++) {
      const x = cx + rf(-bw, bw), y = rf(topY, hem);
      if (Math.abs(x - fx) < 24 * fs + 6 && y > fy - 16 * fs - 4 && y < myY + 8) continue;
      if ((x - cx) * SHADE < 0 && chance(0.55)) continue;  // the dots crowd the shaded side
      dot(x, y, rf(0.6, 1.3));
    }
  });
  if (is('giant')) for (let i = 0, n = ri(22, 34); i < n; i++) {     // shaggy edge
    const a = pen.R() * Math.PI * 2;
    const x = cx + Math.cos(a) * bw, y = Math.min(bodY + Math.sin(a) * bh, hem);
    line(x, y, x + Math.cos(a + rf(-0.4, 0.4)) * rf(6, 14), y + Math.sin(a + rf(-0.4, 0.4)) * rf(6, 14), { width: rf(1, 1.8), wob: 0.8 });
  }
  const partFace = !figure && !is('hydra');                // stripes part around a face only when it sits on the body
  const shirtTop = is('human') ? neckY + 3 : is('imp') ? bodY - bh * 0.2 : Math.max(myY + 14, bodY - bh * 0.15);
  const shirtHem = is('human') ? hem - 3 : is('tall', 'pear') ? shirtTop + (hem - shirtTop) * rf(0.45, 0.6) : hem;
  const sc = dress === 'none' ? undefined : chance(0.3) ? pick(ACCENTS) : undefined;   // now and then the stripes go on in colour
  if (dress === 'shirt' || dress === 'stripes') {
    const y0 = dress === 'shirt' ? shirtTop : is('human') ? neckY + 3 : topY + 4, y1 = dress === 'shirt' ? shirtHem : is('human') ? hem - 3 : hem;
    const vertical = dress === 'stripes' ? chance(0.6) : chance(0.35);
    clipTo(body, () => {
      if (vertical) for (let x = cx - bw + rf(4, 10); x < cx + bw; x += rf(11, 16)) {
        if (dress === 'stripes' && partFace && Math.abs(x - fx) < 22 * fs + 6) continue;   // stripes part around the face
        const w2 = rf(2.5, 4.5);
        sketch([[x - w2, y0], [x + w2, y0], [x + w2 + rf(-2, 2), y1], [x - w2 + rf(-2, 2), y1]], { closed: true, fill: true, color: sc, width: 1, wob: 0.8 });
      } else for (let y = y0 + rf(3, 8); y < y1; y += rf(10, 15)) {
        if (dress === 'stripes' && partFace && y > fy - 18 * fs && y < myY + 10) continue;
        const h2 = rf(2.5, 4.5);
        sketch([[cx - bw - 6, y - h2], [cx + bw + 6, y - h2 + rf(-2, 2)], [cx + bw + 6, y + h2], [cx - bw - 6, y + h2 + rf(-2, 2)]], { closed: true, fill: true, color: sc, width: 1, wob: 0.8 });
      }
      /* the collar and hem lines live inside the clip too: the body is narrower than bw in places */
      if (dress === 'shirt') sketch([[cx - bw - 6, shirtTop], [cx + bw + 6, shirtTop + rf(-3, 3)]], { width: 2, wob: 1.4 });
      if (dress === 'shirt' && shirtHem < hem - 6) sketch([[cx - bw - 6, shirtHem], [cx + bw + 6, shirtHem + rf(-3, 3)]], { width: 2, wob: 1.4 });
    });
  } else if (dress === 'dots') {
    clipTo(body, () => {
      for (let y = shirtTop + 6; y < shirtHem - 2; y += rf(11, 15))
        for (let x = cx - bw + rf(2, 8); x < cx + bw; x += rf(11, 16)) dot(x + rf(-2, 2), y + rf(-2, 2), rf(1.6, 2.6), sc);
      sketch([[cx - bw - 6, shirtTop], [cx + bw + 6, shirtTop + rf(-3, 3)]], { width: 2, wob: 1.4 });
    });
  }
  /* the plain forms take their shadow on one flank */
  if (body && !inkFill && dress === 'none' && texture === 'plain' && !is('eyeball', 'skeleton') && chance(0.65)) {
    const x0 = SHADE < 0 ? cx - bw - 6 : cx + bw * rf(0.35, 0.5);
    shade(body, x0, is('human', 'mermaid', 'vampire') ? neckY : topY + 4, x0 + bw * rf(0.5, 0.65) + 6, hem - 2);
  }
  if (is('eyeball') && chance(0.7))                        // a sphere sits in its own shadow
    shade(body, cx - bw - 4, bodY + bh * rf(0.4, 0.55), cx + bw + 4, hem + 2);

  /* ----- the longneck's neck, head, plates and tail — or a dragon's ----- */
  if (is('longneck')) {
    const d = neck.d, x0 = cx + d * bw * 0.45, nw = rf(9, 12) * S;
    const inner = [[x0 - d * nw, bodY - bh * 0.4], [x0 - d * nw * 0.6, fy + neck.r * 0.4], [fx - d * neck.r * 0.6, fy]];
    const outer = [[fx + d * neck.r * 0.6, fy], [x0 + d * nw * 1.2, fy + neck.r * 0.6], [x0 + d * nw, bodY]];
    sketch([...inner, ...outer], { fill: true, fillColor: pen.base, wash: dab, width: 2.4, wob: 1 });
    sketch(blobPts(fx, fy, neck.r * rf(1.15, 1.35), neck.r, 0.06, 12), { closed: true, fill: true, fillColor: pen.base, wash: dab, width: 2.4, wob: 1 });
    const tx = cx - d * bw * 0.95, ty = bodY + bh * 0.2;
    sketch([[tx + d * 8, ty - 8], [tx - d * rf(16, 26), ty + rf(2, 10)], [tx + d * 6, ty + 8]], { closed: true, fill: true, fillColor: pen.base, wash: dab, width: 2.2, wob: 1 });
    clipTo(body, () => {                                    // belly plates
      for (let i = 0; i < 4; i++) { const y = hem - 6 - i * 7; sketch([[cx - bw * 0.8, y], [cx, y - 3], [cx + bw * 0.8, y]], { width: 1.1, wob: 0.8 }); }
    });
    if (chance(0.6)) for (let i = 0; i < 4; i++) {          // little back plates
      const x = cx - d * bw * 0.5 + d * i * bw * 0.32, y = bodY - bh * rf(0.85, 0.95);
      sketch([[x - 4, y + 3], [x, y - rf(5, 9)], [x + 4, y + 3]], { closed: true, fill: chance(0.5), width: 1.3, wob: 0.6 });
    }
  }

  /* ----- the dragon, in profile: tail, jaws, one cold eye, a raised wing ----- */
  if (is('dragon')) {
    const d = drg.d, r = drg.r;
    const tx0 = cx - d * bw * 0.85, ty0 = bodY - bh * 0.05;   // the tail, a taper to an arrowhead
    const tipx = tx0 - d * rf(28, 40), tipy = ty0 - rf(14, 26);
    sketch([[tx0 + d * 8, ty0 - 8], [tx0 - d * 12, ty0 - 8 + rf(-4, 4)], [tipx, tipy], [tx0 - d * 10, ty0 + 4], [tx0 + d * 6, ty0 + 8]], { closed: true, fill: true, fillColor: pen.base, wash: dab, width: 2.2, wob: 1 });
    sketch([[tipx + d * 2, tipy - 7], [tipx - d * 8, tipy - 1], [tipx + d * 1, tipy + 6]], { closed: true, fill: true, width: 1.4, wob: 0.5 });
    const x0 = cx + d * bw * 0.5, nw = rf(10, 13) * S;        // the neck, leaning into the wind
    sketch([[x0 - d * nw, bodY - bh * 0.4], [fx - d * r * 0.7, fy + r * 0.5], [fx + d * r * 0.3, fy + r * 0.6], [x0 + d * nw * 1.3, bodY]], { fill: true, fillColor: pen.base, wash: dab, width: 2.4, wob: 1 });
    for (let i = 0; i < 3; i++) {                             // spikes down the nape
      const t = 0.2 + i * 0.28;
      const sx3 = x0 - d * nw + (fx - d * r * 0.7 - x0 + d * nw) * t, sy3 = bodY - bh * 0.4 + (fy + r * 0.5 - bodY + bh * 0.4) * t;
      sketch([[sx3, sy3], [sx3 - d * rf(5, 8), sy3 - rf(3, 6)], [sx3 - d * 1, sy3 + 4]], { closed: true, fill: true, width: 1.1, wob: 0.5 });
    }
    sketch(blobPts(fx, fy, r, r * 0.92, 0.05, 14), { closed: true, fill: true, fillColor: pen.base, wash: dab, width: 2.4, wob: 1 });   // the skull
    const sn = r * rf(0.95, 1.2);                             // the upper jaw, blunt and toothed underneath
    sketch([[fx + d * r * 0.25, fy - r * 0.6], [fx + d * (r * 0.35 + sn), fy - r * 0.28], [fx + d * (r * 0.35 + sn), fy + r * 0.12], [fx + d * (r * 0.25 + sn * 0.8), fy + r * 0.28], [fx + d * r * 0.05, fy + r * 0.3]], { closed: true, fill: true, fillColor: pen.base, width: 2, wob: 0.8 });
    for (let i = 0; i < 3; i++) {
      const tx2 = fx + d * (r * 0.4 + sn * (0.22 + i * 0.26));
      sketch([[tx2 - 2.5, fy + r * 0.24], [tx2 + d * 1, fy + r * 0.24 + rf(5, 8)], [tx2 + 3, fy + r * 0.22]], { closed: true, fill: true, fillColor: pen.base, width: 1, wob: 0.3 });
    }
    if (chance(0.65)) sketch([[fx + d * r * 0.12, fy + r * 0.42], [fx + d * (r * 0.3 + sn * 0.8), fy + r * rf(0.85, 1.05)], [fx + d * r * 0.02, fy + r * 0.68]], { closed: true, fill: true, fillColor: pen.base, width: 1.8, wob: 0.7 });   // the jaw hangs open
    dot(fx + d * (r * 0.3 + sn * 0.8), fy - r * 0.02, 1.3);   // a nostril
    const ex2 = fx + d * r * 0.1, ey2 = fy - r * 0.18;        // one eye in profile, under a heavy brow
    arc(ex2, ey2, r * 0.3, 0, Math.PI * 2, { width: 1.6, wob: 0.7 });
    pen.ctx.save(); pen.ctx.translate(ex2, ey2); pen.ctx.scale(0.5, 1); dot(0, 0, Math.max(1.6, r * 0.17)); pen.ctx.restore();   // a slit pupil
    line(ex2 - d * r * 0.35, ey2 - r * 0.42, ex2 + d * r * 0.4, ey2 - r * 0.3, { width: 2, wob: 0.6 });
    for (let i = 0; i < 2; i++)                               // swept-back horns
      sketch([[fx - d * (r * 0.1 + i * 6), fy - r * 0.75], [fx - d * (r * 1.05 + i * 9), fy - r * rf(1.15, 1.5)], [fx - d * (r * 0.45 + i * 6), fy - r * 0.42]], { closed: true, fill: true, width: 1.3, wob: 0.5 });
    const mx2 = fx + d * (r * 0.3 + sn), my2 = fy + r * rf(0.25, 0.45);
    if (chance(0.55)) {                                       // fire, in three tongues and a spark
      for (let i = 0; i < 3; i++)
        sketch([[mx2, my2 + (i - 1) * 3], [mx2 + d * rf(10, 16), my2 + (i - 1) * 4 + rf(-4, 2)], [mx2 + d * rf(6, 9), my2 + (i - 1) * 3 + rf(1, 4)], [mx2 + d * rf(17, 26), my2 + (i - 1) * 5 + rf(-3, 3)]], { width: rf(1.3, 1.8), wob: 1, color: i === 1 ? ACCENTS[0] : FIRE });
      dot(mx2 + d * rf(24, 30), my2 + rf(-6, 6), 1.4, FIRE);
    } else for (let i = 0; i < 2; i++) arc(mx2 + d * (6 + i * 7), my2 - r * 0.5 - i * 8, rf(2.5, 4), 0, Math.PI * 1.5, { width: 1.1, wob: 0.6 });   // or smoke, curling
    const wx = cx + d * bw * 0.15, wy = bodY - bh * 0.7;      // the wing, raised, with membrane struts
    const apx = wx - d * rf(10, 20), apy = wy - rf(38, 52);
    sketch([[wx, wy], [apx, apy], [wx - d * rf(28, 38), wy - rf(14, 22)], [wx - d * rf(44, 56), wy + rf(0, 8)], [wx - d * 12, wy + 8]], { closed: true, fill: true, fillColor: pen.base, width: 2, wob: 0.9 });
    line(wx - d * 5, wy + 4, apx + d * 2, apy + 5, { width: 1, wob: 0.6 });
    line(wx - d * 6, wy + 5, wx - d * 34, wy - 12, { width: 1, wob: 0.6 });
    line(wx - d * 7, wy + 6, wx - d * 46, wy + 2, { width: 1, wob: 0.6 });
    for (let i = 0; i < 4; i++) {                             // spikes along the back
      const bx2 = cx - d * bw * 0.55 + d * i * bw * 0.3, by3 = bodY - bh * rf(0.88, 0.98);
      sketch([[bx2 - 4, by3 + 3], [bx2, by3 - rf(6, 10)], [bx2 + 4, by3 + 3]], { closed: true, fill: true, width: 1.2, wob: 0.5 });
    }
    clipTo(body, () => {                                      // belly plates, and sometimes scales
      for (let i = 0; i < 4; i++) { const y = hem - 5 - i * 7; sketch([[cx - bw * 0.8, y], [cx, y - 3], [cx + bw * 0.8, y]], { width: 1.1, wob: 0.8 }); }
      if (chance(0.5)) { let k = 0; for (let y = bodY - bh * 0.6; y < hem - 14; y += 7, k++)
        for (let x = cx - bw * 0.8; x < cx + bw * 0.8; x += 8) arc(x + (k % 2 ? 4 : 0), y, 3, Math.PI, Math.PI * 2, { width: 0.9, wob: 0.4, taper: false }); }
    });
  }

  /* ----- the figures: heads, hair, bones, capes, hoods, tails ----- */
  if (is('skeleton')) {
    for (let i = 0; i < 2; i++) line(cx - 3, neckY - 3 - i * 4, cx + 3, neckY - 3 - i * 4, { width: 1.4, wob: 0.5 });   // neck vertebrae
    ribCage(cx, neckY, hem - neckY - 10, bw);
    line(cx, hem - 10, cx, hem - 2, { width: 1.8, wob: 0.6 });
    sketch(blobPts(cx, hem - 3, bw * 0.55, 7, 0.1, 10), { closed: true, width: 1.8, wob: 0.8 });   // the pelvis
    sketch(blobPts(hx, hy, hr * 1.02, hr, 0.05, 14), { closed: true, fill: true, fillColor: pen.base, width: rf(2.2, 3), wob: 1 });   // the skull
    for (const s of [-1, 1]) line(hx + s * hr * 0.85, hy + hr * 0.25, hx + s * hr * 0.55, hy + hr * 0.5, { width: 1.2, wob: 0.6 });   // cheekbones
  }
  if (is('vampire')) {
    for (const s of [-1, 1])                                // the collar, points up beside the head
      sketch([[hx + s * hr * 0.5, neckY + 2], [hx + s * bw * 0.85, neckY - hr * 0.9], [hx + s * bw * 0.55, neckY + 8]], { closed: true, fill: true, width: 1.8, wob: 0.8 });
    if (!caped) clipTo(body, () => {                        // the cape falls in folds
      for (let i = 0, n = ri(2, 4); i < n; i++) {
        const x = cx + (i / (n - 1) * 2 - 1) * bw * 0.55 + rf(-3, 3);
        sketch([[x, neckY + 14], [x + rf(-4, 4), bodY], [x + rf(-6, 6), hem - 4]], { width: rf(1, 1.4), wob: 1.1 });
      }
    });
    sketch(blobPts(hx, hy, hr * rf(0.95, 1.08), hr, 0.05, 14), { closed: true, fill: true, fillColor: pen.base, wash: dab, width: rf(2.2, 3), wob: 1.1 });
    sketch([[hx - hr * 0.95, hy - hr * 0.25], [hx - hr * 0.8, hy - hr * 1.02], [hx + hr * 0.8, hy - hr * 1.02], [hx + hr * 0.95, hy - hr * 0.25], [hx, hy + hr * 0.05]], { closed: true, fill: true, width: 1.4, wob: 0.8 });   // widow's peak
    if (chance(0.5)) for (const s of [-1, 1])               // pointed ears
      sketch([[hx + s * hr * 0.92, hy - hr * 0.1], [hx + s * hr * 1.3, hy - hr * 0.35], [hx + s * hr * 0.88, hy + hr * 0.25]], { closed: true, fill: true, fillColor: pen.base, width: 1.6, wob: 0.7 });
  }
  if (is('human', 'mermaid') && odd !== 'twohead') {
    sketch(blobPts(hx, hy, hr * rf(0.95, 1.1), hr, 0.05, 14), { closed: true, fill: true, fillColor: pen.base, wash: dab, width: rf(2.2, 3), wob: 1.1 });
    hairBits(hx, hy, hr, hair === 'bob' ? 'bob' : hair, hair === 'bob' ? hr * (is('mermaid') ? rf(1.2, 2.1) : rf(0.5, 0.9)) : 0);
    for (const s of [-1, 1]) line(hx + s * 3, neckY - 6, hx + s * 3.5, neckY + 1, { width: 1.3, wob: 0.5 });   // the neck
  }
  if (is('human') && dress === 'none' && odd !== 'ribs' && chance(0.5))   // a neckline on the plain shirt
    for (const s of [-1, 1]) line(hx + s * 4, neckY + 1, hx, neckY + 9, { width: 1.4, wob: 0.6 });
  if (odd === 'twohead') for (const s of [-1, 1]) {         // two heads, one wary, one grim
    const r2 = hr * 0.82, x2 = hx + s * r2 * 0.95, y2 = topY + hr * 0.95;
    sketch(blobPts(x2, y2, r2, r2 * 1.05, 0.05, 12), { closed: true, fill: true, fillColor: pen.base, wash: dab, width: 2.2, wob: 1 });
    if (chance(0.5)) hairBits(x2, y2, r2, 'messy', 0);
    dot(x2 - r2 * 0.3, y2, 1.8); dot(x2 + r2 * 0.3, y2, 1.8);
    for (const e of [-1, 1]) line(x2 + e * r2 * 0.3 - 3, y2 - 6, x2 + e * r2 * 0.3 + 3, y2 - 6 - e * s * 2, { width: 1.3, wob: 0.5 });   // brows
    if (s < 0) line(x2 - 3.5, y2 + r2 * 0.45, x2 + 3.5, y2 + r2 * 0.45, { width: 1.5, wob: 0.5 });
    else arc(x2, y2 + r2 * 0.6, 3.5, Math.PI * 1.2, Math.PI * 1.8, { width: 1.5 });
  }
  if (odd === 'brain') {                                    // the skull open, the brain out
    const cut = hy - hr * 0.35;
    sketch(blobPts(hx, cut - hr * 0.3, hr * 0.72, hr * 0.42, 0.12, 12), { closed: true, fill: true, fillColor: pen.base, width: 1.6, wob: 1 });
    for (let i = 0; i < 5; i++)
      sketch([[hx - hr * 0.44, cut - hr * (0.12 + i * 0.11)], [hx + rf(-5, 5), cut - hr * (0.24 + i * 0.11)], [hx + hr * 0.44, cut - hr * (0.08 + i * 0.11)]], { width: 1, wob: 1.6 });
    line(hx - hr * 0.92, cut, hx + hr * 0.92, cut, { width: 1.6, wob: 1.2 });
    if (chance(0.6)) for (const s of [-1, 1]) {             // two drops of sweat, flung off
      const dx2 = hx + s * hr * rf(1.15, 1.4), dy2 = cut + rf(-6, 6);
      sketch([[dx2, dy2 - 3], [dx2 + s * 2, dy2 + 2], [dx2 - s * 1, dy2 + 3]], { closed: true, width: 1, wob: 0.4 });
    }
  }
  if (odd === 'ribs') {                                     // the coat held open on a ribcage
    for (const s of [-1, 1]) {
      line(hx + s * 4, neckY + 2, cx + s * bw * 0.8, hem - 6, { width: 2, wob: 1 });
      line(hx + s * 6, neckY + 6, cx + s * bw * 0.84, hem - 4, { width: 1, wob: 1 });   // the coat's lining
    }
    ribCage(cx, neckY + 8, hem - neckY - 18, bw * 0.5);
  }
  if (is('reaper')) {
    sketch(blobPts(fx, fy + 2, bw * 0.3, bw * 0.34, 0.06, 12), { closed: true, fill: true, width: 1.6, wob: 0.8 });   // the dark inside the hood
    dot(fx - 5, fy, rf(1.9, 2.5), pen.base); dot(fx + 5, fy + rf(-1, 1), rf(1.7, 2.5), pen.base);
    arc(fx, fy + 3, bw * 0.42, Math.PI * 0.92, Math.PI * 2.08, { width: 2, wob: 1 });   // the hood's rim
    arc(fx, fy + 4, bw * 0.5, Math.PI * 1.05, Math.PI * 1.95, { width: 1.1, wob: 1 });  // and its folded edge
    clipTo(body, () => {                                    // the robe falls in folds
      for (let i = 0, n = ri(2, 3); i < n; i++) {
        const x = cx + (n === 1 ? 0 : i / (n - 1) * 2 - 1) * bw * 0.45 + rf(-4, 4);
        sketch([[x, fy + bw * 0.5], [x + rf(-5, 5), bodY + bh * 0.4], [x + rf(-7, 7), hem - 4]], { width: rf(1, 1.4), wob: 1.2 });
      }
    });
    const d = look >= 0 ? 1 : -1, sx2 = cx + d * bw * 1.12, by2 = topY - rf(6, 16);
    line(sx2, by2, sx2 + d * 3, hem + rf(2, 10), { width: 2.6, wob: 0.8 });             // the scythe
    sketch([[sx2 + d * 2, by2 - 2], [sx2 - d * bw * rf(0.6, 0.75), by2 + 3], [sx2 - d * bw * 0.45, by2 + rf(13, 18)], [sx2 - d * 3, by2 + 6]], { closed: true, fill: true, width: 1.6, wob: 0.8 });
    sketch([[sx2 - d * 4, by2 + 8], [sx2 - d * bw * 0.4, by2 + rf(14, 18)]], { width: 1, wob: 0.7 });   // the blade's back edge
    line(cx + d * bw * 0.75, bodY - 6, sx2, bodY - 2, { width: 2, wob: 1 });            // a sleeve reaches out
    for (let i = -1; i <= 1; i++) line(sx2 - d * 2, bodY - 4 + i * 2.5, sx2 + d * 4, bodY - 3 + i * 2.5, { width: 1.1, wob: 0.4 });   // bone fingers round the staff
  }
  if (is('mermaid')) {
    const d = mer.d, sway = mer.tailH * 0.45;
    /* the bust: bare with a dot, in the Venus manner — or cupped in scallop shells */
    const shell = chance(0.45);
    for (const s of [-1, 1]) {
      const bx2 = cx + s * mer.bust * 1.02;
      sketch(blobPts(bx2, mer.bustY, mer.bust, mer.bust * 0.95, 0.06, 12), { closed: true, width: 1.6, wob: 0.8 });
      if (shell) for (let i = -1; i <= 1; i++) line(bx2 + i * mer.bust * 0.35, mer.bustY + mer.bust * 0.8, bx2 + i * mer.bust * 0.55, mer.bustY - mer.bust * 0.55, { width: 1, wob: 0.6 });   // the shell's ribs
      else if (chance(0.75)) dot(bx2 + s * 1, mer.bustY + 1.5, 1.2);
    }
    /* the tail: hips flaring from the waist, then the long taper */
    const hips = mer.waistW * rf(1.35, 1.55);
    const tw = t => t < 0.25 ? mer.waistW + (hips - mer.waistW) * (t / 0.25) : hips * (1 - 0.85 * (t - 0.25) / 0.75);
    const tpts = [];
    for (let i = 0; i <= 6; i++) { const t = i / 6; tpts.push([cx + d * sway * t * t - tw(t), hem + mer.tailH * t]); }
    for (let i = 6; i >= 0; i--) { const t = i / 6; tpts.push([cx + d * sway * t * t + tw(t), hem + mer.tailH * t]); }
    const xt = cx + d * sway, yt = hem + mer.tailH;
    for (const s of [-1, 1]) {                              // the fin, two lobes with rays
      sketch([[xt, yt - 2], [xt + s * 11 + d * 7, yt + rf(10, 16)], [xt + s * 4 + d * 2, yt + 3]], { closed: true, fill: true, fillColor: pen.base, width: 1.8, wob: 0.8 });
      line(xt + s * 2 + d * 2, yt, xt + s * 8 + d * 5, yt + 9, { width: 0.9, wob: 0.5 });
    }
    const tailTint = dab || (chance(0.55) ? { color: SEA, alpha: rf(0.35, 0.55), grow: 1, mode: 'flat' } : null);
    sketch(tpts, { closed: true, fill: true, fillColor: pen.base, wash: tailTint, width: rf(2.2, 3), wob: 1.1 });
    if (chance(0.85)) clipTo(tpts, () => {                  // scales
      for (let y = hem + 5; y < yt - 3; y += 6.5)
        for (let x = cx - hips - sway; x < cx + hips + sway; x += 8) arc(x + (y % 13 ? 4 : 0), y, 3.2, Math.PI, Math.PI * 2, { width: 1, wob: 0.4, taper: false });
    });
    shade(tpts, cx + (SHADE < 0 ? -hips - sway : 0) - 4, hem, cx + (SHADE < 0 ? 0 : hips + sway) + 4, yt + 2);
    if (chance(0.4)) for (const s of [-1, 1])               // small fins at the hip
      sketch([[cx + s * hips * 0.98, hem + mer.tailH * 0.22], [cx + s * (hips + 9), hem + mer.tailH * 0.22 + rf(6, 12)], [cx + s * hips * 0.82, hem + mer.tailH * 0.32]], { closed: true, width: 1.3, wob: 0.6 });
    if (chance(0.5)) dot(cx, hem - 8, 1.3);                 // a navel
    for (const s of [-1, 1]) sketch([[hx + s * 3, neckY + 1], [cx + s * bw * 0.7, neckY + 4]], { width: 1, wob: 0.6 });   // collarbones
    if (chance(0.4)) for (let i = 0, n = ri(2, 4); i < n; i++) arc(cx - d * bw * rf(1.3, 1.9), bodY + rf(-30, 30), rf(2, 4.5), 0, Math.PI * 2, { width: 1.1, wob: 0.5 });   // bubbles
  }
  if (is('hydra')) {
    const spread = bw * 0.55;
    clipTo(body, () => {                                    // belly plates
      for (let i = 0; i < 4; i++) { const y = hem - 5 - i * 7; sketch([[cx - bw * 0.8, y], [cx, y - 3], [cx + bw * 0.8, y]], { width: 1.1, wob: 0.8 }); }
    });
    for (let i = 0; i < hyd.n; i++) {
      const t = (i / (hyd.n - 1)) * 2 - 1;
      const bx = cx + t * spread * 0.6, hx2 = cx + t * spread + rf(-4, 4);
      const hy2 = bodY - bh - hyd.neckH * rf(0.72, 1.0) + Math.abs(t) * 8;
      const nw = rf(6.5, 8.5);
      sketch([[bx - nw, bodY - bh * 0.3], [hx2 - nw * 0.9, hy2 + hyd.hr * 0.5], [hx2, hy2], [hx2 + nw * 0.9, hy2 + hyd.hr * 0.5], [bx + nw, bodY - bh * 0.2]], { fill: true, fillColor: pen.base, wash: dab, width: 2, wob: 1 });
      for (let k = 1; k < 4; k++) {                         // ridges along the throat
        const ty2 = hy2 + hyd.hr * 0.5 + (bodY - bh * 0.3 - hy2 - hyd.hr * 0.5) * k / 4;
        line(hx2 - nw * 0.6 + (bx - hx2) * k / 4, ty2, hx2 + nw * 0.6 + (bx - hx2) * k / 4, ty2 + 1, { width: 1, wob: 0.6 });
      }
      sketch(blobPts(hx2, hy2, hyd.hr * rf(1.1, 1.3), hyd.hr, 0.06, 12), { closed: true, fill: true, fillColor: pen.base, wash: dab, width: 2, wob: 1 });
      dot(hx2 - hyd.hr * 0.4, hy2, 1.7); dot(hx2 + hyd.hr * 0.4, hy2, 1.7);
      if (chance(0.6)) for (const e of [-1, 1]) line(hx2 + e * hyd.hr * 0.4 - 3, hy2 - 5, hx2 + e * hyd.hr * 0.4 + 3, hy2 - 5 - e * 2, { width: 1.2, wob: 0.5 });   // knitted brows
      const md = wpick({ smile: 1.2, frown: 1.4, tongue: 1, o: 0.8, teeth: 1 }), mY2 = hy2 + hyd.hr * 0.45;
      if (md === 'smile') arc(hx2, mY2 - 2, 4, 0.3, Math.PI - 0.3, { width: 1.6 });
      else if (md === 'frown') arc(hx2, mY2 + 3, 4, Math.PI * 1.2, Math.PI * 1.8, { width: 1.6 });
      else if (md === 'o') sketch(blobPts(hx2, mY2, 2, 2.4, 0.1, 8), { closed: true, width: 1.3 });
      else if (md === 'teeth') {
        line(hx2 - 5, mY2, hx2 + 5, mY2, { width: 1.5, wob: 0.5 });
        for (const e of [-1, 1]) sketch([[hx2 + e * 3 - 1.5, mY2], [hx2 + e * 3, mY2 + 3.5], [hx2 + e * 3 + 1.5, mY2]], { closed: true, fill: true, fillColor: pen.base, width: 0.9, wob: 0.3 });
      }
      else { line(hx2 - 3, mY2, hx2 + 3, mY2, { width: 1.6 }); line(hx2, mY2, hx2 + rf(-2, 2), mY2 + 5, { width: 1.3 }); dot(hx2, mY2 + 6, 1.2); }
      if (chance(0.3)) for (const s of [-1, 1]) sketch([[hx2 + s * hyd.hr * 0.6, hy2 - hyd.hr * 0.6], [hx2 + s * hyd.hr * 0.9, hy2 - hyd.hr * 1.4], [hx2 + s * hyd.hr * 0.95, hy2 - hyd.hr * 0.4]], { closed: true, fill: true, width: 1.1, wob: 0.5 });   // tiny horns
    }
  }
  if (is('spider')) {
    if (thread) line(cx + rf(-2, 2), topY - 4, cx, bodY - bh + 4, { width: 1.2, wob: 1.2 });
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {  // four bent legs a side, joints marked
      const y0 = bodY - bh * 0.25 + i * bh * 0.28, x0 = cx + s * bw * 0.85;
      const kx = x0 + s * rf(12, 18), ky = y0 - rf(8, 14);
      sketch([[x0, y0], [kx, ky], [kx + s * rf(4, 9), ky + rf(16, 26)]], { width: rf(1.8, 2.4), wob: 0.9 });
      dot(kx, ky, 1.4);
    }
    if (chance(0.6)) {                                      // a mark on the abdomen
      const ay = bodY + bh * 0.45;
      sketch([[cx - 4, ay - 5], [cx + 4, ay - 5], [cx - 4, ay + 5], [cx + 4, ay + 5]], { closed: true, fill: true, width: 1, wob: 0.5 });
    }
  }

  /* ----- the black cat: head, ears, eyes shining out of the ink ----- */
  if (is('cat')) {
    const d = catP.d, eyeCol = chance(0.55) ? ACCENTS[0] : pen.base;
    function catEye(x, y, w) {
      sketch([[x - w, y], [x, y - w * 0.7], [x + w, y], [x, y + w * 0.7]], { closed: true, fill: true, fillColor: eyeCol, color: eyeCol, width: 1, wob: 0.4, taper: false });
      line(x + look * w * 0.2, y - w * 0.5, x + look * w * 0.2, y + w * 0.5, { width: 1.6, wob: 0.3 });   // the slit
    }
    if (catP.pose === 'sit') {
      const hr2 = catP.hr, hy2 = catP.hy;
      for (const s of [-1, 1]) sketch([[fx + s * hr2 * 0.85, hy2 - hr2 * 0.35], [fx + s * hr2 * rf(0.75, 0.95), hy2 - hr2 * rf(1.35, 1.6)], [fx + s * hr2 * 0.25, hy2 - hr2 * 0.85]], { closed: true, fill: true, width: 1.6, wob: 0.7 });   // ears
      sketch(blobPts(fx, hy2, hr2 * 1.05, hr2, 0.05, 14), { closed: true, fill: true, width: 2, wob: 1 });   // the head
      if (chance(0.35)) sketch(blobPts(cx + d * 2, bodY - bh * 0.45, bw * 0.26, bh * 0.32, 0.1, 12), { closed: true, fill: true, fillColor: pen.base, color: pen.base, width: 1, wob: 1 });   // a white bib under the chin
      for (const s of [-1, 1]) {                            // slim front legs, standing clear of the body on the paper
        const lx2 = cx + s * bw * 0.27, lw2 = bw * rf(0.12, 0.15);
        sketch([[lx2 - lw2, bodY - bh * rf(0.05, 0.2)], [lx2 + lw2, bodY - bh * rf(0.05, 0.2)], [lx2 + lw2 * 0.8, hem + legH - 2], [lx2 - lw2 * 0.8, hem + legH - 2]], { closed: true, fill: true, fillColor: pen.ink, color: pen.base, width: 1.6, wob: 0.8 });
        sketch(blobPts(lx2 + s * 2, hem + legH - 3, lw2 * 1.6, 4.5, 0.1, 8), { closed: true, fill: true, fillColor: chance(0.4) ? pen.base : pen.ink, width: 1.3, wob: 0.6 });   // a paw, sometimes in a white sock
      }
      for (const s of [-1, 1]) catEye(fx + s * hr2 * 0.44, fy - hr2 * 0.05, hr2 * 0.34);
      if (mood === 'grumpy') for (const s of [-1, 1]) line(fx + s * hr2 * 0.2, fy - hr2 * 0.45, fx + s * hr2 * 0.65, fy - hr2 * 0.32, { width: 1.4, wob: 0.4, color: pen.base });
      sketch([[fx - 2, fy + hr2 * 0.32], [fx + 2, fy + hr2 * 0.32], [fx, fy + hr2 * 0.42]], { closed: true, fill: true, fillColor: pen.base, color: pen.base, width: 0.8, wob: 0.3 });   // the nose
      if (chance(0.5)) for (const s of [-1, 1]) arc(fx + s * 3.5, fy + hr2 * 0.52, 3.5, s > 0 ? 0.35 : Math.PI * 0.65 - 0.35, s > 0 ? Math.PI * 0.35 + 0.35 : Math.PI - 0.35, { width: 1, wob: 0.3, color: pen.base });   // the w of the mouth
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++)
        line(fx + s * hr2 * 0.78, fy + hr2 * 0.2 + (i - 1) * 4, fx + s * (hr2 * 0.78 + rf(13, 20)), fy + hr2 * 0.25 + (i - 1) * 6, { width: 1.1, wob: 0.7 });   // whiskers
      if (chance(0.3)) {                                    // a collar, and its bell
        const ny2 = hy2 + hr2 * 0.85;
        line(fx - hr2 * 0.8, ny2, fx + hr2 * 0.8, ny2 + rf(-2, 2), { width: 4, wob: 0.6, color: pick(ACCENTS), taper: false });
        dot(fx, ny2 + 5, 2.4, pen.base);
      }
    } else {
      const aw = catP.aw, ah = catP.ah;
      for (const [ex4, ey4] of [[0.66, 0.8], [0.5, 0.76]])   // two ears on the lowered head
        sketch([[cx + d * aw * (ex4 - 0.06), hem - ah * (ey4 - 0.04)], [cx + d * aw * ex4, hem - ah * ey4 - rf(8, 13)], [cx + d * aw * (ex4 + 0.05), hem - ah * (ey4 - 0.05)]], { closed: true, fill: true, width: 1.4, wob: 0.6 });
      for (let i = 0, n = ri(6, 9); i < n; i++) {            // hackles up along the arch
        const t = 0.15 + (i / n) * 0.5, bx4 = cx + d * aw * (0.35 - t), by4 = hem - ah * (0.78 + 0.22 * Math.sin(Math.PI * t / 0.65));
        line(bx4, by4, bx4 - d * rf(2, 5), by4 - rf(5, 9), { width: rf(1.1, 1.6), wob: 0.6 });
      }
      for (const k of [-1, 1]) catEye(fx + d * (2 + k * catP.aw * 0.055), fy, 5.2);   // both eyes, the doodle way
      sketch([[cx + d * aw * 0.7, hem - ah * 0.58], [cx + d * aw * 0.76, hem - ah * 0.56]], { width: 1.2, wob: 0.4, color: pen.base });   // a hissing muzzle line
      for (let i = 0; i < 3; i++) line(cx + d * aw * 0.72, hem - ah * (0.56 - i * 0.025), cx + d * aw * 0.72 + d * rf(12, 18), hem - ah * (0.57 - i * 0.045), { width: 1.1, wob: 0.7 });   // whiskers
      for (const lx of [0.47, 0.33, -0.26, -0.42]) {        // four legs of its own, paper between them
        const x1 = cx + d * aw * lx, splay = d * Math.sign(lx) * rf(0, 2.5), w3 = rf(3, 4);
        sketch([[x1 - w3, hem - ah * 0.3], [x1 + w3, hem - ah * 0.3], [x1 + w3 * 0.9 + splay, hem - 2], [x1 - w3 * 0.9 + splay, hem - 2]], { closed: true, fill: true, width: 1.4, wob: 0.6 });
        sketch(blobPts(x1 + splay, hem - 2, w3 * 1.4, 3.2, 0.1, 8), { closed: true, fill: true, width: 1.1, wob: 0.5 });   // a small paw
      }
    }
  }

  /* ----- legs and feet ----- */
  if (legStyle === 'stick') for (const s of [-1, 1]) {
    const lx = cx + s * bw * (is('imp') ? 0.45 : 0.35), k = s * rf(-2, 4);
    const ky = hem - 4 + legH * rf(0.45, 0.6), kx = lx + k * 0.5 + s * rf(0, 3);
    sketch([[lx, hem - 4], [kx, ky], [lx + k, hem + legH]], { width: rf(2, 2.8), wob: 0.9 });
    if (is('skeleton')) { arc(kx, ky, 2.2, 0, Math.PI * 2, { width: 1.1, wob: 0.4 }); }   // a knee of bone
    const ftx = lx + k + s * rf(4, 7), fty = hem + legH + rf(-1, 1), fw = rf(8, 13) * (is('imp') ? 1.25 : 1), fh = rf(3.5, 5.5);
    const shoe = is('human') && chance(0.5);
    sketch(blobPts(ftx, fty, fw, fh, 0.1, 10), { closed: true, fill: true, fillColor: shoe ? pen.ink : pen.base, width: 1.8, wob: 0.7 });
    if (!shoe && !is('skeleton') && chance(0.6)) for (let i = 1; i <= 2; i++)   // toes
      line(ftx + s * fw * (0.15 + i * 0.22), fty - fh * 0.7, ftx + s * fw * (0.2 + i * 0.22), fty + fh * 0.3, { width: 1, wob: 0.4 });
  }
  if (legStyle === 'nub') for (const s of [-1, 1]) {
    const lx = cx + s * bw * (is('longneck', 'hydra') ? 0.55 : 0.4);
    sketch([[lx - 6, hem - 3], [lx - 5, hem + legH], [lx + 5, hem + legH], [lx + 6, hem - 3]], { closed: true, fill: true, fillColor: pen.base, width: 2, wob: 0.8 });
    if (chance(0.6)) for (let i = -1; i <= 1; i += 2) line(lx + i * 2.5, hem + legH - 3, lx + i * 2.5, hem + legH, { width: 1, wob: 0.3 });   // toenails
  }
  if (legStyle === 'toes') for (const s of [-1, 1])
    sketch(blobPts(cx + s * bw * 0.55, hem + 2, rf(8, 12), rf(4, 6), 0.1, 8), { closed: true, fill: true, fillColor: pen.base, width: 1.8, wob: 0.7 });
  if (legStyle === 'paws') for (const s of [-1, 1]) {
    const px = cx + s * bw * 0.45, pw = rf(15, 21), ph = rf(9, 13);
    sketch(blobPts(px, hem - ph * 0.4, pw, ph, 0.08, 12), { closed: true, fill: true, fillColor: pen.base, width: 2.2, wob: 0.9 });
    stipple(px, hem - ph * 0.4, pw * 0.55, ph * 0.45, ri(4, 8), 1.1);        // dotted soles
  }

  /* ----- arms, and anything held ----- */
  const armY = figure ? neckY + 6 : is('imp') ? bodY : is('tall') ? topY + (hem - topY) * 0.48 : bodY + bh * 0.05;
  const armW = is('pear') ? bw * 0.8 : bw;
  const hands = [];
  if (arms !== 'none') for (const s of [-1, 1]) {
    const x0 = cx + s * armW * 0.95, len = rf(20, 34) * (is('imp') ? 1.2 : 1);
    const [hx2, hy2] = arms === 'up' ? [x0 + s * len * 0.5, armY - len]
                     : arms === 'out' ? [x0 + s * len * 0.9, armY - len * 0.15]
                     : [x0 + s * len * 0.25, armY + len * 0.9];
    sketch([[x0, armY], [x0 + (hx2 - x0) * 0.5 + s * rf(0, 4), (armY + hy2) / 2], [hx2, hy2]], { width: rf(2, 2.6), wob: 1 });
    if (is('skeleton')) arc(x0 + (hx2 - x0) * 0.5 + s * 2, (armY + hy2) / 2, 2, 0, Math.PI * 2, { width: 1, wob: 0.4 });   // an elbow of bone
    hands.push([hx2, hy2, s]);
    if (is('skeleton') || chance(0.8)) for (let i = -1; i <= 1; i++)   // three-fingered
      line(hx2, hy2, hx2 + s * 5 + i * 2.5, hy2 + (arms === 'up' ? -5 : 5) + i * 2, { width: 1.4, wob: 0.6 });
    else dot(hx2, hy2, 2.6);
  }
  if (held && hands.length) {
    const [hx2, hy2, s] = hands[look >= 0 ? hands.length - 1 : 0];
    pen.ctx.save(); pen.ctx.translate(hx2, hy2); pen.ctx.rotate(s * rf(-0.5, -0.2));
    if (held === 'dagger') {
      line(-6, 0, 6, 0, { width: 2.2, wob: 0.4 });                            // crossguard
      line(0, 2, 0, 9, { width: 3, wob: 0.4 });                               // grip
      sketch([[-3.5, -2], [0, -rf(16, 24)], [3.5, -2]], { closed: true, width: 1.6, wob: 0.6 });
      line(0, -3, 0, -12, { width: 0.9, wob: 0.4 });                          // the fuller
      if (chance(0.5)) { dot(4, -6, 1.3, BLOOD); dot(5.5, -1, 1.4, BLOOD); dot(6.5, 4, 1.2, BLOOD); }   // blood runs off the edge
    } else if (held === 'head') {                           // a severed head, carried by the hair
      line(0, 0, rf(-2, 2), 8, { width: 1.2, wob: 0.9 });
      sketch(blobPts(0, 17, rf(7, 9), rf(8, 10), 0.08, 12), { closed: true, fill: true, fillColor: pen.base, width: 1.8, wob: 0.9 });
      if (chance(0.5)) hairBits(0, 15, 8, 'messy', 0);
      for (const e of [-1, 1]) { line(e * 3.5 - 2, 15, e * 3.5 + 2, 19, { width: 1.1, wob: 0.4 }); line(e * 3.5 - 2, 19, e * 3.5 + 2, 15, { width: 1.1, wob: 0.4 }); }   // eyes crossed out
      line(-3, 23, 3, 23 + rf(-1, 1), { width: 1.2, wob: 0.5 });
      line(-4, 26, 4, 26 + rf(-1, 1), { width: 1.6, wob: 0.7, color: BLOOD, taper: false });   // the stump
      for (let i = 0; i < 2; i++) dot(rf(-4, 4), 29 + rf(0, 5), 1.4, BLOOD);  // it drips
    } else {
      line(0, 0, 2, -14, { width: 1.6, wob: 0.8 });
      const fpw = chance(0.6) ? { color: pick([PINK, ACCENTS[0], ACCENTS[4]]), alpha: 0.6, grow: 1, mode: 'flat' } : null;
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; sketch(blobPts(2 + Math.cos(a) * 5, -18 + Math.sin(a) * 5, 3.5, 3.5, 0.1, 8), { closed: true, wash: fpw, width: 1.1, wob: 0.4, taper: false }); }
      dot(2, -18, 2.2);
    }
    pen.ctx.restore();
  }

  /* ----- the face ----- */
  const faceStd = !is('skeleton', 'reaper', 'hydra', 'spider', 'eyeball', 'dragon', 'cat') && odd !== 'twohead' && odd !== 'blank';
  const gap = rf(13, 19) * fs, exL = fx - gap, exR = fx + gap;
  const eyeY = fy, pr = look * 0.35;
  function ringEye(x, r, y = eyeY) {
    arc(x, y, r, 0, Math.PI * 2, { width: 1.8, wob: 0.9 });
    if (r > 4.5 && chance(0.55)) arc(x + pr * r * 0.4, y, r * 0.55, 0, Math.PI * 2, { width: 1, wob: 0.6 });   // an iris
    dot(x + pr * r + rf(-1, 1), y + rf(-1, 1.5), Math.max(1.4, r * rf(0.22, 0.34)));
    if (chance(0.4)) arc(x, y - r * 0.12, r * 1.02, Math.PI * 1.12, Math.PI * 1.88, { width: 1.3, wob: 0.7 });   // a heavy upper lid
    if (chance(0.3)) line(x - r * 0.6, y + r * 1.4, x + r * 0.6, y + r * 1.5, { width: 0.9, wob: 0.8 });         // a tired underline
  }
  if (faceStd) {
    if (dread) {                                            // the scary eyes
      const dr = rf(5, 7.5) * fs;
      if (dreadEye === 'hollow') for (const [x, m] of [[exL, 1], [exR, rf(0.8, 1.25)]]) {
        sketch(blobPts(x, eyeY, dr * m, dr * m * 1.15, 0.08, 10), { closed: true, fill: true, width: 1.4, wob: 0.7 });
        if (chance(0.5)) dot(x + 1, eyeY - 1, 1, pen.base); // a pinprick of light deep in the socket
      }
      else if (dreadEye === 'stare') for (const [x, m] of [[exL, 1], [exR, rf(0.9, 1.15)]]) {
        arc(x, eyeY, dr * m * 1.25, 0, Math.PI * 2, { width: 1.6, wob: 0.8 });
        dot(x + rf(-1, 1), eyeY + rf(-1, 1), 1.3);          // a pupil far too small for the eye
        for (let i = 0; i < 3; i++) { const a = rf(0, 6.28); line(x + Math.cos(a) * dr * 1.6, eyeY + Math.sin(a) * dr * 1.6, x + Math.cos(a) * dr * 2.1, eyeY + Math.sin(a) * dr * 2.1, { width: 0.8, wob: 0.4 }); }
      }
      else if (dreadEye === 'mismatch') {
        sketch(blobPts(exL, eyeY, dr, dr * 1.15, 0.08, 10), { closed: true, fill: true, width: 1.4, wob: 0.7 });
        arc(exR, eyeY, dr * 1.2, 0, Math.PI * 2, { width: 1.6, wob: 0.8 }); dot(exR, eyeY, 1.2);
      }
      else for (const x of [exL, exR]) for (const s of [-1, 1]) line(x - 3.5, eyeY - s * 3.5, x + 3.5, eyeY + s * 3.5, { width: 1.6, wob: 0.5 });   // crossed out
    }
    else if (eyeKind === 'cyclops') ringEye(fx, rf(10, 15) * fs);
    else if (eyeKind === 'flower') for (const x of [exL, exR]) {
      const r = rf(6, 8) * fs;
      ringEye(x, r);
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.5; sketch(blobPts(x + Math.cos(a) * r * 1.55, eyeY + Math.sin(a) * r * 1.55, r * 0.55, r * 0.4, 0.1, 8), { closed: true, width: 1.1, wob: 0.5, taper: false }); }
    }
    else if (eyeKind === 'dot') { const s2 = rf(0.8, 1.3); dot(exL, eyeY, rf(2.2, 3.4) * fs); dot(exR, eyeY, rf(2.2, 3.4) * fs * s2); }
    else if (eyeKind === 'lids') for (const x of [exL, exR]) arc(x, eyeY - 2, rf(4.5, 7) * fs, 0.15, Math.PI - 0.15, { width: 2 });
    else { const s2 = rf(0.72, 1.28); ringEye(exL, (eyeKind === 'big' ? rf(8, 12) : rf(5, 7.5)) * fs); ringEye(exR, (eyeKind === 'big' ? rf(8, 12) : rf(5, 7.5)) * fs * s2); }
    if (odd === 'third') ringEye(fx, rf(3.5, 5.5), eyeY - rf(9, 13));   // one more, above

    if (mood === 'grumpy' || (mood === 'surprised' && eyeKind !== 'cyclops') || chance(0.45)) {
      const by = eyeY - rf(10, 15) * fs - (mood === 'surprised' ? 4 : 0);
      for (const [ex, s] of eyeKind === 'cyclops' ? [[fx, 1]] : [[exL, -1], [exR, 1]]) {
        if (mood === 'grumpy') line(ex - s * 7 * fs, by + 6, ex + s * 7 * fs, by, { width: 2.4 });
        else arc(ex, by + 3, rf(6, 9) * fs, Math.PI * 1.15, Math.PI * 1.85, { width: 1.8 });
      }
    }
    if (chance(0.5)) {                                      // a nose, more often than not
      const nk = wpick({ dot: 1, tri: 1, nostrils: 0.8 });
      if (nk === 'dot') dot(fx, eyeY + rf(6, 9) * fs, 1.8);
      else if (nk === 'nostrils') for (const s of [-1, 1]) dot(fx + s * 3 * fs, myY - 6 * fs, 1.2);
      else sketch([[fx - 3 * fs, myY - 7 * fs], [fx + 3 * fs, myY - 7 * fs], [fx, myY - 3 * fs]], { closed: true, width: 1.3, wob: 0.5 });
    }

    if (is('vampire')) {                                    // a thin line of a mouth, and the fangs
      const mw = rf(6, 9);
      line(fx - mw, myY, fx + mw, myY + rf(-1, 1), { width: 1.8, wob: 0.6 });
      for (const s of [-1, 1]) sketch([[fx + s * mw * 0.55 - 2.2, myY], [fx + s * mw * 0.5, myY + rf(5, 8)], [fx + s * mw * 0.55 + 2.2, myY]], { closed: true, fill: true, fillColor: pen.base, width: 1.2, wob: 0.4 });
    } else if (dread) {                                     // the scary mouths
      if (dreadMouth === 'scream') {
        sketch(blobPts(fx, myY + 2, rf(5, 8) * fs, rf(7, 11) * fs, 0.08, 12), { closed: true, fill: true, width: 1.6, wob: 0.7 });
        for (const s of [-1, 1]) sketch([[fx + s * 3.5 - 1.8, myY - 4 * fs], [fx + s * 3.5, myY + rf(0, 2)], [fx + s * 3.5 + 1.8, myY - 4 * fs]], { closed: true, fill: true, fillColor: pen.base, width: 0.9, wob: 0.3 });
      } else if (dreadMouth === 'grin') {                   // far too many teeth
        const gw = rf(12, 18) * fs, gy2 = myY - gw * 0.15;
        arc(fx, gy2, gw, 0.35, Math.PI - 0.35, { width: 2, wob: 0.7 });
        for (let i = -2; i <= 2; i++) { const tx2 = fx - Math.sin(i * 0.28) * gw, ty2 = gy2 + Math.cos(i * 0.28) * gw; line(tx2, ty2 - 3.5, tx2, ty2 + 2.5, { width: 1.1, wob: 0.4 }); }
      } else if (dreadMouth === 'stitched') {
        line(fx - 8 * fs, myY, fx + 8 * fs, myY + rf(-1, 1), { width: 1.8, wob: 0.7 });
        for (let i = -1; i <= 1; i++) line(fx + i * 5 * fs, myY - 3, fx + i * 5 * fs + 1, myY + 3, { width: 1.1, wob: 0.4 });
      } else line(fx - rf(4, 8) * fs, myY, fx + rf(4, 8) * fs, myY + rf(-2, 2), { width: 2, wob: 0.7 });
    } else if (mood === 'happy') {
      const r = rf(5, 9) * fs;                              // a measured smile
      arc(fx, myY - r * 0.4, r, 0.25, Math.PI - 0.25, { width: 2 });
      if (chance(0.15)) sketch(blobPts(fx + rf(-3, 3), myY + r * 0.5, 4.5 * fs, 6 * fs, 0.1, 8), { closed: true, fill: true, fillColor: pen.base, wash: { color: PINK, alpha: 0.8, grow: 1, mode: 'flat' }, width: 1.3, wob: 0.5 });
    } else if (mood === 'grumpy') arc(fx, myY + 8 * fs, rf(7, 10) * fs, Math.PI * 1.2, Math.PI * 1.8, { width: 2 });
    else if (mood === 'surprised') sketch(blobPts(fx, myY, rf(4, 7) * fs, rf(5, 8) * fs, 0.1, 10), { closed: true, fill: true, width: 1.5 });
    else if (mood === 'mischief') {
      const gw = rf(16, 24) * fs;                           // the toothy grin
      arc(fx, myY - gw * 0.35, gw, 0.35, Math.PI - 0.35, { width: 2.2 });
      for (let i = 0; i < 3; i++) {
        const tx2 = fx + (i - 1) * gw * 0.5, ty2 = myY - gw * 0.35 + Math.cos((i - 1) * 0.55) * gw - 1;
        sketch([[tx2 - 3.5 * fs, ty2], [tx2, ty2 + rf(5, 8) * fs], [tx2 + 3.5 * fs, ty2]], { closed: true, fill: true, fillColor: pen.base, width: 1.3, wob: 0.4 });
      }
    } else {                                                // deadpan, sleepy
      if (chance(0.3)) sketch(blobPts(fx, myY, 2.6 * fs, 3 * fs, 0.1, 8), { closed: true, width: 1.5, wob: 0.5 });   // a tiny o
      else line(fx - rf(4, 8) * fs, myY, fx + rf(4, 8) * fs, myY + rf(-2, 2), { width: 2, wob: 0.7 });
    }
    if (is('mermaid') && !dread && eyeKind !== 'lids') for (const [x, s] of [[exL, -1], [exR, 1]])
      for (let i = 0; i < 2; i++) line(x + s * 4, eyeY - 4 - i * 2, x + s * 7.5, eyeY - 6 - i * 2.5, { width: 0.9, wob: 0.4 });   // lashes
    if (gear === 'cat' && chance(0.7)) for (const s of [-1, 1]) for (let i = 0; i < 3; i++)
      line(fx + s * gap * 1.35, eyeY + 6 + (i - 1) * 4, fx + s * (gap * 1.35 + rf(12, 20)), eyeY + 7 + (i - 1) * 6, { width: 1.2, wob: 0.8 });
    if (chance(0.15)) for (const s of [-1, 1]) stipple(fx + s * gap * 1.5, eyeY + 9 * fs, 5, 3, ri(3, 5), 0.9);   // freckles
    if (!dread && chance(0.18)) for (const s of [-1, 1])    // a faint blush
      washPts(blobPts(fx + s * gap * 1.45, eyeY + 10 * fs, 6, 4, 0.1, 8), { color: PINK, alpha: rf(0.35, 0.5), grow: 1, mode: 'flat' });
    if (is('human', 'vampire') && chance(0.18)) {           // a stitched scar
      const sx3 = fx + pick([-1, 1]) * hr * 0.55, sy3 = hy + rf(-hr * 0.3, hr * 0.3);
      line(sx3 - 4, sy3 - 5, sx3 + 4, sy3 + 5, { width: 1.2, wob: 0.6 });
      for (let i = 0; i < 3; i++) line(sx3 - 5 + i * 3, sy3 - 4 + i * 3 + 2, sx3 - 1 + i * 3, sy3 - 6 + i * 3, { width: 1, wob: 0.4 });
    }
  }
  if (is('skeleton')) {                                     // the skull's own face
    dot(fx - hr * 0.42, hy - hr * 0.05, hr * 0.24); dot(fx + hr * 0.42, hy - hr * 0.05, hr * 0.24 * rf(0.85, 1.15));
    sketch([[fx - 2.5, hy + hr * 0.28], [fx + 2.5, hy + hr * 0.28], [fx, hy + hr * 0.45]], { closed: true, fill: true, width: 1, wob: 0.4 });
    const ty = hy + hr * 0.68;
    line(fx - hr * 0.5, ty, fx + hr * 0.5, ty, { width: 1.6, wob: 0.6 });
    for (let i = -1; i <= 1; i++) line(fx + i * hr * 0.24, ty - 3, fx + i * hr * 0.24, ty + 3, { width: 1.2, wob: 0.4 });
    if (chance(0.3)) line(hx + hr * 0.3, hy - hr * 0.75, hx + hr * 0.55, hy - hr * 0.35, { width: 1.1, wob: 1.2 });   // a crack
  }
  if (is('spider')) {                                       // six eyes and two little fangs
    for (let i = 0; i < 4; i++) {
      const xx = fx + (i - 1.5) * 9 * fs;
      if (i === 1 || i === 2) ringEye(xx, rf(4, 5.5) * fs); else dot(xx, eyeY - 2, rf(1.6, 2.4));
    }
    for (const s of [-1, 1]) dot(fx + s * 5 * fs, eyeY - 8 * fs, 1.3);
    for (const s of [-1, 1]) sketch([[fx + s * 5 - 2, myY], [fx + s * 5, myY + rf(4, 7)], [fx + s * 5 + 2, myY]], { closed: true, fill: true, fillColor: pen.base, width: 1.2, wob: 0.4 });
  }
  if (is('eyeball')) {                                      // the body is the eye
    const ir = bw * rf(0.42, 0.5), ix = fx + look * bw * 0.18;
    arc(ix, fy, ir, 0, Math.PI * 2, { width: 2, wob: 0.9 });
    const pu = ir * rf(0.4, 0.52);
    for (let i = 0, n = ri(7, 11); i < n; i++) {            // the iris, spoked
      const a = rf(0, 6.28);
      line(ix + Math.cos(a) * pu * 1.1, fy + Math.sin(a) * pu * 1.1, ix + Math.cos(a) * ir * 0.9, fy + Math.sin(a) * ir * 0.9, { width: 0.9, wob: 0.5, taper: false });
    }
    dot(ix + look * 2, fy + rf(-2, 2), pu);
    dot(ix - ir * 0.2, fy - ir * 0.25, Math.max(1.5, ir * 0.13), pen.base);   // a shine
    for (let i = 0, n = ri(5, 9); i < n; i++) {             // bloodshot squiggles from the rim
      const a = rf(0, 6.28), x0 = cx + Math.cos(a) * bw * 0.95, y0 = bodY + Math.sin(a) * bh * 0.95;
      sketch([[x0, y0], [x0 - Math.cos(a) * rf(5, 9) + rf(-3, 3), y0 - Math.sin(a) * rf(5, 9) + rf(-3, 3)], [x0 - Math.cos(a) * rf(10, 16), y0 - Math.sin(a) * rf(10, 16)]], { width: 1, wob: 1.4 });
    }
    if (chance(0.4)) for (let i = -2; i <= 2; i++) {        // lashes
      const a = -Math.PI / 2 + i * 0.32;
      line(cx + Math.cos(a) * bw, bodY + Math.sin(a) * bh, cx + Math.cos(a) * (bw + 8), bodY + Math.sin(a) * (bh + 8), { width: 1.6, wob: 0.5 });
    }
  }
  if (mood === 'sleepy') {                                  // z z, drifting off
    let zx = fx + topW + rf(6, 14), zy = fy - rf(18, 30), zs = rf(5, 7);
    for (let i = 0; i < 2; i++) {
      sketch([[zx, zy], [zx + zs, zy], [zx, zy + zs], [zx + zs, zy + zs]], { width: 1.6, wob: 0.6, taper: false });
      zx += zs + 4; zy -= zs + 3; zs *= 0.8;
    }
  }

  /* ----- the gore, and now the blood runs red ----- */
  if (gore === 'drip') {                                    // a trickle from the corner of the mouth
    const mcx = fx + pick([-1, 1]) * 6 * fs;
    line(mcx, myY + 2, mcx + rf(-1, 2), myY + rf(9, 14), { width: 1.7, wob: 0.7, color: BLOOD, taper: false });
    dot(mcx + 1, myY + rf(13, 17), 1.6, BLOOD);
  } else if (gore === 'axe') {                              // a cleaver, sunk to its heel in the crown
    const axx = (figure ? hx : gearX) + rf(-6, 6), axy = (figure ? hy - hr : topY) + 3;
    const ad = pick([-1, 1]);
    sketch([[axx - ad * 9, axy - 3], [axx - ad * 7, axy - 13], [axx + ad * 8, axy - 11], [axx + ad * 7, axy - 2]], { closed: true, fill: true, fillColor: pen.base, width: 1.8, wob: 0.6 });
    line(axx + ad * 8, axy - 12, axx + ad * 19, axy - 20, { width: 2.4, wob: 0.6 });
    line(axx - ad * 8, axy - 2, axx + ad * 7, axy - 1, { width: 1.2, wob: 0.9 });   // the cut it sits in
    line(axx + rf(-3, 3), axy, axx + rf(-2, 4), axy + rf(7, 13), { width: 1.5, wob: 0.9, color: BLOOD, taper: false });   // a run of blood
    for (let i = 0; i < 2; i++) dot(axx - 4 + i * 8 + rf(-2, 2), axy + rf(5, 12), 1.5, BLOOD);
  } else if (gore === 'wound') {                            // a gash, stitched but still weeping
    const wx2 = cx + rf(-bw * 0.35, bw * 0.35), wy2 = Math.min(bodY + bh * rf(0.1, 0.5), hem - 14);
    if (chance(0.6)) washPts(blobPts(wx2, wy2, rf(9, 12), rf(6, 8), 0.15, 10), { color: BLOOD, alpha: rf(0.5, 0.65), grow: 1, mode: 'flat' });   // bruised around it
    line(wx2 - 7, wy2 - 5, wx2 + 7, wy2 + 5, { width: 2, wob: 0.8 });
    for (let k = -1; k <= 1; k++) line(wx2 + k * 4.5 - 2.5, wy2 + k * 3.2 + 3.5, wx2 + k * 4.5 + 2.5, wy2 + k * 3.2 - 3.5, { width: 1.1, wob: 0.4 });
    for (let i = 0; i < 2; i++) dot(wx2 + rf(-4, 6), wy2 + rf(8, 14), 1.4, BLOOD);
  } else if (gore === 'bones') {                            // old bones where it stands
    const gy2 = hem + legH + 6;
    for (let i = 0; i < 2; i++) {
      const bx3 = cx + pick([-1, 1]) * bw * rf(0.7, 1.05), by4 = gy2 + rf(-2, 3), ba = rf(-0.5, 0.5), bl = rf(8, 12);
      const ex3 = Math.cos(ba) * bl / 2, ey3 = Math.sin(ba) * bl / 2;
      line(bx3 - ex3, by4 - ey3, bx3 + ex3, by4 + ey3, { width: 2, wob: 0.5 });
      for (const e of [-1, 1]) { dot(bx3 + e * ex3 - Math.sin(ba) * 2, by4 + e * ey3 + Math.cos(ba) * 2, 1.7); dot(bx3 + e * ex3 + Math.sin(ba) * 2, by4 + e * ey3 - Math.cos(ba) * 2, 1.7); }
    }
  }
  if ((gore === 'axe' || gore === 'wound') && legStyle !== 'none' && chance(0.5))   // a small pool where it stands
    sketch(blobPts(cx + rf(-8, 8), hem + legH + 6, rf(11, 17), rf(3, 5), 0.15, 12), { closed: true, fill: true, fillColor: BLOOD, color: BLOOD, width: 1.2, wob: 1 });

  /* ----- something on the chest ----- */
  const chestY = is('longneck') ? bodY - bh * 0.3 : is('human') ? bodY + rf(-8, 4) : Math.min(myY + rf(22, 34), hem - 12);
  if (extra === 'heart') { const hfill = chance(0.35); sketch(heartPts(cx + rf(-6, 6), chestY, rf(7, 10)), { closed: true, fill: hfill, wash: hfill ? null : { color: BLOOD, alpha: rf(0.5, 0.65), grow: 1, mode: 'flat' }, width: 1.6, wob: 0.7 }); }
  else if (extra === 'buttons') for (let i = 0; i < 3; i++) { const by2 = chestY + i * rf(9, 13); dot(cx, by2, rf(1.8, 2.8)); if (chance(0.4)) arc(cx, by2, 3.6, 0, Math.PI * 2, { width: 0.8, wob: 0.4 }); }
  else if (extra === 'patch') {
    const ph2 = Math.min(rf(14, 22), (hem - myY) * 0.3), py = hem - ph2 - 8, pw2 = bw * rf(0.38, 0.5);
    if (ph2 > 8 && py > myY + 12) { const p = blobPts(cx, py, pw2, ph2, 0.08, 12); sketch(p, { closed: true, width: 1.4, wob: 1 }); if (chance(0.5)) clipTo(p, () => stipple(cx, py, pw2, ph2, ri(6, 14), 1)); }
  } else if (extra === 'stitch') {
    for (const a of [-0.6, 0.6]) line(cx - Math.cos(a) * 6, chestY - Math.sin(a) * 6, cx + Math.cos(a) * 6, chestY + Math.sin(a) * 6, { width: 1.8, wob: 0.5 });
  }

  /* ----- a patch of ground, hatched in ----- */
  if (!is('mermaid', 'spider') && chance(0.45)) {
    const gy = hem + legH + 7, gw2 = bw * rf(0.7, 1.1);
    line(cx - gw2, gy, cx + bw * rf(0.7, 1.1), gy + rf(-2, 2), { width: 1.6, wob: 1.4 });
    for (let i = 0, n = ri(3, 7); i < n; i++) {             // the shadow it stands in
      const x = cx + rf(-gw2 * 0.7, gw2 * 0.7);
      line(x, gy + 2, x + rf(4, 8), gy + rf(4, 6), { width: 1, wob: 0.6, taper: false });
    }
  }

  pen.ctx.restore();
  return odd ? { kind, mood, odd } : { kind, mood };
}

Sheet.register('creatures', { name: 'creatures', H: 2420, draw: drawCreature, census: ['kind', 'mood'], zoom: 1.1 });
})();
