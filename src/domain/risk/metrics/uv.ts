/**
 * UV リスク。WHO の UVI 段階に準拠。
 *   ≥11 極端、≥8 非常に強い、≥6 強い、≥3 中程度、それ未満 弱い
 */
import { type Metric, MetricId } from "../metric.js";
import { RiskLevel } from "../../shared/risk-level.js";
import type { WeatherDaily } from "../../conditions/series.js";

export const assessUv = (daily: WeatherDaily): Metric => {
  const today = daily.uvIndexMax[0] ?? 0;

  let level: RiskLevel;
  let note: string;
  if (today >= 11) {
    level = RiskLevel.Danger;
    note = "極端に強い。長時間の外出は避ける";
  } else if (today >= 8) {
    level = RiskLevel.High;
    note = "非常に強い。日焼け止め・帽子必須";
  } else if (today >= 6) {
    level = RiskLevel.Mid;
    note = "強い。日中は対策推奨";
  } else if (today >= 3) {
    level = RiskLevel.Low;
    note = "中程度。長時間外出時は対策を";
  } else {
    level = RiskLevel.Low;
    note = "弱い";
  }

  return {
    id: MetricId.Uv,
    title: "UV 指数（最大）",
    icon: "☀️",
    level,
    value: today.toFixed(1),
    unit: "UVI",
    note,
  };
};
