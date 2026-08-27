// All functions in this file are pure (no React, no browser APIs, no Canvas).
// Canvas image-processing lives in React component event handlers (index.tsx).

// ─── Dimension helpers ────────────────────────────────────────────────────────

/**
 * Compute output canvas dimensions.
 * When maintainAspect=true, scales proportionally so neither dimension exceeds target.
 * Never upscales (if source is smaller than target, returns source dimensions unchanged).
 */
export function getScaledDimensions(
  srcW: number,
  srcH: number,
  targetW: number,
  targetH: number,
  maintainAspect: boolean,
): { w: number; h: number } {
  if (srcW === 0 || srcH === 0) return { w: 0, h: 0 };
  if (!maintainAspect) return { w: targetW, h: targetH };
  // Never upscale
  if (srcW <= targetW && srcH <= targetH) return { w: srcW, h: srcH };
  const ratio = Math.min(targetW / srcW, targetH / srcH);
  return {
    w: Math.round(srcW * ratio),
    h: Math.round(srcH * ratio),
  };
}

// ─── Quality helpers ──────────────────────────────────────────────────────────

/**
 * Clamp a 0–100 quality integer to the 0.01–1.0 float range expected by
 * HTMLCanvasElement.toDataURL(type, quality).
 */
export function clampQuality(q: number): number {
  const clamped = Math.max(0, Math.min(100, q));
  // Map 0 → 0.01 to avoid completely blank output; 100 → 1.0
  return Math.max(0.01, clamped / 100);
}

// ─── MIME type helpers ────────────────────────────────────────────────────────

export function getMimeType(format: 'jpg' | 'png' | 'webp'): string {
  switch (format) {
    case 'jpg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
  }
}

// ─── Base64 / Data URI helpers ────────────────────────────────────────────────

/**
 * Returns true if uri starts with 'data:image/' and contains a valid base64 payload.
 */
export function validateBase64DataUri(uri: string): boolean {
  if (!uri) return false;
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/]+=*$/.test(uri.trim());
}

/**
 * Splits a data URI into its mimeType and raw base64 data string.
 * Throws if the URI is not a valid data URI.
 */
export function parseDataUri(uri: string): { mimeType: string; data: string } {
  const match = uri.trim().match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid data URI');
  return { mimeType: match[1], data: match[2] };
}

// ─── File size formatting ─────────────────────────────────────────────────────

/**
 * Formats a byte count as a human-readable string.
 * Examples: formatFileSize(0) → '0 B', formatFileSize(1536) → '1.50 KB'
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 0) throw new Error('bytes must be non-negative');
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const idx = Math.min(i, units.length - 1);
  if (idx === 0) return `${bytes} B`;
  return `${(bytes / Math.pow(1024, idx)).toFixed(2)} ${units[idx]}`;
}

// ─── Crop helpers ─────────────────────────────────────────────────────────────

/**
 * Validates and clamps a crop region to the image bounds.
 * x, y, w, h are in pixels relative to the source image dimensions.
 * Throws if the requested region has zero or negative area after clamping.
 */
export function getCropParams(
  imgW: number,
  imgH: number,
  x: number,
  y: number,
  w: number,
  h: number,
): { sx: number; sy: number; sw: number; sh: number } {
  const sx = Math.max(0, Math.min(x, imgW));
  const sy = Math.max(0, Math.min(y, imgH));
  const sw = Math.max(0, Math.min(w, imgW - sx));
  const sh = Math.max(0, Math.min(h, imgH - sy));
  if (sw === 0 || sh === 0) throw new Error('Crop region has zero area');
  return { sx, sy, sw, sh };
}

// ─── Rotation helpers ─────────────────────────────────────────────────────────

/**
 * Maps a rotation/flip direction to degrees of clockwise rotation.
 * Flip directions return 0 (flipping is handled by canvas scale, not rotation).
 */
export function getRotationDegrees(
  direction: 'cw90' | 'ccw90' | '180' | 'flipH' | 'flipV',
): number {
  switch (direction) {
    case 'cw90': return 90;
    case 'ccw90': return -90;
    case '180': return 180;
    case 'flipH': return 0;
    case 'flipV': return 0;
  }
}

// ─── ICO binary header builder ────────────────────────────────────────────────

/**
 * Builds the binary ICO file header + directory entries for the given sizes.
 * Each entry in `imageDataBlocks` must provide:
 *   size: the icon dimension in pixels (e.g. 16, 32, 48)
 *   data: Uint8Array of the raw PNG bytes for that size
 *
 * Returns the complete ICO file as a Uint8Array (header + directory + all PNG blobs).
 *
 * ICO format reference:
 *   - 6-byte ICONDIR header
 *   - 16-byte ICONDIRENTRY per image
 *   - Raw image data follows
 */
export function buildIcoFile(
  imageDataBlocks: { size: number; data: Uint8Array }[],
): Uint8Array<ArrayBuffer> {
  const count = imageDataBlocks.length;
  // ICONDIR: 2 (reserved) + 2 (type=1) + 2 (count) = 6 bytes
  // ICONDIRENTRY: 1+1+1+1+2+2+4+4 = 16 bytes each
  const headerSize = 6 + 16 * count;
  const totalDataSize = imageDataBlocks.reduce((sum, b) => sum + b.data.length, 0);
  const buf = new Uint8Array(headerSize + totalDataSize);
  const view = new DataView(buf.buffer);

  // ICONDIR header
  view.setUint16(0, 0, true);       // Reserved (must be 0)
  view.setUint16(2, 1, true);       // Type: 1 = ICO
  view.setUint16(4, count, true);   // Number of images

  let dataOffset = headerSize;

  imageDataBlocks.forEach((block, i) => {
    const entryOffset = 6 + 16 * i;
    const dim = block.size >= 256 ? 0 : block.size; // 0 means 256 in ICO spec
    buf[entryOffset + 0] = dim;                  // Width
    buf[entryOffset + 1] = dim;                  // Height
    buf[entryOffset + 2] = 0;                    // Color count (0 = no palette)
    buf[entryOffset + 3] = 0;                    // Reserved
    view.setUint16(entryOffset + 4, 1, true);    // Color planes
    view.setUint16(entryOffset + 6, 32, true);   // Bits per pixel
    view.setUint32(entryOffset + 8, block.data.length, true);  // Size of image data
    view.setUint32(entryOffset + 12, dataOffset, true);        // Offset to image data

    buf.set(block.data, dataOffset);
    dataOffset += block.data.length;
  });

  return buf;
}

/**
 * Lightweight helper used in tests — builds just the ICO header bytes for
 * a set of size specs (without actual image data). Used to verify header math.
 */
export function buildIcoHeader(sizes: { size: number }[]): Uint8Array {
  const count = sizes.length;
  const headerSize = 6 + 16 * count;
  const buf = new Uint8Array(headerSize);
  const view = new DataView(buf.buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, count, true);
  sizes.forEach((s, i) => {
    const entryOffset = 6 + 16 * i;
    const dim = s.size >= 256 ? 0 : s.size;
    buf[entryOffset + 0] = dim;
    buf[entryOffset + 1] = dim;
    buf[entryOffset + 2] = 0;
    buf[entryOffset + 3] = 0;
    view.setUint16(entryOffset + 4, 1, true);
    view.setUint16(entryOffset + 6, 32, true);
    // Size/offset are 0 since no real data in header-only mode
    view.setUint32(entryOffset + 8, 0, true);
    view.setUint32(entryOffset + 12, 0, true);
  });
  return buf;
}
