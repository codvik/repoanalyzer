export class MissingGitHubTokenError extends Error {
  public readonly code = "GITHUB_TOKEN_MISSING" as const;

  constructor(message = "GITHUB token is missing") {
    super(message);
    this.name = "MissingGitHubTokenError";
  }
}
