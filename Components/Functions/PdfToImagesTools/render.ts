/**
 * Rasterizes PDF pages to images via pdf.js.
 *
 * Thumbnails are rendered small for on-screen display; the full-resolution
 * export re-renders the requested page at the chosen scale so memory stays
 * bounded even for large documents.
 */
import { getPdfjs } from '../PdfShared/pdfjs';

export type ImageFormat = 'png' | 'jpeg';

export class PdfRasterizer {
  private doc: any = null;
  pageCount = 0;

  static async create(bytes: Uint8Array): Promise<PdfRasterizer> {
    const pdfjs = await getPdfjs();
    const self = new PdfRasterizer();
    // pdf.js may detach the backing buffer; hand it a throwaway copy.
    self.doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
    self.pageCount = self.doc.numPages;
    return self;
  }

  /** Render a 1-based page into the canvas at roughly `targetWidth` CSS px. */
  async renderThumb(canvas: HTMLCanvasElement, pageNum: number, targetWidth: number) {
    if (!this.doc) return;
    const page = await this.doc.getPage(pageNum);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: targetWidth / base.width });
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
  }

  /** Render a 1-based page to an image blob at the given device scale. */
  async renderToBlob(
    pageNum: number,
    scale: number,
    format: ImageFormat,
    quality = 0.92,
  ): Promise<Blob> {
    if (!this.doc) throw new Error('Document not loaded.');
    const page = await this.doc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported.');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    if (format === 'jpeg') {
      // JPEG has no alpha; paint white so transparent PDFs don't go black.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    await page.render({ canvasContext: ctx, viewport }).promise;
    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, mime, quality),
    );
    if (!blob) throw new Error('Failed to encode image.');
    return blob;
  }

  destroy() {
    try {
      this.doc?.destroy?.();
    } catch {
      /* noop */
    }
    this.doc = null;
  }
}
