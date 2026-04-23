/**
 * ドメインが依存する外部世界への抽象 (Hexagonal の Ports)。
 * 実装は infrastructure/ 配下のアダプタが満たす。
 */
import type { Result } from "../domain/shared/result.js";
import type { Coordinate } from "../domain/location/coordinate.js";
import type { Location } from "../domain/location/location.js";
import type { Prefecture } from "../domain/location/prefecture.js";
import type {
  WeatherSnapshot,
  AirQualitySnapshot,
} from "../domain/conditions/series.js";
import type { WarningSet } from "../domain/warnings/warning-set.js";

export type FetchError = { readonly message: string; readonly cause?: unknown };

export type PositionProvider = {
  current(): Promise<Location>;
};

export type Geocoder = {
  reverse(coord: Coordinate): Promise<string | null>;
};

export type WeatherForecastProvider = {
  fetch(coord: Coordinate): Promise<Result<WeatherSnapshot, FetchError>>;
};

export type AirQualityProvider = {
  fetch(coord: Coordinate): Promise<Result<AirQualitySnapshot, FetchError>>;
};

export type WarningsProvider = {
  fetch(prefecture: Prefecture): Promise<Result<WarningSet, FetchError>>;
};
