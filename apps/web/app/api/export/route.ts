import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

type ExportRow = {
  type: "ISSUE" | "PR" | "DISCUSSION";
  payload: unknown;
  updated_at: string;
};

async function loadAll(repoId: string): Promise<ExportRow[]> {
  const pool = getPool();
  const issues = await pool.query(
    `
    SELECT 'ISSUE'::text AS type, raw_payload AS payload, updated_at
    FROM github_issues
    WHERE repo_id = $1
    `,
    [repoId],
  );
  const prs = await pool.query(
    `
    SELECT 'PR'::text AS type, raw_payload AS payload, updated_at
    FROM github_pull_requests
    WHERE repo_id = $1
    `,
    [repoId],
  );
  const discussions = await pool.query(
    `
    SELECT 'DISCUSSION'::text AS type, raw_payload AS payload, updated_at
    FROM github_discussions
    WHERE repo_id = $1
    `,
    [repoId],
  );

  return [...issues.rows, ...prs.rows, ...discussions.rows] as ExportRow[];
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const repoId = searchParams.get("repoId");

  if (!repoId) {
    return NextResponse.json({ error: "repoId is required" }, { status: 400 });
  }

  const rows = await loadAll(repoId);
  rows.sort((a, b) => Date.parse(a.updated_at) - Date.parse(b.updated_at));

  const lines: string[] = [];
  lines.push(`# Repo Export: ${repoId}`);
  lines.push(`# Generated: ${new Date().toISOString()}`);
  lines.push("");

  for (const row of rows) {
    lines.push(`## ${row.type}`);
    lines.push(JSON.stringify(row.payload, null, 2));
    lines.push("");
  }

  const body = lines.join("\n");
  const filename = `repo-${repoId}-export.txt`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${filename}\"`,
    },
  });
}
