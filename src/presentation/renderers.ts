/**
 * 各 panel の DOM 描画。状態 → 既存DOM ノード書き込みの薄い関数群。
 * すべて純粋ではないが、入力が同じなら出力 DOM は同じ (副作用は付与のみ)。
 */
import { riskLevelLabel, riskLevelStateText, type RiskLevel } from "../domain/shared/risk-level.js";
import { Assessment } from "../domain/risk/assessment.js";
import type { Conditions } from "../domain/conditions/conditions.js";
import type { SolarCycle } from "../domain/solar/solar-cycle.js";
import type { WarningSet } from "../domain/warnings/warning-set.js";
import type { WeatherHourly } from "../domain/conditions/series.js";
import { Severity } from "../domain/warnings/severity.js";
import { LEVEL_BADGE, LEVEL_BAR, LEVEL_BORDER, LEVEL_TAG } from "./level-classes.js";
import { renderPressureChart } from "./chart.js";
import { twemojiImg } from "../infrastructure/twemoji.js";
import { escapeHtml, formatHm, formatJmaTime, pad2 } from "./format.js";

const SEVERITY_TAG: Record<Severity, { text: string; cls: string }> = {
  alert: { text: "ALERT", cls: "text-critical bg-critical/10" },
  warn: { text: "WARN", cls: "text-warn bg-warn/10" },
  info: { text: "INFO", cls: "text-info bg-info/10" },
};

export type DomRefs = {
  summary: HTMLElement;
  summaryLevel: HTMLElement;
  summaryMessage: HTMLElement;
  cards: HTMLElement;
  now: HTMLElement;
  nowMeta: HTMLElement;
  nowTemp: HTMLElement;
  nowTempSub: HTMLElement;
  nowCondIcon: HTMLElement;
  nowCondLabel: HTMLElement;
  nowHumid: HTMLElement;
  nowRain: HTMLElement;
  nowRainSub: HTMLElement;
  solar: HTMLElement;
  solarSunrise: HTMLElement;
  solarSunset: HTMLElement;
  solarDaylen: HTMLElement;
  warnings: HTMLElement;
  warningsList: HTMLElement;
  warningsMeta: HTMLElement;
  pressure: HTMLElement;
  pressureChart: HTMLElement;
  pressureCurrent: HTMLElement;
  pressureNote: HTMLElement;
};

export const renderSummary = (refs: DomRefs, assessment: Assessment): void => {
  const { level, message } = Assessment.summary(assessment);
  refs.summary.hidden = false;
  refs.summaryLevel.className = `state-badge font-mono text-[11px] tracking-[0.18em] px-2 py-[3px] border bg-panel before:content-['●_'] ${LEVEL_BADGE[level]}`;
  refs.summaryLevel.textContent = riskLevelStateText(level);
  refs.summaryMessage.textContent = message;
};

export const renderCards = (refs: DomRefs, assessment: Assessment): void => {
  refs.cards.innerHTML = "";
  for (const m of assessment.metrics) {
    const lv: RiskLevel = m.level;
    const card = document.createElement("div");
    card.className = [
      "relative overflow-hidden flex flex-col gap-[6px] rounded-[4px] border bg-panel px-3 py-[10px] transition-colors",
      "before:content-[''] before:absolute before:inset-y-0 before:left-0 before:w-[3px]",
      LEVEL_BORDER[lv],
      LEVEL_BAR[lv],
    ].join(" ");
    card.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <span class="flex items-center gap-[6px] text-[10.5px] tracking-[0.18em] text-text-dim uppercase">
          <span class="text-[14px] leading-none">${twemojiImg(m.icon)}</span>${escapeHtml(m.title)}
        </span>
        <span class="font-mono text-[9.5px] tracking-[0.18em] px-[5px] py-px border border-current ${LEVEL_TAG[lv]}">
          ${escapeHtml(riskLevelLabel(lv).toUpperCase())}
        </span>
      </div>
      <div class="font-mono text-[22px] font-semibold tabular-nums text-text leading-[1.1]">
        ${escapeHtml(m.value)}<span class="text-[11px] text-text-mute ml-1 tracking-[0.05em]">${escapeHtml(m.unit ?? "")}</span>
      </div>
      <div class="font-sans text-[12px] text-text-dim leading-[1.45]">${escapeHtml(m.note)}</div>
    `;
    refs.cards.appendChild(card);
  }
};

export const renderNow = (refs: DomRefs, conditions: Conditions): void => {
  refs.now.hidden = false;
  refs.nowMeta.textContent = `${formatHm(conditions.observedAt)} 時点`;
  refs.nowTemp.textContent = `${conditions.temperature.toFixed(1)}℃`;
  refs.nowTempSub.textContent = `↑${conditions.todayMax.toFixed(0)} ↓${conditions.todayMin.toFixed(0)}`;
  refs.nowCondIcon.innerHTML = twemojiImg(conditions.weather.emoji);
  refs.nowCondLabel.textContent = conditions.weather.label;
  refs.nowHumid.textContent = `RH ${conditions.humidity.toFixed(0)}%`;
  refs.nowRain.textContent = `${conditions.rainProbabilityNext6h.toFixed(0)}%`;
  refs.nowRainSub.textContent =
    conditions.precipitationNow > 0
      ? `現在 ${conditions.precipitationNow.toFixed(1)}mm/h`
      : "next 6h";
};

export const renderSolar = (refs: DomRefs, cycle: SolarCycle | null): void => {
  if (!cycle) {
    refs.solar.hidden = true;
    return;
  }
  refs.solar.hidden = false;
  refs.solarSunrise.textContent = formatHm(cycle.sunrise);
  refs.solarSunset.textContent = formatHm(cycle.sunset);
  refs.solarDaylen.textContent = `${cycle.dayLength.hours}h ${pad2(cycle.dayLength.minutes)}m`;
};

export const renderWarnings = (refs: DomRefs, set: WarningSet | null): void => {
  if (!set || set.warnings.length === 0) {
    refs.warnings.hidden = true;
    refs.warningsList.innerHTML = "";
    return;
  }
  refs.warnings.hidden = false;
  refs.warningsMeta.textContent = set.reportedAt
    ? `${set.prefecture} · ${formatJmaTime(set.reportedAt)}`
    : set.prefecture;
  refs.warningsList.innerHTML = "";
  for (const w of set.warnings) {
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
    refs.warningsList.appendChild(li);
  }
};

export const renderPressure = (
  refs: DomRefs,
  hourly: WeatherHourly,
  now: Date,
): void => {
  refs.pressure.hidden = false;
  refs.pressureChart.innerHTML = "";
  refs.pressureChart.appendChild(renderPressureChart(hourly, now));
  const futureIdx = hourly.time.findIndex((t) => new Date(t) >= now);
  const cur =
    futureIdx >= 0
      ? hourly.pressure[futureIdx]
      : hourly.pressure[hourly.pressure.length - 1];
  refs.pressureCurrent.textContent = `${cur != null ? cur.toFixed(1) : "—"} hPa`;
  refs.pressureNote.textContent =
    "気圧の急降下は偏頭痛のトリガーになりやすいとされています。Δ-6hPa/12h を超えると敏感層は要注意。";
};

export const showSkeletons = (refs: DomRefs, count: number): void => {
  refs.cards.innerHTML = "";
  const cls =
    "border border-line rounded-[4px] h-[78px] [background:linear-gradient(90deg,var(--color-panel)_0%,var(--color-panel-2)_50%,var(--color-panel)_100%)] [background-size:200%_100%] animate-shimmer";
  for (let i = 0; i < count; i++) {
    const div = document.createElement("div");
    div.className = cls;
    refs.cards.appendChild(div);
  }
};
