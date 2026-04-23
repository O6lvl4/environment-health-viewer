/**
 * Prefecture: 都道府県名を表す VO。
 * 末尾に「都/道/府/県」が付く正規化された日本語表記を保持する。
 */
import type { Brand } from "../shared/brand.js";
import { type Result, ok, err } from "../shared/result.js";

export type Prefecture = Brand<string, "Prefecture">;

const SUFFIX = /(都|道|府|県)$/;

export const Prefecture = {
  /**
   * 与えられた文字列を都道府県名として解釈する。
   * 末尾に「都/道/府/県」が無ければ「県」を補う（市区町村のみが渡されたケースの軽い救済）。
   */
  of: (raw: string): Result<Prefecture, string> => {
    const trimmed = raw.trim();
    if (!trimmed) return err("empty prefecture");
    const normalized = SUFFIX.test(trimmed) ? trimmed : `${trimmed}県`;
    return ok(normalized as Prefecture);
  },
  unsafe: (s: string): Prefecture => s as Prefecture,
};
