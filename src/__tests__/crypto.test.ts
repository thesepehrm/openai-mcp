import { describe, it, expect, beforeEach } from "vitest";
import { encrypt, decrypt } from "@/lib/crypto";

beforeEach(() => {
  process.env.MASTER_ENC_KEY = Buffer.alloc(32, 0x42).toString("base64");
  process.env.APP_URL = "http://localhost:3000";
  process.env.JWT_SECRET = Buffer.alloc(32, 0x01).toString("base64");
  process.env.SESSION_SECRET = "test-session-secret-that-is-long-enough";
});

describe("crypto", () => {
  it("encrypts and decrypts a string round-trip", () => {
    const plaintext = "sk-test-api-key-1234567890";
    const enc = encrypt(plaintext);
    expect(enc.ciphertext).toBeInstanceOf(Buffer);
    expect(enc.iv).toHaveLength(12);
    expect(enc.authTag).toHaveLength(16);
    expect(decrypt(enc)).toBe(plaintext);
  });

  it("produces different ciphertext each call (random IV)", () => {
    const plaintext = "same-value";
    const a = encrypt(plaintext);
    const b = encrypt(plaintext);
    expect(a.iv.equals(b.iv)).toBe(false);
    expect(a.ciphertext.equals(b.ciphertext)).toBe(false);
  });

  it("throws on tampered auth tag", () => {
    const enc = encrypt("sensitive");
    enc.authTag[0] ^= 0xff;
    expect(() => decrypt(enc)).toThrow();
  });

  it("throws on tampered ciphertext", () => {
    const enc = encrypt("sensitive");
    enc.ciphertext[0] ^= 0xff;
    expect(() => decrypt(enc)).toThrow();
  });
});
