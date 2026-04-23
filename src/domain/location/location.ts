/**
 * Location: 取得元情報を伴う位置 Entity。
 * Coordinate (VO) + 取得手段 + ラベル (逆ジオで埋める)
 */
import type { Coordinate } from "./coordinate.js";

export type LocationSource = "geolocation" | "default";

export type Location = {
  readonly coordinate: Coordinate;
  readonly source: LocationSource;
  readonly label: string | null;
};

export const Location = {
  create: (
    coordinate: Coordinate,
    source: LocationSource,
    label: string | null = null,
  ): Location => ({ coordinate, source, label }),

  withLabel: (loc: Location, label: string | null): Location => ({
    ...loc,
    label,
  }),
};
