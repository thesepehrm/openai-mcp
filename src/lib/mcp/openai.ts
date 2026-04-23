import OpenAI from "openai";
import { getDb } from "../db";
import { decrypt } from "../crypto";

export function getOpenAIClient(userId: string): OpenAI {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT ciphertext, iv, auth_tag FROM user_api_keys WHERE user_id = ?`,
    )
    .get(userId) as
    | { ciphertext: Buffer; iv: Buffer; auth_tag: Buffer }
    | undefined;

  if (!row) {
    throw new Error(
      "No API key configured. Visit the dashboard to add your OpenAI API key.",
    );
  }

  const apiKey = decrypt({
    ciphertext: row.ciphertext,
    iv: row.iv,
    authTag: row.auth_tag,
  });

  return new OpenAI({ apiKey });
}
