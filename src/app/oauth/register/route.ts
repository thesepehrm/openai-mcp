import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { registerClient } from "@/lib/oauth/dcr";

const schema = z.object({
  redirect_uris: z.array(z.string().url()).min(1),
  client_name: z.string().optional(),
  token_endpoint_auth_method: z
    .enum(["none", "client_secret_basic"])
    .optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_client_metadata",
        error_description: "redirect_uris required and must be valid URLs",
      },
      { status: 400 },
    );
  }

  const client = registerClient(parsed.data);
  return NextResponse.json(client, { status: 201 });
}
