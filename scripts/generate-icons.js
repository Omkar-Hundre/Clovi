const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

function createPNG(width, height, rgbaBuffer) {
  // Add scanline filter byte (0 = None) at the start of each row
  const rawData = Buffer.alloc(height * (width * 4 + 1));
  let rawIdx = 0;
  let rgbaIdx = 0;

  for (let y = 0; y < height; y++) {
    rawData[rawIdx++] = 0; // Filter byte: None
    for (let x = 0; x < width; x++) {
      rawData[rawIdx++] = rgbaBuffer[rgbaIdx++]; // R
      rawData[rawIdx++] = rgbaBuffer[rgbaIdx++]; // G
      rawData[rawIdx++] = rgbaBuffer[rgbaIdx++]; // B
      rawData[rawIdx++] = rgbaBuffer[rgbaIdx++]; // A
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA (6)
  ihdr[10] = 0; // Compression: Deflate
  ihdr[11] = 0; // Filter: 0
  ihdr[12] = 0; // Interlace: None

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(len + 12);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = calculateCRC(chunk.subarray(4, len + 8));
  chunk.writeUInt32BE(crc, len + 8);
  return chunk;
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function calculateCRC(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// 64x64 RGBA Icon
const width = 64;
const height = 64;
const rgba = Buffer.alloc(width * height * 4);
const cx = width / 2;
const cy = height / 2;
const radius = width / 2 - 2;

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= radius) {
      const t = y / height;
      const inBolt = (
        (x >= 24 && x <= 40 && y >= 12 && y <= 32) ||
        (x >= 20 && x <= 44 && y >= 28 && y <= 36) ||
        (x >= 24 && x <= 40 && y >= 32 && y <= 52)
      );

      if (inBolt) {
        // Cyan/violet neon glow
        rgba[idx] = 56;
        rgba[idx + 1] = 189;
        rgba[idx + 2] = 248;
        rgba[idx + 3] = 255;
      } else {
        // Deep obsidian background
        rgba[idx] = Math.round(9 + 15 * t);
        rgba[idx + 1] = Math.round(9 + 20 * t);
        rgba[idx + 2] = Math.round(11 + 30 * t);
        rgba[idx + 3] = 255;
      }
    } else {
      rgba[idx] = 0;
      rgba[idx + 1] = 0;
      rgba[idx + 2] = 0;
      rgba[idx + 3] = 0;
    }
  }
}

const pngBuf = createPNG(width, height, rgba);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), pngBuf);
fs.writeFileSync(path.join(assetsDir, 'icon.ico'), pngBuf);
console.log('✅ Generated assets/icon.png & assets/icon.ico successfully (Size: ' + pngBuf.length + ' bytes)');
