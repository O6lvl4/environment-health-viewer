/**
 * 黄砂リスク。Open-Meteo の dust (μg/m³) を判定。
 * データが無ければ null を返してパネルから外す。
 */
import { type Metric, MetricId } from "../metric.js";
import { type RiskLevel } from "../../shared/risk-level.js";
import { type Specification } from "../../shared/specification.js";
import { type RiskPolicy, evaluatePolicy } from "../policy.js";
import { nearestHourIndex } from "../../shared/temporal.js";
import type { AirQualityHourly } from "../../conditions/series.js";

export type DustObservation = { readonly value: number };

export const observeDust = (
  air: AirQualityHourly,
  now: Date,
): DustObservation | null => {
  if (!air.dust) return null;
  const idx = nearestHourIndex(air.time, now);
  const v = air.dust[idx];
  if (v == null || Number.isNaN(v)) return null;
  return { value: v };
};

const dustAtLeast = (n: number): Specification<DustObservation> => (o) => o.value >= n;

export const DEFAULT_DUST_POLICY: RiskPolicy<DustObservation> = {
  rules: [
    { level: "danger", when: dustAtLeast(500) },
    { level: "high", when: dustAtLeast(200) },
    { level: "mid", when: dustAtLeast(80) },
  ],
};

const NOTES: Record<RiskLevel, (o: DustObservation) => string> = {
  danger: () => "視界に影響するレベル。外出は控えめに",
  high: () => "明確な黄砂飛来。敏感な方は屋外活動を控える",
  mid: () => "薄い黄砂が観測される量",
  low: () => "ほぼ影響なし",
};

export const assessDust = (
  air: AirQualityHourly,
  now: Date,
  policy: RiskPolicy<DustObservation> = DEFAULT_DUST_POLICY,
): Metric | null => {
  const obs = observeDust(air, now);
  if (!obs) return null;
  const level = evaluatePolicy(policy, obs);
  return {
    id: MetricId.Dust,
    title: "黄砂",
    icon: "🌫️",
    level,
    value: obs.value.toFixed(0),
    unit: "μg/m³",
    note: NOTES[level](obs),
  };
};
