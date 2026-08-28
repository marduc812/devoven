// DNS-over-HTTPS Query Builder — pure TypeScript, no browser APIs

export type DohRecordType = 'A' | 'AAAA' | 'MX' | 'TXT' | 'CNAME' | 'NS' | 'SOA';

export const DOH_RECORD_TYPES: DohRecordType[] = ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS', 'SOA'];

export type DohProvider = {
  name: string;
  baseUrl: string;
  description: string;
};

export const DOH_PROVIDERS: DohProvider[] = [
  {
    name: 'Cloudflare',
    baseUrl: 'https://cloudflare-dns.com/dns-query',
    description: 'Privacy-focused, 1.1.1.1 operator. Supports GET and POST. Does not log query IP.',
  },
  {
    name: 'Google',
    baseUrl: 'https://dns.google/dns-query',
    description: 'Google Public DNS over HTTPS. High reliability, global anycast network.',
  },
  {
    name: 'NextDNS',
    baseUrl: 'https://dns.nextdns.io/dns-query',
    description: 'Configurable DNS with filtering, analytics and security features. Supports custom configurations.',
  },
];

export type DohQueryResult = {
  domain: string;
  type: DohRecordType;
  providers: DohProviderUrl[];
  curlExample: string;
  jsonResponseFormat: string;
  protocol: string;
};

export type DohProviderUrl = {
  provider: string;
  description: string;
  getUrl: string;
  wireformatUrl: string;
};

function getTypeNumber(type: DohRecordType): number {
  const map: Record<DohRecordType, number> = {
    A: 1, AAAA: 28, MX: 15, TXT: 16, CNAME: 5, NS: 2, SOA: 6,
  };
  return map[type];
}

export function buildDohQuery(domain: string, type: DohRecordType): DohQueryResult {
  const cleanDomain = domain.trim().toLowerCase().replace(/\.$/, '');
  if (!cleanDomain) {
    throw new Error('Domain name is required');
  }
  if (!/^[a-z0-9]([a-z0-9\-\.]*[a-z0-9])?$/.test(cleanDomain)) {
    throw new Error('Invalid domain name format');
  }

  const typeNum = getTypeNumber(type);

  const providers: DohProviderUrl[] = DOH_PROVIDERS.map(function(p) {
    const getUrl = p.baseUrl + '?name=' + cleanDomain + '&type=' + type;
    const wireformatUrl = p.baseUrl + '?dns='; // wire format requires base64url-encoded DNS wire format
    return {
      provider: p.name,
      description: p.description,
      getUrl: getUrl,
      wireformatUrl: wireformatUrl + '<base64url-encoded DNS wire format query>',
    };
  });

  const curlExample = [
    '# JSON API (GET)',
    'curl -H "Accept: application/dns-json" \\',
    '  "' + providers[0].getUrl + '"',
    '',
    '# Wire format (POST)',
    'curl -H "Content-Type: application/dns-message" \\',
    '  -H "Accept: application/dns-message" \\',
    '  --data-binary @query.bin \\',
    '  "' + DOH_PROVIDERS[0].baseUrl + '"',
  ].join('\n');

  const jsonResponseFormat = JSON.stringify({
    Status: 0,
    TC: false,
    RD: true,
    RA: true,
    AD: false,
    CD: false,
    Question: [{ name: cleanDomain + '.', type: typeNum }],
    Answer: [
      {
        name: cleanDomain + '.',
        type: typeNum,
        TTL: 300,
        data: type === 'A' ? '93.184.216.34' :
              type === 'AAAA' ? '2606:2800:220:1:248:1893:25c8:1946' :
              type === 'MX' ? '10 mail.' + cleanDomain + '.' :
              type === 'TXT' ? '"v=spf1 include:_spf.' + cleanDomain + ' ~all"' :
              type === 'CNAME' ? 'target.' + cleanDomain + '.' :
              type === 'NS' ? 'ns1.' + cleanDomain + '.' :
              'ns1.' + cleanDomain + '. admin.' + cleanDomain + '. 2024010101 3600 900 604800 300',
      },
    ],
  }, null, 2);

  const protocol = [
    'DNS-over-HTTPS (DoH) — RFC 8484',
    '',
    'How it works:',
    '1. Client sends HTTP/2 GET or POST request to DoH resolver',
    '2. GET: query params ?name=<domain>&type=<type> with Accept: application/dns-json',
    '3. POST: binary DNS wire format in body with Content-Type: application/dns-message',
    '4. Resolver returns JSON (application/dns-json) or binary DNS response',
    '',
    'Advantages over plain DNS:',
    '• Encrypted: DNS queries are hidden inside HTTPS traffic',
    '• Authenticated: TLS certificate validates resolver identity',
    '• Bypasses DNS-based censorship and ISP monitoring',
    '• Works through HTTPS proxies and firewalls',
    '• Supported natively in Firefox, Chrome, and most modern browsers',
    '',
    'Status codes in JSON response:',
    '0 = NOERROR (success)',
    '1 = FORMERR (format error)',
    '2 = SERVFAIL (server failure)',
    '3 = NXDOMAIN (non-existent domain)',
    '5 = REFUSED (query refused)',
  ].join('\n');

  return { domain: cleanDomain, type, providers, curlExample, jsonResponseFormat, protocol };
}

export function validateDomain(domain: string): string | null {
  const clean = domain.trim().toLowerCase().replace(/\.$/, '');
  if (!clean) return 'Domain name is required';
  if (clean.length > 253) return 'Domain name too long (max 253 characters)';
  const labels = clean.split('.');
  for (const label of labels) {
    if (label.length === 0) return 'Empty label in domain';
    if (label.length > 63) return 'Label too long (max 63 characters)';
    if (!/^[a-z0-9]([a-z0-9\-]*[a-z0-9])?$/.test(label)) {
      return 'Invalid label: "' + label + '" (only a-z, 0-9, hyphen allowed)';
    }
  }
  return null;
}
