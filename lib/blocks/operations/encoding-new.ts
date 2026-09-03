import {
  base32Encode, base32Decode,
  base58Encode, base58Decode,
  ascii85Encode, ascii85Decode,
  rot13, rot47,
  caesarEncode, caesarDecode,
  morseEncode, morseDecode,
  quotedPrintableEncode, quotedPrintableDecode,
  jwtDecode,
} from '@/Components/Functions/EncodingTools/logic';
import { Operation } from '../types';

const shiftOptions = Array.from({ length: 13 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

export const newEncodingOperations: Operation[] = [
  {
    id: 'base32-encode',
    name: 'Base32 Encode',
    category: 'encoding',
    params: [],
    fn: (input) => base32Encode(input),
  },
  {
    id: 'base32-decode',
    name: 'Base32 Decode',
    category: 'encoding',
    params: [],
    fn: (input) => base32Decode(input),
  },
  {
    id: 'base58-encode',
    name: 'Base58 Encode',
    category: 'encoding',
    params: [],
    fn: (input) => base58Encode(input),
  },
  {
    id: 'base58-decode',
    name: 'Base58 Decode',
    category: 'encoding',
    params: [],
    fn: (input) => base58Decode(input),
  },
  {
    id: 'ascii85-encode',
    name: 'Ascii85 Encode',
    category: 'encoding',
    params: [],
    fn: (input) => ascii85Encode(input),
  },
  {
    id: 'ascii85-decode',
    name: 'Ascii85 Decode',
    category: 'encoding',
    params: [],
    fn: (input) => ascii85Decode(input),
  },
  {
    id: 'rot13',
    name: 'ROT13',
    category: 'encoding',
    params: [],
    fn: (input) => rot13(input),
  },
  {
    id: 'rot47',
    name: 'ROT47',
    category: 'encoding',
    params: [],
    fn: (input) => rot47(input),
  },
  {
    id: 'caesar-encode',
    name: 'Caesar Encode',
    category: 'encoding',
    params: [
      {
        id: 'shift',
        label: 'Shift',
        kind: 'select',
        options: shiftOptions,
        default: '3',
      },
    ],
    fn: (input, params) => caesarEncode(input, parseInt(params.shift ?? '3')),
  },
  {
    id: 'caesar-decode',
    name: 'Caesar Decode',
    category: 'encoding',
    params: [
      {
        id: 'shift',
        label: 'Shift',
        kind: 'select',
        options: shiftOptions,
        default: '3',
      },
    ],
    fn: (input, params) => caesarDecode(input, parseInt(params.shift ?? '3')),
  },
  {
    id: 'morse-encode',
    name: 'Morse Encode',
    category: 'encoding',
    params: [],
    fn: (input) => morseEncode(input),
  },
  {
    id: 'morse-decode',
    name: 'Morse Decode',
    category: 'encoding',
    params: [],
    fn: (input) => morseDecode(input),
  },
  {
    id: 'qp-encode',
    name: 'Quoted-Printable Encode',
    category: 'encoding',
    params: [],
    fn: (input) => quotedPrintableEncode(input),
  },
  {
    id: 'qp-decode',
    name: 'Quoted-Printable Decode',
    category: 'encoding',
    params: [],
    fn: (input) => quotedPrintableDecode(input),
  },
  {
    id: 'jwt-decode',
    name: 'JWT Decode',
    category: 'encoding',
    params: [],
    fn: (input) => jwtDecode(input),
  },
];
