export type TimelineEvent = {
  timestamp: string;
  actor?: { login?: string; name?: string } | string;
  action: string;
  object?: string;
};

export type CleaningInput = {
  text: string;
  labels?: string[];
  actors?: Array<{ login?: string; name?: string } | string>;
  timeline?: TimelineEvent[];
};

export type CleaningOutput = {
  text: string;
  labels: string[];
  actors: string[];
  narrative?: string;
};

const FENCED_CODE_BLOCK = /```[\s\S]*?```/g;
const INDENTED_CODE_BLOCK = /(^|\n)(?: {4}|\t).*(?:\n(?: {4}|\t).*)*/g;
const INLINE_CODE = /`([^`]*)`/g;
const BOLD_ITALIC = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3/g;
const LINKS = /\[([^\]]+)\]\([^)]+\)/g;
const HEADINGS = /^#{1,6}\s+/gm;

export function cleanAndNormalize(input: CleaningInput): CleaningOutput {
  const text = normalizeMarkdown(removeCodeBlocks(input.text));
  const labels = normalizeLabels(input.labels ?? []);
  const actors = normalizeActors(input.actors ?? []);
  const narrative = input.timeline ? timelineToNarrative(input.timeline) : undefined;

  return { text, labels, actors, narrative };
}

function removeCodeBlocks(text: string): string {
  return text.replace(FENCED_CODE_BLOCK, "").replace(INDENTED_CODE_BLOCK, "").trim();
}

function normalizeMarkdown(text: string): string {
  return text
    .replace(HEADINGS, "")
    .replace(LINKS, "$1")
    .replace(INLINE_CODE, "$1")
    .replace(BOLD_ITALIC, (_, __, boldText, ___, italicText) => boldText || italicText || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeLabels(labels: string[]): string[] {
  const cleaned = labels
    .map((label) =>
      label
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);

  return Array.from(new Set(cleaned));
}

function normalizeActors(actors: Array<{ login?: string; name?: string } | string>): string[] {
  const cleaned = actors
    .map((actor) => {
      if (typeof actor === "string") {
        return actor.trim();
      }
      return actor.login?.trim() || actor.name?.trim() || "";
    })
    .filter(Boolean);

  return Array.from(new Set(cleaned));
}

function timelineToNarrative(events: TimelineEvent[]): string {
  const sorted = [...events].sort(
    (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp),
  );

  const sentences = sorted.map((event) => {
    const date = new Date(event.timestamp).toISOString().split("T")[0];
    const actor = normalizeActors([event.actor ?? "Someone"])[0];
    const object = event.object ? ` ${event.object}` : "";
    return `On ${date}, ${actor} ${event.action}${object}.`;
  });

  return sentences.join(" ");
}
