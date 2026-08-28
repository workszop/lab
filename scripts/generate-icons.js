/* ============================================================
   generate-icons.js — PWA icon set from the edulab logo mark.

   Rerun with `npm run icons` whenever the logo changes.
   Source of truth: SOURCE below (the same 250×250 mark the
   landing page inlines). Outputs land in /icons plus the two
   root favicons; manifest.json references them by relative path.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// ─── Constants ───
const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'faces', 'shared', 'edulab-mark-teal.png');
const OUT = path.join(ROOT, 'icons');
const BACKGROUND = '#ffffff';          // manifest background_color
const MASKABLE_SCALE = 0.6;            // logo size inside the maskable safe zone

// ─── Helpers ───
/* the source canvas carries large transparent margins around the mark;
   trim them once so every output is sized against the mark itself */
let TRIMMED;
async function trimmedSource() {
  if (!TRIMMED) TRIMMED = await sharp(SOURCE).trim().png().toBuffer();
  return TRIMMED;
}

/* the logo resized to `logoPx`, centered on an opaque `canvasPx` square of BACKGROUND */
async function onCanvas(canvasPx, logoPx) {
  const logo = await sharp(await trimmedSource())
    .resize(logoPx, logoPx, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp({
    create: { width: canvasPx, height: canvasPx, channels: 4, background: BACKGROUND },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .flatten({ background: BACKGROUND })
    .png();
}

/* a modern ICO is a tiny directory header followed by whole PNGs — every
   current browser reads this; no extra dependency needed */
function pngToIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);           // reserved
  header.writeUInt16LE(1, 2);           // type: icon
  header.writeUInt16LE(pngs.length, 4); // image count
  const entries = [];
  let offset = 6 + 16 * pngs.length;
  for (const { size, buf } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size === 256 ? 0 : size, 0);   // width  (0 means 256)
    e.writeUInt8(size === 256 ? 0 : size, 1);   // height
    e.writeUInt8(0, 2);                          // palette
    e.writeUInt8(0, 3);                          // reserved
    e.writeUInt16LE(1, 4);                       // planes
    e.writeUInt16LE(32, 6);                      // bits per pixel
    e.writeUInt32LE(buf.length, 8);              // bytes
    e.writeUInt32LE(offset, 12);                 // offset
    entries.push(e);
    offset += buf.length;
  }
  return Buffer.concat([header, ...entries, ...pngs.map(p => p.buf)]);
}

// ─── Generate ───
async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  // transparent square icons at the two manifest sizes, mark filling the frame
  for (const size of [192, 512]) {
    await sharp(await trimmedSource())
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(OUT, `icon-${size}.png`));
  }

  // maskable: logo at ~60% centered on the background color, so any mask crop keeps it whole
  await (await onCanvas(512, Math.round(512 * MASKABLE_SCALE)))
    .toFile(path.join(OUT, 'icon-512-maskable.png'));

  // apple touch icon: 180×180, opaque, a little breathing room around the mark
  await (await onCanvas(180, 150)).toFile(path.join(OUT, 'apple-touch-icon.png'));

  // favicons: a 32px PNG at root, and an ICO wrapping 16 + 32 px PNGs
  const fav = async px => sharp(await trimmedSource())
    .resize(px, px, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const [png16, png32] = await Promise.all([fav(16), fav(32)]);
  fs.writeFileSync(path.join(ROOT, 'favicon-32.png'), png32);
  fs.writeFileSync(path.join(ROOT, 'favicon.ico'),
    pngToIco([{ size: 16, buf: png16 }, { size: 32, buf: png32 }]));

  for (const f of ['icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-512-maskable.png',
                   'icons/apple-touch-icon.png', 'favicon-32.png', 'favicon.ico']) {
    console.log(`wrote ${f} (${fs.statSync(path.join(ROOT, f)).size} bytes)`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
