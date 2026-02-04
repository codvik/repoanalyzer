"use client";

import "./styles.css";
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";

function parseRepoInput(input: string): { owner: string; name: string } | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.includes("github.com")) {
    try {
      const url = new URL(trimmed);
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        return { owner: parts[0], name: parts[1] };
      }
    } catch {
      return null;
    }
  }

  const parts = trimmed.split("/").filter(Boolean);
  if (parts.length === 2) {
    return { owner: parts[0], name: parts[1] };
  }

  return null;
}

export default function Page() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [issues, setIssues] = useState<any[]>([]);
  const [prs, setPrs] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [repoId, setRepoId] = useState<string>("");
  const [loadingData, setLoadingData] = useState(false);
  const [auth, setAuth] = useState<{ authenticated: boolean; login?: string | null }>({
    authenticated: false,
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    const parsed = parseRepoInput(input);
    if (!parsed) {
      setError("Enter a repo URL or owner/repo");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error || "Ingestion failed");
      }

      const data = (await response.json()) as { repoId?: string };
      const resolvedRepoId = data.repoId || `${parsed.owner}/${parsed.name}`;
      setRepoId(resolvedRepoId);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message ?? "Ingestion failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setAuth(data))
      .catch(() => setAuth({ authenticated: false }));
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!repoId) return;
      setLoadingData(true);
      try {
        const [issuesRes, prsRes, discussionsRes] = await Promise.all([
          fetch(`/api/issues?repoId=${repoId}`),
          fetch(`/api/pull-requests?repoId=${repoId}`),
          fetch(`/api/discussions?repoId=${repoId}`),
        ]);
        if (issuesRes.ok) {
          const data = await issuesRes.json();
          setIssues(data.items ?? []);
        }
        if (prsRes.ok) {
          const data = await prsRes.json();
          setPrs(data.items ?? []);
        }
        if (discussionsRes.ok) {
          const data = await discussionsRes.json();
          setDiscussions(data.items ?? []);
        }
      } finally {
        setLoadingData(false);
      }
    };
    loadData().catch(() => { });
  }, [repoId]);

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Repository Intelligence Console</p>
          <h1>Repo Analyzer</h1>
          <p className="subtitle">Paste a GitHub repo URL or owner/repo to ingest data for a demo.</p>
        </div>
        <div className="actions">
          {auth.authenticated ? (
            <span className="pill">Signed in as {auth.login ?? "GitHub user"}</span>
          ) : (
            <a className="button" href="/api/auth/github">
              Sign in with GitHub
            </a>
          )}
          {repoId ? (
            <a className="button outline" href={`/api/export?repoId=${repoId}`}>
              Download Full Export
            </a>
          ) : null}
        </div>
      </section>

      <section className="panel form-panel">
        <form onSubmit={handleSubmit} className="form">
          <input
            className="input"
            placeholder="https://github.com/owner/repo or owner/repo"
            value={input}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setInput(event.target.value)
            }
          />
          <button className="button" type="submit" disabled={loading}>
            {loading ? "Analyzing..." : "Analyze Repo"}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
        {success && (
          <div className="success-message">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M6 10l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Repository ingested successfully!
          </div>
        )}
      </section>

      <section className="panel">
        <header>
          <h2>Repository Data</h2>
          <p>Collected issues, PRs, and discussions for the selected repo.</p>
        </header>
        {!repoId ? (
          <p className="placeholder">No repo ingested yet. Sign in and run ingestion.</p>
        ) : (
          <div className="grid">
            <div className="panel">
              <h3>Issues</h3>
              <ul className="list">
                {issues.map((item) => (
                  <li key={item.issue_id}>
                    <a href={item.url} target="_blank" rel="noreferrer">
                      <span className="title">#{item.issue_number} {item.title}</span>
                    </a>
                    <span className="meta">{item.state} · {item.author_login ?? "unknown"}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="panel">
              <h3>Pull Requests</h3>
              <ul className="list">
                {prs.map((item) => (
                  <li key={item.pull_request_id}>
                    <a href={item.url} target="_blank" rel="noreferrer">
                      <span className="title">#{item.pull_request_number} {item.title}</span>
                    </a>
                    <span className="meta">{item.state} · {item.author_login ?? "unknown"}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="panel">
              <h3>Discussions</h3>
              <ul className="list">
                {discussions.map((item) => (
                  <li key={item.discussion_id}>
                    <a href={item.url} target="_blank" rel="noreferrer">
                      <span className="title">#{item.discussion_number} {item.title}</span>
                    </a>
                    <span className="meta">{item.state} · {item.author_login ?? "unknown"}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
