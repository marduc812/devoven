import {
  ipv4ToInt, intToIpv4,
  ipv4ToBinary, binaryToIpv4,
  expandIpv6, compressIpv6,
  parseUrl,
  parseUserAgent, formatParsedUserAgent,
} from '@/Components/Functions/NetworkTools/logic';
import { formatIpClassification } from '@/Components/Functions/NetworkTools2/logic';
import { parseCookieHeader, formatParsedCookies } from '@/Components/Functions/NetworkTools3/logic';
import { extractFromText, formatExtractResults, ExtractType } from '@/Components/Functions/SecurityTools/logic';
import { Operation } from '../types';

export const networkOperations: Operation[] = [
  {
    id: 'ipv4-to-int',
    name: 'IPv4 → Integer',
    category: 'network',
    params: [],
    chainable: true,
    fn: (input) => ipv4ToInt(input.trim()).toString(),
  },
  {
    id: 'int-to-ipv4',
    name: 'Integer → IPv4',
    category: 'network',
    params: [],
    chainable: true,
    fn: (input) => {
      const n = Number(input.trim());
      if (!Number.isFinite(n)) throw new Error('Invalid integer');
      return intToIpv4(n);
    },
  },
  {
    id: 'ipv4-to-binary',
    name: 'IPv4 → Binary',
    category: 'network',
    params: [],
    chainable: true,
    fn: (input) => ipv4ToBinary(input.trim()),
  },
  {
    id: 'binary-to-ipv4',
    name: 'Binary → IPv4',
    category: 'network',
    params: [],
    chainable: true,
    fn: (input) => binaryToIpv4(input.trim()),
  },
  {
    id: 'ipv6-expand',
    name: 'IPv6 Expand',
    category: 'network',
    params: [],
    chainable: true,
    fn: (input) => expandIpv6(input.trim()),
  },
  {
    id: 'ipv6-compress',
    name: 'IPv6 Compress',
    category: 'network',
    params: [],
    chainable: true,
    fn: (input) => compressIpv6(input.trim()),
  },
  {
    id: 'url-to-json',
    name: 'URL → JSON',
    category: 'network',
    params: [],
    chainable: true,
    fn: (input) => JSON.stringify(parseUrl(input), null, 2),
  },
  {
    id: 'extract-from-text',
    name: 'Extract from Text',
    category: 'network',
    params: [
      {
        id: 'type',
        label: 'Extract',
        kind: 'select',
        options: [
          { value: 'emails', label: 'Emails' },
          { value: 'urls', label: 'URLs' },
          { value: 'ips', label: 'IP addresses' },
          { value: 'phones', label: 'Phone numbers' },
          { value: 'dates', label: 'Dates' },
          { value: 'creditcards', label: 'Credit cards' },
        ],
        default: 'urls',
      },
    ],
    chainable: true,
    fn: (input, p) => {
      const type = (p.type ?? 'urls') as ExtractType;
      return formatExtractResults(extractFromText(input, type), type);
    },
  },
  {
    id: 'cookie-parse',
    name: 'Cookie Header Parser',
    category: 'network',
    params: [],
    chainable: false,
    terminal: true,
    fn: (input) => formatParsedCookies(parseCookieHeader(input)),
  },
  {
    id: 'ip-classify',
    name: 'IPv4 Classifier',
    category: 'network',
    params: [],
    chainable: false,
    terminal: true,
    fn: (input) => formatIpClassification(input.trim()),
  },
  {
    id: 'user-agent-parse',
    name: 'User-Agent Parser',
    category: 'network',
    params: [],
    chainable: false,
    terminal: true,
    fn: (input) => formatParsedUserAgent(parseUserAgent(input.trim())),
  },
];
