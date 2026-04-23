/**
 * 気象および大気質の時系列スナップショット。
 * インフラ層が API レスポンスを検証してこれらのVOに詰める。
 * 全ての配列は time 配列のインデックスで揃う不変条件を持つ。
 */
import type {
  Hpa,
  Celsius,
  Percent,
  UvIndex,
  MicrogramsPerCubicMeter,
  GrainsPerCubicMeter,
  MmPerHour,
} from "../shared/units.js";

export type WeatherHourly = {
  readonly time: ReadonlyArray<string>;
  readonly pressure: ReadonlyArray<Hpa>;
  readonly temperature: ReadonlyArray<Celsius>;
  readonly humidity: ReadonlyArray<Percent>;
  readonly weatherCode: ReadonlyArray<number>;
  readonly precipitation: ReadonlyArray<MmPerHour>;
  readonly precipitationProbability: ReadonlyArray<Percent>;
};

export type WeatherDaily = {
  readonly time: ReadonlyArray<string>;
  readonly temperatureMax: ReadonlyArray<Celsius>;
  readonly temperatureMin: ReadonlyArray<Celsius>;
  readonly uvIndexMax: ReadonlyArray<UvIndex>;
  readonly sunrise: ReadonlyArray<string>;
  readonly sunset: ReadonlyArray<string>;
};

export type WeatherSnapshot = {
  readonly hourly: WeatherHourly;
  readonly daily: WeatherDaily;
  readonly timezone: string;
};

export type PollenHourly = {
  readonly alder?: ReadonlyArray<GrainsPerCubicMeter>;
  readonly birch?: ReadonlyArray<GrainsPerCubicMeter>;
  readonly grass?: ReadonlyArray<GrainsPerCubicMeter>;
  readonly mugwort?: ReadonlyArray<GrainsPerCubicMeter>;
  readonly olive?: ReadonlyArray<GrainsPerCubicMeter>;
  readonly ragweed?: ReadonlyArray<GrainsPerCubicMeter>;
};

export type AirQualityHourly = {
  readonly time: ReadonlyArray<string>;
  readonly pm25: ReadonlyArray<MicrogramsPerCubicMeter>;
  readonly pm10: ReadonlyArray<MicrogramsPerCubicMeter>;
  readonly europeanAqi: ReadonlyArray<number>;
  readonly dust?: ReadonlyArray<MicrogramsPerCubicMeter>;
  readonly pollen: PollenHourly;
};

export type AirQualitySnapshot = {
  readonly hourly: AirQualityHourly;
};

/**
 * 当日インデックス。past_days=1 + forecast_days=2 を取得する想定で、
 * daily.time が3要素以上なら idx=1 が当日。
 */
export const todayIndex = (daily: WeatherDaily): number =>
  daily.time.length >= 3 ? 1 : 0;
