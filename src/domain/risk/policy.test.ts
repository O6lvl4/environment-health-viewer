import { describe, it, expect } from "vitest";
import { evaluatePolicy, type RiskPolicy } from "./policy.js";
import { RiskLevel } from "../shared/risk-level.js";

const policy: RiskPolicy<number> = {
  rules: [
    { level: "danger", when: (n) => n >= 100 },
    { level: "high", when: (n) => n >= 50 },
    { level: "mid", when: (n) => n >= 10 },
  ],
};

describe("RiskPolicy", () => {
  it("規則を上から評価し最初に満たした level を返す", () => {
    expect(evaluatePolicy(policy, 100)).toBe(RiskLevel.Danger);
    expect(evaluatePolicy(policy, 99)).toBe(RiskLevel.High);
    expect(evaluatePolicy(policy, 50)).toBe(RiskLevel.High);
    expect(evaluatePolicy(policy, 49)).toBe(RiskLevel.Mid);
    expect(evaluatePolicy(policy, 10)).toBe(RiskLevel.Mid);
    expect(evaluatePolicy(policy, 0)).toBe(RiskLevel.Low);
  });

  it("rules が空なら常に low", () => {
    expect(evaluatePolicy({ rules: [] }, 1000)).toBe(RiskLevel.Low);
  });
});
