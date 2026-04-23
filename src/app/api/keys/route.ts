import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { encrypt } from "@/lib/crypto";
import { getDb } from "@/lib/db";

const keySchema = z.object({
  apiKey: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = keySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { ciphertext, iv, authTag } = encrypt(parsed.data.apiKey);
  const db = getDb();
  db.prepare(
    `INSERT INTO user_api_keys (user_id, ciphertext, iv, auth_tag, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       ciphertext = excluded.ciphertext,
       iv = excluded.iv,
       auth_tag = excluded.auth_tag,
       updated_at = excluded.updated_at`,
  ).run(session.userId, ciphertext, iv, authTag, Date.now());

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const row = db
    .prepare(`SELECT updated_at FROM user_api_keys WHERE user_id = ?`)
    .get(session.userId) as { updated_at: number } | undefined;

  return NextResponse.json({
    configured: !!row,
    updatedAt: row?.updated_at ?? null,
  });
}

export async function DELETE() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  db.prepare(`DELETE FROM user_api_keys WHERE user_id = ?`).run(session.userId);
  return NextResponse.json({ ok: true });
}
