/**
 * Shared pdf.js loader.
 *
 * pdf.js is a heavy bundle, so it is lazy-imported on first use, and its web
 * worker is configured exactly once. Tools that need to rasterize PDF pages
 * (PDF → images, rotate/organize) import from here instead of each wiring up
 * the worker themselves.
 */

let workerConfigured = false;

export async function getPdfjs() {
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

/** Trigger a browser download for a blob, cleaning up the object URL after. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
