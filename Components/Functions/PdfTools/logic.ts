/**
 * Shared logic for the PDF category.
 *
 * Everything here is importable from Node (pdf-lib is pure JS), so the whole
 * module is unit-tested in `__tests__/pdf-tools.test.ts`. Rendering-side work
 * that needs pdf.js and a canvas stays in the components.
 */

import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';

// ─── Page ranges ────────────────────────────────────────────────────────────

/**
 * Parse a 1-based page-range spec into zero-based page indices.
 *
 * Accepts `1-3, 5, 8-` and `all`/empty (meaning every page). Ranges are
 * expanded in the order written, and a page listed twice is only kept once so
 * a spec like `1-3,2` cannot silently duplicate a page.
 */
export function parsePageRanges(spec: string, pageCount: number): number[] {
    if (pageCount <= 0) throw new Error('The document has no pages.');

    const trimmed = spec.trim();
    if (trimmed === '' || /^all$/i.test(trimmed)) {
        return Array.from({ length: pageCount }, (_, i) => i);
    }

    const seen = new Set<number>();
    const out: number[] = [];

    for (const rawPart of trimmed.split(',')) {
        const part = rawPart.trim();
        if (part === '') continue;

        const match = part.match(/^(\d+)\s*(?:-\s*(\d+)?)?$/);
        if (!match) throw new Error(`"${part}" is not a page or a page range.`);

        const start = Number(match[1]);
        // `8-` (no end) runs to the last page; `8` alone is a single page.
        const hasDash = part.includes('-');
        const end = match[2] !== undefined ? Number(match[2]) : hasDash ? pageCount : start;

        if (start < 1) throw new Error('Pages are numbered from 1.');
        if (start > pageCount || end > pageCount) {
            throw new Error(`This PDF only has ${pageCount} page${pageCount === 1 ? '' : 's'}.`);
        }
        if (end < start) throw new Error(`"${part}" runs backwards — write it as ${end}-${start}.`);

        for (let p = start; p <= end; p++) {
            if (!seen.has(p)) {
                seen.add(p);
                out.push(p - 1);
            }
        }
    }

    if (out.length === 0) throw new Error('Select at least one page.');
    return out;
}

/** Group page indices into fixed-size chunks, for "split every N pages". */
export function chunkPages(indices: number[], size: number): number[][] {
    if (!Number.isInteger(size) || size < 1) throw new Error('Chunk size must be 1 or more.');
    const chunks: number[][] = [];
    for (let i = 0; i < indices.length; i += size) chunks.push(indices.slice(i, i + size));
    return chunks;
}

/** Render page indices back as a compact 1-based label, e.g. `1-3,7`. */
export function describePages(indices: number[]): string {
    if (indices.length === 0) return '';
    const parts: string[] = [];
    let runStart = indices[0];
    let prev = indices[0];

    for (let i = 1; i <= indices.length; i++) {
        const current = indices[i];
        if (i < indices.length && current === prev + 1) {
            prev = current;
            continue;
        }
        parts.push(runStart === prev ? `${runStart + 1}` : `${runStart + 1}-${prev + 1}`);
        runStart = current;
        prev = current;
    }
    return parts.join(',');
}

// ─── Visual page selection ──────────────────────────────────────────────────
//
// The split tool lets a user click page thumbnails instead of typing ranges.
// The range string stays the single source of truth, so these helpers take and
// return sorted zero-based index arrays that `describePages` turns back into a
// spec.

const sorted = (indices: Iterable<number>) => [...new Set(indices)].sort((a, b) => a - b);

/** Add `index` if missing, drop it if present. */
export function togglePage(indices: number[], index: number): number[] {
    return indices.includes(index)
        ? indices.filter(i => i !== index)
        : sorted([...indices, index]);
}

/** Shift-click: add every page between `anchor` and `index`, inclusive. */
export function extendSelection(indices: number[], anchor: number, index: number): number[] {
    const [from, to] = anchor <= index ? [anchor, index] : [index, anchor];
    const span: number[] = [];
    for (let i = from; i <= to; i++) span.push(i);
    return sorted([...indices, ...span]);
}

/** Every page not currently selected. */
export function invertSelection(indices: number[], pageCount: number): number[] {
    const have = new Set(indices);
    const out: number[] = [];
    for (let i = 0; i < pageCount; i++) if (!have.has(i)) out.push(i);
    return out;
}

/** Zero-based indices of the odd- or even-numbered pages (1-based labels). */
export function parityPages(pageCount: number, parity: 'odd' | 'even'): number[] {
    const out: number[] = [];
    for (let i = 0; i < pageCount; i++) {
        if ((i % 2 === 0) === (parity === 'odd')) out.push(i);
    }
    return out;
}

// ─── Page sizes ─────────────────────────────────────────────────────────────

/** Standard page sizes in PDF points (72 per inch), portrait. */
export const PAGE_SIZES: Record<string, [number, number]> = {
    A3: [841.89, 1190.55],
    A4: [595.28, 841.89],
    A5: [419.53, 595.28],
    Letter: [612, 792],
    Legal: [612, 1008],
    Tabloid: [792, 1224],
};

/** The uniform scale that fits a source box inside a destination box. */
export function fitScale(srcW: number, srcH: number, dstW: number, dstH: number): number {
    if (srcW <= 0 || srcH <= 0) throw new Error('Page has no size.');
    return Math.min(dstW / srcW, dstH / srcH);
}

// ─── Text placement ─────────────────────────────────────────────────────────

export type Corner =
    | 'top-left' | 'top-center' | 'top-right'
    | 'bottom-left' | 'bottom-center' | 'bottom-right';

/**
 * Bottom-left origin coordinates for a run of text placed in one of the six
 * corner/edge slots. `textWidth` is the measured width of the string.
 */
export function cornerPosition(
    corner: Corner,
    pageW: number,
    pageH: number,
    textWidth: number,
    fontSize: number,
    margin: number,
): { x: number; y: number } {
    const [vertical, horizontal] = corner.split('-') as ['top' | 'bottom', 'left' | 'center' | 'right'];

    const x =
        horizontal === 'left' ? margin
        : horizontal === 'right' ? pageW - margin - textWidth
        : (pageW - textWidth) / 2;

    // PDF y grows upwards, so the top slot sits a font-height below the edge.
    const y = vertical === 'top' ? pageH - margin - fontSize : margin;

    return { x, y };
}

/** Fill `{n}` (page number) and `{N}` (total) in a page-number template. */
export function pageLabel(template: string, pageNumber: number, total: number): string {
    return template.replace(/\{n\}/g, String(pageNumber)).replace(/\{N\}/g, String(total));
}

// ─── Names and formatting ───────────────────────────────────────────────────

/** `report.pdf` + `split` → `report-split.pdf`. */
export function outputName(sourceName: string, suffix: string, ext = 'pdf'): string {
    const base = sourceName.replace(/\.[^./\\]+$/, '') || 'document';
    return `${base}-${suffix}.${ext}`;
}

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Page dimensions as a human label, e.g. `595 × 842 pt (A4 portrait)`. */
export function describePageSize(width: number, height: number): string {
    const rounded = `${Math.round(width)} × ${Math.round(height)} pt`;
    const portrait = height >= width;
    const [w, h] = portrait ? [width, height] : [height, width];

    for (const [name, [pw, ph]] of Object.entries(PAGE_SIZES)) {
        // Within a point in each dimension is the same paper size in practice.
        if (Math.abs(w - pw) < 1.5 && Math.abs(h - ph) < 1.5) {
            return `${rounded} (${name} ${portrait ? 'portrait' : 'landscape'})`;
        }
    }
    return rounded;
}

/** Join pdf.js text items into lines, using their end-of-line markers. */
export function joinTextItems(items: { str: string; hasEOL?: boolean }[]): string {
    let out = '';
    for (const item of items) {
        out += item.str;
        if (item.hasEOL) out += '\n';
    }
    // pdf.js emits a lot of empty runs; collapse the resulting blank runs.
    return out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ─── pdf-lib operations ─────────────────────────────────────────────────────

/**
 * `updateMetadata` defaults to true, which makes pdf-lib stamp itself as the
 * Producer and rewrite ModDate on every load — including inside the tools that
 * only *read* metadata. Turning it off keeps DevOven from silently rewriting
 * fields the user never asked to touch.
 */
const load = (bytes: Uint8Array) =>
    PDFDocument.load(bytes, { ignoreEncryption: false, updateMetadata: false });

/**
 * Carry a source document's Info dictionary onto a derived one.
 *
 * `PDFDocument.create()` starts with empty metadata and pdf-lib's own Producer,
 * so without this a split or extracted file loses its title and author.
 */
function copyMetadata(src: PDFDocument, out: PDFDocument): void {
    const title = src.getTitle();
    const author = src.getAuthor();
    const subject = src.getSubject();
    const keywords = src.getKeywords();
    const creator = src.getCreator();
    const producer = src.getProducer();
    const created = src.getCreationDate();

    if (title !== undefined) out.setTitle(title);
    if (author !== undefined) out.setAuthor(author);
    if (subject !== undefined) out.setSubject(subject);
    if (keywords !== undefined) out.setKeywords([keywords.toString()]);
    if (creator !== undefined) out.setCreator(creator);
    if (producer !== undefined) out.setProducer(producer);
    if (created !== undefined) out.setCreationDate(created);
}

/** Build a new PDF containing only the given pages, in the given order. */
export async function extractPages(bytes: Uint8Array, indices: number[]): Promise<Uint8Array> {
    if (indices.length === 0) throw new Error('Select at least one page.');
    const src = await load(bytes);
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, indices);
    copied.forEach(page => out.addPage(page));
    copyMetadata(src, out);
    return out.save();
}

export interface SplitFile {
    name: string;
    bytes: Uint8Array;
    pages: string;
}

/** Split a document into one PDF per chunk of pages. */
export async function splitIntoFiles(
    bytes: Uint8Array,
    chunks: number[][],
    sourceName: string,
): Promise<SplitFile[]> {
    const files: SplitFile[] = [];
    for (const chunk of chunks) {
        const pages = describePages(chunk);
        files.push({
            name: outputName(sourceName, `pages-${pages}`),
            bytes: await extractPages(bytes, chunk),
            pages,
        });
    }
    return files;
}

export type ResizeMode = 'fit' | 'stretch';

export interface ResizePlan {
    /** The new page box, after orientation matching. */
    width: number;
    height: number;
    scaleX: number;
    scaleY: number;
    /** Where the scaled content lands inside that box. */
    offsetX: number;
    offsetY: number;
}

/**
 * What resizing one page onto a target sheet does to it.
 *
 * Split out from `resizePages` so the tool can draw the same geometry it is
 * about to apply — the letterboxing a "fit" leaves is the whole question a
 * user has when picking a paper size.
 */
export function planResize(
    srcWidth: number,
    srcHeight: number,
    targetW: number,
    targetH: number,
    mode: ResizeMode = 'fit',
    matchOrientation = true,
): ResizePlan {
    if (srcWidth <= 0 || srcHeight <= 0) throw new Error('Page has no size.');

    // Keep a landscape page landscape instead of squeezing it into portrait.
    const landscape = srcWidth > srcHeight;
    const [width, height] =
        matchOrientation && landscape ? [Math.max(targetW, targetH), Math.min(targetW, targetH)]
        : matchOrientation ? [Math.min(targetW, targetH), Math.max(targetW, targetH)]
        : [targetW, targetH];

    if (mode === 'stretch') {
        return { width, height, scaleX: width / srcWidth, scaleY: height / srcHeight, offsetX: 0, offsetY: 0 };
    }

    const scale = fitScale(srcWidth, srcHeight, width, height);
    return {
        width,
        height,
        scaleX: scale,
        scaleY: scale,
        offsetX: (width - srcWidth * scale) / 2,
        offsetY: (height - srcHeight * scale) / 2,
    };
}

/**
 * Re-lay every page onto a target paper size.
 *
 * The page's own content is scaled and re-centred rather than re-embedded, so
 * page rotation, annotations and links survive.
 */
export async function resizePages(
    bytes: Uint8Array,
    targetW: number,
    targetH: number,
    mode: ResizeMode = 'fit',
    matchOrientation = true,
): Promise<Uint8Array> {
    const doc = await load(bytes);

    for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        const plan = planResize(width, height, targetW, targetH, mode, matchOrientation);

        page.scaleContent(plan.scaleX, plan.scaleY);
        // Called after scaleContent so the translation is prepended to the
        // content stream and therefore applies in unscaled page units.
        if (plan.offsetX !== 0 || plan.offsetY !== 0) {
            page.translateContent(plan.offsetX, plan.offsetY);
        }
        page.setSize(plan.width, plan.height);
    }

    return doc.save();
}

export interface PageNumberOptions {
    template: string;
    corner: Corner;
    fontSize: number;
    margin: number;
    /** 1-based page to start numbering at; earlier pages are left blank. */
    startPage: number;
    /** Number printed on `startPage`. */
    startAt: number;
}

export async function addPageNumbers(
    bytes: Uint8Array,
    options: PageNumberOptions,
): Promise<Uint8Array> {
    const doc = await load(bytes);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pages = doc.getPages();
    const numbered = Math.max(0, pages.length - (options.startPage - 1));

    pages.forEach((page, index) => {
        const humanPage = index + 1;
        if (humanPage < options.startPage) return;

        const shown = options.startAt + (humanPage - options.startPage);
        const text = pageLabel(options.template, shown, numbered + options.startAt - 1);
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, options.fontSize);
        const { x, y } = cornerPosition(options.corner, width, height, textWidth, options.fontSize, options.margin);

        page.drawText(text, { x, y, size: options.fontSize, font, color: rgb(0, 0, 0) });
    });

    return doc.save();
}

export interface WatermarkOptions {
    text: string;
    fontSize: number;
    opacity: number;
    rotation: number;
    color: { r: number; g: number; b: number };
}

/** Stamp diagonal text across the centre of every page. */
export async function watermarkPdf(
    bytes: Uint8Array,
    options: WatermarkOptions,
): Promise<Uint8Array> {
    if (options.text.trim() === '') throw new Error('Enter some watermark text.');

    const doc = await load(bytes);
    const font = await doc.embedFont(StandardFonts.HelveticaBold);

    for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(options.text, options.fontSize);
        const radians = (options.rotation * Math.PI) / 180;

        // Rotation in pdf-lib pivots on the draw origin, so offset by half the
        // rotated extent to keep the run centred on the page.
        const dx = (textWidth / 2) * Math.cos(radians) - (options.fontSize / 2) * Math.sin(radians);
        const dy = (textWidth / 2) * Math.sin(radians) + (options.fontSize / 2) * Math.cos(radians);

        page.drawText(options.text, {
            x: width / 2 - dx,
            y: height / 2 - dy,
            size: options.fontSize,
            font,
            color: rgb(options.color.r, options.color.g, options.color.b),
            opacity: options.opacity,
            rotate: degrees(options.rotation),
        });
    }

    return doc.save();
}

export interface PdfMetadata {
    title: string;
    author: string;
    subject: string;
    keywords: string;
    creator: string;
    producer: string;
}

export async function readMetadata(bytes: Uint8Array): Promise<PdfMetadata> {
    const doc = await load(bytes);
    return {
        title: doc.getTitle() ?? '',
        author: doc.getAuthor() ?? '',
        subject: doc.getSubject() ?? '',
        keywords: (doc.getKeywords() ?? '').toString(),
        creator: doc.getCreator() ?? '',
        producer: doc.getProducer() ?? '',
    };
}

export async function writeMetadata(bytes: Uint8Array, meta: PdfMetadata): Promise<Uint8Array> {
    const doc = await load(bytes);
    doc.setTitle(meta.title);
    doc.setAuthor(meta.author);
    doc.setSubject(meta.subject);
    // pdf-lib joins a keyword array with spaces, which would turn the user's
    // "q3, draft" into "q3 draft" on the next read. Writing the string as a
    // single entry stores it verbatim, so the field round-trips unchanged.
    doc.setKeywords(meta.keywords.trim() === '' ? [] : [meta.keywords]);
    doc.setCreator(meta.creator);
    doc.setProducer(meta.producer);
    doc.setModificationDate(new Date());
    return doc.save();
}

export interface FormField {
    name: string;
    type: string;
}

export async function listFormFields(bytes: Uint8Array): Promise<FormField[]> {
    const doc = await load(bytes);
    return doc.getForm().getFields().map(field => ({
        name: field.getName(),
        // constructor.name is 'PDFTextField', 'PDFCheckBox', …
        type: field.constructor.name.replace(/^PDF/, ''),
    }));
}

/** Bake form field values into the page content so they can't be edited. */
export async function flattenPdf(bytes: Uint8Array): Promise<Uint8Array> {
    const doc = await load(bytes);
    doc.getForm().flatten();
    return doc.save();
}

export interface PdfPageInfo {
    number: number;
    width: number;
    height: number;
    rotation: number;
}

export interface PdfInfo {
    pageCount: number;
    pages: PdfPageInfo[];
    metadata: PdfMetadata;
    creationDate?: Date;
    modificationDate?: Date;
    formFields: number;
    /** True when every page shares the same size and rotation. */
    uniformPages: boolean;
}

export async function inspectPdf(bytes: Uint8Array): Promise<PdfInfo> {
    const doc = await load(bytes);

    const pages: PdfPageInfo[] = doc.getPages().map((page, index) => {
        const { width, height } = page.getSize();
        return { number: index + 1, width, height, rotation: page.getRotation().angle };
    });

    const first = pages[0];
    const uniformPages = pages.every(
        p =>
            first !== undefined &&
            Math.abs(p.width - first.width) < 0.5 &&
            Math.abs(p.height - first.height) < 0.5 &&
            p.rotation === first.rotation,
    );

    let formFields = 0;
    try {
        formFields = doc.getForm().getFields().length;
    } catch {
        // A document with no AcroForm dictionary — not an error.
    }

    return {
        pageCount: pages.length,
        pages,
        metadata: {
            title: doc.getTitle() ?? '',
            author: doc.getAuthor() ?? '',
            subject: doc.getSubject() ?? '',
            keywords: (doc.getKeywords() ?? '').toString(),
            creator: doc.getCreator() ?? '',
            producer: doc.getProducer() ?? '',
        },
        creationDate: doc.getCreationDate(),
        modificationDate: doc.getModificationDate(),
        formFields,
        uniformPages,
    };
}

export interface PageSizeGroup {
    /** e.g. `595 × 842 pt (A4 portrait)`. */
    label: string;
    rotation: number;
    /** 1-based page numbers sharing this size and rotation, in document order. */
    pages: number[];
}

/**
 * Collapse a page list into the distinct sizes it uses. A uniform document
 * yields one group; a report with a landscape appendix yields two, which is
 * what the visual report shows instead of one row per page.
 */
export function summarizePageSizes(pages: PdfPageInfo[]): PageSizeGroup[] {
    const groups = new Map<string, PageSizeGroup>();

    for (const page of pages) {
        // Round before keying so two pages a hundredth of a point apart are
        // not reported as different sizes.
        const key = `${Math.round(page.width * 10)}x${Math.round(page.height * 10)}r${page.rotation}`;
        const existing = groups.get(key);
        if (existing) {
            existing.pages.push(page.number);
        } else {
            groups.set(key, {
                label: describePageSize(page.width, page.height),
                rotation: page.rotation,
                pages: [page.number],
            });
        }
    }

    return [...groups.values()];
}

/** Render a PdfInfo as the plain-text report the PDF Info tool outputs. */
export function formatPdfInfo(info: PdfInfo, fileName: string, fileSize: number): string {
    const lines: string[] = [];
    const meta = info.metadata;

    lines.push(`File            ${fileName}`);
    lines.push(`Size            ${formatBytes(fileSize)}`);
    lines.push(`Pages           ${info.pageCount}`);
    lines.push('');

    if (info.uniformPages && info.pages.length > 0) {
        const p = info.pages[0];
        lines.push(`Page size       ${describePageSize(p.width, p.height)}`);
        if (p.rotation !== 0) lines.push(`Rotation        ${p.rotation}°`);
    } else {
        lines.push('Page size       mixed:');
        for (const p of info.pages) {
            const rotation = p.rotation !== 0 ? `, rotated ${p.rotation}°` : '';
            lines.push(`  page ${p.number}       ${describePageSize(p.width, p.height)}${rotation}`);
        }
    }

    lines.push('');
    lines.push(`Title           ${meta.title || '—'}`);
    lines.push(`Author          ${meta.author || '—'}`);
    lines.push(`Subject         ${meta.subject || '—'}`);
    lines.push(`Keywords        ${meta.keywords || '—'}`);
    lines.push(`Creator         ${meta.creator || '—'}`);
    lines.push(`Producer        ${meta.producer || '—'}`);
    lines.push(`Created         ${info.creationDate ? info.creationDate.toISOString() : '—'}`);
    lines.push(`Modified        ${info.modificationDate ? info.modificationDate.toISOString() : '—'}`);
    lines.push(`Form fields     ${info.formFields || 'none'}`);

    return lines.join('\n');
}
