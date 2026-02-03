import { cleanAndNormalize, type TimelineEvent } from "../cleaning/cleaning-service";
import type { WorkItemDocument, WorkItemInput, WorkItemType } from "./types";

const DEFAULT_CONSTRAINTS: string[] = [];

export function buildWorkItemDocument(
  type: WorkItemType,
  input: WorkItemInput,
): WorkItemDocument {
  const cleaned = cleanAndNormalize({
    text: input.item.body ?? "",
    labels: input.labels ?? [],
    actors: input.actors ?? [],
    timeline: input.timeline as TimelineEvent[] | undefined,
  });

  const normalizedTitle = normalizeWhitespace(input.item.title);
  const summary = deriveSummary(cleaned.text, normalizedTitle);
  const discussionSummary = deriveDiscussionSummary(
    input.discussionSummary,
    cleaned.narrative,
    cleaned.text,
  );

  const context = {
    problem: normalizeWhitespace(input.context?.problem ?? normalizedTitle),
    background: normalizeWhitespace(
      input.context?.background ?? firstParagraph(cleaned.text),
    ),
    constraints: input.context?.constraints ?? DEFAULT_CONSTRAINTS,
  };

  return {
    doc_id: `${input.repo.repoId}:${input.item.id}`,
    source: "github",
    type,
    repo: {
      repo_id: input.repo.repoId,
      owner: input.repo.owner,
      name: input.repo.name,
      url: input.repo.url,
    },
    issue: {
      id: input.item.id,
      number: input.item.number,
      title: normalizedTitle,
      state: input.item.state,
      url: input.item.url,
    },
    context,
    decisions: input.decisions ?? [],
    discussion_summary: discussionSummary,
    labels: cleaned.labels,
    actors: cleaned.actors,
    timestamps: {
      created_at: input.timestamps.createdAt,
      updated_at: input.timestamps.updatedAt,
      closed_at: input.timestamps.closedAt ?? null,
      merged_at: input.timestamps.mergedAt ?? null,
    },
    text: {
      title: normalizedTitle,
      body: cleaned.text,
      summary,
    },
  };
}

function deriveSummary(cleanedBody: string, title: string): string {
  const paragraphs = splitParagraphs(cleanedBody);
  if (paragraphs.length === 0) {
    return title;
  }

  const first = paragraphs[0];
  return trimToSentence(first, 2) ?? title;
}

function deriveDiscussionSummary(
  provided: string | undefined,
  narrative: string | undefined,
  cleanedBody: string,
): string {
  if (provided && provided.trim().length > 0) {
    return normalizeWhitespace(provided);
  }

  if (narrative && narrative.trim().length > 0) {
    return normalizeWhitespace(narrative);
  }

  const paragraphs = splitParagraphs(cleanedBody);
  if (paragraphs.length > 1) {
    return trimToSentence(paragraphs[1], 2) ?? paragraphs[1];
  }

  return trimToSentence(cleanedBody, 2) ?? cleanedBody;
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

function firstParagraph(text: string): string {
  return splitParagraphs(text)[0] ?? "";
}

function trimToSentence(text: string, count: number): string | null {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return null;
  }

  return sentences.slice(0, count).join(" ");
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
