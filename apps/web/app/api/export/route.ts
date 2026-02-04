import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

async function buildExport(repoId: string): Promise<Record<string, unknown>> {
  const pool = getPool();
  const issues = await pool.query(
    `SELECT issue_id, raw_payload, updated_at FROM github_issues WHERE repo_id = $1 ORDER BY updated_at DESC`,
    [repoId],
  );
  const prs = await pool.query(
    `SELECT pull_request_id, raw_payload, updated_at FROM github_pull_requests WHERE repo_id = $1 ORDER BY updated_at DESC`,
    [repoId],
  );
  const discussions = await pool.query(
    `SELECT discussion_id, raw_payload, updated_at FROM github_discussions WHERE repo_id = $1 ORDER BY updated_at DESC`,
    [repoId],
  );
  const issueComments = await pool.query(
    `SELECT issue_id, raw_payload, updated_at FROM github_issue_comments WHERE repo_id = $1 ORDER BY updated_at ASC`,
    [repoId],
  );
  const prComments = await pool.query(
    `SELECT pull_request_id, raw_payload, updated_at FROM github_pull_request_comments WHERE repo_id = $1 ORDER BY updated_at ASC`,
    [repoId],
  );
  const discussionComments = await pool.query(
    `SELECT discussion_id, raw_payload, updated_at FROM github_discussion_comments WHERE repo_id = $1 ORDER BY updated_at ASC`,
    [repoId],
  );

  return {
    repo_id: repoId,
    generated_at: new Date().toISOString(),
    issues: issues.rows,
    pull_requests: prs.rows,
    discussions: discussions.rows,
    issue_comments: issueComments.rows,
    pull_request_comments: prComments.rows,
    discussion_comments: discussionComments.rows,
  };
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const repoId = searchParams.get("repoId");

  if (!repoId) {
    return NextResponse.json({ error: "repoId is required" }, { status: 400 });
  }

  const exportPayload = await buildExport(repoId);
  const body = JSON.stringify(exportPayload, null, 2);
  const filename = `repo-${repoId}-export.txt`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${filename}\"`,
    },
  });
}
