import { NextResponse } from "next/server";
import { getSession } from "../../../lib/auth";
import { getPool } from "../../../lib/db";

export async function GET(): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  const pool = getPool();
  const result = await pool.query(
    `
    SELECT github_user_id, login
    FROM github_oauth_tokens
    WHERE github_user_id = $1
    `,
    [session.githubUserId],
  );

  const row = result.rows[0];
  return NextResponse.json({
    authenticated: true,
    githubUserId: session.githubUserId,
    login: row?.login ?? null,
  });
}
