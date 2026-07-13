/**
 * Generates all Blooms icon assets — no canvas devDependency required.
 * Run: node scripts/generate-icon.js
 * Uses pngjs (already installed as a transitive dep).
 *
 * Design: rose-pink background + dark-rose vertical leaf + lighter crescent inside
 *
 * Outputs:
 *   icon.png                    1024×1024  RGB (no alpha) — App Store requirement
 *   splash-icon.png              512× 512  RGBA bloom on transparent bg
 *   android-icon-foreground.png 1024×1024  RGBA bloom on transparent bg
 *   android-icon-monochrome.png 1024×1024  RGBA white shapes on transparent (themed icons)
 *   android-icon-background.png 1024×1024  RGB solid rose
 */

'use strict';
const { PNG } = require('pngjs');
const fs      = require('fs');
const path    = require('path');

// ── Brand palette ─────────────────────────────────────────────────────────────
const ROSE_BG    = [0xF5, 0xC2, 0xC2]; // #F5C2C2  soft rose background
const LEAF_DARK  = [0xBE, 0x37, 0x41]; // #BE3741  deep cranberry leaf
const LEAF_LIGHT = [0xD7, 0x5A, 0x64]; // #D75A64  lighter rose crescent

// ── Geometry ──────────────────────────────────────────────────────────────────

// Vertical pointed-oval leaf = intersection of two horizontally-offset circles
// R=0.350, d=0.220 → width ≈ 26% of size, height ≈ 54% of size
function inLeaf(x, y, cx, cy, size) {
  const R = size * 0.350, d = size * 0.220;
  const dy = y - cy;
  const d1 = x - (cx - d), d2 = x - (cx + d);
  return d1 * d1 + dy * dy <= R * R && d2 * d2 + dy * dy <= R * R;
}

// Crescent (")") = inside outer circle AND outside inner circle shifted left
function inCrescent(x, y, cx, cy, size) {
  const ox     = cx + size * 0.018;  // crescent center, slightly right
  const oy     = cy - size * 0.020;  // slightly above leaf center
  const outerR = size * 0.088;
  const innerR = size * 0.074;
  const shift  = size * 0.054;       // inner circle shifted left → ")" shape

  const dx1 = x - ox,           dy1 = y - oy;
  const dx2 = x - (ox - shift), dy2 = y - oy;
  return dx1 * dx1 + dy1 * dy1 <= outerR * outerR &&
         dx2 * dx2 + dy2 * dy2 >  innerR * innerR;
}

// ── Sample a sub-pixel point ───────────────────────────────────────────────────
function sample(fx, fy, size, mode) {
  const cx = size / 2, cy = size / 2;

  if (mode === 'solid') return [...ROSE_BG, 255];

  if (mode === 'monochrome') {
    return inLeaf(fx, fy, cx, cy, size) ? [255, 255, 255, 255] : [0, 0, 0, 0];
  }

  // 'icon', 'splash', 'foreground'
  const transparent = mode !== 'icon';
  const inL = inLeaf(fx, fy, cx, cy, size);
  if (inL && inCrescent(fx, fy, cx, cy, size)) return [...LEAF_LIGHT, 255];
  if (inL) return [...LEAF_DARK, 255];
  return transparent ? [0, 0, 0, 0] : [...ROSE_BG, 255];
}

// ── Anti-aliased renderer (2× super-sampling) ─────────────────────────────────
function render(size, mode) {
  const SSAA      = 2;
  const colorType = (mode === 'icon' || mode === 'solid') ? 2 : 6;
  const png       = new PNG({ width: size, height: size, colorType });
  const buf       = Buffer.alloc(size * size * 4);

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let rS = 0, gS = 0, bS = 0, aS = 0;
      for (let sy = 0; sy < SSAA; sy++) {
        for (let sx = 0; sx < SSAA; sx++) {
          const [r, g, b, a] = sample(
            px + (sx + 0.5) / SSAA,
            py + (sy + 0.5) / SSAA,
            size, mode,
          );
          rS += r; gS += g; bS += b; aS += a;
        }
      }
      const n = SSAA * SSAA, i = (py * size + px) * 4;
      buf[i]     = (rS / n) | 0;
      buf[i + 1] = (gS / n) | 0;
      buf[i + 2] = (bS / n) | 0;
      buf[i + 3] = (aS / n) | 0;
    }
  }

  png.data = buf;
  return PNG.sync.write(png, { colorType });
}

// ── Run ───────────────────────────────────────────────────────────────────────
const ASSETS  = path.join(__dirname, '..', 'assets');
const targets = [
  ['icon.png',                    1024, 'icon'],
  ['splash-icon.png',              512, 'splash'],
  ['android-icon-foreground.png', 1024, 'foreground'],
  ['android-icon-monochrome.png', 1024, 'monochrome'],
  ['android-icon-background.png', 1024, 'solid'],
];

console.log('Generating Blooms icon assets…\n');
for (const [file, size, mode] of targets) {
  const out = path.join(ASSETS, file);
  process.stdout.write(`  ${file.padEnd(30)} ${size}×${size}  ${mode.padEnd(12)} … `);
  const t0  = Date.now();
  const buf = render(size, mode);
  fs.writeFileSync(out, buf);
  console.log(`${buf.length.toLocaleString()} bytes  (${Date.now() - t0}ms)`);
}
console.log('\nDone. Run `npx expo start --clear` to reload assets.');
