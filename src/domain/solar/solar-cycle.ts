/**
 * SolarCycle: 日の出/日の入り/日長の VO。SOLAR/CYCLE パネルで消費する。
 */
import type { WeatherDaily } from "../conditions/series.js";
import { todayIndex } from "../conditions/series.js";

export type DayLength = {
  readonly hours: number;
  readonly minutes: number;
};

export type SolarCycle = {
  readonly sunrise: Date;
  readonly sunset: Date;
  readonly dayLength: DayLength;
};

export const SolarCycle = {
  fromDaily: (daily: WeatherDaily): SolarCycle | null => {
    const idx = todayIndex(daily);
    const sr = daily.sunrise[idx];
    const ss = daily.sunset[idx];
    if (!sr || !ss) return null;
    const sunrise = new Date(sr);
    const sunset = new Date(ss);
    const lenMs = sunset.getTime() - sunrise.getTime();
    if (!Number.isFinite(lenMs) || lenMs < 0) return null;
    return {
      sunrise,
      sunset,
      dayLength: {
        hours: Math.floor(lenMs / 3_600_000),
        minutes: Math.floor((lenMs % 3_600_000) / 60_000),
      },
    };
  },
};
