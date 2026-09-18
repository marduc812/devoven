/**
 * Who may reach the MCP endpoint.
 *
 * The server is off unless the instance opts in, because the hosted site on
 * Vercel must not become free compute for every agent on the internet. A
 * self-hosted checkout sets DEVOVEN_MCP=on and, if the instance is reachable
 * by anyone but its owner, DEVOVEN_MCP_TOKEN as well.
 */

type Env = Record<string, string | undefined>;

const ON = new Set(['on', '1', 'true', 'yes']);

export function mcpEnabled(env: Env): boolean {
  return ON.has((env.DEVOVEN_MCP ?? '').trim().toLowerCase());
}

/**
 * Whether a request may use the server. With no token configured every
 * request passes, which is right for a checkout on localhost. With one set,
 * the request must carry it as a bearer token.
 */
export function mcpAuthorized(env: Env, authorization: string | null): boolean {
  const token = (env.DEVOVEN_MCP_TOKEN ?? '').trim();
  if (token === '') return true;
  if (!authorization) return false;
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  if (!match) return false;
  return timingSafeEqual(match[1].trim(), token);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
