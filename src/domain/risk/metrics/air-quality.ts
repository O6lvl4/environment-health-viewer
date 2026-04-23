/**
 * 大気質リスク。PM2.5 と European AQI の両方を見る (どちらかが閾値超で該当level)。
 */
import { type Metric, MetricId } from "../metric.js";
import { type RiskLevel } from "../../shared/risk-level.js";
import { type Specification, or } from "../../shared/specification.js";
import { type RiskPolicy, evaluatePolicy } from "../policy.js";
import { nearestHourIndex } from "../../shared/temporal.js";
import type { AirQualityHourly } from "../../conditions/series.js";

export type AirQualityObservation = {
  readonly pm25: number;
  readonly aqi: number;
};

export const observeAirQuality = (
  air: AirQualityHourly,
  now: Date,
): AirQualityObservation => {
  const idx = nearestHourIndex(air.time, now);
  return { pm25: air.pm25[idx], aqi: air.europeanAqi[idx] };
};

const pm25AtLeast = (n: number): Specification<AirQualityObservation> => (o) =>
  o.pm25 >= n;
const aqiAtLeast = (n: number): Specification<AirQualityObservation> => (o) =>
  o.aqi >= n;

export const DEFAULT_AIR_QUALITY_POLICY: RiskPolicy<AirQualityObservation> = {
  rules: [
    { level: "danger", when: or(pm25AtLeast(75), aqiAtLeast(100)) },
    { level: "high", when: or(pm25AtLeast(35), aqiAtLeast(80)) },
    { level: "mid", when: or(pm25AtLeast(15), aqiAtLeast(40)) },
  ],
};

const NOTES: Record<RiskLevel, (o: AirQualityObservation) => string> = {
  danger: () => "外出を控えめに、敏感な方はマスクを",
  high: () => "敏感な方は屋外活動を制限",
  mid: () => "屋外活動に支障なし、長時間運動は様子を見て",
  low: () => "良好",
};

export const assessAirQuality = (
  air: AirQualityHourly,
  now: Date,
  policy: RiskPolicy<AirQualityObservation> = DEFAULT_AIR_QUALITY_POLICY,
): Metric => {
  const obs = observeAirQuality(air, now);
  const level = evaluatePolicy(policy, obs);
  return {
    id: MetricId.AirQuality,
    title: "大気質 (PM2.5)",
    icon: "💨",
    level,
    value: obs.pm25 != null ? obs.pm25.toFixed(1) : "—",
    unit: "μg/m³",
    note: NOTES[level](obs),
  };
};
