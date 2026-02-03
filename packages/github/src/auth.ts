import { getGitHubConfig } from "./config";
import { MissingGitHubTokenError } from "./errors";

export function buildGitHubAuthHeaders(): Record<string, string> {
  const { token } = getGitHubConfig();

  if (!token) {
    throw new MissingGitHubTokenError();
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}
