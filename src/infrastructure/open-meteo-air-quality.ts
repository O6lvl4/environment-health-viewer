/**
 * Open-Meteo Air Quality API のアダプタ。
 */
import type { AirQualityProvider } from "../application/ports.js";
import { ok, err } from "../domain/shared/result.js";
import {
  GrainsPerCubicMeter,
  MicrogramsPerCubicMeter,
} from "../domain/shared/units.js";
import type { Coordinate } from "../domain/location/coordinate.js";
import type { AirQualitySnapshot } from "../domain/conditions/series.js";

const BASE = "https://air-quality-api.open-meteo.com/v1/air-quality";

type Raw = {
  hourly: {
    time: string[];
    pm2_5: number[];
    pm10: number[];
    european_aqi: number[];
    dust?: number[];
    alder_pollen?: number[];
    birch_pollen?: number[];
    grass_pollen?: number[];
    mugwort_pollen?: number[];
    olive_pollen?: number[];
    ragweed_pollen?: number[];
  };
};

export const createOpenMeteoAirQualityProvider = (
  fetcher: typeof fetch = fetch,
): AirQualityProvider => ({
  async fetch(coord: Coordinate) {
    const url = new URL(BASE);
    url.searchParams.set("latitude", String(coord.latitude));
    url.searchParams.set("longitude", String(coord.longitude));
    url.searchParams.set(
      "hourly",
      [
        "pm2_5",
        "pm10",
        "european_aqi",
        "dust",
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

    try {
      const res = await fetcher(url);
      if (!res.ok) return err({ message: `air-quality: HTTP ${res.status}` });
      const raw = (await res.json()) as Raw;
      return ok(toSnapshot(raw));
    } catch (e) {
      return err({
        message: e instanceof Error ? e.message : "air-quality: unknown error",
        cause: e,
      });
    }
  },
});

const toSnapshot = (raw: Raw): AirQualitySnapshot => ({
  hourly: {
    time: raw.hourly.time,
    pm25: raw.hourly.pm2_5.map(MicrogramsPerCubicMeter.unsafe),
    pm10: raw.hourly.pm10.map(MicrogramsPerCubicMeter.unsafe),
    europeanAqi: raw.hourly.european_aqi,
    dust: raw.hourly.dust?.map(MicrogramsPerCubicMeter.unsafe),
    pollen: {
      alder: raw.hourly.alder_pollen?.map(GrainsPerCubicMeter.unsafe),
      birch: raw.hourly.birch_pollen?.map(GrainsPerCubicMeter.unsafe),
      grass: raw.hourly.grass_pollen?.map(GrainsPerCubicMeter.unsafe),
      mugwort: raw.hourly.mugwort_pollen?.map(GrainsPerCubicMeter.unsafe),
      olive: raw.hourly.olive_pollen?.map(GrainsPerCubicMeter.unsafe),
      ragweed: raw.hourly.ragweed_pollen?.map(GrainsPerCubicMeter.unsafe),
    },
  },
});
