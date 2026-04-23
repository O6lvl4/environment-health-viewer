/**
 * Assessment: メトリクス群と総合状態を持つドメイン集約。
 * 総合状態は構成メトリクスの最大リスクから決まる。
 */
import type { Metric } from "./metric.js";
import { type RiskLevel, maxRiskLevel } from "../shared/risk-level.js";

export type SystemSummary = {
  readonly level: RiskLevel;
  readonly message: string;
};

export type Assessment = {
  readonly metrics: ReadonlyArray<Metric>;
};

export const Assessment = {
  create: (metrics: ReadonlyArray<Metric>): Assessment => ({ metrics }),

  systemLevel: (a: Assessment): RiskLevel =>
    maxRiskLevel(a.metrics.map((m) => m.level)),

  summary: (a: Assessment): SystemSummary => {
    const level = Assessment.systemLevel(a);
    const top = a.metrics
      .filter((m) => m.level === level && level !== "low")
      .map((m) => m.title);

    let message: string;
    switch (level) {
      case "danger":
        message = top.length
          ? `${top.join("・")} が危険水準です。無理は禁物です。`
          : "危険水準の項目があります。";
        break;
      case "high":
        message = top.length
          ? `${top.join("・")} が高めです。体調に注意してください。`
          : "リスクが高めの項目があります。";
        break;
      case "mid":
        message = top.length
          ? `${top.join("・")} がやや高め。敏感な方は気をつけて。`
          : "全体的に注意レベルです。";
        break;
      default:
        message = "全体的に良好です。";
    }
    return { level, message };
  },
};
