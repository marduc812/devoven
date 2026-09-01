'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MediaConverter from '@/Components/MainView/MainPanel/MediaConverter';
import { MediaSource } from '@/types';
import { CATEGORY_LABEL } from './signatures';
import {
    Detection,
    EmbeddedHit,
    StringEncoding,
    byteEntropy,
    carvedFileName,
    describeFileType,
    detectFileType,
    extractStrings,
    formatBytes,
    formatDetection,
    formatEmbedded,
    formatStrings,
    hexPreview,
    scanEmbeddedFiles,
    sliceHit,
    toHex,
} from './logic';

const COLOR = 'lime' as const;
const ACCEPT = '*/*';
const HINT = 'Drop any file or click to browse';
const NOTHING_UPLOADED = 'The bytes are read in your browser — the file never leaves your device.';

// A file this size already takes a noticeable moment to walk byte by byte, and
// past it the tab stops feeling responsive. Better to say so than to freeze.
const MAX_BYTES = 64 * 1024 * 1024;

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

// ─── Shared plumbing ────────────────────────────────────────────────────────

interface LoadedFile {
    file: File;
    bytes: Uint8Array;
}

/**
 * Reads a dropped file into memory and keeps the object URL that backs the
 * input pane, revoking the old one whenever a new file replaces it.
 */
function useFileBytes() {
    const [loaded, setLoaded] = useState<LoadedFile | null>(null);
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    const urlRef = useRef('');

    const revoke = () => {
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = '';
    };

    useEffect(() => revoke, []);

    const open = useCallback(async (file: File) => {
        setError('');
        if (file.size > MAX_BYTES) {
            revoke();
            setUrl('');
            setLoaded(null);
            setError(`That file is ${formatBytes(file.size)}. This tool reads the whole file in memory, so it stops at ${formatBytes(MAX_BYTES)}.`);
            return;
        }
        try {
            const bytes = new Uint8Array(await file.arrayBuffer());
            revoke();
            const next = URL.createObjectURL(file);
            urlRef.current = next;
            setUrl(next);
            setLoaded({ file, bytes });
        } catch (err) {
            revoke();
            setUrl('');
            setLoaded(null);
            setError(err instanceof Error ? err.message : String(err));
        }
    }, []);

    const clear = useCallback(() => {
        revoke();
        setUrl('');
        setLoaded(null);
        setError('');
    }, []);

    const source: MediaSource | undefined = loaded
        ? {
              url,
              name: loaded.file.name,
              meta: formatBytes(loaded.file.size),
              // The file name is already printed under the pane, and for a blob
              // of bytes the leading bytes say far more than the name does.
              preview: (
                  <span className="font-mono text-sm text-gray-700 break-all text-center">
                      {toHex(loaded.bytes.subarray(0, 16))}
                      {loaded.bytes.length > 16 && ' …'}
                  </span>
              ),
          }
        : undefined;

    return { loaded, source, error, open, clear };
}

// ─── Detect File Type ───────────────────────────────────────────────────────

const DetectionCard = ({ detection, bytes }: { detection: Detection; bytes: Uint8Array }) => {
    const best = detection.matches[0];
    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat label="Type" value={describeFileType(detection)} />
                <Stat label="Extension" value={best?.signature.ext ? `.${best.signature.ext}` : '—'} sub={best ? CATEGORY_LABEL[best.signature.category] : undefined} />
                <Stat label="MIME" value={best?.signature.mime ?? '—'} />
                <Stat label="Entropy" value={detection.entropy.toFixed(2)} sub="bits per byte" />
            </div>
            <div className="flex flex-col gap-1.5">
                <span className={fieldLabel}>First bytes</span>
                <pre className="bg-gray-50 border border-gray-200 p-3 overflow-x-auto font-mono text-xs text-gray-700">
                    {hexPreview(bytes, 64)}
                </pre>
            </div>
        </div>
    );
};

export const FileTypeDetector = () => {
    const { loaded, source, error, open, clear } = useFileBytes();

    const detection = useMemo(() => (loaded ? detectFileType(loaded.bytes) : null), [loaded]);
    const report = loaded && detection ? formatDetection(detection, loaded.bytes, loaded.file.name) : '';

    return (
        <MediaConverter
            backColor={COLOR}
            title="Detect File Type"
            description="Identify a file from its magic number instead of its extension. Checks the leading bytes against a table of image, audio, video, archive, document, executable and font signatures, and falls back to reading the content when a format carries no magic number. Try it on a [1.txt2] that is really a ZIP."
            accept={ACCEPT}
            inputMedium="file"
            outputMedium="text"
            hint={HINT}
            onFiles={files => open(files[0])}
            onClear={clear}
            source={source}
            outputVisual={loaded && detection ? <DetectionCard detection={detection} bytes={loaded.bytes} /> : undefined}
            textResult={report}
            textResultTitle="Report"
            error={error}
            extraElements={<Note>{NOTHING_UPLOADED}</Note>}
        />
    );
};

// ─── Strings ────────────────────────────────────────────────────────────────

export const StringsExtractor = () => {
    const { loaded, source, error, open, clear } = useFileBytes();
    const [minLength, setMinLength] = useState(4);
    const [encoding, setEncoding] = useState<StringEncoding>('ascii');
    const [showOffsets, setShowOffsets] = useState(false);
    const [unique, setUnique] = useState(false);

    const hits = useMemo(
        () => (loaded ? extractStrings(loaded.bytes, { minLength, encoding }) : []),
        [loaded, minLength, encoding],
    );

    const result = useMemo(
        () => (loaded ? formatStrings(hits, { showOffsets, unique }) : ''),
        [loaded, hits, showOffsets, unique],
    );

    const summary = loaded
        ? `${hits.length.toLocaleString()} run${hits.length === 1 ? '' : 's'} of ${minLength}+ printable characters`
        : '';

    return (
        <MediaConverter
            backColor={COLOR}
            title="Strings"
            description="Pull the readable text out of a binary, the way [1strings(1)2] does. Reports every run of printable characters at or above the minimum length, in ASCII or in the UTF-16LE that Windows binaries use. Useful for finding URLs, paths, error messages and build IDs inside an executable or a firmware image."
            accept={ACCEPT}
            inputMedium="file"
            outputMedium="text"
            hint={HINT}
            onFiles={files => open(files[0])}
            onClear={clear}
            source={source}
            textResult={result}
            textResultTitle={summary || 'Extracted strings'}
            error={error}
            extraElements={
                <Options>
                    <Row>
                        <Field label="Minimum length">
                            <input
                                type="number"
                                min={1}
                                max={64}
                                className={inputClass}
                                value={minLength}
                                onChange={e => setMinLength(Math.min(64, Math.max(1, Number(e.target.value) || 1)))}
                            />
                        </Field>
                        <Field label="Encoding">
                            <select className={selectClass} value={encoding} onChange={e => setEncoding(e.target.value as StringEncoding)}>
                                <option value="ascii">ASCII</option>
                                <option value="utf16le">UTF-16LE</option>
                                <option value="both">Both</option>
                            </select>
                        </Field>
                    </Row>
                    <div className="flex flex-wrap gap-6">
                        <label className="flex items-center gap-2 cursor-pointer w-fit">
                            <input type="checkbox" className="accent-gray-900" checked={showOffsets} onChange={e => setShowOffsets(e.target.checked)} />
                            <span className="text-sm text-gray-700">Show byte offsets</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer w-fit">
                            <input type="checkbox" className="accent-gray-900" checked={unique} onChange={e => setUnique(e.target.checked)} />
                            <span className="text-sm text-gray-700">Drop duplicates</span>
                        </label>
                    </div>
                    <Note>{NOTHING_UPLOADED}</Note>
                </Options>
            }
        />
    );
};

// ─── Scan for Embedded Files ────────────────────────────────────────────────

type CarvedFile = { name: string; url: string; hit: EmbeddedHit };

/**
 * Object URLs for the carved slices, rebuilt whenever the hit list changes and
 * revoked on the way out so a run of dropped files does not leak blobs.
 */
function useCarvedFiles(bytes: Uint8Array | null, hits: EmbeddedHit[]): CarvedFile[] {
    const [files, setFiles] = useState<CarvedFile[]>([]);

    useEffect(() => {
        if (!bytes || hits.length === 0) {
            setFiles([]);
            return;
        }
        const next = hits.map((hit, index) => ({
            name: carvedFileName(hit, index + 1),
            url: URL.createObjectURL(
                new Blob([sliceHit(bytes, hit).buffer as ArrayBuffer], { type: hit.signature.mime }),
            ),
            hit,
        }));
        setFiles(next);
        return () => next.forEach(file => URL.revokeObjectURL(file.url));
    }, [bytes, hits]);

    return files;
}

const CarvedList = ({ files }: { files: CarvedFile[] }) => (
    <div className="flex flex-col gap-1.5">
        <span className={fieldLabel}>{files.length} file{files.length === 1 ? '' : 's'} found</span>
        <ul className="border border-gray-300 bg-white divide-y divide-gray-200 max-h-72 overflow-auto">
            {files.map(file => (
                <li key={file.name} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="flex flex-col min-w-0">
                        <span className="font-mono text-sm text-gray-900 break-all">
                            0x{file.hit.offset.toString(16).padStart(8, '0')} — {file.hit.signature.name}
                        </span>
                        <span className="text-xs text-gray-400">
                            {file.hit.length === null ? `~${formatBytes(file.hit.extent)} (no end marker)` : formatBytes(file.hit.length)}
                            {file.hit.offset === 0 && ' — the file itself'}
                        </span>
                    </span>
                    <a
                        href={file.url}
                        download={file.name}
                        className="flex-shrink-0 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        Save
                    </a>
                </li>
            ))}
        </ul>
    </div>
);

export const EmbeddedFileScanner = () => {
    const { loaded, source, error, open, clear } = useFileBytes();
    const [skipHost, setSkipHost] = useState(false);

    const hits = useMemo(
        () => (loaded ? scanEmbeddedFiles(loaded.bytes, { minOffset: skipHost ? 1 : 0 }) : []),
        [loaded, skipHost],
    );

    const files = useCarvedFiles(loaded?.bytes ?? null, hits);
    const report = loaded ? formatEmbedded(hits, loaded.bytes.length, loaded.file.name) : '';

    return (
        <MediaConverter
            backColor={COLOR}
            title="Scan for Embedded Files"
            description="Sweep a file for other files hidden inside it. Looks for known magic numbers at every byte offset, works out how far each one runs, and offers the carved bytes for download — the ZIP appended to a JPEG, the images inside a PDF, the payload stashed in a firmware blob. Signatures shorter than four bytes are skipped to keep false positives down."
            accept={ACCEPT}
            inputMedium="file"
            outputMedium="text"
            hint={HINT}
            onFiles={files => open(files[0])}
            onClear={clear}
            source={source}
            outputVisual={files.length > 0 ? <CarvedList files={files} /> : undefined}
            textResult={report}
            textResultTitle="Report"
            error={error}
            extraElements={
                <Options>
                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                        <input type="checkbox" className="accent-gray-900" checked={skipHost} onChange={e => setSkipHost(e.target.checked)} />
                        <span className="text-sm text-gray-700">Skip the file&apos;s own header at offset 0</span>
                    </label>
                    <Note>{NOTHING_UPLOADED}</Note>
                </Options>
            }
        />
    );
};

export { byteEntropy };
