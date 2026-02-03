import { NextResponse } from "next/server";
import { buildGitHubAuthUrl } from "../../../../lib/oauth";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const url = buildGitHubAuthUrl();
  if (!url) {
    return NextResponse.json({ error: "GITHUB_CLIENT_ID is required" }, { status: 500 });
  }
  return NextResponse.redirect(url);
}
