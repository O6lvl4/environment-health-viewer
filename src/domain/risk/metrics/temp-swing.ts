/**
 * 寒暖差リスク。
 *   Diurnal = 当日 max - min
 *   DoD     = |当日 max - 前日 max|
 *   Swing   = max(Diurnal, DoD)
 */
import { type Metric, MetricId } from "../metric.js";
import { type RiskLevel } from "../../shared/risk-level.js";
import { type Specification } from "../../shared/specification.js";
import { type RiskPolicy, evaluatePolicy } from "../policy.js";
import { todayIndex, type WeatherDaily } from "../../conditions/series.js";

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

const swingAtLeast = (n: number): Specification<TempSwingObservation> => (o) =>
  o.swing >= n;

export const DEFAULT_TEMP_SWING_POLICY: RiskPolicy<TempSwingObservation> = {
  rules: [
    { level: "danger", when: swingAtLeast(13) },
    { level: "high", when: swingAtLeast(10) },
    { level: "mid", when: swingAtLeast(7) },
  ],
};

const NOTES: Record<RiskLevel, (o: TempSwingObservation) => string> = {
  danger: (o) =>
    `日較差 ${o.diurnal.toFixed(1)}℃ / 前日比 ${o.dod.toFixed(1)}℃。自律神経への負担大`,
  high: (o) =>
    `日較差 ${o.diurnal.toFixed(1)}℃ / 前日比 ${o.dod.toFixed(1)}℃。寒暖差疲労に注意`,
  mid: (o) => `日較差 ${o.diurnal.toFixed(1)}℃ / 前日比 ${o.dod.toFixed(1)}℃`,
  low: (o) => `日較差 ${o.diurnal.toFixed(1)}℃ / 前日比 ${o.dod.toFixed(1)}℃`,
};

export const assessTempSwing = (
  daily: WeatherDaily,
  policy: RiskPolicy<TempSwingObservation> = DEFAULT_TEMP_SWING_POLICY,
): Metric => {
  const obs = observeTempSwing(daily);
  const level = evaluatePolicy(policy, obs);
  return {
    id: MetricId.TempSwing,
    title: "寒暖差",
    icon: "🌡️",
    level,
    value: `${obs.tMin.toFixed(0)}↔${obs.tMax.toFixed(0)}`,
    unit: "℃",
    note: NOTES[level](obs),
  };
};
