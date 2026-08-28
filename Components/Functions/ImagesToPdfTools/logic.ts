import { PDFDocument } from 'pdf-lib';

export type PageSizing = 'image' | 'a4' | 'a4-landscape';

export interface ImageInput {
  name: string;
  type: string;
  bytes: Uint8Array;
}

// A4 at 72 dpi, in points.
const A4_PORTRAIT: [number, number] = [595.28, 841.89];
const A4_LANDSCAPE: [number, number] = [841.89, 595.28];
const A4_MARGIN = 24;

/**
 * Decode an image to PNG bytes via a canvas. Used for formats pdf-lib cannot
 * embed directly (e.g. WebP); JPEG and PNG keep their original bytes.
 */
async function toEmbeddable(
  input: ImageInput,
): Promise<{ bytes: Uint8Array; kind: 'png' | 'jpg' }> {
  const isJpg = /jpe?g/i.test(input.type) || /\.jpe?g$/i.test(input.name);
  const isPng = /png/i.test(input.type) || /\.png$/i.test(input.name);
  if (isJpg) return { bytes: input.bytes, kind: 'jpg' };
  if (isPng) return { bytes: input.bytes, kind: 'png' };

  // Re-encode anything else (WebP, GIF, BMP…) to PNG.
  const blob = new Blob([input.bytes as BlobPart], { type: input.type || 'image/png' });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(`Could not decode "${input.name}".`));
      el.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported.');
    ctx.drawImage(img, 0, 0);
    const pngBlob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/png'),
    );
    if (!pngBlob) throw new Error(`Could not convert "${input.name}".`);
    return { bytes: new Uint8Array(await pngBlob.arrayBuffer()), kind: 'png' };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Build a PDF with one image per page, in order. */
export async function imagesToPdf(
  images: ImageInput[],
  sizing: PageSizing,
): Promise<Uint8Array> {
  if (images.length === 0) throw new Error('Add at least one image.');
  const doc = await PDFDocument.create();

  for (const input of images) {
    const { bytes, kind } = await toEmbeddable(input);
    const embedded = kind === 'jpg' ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);

    if (sizing === 'image') {
      const page = doc.addPage([embedded.width, embedded.height]);
      page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
    } else {
      const [pw, ph] = sizing === 'a4-landscape' ? A4_LANDSCAPE : A4_PORTRAIT;
      const page = doc.addPage([pw, ph]);
      const maxW = pw - A4_MARGIN * 2;
      const maxH = ph - A4_MARGIN * 2;
      const fit = Math.min(maxW / embedded.width, maxH / embedded.height, 1);
      const w = embedded.width * fit;
      const h = embedded.height * fit;
      page.drawImage(embedded, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
    }
  }

  return doc.save();
}
