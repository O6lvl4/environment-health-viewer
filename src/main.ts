/**
 * Composition Root: 全レイヤを束ねるエントリポイント。
 * - 依存 (Ports → Adapters) の注入
 * - DashboardState のループ管理
 * - presentation 層への描画指示
 */
import "./style.css";
import { createOpenMeteoForecastProvider } from "./infrastructure/open-meteo-forecast.js";
import { createOpenMeteoAirQualityProvider } from "./infrastructure/open-meteo-air-quality.js";
import { createJmaWarningsProvider } from "./infrastructure/jma-warnings.js";
import { createBigDataCloudGeocoder } from "./infrastructure/bigdatacloud-geocoder.js";
import { createBrowserGeolocationProvider } from "./infrastructure/browser-geolocation.js";
import { refreshDashboard, type RefreshDeps } from "./application/refresh-dashboard.js";
import type { DashboardState } from "./application/dashboard-state.js";
import { collectDomRefs } from "./presentation/dom-refs.js";
import {
  collectStatusRefs,
  setGeoLine,
  setLoading,
  setStatus,
  startClock,
} from "./presentation/status.js";
import {
  renderCards,
  renderNow,
  renderPressure,
  renderSolar,
  renderSummary,
  renderWarnings,
  showSkeletons,
} from "./presentation/renderers.js";
import { isOk } from "./domain/shared/result.js";

const deps: RefreshDeps = {
  position: createBrowserGeolocationProvider(),
  geocoder: createBigDataCloudGeocoder(),
  forecast: createOpenMeteoForecastProvider(),
  airQuality: createOpenMeteoAirQualityProvider(),
  warnings: createJmaWarningsProvider(),
  clock: () => new Date(),
};

const dom = collectDomRefs();
const status = collectStatusRefs();

const apply = (s: DashboardState): void => {
  switch (s.status) {
    case "init":
      return;
    case "loading":
      setLoading(status, true);
      setStatus(status, s.stage === "location" ? "LOC/REQ" : "FETCH", false);
      if (s.stage === "location") showSkeletons(dom, 5);
      return;
    case "ready":
      setLoading(status, false);
      setStatus(status, "READY", false);
      setGeoLine(status, s.data.location);
      renderSummary(dom, s.data.assessment);
      renderNow(dom, s.data.conditions);
      renderCards(dom, s.data.assessment);
      renderSolar(dom, s.data.solar);
      renderPressure(dom, s.data.hourly, s.data.observedAt);
      renderWarnings(dom, s.data.warnings);
      return;
    case "error":
      setLoading(status, false);
      setStatus(status, `ERROR ${s.message}`, true);
      return;
  }
};

const run = async (): Promise<void> => {
  apply({ status: "loading", stage: "location" });
  const result = await refreshDashboard(deps, (stage) =>
    apply({ status: "loading", stage }),
  );
  apply(
    isOk(result)
      ? { status: "ready", data: result.value }
      : { status: "error", message: result.error.message },
  );
};

status.refreshBtn.addEventListener("click", () => void run());
startClock(status, deps.clock);
void run();
