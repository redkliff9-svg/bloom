/**
 * Generates all Blooms icon assets — no canvas devDependency required.
 * Run: node scripts/generate-icon.js
 * Uses pngjs (already installed as a transitive dep).
 *
 * Outputs:
 *   icon.png                    1024×1024  RGB (no alpha) — App Store requirement
 *   splash-icon.png              512× 512  RGBA bloom on transparent bg
 *   android-icon-foreground.png 1024×1024  RGBA bloom on transparent bg
 *   android-icon-monochrome.png 1024×1024  RGBA white shapes on transparent (themed icons)
 *   android-icon-background.png 1024×1024  RGB solid #EAE4DB
 */

'use strict';
const { PNG } = require('pngjs');
const fs      = require('fs');
const path    = require('path');

// ── Brand palette ─────────────────────────────────────────────────────────────
const CREAM  = [0xEA, 0xE4, 0xDB]; // #EAE4DB  warm off-white
const PURPLE = [0x8B, 0x6B, 0xA0]; // #8B6BA0  brand purple
const LILAC  = [0xD4, 0xBF, 0xEA]; // #D4BFEA  soft lilac backing circle

// ── Geometry ──────────────────────────────────────────────────────────────────
function inCircle(x, y, cx, cy, r) {
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function inRotatedEllipse(x, y, cx, cy, rx, ry, angle) {
  const ca = Math.cos(angle), sa = Math.sin(angle);
  const dx = x - cx, dy = y - cy;
  const lx = dx * ca + dy * sa;
  const ly = -dx * sa + dy * ca;
  return (lx / rx) * (lx / rx) + (ly / ry) * (ly / ry) <= 1;
}

/**
 * Sample the bloom design at sub-pixel (fx, fy) in a canvas of `size`.
 *
 * mode:
 *   'icon'       full colour, cream background       → RGB output
 *   'splash'     full colour, transparent background → RGBA output
 *   'foreground' full colour, transparent background → RGBA output
 *   'monochrome' white shapes only, transparent bg   → RGBA output
 *
 * Returns [r, g, b, a].
 */
function sample(fx, fy, size, mode) {
  const cx = size / 2, cy = size / 2;

  const innerR  = size * 0.060;  // centre dot radius
  const outerR  = size * 0.100;  // centre gap (cream ring behind dot)
  const petalRx = size * 0.140;  // petal semi-major axis
  const petalRy = size * 0.091;  // petal semi-minor axis (= 0.65 × petalRx)
  const orbitR  = size * 0.200;  // orbit distance of petal centres
  const circleR = size * 0.420;  // lilac backing circle radius

  const transparent = mode !== 'icon';
  const shapeFill   = mode === 'monochrome' ? [255, 255, 255] : PURPLE;

  // --- front-to-back layer order ---

  // 1. Centre dot
  if (inCircle(fx, fy, cx, cy, innerR))
    return [...shapeFill, 255];

  // 2. Centre gap (cream on opaque icons, transparent otherwise)
  if (inCircle(fx, fy, cx, cy, outerR))
    return transparent ? [0, 0, 0, 0] : [...CREAM, 255];

  // 3. Six petals (rotated ellipses)
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const px    = cx + Math.cos(angle) * orbitR;
    const py    = cy + Math.sin(angle) * orbitR;
    if (inRotatedEllipse(fx, fy, px, py, petalRx, petalRy, angle))
      return [...shapeFill, 255];
  }

  // 4. Lilac backing circle
  if (inCircle(fx, fy, cx, cy, circleR)) {
    if (mode === 'monochrome') return [0, 0, 0, 0]; // transparent for clean tint
    return [...LILAC, 255];
  }

  // 5. Background
  return transparent ? [0, 0, 0, 0] : [...CREAM, 255];
}

// ── Anti-aliased renderer (2× super-sampling → 4 samples/pixel) ───────────────
function render(size, mode) {
  const SSAA      = 2;
  const colorType = mode === 'icon' ? 2 : 6; // 2=RGB, 6=RGBA
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
      const n = SSAA * SSAA;
      const i = (py * size + px) * 4;
      buf[i]     = (rS / n) | 0;
      buf[i + 1] = (gS / n) | 0;
      buf[i + 2] = (bS / n) | 0;
      buf[i + 3] = (aS / n) | 0;
    }
  }

  png.data = buf;
  return PNG.sync.write(png, { colorType });
}

function renderSolid(size, r, g, b) {
  const png = new PNG({ width: size, height: size, colorType: 2 });
  const buf = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    buf[i * 4]     = r;
    buf[i * 4 + 1] = g;
    buf[i * 4 + 2] = b;
    buf[i * 4 + 3] = 255;
  }
  png.data = buf;
  return PNG.sync.write(png, { colorType: 2 });
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
  const buf = mode === 'solid' ? renderSolid(size, ...CREAM) : render(size, mode);
  fs.writeFileSync(out, buf);
  console.log(`${buf.length.toLocaleString()} bytes  (${Date.now() - t0}ms)`);
}
console.log('\nDone. Run `npx expo start --clear` to reload assets.');
