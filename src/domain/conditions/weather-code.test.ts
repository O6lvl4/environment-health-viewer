import { describe, it, expect } from "vitest";
import { interpretWeatherCode } from "./weather-code.js";

describe("WMO weather-code", () => {
  it("既知コードはマッピングを返す", () => {
    expect(interpretWeatherCode(0)).toEqual({ code: 0, emoji: "☀️", label: "快晴" });
    expect(interpretWeatherCode(95).label).toBe("雷雨");
  });

  it("未知コードはフォールバックの絵文字 + 数値ラベル", () => {
    const r = interpretWeatherCode(999);
    expect(r.emoji).toBe("🌡️");
    expect(r.label).toContain("999");
  });
});
