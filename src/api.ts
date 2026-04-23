import type { Location } from "./location.js";

export type HourlySeries = {
  time: string[];
  pressure_msl: number[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  weathercode: number[];
};

export type DailySeries = {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  uv_index_max: number[];
  sunrise: string[];
  sunset: string[];
};

export type WeatherResponse = {
  hourly: HourlySeries;
  daily: DailySeries;
  timezone: string;
};

export type AirHourly = {
  time: string[];
  pm2_5: number[];
  pm10: number[];
  european_aqi: number[];
  uv_index: number[];
  alder_pollen?: number[];
  birch_pollen?: number[];
  grass_pollen?: number[];
  mugwort_pollen?: number[];
  olive_pollen?: number[];
  ragweed_pollen?: number[];
  japanese_cedar_pollen?: number[];
  japanese_cypress_pollen?: number[];
};

export type AirResponse = {
  hourly: AirHourly;
};

export async function fetchWeather(loc: Location): Promise<WeatherResponse> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(loc.latitude));
  url.searchParams.set("longitude", String(loc.longitude));
  url.searchParams.set(
    "hourly",
    "pressure_msl,temperature_2m,relative_humidity_2m,weathercode",
  );
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset",
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("past_days", "1");
  url.searchParams.set("forecast_days", "2");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`weather: HTTP ${res.status}`);
  return (await res.json()) as WeatherResponse;
}

export async function fetchAirQuality(loc: Location): Promise<AirResponse> {
  const url = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  url.searchParams.set("latitude", String(loc.latitude));
  url.searchParams.set("longitude", String(loc.longitude));
  url.searchParams.set(
    "hourly",
    [
      "pm2_5",
      "pm10",
      "european_aqi",
      "uv_index",
      "alder_pollen",
      "birch_pollen",
      "grass_pollen",
      "mugwort_pollen",
      "olive_pollen",
      "ragweed_pollen",
    ].join(","),
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "1");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`air-quality: HTTP ${res.status}`);
  return (await res.json()) as AirResponse;
}

export function nearestHourIndex(times: string[], now: Date = new Date()): number {
  if (times.length === 0) return -1;
  let best = 0;
  let bestDiff = Number.POSITIVE_INFINITY;
  const t = now.getTime();
  for (let i = 0; i < times.length; i++) {
    const ts = new Date(times[i]).getTime();
    const diff = Math.abs(ts - t);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return best;
}
