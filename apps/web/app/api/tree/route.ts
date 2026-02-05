import { NextResponse } from "next/server";
import { getSession } from "../../../lib/auth";
import { getTokenForUser } from "../../../lib/oauth";

async function fetchRepo(token: string, owner: string, name: string): Promise<{ default_branch: string }>{
  const response = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "repo-analyzer",
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub repo fetch failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as { default_branch: string };
}

async function fetchTree(token: string, owner: string, name: string, sha: string): Promise<string[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${name}/git/trees/${sha}?recursive=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "repo-analyzer",
        Accept: "application/vnd.github+json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`GitHub tree fetch failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { tree?: Array<{ path: string; type: string }> };
  const items = data.tree ?? [];
  return items.filter((item) => item.type === "blob").map((item) => item.path);
}

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

  const repo = await fetchRepo(token, owner, name);
  const files = await fetchTree(token, owner, name, repo.default_branch);

  return NextResponse.json({ owner, name, files });
}
