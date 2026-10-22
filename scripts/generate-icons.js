import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, getPixel) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw image data with filter byte 0 at start of each scanline
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // filter type None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crcData = chunk.subarray(4, 8 + len);
  const crc = crc32(crcData);
  chunk.writeInt32BE(crc, 8 + len);
  return chunk;
}

function crc32(buf) {
  let c;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }

  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function brandPixel(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const radius = w * 0.42;

  // Background: Deep Navy #0B1F4B -> #071533
  const t = y / h;
  const bgR = Math.round(11 * (1 - t) + 7 * t);
  const bgG = Math.round(31 * (1 - t) + 21 * t);
  const bgB = Math.round(75 * (1 - t) + 51 * t);

  // If outside circle in non-maskable, make corners slightly rounded
  if (!isMaskable) {
    const cornerRadius = w * 0.22;
    // Check rounded rect
    const qx = Math.max(Math.abs(dx) - (w / 2 - cornerRadius), 0);
    const qy = Math.max(Math.abs(dy) - (h / 2 - cornerRadius), 0);
    if (Math.sqrt(qx * qx + qy * qy) > cornerRadius) {
      return [0, 0, 0, 0]; // Transparent
    }
  }

  // Golden inner ring
  const ringInner = radius * 0.88;
  const ringOuter = radius * 0.94;
  if (dist >= ringInner && dist <= ringOuter) {
    return [245, 166, 35, 255]; // Golden Orange #F5A623
  }

  // Inner badge circle
  if (dist < ringInner) {
    // "B J" letter rendering approximation in center
    // Left 'B' roughly from -w*0.25 to -w*0.04
    // Right 'J' roughly from +w*0.02 to +w*0.22
    const normX = dx / w;
    const normY = dy / h;

    // Draw central B and J shapes
    // 'B' backbone: x between -0.22 and -0.17, y between -0.16 and +0.16
    const isBBackbone = normX >= -0.22 && normX <= -0.17 && normY >= -0.16 && normY <= 0.16;
    const isBTop = normX >= -0.22 && normX <= -0.06 && Math.abs(normY - (-0.14)) <= 0.025;
    const isBMid = normX >= -0.22 && normX <= -0.07 && Math.abs(normY - 0.0) <= 0.025;
    const isBBot = normX >= -0.22 && normX <= -0.06 && Math.abs(normY - 0.14) <= 0.025;
    const isBRight1 = Math.abs(normX - (-0.06)) <= 0.025 && normY >= -0.14 && normY <= 0.0;
    const isBRight2 = Math.abs(normX - (-0.06)) <= 0.025 && normY >= 0.0 && normY <= 0.14;

    // 'J' bar: top bar x between 0.04 and 0.20, y around -0.14
    const isJTop = normX >= 0.04 && normX <= 0.20 && Math.abs(normY - (-0.14)) <= 0.025;
    // 'J' stem: x between 0.12 and 0.17, y between -0.14 and 0.12
    const isJStem = normX >= 0.12 && normX <= 0.17 && normY >= -0.14 && normY <= 0.12;
    // 'J' bottom hook: curve from 0.04 to 0.17, y around 0.14
    const isJHook = normX >= 0.04 && normX <= 0.17 && Math.abs(normY - 0.14) <= 0.025;
    const isJHookLeft = Math.abs(normX - 0.04) <= 0.025 && normY >= 0.06 && normY <= 0.14;

    if (isBBackbone || isBTop || isBMid || isBBot || isBRight1 || isBRight2 || isJTop || isJStem || isJHook || isJHookLeft) {
      return [255, 255, 255, 255]; // White BJ
    }

    // Star/Crown on top
    if (Math.abs(normX) <= 0.08 && normY >= -0.32 && normY <= -0.22) {
      return [245, 166, 35, 255]; // Gold
    }

    return [17, 41, 107, 255]; // #11296B inside badge
  }

  return [bgR, bgG, bgB, 255];
}

if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
}

// Generate 192x192
const pwa192 = createPNG(192, 192, (x, y, w, h) => brandPixel(x, y, w, h, false));
fs.writeFileSync('public/pwa-192x192.png', pwa192);

// Generate 512x512
const pwa512 = createPNG(512, 512, (x, y, w, h) => brandPixel(x, y, w, h, false));
fs.writeFileSync('public/pwa-512x512.png', pwa512);

// Generate maskable 512x512 (no corner clipping, full bleed)
const maskable512 = createPNG(512, 512, (x, y, w, h) => brandPixel(x, y, w, h, true));
fs.writeFileSync('public/pwa-maskable-512x512.png', maskable512);

// Generate apple-touch-icon 180x180
const appleIcon = createPNG(180, 180, (x, y, w, h) => brandPixel(x, y, w, h, true));
fs.writeFileSync('public/apple-touch-icon.png', appleIcon);

console.log('Successfully generated all PWA icons in /public: 192x192, 512x512, maskable, apple-touch-icon');
