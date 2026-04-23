import { describe, it, expect } from "vitest";
import {
  signAccessToken,
  verifyAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
} from "@/lib/oauth/tokens";

const RESOURCE = "http://localhost:3000/mcp";

describe("access tokens", () => {
  it("signs and verifies a valid token", async () => {
    const token = await signAccessToken({
      sub: "user-1",
      clientId: "client-1",
      resource: RESOURCE,
    });
    const claims = await verifyAccessToken(token, RESOURCE);
    expect(claims.sub).toBe("user-1");
    expect(claims.client_id).toBe("client-1");
  });

  it("rejects a token with wrong audience", async () => {
    const token = await signAccessToken({
      sub: "user-1",
      clientId: "client-1",
      resource: "https://other.example.com/mcp",
    });
    await expect(verifyAccessToken(token, RESOURCE)).rejects.toThrow();
  });

  it("rejects a tampered token", async () => {
    const token = await signAccessToken({
      sub: "user-1",
      clientId: "client-1",
      resource: RESOURCE,
    });
    const tampered = token.slice(0, -4) + "XXXX";
    await expect(verifyAccessToken(tampered, RESOURCE)).rejects.toThrow();
  });
});

describe("refresh tokens", () => {
  it("issues and rotates a refresh token", () => {
    const token = issueRefreshToken({
      clientId: "client-1",
      userId: "user-1",
      resource: RESOURCE,
    });
    expect(token).toBeTruthy();

    const newToken = rotateRefreshToken(token, {
      clientId: "client-1",
      userId: "user-1",
      resource: RESOURCE,
    });
    expect(newToken).toBeTruthy();
    expect(newToken).not.toBe(token);
  });

  it("returns null when rotating an already-rotated token", () => {
    const token = issueRefreshToken({
      clientId: "client-1",
      userId: "user-1",
      resource: RESOURCE,
    });
    rotateRefreshToken(token, {
      clientId: "client-1",
      userId: "user-1",
      resource: RESOURCE,
    });
    const result = rotateRefreshToken(token, {
      clientId: "client-1",
      userId: "user-1",
      resource: RESOURCE,
    });
    expect(result).toBeNull();
  });

  it("returns null for unknown token", () => {
    expect(
      rotateRefreshToken("nonexistent-token", {
        clientId: "client-1",
        userId: "user-1",
        resource: RESOURCE,
      }),
    ).toBeNull();
  });
});
