export type GeminiOptions = {
  apiKey: string;
  model: string;
};

const DEFAULT_MODEL = "gemini-1.5-flash";

export async function generateReport(prompt: string, payload: unknown, options: GeminiOptions): Promise<string> {
  const model = options.model || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": options.apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${prompt}\n\nDATA (JSON):\n${JSON.stringify(payload)}`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini error: ${response.status} ${response.statusText} ${text}`);
  }

  const body = await response.json();
  const content = body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error("Gemini response missing content");
  }

  return content as string;
}
