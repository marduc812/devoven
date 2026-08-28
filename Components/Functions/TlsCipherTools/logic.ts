export type CipherSuiteInfo = {
  name: string;
  hexCode: string;
  keyExchange: string;
  authentication: string;
  encryption: string;
  keySize: number;
  mode: string;
  mac: string;
  forwardSecrecy: boolean;
  aead: boolean;
  security: 'recommended' | 'acceptable' | 'weak' | 'insecure';
};

export const CIPHER_SUITES: CipherSuiteInfo[] = [
  // TLS 1.3 suites
  { name: 'TLS_AES_128_GCM_SHA256', hexCode: '0x1301', keyExchange: 'DHE/ECDHE (negotiated)', authentication: 'Any', encryption: 'AES', keySize: 128, mode: 'GCM', mac: 'SHA-256 (AEAD)', forwardSecrecy: true, aead: true, security: 'recommended' },
  { name: 'TLS_AES_256_GCM_SHA384', hexCode: '0x1302', keyExchange: 'DHE/ECDHE (negotiated)', authentication: 'Any', encryption: 'AES', keySize: 256, mode: 'GCM', mac: 'SHA-384 (AEAD)', forwardSecrecy: true, aead: true, security: 'recommended' },
  { name: 'TLS_CHACHA20_POLY1305_SHA256', hexCode: '0x1303', keyExchange: 'DHE/ECDHE (negotiated)', authentication: 'Any', encryption: 'ChaCha20', keySize: 256, mode: 'Poly1305', mac: 'SHA-256 (AEAD)', forwardSecrecy: true, aead: true, security: 'recommended' },
  { name: 'TLS_AES_128_CCM_SHA256', hexCode: '0x1304', keyExchange: 'DHE/ECDHE (negotiated)', authentication: 'Any', encryption: 'AES', keySize: 128, mode: 'CCM', mac: 'SHA-256 (AEAD)', forwardSecrecy: true, aead: true, security: 'acceptable' },
  { name: 'TLS_AES_128_CCM_8_SHA256', hexCode: '0x1305', keyExchange: 'DHE/ECDHE (negotiated)', authentication: 'Any', encryption: 'AES', keySize: 128, mode: 'CCM-8', mac: 'SHA-256 (AEAD, truncated)', forwardSecrecy: true, aead: true, security: 'acceptable' },

  // ECDHE + ECDSA
  { name: 'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256', hexCode: '0xC02B', keyExchange: 'ECDHE', authentication: 'ECDSA', encryption: 'AES', keySize: 128, mode: 'GCM', mac: 'SHA-256 (AEAD)', forwardSecrecy: true, aead: true, security: 'recommended' },
  { name: 'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384', hexCode: '0xC02C', keyExchange: 'ECDHE', authentication: 'ECDSA', encryption: 'AES', keySize: 256, mode: 'GCM', mac: 'SHA-384 (AEAD)', forwardSecrecy: true, aead: true, security: 'recommended' },
  { name: 'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256', hexCode: '0xCCA9', keyExchange: 'ECDHE', authentication: 'ECDSA', encryption: 'ChaCha20', keySize: 256, mode: 'Poly1305', mac: 'SHA-256 (AEAD)', forwardSecrecy: true, aead: true, security: 'recommended' },
  { name: 'TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256', hexCode: '0xC023', keyExchange: 'ECDHE', authentication: 'ECDSA', encryption: 'AES', keySize: 128, mode: 'CBC', mac: 'HMAC-SHA-256', forwardSecrecy: true, aead: false, security: 'acceptable' },
  { name: 'TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA384', hexCode: '0xC024', keyExchange: 'ECDHE', authentication: 'ECDSA', encryption: 'AES', keySize: 256, mode: 'CBC', mac: 'HMAC-SHA-384', forwardSecrecy: true, aead: false, security: 'acceptable' },
  { name: 'TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA', hexCode: '0xC009', keyExchange: 'ECDHE', authentication: 'ECDSA', encryption: 'AES', keySize: 128, mode: 'CBC', mac: 'HMAC-SHA-1', forwardSecrecy: true, aead: false, security: 'acceptable' },
  { name: 'TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA', hexCode: '0xC00A', keyExchange: 'ECDHE', authentication: 'ECDSA', encryption: 'AES', keySize: 256, mode: 'CBC', mac: 'HMAC-SHA-1', forwardSecrecy: true, aead: false, security: 'acceptable' },
  { name: 'TLS_ECDHE_ECDSA_WITH_RC4_128_SHA', hexCode: '0xC007', keyExchange: 'ECDHE', authentication: 'ECDSA', encryption: 'RC4', keySize: 128, mode: 'Stream', mac: 'HMAC-SHA-1', forwardSecrecy: true, aead: false, security: 'insecure' },
  { name: 'TLS_ECDHE_ECDSA_WITH_3DES_EDE_CBC_SHA', hexCode: '0xC008', keyExchange: 'ECDHE', authentication: 'ECDSA', encryption: '3DES', keySize: 112, mode: 'CBC', mac: 'HMAC-SHA-1', forwardSecrecy: true, aead: false, security: 'weak' },

  // ECDHE + RSA
  { name: 'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256', hexCode: '0xC02F', keyExchange: 'ECDHE', authentication: 'RSA', encryption: 'AES', keySize: 128, mode: 'GCM', mac: 'SHA-256 (AEAD)', forwardSecrecy: true, aead: true, security: 'recommended' },
  { name: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384', hexCode: '0xC030', keyExchange: 'ECDHE', authentication: 'RSA', encryption: 'AES', keySize: 256, mode: 'GCM', mac: 'SHA-384 (AEAD)', forwardSecrecy: true, aead: true, security: 'recommended' },
  { name: 'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256', hexCode: '0xCCA8', keyExchange: 'ECDHE', authentication: 'RSA', encryption: 'ChaCha20', keySize: 256, mode: 'Poly1305', mac: 'SHA-256 (AEAD)', forwardSecrecy: true, aead: true, security: 'recommended' },
  { name: 'TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256', hexCode: '0xC027', keyExchange: 'ECDHE', authentication: 'RSA', encryption: 'AES', keySize: 128, mode: 'CBC', mac: 'HMAC-SHA-256', forwardSecrecy: true, aead: false, security: 'acceptable' },
  { name: 'TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384', hexCode: '0xC028', keyExchange: 'ECDHE', authentication: 'RSA', encryption: 'AES', keySize: 256, mode: 'CBC', mac: 'HMAC-SHA-384', forwardSecrecy: true, aead: false, security: 'acceptable' },
  { name: 'TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA', hexCode: '0xC013', keyExchange: 'ECDHE', authentication: 'RSA', encryption: 'AES', keySize: 128, mode: 'CBC', mac: 'HMAC-SHA-1', forwardSecrecy: true, aead: false, security: 'acceptable' },
  { name: 'TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA', hexCode: '0xC014', keyExchange: 'ECDHE', authentication: 'RSA', encryption: 'AES', keySize: 256, mode: 'CBC', mac: 'HMAC-SHA-1', forwardSecrecy: true, aead: false, security: 'acceptable' },
  { name: 'TLS_ECDHE_RSA_WITH_RC4_128_SHA', hexCode: '0xC011', keyExchange: 'ECDHE', authentication: 'RSA', encryption: 'RC4', keySize: 128, mode: 'Stream', mac: 'HMAC-SHA-1', forwardSecrecy: true, aead: false, security: 'insecure' },
  { name: 'TLS_ECDHE_RSA_WITH_3DES_EDE_CBC_SHA', hexCode: '0xC012', keyExchange: 'ECDHE', authentication: 'RSA', encryption: '3DES', keySize: 112, mode: 'CBC', mac: 'HMAC-SHA-1', forwardSecrecy: true, aead: false, security: 'weak' },

  // DHE + RSA
  { name: 'TLS_DHE_RSA_WITH_AES_128_GCM_SHA256', hexCode: '0x009E', keyExchange: 'DHE', authentication: 'RSA', encryption: 'AES', keySize: 128, mode: 'GCM', mac: 'SHA-256 (AEAD)', forwardSecrecy: true, aead: true, security: 'recommended' },
  { name: 'TLS_DHE_RSA_WITH_AES_256_GCM_SHA384', hexCode: '0x009F', keyExchange: 'DHE', authentication: 'RSA', encryption: 'AES', keySize: 256, mode: 'GCM', mac: 'SHA-384 (AEAD)', forwardSecrecy: true, aead: true, security: 'recommended' },
  { name: 'TLS_DHE_RSA_WITH_AES_128_CBC_SHA256', hexCode: '0x0067', keyExchange: 'DHE', authentication: 'RSA', encryption: 'AES', keySize: 128, mode: 'CBC', mac: 'HMAC-SHA-256', forwardSecrecy: true, aead: false, security: 'acceptable' },
  { name: 'TLS_DHE_RSA_WITH_AES_256_CBC_SHA256', hexCode: '0x006B', keyExchange: 'DHE', authentication: 'RSA', encryption: 'AES', keySize: 256, mode: 'CBC', mac: 'HMAC-SHA-256', forwardSecrecy: true, aead: false, security: 'acceptable' },
  { name: 'TLS_DHE_RSA_WITH_AES_128_CBC_SHA', hexCode: '0x0033', keyExchange: 'DHE', authentication: 'RSA', encryption: 'AES', keySize: 128, mode: 'CBC', mac: 'HMAC-SHA-1', forwardSecrecy: true, aead: false, security: 'acceptable' },
  { name: 'TLS_DHE_RSA_WITH_CHACHA20_POLY1305_SHA256', hexCode: '0xCCAA', keyExchange: 'DHE', authentication: 'RSA', encryption: 'ChaCha20', keySize: 256, mode: 'Poly1305', mac: 'SHA-256 (AEAD)', forwardSecrecy: true, aead: true, security: 'recommended' },

  // RSA key exchange (no forward secrecy)
  { name: 'TLS_RSA_WITH_AES_128_GCM_SHA256', hexCode: '0x009C', keyExchange: 'RSA', authentication: 'RSA', encryption: 'AES', keySize: 128, mode: 'GCM', mac: 'SHA-256 (AEAD)', forwardSecrecy: false, aead: true, security: 'weak' },
  { name: 'TLS_RSA_WITH_AES_256_GCM_SHA384', hexCode: '0x009D', keyExchange: 'RSA', authentication: 'RSA', encryption: 'AES', keySize: 256, mode: 'GCM', mac: 'SHA-384 (AEAD)', forwardSecrecy: false, aead: true, security: 'weak' },
  { name: 'TLS_RSA_WITH_AES_128_CBC_SHA256', hexCode: '0x003C', keyExchange: 'RSA', authentication: 'RSA', encryption: 'AES', keySize: 128, mode: 'CBC', mac: 'HMAC-SHA-256', forwardSecrecy: false, aead: false, security: 'weak' },
  { name: 'TLS_RSA_WITH_AES_256_CBC_SHA256', hexCode: '0x003D', keyExchange: 'RSA', authentication: 'RSA', encryption: 'AES', keySize: 256, mode: 'CBC', mac: 'HMAC-SHA-256', forwardSecrecy: false, aead: false, security: 'weak' },
  { name: 'TLS_RSA_WITH_AES_128_CBC_SHA', hexCode: '0x002F', keyExchange: 'RSA', authentication: 'RSA', encryption: 'AES', keySize: 128, mode: 'CBC', mac: 'HMAC-SHA-1', forwardSecrecy: false, aead: false, security: 'weak' },
  { name: 'TLS_RSA_WITH_AES_256_CBC_SHA', hexCode: '0x0035', keyExchange: 'RSA', authentication: 'RSA', encryption: 'AES', keySize: 256, mode: 'CBC', mac: 'HMAC-SHA-1', forwardSecrecy: false, aead: false, security: 'weak' },
  { name: 'TLS_RSA_WITH_RC4_128_SHA', hexCode: '0x0005', keyExchange: 'RSA', authentication: 'RSA', encryption: 'RC4', keySize: 128, mode: 'Stream', mac: 'HMAC-SHA-1', forwardSecrecy: false, aead: false, security: 'insecure' },
  { name: 'TLS_RSA_WITH_RC4_128_MD5', hexCode: '0x0004', keyExchange: 'RSA', authentication: 'RSA', encryption: 'RC4', keySize: 128, mode: 'Stream', mac: 'HMAC-MD5', forwardSecrecy: false, aead: false, security: 'insecure' },
  { name: 'TLS_RSA_WITH_3DES_EDE_CBC_SHA', hexCode: '0x000A', keyExchange: 'RSA', authentication: 'RSA', encryption: '3DES', keySize: 112, mode: 'CBC', mac: 'HMAC-SHA-1', forwardSecrecy: false, aead: false, security: 'insecure' },
  { name: 'TLS_RSA_WITH_NULL_SHA', hexCode: '0x0002', keyExchange: 'RSA', authentication: 'RSA', encryption: 'NULL', keySize: 0, mode: 'None', mac: 'HMAC-SHA-1', forwardSecrecy: false, aead: false, security: 'insecure' },

  // DHE + DSS
  { name: 'TLS_DHE_DSS_WITH_AES_128_GCM_SHA256', hexCode: '0x00A2', keyExchange: 'DHE', authentication: 'DSS', encryption: 'AES', keySize: 128, mode: 'GCM', mac: 'SHA-256 (AEAD)', forwardSecrecy: true, aead: true, security: 'acceptable' },
  { name: 'TLS_DHE_DSS_WITH_AES_256_GCM_SHA384', hexCode: '0x00A3', keyExchange: 'DHE', authentication: 'DSS', encryption: 'AES', keySize: 256, mode: 'GCM', mac: 'SHA-384 (AEAD)', forwardSecrecy: true, aead: true, security: 'acceptable' },
  { name: 'TLS_DHE_DSS_WITH_AES_128_CBC_SHA', hexCode: '0x0032', keyExchange: 'DHE', authentication: 'DSS', encryption: 'AES', keySize: 128, mode: 'CBC', mac: 'HMAC-SHA-1', forwardSecrecy: true, aead: false, security: 'acceptable' },

  // ECDHE + PSK
  { name: 'TLS_ECDHE_PSK_WITH_AES_128_CBC_SHA256', hexCode: '0xC037', keyExchange: 'ECDHE', authentication: 'PSK', encryption: 'AES', keySize: 128, mode: 'CBC', mac: 'HMAC-SHA-256', forwardSecrecy: true, aead: false, security: 'acceptable' },
  { name: 'TLS_ECDHE_PSK_WITH_CHACHA20_POLY1305_SHA256', hexCode: '0xCCAC', keyExchange: 'ECDHE', authentication: 'PSK', encryption: 'ChaCha20', keySize: 256, mode: 'Poly1305', mac: 'SHA-256 (AEAD)', forwardSecrecy: true, aead: true, security: 'recommended' },

  // Export / insecure
  { name: 'TLS_RSA_EXPORT_WITH_RC4_40_MD5', hexCode: '0x0003', keyExchange: 'RSA', authentication: 'RSA', encryption: 'RC4', keySize: 40, mode: 'Stream', mac: 'HMAC-MD5', forwardSecrecy: false, aead: false, security: 'insecure' },
  { name: 'TLS_RSA_WITH_NULL_MD5', hexCode: '0x0001', keyExchange: 'RSA', authentication: 'RSA', encryption: 'NULL', keySize: 0, mode: 'None', mac: 'HMAC-MD5', forwardSecrecy: false, aead: false, security: 'insecure' },
  { name: 'TLS_NULL_WITH_NULL_NULL', hexCode: '0x0000', keyExchange: 'NULL', authentication: 'NULL', encryption: 'NULL', keySize: 0, mode: 'None', mac: 'NULL', forwardSecrecy: false, aead: false, security: 'insecure' },
];

const CIPHER_MAP: Record<string, CipherSuiteInfo> = {};
for (const cs of CIPHER_SUITES) {
  CIPHER_MAP[cs.name] = cs;
  CIPHER_MAP[cs.name.toLowerCase()] = cs;
}

export function lookupCipher(name: string): CipherSuiteInfo | null {
  const n = name.trim();
  return CIPHER_MAP[n] || CIPHER_MAP[n.toLowerCase()] || null;
}

export function searchCiphers(query: string): CipherSuiteInfo[] {
  const q = query.trim().toLowerCase();
  if (!q) return CIPHER_SUITES.slice(0, 20);
  return CIPHER_SUITES.filter(cs =>
    cs.name.toLowerCase().includes(q) ||
    cs.keyExchange.toLowerCase().includes(q) ||
    cs.authentication.toLowerCase().includes(q) ||
    cs.encryption.toLowerCase().includes(q) ||
    cs.mode.toLowerCase().includes(q) ||
    cs.mac.toLowerCase().includes(q) ||
    cs.security.toLowerCase().includes(q) ||
    cs.hexCode.toLowerCase().includes(q)
  );
}

export function parseCipherName(name: string): Record<string, string> {
  const info = lookupCipher(name);
  if (info) {
    return {
      'Key Exchange': info.keyExchange + (info.forwardSecrecy ? ' (Forward Secrecy)' : ''),
      'Authentication': info.authentication,
      'Encryption': `${info.encryption}${info.keySize > 0 ? '-' + info.keySize : ''}`,
      'Mode': info.mode,
      'MAC / Integrity': info.mac + (info.aead ? ' (AEAD — no separate MAC needed)' : ''),
      'Forward Secrecy': info.forwardSecrecy ? 'Yes' : 'No',
      'AEAD': info.aead ? 'Yes (authenticated encryption)' : 'No',
      'Security Rating': info.security.charAt(0).toUpperCase() + info.security.slice(1),
      'Hex Code': info.hexCode,
    };
  }
  return {};
}
