/**
 * 数値プリミティブの値オブジェクト群。
 * Brand型でコンパイル時に単位を区別する。
 *
 * 構築は `<Type>.of(n)` でバリデーション付き。範囲外は throw する
 * （これは「あり得ない値」=プログラマエラーとして扱う方針）。
 * 外部 API の値を取り込むときは Result/型ガード経由で必ず検証してから .of() を呼ぶ。
 */
import type { Brand } from "./brand.js";

// ─── 大気圧 (海面) ──────────────────────────────
export type Hpa = Brand<number, "Hpa">;
export const Hpa = {
  of: (n: number): Hpa => {
    if (!Number.isFinite(n) || n < 800 || n > 1100) {
      throw new RangeError(`Hpa out of range: ${n}`);
    }
    return n as Hpa;
  },
  unsafe: (n: number): Hpa => n as Hpa,
};

// ─── 気温 ──────────────────────────────────────
export type Celsius = Brand<number, "Celsius">;
export const Celsius = {
  of: (n: number): Celsius => {
    if (!Number.isFinite(n) || n < -90 || n > 70) {
      throw new RangeError(`Celsius out of range: ${n}`);
    }
    return n as Celsius;
  },
  unsafe: (n: number): Celsius => n as Celsius,
};

// ─── 相対湿度 [0-100] ────────────────────────────
export type Percent = Brand<number, "Percent">;
export const Percent = {
  of: (n: number): Percent => {
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      throw new RangeError(`Percent out of range: ${n}`);
    }
    return n as Percent;
  },
  unsafe: (n: number): Percent => n as Percent,
};

// ─── UV指数 ─────────────────────────────────────
export type UvIndex = Brand<number, "UvIndex">;
export const UvIndex = {
  of: (n: number): UvIndex => {
    if (!Number.isFinite(n) || n < 0 || n > 20) {
      throw new RangeError(`UvIndex out of range: ${n}`);
    }
    return n as UvIndex;
  },
  unsafe: (n: number): UvIndex => n as UvIndex,
};

// ─── μg/m³ (PM, 黄砂) ──────────────────────────
export type MicrogramsPerCubicMeter = Brand<number, "MicrogramsPerCubicMeter">;
export const MicrogramsPerCubicMeter = {
  of: (n: number): MicrogramsPerCubicMeter => {
    if (!Number.isFinite(n) || n < 0) {
      throw new RangeError(`μg/m³ out of range: ${n}`);
    }
    return n as MicrogramsPerCubicMeter;
  },
  unsafe: (n: number): MicrogramsPerCubicMeter => n as MicrogramsPerCubicMeter,
};

// ─── grains/m³ (花粉) ──────────────────────────
export type GrainsPerCubicMeter = Brand<number, "GrainsPerCubicMeter">;
export const GrainsPerCubicMeter = {
  of: (n: number): GrainsPerCubicMeter => {
    if (!Number.isFinite(n) || n < 0) {
      throw new RangeError(`grains/m³ out of range: ${n}`);
    }
    return n as GrainsPerCubicMeter;
  },
  unsafe: (n: number): GrainsPerCubicMeter => n as GrainsPerCubicMeter,
};

// ─── mm/h (降水) ──────────────────────────────
export type MmPerHour = Brand<number, "MmPerHour">;
export const MmPerHour = {
  of: (n: number): MmPerHour => {
    if (!Number.isFinite(n) || n < 0) {
      throw new RangeError(`mm/h out of range: ${n}`);
    }
    return n as MmPerHour;
  },
  unsafe: (n: number): MmPerHour => n as MmPerHour,
};
