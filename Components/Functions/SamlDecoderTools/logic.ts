// Pure logic — no browser APIs, no TextEncoder, no atob.
// SAML request/response decoder and reference.

export type SamlField = {
  name: string;
  value: string;
  description: string;
};

export type SamlDecodeResult = {
  raw: string;
  isXml: boolean;
  fields: SamlField[];
  xmlPreview: string;
  warnings: string[];
};

// Base64 decode (RFC 4648) — pure JS, no atob
function base64Decode(input: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup: Record<string, number> = {};
  for (let i = 0; i < chars.length; i++) lookup[chars[i]] = i;

  const cleaned = input.replace(/[^A-Za-z0-9+/=]/g, '');
  let bytes = '';
  let i = 0;

  while (i < cleaned.length) {
    const a = lookup[cleaned[i++]] ?? 0;
    const b = lookup[cleaned[i++]] ?? 0;
    const c = cleaned[i] === '=' ? 0 : (lookup[cleaned[i++]] ?? 0);
    const d = cleaned[i] === '=' ? 0 : (lookup[cleaned[i++]] ?? 0);
    if (cleaned[i - 1] === '=') i++;
    if (cleaned[i - 1] === '=') i++;

    bytes += String.fromCharCode((a << 2) | (b >> 4));
    if (c !== 0 || cleaned[i - 2] !== '=') bytes += String.fromCharCode(((b & 0xF) << 4) | (c >> 2));
    if (d !== 0 || cleaned[i - 1] !== '=') bytes += String.fromCharCode(((c & 0x3) << 6) | d);
  }
  return bytes;
}

// Simple inflate for deflate-encoded SAML (HTTP-Redirect binding uses raw deflate)
// We implement a minimal subset: non-compressed blocks (BTYPE=00) and fixed Huffman (BTYPE=01).
function inflateRaw(data: number[]): string {
  let bitPos = 0;
  let bytePos = 0;
  const output: number[] = [];

  function readBit(): number {
    if (bytePos >= data.length) throw new Error('Unexpected end of deflate data');
    const bit = (data[bytePos] >> bitPos) & 1;
    bitPos++;
    if (bitPos === 8) { bitPos = 0; bytePos++; }
    return bit;
  }

  function readBits(n: number): number {
    let val = 0;
    for (let i = 0; i < n; i++) val |= (readBit() << i);
    return val;
  }

  function alignByte() {
    if (bitPos !== 0) { bitPos = 0; bytePos++; }
  }

  function readHuffman(tree: number[][]): number {
    let node = 0;
    while (tree[node].length > 2) {
      node = tree[node][readBit()];
    }
    return tree[node][0];
  }

  // Build fixed Huffman trees (RFC 1951 §3.2.6)
  function buildFixedLiteralTree(): number[][] {
    // Lengths: 0-143=8, 144-255=9, 256-279=7, 280-287=8
    const lengths: number[] = [];
    for (let i = 0; i <= 143; i++) lengths.push(8);
    for (let i = 144; i <= 255; i++) lengths.push(9);
    for (let i = 256; i <= 279; i++) lengths.push(7);
    for (let i = 280; i <= 287; i++) lengths.push(8);
    return buildTree(lengths);
  }

  function buildFixedDistTree(): number[][] {
    const lengths: number[] = [];
    for (let i = 0; i < 32; i++) lengths.push(5);
    return buildTree(lengths);
  }

  function buildTree(lengths: number[]): number[][] {
    // Count codes per length
    const maxLen = Math.max(...lengths);
    const blCount: number[] = new Array(maxLen + 1).fill(0);
    for (const l of lengths) if (l > 0) blCount[l]++;
    const nextCode: number[] = new Array(maxLen + 2).fill(0);
    let code = 0;
    for (let bits = 1; bits <= maxLen; bits++) {
      code = (code + blCount[bits - 1]) << 1;
      nextCode[bits] = code;
    }
    // Build canonical codes
    const codes: Array<{code: number; len: number; sym: number}> = [];
    for (let sym = 0; sym < lengths.length; sym++) {
      const len = lengths[sym];
      if (len > 0) {
        codes.push({code: nextCode[len]++, len, sym});
      }
    }
    // Build simple lookup tree (array of [sym] or [left, right])
    // For simplicity, use a flat lookup by iterating bits
    const tree: number[][] = [[0], [1]]; // placeholder; use bit-by-bit approach
    void tree; // suppress unused var

    // Return codes for lookup
    const lookup: Record<string, number> = {};
    for (const c of codes) {
      lookup[c.code.toString(2).padStart(c.len, '0')] = c.sym;
    }
    return [lookup as unknown as number[]]; // pack into first element for simplicity
  }

  // Simplified: use a direct bit-string lookup approach
  let bfinalDone = false;
  while (!bfinalDone) {
    const bfinal = readBit();
    const btype = readBits(2);
    if (bfinal) bfinalDone = true;

    if (btype === 0) {
      // No compression
      alignByte();
      if (bytePos + 4 > data.length) throw new Error('Truncated stored block header');
      const len = data[bytePos] | (data[bytePos + 1] << 8);
      bytePos += 4; // skip LEN + NLEN
      for (let i = 0; i < len; i++) {
        if (bytePos >= data.length) throw new Error('Truncated stored block data');
        output.push(data[bytePos++]);
      }
    } else if (btype === 1 || btype === 2) {
      // Fixed or dynamic Huffman — use a simplified approach
      // Build lookup tables
      let litLengths: number[];
      let distLengths: number[];

      if (btype === 1) {
        litLengths = [];
        for (let i = 0; i <= 143; i++) litLengths.push(8);
        for (let i = 144; i <= 255; i++) litLengths.push(9);
        for (let i = 256; i <= 279; i++) litLengths.push(7);
        for (let i = 280; i <= 287; i++) litLengths.push(8);
        distLengths = new Array(30).fill(5);
      } else {
        throw new Error('Dynamic Huffman (BTYPE=10) not supported — this SAML may use a different encoding');
      }

      // Build canonical code lookup
      function buildLookup(lengths: number[]): Record<string, number> {
        const maxLen = Math.max(...lengths);
        const blCount: number[] = new Array(maxLen + 1).fill(0);
        for (const l of lengths) if (l > 0) blCount[l]++;
        let code = 0;
        const nextCode: number[] = new Array(maxLen + 2).fill(0);
        for (let bits = 1; bits <= maxLen; bits++) {
          code = (code + blCount[bits - 1]) << 1;
          nextCode[bits] = code;
        }
        const lk: Record<string, number> = {};
        const nc = [...nextCode];
        for (let sym = 0; sym < lengths.length; sym++) {
          const len = lengths[sym];
          if (len > 0) {
            lk[nc[len].toString(2).padStart(len, '0')] = sym;
            nc[len]++;
          }
        }
        return lk;
      }

      const litLk = buildLookup(litLengths);
      const distLk = buildLookup(distLengths);

      const LENGTH_EXTRA = [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];
      const LENGTH_BASE  = [3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258];
      const DIST_EXTRA   = [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];
      const DIST_BASE    = [1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577];

      function readCode(lk: Record<string, number>, maxBits: number): number {
        let bits = '';
        for (let n = 1; n <= maxBits; n++) {
          bits += readBit().toString();
          if (bits in lk) return lk[bits];
        }
        throw new Error('Invalid Huffman code');
      }

      const litMaxBits = Math.max(...litLengths.filter(l => l > 0));
      const distMaxBits = Math.max(...distLengths.filter(l => l > 0));

      while (true) {
        const sym = readCode(litLk, litMaxBits);
        if (sym < 256) {
          output.push(sym);
        } else if (sym === 256) {
          break;
        } else {
          const lenIdx = sym - 257;
          if (lenIdx < 0 || lenIdx >= LENGTH_BASE.length) throw new Error('Invalid length symbol');
          const length = LENGTH_BASE[lenIdx] + readBits(LENGTH_EXTRA[lenIdx]);
          const distSym = readCode(distLk, distMaxBits);
          if (distSym >= DIST_BASE.length) throw new Error('Invalid distance symbol');
          const dist = DIST_BASE[distSym] + readBits(DIST_EXTRA[distSym]);
          const startPos = output.length - dist;
          if (startPos < 0) throw new Error('Invalid back-reference distance');
          for (let i = 0; i < length; i++) {
            output.push(output[startPos + (i % dist)]);
          }
        }
      }
    } else {
      throw new Error('Reserved BTYPE=11 in deflate stream');
    }
  }

  return output.map(b => String.fromCharCode(b)).join('');
}

// Extract key XML attributes/elements from a SAML message
function parseSamlFields(xml: string): SamlField[] {
  const fields: SamlField[] = [];

  function extract(pattern: RegExp, name: string, description: string) {
    const m = xml.match(pattern);
    if (m) fields.push({ name, value: m[1] || m[0], description });
  }

  extract(/\bID="([^"]+)"/, 'ID', 'Unique identifier for this SAML message');
  extract(/\bIssueInstant="([^"]+)"/, 'IssueInstant', 'Timestamp when the message was issued (UTC)');
  extract(/\bDestination="([^"]+)"/, 'Destination', 'URL of the receiving party (IdP or SP endpoint)');
  extract(/\bAssertionConsumerServiceURL="([^"]+)"/, 'AssertionConsumerServiceURL', 'SP URL where the IdP should send the SAML response');
  extract(/\bProtocolBinding="([^"]+)"/, 'ProtocolBinding', 'Binding type (e.g. HTTP-POST, HTTP-Redirect)');
  extract(/\bProviderName="([^"]+)"/, 'ProviderName', 'Human-readable name of the SP');
  extract(/\bInResponseTo="([^"]+)"/, 'InResponseTo', 'ID of the request this response is answering');
  extract(/\bStatus>[\s\S]*?StatusCode Value="([^"]+)"/, 'StatusCode', 'Result of the SAML operation');
  extract(/\bIssuer[^>]*>([^<]+)<\/[^>]*Issuer>/, 'Issuer', 'Entity ID of the message issuer');
  extract(/<saml[p2]*:?NameID[^>]*>([^<]+)<\//, 'NameID', 'Subject identifier (user name/email)');

  // Detect message type
  const type =
    xml.includes('AuthnRequest') ? 'AuthnRequest' :
    xml.includes('Response') && xml.includes('Assertion') ? 'Response (with Assertion)' :
    xml.includes('Response') ? 'Response' :
    xml.includes('LogoutRequest') ? 'LogoutRequest' :
    xml.includes('LogoutResponse') ? 'LogoutResponse' :
    'Unknown';

  fields.unshift({ name: 'Message Type', value: type, description: 'Type of SAML message' });

  return fields;
}

export function decodeSamlRequest(input: string): SamlDecodeResult {
  const warnings: string[] = [];
  const trimmed = input.trim();

  if (!trimmed) {
    return { raw: '', isXml: false, fields: [], xmlPreview: '', warnings: [] };
  }

  let xml = '';
  let isXml = false;

  // Try to detect if input is already XML
  if (trimmed.startsWith('<')) {
    xml = trimmed;
    isXml = true;
  } else {
    // Try base64 decode + optional deflate
    try {
      // URL-decode first
      const urlDecoded = trimmed.replace(/%([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
      const decoded = base64Decode(urlDecoded);

      // Check if it's XML directly (POST binding uses uncompressed base64)
      if (decoded.trimStart().startsWith('<')) {
        xml = decoded;
        isXml = true;
      } else {
        // Try raw deflate (HTTP-Redirect binding)
        const bytes: number[] = [];
        for (let i = 0; i < decoded.length; i++) bytes.push(decoded.charCodeAt(i) & 0xFF);
        try {
          xml = inflateRaw(bytes);
          if (xml.trimStart().startsWith('<')) {
            isXml = true;
          } else {
            warnings.push('Decompressed output does not look like XML. The input may use dynamic Huffman compression (most real SAML messages do). Showing raw output.');
            xml = xml.slice(0, 2000);
          }
        } catch (e) {
          warnings.push(`Inflate failed: ${e instanceof Error ? e.message : 'unknown error'}. Showing base64-decoded text.`);
          xml = decoded.slice(0, 2000);
        }
      }
    } catch (e) {
      warnings.push(`Base64 decode failed: ${e instanceof Error ? e.message : 'unknown error'}`);
      xml = trimmed;
    }
  }

  // Pretty-print XML
  let xmlPreview = xml;
  if (isXml) {
    try {
      xmlPreview = xml
        .replace(/></g, '>\n<')
        .replace(/^\s+|\s+$/gm, '')
        .split('\n')
        .map((line, i) => {
          const depth = (line.match(/<[^/]/g) || []).length - (line.match(/<\//g) || []).length;
          void depth;
          return line;
        })
        .join('\n');
    } catch {
      xmlPreview = xml;
    }
  }

  const fields = isXml ? parseSamlFields(xml) : [];

  return { raw: xml.slice(0, 8000), isXml, fields, xmlPreview: xmlPreview.slice(0, 8000), warnings };
}

export type SamlBindingInfo = {
  name: string;
  description: string;
  encoding: string;
  example: string;
};

export const SAML_BINDINGS: SamlBindingInfo[] = [
  {
    name: 'HTTP-Redirect',
    description: 'SAML message encoded as a query parameter in an HTTP redirect. Used for AuthnRequests (SP→IdP). Deflate-compressed + base64-encoded + URL-encoded.',
    encoding: 'Deflate (raw) → Base64 → URL-encode → ?SAMLRequest=...',
    example: 'https://idp.example.com/sso?SAMLRequest=nZFBa4NBEI...',
  },
  {
    name: 'HTTP-POST',
    description: 'SAML message sent as a hidden HTML form field via HTTP POST. Used for Responses (IdP→SP). Base64-encoded, no compression.',
    encoding: 'Base64 (no deflate) → <input type="hidden" name="SAMLResponse" value="...">',
    example: '<form method="POST" action="https://sp.example.com/acs">...',
  },
  {
    name: 'HTTP-Artifact',
    description: 'A short artifact identifier is exchanged instead of the full SAML message. The artifact is resolved via a back-channel SOAP call.',
    encoding: 'Artifact reference → ArtifactResolve (SOAP) → ArtifactResponse',
    example: 'https://sp.example.com/acs?SAMLart=AAQAAO...',
  },
  {
    name: 'SOAP',
    description: 'SAML message carried in a SOAP envelope over HTTP. Used for back-channel communication (artifact resolution, SLO).',
    encoding: '<S:Envelope><S:Body>...<samlp:AuthnRequest>...',
    example: 'POST /idp/soap HTTP/1.1\nContent-Type: text/xml',
  },
];
