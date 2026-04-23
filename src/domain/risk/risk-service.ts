/**
 * Risk Domain Service: スナップショットからアセスメントを構築する。
 * 各メトリクスの順序と存在条件はここで決定する (集約のファクトリ)。
 */
import { Assessment } from "./assessment.js";
import type { WeatherSnapshot, AirQualitySnapshot } from "../conditions/series.js";
import { assessMigraine } from "./metrics/migraine.js";
import { assessTempSwing } from "./metrics/temp-swing.js";
import { assessHeat } from "./metrics/heat.js";
import { assessUv } from "./metrics/uv.js";
import { assessAirQuality } from "./metrics/air-quality.js";
import { assessDust } from "./metrics/dust.js";
import { assessPollen } from "./metrics/pollen.js";

export const buildAssessment = (
  weather: WeatherSnapshot,
  air: AirQualitySnapshot,
  now: Date,
): Assessment => {
  const metrics = [
    assessMigraine(weather.hourly, now),
    assessTempSwing(weather.daily),
    assessHeat(weather.hourly, now),
    assessUv(weather.daily),
    assessAirQuality(air.hourly, now),
    assessDust(air.hourly, now),
    assessPollen(air.hourly, now),
  ].filter((m): m is NonNullable<typeof m> => m !== null);

  return Assessment.create(metrics);
};
