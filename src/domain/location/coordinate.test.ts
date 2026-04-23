import { describe, it, expect } from "vitest";
import { Coordinate, Latitude, Longitude } from "./coordinate.js";
import { isOk, isErr } from "../shared/result.js";

describe("Coordinate", () => {
  it("Latitude / Longitude の検証", () => {
    expect(isOk(Latitude.of(0))).toBe(true);
    expect(isOk(Latitude.of(-90))).toBe(true);
    expect(isOk(Latitude.of(90))).toBe(true);
    expect(isErr(Latitude.of(91))).toBe(true);
    expect(isErr(Latitude.of(NaN))).toBe(true);

    expect(isOk(Longitude.of(180))).toBe(true);
    expect(isErr(Longitude.of(-181))).toBe(true);
  });

  it("Coordinate.create は両方が有効な時のみ ok", () => {
    const r = Coordinate.create(35.68, 139.65);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) {
      expect(r.value.latitude).toBe(35.68);
      expect(r.value.longitude).toBe(139.65);
    }
    expect(isErr(Coordinate.create(99, 0))).toBe(true);
    expect(isErr(Coordinate.create(0, 999))).toBe(true);
  });

  it("isInJapan は日本領域を判定", () => {
    const tokyo = Coordinate.create(35.68, 139.65);
    const ny = Coordinate.create(40.71, -74.0);
    expect(isOk(tokyo) && Coordinate.isInJapan(tokyo.value)).toBe(true);
    expect(isOk(ny) && Coordinate.isInJapan(ny.value)).toBe(false);
  });
});
