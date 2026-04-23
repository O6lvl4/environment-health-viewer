import { describe, it, expect } from "vitest";
import { nearestHourIndex, safeSlice } from "./temporal.js";

describe("temporal", () => {
  it("nearestHourIndex は最も近い時刻インデックスを返す", () => {
    const times = ["2026-04-23T10:00:00Z", "2026-04-23T11:00:00Z", "2026-04-23T12:00:00Z"];
    expect(nearestHourIndex(times, new Date("2026-04-23T10:20:00Z"))).toBe(0);
    expect(nearestHourIndex(times, new Date("2026-04-23T10:50:00Z"))).toBe(1);
    expect(nearestHourIndex(times, new Date("2026-04-23T11:31:00Z"))).toBe(2);
  });

  it("空配列なら -1", () => {
    expect(nearestHourIndex([], new Date())).toBe(-1);
  });

  it("safeSlice は境界外でクリップする", () => {
    const a = [1, 2, 3, 4, 5];
    expect(safeSlice(a, -2, 3)).toEqual([1, 2, 3]);
    expect(safeSlice(a, 3, 100)).toEqual([4, 5]);
    expect(safeSlice(a, 10, 20)).toEqual([]);
  });
});
