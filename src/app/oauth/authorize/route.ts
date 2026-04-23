import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getClient } from "@/lib/oauth/dcr";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getEnv } from "@/lib/env";

export async function GET(req: NextRequest) {
  const { APP_URL } = getEnv();
  const params = req.nextUrl.searchParams;

  const clientId = params.get("client_id");
  const redirectUri = params.get("redirect_uri");
  const responseType = params.get("response_type");
  const codeChallenge = params.get("code_challenge");
  const codeChallengeMethod = params.get("code_challenge_method");
  const resource = params.get("resource");
  const state = params.get("state");

  // Validate required params
  if (responseType !== "code") {
    return NextResponse.json(
      { error: "unsupported_response_type" },
      { status: 400 },
    );
  }
  if (
    !clientId ||
    !redirectUri ||
    !codeChallenge ||
    codeChallengeMethod !== "S256"
  ) {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "Missing required params or PKCE S256 required",
      },
      { status: 400 },
    );
  }
  if (!resource || resource !== `${APP_URL}/mcp`) {
    return NextResponse.json(
      {
        error: "invalid_target",
        error_description: "resource must be the MCP server URI",
      },
      { status: 400 },
    );
  }

  const client = getClient(clientId);
  if (!client) {
    return NextResponse.json({ error: "invalid_client" }, { status: 400 });
  }
  if (!client.redirect_uris.includes(redirectUri)) {
    return NextResponse.json(
      { error: "invalid_redirect_uri" },
      { status: 400 },
    );
  }

  // Check session
  const session = await getSession();
  if (!session.userId) {
    const next = encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(`${APP_URL}/login?next=${next}`);
  }

  // Show consent page (GET renders HTML form)
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Authorize — GPT Image 2 MCP</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0f0f0f; color: #e5e5e5; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 1rem; }
    .card { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px; padding: 2rem; max-width: 420px; width: 100%; }
    h1 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; }
    .app { font-size: 1rem; color: #a3a3a3; margin-bottom: 1.5rem; }
    .scope { background: #111; border: 1px solid #2a2a2a; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; }
    .scope p { font-size: 0.875rem; color: #a3a3a3; margin-bottom: 0.5rem; }
    .scope ul { list-style: none; }
    .scope li { font-size: 0.875rem; padding: 0.25rem 0; }
    .scope li::before { content: "✓ "; color: #22c55e; }
    .actions { display: flex; gap: 0.75rem; }
    button { flex: 1; padding: 0.625rem 1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 500; cursor: pointer; border: none; }
    .allow { background: #2563eb; color: #fff; }
    .allow:hover { background: #1d4ed8; }
    .deny { background: #2a2a2a; color: #e5e5e5; }
    .deny:hover { background: #333; }
    .user { font-size: 0.75rem; color: #666; margin-bottom: 1.5rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Authorization Request</h1>
    <p class="app">${escapeHtml(client.client_name ?? clientId)} wants to access your GPT Image 2 tools.</p>
    <p class="user">Signed in as <strong>${escapeHtml(session.email ?? "")}</strong></p>
    <div class="scope">
      <p>This will allow:</p>
      <ul>
        <li>Generate images with gpt-image-2</li>
        <li>Edit images with gpt-image-2</li>
      </ul>
    </div>
    <form method="POST">
      <input type="hidden" name="client_id" value="${escapeHtml(clientId)}" />
      <input type="hidden" name="redirect_uri" value="${escapeHtml(redirectUri)}" />
      <input type="hidden" name="code_challenge" value="${escapeHtml(codeChallenge)}" />
      <input type="hidden" name="code_challenge_method" value="S256" />
      <input type="hidden" name="resource" value="${escapeHtml(resource)}" />
      ${state ? `<input type="hidden" name="state" value="${escapeHtml(state)}" />` : ""}
      <div class="actions">
        <button type="submit" name="decision" value="allow" class="allow">Allow</button>
        <button type="submit" name="decision" value="deny" class="deny">Deny</button>
      </div>
    </form>
  </div>
</body>
</html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const decision = form.get("decision");
  const clientId = form.get("client_id") as string;
  const redirectUri = form.get("redirect_uri") as string;
  const codeChallenge = form.get("code_challenge") as string;
  const codeChallengeMethod = form.get("code_challenge_method") as string;
  const resource = form.get("resource") as string;
  const state = form.get("state") as string | null;

  const redirect = new URL(redirectUri);

  if (decision === "deny") {
    redirect.searchParams.set("error", "access_denied");
    if (state) redirect.searchParams.set("state", state);
    return NextResponse.redirect(redirect.toString(), { status: 303 });
  }

  // Issue auth code
  const code = randomBytes(32).toString("base64url");
  const db = getDb();
  db.prepare(
    `INSERT INTO oauth_codes (code, client_id, user_id, redirect_uri, code_challenge, code_challenge_method, resource, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    code,
    clientId,
    session.userId,
    redirectUri,
    codeChallenge,
    codeChallengeMethod,
    resource,
    Date.now() + 5 * 60 * 1000, // 5 min
  );

  redirect.searchParams.set("code", code);
  if (state) redirect.searchParams.set("state", state);
  return NextResponse.redirect(redirect.toString(), { status: 303 });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
