import type { GitHubConfig } from "./types";

const GITHUB_TOKEN_ENV = "GITHUB_TOKEN" as const;

export function getGitHubConfig(): GitHubConfig {
  const token = process.env[GITHUB_TOKEN_ENV];

  return {
    token: token && token.length > 0 ? token : undefined,
  };
}
