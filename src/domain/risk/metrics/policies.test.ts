/**
 * 各メトリクスの DEFAULT_*_POLICY を、観測値オブジェクトを直接与えて検証する。
 * 観測量の生成 (observe*) と policy 判定が分離されたことを示す。
 */
import { describe, it, expect } from "vitest";
import { evaluatePolicy } from "../policy.js";
import { RiskLevel } from "../../shared/risk-level.js";
import { DEFAULT_MIGRAINE_POLICY } from "./migraine.js";
import { DEFAULT_TEMP_SWING_POLICY } from "./temp-swing.js";
import { DEFAULT_HEAT_POLICY } from "./heat.js";
import { DEFAULT_UV_POLICY } from "./uv.js";
import { DEFAULT_AIR_QUALITY_POLICY } from "./air-quality.js";
import { DEFAULT_DUST_POLICY } from "./dust.js";
import { DEFAULT_POLLEN_POLICY } from "./pollen.js";

describe("DEFAULT_MIGRAINE_POLICY", () => {
  const eval_ = (drop: number, swing: number) =>
    evaluatePolicy(DEFAULT_MIGRAINE_POLICY, { current: 1013, maxDrop: drop, maxSwing: swing });

  it("danger 境界 (drop ≥ 8)", () => {
    expect(eval_(7.99, 0)).toBe(RiskLevel.High);
    expect(eval_(8, 0)).toBe(RiskLevel.Danger);
  });
  it("high 境界 (drop ≥ 5)", () => {
    expect(eval_(4.99, 0)).toBe(RiskLevel.Mid);
    expect(eval_(5, 0)).toBe(RiskLevel.High);
  });
  it("mid 境界 (drop ≥ 3)", () => {
    expect(eval_(2.99, 0)).toBe(RiskLevel.Low);
    expect(eval_(3, 0)).toBe(RiskLevel.Mid);
  });
  it("swing も独立に効く", () => {
    expect(eval_(0, 12)).toBe(RiskLevel.Danger);
    expect(eval_(0, 8)).toBe(RiskLevel.High);
    expect(eval_(0, 5)).toBe(RiskLevel.Mid);
  });
});

describe("DEFAULT_TEMP_SWING_POLICY", () => {
  const eval_ = (swing: number) =>
    evaluatePolicy(DEFAULT_TEMP_SWING_POLICY, {
      diurnal: swing,
      dod: 0,
      swing,
      tMax: 0,
      tMin: 0,
    });
  it("境界値", () => {
    expect(eval_(13)).toBe(RiskLevel.Danger);
    expect(eval_(12.99)).toBe(RiskLevel.High);
    expect(eval_(10)).toBe(RiskLevel.High);
    expect(eval_(9.99)).toBe(RiskLevel.Mid);
    expect(eval_(7)).toBe(RiskLevel.Mid);
    expect(eval_(6.99)).toBe(RiskLevel.Low);
  });
});

describe("DEFAULT_HEAT_POLICY", () => {
  const eval_ = (wbgt: number) =>
    evaluatePolicy(DEFAULT_HEAT_POLICY, { tempC: 0, humidity: 0, wbgt });
  it("WBGT 境界", () => {
    expect(eval_(31)).toBe(RiskLevel.Danger);
    expect(eval_(30.99)).toBe(RiskLevel.High);
    expect(eval_(28)).toBe(RiskLevel.High);
    expect(eval_(27.99)).toBe(RiskLevel.Mid);
    expect(eval_(25)).toBe(RiskLevel.Mid);
    expect(eval_(24.99)).toBe(RiskLevel.Low);
  });
});

describe("DEFAULT_UV_POLICY", () => {
  const eval_ = (uvi: number) => evaluatePolicy(DEFAULT_UV_POLICY, { uvi });
  it("WHO 段階に従う", () => {
    expect(eval_(11)).toBe(RiskLevel.Danger);
    expect(eval_(10.99)).toBe(RiskLevel.High);
    expect(eval_(8)).toBe(RiskLevel.High);
    expect(eval_(7.99)).toBe(RiskLevel.Mid);
    expect(eval_(6)).toBe(RiskLevel.Mid);
    expect(eval_(5.99)).toBe(RiskLevel.Low);
  });
});

describe("DEFAULT_AIR_QUALITY_POLICY", () => {
  const eval_ = (pm25: number, aqi: number) =>
    evaluatePolicy(DEFAULT_AIR_QUALITY_POLICY, { pm25, aqi });
  it("PM2.5 と AQI のいずれかが閾値超で該当level", () => {
    expect(eval_(75, 0)).toBe(RiskLevel.Danger);
    expect(eval_(0, 100)).toBe(RiskLevel.Danger);
    expect(eval_(35, 0)).toBe(RiskLevel.High);
    expect(eval_(0, 80)).toBe(RiskLevel.High);
    expect(eval_(15, 0)).toBe(RiskLevel.Mid);
    expect(eval_(0, 40)).toBe(RiskLevel.Mid);
    expect(eval_(0, 0)).toBe(RiskLevel.Low);
  });
});

describe("DEFAULT_DUST_POLICY", () => {
  const eval_ = (v: number) => evaluatePolicy(DEFAULT_DUST_POLICY, { value: v });
  it("黄砂境界", () => {
    expect(eval_(500)).toBe(RiskLevel.Danger);
    expect(eval_(499.99)).toBe(RiskLevel.High);
    expect(eval_(200)).toBe(RiskLevel.High);
    expect(eval_(80)).toBe(RiskLevel.Mid);
    expect(eval_(79.99)).toBe(RiskLevel.Low);
  });
});

describe("DEFAULT_POLLEN_POLICY", () => {
  const eval_ = (top: number, total: number) =>
    evaluatePolicy(DEFAULT_POLLEN_POLICY, {
      total,
      topVal: top,
      topName: "テスト",
    });
  it("TopVal と Total のいずれかで該当level", () => {
    expect(eval_(50, 0)).toBe(RiskLevel.Danger);
    expect(eval_(0, 80)).toBe(RiskLevel.Danger);
    expect(eval_(25, 0)).toBe(RiskLevel.High);
    expect(eval_(0, 40)).toBe(RiskLevel.High);
    expect(eval_(10, 0)).toBe(RiskLevel.Mid);
    expect(eval_(0, 15)).toBe(RiskLevel.Mid);
    expect(eval_(0, 0)).toBe(RiskLevel.Low);
  });
});
