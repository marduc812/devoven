import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { callTool, mcpTools, ToolSet } from './catalog';

const INSTRUCTIONS =
  'DevOven exposes its text tools over MCP: encoders, hashes, ciphers, converters, formatters, ' +
  'text utilities and network helpers. Each tool takes strings and returns a string. ' +
  'Chain several with run-pipeline. Binary values travel as Base64 or hex, as each tool\'s "as" and "source" settings say.';

const COMPACT_INSTRUCTIONS =
  'DevOven exposes its text tools over MCP through two tools: list-operations shows every operation ' +
  '(encoders, hashes, ciphers, converters, formatters, text and network helpers) with its id and settings, ' +
  'and run-pipeline runs one or more of them in a row, each block feeding the next. ' +
  'To run a single operation, send a one-block pipeline. Binary values travel as Base64 or hex.';

/**
 * A fresh, stateless server. The route handler makes one per request, which
 * is what keeps the endpoint working on a platform that runs each request on
 * whichever instance is free.
 */
export function createMcpServer(set: ToolSet = 'full'): Server {
  const server = new Server(
    { name: 'devoven', version: process.env.NEXT_PUBLIC_BUILD_VERSION ?? 'dev' },
    {
      capabilities: { tools: { listChanged: false } },
      instructions: set === 'compact' ? COMPACT_INSTRUCTIONS : INSTRUCTIONS,
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: mcpTools(set) }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { text, isError } = callTool(request.params.name, request.params.arguments, set);
    return { content: [{ type: 'text', text }], isError };
  });

  return server;
}
