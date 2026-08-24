/* ============================================================
   SHEET — everything a sketch sheet does apart from the drawing
   itself: the paper, the grid of seeded cells, redraw / save,
   keyboard, the enlarge-one-drawing viewer with transparent PNG
   export, ?seed= / ?open= deep links and the DOM contract.

   A sheet calls, after defining its draw function:
     Sheet.init({ name, H, draw, census, ... })
   and draw(cx, cy, seed, { big }) paints one drawing centred on
   (cx, cy) inside a CELL_W × CELL_H cell, returning a small object
   describing what it drew (used for the census and the viewer label).

   DOM contract (for humans and agents alike):
     #sheet[data-state]   drawing | ready
     #sheet[data-seed]    master seed of the sheet on screen
     #sheet[data-census]  JSON counts of what was drawn
     #sheet[data-hash]    pixel hash of the paper, only with ?probe=1
     #sheet[data-smoke]   with ?smoke=N: N extra seeds drawn in-page, { seeds, errors }
     #sheet[data-controls] the user's pen settings in force (JSON)
     #big[data-index|data-seed|data-label]  the enlarged drawing
   ============================================================ */

/* ─── Constants ─── */
const W = 1500;                        // virtual paper width; height is per sheet
const COLS = 6, ROWS = 8;              // the grid
const RASTER = 1 / 1.6;                // virtual units → canvas pixels at dpr 1
const MAX_DPR = 2;
/* the paper is always rasterised at MAX_DPR, whatever the screen: a sheet saved on a laptop
   and the same seed saved on a phone are the same file, pixel for pixel */
const SCALE = MAX_DPR * RASTER;
const CELL_SEED = (master, row, col) => (master + row * 101 + col * 977) >>> 0;
const DRAW_SALT = 0xBEEF;
const VIEWER_PX = 1200;                // the enlarged drawing's canvas
const MAX_SMOKE = 200;                 // ?smoke=N is capped: a typo must not pin the tab for minutes
const params = new URLSearchParams(location.search);
/* the user's hand on the pen: shown as a row of controls, kept in the URL and localStorage */
const CONTROL_KEY = 'sketchbook.controls';
const CONTROLS = [
  { id: 'w',      label: 'pen',    min: 0.5, max: 2,   step: 0.05, def: 1 },
  { id: 'wob',    label: 'wobble', min: 0.5, max: 1.5, step: 0.05, def: 1 },
  { id: 'zoom',   label: 'zoom',   min: 0.6, max: 1.4, step: 0.05, def: 1 },
  { id: 'color',  label: 'color',  min: 0,   max: 1,   step: 0.05, def: 0 },   // 0 natural … 1 vibrant
  { id: 'fill',   label: 'fill',   min: 0,   max: 1,   step: 0.05, def: 0 },   // 0 accurate … 1 messy
];
const PANEL_KEY = 'sketchbook.controlsOpen';

/* ─── State ─── */
let H = 2420, CELL_W = W / COLS, CELL_H = H / ROWS;
const SHEET = {
  name: 'sheet', draw: null, census: [], jitter: [14, 14], zoom: 1,
  masterSeed: 0, cells: [], current: -1,
  pendingDraw: 0,          // a redraw is scheduled for the next frame
  focusBefore: null,       // where focus was when the viewer opened
  inert: [],               // what the viewer put behind itself
};

/* ─── DOM refs ─── */
const canvas = document.getElementById('c');
const sheet = document.getElementById('sheet');
const seedLabel = document.getElementById('seedLabel');
let sheetCtx, viewer, big, bigLabel, live, cellButtons = [];

/* ─── Helpers ─── */
/* localStorage may be missing or refused (private mode, file://, a strict policy); the sheet must still start */
const store = {
  get(key) { try { return localStorage.getItem(key); } catch (_) { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch (_) { /* ignore */ } },
};
function urlSeed() {
  const raw = params.get('seed'), n = Number(raw);
  return raw !== null && raw !== '' && Number.isInteger(n) && n >= 0 ? n >>> 0 : (Date.now() ^ 0x9e3779b9) >>> 0;   // 0 is a seed too
}
function download(c, filename) {
  c.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, 'image/png');
}
function say(text) { if (live) live.textContent = text; }
/* keep ?seed= (and ?open=) in the address bar so a reload or a copied link shows the same sheet;
   file:// pages may refuse, which is fine */
function rememberUrl() {
  const open = SHEET.current >= 0 ? `&open=${SHEET.current + 1}` : '';
  const ctl = CONTROLS.filter(c => pen.user[c.id] !== c.def).map(c => `&${c.id}=${pen.user[c.id]}`).join('');
  try { history.replaceState(null, '', `?seed=${SHEET.masterSeed}${open}${ctl}`); } catch (_) { /* file:// */ }
}
/* run fn once, after the browser has had one chance to paint — so a 'drawing' state (and its busy
   cursor) is actually seen before the synchronous canvas work starts. A timer backs the frame up:
   a background tab or a throttled frame must not leave the sheet stuck on 'drawing' */
function afterPaint(fn) {
  let done = false;
  const run = () => { if (!done) { done = true; fn(); } };
  requestAnimationFrame(() => setTimeout(run, 0));
  setTimeout(run, 120);
}

/* ─── Controls ─── */
function loadControls() {
  let stored = {};
  try { stored = JSON.parse(store.get(CONTROL_KEY) || '{}'); } catch (_) { /* ignore */ }
  for (const c of CONTROLS) {
    const raw = params.get(c.id) ?? stored[c.id] ?? c.def;
    if (c.options) pen.user[c.id] = c.options.includes(raw) ? raw : c.def;
    else { const n = Number(raw); pen.user[c.id] = Number.isFinite(n) ? Math.min(c.max, Math.max(c.min, n)) : c.def; }
  }
}
function saveControls() {
  store.set(CONTROL_KEY, JSON.stringify(pen.user));
  sheet.dataset.controls = JSON.stringify(pen.user);
}
function renderControls() {
  const open = store.get(PANEL_KEY) === '1';
  const toggle = `<button type="button" class="edu-btn ghost toggle" id="toggleControls" aria-expanded="${open}" aria-controls="controls" title="pen settings (p)">Settings</button>`;
  /* the toggle sits in the top bar, next to Home; the panel still folds out above the sheet */
  const right = document.querySelector('.edu-header-inner .right');
  if (right) right.insertAdjacentHTML('afterbegin', toggle);
  sheet.insertAdjacentHTML('beforebegin', `<div class="controls-wrap">
    ${right ? '' : toggle}
    <form class="controls" id="controls" aria-label="Pen controls"${open ? '' : ' hidden'}>${CONTROLS.map(c => c.options
    ? `<label class="ctl"><span>${c.label}</span><select name="${c.id}">${c.options.map(o => `<option value="${o}"${pen.user[c.id] === o ? ' selected' : ''}>${o}</option>`).join('')}</select></label>`
    : `<label class="ctl"><span>${c.label}</span><input type="range" name="${c.id}" min="${c.min}" max="${c.max}" step="${c.step}" value="${pen.user[c.id]}"><output>${Number(pen.user[c.id]).toFixed(2)}</output></label>`
  ).join('')}<button type="button" class="edu-btn ghost" id="resetControls" title="back to the sheet's own hand">reset</button></form></div>`);
  const form = document.getElementById('controls');
  document.getElementById('toggleControls').addEventListener('click', toggleControls);
  const apply = () => { saveControls(); requestDraw(); };
  form.addEventListener('input', e => {
    const c = CONTROLS.find(x => x.id === e.target.name); if (!c) return;
    pen.user[c.id] = c.options ? e.target.value : Number(e.target.value);
    const out = e.target.nextElementSibling; if (out && out.tagName === 'OUTPUT') out.textContent = Number(e.target.value).toFixed(2);
    apply();
  });
  document.getElementById('resetControls').addEventListener('click', () => {
    for (const c of CONTROLS) {
      pen.user[c.id] = c.def;
      const el = form.elements[c.id]; el.value = c.def;
      const out = el.nextElementSibling; if (out && out.tagName === 'OUTPUT') out.textContent = Number(c.def).toFixed(2);
    }
    apply();
  });
}
const describe = who => Object.values(who || {}).filter(v => typeof v === 'string').join(' · ');

/* ─── The paper: plain, white, no grain ─── */
function paperBase() {
  pen.ctx.save();
  pen.ctx.setTransform(1, 0, 0, 1, 0, 0);
  pen.ctx.fillStyle = PAPER;
  pen.ctx.fillRect(0, 0, canvas.width, canvas.height);
  pen.ctx.restore();
}

/* ─── Render ─── */
/* draw the whole sheet, now, synchronously; requestDraw() is the everyday entry, this the core */
function drawAll() {
  SHEET.pendingDraw = 0;
  sheet.dataset.state = 'drawing';
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  pen.ctx = sheetCtx;
  pen.ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  paperBase();

  const census = {};
  SHEET.cells.length = 0;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const seed = CELL_SEED(SHEET.masterSeed, row, col);
      pen.seed(seed);                       // pre-roll placement jitter
      const cx = CELL_W * (col + 0.5) + rf(-SHEET.jitter[0], SHEET.jitter[0]);
      const cy = CELL_H * (row + 0.5) + rf(-SHEET.jitter[1], SHEET.jitter[1]);
      pen.reset();
      const z = pen.user.zoom;
      pen.ctx.save();
      if (z !== 1) { pen.ctx.translate(cx, cy); pen.ctx.scale(z, z); pen.ctx.translate(-cx, -cy); }   // user zoom, about the cell's centre
      const who = SHEET.draw(cx, cy, seed ^ DRAW_SALT, { big: false }) || {};
      pen.ctx.restore();
      for (const key of SHEET.census) if (who[key] != null) census[who[key]] = (census[who[key]] || 0) + 1;
      SHEET.cells.push({ row, col, seed: seed ^ DRAW_SALT, who });
    }
  }
  labelCells();
  /* DOM contract: the sheet publishes what it drew */
  sheet.dataset.seed = SHEET.masterSeed;
  sheet.dataset.census = JSON.stringify(census);
  sheet.dataset.controls = JSON.stringify(pen.user);
  if (params.get('probe')) sheet.dataset.hash = pixelHash();
  sheet.dataset.state = 'ready';
  if (seedLabel) seedLabel.textContent = `· seed ${SHEET.masterSeed}`;
  rememberUrl();
}
/* the everyday redraw: flag the sheet as drawing, let that paint, then draw; many requests in
   one frame (a slider being dragged) collapse into one drawing */
function requestDraw() {
  sheet.dataset.state = 'drawing';
  if (SHEET.pendingDraw) return;
  SHEET.pendingDraw = 1;
  afterPaint(drawAll);
}
/* FNV-1a over the pixels: lets a script prove two builds draw the same sheet */
function pixelHash() {
  const d = pen.ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let h = 0x811c9dc5;
  for (let i = 0; i < d.length; i++) { h ^= d[i]; h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16);
}

function reroll() {
  SHEET.masterSeed = (Math.random() * 2 ** 32) >>> 0;
  requestDraw();
  say(`new sheet, seed ${SHEET.masterSeed}`);
}
function savePng() { download(canvas, `${SHEET.name}-sheet-${SHEET.masterSeed}.png`); }

/* ─── The cells: one invisible button per drawing, over the paper. They carry the keyboard
   (Tab onto the sheet, arrows to move, Enter / Space to enlarge) and the screen-reader labels;
   the mouse clicks them like it used to click the canvas. ─── */
function buildCells() {
  const grid = document.createElement('div');
  grid.className = 'cells'; grid.id = 'cells';
  grid.setAttribute('role', 'group');
  grid.setAttribute('aria-label', `${COLS * ROWS} drawings: arrow keys to move, Enter to enlarge`);
  grid.style.setProperty('--cols', COLS); grid.style.setProperty('--rows', ROWS);
  for (let i = 0; i < COLS * ROWS; i++) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'cell'; b.dataset.index = i;
    b.tabIndex = i === 0 ? 0 : -1;                       // one tab stop for the whole grid, arrows inside it
    b.setAttribute('aria-label', `drawing ${i + 1} of ${COLS * ROWS}`);
    grid.appendChild(b);
  }
  sheet.appendChild(grid);
  cellButtons = [...grid.children];
  grid.addEventListener('click', e => { const b = e.target.closest('.cell'); if (b) showDrawing(Number(b.dataset.index)); });
  grid.addEventListener('keydown', e => {
    const b = e.target.closest('.cell'); if (!b || e.metaKey || e.ctrlKey || e.altKey) return;
    const i = Number(b.dataset.index), row = Math.floor(i / COLS), col = i % COLS;
    const to = { ArrowLeft: i - 1, ArrowRight: i + 1, ArrowUp: i - COLS, ArrowDown: i + COLS, Home: row * COLS, End: row * COLS + COLS - 1 }[e.key];
    if (to === undefined) return;
    if (e.key === 'ArrowLeft' && col === 0 || e.key === 'ArrowRight' && col === COLS - 1) { e.preventDefault(); return; }   // rows don't wrap
    e.preventDefault();
    focusCell(to);
  });
}
function focusCell(i) {
  if (i < 0 || i >= cellButtons.length) return;
  for (const b of cellButtons) b.tabIndex = -1;
  cellButtons[i].tabIndex = 0;
  cellButtons[i].focus();
}
function labelCells() {
  cellButtons.forEach((b, i) => {
    const label = describe(SHEET.cells[i] && SHEET.cells[i].who);
    b.setAttribute('aria-label', `${label ? label + ', ' : ''}drawing ${i + 1} of ${cellButtons.length}`);
  });
}

/* ─── The viewer: one drawing, big, on a transparent canvas ─── */
function showDrawing(i) {
  if (i < 0 || i >= SHEET.cells.length) return;
  const opening = viewer.hidden;
  SHEET.current = i;
  const cell = SHEET.cells[i];
  const bctx = big.getContext('2d');
  const s = SHEET.zoom * 0.9 * Math.min(big.width / CELL_W, big.height / CELL_H);
  pen.ctx = bctx; pen.base = PAPER;             // draw on the viewer canvas; paper-coloured strokes stay white
  try {
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, big.width, big.height);  // transparent ground
    bctx.translate(big.width / 2, big.height / 2);
    bctx.scale(s, s);
    pen.reset();
    SHEET.draw(0, 0, cell.seed, { big: true });
  } finally {
    pen.ctx = sheetCtx; pen.base = PAPER;
  }
  const label = describe(cell.who);
  bigLabel.textContent = `${label ? label + ' · ' : ''}${i + 1} of ${SHEET.cells.length}`;
  big.dataset.index = i; big.dataset.seed = cell.seed; big.dataset.label = label;
  if (opening) openViewer();
  rememberUrl();
  say(`showing ${label || 'drawing'} ${i + 1} of ${SHEET.cells.length}`);
}
/* the viewer is a modal: everything else goes inert, focus moves in and is handed back on close */
function openViewer() {
  SHEET.focusBefore = document.activeElement;
  SHEET.inert = [...document.body.children].filter(el => el !== viewer && el !== live && !el.inert);
  for (const el of SHEET.inert) el.inert = true;
  viewer.hidden = false;
  document.getElementById('exportOne').focus();
}
function closeViewer() {
  if (viewer.hidden) return;
  const last = SHEET.current;
  viewer.hidden = true; SHEET.current = -1;
  for (const el of SHEET.inert) el.inert = false;
  SHEET.inert = [];
  rememberUrl();
  /* back to the drawing the viewer ended on (the one clicked, unless ←/→ moved on), else wherever focus was */
  if (cellButtons[last]) focusCell(last);
  else if (SHEET.focusBefore && SHEET.focusBefore.isConnected && SHEET.focusBefore !== document.body) SHEET.focusBefore.focus();
  SHEET.focusBefore = null;
}
function exportOne() {
  if (SHEET.current < 0) return;
  const cell = SHEET.cells[SHEET.current];
  const slug = describe(cell.who).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  download(big, `${SHEET.name}-${slug || 'drawing'}-${cell.seed}.png`);
}
/* Tab stays inside the open viewer (inert handles the rest of the page; this keeps Tab from
   leaving for the browser chrome) */
function trapTab(e) {
  if (e.key !== 'Tab') return;
  const stops = [...viewer.querySelectorAll('button:not([disabled])')];
  if (!stops.length) return;
  const first = stops[0], last = stops[stops.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function toggleControls() {
  const form = document.getElementById('controls'), btn = document.getElementById('toggleControls');
  form.hidden = !form.hidden;
  btn.setAttribute('aria-expanded', String(!form.hidden));
  store.set(PANEL_KEY, form.hidden ? '0' : '1');
  if (!form.hidden && viewer.hidden) form.querySelector('input, select').focus();   // not while the viewer has the focus
}

/* one place for every shortcut, so keys pressed in the hub can be forwarded here;
   returns true only for a key it acted on, so everything else (Tab, Enter, Space…) keeps its default */
function handleKey(key) {
  if (!viewer.hidden) {
    if (key === 'Escape') { closeViewer(); return true; }
    if (key === 'ArrowLeft') { showDrawing(SHEET.current - 1); return true; }
    if (key === 'ArrowRight') { showDrawing(SHEET.current + 1); return true; }
    if (key === 'e') { exportOne(); return true; }
    if (key === 'r') { closeViewer(); reroll(); return true; }   // Redraw from inside the viewer: close it and roll a new sheet
    if (key === 's') { savePng(); return true; }
    return false;
  }
  if (key === 'r') { reroll(); return true; }
  if (key === 's') { savePng(); return true; }
  if (key === 'p') { toggleControls(); return true; }
  return false;
}

/* ─── Init ─── */
/* every sheet's drawing code registers itself here, so another sheet (mix) can borrow it */
const COLLECTIONS = {};
const Sheet = {
  register(name, cfg) { COLLECTIONS[name] = cfg; },
  /* name: file-name stem for exports · H: paper height · draw: the drawing fn ·
     census: fields of draw()'s result to count · jitter: [x, y] cell wobble ·
     zoom: viewer magnification */
  init({ name, H: height = 2420, draw, census = [], jitter, zoom } = {}) {
    Object.assign(SHEET, { name, draw, census }, jitter && { jitter }, zoom && { zoom });
    if (window.parent === window) document.body.classList.add('standalone');   // opened on its own: show the brand bar
    H = height; CELL_W = W / COLS; CELL_H = H / ROWS;
    sheetCtx = pen.ctx = canvas.getContext('2d');

    document.body.insertAdjacentHTML('beforeend', `
      <div class="viewer" id="viewer" hidden role="dialog" aria-modal="true" aria-label="Selected drawing">
        <div class="viewer-card">
          <canvas id="big" width="${VIEWER_PX}" height="${VIEWER_PX}" aria-label="Selected drawing, enlarged"></canvas>
          <div class="viewer-bar">
            <span id="bigLabel"></span>
            <button type="button" id="prev" class="edu-btn ghost" title="previous drawing (←)">‹ prev</button>
            <button type="button" id="next" class="edu-btn ghost" title="next drawing (→)">next ›</button>
            <button type="button" id="exportOne" class="edu-btn" title="export this drawing as a transparent PNG (e)">Export PNG · transparent</button>
            <button type="button" id="closeViewer" class="edu-btn ghost" title="close (Esc)">Close</button>
          </div>
        </div>
      </div>
      <p class="sr-only" id="live" aria-live="polite"></p>`);
    viewer = document.getElementById('viewer'); big = document.getElementById('big');
    bigLabel = document.getElementById('bigLabel'); live = document.getElementById('live');
    buildCells();

    /* ─── Listeners ─── */
    viewer.addEventListener('click', e => { if (e.target === viewer) closeViewer(); });
    viewer.addEventListener('keydown', trapTab);
    document.getElementById('prev').addEventListener('click', () => showDrawing(SHEET.current - 1));
    document.getElementById('next').addEventListener('click', () => showDrawing(SHEET.current + 1));
    document.getElementById('exportOne').addEventListener('click', exportOne);
    document.getElementById('closeViewer').addEventListener('click', closeViewer);
    document.getElementById('redraw')?.addEventListener('click', reroll);
    document.getElementById('save')?.addEventListener('click', savePng);
    document.addEventListener('keydown', e => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;   // the controls keep their own keys
      if (handleKey(e.key)) { e.preventDefault(); return; }
      /* the hub picks sheets with 1–9: pass those up when we live in its iframe */
      if (window.parent !== window && /^[1-9]$/.test(e.key)) window.parent.postMessage({ type: 'sketchbook:key', key: e.key }, '*');
    });
    /* keys forwarded by the hub — only from the window that holds us (the '*' target stays, for file://) */
    window.addEventListener('message', e => {
      if (window.parent === window || e.source !== window.parent) return;
      if (e.data && e.data.type === 'sketchbook:key') handleKey(e.data.key);
    });

    SHEET.masterSeed = urlSeed();
    loadControls();
    renderControls();
    afterPaint(firstDraw);   // let the page lay out once, then draw — timer-backed, so a throttled or occluded tab still draws (bare rAF can freeze there)
  },
};
function firstDraw() {
    drawAll();
    /* ?open=N opens the viewer on drawing N (1-based, reading order) — a deep link to one drawing */
    const open = Number(params.get('open'));
    if (Number.isInteger(open) && open >= 1 && open <= SHEET.cells.length) showDrawing(open - 1);
    /* ?smoke=N: draw N more seeds (and enlarge a few drawings of each) to flush out rare branches that throw;
       the result lands on the DOM for verify.sh; the sheet ends on the seed it started with */
    const smoke = Number(params.get('smoke'));
    if (Number.isInteger(smoke) && smoke > 0) smokeRun(Math.min(smoke, MAX_SMOKE));
}
function smokeRun(n) {
  const first = SHEET.masterSeed, errors = [];
  for (let i = 1; i <= n; i++) {
    SHEET.masterSeed = (first + i * 7919) >>> 0;
    try {
      drawAll();
      for (const k of [0, 17, 47]) showDrawing(k);
    } catch (e) { errors.push({ seed: SHEET.masterSeed, error: String(e && e.message || e) }); }
  }
  closeViewer();
  SHEET.masterSeed = first; drawAll();
  sheet.dataset.smoke = JSON.stringify({ seeds: n, errors });
}
