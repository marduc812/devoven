import { keccak_256 } from 'js-sha3';
import { hexToBytes, stringToHex, hexToString, numberToHex, hexToNumber } from 'web3-utils';
import { hexToRgb, rgbToHex, textToBinary, binaryToString, hexToBinary as hexToBinaryFn } from '@/Components/Functions/Utils';
import { generateColorScheme } from '@/Components/Functions/ColorSchemeTools/logic';
import { toEIP55Checksum } from '@/Components/Functions/EthChecksumTools/logic';
import { Operation } from '../types';

const ethPublicToAddress: Operation = {
  id: 'eth-public-to-address',
  name: 'ETH Public Key → Address',
  category: 'conversion',
  params: [],
  chainable: false,
  fn: (input) => {
    const userInput = input.replace('0x', '');
    let formattedInput = userInput.replace(/^04/, '');
    if (formattedInput.length % 2 !== 0) {
      formattedInput = '0' + formattedInput;
    }
    return '0x' + keccak_256(hexToBytes('0x' + formattedInput)).toUpperCase().slice(-40);
  },
};

const ethChecksum: Operation = {
  id: 'eth-checksum',
  name: 'ETH Address → EIP-55 Checksum',
  category: 'conversion',
  params: [],
  chainable: true,
  fn: (input) => {
    const result = toEIP55Checksum(input);
    if (!result.checksummed) throw new Error(result.error ?? 'Invalid Ethereum address');
    return result.checksummed;
  },
};

const hexToRgbOp: Operation = {
  id: 'hex-to-rgb',
  name: 'Hex → RGB',
  category: 'conversion',
  params: [],
  chainable: false,
  fn: (input) => {
    const rgb = hexToRgb(input);
    if (!rgb) throw new Error('Invalid hex color');
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  },
};

const rgbToHexOp: Operation = {
  id: 'rgb-to-hex',
  name: 'RGB → Hex',
  category: 'conversion',
  params: [],
  chainable: false,
  fn: (input) => {
    const match = input.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (!match) throw new Error('Invalid RGB input. Expected format: r, g, b');
    return rgbToHex(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
  },
};

const textReplace: Operation = {
  id: 'text-replace',
  name: 'Text Replace',
  category: 'conversion',
  params: [
    { id: 'find', label: 'Find', kind: 'text', default: '' },
    { id: 'replace', label: 'Replace', kind: 'text', default: '' },
    {
      id: 'mode',
      label: 'Mode',
      kind: 'select',
      options: [
        { value: 'plain', label: 'Plain' },
        { value: 'regex', label: 'Regex' },
      ],
      default: 'plain',
    },
  ],
  chainable: true,
  fn: (input, params) => {
    const find = params['find'] ?? '';
    const replace = params['replace'] ?? '';
    const mode = params['mode'] ?? 'plain';
    if (!find) return input;
    if (mode === 'regex') {
      return input.replace(new RegExp(find, 'g'), replace);
    }
    return input.split(find).join(replace);
  },
};

const stringToBinary: Operation = {
  id: 'string-to-binary',
  name: 'String to Binary',
  category: 'conversion',
  params: [],
  chainable: true,
  fn: (input) => textToBinary(input),
};

const binaryToStringOp: Operation = {
  id: 'binary-to-string',
  name: 'Binary to String',
  category: 'conversion',
  params: [],
  chainable: true,
  fn: (input) => binaryToString(input),
};

const binaryToHex: Operation = {
  id: 'binary-to-hex',
  name: 'Binary to Hex',
  category: 'conversion',
  params: [],
  chainable: true,
  fn: (input) => {
    if (!/\b[01]+\b/.test(input) || input === '') throw new Error('Invalid binary input');
    const groups = input.replace(/\s/g, '').match(/.{4}/g);
    if (!groups) throw new Error('Invalid binary input');
    return groups.reduce((acc, i) => acc + parseInt(i, 2).toString(16), '');
  },
};

const hexToBinary: Operation = {
  id: 'hex-to-binary',
  name: 'Hex to Binary',
  category: 'conversion',
  params: [],
  chainable: true,
  fn: (input) => hexToBinaryFn(input),
};

const textToHex: Operation = {
  id: 'text-to-hex',
  name: 'Text to Hex',
  category: 'conversion',
  params: [],
  chainable: true,
  fn: (input) => {
    let result = '';
    for (let i = 0; i < input.length; i++) {
      result += input.charCodeAt(i).toString(16);
    }
    return result;
  },
};

const hexToText: Operation = {
  id: 'hex-to-text',
  name: 'Hex to Text',
  category: 'conversion',
  params: [],
  chainable: true,
  fn: (input) => {
    const cleaned = input.replace(/0x/g, '').replace(/\s+/g, '');
    const hexValues = cleaned.match(/.{1,2}/g) || [];
    return hexValues.map((h) => String.fromCharCode(parseInt(h, 16))).join('');
  },
};

const stringToBytes32: Operation = {
  id: 'string-to-bytes32',
  name: 'String to Bytes32',
  category: 'conversion',
  params: [],
  chainable: true,
  fn: (input) => stringToHex(input),
};

const bytes32ToString: Operation = {
  id: 'bytes32-to-string',
  name: 'Bytes32 to String',
  category: 'conversion',
  params: [],
  chainable: true,
  fn: (input) => {
    const hexChunks = input.split(' ').map((chunk) => (chunk.startsWith('0x') ? chunk.slice(2) : chunk));
    const normalized = '0x' + hexChunks.join('');
    if (!/^0[xX][0-9a-fA-F]+$/.test(normalized)) throw new Error('Invalid hex input');
    return hexToString(normalized);
  },
};

const numberToBytes32: Operation = {
  id: 'number-to-bytes32',
  name: 'Number to Bytes32',
  category: 'conversion',
  params: [],
  chainable: true,
  fn: (input) => numberToHex(input),
};

const bytes32ToNumber: Operation = {
  id: 'bytes32-to-number',
  name: 'Bytes32 to Number',
  category: 'conversion',
  params: [],
  chainable: true,
  fn: (input) => {
    const hexChunks = input.split(' ').map((chunk) => (chunk.startsWith('0x') ? chunk.slice(2) : chunk));
    const normalized = '0x' + hexChunks.join('');
    if (!/^0[xX][0-9a-fA-F]+$/.test(normalized)) throw new Error('Invalid hex input');
    return hexToNumber(normalized).toString();
  },
};

const decToHex: Operation = {
  id: 'dec-to-hex',
  name: 'Dec to Hex',
  category: 'conversion',
  params: [],
  chainable: true,
  fn: (input) => {
    const num = parseInt(input, 10);
    if (isNaN(num)) throw new Error('Invalid decimal input');
    return num.toString(16);
  },
};

const hexToDec: Operation = {
  id: 'hex-to-dec',
  name: 'Hex to Dec',
  category: 'conversion',
  params: [],
  chainable: true,
  fn: (input) => {
    const cleaned = input.startsWith('0x') || input.startsWith('0X') ? input.slice(2) : input;
    const num = parseInt(cleaned, 16);
    if (isNaN(num)) throw new Error('Invalid hex input');
    return num.toString(10);
  },
};

const decToOctal: Operation = {
  id: 'dec-to-octal',
  name: 'Dec to Octal',
  category: 'conversion',
  params: [],
  chainable: true,
  fn: (input) => {
    const num = parseInt(input, 10);
    if (isNaN(num)) throw new Error('Invalid decimal input');
    return num.toString(8);
  },
};

const octalToDec: Operation = {
  id: 'octal-to-dec',
  name: 'Octal to Dec',
  category: 'conversion',
  params: [],
  chainable: true,
  fn: (input) => {
    if (!/^[0-7]+$/.test(input)) throw new Error('Invalid octal input');
    return parseInt(input, 8).toString(10);
  },
};

const timestampToHuman: Operation = {
  id: 'timestamp-to-human',
  name: 'Timestamp → Human',
  category: 'conversion',
  params: [
    {
      id: 'mode',
      label: 'Format',
      kind: 'select',
      options: [
        { value: 'auto', label: 'Auto-detect' },
        { value: 's', label: 'Seconds' },
        { value: 'ms', label: 'Milliseconds' },
      ],
      default: 'auto',
    },
  ],
  chainable: true,
  fn: (input, params) => {
    const raw = input.trim();
    if (!/^-?\d+(\.\d+)?$/.test(raw)) throw new Error('Invalid timestamp');
    const n = Number(raw);
    const mode = params['mode'] ?? 'auto';
    let ms: number;
    if (mode === 'ms') ms = n;
    else if (mode === 's') ms = n * 1000;
    else ms = raw.replace('.', '').length >= 13 ? n : n * 1000;
    const d = new Date(ms);
    if (isNaN(d.getTime())) throw new Error('Invalid timestamp');
    return d.toISOString();
  },
};

const humanToTimestamp: Operation = {
  id: 'human-to-timestamp',
  name: 'Human → Timestamp',
  category: 'conversion',
  params: [
    {
      id: 'unit',
      label: 'Output unit',
      kind: 'select',
      options: [
        { value: 'ms', label: 'Milliseconds' },
        { value: 's', label: 'Seconds' },
      ],
      default: 'ms',
    },
  ],
  chainable: true,
  fn: (input, params) => {
    const d = new Date(input.trim());
    if (isNaN(d.getTime())) throw new Error('Invalid date string');
    const ms = d.getTime();
    return (params['unit'] === 's' ? Math.floor(ms / 1000) : ms).toString();
  },
};

// The colour-scheme generator returns a human-readable report of every harmony
// for a base colour, so it ends a pipeline rather than feeding the next block.
const colorScheme: Operation = {
  id: 'color-scheme',
  name: 'Hex → Colour Scheme',
  category: 'conversion',
  params: [],
  chainable: false,
  terminal: true,
  fn: (input) => generateColorScheme(input.trim()),
};

export const conversionOperations: Operation[] = [
  ethPublicToAddress,
  ethChecksum,
  hexToRgbOp,
  rgbToHexOp,
  textReplace,
  stringToBinary,
  binaryToStringOp,
  binaryToHex,
  hexToBinary,
  textToHex,
  hexToText,
  stringToBytes32,
  bytes32ToString,
  numberToBytes32,
  bytes32ToNumber,
  decToHex,
  hexToDec,
  decToOctal,
  octalToDec,
  timestampToHuman,
  humanToTimestamp,
  colorScheme,
];
