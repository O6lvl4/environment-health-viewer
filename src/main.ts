import "./style.css";
import {
  fetchAirQuality,
  fetchWeather,
  type HourlySeries,
  type WeatherResponse,
} from "./api.js";
import { renderPressureChart } from "./chart.js";
import { getCurrentLocation, reverseGeocode, type Location } from "./location.js";
import {
  buildMetrics,
  levelLabel,
  solarInfo,
  summaryMessage,
  type Level,
  type Metric,
} from "./risk.js";
import { fetchJmaWarnings, type WarningResult } from "./warnings.js";
import { twemojiImg } from "./twemoji.js";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const refreshBtn = $<HTMLButtonElement>("refresh");
const statusGeo = $<HTMLSpanElement>("status-geo");
const statusTz = $<HTMLSpanElement>("status-tz");
const statusTime = $<HTMLSpanElement>("status-time");
const statusText = $<HTMLSpanElement>("status-text");

const summaryEl = $<HTMLElement>("summary");
const summaryLevel = $<HTMLSpanElement>("summary-level");
const summaryMsg = $<HTMLParagraphElement>("summary-message");

const cardsEl = $<HTMLElement>("cards");

const warningsEl = $<HTMLElement>("warnings");
const warningsList = $<HTMLUListElement>("warnings-list");
const warningsMeta = $<HTMLSpanElement>("warnings-meta");

const solarSection = $<HTMLElement>("solar");
const solarSunrise = $<HTMLSpanElement>("solar-sunrise");
const solarSunset = $<HTMLSpanElement>("solar-sunset");
const solarDaylen = $<HTMLSpanElement>("solar-daylen");

const pressureSection = $<HTMLElement>("pressure");
const pressureChart = $<HTMLDivElement>("pressure-chart");
const pressureNote = $<HTMLParagraphElement>("pressure-note");
const pressureCurrent = $<HTMLSpanElement>("pressure-current");

const SKELETON_CLASSES =
  "border border-line rounded-[4px] h-[78px] [background:linear-gradient(90deg,var(--color-panel)_0%,var(--color-panel-2)_50%,var(--color-panel)_100%)] [background-size:200%_100%] animate-shimmer";

// Level → Tailwind classes (state badge / metric border / accent bar)
const LEVEL_BADGE: Record<Level, string> = {
  low: "text-lv-low border-lv-low",
  mid: "text-lv-mid border-lv-mid",
  high: "text-lv-high border-lv-high [text-shadow:0_0_8px_rgba(255,122,58,0.4)]",
  danger:
    "text-lv-danger border-lv-danger [text-shadow:0_0_10px_rgba(255,45,110,0.5)] animate-pulse-glow",
};

const LEVEL_BAR: Record<Level, string> = {
  low: "before:bg-lv-low",
  mid: "before:bg-lv-mid",
  high: "before:bg-lv-high before:[box-shadow:0_0_12px_var(--color-lv-high)]",
  danger: "before:bg-lv-danger before:[box-shadow:0_0_14px_var(--color-lv-danger)]",
};

const LEVEL_BORDER: Record<Level, string> = {
  low: "border-line",
  mid: "border-line",
  high: "border-lv-high/35",
  danger: "border-lv-danger/40",
};

const LEVEL_TAG: Record<Level, string> = {
  low: "text-lv-low",
  mid: "text-lv-mid",
  high: "text-lv-high",
  danger: "text-lv-danger",
};

refreshBtn.addEventListener("click", () => void run());

startClock();
void run();

function startClock(): void {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  statusTz.textContent = `TZ ${tz}`;
  const tick = () => {
    const t = new Date();
    statusTime.textContent = `TS ${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
  };
  tick();
  setInterval(tick, 1000);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

async function run(): Promise<void> {
  setLoading(true);
  setStatus("LOC/REQ", false);
  showSkeletons();
  try {
    const loc = await getCurrentLocation();
    setGeo(loc, null);
    setStatus("FETCH", false);

    void enrichLocationLabel(loc);

    const [weather, air] = await Promise.all([fetchWeather(loc), fetchAirQuality(loc)]);
    const now = new Date();
    const metrics = buildMetrics(weather, air, now);

    renderSummary(metrics);
    renderCards(metrics);
    renderSolar(weather);
    renderPressure(weather.hourly, now);

    setStatus("READY", false);
  } catch (err) {
    setStatus(`ERROR ${(err as Error).message}`, true);
  } finally {
    setLoading(false);
  }
}

async function enrichLocationLabel(loc: Location): Promise<void> {
  const name = await reverseGeocode(loc);
  setGeo(loc, name);

  if (name && isJapan(loc)) {
    const result = await fetchJmaWarnings(extractPrefecture(name));
    renderWarnings(result);
  }
}

function setGeo(loc: Location, label: string | null): void {
  const coords = `${loc.latitude.toFixed(2)},${loc.longitude.toFixed(2)}`;
  const tag = loc.source === "default" ? "DEFAULT" : "GEO";
  statusGeo.textContent = label ? `${tag} ${label}` : `${tag} ${coords}`;
}

function setStatus(text: string, error: boolean): void {
  statusText.textContent = text;
  statusText.classList.toggle("error", error);
}

function setLoading(loading: boolean): void {
  refreshBtn.disabled = loading;
  refreshBtn.classList.toggle("animate-spin-slow", loading);
}

function isJapan(loc: Location): boolean {
  return (
    loc.latitude >= 24 &&
    loc.latitude <= 46 &&
    loc.longitude >= 122 &&
    loc.longitude <= 146
  );
}

function extractPrefecture(label: string): string {
  return label.split(/\s+/)[0];
}

function showSkeletons(): void {
  cardsEl.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const div = document.createElement("div");
    div.className = SKELETON_CLASSES;
    cardsEl.appendChild(div);
  }
}

function renderSummary(metrics: Metric[]): void {
  const { level, message } = summaryMessage(metrics);
  summaryEl.hidden = false;
  summaryLevel.className = `state-badge font-mono text-[11px] tracking-[0.18em] px-2 py-[3px] border bg-panel before:content-['●_'] ${LEVEL_BADGE[level]}`;
  summaryLevel.textContent = stateText(level);
  summaryMsg.textContent = message;
}

function stateText(level: Level): string {
  switch (level) {
    case "low":
      return "NOMINAL";
    case "mid":
      return "ELEVATED";
    case "high":
      return "WARNING";
    case "danger":
      return "CRITICAL";
  }
}

function renderCards(metrics: Metric[]): void {
  cardsEl.innerHTML = "";
  for (const m of metrics) {
    const card = document.createElement("div");
    card.className = [
      "relative overflow-hidden flex flex-col gap-[6px] rounded-[4px] border bg-panel px-3 py-[10px] transition-colors",
      "before:content-[''] before:absolute before:inset-y-0 before:left-0 before:w-[3px]",
      LEVEL_BORDER[m.level],
      LEVEL_BAR[m.level],
    ].join(" ");
    card.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <span class="flex items-center gap-[6px] text-[10.5px] tracking-[0.18em] text-text-dim uppercase">
          <span class="text-[14px] leading-none">${twemojiImg(m.icon)}</span>${escapeHtml(m.title)}
        </span>
        <span class="font-mono text-[9.5px] tracking-[0.18em] px-[5px] py-px border border-current ${LEVEL_TAG[m.level]}">
          ${escapeHtml(levelLabel(m.level).toUpperCase())}
        </span>
      </div>
      <div class="font-mono text-[22px] font-semibold tabular-nums text-text leading-[1.1]">
        ${escapeHtml(m.value)}<span class="text-[11px] text-text-mute ml-1 tracking-[0.05em]">${escapeHtml(m.unit ?? "")}</span>
      </div>
      <div class="font-sans text-[12px] text-text-dim leading-[1.45]">${escapeHtml(m.note)}</div>
    `;
    cardsEl.appendChild(card);
  }
}

function renderSolar(weather: WeatherResponse): void {
  const info = solarInfo(weather.daily);
  if (!info) return;
  solarSection.hidden = false;
  solarSunrise.textContent = formatTime(info.sunrise);
  solarSunset.textContent = formatTime(info.sunset);
  solarDaylen.textContent = `${info.dayLength.hours}h ${pad(info.dayLength.minutes)}m`;
}

function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function renderPressure(hourly: HourlySeries, now: Date): void {
  pressureSection.hidden = false;
  pressureChart.innerHTML = "";
  pressureChart.appendChild(renderPressureChart(hourly, now));
  const futureIdx = hourly.time.findIndex((t) => new Date(t) >= now);
  const cur =
    futureIdx >= 0
      ? hourly.pressure_msl[futureIdx]
      : hourly.pressure_msl[hourly.pressure_msl.length - 1];
  pressureCurrent.textContent = `${cur?.toFixed(1) ?? "—"} hPa`;
  pressureNote.textContent =
    "気圧の急降下は偏頭痛のトリガーになりやすいとされています。Δ-6hPa/12h を超えると敏感層は要注意。";
}

const SEVERITY_TAG: Record<"alert" | "warn" | "info", { text: string; cls: string }> = {
  alert: {
    text: "ALERT",
    cls: "text-critical bg-critical/10",
  },
  warn: {
    text: "WARN",
    cls: "text-warn bg-warn/10",
  },
  info: {
    text: "INFO",
    cls: "text-info bg-info/10",
  },
};

function renderWarnings(result: WarningResult | null): void {
  if (!result || result.warnings.length === 0) {
    warningsEl.hidden = true;
    warningsList.innerHTML = "";
    return;
  }
  warningsEl.hidden = false;
  warningsMeta.textContent = result.reportDatetime
    ? `${result.prefecture} · ${formatJmaTime(result.reportDatetime)}`
    : result.prefecture;
  warningsList.innerHTML = "";
  for (const w of result.warnings) {
    const li = document.createElement("li");
    li.className =
      "grid [grid-template-columns:60px_1fr] gap-[10px] items-start px-3 py-2 border-b border-line last:border-b-0 text-[13px]";
    const sev = SEVERITY_TAG[w.severity];
    li.innerHTML = `
      <span class="font-mono text-[10.5px] font-bold tracking-[0.16em] text-center py-[2px] border border-current ${sev.cls}">${sev.text}</span>
      <span>
        <span class="font-sans text-text">${escapeHtml(w.name)}</span>
        <span class="block text-text-dim text-[11.5px] mt-[2px]">${escapeHtml(w.areas.slice(0, 6).join(" / "))}${w.areas.length > 6 ? ` ほか${w.areas.length - 6}` : ""}</span>
      </span>
    `;
    warningsList.appendChild(li);
  }
}

function formatJmaTime(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
