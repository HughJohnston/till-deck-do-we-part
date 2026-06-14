import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { deflateSync as zlibDeflateSync } from 'zlib';

const ROOT = join(import.meta.dirname, '..');

interface AssetSpec {
  path: string;
  width: number;
  height: number;
  label: string;
  color: string;
  frames?: number;
}

function generatePNG(width: number, height: number, label: string, bgColor: string): Buffer {
  // Minimal BMP -> convert concept: we'll create a simple PNG using raw pixel data
  // Actually, let's create a simple SVG and note that Phaser can load PNGs
  // For true PNG generation without dependencies, we'll create a minimal valid PNG

  // Create a canvas-less PNG using the simplest approach: a colored rectangle
  // We'll use an uncompressed PNG with IDAT containing raw pixel data

  const channels = 4; // RGBA
  const rawRowSize = 1 + width * channels; // filter byte + pixel data per row
  const rawData: number[] = [];

  // Parse hex color
  const r = parseInt(bgColor.slice(1, 3), 16);
  const g = parseInt(bgColor.slice(3, 5), 16);
  const b = parseInt(bgColor.slice(5, 7), 16);

  // Simple text rendering - draw label as pixels (very basic, just center a block)
  for (let y = 0; y < height; y++) {
    rawData.push(0); // No filter
    for (let x = 0; x < width; x++) {
      rawData.push(r, g, b, 255);
    }
  }

  // Build PNG file
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = createChunk('IHDR', ihdrData);

  // IDAT chunk - we need to deflate the raw data
  const rawBuf = Buffer.from(rawData);
  const deflated = deflateSync(rawBuf);
  const idat = createChunk('IDAT', deflated);

  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buf: Buffer): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function deflateSync(data: Buffer): Buffer {
  return zlibDeflateSync(data);
}

function generateSpriteSheet(frameWidth: number, frameHeight: number, frameCount: number, label: string, color: string): Buffer {
  const totalWidth = frameWidth * frameCount;
  return generatePNG(totalWidth, frameHeight, label, color);
}

function writeAsset(spec: AssetSpec) {
  const fullPath = join(ROOT, spec.path);
  mkdirSync(dirname(fullPath), { recursive: true });

  let png: Buffer;
  if (spec.frames) {
    png = generateSpriteSheet(spec.width, spec.height, spec.frames, spec.label, spec.color);
  } else {
    png = generatePNG(spec.width, spec.height, spec.label, spec.color);
  }

  writeFileSync(fullPath, png);
  console.log(`  ✓ ${spec.path} (${spec.frames ? spec.width * spec.frames : spec.width}x${spec.height})`);
}

console.log('Generating placeholder assets...\n');

// Player spritesheets
console.log('Players:');
writeAsset({ path: 'assets/sprites/wilf.png', width: 64, height: 64, frames: 6, label: 'WILF', color: '#4A90D9' });
writeAsset({ path: 'assets/sprites/ruth.png', width: 64, height: 64, frames: 6, label: 'RUTH', color: '#D94A7A' });

// Distractors
console.log('\nDistractors:');
const distractors: [string, string, number, number][] = [
  ['beergroni', '#CC4444', 48, 48],
  ['olives', '#44CC44', 40, 40],
  ['pub', '#884422', 80, 64],
  ['shrek', '#44AA44', 40, 48],
  ['parkrun', '#FF8800', 56, 56],
  ['lido', '#4488CC', 64, 48],
  ['morlys', '#CC8844', 48, 48],
  ['milkshake', '#FFCC88', 32, 56],
  ['choir', '#AA44AA', 72, 56],
];
for (const [name, color, w, h] of distractors) {
  writeAsset({ path: `assets/sprites/distractors/${name}.png`, width: w, height: h, label: name.toUpperCase(), color });
}

// Collectables
console.log('\nCollectables:');
const collectables: [string, string, number, number][] = [
  ['ppt', '#FF6600', 32, 32],
  ['excel', '#22AA22', 32, 32],
  ['postit', '#FFEE44', 32, 32],
  ['slides', '#4488FF', 32, 32],
  ['sprint', '#FF44FF', 40, 32],
  ['agile', '#44FFFF', 40, 32],
  ['linkedin', '#0077B5', 32, 32],
];
for (const [name, color, w, h] of collectables) {
  writeAsset({ path: `assets/sprites/collectables/${name}.png`, width: w, height: h, label: name.toUpperCase(), color });
}

// Synergy letters
console.log('\nSynergy Letters:');
const letters = ['S', 'Y', 'N', 'E', 'R', 'G', 'Y2'];
for (const letter of letters) {
  writeAsset({ path: `assets/sprites/synergy/${letter}.png`, width: 32, height: 32, label: letter, color: '#FFD700' });
}

// Backgrounds
console.log('\nBackgrounds:');
writeAsset({ path: 'assets/backgrounds/sky.png', width: 800, height: 450, label: 'SKY', color: '#87CEEB' });
writeAsset({ path: 'assets/backgrounds/mid.png', width: 800, height: 450, label: 'BUILDINGS', color: '#708090' });
writeAsset({ path: 'assets/backgrounds/street.png', width: 800, height: 200, label: 'STREET', color: '#696969' });
writeAsset({ path: 'assets/backgrounds/ground.png', width: 800, height: 60, label: 'GROUND', color: '#8B7355' });

// UI
console.log('\nUI:');
writeAsset({ path: 'assets/ui/title.png', width: 400, height: 120, label: 'TITLE', color: '#2C1810' });
writeAsset({ path: 'assets/ui/button.png', width: 200, height: 60, label: 'BUTTON', color: '#4A90D9' });
writeAsset({ path: 'assets/ui/card.png', width: 600, height: 350, label: 'CARD', color: '#2C2C3E' });
writeAsset({ path: 'assets/ui/charframe.png', width: 100, height: 120, label: 'FRAME', color: '#333344' });

console.log('\n✅ All placeholder assets generated!');
