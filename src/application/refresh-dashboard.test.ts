/**
 * refreshDashboard のユースケーステスト。
 * Ports をすべてインメモリ実装に差し替えて、純粋に振る舞いだけ検証する。
 */
import { describe, it, expect, vi } from "vitest";
import { refreshDashboard, type RefreshDeps } from "./refresh-dashboard.js";
import { Coordinate } from "../domain/location/coordinate.js";
import { Location } from "../domain/location/location.js";
import { Prefecture } from "../domain/location/prefecture.js";
import { ok, err, isOk } from "../domain/shared/result.js";
import { WarningSet } from "../domain/warnings/warning-set.js";
import type {
  WeatherSnapshot,
  AirQualitySnapshot,
} from "../domain/conditions/series.js";
import {
  Hpa,
  Celsius,
  Percent,
  UvIndex,
  MmPerHour,
  MicrogramsPerCubicMeter,
} from "../domain/shared/units.js";

const TOKYO_RES = Coordinate.create(35.68, 139.65);
if (!isOk(TOKYO_RES)) throw new Error("setup");
const TOKYO = TOKYO_RES.value;

const HOURS = Array.from({ length: 48 }, (_, i) =>
  new Date(2026, 3, 22, i, 0, 0).toISOString(),
);

const dummyWeather: WeatherSnapshot = {
  hourly: {
    time: HOURS,
    pressure: HOURS.map(() => Hpa.unsafe(1013)),
    temperature: HOURS.map(() => Celsius.unsafe(20)),
    humidity: HOURS.map(() => Percent.unsafe(50)),
    weatherCode: HOURS.map(() => 0),
    precipitation: HOURS.map(() => MmPerHour.unsafe(0)),
    precipitationProbability: HOURS.map(() => Percent.unsafe(0)),
  },
  daily: {
    time: ["2026-04-22", "2026-04-23", "2026-04-24"],
    temperatureMax: [22, 22, 22].map(Celsius.unsafe),
    temperatureMin: [15, 15, 15].map(Celsius.unsafe),
    uvIndexMax: [3, 4, 5].map(UvIndex.unsafe),
    sunrise: ["2026-04-22T05:10+09:00", "2026-04-23T05:09+09:00", "2026-04-24T05:08+09:00"],
    sunset: ["2026-04-22T18:30+09:00", "2026-04-23T18:31+09:00", "2026-04-24T18:32+09:00"],
  },
  timezone: "Asia/Tokyo",
};

const dummyAir: AirQualitySnapshot = {
  hourly: {
    time: HOURS.slice(0, 24),
    pm25: Array(24).fill(0).map(() => MicrogramsPerCubicMeter.unsafe(8)),
    pm10: Array(24).fill(0).map(() => MicrogramsPerCubicMeter.unsafe(15)),
    europeanAqi: Array(24).fill(20),
    pollen: {},
  },
};

const tokyoPref = (() => {
  const p = Prefecture.of("東京都");
  if (!isOk(p)) throw new Error();
  return p.value;
})();

const buildDeps = (overrides: Partial<RefreshDeps> = {}): RefreshDeps => ({
  position: { current: async () => Location.create(TOKYO, "geolocation") },
  geocoder: { reverse: async () => "東京都" },
  forecast: { fetch: async () => ok(dummyWeather) },
  airQuality: { fetch: async () => ok(dummyAir) },
  warnings: { fetch: async () => ok(WarningSet.create(tokyoPref, null, [])) },
  clock: () => new Date(2026, 3, 23, 12, 0, 0),
  ...overrides,
});

describe("refreshDashboard", () => {
  it("正常系: DashboardData を構築できる", async () => {
    const r = await refreshDashboard(buildDeps());
    expect(isOk(r)).toBe(true);
    if (!isOk(r)) return;
    expect(r.value.location.label).toBe("東京都");
    expect(r.value.assessment.metrics.length).toBeGreaterThan(0);
    expect(r.value.solar).not.toBeNull();
  });

  it("位置→fetch のステージを通知する", async () => {
    const onStage = vi.fn();
    await refreshDashboard(buildDeps(), onStage);
    expect(onStage).toHaveBeenCalledWith("location");
    expect(onStage).toHaveBeenCalledWith("fetch");
  });

  it("forecast 取得失敗で err", async () => {
    const r = await refreshDashboard(
      buildDeps({
        forecast: { fetch: async () => err({ message: "boom" }) },
      }),
    );
    expect(isOk(r)).toBe(false);
  });

  it("逆ジオに失敗しても本体は ok", async () => {
    const r = await refreshDashboard(
      buildDeps({
        geocoder: {
          reverse: async () => {
            throw new Error("network");
          },
        },
      }),
    );
    expect(isOk(r)).toBe(true);
  });

  it("国外座標では JMA 警報を取得しない", async () => {
    const ny = Coordinate.create(40.71, -74.0);
    if (!isOk(ny)) throw new Error();
    const warningsFetch = vi.fn();
    const r = await refreshDashboard(
      buildDeps({
        position: { current: async () => Location.create(ny.value, "geolocation") },
        geocoder: { reverse: async () => "New York" },
        warnings: { fetch: warningsFetch },
      }),
    );
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect(r.value.warnings).toBeNull();
    expect(warningsFetch).not.toHaveBeenCalled();
  });
});
