import { describe, it, expect } from "vitest";
import { assessMigraine, observeMigraine } from "./migraine.js";
import { RiskLevel } from "../../shared/risk-level.js";
import type { WeatherHourly } from "../../conditions/series.js";
import { Hpa, Celsius, Percent, MmPerHour } from "../../shared/units.js";

const buildHourly = (pressures: number[]): WeatherHourly => {
  const len = pressures.length;
  const time = Array.from({ length: len }, (_, i) =>
    new Date(2026, 3, 23, i, 0, 0).toISOString(),
  );
  const zero = (n: number) => Array.from({ length: len }, () => n);
  return {
    time,
    pressure: pressures.map(Hpa.unsafe),
    temperature: zero(20).map(Celsius.unsafe),
    humidity: zero(50).map(Percent.unsafe),
    weatherCode: zero(0),
    precipitation: zero(0).map(MmPerHour.unsafe),
    precipitationProbability: zero(0).map(Percent.unsafe),
  };
};

describe("assessMigraine", () => {
  const NOW = new Date(2026, 3, 23, 24, 0, 0); // 中央付近

  it("一定気圧なら low", () => {
    const hourly = buildHourly(Array(48).fill(1013));
    const m = assessMigraine(hourly, NOW);
    expect(m.level).toBe(RiskLevel.Low);
  });

  it("12h で 9hPa 低下なら danger", () => {
    const arr = Array(48).fill(1013).map((p, i) => (i >= 24 ? p - 9 : p));
    const m = assessMigraine(buildHourly(arr), NOW);
    expect(m.level).toBe(RiskLevel.Danger);
  });

  it("12h で 6hPa 低下なら high", () => {
    const arr = Array(48).fill(1013).map((p, i) => (i >= 24 ? p - 6 : p));
    const m = assessMigraine(buildHourly(arr), NOW);
    expect(m.level).toBe(RiskLevel.High);
  });

  it("12h で 3hPa 低下なら mid", () => {
    const arr = Array(48).fill(1013).map((p, i) => (i >= 24 ? p - 3 : p));
    const m = assessMigraine(buildHourly(arr), NOW);
    expect(m.level).toBe(RiskLevel.Mid);
  });

  it("observeMigraine が drop/swing を返す", () => {
    const arr = Array(48).fill(1013).map((p, i) => (i >= 24 ? p - 7 : p));
    const obs = observeMigraine(buildHourly(arr), NOW);
    expect(obs.maxDrop).toBeGreaterThanOrEqual(7);
    expect(obs.current).toBe(1006);
  });
});
