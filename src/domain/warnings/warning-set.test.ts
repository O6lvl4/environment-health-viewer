import { describe, it, expect } from "vitest";
import { WarningSet, type ActiveWarning } from "./warning-set.js";
import { Severity } from "./severity.js";
import { Prefecture } from "../location/prefecture.js";
import { isOk } from "../shared/result.js";

const pref = (s: string) => {
  const r = Prefecture.of(s);
  if (!isOk(r)) throw new Error("test setup");
  return r.value;
};

describe("WarningSet", () => {
  it("severity 順でソートされる (alert → warn → info)", () => {
    const ws: ActiveWarning[] = [
      { code: "10", name: "大雨注意報", severity: Severity.Info, areas: [] },
      { code: "33", name: "大雨特別警報", severity: Severity.Alert, areas: [] },
      { code: "03", name: "大雨警報", severity: Severity.Warn, areas: [] },
    ];
    const set = WarningSet.create(pref("東京都"), null, ws);
    expect(set.warnings.map((w) => w.severity)).toEqual([
      Severity.Alert,
      Severity.Warn,
      Severity.Info,
    ]);
  });

  it("isEmpty は空集合の判定", () => {
    expect(WarningSet.isEmpty(WarningSet.create(pref("東京都"), null, []))).toBe(true);
  });
});
