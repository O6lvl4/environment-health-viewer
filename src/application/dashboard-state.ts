/**
 * Dashboard 全体の状態モデル。判別共用体で網羅性を強制する。
 */
import type { Location } from "../domain/location/location.js";
import type { Conditions } from "../domain/conditions/conditions.js";
import type { Assessment } from "../domain/risk/assessment.js";
import type { SolarCycle } from "../domain/solar/solar-cycle.js";
import type { WarningSet } from "../domain/warnings/warning-set.js";
import type { WeatherHourly } from "../domain/conditions/series.js";

export type DashboardData = {
  readonly observedAt: Date;
  readonly location: Location;
  readonly conditions: Conditions;
  readonly assessment: Assessment;
  readonly solar: SolarCycle | null;
  readonly warnings: WarningSet | null;
  /** 気圧チャート用に hourly をそのまま提示 (presentation 層が消費) */
  readonly hourly: WeatherHourly;
};

export type DashboardState =
  | { readonly status: "init" }
  | { readonly status: "loading"; readonly stage: "location" | "fetch" }
  | { readonly status: "ready"; readonly data: DashboardData }
  | { readonly status: "error"; readonly message: string };
