export type GitHubGraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

export async function requestGraphQLWithToken<T>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<GitHubGraphQLResponse<T>> {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
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
