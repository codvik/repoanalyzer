import crypto from "node:crypto";
import { getPool } from "./db";

export function buildGitHubAuthUrl(): string | null {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return null;
  }

  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl) {
    return null;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    scope: "repo read:discussion",
    allow_signup: "true",
    redirect_uri: `${baseUrl.replace(/\/$/, "")}/api/auth/github/callback`,
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are required");
  }

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub OAuth error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Missing access token from GitHub");
  }

  return data.access_token;
}

export async function fetchGitHubUser(token: string): Promise<{ id: number; login: string }>{
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "repo-analyzer",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub user fetch failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { id: number; login: string };
  return { id: data.id, login: data.login };
}

export async function storeToken(githubUserId: number, login: string, token: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    `
    INSERT INTO github_oauth_tokens (github_user_id, login, access_token)
    VALUES ($1, $2, $3)
    ON CONFLICT (github_user_id)
    DO UPDATE SET login = EXCLUDED.login, access_token = EXCLUDED.access_token, updated_at = NOW()
    `,
    [githubUserId, login, token],
  );
}

export async function createSession(githubUserId: number): Promise<string> {
  const sessionId = crypto.randomBytes(24).toString("hex");
  const pool = getPool();
  await pool.query(
    `
    INSERT INTO github_sessions (session_id, github_user_id, expires_at)
    VALUES ($1, $2, NOW() + INTERVAL '7 days')
    `,
    [sessionId, githubUserId],
  );
  return sessionId;
}

export async function getTokenForUser(githubUserId: number): Promise<string | null> {
  const pool = getPool();
  const result = await pool.query(
    `
    SELECT access_token
    FROM github_oauth_tokens
    WHERE github_user_id = $1
    `,
    [githubUserId],
  );

  const row = result.rows[0];
  return row?.access_token ?? null;
}
