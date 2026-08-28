import {
  base64urlEncode, base64urlDecode,
  punycodeEncode, punycodeDecode,
} from '@/Components/Functions/EncodingTools/logic';
import { base62EncodeText, base62DecodeText } from '@/Components/Functions/Base62Tools/logic';
import {
  encodeUnicodeEscapes, decodeUnicodeEscapes,
  toHexDump, HexDumpEncoding, HEX_DUMP_ENCODINGS,
} from '@/Components/Functions/ExtraConverters/logic';
import {
  escapeHtml, unescapeHtml,
  escapeRegex, escapeJson, unescapeJson,
  escapeSql, escapeShell, escapeCsv,
} from '@/Components/Functions/TextEscapeTools/logic';
import { normalizeText, NormalizationForm } from '@/Components/Functions/UnicodeNormalizerTools/logic';
import { textToDataUrl } from '@/Components/Functions/DataUrlTools/logic';
import { Operation } from '../types';

const escapeFlavors = {
  html: escapeHtml,
  regex: escapeRegex,
  json: escapeJson,
  sql: escapeSql,
  shell: escapeShell,
  csv: escapeCsv,
} as const;

const unescapeFlavors = {
  html: unescapeHtml,
  json: unescapeJson,
} as const;

export const encodingExtraOperations: Operation[] = [
  {
    id: 'base64url-encode',
    name: 'Base64URL Encode',
    category: 'encoding',
    params: [],
    chainable: true,
    fn: (input) => base64urlEncode(input),
  },
  {
    id: 'base64url-decode',
    name: 'Base64URL Decode',
    category: 'encoding',
    params: [],
    chainable: true,
    fn: (input) => base64urlDecode(input),
  },
  {
    id: 'base62-encode',
    name: 'Base62 Encode',
    category: 'encoding',
    params: [],
    chainable: true,
    fn: (input) => base62EncodeText(input),
  },
  {
    id: 'base62-decode',
    name: 'Base62 Decode',
    category: 'encoding',
    params: [],
    chainable: true,
    fn: (input) => base62DecodeText(input),
  },
  {
    id: 'punycode-encode',
    name: 'Punycode Encode',
    category: 'encoding',
    params: [],
    chainable: true,
    fn: (input) => punycodeEncode(input),
  },
  {
    id: 'punycode-decode',
    name: 'Punycode Decode',
    category: 'encoding',
    params: [],
    chainable: true,
    fn: (input) => punycodeDecode(input),
  },
  {
    id: 'unicode-escape',
    name: 'Unicode Escape',
    category: 'encoding',
    params: [],
    chainable: true,
    fn: (input) => encodeUnicodeEscapes(input),
  },
  {
    id: 'unicode-unescape',
    name: 'Unicode Unescape',
    category: 'encoding',
    params: [],
    chainable: true,
    fn: (input) => decodeUnicodeEscapes(input),
  },
  {
    id: 'escape',
    name: 'Escape',
    category: 'encoding',
    params: [
      {
        id: 'flavor',
        label: 'Flavor',
        kind: 'select',
        options: [
          { value: 'html', label: 'HTML' },
          { value: 'regex', label: 'Regex' },
          { value: 'json', label: 'JSON' },
          { value: 'sql', label: 'SQL' },
          { value: 'shell', label: 'Shell' },
          { value: 'csv', label: 'CSV' },
        ],
        default: 'html',
      },
    ],
    chainable: true,
    fn: (input, p) => {
      const flavor = (p.flavor ?? 'html') as keyof typeof escapeFlavors;
      const fn = escapeFlavors[flavor];
      if (!fn) throw new Error(`Unknown escape flavor: ${flavor}`);
      return fn(input);
    },
  },
  {
    id: 'unescape',
    name: 'Unescape',
    category: 'encoding',
    params: [
      {
        id: 'flavor',
        label: 'Flavor',
        kind: 'select',
        options: [
          { value: 'html', label: 'HTML' },
          { value: 'json', label: 'JSON' },
        ],
        default: 'html',
      },
    ],
    chainable: true,
    fn: (input, p) => {
      const flavor = (p.flavor ?? 'html') as keyof typeof unescapeFlavors;
      const fn = unescapeFlavors[flavor];
      if (!fn) throw new Error(`Unknown unescape flavor: ${flavor}`);
      return fn(input);
    },
  },
  {
    id: 'unicode-normalize',
    name: 'Unicode Normalize',
    category: 'encoding',
    params: [
      {
        id: 'form',
        label: 'Form',
        kind: 'select',
        options: (['NFC', 'NFD', 'NFKC', 'NFKD'] as const).map((f) => ({ value: f, label: f })),
        default: 'NFC',
      },
    ],
    chainable: true,
    fn: (input, p) => normalizeText(input, (p.form ?? 'NFC') as NormalizationForm),
  },
  {
    id: 'text-to-data-url',
    name: 'Text → Data URL',
    category: 'encoding',
    params: [
      {
        id: 'mime',
        label: 'MIME Type',
        kind: 'text',
        default: 'text/plain',
      },
    ],
    chainable: true,
    fn: (input, p) => textToDataUrl(input, p.mime || 'text/plain'),
  },
  {
    id: 'hex-dump',
    name: 'Hex Dump',
    category: 'analysis',
    params: [
      {
        id: 'encoding',
        label: 'Encoding',
        kind: 'select',
        options: HEX_DUMP_ENCODINGS.map((e) => ({ value: e.value, label: e.label })),
        default: 'utf-8',
      },
      {
        id: 'width',
        label: 'Bytes per line',
        kind: 'select',
        options: [8, 16, 24, 32].map((n) => ({ value: String(n), label: String(n) })),
        default: '16',
      },
    ],
    chainable: false,
    terminal: true,
    fn: (input, p) =>
      toHexDump(input, parseInt(p.width ?? '16'), (p.encoding ?? 'utf-8') as HexDumpEncoding),
  },
];
