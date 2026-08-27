import { generateTlsConfig, TLS_PROFILES } from '@/Components/Functions/TlsConfigTools/logic';

describe('generateTlsConfig', () => {
  it('modern profile uses TLS 1.3 only', () => {
    const config = generateTlsConfig('modern');
    expect(config.minTlsVersion).toBe('TLS 1.3');
    expect(config.maxTlsVersion).toBe('TLS 1.3');
  });

  it('intermediate profile uses TLS 1.2 min', () => {
    const config = generateTlsConfig('intermediate');
    expect(config.minTlsVersion).toBe('TLS 1.2');
    expect(config.maxTlsVersion).toBe('TLS 1.3');
  });

  it('old profile uses TLS 1.0 min', () => {
    const config = generateTlsConfig('old');
    expect(config.minTlsVersion).toBe('TLS 1.0');
  });

  it('modern profile has TLSv1.3 in nginx config', () => {
    const config = generateTlsConfig('modern');
    expect(config.nginx).toContain('TLSv1.3');
  });

  it('intermediate profile has TLSv1.2 and TLSv1.3 in nginx config', () => {
    const config = generateTlsConfig('intermediate');
    expect(config.nginx).toContain('TLSv1.2');
    expect(config.nginx).toContain('TLSv1.3');
  });

  it('old profile includes TLSv1 in nginx config', () => {
    const config = generateTlsConfig('old');
    expect(config.nginx).toContain('TLSv1');
  });

  it('nginx config includes HSTS header', () => {
    const config = generateTlsConfig('intermediate');
    expect(config.nginx).toContain('Strict-Transport-Security');
  });

  it('apache config includes SSLProtocol', () => {
    const config = generateTlsConfig('intermediate');
    expect(config.apache).toContain('SSLProtocol');
  });

  it('intermediate profile has cipher suites', () => {
    const config = generateTlsConfig('intermediate');
    expect(config.cipherSuites.length).toBeGreaterThan(0);
  });

  it('modern profile has browser compatibility list', () => {
    const config = generateTlsConfig('modern');
    expect(config.browserCompatibility.length).toBeGreaterThan(0);
    expect(config.browserCompatibility.some(b => b.includes('Chrome'))).toBe(true);
  });

  it('old profile has warning note', () => {
    const config = generateTlsConfig('old');
    expect(config.notes.some(n => n.startsWith('WARNING'))).toBe(true);
  });

  it('all 3 profiles are defined in TLS_PROFILES', () => {
    expect(TLS_PROFILES.map(p => p.id)).toContain('modern');
    expect(TLS_PROFILES.map(p => p.id)).toContain('intermediate');
    expect(TLS_PROFILES.map(p => p.id)).toContain('old');
  });
});
