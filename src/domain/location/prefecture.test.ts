import { describe, it, expect } from "vitest";
import { Prefecture } from "./prefecture.js";
import { isOk, isErr } from "../shared/result.js";

describe("Prefecture", () => {
  it("既に正規形なら通す", () => {
    const r = Prefecture.of("東京都");
    expect(isOk(r) && r.value).toBe("東京都");
  });

  it("末尾サフィックスがなければ「県」を補う", () => {
    const r = Prefecture.of("神奈川");
    expect(isOk(r) && r.value).toBe("神奈川県");
  });

  it("空文字は err", () => {
    expect(isErr(Prefecture.of(""))).toBe(true);
    expect(isErr(Prefecture.of("   "))).toBe(true);
  });
});
