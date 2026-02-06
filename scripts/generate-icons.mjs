import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const resources = join(root, 'resources');

mkdirSync(resources, { recursive: true });

// VoiceFlow icon: purple gradient circle with white mic silhouette
const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed"/>
      <stop offset="100%" style="stop-color:#6d28d9"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#a78bfa;stop-opacity:0.4"/>
      <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:0"/>
    </linearGradient>
  </defs>

  <!-- Background circle -->
  <circle cx="256" cy="256" r="240" fill="url(#bg)"/>

  <!-- Subtle inner glow -->
  <circle cx="256" cy="220" r="160" fill="url(#glow)"/>

  <!-- Microphone body -->
  <rect x="216" y="120" width="80" height="160" rx="40" fill="white"/>

  <!-- Microphone arc -->
  <path d="M176 260 Q176 340 256 340 Q336 340 336 260"
        stroke="white" stroke-width="24" fill="none" stroke-linecap="round"/>

  <!-- Mic stand -->
  <line x1="256" y1="340" x2="256" y2="400" stroke="white" stroke-width="24" stroke-linecap="round"/>

  <!-- Mic base -->
  <line x1="210" y1="400" x2="302" y2="400" stroke="white" stroke-width="24" stroke-linecap="round"/>
</svg>`;

async function generate() {
  // Generate PNG at various sizes
  const sizes = [16, 32, 48, 64, 128, 256, 512];

  for (const size of sizes) {
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(join(resources, `icon-${size}.png`));
  }

  // Main icon.png (256x256 for Linux/general use)
  await sharp(Buffer.from(svg))
    .resize(256, 256)
    .png()
    .toFile(join(resources, 'icon.png'));

  // For ICO generation, create a 256x256 PNG that electron-builder can use
  // electron-builder will auto-convert PNG to ICO on Windows
  await sharp(Buffer.from(svg))
    .resize(256, 256)
    .png()
    .toFile(join(resources, 'icon-256.png'));

  // Create ICO file manually (multi-size PNG container)
  // electron-builder supports PNG files and converts them, but let's also
  // create a proper icon.ico using the PNG-in-ICO format
  const icoSizes = [16, 32, 48, 256];
  const pngBuffers = await Promise.all(
    icoSizes.map(size =>
      sharp(Buffer.from(svg))
        .resize(size, size)
        .png()
        .toBuffer()
    )
  );

  // ICO file format: header + directory entries + image data
  const numImages = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * numImages;

  let dataOffset = headerSize + dirSize;
  const entries = [];

  for (let i = 0; i < numImages; i++) {
    const size = icoSizes[i];
    const buf = pngBuffers[i];
    entries.push({
      width: size >= 256 ? 0 : size,
      height: size >= 256 ? 0 : size,
      offset: dataOffset,
      size: buf.length,
      buffer: buf,
    });
    dataOffset += buf.length;
  }

  const ico = Buffer.alloc(dataOffset);

  // Header
  ico.writeUInt16LE(0, 0);      // Reserved
  ico.writeUInt16LE(1, 2);      // Type: ICO
  ico.writeUInt16LE(numImages, 4); // Count

  // Directory entries
  for (let i = 0; i < numImages; i++) {
    const off = headerSize + i * dirEntrySize;
    const e = entries[i];
    ico.writeUInt8(e.width, off);       // Width
    ico.writeUInt8(e.height, off + 1);  // Height
    ico.writeUInt8(0, off + 2);         // Color palette
    ico.writeUInt8(0, off + 3);         // Reserved
    ico.writeUInt16LE(1, off + 4);      // Color planes
    ico.writeUInt16LE(32, off + 6);     // Bits per pixel
    ico.writeUInt32LE(e.size, off + 8); // Image size
    ico.writeUInt32LE(e.offset, off + 12); // Data offset
  }

  // Image data
  for (const e of entries) {
    e.buffer.copy(ico, e.offset);
  }

  const { writeFileSync } = await import('fs');
  writeFileSync(join(resources, 'icon.ico'), ico);

  console.log('Icons generated:');
  console.log('  resources/icon.png (256x256)');
  console.log('  resources/icon.ico (16,32,48,256 multi-size)');
  for (const s of sizes) {
    console.log(`  resources/icon-${s}.png`);
  }
}

generate().catch(err => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
