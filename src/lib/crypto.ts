import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { getEnv } from "./env";

const ALGORITHM = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

export interface Encrypted {
  ciphertext: Buffer;
  iv: Buffer;
  authTag: Buffer;
}

export function encrypt(plaintext: string): Encrypted {
  const key = getEnv().MASTER_ENC_KEY;
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return { ciphertext, iv, authTag };
}

export function decrypt(enc: Encrypted): string {
  const key = getEnv().MASTER_ENC_KEY;
  const decipher = createDecipheriv(ALGORITHM, key, enc.iv);
  decipher.setAuthTag(enc.authTag);
  return (
    decipher.update(enc.ciphertext).toString("utf8") + decipher.final("utf8")
  );
}
