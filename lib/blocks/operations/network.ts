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
import { defangText, fangText, DotStyle, DefangScope } from '@/Components/Functions/DefangTools/logic';
import { dissectText, Layer } from '@/Components/Functions/PacketTools/logic';
import { groupIpsText } from '@/Components/Functions/IpGroupTools/logic';
import { bypassPayloadsText, ALL_SECTIONS, SECTION_TITLES, Section } from '@/Components/Functions/SsrfBypassTools/logic';
import { Operation } from '../types';

export const networkOperations: Operation[] = [
  {
    id: 'ipv4-to-int',
    name: 'IPv4 → Integer',
    category: 'network',
    params: [],
    fn: (input) => ipv4ToInt(input.trim()).toString(),
  },
  {
    id: 'int-to-ipv4',
    name: 'Integer → IPv4',
    category: 'network',
    params: [],
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
    fn: (input) => ipv4ToBinary(input.trim()),
  },
  {
    id: 'binary-to-ipv4',
    name: 'Binary → IPv4',
    category: 'network',
    params: [],
    fn: (input) => binaryToIpv4(input.trim()),
  },
  {
    id: 'ipv6-expand',
    name: 'IPv6 Expand',
    category: 'network',
    params: [],
    fn: (input) => expandIpv6(input.trim()),
  },
  {
    id: 'ipv6-compress',
    name: 'IPv6 Compress',
    category: 'network',
    params: [],
    fn: (input) => compressIpv6(input.trim()),
  },
  {
    id: 'url-to-json',
    name: 'URL → JSON',
    category: 'network',
    params: [],
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
    terminal: true,
    fn: (input) => formatParsedCookies(parseCookieHeader(input)),
  },
  {
    id: 'ip-classify',
    name: 'IPv4 Classifier',
    category: 'network',
    params: [],
    terminal: true,
    fn: (input) => formatIpClassification(input.trim()),
  },
  {
    id: 'user-agent-parse',
    name: 'User-Agent Parser',
    category: 'network',
    params: [],
    terminal: true,
    fn: (input) => formatParsedUserAgent(parseUserAgent(input.trim())),
  },
  {
    id: 'defang',
    name: 'Defang Indicators',
    category: 'network',
    params: [
      {
        id: 'style',
        label: 'Dots',
        kind: 'select',
        options: [
          { value: 'brackets', label: '[.]' },
          { value: 'parens', label: '(.)' },
          { value: 'word', label: '[dot]' },
        ],
        default: 'brackets',
      },
      {
        id: 'scope',
        label: 'Scope',
        kind: 'select',
        options: [
          { value: 'indicators', label: 'Indicators only' },
          { value: 'everything', label: 'Everything' },
        ],
        default: 'indicators',
      },
    ],
    fn: (input, params) =>
      defangText(input, {
        dotStyle: (params.style as DotStyle) || 'brackets',
        scope: (params.scope as DefangScope) || 'indicators',
      }),
  },
  {
    id: 'fang',
    name: 'Fang Indicators',
    category: 'network',
    params: [],
    fn: (input) => fangText(input),
  },
  {
    id: 'packet-dissect',
    name: 'Parse Packet Header',
    category: 'network',
    params: [
      {
        id: 'layer',
        label: 'Starts at',
        kind: 'select',
        options: [
          { value: 'ethernet', label: 'Ethernet frame' },
          { value: 'ipv4', label: 'IPv4 header' },
          { value: 'tcp', label: 'TCP header' },
          { value: 'udp', label: 'UDP header' },
          { value: 'tls', label: 'TLS record' },
        ],
        default: 'ipv4',
      },
    ],
    terminal: true,
    fn: (input, p) => dissectText(input, (p.layer ?? 'ipv4') as Layer),
  },
  {
    id: 'group-ips',
    name: 'Group IP Addresses',
    category: 'network',
    params: [
      {
        id: 'floor',
        label: 'Widen to',
        kind: 'select',
        options: [
          { value: 'off', label: 'Exact cover' },
          { value: '28', label: '/28 or wider' },
          { value: '24', label: '/24 or wider' },
          { value: '16', label: '/16 or wider' },
        ],
        default: 'off',
      },
    ],
    fn: (input, p) => groupIpsText(input, p.floor === 'off' || !p.floor ? undefined : Number(p.floor)),
  },
  {
    id: 'ssrf-bypass',
    name: 'SSRF Bypass Payloads',
    category: 'network',
    inputs: [
      { id: 'target', label: 'Target', placeholder: 'http://127.0.0.1:8080/admin' },
      { id: 'allowed', label: 'Allowlisted host', placeholder: 'allowed.example.com' },
    ],
    params: [
      {
        id: 'section',
        label: 'Show',
        kind: 'select',
        options: [
          { value: 'all', label: 'Everything' },
          ...ALL_SECTIONS.map((key) => ({ value: key, label: SECTION_TITLES[key] })),
        ],
        default: 'all',
      },
    ],
    fn: (_input, p) =>
      bypassPayloadsText(
        p.target ?? '',
        p.allowed ?? '',
        !p.section || p.section === 'all' ? undefined : [p.section as Section],
      ),
  },
];
