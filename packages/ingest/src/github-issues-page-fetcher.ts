import { requestGraphQL } from "@app/github";
import type {
  PageFetcher,
  PageFetcherParams,
  PageResult,
} from "./incremental-sync/types";

export type IssueNode = {
  id: string;
  number: number;
  title: string;
  state: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  author: { login: string } | null;
  labels: { nodes: Array<{ name: string }> } | null;
  comments: { totalCount: number } | null;
};

const ISSUE_QUERY = `
  query RepoIssues($owner: String!, $name: String!, $pageSize: Int!, $cursor: String) {
    rateLimit {
      remaining
      resetAt
    }
    repository(owner: $owner, name: $name) {
      issues(first: $pageSize, after: $cursor, orderBy: { field: UPDATED_AT, direction: ASC }) {
        nodes {
          id
          number
          title
          state
          url
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

export const fetchIssuePage: PageFetcher<IssueNode> = async (
  params: PageFetcherParams,
): Promise<PageResult<IssueNode>> => {
  const response = await requestGraphQL<{
    rateLimit?: { remaining: number; resetAt: string };
    repository?: {
      issues?: {
        nodes?: IssueNode[];
        pageInfo: { endCursor: string | null; hasNextPage: boolean };
      };
    } | null;
  }>({
    query: ISSUE_QUERY,
    variables: {
      owner: params.owner,
      name: params.name,
      pageSize: params.pageSize,
      cursor: params.cursor,
    },
  });

  const issues = response.data?.repository?.issues;
  if (!issues) {
    throw new Error("Repository issues not found in GitHub response");
  }

  return {
    nodes: issues.nodes ?? [],
    pageInfo: issues.pageInfo,
    rateLimit: response.data?.rateLimit,
  };
};
