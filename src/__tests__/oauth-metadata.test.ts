import { describe, it, expect, beforeEach } from "vitest";
import {
  getProtectedResourceMetadata,
  getAuthorizationServerMetadata,
} from "@/lib/oauth/metadata";

beforeEach(() => {
  process.env.APP_URL = "https://mcp.example.com";
  process.env.JWT_SECRET = Buffer.alloc(32, 0x01).toString("base64");
  process.env.MASTER_ENC_KEY = Buffer.alloc(32, 0x42).toString("base64");
  process.env.SESSION_SECRET = "test-session-secret-that-is-long-enough";
});

describe("protected resource metadata", () => {
  it("sets resource to APP_URL/mcp", () => {
    const m = getProtectedResourceMetadata();
    expect(m.resource).toBe("https://mcp.example.com/mcp");
  });

  it("lists APP_URL as authorization server", () => {
    const m = getProtectedResourceMetadata();
    expect(m.authorization_servers).toContain("https://mcp.example.com");
  });
});

describe("authorization server metadata", () => {
  it("issuer matches APP_URL", () => {
    const m = getAuthorizationServerMetadata();
    expect(m.issuer).toBe("https://mcp.example.com");
  });

  it("includes required endpoints", () => {
    const m = getAuthorizationServerMetadata();
    expect(m.authorization_endpoint).toContain("/oauth/authorize");
    expect(m.token_endpoint).toContain("/oauth/token");
    expect(m.registration_endpoint).toContain("/oauth/register");
  });

  it("supports S256 PKCE only", () => {
    const m = getAuthorizationServerMetadata();
    expect(m.code_challenge_methods_supported).toEqual(["S256"]);
  });

  it("supports authorization_code and refresh_token grants", () => {
    const m = getAuthorizationServerMetadata();
    expect(m.grant_types_supported).toContain("authorization_code");
    expect(m.grant_types_supported).toContain("refresh_token");
  });
});
