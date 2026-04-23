import { createHash } from "crypto";

export function verifyS256(verifier: string, challenge: string): boolean {
  const digest = createHash("sha256").update(verifier).digest("base64url");
  return digest === challenge;
}
