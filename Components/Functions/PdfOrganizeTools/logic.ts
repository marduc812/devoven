import { PDFDocument, degrees } from 'pdf-lib';

export interface OrganizePage {
  /** Zero-based index of the page in the source document. */
  srcIndex: number;
  /** Extra clockwise rotation to apply, in degrees (0/90/180/270). */
  rotation: number;
}

/**
 * Rebuild a PDF from the given pages, in order, applying each page's extra
 * rotation on top of whatever rotation it already had. Pages omitted from the
 * list are dropped.
 */
export async function organizePdf(
  bytes: Uint8Array,
  pages: OrganizePage[],
): Promise<Uint8Array> {
  if (pages.length === 0) throw new Error('Keep at least one page.');
  const src = await PDFDocument.load(bytes, { ignoreEncryption: false });
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, pages.map(p => p.srcIndex));
  copied.forEach((page, i) => {
    const base = page.getRotation().angle;
    const total = (((base + pages[i].rotation) % 360) + 360) % 360;
    page.setRotation(degrees(total));
    out.addPage(page);
  });
  return out.save();
}
