import { PDFDocument, StandardFonts, degrees } from 'pdf-lib';
import {
    parsePageRanges,
    chunkPages,
    describePages,
    togglePage,
    extendSelection,
    invertSelection,
    parityPages,
    PAGE_SIZES,
    fitScale,
    cornerPosition,
    pageLabel,
    outputName,
    formatBytes,
    describePageSize,
    joinTextItems,
    extractPages,
    splitIntoFiles,
    resizePages,
    addPageNumbers,
    watermarkPdf,
    readMetadata,
    writeMetadata,
    listFormFields,
    flattenPdf,
    inspectPdf,
    formatPdfInfo,
    planResize,
    summarizePageSizes,
} from '@/Components/Functions/PdfTools/logic';

/** Build a throwaway PDF with `count` pages of the given size. */
async function makePdf(count: number, size: [number, number] = [600, 800]): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    for (let i = 0; i < count; i++) {
        const page = doc.addPage(size);
        page.drawText(`page ${i + 1}`, { x: 50, y: 700, size: 24, font });
    }
    return doc.save();
}

describe('parsePageRanges', () => {
    it('expands a mix of singles and ranges into zero-based indices', () => {
        expect(parsePageRanges('1-3, 5', 10)).toEqual([0, 1, 2, 4]);
    });

    it('treats an open-ended range as running to the last page', () => {
        expect(parsePageRanges('8-', 10)).toEqual([7, 8, 9]);
    });

    it('returns every page for an empty spec or "all"', () => {
        expect(parsePageRanges('', 3)).toEqual([0, 1, 2]);
        expect(parsePageRanges('all', 3)).toEqual([0, 1, 2]);
        expect(parsePageRanges('  ALL  ', 3)).toEqual([0, 1, 2]);
    });

    it('keeps the order written but drops repeats', () => {
        expect(parsePageRanges('3,1,3', 5)).toEqual([2, 0]);
        expect(parsePageRanges('1-3,2', 5)).toEqual([0, 1, 2]);
    });

    it('tolerates whitespace and empty segments', () => {
        expect(parsePageRanges(' 1 , , 4 - 5 ', 6)).toEqual([0, 3, 4]);
    });

    it('rejects pages past the end of the document', () => {
        expect(() => parsePageRanges('4', 3)).toThrow('only has 3 pages');
        expect(() => parsePageRanges('1-9', 3)).toThrow('only has 3 pages');
    });

    it('rejects page zero, backwards ranges and junk', () => {
        expect(() => parsePageRanges('0', 3)).toThrow('numbered from 1');
        expect(() => parsePageRanges('3-1', 5)).toThrow('runs backwards');
        expect(() => parsePageRanges('a-b', 5)).toThrow('not a page');
    });

    it('rejects a document with no pages', () => {
        expect(() => parsePageRanges('1', 0)).toThrow('no pages');
    });

    it('says "page" not "pages" for a one-page document', () => {
        expect(() => parsePageRanges('2', 1)).toThrow('only has 1 page.');
    });
});

describe('chunkPages', () => {
    it('splits into fixed-size chunks with a short tail', () => {
        expect(chunkPages([0, 1, 2, 3, 4], 2)).toEqual([[0, 1], [2, 3], [4]]);
    });

    it('returns one chunk when the size covers everything', () => {
        expect(chunkPages([0, 1], 5)).toEqual([[0, 1]]);
    });

    it('rejects a non-positive or fractional size', () => {
        expect(() => chunkPages([0], 0)).toThrow('1 or more');
        expect(() => chunkPages([0], 1.5)).toThrow('1 or more');
    });
});

describe('describePages', () => {
    it('collapses consecutive runs and keeps singles', () => {
        expect(describePages([0, 1, 2, 6])).toBe('1-3,7');
        expect(describePages([4])).toBe('5');
        expect(describePages([0, 2, 4])).toBe('1,3,5');
    });

    it('is empty for no pages', () => {
        expect(describePages([])).toBe('');
    });

    it('round-trips through parsePageRanges', () => {
        const indices = [0, 1, 2, 5, 8, 9];
        expect(parsePageRanges(describePages(indices), 10)).toEqual(indices);
    });
});

describe('visual page selection', () => {
    it('toggles a page in and out, keeping the list sorted', () => {
        expect(togglePage([0, 2], 1)).toEqual([0, 1, 2]);
        expect(togglePage([0, 1, 2], 1)).toEqual([0, 2]);
        expect(togglePage([], 4)).toEqual([4]);
    });

    it('extends a selection in either direction without duplicating', () => {
        expect(extendSelection([1], 1, 4)).toEqual([1, 2, 3, 4]);
        expect(extendSelection([4], 4, 1)).toEqual([1, 2, 3, 4]);
        expect(extendSelection([0, 2], 1, 3)).toEqual([0, 1, 2, 3]);
        expect(extendSelection([5], 5, 5)).toEqual([5]);
    });

    it('inverts against the page count', () => {
        expect(invertSelection([0, 2], 4)).toEqual([1, 3]);
        expect(invertSelection([], 3)).toEqual([0, 1, 2]);
        expect(invertSelection([0, 1, 2], 3)).toEqual([]);
    });

    it('picks odd and even pages by their 1-based label', () => {
        expect(parityPages(5, 'odd')).toEqual([0, 2, 4]);
        expect(parityPages(5, 'even')).toEqual([1, 3]);
        expect(parityPages(0, 'odd')).toEqual([]);
    });

    it('feeds describePages a spec the parser accepts', () => {
        const picked = togglePage(extendSelection([], 0, 3), 6);
        expect(describePages(picked)).toBe('1-4,7');
        expect(parsePageRanges(describePages(picked), 10)).toEqual(picked);
    });
});

describe('fitScale', () => {
    it('picks the limiting axis', () => {
        expect(fitScale(100, 100, 50, 200)).toBe(0.5);
        expect(fitScale(100, 100, 200, 50)).toBe(0.5);
    });

    it('scales up when the destination is larger', () => {
        expect(fitScale(100, 50, 200, 200)).toBe(2);
    });

    it('rejects a zero-size source', () => {
        expect(() => fitScale(0, 10, 10, 10)).toThrow('no size');
    });
});

describe('cornerPosition', () => {
    const pageW = 600;
    const pageH = 800;

    it('anchors the bottom-left slot at the margin', () => {
        expect(cornerPosition('bottom-left', pageW, pageH, 40, 10, 36)).toEqual({ x: 36, y: 36 });
    });

    it('insets the right slot by the text width', () => {
        expect(cornerPosition('bottom-right', pageW, pageH, 40, 10, 36)).toEqual({ x: 524, y: 36 });
    });

    it('centres horizontally', () => {
        expect(cornerPosition('top-center', pageW, pageH, 40, 10, 36)).toEqual({ x: 280, y: 754 });
    });

    it('drops the top slot by one font height so the text sits inside the page', () => {
        const { y } = cornerPosition('top-left', pageW, pageH, 40, 12, 36);
        expect(y).toBe(800 - 36 - 12);
        expect(y + 12).toBeLessThanOrEqual(pageH - 36);
    });
});

describe('pageLabel', () => {
    it('fills page number and total', () => {
        expect(pageLabel('Page {n} of {N}', 3, 12)).toBe('Page 3 of 12');
    });

    it('replaces every occurrence', () => {
        expect(pageLabel('{n}/{N} — {n}', 2, 5)).toBe('2/5 — 2');
    });

    it('leaves a template with no placeholders alone', () => {
        expect(pageLabel('draft', 1, 2)).toBe('draft');
    });
});

describe('outputName', () => {
    it('replaces the extension and appends the suffix', () => {
        expect(outputName('report.pdf', 'split')).toBe('report-split.pdf');
    });

    it('handles a name with dots and no extension', () => {
        expect(outputName('v1.2.final.pdf', 'x')).toBe('v1.2.final-x.pdf');
        expect(outputName('README', 'x')).toBe('README-x.pdf');
    });

    it('takes a custom extension', () => {
        expect(outputName('report.pdf', 'text', 'txt')).toBe('report-text.txt');
    });

    it('falls back when the name is only an extension', () => {
        expect(outputName('.pdf', 'x')).toBe('document-x.pdf');
    });
});

describe('formatBytes', () => {
    it('scales through B, KB and MB', () => {
        expect(formatBytes(512)).toBe('512 B');
        expect(formatBytes(2048)).toBe('2.0 KB');
        expect(formatBytes(5 * 1024 * 1024)).toBe('5.00 MB');
    });
});

describe('describePageSize', () => {
    it('names a standard portrait size', () => {
        expect(describePageSize(...PAGE_SIZES.A4)).toBe('595 × 842 pt (A4 portrait)');
    });

    it('names the same size rotated', () => {
        const [w, h] = PAGE_SIZES.Letter;
        expect(describePageSize(h, w)).toBe('792 × 612 pt (Letter landscape)');
    });

    it('gives dimensions only for a non-standard size', () => {
        expect(describePageSize(500, 500)).toBe('500 × 500 pt');
    });
});

describe('joinTextItems', () => {
    it('breaks lines on the end-of-line markers', () => {
        const items = [
            { str: 'Hello ' },
            { str: 'world', hasEOL: true },
            { str: 'second line', hasEOL: true },
        ];
        expect(joinTextItems(items)).toBe('Hello world\nsecond line');
    });

    it('collapses runs of blank lines and trailing spaces', () => {
        const items = [
            { str: 'a   ', hasEOL: true },
            { str: '', hasEOL: true },
            { str: '', hasEOL: true },
            { str: '', hasEOL: true },
            { str: 'b', hasEOL: true },
        ];
        expect(joinTextItems(items)).toBe('a\n\nb');
    });

    it('is empty for no items', () => {
        expect(joinTextItems([])).toBe('');
    });
});

describe('extractPages', () => {
    it('produces a document with only the selected pages', async () => {
        const source = await makePdf(5);
        const out = await extractPages(source, [0, 2, 4]);
        const doc = await PDFDocument.load(out);
        expect(doc.getPageCount()).toBe(3);
    });

    it('honours the requested order', async () => {
        const source = await makePdf(3, [100, 200]);
        const out = await extractPages(source, [2, 0]);
        const doc = await PDFDocument.load(out);
        expect(doc.getPageCount()).toBe(2);
    });

    it('refuses an empty selection', async () => {
        const source = await makePdf(2);
        await expect(extractPages(source, [])).rejects.toThrow('at least one page');
    });
});

describe('splitIntoFiles', () => {
    it('emits one named file per chunk', async () => {
        const source = await makePdf(5);
        const files = await splitIntoFiles(source, chunkPages([0, 1, 2, 3, 4], 2), 'report.pdf');

        expect(files.map(f => f.name)).toEqual([
            'report-pages-1-2.pdf',
            'report-pages-3-4.pdf',
            'report-pages-5.pdf',
        ]);
        expect(files.map(f => f.pages)).toEqual(['1-2', '3-4', '5']);

        const counts = await Promise.all(
            files.map(async f => (await PDFDocument.load(f.bytes)).getPageCount()),
        );
        expect(counts).toEqual([2, 2, 1]);
    });
});

describe('resizePages', () => {
    it('sets every page to the target size', async () => {
        const source = await makePdf(3, [300, 400]);
        const out = await resizePages(source, ...PAGE_SIZES.A4);
        const doc = await PDFDocument.load(out);

        for (const page of doc.getPages()) {
            expect(page.getWidth()).toBeCloseTo(PAGE_SIZES.A4[0], 2);
            expect(page.getHeight()).toBeCloseTo(PAGE_SIZES.A4[1], 2);
        }
    });

    it('keeps a landscape page landscape when matching orientation', async () => {
        const source = await makePdf(1, [800, 400]);
        const out = await resizePages(source, ...PAGE_SIZES.A4);
        const page = (await PDFDocument.load(out)).getPage(0);

        expect(page.getWidth()).toBeGreaterThan(page.getHeight());
        expect(page.getWidth()).toBeCloseTo(PAGE_SIZES.A4[1], 2);
    });

    it('forces the exact target size when orientation matching is off', async () => {
        const source = await makePdf(1, [800, 400]);
        const out = await resizePages(source, ...PAGE_SIZES.A4, 'fit', false);
        const page = (await PDFDocument.load(out)).getPage(0);

        expect(page.getWidth()).toBeCloseTo(PAGE_SIZES.A4[0], 2);
        expect(page.getHeight()).toBeCloseTo(PAGE_SIZES.A4[1], 2);
    });

    it('preserves page rotation', async () => {
        const doc = await PDFDocument.create();
        doc.addPage([300, 400]).setRotation(degrees(90));
        const out = await resizePages(await doc.save(), ...PAGE_SIZES.A4);

        expect((await PDFDocument.load(out)).getPage(0).getRotation().angle).toBe(90);
    });

    it('stretches to fill in stretch mode', async () => {
        const source = await makePdf(1, [300, 300]);
        const out = await resizePages(source, 612, 792, 'stretch', false);
        const page = (await PDFDocument.load(out)).getPage(0);

        expect(page.getWidth()).toBeCloseTo(612, 2);
        expect(page.getHeight()).toBeCloseTo(792, 2);
    });
});

describe('planResize', () => {
    it('centres a fitted page and reports the margins', () => {
        const plan = planResize(300, 400, 600, 800, 'fit', false);
        expect(plan.scaleX).toBeCloseTo(2);
        expect(plan.scaleY).toBeCloseTo(2);
        expect(plan.offsetX).toBeCloseTo(0);
        expect(plan.offsetY).toBeCloseTo(0);
    });

    it('letterboxes when the aspect ratios differ', () => {
        // A square page fitted onto a tall sheet gains left/right nothing and
        // top/bottom margins.
        const plan = planResize(400, 400, 400, 800, 'fit', false);
        expect(plan.scaleX).toBeCloseTo(1);
        expect(plan.offsetX).toBeCloseTo(0);
        expect(plan.offsetY).toBeCloseTo(200);
    });

    it('swaps the target for a landscape page when matching orientation', () => {
        const plan = planResize(800, 400, ...PAGE_SIZES.A4);
        expect(plan.width).toBeCloseTo(PAGE_SIZES.A4[1], 2);
        expect(plan.height).toBeCloseTo(PAGE_SIZES.A4[0], 2);
    });

    it('uses the target verbatim when not matching orientation', () => {
        const plan = planResize(800, 400, ...PAGE_SIZES.A4, 'fit', false);
        expect(plan.width).toBeCloseTo(PAGE_SIZES.A4[0], 2);
        expect(plan.height).toBeCloseTo(PAGE_SIZES.A4[1], 2);
    });

    it('scales each axis independently and leaves no margin when stretching', () => {
        const plan = planResize(300, 300, 600, 900, 'stretch', false);
        expect(plan.scaleX).toBeCloseTo(2);
        expect(plan.scaleY).toBeCloseTo(3);
        expect(plan.offsetX).toBe(0);
        expect(plan.offsetY).toBe(0);
    });

    it('rejects a page with no size', () => {
        expect(() => planResize(0, 400, 600, 800)).toThrow(/no size/i);
    });

    it('matches what resizePages actually produces', async () => {
        const source = await makePdf(1, [300, 400]);
        const plan = planResize(300, 400, ...PAGE_SIZES.A4);
        const page = (await PDFDocument.load(await resizePages(source, ...PAGE_SIZES.A4))).getPage(0);

        expect(page.getWidth()).toBeCloseTo(plan.width, 2);
        expect(page.getHeight()).toBeCloseTo(plan.height, 2);
    });
});

describe('summarizePageSizes', () => {
    it('collapses a uniform document into one group', async () => {
        const info = await inspectPdf(await makePdf(4, [300, 400]));
        const groups = summarizePageSizes(info.pages);

        expect(groups).toHaveLength(1);
        expect(groups[0].pages).toEqual([1, 2, 3, 4]);
        expect(groups[0].label).toBe('300 × 400 pt');
    });

    it('groups mixed sizes in document order', async () => {
        const doc = await PDFDocument.create();
        doc.addPage([300, 400]);
        doc.addPage([800, 400]);
        doc.addPage([300, 400]);
        const groups = summarizePageSizes((await inspectPdf(await doc.save())).pages);

        expect(groups).toHaveLength(2);
        expect(groups[0].pages).toEqual([1, 3]);
        expect(groups[1].pages).toEqual([2]);
    });

    it('separates pages that differ only in rotation', async () => {
        const doc = await PDFDocument.create();
        doc.addPage([300, 400]);
        doc.addPage([300, 400]).setRotation(degrees(90));
        const groups = summarizePageSizes((await inspectPdf(await doc.save())).pages);

        expect(groups).toHaveLength(2);
        expect(groups.map(group => group.rotation)).toEqual([0, 90]);
    });

    it('names a standard paper size where there is one', async () => {
        const info = await inspectPdf(await makePdf(1, PAGE_SIZES.A4));
        expect(summarizePageSizes(info.pages)[0].label).toBe('595 × 842 pt (A4 portrait)');
    });

    it('has nothing to say about an empty page list', () => {
        expect(summarizePageSizes([])).toEqual([]);
    });
});

describe('addPageNumbers', () => {
    const base = {
        template: 'Page {n} of {N}',
        corner: 'bottom-center' as const,
        fontSize: 10,
        margin: 36,
        startPage: 1,
        startAt: 1,
    };

    it('returns a document with the same page count', async () => {
        const source = await makePdf(4);
        const out = await addPageNumbers(source, base);
        expect((await PDFDocument.load(out)).getPageCount()).toBe(4);
    });

    it('grows the file, showing text was actually drawn', async () => {
        const source = await makePdf(4);
        const out = await addPageNumbers(source, base);
        expect(out.byteLength).toBeGreaterThan(source.byteLength);
    });

    it('accepts a start page past the front matter', async () => {
        const source = await makePdf(6);
        const out = await addPageNumbers(source, { ...base, startPage: 3, startAt: 1 });
        expect((await PDFDocument.load(out)).getPageCount()).toBe(6);
    });
});

describe('watermarkPdf', () => {
    const base = {
        text: 'CONFIDENTIAL',
        fontSize: 48,
        opacity: 0.2,
        rotation: 45,
        color: { r: 0.5, g: 0.5, b: 0.5 },
    };

    it('keeps the page count and grows the file', async () => {
        const source = await makePdf(3);
        const out = await watermarkPdf(source, base);
        expect((await PDFDocument.load(out)).getPageCount()).toBe(3);
        expect(out.byteLength).toBeGreaterThan(source.byteLength);
    });

    it('rejects empty watermark text', async () => {
        const source = await makePdf(1);
        await expect(watermarkPdf(source, { ...base, text: '   ' })).rejects.toThrow('watermark text');
    });

    it('handles zero rotation', async () => {
        const source = await makePdf(1);
        const out = await watermarkPdf(source, { ...base, rotation: 0 });
        expect((await PDFDocument.load(out)).getPageCount()).toBe(1);
    });
});

describe('metadata', () => {
    const meta = {
        title: 'Quarterly Report',
        author: 'Ada',
        subject: 'Numbers',
        keywords: 'finance, q3, draft',
        creator: 'DevOven',
        producer: 'DevOven',
    };

    it('round-trips through write and read', async () => {
        const source = await makePdf(1);
        const written = await writeMetadata(source, meta);
        expect(await readMetadata(written)).toEqual(meta);
    });

    it('reports empty strings for a document with no metadata set', async () => {
        const doc = await PDFDocument.create();
        doc.addPage([100, 100]);
        const read = await readMetadata(await doc.save());

        expect(read.title).toBe('');
        expect(read.author).toBe('');
        expect(read.subject).toBe('');
    });

    it('stores the keyword string verbatim, commas and all', async () => {
        const source = await makePdf(1);
        const written = await writeMetadata(source, { ...meta, keywords: 'q3 report, draft' });
        expect((await readMetadata(written)).keywords).toBe('q3 report, draft');
    });

    it('does not stamp pdf-lib as the producer of a file it only reads', async () => {
        const written = await writeMetadata(await makePdf(1), meta);
        expect((await readMetadata(written)).producer).toBe('DevOven');
        // Reading twice must not mutate it either.
        expect((await readMetadata(written)).producer).toBe('DevOven');
    });

    it('leaves the producer of an untouched document alone when editing pages', async () => {
        const written = await writeMetadata(await makePdf(3), meta);
        const split = await extractPages(written, [0, 1]);
        expect((await readMetadata(split)).producer).toBe('DevOven');
    });

    it('clears a field when given an empty string', async () => {
        const source = await makePdf(1);
        const written = await writeMetadata(source, meta);
        const cleared = await writeMetadata(written, { ...meta, title: '' });
        expect((await readMetadata(cleared)).title).toBe('');
    });
});

describe('forms', () => {
    /** A PDF carrying one text field and one checkbox. */
    async function makeFormPdf(): Promise<Uint8Array> {
        const doc = await PDFDocument.create();
        const page = doc.addPage([400, 400]);
        const form = doc.getForm();

        form.createTextField('user.name').addToPage(page, { x: 20, y: 300, width: 200, height: 20 });
        form.createCheckBox('user.agreed').addToPage(page, { x: 20, y: 260, width: 15, height: 15 });

        return doc.save();
    }

    it('lists field names and types', async () => {
        const fields = await listFormFields(await makeFormPdf());
        expect(fields).toEqual([
            { name: 'user.name', type: 'TextField' },
            { name: 'user.agreed', type: 'CheckBox' },
        ]);
    });

    it('leaves no fields behind after flattening', async () => {
        const flattened = await flattenPdf(await makeFormPdf());
        expect(await listFormFields(flattened)).toEqual([]);
    });

    it('reports no fields for a document without a form', async () => {
        expect(await listFormFields(await makePdf(1))).toEqual([]);
    });
});

describe('inspectPdf', () => {
    it('reports page count and uniform page geometry', async () => {
        const info = await inspectPdf(await makePdf(3, [612, 792]));

        expect(info.pageCount).toBe(3);
        expect(info.uniformPages).toBe(true);
        expect(info.pages[0]).toEqual({ number: 1, width: 612, height: 792, rotation: 0 });
        expect(info.formFields).toBe(0);
    });

    it('flags a document whose pages differ in size', async () => {
        const doc = await PDFDocument.create();
        doc.addPage([612, 792]);
        doc.addPage([300, 300]);

        expect((await inspectPdf(await doc.save())).uniformPages).toBe(false);
    });

    it('flags a document whose pages differ only in rotation', async () => {
        const doc = await PDFDocument.create();
        doc.addPage([612, 792]);
        doc.addPage([612, 792]).setRotation(degrees(90));

        expect((await inspectPdf(await doc.save())).uniformPages).toBe(false);
    });

    it('surfaces metadata that was written earlier', async () => {
        const source = await writeMetadata(await makePdf(1), {
            title: 'T', author: 'A', subject: 'S', keywords: 'k', creator: 'C', producer: 'P',
        });
        const info = await inspectPdf(source);

        expect(info.metadata.title).toBe('T');
        expect(info.metadata.author).toBe('A');
    });
});

describe('formatPdfInfo', () => {
    it('renders a single-size document on one page-size line', async () => {
        const info = await inspectPdf(await makePdf(2, PAGE_SIZES.A4));
        const report = formatPdfInfo(info, 'report.pdf', 2048);

        expect(report).toContain('File            report.pdf');
        expect(report).toContain('Size            2.0 KB');
        expect(report).toContain('Pages           2');
        expect(report).toContain('Page size       595 × 842 pt (A4 portrait)');
        expect(report).not.toContain('mixed');
    });

    it('lists each page when the sizes differ', async () => {
        const doc = await PDFDocument.create();
        doc.addPage([612, 792]);
        doc.addPage([300, 300]);
        const report = formatPdfInfo(await inspectPdf(await doc.save()), 'mixed.pdf', 100);

        expect(report).toContain('Page size       mixed:');
        expect(report).toContain('page 1');
        expect(report).toContain('page 2');
    });

    it('writes an em dash for metadata that is not set', async () => {
        const report = formatPdfInfo(await inspectPdf(await makePdf(1)), 'plain.pdf', 100);
        expect(report).toContain('Title           —');
        expect(report).toContain('Form fields     none');
    });
});
