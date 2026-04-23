import { describe, it, expect } from "vitest";
import { OfficeCode } from "./office-code.js";
import { Prefecture } from "../location/prefecture.js";
import { isOk } from "../shared/result.js";

const pref = (s: string) => {
  const r = Prefecture.of(s);
  if (!isOk(r)) throw new Error("test setup");
  return r.value;
};

describe("OfficeCode", () => {
  it("既知の都道府県はコードを返す", () => {
    expect(OfficeCode.forPrefecture(pref("東京都"))).toBe("130000");
    expect(OfficeCode.forPrefecture(pref("大阪府"))).toBe("270000");
    expect(OfficeCode.forPrefecture(pref("沖縄県"))).toBe("471000");
  });

  it("未知の都道府県は null", () => {
    expect(OfficeCode.forPrefecture(pref("架空県"))).toBeNull();
  });
});
