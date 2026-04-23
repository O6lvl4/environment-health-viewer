/**
 * UV リスク。WHO の UVI 段階に準拠。
 *   ≥11 極端、≥8 非常に強い、≥6 強い、≥3 中程度、それ未満 弱い
 */
import { type Metric, MetricId } from "../metric.js";
import { type RiskLevel } from "../../shared/risk-level.js";
import { type Specification } from "../../shared/specification.js";
import { type RiskPolicy, evaluatePolicy } from "../policy.js";
import type { WeatherDaily } from "../../conditions/series.js";

export type UvObservation = {
  readonly uvi: number;
};

export const observeUv = (daily: WeatherDaily): UvObservation => ({
  uvi: daily.uvIndexMax[0] ?? 0,
});

const uviAtLeast = (n: number): Specification<UvObservation> => (o) => o.uvi >= n;

export const DEFAULT_UV_POLICY: RiskPolicy<UvObservation> = {
  rules: [
    { level: "danger", when: uviAtLeast(11) },
    { level: "high", when: uviAtLeast(8) },
    { level: "mid", when: uviAtLeast(6) },
  ],
};

const NOTES: Record<RiskLevel, (o: UvObservation) => string> = {
  danger: () => "極端に強い。長時間の外出は避ける",
  high: () => "非常に強い。日焼け止め・帽子必須",
  mid: () => "強い。日中は対策推奨",
  low: (o) => (o.uvi >= 3 ? "中程度。長時間外出時は対策を" : "弱い"),
};

export const assessUv = (
  daily: WeatherDaily,
  policy: RiskPolicy<UvObservation> = DEFAULT_UV_POLICY,
): Metric => {
  const obs = observeUv(daily);
  const level = evaluatePolicy(policy, obs);
  return {
    id: MetricId.Uv,
    title: "UV 指数（最大）",
    icon: "☀️",
    level,
    value: obs.uvi.toFixed(1),
    unit: "UVI",
    note: NOTES[level](obs),
  };
};
