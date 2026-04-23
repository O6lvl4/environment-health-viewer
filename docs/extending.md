# Extending Guide

新しいメトリクス・データソース・パネルを足すときの手順。
**ドメインから外側に向かって作業すると安全** (内側はテストで固められる)。

## 1. 新しいリスクメトリクスを追加する

例: 「湿度過多リスク」を入れたい。**観測 / 閾値判定 / 表示文字列の3段** に分けるのが流儀。

### 1.1 MetricId に追加

```ts
// src/domain/risk/metric.ts
export const MetricId = {
  ...,
  Humidity: "humidity",
} as const;
```

### 1.2 観測量 + Policy + Notes + assess を一つのファイルに

```
src/domain/risk/metrics/humidity.ts
```

```ts
import { type Metric, MetricId } from "../metric.js";
import { type RiskLevel } from "../../shared/risk-level.js";
import { type Specification } from "../../shared/specification.js";
import { type RiskPolicy, evaluatePolicy } from "../policy.js";
import { nearestHourIndex } from "../../shared/temporal.js";
import type { WeatherHourly } from "../../conditions/series.js";

// ─── Observation: 純粋な観測量 (テスト容易) ────────────
export type HumidityObservation = { readonly rh: number };

export const observeHumidity = (
  hourly: WeatherHourly,
  now: Date,
): HumidityObservation => {
  const idx = nearestHourIndex(hourly.time, now);
  return { rh: hourly.humidity[idx] };
};

// ─── Policy: Specification を組み立てた閾値ルール ──────
const rhAtLeast = (n: number): Specification<HumidityObservation> => (o) => o.rh >= n;

export const DEFAULT_HUMIDITY_POLICY: RiskPolicy<HumidityObservation> = {
  rules: [
    { level: "high", when: rhAtLeast(90) },
    { level: "mid", when: rhAtLeast(75) },
  ],
};

// ─── Notes: level + observation → 表示文字列 ───────────
const NOTES: Record<RiskLevel, (o: HumidityObservation) => string> = {
  high: () => "極めて高湿。熱中症・カビに注意",
  mid: () => "高湿。換気・除湿を",
  low: () => "標準",
  danger: () => "—", // この metric では未使用
};

// ─── assess: 3段を組み合わせて Metric を返す ──────────
export const assessHumidity = (
  hourly: WeatherHourly,
  now: Date,
  policy: RiskPolicy<HumidityObservation> = DEFAULT_HUMIDITY_POLICY,
): Metric => {
  const obs = observeHumidity(hourly, now);
  const level = evaluatePolicy(policy, obs);
  return {
    id: MetricId.Humidity,
    title: "湿度",
    icon: "💧",
    level,
    value: obs.rh.toFixed(0),
    unit: "%",
    note: NOTES[level](obs),
  };
};
```

### 1.3 `buildAssessment` に組み込む

```ts
// src/domain/risk/risk-service.ts
import { assessHumidity } from "./metrics/humidity.js";

const metrics = [
  ...,
  assessHumidity(weather.hourly, now),
];
```

### 1.4 テストを2層で書く

**Policy 単体テスト** (観測値を直接渡して境界値を検証):
```ts
// 既存の policies.test.ts に追記
describe("DEFAULT_HUMIDITY_POLICY", () => {
  const eval_ = (rh: number) => evaluatePolicy(DEFAULT_HUMIDITY_POLICY, { rh });
  it("90%↑ で high", () => expect(eval_(90)).toBe(RiskLevel.High));
  it("75%↑ で mid", () => expect(eval_(75)).toBe(RiskLevel.Mid));
  it("75% 未満で low", () => expect(eval_(74.99)).toBe(RiskLevel.Low));
});
```

**統合テスト** (`assessHumidity` 経由、Metric 全体を確認):
```ts
// src/domain/risk/metrics/humidity.test.ts
describe("assessHumidity", () => {
  it("高湿度の Metric を返す", () => {
    const m = assessHumidity(buildHourly(95), NOW);
    expect(m.level).toBe(RiskLevel.High);
    expect(m.value).toBe("95");
  });
});
```

### 1.5 アーキテクチャ規約チェック

```sh
npm run lint:arch  # 層境界違反がないか確認
```

### 1.6 完了

UI 側は変更不要。`renderCards` が Metric 配列をループするだけなので新メトリクスは自動的にカード表示される。

---

## 2. 新しいデータソース (例: 太陽フレア / Kp指数) を追加する

### 2.1 Port を定義 (application 層)

```ts
// src/application/ports.ts
export type SpaceWeatherProvider = {
  fetch(): Promise<Result<KpIndex, FetchError>>;
};
```

### 2.2 ドメインに型を追加 (domain 層)

```ts
// src/domain/space/kp-index.ts
export type KpIndex = { value: number; observedAt: Date };
```

### 2.3 Adapter を実装 (infrastructure 層)

```ts
// src/infrastructure/noaa-space-weather.ts
export const createNoaaSpaceWeatherProvider = (): SpaceWeatherProvider => ({
  async fetch() {
    const res = await fetch("https://services.swpc.noaa.gov/json/...");
    ...
    return ok({ value, observedAt: new Date() });
  },
});
```

### 2.4 ユースケースに組み込み

`refresh-dashboard.ts` の `RefreshDeps` と `DashboardData` に追加し、並行 fetch する。

### 2.5 Composition Root で wire

```ts
// src/main.ts
const deps: RefreshDeps = {
  ...,
  spaceWeather: createNoaaSpaceWeatherProvider(),
};
```

### 2.6 リスク算出に組み込むなら 1 のフローに合流

太陽フレアとリスクの相関を見たいなら新メトリクス `assessSpaceWeather` として `risk/metrics/` 配下に追加。

---

## 3. 新しい UI パネルを追加する

### 3.1 HTML に section 追加

```html
<!-- index.html -->
<section id="my-panel" class="my-[10px] rounded-[4px] border border-line bg-panel" hidden>
  ...
</section>
```

### 3.2 DomRefs に追加

```ts
// src/presentation/dom-refs.ts
myPanel: $("my-panel"),
```

### 3.3 Renderer を書く

```ts
// src/presentation/renderers.ts
export const renderMyPanel = (refs: DomRefs, data: ...): void => {
  refs.myPanel.hidden = false;
  ...
};
```

### 3.4 Composition Root で apply に追加

```ts
// src/main.ts
case "ready":
  ...
  renderMyPanel(dom, s.data.myThing);
```

---

## 4. 新しい都道府県・JMA 官署を追加する

`src/domain/warnings/office-code.ts` の `TABLE` に追加するだけ。
北海道や沖縄県の細分官署を分けたい場合は、まず `Prefecture` の VO に subdivision の概念を入れる必要がある。

---

## 5. 新しい WMO weather code を追加する

`src/domain/conditions/weather-code.ts` の `TABLE` に行追加。

---

## 設計上のチェックリスト (拡張時)

- [ ] `npm run lint:arch` で層境界違反が出ていないか (CI でも自動チェックされる)
- [ ] ドメイン層に `fetch` / DOM / `window` への参照が漏れていないか
- [ ] 新しい primitive は Brand 化したか (`number` だけで意味を担わせていないか)
- [ ] 失敗しうる関数は `Result` を返しているか (throw していないか)
- [ ] 判別共用体に新しいケースを足したら `switch` 全箇所をコンパイラに指摘させたか (`never` 残骸チェック)
- [ ] リスクメトリクスは observe / Policy / Notes の3段に分離したか (一関数に詰め込んでいないか)
- [ ] Policy のルールは厳しい順 (`danger → high → mid`) に並べたか
- [ ] Policy 境界値テストを `policies.test.ts` に追加したか (各 level の境界 ± 1)
- [ ] adapter は外部 API のスキーマを必ず内部 VO にマップしてから返しているか (Anti-Corruption)
