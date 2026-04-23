/**
 * RiskLevel → Tailwind ユーティリティ class 文字列の対応表 (純データ)。
 * presentation 層が状態 → DOM の変換を行う際に参照する。
 */
import type { RiskLevel } from "../domain/shared/risk-level.js";

export const LEVEL_BADGE: Record<RiskLevel, string> = {
  low: "text-lv-low border-lv-low",
  mid: "text-lv-mid border-lv-mid",
  high: "text-lv-high border-lv-high [text-shadow:0_0_8px_rgba(255,122,58,0.4)]",
  danger:
    "text-lv-danger border-lv-danger [text-shadow:0_0_10px_rgba(255,45,110,0.5)] animate-pulse-glow",
};

export const LEVEL_BAR: Record<RiskLevel, string> = {
  low: "before:bg-lv-low",
  mid: "before:bg-lv-mid",
  high: "before:bg-lv-high before:[box-shadow:0_0_12px_var(--color-lv-high)]",
  danger: "before:bg-lv-danger before:[box-shadow:0_0_14px_var(--color-lv-danger)]",
};

export const LEVEL_BORDER: Record<RiskLevel, string> = {
  low: "border-line",
  mid: "border-line",
  high: "border-lv-high/35",
  danger: "border-lv-danger/40",
};

export const LEVEL_TAG: Record<RiskLevel, string> = {
  low: "text-lv-low",
  mid: "text-lv-mid",
  high: "text-lv-high",
  danger: "text-lv-danger",
};
