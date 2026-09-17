/**
 * Shrinking a PDF by re-encoding the images inside it.
 *
 * Almost every oversized PDF is oversized because of its images, and phone
 * scans are the extreme case: iOS stores each scanned page as a raw RGB bitmap
 * run through zlib, so a four-page scan lands at 12 MB with no JPEG anywhere in
 * the file. Re-encoding those bitmaps as JPEG is worth 80-95%, and because only
 * image streams are touched, a text PDF keeps its selectable text.
 *
 * The decisions live here as pure functions and the walk takes its JPEG encoder
 * as an argument, so everything except the canvas call itself is unit-tested in
 * `__tests__/pdf-compress.test.ts`. `canvasJpegEncoder` is the browser half and
 * only touches the DOM when it is called.
 */

import { PDFArray, PDFDict, PDFDocument, PDFName, PDFNumber, PDFRawStream, PDFRef, PDFStream } from 'pdf-lib';
import { unzlibSync } from 'fflate';

// ─── Levels ─────────────────────────────────────────────────────────────────

export type CompressLevel = 'light' | 'balanced' | 'strong' | 'extreme';

export interface CompressPreset {
    label: string;
    /** JPEG quality, as canvas takes it. */
    quality: number;
    /** Longest edge in pixels, or 0 to keep every image at its own resolution. */
    maxDim: number;
    blurb: string;
}

export const COMPRESS_LEVELS: CompressLevel[] = ['light', 'balanced', 'strong', 'extreme'];

export const COMPRESS_PRESETS: Record<CompressLevel, CompressPreset> = {
    light: {
        label: 'Light',
        quality: 0.85,
        maxDim: 0,
        blurb: 'Every image keeps its resolution. The safe choice for anything you may print.',
    },
    balanced: {
        label: 'Balanced',
        quality: 0.7,
        maxDim: 2000,
        blurb: 'Still sharp on screen and at A4 print size. A good default for scans.',
    },
    strong: {
        label: 'Strong',
        quality: 0.55,
        maxDim: 1700,
        blurb: 'Document scans stay perfectly readable. Photos start to show artefacts.',
    },
    extreme: {
        label: 'Extreme',
        quality: 0.4,
        maxDim: 1200,
        blurb: 'For email attachments and upload limits, when size beats fidelity.',
    },
};

// ─── Planning ───────────────────────────────────────────────────────────────

/** An image XObject as read from the PDF, before any decision about it. */
export interface ImageCandidate {
    width: number;
    height: number;
    /** The single filter name without its slash, or null when absent or chained. */
    filter: string | null;
    /** Colour components: 1 for grey, 3 for RGB. Null when the colorspace cannot be resolved. */
    components: number | null;
    bitsPerComponent: number | null;
    /** Carries an /SMask or /Mask, so it has transparency a JPEG cannot hold. */
    hasMask: boolean;
    /** A 1-bit stencil, drawn in the current fill colour rather than its own. */
    isImageMask: boolean;
    /** Referenced as some other image's mask, so rewriting it would break that image. */
    isMaskForAnother: boolean;
    hasPredictor: boolean;
    byteLength: number;
}

export type ImagePlan =
    | { action: 'skip'; reason: string }
    | { action: 'encode'; width: number; height: number };

/**
 * Below this, re-encoding costs more time than it saves bytes, and the result
 * is as likely to grow as to shrink.
 */
const MIN_WORTHWHILE_BYTES = 2048;

/** Fit an image inside a square limit, preserving its aspect ratio. */
export function scaleToFit(width: number, height: number, maxDim: number): [number, number] {
    const longest = Math.max(width, height);
    if (maxDim <= 0 || longest <= maxDim) return [width, height];
    const scale = maxDim / longest;
    return [Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale))];
}

/**
 * Decide what to do with one image.
 *
 * Every rule here exists to protect a file we cannot improve: the cost of
 * leaving an image alone is a smaller saving, and the cost of getting it wrong
 * is a corrupted document. When in doubt, skip.
 */
export function planImage(image: ImageCandidate, preset: CompressPreset): ImagePlan {
    if (image.width < 1 || image.height < 1) return { action: 'skip', reason: 'no pixels' };
    if (image.isImageMask) return { action: 'skip', reason: 'stencil mask' };
    if (image.hasMask) return { action: 'skip', reason: 'transparency' };
    if (image.isMaskForAnother) return { action: 'skip', reason: 'used as a mask' };
    if (image.filter !== 'FlateDecode' && image.filter !== 'DCTDecode') {
        return { action: 'skip', reason: image.filter ? `${image.filter} images` : 'unfiltered image' };
    }
    if (image.hasPredictor) return { action: 'skip', reason: 'predictor encoding' };
    if (image.bitsPerComponent !== 8) return { action: 'skip', reason: 'not 8 bits per channel' };
    if (image.components !== 1 && image.components !== 3) {
        return { action: 'skip', reason: 'unsupported colorspace' };
    }
    if (image.byteLength < MIN_WORTHWHILE_BYTES) return { action: 'skip', reason: 'already small' };

    const [width, height] = scaleToFit(image.width, image.height, preset.maxDim);
    return { action: 'encode', width, height };
}

// ─── Reporting ──────────────────────────────────────────────────────────────

export interface CompressReport {
    recompressed: number;
    skipped: number;
    before: number;
    after: number;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** One line for the result pane: what was touched, and what it bought. */
export function describeCompression(report: CompressReport): string {
    const { recompressed, skipped, before, after } = report;
    if (recompressed === 0) return 'nothing here could be compressed further';

    const touched = skipped > 0
        ? `${plural(recompressed, 'image')} recompressed, ${skipped} left alone`
        : `${plural(recompressed, 'image')} recompressed`;

    if (after >= before) return `${touched} — no smaller than the original`;
    const pct = Math.round((1 - after / before) * 100);
    if (pct < 1) return `${touched} — barely smaller than the original`;
    return `${touched} — ${pct}% smaller`;
}

// ─── Encoding ───────────────────────────────────────────────────────────────

export type EncodeSource =
    | { kind: 'raw'; data: Uint8Array; width: number; height: number; components: number }
    | { kind: 'jpeg'; data: Uint8Array };

/**
 * Re-encodes one image as a JPEG at the given size, or returns null when it
 * cannot be decoded — a CMYK JPEG that the browser refuses, say. Returning null
 * leaves the original stream in place.
 */
export type JpegEncoder = (
    source: EncodeSource,
    target: { width: number; height: number },
    quality: number,
) => Promise<Uint8Array | null>;

const canvasOf = (width: number, height: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('This browser would not give us a 2D canvas, which the compressor needs.');
    return { canvas, ctx };
};

const toBytes = (canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array | null> =>
    new Promise(resolve => {
        canvas.toBlob(
            blob => {
                if (!blob) return resolve(null);
                blob.arrayBuffer().then(buf => resolve(new Uint8Array(buf)), () => resolve(null));
            },
            'image/jpeg',
            quality,
        );
    });

/** The browser half: decode with canvas, scale if asked, encode as JPEG. */
export const canvasJpegEncoder: JpegEncoder = async (source, target, quality) => {
    try {
        if (source.kind === 'raw') {
            const { data, width, height, components } = source;
            if (data.length < width * height * components) return null;

            const rgba = new Uint8ClampedArray(width * height * 4);
            for (let i = 0, s = 0, d = 0; i < width * height; i++, s += components, d += 4) {
                rgba[d] = data[s];
                rgba[d + 1] = components === 1 ? data[s] : data[s + 1];
                rgba[d + 2] = components === 1 ? data[s] : data[s + 2];
                rgba[d + 3] = 255;
            }

            const natural = canvasOf(width, height);
            natural.ctx.putImageData(new ImageData(rgba, width, height), 0, 0);
            if (width === target.width && height === target.height) {
                return await toBytes(natural.canvas, quality);
            }

            const scaled = canvasOf(target.width, target.height);
            scaled.ctx.drawImage(natural.canvas, 0, 0, target.width, target.height);
            return await toBytes(scaled.canvas, quality);
        }

        const buffer = source.data.slice().buffer as ArrayBuffer;
        const bitmap = await createImageBitmap(new Blob([buffer], { type: 'image/jpeg' }));
        try {
            const { canvas, ctx } = canvasOf(target.width, target.height);
            ctx.drawImage(bitmap, 0, 0, target.width, target.height);
            return await toBytes(canvas, quality);
        } finally {
            bitmap.close();
        }
    } catch {
        // An image we cannot decode is one we leave exactly as we found it.
        return null;
    }
};

// ─── Reading the PDF ────────────────────────────────────────────────────────

const IMAGE = PDFName.of('Image');
const SUBTYPE = PDFName.of('Subtype');
const SMASK = PDFName.of('SMask');
const MASK = PDFName.of('Mask');
const FILTER = PDFName.of('Filter');
const DECODE_PARMS = PDFName.of('DecodeParms');
const COLORSPACE = PDFName.of('ColorSpace');
const BPC = PDFName.of('BitsPerComponent');
const WIDTH = PDFName.of('Width');
const HEIGHT = PDFName.of('Height');
const IMAGE_MASK = PDFName.of('ImageMask');
const LENGTH = PDFName.of('Length');

const isImageStream = (obj: unknown): obj is PDFRawStream =>
    obj instanceof PDFRawStream && obj.dict.get(SUBTYPE)?.toString() === '/Image';

/** Read a dictionary entry as a number, following an indirect reference. */
function readNumber(doc: PDFDocument, dict: PDFDict, key: PDFName): number | null {
    const value = doc.context.lookup(dict.get(key));
    return value instanceof PDFNumber ? value.asNumber() : null;
}

/** The lone filter name, or null when there is none or several are chained. */
function readFilter(doc: PDFDocument, dict: PDFDict): string | null {
    const value = doc.context.lookup(dict.get(FILTER));
    if (value instanceof PDFName) return value.asString().replace(/^\//, '');
    if (value instanceof PDFArray && value.size() === 1) {
        const only = doc.context.lookup(value.get(0));
        if (only instanceof PDFName) return only.asString().replace(/^\//, '');
    }
    return null;
}

/**
 * Colour components for a colorspace, or null when it is one we will not touch.
 *
 * Indexed, Separation, DeviceN and Lab all need their own handling to survive a
 * canvas round trip, so they resolve to null and their images are skipped.
 */
function readComponents(doc: PDFDocument, dict: PDFDict): number | null {
    const value = doc.context.lookup(dict.get(COLORSPACE));

    if (value instanceof PDFName) {
        switch (value.asString()) {
            case '/DeviceGray':
            case '/G':
            case '/CalGray':
                return 1;
            case '/DeviceRGB':
            case '/RGB':
            case '/CalRGB':
                return 3;
            default:
                return null;
        }
    }

    if (value instanceof PDFArray && value.size() >= 1) {
        const family = doc.context.lookup(value.get(0));
        const name = family instanceof PDFName ? family.asString() : '';
        if (name === '/CalGray') return 1;
        if (name === '/CalRGB') return 3;
        if (name === '/ICCBased' && value.size() >= 2) {
            const stream = doc.context.lookup(value.get(1));
            if (stream instanceof PDFStream) {
                const n = readNumber(doc, stream.dict, PDFName.of('N'));
                return n === 1 || n === 3 ? n : null;
            }
        }
    }

    return null;
}

function hasPredictor(doc: PDFDocument, dict: PDFDict): boolean {
    const parms = doc.context.lookup(dict.get(DECODE_PARMS));
    const dicts = parms instanceof PDFArray
        ? parms.asArray().map(entry => doc.context.lookup(entry))
        : [parms];

    return dicts.some(entry => {
        if (!(entry instanceof PDFDict)) return false;
        const predictor = readNumber(doc, entry, PDFName.of('Predictor'));
        return predictor !== null && predictor > 1;
    });
}

/** Every object referenced as another image's /SMask or /Mask. */
function collectMaskRefs(doc: PDFDocument): Set<string> {
    const refs = new Set<string>();
    for (const [, obj] of doc.context.enumerateIndirectObjects()) {
        if (!isImageStream(obj)) continue;
        for (const key of [SMASK, MASK]) {
            const value = obj.dict.get(key);
            if (value instanceof PDFRef) refs.add(value.toString());
        }
    }
    return refs;
}

function describeImage(doc: PDFDocument, stream: PDFRawStream, maskRefs: Set<string>, ref: PDFRef): ImageCandidate {
    const { dict } = stream;
    return {
        width: readNumber(doc, dict, WIDTH) ?? 0,
        height: readNumber(doc, dict, HEIGHT) ?? 0,
        filter: readFilter(doc, dict),
        components: readComponents(doc, dict),
        bitsPerComponent: readNumber(doc, dict, BPC),
        hasMask: dict.has(SMASK) || dict.has(MASK),
        isImageMask: doc.context.lookup(dict.get(IMAGE_MASK))?.toString() === 'true',
        isMaskForAnother: maskRefs.has(ref.toString()),
        hasPredictor: hasPredictor(doc, dict),
        byteLength: stream.getContents().length,
    };
}

// ─── The walk ───────────────────────────────────────────────────────────────

export interface CompressOptions {
    encode: JpegEncoder;
    onProgress?: (progress: { pct: number; label: string }) => void;
}

export interface CompressOutcome {
    bytes: Uint8Array;
    report: CompressReport;
}

/**
 * Re-encode every eligible image in a PDF and hand back the rebuilt file.
 *
 * Nothing else about the document changes: pages, text, annotations and every
 * image we decided against are carried through untouched.
 */
export async function compressPdf(
    bytes: Uint8Array,
    preset: CompressPreset,
    { encode, onProgress }: CompressOptions,
): Promise<CompressOutcome> {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: false, updateMetadata: false });
    const maskRefs = collectMaskRefs(doc);

    const images: { ref: PDFRef; stream: PDFRawStream }[] = [];
    for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
        if (isImageStream(obj)) images.push({ ref, stream: obj });
    }

    const report: CompressReport = { recompressed: 0, skipped: 0, before: bytes.length, after: bytes.length };

    for (const [index, { ref, stream }] of images.entries()) {
        onProgress?.({
            pct: Math.round((index / images.length) * 100),
            label: `Image ${index + 1} of ${images.length}`,
        });

        const image = describeImage(doc, stream, maskRefs, ref);
        const plan = planImage(image, preset);
        if (plan.action === 'skip') {
            report.skipped++;
            continue;
        }

        const original = stream.getContents();
        let source: EncodeSource;
        if (image.filter === 'DCTDecode') {
            source = { kind: 'jpeg', data: original };
        } else {
            let pixels: Uint8Array;
            try {
                pixels = unzlibSync(original);
            } catch {
                report.skipped++;
                continue;
            }
            source = {
                kind: 'raw',
                data: pixels,
                width: image.width,
                height: image.height,
                components: image.components as number,
            };
        }

        const encoded = await encode(source, { width: plan.width, height: plan.height }, preset.quality);
        // No decode, or no saving: either way the original stays exactly as it is.
        if (!encoded || encoded.length >= original.length) {
            report.skipped++;
            continue;
        }

        // A raw stream's contents are read-only, so the rewritten image goes in
        // as a new stream assigned to the same reference: everything pointing at
        // this image keeps pointing at it.
        const { dict } = stream;
        dict.set(FILTER, PDFName.of('DCTDecode'));
        dict.set(COLORSPACE, PDFName.of('DeviceRGB'));
        dict.set(BPC, doc.context.obj(8));
        dict.set(WIDTH, doc.context.obj(plan.width));
        dict.set(HEIGHT, doc.context.obj(plan.height));
        dict.set(LENGTH, doc.context.obj(encoded.length));
        dict.delete(DECODE_PARMS);
        doc.context.assign(ref, PDFRawStream.of(dict, encoded));
        report.recompressed++;
    }

    onProgress?.({ pct: 100, label: 'Rebuilding the document' });
    const out = await doc.save({ useObjectStreams: true });
    return { bytes: out, report: { ...report, after: out.length } };
}
