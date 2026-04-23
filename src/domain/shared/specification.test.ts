import { describe, it, expect } from "vitest";
import { and, or, not, type Specification } from "./specification.js";

const isPositive: Specification<number> = (n) => n > 0;
const isEven: Specification<number> = (n) => n % 2 === 0;

describe("Specification", () => {
  it("and は両方真", () => {
    const spec = and(isPositive, isEven);
    expect(spec(2)).toBe(true);
    expect(spec(4)).toBe(true);
    expect(spec(-2)).toBe(false);
    expect(spec(3)).toBe(false);
  });

  it("or はどちらか真", () => {
    const spec = or(isPositive, isEven);
    expect(spec(2)).toBe(true);
    expect(spec(-2)).toBe(true);
    expect(spec(-3)).toBe(false);
  });

  it("not は反転", () => {
    expect(not(isPositive)(0)).toBe(true);
    expect(not(isPositive)(1)).toBe(false);
  });

  it("空 and / 空 or は単位元", () => {
    expect(and<number>()(0)).toBe(true);
    expect(or<number>()(0)).toBe(false);
  });
});
