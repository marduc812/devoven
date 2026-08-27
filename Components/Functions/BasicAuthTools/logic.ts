export function encodeBasicAuth(username: string, password: string): string {
  if (!username) throw new Error('Username is required');
  const credentials = `${username}:${password}`;
  const encoded = Buffer.from(credentials).toString('base64');
  return `Authorization: Basic ${encoded}`;
}

export function decodeBasicAuth(input: string): string {
  const token = input.trim()
    .replace(/^Authorization:\s*/i, '')
    .replace(/^Basic\s+/i, '');

  let decoded: string;
  try {
    decoded = Buffer.from(token, 'base64').toString('utf-8');
  } catch {
    throw new Error('Invalid base64 encoding');
  }

  const colonIdx = decoded.indexOf(':');
  if (colonIdx === -1) throw new Error('Decoded value does not contain a colon separator');

  const username = decoded.slice(0, colonIdx);
  const password = decoded.slice(colonIdx + 1);

  return `Username: ${username}\nPassword: ${password}\nCredentials: ${decoded}`;
}

export function processBasicAuth(input: string): string {
  const trimmed = input.trim();
  if (/^(Authorization:\s*)?Basic\s+[A-Za-z0-9+/=]+$/i.test(trimmed)) {
    return decodeBasicAuth(trimmed);
  }
  const colonIdx = trimmed.indexOf(':');
  if (colonIdx !== -1) {
    const username = trimmed.slice(0, colonIdx);
    const password = trimmed.slice(colonIdx + 1);
    return encodeBasicAuth(username, password);
  }
  throw new Error('Enter "username:password" to encode, or a Basic auth token to decode');
}
