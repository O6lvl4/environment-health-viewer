import { describe, it, expect } from "vitest";
import { estimateWBGT, assessHeat } from "./heat.js";
import { RiskLevel } from "../../shared/risk-level.js";
import type { WeatherHourly } from "../../conditions/series.js";
import { Hpa, Celsius, Percent, MmPerHour } from "../../shared/units.js";

const NOW = new Date(2026, 6, 1, 14, 0, 0);

const hourly = (tempC: number, rh: number): WeatherHourly => ({
  time: [NOW.toISOString()],
  pressure: [Hpa.unsafe(1013)],
  temperature: [Celsius.unsafe(tempC)],
  humidity: [Percent.unsafe(rh)],
  weatherCode: [0],
  precipitation: [MmPerHour.unsafe(0)],
  precipitationProbability: [Percent.unsafe(0)],
});

describe("WBGT", () => {
  it("estimateWBGT は単調性を満たす (温湿度↑ で WBGT↑)", () => {
    expect(estimateWBGT(30, 60)).toBeGreaterThan(estimateWBGT(20, 60));
    expect(estimateWBGT(30, 80)).toBeGreaterThan(estimateWBGT(30, 40));
  });

  it("BoM式: 30℃/RH70% は概ね 31〜34 (危険域)", () => {
    const v = estimateWBGT(30, 70);
    expect(v).toBeGreaterThan(31);
    expect(v).toBeLessThan(34);
  });

  it("BoM式: 25℃/RH50% は概ね 22〜25 (注意域)", () => {
    const v = estimateWBGT(25, 50);
    expect(v).toBeGreaterThan(22);
    expect(v).toBeLessThan(25);
  });
});

describe("assessHeat", () => {
  it("涼しい日は low", () => {
    expect(assessHeat(hourly(10, 50), NOW).level).toBe(RiskLevel.Low);
  });

  it("猛暑日は danger 寄り", () => {
    const m = assessHeat(hourly(38, 80), NOW);
    expect([RiskLevel.High, RiskLevel.Danger]).toContain(m.level);
  });
});
