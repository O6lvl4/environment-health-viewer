/**
 * Metric: 個別リスクの一単位を表す Value Object。
 * リスク算出ドメインサービス (`assess*`) はすべて Metric を返す。
 */
import type { RiskLevel } from "../shared/risk-level.js";

export const MetricId = {
  Migraine: "migraine",
  TempSwing: "temp-swing",
  Heat: "heat",
  Uv: "uv",
  AirQuality: "air-quality",
  Dust: "dust",
  Pollen: "pollen",
} as const;

export type MetricId = (typeof MetricId)[keyof typeof MetricId];

export type Metric = {
  readonly id: MetricId;
  readonly title: string;
  readonly icon: string;
  readonly level: RiskLevel;
  readonly value: string;
  readonly unit: string | null;
  readonly note: string;
};
