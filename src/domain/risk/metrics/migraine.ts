/**
 * 偏頭痛リスク。気圧の急変動 (12h 窓) を検出する。
 *   Drop  = 12h 窓における最大下降幅 (hPa)
 *   Swing = 12h 窓における最大変動幅 (上昇含む)
 */
import { type Metric, MetricId } from "../metric.js";
import { type RiskLevel } from "../../shared/risk-level.js";
import { nearestHourIndex, safeSlice } from "../../shared/temporal.js";
import { type Specification, or } from "../../shared/specification.js";
import { type RiskPolicy, evaluatePolicy } from "../policy.js";
import type { WeatherHourly } from "../../conditions/series.js";

export type MigraineObservation = {
  readonly current: number | null;
  readonly maxDrop: number;
  readonly maxSwing: number;
};

export const observeMigraine = (
  hourly: WeatherHourly,
  now: Date,
  windowHours = 12,
): MigraineObservation => {
  const idx = nearestHourIndex(hourly.time, now);
  const window = safeSlice(hourly.pressure, idx - 24, idx + 24);

  let maxDrop = 0;
  let maxRise = 0;
  for (let i = 0; i < window.length; i++) {
    for (let j = i + 1; j < Math.min(i + windowHours + 1, window.length); j++) {
      const diff = window[j] - window[i];
      if (diff < maxDrop) maxDrop = diff;
      if (diff > maxRise) maxRise = diff;
    }
  }
  const drop = Math.abs(maxDrop);

  return {
    current: hourly.pressure[idx] ?? null,
    maxDrop: drop,
    maxSwing: Math.max(drop, maxRise),
  };
};

const dropAtLeast = (n: number): Specification<MigraineObservation> => (o) =>
  o.maxDrop >= n;
const swingAtLeast = (n: number): Specification<MigraineObservation> => (o) =>
  o.maxSwing >= n;

export const DEFAULT_MIGRAINE_POLICY: RiskPolicy<MigraineObservation> = {
  rules: [
    { level: "danger", when: or(dropAtLeast(8), swingAtLeast(12)) },
    { level: "high", when: or(dropAtLeast(5), swingAtLeast(8)) },
    { level: "mid", when: or(dropAtLeast(3), swingAtLeast(5)) },
  ],
};

const NOTES: Record<RiskLevel, (o: MigraineObservation) => string> = {
  danger: (o) => `12h で最大 ${o.maxDrop.toFixed(1)} hPa の急降下。発症リスク非常に高め`,
  high: (o) => `12h で最大 ${o.maxDrop.toFixed(1)} hPa 低下。頭痛の出やすい気圧変動`,
  mid: (o) => `軽度の気圧変動 (${o.maxDrop.toFixed(1)} hPa)。敏感な人は注意`,
  low: () => "気圧は安定しています",
};

export const assessMigraine = (
  hourly: WeatherHourly,
  now: Date,
  policy: RiskPolicy<MigraineObservation> = DEFAULT_MIGRAINE_POLICY,
): Metric => {
  const obs = observeMigraine(hourly, now);
  const level = evaluatePolicy(policy, obs);
  return {
    id: MetricId.Migraine,
    title: "偏頭痛リスク",
    icon: "🧠",
    level,
    value: obs.current != null ? obs.current.toFixed(0) : "—",
    unit: "hPa",
    note: NOTES[level](obs),
  };
};
