/**
 * Generates PNG icons for the PWA manifest.
 * Run with: node scripts/generate-icons.js
 * Requires: npm install canvas (run once)
 *
 * Icon design: Dark background (#0a0a0f), gold ✈ symbol centered.
 * Replace these with real designed icons before the wedding.
 */

const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const BG = "#0a0a0f";
const FG = "#d4af6a";
const OUT_DIR = path.join(__dirname, "../icons");

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

for (const size of SIZES) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Background with rounded corners
  const radius = size * 0.15;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fillStyle = BG;
  ctx.fill();

  // ✈ glyph centred
  ctx.fillStyle = FG;
  ctx.font = `${Math.round(size * 0.55)}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("✈", size / 2, size / 2 + size * 0.04);

  const buf = canvas.toBuffer("image/png");
  const out = path.join(OUT_DIR, `icon-${size}.png`);
  fs.writeFileSync(out, buf);
  console.log(`✅  ${out}`);
}

console.log("\nAll icons generated. Verify maskable safe zones at https://maskable.app");
