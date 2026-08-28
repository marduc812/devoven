'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MediaConverter from '@/Components/MainView/MainPanel/MediaConverter';
import { MediaResult } from '@/types';
import { getPdfjs, downloadBlob } from '../PdfShared/pdfjs';
import { PageThumb, PdfThumbs, ThumbGrid, ThumbScroller, usePdfThumbs } from './PageThumbs';
import {
    Corner,
    PAGE_SIZES,
    PageSizeGroup,
    PdfMetadata,
    PdfInfo as PdfDocumentInfo,
    ResizeMode,
    ResizePlan,
    addPageNumbers,
    chunkPages,
    describePageSize,
    describePages,
    extendSelection,
    extractPages,
    flattenPdf,
    formatBytes,
    formatPdfInfo,
    inspectPdf,
    invertSelection,
    joinTextItems,
    listFormFields,
    outputName,
    parityPages,
    parsePageRanges,
    planResize,
    readMetadata,
    resizePages,
    splitIntoFiles,
    summarizePageSizes,
    togglePage,
    watermarkPdf,
    writeMetadata,
} from './logic';

const ACCEPT = 'application/pdf,.pdf';
const COLOR = 'red' as const;

const NOTHING_UPLOADED = 'All processing happens in your browser — the file never leaves your device.';

// ─── Shared plumbing ────────────────────────────────────────────────────────

interface LoadedPdf {
    file: File;
    bytes: Uint8Array;
    pageCount: number;
    info: PdfDocumentInfo;
}

/** Turn an unknown throw from pdf-lib into something a person can act on. */
function readableError(err: unknown): string {
    const message = err instanceof Error ? err.message : String(err);
    if (/encrypt|password/i.test(message)) {
        return 'This PDF is password-protected. Remove the password in your PDF reader first — it cannot be opened here.';
    }
    return message;
}

/**
 * Holds the loaded PDF plus the object URL backing the input preview, revoking
 * the previous URL whenever a new file replaces it and again on unmount.
 */
function usePdfSource() {
    const [loaded, setLoaded] = useState<LoadedPdf | null>(null);
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    const urlRef = useRef('');
    // One rasterizer per loaded document, shared by the input preview and by
    // whatever page grid the tool renders.
    const thumbs = usePdfThumbs(loaded?.bytes ?? null);

    const revoke = () => {
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = '';
    };

    useEffect(() => revoke, []);

    const open = useCallback(async (file: File) => {
        setError('');
        try {
            const bytes = new Uint8Array(await file.arrayBuffer());
            const info = await inspectPdf(bytes);

            revoke();
            const next = URL.createObjectURL(file);
            urlRef.current = next;
            setUrl(next);
            setLoaded({ file, bytes, pageCount: info.pageCount, info });
            return { bytes, pageCount: info.pageCount, info };
        } catch (err) {
            revoke();
            setUrl('');
            setLoaded(null);
            setError(readableError(err));
            return null;
        }
    }, []);

    const clear = useCallback(() => {
        revoke();
        setUrl('');
        setLoaded(null);
        setError('');
    }, []);

    const source = loaded
        ? {
              url,
              name: loaded.file.name,
              meta: `${loaded.pageCount} page${loaded.pageCount === 1 ? '' : 's'} — ${formatBytes(loaded.file.size)}`,
              // A PDF's own first page says more than its file name does.
              preview: <PageThumb thumbs={thumbs} page={1} size="lg" />,
          }
        : undefined;

    return { loaded, source, thumbs, error, setError, open, clear };
}

/** Publishes a produced PDF as a downloadable object URL, one at a time. */
function usePdfResult() {
    const [result, setResult] = useState<MediaResult | undefined>();
    const urlRef = useRef('');

    const revoke = () => {
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = '';
    };

    useEffect(() => revoke, []);

    const publish = useCallback((bytes: Uint8Array, fileName: string, meta?: string) => {
        revoke();
        // Copy into a fresh buffer so the Blob never aliases a detached view.
        const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: 'application/pdf' });
        const next = URL.createObjectURL(blob);
        urlRef.current = next;
        setResult({ url: next, fileName, meta: `${formatBytes(blob.size)}${meta ? ` — ${meta}` : ''}` });
    }, []);

    const clear = useCallback(() => {
        revoke();
        setResult(undefined);
    }, []);

    return { result, publish, clear };
}

// ─── Shared option controls ─────────────────────────────────────────────────

const fieldLabel = 'text-xs font-bold uppercase tracking-widest text-gray-500';
const inputClass = 'bg-white text-gray-900 p-2 border border-gray-300 font-mono text-sm focus:border-gray-900 focus:outline-none';
const selectClass = `${inputClass} cursor-pointer`;

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label className="flex flex-col gap-1.5">
        <span className={fieldLabel}>{label}</span>
        {children}
    </label>
);

const Options = ({ children }: { children: React.ReactNode }) => (
    <div className="flex flex-col gap-4">{children}</div>
);

const Row = ({ children }: { children: React.ReactNode }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{children}</div>
);

const Note = ({ children }: { children: React.ReactNode }) => (
    <p className="text-xs text-gray-400 leading-relaxed">{children}</p>
);

const CORNERS: Corner[] = [
    'bottom-center', 'bottom-left', 'bottom-right',
    'top-center', 'top-left', 'top-right',
];

// ─── Split PDF ──────────────────────────────────────────────────────────────

type SplitMode = 'extract' | 'every';

export const PdfSplit = () => {
    const { loaded, source, thumbs, error, setError, open, clear } = usePdfSource();
    const { result, publish, clear: clearResult } = usePdfResult();

    const [mode, setMode] = useState<SplitMode>('extract');
    const [ranges, setRanges] = useState('1-');
    const [chunkSize, setChunkSize] = useState(1);
    const [files, setFiles] = useState<MediaResult[]>([]);
    const filesRef = useRef<MediaResult[]>([]);
    const bytesRef = useRef<Map<string, Uint8Array>>(new Map());
    // Anchor for shift-clicking a run of pages in the thumbnail grid.
    const anchorRef = useRef<number | null>(null);

    const revokeFiles = () => {
        filesRef.current.forEach(f => URL.revokeObjectURL(f.url));
        filesRef.current = [];
        bytesRef.current.clear();
    };

    useEffect(() => revokeFiles, []);

    const run = useCallback(async () => {
        if (!loaded) return;
        setError('');
        clearResult();
        revokeFiles();
        setFiles([]);

        try {
            if (mode === 'extract') {
                // Blank means "nothing picked" here rather than "every page":
                // it is what deselecting the last thumbnail leaves behind.
                if (ranges.trim() === '') throw new Error('Select at least one page.');
                const indices = parsePageRanges(ranges, loaded.pageCount);
                const bytes = await extractPages(loaded.bytes, indices);
                publish(
                    bytes,
                    outputName(loaded.file.name, `pages-${describePages(indices)}`),
                    `${indices.length} of ${loaded.pageCount} pages`,
                );
            } else {
                const all = parsePageRanges('all', loaded.pageCount);
                const split = await splitIntoFiles(loaded.bytes, chunkPages(all, chunkSize), loaded.file.name);

                const published = split.map(file => {
                    const blob = new Blob([file.bytes.slice().buffer as ArrayBuffer], { type: 'application/pdf' });
                    bytesRef.current.set(file.name, file.bytes);
                    return { url: URL.createObjectURL(blob), fileName: file.name, meta: formatBytes(blob.size) };
                });
                filesRef.current = published;
                setFiles(published);
            }
        } catch (err) {
            setError(readableError(err));
        }
    }, [loaded, mode, ranges, chunkSize, publish, clearResult, setError]);

    useEffect(() => { run(); }, [run]);

    const downloadAll = async () => {
        for (const file of filesRef.current) {
            const bytes = bytesRef.current.get(file.fileName);
            if (!bytes) continue;
            downloadBlob(new Blob([bytes.slice().buffer as ArrayBuffer], { type: 'application/pdf' }), file.fileName);
            // A short gap keeps the browser from dropping rapid downloads.
            await new Promise(r => setTimeout(r, 150));
        }
    };

    // The range string stays authoritative; the grid is a view of it, and
    // clicking a page writes the string back. An unparseable string simply
    // highlights nothing — the error under the options already explains why.
    const pageCount = loaded?.pageCount ?? 0;
    const selection = useMemo(() => {
        if (!loaded || ranges.trim() === '') return [];
        try {
            return parsePageRanges(ranges, loaded.pageCount).sort((a, b) => a - b);
        } catch {
            return [];
        }
    }, [loaded, ranges]);
    const selectedSet = useMemo(() => new Set(selection), [selection]);

    const applySelection = (indices: number[]) => setRanges(describePages(indices));

    const clickPage = (index: number, event: React.MouseEvent) => {
        if (event.shiftKey && anchorRef.current !== null) {
            applySelection(extendSelection(selection, anchorRef.current, index));
            return;
        }
        anchorRef.current = index;
        applySelection(togglePage(selection, index));
    };

    const chunks = useMemo(() => {
        if (!loaded || mode !== 'every') return [];
        try {
            return chunkPages(parsePageRanges('all', loaded.pageCount), chunkSize);
        } catch {
            return [];
        }
    }, [loaded, mode, chunkSize]);

    const quickAction = (label: string, indices: number[]) => (
        <button
            key={label}
            type="button"
            onClick={() => applySelection(indices)}
            className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 transition-colors"
        >
            {label}
        </button>
    );

    const grid =
        !loaded ? null : mode === 'extract' ? (
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <span className="text-xs text-gray-500">
                        {selection.length} of {pageCount} page{pageCount === 1 ? '' : 's'} selected — click a page,
                        shift-click for a run
                    </span>
                    <div className="flex items-center gap-3">
                        {quickAction('All', Array.from({ length: pageCount }, (_, i) => i))}
                        {quickAction('None', [])}
                        {quickAction('Odd', parityPages(pageCount, 'odd'))}
                        {quickAction('Even', parityPages(pageCount, 'even'))}
                        {quickAction('Invert', invertSelection(selection, pageCount))}
                    </div>
                </div>
                <ThumbScroller>
                    <ThumbGrid>
                        {Array.from({ length: pageCount }, (_, i) => (
                            <PageThumb
                                key={i}
                                thumbs={thumbs}
                                page={i + 1}
                                selected={selectedSet.has(i)}
                                muted={!selectedSet.has(i)}
                                onClick={event => clickPage(i, event)}
                            />
                        ))}
                    </ThumbGrid>
                </ThumbScroller>
            </div>
        ) : (
            <div className="flex flex-col gap-2">
                <span className="text-xs text-gray-500">
                    {chunks.length} file{chunks.length === 1 ? '' : 's'} from {pageCount} page
                    {pageCount === 1 ? '' : 's'}
                </span>
                <ThumbScroller>
                    <div className="flex flex-col gap-4">
                        {chunks.map((chunk, index) => (
                            <div key={index} className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                        File {index + 1}
                                    </span>
                                    <span className="font-mono text-xs text-gray-400">
                                        pages {describePages(chunk)}
                                    </span>
                                    <span className="flex-1 h-px bg-gray-200" />
                                </div>
                                <ThumbGrid>
                                    {chunk.map(page => (
                                        <PageThumb key={page} thumbs={thumbs} page={page + 1} selected />
                                    ))}
                                </ThumbGrid>
                            </div>
                        ))}
                    </div>
                </ThumbScroller>
            </div>
        );

    return (
        <MediaConverter
            backColor={COLOR}
            title="Split PDF"
            description="Pull selected pages out of a PDF, or break it into one file per page. Click the page thumbnails to pick what you need, or type ranges like [11-3, 5, 8-2]. All processing happens in your browser."
            accept={ACCEPT}
            inputMedium="pdf"
            outputMedium="pdf"
            onFiles={f => open(f[0])}
            onClear={() => { clear(); clearResult(); revokeFiles(); setFiles([]); }}
            source={source}
            result={result}
            results={files.length > 0 ? files : undefined}
            onDownloadAll={files.length > 0 ? downloadAll : undefined}
            error={error}
            extraElements={
                <Options>
                    <Row>
                        <Field label="Mode">
                            <select className={selectClass} value={mode} onChange={e => setMode(e.target.value as SplitMode)}>
                                <option value="extract">Extract pages to one PDF</option>
                                <option value="every">Split into separate files</option>
                            </select>
                        </Field>
                        {mode === 'extract' ? (
                            <Field label="Pages">
                                <input className={inputClass} value={ranges} onChange={e => setRanges(e.target.value)} placeholder="1-3, 5, 8-" />
                            </Field>
                        ) : (
                            <Field label="Pages per file">
                                <input
                                    className={inputClass}
                                    type="number"
                                    min={1}
                                    value={chunkSize}
                                    onChange={e => setChunkSize(Math.max(1, Number(e.target.value) || 1))}
                                />
                            </Field>
                        )}
                    </Row>
                    {grid}
                    <Note>
                        {loaded
                            ? `Loaded ${loaded.pageCount} page${loaded.pageCount === 1 ? '' : 's'}. ${NOTHING_UPLOADED}`
                            : NOTHING_UPLOADED}
                    </Note>
                </Options>
            }
        />
    );
};

// ─── PDF to Text ────────────────────────────────────────────────────────────

export const PdfToText = () => {
    const { loaded, source, error, setError, open, clear } = usePdfSource();
    const [text, setText] = useState('');
    const [pageBreaks, setPageBreaks] = useState(true);
    const [progress, setProgress] = useState<{ pct: number; label: string } | undefined>();

    const extract = useCallback(async () => {
        if (!loaded) { setText(''); return; }
        setError('');
        setProgress({ pct: 0, label: 'Reading pages…' });

        try {
            const pdfjs = await getPdfjs();
            // pdf.js takes ownership of the buffer, so hand it a copy.
            const task = pdfjs.getDocument({ data: loaded.bytes.slice() });
            const doc = await task.promise;
            const parts: string[] = [];

            for (let i = 1; i <= doc.numPages; i++) {
                const page = await doc.getPage(i);
                const content = await page.getTextContent();
                // The item list also carries marked-content markers, which have
                // no `str` — keep only the actual text runs.
                const items = content.items.flatMap(item =>
                    'str' in item ? [{ str: item.str, hasEOL: item.hasEOL }] : [],
                );
                parts.push(joinTextItems(items));
                page.cleanup();
                setProgress({ pct: (i / doc.numPages) * 100, label: `Reading page ${i} of ${doc.numPages}…` });
            }

            await task.destroy();
            setText(
                pageBreaks
                    ? parts.map((body, i) => `── Page ${i + 1} ──\n${body}`).join('\n\n')
                    : parts.filter(Boolean).join('\n\n'),
            );
        } catch (err) {
            setText('');
            setError(readableError(err));
        } finally {
            setProgress(undefined);
        }
    }, [loaded, pageBreaks, setError]);

    useEffect(() => { extract(); }, [extract]);

    return (
        <MediaConverter
            backColor={COLOR}
            title="PDF to Text"
            description="Extract the text layer from a PDF, page by page. Works on any PDF with real text — a scanned page holds only an image, so it will come out empty. All processing happens in your browser."
            accept={ACCEPT}
            inputMedium="pdf"
            outputMedium="text"
            onFiles={f => open(f[0])}
            onClear={() => { clear(); setText(''); }}
            source={source}
            textResult={text}
            textResultTitle="Extracted text"
            progress={progress}
            error={error}
            extraElements={
                <Options>
                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                        <input type="checkbox" className="accent-gray-900" checked={pageBreaks} onChange={e => setPageBreaks(e.target.checked)} />
                        <span className="text-sm text-gray-700">Mark page boundaries</span>
                    </label>
                    <Note>{NOTHING_UPLOADED}</Note>
                </Options>
            }
        />
    );
};

// ─── PDF Info ───────────────────────────────────────────────────────────────

const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <div className="flex flex-col gap-1 p-3 bg-white border border-gray-300">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
        <span className="font-mono text-lg leading-none text-gray-900 break-all">{value}</span>
        {sub && <span className="text-xs text-gray-400 break-all">{sub}</span>}
    </div>
);

/** A document-property row; an unset property reads as a grey dash. */
const MetaRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col gap-0.5 py-2 border-b border-gray-200">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
        <span className={`font-mono text-sm break-all ${value ? 'text-gray-900' : 'text-gray-400'}`}>
            {value || '—'}
        </span>
    </div>
);

const formatDate = (date?: Date) => {
    if (!date || Number.isNaN(date.getTime())) return '';
    return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

const DocumentReport = ({
    info,
    file,
    thumbs,
}: {
    info: PdfDocumentInfo;
    file: File;
    thumbs: PdfThumbs;
}) => {
    const groups: PageSizeGroup[] = summarizePageSizes(info.pages);
    const meta = info.metadata;

    return (
        <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Pages" value={String(info.pageCount)} sub={file.name} />
                <Stat label="File size" value={formatBytes(file.size)} />
                <Stat
                    label="Page size"
                    value={groups.length === 1 ? groups[0].label.split(' (')[0] : 'Mixed'}
                    sub={
                        groups.length === 1
                            ? groups[0].label.match(/\((.*)\)/)?.[1] ?? 'no standard match'
                            : `${groups.length} different sizes`
                    }
                />
                <Stat
                    label="Form fields"
                    value={info.formFields ? String(info.formFields) : 'None'}
                    sub={info.formFields ? 'fillable AcroForm' : 'not a form'}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <span className={fieldLabel}>Page sizes</span>
                <ul className="border border-gray-300 bg-white divide-y divide-gray-200">
                    {groups.map(group => (
                        <li
                            key={`${group.label}-${group.rotation}`}
                            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-3 py-2"
                        >
                            <span className="font-mono text-sm text-gray-900">
                                {group.label}
                                {group.rotation !== 0 && (
                                    <span className="text-gray-500"> · rotated {group.rotation}°</span>
                                )}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">
                                {group.pages.length === info.pageCount
                                    ? 'every page'
                                    : `page${group.pages.length === 1 ? '' : 's'} ${describePages(
                                          group.pages.map(page => page - 1),
                                      )}`}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="flex flex-col gap-1.5">
                <span className={fieldLabel}>Document properties</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 border-t border-gray-200">
                    <MetaRow label="Title" value={meta.title} />
                    <MetaRow label="Author" value={meta.author} />
                    <MetaRow label="Subject" value={meta.subject} />
                    <MetaRow label="Keywords" value={meta.keywords} />
                    <MetaRow label="Creator" value={meta.creator} />
                    <MetaRow label="Producer" value={meta.producer} />
                    <MetaRow label="Created" value={formatDate(info.creationDate)} />
                    <MetaRow label="Modified" value={formatDate(info.modificationDate)} />
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <span className={fieldLabel}>
                    {info.pageCount} page{info.pageCount === 1 ? '' : 's'}
                </span>
                <ThumbScroller>
                    <ThumbGrid>
                        {info.pages.map(page => (
                            <PageThumb key={page.number} thumbs={thumbs} page={page.number} />
                        ))}
                    </ThumbGrid>
                </ThumbScroller>
            </div>
        </div>
    );
};

export const PdfInfo = () => {
    const { loaded, source, thumbs, error, open, clear } = usePdfSource();

    const report = loaded ? formatPdfInfo(loaded.info, loaded.file.name, loaded.file.size) : '';

    return (
        <MediaConverter
            backColor={COLOR}
            title="PDF Info"
            description="Inspect a PDF without opening it: page count, page sizes and rotation, [1title2], [1author2], producer, dates and form fields. All processing happens in your browser."
            accept={ACCEPT}
            inputMedium="pdf"
            outputMedium="text"
            onFiles={f => open(f[0])}
            onClear={clear}
            source={source}
            outputVisual={
                loaded ? <DocumentReport info={loaded.info} file={loaded.file} thumbs={thumbs} /> : undefined
            }
            textResult={report}
            textResultTitle="Raw report"
            error={error}
            extraElements={<Note>{NOTHING_UPLOADED}</Note>}
        />
    );
};

// ─── PDF Metadata Editor ────────────────────────────────────────────────────

const EMPTY_META: PdfMetadata = { title: '', author: '', subject: '', keywords: '', creator: '', producer: '' };

export const PdfMetadataEditor = () => {
    const { loaded, source, error, setError, open, clear } = usePdfSource();
    const { result, publish, clear: clearResult } = usePdfResult();
    const [meta, setMeta] = useState<PdfMetadata>(EMPTY_META);

    const loadFile = async (file: File) => {
        const opened = await open(file);
        if (!opened) return;
        try {
            setMeta(await readMetadata(opened.bytes));
        } catch (err) {
            setError(readableError(err));
        }
    };

    const apply = useCallback(async () => {
        if (!loaded) return;
        setError('');
        try {
            publish(await writeMetadata(loaded.bytes, meta), outputName(loaded.file.name, 'metadata'));
        } catch (err) {
            setError(readableError(err));
        }
    }, [loaded, meta, publish, setError]);

    useEffect(() => { apply(); }, [apply]);

    const field = (key: keyof PdfMetadata, label: string) => (
        <Field label={label}>
            <input
                className={inputClass}
                value={meta[key]}
                onChange={e => setMeta({ ...meta, [key]: e.target.value })}
                disabled={!loaded}
            />
        </Field>
    );

    return (
        <MediaConverter
            backColor={COLOR}
            title="PDF Metadata Editor"
            description="Read and rewrite a PDF's document properties — [1title2], author, subject, keywords, creator and producer. Leave a field blank to clear it. All processing happens in your browser."
            accept={ACCEPT}
            inputMedium="pdf"
            outputMedium="pdf"
            onFiles={f => loadFile(f[0])}
            onClear={() => { clear(); clearResult(); setMeta(EMPTY_META); }}
            source={source}
            result={result}
            error={error}
            extraElements={
                <Options>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {field('title', 'Title')}
                        {field('author', 'Author')}
                        {field('subject', 'Subject')}
                        {field('keywords', 'Keywords')}
                        {field('creator', 'Creator')}
                        {field('producer', 'Producer')}
                    </div>
                    <Note>
                        The modification date is set to now on save; the creation date is left as it was. {NOTHING_UPLOADED}
                    </Note>
                </Options>
            }
        />
    );
};

// ─── Add Page Numbers ───────────────────────────────────────────────────────

export const PdfPageNumbers = () => {
    const { loaded, source, error, setError, open, clear } = usePdfSource();
    const { result, publish, clear: clearResult } = usePdfResult();

    const [template, setTemplate] = useState('Page {n} of {N}');
    const [corner, setCorner] = useState<Corner>('bottom-center');
    const [fontSize, setFontSize] = useState(10);
    const [margin, setMargin] = useState(36);
    const [startPage, setStartPage] = useState(1);
    const [startAt, setStartAt] = useState(1);

    const run = useCallback(async () => {
        if (!loaded) return;
        setError('');
        try {
            const bytes = await addPageNumbers(loaded.bytes, { template, corner, fontSize, margin, startPage, startAt });
            publish(bytes, outputName(loaded.file.name, 'numbered'));
        } catch (err) {
            setError(readableError(err));
        }
    }, [loaded, template, corner, fontSize, margin, startPage, startAt, publish, setError]);

    useEffect(() => { run(); }, [run]);

    return (
        <MediaConverter
            backColor={COLOR}
            title="Add Page Numbers to PDF"
            description="Stamp page numbers onto a PDF. Use [1{n}2] for the page number and [1{N}2] for the total, and skip front matter by starting on a later page. All processing happens in your browser."
            accept={ACCEPT}
            inputMedium="pdf"
            outputMedium="pdf"
            onFiles={f => open(f[0])}
            onClear={() => { clear(); clearResult(); }}
            source={source}
            result={result}
            error={error}
            extraElements={
                <Options>
                    <Row>
                        <Field label="Format">
                            <input className={inputClass} value={template} onChange={e => setTemplate(e.target.value)} />
                        </Field>
                        <Field label="Position">
                            <select className={selectClass} value={corner} onChange={e => setCorner(e.target.value as Corner)}>
                                {CORNERS.map(c => <option key={c} value={c}>{c.replace('-', ' ')}</option>)}
                            </select>
                        </Field>
                        <Field label="Font size (pt)">
                            <input className={inputClass} type="number" min={4} max={72} value={fontSize} onChange={e => setFontSize(Number(e.target.value) || 10)} />
                        </Field>
                        <Field label="Margin (pt)">
                            <input className={inputClass} type="number" min={0} max={200} value={margin} onChange={e => setMargin(Number(e.target.value) || 0)} />
                        </Field>
                        <Field label="Start on page">
                            <input className={inputClass} type="number" min={1} value={startPage} onChange={e => setStartPage(Math.max(1, Number(e.target.value) || 1))} />
                        </Field>
                        <Field label="Number it">
                            <input className={inputClass} type="number" min={1} value={startAt} onChange={e => setStartAt(Math.max(1, Number(e.target.value) || 1))} />
                        </Field>
                    </Row>
                    <Note>Numbers are drawn in Helvetica. {NOTHING_UPLOADED}</Note>
                </Options>
            }
        />
    );
};

// ─── Watermark PDF ──────────────────────────────────────────────────────────

/** `#rrggbb` to pdf-lib's 0–1 channel triple. */
function hexToUnit(hex: string): { r: number; g: number; b: number } {
    const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!match) return { r: 0.5, g: 0.5, b: 0.5 };
    const int = parseInt(match[1], 16);
    return { r: ((int >> 16) & 255) / 255, g: ((int >> 8) & 255) / 255, b: (int & 255) / 255 };
}

export const PdfWatermark = () => {
    const { loaded, source, error, setError, open, clear } = usePdfSource();
    const { result, publish, clear: clearResult } = usePdfResult();

    const [text, setText] = useState('CONFIDENTIAL');
    const [fontSize, setFontSize] = useState(60);
    const [opacity, setOpacity] = useState(0.15);
    const [rotation, setRotation] = useState(45);
    const [color, setColor] = useState('#888888');

    const run = useCallback(async () => {
        if (!loaded) return;
        setError('');
        try {
            const bytes = await watermarkPdf(loaded.bytes, {
                text, fontSize, opacity, rotation, color: hexToUnit(color),
            });
            publish(bytes, outputName(loaded.file.name, 'watermarked'));
        } catch (err) {
            setError(readableError(err));
        }
    }, [loaded, text, fontSize, opacity, rotation, color, publish, setError]);

    useEffect(() => { run(); }, [run]);

    return (
        <MediaConverter
            backColor={COLOR}
            title="Watermark PDF"
            description="Stamp text such as [1CONFIDENTIAL2] or [1DRAFT2] diagonally across every page, with control over size, angle, colour and opacity. All processing happens in your browser."
            accept={ACCEPT}
            inputMedium="pdf"
            outputMedium="pdf"
            onFiles={f => open(f[0])}
            onClear={() => { clear(); clearResult(); }}
            source={source}
            result={result}
            error={error}
            extraElements={
                <Options>
                    <Row>
                        <Field label="Text">
                            <input className={inputClass} value={text} onChange={e => setText(e.target.value)} />
                        </Field>
                        <Field label="Font size (pt)">
                            <input className={inputClass} type="number" min={8} max={200} value={fontSize} onChange={e => setFontSize(Number(e.target.value) || 60)} />
                        </Field>
                        <Field label={`Opacity — ${Math.round(opacity * 100)}%`}>
                            <input type="range" min={5} max={100} value={opacity * 100} onChange={e => setOpacity(Number(e.target.value) / 100)} className="accent-gray-900 h-9" />
                        </Field>
                        <Field label={`Angle — ${rotation}°`}>
                            <input type="range" min={-90} max={90} value={rotation} onChange={e => setRotation(Number(e.target.value))} className="accent-gray-900 h-9" />
                        </Field>
                        <Field label="Colour">
                            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-9 w-full border border-gray-300 bg-white cursor-pointer p-1" />
                        </Field>
                    </Row>
                    <Note>
                        The watermark is drawn on top of the page content and can be removed by anyone with a PDF editor — it marks a document, it does not protect it. {NOTHING_UPLOADED}
                    </Note>
                </Options>
            }
        />
    );
};

// ─── Resize PDF Pages ───────────────────────────────────────────────────────

/**
 * The target sheet with the re-laid content inside it, drawn to scale.
 *
 * Everything is in PDF points via the viewBox, so the margins a "fit" leaves —
 * the whole reason to preview a resize — appear at their true proportions.
 * PDF's y-axis runs upwards and SVG's downwards, but a fit is centred, so the
 * mirrored offset lands in the same place.
 */
const SheetDiagram = ({
    plan,
    srcWidth,
    srcHeight,
}: {
    plan: ResizePlan;
    srcWidth: number;
    srcHeight: number;
}) => (
    <svg
        viewBox={`0 0 ${plan.width} ${plan.height}`}
        className="h-36 w-auto max-w-full"
        role="img"
        aria-label="Target page with the scaled content inside it"
    >
        <rect
            x={0}
            y={0}
            width={plan.width}
            height={plan.height}
            className="text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
        />
        <rect
            x={plan.offsetX}
            y={plan.offsetY}
            width={srcWidth * plan.scaleX}
            height={srcHeight * plan.scaleY}
            className="text-violet-500"
            fill="currentColor"
            fillOpacity={0.14}
            stroke="currentColor"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
        />
    </svg>
);

export const PdfResize = () => {
    const { loaded, source, thumbs, error, setError, open, clear } = usePdfSource();
    const { result, publish, clear: clearResult } = usePdfResult();

    const [size, setSize] = useState('A4');
    const [mode, setMode] = useState<ResizeMode>('fit');
    const [matchOrientation, setMatchOrientation] = useState(true);
    // Kept so the output pane can render the resized page rather than describe
    // it — the letterboxing is the thing worth seeing.
    const [outBytes, setOutBytes] = useState<Uint8Array | null>(null);
    const outThumbs = usePdfThumbs(outBytes);

    const run = useCallback(async () => {
        if (!loaded) return;
        setError('');
        try {
            const [w, h] = PAGE_SIZES[size];
            const bytes = await resizePages(loaded.bytes, w, h, mode, matchOrientation);
            setOutBytes(bytes);
            publish(bytes, outputName(loaded.file.name, size.toLowerCase()), `${size} pages`);
        } catch (err) {
            setOutBytes(null);
            setError(readableError(err));
        }
    }, [loaded, size, mode, matchOrientation, publish, setError]);

    useEffect(() => { run(); }, [run]);

    // Page 1 stands in for the document; a mixed-size file gets a note instead
    // of a diagram per page.
    const first = loaded?.info.pages[0];
    const plan = useMemo(() => {
        if (!first) return null;
        const [w, h] = PAGE_SIZES[size];
        try {
            return planResize(first.width, first.height, w, h, mode, matchOrientation);
        } catch {
            return null;
        }
    }, [first, size, mode, matchOrientation]);

    const uniform = loaded ? loaded.info.uniformPages : true;

    return (
        <MediaConverter
            backColor={COLOR}
            title="Resize PDF Pages"
            description="Re-lay every page of a PDF onto a standard paper size such as [1A42] or [1Letter2], scaling the content to fit and centring it. All processing happens in your browser."
            accept={ACCEPT}
            inputMedium="pdf"
            outputMedium="pdf"
            onFiles={f => open(f[0])}
            onClear={() => { clear(); clearResult(); setOutBytes(null); }}
            source={source}
            result={
                result && outBytes
                    ? { ...result, preview: <PageThumb thumbs={outThumbs} page={1} size="lg" /> }
                    : result
            }
            error={error}
            extraElements={
                <Options>
                    <Row>
                        <Field label="Page size">
                            <select className={selectClass} value={size} onChange={e => setSize(e.target.value)}>
                                {Object.keys(PAGE_SIZES).map(name => (
                                    <option key={name} value={name}>
                                        {name} — {Math.round(PAGE_SIZES[name][0])} × {Math.round(PAGE_SIZES[name][1])} pt
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Scaling">
                            <select className={selectClass} value={mode} onChange={e => setMode(e.target.value as ResizeMode)}>
                                <option value="fit">Fit and centre (keeps proportions)</option>
                                <option value="stretch">Stretch to fill</option>
                            </select>
                        </Field>
                    </Row>
                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                        <input type="checkbox" className="accent-gray-900" checked={matchOrientation} onChange={e => setMatchOrientation(e.target.checked)} />
                        <span className="text-sm text-gray-700">Keep each page&apos;s orientation</span>
                    </label>

                    {loaded && first && plan && (
                        <div className="flex flex-col gap-1.5">
                            <span className={fieldLabel}>
                                {uniform ? 'Every page' : 'Page 1'} on the new sheet
                            </span>
                            <div className="flex flex-wrap items-center gap-6 p-4 bg-white border border-gray-300">
                                <div className="flex items-center gap-4">
                                    <PageThumb thumbs={thumbs} page={1} />
                                    <span className="text-gray-400 text-lg leading-none">→</span>
                                    <SheetDiagram plan={plan} srcWidth={first.width} srcHeight={first.height} />
                                </div>
                                <dl className="flex flex-col gap-1 font-mono text-xs text-gray-500">
                                    <div>
                                        <dt className="inline text-gray-400">from </dt>
                                        <dd className="inline text-gray-700">
                                            {describePageSize(first.width, first.height)}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="inline text-gray-400">to </dt>
                                        <dd className="inline text-gray-700">
                                            {describePageSize(plan.width, plan.height)}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="inline text-gray-400">content </dt>
                                        <dd className="inline text-gray-700">
                                            {mode === 'stretch'
                                                ? `${(plan.scaleX * 100).toFixed(1)}% × ${(plan.scaleY * 100).toFixed(1)}%`
                                                : `${(plan.scaleX * 100).toFixed(1)}%`}
                                        </dd>
                                    </div>
                                    {mode === 'fit' && (plan.offsetX > 0.5 || plan.offsetY > 0.5) && (
                                        <div>
                                            <dt className="inline text-gray-400">margins </dt>
                                            <dd className="inline text-gray-700">
                                                {Math.round(plan.offsetX)} × {Math.round(plan.offsetY)} pt
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            </div>
                            {!uniform && (
                                <Note>
                                    This document mixes page sizes — each page is fitted to the target on its own,
                                    so the scale shown applies to page 1.
                                </Note>
                            )}
                        </div>
                    )}

                    <Note>Page rotation, links and annotations are preserved. {NOTHING_UPLOADED}</Note>
                </Options>
            }
        />
    );
};

// ─── Flatten PDF Forms ──────────────────────────────────────────────────────

export const PdfFlatten = () => {
    const { loaded, source, error, setError, open, clear } = usePdfSource();
    const { result, publish, clear: clearResult } = usePdfResult();
    const [fields, setFields] = useState<{ name: string; type: string }[]>([]);

    const run = useCallback(async () => {
        if (!loaded) return;
        setError('');
        try {
            const found = await listFormFields(loaded.bytes);
            setFields(found);
            if (found.length === 0) {
                setError('This PDF has no fillable form fields, so there is nothing to flatten.');
                clearResult();
                return;
            }
            publish(await flattenPdf(loaded.bytes), outputName(loaded.file.name, 'flattened'), `${found.length} fields baked in`);
        } catch (err) {
            setError(readableError(err));
        }
    }, [loaded, publish, clearResult, setError]);

    useEffect(() => { run(); }, [run]);

    return (
        <MediaConverter
            backColor={COLOR}
            title="Flatten PDF Forms"
            description="Bake a filled-in PDF form's values into the page so they render everywhere and can no longer be edited. Lists every field before flattening. All processing happens in your browser."
            accept={ACCEPT}
            inputMedium="pdf"
            outputMedium="pdf"
            onFiles={f => { setFields([]); open(f[0]); }}
            onClear={() => { clear(); clearResult(); setFields([]); }}
            source={source}
            result={result}
            error={error}
            extraElements={
                <Options>
                    {fields.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                            <span className={fieldLabel}>{fields.length} form field{fields.length === 1 ? '' : 's'}</span>
                            <ul className="max-h-40 overflow-auto border border-gray-300 bg-white divide-y divide-gray-200">
                                {fields.map(field => (
                                    <li key={field.name} className="flex items-center justify-between gap-3 px-3 py-1.5">
                                        <span className="font-mono text-sm text-gray-700 break-all">{field.name}</span>
                                        <span className="flex-shrink-0 text-xs text-gray-400">{field.type}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <Note>Flattening cannot be undone — keep the original if you may need to edit it again. {NOTHING_UPLOADED}</Note>
                </Options>
            }
        />
    );
};
