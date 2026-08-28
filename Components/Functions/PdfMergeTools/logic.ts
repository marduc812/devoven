import { PDFDocument } from 'pdf-lib';

export interface MergeInput {
  name: string;
  bytes: Uint8Array;
}

/** Read a PDF's page count without keeping the parsed document around. */
export async function countPages(bytes: Uint8Array): Promise<number> {
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: false });
  return pdf.getPageCount();
}

/** Concatenate every page of each input PDF, in the given order, into one file. */
export async function mergePdfs(inputs: MergeInput[]): Promise<Uint8Array> {
  if (inputs.length === 0) throw new Error('Add at least one PDF to merge.');
  const out = await PDFDocument.create();
  for (const input of inputs) {
    const src = await PDFDocument.load(input.bytes, { ignoreEncryption: false });
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach(p => out.addPage(p));
  }
  return out.save();
}
