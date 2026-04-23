import { describe, it, expect } from "vitest";
import { Assessment } from "./assessment.js";
import { MetricId, type Metric } from "./metric.js";
import { RiskLevel } from "../shared/risk-level.js";

const m = (id: MetricId, level: RiskLevel, title: string): Metric => ({
  id,
  title,
  icon: "",
  level,
  value: "",
  unit: null,
  note: "",
});

describe("Assessment", () => {
  it("systemLevel は構成メトリクスの最大", () => {
    const a = Assessment.create([
      m(MetricId.Migraine, RiskLevel.Low, "偏頭痛"),
      m(MetricId.Heat, RiskLevel.High, "熱中症"),
      m(MetricId.Uv, RiskLevel.Mid, "UV"),
    ]);
    expect(Assessment.systemLevel(a)).toBe(RiskLevel.High);
  });

  it("summary は最大リスク項目の名前を含む", () => {
    const a = Assessment.create([
      m(MetricId.Migraine, RiskLevel.Danger, "偏頭痛リスク"),
      m(MetricId.Heat, RiskLevel.Mid, "熱中症リスク"),
    ]);
    const s = Assessment.summary(a);
    expect(s.level).toBe(RiskLevel.Danger);
    expect(s.message).toContain("偏頭痛リスク");
  });

  it("low のときは肯定メッセージ", () => {
    const a = Assessment.create([m(MetricId.Migraine, RiskLevel.Low, "偏頭痛")]);
    const s = Assessment.summary(a);
    expect(s.level).toBe(RiskLevel.Low);
    expect(s.message).toContain("良好");
  });
});
