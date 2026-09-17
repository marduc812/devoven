import { PDFDocument, PDFName, PDFRawStream, PDFRef } from 'pdf-lib';
import { zlibSync } from 'fflate';
import {
    COMPRESS_LEVELS,
    COMPRESS_PRESETS,
    CompressPreset,
    ImageCandidate,
    compressPdf,
    describeCompression,
    planImage,
    scaleToFit,
} from '@/Components/Functions/PdfTools/compress';

const preset = COMPRESS_PRESETS.balanced;

const candidate = (over: Partial<ImageCandidate> = {}): ImageCandidate => ({
    width: 1600,
    height: 2400,
    filter: 'FlateDecode',
    components: 3,
    bitsPerComponent: 8,
    hasMask: false,
    isImageMask: false,
    isMaskForAnother: false,
    hasPredictor: false,
    byteLength: 3_000_000,
    ...over,
});

describe('scaleToFit', () => {
    it('leaves an image alone when no limit is set', () => {
        expect(scaleToFit(1600, 2400, 0)).toEqual([1600, 2400]);
    });

    it('leaves an image alone when it already fits', () => {
        expect(scaleToFit(800, 1200, 2000)).toEqual([800, 1200]);
    });

    it('scales the longest edge down to the limit, keeping the aspect ratio', () => {
        expect(scaleToFit(1600, 2400, 1200)).toEqual([800, 1200]);
        expect(scaleToFit(2400, 1600, 1200)).toEqual([1200, 800]);
    });

    it('never rounds an edge away to nothing', () => {
        expect(scaleToFit(4000, 3, 100)).toEqual([100, 1]);
    });
});

describe('planImage', () => {
    it('recompresses an ordinary scanned page, downscaled to the preset', () => {
        expect(planImage(candidate(), preset)).toEqual({
            action: 'encode',
            width: Math.round(2000 * (1600 / 2400)),
            height: 2000,
        });
    });

    it('keeps the original resolution when the preset sets no limit', () => {
        expect(planImage(candidate(), COMPRESS_PRESETS.light)).toEqual({
            action: 'encode',
            width: 1600,
            height: 2400,
        });
    });

    it('recompresses an already-JPEG image', () => {
        expect(planImage(candidate({ filter: 'DCTDecode' }), preset).action).toBe('encode');
    });

    it.each<[string, Partial<ImageCandidate>]>([
        ['transparency', { hasMask: true }],
        ['a stencil mask', { isImageMask: true }],
        ['being another image’s mask', { isMaskForAnother: true }],
        ['a Flate predictor', { hasPredictor: true }],
        ['an unsupported filter', { filter: 'JPXDecode' }],
        ['no filter at all', { filter: null }],
        ['sub-byte samples', { bitsPerComponent: 1 }],
        ['16-bit samples', { bitsPerComponent: 16 }],
        ['a CMYK colorspace', { components: 4 }],
        ['an unresolvable colorspace', { components: null }],
    ])('skips an image with %s', (_reason, over) => {
        const plan = planImage(candidate(over), preset);
        expect(plan.action).toBe('skip');
    });

    it('leaves an image that is already small alone', () => {
        expect(planImage(candidate({ byteLength: 900 }), preset).action).toBe('skip');
    });

    it('skips a degenerate image rather than dividing by its size', () => {
        expect(planImage(candidate({ width: 0, height: 0 }), preset).action).toBe('skip');
    });
});

describe('describeCompression', () => {
    it('reports the saving and the images it touched', () => {
        expect(describeCompression({ recompressed: 4, skipped: 0, before: 1000, after: 150 })).toBe(
            '4 images recompressed — 85% smaller',
        );
    });

    it('uses the singular for one image', () => {
        expect(describeCompression({ recompressed: 1, skipped: 0, before: 1000, after: 500 })).toBe(
            '1 image recompressed — 50% smaller',
        );
    });

    it('counts the images it had to leave alone', () => {
        expect(describeCompression({ recompressed: 2, skipped: 3, before: 1000, after: 400 })).toBe(
            '2 images recompressed, 3 left alone — 60% smaller',
        );
    });

    it('says so plainly when nothing could be recompressed', () => {
        expect(describeCompression({ recompressed: 0, skipped: 2, before: 1000, after: 1000 })).toBe(
            'nothing here could be compressed further',
        );
    });

    it('does not claim a saving when the file grew', () => {
        expect(describeCompression({ recompressed: 1, skipped: 0, before: 1000, after: 1200 })).toBe(
            '1 image recompressed — no smaller than the original',
        );
    });
});

describe('COMPRESS_PRESETS', () => {
    it('lists every level in order, strongest last', () => {
        expect(COMPRESS_LEVELS).toEqual(['light', 'balanced', 'strong', 'extreme']);
        const qualities = COMPRESS_LEVELS.map(l => COMPRESS_PRESETS[l].quality);
        expect([...qualities].sort((a, b) => b - a)).toEqual(qualities);
    });

    it('keeps every quality inside the range canvas accepts', () => {
        for (const level of COMPRESS_LEVELS) {
            const { quality } = COMPRESS_PRESETS[level];
            expect(quality).toBeGreaterThan(0);
            expect(quality).toBeLessThanOrEqual(1);
        }
    });
});

// ─── compressPdf ────────────────────────────────────────────────────────────

const WIDTH = 60;
const HEIGHT = 80;

/**
 * Pseudo-random bytes. A bitmap has to be genuinely noisy to stand in for a
 * scan: a repeating pattern deflates to nothing and gets skipped as too small
 * to be worth re-encoding, which is exactly what the compressor should do.
 */
function noise(length: number, seed = 1) {
    const out = new Uint8Array(length);
    let state = seed >>> 0;
    for (let i = 0; i < length; i++) {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        // The high byte, not the low one: an LCG's low bits cycle every 256
        // values, which deflate would see straight through.
        out[i] = state >>> 24;
    }
    return out;
}

/** A PDF holding one Flate-compressed RGB bitmap, the shape an iPhone scan has. */
async function pdfWithRawImage(over: Record<string, unknown> = {}) {
    const doc = await PDFDocument.create();
    doc.addPage([WIDTH, HEIGHT]);

    const raw = noise(WIDTH * HEIGHT * 3);
    const contents = zlibSync(raw);
    const dict = doc.context.obj({
        Type: 'XObject',
        Subtype: 'Image',
        Width: WIDTH,
        Height: HEIGHT,
        ColorSpace: 'DeviceRGB',
        BitsPerComponent: 8,
        Filter: 'FlateDecode',
        Length: contents.length,
        ...over,
    });
    const ref = doc.context.register(PDFRawStream.of(dict, contents));
    return { bytes: await doc.save(), ref, rawLength: contents.length };
}

/** Stands in for the canvas encoder: returns a marker of the requested size. */
const fakeEncoder = (size: number) => jest.fn(async () => new Uint8Array(size).fill(0xff));

async function imageStreams(bytes: Uint8Array) {
    const doc = await PDFDocument.load(bytes);
    const out: { ref: PDFRef; stream: PDFRawStream }[] = [];
    for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
        if (obj instanceof PDFRawStream) {
            const subtype = obj.dict.get(PDFName.of('Subtype'));
            if (subtype?.toString() === '/Image') out.push({ ref, stream: obj });
        }
    }
    return out;
}

describe('compressPdf', () => {
    it('replaces a Flate bitmap with the encoded JPEG and rewrites its dictionary', async () => {
        const { bytes, rawLength } = await pdfWithRawImage();
        const encode = fakeEncoder(200);

        const { bytes: out, report } = await compressPdf(bytes, COMPRESS_PRESETS.light, { encode });

        expect(report.recompressed).toBe(1);
        expect(report.skipped).toBe(0);

        const [image] = await imageStreams(out);
        expect(image.stream.dict.get(PDFName.of('Filter'))?.toString()).toBe('/DCTDecode');
        expect(image.stream.dict.get(PDFName.of('ColorSpace'))?.toString()).toBe('/DeviceRGB');
        expect(image.stream.dict.get(PDFName.of('Length'))?.toString()).toBe('200');
        expect(image.stream.getContents().length).toBe(200);
        expect(rawLength).toBeGreaterThan(200);
    });

    it('hands the encoder the inflated pixels at the planned size', async () => {
        const { bytes } = await pdfWithRawImage();
        const encode = fakeEncoder(200);

        await compressPdf(bytes, { ...COMPRESS_PRESETS.light, maxDim: 40 }, { encode });

        const [source, target, quality] = encode.mock.calls[0] as unknown as [
            { kind: string; data: Uint8Array; width: number; height: number; components: number },
            { width: number; height: number },
            number,
        ];
        expect(source.kind).toBe('raw');
        expect(source.width).toBe(WIDTH);
        expect(source.data.length).toBe(WIDTH * HEIGHT * 3);
        expect(target).toEqual({ width: 30, height: 40 });
        expect(quality).toBe(COMPRESS_PRESETS.light.quality);
    });

    it('keeps the original stream when the encode comes out no smaller', async () => {
        const { bytes, rawLength } = await pdfWithRawImage();
        const encode = fakeEncoder(rawLength + 1);

        const { bytes: out, report } = await compressPdf(bytes, COMPRESS_PRESETS.light, { encode });

        expect(report.recompressed).toBe(0);
        expect(report.skipped).toBe(1);
        const [image] = await imageStreams(out);
        expect(image.stream.dict.get(PDFName.of('Filter'))?.toString()).toBe('/FlateDecode');
        expect(image.stream.getContents().length).toBe(rawLength);
    });

    it('leaves an image the encoder cannot decode untouched', async () => {
        const { bytes, rawLength } = await pdfWithRawImage();
        const encode = jest.fn(async () => null);

        const { bytes: out, report } = await compressPdf(bytes, COMPRESS_PRESETS.light, { encode });

        expect(report.recompressed).toBe(0);
        expect(report.skipped).toBe(1);
        const [image] = await imageStreams(out);
        expect(image.stream.getContents().length).toBe(rawLength);
    });

    it('never touches an image carrying transparency', async () => {
        const { bytes } = await pdfWithRawImage({ SMask: PDFRef.of(99, 0) });
        const encode = fakeEncoder(10);

        const { report } = await compressPdf(bytes, COMPRESS_PRESETS.light, { encode });

        expect(encode).not.toHaveBeenCalled();
        expect(report.skipped).toBe(1);
    });

    it('never touches an image used as another image’s mask', async () => {
        const doc = await PDFDocument.create();
        doc.addPage([WIDTH, HEIGHT]);

        const maskContents = zlibSync(noise(WIDTH * HEIGHT, 7));
        const maskRef = doc.context.register(
            PDFRawStream.of(
                doc.context.obj({
                    Type: 'XObject',
                    Subtype: 'Image',
                    Width: WIDTH,
                    Height: HEIGHT,
                    ColorSpace: 'DeviceGray',
                    BitsPerComponent: 8,
                    Filter: 'FlateDecode',
                    Length: maskContents.length,
                }),
                maskContents,
            ),
        );

        const contents = zlibSync(noise(WIDTH * HEIGHT * 3, 11));
        doc.context.register(
            PDFRawStream.of(
                doc.context.obj({
                    Type: 'XObject',
                    Subtype: 'Image',
                    Width: WIDTH,
                    Height: HEIGHT,
                    ColorSpace: 'DeviceRGB',
                    BitsPerComponent: 8,
                    Filter: 'FlateDecode',
                    Length: contents.length,
                    SMask: maskRef,
                }),
                contents,
            ),
        );

        const encode = fakeEncoder(10);
        const { report } = await compressPdf(await doc.save(), COMPRESS_PRESETS.light, { encode });

        // The parent carries transparency and the mask belongs to it: both stay.
        expect(encode).not.toHaveBeenCalled();
        expect(report.skipped).toBe(2);
    });

    it('reports progress as it walks the images', async () => {
        const { bytes } = await pdfWithRawImage();
        const onProgress = jest.fn();

        await compressPdf(bytes, COMPRESS_PRESETS.light, { encode: fakeEncoder(10), onProgress });

        expect(onProgress).toHaveBeenCalled();
        const last = onProgress.mock.calls.at(-1)?.[0] as { pct: number };
        expect(last.pct).toBe(100);
    });

    it('reports a document with no images rather than failing', async () => {
        const doc = await PDFDocument.create();
        doc.addPage([WIDTH, HEIGHT]);
        const encode = fakeEncoder(10);

        const { report } = await compressPdf(await doc.save(), COMPRESS_PRESETS.light, { encode });

        expect(report).toMatchObject({ recompressed: 0, skipped: 0 });
        expect(encode).not.toHaveBeenCalled();
    });
});
