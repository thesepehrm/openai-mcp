import { describe, it, expect } from "vitest";
import { verifyS256 } from "@/lib/oauth/pkce";
import { createHash, randomBytes } from "crypto";

function makeChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

describe("PKCE S256", () => {
  it("verifies a correct verifier/challenge pair", () => {
    const verifier = randomBytes(32).toString("base64url");
    const challenge = makeChallenge(verifier);
    expect(verifyS256(verifier, challenge)).toBe(true);
  });

  it("rejects a wrong verifier", () => {
    const verifier = randomBytes(32).toString("base64url");
    const challenge = makeChallenge(verifier);
    expect(verifyS256("wrong-verifier", challenge)).toBe(false);
  });

  it("rejects an empty verifier", () => {
    const challenge = makeChallenge("real");
    expect(verifyS256("", challenge)).toBe(false);
  });
});
