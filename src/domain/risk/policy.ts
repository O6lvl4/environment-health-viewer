/**
 * RiskPolicy: 観測値 → RiskLevel への閾値ルール集。
 * 上から評価し、最初に満たした規則の level を採用する (上ほど厳しい順)。
 * いずれも満たさなければ low。
 */
import { type RiskLevel, RiskLevel as RL } from "../shared/risk-level.js";
import type { Specification } from "../shared/specification.js";

export type ThresholdRule<T> = {
  readonly level: Exclude<RiskLevel, "low">;
  readonly when: Specification<T>;
};

export type RiskPolicy<T> = {
  readonly rules: ReadonlyArray<ThresholdRule<T>>;
};

export const evaluatePolicy = <T>(policy: RiskPolicy<T>, subject: T): RiskLevel => {
  for (const rule of policy.rules) {
    if (rule.when(subject)) return rule.level;
  }
  return RL.Low;
};
