declare module "pg" {
  export type QueryResult<Row = any> = {
    rows: Row[];
    rowCount: number;
  };

  export interface PoolClient {
    query: (text: string, params?: unknown[]) => Promise<QueryResult>;
    release: () => void;
  }

  export interface Pool {
    query: (text: string, params?: unknown[]) => Promise<QueryResult>;
    connect: () => Promise<PoolClient>;
    end: () => Promise<void>;
  }

  export const Pool: new (config: { connectionString: string }) => Pool;
}
