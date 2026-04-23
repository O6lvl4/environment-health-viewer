/**
 * 気圧チャート (純粋: WeatherHourly + 現在時刻 → SVG ノード)。
 */
import type { WeatherHourly } from "../domain/conditions/series.js";
import { nearestHourIndex } from "../domain/shared/temporal.js";

export type ChartOptions = {
  width?: number;
  height?: number;
};

const NS = "http://www.w3.org/2000/svg";

export const renderPressureChart = (
  hourly: WeatherHourly,
  now: Date,
  opts: ChartOptions = {},
): SVGSVGElement => {
  const width = opts.width ?? 680;
  const height = opts.height ?? 180;
  const pad = { l: 40, r: 12, t: 16, b: 22 };

  const idx = nearestHourIndex(hourly.time, now);
  const start = Math.max(0, idx - 24);
  const end = Math.min(hourly.pressure.length, idx + 24);
  const times = hourly.time.slice(start, end);
  const pressures = hourly.pressure.slice(start, end) as ReadonlyArray<number>;
  const presentIdx = idx - start;

  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;

  const minP = Math.floor(Math.min(...pressures) - 1);
  const maxP = Math.ceil(Math.max(...pressures) + 1);
  const range = Math.max(2, maxP - minP);

  const xAt = (i: number) => pad.l + (i / Math.max(1, pressures.length - 1)) * innerW;
  const yAt = (p: number) => pad.t + innerH - ((p - minP) / range) * innerH;

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "気圧の24時間前後の推移グラフ");

  const fontFamily = "system-ui, sans-serif";
  const axisColor = "currentColor";

  const gridSteps = 3;
  for (let i = 0; i <= gridSteps; i++) {
    const v = minP + (range * i) / gridSteps;
    const y = yAt(v);
    const line = document.createElementNS(NS, "line");
    line.setAttribute("x1", String(pad.l));
    line.setAttribute("x2", String(width - pad.r));
    line.setAttribute("y1", String(y));
    line.setAttribute("y2", String(y));
    line.setAttribute("stroke", axisColor);
    line.setAttribute("stroke-opacity", "0.12");
    svg.appendChild(line);

    const label = document.createElementNS(NS, "text");
    label.setAttribute("x", String(pad.l - 6));
    label.setAttribute("y", String(y + 3));
    label.setAttribute("text-anchor", "end");
    label.setAttribute("font-size", "10");
    label.setAttribute("font-family", fontFamily);
    label.setAttribute("fill", axisColor);
    label.setAttribute("opacity", "0.55");
    label.textContent = `${v.toFixed(0)}`;
    svg.appendChild(label);
  }

  if (presentIdx >= 0 && presentIdx < pressures.length) {
    const x = xAt(presentIdx);
    const nowLine = document.createElementNS(NS, "line");
    nowLine.setAttribute("x1", String(x));
    nowLine.setAttribute("x2", String(x));
    nowLine.setAttribute("y1", String(pad.t));
    nowLine.setAttribute("y2", String(height - pad.b));
    nowLine.setAttribute("stroke", "currentColor");
    nowLine.setAttribute("stroke-opacity", "0.35");
    nowLine.setAttribute("stroke-dasharray", "3 3");
    svg.appendChild(nowLine);

    const nowLabel = document.createElementNS(NS, "text");
    nowLabel.setAttribute("x", String(x + 4));
    nowLabel.setAttribute("y", String(pad.t + 10));
    nowLabel.setAttribute("font-size", "10");
    nowLabel.setAttribute("font-family", fontFamily);
    nowLabel.setAttribute("fill", axisColor);
    nowLabel.setAttribute("opacity", "0.7");
    nowLabel.textContent = "現在";
    svg.appendChild(nowLabel);
  }

  const pathD = pressures
    .map((p, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(2)} ${yAt(p).toFixed(2)}`)
    .join(" ");
  const path = document.createElementNS(NS, "path");
  path.setAttribute("d", pathD);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "#5aa7ff");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("stroke-linecap", "round");
  svg.appendChild(path);

  const areaD =
    pressures
      .map((p, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(2)} ${yAt(p).toFixed(2)}`)
      .join(" ") +
    ` L${xAt(pressures.length - 1).toFixed(2)} ${(height - pad.b).toFixed(2)}` +
    ` L${xAt(0).toFixed(2)} ${(height - pad.b).toFixed(2)} Z`;
  const area = document.createElementNS(NS, "path");
  area.setAttribute("d", areaD);
  area.setAttribute("fill", "#5aa7ff");
  area.setAttribute("fill-opacity", "0.12");
  svg.appendChild(area);

  const labelHours = [-24, -12, 0, 12, 24];
  for (const h of labelHours) {
    const i = presentIdx + h;
    if (i < 0 || i >= times.length) continue;
    const x = xAt(i);
    const lab = document.createElementNS(NS, "text");
    lab.setAttribute("x", String(x));
    lab.setAttribute("y", String(height - 6));
    lab.setAttribute("text-anchor", "middle");
    lab.setAttribute("font-size", "10");
    lab.setAttribute("font-family", fontFamily);
    lab.setAttribute("fill", axisColor);
    lab.setAttribute("opacity", "0.55");
    lab.textContent = h === 0 ? "今" : `${h > 0 ? "+" : ""}${h}h`;
    svg.appendChild(lab);
  }

  return svg;
};
