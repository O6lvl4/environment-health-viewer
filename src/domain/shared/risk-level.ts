/**
 * RiskLevel: 健康リスクの段階を表す Value Object。
 * 序列がある列挙であり、`max` / `compare` で比較可能。
 */
export const RiskLevel = {
  Low: "low",
  Mid: "mid",
  High: "high",
  Danger: "danger",
} as const;

export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];

const RANK: Record<RiskLevel, number> = {
  low: 0,
  mid: 1,
  high: 2,
  danger: 3,
};

export const compareRiskLevel = (a: RiskLevel, b: RiskLevel): number =>
  RANK[a] - RANK[b];

export const maxRiskLevel = (
  levels: ReadonlyArray<RiskLevel>,
  fallback: RiskLevel = RiskLevel.Low,
): RiskLevel => {
  if (levels.length === 0) return fallback;
  return levels.reduce((acc, l) => (RANK[l] > RANK[acc] ? l : acc));
};

export const riskLevelLabel = (l: RiskLevel): string => {
  switch (l) {
    case "low":
      return "低い";
    case "mid":
      return "中程度";
    case "high":
      return "高い";
    case "danger":
      return "危険";
  }
};

/**
 * 4段階の状態名 (UI で英字表示するためのラベル)。
 * NOMINAL / ELEVATED / WARNING / CRITICAL のターミナル風ラベル。
 */
export const riskLevelStateText = (l: RiskLevel): string => {
  switch (l) {
    case "low":
      return "NOMINAL";
    case "mid":
      return "ELEVATED";
    case "high":
      return "WARNING";
    case "danger":
      return "CRITICAL";
  }
};
