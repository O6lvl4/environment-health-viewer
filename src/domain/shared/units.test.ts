import { describe, it, expect } from "vitest";
import {
  Hpa,
  Celsius,
  Percent,
  UvIndex,
  MicrogramsPerCubicMeter,
  GrainsPerCubicMeter,
  MmPerHour,
} from "./units.js";

describe("単位値オブジェクト", () => {
  it("Hpa は範囲外で RangeError", () => {
    expect(Hpa.of(1013)).toBe(1013);
    expect(() => Hpa.of(0)).toThrow(RangeError);
    expect(() => Hpa.of(2000)).toThrow(RangeError);
    expect(() => Hpa.of(NaN)).toThrow(RangeError);
  });

  it("Celsius は -90〜70 を許容", () => {
    expect(Celsius.of(20)).toBe(20);
    expect(Celsius.of(-89)).toBe(-89);
    expect(() => Celsius.of(-100)).toThrow(RangeError);
    expect(() => Celsius.of(100)).toThrow(RangeError);
  });

  it("Percent は 0-100 を許容", () => {
    expect(Percent.of(0)).toBe(0);
    expect(Percent.of(100)).toBe(100);
    expect(() => Percent.of(-1)).toThrow(RangeError);
    expect(() => Percent.of(101)).toThrow(RangeError);
  });

  it("UvIndex は 0-20 を許容", () => {
    expect(UvIndex.of(0)).toBe(0);
    expect(UvIndex.of(20)).toBe(20);
    expect(() => UvIndex.of(-0.1)).toThrow(RangeError);
    expect(() => UvIndex.of(21)).toThrow(RangeError);
  });

  it("μg/m³ と grains/m³ は非負を許容", () => {
    expect(MicrogramsPerCubicMeter.of(0)).toBe(0);
    expect(MicrogramsPerCubicMeter.of(500)).toBe(500);
    expect(() => MicrogramsPerCubicMeter.of(-1)).toThrow(RangeError);
    expect(GrainsPerCubicMeter.of(50)).toBe(50);
    expect(() => GrainsPerCubicMeter.of(-1)).toThrow(RangeError);
  });

  it("MmPerHour は非負", () => {
    expect(MmPerHour.of(0)).toBe(0);
    expect(MmPerHour.of(120)).toBe(120);
    expect(() => MmPerHour.of(-0.1)).toThrow(RangeError);
  });

  it("unsafe は検証なしで通す", () => {
    expect(Hpa.unsafe(99999)).toBe(99999);
  });
});
