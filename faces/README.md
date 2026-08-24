# Sketchbook

Procedural sketch sheets drawn by code with a wobbly, tapered pen and a marker box:
48 faces, 48 figures, 48 critters, 48 tattoo-flash designs, 48 space objects — or a mixed sheet
of all of them. No build step;
open `index.html` (or any sheet) straight from disk.

| file | what |
|---|---|
| `index.html` | the index: a tile per sheet, each with a little preview really drawn by that collection's hand (keys `1`–`6` open a sheet, `r` redraws the previews); the edulab logo on any sheet leads back |
| `faces.html`, `figures.html`, `animals.html`, `tattoo.html`, `space.html` | one thin shell each: it loads its collection's JS and calls `Sheet.init(COLLECTIONS.<name>)` |
| `faces.js`, `figures.js`, `animals.js`, `tattoo.js`, `space.js` | the collections: each sheet's drawing code in an IIFE that calls `Sheet.register(name, cfg)` |
| `mix.html` | loads every collection and rolls, per cell, which hand draws it (seed salted per collection) |
| `shared/pen.js` | the pen: seeded RNG, `sketch`/`line`/`arc`/`blobPts`/`washPts`/`stipple`/`hatch`/`dot`, and the `pen` state object (`ctx`, `R`, `ink`, `base`, multipliers) |
| `shared/sheet.js` | the paper: canvas, grid of seeded cells, grain, redraw / save, the enlarge-one-drawing viewer, deep links, DOM contract |
| `shared/chrome.css` | the reset, the branded top bar and the `.edu-btn` button, shared by the hub and the sheets |
| `shared/palette.css` | the whole drawing palette: the shared marker box plus every collection's own tokens (cloth, fur, flash, space) — one source of truth, so the mix can draw anything |
| `shared/sheet.css` | sheet chrome, the keyboard cell grid and viewer styles |
| `verify.sh` | headless Chrome check of the DOM contract; prints pixel hashes to prove a change is lossless |

## Using a sheet

- **Click a drawing** to see it large on a transparent checkerboard; `←`/`→` step through the sheet,
  `e` exports that one drawing as a transparent PNG, `Esc` closes (focus returns to the drawing you
  were on). The viewer is modal: the page behind it is inert and Tab cycles its buttons.
- **Keyboard**: Tab onto the sheet, arrows (and Home/End) move between drawings, Enter or Space
  enlarges the one selected.
- **Redraw** (top bar, next to Settings; `r` — from inside the viewer it closes the viewer first) rolls a new
  sheet; **Save sheet PNG** (`s`) exports the whole paper. The paper is always rasterised at the same
  scale, so a seed saves to the same file on every screen.
- **Settings** (in the sheet's top bar, next to **Home**; or `p`) folds out
  a panel of sliders: `pen` (line weight), `wobble` (below 1 a steadier hand; above 1 not a uniform
  jitter but noise on the contours: lines wander off their path and shake unevenly), `zoom` (drawing size in its cell), `color`
  (0 natural → 1 vibrant), `fill` (0 accurate → 1 messy: a careless marker that stops short of the
  line or runs past it). They redraw live, stick across sheets (localStorage) and travel in the URL
  (`?w=1.5&wob=0.7&zoom=1.2&color=0.7&fill=0.8`); `reset` returns to the sheet's own hand.
- Deep links: `faces.html?seed=123` reproduces a sheet (`seed=0` is a seed too), `&open=7` opens the 7th
  drawing (reading order); `index.html#space` (a legacy link) redirects to its sheet, and
  `index.html?seed=123` draws the tile previews at that seed and passes it to whichever sheet is opened.

## Writing a sheet

A sheet is a thin HTML shell: `<link shared/edulab.css>`, `chrome.css`, `palette.css`, `sheet.css`,
its own `:root` tokens, `<script shared/pen.js>`, `<script shared/sheet.js>`, then its own drawing
code and one call:

```js
Sheet.init({ name: 'faces', H: 2420, draw: drawFace, census: ['age', 'gender'], zoom: 1.2 });
```

`draw(cx, cy, seed, { big })` paints one drawing centred on `(cx, cy)` inside a `CELL_W × CELL_H`
cell (`W = 1500`, 6 × 8 cells), calling `pen.seed(seed)` first so the same seed always gives the
same drawing, and returns a small object describing it (`census` names the fields to count; every
string field becomes the viewer label). `big` is true when the viewer is drawing it enlarged; the
viewer scales, so a design may skip its paper-only tilt. Paint "paper" with `pen.base`, never `PAPER`:
on the sheet they are equal, on a transparent export `pen.base` is near-white.

Everything the drawing code shares lives in one object, `pen`: `pen.ctx` (the canvas in hand),
`pen.R` (use `rf`/`ri`/`pick`/`chance`/`wpick`), `pen.ink`, `pen.base`, and the per-drawing
multipliers `w`, `wob`, `minTaper`, `scribble`, `stipple`; `pen.reset()` runs before every drawing.
Big drawings are written as a setup block that fills a context object `F`, followed by named parts
(`faceEyes(F)`, `figLegs(F)`, …) called in order – the order of random draws is the drawing's identity,
so parts are moved, never reordered, and `./verify.sh`'s pixel hash proves a refactor changed nothing.

## DOM contract

`#sheet[data-state]` (`drawing` | `ready`), `#sheet[data-seed]`, `#sheet[data-census]` (JSON counts),
`#sheet[data-hash]` (pixel hash, only with `?probe=1`), `#sheet[data-smoke]` (with `?smoke=N`: N extra seeds
drawn in-page, capped at 200, `{ seeds, errors }`), `#big[data-index|data-seed|data-label]` for the enlarged drawing,
`#sheet[data-controls]` (the pen settings in force), on the index: `#tiles[data-state|data-seed]` and each `.tile[data-collection|data-seed|data-state]`. `./verify.sh` reads exactly these (`SMOKE=40` seeds per sheet by default).
