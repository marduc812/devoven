import { calculateTextEntropy } from '@/Components/Functions/TextEntropyTools/logic';
import { formatReadabilityOutput } from '@/Components/Functions/ReadabilityGradeTools/logic';
import { countWordFrequency, formatWordFrequency } from '@/Components/Functions/WordFrequencyTools/logic';
import { countFrequency, formatFrequency } from '@/Components/Functions/CharFrequencyTools/logic';
import { validateEmail, formatEmailInfo } from '@/Components/Functions/EmailValidatorTools/logic';
import { validateCard } from '@/Components/Functions/CreditCardTools/logic';
import { validateUuid, formatUuidInfo } from '@/Components/Functions/DevTools4/logic';
import { extractUuidTimestamp, formatUuidTimestamp } from '@/Components/Functions/UuidTimestampTools/logic';
import { validateBitcoinAddress, formatBitcoinResult } from '@/Components/Functions/BitcoinAddrTools/logic';
import { decodeCID, formatCIDInfo } from '@/Components/Functions/IpfsCidTools/logic';
import { parseWhois, formatWhoisSummary } from '@/Components/Functions/WhoisParserTools/logic';
import { evaluatePassphrase, formatPassphraseResult } from '@/Components/Functions/PassphraseStrengthTools/logic';
import { Operation } from '../types';

// Byte-mode capacity of a version-40 QR code at the lowest error correction level.
const QR_MAX_BYTES = 2953;

export const analysisOperations: Operation[] = [
  {
    id: 'qr-code',
    name: 'QR Code',
    category: 'analysis',
    params: [
      {
        id: 'level',
        label: 'Error correction',
        kind: 'select',
        options: [
          { value: 'L', label: 'L — 7%' },
          { value: 'M', label: 'M — 15%' },
          { value: 'Q', label: 'Q — 25%' },
          { value: 'H', label: 'H — 30%' },
        ],
        default: 'M',
      },
    ],
    chainable: false,
    terminal: true,
    output: 'qr',
    fn: (input) => {
      const text = input.trim();
      if (!text) throw new Error('Nothing to encode');
      const bytes = new TextEncoder().encode(text).length;
      if (bytes > QR_MAX_BYTES) {
        throw new Error(`Too long for a QR code: ${bytes} bytes (max ${QR_MAX_BYTES})`);
      }
      return text;
    },
  },
  {
    id: 'barcode',
    name: 'Barcode (CODE128)',
    category: 'analysis',
    params: [],
    chainable: false,
    terminal: true,
    output: 'barcode',
    fn: (input) => {
      const text = input.trim();
      if (!text) throw new Error('Nothing to encode');
      // CODE128 covers the printable ASCII range only.
      if (/[^\x20-\x7e]/.test(text)) {
        throw new Error('CODE128 only encodes printable ASCII characters');
      }
      return text;
    },
  },
  {
    id: 'text-entropy',
    name: 'Text Entropy',
    category: 'analysis',
    params: [],
    chainable: false,
    terminal: true,
    fn: (input) => calculateTextEntropy(input),
  },
  {
    id: 'readability',
    name: 'Readability Grade',
    category: 'analysis',
    params: [],
    chainable: false,
    terminal: true,
    fn: (input) => formatReadabilityOutput(input),
  },
  {
    id: 'word-frequency',
    name: 'Word Frequency',
    category: 'analysis',
    params: [],
    chainable: false,
    terminal: true,
    fn: (input) => formatWordFrequency(countWordFrequency(input)),
  },
  {
    id: 'char-frequency',
    name: 'Character Frequency',
    category: 'analysis',
    params: [
      {
        id: 'spaces',
        label: 'Whitespace',
        kind: 'select',
        options: [
          { value: 'include', label: 'Include' },
          { value: 'exclude', label: 'Exclude' },
        ],
        default: 'include',
      },
    ],
    chainable: false,
    terminal: true,
    fn: (input, p) => formatFrequency(countFrequency(input, p.spaces !== 'exclude')),
  },
  {
    id: 'passphrase-strength',
    name: 'Passphrase Strength',
    category: 'analysis',
    params: [],
    chainable: false,
    terminal: true,
    fn: (input) => formatPassphraseResult(evaluatePassphrase(input)),
  },
  {
    id: 'email-validate',
    name: 'Email Validator',
    category: 'analysis',
    params: [],
    chainable: false,
    terminal: true,
    fn: (input) => formatEmailInfo(validateEmail(input.trim())),
  },
  {
    id: 'credit-card-validate',
    name: 'Credit Card Validator',
    category: 'analysis',
    params: [],
    chainable: false,
    terminal: true,
    fn: (input) => validateCard(input.trim()),
  },
  {
    id: 'uuid-info',
    name: 'UUID Info',
    category: 'analysis',
    params: [],
    chainable: false,
    terminal: true,
    fn: (input) => formatUuidInfo(validateUuid(input.trim())),
  },
  {
    id: 'uuid-timestamp',
    name: 'UUID → Timestamp',
    category: 'analysis',
    params: [],
    chainable: false,
    terminal: true,
    fn: (input) => formatUuidTimestamp(extractUuidTimestamp(input.trim())),
  },
  {
    id: 'bitcoin-address',
    name: 'Bitcoin Address Validator',
    category: 'analysis',
    params: [],
    chainable: false,
    terminal: true,
    fn: (input) => formatBitcoinResult(validateBitcoinAddress(input.trim())),
  },
  {
    id: 'ipfs-cid',
    name: 'IPFS CID Decoder',
    category: 'analysis',
    params: [],
    chainable: false,
    terminal: true,
    fn: (input) => formatCIDInfo(decodeCID(input.trim())),
  },
  {
    id: 'whois-parse',
    name: 'WHOIS Parser',
    category: 'analysis',
    params: [],
    chainable: false,
    terminal: true,
    fn: (input) => formatWhoisSummary(parseWhois(input)),
  },
];
