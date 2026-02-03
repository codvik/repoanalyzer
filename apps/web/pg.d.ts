declare module "pg" {
  export type QueryResult<Row = any> = {
    rows: Row[];
    rowCount: number;
  };

  export interface Pool {
    query: (text: string, params?: unknown[]) => Promise<QueryResult>;
  }

  export const Pool: new (config: { connectionString: string }) => Pool;
}
