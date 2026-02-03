import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const repoId = searchParams.get("repoId");

  if (!repoId) {
    return NextResponse.json({ error: "repoId is required" }, { status: 400 });
  }

  const db = getPool();
  const result = await db.query(
    `
    SELECT report_text, created_at
    FROM ai_reports
    WHERE repo_id = $1
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [repoId],
  );

  const row = result.rows[0];
  if (!row) {
    return NextResponse.json({ report: null });
  }

  return NextResponse.json({ report: row.report_text, createdAt: row.created_at });
}
