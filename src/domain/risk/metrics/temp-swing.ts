/**
 * 寒暖差リスク。
 *   Diurnal Range = 当日 max - min
 *   DoD           = |当日 max - 前日 max|
 *   Swing         = max(Diurnal, DoD)
 */
import { type Metric, MetricId } from "../metric.js";
import { RiskLevel } from "../../shared/risk-level.js";
import type { WeatherDaily } from "../../conditions/series.js";
import { todayIndex } from "../../conditions/series.js";

export type TempSwingObservation = {
  readonly diurnal: number;
  readonly dod: number;
  readonly swing: number;
  readonly tMax: number;
  readonly tMin: number;
};

export const observeTempSwing = (daily: WeatherDaily): TempSwingObservation => {
  const idx = todayIndex(daily);
  const tMax = daily.temperatureMax[idx];
  const tMin = daily.temperatureMin[idx];
  const yMax = daily.temperatureMax[idx - 1];
  const diurnal = tMax - tMin;
  const dod = yMax != null ? Math.abs(tMax - yMax) : 0;
  return { diurnal, dod, swing: Math.max(diurnal, dod), tMax, tMin };
};

export const assessTempSwing = (daily: WeatherDaily): Metric => {
  const obs = observeTempSwing(daily);

  let level: RiskLevel;
  let note: string;
  if (obs.swing >= 13) {
    level = RiskLevel.Danger;
    note = `日較差 ${obs.diurnal.toFixed(1)}℃ / 前日比 ${obs.dod.toFixed(1)}℃。自律神経への負担大`;
  } else if (obs.swing >= 10) {
    level = RiskLevel.High;
    note = `日較差 ${obs.diurnal.toFixed(1)}℃ / 前日比 ${obs.dod.toFixed(1)}℃。寒暖差疲労に注意`;
  } else if (obs.swing >= 7) {
    level = RiskLevel.Mid;
    note = `日較差 ${obs.diurnal.toFixed(1)}℃ / 前日比 ${obs.dod.toFixed(1)}℃`;
  } else {
    level = RiskLevel.Low;
    note = `日較差 ${obs.diurnal.toFixed(1)}℃ / 前日比 ${obs.dod.toFixed(1)}℃`;
  }

  return {
    id: MetricId.TempSwing,
    title: "寒暖差",
    icon: "🌡️",
    level,
    value: `${obs.tMin.toFixed(0)}↔${obs.tMax.toFixed(0)}`,
    unit: "℃",
    note,
  };
};
