import { NextResponse } from "next/server";
import { getProtectedResourceMetadata } from "@/lib/oauth/metadata";

export function GET() {
  return NextResponse.json(getProtectedResourceMetadata());
}
