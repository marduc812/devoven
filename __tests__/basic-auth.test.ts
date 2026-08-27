import { encodeBasicAuth, decodeBasicAuth, processBasicAuth } from '@/Components/Functions/BasicAuthTools/logic';

describe('encodeBasicAuth', () => {
  it('encodes username and password', () => {
    const r = encodeBasicAuth('admin', 'password');
    expect(r).toContain('Authorization: Basic');
    expect(r).toContain('YWRtaW46cGFzc3dvcmQ=');
  });
  it('throws for empty username', () => expect(() => encodeBasicAuth('', 'pass')).toThrow());
  it('handles empty password', () => expect(encodeBasicAuth('user', '')).toContain('Basic'));
});

describe('decodeBasicAuth', () => {
  it('decodes a Basic auth header', () => {
    const r = decodeBasicAuth('Authorization: Basic YWRtaW46cGFzc3dvcmQ=');
    expect(r).toContain('Username: admin');
    expect(r).toContain('Password: password');
  });
  it('decodes without Authorization prefix', () => {
    const r = decodeBasicAuth('Basic YWRtaW46cGFzc3dvcmQ=');
    expect(r).toContain('admin');
  });
  it('decodes raw base64', () => {
    const r = decodeBasicAuth('YWRtaW46cGFzc3dvcmQ=');
    expect(r).toContain('admin');
  });
});

describe('processBasicAuth', () => {
  it('encodes username:password input', () => {
    const r = processBasicAuth('admin:secret');
    expect(r).toContain('Authorization: Basic');
  });
  it('decodes Basic auth header', () => {
    const r = processBasicAuth('Basic YWRtaW46cGFzc3dvcmQ=');
    expect(r).toContain('Username: admin');
  });
});
