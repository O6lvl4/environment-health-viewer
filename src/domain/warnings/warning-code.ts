/**
 * JMA 警報・注意報コードと表示メタの辞書 (VO)。
 * https://www.data.jma.go.jp/developer/xml/dictionary/dictionary.html
 */
import { type Severity, Severity as Sev } from "./severity.js";

export type WarningMeta = {
  readonly code: string;
  readonly name: string;
  readonly severity: Severity;
};

const TABLE: Record<string, WarningMeta> = Object.freeze({
  "02": { code: "02", name: "暴風雪警報", severity: Sev.Warn },
  "03": { code: "03", name: "大雨警報", severity: Sev.Warn },
  "04": { code: "04", name: "洪水警報", severity: Sev.Warn },
  "05": { code: "05", name: "暴風警報", severity: Sev.Warn },
  "06": { code: "06", name: "大雪警報", severity: Sev.Warn },
  "07": { code: "07", name: "波浪警報", severity: Sev.Warn },
  "08": { code: "08", name: "高潮警報", severity: Sev.Warn },
  "10": { code: "10", name: "大雨注意報", severity: Sev.Info },
  "12": { code: "12", name: "大雪注意報", severity: Sev.Info },
  "13": { code: "13", name: "風雪注意報", severity: Sev.Info },
  "14": { code: "14", name: "雷注意報", severity: Sev.Info },
  "15": { code: "15", name: "強風注意報", severity: Sev.Info },
  "16": { code: "16", name: "波浪注意報", severity: Sev.Info },
  "17": { code: "17", name: "融雪注意報", severity: Sev.Info },
  "18": { code: "18", name: "洪水注意報", severity: Sev.Info },
  "19": { code: "19", name: "高潮注意報", severity: Sev.Info },
  "20": { code: "20", name: "濃霧注意報", severity: Sev.Info },
  "21": { code: "21", name: "乾燥注意報", severity: Sev.Info },
  "22": { code: "22", name: "なだれ注意報", severity: Sev.Info },
  "23": { code: "23", name: "低温注意報", severity: Sev.Info },
  "24": { code: "24", name: "霜注意報", severity: Sev.Info },
  "25": { code: "25", name: "着氷注意報", severity: Sev.Info },
  "26": { code: "26", name: "着雪注意報", severity: Sev.Info },
  "27": { code: "27", name: "その他の注意報", severity: Sev.Info },
  "32": { code: "32", name: "暴風雪特別警報", severity: Sev.Alert },
  "33": { code: "33", name: "大雨特別警報", severity: Sev.Alert },
  "35": { code: "35", name: "暴風特別警報", severity: Sev.Alert },
  "36": { code: "36", name: "大雪特別警報", severity: Sev.Alert },
  "37": { code: "37", name: "波浪特別警報", severity: Sev.Alert },
  "38": { code: "38", name: "高潮特別警報", severity: Sev.Alert },
});

export const lookupWarningMeta = (code: string): WarningMeta | null =>
  TABLE[code] ?? null;
