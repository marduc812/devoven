import { handleMcpOther, handleMcpPost } from '@/lib/mcp/http';

// The same server with two tools, list-operations and run-pipeline, for MCP
// clients that cap how many tools a server may offer.

export const dynamic = 'force-dynamic';

export function POST(request: Request): Promise<Response> {
  return handleMcpPost(request, 'compact');
}

export { handleMcpOther as GET, handleMcpOther as DELETE };
