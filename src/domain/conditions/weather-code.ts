/**
 * WMO weather interpretation code (https://open-meteo.com/en/docs).
 * 数値コード → 表示用 (絵文字 + 日本語ラベル) のマッピング VO。
 */

export type WeatherCondition = {
  readonly code: number;
  readonly emoji: string;
  readonly label: string;
};

const TABLE: Record<number, { emoji: string; label: string }> = {
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

export const interpretWeatherCode = (code: number): WeatherCondition => {
  const m = TABLE[code];
  return m
    ? { code, emoji: m.emoji, label: m.label }
    : { code, emoji: "🌡️", label: `code ${code}` };
};
