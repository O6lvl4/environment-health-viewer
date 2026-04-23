/**
 * WarningSet: 単一都道府県における有効警報・注意報の集約。
 */
import type { Prefecture } from "../location/prefecture.js";
import { type Severity, compareSeverity } from "./severity.js";

export type ActiveWarning = {
  readonly code: string;
  readonly name: string;
  readonly severity: Severity;
  readonly areas: ReadonlyArray<string>;
};

export type WarningSet = {
  readonly prefecture: Prefecture;
  readonly reportedAt: Date | null;
  readonly warnings: ReadonlyArray<ActiveWarning>;
};

export const WarningSet = {
  create: (
    prefecture: Prefecture,
    reportedAt: Date | null,
    warnings: ReadonlyArray<ActiveWarning>,
  ): WarningSet => ({
    prefecture,
    reportedAt,
    warnings: [...warnings].sort((a, b) => compareSeverity(a.severity, b.severity)),
  }),

  isEmpty: (s: WarningSet): boolean => s.warnings.length === 0,
};
