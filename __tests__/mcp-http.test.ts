import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { POST as fullPost, GET as fullGet, DELETE as fullDelete } from '@/app/api/mcp/route';
import { POST as compactPost, GET as compactGet, DELETE as compactDelete } from '@/app/api/mcp/compact/route';
import { LIST_TOOL, PIPELINE_TOOL } from '@/lib/mcp/catalog';

// Exercise the actual HTTP routes with a Streamable HTTP client, including
// the stateless JSON responses and rejected GET stream used by Codex.
describe.each([
  { set: 'full', POST: fullPost, GET: fullGet, DELETE: fullDelete },
  { set: 'compact', POST: compactPost, GET: compactGet, DELETE: compactDelete },
])('MCP HTTP ($set)', ({ set, POST, GET, DELETE }) => {
  const url = new URL(`http://localhost:3000/api/mcp${set === 'compact' ? '/compact' : ''}`);
  let originalEnabled: string | undefined;
  let originalToken: string | undefined;

  beforeEach(() => {
    originalEnabled = process.env.DEVOVEN_MCP;
    originalToken = process.env.DEVOVEN_MCP_TOKEN;
    process.env.DEVOVEN_MCP = 'on';
    delete process.env.DEVOVEN_MCP_TOKEN;
  });

  afterEach(() => {
    if (originalEnabled === undefined) delete process.env.DEVOVEN_MCP;
    else process.env.DEVOVEN_MCP = originalEnabled;
    if (originalToken === undefined) delete process.env.DEVOVEN_MCP_TOKEN;
    else process.env.DEVOVEN_MCP_TOKEN = originalToken;
  });

  it.each([false, true])('initializes, discovers tools and runs a pipeline (bearer token: %s)', async (authenticated) => {
    if (authenticated) process.env.DEVOVEN_MCP_TOKEN = 'test-token';
    const transport = new StreamableHTTPClientTransport(url, {
      requestInit: authenticated ? { headers: { Authorization: 'Bearer test-token' } } : undefined,
      fetch: async (input, init) => {
        const request = new Request(input, init);
        if (request.method === 'GET') return GET(request);
        if (request.method === 'DELETE') return DELETE(request);
        const response = await POST(request);
        expect(response.headers.get('mcp-session-id')).toBeNull();
        return response;
      },
    });
    const client = new Client({ name: 'http-compatibility-test', version: '1' });
    try {
      await client.connect(transport);
      expect(client.getServerVersion()?.name).toBe('devoven');
      const { tools } = await client.listTools();
      if (set === 'compact') {
        expect(tools.map((tool) => tool.name)).toEqual([LIST_TOOL, PIPELINE_TOOL]);
        const listed = await client.callTool({ name: LIST_TOOL, arguments: { search: 'base64-decode' } });
        expect(listed.content).toEqual([{ type: 'text', text: expect.stringContaining('base64-decode') }]);
      } else {
        expect(tools.some((tool) => tool.name === 'base64-decode')).toBe(true);
      }
      const result = await client.callTool({
        name: PIPELINE_TOOL,
        arguments: { input: 'aGVsbG8=', blocks: [{ operation: 'base64-decode' }, { operation: 'url-encode' }] },
      });
      expect(result.isError).toBe(false);
      expect(result.content).toEqual([{ type: 'text', text: 'hello' }]);
    } finally {
      await client.close();
    }
  });

  it('rejects missing or incorrect bearer tokens on every method', async () => {
    process.env.DEVOVEN_MCP_TOKEN = 'test-token';
    for (const authorization of [undefined, 'Bearer wrong-token']) {
      for (const method of ['POST', 'GET', 'DELETE']) {
        const request = new Request(url, { method, headers: authorization ? { Authorization: authorization } : {} });
        const response = method === 'POST' ? await POST(request) : method === 'GET' ? GET(request) : DELETE(request);
        expect(response.status).toBe(401);
        expect(response.headers.get('WWW-Authenticate')).toBe('Bearer');
      }
    }
  });

  it('returns 404 when disabled and 405 for unsupported methods when enabled', async () => {
    delete process.env.DEVOVEN_MCP;
    expect((await POST(new Request(url, { method: 'POST' }))).status).toBe(404);
    expect(GET(new Request(url)).status).toBe(404);
    process.env.DEVOVEN_MCP = 'on';
    for (const method of ['GET', 'DELETE']) {
      const request = new Request(url, { method });
      const response = method === 'GET' ? GET(request) : DELETE(request);
      expect(response.status).toBe(405);
      expect(response.headers.get('Allow')).toBe('POST');
    }
  });
});
