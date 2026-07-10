/**
 * AR Airways — PWA Icon Generator (pure Node.js, zero dependencies)
 * Run with: node scripts/generate-icons.js
 *
 * Icon design: Dark rounded background (#0a0a0f), gold ✈ shape centered.
 * Uses only Node.js built-ins (zlib, fs, path) — no npm install needed.
 */

const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// ─── CRC32 (required by PNG spec) ────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcBuf]);
}

// ─── Geometry helpers ─────────────────────────────────────────────────────────

function inRoundedRect(px, py, size) {
  const r = size * 0.18;
  if (px < r && py < r) return (px - r) ** 2 + (py - r) ** 2 <= r * r;
  if (px > size - r && py < r) return (px - (size - r)) ** 2 + (py - r) ** 2 <= r * r;
  if (px < r && py > size - r) return (px - r) ** 2 + (py - (size - r)) ** 2 <= r * r;
  if (px > size - r && py > size - r) return (px - (size - r)) ** 2 + (py - (size - r)) ** 2 <= r * r;
  return true;
}

// Axis-aligned bounding check after rotating (px,py) into the rect's local frame
function inRotatedRect(px, py, cx, cy, halfLen, halfWid, theta) {
  const cos = Math.cos(theta), sin = Math.sin(theta);
  const lx = cos * (px - cx) + sin * (py - cy);
  const ly = -sin * (px - cx) + cos * (py - cy);
  return Math.abs(lx) <= halfLen && Math.abs(ly) <= halfWid;
}

// ─── PNG builder ──────────────────────────────────────────────────────────────

function generatePNG(size) {
  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0);  // width
  ihdr.writeUInt32BE(size, 4);  // height
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // colour type: RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // ── Plane geometry (screen coords: y increases downward) ──
  // Plane points NE: angle = -π/4
  const THETA = -Math.PI / 4;
  const THETA_PERP = THETA + Math.PI / 2;
  const cx = size / 2, cy = size / 2;

  // Fuselage: long thin rect SW→NE through centre
  const fusLen = size * 0.30;
  const fusWid = size * 0.055;

  // Wings: wide thin rect perpendicular, centred slightly NE of centre
  const wLen = size * 0.34;
  const wWid = size * 0.065;
  const cos45 = Math.cos(THETA), sin45 = Math.sin(THETA);
  const wCx = cx + cos45 * size * 0.04;
  const wCy = cy + sin45 * size * 0.04;

  // Tail fins: smaller rect perpendicular, centred SW of centre
  const tLen = size * 0.13;
  const tWid = size * 0.042;
  const tCx = cx - cos45 * size * 0.20;
  const tCy = cy - sin45 * size * 0.20;

  // Raw scanlines (filter byte + RGBA per pixel)
  const raw = Buffer.allocUnsafe(size * (size * 4 + 1));

  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const dst = y * (size * 4 + 1) + 1 + x * 4;
      const px = x + 0.5, py = y + 0.5;

      if (!inRoundedRect(px, py, size)) {
        raw[dst] = 0; raw[dst + 1] = 0; raw[dst + 2] = 0; raw[dst + 3] = 0;
        continue;
      }

      const isPlane =
        inRotatedRect(px, py, cx, cy, fusLen, fusWid, THETA) ||
        inRotatedRect(px, py, wCx, wCy, wLen, wWid, THETA_PERP) ||
        inRotatedRect(px, py, tCx, tCy, tLen, tWid, THETA_PERP);

      if (isPlane) {
        // Gold: #d4af6a
        raw[dst] = 212; raw[dst + 1] = 175; raw[dst + 2] = 106; raw[dst + 3] = 255;
      } else {
        // Dark background: #0a0a0f
        raw[dst] = 10; raw[dst + 1] = 10; raw[dst + 2] = 15; raw[dst + 3] = 255;
      }
    }
  }

  const idat = zlib.deflateSync(raw, { level: 6 });

  return Buffer.concat([
    PNG_SIG,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const OUT_DIR = path.join(__dirname, "../icons");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

console.log("Generating AR Airways PWA icons (pure Node.js, no dependencies)...\n");
for (const size of SIZES) {
  const buf = generatePNG(size);
  const outPath = path.join(OUT_DIR, `icon-${size}.png`);
  fs.writeFileSync(outPath, buf);
  console.log(`✅  icon-${size}.png  (${(buf.length / 1024).toFixed(1)} KB)`);
}
console.log("\n✅ All icons generated. Verify at https://maskable.app");
