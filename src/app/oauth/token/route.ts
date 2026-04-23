import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getClient } from "@/lib/oauth/dcr";
import { getDb } from "@/lib/db";
import { verifyS256 } from "@/lib/oauth/pkce";
import {
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
} from "@/lib/oauth/tokens";
import { getEnv } from "@/lib/env";

function parseBody(req: NextRequest) {
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return req.json();
  return req.formData().then((f) => Object.fromEntries(f.entries()));
}

export async function POST(req: NextRequest) {
  const { APP_URL } = getEnv();
  const body = (await parseBody(req)) as Record<string, string>;

  const grantType = body.grant_type;
  const resource = body.resource;

  if (resource && resource !== `${APP_URL}/mcp`) {
    return error("invalid_target", "resource must be the MCP server URI");
  }

  if (grantType === "authorization_code") {
    const { code, redirect_uri, client_id, code_verifier } = body;
    if (!code || !redirect_uri || !client_id || !code_verifier) {
      return error("invalid_request", "Missing required params");
    }

    const client = getClient(client_id);
    if (!client) return error("invalid_client");

    const db = getDb();
    const row = db
      .prepare(`SELECT * FROM oauth_codes WHERE code = ?`)
      .get(code) as
      | {
          client_id: string;
          user_id: string;
          redirect_uri: string;
          code_challenge: string;
          code_challenge_method: string;
          resource: string;
          scope: string | null;
          expires_at: number;
        }
      | undefined;

    if (!row) return error("invalid_grant", "Code not found");
    if (row.expires_at < Date.now()) {
      db.prepare(`DELETE FROM oauth_codes WHERE code = ?`).run(code);
      return error("invalid_grant", "Code expired");
    }
    if (row.client_id !== client_id) return error("invalid_grant");
    if (row.redirect_uri !== redirect_uri)
      return error("invalid_grant", "redirect_uri mismatch");
    if (!verifyS256(code_verifier, row.code_challenge)) {
      return error("invalid_grant", "PKCE verification failed");
    }

    db.prepare(`DELETE FROM oauth_codes WHERE code = ?`).run(code);

    const effectiveResource = row.resource;
    const accessToken = await signAccessToken({
      sub: row.user_id,
      clientId: client_id,
      resource: effectiveResource,
      scope: row.scope ?? undefined,
    });
    const refreshToken = issueRefreshToken({
      clientId: client_id,
      userId: row.user_id,
      resource: effectiveResource,
      scope: row.scope ?? undefined,
    });

    return NextResponse.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: refreshToken,
      scope: row.scope ?? "openai:images",
    });
  }

  if (grantType === "refresh_token") {
    const { refresh_token, client_id } = body;
    if (!refresh_token || !client_id) {
      return error("invalid_request", "Missing required params");
    }

    const client = getClient(client_id);
    if (!client) return error("invalid_client");

    const db = getDb();
    const oldHash = createHash("sha256").update(refresh_token).digest("hex");
    const row = db
      .prepare(`SELECT * FROM oauth_refresh_tokens WHERE token_hash = ?`)
      .get(oldHash) as
      | {
          client_id: string;
          user_id: string;
          resource: string;
          scope: string | null;
          expires_at: number;
        }
      | undefined;

    if (!row || row.client_id !== client_id) return error("invalid_grant");
    if (row.expires_at < Date.now()) {
      db.prepare(`DELETE FROM oauth_refresh_tokens WHERE token_hash = ?`).run(
        oldHash,
      );
      return error("invalid_grant", "Refresh token expired");
    }

    const newRefresh = rotateRefreshToken(refresh_token, {
      clientId: client_id,
      userId: row.user_id,
      resource: row.resource,
      scope: row.scope ?? undefined,
    });
    if (!newRefresh) return error("invalid_grant", "Token rotation failed");

    const accessToken = await signAccessToken({
      sub: row.user_id,
      clientId: client_id,
      resource: row.resource,
      scope: row.scope ?? undefined,
    });

    return NextResponse.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: newRefresh,
      scope: row.scope ?? "openai:images",
    });
  }

  return error("unsupported_grant_type");
}

function error(code: string, description?: string) {
  return NextResponse.json(
    { error: code, ...(description ? { error_description: description } : {}) },
    { status: 400 },
  );
}
