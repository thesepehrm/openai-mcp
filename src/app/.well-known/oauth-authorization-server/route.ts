import { NextResponse } from "next/server";
import { getAuthorizationServerMetadata } from "@/lib/oauth/metadata";

export function GET() {
  return NextResponse.json(getAuthorizationServerMetadata());
}
