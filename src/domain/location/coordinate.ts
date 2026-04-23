/**
 * 緯度経度の Value Object。
 */
import type { Brand } from "../shared/brand.js";
import { type Result, ok, err } from "../shared/result.js";

export type Latitude = Brand<number, "Latitude">;
export type Longitude = Brand<number, "Longitude">;

export const Latitude = {
  of: (n: number): Result<Latitude, string> =>
    Number.isFinite(n) && n >= -90 && n <= 90
      ? ok(n as Latitude)
      : err(`invalid latitude: ${n}`),
};

export const Longitude = {
  of: (n: number): Result<Longitude, string> =>
    Number.isFinite(n) && n >= -180 && n <= 180
      ? ok(n as Longitude)
      : err(`invalid longitude: ${n}`),
};

export type Coordinate = {
  readonly latitude: Latitude;
  readonly longitude: Longitude;
};

export const Coordinate = {
  create: (lat: number, lon: number): Result<Coordinate, string> => {
    const la = Latitude.of(lat);
    if (la._tag === "err") return la;
    const lo = Longitude.of(lon);
    if (lo._tag === "err") return lo;
    return ok({ latitude: la.value, longitude: lo.value });
  },
  /** 日本国土の領域内か (JMA 警報取得の前提判定用) */
  isInJapan: (c: Coordinate): boolean =>
    c.latitude >= 24 && c.latitude <= 46 && c.longitude >= 122 && c.longitude <= 146,
};
