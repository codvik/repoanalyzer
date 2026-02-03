export type WorkItemType = "ISSUE" | "PR";

export type WorkItemInput = {
  repo: {
    repoId: string;
    owner: string;
    name: string;
    url: string;
  };
  item: {
    id: string;
    number: number;
    title: string;
    state: string;
    url: string;
    body: string;
  };
  labels?: string[];
  actors?: Array<{ login?: string; name?: string } | string>;
  timeline?: {
    timestamp: string;
    actor?: { login?: string; name?: string } | string;
    action: string;
    object?: string;
  }[];
  timestamps: {
    createdAt: string;
    updatedAt: string;
    closedAt?: string | null;
    mergedAt?: string | null;
  };
  context?: {
    problem?: string;
    background?: string;
    constraints?: string[];
  };
  decisions?: {
    statement: string;
    rationale: string;
    status: "proposed" | "accepted" | "rejected" | "superseded";
  }[];
  discussionSummary?: string;
};

export type WorkItemDocument = {
  doc_id: string;
  source: "github";
  type: WorkItemType;
  repo: {
    repo_id: string;
    owner: string;
    name: string;
    url: string;
  };
  issue: {
    id: string;
    number: number;
    title: string;
    state: string;
    url: string;
  };
  context: {
    problem: string;
    background: string;
    constraints: string[];
  };
  decisions: {
    statement: string;
    rationale: string;
    status: "proposed" | "accepted" | "rejected" | "superseded";
  }[];
  discussion_summary: string;
  labels: string[];
  actors: string[];
  timestamps: {
    created_at: string;
    updated_at: string;
    closed_at: string | null;
    merged_at: string | null;
  };
  text: {
    title: string;
    body: string;
    summary: string;
  };
};
