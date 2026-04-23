import { NextRequest } from "next/server";
import { verifyAccessToken } from "./tokens";
import { getEnv } from "../env";

export async function validateBearer(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  try {
    const { APP_URL } = getEnv();
    return await verifyAccessToken(token, `${APP_URL}/mcp`);
  } catch {
    return null;
  }
}
