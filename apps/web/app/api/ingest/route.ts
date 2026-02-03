import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";
import { getSession } from "../../../lib/auth";
import { getTokenForUser } from "../../../lib/oauth";
import { runIngestion } from "../../../lib/ingest-runner";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as { owner?: string; name?: string };
  const owner = body?.owner;
  const name = body?.name;

  if (!owner || !name) {
    return NextResponse.json({ error: "owner and name are required" }, { status: 400 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const token = await getTokenForUser(session.githubUserId);
  if (!token) {
    return NextResponse.json({ error: "Missing GitHub token" }, { status: 401 });
  }

  const repoId = `${owner}/${name}`;
  const db = getPool();
  await runIngestion(db, repoId, owner, name, token);

  return NextResponse.json({ repoId });
}
