/**
 * BigDataCloud reverse geocoding (free tier, no key) のアダプタ。
 */
import type { Geocoder } from "../application/ports.js";
import type { Coordinate } from "../domain/location/coordinate.js";

const BASE = "https://api.bigdatacloud.net/data/reverse-geocode-client";

type Raw = {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
};

export const createBigDataCloudGeocoder = (
  fetcher: typeof fetch = fetch,
): Geocoder => ({
  async reverse(coord: Coordinate) {
    try {
      const url = new URL(BASE);
      url.searchParams.set("latitude", String(coord.latitude));
      url.searchParams.set("longitude", String(coord.longitude));
      url.searchParams.set("localityLanguage", "ja");
      const res = await fetcher(url, { cache: "force-cache" });
      if (!res.ok) return null;
      const data = (await res.json()) as Raw;
      const parts = [data.principalSubdivision, data.city || data.locality].filter(
        (s): s is string => Boolean(s),
      );
      return parts.length ? parts.join(" ") : (data.countryName ?? null);
    } catch {
      return null;
    }
  },
});
