/**
 * Browser Geolocation API のアダプタ。
 * 拒否・タイムアウトでは東京 (35.6762, 139.6503) にフォールバック。
 */
import type { PositionProvider } from "../application/ports.js";
import { Coordinate } from "../domain/location/coordinate.js";
import { Location } from "../domain/location/location.js";
import { isOk } from "../domain/shared/result.js";

const FALLBACK_COORD = (() => {
  const r = Coordinate.create(35.6762, 139.6503);
  if (!isOk(r)) throw new Error("invariant: tokyo coord");
  return r.value;
})();

export type BrowserGeoOptions = {
  readonly timeoutMs?: number;
};

export const createBrowserGeolocationProvider = (
  opts: BrowserGeoOptions = {},
): PositionProvider => ({
  async current(): Promise<Location> {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      return Location.create(FALLBACK_COORD, "default");
    }
    return await new Promise<Location>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = Coordinate.create(pos.coords.latitude, pos.coords.longitude);
          if (!isOk(c)) return resolve(Location.create(FALLBACK_COORD, "default"));
          resolve(Location.create(c.value, "geolocation"));
        },
        () => resolve(Location.create(FALLBACK_COORD, "default")),
        {
          enableHighAccuracy: false,
          timeout: opts.timeoutMs ?? 8000,
          maximumAge: 5 * 60 * 1000,
        },
      );
    });
  },
});
