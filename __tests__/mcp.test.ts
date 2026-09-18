import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { OPERATIONS } from '@/lib/blocks/registry';
import { mcpAuthorized, mcpEnabled } from '@/lib/mcp/access';
import { callTool, callableOperations, describeLine, listOperations, mcpTools, operationSchema, pipelineOperations, LIST_TOOL, PIPELINE_TOOL, MAX_INPUT_LENGTH } from '@/lib/mcp/catalog';
import { createMcpServer } from '@/lib/mcp/server';

const MCP_TOOL_NAME = /^[A-Za-z0-9_-]{1,64}$/;

describe('MCP gate', () => {
  it('is off unless DEVOVEN_MCP opts in', () => {
    expect(mcpEnabled({})).toBe(false);
    expect(mcpEnabled({ DEVOVEN_MCP: '' })).toBe(false);
    expect(mcpEnabled({ DEVOVEN_MCP: 'off' })).toBe(false);
    expect(mcpEnabled({ DEVOVEN_MCP: 'on' })).toBe(true);
    expect(mcpEnabled({ DEVOVEN_MCP: 'TRUE' })).toBe(true);
    expect(mcpEnabled({ DEVOVEN_MCP: '1' })).toBe(true);
  });

  it('lets everyone in when no token is set', () => {
    expect(mcpAuthorized({}, null)).toBe(true);
    expect(mcpAuthorized({ DEVOVEN_MCP_TOKEN: '' }, null)).toBe(true);
  });

  it('demands the bearer token when one is set', () => {
    const env = { DEVOVEN_MCP_TOKEN: 's3cret' };
    expect(mcpAuthorized(env, null)).toBe(false);
    expect(mcpAuthorized(env, 'Bearer wrong')).toBe(false);
    expect(mcpAuthorized(env, 'Bearer s3cre')).toBe(false);
    expect(mcpAuthorized(env, 's3cret')).toBe(false);
    expect(mcpAuthorized(env, 'Bearer s3cret')).toBe(true);
    expect(mcpAuthorized(env, 'bearer s3cret')).toBe(true);
  });
});

describe('MCP catalog', () => {
  const tools = mcpTools();

  it('exposes every value-transforming operation and the pipeline tool', () => {
    const names = new Set(tools.map((t) => t.name));
    expect(names.has(PIPELINE_TOOL)).toBe(true);
    for (const op of OPERATIONS) {
      const wanted = !op.control && (op.output ?? 'text') === 'text';
      expect(names.has(op.id)).toBe(wanted);
    }
    expect(tools.length).toBe(callableOperations().length + 1);
  });

  it('uses names every MCP client accepts, with no duplicates', () => {
    const names = tools.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names.filter((n) => !MCP_TOOL_NAME.test(n))).toEqual([]);
  });

  it('turns params into schema properties and selects into enums', () => {
    const schema = operationSchema(OPERATIONS.find((op) => op.id === 'base64-encode')!);
    expect(schema.required).toEqual(['input']);
    expect(schema.properties.encoding).toMatchObject({
      type: 'string',
      enum: ['utf-8', 'utf16le', 'ascii', 'hex'],
      default: 'utf-8',
    });
  });

  it('gives a multi-input operation one required property per field', () => {
    const schema = operationSchema(OPERATIONS.find((op) => op.id === 'hmac-sha256')!);
    expect(schema.required).toEqual(['message', 'key']);
    expect(schema.properties.input).toBeUndefined();
  });

  it('never lets a field share a name with the input property', () => {
    const bad = callableOperations().filter((op) => op.params.some((p) => p.id === 'input'));
    expect(bad.map((op) => op.id)).toEqual([]);
  });
});

describe('MCP tool calls', () => {
  it('runs a plain operation', () => {
    expect(callTool('base64-encode', { input: 'hello' })).toEqual({ text: 'aGVsbG8=', isError: false });
    expect(callTool('sha256', { input: 'abc' })).toEqual({
      text: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      isError: false,
    });
  });

  it('honours params and defaults', () => {
    expect(callTool('base64-decode', { input: 'aGVsbG8=' }).text).toBe('hello');
    expect(callTool('base64-decode', { input: 'aGVsbG8=', encoding: 'hex' }).text).toBe('68656c6c6f');
  });

  it('rejects a select value outside its options instead of guessing', () => {
    const out = callTool('base64-decode', { input: 'aGVsbG8=', encoding: 'latin1' });
    expect(out.isError).toBe(true);
    expect(out.text).toMatch(/"encoding" must be one of: utf-8/);
  });

  it('runs a multi-input operation from its fields', () => {
    const out = callTool('hmac-sha256', { message: 'The quick brown fox jumps over the lazy dog', key: 'key' });
    expect(out).toEqual({ text: 'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8', isError: false });
  });

  it('returns an operation failure as an error outcome, not a throw', () => {
    const out = callTool('json-format', { input: '{not json' });
    expect(out.isError).toBe(true);
    expect(out.text.length).toBeGreaterThan(0);
  });

  it('refuses unknown, flow and image tools', () => {
    expect(callTool('no-such-tool', { input: 'x' }).isError).toBe(true);
    expect(callTool('each-line', { input: 'x' }).isError).toBe(true);
    expect(callTool('qr-code', { input: 'x' }).isError).toBe(true);
  });

  it('caps the input size', () => {
    const out = callTool('sha256', { input: 'a'.repeat(MAX_INPUT_LENGTH + 1) });
    expect(out.isError).toBe(true);
    expect(out.text).toMatch(/Input too long/);
  });

  it('decodes HTML entities without a DOM', () => {
    expect(callTool('html-decode', { input: '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&#x41;&lt;/a&gt;' }).text)
      .toBe('<a href="x">&\'A</a>');
  });
});

describe('run-pipeline', () => {
  it('chains blocks and returns the last output', () => {
    const out = callTool(PIPELINE_TOOL, {
      input: 'hello',
      blocks: [{ operation: 'base64-encode' }, { operation: 'sha256' }],
    });
    expect(out).toEqual({ text: callTool('sha256', { input: 'aGVsbG8=' }).text, isError: false });
  });

  it('feeds a multi-input block through its linked field', () => {
    const out = callTool(PIPELINE_TOOL, {
      input: 'The quick brown fox jumps over the lazy dog',
      blocks: [{ operation: 'hmac-sha256', params: { key: 'key' } }],
    });
    expect(out.text).toBe('f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8');
  });

  it('runs flow blocks', () => {
    const out = callTool(PIPELINE_TOOL, {
      input: 'a\nb',
      blocks: [{ operation: 'each-line' }, { operation: 'base64-encode' }, { operation: 'collect', params: { by: 'comma' } }],
    });
    expect(out).toEqual({ text: 'YQ==,Yg==', isError: false });
  });

  it('names the block that failed', () => {
    const out = callTool(PIPELINE_TOOL, {
      input: 'hello',
      blocks: [{ operation: 'base64-encode' }, { operation: 'json-format' }],
    });
    expect(out.isError).toBe(true);
    expect(out.text).toMatch(/^Block 2 \(JSON Formatter\)/);
  });

  it('rejects an unknown operation and a bad linked field', () => {
    expect(callTool(PIPELINE_TOOL, { input: 'x', blocks: [{ operation: 'nope' }] }).text).toMatch(/unknown operation "nope"/);
    const bad = callTool(PIPELINE_TOOL, { input: 'x', blocks: [{ operation: 'hmac-sha256', linked: 'salt' }] });
    expect(bad.text).toMatch(/"linked" must be null or one of: message, key/);
  });

  it('rejects an empty or missing block list', () => {
    expect(callTool(PIPELINE_TOOL, { input: 'x', blocks: [] }).isError).toBe(true);
    expect(callTool(PIPELINE_TOOL, { input: 'x' }).isError).toBe(true);
  });
});

describe('compact tool set', () => {
  it('offers only the catalogue and the pipeline runner', () => {
    expect(mcpTools('compact').map((t) => t.name)).toEqual([LIST_TOOL, PIPELINE_TOOL]);
  });

  it('still runs any operation through a one-block pipeline', () => {
    const out = callTool(PIPELINE_TOOL, { input: 'hello', blocks: [{ operation: 'base64-encode' }] }, 'compact');
    expect(out).toEqual({ text: 'aGVsbG8=', isError: false });
  });

  it('refuses a direct operation call and points at the two tools', () => {
    const out = callTool('sha256', { input: 'x' }, 'compact');
    expect(out.isError).toBe(true);
    expect(out.text).toMatch(/list-operations and run-pipeline/);
  });

  it('lists every pipeline operation, flow blocks included, one per line', () => {
    const lines = listOperations({}).split('\n');
    expect(lines.length).toBe(pipelineOperations().length);
    expect(lines).toContain(describeLine(OPERATIONS.find((op) => op.id === 'each-line')!));
    expect(lines.some((l) => l.startsWith('qr-code '))).toBe(false);
  });

  it('describes settings and fields on the line', () => {
    expect(describeLine(OPERATIONS.find((op) => op.id === 'base64-encode')!))
      .toBe('base64-encode — Base64 Encode (encoding) [encoding: utf-8|utf16le|ascii|hex (default utf-8)]');
    expect(describeLine(OPERATIONS.find((op) => op.id === 'hmac-sha256')!)).toMatch(/\[fields: message, key\]/);
  });

  it('filters by category and by search', () => {
    const hashing = listOperations({ category: 'hashing' }).split('\n');
    expect(hashing.every((l) => l.includes('(hashing)'))).toBe(true);
    expect(hashing.length).toBe(pipelineOperations().filter((op) => op.category === 'hashing').length);
    const base64 = listOperations({ search: 'BASE64' }).split('\n');
    expect(base64.length).toBeGreaterThan(1);
    expect(base64.every((l) => l.toLowerCase().includes('base64'))).toBe(true);
    expect(listOperations({ search: 'zzzz-nothing' })).toBe('No operations match.');
    expect(callTool(LIST_TOOL, { category: 'nope' }, 'compact').text).toMatch(/"category" must be one of/);
  });
});

describe('MCP server over a transport', () => {
  async function connect(set: 'full' | 'compact' = 'full') {
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    const server = createMcpServer(set);
    await server.connect(serverSide);
    const client = new Client({ name: 'test', version: '0' });
    await client.connect(clientSide);
    return { client, server };
  }

  it('lists the tools', async () => {
    const { client, server } = await connect();
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name)).toEqual(mcpTools().map((t) => t.name));
    expect(tools.find((t) => t.name === 'sha256')?.inputSchema).toMatchObject({ type: 'object', required: ['input'] });
    await client.close();
    await server.close();
  });

  it('calls a tool and reports errors as tool errors', async () => {
    const { client, server } = await connect();
    const ok = await client.callTool({ name: 'url-encode', arguments: { input: 'a b&c' } });
    expect(ok.content).toEqual([{ type: 'text', text: 'a%20b%26c' }]);
    expect(ok.isError).toBeFalsy();

    const bad = await client.callTool({ name: 'base64-decode', arguments: { input: 'aGVsbG8=', encoding: 'nope' } });
    expect(bad.isError).toBe(true);
    await client.close();
    await server.close();
  });

  it('serves the compact set on request', async () => {
    const { client, server } = await connect('compact');
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name)).toEqual([LIST_TOOL, PIPELINE_TOOL]);
    const listed = await client.callTool({ name: LIST_TOOL, arguments: { search: 'sha256' } });
    expect((listed.content as { text: string }[])[0].text).toMatch(/^sha256 — SHA256 \(hashing\)/m);
    await client.close();
    await server.close();
  });
});
