import { requestGraphQL } from "@app/github";
import type {
  PageFetcher,
  PageFetcherParams,
  PageResult,
} from "./incremental-sync/types";

export type PullRequestNode = {
  id: string;
  number: number;
  title: string;
  state: string;
  url: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: { login: string } | null;
  labels: { nodes: Array<{ name: string }> } | null;
  comments: { totalCount: number } | null;
};

const PR_QUERY = `
  query RepoPullRequests($owner: String!, $name: String!, $pageSize: Int!, $cursor: String) {
    rateLimit {
      remaining
      resetAt
    }
    repository(owner: $owner, name: $name) {
      pullRequests(first: $pageSize, after: $cursor, orderBy: { field: UPDATED_AT, direction: ASC }) {
        nodes {
          id
          number
          title
          state
          url
          body
          createdAt
          updatedAt
          author {
            login
          }
          labels(first: 20) {
            nodes {
              name
            }
          }
          comments {
            totalCount
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
`;

export const fetchPullRequestPage: PageFetcher<PullRequestNode> = async (
  params: PageFetcherParams,
): Promise<PageResult<PullRequestNode>> => {
  const response = await requestGraphQL<{
    rateLimit?: { remaining: number; resetAt: string };
    repository?: {
      pullRequests?: {
        nodes?: PullRequestNode[];
        pageInfo: { endCursor: string | null; hasNextPage: boolean };
      };
    } | null;
  }>({
    query: PR_QUERY,
    variables: {
      owner: params.owner,
      name: params.name,
      pageSize: params.pageSize,
      cursor: params.cursor,
    },
  });

  const pullRequests = response.data?.repository?.pullRequests;
  if (!pullRequests) {
    throw new Error("Repository pull requests not found in GitHub response");
  }

  return {
    nodes: pullRequests.nodes ?? [],
    pageInfo: pullRequests.pageInfo,
    rateLimit: response.data?.rateLimit,
  };
};
