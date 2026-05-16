/**
 * Gera ícones PWA para o Amigo do Prédio.
 * Usa apenas módulos built-in do Node.js — sem dependências externas.
 *
 * Execução: node scripts/generate-icons.js
 * Saída: public/icons/icon-192.png, icon-512.png, apple-touch-icon.png
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// ── CRC32 (necessário para PNG) ──────────────────────────────────────────────

const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
  CRC_TABLE[i] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++)
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(d.length);
  const crc = Buffer.allocUnsafe(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, d])));
  return Buffer.concat([len, t, d, crc]);
}

// ── Encoder PNG RGB ──────────────────────────────────────────────────────────

function encodePng(width, height, rgb) {
  const rowLen = 1 + width * 3;
  const raw = Buffer.allocUnsafe(height * rowLen);
  for (let y = 0; y < height; y++) {
    raw[y * rowLen] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const s = (y * width + x) * 3;
      const d = y * rowLen + 1 + x * 3;
      raw[d] = rgb[s];
      raw[d + 1] = rgb[s + 1];
      raw[d + 2] = rgb[s + 2];
    }
  }

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  ihdr[10] = ihdr[11] = ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Desenho do ícone ─────────────────────────────────────────────────────────

/**
 * Design: Prédio estilizado em cream sobre fundo navy.
 * Coordenadas de referência em 192×192; escaladas proporcionalmente.
 *
 * Paleta:
 *   Navy  #1f3147  →  R:31  G:49  B:71
 *   Cream #f9f5ef  →  R:249 G:245 B:239
 *   Sage  #5b956e  →  R:91  G:149 B:110
 */
function generateIcon(size) {
  const px = new Uint8Array(size * size * 3);
  const sc = size / 192;

  const NAVY  = [31,  49,  71];
  const CREAM = [249, 245, 239];
  const SAGE  = [91,  149, 110];

  function set(x, y, col) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 3;
    px[i] = col[0]; px[i + 1] = col[1]; px[i + 2] = col[2];
  }

  // fillRect usa coordenadas no espaço de referência (192×192)
  function fillRect(x1, y1, x2, y2, col) {
    const rx1 = Math.round(x1 * sc);
    const ry1 = Math.round(y1 * sc);
    const rx2 = Math.round(x2 * sc);
    const ry2 = Math.round(y2 * sc);
    for (let y = ry1; y <= ry2; y++)
      for (let x = rx1; x <= rx2; x++)
        set(x, y, col);
  }

  function fillCircle(cx, cy, r, col) {
    const rx = Math.round(cx * sc);
    const ry = Math.round(cy * sc);
    const rr = Math.round(r * sc);
    for (let dy = -rr; dy <= rr; dy++)
      for (let dx = -rr; dx <= rr; dx++)
        if (dx * dx + dy * dy <= rr * rr)
          set(rx + dx, ry + dy, col);
  }

  // 1. Fundo navy
  fillRect(0, 0, 191, 191, NAVY);

  // 2. Corpo do prédio (cream)
  fillRect(52, 76, 140, 152, CREAM);

  // 3. Telhado triangular — pico em (96, 54), base em y=76 de x=52 a x=140
  const peakX = 96 * sc;
  const peakY = 54 * sc;
  const baseY = 76 * sc;
  const bx1   = 52 * sc;
  const bx2   = 140 * sc;
  for (let ry = Math.round(peakY); ry < Math.round(baseY); ry++) {
    const t  = (ry - peakY) / (baseY - peakY);
    const hw = t * (bx2 - bx1) / 2;
    for (let rx = Math.round(peakX - hw); rx <= Math.round(peakX + hw); rx++)
      set(rx, ry, CREAM);
  }

  // 4. Janelas — linha superior (navy recortado no cream)
  fillRect(64,  88, 83,  105, NAVY);  // esquerda
  fillRect(109, 88, 128, 105, NAVY);  // direita

  // 5. Janelas — linha inferior
  fillRect(64,  112, 83,  129, NAVY);
  fillRect(109, 112, 128, 129, NAVY);

  // 6. Porta — base centralizada
  fillRect(84, 132, 108, 152, NAVY);

  // 7. Ponto sage no topo (identidade de cor do produto)
  fillCircle(96, 54, 4.5, SAGE);

  return encodePng(size, size, px);
}

// ── ICO builder (embeds a PNG dentro do formato ICO moderno) ──────────────────

/**
 * Cria um arquivo ICO com uma única imagem PNG embutida.
 * Browsers modernos (Chrome, Firefox, Edge, Safari) suportam PNG-in-ICO desde 2010.
 */
function generateFaviconICO(size) {
  const pngData = generateIcon(size);

  // ICO header: reserved(2) + type=1(2) + count=1(2)
  const header = Buffer.from([0x00, 0x00, 0x01, 0x00, 0x01, 0x00]);

  // Directory entry (16 bytes)
  const dir = Buffer.allocUnsafe(16);
  dir[0] = size;  // width (0 = 256px; values 1–255 para outros tamanhos)
  dir[1] = size;  // height
  dir[2] = 0;     // color count (0 = sem paleta)
  dir[3] = 0;     // reserved
  dir.writeUInt16LE(1, 4);              // planes
  dir.writeUInt16LE(32, 6);             // bit count
  dir.writeUInt32LE(pngData.length, 8); // data size
  dir.writeUInt32LE(22, 12);            // data offset (6 header + 16 dir entry)

  return Buffer.concat([header, dir, pngData]);
}

// ── Main ──────────────────────────────────────────────────────────────────────

const outDir = path.join(__dirname, "..", "public", "icons");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const icons = [
  { file: "icon-192.png",        size: 192 },
  { file: "icon-512.png",        size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];

for (const { file, size } of icons) {
  const data = generateIcon(size);
  fs.writeFileSync(path.join(outDir, file), data);
  const kb = (data.length / 1024).toFixed(1);
  console.log(`✓ public/icons/${file}  (${size}×${size}, ${kb} kB)`);
}

// Favicon: ICO 32×32 para app/ (Next.js serve automaticamente como /favicon.ico)
const appDir = path.join(__dirname, "..");
const faviconData = generateFaviconICO(32);
fs.writeFileSync(path.join(appDir, "app", "favicon.ico"), faviconData);
const faviconKb = (faviconData.length / 1024).toFixed(1);
console.log(`✓ app/favicon.ico  (32×32 PNG-in-ICO, ${faviconKb} kB)`);

console.log("\nÍcones gerados com sucesso.");
