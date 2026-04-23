/**
 * 偏頭痛リスク。気圧の急変動 (12h 窓) を検出する。
 *
 * 観測量:
 *   Drop  - 12h 窓における最大下降幅 (hPa)
 *   Swing - 12h 窓における最大変動幅 (上昇含む)
 */
import { type Metric, MetricId } from "../metric.js";
import { RiskLevel } from "../../shared/risk-level.js";
import { nearestHourIndex, safeSlice } from "../../shared/temporal.js";
import type { WeatherHourly } from "../../conditions/series.js";

export type MigrainePolicy = {
  readonly windowHours: number;
  readonly thresholds: {
    readonly mid: { drop: number; swing: number };
    readonly high: { drop: number; swing: number };
    readonly danger: { drop: number; swing: number };
  };
};

export const DEFAULT_MIGRAINE_POLICY: MigrainePolicy = {
  windowHours: 12,
  thresholds: {
    mid: { drop: 3, swing: 5 },
    high: { drop: 5, swing: 8 },
    danger: { drop: 8, swing: 12 },
  },
};

export type MigraineObservation = {
  readonly current: number | null;
  readonly maxDrop: number;
  readonly maxSwing: number;
};

export const observeMigraine = (
  hourly: WeatherHourly,
  now: Date,
  policy: MigrainePolicy = DEFAULT_MIGRAINE_POLICY,
): MigraineObservation => {
  const idx = nearestHourIndex(hourly.time, now);
  const window = safeSlice(hourly.pressure, idx - 24, idx + 24);
  const w = policy.windowHours;

  let maxDrop = 0;
  let maxRise = 0;
  for (let i = 0; i < window.length; i++) {
    for (let j = i + 1; j < Math.min(i + w + 1, window.length); j++) {
      const diff = window[j] - window[i];
      if (diff < maxDrop) maxDrop = diff;
      if (diff > maxRise) maxRise = diff;
    }
  }
  const drop = Math.abs(maxDrop);
  const swing = Math.max(drop, maxRise);

  return {
    current: hourly.pressure[idx] ?? null,
    maxDrop: drop,
    maxSwing: swing,
  };
};

export const assessMigraine = (
  hourly: WeatherHourly,
  now: Date,
  policy: MigrainePolicy = DEFAULT_MIGRAINE_POLICY,
): Metric => {
  const obs = observeMigraine(hourly, now, policy);
  const t = policy.thresholds;

  let level: RiskLevel;
  let note: string;
  if (obs.maxDrop >= t.danger.drop || obs.maxSwing >= t.danger.swing) {
    level = RiskLevel.Danger;
    note = `12h で最大 ${obs.maxDrop.toFixed(1)} hPa の急降下。発症リスク非常に高め`;
  } else if (obs.maxDrop >= t.high.drop || obs.maxSwing >= t.high.swing) {
    level = RiskLevel.High;
    note = `12h で最大 ${obs.maxDrop.toFixed(1)} hPa 低下。頭痛の出やすい気圧変動`;
  } else if (obs.maxDrop >= t.mid.drop || obs.maxSwing >= t.mid.swing) {
    level = RiskLevel.Mid;
    note = `軽度の気圧変動 (${obs.maxDrop.toFixed(1)} hPa)。敏感な人は注意`;
  } else {
    level = RiskLevel.Low;
    note = "気圧は安定しています";
  }

  return {
    id: MetricId.Migraine,
    title: "偏頭痛リスク",
    icon: "🧠",
    level,
    value: obs.current != null ? obs.current.toFixed(0) : "—",
    unit: "hPa",
    note,
  };
};
