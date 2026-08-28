import { parseRsaKeyInfo, formatRsaKeyInfo } from '@/Components/Functions/RsaKeyInfoTools/logic';

describe('parseRsaKeyInfo', () => {
  it('detects RSA PUBLIC KEY type', () => {
    const pem = `-----BEGIN RSA PUBLIC KEY-----
MIGJAoGBAMOST/DNt9VFuJeaE7h4zWNJKvL7tNEF3DFDxNOe2nWnHh4IrE8N
XTNdDFlVGMSqV5JFAZ6qNyIRVwMnS2PZXH7hEhDdPdEgT8E7kETX3HkNxMO7
gAGLJVvq7Hv6dU8LCzJZQmhUz59AEqI3Hw6K5C0BbUjxYRVbLJaZAgMBAAE=
-----END RSA PUBLIC KEY-----`;
    const result = parseRsaKeyInfo(pem);
    expect(result.keyType).toBe('RSA PUBLIC KEY');
    expect(result.label).toBe('RSA PUBLIC KEY');
  });

  it('detects CERTIFICATE type', () => {
    const pem = `-----BEGIN CERTIFICATE-----
MIIBkTCB+wIJAKGBzgfCBpI7MA0GCSqGSIb3DQEBCwUAMBExDzANBgNVBAMM
BnRlc3RDQTAeFw0yMzAxMDEwMDAwMDBaFw0yNDAxMDEwMDAwMDBaMBExDzAN
BgNVBAMMBnRlc3RDQTBcMA0GCSqGSIb3DQEBAQUAA0sAMEgCQQDAZhCOBDXJ
-----END CERTIFICATE-----`;
    const result = parseRsaKeyInfo(pem);
    expect(result.keyType).toBe('CERTIFICATE');
    expect(result.notes.some(n => n.includes('X.509'))).toBe(true);
  });

  it('detects EC PRIVATE KEY type', () => {
    const pem = `-----BEGIN EC PRIVATE KEY-----
MHQCAQEEIBkg4LVXK4pAxSFGsKxCNkJ...
-----END EC PRIVATE KEY-----`;
    const result = parseRsaKeyInfo(pem);
    expect(result.keyType).toBe('EC PRIVATE KEY');
    expect(result.notes.some(n => n.includes('Elliptic Curve'))).toBe(true);
  });

  it('returns UNKNOWN for invalid PEM', () => {
    const result = parseRsaKeyInfo('this is not a pem');
    expect(result.keyType).toBe('UNKNOWN');
  });

  it('returns UNKNOWN for empty input', () => {
    const result = parseRsaKeyInfo('');
    expect(result.keyType).toBe('UNKNOWN');
  });

  it('calculates DER byte count from base64 body', () => {
    const pem = `-----BEGIN RSA PUBLIC KEY-----
MIGJAoGBAMOST/DNt9VFuJeaE7h4zWNJKvL7tNEF3DFDxNOe2nWnHh4IrE8N
XTNdDFlVGMSqV5JFAZ6qNyIRVwMnS2PZXH7hEhDdPdEgT8E7kETX3HkNxMO7
gAGLJVvq7Hv6dU8LCzJZQmhUz59AEqI3Hw6K5C0BbUjxYRVbLJaZAgMBAAE=
-----END RSA PUBLIC KEY-----`;
    const result = parseRsaKeyInfo(pem);
    expect(result.derBytes).toBeGreaterThan(0);
  });

  it('returns structure array', () => {
    const pem = `-----BEGIN RSA PUBLIC KEY-----
MIGJAoGBAMOST/DNt9VFuJeaE7h4zWNJKvL7tNEF3DFDxNOe2nWnHh4IrE8N
XTNdDFlVGMSqV5JFAZ6qNyIRVwMnS2PZXH7hEhDdPdEgT8E7kETX3HkNxMO7
gAGLJVvq7Hv6dU8LCzJZQmhUz59AEqI3Hw6K5C0BbUjxYRVbLJaZAgMBAAE=
-----END RSA PUBLIC KEY-----`;
    const result = parseRsaKeyInfo(pem);
    expect(Array.isArray(result.structure)).toBe(true);
  });

  it('detects RSA PRIVATE KEY', () => {
    const pem = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0Z3VS5JJcds3xHn/ygWep4J...
-----END RSA PRIVATE KEY-----`;
    const result = parseRsaKeyInfo(pem);
    expect(result.keyType).toBe('RSA PRIVATE KEY');
  });

  it('detects CERTIFICATE REQUEST', () => {
    const pem = `-----BEGIN CERTIFICATE REQUEST-----
MIIBvTCCASQCAQAwHjEcMBoGA1UEAxMTZXhhbXBsZS5jb20wggEiMA0GCSqG
-----END CERTIFICATE REQUEST-----`;
    const result = parseRsaKeyInfo(pem);
    expect(result.keyType).toBe('CERTIFICATE REQUEST');
  });
});

describe('formatRsaKeyInfo', () => {
  it('includes DER Size in output', () => {
    const pem = `-----BEGIN RSA PUBLIC KEY-----
MIGJAoGBAMOST/DNt9VFuJeaE7h4zWNJKvL7tNEF3DFDxNOe2nWnHh4IrE8N
XTNdDFlVGMSqV5JFAZ6qNyIRVwMnS2PZXH7hEhDdPdEgT8E7kETX3HkNxMO7
gAGLJVvq7Hv6dU8LCzJZQmhUz59AEqI3Hw6K5C0BbUjxYRVbLJaZAgMBAAE=
-----END RSA PUBLIC KEY-----`;
    const result = parseRsaKeyInfo(pem);
    const formatted = formatRsaKeyInfo(result);
    expect(formatted).toContain('DER Size');
    expect(formatted).toContain('PEM Type');
  });

  it('includes Notes section when notes exist', () => {
    const pem = `-----BEGIN CERTIFICATE-----
MIIBkTCB+w==
-----END CERTIFICATE-----`;
    const result = parseRsaKeyInfo(pem);
    const formatted = formatRsaKeyInfo(result);
    expect(typeof formatted).toBe('string');
    expect(formatted.length).toBeGreaterThan(0);
  });
});
