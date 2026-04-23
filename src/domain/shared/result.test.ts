import { describe, it, expect } from "vitest";
import {
  ok,
  err,
  isOk,
  isErr,
  map,
  mapErr,
  flatMap,
  unwrapOr,
  fromThrowable,
  fromPromise,
} from "./result.js";

describe("Result", () => {
  it("ok / err / 判別述語", () => {
    expect(isOk(ok(1))).toBe(true);
    expect(isErr(ok(1))).toBe(false);
    expect(isOk(err("e"))).toBe(false);
    expect(isErr(err("e"))).toBe(true);
  });

  it("map は ok にだけ作用する", () => {
    expect(map(ok(2), (n) => n * 3)).toEqual(ok(6));
    expect(map(err("e"), (n: number) => n * 3)).toEqual(err("e"));
  });

  it("mapErr は err にだけ作用する", () => {
    expect(mapErr(ok(2), (e: string) => `wrap:${e}`)).toEqual(ok(2));
    expect(mapErr(err("boom"), (e) => `wrap:${e}`)).toEqual(err("wrap:boom"));
  });

  it("flatMap は ok を平坦化する", () => {
    expect(flatMap(ok(2), (n) => ok(n + 1))).toEqual(ok(3));
    expect(flatMap(ok(2), (_n) => err("nope"))).toEqual(err("nope"));
    expect(flatMap(err("first"), (n: number) => ok(n + 1))).toEqual(err("first"));
  });

  it("unwrapOr で fallback が機能する", () => {
    expect(unwrapOr(ok(1), 9)).toBe(1);
    expect(unwrapOr(err("x"), 9)).toBe(9);
  });

  it("fromThrowable は throw を err に変換する", () => {
    const r = fromThrowable<number>(() => {
      throw new Error("nope");
    });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.message).toBe("nope");
  });

  it("fromPromise は reject を err に変換する", async () => {
    const r1 = await fromPromise(Promise.resolve(42));
    expect(r1).toEqual(ok(42));
    const r2 = await fromPromise(Promise.reject(new Error("bad")));
    expect(isErr(r2)).toBe(true);
  });
});
