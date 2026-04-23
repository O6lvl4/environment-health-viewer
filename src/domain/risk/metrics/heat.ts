/**
 * 熱中症リスク。WBGT (湿球黒球温度) を Australian BoM 経験式で推定する。
 *   WBGT ≈ 0.567 T + 0.393 e + 3.94
 *   e    = (RH/100) · 6.105 · exp(17.27 T / (237.7 + T))
 * 屋外日射補正は省略 (屋内/日陰想定の簡易値)。
 */
import { type Metric, MetricId } from "../metric.js";
import { type RiskLevel } from "../../shared/risk-level.js";
import { type Specification } from "../../shared/specification.js";
import { type RiskPolicy, evaluatePolicy } from "../policy.js";
import { nearestHourIndex } from "../../shared/temporal.js";
import type { WeatherHourly } from "../../conditions/series.js";

export type HeatObservation = {
  readonly tempC: number;
  readonly humidity: number;
  readonly wbgt: number;
};

export const estimateWBGT = (tempC: number, rh: number): number => {
  const e = (rh / 100) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC));
  return 0.567 * tempC + 0.393 * e + 3.94;
};

export const observeHeat = (hourly: WeatherHourly, now: Date): HeatObservation => {
  const idx = nearestHourIndex(hourly.time, now);
  const tempC = hourly.temperature[idx];
  const humidity = hourly.humidity[idx];
  return { tempC, humidity, wbgt: estimateWBGT(tempC, humidity) };
};

const wbgtAtLeast = (n: number): Specification<HeatObservation> => (o) => o.wbgt >= n;

export const DEFAULT_HEAT_POLICY: RiskPolicy<HeatObservation> = {
  rules: [
    { level: "danger", when: wbgtAtLeast(31) },
    { level: "high", when: wbgtAtLeast(28) },
    { level: "mid", when: wbgtAtLeast(25) },
  ],
};

const NOTES: Record<RiskLevel, (o: HeatObservation) => string> = {
  danger: () => "原則すべての運動を中止すべき水準",
  high: () => "激しい運動・長時間の屋外活動は中止",
  mid: () => "積極的に休憩・水分補給を",
  low: (o) =>
    o.wbgt >= 21
      ? "通常レベル。水分補給は忘れずに"
      : `${o.tempC.toFixed(0)}℃ / 湿度 ${o.humidity.toFixed(0)}%`,
};

export const assessHeat = (
  hourly: WeatherHourly,
  now: Date,
  policy: RiskPolicy<HeatObservation> = DEFAULT_HEAT_POLICY,
): Metric => {
  const obs = observeHeat(hourly, now);
  const level = evaluatePolicy(policy, obs);
  return {
    id: MetricId.Heat,
    title: "熱中症リスク",
    icon: "🥵",
    level,
    value: obs.wbgt.toFixed(1),
    unit: "WBGT",
    note: NOTES[level](obs),
  };
};
