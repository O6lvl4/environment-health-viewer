/**
 * 大気質リスク。PM2.5 と European AQI の両方を見る。
 */
import { type Metric, MetricId } from "../metric.js";
import { RiskLevel } from "../../shared/risk-level.js";
import { nearestHourIndex } from "../../shared/temporal.js";
import type { AirQualityHourly } from "../../conditions/series.js";

export const assessAirQuality = (air: AirQualityHourly, now: Date): Metric => {
  const idx = nearestHourIndex(air.time, now);
  const pm25 = air.pm25[idx];
  const aqi = air.europeanAqi[idx];

  let level: RiskLevel;
  let note: string;
  if (pm25 >= 75 || aqi >= 100) {
    level = RiskLevel.Danger;
    note = "外出を控えめに、敏感な方はマスクを";
  } else if (pm25 >= 35 || aqi >= 80) {
    level = RiskLevel.High;
    note = "敏感な方は屋外活動を制限";
  } else if (pm25 >= 15 || aqi >= 40) {
    level = RiskLevel.Mid;
    note = "屋外活動に支障なし、長時間運動は様子を見て";
  } else {
    level = RiskLevel.Low;
    note = "良好";
  }

  return {
    id: MetricId.AirQuality,
    title: "大気質 (PM2.5)",
    icon: "💨",
    level,
    value: pm25 != null ? pm25.toFixed(1) : "—",
    unit: "μg/m³",
    note,
  };
};
