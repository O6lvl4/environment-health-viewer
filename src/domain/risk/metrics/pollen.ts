/**
 * 花粉リスク。樹種別最大 (TopVal) と合計 (Total) の両軸で判定する。
 */
import { type Metric, MetricId } from "../metric.js";
import { type RiskLevel } from "../../shared/risk-level.js";
import { type Specification, or } from "../../shared/specification.js";
import { type RiskPolicy, evaluatePolicy } from "../policy.js";
import { nearestHourIndex } from "../../shared/temporal.js";
import type { AirQualityHourly } from "../../conditions/series.js";

const POLLEN_LABEL: Record<keyof Required<AirQualityHourly>["pollen"], string> = {
  alder: "ハンノキ",
  birch: "シラカバ",
  grass: "イネ科",
  mugwort: "ヨモギ",
  olive: "オリーブ",
  ragweed: "ブタクサ",
};

export type PollenObservation = {
  readonly total: number;
  readonly topVal: number;
  readonly topName: string;
};

export const observePollen = (
  air: AirQualityHourly,
  now: Date,
): PollenObservation | null => {
  const idx = nearestHourIndex(air.time, now);
  let total = 0;
  let topName = "";
  let topVal = 0;
  let anyData = false;

  for (const key of Object.keys(POLLEN_LABEL) as Array<keyof typeof POLLEN_LABEL>) {
    const arr = air.pollen[key];
    const v = arr?.[idx];
    if (v == null || Number.isNaN(v)) continue;
    anyData = true;
    total += v;
    if (v > topVal) {
      topVal = v;
      topName = POLLEN_LABEL[key];
    }
  }
  return anyData ? { total, topVal, topName } : null;
};

const topAtLeast = (n: number): Specification<PollenObservation> => (o) => o.topVal >= n;
const totalAtLeast = (n: number): Specification<PollenObservation> => (o) =>
  o.total >= n;

export const DEFAULT_POLLEN_POLICY: RiskPolicy<PollenObservation> = {
  rules: [
    { level: "danger", when: or(topAtLeast(50), totalAtLeast(80)) },
    { level: "high", when: or(topAtLeast(25), totalAtLeast(40)) },
    { level: "mid", when: or(topAtLeast(10), totalAtLeast(15)) },
  ],
};

const NOTES: Record<RiskLevel, (o: PollenObservation) => string> = {
  danger: (o) => `${o.topName}が極めて多い (${o.topVal.toFixed(0)} grains/m³)`,
  high: (o) => `${o.topName}が多め (${o.topVal.toFixed(0)} grains/m³)`,
  mid: (o) => `${o.topName}が少量 (${o.topVal.toFixed(0)} grains/m³)`,
  low: () => "ほぼ飛散なし",
};

export const assessPollen = (
  air: AirQualityHourly,
  now: Date,
  policy: RiskPolicy<PollenObservation> = DEFAULT_POLLEN_POLICY,
): Metric | null => {
  const obs = observePollen(air, now);
  if (!obs) return null;
  const level = evaluatePolicy(policy, obs);
  return {
    id: MetricId.Pollen,
    title: "花粉",
    icon: "🌾",
    level,
    value: obs.total.toFixed(0),
    unit: "grains/m³",
    note: NOTES[level](obs),
  };
};
