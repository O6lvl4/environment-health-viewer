import type { AirHourly, HourlySeries, WeatherResponse, AirResponse } from "./api.js";
import { nearestHourIndex } from "./api.js";

export type Level = "low" | "mid" | "high" | "danger";

export type Metric = {
  id: string;
  title: string;
  icon: string;
  level: Level;
  value: string;
  unit?: string;
  note: string;
};

const LEVEL_ORDER: Record<Level, number> = { low: 0, mid: 1, high: 2, danger: 3 };

export function maxLevel(levels: Level[]): Level {
  return levels.reduce<Level>(
    (acc, l) => (LEVEL_ORDER[l] > LEVEL_ORDER[acc] ? l : acc),
    "low",
  );
}

export function levelLabel(l: Level): string {
  switch (l) {
    case "low":
      return "低い";
    case "mid":
      return "中程度";
    case "high":
      return "高い";
    case "danger":
      return "危険";
  }
}

/**
 * 偏頭痛リスク。気圧の急変動を検出する。
 * 直近24h±次24hの中で、任意の12h窓における最大下降幅を見て判定。
 * 低気圧通過時は気圧が下がるため頭痛トリガーになりやすい。
 */
export function migraineRisk(hourly: HourlySeries, now: Date): Metric {
  const idx = nearestHourIndex(hourly.time, now);
  const start = Math.max(0, idx - 24);
  const end = Math.min(hourly.pressure_msl.length, idx + 24);
  const window = hourly.pressure_msl.slice(start, end);

  let maxDrop = 0;
  let maxRise = 0;
  for (let i = 0; i < window.length; i++) {
    for (let j = i + 1; j < Math.min(i + 13, window.length); j++) {
      const diff = window[j] - window[i];
      if (diff < maxDrop) maxDrop = diff;
      if (diff > maxRise) maxRise = diff;
    }
  }

  const drop = Math.abs(maxDrop);
  const swing = Math.max(drop, maxRise);

  let level: Level;
  let note: string;
  if (drop >= 8 || swing >= 12) {
    level = "danger";
    note = `12h で最大 ${drop.toFixed(1)} hPa の急降下。発症リスク非常に高め`;
  } else if (drop >= 5 || swing >= 8) {
    level = "high";
    note = `12h で最大 ${drop.toFixed(1)} hPa 低下。頭痛の出やすい気圧変動`;
  } else if (drop >= 3 || swing >= 5) {
    level = "mid";
    note = `軽度の気圧変動 (${drop.toFixed(1)} hPa)。敏感な人は注意`;
  } else {
    level = "low";
    note = "気圧は安定しています";
  }

  const current = hourly.pressure_msl[idx];
  return {
    id: "migraine",
    title: "偏頭痛リスク",
    icon: "🧠",
    level,
    value: current ? current.toFixed(0) : "—",
    unit: "hPa",
    note,
  };
}

/**
 * WBGT 簡易推定 (湿球黒球温度)。Australian BoM 経験式:
 * WBGT ≈ 0.567*T + 0.393*e + 3.94, e = (RH/100) * 6.105 * exp(17.27*T/(237.7+T))
 * 屋外日射の補正は省略。屋外活動の目安として使う。
 */
function estimateWBGT(tempC: number, rh: number): number {
  const e = (rh / 100) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC));
  return 0.567 * tempC + 0.393 * e + 3.94;
}

export function heatstrokeRisk(hourly: HourlySeries, now: Date): Metric {
  const idx = nearestHourIndex(hourly.time, now);
  const t = hourly.temperature_2m[idx];
  const rh = hourly.relative_humidity_2m[idx];
  const wbgt = estimateWBGT(t, rh);

  let level: Level;
  let note: string;
  if (wbgt >= 31) {
    level = "danger";
    note = "原則すべての運動を中止すべき水準";
  } else if (wbgt >= 28) {
    level = "high";
    note = "激しい運動・長時間の屋外活動は中止";
  } else if (wbgt >= 25) {
    level = "mid";
    note = "積極的に休憩・水分補給を";
  } else if (wbgt >= 21) {
    level = "low";
    note = "通常レベル。水分補給は忘れずに";
  } else {
    level = "low";
    note = `${t.toFixed(0)}℃ / 湿度 ${rh.toFixed(0)}%`;
  }

  return {
    id: "heat",
    title: "熱中症リスク",
    icon: "🥵",
    level,
    value: wbgt.toFixed(1),
    unit: "WBGT",
    note,
  };
}

export function uvRisk(weather: WeatherResponse): Metric {
  const today = weather.daily.uv_index_max[0] ?? 0;
  let level: Level;
  let note: string;
  if (today >= 11) {
    level = "danger";
    note = "極端に強い。長時間の外出は避ける";
  } else if (today >= 8) {
    level = "high";
    note = "非常に強い。日焼け止め・帽子必須";
  } else if (today >= 6) {
    level = "mid";
    note = "強い。日中は対策推奨";
  } else if (today >= 3) {
    level = "low";
    note = "中程度。長時間外出時は対策を";
  } else {
    level = "low";
    note = "弱い";
  }

  return {
    id: "uv",
    title: "UV 指数（最大）",
    icon: "☀️",
    level,
    value: today.toFixed(1),
    unit: "UVI",
    note,
  };
}

export function airQualityRisk(air: AirHourly, now: Date): Metric {
  const idx = nearestHourIndex(air.time, now);
  const pm25 = air.pm2_5[idx];
  const aqi = air.european_aqi[idx];

  let level: Level;
  let note: string;
  if (pm25 >= 75 || aqi >= 100) {
    level = "danger";
    note = "外出を控えめに、敏感な方はマスクを";
  } else if (pm25 >= 35 || aqi >= 80) {
    level = "high";
    note = "敏感な方は屋外活動を制限";
  } else if (pm25 >= 15 || aqi >= 40) {
    level = "mid";
    note = "屋外活動に支障なし、長時間運動は様子を見て";
  } else {
    level = "low";
    note = "良好";
  }

  return {
    id: "air",
    title: "大気質 (PM2.5)",
    icon: "💨",
    level,
    value: pm25 != null ? pm25.toFixed(1) : "—",
    unit: "μg/m³",
    note,
  };
}

/**
 * 花粉。grains/m³ 単位での総量から判定。
 * 各種類の閾値（low<10, mid<25, high<50, danger>=50）の合算ではなく
 * 個別最大値と総量の両方を考慮。
 */
export function pollenRisk(air: AirHourly, now: Date): Metric | null {
  const idx = nearestHourIndex(air.time, now);
  const types: Array<{ name: string; arr: number[] | undefined }> = [
    { name: "ハンノキ", arr: air.alder_pollen },
    { name: "シラカバ", arr: air.birch_pollen },
    { name: "イネ科", arr: air.grass_pollen },
    { name: "ヨモギ", arr: air.mugwort_pollen },
    { name: "オリーブ", arr: air.olive_pollen },
    { name: "ブタクサ", arr: air.ragweed_pollen },
  ];

  let total = 0;
  let topName = "";
  let topVal = 0;
  let anyData = false;

  for (const { name, arr } of types) {
    const v = arr?.[idx];
    if (v == null || Number.isNaN(v)) continue;
    anyData = true;
    total += v;
    if (v > topVal) {
      topVal = v;
      topName = name;
    }
  }

  if (!anyData) return null;

  let level: Level;
  let note: string;
  if (topVal >= 50 || total >= 80) {
    level = "danger";
    note = `${topName}が極めて多い (${topVal.toFixed(0)} grains/m³)`;
  } else if (topVal >= 25 || total >= 40) {
    level = "high";
    note = `${topName}が多め (${topVal.toFixed(0)} grains/m³)`;
  } else if (topVal >= 10 || total >= 15) {
    level = "mid";
    note = `${topName}が少量 (${topVal.toFixed(0)} grains/m³)`;
  } else {
    level = "low";
    note = "ほぼ飛散なし";
  }

  return {
    id: "pollen",
    title: "花粉",
    icon: "🌾",
    level,
    value: total.toFixed(0),
    unit: "grains/m³",
    note,
  };
}

export function summaryMessage(metrics: Metric[]): { level: Level; message: string } {
  const level = maxLevel(metrics.map((m) => m.level));
  const top = metrics
    .filter((m) => LEVEL_ORDER[m.level] === LEVEL_ORDER[level] && level !== "low")
    .map((m) => m.title);

  let message: string;
  switch (level) {
    case "danger":
      message = top.length
        ? `${top.join("・")} が危険水準です。無理は禁物です。`
        : "危険水準の項目があります。";
      break;
    case "high":
      message = top.length
        ? `${top.join("・")} が高めです。体調に注意してください。`
        : "リスクが高めの項目があります。";
      break;
    case "mid":
      message = top.length
        ? `${top.join("・")} がやや高め。敏感な方は気をつけて。`
        : "全体的に注意レベルです。";
      break;
    default:
      message = "全体的に良好です。";
  }
  return { level, message };
}

export function buildMetrics(
  weather: WeatherResponse,
  air: AirResponse,
  now: Date,
): Metric[] {
  const list: Metric[] = [
    migraineRisk(weather.hourly, now),
    heatstrokeRisk(weather.hourly, now),
    uvRisk(weather),
    airQualityRisk(air.hourly, now),
  ];
  const pollen = pollenRisk(air.hourly, now);
  if (pollen) list.push(pollen);
  return list;
}
