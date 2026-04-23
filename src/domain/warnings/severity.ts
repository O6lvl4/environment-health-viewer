/**
 * Severity: 警報の深刻度。
 *   alert (特別警報) > warn (警報) > info (注意報)
 */
export const Severity = {
  Alert: "alert",
  Warn: "warn",
  Info: "info",
} as const;

export type Severity = (typeof Severity)[keyof typeof Severity];

const RANK: Record<Severity, number> = {
  alert: 0,
  warn: 1,
  info: 2,
};

export const compareSeverity = (a: Severity, b: Severity): number =>
  RANK[a] - RANK[b];
