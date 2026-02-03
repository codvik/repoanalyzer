import { NextResponse } from "next/server";
import { listPullRequests } from "../../../lib/queries";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const repoId = searchParams.get("repoId");

  if (!repoId) {
    return NextResponse.json({ error: "repoId is required" }, { status: 400 });
  }

  const items = await listPullRequests(repoId);
  return NextResponse.json({ items });
}
