// ─── Binary inspection: file type, strings, embedded files ────────────────────
// Three related questions about a blob of bytes:
//   what is it?          → detectFileType
//   what text is in it?  → extractStrings
//   what is hidden in it? → scanEmbeddedFiles
//
// All three read the shared table in signatures.ts and are pure functions over a
// Uint8Array, so they work the same whether the bytes came from a dropped file
// or from a Base64 string in a Blocks pipeline.

import {
    CATEGORY_LABEL,
    LengthRule,
    SIGNATURES,
    Signature,
} from './signatures';

// ─── Byte helpers ─────────────────────────────────────────────────────────────

/** A parsed `magic` string: a byte to match, or null for a `??` wildcard. */
type Pattern = (number | null)[];

const patternCache = new Map<string, Pattern>();

export function parseMagic(hex: string): Pattern {
    const cached = patternCache.get(hex);
    if (cached) return cached;

    const clean = hex.replace(/\s+/g, '').toLowerCase();
    if (clean.length % 2 !== 0) throw new Error(`Signature "${hex}" has an odd number of hex digits`);

    const pattern: Pattern = [];
    for (let i = 0; i < clean.length; i += 2) {
        const pair = clean.slice(i, i + 2);
        if (pair === '??') {
            pattern.push(null);
            continue;
        }
        const value = parseInt(pair, 16);
        if (Number.isNaN(value)) throw new Error(`Signature "${hex}" is not valid hex`);
        pattern.push(value);
    }
    patternCache.set(hex, pattern);
    return pattern;
}

function matchesAt(bytes: Uint8Array, at: number, pattern: Pattern): boolean {
    if (at < 0 || at + pattern.length > bytes.length) return false;
    for (let i = 0; i < pattern.length; i++) {
        const want = pattern[i];
        if (want !== null && bytes[at + i] !== want) return false;
    }
    return true;
}

/** How many bytes of the pattern are actual bytes rather than wildcards. */
function specificity(pattern: Pattern): number {
    return pattern.reduce<number>((total, byte) => total + (byte === null ? 0 : 1), 0);
}

function indexOfBytes(haystack: Uint8Array, needle: Pattern, from: number, until: number): number {
    const last = Math.min(until, haystack.length) - needle.length;
    for (let i = Math.max(0, from); i <= last; i++) {
        if (matchesAt(haystack, i, needle)) return i;
    }
    return -1;
}

function lastIndexOfBytes(haystack: Uint8Array, needle: Pattern, from: number, until: number): number {
    for (let i = Math.min(until, haystack.length) - needle.length; i >= from; i--) {
        if (matchesAt(haystack, i, needle)) return i;
    }
    return -1;
}

export function toHex(bytes: Uint8Array, separator = ' '): string {
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join(separator);
}

export function formatBytes(count: number): string {
    if (count < 1024) return `${count} B`;
    if (count < 1024 * 1024) return `${(count / 1024).toFixed(1)} KB`;
    if (count < 1024 * 1024 * 1024) return `${(count / (1024 * 1024)).toFixed(2)} MB`;
    return `${(count / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** An xxd-style dump, used for the "first bytes" preview in the reports. */
export function hexPreview(bytes: Uint8Array, limit = 64, start = 0): string {
    const end = Math.min(bytes.length, start + limit);
    const rows: string[] = [];
    for (let row = start; row < end; row += 16) {
        const slice = bytes.subarray(row, Math.min(row + 16, end));
        const hex = Array.from(slice, byte => byte.toString(16).padStart(2, '0'));
        while (hex.length < 16) hex.push('  ');
        const left = hex.slice(0, 8).join(' ');
        const right = hex.slice(8).join(' ');
        const ascii = Array.from(slice, byte => (byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : '.')).join('');
        rows.push(`${row.toString(16).padStart(8, '0')}  ${left}  ${right}  |${ascii}|`);
    }
    return rows.join('\n');
}

/** Shannon entropy in bits per byte. 8 is random, under 1 is very repetitive. */
export function byteEntropy(bytes: Uint8Array): number {
    if (bytes.length === 0) return 0;
    const counts = new Uint32Array(256);
    for (let i = 0; i < bytes.length; i++) counts[bytes[i]]++;
    let entropy = 0;
    for (let i = 0; i < 256; i++) {
        if (counts[i] === 0) continue;
        const p = counts[i] / bytes.length;
        entropy -= p * Math.log2(p);
    }
    return entropy;
}

// ─── Detect file type ─────────────────────────────────────────────────────────

export type SignatureMatch = {
    signature: Signature;
    /** Where the signature bytes sit, which is the signature's own offset. */
    offset: number;
    /** Non-wildcard bytes matched — the tie-breaker between overlapping hits. */
    strength: number;
};

/**
 * Every signature the bytes satisfy, strongest first. Formats overlap by design
 * (a .docx is a ZIP, a Mach-O fat binary and a Java class share four bytes), so
 * the caller gets the whole list rather than a single verdict.
 */
export function matchSignatures(bytes: Uint8Array): SignatureMatch[] {
    const hits: SignatureMatch[] = [];
    for (const signature of SIGNATURES) {
        const pattern = parseMagic(signature.magic);
        if (matchesAt(bytes, signature.offset, pattern)) {
            hits.push({ signature, offset: signature.offset, strength: specificity(pattern) });
        }
    }
    return hits.sort((a, b) => b.strength - a.strength || a.offset - b.offset);
}

export type TextShape =
    | 'json'
    | 'xml'
    | 'html'
    | 'yaml'
    | 'csv'
    | 'base64'
    | 'plain'
    | null;

const TEXT_SHAPE_LABEL: Record<Exclude<TextShape, null>, string> = {
    json: 'JSON',
    xml: 'XML',
    html: 'HTML',
    yaml: 'YAML',
    csv: 'Delimited text (CSV/TSV)',
    base64: 'Base64 text',
    plain: 'Plain text',
};

/** True when the bytes decode as UTF-8 and read as text rather than as data. */
export function looksTextual(bytes: Uint8Array): boolean {
    if (bytes.length === 0) return false;
    const sample = bytes.subarray(0, 4096);
    try {
        new TextDecoder('utf-8', { fatal: true }).decode(sample);
    } catch {
        return false;
    }
    let control = 0;
    for (let i = 0; i < sample.length; i++) {
        const byte = sample[i];
        // NUL and the C0 controls other than tab, newline and carriage return.
        if (byte === 0 || (byte < 0x20 && byte !== 0x09 && byte !== 0x0a && byte !== 0x0d)) control++;
    }
    return control / sample.length < 0.02;
}

/** A best guess at the flavour of a textual file, for when no magic matches. */
export function guessTextShape(bytes: Uint8Array): TextShape {
    if (!looksTextual(bytes)) return null;
    const text = new TextDecoder().decode(bytes.subarray(0, 4096)).trim();
    if (!text) return null;

    const lower = text.toLowerCase();
    if (lower.startsWith('<!doctype html') || lower.startsWith('<html')) return 'html';
    if (text.startsWith('<?xml') || text.startsWith('<')) return 'xml';
    if (text.startsWith('{') || text.startsWith('[')) return 'json';
    if (text.startsWith('---') || /^%yaml/i.test(text)) return 'yaml';
    // Base64 only when it reads as one unbroken token: any prose made of plain
    // words would otherwise satisfy the alphabet on its own.
    const compact = text.replace(/\s+/g, '');
    if (
        !/[^\S\r\n]/.test(text) &&
        compact.length >= 16 &&
        compact.length % 4 === 0 &&
        /^[A-Za-z0-9+/]+={0,2}$/.test(compact)
    ) {
        return 'base64';
    }

    const lines = text.split('\n').slice(0, 5).filter(Boolean);
    if (lines.length >= 2) {
        for (const delimiter of [',', '\t', ';']) {
            const counts = lines.map(line => line.split(delimiter).length);
            if (counts[0] > 1 && counts.every(count => count === counts[0])) return 'csv';
        }
    }
    return 'plain';
}

export type Detection = {
    size: number;
    matches: SignatureMatch[];
    textShape: TextShape;
    entropy: number;
};

export function detectFileType(bytes: Uint8Array): Detection {
    const matches = matchSignatures(bytes);
    return {
        size: bytes.length,
        matches,
        // Only worth guessing when nothing structural matched.
        textShape: matches.length === 0 ? guessTextShape(bytes) : null,
        entropy: byteEntropy(bytes.subarray(0, 1024 * 1024)),
    };
}

function entropyNote(entropy: number): string {
    if (entropy >= 7.9) return 'random — compressed, encrypted or already packed';
    if (entropy >= 7.0) return 'high — likely compressed or encoded';
    if (entropy >= 5.0) return 'mixed — structured binary or dense text';
    if (entropy >= 3.0) return 'low — plain text or sparse binary';
    return 'very low — highly repetitive';
}

/** The one-line answer: the strongest match, or a text guess, or nothing. */
export function describeFileType(detection: Detection): string {
    const best = detection.matches[0];
    if (best) return best.signature.name;
    if (detection.textShape) return `${TEXT_SHAPE_LABEL[detection.textShape]} (no magic number)`;
    return 'Unrecognised — no known signature';
}

const pad = (label: string) => `${label}:`.padEnd(12);

export function formatDetection(detection: Detection, bytes: Uint8Array, fileName?: string): string {
    if (detection.size === 0) return 'The file is empty.';

    const lines: string[] = [];
    if (fileName) lines.push(`${pad('File')}${fileName}`);
    lines.push(`${pad('Size')}${detection.size.toLocaleString()} bytes (${formatBytes(detection.size)})`);
    lines.push(`${pad('Entropy')}${detection.entropy.toFixed(2)} bits/byte — ${entropyNote(detection.entropy)}`);
    lines.push('');

    const best = detection.matches[0];
    if (best) {
        const pattern = parseMagic(best.signature.magic);
        const matched = bytes.subarray(best.offset, best.offset + pattern.length);
        lines.push(`${pad('Detected')}${best.signature.name}`);
        if (best.signature.ext) lines.push(`${pad('Extension')}.${best.signature.ext}`);
        lines.push(`${pad('MIME')}${best.signature.mime}`);
        lines.push(`${pad('Category')}${CATEGORY_LABEL[best.signature.category]}`);
        lines.push(`${pad('Signature')}${toHex(matched)} at offset ${best.offset}`);
        if (best.signature.note) lines.push(`${pad('Note')}${best.signature.note}`);
    } else if (detection.textShape) {
        lines.push(`${pad('Detected')}${TEXT_SHAPE_LABEL[detection.textShape]}`);
        lines.push(`${pad('Note')}Text formats carry no magic number, so this is read from the content.`);
    } else {
        lines.push(`${pad('Detected')}Unrecognised — no known signature at any checked offset`);
    }

    const others = detection.matches.slice(1);
    if (others.length > 0) {
        lines.push('');
        lines.push(`Other signatures that also match (${others.length})`);
        for (const hit of others) {
            lines.push(`  ${hit.signature.name} — ${hit.signature.mime}${hit.signature.note ? ` — ${hit.signature.note}` : ''}`);
        }
    }

    lines.push('');
    lines.push('First bytes');
    lines.push(hexPreview(bytes, 64));
    return lines.join('\n');
}

// ─── Strings ──────────────────────────────────────────────────────────────────

export type StringEncoding = 'ascii' | 'utf16le' | 'both';

export type StringHit = {
    offset: number;
    text: string;
    encoding: 'ascii' | 'utf16le';
};

export type StringsOptions = {
    minLength?: number;
    encoding?: StringEncoding;
    /** Stop after this many hits so a huge file cannot lock the tab up. */
    limit?: number;
};

const isPrintable = (byte: number) => (byte >= 0x20 && byte <= 0x7e) || byte === 0x09;

/**
 * Runs of printable characters, the way `strings(1)` does it. ASCII walks the
 * bytes directly; UTF-16LE looks for printable bytes on even positions with a
 * zero high byte, which is how Windows binaries store their text.
 */
export function extractStrings(bytes: Uint8Array, options: StringsOptions = {}): StringHit[] {
    const minLength = Math.max(1, Math.floor(options.minLength ?? 4));
    const encoding = options.encoding ?? 'ascii';
    const limit = options.limit ?? 20000;
    const hits: StringHit[] = [];

    const push = (offset: number, chars: number[], from: StringHit['encoding']) => {
        if (chars.length < minLength || hits.length >= limit) return;
        hits.push({ offset, text: String.fromCharCode(...chars), encoding: from });
    };

    if (encoding === 'ascii' || encoding === 'both') {
        let run: number[] = [];
        let start = 0;
        for (let i = 0; i < bytes.length; i++) {
            if (isPrintable(bytes[i])) {
                if (run.length === 0) start = i;
                run.push(bytes[i]);
            } else if (run.length > 0) {
                push(start, run, 'ascii');
                run = [];
            }
        }
        if (run.length > 0) push(start, run, 'ascii');
    }

    if (encoding === 'utf16le' || encoding === 'both') {
        let run: number[] = [];
        let start = 0;
        for (let i = 0; i + 1 < bytes.length; i += 2) {
            if (bytes[i + 1] === 0 && isPrintable(bytes[i])) {
                if (run.length === 0) start = i;
                run.push(bytes[i]);
            } else if (run.length > 0) {
                push(start, run, 'utf16le');
                run = [];
            }
        }
        if (run.length > 0) push(start, run, 'utf16le');
    }

    return hits.sort((a, b) => a.offset - b.offset);
}

export type StringsFormatOptions = {
    showOffsets?: boolean;
    unique?: boolean;
};

export function formatStrings(hits: StringHit[], options: StringsFormatOptions = {}): string {
    let rows = hits;
    if (options.unique) {
        const seen = new Set<string>();
        rows = hits.filter(hit => (seen.has(hit.text) ? false : (seen.add(hit.text), true)));
    }
    if (options.showOffsets) {
        return rows.map(hit => `${hit.offset.toString(16).padStart(8, '0')}  ${hit.text}`).join('\n');
    }
    return rows.map(hit => hit.text).join('\n');
}

// ─── Embedded files ───────────────────────────────────────────────────────────

export type EmbeddedHit = {
    offset: number;
    signature: Signature;
    /** The file's real length when the format tells us; null when it does not. */
    length: number | null;
    /** Bytes from the header to `length`, or to the next header when unknown. */
    extent: number;
};

/**
 * Only signatures with a first concrete byte and enough of them to be worth
 * trusting get carved. A two-byte marker like `MZ` matches roughly once every
 * 64 KB of random data, which would bury the real finds in noise.
 */
const MIN_CARVE_BYTES = 4;

type CarveEntry = { signature: Signature; pattern: Pattern; strength: number };

let carveIndex: Map<number, CarveEntry[]> | null = null;

function getCarveIndex(): Map<number, CarveEntry[]> {
    if (carveIndex) return carveIndex;
    const index = new Map<number, CarveEntry[]>();
    for (const signature of SIGNATURES) {
        if (!signature.carve) continue;
        const pattern = parseMagic(signature.magic);
        const first = pattern[0];
        const strength = specificity(pattern);
        if (first === null || strength < MIN_CARVE_BYTES) continue;
        const bucket = index.get(first);
        if (bucket) bucket.push({ signature, pattern, strength });
        else index.set(first, [{ signature, pattern, strength }]);
    }
    for (const bucket of index.values()) bucket.sort((a, b) => b.strength - a.strength);
    carveIndex = index;
    return index;
}

function zipLength(bytes: Uint8Array, start: number, until: number): number | null {
    const eocd = lastIndexOfBytes(bytes, parseMagic('504b0506'), start, until);
    if (eocd < 0 || eocd + 22 > bytes.length) return null;
    const commentLength = bytes[eocd + 20] | (bytes[eocd + 21] << 8);
    const end = eocd + 22 + commentLength;
    return end <= bytes.length ? end - start : null;
}

function ruledLength(bytes: Uint8Array, start: number, until: number, rule?: LengthRule): number | null {
    if (!rule) return null;
    if (rule.kind === 'zip') return zipLength(bytes, start, until);

    if (rule.kind === 'sizeLE32') {
        const at = start + rule.sizeAt;
        if (at + 4 > bytes.length) return null;
        const view = new DataView(bytes.buffer, bytes.byteOffset + at, 4);
        const length = view.getUint32(0, true) + rule.sizeBias;
        return length > 0 && start + length <= bytes.length ? length : null;
    }

    // A footer: take the *last* one before the next file, because thumbnails and
    // incremental updates embed a copy of the end marker partway through.
    const footer = parseMagic(rule.footer);
    const at = lastIndexOfBytes(bytes, footer, start + 1, until);
    if (at < 0) return null;
    return at + (rule.include ? footer.length : 0) - start;
}

export type ScanOptions = {
    /** Ignore hits before this offset. 1 hides the host file's own header. */
    minOffset?: number;
    limit?: number;
};

export function scanEmbeddedFiles(bytes: Uint8Array, options: ScanOptions = {}): EmbeddedHit[] {
    const minOffset = options.minOffset ?? 0;
    const limit = options.limit ?? 500;
    const index = getCarveIndex();

    // Pass one: where every carvable header sits.
    const found: { offset: number; signature: Signature }[] = [];
    for (let i = 0; i < bytes.length && found.length < limit; i++) {
        const bucket = index.get(bytes[i]);
        if (!bucket) continue;
        for (const entry of bucket) {
            if (!matchesAt(bytes, i, entry.pattern)) continue;
            // A signature declared at offset N means the file starts N bytes
            // earlier — `ftyp` boxes sit four bytes into an MP4.
            const start = i - entry.signature.offset;
            if (start < minOffset) break;
            found.push({ offset: start, signature: entry.signature });
            break; // strongest signature wins this position
        }
    }

    // Pass two: how far each one runs. The next header caps the search so a
    // footer scan cannot wander into the file that follows.
    return found.map((hit, position) => {
        const boundary = found[position + 1]?.offset ?? bytes.length;
        const until = Math.max(boundary, hit.offset + 1);
        const length = ruledLength(bytes, hit.offset, until, hit.signature.length);
        return {
            offset: hit.offset,
            signature: hit.signature,
            length,
            extent: length ?? until - hit.offset,
        };
    });
}

export function carvedFileName(hit: EmbeddedHit, position: number): string {
    const ext = hit.signature.ext ? `.${hit.signature.ext}` : '.bin';
    return `${String(position).padStart(3, '0')}_${hit.offset.toString(16).padStart(8, '0')}${ext}`;
}

export function sliceHit(bytes: Uint8Array, hit: EmbeddedHit): Uint8Array {
    return bytes.slice(hit.offset, Math.min(bytes.length, hit.offset + hit.extent));
}

export function formatEmbedded(hits: EmbeddedHit[], totalSize: number, fileName?: string): string {
    const lines: string[] = [];
    if (fileName) lines.push(`${pad('File')}${fileName}`);
    lines.push(`${pad('Size')}${totalSize.toLocaleString()} bytes (${formatBytes(totalSize)})`);
    lines.push(`${pad('Found')}${hits.length} signature${hits.length === 1 ? '' : 's'}`);

    if (hits.length === 0) {
        lines.push('');
        lines.push('No embedded file signatures found. The scanner only reports formats with a');
        lines.push('four-byte-or-longer magic number, so short markers such as MZ or BM are');
        lines.push('deliberately left out to keep false positives down.');
        return lines.join('\n');
    }

    lines.push('');
    lines.push('OFFSET      SIZE          TYPE');
    for (const hit of hits) {
        const offset = `0x${hit.offset.toString(16).padStart(8, '0')}`;
        const size = hit.length === null ? `~${formatBytes(hit.extent)}` : formatBytes(hit.length);
        const where = hit.offset === 0 ? ' (the file itself)' : '';
        lines.push(`${offset}  ${size.padEnd(12)}  ${hit.signature.name}${where}`);
    }

    if (hits.some(hit => hit.length === null)) {
        lines.push('');
        lines.push('A size prefixed with ~ is a guess: the format carries no end marker, so the');
        lines.push('run stops at the next signature or at the end of the file.');
    }
    return lines.join('\n');
}
