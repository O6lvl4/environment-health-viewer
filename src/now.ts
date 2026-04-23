import type { DailySeries, HourlySeries } from "./api.js";
import { nearestHourIndex } from "./api.js";

export type Conditions = {
  tempC: number;
  humidity: number;
  todayMax: number;
  todayMin: number;
  weatherCode: number;
  weatherEmoji: string;
  weatherLabel: string;
  rainProbNext6h: number;
  precipNow: number;
};

/**
 * WMO weather interpretation codes.
 * https://open-meteo.com/en/docs#weathervariables
 */
const WMO: Record<number, { emoji: string; label: string }> = {
  0: { emoji: "☀️", label: "快晴" },
  1: { emoji: "🌤️", label: "晴れ" },
  2: { emoji: "⛅", label: "晴時々曇" },
  3: { emoji: "☁️", label: "曇り" },
  45: { emoji: "🌫️", label: "霧" },
  48: { emoji: "🌫️", label: "霧氷" },
  51: { emoji: "🌦️", label: "霧雨(弱)" },
  53: { emoji: "🌦️", label: "霧雨" },
  55: { emoji: "🌦️", label: "霧雨(強)" },
  56: { emoji: "🌨️", label: "着氷霧雨" },
  57: { emoji: "🌨️", label: "着氷霧雨(強)" },
  61: { emoji: "🌧️", label: "小雨" },
  63: { emoji: "🌧️", label: "雨" },
  65: { emoji: "🌧️", label: "強い雨" },
  66: { emoji: "🌨️", label: "着氷雨" },
  67: { emoji: "🌨️", label: "着氷雨(強)" },
  71: { emoji: "🌨️", label: "小雪" },
  73: { emoji: "🌨️", label: "雪" },
  75: { emoji: "🌨️", label: "大雪" },
  77: { emoji: "❄️", label: "霧雪" },
  80: { emoji: "🌧️", label: "にわか雨" },
  81: { emoji: "🌧️", label: "にわか雨(強)" },
  82: { emoji: "⛈️", label: "豪雨" },
  85: { emoji: "🌨️", label: "にわか雪" },
  86: { emoji: "🌨️", label: "にわか雪(強)" },
  95: { emoji: "⛈️", label: "雷雨" },
  96: { emoji: "⛈️", label: "雷雨+雹" },
  99: { emoji: "⛈️", label: "雷雨+雹(強)" },
};

export function currentConditions(
  hourly: HourlySeries,
  daily: DailySeries,
  now: Date,
): Conditions {
  const idx = nearestHourIndex(hourly.time, now);
  const dayIdx = daily.time.length >= 3 ? 1 : 0;

  const code = hourly.weathercode[idx] ?? 0;
  const meta = WMO[code] ?? { emoji: "🌡️", label: `code ${code}` };

  // 次6h の降水確率の最大値（外出判断に使いやすい）
  let rainProb = 0;
  for (let i = idx; i < Math.min(idx + 6, hourly.precipitation_probability.length); i++) {
    const p = hourly.precipitation_probability[i];
    if (p != null && p > rainProb) rainProb = p;
  }

  return {
    tempC: hourly.temperature_2m[idx],
    humidity: hourly.relative_humidity_2m[idx],
    todayMax: daily.temperature_2m_max[dayIdx],
    todayMin: daily.temperature_2m_min[dayIdx],
    weatherCode: code,
    weatherEmoji: meta.emoji,
    weatherLabel: meta.label,
    rainProbNext6h: rainProb,
    precipNow: hourly.precipitation[idx] ?? 0,
  };
}
