// ─── Magic-number signature table ─────────────────────────────────────────────
// The shared reference behind the file-type detector and the embedded-file
// scanner. One entry per recognisable format.
//
// `magic` is a hex string; `??` matches any byte, which is how container formats
// with a length field in the middle (RIFF, ftyp) are expressed as one pattern.
// `offset` is where that pattern starts, so a signature is "these bytes, there".

export type SignatureCategory =
    | 'image'
    | 'audio'
    | 'video'
    | 'archive'
    | 'document'
    | 'executable'
    | 'font'
    | 'database'
    | 'network'
    | 'text'
    | 'other';

export const CATEGORY_LABEL: Record<SignatureCategory, string> = {
    image: 'Image',
    audio: 'Audio',
    video: 'Video',
    archive: 'Archive',
    document: 'Document',
    executable: 'Executable',
    font: 'Font',
    database: 'Database',
    network: 'Capture',
    text: 'Text',
    other: 'Other',
};

/**
 * How a carved file's length is worked out once its header is found.
 *  - `footer`   — scan forward for the trailing bytes in `footer`
 *  - `sizeLE32` — a 32-bit little-endian length at `sizeAt`, plus `sizeBias`
 *  - `zip`      — walk forward to the end-of-central-directory record
 *  - absent     — the format carries no length we can read, so the extent is
 *                 reported as unknown rather than guessed
 */
export type LengthRule =
    | { kind: 'footer'; footer: string; include: boolean }
    | { kind: 'sizeLE32'; sizeAt: number; sizeBias: number }
    | { kind: 'zip' };

export type Signature = {
    name: string;
    /** Primary extension, without the dot. Empty when the format has none. */
    ext: string;
    mime: string;
    category: SignatureCategory;
    offset: number;
    magic: string;
    /** Safe to search for at arbitrary offsets: long and specific enough. */
    carve?: boolean;
    length?: LengthRule;
    note?: string;
};

const png: LengthRule = { kind: 'footer', footer: '49454e44ae426082', include: true };
const jpeg: LengthRule = { kind: 'footer', footer: 'ffd9', include: true };
const pdf: LengthRule = { kind: 'footer', footer: '2525454f46', include: true };
const riff: LengthRule = { kind: 'sizeLE32', sizeAt: 4, sizeBias: 8 };

export const SIGNATURES: Signature[] = [
    // ── Images ──────────────────────────────────────────────────────────────
    { name: 'PNG image', ext: 'png', mime: 'image/png', category: 'image', offset: 0, magic: '89504e470d0a1a0a', carve: true, length: png },
    { name: 'JPEG image (JFIF)', ext: 'jpg', mime: 'image/jpeg', category: 'image', offset: 0, magic: 'ffd8ffe0', carve: true, length: jpeg },
    { name: 'JPEG image (Exif)', ext: 'jpg', mime: 'image/jpeg', category: 'image', offset: 0, magic: 'ffd8ffe1', carve: true, length: jpeg },
    { name: 'JPEG image (raw)', ext: 'jpg', mime: 'image/jpeg', category: 'image', offset: 0, magic: 'ffd8ffdb', carve: true, length: jpeg },
    { name: 'JPEG image (SPIFF)', ext: 'jpg', mime: 'image/jpeg', category: 'image', offset: 0, magic: 'ffd8ffe8', carve: true, length: jpeg },
    { name: 'JPEG image', ext: 'jpg', mime: 'image/jpeg', category: 'image', offset: 0, magic: 'ffd8ff' },
    { name: 'JPEG 2000 image', ext: 'jp2', mime: 'image/jp2', category: 'image', offset: 0, magic: '0000000c6a5020200d0a870a', carve: true },
    { name: 'GIF image (87a)', ext: 'gif', mime: 'image/gif', category: 'image', offset: 0, magic: '474946383761', carve: true },
    { name: 'GIF image (89a)', ext: 'gif', mime: 'image/gif', category: 'image', offset: 0, magic: '474946383961', carve: true },
    { name: 'WebP image', ext: 'webp', mime: 'image/webp', category: 'image', offset: 0, magic: '52494646????????57454250', carve: true, length: riff },
    { name: 'BMP image', ext: 'bmp', mime: 'image/bmp', category: 'image', offset: 0, magic: '424d', length: { kind: 'sizeLE32', sizeAt: 2, sizeBias: 0 } },
    { name: 'TIFF image (little-endian)', ext: 'tif', mime: 'image/tiff', category: 'image', offset: 0, magic: '49492a00', carve: true },
    { name: 'TIFF image (big-endian)', ext: 'tif', mime: 'image/tiff', category: 'image', offset: 0, magic: '4d4d002a', carve: true },
    { name: 'BigTIFF image', ext: 'tif', mime: 'image/tiff', category: 'image', offset: 0, magic: '49492b00', carve: true },
    { name: 'Windows icon', ext: 'ico', mime: 'image/x-icon', category: 'image', offset: 0, magic: '00000100' },
    { name: 'Windows cursor', ext: 'cur', mime: 'image/x-icon', category: 'image', offset: 0, magic: '00000200' },
    { name: 'Photoshop document', ext: 'psd', mime: 'image/vnd.adobe.photoshop', category: 'image', offset: 0, magic: '38425053', carve: true },
    { name: 'HEIF image', ext: 'heic', mime: 'image/heic', category: 'image', offset: 4, magic: '66747970686569', carve: true },
    { name: 'HEIF image sequence', ext: 'heic', mime: 'image/heic-sequence', category: 'image', offset: 4, magic: '667479706d696631', carve: true },
    { name: 'AVIF image', ext: 'avif', mime: 'image/avif', category: 'image', offset: 4, magic: '6674797061766966', carve: true },
    { name: 'QOI image', ext: 'qoi', mime: 'image/qoi', category: 'image', offset: 0, magic: '716f6966', carve: true },
    { name: 'DirectDraw surface', ext: 'dds', mime: 'image/vnd-ms.dds', category: 'image', offset: 0, magic: '44445320', carve: true },
    { name: 'OpenEXR image', ext: 'exr', mime: 'image/x-exr', category: 'image', offset: 0, magic: '762f3101', carve: true },
    { name: 'GIMP image', ext: 'xcf', mime: 'image/x-xcf', category: 'image', offset: 0, magic: '67696d7020786366', carve: true },
    { name: 'Radiance HDR image', ext: 'hdr', mime: 'image/vnd.radiance', category: 'image', offset: 0, magic: '233f52414449414e4345', carve: true },
    { name: 'Netpbm image', ext: 'pnm', mime: 'image/x-portable-anymap', category: 'image', offset: 0, magic: '50??0a' },
    { name: 'Canon raw image', ext: 'cr2', mime: 'image/x-canon-cr2', category: 'image', offset: 0, magic: '49492a00100000004352', carve: true },

    // ── Audio ───────────────────────────────────────────────────────────────
    { name: 'MP3 audio (ID3 tagged)', ext: 'mp3', mime: 'audio/mpeg', category: 'audio', offset: 0, magic: '494433' },
    { name: 'MP3 audio', ext: 'mp3', mime: 'audio/mpeg', category: 'audio', offset: 0, magic: 'fffb' },
    { name: 'MP3 audio', ext: 'mp3', mime: 'audio/mpeg', category: 'audio', offset: 0, magic: 'fff3' },
    { name: 'MP3 audio', ext: 'mp3', mime: 'audio/mpeg', category: 'audio', offset: 0, magic: 'fff2' },
    { name: 'WAV audio', ext: 'wav', mime: 'audio/wav', category: 'audio', offset: 0, magic: '52494646????????57415645', carve: true, length: riff },
    { name: 'FLAC audio', ext: 'flac', mime: 'audio/flac', category: 'audio', offset: 0, magic: '664c6143', carve: true },
    { name: 'Ogg container', ext: 'ogg', mime: 'application/ogg', category: 'audio', offset: 0, magic: '4f676753', carve: true },
    { name: 'MIDI sequence', ext: 'mid', mime: 'audio/midi', category: 'audio', offset: 0, magic: '4d546864', carve: true },
    { name: 'AIFF audio', ext: 'aiff', mime: 'audio/aiff', category: 'audio', offset: 0, magic: '464f524d????????41494646', carve: true },
    { name: 'MPEG-4 audio', ext: 'm4a', mime: 'audio/mp4', category: 'audio', offset: 4, magic: '667479704d3441', carve: true },
    { name: 'AMR audio', ext: 'amr', mime: 'audio/amr', category: 'audio', offset: 0, magic: '2321414d520a', carve: true },
    { name: 'Musepack audio', ext: 'mpc', mime: 'audio/x-musepack', category: 'audio', offset: 0, magic: '4d5000', },
    { name: 'Impulse Tracker module', ext: 'it', mime: 'audio/x-it', category: 'audio', offset: 0, magic: '494d504d', carve: true },

    // ── Video ───────────────────────────────────────────────────────────────
    { name: 'Matroska / WebM video', ext: 'mkv', mime: 'video/x-matroska', category: 'video', offset: 0, magic: '1a45dfa3', carve: true },
    { name: 'QuickTime movie', ext: 'mov', mime: 'video/quicktime', category: 'video', offset: 4, magic: '6674797071742020', carve: true },
    { name: 'MPEG-4 video', ext: 'mp4', mime: 'video/mp4', category: 'video', offset: 4, magic: '667479706d70', carve: true },
    { name: 'MPEG-4 video (isom)', ext: 'mp4', mime: 'video/mp4', category: 'video', offset: 4, magic: '6674797069736f6d', carve: true },
    { name: 'ISO base media file', ext: 'mp4', mime: 'video/mp4', category: 'video', offset: 4, magic: '66747970', carve: true },
    { name: 'AVI video', ext: 'avi', mime: 'video/x-msvideo', category: 'video', offset: 0, magic: '52494646????????41564920', carve: true, length: riff },
    { name: 'Flash video', ext: 'flv', mime: 'video/x-flv', category: 'video', offset: 0, magic: '464c5601' },
    { name: 'MPEG program stream', ext: 'mpg', mime: 'video/mpeg', category: 'video', offset: 0, magic: '000001ba' },
    { name: 'MPEG video stream', ext: 'mpg', mime: 'video/mpeg', category: 'video', offset: 0, magic: '000001b3' },
    { name: 'ASF / WMV / WMA', ext: 'asf', mime: 'video/x-ms-asf', category: 'video', offset: 0, magic: '3026b2758e66cf11a6d900aa0062ce6c', carve: true },
    { name: 'Shockwave Flash', ext: 'swf', mime: 'application/x-shockwave-flash', category: 'video', offset: 0, magic: '435753' },
    { name: 'Shockwave Flash (uncompressed)', ext: 'swf', mime: 'application/x-shockwave-flash', category: 'video', offset: 0, magic: '465753' },

    // ── Archives and compression ────────────────────────────────────────────
    { name: 'ZIP archive', ext: 'zip', mime: 'application/zip', category: 'archive', offset: 0, magic: '504b0304', carve: true, length: { kind: 'zip' }, note: 'Also the container for .docx, .xlsx, .pptx, .jar, .apk, .epub and .odt' },
    { name: 'ZIP archive (empty)', ext: 'zip', mime: 'application/zip', category: 'archive', offset: 0, magic: '504b0506' },
    { name: 'ZIP archive (spanned)', ext: 'zip', mime: 'application/zip', category: 'archive', offset: 0, magic: '504b0708' },
    { name: 'Gzip archive', ext: 'gz', mime: 'application/gzip', category: 'archive', offset: 0, magic: '1f8b08' },
    { name: 'Bzip2 archive', ext: 'bz2', mime: 'application/x-bzip2', category: 'archive', offset: 0, magic: '425a68', carve: false },
    { name: 'XZ archive', ext: 'xz', mime: 'application/x-xz', category: 'archive', offset: 0, magic: 'fd377a585a00', carve: true },
    { name: '7-Zip archive', ext: '7z', mime: 'application/x-7z-compressed', category: 'archive', offset: 0, magic: '377abcaf271c', carve: true },
    { name: 'RAR archive (v1.5–4)', ext: 'rar', mime: 'application/vnd.rar', category: 'archive', offset: 0, magic: '526172211a0700', carve: true },
    { name: 'RAR archive (v5+)', ext: 'rar', mime: 'application/vnd.rar', category: 'archive', offset: 0, magic: '526172211a070100', carve: true },
    { name: 'Tar archive', ext: 'tar', mime: 'application/x-tar', category: 'archive', offset: 257, magic: '7573746172' },
    { name: 'Zstandard archive', ext: 'zst', mime: 'application/zstd', category: 'archive', offset: 0, magic: '28b52ffd', carve: true },
    { name: 'LZ4 archive', ext: 'lz4', mime: 'application/x-lz4', category: 'archive', offset: 0, magic: '04224d18', carve: true },
    { name: 'LZIP archive', ext: 'lz', mime: 'application/x-lzip', category: 'archive', offset: 0, magic: '4c5a4950', carve: true },
    { name: 'Compress archive', ext: 'Z', mime: 'application/x-compress', category: 'archive', offset: 0, magic: '1f9d' },
    { name: 'Cabinet archive', ext: 'cab', mime: 'application/vnd.ms-cab-compressed', category: 'archive', offset: 0, magic: '4d534346', carve: true },
    { name: 'Unix ar archive / Debian package', ext: 'deb', mime: 'application/x-archive', category: 'archive', offset: 0, magic: '213c617263683e', carve: true },
    { name: 'RPM package', ext: 'rpm', mime: 'application/x-rpm', category: 'archive', offset: 0, magic: 'edabeedb', carve: true },
    { name: 'Zlib stream', ext: 'zz', mime: 'application/zlib', category: 'archive', offset: 0, magic: '789c' },
    { name: 'Zlib stream (no compression)', ext: 'zz', mime: 'application/zlib', category: 'archive', offset: 0, magic: '7801' },
    { name: 'Zlib stream (best compression)', ext: 'zz', mime: 'application/zlib', category: 'archive', offset: 0, magic: '78da' },
    { name: 'ISO 9660 disc image', ext: 'iso', mime: 'application/x-iso9660-image', category: 'archive', offset: 32769, magic: '4344303031' },
    { name: 'Apple disk image', ext: 'dmg', mime: 'application/x-apple-diskimage', category: 'archive', offset: 0, magic: '6b6f6c79', carve: true },

    // ── Documents ───────────────────────────────────────────────────────────
    { name: 'PDF document', ext: 'pdf', mime: 'application/pdf', category: 'document', offset: 0, magic: '255044462d', carve: true, length: pdf },
    { name: 'Microsoft Office (OLE2)', ext: 'doc', mime: 'application/x-ole-storage', category: 'document', offset: 0, magic: 'd0cf11e0a1b11ae1', carve: true, note: 'Legacy .doc, .xls, .ppt and .msi all share this container' },
    { name: 'Rich Text Format', ext: 'rtf', mime: 'application/rtf', category: 'document', offset: 0, magic: '7b5c72746631', carve: true },
    { name: 'PostScript', ext: 'ps', mime: 'application/postscript', category: 'document', offset: 0, magic: '25215053', carve: true },
    { name: 'Encapsulated PostScript', ext: 'eps', mime: 'application/postscript', category: 'document', offset: 0, magic: 'c5d0d3c6', carve: true },
    { name: 'DjVu document', ext: 'djvu', mime: 'image/vnd.djvu', category: 'document', offset: 0, magic: '41542654464f524d', carve: true },

    // ── Executables and code ────────────────────────────────────────────────
    { name: 'ELF executable', ext: '', mime: 'application/x-elf', category: 'executable', offset: 0, magic: '7f454c46', carve: true },
    { name: 'DOS / Windows executable', ext: 'exe', mime: 'application/vnd.microsoft.portable-executable', category: 'executable', offset: 0, magic: '4d5a', note: 'Covers .exe, .dll, .sys and .ocx' },
    { name: 'Mach-O executable (64-bit)', ext: '', mime: 'application/x-mach-binary', category: 'executable', offset: 0, magic: 'cffaedfe', carve: true },
    { name: 'Mach-O executable (32-bit)', ext: '', mime: 'application/x-mach-binary', category: 'executable', offset: 0, magic: 'cefaedfe', carve: true },
    { name: 'Mach-O executable (64-bit, big-endian)', ext: '', mime: 'application/x-mach-binary', category: 'executable', offset: 0, magic: 'feedfacf', carve: true },
    { name: 'Mach-O executable (32-bit, big-endian)', ext: '', mime: 'application/x-mach-binary', category: 'executable', offset: 0, magic: 'feedface', carve: true },
    { name: 'Mach-O universal binary', ext: '', mime: 'application/x-mach-binary', category: 'executable', offset: 0, magic: 'cafebabe', carve: true, note: 'Byte-identical to a Java class file; the following bytes tell them apart' },
    { name: 'Java class file', ext: 'class', mime: 'application/java-vm', category: 'executable', offset: 0, magic: 'cafebabe', carve: false },
    { name: 'WebAssembly module', ext: 'wasm', mime: 'application/wasm', category: 'executable', offset: 0, magic: '0061736d', carve: true },
    { name: 'Android DEX', ext: 'dex', mime: 'application/x-dex', category: 'executable', offset: 0, magic: '6465780a', carve: true },
    { name: 'Chrome extension', ext: 'crx', mime: 'application/x-chrome-extension', category: 'executable', offset: 0, magic: '43723234', carve: true },
    { name: 'Windows shortcut', ext: 'lnk', mime: 'application/x-ms-shortcut', category: 'executable', offset: 0, magic: '4c00000001140200', carve: true },
    { name: 'Python bytecode', ext: 'pyc', mime: 'application/x-python-code', category: 'executable', offset: 0, magic: '????0d0a' },
    { name: 'Script with shebang', ext: 'sh', mime: 'text/x-shellscript', category: 'executable', offset: 0, magic: '2321' },

    // ── Fonts ───────────────────────────────────────────────────────────────
    // Not carved: `00 01 00 00 00` turns up constantly inside zero-padded binary
    // data — an IHDR chunk holds it — so it is only trusted at offset 0.
    { name: 'TrueType font', ext: 'ttf', mime: 'font/ttf', category: 'font', offset: 0, magic: '0001000000' },
    { name: 'OpenType font', ext: 'otf', mime: 'font/otf', category: 'font', offset: 0, magic: '4f54544f', carve: true },
    { name: 'WOFF font', ext: 'woff', mime: 'font/woff', category: 'font', offset: 0, magic: '774f4646', carve: true },
    { name: 'WOFF2 font', ext: 'woff2', mime: 'font/woff2', category: 'font', offset: 0, magic: '774f4632', carve: true },
    { name: 'TrueType collection', ext: 'ttc', mime: 'font/collection', category: 'font', offset: 0, magic: '74746366', carve: true },
    { name: 'Embedded OpenType', ext: 'eot', mime: 'application/vnd.ms-fontobject', category: 'font', offset: 34, magic: '4c50' },

    // ── Databases and stores ────────────────────────────────────────────────
    { name: 'SQLite database', ext: 'sqlite', mime: 'application/vnd.sqlite3', category: 'database', offset: 0, magic: '53514c69746520666f726d6174203300', carve: true },
    { name: 'Windows registry hive', ext: '', mime: 'application/octet-stream', category: 'database', offset: 0, magic: '72656766', carve: true },
    { name: 'Git pack file', ext: 'pack', mime: 'application/octet-stream', category: 'database', offset: 0, magic: '5041434b', carve: true },
    { name: 'LevelDB table', ext: 'ldb', mime: 'application/octet-stream', category: 'database', offset: 0, magic: '57fb808b24757247' },

    // ── Captures and keys ───────────────────────────────────────────────────
    { name: 'PCAP capture (little-endian)', ext: 'pcap', mime: 'application/vnd.tcpdump.pcap', category: 'network', offset: 0, magic: 'd4c3b2a1', carve: true },
    { name: 'PCAP capture (big-endian)', ext: 'pcap', mime: 'application/vnd.tcpdump.pcap', category: 'network', offset: 0, magic: 'a1b2c3d4', carve: true },
    { name: 'PCAPNG capture', ext: 'pcapng', mime: 'application/x-pcapng', category: 'network', offset: 0, magic: '0a0d0d0a', carve: true },
    { name: 'PEM certificate or key', ext: 'pem', mime: 'application/x-pem-file', category: 'network', offset: 0, magic: '2d2d2d2d2d424547494e20', carve: true },
    { name: 'DER certificate', ext: 'der', mime: 'application/x-x509-ca-cert', category: 'network', offset: 0, magic: '308202' },
    { name: 'OpenSSH private key', ext: '', mime: 'application/x-pem-file', category: 'network', offset: 0, magic: '2d2d2d2d2d424547494e204f50454e535348', carve: true },

    // ── Text and encodings ──────────────────────────────────────────────────
    { name: 'UTF-8 text (BOM)', ext: 'txt', mime: 'text/plain; charset=utf-8', category: 'text', offset: 0, magic: 'efbbbf' },
    { name: 'UTF-16 text (little-endian BOM)', ext: 'txt', mime: 'text/plain; charset=utf-16le', category: 'text', offset: 0, magic: 'fffe' },
    { name: 'UTF-16 text (big-endian BOM)', ext: 'txt', mime: 'text/plain; charset=utf-16be', category: 'text', offset: 0, magic: 'feff' },
    { name: 'UTF-32 text (little-endian BOM)', ext: 'txt', mime: 'text/plain; charset=utf-32le', category: 'text', offset: 0, magic: 'fffe0000' },
];
