import { describe, it, expect } from "vitest";
import {
  RiskLevel,
  compareRiskLevel,
  maxRiskLevel,
  riskLevelLabel,
  riskLevelStateText,
} from "./risk-level.js";

describe("RiskLevel", () => {
  it("compare は序列に従う", () => {
    expect(compareRiskLevel(RiskLevel.Low, RiskLevel.Danger)).toBeLessThan(0);
    expect(compareRiskLevel(RiskLevel.Danger, RiskLevel.Low)).toBeGreaterThan(0);
    expect(compareRiskLevel(RiskLevel.Mid, RiskLevel.Mid)).toBe(0);
  });

  it("maxRiskLevel は配列中の最大を返す", () => {
    expect(maxRiskLevel([RiskLevel.Low, RiskLevel.High, RiskLevel.Mid])).toBe(
      RiskLevel.High,
    );
    expect(maxRiskLevel([RiskLevel.Low, RiskLevel.Danger])).toBe(RiskLevel.Danger);
  });

  it("空配列のときは fallback を返す", () => {
    expect(maxRiskLevel([])).toBe(RiskLevel.Low);
    expect(maxRiskLevel([], RiskLevel.Mid)).toBe(RiskLevel.Mid);
  });

  it("riskLevelLabel は日本語表記を返す", () => {
    expect(riskLevelLabel(RiskLevel.Low)).toBe("低い");
    expect(riskLevelLabel(RiskLevel.Mid)).toBe("中程度");
    expect(riskLevelLabel(RiskLevel.High)).toBe("高い");
    expect(riskLevelLabel(RiskLevel.Danger)).toBe("危険");
  });

  it("riskLevelStateText は ALL CAPS の状態名", () => {
    expect(riskLevelStateText(RiskLevel.Low)).toBe("NOMINAL");
    expect(riskLevelStateText(RiskLevel.Mid)).toBe("ELEVATED");
    expect(riskLevelStateText(RiskLevel.High)).toBe("WARNING");
    expect(riskLevelStateText(RiskLevel.Danger)).toBe("CRITICAL");
  });
});
