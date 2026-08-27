// All functions in this file are pure (no React, no browser APIs).

export type GrantType = 'authorization_code' | 'client_credentials' | 'device_code' | 'implicit';

export type OAuthParams = {
  grantType: GrantType;
  clientId: string;
  redirectUri: string;
  scope: string;
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
};

export type OAuthResult = {
  authorizationUrl: string | null;
  flowSteps: string[];
  tokenCurlExample: string;
  notes: string[];
};

export type JwtPayload = Record<string, unknown>;

export function buildAuthorizationUrl(params: OAuthParams): string | null {
  if (params.grantType === 'client_credentials') return null;

  const base = params.authorizationEndpoint || 'https://authorization-server.example.com/authorize';
  const query: string[] = [];

  if (params.grantType === 'implicit') {
    query.push('response_type=token');
  } else if (params.grantType === 'device_code') {
    return null; // device code doesn't use auth URL
  } else {
    query.push('response_type=code');
  }

  if (params.clientId) query.push('client_id=' + encodeURIComponent(params.clientId));
  if (params.redirectUri) query.push('redirect_uri=' + encodeURIComponent(params.redirectUri));
  if (params.scope) query.push('scope=' + encodeURIComponent(params.scope));
  if (params.state) query.push('state=' + encodeURIComponent(params.state));
  if (params.codeChallenge) {
    query.push('code_challenge=' + encodeURIComponent(params.codeChallenge));
    query.push('code_challenge_method=' + encodeURIComponent(params.codeChallengeMethod || 'S256'));
  }

  return base + '?' + query.join('&');
}

export function buildFlowSteps(params: OAuthParams): string[] {
  switch (params.grantType) {
    case 'authorization_code':
      return [
        '1. Client redirects user to Authorization Server (see Authorization URL above)',
        '2. User authenticates and grants consent',
        '3. Authorization Server redirects back to redirect_uri with ?code=AUTH_CODE' + (params.state ? '&state=STATE' : ''),
        '4. Client verifies state parameter (CSRF protection)' + (params.codeChallenge ? ' and code_challenge' : ''),
        '5. Client exchanges auth code for tokens at token endpoint (see cURL below)',
        '6. Authorization Server returns access_token, token_type, expires_in, and optionally refresh_token',
        '7. Client uses access_token in Authorization: Bearer <token> header',
        '8. When access_token expires, client uses refresh_token to get a new one',
      ];
    case 'client_credentials':
      return [
        '1. Client sends credentials directly to token endpoint (no user involved)',
        '2. Authorization Server validates client_id and client_secret',
        '3. Authorization Server returns access_token and expires_in',
        '4. Client uses access_token in Authorization: Bearer <token> header',
        '5. When token expires, client requests a new one (no refresh token in this flow)',
      ];
    case 'device_code':
      return [
        '1. Client posts to device authorization endpoint to get device_code and user_code',
        '2. Client shows user_code and verification_uri to the user',
        '3. User visits verification_uri on another device and enters user_code',
        '4. Client polls token endpoint with device_code until user authorizes or it expires',
        '5. Authorization Server returns access_token once user has authenticated',
        '6. Client uses access_token in Authorization: Bearer <token> header',
      ];
    case 'implicit':
      return [
        '1. Client redirects user to Authorization Server (see Authorization URL above)',
        '   NOTE: Implicit flow is DEPRECATED — use Authorization Code with PKCE instead',
        '2. User authenticates and grants consent',
        '3. Authorization Server redirects back to redirect_uri with #access_token=TOKEN in fragment',
        '4. Client extracts access_token from URL fragment (never sent to server)',
        '5. Client uses access_token in Authorization: Bearer <token> header',
        '   WARNING: No refresh token is issued. Token is exposed in browser history.',
      ];
    default:
      return [];
  }
}

export function buildTokenCurl(params: OAuthParams): string {
  const endpoint = params.tokenEndpoint || 'https://authorization-server.example.com/token';

  switch (params.grantType) {
    case 'authorization_code': {
      let cmd = `curl -X POST "${endpoint}" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=authorization_code" \\
  -d "code=AUTH_CODE_FROM_REDIRECT" \\
  -d "redirect_uri=${params.redirectUri || 'https://your-app.example.com/callback'}" \\
  -d "client_id=${params.clientId || 'YOUR_CLIENT_ID'}" \\
  -d "client_secret=YOUR_CLIENT_SECRET"`;
      if (params.codeChallenge) {
        cmd += ` \\\n  -d "code_verifier=YOUR_CODE_VERIFIER"`;
      }
      return cmd;
    }
    case 'client_credentials':
      return `curl -X POST "${endpoint}" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=client_credentials" \\
  -d "client_id=${params.clientId || 'YOUR_CLIENT_ID'}" \\
  -d "client_secret=YOUR_CLIENT_SECRET" \\
  -d "scope=${params.scope || 'read write'}"`;
    case 'device_code':
      return `# Step 1: Request device & user codes
curl -X POST "${endpoint.replace('/token', '/device_authorization')}" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "client_id=${params.clientId || 'YOUR_CLIENT_ID'}" \\
  -d "scope=${params.scope || 'read'}"

# Step 2: Poll for token (repeat until success or expiry)
curl -X POST "${endpoint}" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=urn:ietf:params:oauth:grant-type:device_code" \\
  -d "client_id=${params.clientId || 'YOUR_CLIENT_ID'}" \\
  -d "device_code=DEVICE_CODE_FROM_STEP_1"`;
    case 'implicit':
      return '# Implicit flow: token returned in URL fragment — no token endpoint call needed.\n# Extract access_token from window.location.hash in the browser.';
    default:
      return '';
  }
}

export function buildOAuthResult(params: OAuthParams): OAuthResult {
  const authorizationUrl = buildAuthorizationUrl(params);
  const flowSteps = buildFlowSteps(params);
  const tokenCurlExample = buildTokenCurl(params);

  const notes: string[] = [];
  if (params.grantType === 'authorization_code' && !params.codeChallenge) {
    notes.push('Security tip: Add PKCE (code_challenge + code_verifier) to prevent authorization code interception attacks.');
  }
  if (params.grantType === 'implicit') {
    notes.push('Warning: Implicit flow is deprecated (RFC 9700). Use Authorization Code + PKCE for public clients.');
  }
  if (!params.state && (params.grantType === 'authorization_code' || params.grantType === 'implicit')) {
    notes.push('Security tip: Add a random state parameter to prevent CSRF attacks.');
  }

  return { authorizationUrl, flowSteps, tokenCurlExample, notes };
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  if (!token.trim()) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    // Base64url decode without TextDecoder
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '=='.slice(0, (4 - base64.length % 4) % 4);
    const decoded = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

export function formatJwtPayload(payload: JwtPayload): string {
  const lines: string[] = ['=== JWT Payload Claims ===', ''];

  const claimDescriptions: Record<string, string> = {
    iss: 'Issuer',
    sub: 'Subject',
    aud: 'Audience',
    exp: 'Expiration Time',
    nbf: 'Not Before',
    iat: 'Issued At',
    jti: 'JWT ID',
    scope: 'Scope',
    client_id: 'Client ID',
  };

  for (const [key, value] of Object.entries(payload)) {
    const desc = claimDescriptions[key] || key;
    let displayValue = JSON.stringify(value);

    if ((key === 'exp' || key === 'nbf' || key === 'iat') && typeof value === 'number') {
      const date = new Date(value * 1000);
      displayValue = `${value} (${date.toISOString()})`;
    }

    lines.push(`${desc.padEnd(20)} ${displayValue}`);
  }

  return lines.join('\n');
}
