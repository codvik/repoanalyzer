export type ClaudeOptions = {
  apiKey: string;
  model: string;
};

const DEFAULT_MODEL = "claude-3-opus-20240229";

export async function generateReport(prompt: string, payload: unknown, options: ClaudeOptions): Promise<string> {
  const model = options.model || DEFAULT_MODEL;
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": options.apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nDATA (JSON):\n${JSON.stringify(payload)}`
        }
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Claude error: ${response.status} ${response.statusText} ${text}`);
  }

  const body = await response.json();
  const content = body?.content?.[0]?.text;
  if (!content) {
    throw new Error("Claude response missing content");
  }

  return content as string;
}
