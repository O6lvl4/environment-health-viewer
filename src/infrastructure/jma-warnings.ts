/**
 * JMA bosai 警報・注意報のアダプタ。
 * 都道府県名 → 官署コード → JSON 取得 → ActiveWarning[] へ変換。
 */
import type { WarningsProvider } from "../application/ports.js";
import { ok, err } from "../domain/shared/result.js";
import type { Prefecture } from "../domain/location/prefecture.js";
import { OfficeCode } from "../domain/warnings/office-code.js";
import { lookupWarningMeta } from "../domain/warnings/warning-code.js";
import { type ActiveWarning, WarningSet } from "../domain/warnings/warning-set.js";

const WARN_BASE = "https://www.jma.go.jp/bosai/warning/data/warning";
const AREA_URL = "https://www.jma.go.jp/bosai/common/const/area.json";

type JmaArea = {
  code: string;
  warnings?: { code: string; status: string }[];
};
type JmaResponse = {
  reportDatetime?: string;
  areaTypes?: { areas: JmaArea[] }[];
};
type AreaConst = {
  class10s?: Record<string, { name: string }>;
};

const isActiveStatus = (s: string): boolean => s === "発表" || s === "継続";

export const createJmaWarningsProvider = (
  fetcher: typeof fetch = fetch,
): WarningsProvider => {
  let areaCache: Record<string, string> | null = null;

  const fetchAreaNames = async (): Promise<Record<string, string>> => {
    if (areaCache) return areaCache;
    try {
      const res = await fetcher(AREA_URL, { cache: "force-cache" });
      if (!res.ok) return {};
      const data = (await res.json()) as AreaConst;
      const out: Record<string, string> = {};
      if (data.class10s) {
        for (const [code, v] of Object.entries(data.class10s)) {
          out[code] = v.name;
        }
      }
      areaCache = out;
      return out;
    } catch {
      return {};
    }
  };

  return {
    async fetch(prefecture: Prefecture) {
      const code = OfficeCode.forPrefecture(prefecture);
      if (!code) return err({ message: `unknown prefecture: ${prefecture}` });

      try {
        const [warnRes, areaNames] = await Promise.all([
          fetcher(`${WARN_BASE}/${code}.json`),
          fetchAreaNames(),
        ]);
        if (!warnRes.ok) return err({ message: `jma: HTTP ${warnRes.status}` });
        const data = (await warnRes.json()) as JmaResponse;

        const codeMap = new Map<string, ActiveWarning>();
        for (const at of data.areaTypes ?? []) {
          for (const area of at.areas ?? []) {
            for (const w of area.warnings ?? []) {
              if (!isActiveStatus(w.status)) continue;
              const meta = lookupWarningMeta(w.code);
              if (!meta) continue;
              const areaName = areaNames[area.code] ?? area.code;
              const existing = codeMap.get(w.code);
              if (existing) {
                if (!existing.areas.includes(areaName)) {
                  codeMap.set(w.code, {
                    ...existing,
                    areas: [...existing.areas, areaName],
                  });
                }
              } else {
                codeMap.set(w.code, {
                  code: meta.code,
                  name: meta.name,
                  severity: meta.severity,
                  areas: [areaName],
                });
              }
            }
          }
        }

        return ok(
          WarningSet.create(
            prefecture,
            data.reportDatetime ? new Date(data.reportDatetime) : null,
            [...codeMap.values()],
          ),
        );
      } catch (e) {
        return err({
          message: e instanceof Error ? e.message : "jma: unknown error",
          cause: e,
        });
      }
    },
  };
};
