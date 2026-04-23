import { NextRequest, NextResponse } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { validateBearer } from "@/lib/oauth/validate";
import { createMcpServer } from "@/lib/mcp/server";
import { getEnv } from "@/lib/env";

function unauthorizedResponse() {
  const { APP_URL } = getEnv();
  return new NextResponse(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: {
      "Content-Type": "application/json",
      "WWW-Authenticate": `Bearer resource_metadata="${APP_URL}/.well-known/oauth-protected-resource"`,
    },
  });
}

async function handle(req: NextRequest): Promise<Response> {
  const claims = await validateBearer(req);
  if (!claims) return unauthorizedResponse();

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true,
  });

  const server = createMcpServer(claims.sub);
  await server.connect(transport);

  return transport.handleRequest(req);
}

export const POST = handle;
export const DELETE = handle;
