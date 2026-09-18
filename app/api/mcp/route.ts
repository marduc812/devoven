import { handleMcpOther, handleMcpPost } from '@/lib/mcp/http';

// One MCP tool per blocks operation. See lib/mcp/http.ts and the README.

export const dynamic = 'force-dynamic';

export function POST(request: Request): Promise<Response> {
  return handleMcpPost(request, 'full');
}

export { handleMcpOther as GET, handleMcpOther as DELETE };
