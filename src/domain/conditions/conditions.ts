/**
 * Conditions: 「現時点」の素データのスナップショット VO。
 * リスク判定はしない単なる集約。NOW/COND パネルが直接消費する。
 */
import type { Celsius, Percent, MmPerHour } from "../shared/units.js";
import { nearestHourIndex } from "../shared/temporal.js";
import type { WeatherSnapshot } from "./series.js";
import { todayIndex } from "./series.js";
import { type WeatherCondition, interpretWeatherCode } from "./weather-code.js";

export type Conditions = {
  readonly observedAt: Date;
  readonly temperature: Celsius;
  readonly humidity: Percent;
  readonly todayMax: Celsius;
  readonly todayMin: Celsius;
  readonly weather: WeatherCondition;
  readonly rainProbabilityNext6h: Percent;
  readonly precipitationNow: MmPerHour;
};

const RAIN_LOOKAHEAD_HOURS = 6;

export const Conditions = {
  observe: (snapshot: WeatherSnapshot, now: Date): Conditions => {
    const idx = nearestHourIndex(snapshot.hourly.time, now);
    const dayIdx = todayIndex(snapshot.daily);

    const probArr = snapshot.hourly.precipitationProbability;
    let maxProb = 0;
    for (let i = idx; i < Math.min(idx + RAIN_LOOKAHEAD_HOURS, probArr.length); i++) {
      const p = probArr[i] ?? 0;
      if (p > maxProb) maxProb = p;
    }

    return {
      observedAt: now,
      temperature: snapshot.hourly.temperature[idx],
      humidity: snapshot.hourly.humidity[idx],
      todayMax: snapshot.daily.temperatureMax[dayIdx],
      todayMin: snapshot.daily.temperatureMin[dayIdx],
      weather: interpretWeatherCode(snapshot.hourly.weatherCode[idx] ?? 0),
      rainProbabilityNext6h: maxProb as Percent,
      precipitationNow: snapshot.hourly.precipitation[idx] ?? (0 as MmPerHour),
    };
  },
};
