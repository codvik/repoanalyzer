type GitHubConfig = {
    token?: string;
};

declare function getGitHubConfig(): GitHubConfig;

declare function buildGitHubAuthHeaders(): Record<string, string>;

declare class MissingGitHubTokenError extends Error {
    readonly code: "GITHUB_TOKEN_MISSING";
    constructor(message?: string);
}

type GitHubGraphQLResponse<T> = {
    data?: T;
    errors?: Array<{
        message: string;
    }>;
};
type GitHubRateLimit = {
    remaining: number;
    resetAt: string;
};
type GraphQLRequestOptions = {
    query: string;
    variables?: Record<string, unknown>;
    endpoint?: string;
};
declare function requestGraphQL<T>(options: GraphQLRequestOptions): Promise<GitHubGraphQLResponse<T>>;

export { type GitHubConfig, type GitHubGraphQLResponse, type GitHubRateLimit, type GraphQLRequestOptions, MissingGitHubTokenError, buildGitHubAuthHeaders, getGitHubConfig, requestGraphQL };
