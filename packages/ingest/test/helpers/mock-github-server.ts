import http from "node:http";
import type { AddressInfo } from "node:net";

type MockResponse = {
  status?: number;
  body: unknown;
};

export class MockGitHubServer {
  private server: http.Server | null = null;
  private readonly responses: MockResponse[] = [];

  enqueueResponse(response: MockResponse): void {
    this.responses.push(response);
  }

  async start(): Promise<{ url: string }>{
    if (this.server) {
      throw new Error("MockGitHubServer already started");
    }

    this.server = http.createServer(async (req, res) => {
      if (!req.url || req.method !== "POST" || req.url !== "/graphql") {
        res.statusCode = 404;
        res.end("Not found");
        return;
      }

      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(Buffer.from(chunk));
      }

      const payload = Buffer.concat(chunks).toString("utf8");
      if (!payload) {
        res.statusCode = 400;
        res.end("Missing body");
        return;
      }

      const response = this.responses.shift();
      if (!response) {
        res.statusCode = 500;
        res.end("No mock response queued");
        return;
      }

      res.statusCode = response.status ?? 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(response.body));
    });

    await new Promise<void>((resolve) => {
      this.server?.listen(0, "127.0.0.1", () => resolve());
    });

    const address = this.server.address() as AddressInfo;
    return { url: `http://127.0.0.1:${address.port}/graphql` };
  }

  async stop(): Promise<void> {
    if (!this.server) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      this.server?.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    this.server = null;
  }
}
