/**
 * ヘッダのステータス行 (GEO/TZ/TS/STATUS) の DOM 操作。
 */
import { formatHms } from "./format.js";
import type { Location } from "../domain/location/location.js";

export type StatusRefs = {
  geo: HTMLElement;
  tz: HTMLElement;
  time: HTMLElement;
  text: HTMLElement;
  refreshBtn: HTMLButtonElement;
};

export const collectStatusRefs = (): StatusRefs => ({
  geo: get("status-geo"),
  tz: get("status-tz"),
  time: get("status-time"),
  text: get("status-text"),
  refreshBtn: get<HTMLButtonElement>("refresh"),
});

const get = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not found`);
  return el as T;
};

export const startClock = (refs: StatusRefs, clock: () => Date): void => {
  refs.tz.textContent = `TZ ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
  const tick = () => {
    refs.time.textContent = `TS ${formatHms(clock())}`;
  };
  tick();
  setInterval(tick, 1000);
};

export const setGeoLine = (refs: StatusRefs, loc: Location): void => {
  const tag = loc.source === "default" ? "DEFAULT" : "GEO";
  const fallback = `${loc.coordinate.latitude.toFixed(2)},${loc.coordinate.longitude.toFixed(2)}`;
  refs.geo.textContent = `${tag} ${loc.label ?? fallback}`;
};

export const setStatus = (refs: StatusRefs, text: string, error: boolean): void => {
  refs.text.textContent = text;
  refs.text.classList.toggle("error", error);
};

export const setLoading = (refs: StatusRefs, loading: boolean): void => {
  refs.refreshBtn.disabled = loading;
  refs.refreshBtn.classList.toggle("animate-spin-slow", loading);
};
