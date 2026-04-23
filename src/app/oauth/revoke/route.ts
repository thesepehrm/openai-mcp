import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const ct = req.headers.get("content-type") ?? "";
  let token: string | null = null;

  if (ct.includes("application/json")) {
    const body = (await req.json()) as { token?: string };
    token = body.token ?? null;
  } else {
    const form = await req.formData();
    token = (form.get("token") as string) ?? null;
  }

  if (token) {
    const hash = createHash("sha256").update(token).digest("hex");
    const db = getDb();
    db.prepare(`DELETE FROM oauth_refresh_tokens WHERE token_hash = ?`).run(
      hash,
    );
  }

  // Always 200 per RFC 7009
  return NextResponse.json({ ok: true });
}
