import type { DomRefs } from "./renderers.js";

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not found`);
  return el as T;
};

export const collectDomRefs = (): DomRefs => ({
  summary: $("summary"),
  summaryLevel: $("summary-level"),
  summaryMessage: $("summary-message"),
  cards: $("cards"),
  now: $("now"),
  nowMeta: $("now-meta"),
  nowTemp: $("now-temp"),
  nowTempSub: $("now-temp-sub"),
  nowCondIcon: $("now-cond-icon"),
  nowCondLabel: $("now-cond-label"),
  nowHumid: $("now-humid"),
  nowRain: $("now-rain"),
  nowRainSub: $("now-rain-sub"),
  solar: $("solar"),
  solarSunrise: $("solar-sunrise"),
  solarSunset: $("solar-sunset"),
  solarDaylen: $("solar-daylen"),
  warnings: $("warnings"),
  warningsList: $("warnings-list"),
  warningsMeta: $("warnings-meta"),
  pressure: $("pressure"),
  pressureChart: $("pressure-chart"),
  pressureCurrent: $("pressure-current"),
  pressureNote: $("pressure-note"),
});
