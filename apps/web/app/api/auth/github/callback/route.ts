import { NextResponse } from "next/server";
import { exchangeCodeForToken, fetchGitHubUser, storeToken, createSession } from "../../../../../lib/oauth";
import { setSessionCookie } from "../../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const token = await exchangeCodeForToken(code);
  const user = await fetchGitHubUser(token);
  await storeToken(user.id, user.login, token);
  const sessionId = await createSession(user.id);
  setSessionCookie(sessionId);

  const baseUrl = process.env.APP_BASE_URL ?? request.url;
  return NextResponse.redirect(new URL("/", baseUrl));
}
