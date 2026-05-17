/**
 * Gera ícones PWA para o Amigo do Prédio.
 * Usa apenas módulos built-in do Node.js — sem dependências externas.
 *
 * Execução: node scripts/generate-icons.js
 * Saída: public/icons/icon-192.png, icon-512.png, apple-touch-icon.png
 *
 * Fase 45 — Paleta atualizada:
 *   Navy  #234B63  →  R:35  G:75  B:99
 *   Cream #F7F1E8  →  R:247 G:241 B:232
 * Design: dois volumes de prédio (esquerdo mais baixo, direito mais alto)
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
 * Design: Dois volumes de prédio estilizados em cream sobre fundo navy.
 * Coordenadas de referência em 192×192; escaladas proporcionalmente.
 *
 * Paleta:
 *   Navy  #234B63  →  R:35  G:75  B:99
 *   Cream #F7F1E8  →  R:247 G:241 B:232
 */
function generateIcon(size) {
  const px = new Uint8Array(size * size * 3);
  const sc = size / 192;

  const NAVY  = [35,  75,  99];
  const CREAM = [247, 241, 232];

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

  // 1. Fundo navy
  fillRect(0, 0, 191, 191, NAVY);

  // 2. Prédio esquerdo — volume menor (mais baixo)
  //    x: 42→92, y: 96→156  (50 wide × 60 tall)
  fillRect(42, 96, 92, 156, CREAM);

  // 3. Prédio direito — volume maior (mais alto)
  //    x: 98→150, y: 64→156  (52 wide × 92 tall)
  fillRect(98, 64, 150, 156, CREAM);

  // 4. Janelas do prédio esquerdo (navy no cream) — 2×2 grid
  fillRect(52, 105, 63, 115, NAVY);
  fillRect(72, 105, 83, 115, NAVY);
  fillRect(52, 123, 63, 133, NAVY);
  fillRect(72, 123, 83, 133, NAVY);

  // 5. Janelas do prédio direito — 2×3 grid
  fillRect(108, 74, 119, 84,  NAVY);
  fillRect(129, 74, 140, 84,  NAVY);
  fillRect(108, 92, 119, 102, NAVY);
  fillRect(129, 92, 140, 102, NAVY);
  fillRect(108, 110, 119, 120, NAVY);
  fillRect(129, 110, 140, 120, NAVY);

  // 6. Porta no prédio direito — base centralizada
  fillRect(116, 134, 132, 156, NAVY);

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
