import { SignJWT, jwtVerify } from "jose";
import { createHash, randomBytes } from "crypto";
import { getDb } from "../db";
import { getEnv } from "../env";

const ACCESS_TOKEN_TTL = 60 * 60; // 1 hour
const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30; // 30 days

export async function signAccessToken(payload: {
  sub: string;
  clientId: string;
  resource: string;
  scope?: string;
}): Promise<string> {
  const { JWT_SECRET, APP_URL } = getEnv();
  return new SignJWT({
    client_id: payload.clientId,
    scope: payload.scope ?? "openai:images",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setAudience(payload.resource)
    .setIssuer(APP_URL)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL}s`)
    .sign(JWT_SECRET);
}

export async function verifyAccessToken(
  token: string,
  expectedAudience: string,
) {
  const { JWT_SECRET, APP_URL } = getEnv();
  const { payload } = await jwtVerify(token, JWT_SECRET, {
    issuer: APP_URL,
    audience: expectedAudience,
  });
  return payload as {
    sub: string;
    client_id: string;
    scope: string;
    aud: string;
    exp: number;
  };
}

export function issueRefreshToken(params: {
  clientId: string;
  userId: string;
  resource: string;
  scope?: string;
}): string {
  const db = getDb();
  const token = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(token).digest("hex");
  const expiresAt = Date.now() + REFRESH_TOKEN_TTL * 1000;

  db.prepare(
    `INSERT INTO oauth_refresh_tokens (token_hash, client_id, user_id, resource, scope, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    hash,
    params.clientId,
    params.userId,
    params.resource,
    params.scope ?? "openai:images",
    expiresAt,
  );

  return token;
}

export function rotateRefreshToken(
  oldToken: string,
  params: {
    clientId: string;
    userId: string;
    resource: string;
    scope?: string;
  },
): string | null {
  const db = getDb();
  const oldHash = createHash("sha256").update(oldToken).digest("hex");
  const row = db
    .prepare(
      `SELECT * FROM oauth_refresh_tokens WHERE token_hash = ? AND client_id = ?`,
    )
    .get(oldHash, params.clientId) as
    | { user_id: string; resource: string; expires_at: number }
    | undefined;

  if (!row || row.expires_at < Date.now()) return null;

  db.prepare(`DELETE FROM oauth_refresh_tokens WHERE token_hash = ?`).run(
    oldHash,
  );

  return issueRefreshToken(params);
}
