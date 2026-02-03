export type IssueScoringInput = {
  labels: string[];
  commentCount: number;
  similarResolvedCount: number;
  maintainerCommentCount: number;
  openedAt: string;
  now?: string;
};

export type IssueScoringConfig = {
  labelWeights: Record<string, number>;
  commentWeight: number;
  similarResolvedWeight: number;
  maintainerWeight: number;
  daysOpenWeight: number;
  maxCommentCount: number;
  maxSimilarResolved: number;
  maxMaintainerComments: number;
  maxDaysOpen: number;
  clamp: { min: number; max: number };
};

export type IssueScoreBreakdown = {
  labelScore: number;
  commentScore: number;
  similarResolvedScore: number;
  maintainerScore: number;
  timeOpenScore: number;
  total: number;
};

const DEFAULT_CONFIG: IssueScoringConfig = {
  labelWeights: {
    critical: 30,
    high: 20,
    medium: 10,
    low: 5,
    bug: 8,
    security: 25,
    performance: 12,
    regression: 18,
    priority: 6,
  },
  commentWeight: 10,
  similarResolvedWeight: 12,
  maintainerWeight: 8,
  daysOpenWeight: 15,
  maxCommentCount: 50,
  maxSimilarResolved: 10,
  maxMaintainerComments: 10,
  maxDaysOpen: 90,
  clamp: { min: 0, max: 100 },
};

export function scoreIssue(
  input: IssueScoringInput,
  config: IssueScoringConfig = DEFAULT_CONFIG,
): IssueScoreBreakdown {
  const normalizedLabels = normalizeLabels(input.labels);
  const labelScore = scoreLabels(normalizedLabels, config.labelWeights);
  const commentScore = scoreRatio(
    input.commentCount,
    config.maxCommentCount,
    config.commentWeight,
  );
  const similarResolvedScore = scoreRatio(
    input.similarResolvedCount,
    config.maxSimilarResolved,
    config.similarResolvedWeight,
  );
  const maintainerScore = scoreRatio(
    input.maintainerCommentCount,
    config.maxMaintainerComments,
    config.maintainerWeight,
  );
  const timeOpenScore = scoreRatio(
    daysOpen(input.openedAt, input.now),
    config.maxDaysOpen,
    config.daysOpenWeight,
  );

  const total = clamp(
    labelScore +
      commentScore +
      similarResolvedScore +
      maintainerScore +
      timeOpenScore,
    config.clamp.min,
    config.clamp.max,
  );

  return {
    labelScore,
    commentScore,
    similarResolvedScore,
    maintainerScore,
    timeOpenScore,
    total,
  };
}

function normalizeLabels(labels: string[]): string[] {
  return labels
    .map((label) => label.toLowerCase().trim())
    .filter(Boolean);
}

function scoreLabels(labels: string[], weights: Record<string, number>): number {
  let score = 0;
  for (const label of labels) {
    for (const [key, weight] of Object.entries(weights)) {
      if (label.includes(key)) {
        score += weight;
      }
    }
  }
  return score;
}

function scoreRatio(value: number, maxValue: number, weight: number): number {
  if (maxValue <= 0) {
    return 0;
  }
  const ratio = clamp(value / maxValue, 0, 1);
  return ratio * weight;
}

function daysOpen(openedAt: string, now?: string): number {
  const start = Date.parse(openedAt);
  const end = now ? Date.parse(now) : Date.now();
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return 0;
  }
  const ms = Math.max(0, end - start);
  return ms / (1000 * 60 * 60 * 24);
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

export { DEFAULT_CONFIG as DEFAULT_ISSUE_SCORING_CONFIG };
