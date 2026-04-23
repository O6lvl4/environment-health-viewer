/**
 * Open-Meteo Forecast API のアダプタ。
 * 生レスポンスを WeatherSnapshot に変換する Anti-Corruption Layer。
 */
import type { WeatherForecastProvider } from "../application/ports.js";
import { ok, err } from "../domain/shared/result.js";
import {
  Hpa,
  Celsius,
  Percent,
  UvIndex,
  MmPerHour,
} from "../domain/shared/units.js";
import type { Coordinate } from "../domain/location/coordinate.js";
import type { WeatherSnapshot } from "../domain/conditions/series.js";

const BASE = "https://api.open-meteo.com/v1/forecast";

type Raw = {
  hourly: {
    time: string[];
    pressure_msl: number[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    weathercode: number[];
    precipitation: number[];
    precipitation_probability: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    uv_index_max: number[];
    sunrise: string[];
    sunset: string[];
  };
  timezone: string;
};

export const createOpenMeteoForecastProvider = (
  fetcher: typeof fetch = fetch,
): WeatherForecastProvider => ({
  async fetch(coord: Coordinate) {
    const url = new URL(BASE);
    url.searchParams.set("latitude", String(coord.latitude));
    url.searchParams.set("longitude", String(coord.longitude));
    url.searchParams.set(
      "hourly",
      "pressure_msl,temperature_2m,relative_humidity_2m,weathercode,precipitation,precipitation_probability",
    );
    url.searchParams.set(
      "daily",
      "temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset",
    );
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("past_days", "1");
    url.searchParams.set("forecast_days", "2");

    try {
      const res = await fetcher(url);
      if (!res.ok) return err({ message: `forecast: HTTP ${res.status}` });
      const raw = (await res.json()) as Raw;
      return ok(toSnapshot(raw));
    } catch (e) {
      return err({
        message: e instanceof Error ? e.message : "forecast: unknown error",
        cause: e,
      });
    }
  },
});

const toSnapshot = (raw: Raw): WeatherSnapshot => ({
  hourly: {
    time: raw.hourly.time,
    pressure: raw.hourly.pressure_msl.map(Hpa.unsafe),
    temperature: raw.hourly.temperature_2m.map(Celsius.unsafe),
    humidity: raw.hourly.relative_humidity_2m.map(Percent.unsafe),
    weatherCode: raw.hourly.weathercode,
    precipitation: raw.hourly.precipitation.map(MmPerHour.unsafe),
    precipitationProbability: raw.hourly.precipitation_probability.map(Percent.unsafe),
  },
  daily: {
    time: raw.daily.time,
    temperatureMax: raw.daily.temperature_2m_max.map(Celsius.unsafe),
    temperatureMin: raw.daily.temperature_2m_min.map(Celsius.unsafe),
    uvIndexMax: raw.daily.uv_index_max.map(UvIndex.unsafe),
    sunrise: raw.daily.sunrise,
    sunset: raw.daily.sunset,
  },
  timezone: raw.timezone,
});
