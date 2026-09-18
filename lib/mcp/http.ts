import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createMcpServer } from './server';
import { ToolSet } from './catalog';
import { mcpAuthorized, mcpEnabled } from './access';

/**
 * The HTTP side of the MCP server, shared by the two routes that expose it
 * (`/api/mcp` with every operation as a tool, `/api/mcp/compact` with two).
 * Off unless DEVOVEN_MCP=on, so the hosted site never serves it; see the
 * "MCP server" section of the README.
 */

function refused(request: Request): Response | null {
  if (!mcpEnabled(process.env)) {
    return Response.json(
      { error: 'The MCP server is off on this instance. Set DEVOVEN_MCP=on to enable it.' },
      { status: 404 },
    );
  }
  if (!mcpAuthorized(process.env, request.headers.get('authorization'))) {
    return Response.json(
      { error: 'This instance requires a bearer token (DEVOVEN_MCP_TOKEN).' },
      { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } },
    );
  }
  return null;
}

export async function handleMcpPost(request: Request, set: ToolSet): Promise<Response> {
  const denied = refused(request);
  if (denied) return denied;

  const server = createMcpServer(set);
  // Stateless: no session id, and each call is answered with a plain JSON body
  // rather than an SSE stream. Both are what an endpoint on a serverless
  // platform can promise, and tool calls here finish in milliseconds anyway.
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  try {
    return await transport.handleRequest(request);
  } finally {
    await transport.close();
  }
}

/**
 * Without sessions there is no stream for the server to push notifications
 * down and no session to delete, so GET and DELETE are refused outright rather
 * than left hanging.
 */
export function handleMcpOther(request: Request): Response {
  const denied = refused(request);
  if (denied) return denied;
  return Response.json(
    { error: 'This server is stateless: send JSON-RPC messages with POST.' },
    { status: 405, headers: { Allow: 'POST' } },
  );
}
