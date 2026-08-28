/**
 * Live PDF preview rendering, backed by pdf.js.
 *
 * pdf-lib (see logic.ts) reads/writes PDF structure but cannot rasterize pages.
 * pdf.js renders to a canvas and, crucially, is optional-content aware: we can
 * toggle OCG layer visibility and re-render so the preview matches what the
 * exported file will show.
 *
 * Kept isolated from logic.ts so the heavy pdf.js bundle is only pulled in when
 * a preview is actually created, and so neither library leaks into the other.
 */

let workerConfigured = false;

async function getLib() {
  const pdfjs = await import('pdfjs-dist');
  if (!workerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
    workerConfigured = true;
  }
  return pdfjs;
}

export interface PreviewGroup {
  id: string;
  name: string;
}

export class PdfPreview {
  // pdf.js types are heavy and not needed at our boundary; treated as opaque.
  private doc: any = null;
  private config: any = null;
  private renderTask: any = null;
  pageCount = 0;
  /** OCG layers as pdf.js sees them; correlated to the checkbox list by name. */
  groups: PreviewGroup[] = [];

  static async create(bytes: Uint8Array): Promise<PdfPreview> {
    const pdfjs = await getLib();
    const self = new PdfPreview();
    // pdf.js may detach the backing buffer, so hand it a throwaway copy.
    const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
    self.doc = doc;
    self.pageCount = doc.numPages;

    const config = await doc.getOptionalContentConfig();
    self.config = config;
    // OptionalContentConfig is iterable, yielding [id, group] pairs.
    const entries: [any, any][] = config ? [...config] : [];
    self.groups = entries.map(([id, g]) => ({
      id: String(id),
      name: g?.name ?? String(id),
    }));
    return self;
  }

  /** Show only layers whose name is in `selectedNames`; hide the rest. */
  setLayerVisibilityByName(selectedNames: Set<string>) {
    if (!this.config) return;
    for (const g of this.groups) {
      this.config.setVisibility(g.id, selectedNames.has(g.name));
    }
  }

  /** Render a 1-based page into the canvas at roughly `targetWidth` CSS px. */
  async renderPage(canvas: HTMLCanvasElement, pageNum: number, targetWidth: number) {
    if (!this.doc) return;
    if (this.renderTask) {
      try {
        this.renderTask.cancel();
      } catch {
        /* already settled */
      }
      this.renderTask = null;
    }

    const page = await this.doc.getPage(pageNum);
    const base = page.getViewport({ scale: 1 });
    const scale = targetWidth / base.width;
    const viewport = page.getViewport({ scale });
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const task = page.render({
      canvasContext: ctx,
      viewport,
      optionalContentConfigPromise: Promise.resolve(this.config),
    });
    this.renderTask = task;
    try {
      await task.promise;
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') throw err;
    } finally {
      if (this.renderTask === task) this.renderTask = null;
    }
  }

  destroy() {
    try {
      this.renderTask?.cancel?.();
    } catch {
      /* noop */
    }
    try {
      this.doc?.destroy?.();
    } catch {
      /* noop */
    }
    this.doc = null;
    this.config = null;
  }
}
