/**
 * 黄砂リスク。Open-Meteo の dust (μg/m³) を判定。
 * データが無い (undefined) なら null を返してパネルから外す。
 */
import { type Metric, MetricId } from "../metric.js";
import { RiskLevel } from "../../shared/risk-level.js";
import { nearestHourIndex } from "../../shared/temporal.js";
import type { AirQualityHourly } from "../../conditions/series.js";

export const assessDust = (air: AirQualityHourly, now: Date): Metric | null => {
  if (!air.dust) return null;
  const idx = nearestHourIndex(air.time, now);
  const v = air.dust[idx];
  if (v == null || Number.isNaN(v)) return null;

  let level: RiskLevel;
  let note: string;
  if (v >= 500) {
    level = RiskLevel.Danger;
    note = "視界に影響するレベル。外出は控えめに";
  } else if (v >= 200) {
    level = RiskLevel.High;
    note = "明確な黄砂飛来。敏感な方は屋外活動を控える";
  } else if (v >= 80) {
    level = RiskLevel.Mid;
    note = "薄い黄砂が観測される量";
  } else {
    level = RiskLevel.Low;
    note = "ほぼ影響なし";
  }

  return {
    id: MetricId.Dust,
    title: "黄砂",
    icon: "🌫️",
    level,
    value: v.toFixed(0),
    unit: "μg/m³",
    note,
  };
};
