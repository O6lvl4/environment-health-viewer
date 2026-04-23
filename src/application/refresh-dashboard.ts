/**
 * Use Case: ダッシュボード全体を最新状態に更新する。
 *   1. 現在地を取得
 *   2. 気象 + 大気質を並行取得
 *   3. ドメインで Conditions / Assessment / SolarCycle を構築
 *   4. (日本国内 + 都道府県名取得成功時) JMA 警報を取得
 *
 * 副作用は注入された Ports に閉じ込め、本ユースケース自体は純関数 (時刻も注入)。
 */
import type {
  AirQualityProvider,
  Geocoder,
  PositionProvider,
  WarningsProvider,
  WeatherForecastProvider,
} from "./ports.js";
import type { DashboardData } from "./dashboard-state.js";
import { type Result, ok, err, isOk } from "../domain/shared/result.js";
import { Coordinate } from "../domain/location/coordinate.js";
import { Location } from "../domain/location/location.js";
import { Prefecture } from "../domain/location/prefecture.js";
import { Conditions } from "../domain/conditions/conditions.js";
import { SolarCycle } from "../domain/solar/solar-cycle.js";
import { buildAssessment } from "../domain/risk/risk-service.js";
import type { WarningSet } from "../domain/warnings/warning-set.js";

export type Clock = () => Date;

export type RefreshDeps = {
  readonly position: PositionProvider;
  readonly geocoder: Geocoder;
  readonly forecast: WeatherForecastProvider;
  readonly airQuality: AirQualityProvider;
  readonly warnings: WarningsProvider;
  readonly clock: Clock;
};

export type RefreshError = {
  readonly stage: "fetch";
  readonly message: string;
};

export const refreshDashboard = async (
  deps: RefreshDeps,
  onStage?: (stage: "location" | "fetch") => void,
): Promise<Result<DashboardData, RefreshError>> => {
  onStage?.("location");
  const location = await deps.position.current();

  onStage?.("fetch");
  const [forecast, air] = await Promise.all([
    deps.forecast.fetch(location.coordinate),
    deps.airQuality.fetch(location.coordinate),
  ]);

  if (!isOk(forecast)) {
    return err({ stage: "fetch", message: forecast.error.message });
  }
  if (!isOk(air)) {
    return err({ stage: "fetch", message: air.error.message });
  }

  const now = deps.clock();
  const conditions = Conditions.observe(forecast.value, now);
  const assessment = buildAssessment(forecast.value, air.value, now);
  const solar = SolarCycle.fromDaily(forecast.value.daily);

  // ロケーションラベル + JMA警報は補助情報。失敗してもダッシュボード本体は表示する。
  const enriched = await enrichWithGeocoding(location, deps);
  const warnings = await maybeFetchWarnings(enriched, deps);

  return ok({
    observedAt: now,
    location: enriched,
    conditions,
    assessment,
    solar,
    warnings,
    hourly: forecast.value.hourly,
  });
};

const enrichWithGeocoding = async (
  loc: Location,
  deps: RefreshDeps,
): Promise<Location> => {
  try {
    const label = await deps.geocoder.reverse(loc.coordinate);
    return Location.withLabel(loc, label);
  } catch {
    return loc;
  }
};

const maybeFetchWarnings = async (
  loc: Location,
  deps: RefreshDeps,
): Promise<WarningSet | null> => {
  if (!Coordinate.isInJapan(loc.coordinate)) return null;
  if (!loc.label) return null;
  const seg = loc.label.split(/\s+/)[0];
  const prefRes = Prefecture.of(seg);
  if (!isOk(prefRes)) return null;
  const r = await deps.warnings.fetch(prefRes.value);
  return isOk(r) ? r.value : null;
};
