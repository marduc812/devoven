import {
  PDFDocument,
  PDFName,
  PDFArray,
  PDFDict,
  PDFRef,
  PDFString,
  PDFHexString,
} from 'pdf-lib';

export type PdfMode = 'layers' | 'pages';

export interface PdfItem {
  /** OCG index (layer mode) or zero-based page index (page mode). */
  id: number;
  label: string;
}

export interface PdfInspection {
  mode: PdfMode;
  items: PdfItem[];
}

/** Read the optional-content groups (`/OCProperties` → `/OCGs`) from a catalog, if any. */
function getOcgArray(pdf: PDFDocument): PDFArray | undefined {
  const ocProps = pdf.catalog.lookupMaybe(PDFName.of('OCProperties'), PDFDict);
  if (!ocProps) return undefined;
  return ocProps.lookupMaybe(PDFName.of('OCGs'), PDFArray);
}

function decodeName(value: unknown, fallback: string): string {
  if (value instanceof PDFString || value instanceof PDFHexString) {
    const text = value.decodeText().trim();
    if (text) return text;
  }
  return fallback;
}

/**
 * Inspect a PDF: if it defines OCG layers, return them; otherwise fall back to
 * listing pages so the user can pick which to export.
 */
export async function inspectPdf(bytes: Uint8Array): Promise<PdfInspection> {
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: false });

  const ocgs = getOcgArray(pdf);
  if (ocgs && ocgs.size() > 0) {
    const items: PdfItem[] = [];
    for (let i = 0; i < ocgs.size(); i++) {
      const dict = ocgs.lookupMaybe(i, PDFDict);
      const name = dict?.get(PDFName.of('Name'));
      items.push({ id: i, label: decodeName(name, `Layer ${i + 1}`) });
    }
    return { mode: 'layers', items };
  }

  const items: PdfItem[] = pdf.getPages().map((_, i) => ({
    id: i,
    label: `Page ${i + 1}`,
  }));
  return { mode: 'pages', items };
}

/**
 * Build the exported PDF.
 *
 * - Page mode: copy only the selected pages into a fresh document.
 * - Layer mode: keep every page but add each *deselected* OCG to the default
 *   configuration's `/OFF` array so conforming viewers hide it. Content is
 *   hidden, not removed.
 */
export async function buildPdf(
  bytes: Uint8Array,
  mode: PdfMode,
  selectedIds: number[],
): Promise<Uint8Array> {
  const selected = new Set(selectedIds);

  if (mode === 'pages') {
    const src = await PDFDocument.load(bytes, { ignoreEncryption: false });
    const out = await PDFDocument.create();
    const indices = src.getPageIndices().filter(i => selected.has(i));
    if (indices.length === 0) {
      throw new Error('Select at least one page to export.');
    }
    const pages = await out.copyPages(src, indices);
    pages.forEach(p => out.addPage(p));
    return out.save();
  }

  // Layer mode — operate in place on the loaded document.
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: false });
  const ocProps = pdf.catalog.lookupMaybe(PDFName.of('OCProperties'), PDFDict);
  const ocgs = ocProps?.lookupMaybe(PDFName.of('OCGs'), PDFArray);
  if (!ocProps || !ocgs) {
    throw new Error('No layers found in this PDF.');
  }

  // The default configuration dictionary `/D` holds visibility state.
  let dConfig = ocProps.lookupMaybe(PDFName.of('D'), PDFDict);
  if (!dConfig) {
    dConfig = pdf.context.obj({}) as PDFDict;
    ocProps.set(PDFName.of('D'), dConfig);
  }

  // Collect refs to deselected layers and turn them off by default.
  const offRefs: PDFRef[] = [];
  for (let i = 0; i < ocgs.size(); i++) {
    if (!selected.has(i)) {
      const ref = ocgs.get(i);
      if (ref instanceof PDFRef) offRefs.push(ref);
    }
  }

  const offArray = pdf.context.obj([]) as PDFArray;
  offRefs.forEach(ref => offArray.push(ref));
  dConfig.set(PDFName.of('OFF'), offArray);
  // Drop any stale ON entry so it can't override the OFF list.
  dConfig.delete(PDFName.of('ON'));

  return pdf.save();
}
