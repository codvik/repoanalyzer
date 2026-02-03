import { buildGitHubAuthHeaders } from "./auth";

export type GitHubGraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export type GitHubRateLimit = {
  remaining: number;
  resetAt: string;
};

export type GraphQLRequestOptions = {
  query: string;
  variables?: Record<string, unknown>;
  endpoint?: string;
};

const DEFAULT_ENDPOINT = "https://api.github.com/graphql";

export async function requestGraphQL<T>(
  options: GraphQLRequestOptions,
): Promise<GitHubGraphQLResponse<T>> {
  const headers = {
    "Content-Type": "application/json",
    ...buildGitHubAuthHeaders(),
  };

  const response = await fetch(options.endpoint ?? DEFAULT_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query: options.query,
      variables: options.variables ?? {},
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL error: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as GitHubGraphQLResponse<T>;
  if (payload.errors && payload.errors.length > 0) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }

  return payload;
}
