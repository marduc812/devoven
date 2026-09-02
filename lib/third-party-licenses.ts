/**
 * The open source libraries that ship in the browser bundle, for the page at
 * /open-source.
 *
 * Kept as data rather than generated at build time so the page never depends on
 * node_modules being readable wherever the site is built. When you add or drop a
 * runtime dependency, add or drop it here too - `npm run test` checks that this
 * list and `package.json` still agree.
 */

export type ThirdPartyLibrary = {
    name: string;
    license: string;
    url: string;
    /** One line on what it does here. */
    used: string;
};

export const REPOSITORY_URL = 'https://github.com/marduc812/devoven';

export const THIRD_PARTY_LIBRARIES: ThirdPartyLibrary[] = [
    { name: '@eslint-community/regexpp', license: 'MIT', url: 'https://github.com/eslint-community/regexpp', used: 'Regex parsing behind the ReDoS analyser' },
    { name: '@noble/hashes', license: 'MIT', url: 'https://github.com/paulmillr/noble-hashes', used: 'BLAKE2, BLAKE3, and the PBKDF2, HKDF, scrypt and Argon2 key derivation functions' },
    { name: '@vercel/analytics', license: 'MIT', url: 'https://github.com/vercel/analytics', used: 'Page view counts' },
    { name: 'bcryptjs', license: 'BSD-3-Clause', url: 'https://github.com/dcodeIO/bcrypt.js', used: 'Bcrypt hashing and verification' },
    { name: 'cron-parser', license: 'MIT', url: 'https://github.com/harrisiirak/cron-parser', used: 'Next run times for cron expressions' },
    { name: 'cronstrue', license: 'MIT', url: 'https://github.com/bradymholt/cronstrue', used: 'Cron expressions in plain English' },
    { name: 'crypto-js', license: 'MIT', url: 'https://github.com/brix/crypto-js', used: 'Classic ciphers and hashes' },
    { name: 'fast-xml-parser', license: 'MIT', url: 'https://github.com/NaturalIntelligence/fast-xml-parser', used: 'XML parsing, including the Nmap viewer' },
    { name: 'fflate', license: 'MIT', url: 'https://github.com/101arrowz/fflate', used: 'Gzip, zlib and DEFLATE compression' },
    { name: 'gmp-wasm', license: 'LGPL-3.0-only', url: 'https://github.com/Daninet/gmp-wasm', used: 'Arbitrary precision integer maths' },
    { name: 'heic2any', license: 'MIT', url: 'https://github.com/alexcorvi/heic2any', used: 'HEIC image decoding' },
    { name: 'js-sha3', license: 'MIT', url: 'https://github.com/emn178/js-sha3', used: 'SHA-3 and Keccak hashing' },
    { name: 'js-yaml', license: 'MIT', url: 'https://github.com/nodeca/js-yaml', used: 'YAML reading and writing' },
    { name: 'jsbarcode', license: 'MIT', url: 'https://github.com/lindell/JsBarcode', used: 'Barcode rendering' },
    { name: 'marked', license: 'MIT', url: 'https://github.com/markedjs/marked', used: 'Markdown to HTML' },
    { name: 'next', license: 'MIT', url: 'https://github.com/vercel/next.js', used: 'The framework the site is built on' },
    { name: 'next-themes', license: 'MIT', url: 'https://github.com/pacocoursey/next-themes', used: 'Dark mode' },
    { name: 'pdf-lib', license: 'MIT', url: 'https://github.com/Hopding/pdf-lib', used: 'Creating and editing PDFs' },
    { name: 'pdfjs-dist', license: 'Apache-2.0', url: 'https://github.com/mozilla/pdf.js', used: 'Rendering PDF previews' },
    { name: 'prettier', license: 'MIT', url: 'https://github.com/prettier/prettier', used: 'Code formatting' },
    { name: 'qrcode', license: 'MIT', url: 'https://github.com/soldair/node-qrcode', used: 'QR code generation' },
    { name: 'qrcode.react', license: 'ISC', url: 'https://github.com/zpao/qrcode.react', used: 'QR codes as React components' },
    { name: 'react', license: 'MIT', url: 'https://github.com/facebook/react', used: 'The UI library' },
    { name: 'react-dom', license: 'MIT', url: 'https://github.com/facebook/react', used: 'React rendering for the browser' },
    { name: 'react-hot-toast', license: 'MIT', url: 'https://github.com/timolins/react-hot-toast', used: 'Toast notifications' },
    { name: 'react-icons', license: 'MIT', url: 'https://github.com/react-icons/react-icons', used: 'Icons throughout the interface' },
    { name: 'smol-toml', license: 'BSD-3-Clause', url: 'https://github.com/squirrelchat/smol-toml', used: 'TOML reading and writing' },
    { name: 'sql-formatter', license: 'MIT', url: 'https://github.com/sql-formatter-org/sql-formatter', used: 'SQL formatting' },
    { name: 'turndown', license: 'MIT', url: 'https://github.com/mixmark-io/turndown', used: 'HTML to Markdown' },
    { name: 'ulid', license: 'MIT', url: 'https://github.com/ulid/javascript', used: 'ULID generation' },
    { name: 'uuid', license: 'MIT', url: 'https://github.com/uuidjs/uuid', used: 'UUID generation' },
    { name: 'web3-utils', license: 'LGPL-3.0', url: 'https://github.com/ChainSafe/web3.js', used: 'Ethereum hex and unit conversion' },
];
