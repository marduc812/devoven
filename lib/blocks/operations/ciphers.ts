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

const keyParam = { id: 'key', label: 'Key', kind: 'text' as const, default: '' };

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
    chainable: true,
    fn: (input) => atbash(input, false),
  },
  {
    id: 'affine-encrypt',
    name: 'Affine Encrypt',
    category: 'encoding',
    params: [affineAParam, affineBParam],
    chainable: true,
    fn: (input, p) => affineEncrypt(input, parseInt(p.a ?? '5'), parseInt(p.b ?? '8')),
  },
  {
    id: 'affine-decrypt',
    name: 'Affine Decrypt',
    category: 'encoding',
    params: [affineAParam, affineBParam],
    chainable: true,
    fn: (input, p) => affineDecrypt(input, parseInt(p.a ?? '5'), parseInt(p.b ?? '8')),
  },
  {
    id: 'xor-encrypt',
    name: 'XOR Encrypt → Hex',
    category: 'encoding',
    params: [
      keyParam,
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
    chainable: true,
    fn: (input, p) => xorEncrypt(input, parseKey(p.key ?? '', (p.format ?? 'text') as XorKeyFormat)),
  },
  {
    id: 'xor-decrypt',
    name: 'XOR Decrypt (Hex in)',
    category: 'encoding',
    params: [
      keyParam,
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
    chainable: true,
    fn: (input, p) => xorDecrypt(input, parseKey(p.key ?? '', (p.format ?? 'text') as XorKeyFormat)),
  },
  {
    id: 'vigenere-encrypt',
    name: 'Vigenère Encrypt',
    category: 'encoding',
    params: [keyParam],
    chainable: true,
    fn: (input, p) => vigenereEncrypt(input, p.key ?? ''),
  },
  {
    id: 'vigenere-decrypt',
    name: 'Vigenère Decrypt',
    category: 'encoding',
    params: [keyParam],
    chainable: true,
    fn: (input, p) => vigenereDecrypt(input, p.key ?? ''),
  },
  {
    id: 'beaufort',
    name: 'Beaufort Cipher',
    category: 'encoding',
    params: [keyParam],
    chainable: true,
    fn: (input, p) => beaufortProcess(input, p.key ?? ''),
  },
  {
    id: 'rail-fence-encode',
    name: 'Rail Fence Encode',
    category: 'encoding',
    params: [railsParam],
    chainable: true,
    fn: (input, p) => railFenceEncode(input, parseInt(p.rails ?? '3')),
  },
  {
    id: 'rail-fence-decode',
    name: 'Rail Fence Decode',
    category: 'encoding',
    params: [railsParam],
    chainable: true,
    fn: (input, p) => railFenceDecode(input, parseInt(p.rails ?? '3')),
  },
  {
    id: 'bacon-encode',
    name: "Bacon's Cipher Encode",
    category: 'encoding',
    params: [baconReprParam],
    chainable: true,
    fn: (input, p) => encodeToBacon(input, (p.repr ?? 'AB') as BaconRepresentation),
  },
  {
    id: 'bacon-decode',
    name: "Bacon's Cipher Decode",
    category: 'encoding',
    params: [baconReprParam],
    chainable: true,
    fn: (input, p) => decodeFromBacon(input, (p.repr ?? 'AB') as BaconRepresentation),
  },
  {
    id: 'polybius-encode',
    name: 'Polybius Square Encode',
    category: 'encoding',
    params: [{ id: 'keyword', label: 'Keyword', kind: 'text', default: '' }],
    chainable: true,
    fn: (input, p) => encodePolybius(input, buildSquare(p.keyword ?? '')),
  },
  {
    id: 'polybius-decode',
    name: 'Polybius Square Decode',
    category: 'encoding',
    params: [{ id: 'keyword', label: 'Keyword', kind: 'text', default: '' }],
    chainable: true,
    fn: (input, p) => decodePolybius(input, buildSquare(p.keyword ?? '')),
  },
  {
    id: 'columnar-encrypt',
    name: 'Columnar Transposition Encrypt',
    category: 'encoding',
    params: [keyParam],
    chainable: true,
    fn: (input, p) => columnarEncrypt(input, p.key ?? ''),
  },
  {
    id: 'columnar-decrypt',
    name: 'Columnar Transposition Decrypt',
    category: 'encoding',
    params: [keyParam],
    chainable: true,
    fn: (input, p) => columnarDecrypt(input, p.key ?? ''),
  },
  {
    id: 'playfair-encrypt',
    name: 'Playfair Encrypt',
    category: 'encoding',
    params: [keyParam],
    chainable: true,
    fn: (input, p) => playfairEncrypt(input, p.key ?? ''),
  },
  {
    id: 'playfair-decrypt',
    name: 'Playfair Decrypt',
    category: 'encoding',
    params: [keyParam],
    chainable: true,
    fn: (input, p) => playfairDecrypt(input, p.key ?? ''),
  },
  {
    id: 'tap-code-encode',
    name: 'Tap Code Encode',
    category: 'encoding',
    params: [],
    chainable: true,
    fn: (input) => tapEncode(input),
  },
  {
    id: 'tap-code-decode',
    name: 'Tap Code Decode',
    category: 'encoding',
    params: [],
    chainable: true,
    fn: (input) => tapDecode(input),
  },
  {
    id: 'leet-encode',
    name: 'Leet Speak',
    category: 'text',
    params: [],
    chainable: true,
    fn: (input) => toLeet(input),
  },
  {
    id: 'leet-decode',
    name: 'Leet Speak Decode',
    category: 'text',
    params: [],
    chainable: true,
    fn: (input) => fromLeet(input),
  },
  {
    id: 'pig-latin-encode',
    name: 'Pig Latin',
    category: 'text',
    params: [],
    chainable: true,
    fn: (input) => toPigLatin(input),
  },
  {
    id: 'pig-latin-decode',
    name: 'Pig Latin Decode',
    category: 'text',
    params: [],
    chainable: true,
    fn: (input) => fromPigLatin(input),
  },
  {
    id: 'braille',
    name: 'Text → Braille',
    category: 'text',
    params: [],
    chainable: true,
    fn: (input) => textToBraille(input).map((c) => c.brailleChar).join(''),
  },
];
