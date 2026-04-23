import { describe, it, expect } from "vitest";
import { assessTempSwing, observeTempSwing } from "./temp-swing.js";
import { RiskLevel } from "../../shared/risk-level.js";
import type { WeatherDaily } from "../../conditions/series.js";
import { Celsius, UvIndex } from "../../shared/units.js";

const daily = (yMax: number, tMax: number, tMin: number): WeatherDaily => ({
  time: ["2026-04-22", "2026-04-23", "2026-04-24"],
  temperatureMax: [yMax, tMax, tMax + 1].map(Celsius.unsafe),
  temperatureMin: [yMax - 8, tMin, tMin + 1].map(Celsius.unsafe),
  uvIndexMax: [0, 0, 0].map(UvIndex.unsafe),
  sunrise: ["", "", ""],
  sunset: ["", "", ""],
});

describe("assessTempSwing", () => {
  it("差が小さければ low", () => {
    expect(assessTempSwing(daily(20, 22, 17)).level).toBe(RiskLevel.Low);
  });

  it("日較差 7 で mid", () => {
    expect(assessTempSwing(daily(22, 22, 15)).level).toBe(RiskLevel.Mid);
  });

  it("日較差 10 で high", () => {
    expect(assessTempSwing(daily(22, 22, 12)).level).toBe(RiskLevel.High);
  });

  it("日較差 13 で danger", () => {
    expect(assessTempSwing(daily(22, 22, 9)).level).toBe(RiskLevel.Danger);
  });

  it("前日比 swing でも判定する", () => {
    // 当日 max=20, min=18 (diurnal=2), 前日 max=8 → DoD=12 で high
    expect(assessTempSwing(daily(8, 20, 18)).level).toBe(RiskLevel.High);
  });

  it("observeTempSwing が swing と内訳を返す", () => {
    const obs = observeTempSwing(daily(8, 20, 18));
    expect(obs.diurnal).toBe(2);
    expect(obs.dod).toBe(12);
    expect(obs.swing).toBe(12);
  });
});
