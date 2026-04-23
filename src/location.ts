export type Location = {
  latitude: number;
  longitude: number;
  label: string;
  source: "geolocation" | "default";
};

const DEFAULT_LOCATION: Location = {
  latitude: 35.6762,
  longitude: 139.6503,
  label: "東京（既定）",
  source: "default",
};

export async function getCurrentLocation(timeoutMs = 8000): Promise<Location> {
  if (!("geolocation" in navigator)) return DEFAULT_LOCATION;

  return await new Promise<Location>((resolve) => {
    const finish = (loc: Location) => resolve(loc);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        finish({
          latitude: round(pos.coords.latitude),
          longitude: round(pos.coords.longitude),
          label: `現在地 (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`,
          source: "geolocation",
        });
      },
      () => finish(DEFAULT_LOCATION),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 5 * 60 * 1000 },
    );
  });
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export async function reverseGeocode(loc: Location): Promise<string | null> {
  try {
    const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
    url.searchParams.set("latitude", String(loc.latitude));
    url.searchParams.set("longitude", String(loc.longitude));
    url.searchParams.set("localityLanguage", "ja");
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      city?: string;
      locality?: string;
      principalSubdivision?: string;
      countryName?: string;
    };
    const parts = [data.principalSubdivision, data.city || data.locality].filter(
      (s): s is string => Boolean(s),
    );
    return parts.length ? parts.join(" ") : (data.countryName ?? null);
  } catch {
    return null;
  }
}
