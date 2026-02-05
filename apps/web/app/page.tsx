"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import dynamic from "next/dynamic";

const FileTreeView = dynamic(
  () => import("../components/file-tree").then((m) => m.FileTreeView),
  { ssr: false },
);

const FileMindMap = dynamic(
  () => import("../components/file-mindmap").then((m) => m.FileMindMap),
  {
    ssr: false,
    loading: () => (
      <section className="panel">
        <p className="placeholder">Loading mind map…</p>
      </section>
    ),
  },
);

const FileMindMapCurved = dynamic(
  () => import("../components/file-mindmap-curved").then((m) => m.FileMindMapCurved),
  {
    ssr: false,
    loading: () => (
      <section className="panel">
        <p className="placeholder">Loading mind map…</p>
      </section>
    ),
  },
);

const FileMindMapFolders = dynamic(
  () => import("../components/file-mindmap-folders").then((m) => m.FileMindMapFolders),
  {
    ssr: false,
    loading: () => (
      <section className="panel">
        <p className="placeholder">Loading mind map…</p>
      </section>
    ),
  },
);

const FileIcicle = dynamic(
  () => import("../components/file-icicle").then((m) => m.FileIcicle),
  {
    ssr: false,
    loading: () => (
      <section className="panel">
        <p className="placeholder">Loading visualization…</p>
      </section>
    ),
  },
);

const FileTreemap = dynamic(
  () => import("../components/file-treemap").then((m) => m.FileTreemap),
  {
    ssr: false,
    loading: () => (
      <section className="panel">
        <p className="placeholder">Loading visualization…</p>
      </section>
    ),
  },
);

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

type IssueItem = {
  issue_id: string;
  issue_number: number;
  title: string;
  state: string;
  url: string;
  author_login: string | null;
  updated_at: string;
};

type PullRequestItem = {
  pull_request_id: string;
  pull_request_number: number;
  title: string;
  state: string;
  url: string;
  author_login: string | null;
  updated_at: string;
};

type DiscussionItem = {
  discussion_id: string;
  discussion_number: number;
  title: string;
  state: string;
  url: string;
  author_login: string | null;
  updated_at: string;
};

type FileVizMode =
  | "tree"
  | "mindmap"
  | "mindmap-curved"
  | "mindmap-folders"
  | "icicle"
  | "treemap";

export default function Page() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [prs, setPrs] = useState<PullRequestItem[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionItem[]>([]);
  const [repoId, setRepoId] = useState<string>("");
  const [loadingData, setLoadingData] = useState(false);
  const [auth, setAuth] = useState<{ authenticated: boolean; login?: string | null }>({
    authenticated: false,
  });
  const [files, setFiles] = useState<string[]>([]);
  const [fileVizMode, setFileVizMode] = useState<FileVizMode | null>(null);
  const [fileVizLoading, setFileVizLoading] = useState(false);
  const [fileVizFullscreen, setFileVizFullscreen] = useState(false);
  const [fileVizSource, setFileVizSource] = useState<{ kind: "repo" | "sample"; label: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"issues" | "prs" | "discussions">("issues");
  const [listSearch, setListSearch] = useState("");

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
    const resolvedRepoId = `${parsed.owner}/${parsed.name}`;
    setRepoId(resolvedRepoId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("lastRepoId", resolvedRepoId);
    }
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
      if (data.repoId) {
        setRepoId(data.repoId);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("lastRepoId", data.repoId);
        }
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message ?? "Ingestion failed");
    } finally {
      setLoading(false);
    }
  };

  const loadRepoFileVisualizations = async (initialMode: FileVizMode) => {
    setError(null);
    const parsed = parseRepoInput(input);
    if (!parsed) {
      setError("Enter a repo URL or owner/repo");
      return;
    }

    setFileVizFullscreen(false);
    setFileVizMode(initialMode);
    setFiles([]);
    setFileVizLoading(true);
    setFileVizSource({ kind: "repo", label: `${parsed.owner}/${parsed.name}` });
    try {
      const response = await fetch("/api/tree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "File structure fetch failed");
      }
      const data = (await response.json()) as { files?: string[] };
      setFiles(data.files ?? []);
    } catch (err: any) {
      setError(err.message ?? "File structure fetch failed");
    } finally {
      setFileVizLoading(false);
    }
  };

  const loadSampleFileVisualizations = async () => {
    setError(null);
    setFileVizFullscreen(false);
    setFileVizMode("tree");
    setFiles([]);
    setFileVizLoading(true);
    setFileVizSource({ kind: "sample", label: "Sample dataset" });
    try {
      const response = await fetch("/api/sample-files");
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Sample dataset load failed");
      }
      const data = (await response.json()) as { name?: string; files?: string[] };
      setFiles(data.files ?? []);
      if (data.name) setFileVizSource({ kind: "sample", label: `Sample: ${data.name}` });
    } catch (err: any) {
      setError(err.message ?? "Sample dataset load failed");
    } finally {
      setFileVizLoading(false);
    }
  };

  const clearFileVisualizations = () => {
    setFileVizFullscreen(false);
    setFileVizMode(null);
    setFileVizSource(null);
    setFiles([]);
  };

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setAuth(data))
      .catch(() => setAuth({ authenticated: false }));

    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("lastRepoId");
      if (stored) {
        setRepoId(stored);
      }
    }
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
          const data = (await issuesRes.json()) as { items?: IssueItem[] };
          setIssues(data.items ?? []);
        }
        if (prsRes.ok) {
          const data = (await prsRes.json()) as { items?: PullRequestItem[] };
          setPrs(data.items ?? []);
        }
        if (discussionsRes.ok) {
          const data = (await discussionsRes.json()) as { items?: DiscussionItem[] };
          setDiscussions(data.items ?? []);
        }
      } finally {
        setLoadingData(false);
      }
    };
    loadData().catch(() => { });
  }, [repoId]);

  const selectedList = (() => {
    switch (activeTab) {
      case "prs":
        return prs;
      case "discussions":
        return discussions;
      case "issues":
      default:
        return issues;
    }
  })();

  const filteredList = (() => {
    const term = listSearch.trim().toLowerCase();
    if (!term) return selectedList;
    return selectedList.filter((item: any) => {
      const title = String(item.title ?? "").toLowerCase();
      const number =
        activeTab === "issues"
          ? String((item as IssueItem).issue_number)
          : activeTab === "prs"
            ? String((item as PullRequestItem).pull_request_number)
            : String((item as DiscussionItem).discussion_number);
      const author = String(item.author_login ?? "").toLowerCase();
      return title.includes(term) || number.includes(term) || author.includes(term);
    });
  })();

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
        <div className="form-actions">
          <button
            type="button"
            className="button outline"
            onClick={() => loadRepoFileVisualizations("tree")}
            disabled={fileVizLoading}
          >
            {fileVizLoading && fileVizSource?.kind === "repo" ? "Loading…" : "Load Repo File Maps"}
          </button>
          <button
            type="button"
            className="button outline"
            onClick={loadSampleFileVisualizations}
            disabled={fileVizLoading}
          >
            {fileVizLoading && fileVizSource?.kind === "sample" ? "Loading…" : "Use Sample Dataset"}
          </button>
          {files.length > 0 ? (
            <button type="button" className="button outline" onClick={clearFileVisualizations} disabled={fileVizLoading}>
              Clear
            </button>
          ) : null}
        </div>
        {files.length > 0 ? (
          <p className="placeholder">
            Loaded {files.length.toLocaleString()} paths ·{" "}
            <strong style={{ color: "var(--text)" }}>{fileVizSource?.label ?? "dataset"}</strong>
          </p>
        ) : (
          <p className="placeholder">Load a repo file list (or the sample dataset) to preview the visualizations.</p>
        )}
        {files.length > 0 ? (
          <div className="tabs">
            <button
              type="button"
              className={`tab ${fileVizMode === "tree" ? "active" : ""}`}
              onClick={() => setFileVizMode("tree")}
            >
              Tree
            </button>
            <button
              type="button"
              className={`tab ${fileVizMode === "mindmap" ? "active" : ""}`}
              onClick={() => setFileVizMode("mindmap")}
            >
              Mind Map
            </button>
            <button
              type="button"
              className={`tab ${fileVizMode === "mindmap-curved" ? "active" : ""}`}
              onClick={() => setFileVizMode("mindmap-curved")}
            >
              Curved Map
            </button>
            <button
              type="button"
              className={`tab ${fileVizMode === "mindmap-folders" ? "active" : ""}`}
              onClick={() => setFileVizMode("mindmap-folders")}
            >
              Folders Map
            </button>
            <button
              type="button"
              className={`tab ${fileVizMode === "icicle" ? "active" : ""}`}
              onClick={() => setFileVizMode("icicle")}
            >
              Icicle
            </button>
            <button
              type="button"
              className={`tab ${fileVizMode === "treemap" ? "active" : ""}`}
              onClick={() => setFileVizMode("treemap")}
            >
              Treemap
            </button>
          </div>
        ) : null}
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

      {!fileVizFullscreen && fileVizMode === "tree" && files.length > 0 ? (
        <FileTreeView files={files} onToggleFullscreen={() => setFileVizFullscreen(true)} />
      ) : null}
      {!fileVizFullscreen && fileVizMode === "mindmap" && files.length > 0 ? (
        <FileMindMap files={files} onToggleFullscreen={() => setFileVizFullscreen(true)} />
      ) : null}
      {!fileVizFullscreen && fileVizMode === "mindmap-curved" && files.length > 0 ? (
        <FileMindMapCurved files={files} onToggleFullscreen={() => setFileVizFullscreen(true)} />
      ) : null}
      {!fileVizFullscreen && fileVizMode === "mindmap-folders" && files.length > 0 ? (
        <FileMindMapFolders files={files} onToggleFullscreen={() => setFileVizFullscreen(true)} />
      ) : null}
      {!fileVizFullscreen && fileVizMode === "icicle" && files.length > 0 ? (
        <FileIcicle files={files} onToggleFullscreen={() => setFileVizFullscreen(true)} />
      ) : null}
      {!fileVizFullscreen && fileVizMode === "treemap" && files.length > 0 ? (
        <FileTreemap files={files} onToggleFullscreen={() => setFileVizFullscreen(true)} />
      ) : null}

      <section className="panel">
        <header>
          <h2>Repository Data</h2>
          <p>Collected issues, PRs, and discussions for the selected repo.</p>
        </header>
        {!repoId ? (
          <p className="placeholder">No repo ingested yet. Sign in and run ingestion.</p>
        ) : (
          <>
            <div className="tabs">
              <button
                type="button"
                className={`tab ${activeTab === "issues" ? "active" : ""}`}
                onClick={() => setActiveTab("issues")}
              >
                Issues <span className="count">{issues.length}</span>
              </button>
              <button
                type="button"
                className={`tab ${activeTab === "prs" ? "active" : ""}`}
                onClick={() => setActiveTab("prs")}
              >
                Pull Requests <span className="count">{prs.length}</span>
              </button>
              <button
                type="button"
                className={`tab ${activeTab === "discussions" ? "active" : ""}`}
                onClick={() => setActiveTab("discussions")}
              >
                Discussions <span className="count">{discussions.length}</span>
              </button>
              <div className="tabs-spacer" />
              <input
                className="search-input"
                placeholder="Search by title, #, or author…"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
              />
            </div>

            {loadingData ? <p className="placeholder">Loading data…</p> : null}
            {!loadingData && filteredList.length === 0 ? (
              <p className="placeholder">No results.</p>
            ) : (
              <ul className="list">
                {filteredList.map((item: any) => {
                  const number =
                    activeTab === "issues"
                      ? (item as IssueItem).issue_number
                      : activeTab === "prs"
                        ? (item as PullRequestItem).pull_request_number
                        : (item as DiscussionItem).discussion_number;
                  const key =
                    activeTab === "issues"
                      ? (item as IssueItem).issue_id
                      : activeTab === "prs"
                        ? (item as PullRequestItem).pull_request_id
                        : (item as DiscussionItem).discussion_id;

                  return (
                    <li key={key}>
                      <a href={item.url} target="_blank" rel="noreferrer">
                        <span className="title">
                          #{number} {item.title}
                        </span>
                      </a>
                      <span className="meta">
                        {item.state} · {item.author_login ?? "unknown"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </section>

      {fileVizFullscreen && fileVizMode && files.length > 0 ? (
        <div className="fullscreen-overlay" role="dialog" aria-modal="true">
          {fileVizMode === "tree" ? (
            <FileTreeView
              files={files}
              fullscreen
              onToggleFullscreen={() => setFileVizFullscreen(false)}
            />
          ) : fileVizMode === "mindmap" ? (
            <FileMindMap
              files={files}
              fullscreen
              onToggleFullscreen={() => setFileVizFullscreen(false)}
            />
          ) : fileVizMode === "mindmap-curved" ? (
            <FileMindMapCurved files={files} fullscreen onToggleFullscreen={() => setFileVizFullscreen(false)} />
          ) : fileVizMode === "mindmap-folders" ? (
            <FileMindMapFolders files={files} fullscreen onToggleFullscreen={() => setFileVizFullscreen(false)} />
          ) : fileVizMode === "icicle" ? (
            <FileIcicle files={files} fullscreen onToggleFullscreen={() => setFileVizFullscreen(false)} />
          ) : (
            <FileTreemap files={files} fullscreen onToggleFullscreen={() => setFileVizFullscreen(false)} />
          )}
        </div>
      ) : null}
    </main>
  );
}
