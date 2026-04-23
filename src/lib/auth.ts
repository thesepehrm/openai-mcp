import argon2 from "argon2";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "./db";

export async function createUser(email: string, password: string) {
  const db = getDb();
  const hash = await argon2.hash(password, { type: argon2.argon2id });
  const id = uuidv4();
  db.prepare(
    "INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
  ).run(id, email.toLowerCase().trim(), hash, Date.now());
  const normalised = email.toLowerCase().trim();
  return { id, email: normalised };
}

export async function verifyUser(email: string, password: string) {
  const db = getDb();
  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.toLowerCase().trim()) as
    | { id: string; email: string; password_hash: string }
    | undefined;
  if (!user) return null;
  const valid = await argon2.verify(user.password_hash, password);
  if (!valid) return null;
  return { id: user.id, email: user.email };
}

export function getUserById(id: string) {
  const db = getDb();
  return db
    .prepare("SELECT id, email, created_at FROM users WHERE id = ?")
    .get(id) as { id: string; email: string; created_at: number } | undefined;
}
