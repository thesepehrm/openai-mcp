import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // MCP endpoint: require Bearer, return 401 with WWW-Authenticate if missing
  if (pathname === "/mcp") {
    const auth = req.headers.get("authorization") ?? "";
    if (!auth.startsWith("Bearer ")) {
      const appUrl = process.env.APP_URL ?? req.nextUrl.origin;
      return new NextResponse(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "WWW-Authenticate": `Bearer resource_metadata="${appUrl}/.well-known/oauth-protected-resource"`,
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/mcp"],
};
