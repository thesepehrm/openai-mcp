import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createUser, verifyUser } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { getEnv } from "@/lib/env";

const credSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  action: z.enum(["signup", "login"]),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = credSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { email, password, action } = parsed.data;

  if (action === "signup") {
    const { ALLOW_SIGNUP } = getEnv();
    if (!ALLOW_SIGNUP) {
      return NextResponse.json(
        { error: "Signups are disabled" },
        { status: 403 },
      );
    }
    try {
      const user = await createUser(email, password);
      const session = await getSession();
      session.userId = user.id;
      session.email = user.email;
      await session.save();
      return NextResponse.json({ ok: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("UNIQUE")) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 409 },
        );
      }
      console.error("signup error", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  }

  try {
    const user = await verifyUser(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const session = await getSession();
    session.userId = user.id;
    session.email = user.email;
    await session.save();
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("login error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
