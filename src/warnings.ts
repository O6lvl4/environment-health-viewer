/**
 * 気象庁 (JMA) 警報・注意報の取得。bosai JSON は CORS 許可。
 * 都道府県名 → 官署コード（office code）の固定マッピングで簡易実装。
 * Hokkaido / Okinawa は複数官署があるが代表的な地方を採用。
 */

const OFFICE_CODE: Record<string, string> = {
  北海道: "016010", // 石狩・空知・後志（札幌管区）
  青森県: "020000",
  岩手県: "030000",
  宮城県: "040000",
  秋田県: "050000",
  山形県: "060000",
  福島県: "070000",
  茨城県: "080000",
  栃木県: "090000",
  群馬県: "100000",
  埼玉県: "110000",
  千葉県: "120000",
  東京都: "130000",
  神奈川県: "140000",
  新潟県: "150000",
  富山県: "160000",
  石川県: "170000",
  福井県: "180000",
  山梨県: "190000",
  長野県: "200000",
  岐阜県: "210000",
  静岡県: "220000",
  愛知県: "230000",
  三重県: "240000",
  滋賀県: "250000",
  京都府: "260000",
  大阪府: "270000",
  兵庫県: "280000",
  奈良県: "290000",
  和歌山県: "300000",
  鳥取県: "310000",
  島根県: "320000",
  岡山県: "330000",
  広島県: "340000",
  山口県: "350000",
  徳島県: "360000",
  香川県: "370000",
  愛媛県: "380000",
  高知県: "390000",
  福岡県: "400000",
  佐賀県: "410000",
  長崎県: "420000",
  熊本県: "430000",
  大分県: "440000",
  宮崎県: "450000",
  鹿児島県: "460100",
  沖縄県: "471000",
};

// 主要 JMA 警報・注意報コード → 表示名
// https://www.data.jma.go.jp/developer/xml/dictionary/dictionary.html 参照
const WARNING_NAME: Record<string, { name: string; severity: "alert" | "warn" | "info" }> = {
  "02": { name: "暴風雪警報", severity: "warn" },
  "03": { name: "大雨警報", severity: "warn" },
  "04": { name: "洪水警報", severity: "warn" },
  "05": { name: "暴風警報", severity: "warn" },
  "06": { name: "大雪警報", severity: "warn" },
  "07": { name: "波浪警報", severity: "warn" },
  "08": { name: "高潮警報", severity: "warn" },
  "10": { name: "大雨注意報", severity: "info" },
  "12": { name: "大雪注意報", severity: "info" },
  "13": { name: "風雪注意報", severity: "info" },
  "14": { name: "雷注意報", severity: "info" },
  "15": { name: "強風注意報", severity: "info" },
  "16": { name: "波浪注意報", severity: "info" },
  "17": { name: "融雪注意報", severity: "info" },
  "18": { name: "洪水注意報", severity: "info" },
  "19": { name: "高潮注意報", severity: "info" },
  "20": { name: "濃霧注意報", severity: "info" },
  "21": { name: "乾燥注意報", severity: "info" },
  "22": { name: "なだれ注意報", severity: "info" },
  "23": { name: "低温注意報", severity: "info" },
  "24": { name: "霜注意報", severity: "info" },
  "25": { name: "着氷注意報", severity: "info" },
  "26": { name: "着雪注意報", severity: "info" },
  "27": { name: "その他の注意報", severity: "info" },
  "32": { name: "暴風雪特別警報", severity: "alert" },
  "33": { name: "大雨特別警報", severity: "alert" },
  "35": { name: "暴風特別警報", severity: "alert" },
  "36": { name: "大雪特別警報", severity: "alert" },
  "37": { name: "波浪特別警報", severity: "alert" },
  "38": { name: "高潮特別警報", severity: "alert" },
};

export type ActiveWarning = {
  code: string;
  name: string;
  severity: "alert" | "warn" | "info";
  areas: string[]; // 一次細分区域名のリスト
};

export type WarningResult = {
  prefecture: string;
  reportDatetime?: string;
  warnings: ActiveWarning[];
};

type JmaArea = {
  code: string;
  name?: string;
  warnings: { code: string; status: string }[];
};

type JmaResponse = {
  reportDatetime?: string;
  areaTypes: { areas: JmaArea[] }[];
};

const SEVERITY_RANK: Record<"alert" | "warn" | "info", number> = {
  alert: 0,
  warn: 1,
  info: 2,
};

/**
 * BigDataCloud の principalSubdivision (例: "東京都") から官署コードを引く。
 * 一致しなければ null を返し、警報セクションは非表示にする。
 */
export function officeCodeFor(prefecture: string | null): string | null {
  if (!prefecture) return null;
  // 末尾に "都" "府" "県" がないケースを念のため補正
  const norm = /(都|道|府|県)$/.test(prefecture) ? prefecture : `${prefecture}県`;
  return OFFICE_CODE[norm] ?? OFFICE_CODE[prefecture] ?? null;
}

export async function fetchAreaNames(officeCode: string): Promise<Record<string, string>> {
  try {
    const url = `https://www.jma.go.jp/bosai/common/const/area.json`;
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return {};
    const data = (await res.json()) as {
      class10s?: Record<string, { name: string }>;
      offices?: Record<string, { name: string; children?: string[] }>;
    };
    const out: Record<string, string> = {};
    if (data.class10s) {
      for (const [code, v] of Object.entries(data.class10s)) {
        out[code] = v.name;
      }
    }
    void officeCode;
    return out;
  } catch {
    return {};
  }
}

export async function fetchJmaWarnings(prefecture: string | null): Promise<WarningResult | null> {
  const code = officeCodeFor(prefecture);
  if (!code || !prefecture) return null;
  try {
    const [warnRes, areaNames] = await Promise.all([
      fetch(`https://www.jma.go.jp/bosai/warning/data/warning/${code}.json`),
      fetchAreaNames(code),
    ]);
    if (!warnRes.ok) return null;
    const data = (await warnRes.json()) as JmaResponse;

    // areaTypes[0] は通常 一次細分区域 (sub-prefecture)。
    // status が "発表" / "継続" のものを抽出。
    const codeMap = new Map<string, ActiveWarning>();
    for (const at of data.areaTypes ?? []) {
      for (const area of at.areas ?? []) {
        for (const w of area.warnings ?? []) {
          if (!isActiveStatus(w.status)) continue;
          const meta = WARNING_NAME[w.code];
          if (!meta) continue;
          const areaName = areaNames[area.code] ?? area.code;
          const existing = codeMap.get(w.code);
          if (existing) {
            if (!existing.areas.includes(areaName)) existing.areas.push(areaName);
          } else {
            codeMap.set(w.code, {
              code: w.code,
              name: meta.name,
              severity: meta.severity,
              areas: [areaName],
            });
          }
        }
      }
    }

    const warnings = [...codeMap.values()].sort(
      (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
    );

    return {
      prefecture,
      reportDatetime: data.reportDatetime,
      warnings,
    };
  } catch {
    return null;
  }
}

function isActiveStatus(status: string): boolean {
  // "発表" "継続" は active、"解除" や "発表警報・注意報はなし" は除外
  return status === "発表" || status === "継続";
}
