import {
  buildAuthorizationUrl,
  buildFlowSteps,
  buildTokenCurl,
  buildOAuthResult,
  decodeJwtPayload,
  formatJwtPayload,
  type OAuthParams,
} from '@/Components/Functions/OAuthFlowTools/logic';

const baseParams: OAuthParams = {
  grantType: 'authorization_code',
  clientId: 'my-client',
  redirectUri: 'https://app.example.com/callback',
  scope: 'openid profile',
};

describe('buildAuthorizationUrl', () => {
  it('returns null for client_credentials', () => {
    expect(buildAuthorizationUrl({ ...baseParams, grantType: 'client_credentials' })).toBeNull();
  });

  it('returns null for device_code', () => {
    expect(buildAuthorizationUrl({ ...baseParams, grantType: 'device_code' })).toBeNull();
  });

  it('includes response_type=code for authorization_code', () => {
    const url = buildAuthorizationUrl(baseParams);
    expect(url).toContain('response_type=code');
  });

  it('includes response_type=token for implicit', () => {
    const url = buildAuthorizationUrl({ ...baseParams, grantType: 'implicit' });
    expect(url).toContain('response_type=token');
  });

  it('includes client_id', () => {
    const url = buildAuthorizationUrl(baseParams);
    expect(url).toContain('client_id=my-client');
  });

  it('includes scope', () => {
    const url = buildAuthorizationUrl(baseParams);
    expect(url).toContain('scope=');
  });

  it('includes state when provided', () => {
    const url = buildAuthorizationUrl({ ...baseParams, state: 'abc123' });
    expect(url).toContain('state=abc123');
  });

  it('includes code_challenge when provided', () => {
    const url = buildAuthorizationUrl({ ...baseParams, codeChallenge: 'mychallenge' });
    expect(url).toContain('code_challenge=mychallenge');
  });

  it('uses custom auth endpoint', () => {
    const url = buildAuthorizationUrl({ ...baseParams, authorizationEndpoint: 'https://auth.example.com/auth' });
    expect(url!.startsWith('https://auth.example.com/auth')).toBe(true);
  });
});

describe('buildFlowSteps', () => {
  it('returns steps for authorization_code', () => {
    const steps = buildFlowSteps(baseParams);
    expect(steps.length).toBeGreaterThan(3);
    expect(steps[0]).toContain('1.');
  });

  it('returns steps for client_credentials', () => {
    const steps = buildFlowSteps({ ...baseParams, grantType: 'client_credentials' });
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.some(s => s.includes('token endpoint'))).toBe(true);
  });

  it('returns steps for device_code', () => {
    const steps = buildFlowSteps({ ...baseParams, grantType: 'device_code' });
    expect(steps.some(s => s.toLowerCase().includes('device'))).toBe(true);
  });

  it('includes deprecation warning for implicit', () => {
    const steps = buildFlowSteps({ ...baseParams, grantType: 'implicit' });
    expect(steps.some(s => s.toUpperCase().includes('DEPRECATED'))).toBe(true);
  });
});

describe('buildTokenCurl', () => {
  it('generates curl for authorization_code', () => {
    const curl = buildTokenCurl(baseParams);
    expect(curl).toContain('grant_type=authorization_code');
    expect(curl).toContain('curl');
  });

  it('generates curl for client_credentials', () => {
    const curl = buildTokenCurl({ ...baseParams, grantType: 'client_credentials' });
    expect(curl).toContain('grant_type=client_credentials');
  });

  it('generates two-step curl for device_code', () => {
    const curl = buildTokenCurl({ ...baseParams, grantType: 'device_code' });
    expect(curl).toContain('device_code');
  });
});

describe('buildOAuthResult', () => {
  it('suggests PKCE when not provided', () => {
    const result = buildOAuthResult(baseParams);
    expect(result.notes.some(n => n.includes('PKCE'))).toBe(true);
  });

  it('suggests state param when missing', () => {
    const result = buildOAuthResult(baseParams);
    expect(result.notes.some(n => n.includes('state'))).toBe(true);
  });

  it('no PKCE note when code_challenge present', () => {
    const result = buildOAuthResult({ ...baseParams, codeChallenge: 'abc', state: 'xyz' });
    expect(result.notes.some(n => n.includes('PKCE'))).toBe(false);
  });
});

describe('decodeJwtPayload', () => {
  it('returns null for empty string', () => {
    expect(decodeJwtPayload('')).toBeNull();
  });

  it('returns null for non-JWT', () => {
    expect(decodeJwtPayload('notajwt')).toBeNull();
  });

  it('decodes a valid JWT payload', () => {
    // header.payload.sig — payload is base64url({ "sub": "1234", "name": "Alice" })
    const payload = Buffer.from(JSON.stringify({ sub: '1234', name: 'Alice', iat: 1700000000 })).toString('base64url');
    const token = `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`;
    const decoded = decodeJwtPayload(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.sub).toBe('1234');
    expect(decoded!.name).toBe('Alice');
  });
});

describe('formatJwtPayload', () => {
  it('formats known claims with friendly names', () => {
    const output = formatJwtPayload({ sub: 'alice', iss: 'auth.example.com', exp: 1700000000 });
    expect(output).toContain('Subject');
    expect(output).toContain('Issuer');
    expect(output).toContain('Expiration Time');
    expect(output).toContain('2023-'); // ISO date string
  });
});
