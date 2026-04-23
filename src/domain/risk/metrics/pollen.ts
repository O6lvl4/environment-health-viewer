/**
 * 花粉リスク。樹種別最大 (TopVal) と合計 (Total) の両軸で判定する。
 * いずれの樹種データも無ければ null。
 */
import { type Metric, MetricId } from "../metric.js";
import { RiskLevel } from "../../shared/risk-level.js";
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

export const assessPollen = (air: AirQualityHourly, now: Date): Metric | null => {
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

  if (!anyData) return null;

  let level: RiskLevel;
  let note: string;
  if (topVal >= 50 || total >= 80) {
    level = RiskLevel.Danger;
    note = `${topName}が極めて多い (${topVal.toFixed(0)} grains/m³)`;
  } else if (topVal >= 25 || total >= 40) {
    level = RiskLevel.High;
    note = `${topName}が多め (${topVal.toFixed(0)} grains/m³)`;
  } else if (topVal >= 10 || total >= 15) {
    level = RiskLevel.Mid;
    note = `${topName}が少量 (${topVal.toFixed(0)} grains/m³)`;
  } else {
    level = RiskLevel.Low;
    note = "ほぼ飛散なし";
  }

  return {
    id: MetricId.Pollen,
    title: "花粉",
    icon: "🌾",
    level,
    value: total.toFixed(0),
    unit: "grains/m³",
    note,
  };
};
