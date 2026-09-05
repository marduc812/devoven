import { atbash } from '@/Components/Functions/AtbashCipherTools/logic';
import { affineEncrypt, affineDecrypt } from '@/Components/Functions/AffineCipherTools/logic';
import { parseKey, xorEncrypt, xorDecrypt, XorKeyFormat } from '@/Components/Functions/XorCipherTools/logic';
import { vigenereEncrypt, vigenereDecrypt } from '@/Components/Functions/VigenereCipherTools/logic';
import { beaufortProcess } from '@/Components/Functions/BeaufortCipherTools/logic';
import { railFenceEncode, railFenceDecode } from '@/Components/Functions/RailFenceCipherTools/logic';
import { encodeToBacon, decodeFromBacon, BaconRepresentation } from '@/Components/Functions/BaconCipherTools/logic';
import { buildSquare, encodePolybius, decodePolybius } from '@/Components/Functions/PolybiusCipherTools/logic';
import { columnarEncrypt, columnarDecrypt } from '@/Components/Functions/ColumnarTranspositionTools/logic';
import { playfairEncrypt, playfairDecrypt } from '@/Components/Functions/PlayfairCipherTools/logic';
import { tapEncode, tapDecode } from '@/Components/Functions/TapCodeTools/logic';
import { toLeet, fromLeet } from '@/Components/Functions/LeetSpeakTools/logic';
import { toPigLatin, fromPigLatin } from '@/Components/Functions/PigLatinTools/logic';
import { textToBraille } from '@/Components/Functions/BrailleTools/logic';
import { Operation } from '../types';

// Ciphers take the text and the key as two named fields, so a block shows
// both boxes and either one can be fed by the previous block.
const keyedFields = [
  { id: 'text', label: 'Text', long: true },
  { id: 'key', label: 'Key' },
];
const keywordFields = [
  { id: 'text', label: 'Text', long: true },
  { id: 'keyword', label: 'Keyword' },
];

const affineAParam = {
  id: 'a',
  label: 'a (coprime with 26)',
  kind: 'select' as const,
  options: [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25].map((n) => ({ value: String(n), label: String(n) })),
  default: '5',
};

const affineBParam = {
  id: 'b',
  label: 'b (shift)',
  kind: 'select' as const,
  options: Array.from({ length: 26 }, (_, i) => ({ value: String(i), label: String(i) })),
  default: '8',
};

const railsParam = {
  id: 'rails',
  label: 'Rails',
  kind: 'select' as const,
  options: Array.from({ length: 8 }, (_, i) => ({ value: String(i + 2), label: String(i + 2) })),
  default: '3',
};

const baconReprParam = {
  id: 'repr',
  label: 'Alphabet',
  kind: 'select' as const,
  options: [
    { value: 'AB', label: 'A / B' },
    { value: '01', label: '0 / 1' },
  ],
  default: 'AB',
};

export const cipherOperations: Operation[] = [
  {
    id: 'atbash',
    name: 'Atbash Cipher',
    category: 'encoding',
    params: [],
    fn: (input) => atbash(input, false),
  },
  {
    id: 'affine-encrypt',
    name: 'Affine Encrypt',
    category: 'encoding',
    params: [affineAParam, affineBParam],
    fn: (input, p) => affineEncrypt(input, parseInt(p.a ?? '5'), parseInt(p.b ?? '8')),
  },
  {
    id: 'affine-decrypt',
    name: 'Affine Decrypt',
    category: 'encoding',
    params: [affineAParam, affineBParam],
    fn: (input, p) => affineDecrypt(input, parseInt(p.a ?? '5'), parseInt(p.b ?? '8')),
  },
  {
    id: 'xor-encrypt',
    name: 'XOR Encrypt → Hex',
    category: 'encoding',
    inputs: keyedFields,
    params: [
      {
        id: 'format',
        label: 'Key Format',
        kind: 'select',
        options: [
          { value: 'text', label: 'Text' },
          { value: 'hex', label: 'Hex' },
        ],
        default: 'text',
      },
    ],
    fn: (_input, p) => xorEncrypt(p.text ?? '', parseKey(p.key ?? '', (p.format ?? 'text') as XorKeyFormat)),
  },
  {
    id: 'xor-decrypt',
    name: 'XOR Decrypt (Hex in)',
    category: 'encoding',
    inputs: keyedFields,
    params: [
      {
        id: 'format',
        label: 'Key Format',
        kind: 'select',
        options: [
          { value: 'text', label: 'Text' },
          { value: 'hex', label: 'Hex' },
        ],
        default: 'text',
      },
    ],
    fn: (_input, p) => xorDecrypt(p.text ?? '', parseKey(p.key ?? '', (p.format ?? 'text') as XorKeyFormat)),
  },
  {
    id: 'vigenere-encrypt',
    name: 'Vigenère Encrypt',
    category: 'encoding',
    inputs: keyedFields,
    params: [],
    fn: (_input, p) => vigenereEncrypt(p.text ?? '', p.key ?? ''),
  },
  {
    id: 'vigenere-decrypt',
    name: 'Vigenère Decrypt',
    category: 'encoding',
    inputs: keyedFields,
    params: [],
    fn: (_input, p) => vigenereDecrypt(p.text ?? '', p.key ?? ''),
  },
  {
    id: 'beaufort',
    name: 'Beaufort Cipher',
    category: 'encoding',
    inputs: keyedFields,
    params: [],
    fn: (_input, p) => beaufortProcess(p.text ?? '', p.key ?? ''),
  },
  {
    id: 'rail-fence-encode',
    name: 'Rail Fence Encode',
    category: 'encoding',
    params: [railsParam],
    fn: (input, p) => railFenceEncode(input, parseInt(p.rails ?? '3')),
  },
  {
    id: 'rail-fence-decode',
    name: 'Rail Fence Decode',
    category: 'encoding',
    params: [railsParam],
    fn: (input, p) => railFenceDecode(input, parseInt(p.rails ?? '3')),
  },
  {
    id: 'bacon-encode',
    name: "Bacon's Cipher Encode",
    category: 'encoding',
    params: [baconReprParam],
    fn: (input, p) => encodeToBacon(input, (p.repr ?? 'AB') as BaconRepresentation),
  },
  {
    id: 'bacon-decode',
    name: "Bacon's Cipher Decode",
    category: 'encoding',
    params: [baconReprParam],
    fn: (input, p) => decodeFromBacon(input, (p.repr ?? 'AB') as BaconRepresentation),
  },
  {
    id: 'polybius-encode',
    name: 'Polybius Square Encode',
    category: 'encoding',
    inputs: keywordFields,
    params: [],
    fn: (_input, p) => encodePolybius(p.text ?? '', buildSquare(p.keyword ?? '')),
  },
  {
    id: 'polybius-decode',
    name: 'Polybius Square Decode',
    category: 'encoding',
    inputs: keywordFields,
    params: [],
    fn: (_input, p) => decodePolybius(p.text ?? '', buildSquare(p.keyword ?? '')),
  },
  {
    id: 'columnar-encrypt',
    name: 'Columnar Transposition Encrypt',
    category: 'encoding',
    inputs: keyedFields,
    params: [],
    fn: (_input, p) => columnarEncrypt(p.text ?? '', p.key ?? ''),
  },
  {
    id: 'columnar-decrypt',
    name: 'Columnar Transposition Decrypt',
    category: 'encoding',
    inputs: keyedFields,
    params: [],
    fn: (_input, p) => columnarDecrypt(p.text ?? '', p.key ?? ''),
  },
  {
    id: 'playfair-encrypt',
    name: 'Playfair Encrypt',
    category: 'encoding',
    inputs: keyedFields,
    params: [],
    fn: (_input, p) => playfairEncrypt(p.text ?? '', p.key ?? ''),
  },
  {
    id: 'playfair-decrypt',
    name: 'Playfair Decrypt',
    category: 'encoding',
    inputs: keyedFields,
    params: [],
    fn: (_input, p) => playfairDecrypt(p.text ?? '', p.key ?? ''),
  },
  {
    id: 'tap-code-encode',
    name: 'Tap Code Encode',
    category: 'encoding',
    params: [],
    fn: (input) => tapEncode(input),
  },
  {
    id: 'tap-code-decode',
    name: 'Tap Code Decode',
    category: 'encoding',
    params: [],
    fn: (input) => tapDecode(input),
  },
  {
    id: 'leet-encode',
    name: 'Leet Speak',
    category: 'text',
    params: [],
    fn: (input) => toLeet(input),
  },
  {
    id: 'leet-decode',
    name: 'Leet Speak Decode',
    category: 'text',
    params: [],
    fn: (input) => fromLeet(input),
  },
  {
    id: 'pig-latin-encode',
    name: 'Pig Latin',
    category: 'text',
    params: [],
    fn: (input) => toPigLatin(input),
  },
  {
    id: 'pig-latin-decode',
    name: 'Pig Latin Decode',
    category: 'text',
    params: [],
    fn: (input) => fromPigLatin(input),
  },
  {
    id: 'braille',
    name: 'Text → Braille',
    category: 'text',
    params: [],
    fn: (input) => textToBraille(input).map((c) => c.brailleChar).join(''),
  },
];
