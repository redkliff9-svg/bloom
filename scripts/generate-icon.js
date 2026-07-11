/**
 * Generates assets/icon.png (1024×1024) and assets/splash-icon.png (512×512).
 * Run once: node scripts/generate-icon.js
 * Requires: npm install --save-dev canvas
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function drawIcon(size, outputPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background — warm cream
  ctx.fillStyle = '#EAE4DB';
  ctx.fillRect(0, 0, size, size);

  // Soft circle backing
  const cx = size / 2, cy = size / 2, r = size * 0.42;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#D4BFEA';
  ctx.fill();

  // Bloom petals (6 petals around center)
  const petalCount = 6;
  const petalR = size * 0.14;
  const orbitR  = size * 0.20;
  ctx.fillStyle = '#8B6BA0';
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2;
    const px = cx + Math.cos(angle) * orbitR;
    const py = cy + Math.sin(angle) * orbitR;
    ctx.beginPath();
    ctx.ellipse(px, py, petalR, petalR * 0.65, angle, 0, Math.PI * 2);
    ctx.fill();
  }

  // Center circle
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.10, 0, Math.PI * 2);
  ctx.fillStyle = '#EAE4DB';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.06, 0, Math.PI * 2);
  ctx.fillStyle = '#8B6BA0';
  ctx.fill();

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`✓ Written ${outputPath} (${size}×${size})`);
}

const assetsDir = path.join(__dirname, '..', 'assets');
drawIcon(1024, path.join(assetsDir, 'icon.png'));
drawIcon(512,  path.join(assetsDir, 'splash-icon.png'));
drawIcon(512,  path.join(assetsDir, 'android-icon-foreground.png'));
console.log('Done. Run `npx expo start --clear` to reload assets.');
