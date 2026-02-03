// src/config.ts
var GITHUB_TOKEN_ENV = "GITHUB_TOKEN";
function getGitHubConfig() {
  const token = process.env[GITHUB_TOKEN_ENV];
  return {
    token: token && token.length > 0 ? token : void 0
  };
}

// src/errors.ts
var MissingGitHubTokenError = class extends Error {
  code = "GITHUB_TOKEN_MISSING";
  constructor(message = "GITHUB token is missing") {
    super(message);
    this.name = "MissingGitHubTokenError";
  }
};

// src/auth.ts
function buildGitHubAuthHeaders() {
  const { token } = getGitHubConfig();
  if (!token) {
    throw new MissingGitHubTokenError();
  }
  return {
    Authorization: `Bearer ${token}`
  };
}

// src/client.ts
var DEFAULT_ENDPOINT = "https://api.github.com/graphql";
async function requestGraphQL(options) {
  const headers = {
    "Content-Type": "application/json",
    ...buildGitHubAuthHeaders()
  };
  const response = await fetch(options.endpoint ?? DEFAULT_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query: options.query,
      variables: options.variables ?? {}
    })
  });
  if (!response.ok) {
    throw new Error(`GitHub GraphQL error: ${response.status} ${response.statusText}`);
  }
  const payload = await response.json();
  if (payload.errors && payload.errors.length > 0) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }
  return payload;
}
export {
  MissingGitHubTokenError,
  buildGitHubAuthHeaders,
  getGitHubConfig,
  requestGraphQL
};
