import { cookies } from "next/headers";
import { getPool } from "./db";

const SESSION_COOKIE = "gh_session";

export type Session = {
  sessionId: string;
  githubUserId: number;
};

export async function getSession(): Promise<Session | null> {
  const cookieStore = cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    return null;
  }

  const pool = getPool();
  const result = await pool.query(
    `
    SELECT session_id, github_user_id
    FROM github_sessions
    WHERE session_id = $1 AND expires_at > NOW()
    `,
    [sessionId],
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    sessionId: row.session_id as string,
    githubUserId: Number(row.github_user_id),
  };
}

export function setSessionCookie(sessionId: string): void {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}
