import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";
import { getEnv } from "./env";

export interface SessionData {
  userId?: string;
  email?: string;
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const env = getEnv();
  return getIronSession<SessionData>(await cookies(), {
    password: env.SESSION_SECRET,
    cookieName: "gpt_mcp_session",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  });
}
