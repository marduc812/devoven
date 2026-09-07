'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import MediaConverter from '@/Components/MainView/MainPanel/MediaConverter';
import { MediaResult, MediaSource } from '@/types';
import { useShareLink } from '../ShareLink';
import { formatBytes } from '../CompressionTools/logic';
import {
    ArchiveEntry,
    ArchiveListing,
    archiveTotals,
    createZip,
    extractArchiveEntry,
    formatArchiveListing,
    formatLabel,
    listArchive,
    ZipInput,
} from './logic';

const COLOR = 'lime' as const;

// The whole archive is held in memory and every entry is expanded at once, so
// the cap is lower than the read-only forensics tools use.
const MAX_BYTES = 32 * 1024 * 1024;

// Past this many entries the browser is making thousands of object URLs for a
// list nobody will scroll. The listing still reports the real count.
const MAX_ENTRIES = 400;

const LEVELS = [
    { value: '0', label: '0 — store, no compression' },
    { value: '1', label: '1 — fastest' },
    { value: '6', label: '6 — default' },
    { value: '9', label: '9 — smallest' },
];

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

const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <div className="flex flex-col gap-1 p-3 bg-white border border-gray-300">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
        <span className="font-mono text-lg leading-none text-gray-900 break-all">{value}</span>
        {sub && <span className="text-xs text-gray-400 break-all">{sub}</span>}
    </div>
);

const NOTHING_UPLOADED = 'Everything is packed and unpacked in your browser — no file is uploaded.';

function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}

const errorText = (err: unknown): string => (err instanceof Error ? err.message : String(err));

/**
 * The pane already prints the file name and a size underneath it, so the
 * preview slot is spent on what the pane cannot say: what is actually in there.
 */
const NamesPreview = ({ names }: { names: string[] }) => {
    const shown = names.slice(0, 3);
    const rest = names.length - shown.length;
    return (
        <span className="font-mono text-sm text-gray-700 break-all text-center">
            {shown.join(', ')}
            {rest > 0 && <span className="text-gray-400">{` + ${rest} more`}</span>}
        </span>
    );
};

/**
 * Keeps object URLs for a set of results and revokes the previous set whenever
 * it is replaced, so dropping one archive after another does not leak.
 */
function useObjectUrls() {
    const urls = useRef<string[]>([]);

    const revoke = useCallback(() => {
        for (const url of urls.current) URL.revokeObjectURL(url);
        urls.current = [];
    }, []);

    useEffect(() => revoke, [revoke]);

    const create = useCallback((blob: Blob): string => {
        const url = URL.createObjectURL(blob);
        urls.current.push(url);
        return url;
    }, []);

    return { create, revoke };
}

// ─── Create ZIP ─────────────────────────────────────────────────────────────

type PickedFile = { id: number; file: File; bytes: Uint8Array };

let nextFileId = 0;

export const ZipCreator = () => {
    const [files, setFiles] = useState<PickedFile[]>([]);
    const [level, setLevel] = useState('6');
    const [archiveName, setArchiveName] = useState('archive.zip');
    const [error, setError] = useState('');
    const [result, setResult] = useState<MediaResult | undefined>();
    const { create, revoke } = useObjectUrls();

    // Options are shareable even though the files themselves cannot be.
    useEffect(() => {
        const params = new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        );
        const fromUrl = params.get('level');
        if (fromUrl && LEVELS.some(l => l.value === fromUrl)) setLevel(fromUrl);
        const name = params.get('name');
        if (name) setArchiveName(name);
    }, []);

    useShareLink({ level, name: archiveName });

    const add = async (incoming: File[]) => {
        setError('');
        const loaded: PickedFile[] = [];
        let total = files.reduce((n, f) => n + f.bytes.length, 0);
        for (const file of incoming) {
            total += file.size;
            if (total > MAX_BYTES) {
                setError(`That is more than ${formatBytes(MAX_BYTES)} of input. The archive is built in memory, so the tool stops there.`);
                break;
            }
            try {
                loaded.push({ id: nextFileId++, file, bytes: new Uint8Array(await file.arrayBuffer()) });
            } catch (err) {
                setError(`Could not read "${file.name}": ${errorText(err)}`);
            }
        }
        if (loaded.length > 0) setFiles(prev => [...prev, ...loaded]);
    };

    const clear = () => {
        revoke();
        setFiles([]);
        setResult(undefined);
        setError('');
    };

    const remove = (id: number) => {
        revoke();
        setResult(undefined);
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const totalBytes = files.reduce((n, f) => n + f.bytes.length, 0);

    // Rebuilt whenever the input set or the level changes, so the output pane
    // is never showing a zip that no longer matches the options above it.
    useEffect(() => {
        revoke();
        if (files.length === 0) {
            setResult(undefined);
            return;
        }
        try {
            const inputs: ZipInput[] = files.map(f => ({ name: f.file.name, bytes: f.bytes }));
            const zip = createZip(inputs, level);
            const url = create(new Blob([zip.slice().buffer as ArrayBuffer], { type: 'application/zip' }));
            const saved = totalBytes > 0 ? (1 - zip.length / totalBytes) * 100 : 0;
            setResult({
                url,
                fileName: archiveName.trim() || 'archive.zip',
                meta: `${formatBytes(totalBytes)} → ${formatBytes(zip.length)} (${saved >= 0 ? '' : '+'}${Math.abs(saved).toFixed(1)}% ${saved >= 0 ? 'smaller' : 'larger'})`,
            });
            setError('');
        } catch (err) {
            setResult(undefined);
            setError(errorText(err));
        }
        // `create` and `revoke` are stable; `totalBytes` follows `files`.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [files, level, archiveName]);

    const source: MediaSource | undefined = files.length > 0
        ? {
              url: '',
              name: `${files.length} file${files.length === 1 ? '' : 's'}`,
              meta: formatBytes(totalBytes),
              preview: <NamesPreview names={files.map(f => f.file.name)} />,
          }
        : undefined;

    return (
        <MediaConverter
            backColor={COLOR}
            title="Create ZIP"
            description="Pack any set of files into one [1.zip2] archive, entirely in your browser. Drop the files, pick a compression level, and download the archive. Level [10 2] stores the files without compressing them, which is what you want for data that is already compressed."
            accept="*/*"
            multiple
            inputMedium="file"
            outputMedium="file"
            hint="Drop files or click to browse"
            onFiles={add}
            onClear={files.length > 0 ? clear : undefined}
            source={source}
            result={result}
            error={error}
            extraElements={
                <Options>
                    <Row>
                        <Field label="Archive name">
                            <input
                                className={inputClass}
                                value={archiveName}
                                onChange={e => setArchiveName(e.target.value)}
                                placeholder="archive.zip"
                            />
                        </Field>
                        <Field label="Compression level">
                            <select className={selectClass} value={level} onChange={e => setLevel(e.target.value)}>
                                {LEVELS.map(l => (
                                    <option key={l.value} value={l.value}>{l.label}</option>
                                ))}
                            </select>
                        </Field>
                    </Row>

                    {files.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                            <span className={fieldLabel}>Files</span>
                            <ul className="max-h-40 overflow-auto border border-gray-300 bg-white divide-y divide-gray-200">
                                {files.map(f => (
                                    <li key={f.id} className="flex items-center justify-between gap-3 px-3 py-1.5">
                                        <span className="font-mono text-sm text-gray-700 break-all">{f.file.name}</span>
                                        <span className="flex items-center gap-3 flex-shrink-0">
                                            <span className="text-xs text-gray-400">{formatBytes(f.bytes.length)}</span>
                                            <button
                                                type="button"
                                                onClick={() => remove(f.id)}
                                                className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 transition-colors"
                                                aria-label={`Remove ${f.file.name}`}
                                            >
                                                Remove
                                            </button>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <Note>
                        Two files with the same name are both kept — the second becomes
                        &ldquo;name (2).ext&rdquo;. {NOTHING_UPLOADED}
                    </Note>
                </Options>
            }
        />
    );
};

// ─── Extract ZIP ────────────────────────────────────────────────────────────

type Extracted = { results: MediaResult[]; failed: { name: string; reason: string }[] };

const ListingCard = ({ listing }: { listing: ArchiveListing }) => {
    const totals = archiveTotals(listing);
    const zip = listing.format === 'zip';
    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat label="Format" value={formatLabel[listing.format]} />
                <Stat
                    label="Files"
                    value={String(totals.files)}
                    sub={totals.directories > 0 ? `${totals.directories} director${totals.directories === 1 ? 'y' : 'ies'}` : undefined}
                />
                <Stat label="Unpacked" value={formatBytes(totals.size)} />
                <Stat
                    label={zip ? 'Packed' : 'Stored'}
                    value={formatBytes(totals.compressedSize)}
                    sub={zip && totals.size > 0 ? `${((1 - totals.ratio) * 100).toFixed(1)}% smaller` : undefined}
                />
            </div>
            <div className="flex flex-col gap-1.5">
                <span className={fieldLabel}>Listing</span>
                <pre className="bg-gray-50 border border-gray-200 p-3 overflow-x-auto max-h-64 overflow-y-auto font-mono text-xs text-gray-700">
                    {formatArchiveListing(listing)}
                </pre>
            </div>
        </div>
    );
};

export const ZipExtractor = () => {
    const [name, setName] = useState('');
    const [listing, setListing] = useState<ArchiveListing | null>(null);
    const [extracted, setExtracted] = useState<Extracted>({ results: [], failed: [] });
    const [error, setError] = useState('');
    const { create, revoke } = useObjectUrls();

    const clear = useCallback(() => {
        revoke();
        setName('');
        setListing(null);
        setExtracted({ results: [], failed: [] });
        setError('');
    }, [revoke]);

    const open = async (file: File) => {
        revoke();
        setError('');
        setListing(null);
        setExtracted({ results: [], failed: [] });
        setName(file.name);

        if (file.size > MAX_BYTES) {
            setName('');
            setError(`That archive is ${formatBytes(file.size)}. It is unpacked in memory, so the tool stops at ${formatBytes(MAX_BYTES)}.`);
            return;
        }

        let bytes: Uint8Array;
        try {
            bytes = new Uint8Array(await file.arrayBuffer());
        } catch (err) {
            setName('');
            setError(errorText(err));
            return;
        }

        let parsed: ArchiveListing;
        try {
            parsed = listArchive(bytes);
        } catch (err) {
            setError(errorText(err));
            return;
        }
        setListing(parsed);

        // Each entry is expanded on its own so one unsupported or encrypted
        // file is reported by name instead of failing the whole archive.
        const results: MediaResult[] = [];
        const failed: { name: string; reason: string }[] = [];
        const entries: ArchiveEntry[] = parsed.entries.filter(e => !e.isDirectory).slice(0, MAX_ENTRIES);
        for (const entry of entries) {
            try {
                const data = extractArchiveEntry(bytes, entry.name);
                const url = create(new Blob([data.slice().buffer as ArrayBuffer], { type: 'application/octet-stream' }));
                results.push({ url, fileName: entry.name, meta: formatBytes(entry.size) });
            } catch (err) {
                failed.push({ name: entry.name, reason: errorText(err) });
            }
        }
        setExtracted({ results, failed });
    };

    const downloadAll = async () => {
        for (const file of extracted.results) {
            const response = await fetch(file.url);
            // The file name may carry a path; a download attribute keeps only
            // the last segment anyway, so flatten it deliberately.
            downloadBlob(await response.blob(), file.fileName.slice(file.fileName.lastIndexOf('/') + 1));
            // A short gap keeps the browser from dropping rapid downloads.
            await new Promise(r => setTimeout(r, 150));
        }
    };

    const hidden = listing
        ? listing.entries.filter(e => !e.isDirectory).length - extracted.results.length - extracted.failed.length
        : 0;

    const source: MediaSource | undefined = name
        ? {
              url: '',
              name,
              meta: listing ? `${formatLabel[listing.format]} · ${archiveTotals(listing).files} files` : undefined,
              preview: listing ? (
                  <NamesPreview names={listing.entries.filter(e => !e.isDirectory).map(e => e.name)} />
              ) : undefined,
          }
        : undefined;

    return (
        <MediaConverter
            backColor={COLOR}
            title="Extract ZIP"
            description="Open a [1.zip2] or [1.tar2] archive and pull the files out of it, in your browser. Lists every entry with its packed and unpacked size, then offers each one as a download. A [1.tar.gz2] has to be decompressed first with the Gzip tool."
            accept=".zip,.tar,application/zip,application/x-tar"
            inputMedium="file"
            outputMedium="file"
            hint="Drop a ZIP or TAR archive or click to browse"
            onFiles={files => open(files[0])}
            onClear={name || error ? clear : undefined}
            source={source}
            outputVisual={listing ? <ListingCard listing={listing} /> : undefined}
            results={extracted.results.length > 0 ? extracted.results : undefined}
            onDownloadAll={extracted.results.length > 0 ? downloadAll : undefined}
            error={error}
            extraElements={
                <Options>
                    {extracted.failed.length > 0 && (
                        <div className="flex flex-col gap-1.5">
                            <span className={fieldLabel}>Could not extract</span>
                            <ul className="border border-gray-300 bg-white divide-y divide-gray-200 max-h-32 overflow-auto">
                                {extracted.failed.map(f => (
                                    <li key={f.name} className="px-3 py-1.5">
                                        <span className="font-mono text-sm text-gray-700 break-all">{f.name}</span>
                                        <span className="text-xs text-gray-400 block">{f.reason}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {hidden > 0 && (
                        <Note>
                            Showing the first {MAX_ENTRIES} entries. The listing above counts them all.
                        </Note>
                    )}
                    <Note>{NOTHING_UPLOADED}</Note>
                </Options>
            }
        />
    );
};
