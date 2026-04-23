import "./style.css";
import { fetchAirQuality, fetchWeather, type HourlySeries } from "./api.js";
import { renderPressureChart } from "./chart.js";
import { getCurrentLocation, reverseGeocode, type Location } from "./location.js";
import {
  buildMetrics,
  levelLabel,
  summaryMessage,
  type Level,
  type Metric,
} from "./risk.js";

const refreshBtn = document.getElementById("refresh") as HTMLButtonElement;
const statusText = document.getElementById("status-text") as HTMLParagraphElement;
const locationEl = document.getElementById("location") as HTMLParagraphElement;
const summaryEl = document.getElementById("summary") as HTMLElement;
const summaryLevel = document.getElementById("summary-level") as HTMLSpanElement;
const summaryMsg = document.getElementById("summary-message") as HTMLParagraphElement;
const cardsEl = document.getElementById("cards") as HTMLElement;
const pressureSection = document.getElementById("pressure") as HTMLElement;
const pressureChart = document.getElementById("pressure-chart") as HTMLDivElement;
const pressureNote = document.getElementById("pressure-note") as HTMLParagraphElement;

refreshBtn.addEventListener("click", () => void run());

void run();

async function run(): Promise<void> {
  setLoading(true);
  showSkeletons();
  statusText.textContent = "位置情報を取得中…";
  try {
    const loc = await getCurrentLocation();
    statusText.textContent = "気象データを取得中…";
    locationEl.textContent =
      loc.source === "default"
        ? "位置情報の許可がないため東京で表示しています"
        : `現在地で表示中 (${loc.latitude.toFixed(2)}, ${loc.longitude.toFixed(2)})`;

    void enrichLocationLabel(loc);

    const [weather, air] = await Promise.all([fetchWeather(loc), fetchAirQuality(loc)]);
    const now = new Date();
    const metrics = buildMetrics(weather, air, now);

    renderSummary(metrics);
    renderCards(metrics);
    renderPressure(weather.hourly, now);

    const time = now.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    statusText.textContent = `最終更新 ${time}`;
  } catch (err) {
    statusText.textContent = `取得に失敗: ${(err as Error).message}`;
    statusText.classList.add("error");
  } finally {
    setLoading(false);
  }
}

async function enrichLocationLabel(loc: Location): Promise<void> {
  const name = await reverseGeocode(loc);
  if (!name) return;
  const prefix = loc.source === "default" ? "既定" : "現在地";
  locationEl.textContent = `${prefix}: ${name}`;
}

function setLoading(loading: boolean): void {
  refreshBtn.disabled = loading;
  refreshBtn.classList.toggle("spin", loading);
  statusText.classList.remove("error");
}

function showSkeletons(): void {
  cardsEl.innerHTML = "";
  for (let i = 0; i < 4; i++) {
    const div = document.createElement("div");
    div.className = "card skeleton";
    cardsEl.appendChild(div);
  }
}

function renderSummary(metrics: Metric[]): void {
  const { level, message } = summaryMessage(metrics);
  summaryEl.hidden = false;
  summaryLevel.className = `level-badge ${levelClass(level)}`;
  summaryLevel.textContent = levelLabel(level);
  summaryMsg.textContent = message;
}

function renderCards(metrics: Metric[]): void {
  cardsEl.innerHTML = "";
  for (const m of metrics) {
    const card = document.createElement("div");
    card.className = `card metric ${levelClass(m.level)}`;
    card.innerHTML = `
      <div class="metric-head">
        <span class="metric-title"><span class="metric-icon">${m.icon}</span>${escapeHtml(m.title)}</span>
        <span class="level-badge ${levelClass(m.level)}">${levelLabel(m.level)}</span>
      </div>
      <div class="metric-value">${escapeHtml(m.value)}<span class="metric-unit">${escapeHtml(m.unit ?? "")}</span></div>
      <div class="metric-note">${escapeHtml(m.note)}</div>
    `;
    cardsEl.appendChild(card);
  }
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
  pressureNote.textContent = `気圧の急降下は偏頭痛のトリガーになりやすいとされています（現在 ${cur?.toFixed(1) ?? "—"} hPa）`;
}

function levelClass(level: Level): string {
  return `level-${level}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
