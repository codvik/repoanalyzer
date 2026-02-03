import { requestGraphQL } from "@app/github";
import type {
  PageFetcher,
  PageFetcherParams,
  PageResult,
} from "./incremental-sync/types";

export type DiscussionNode = {
  id: string;
  number: number;
  title: string;
  url: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: { login: string } | null;
  labels: { nodes: Array<{ name: string }> } | null;
  comments: { totalCount: number } | null;
};

const DISCUSSION_QUERY = `
  query RepoDiscussions($owner: String!, $name: String!, $pageSize: Int!, $cursor: String) {
    rateLimit {
      remaining
      resetAt
    }
    repository(owner: $owner, name: $name) {
      discussions(first: $pageSize, after: $cursor, orderBy: { field: UPDATED_AT, direction: ASC }) {
        nodes {
          id
          number
          title
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

export const fetchDiscussionPage: PageFetcher<DiscussionNode> = async (
  params: PageFetcherParams,
): Promise<PageResult<DiscussionNode>> => {
  const response = await requestGraphQL<{
    rateLimit?: { remaining: number; resetAt: string };
    repository?: {
      discussions?: {
        nodes?: DiscussionNode[];
        pageInfo: { endCursor: string | null; hasNextPage: boolean };
      };
    } | null;
  }>({
    query: DISCUSSION_QUERY,
    variables: {
      owner: params.owner,
      name: params.name,
      pageSize: params.pageSize,
      cursor: params.cursor,
    },
  });

  const discussions = response.data?.repository?.discussions;
  if (!discussions) {
    throw new Error("Repository discussions not found in GitHub response");
  }

  return {
    nodes: discussions.nodes ?? [],
    pageInfo: discussions.pageInfo,
    rateLimit: response.data?.rateLimit,
  };
};
