import { NextResponse } from "next/server";
import { listIssues } from "../../../lib/queries";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const repoId = searchParams.get("repoId");

  if (!repoId) {
    return NextResponse.json({ error: "repoId is required" }, { status: 400 });
  }

  const items = await listIssues(repoId);
  return NextResponse.json({ items });
}
