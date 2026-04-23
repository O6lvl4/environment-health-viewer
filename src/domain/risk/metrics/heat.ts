/**
 * 熱中症リスク。WBGT (湿球黒球温度) を Australian BoM 経験式で推定する。
 *   WBGT ≈ 0.567 T + 0.393 e + 3.94
 *   e    = (RH/100) · 6.105 · exp(17.27 T / (237.7 + T))
 * 屋外日射補正は省略 (屋内/日陰想定の簡易値)。
 */
import { type Metric, MetricId } from "../metric.js";
import { RiskLevel } from "../../shared/risk-level.js";
import { nearestHourIndex } from "../../shared/temporal.js";
import type { WeatherHourly } from "../../conditions/series.js";

export const estimateWBGT = (tempC: number, rh: number): number => {
  const e = (rh / 100) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC));
  return 0.567 * tempC + 0.393 * e + 3.94;
};

export const assessHeat = (hourly: WeatherHourly, now: Date): Metric => {
  const idx = nearestHourIndex(hourly.time, now);
  const t = hourly.temperature[idx];
  const rh = hourly.humidity[idx];
  const wbgt = estimateWBGT(t, rh);

  let level: RiskLevel;
  let note: string;
  if (wbgt >= 31) {
    level = RiskLevel.Danger;
    note = "原則すべての運動を中止すべき水準";
  } else if (wbgt >= 28) {
    level = RiskLevel.High;
    note = "激しい運動・長時間の屋外活動は中止";
  } else if (wbgt >= 25) {
    level = RiskLevel.Mid;
    note = "積極的に休憩・水分補給を";
  } else if (wbgt >= 21) {
    level = RiskLevel.Low;
    note = "通常レベル。水分補給は忘れずに";
  } else {
    level = RiskLevel.Low;
    note = `${t.toFixed(0)}℃ / 湿度 ${rh.toFixed(0)}%`;
  }

  return {
    id: MetricId.Heat,
    title: "熱中症リスク",
    icon: "🥵",
    level,
    value: wbgt.toFixed(1),
    unit: "WBGT",
    note,
  };
};
