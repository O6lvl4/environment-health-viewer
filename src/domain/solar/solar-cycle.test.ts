import { describe, it, expect } from "vitest";
import { SolarCycle } from "./solar-cycle.js";
import type { WeatherDaily } from "../conditions/series.js";
import type { Celsius, UvIndex } from "../shared/units.js";

const dummy = {
  temperatureMax: [] as ReadonlyArray<Celsius>,
  temperatureMin: [] as ReadonlyArray<Celsius>,
  uvIndexMax: [] as ReadonlyArray<UvIndex>,
} satisfies Partial<WeatherDaily>;

describe("SolarCycle", () => {
  it("当日 (idx=1) の日の出/日の入りから日長を算出", () => {
    const daily: WeatherDaily = {
      ...dummy,
      time: ["2026-04-22", "2026-04-23", "2026-04-24"],
      sunrise: ["", "2026-04-23T05:00:00+09:00", ""],
      sunset: ["", "2026-04-23T18:30:00+09:00", ""],
    };
    const r = SolarCycle.fromDaily(daily);
    expect(r).not.toBeNull();
    expect(r!.dayLength).toEqual({ hours: 13, minutes: 30 });
  });

  it("欠損時は null", () => {
    const daily: WeatherDaily = {
      ...dummy,
      time: ["2026-04-22", "2026-04-23", "2026-04-24"],
      sunrise: ["", "", ""],
      sunset: ["", "", ""],
    };
    expect(SolarCycle.fromDaily(daily)).toBeNull();
  });
});
