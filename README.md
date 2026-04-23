# 環境ヘルスチェック (environment-health-viewer)

気象・大気質データを基に、現在地における **偏頭痛・寒暖差・熱中症・UV・大気質・黄砂・花粉** のリスクと、**気象庁警報・現在の天候・太陽運行** を一画面で俯瞰する静的ダッシュボード。

公開: https://o6lvl4.github.io/environment-health-viewer/

設計詳細・図解は [`docs/`](./docs/README.md) に分割:
- [docs/architecture.md](./docs/architecture.md) — Hexagonal の層構造図と依存ルール
- [docs/domain-model.md](./docs/domain-model.md) — 各 Bounded Context のクラス図
- [docs/use-cases.md](./docs/use-cases.md) — `refreshDashboard` のシーケンス + 状態遷移
- [docs/extending.md](./docs/extending.md) — 新メトリクス・データソース・パネルの追加手順

---

## ドメイン用語集 (Ubiquitous Language)

このプロジェクトで横断的に使われる概念と語彙を定義する。コード上の型名・関数名・UIラベルはすべてこの語彙に従う。

### 1. ドメインの全体像

> **Environmental Health Risk Surveillance**
> 個人が「今日の体調・行動判断」に使えるよう、外部 API から取得した環境データをリスクメトリクスに変換し、可視化する。
> 医学的助言ではなく、あくまで *環境データからの推定* を提示するのが責務範囲。

主要関心事:
- **位置 (Location)** が決まれば全データが従属する
- **現在 (Now)** に最も近い時刻のスナップショットをリスク判定の起点とする
- 各リスクは独立した **メトリクス (Metric)** として算出され、横断する **総合状態 (System State)** に集約される

### 2. アーキテクチャ (Hexagonal / Ports & Adapters)

```
src/
  domain/              ← 純粋なドメイン層 (fetch/DOM ゼロ)
    shared/            Result, Brand, RiskLevel, units, temporal
    location/          Coordinate, Location, Prefecture
    conditions/        WeatherSnapshot, Conditions, weather-code
    risk/              Metric, Assessment, metrics/{migraine,heat,...}
    warnings/          Severity, ActiveWarning, WarningSet, OfficeCode
    solar/             SolarCycle
  application/         ← ユースケース層
    ports.ts           PositionProvider / WeatherForecastProvider 等の interface
    refresh-dashboard.ts   全panel更新の orchestrator
    dashboard-state.ts     init|loading|ready|error の判別共用体
  infrastructure/      ← 外部API/Browser API のアダプタ
    open-meteo-{forecast,air-quality}.ts
    jma-warnings.ts, bigdatacloud-geocoder.ts, browser-geolocation.ts, twemoji.ts
  presentation/        ← DOM 描画
    renderers.ts, dom-refs.ts, status.ts, chart.ts, level-classes.ts, format.ts
  main.ts              ← Composition Root のみ
```

| 層 | 依存方向 | 責務 |
|---|---|---|
| `domain/` | 何にも依存しない | 値オブジェクト・集約・ドメインサービス。`Result` で失敗を返す |
| `application/` | domain にだけ依存 | ユースケースを ports 越しに表現する |
| `infrastructure/` | domain + application/ports に依存 | 外部 API / Browser API を ports に適合させる adapter |
| `presentation/` | domain + application に依存 | 状態 → DOM の変換。pure に近い書き込み専用関数 |
| `main.ts` | 全レイヤ | 依存注入 + 状態ループの司令塔 |

### 2.5 「2026 イケてる」要素

- **Branded types**: `Hpa`, `Celsius`, `Percent`, `UvIndex`, `Latitude`, `OfficeCode` 等の primitives を `& { __brand }` で型安全化。`X.of(n)` がバリデーション付き factory。
- **Result<T,E>**: 例外を投げず判別共用体で失敗を表現。ドメインに throw が漏れない。
- **判別共用体 DashboardState**: `init | loading | ready | error` を型で網羅。
- **Ports & Adapters**: ドメインが interface に依存、infra が実装。テストではメモリ実装を差し替える。
- **Specification + RiskPolicy**: 各リスクメトリクスは `observe* → Policy → NOTES` の3段に分離。`Specification` 述語は `and / or / not` で合成可能、Policy は閾値ルール集として独立にテストできる。
- **アーキテクチャテスト**: `dependency-cruiser` で層間の依存規約を CI で機械的に強制。`domain → infrastructure` のような違反を書いた瞬間にビルドが落ちる。
- `readonly` / `as const` / `satisfies` を一貫して使用。
- 副作用は composition root と infrastructure に閉じ込め、ドメインは純関数。

### 2.6 テスト

- **Vitest** で domain + application 層を網羅 (60+ tests)
- 各リスクメトリクスは閾値境界・単調性・観測量を検証
- ユースケース `refreshDashboard` はインメモリ Ports で完全モックして経路を検証
- ブラウザ依存 (DOM/fetch) は infrastructure に閉じているため、ドメイン層はノードでそのまま走る

```sh
npm test           # CI 走行
npm run test:watch # 開発時
npm run test:cov   # カバレッジ
```

### 3. 値オブジェクト

#### Location
| フィールド | 型 | 意味 |
|---|---|---|
| `latitude`, `longitude` | number | WGS84 緯度・経度（小数点3桁に丸め） |
| `label` | string | 表示用ラベル |
| `source` | `"geolocation"` \| `"default"` | 取得手段。Geolocation 拒否時は東京（35.68N, 139.65E）にフォールバック |

#### HourlySeries / DailySeries
Open-Meteo Forecast API のレスポンスを表すレコード。**`time` 配列のインデックスで他の配列と整合する**。
- `nearestHourIndex(times, now)`: `now` に最も近いインデックスを返す。**全リスク算出の起点**となる関数。
- 取得範囲は `past_days=1` + `forecast_days=2` の合計 3 日分（前日/当日/翌日）。`daily.time.length >= 3` の前提で `idx=1` が当日。

#### Conditions (`now.ts`)
NOW/COND パネルに表示する素のスナップショット。リスク判定はしない。
- `tempC`, `humidity`, `todayMax`, `todayMin`
- `weatherCode` (WMO コード) → `weatherEmoji`, `weatherLabel` に変換
- `rainProbNext6h`: 次 6 時間の最大降水確率 %
- `precipNow`: 現在時刻の降水量 mm/h

### 4. リスクモデル

#### Level (リスク段階)
4段階に正規化された序列ある列挙型。すべてのメトリクスはこれを返す。

| Level | 日本語 (`levelLabel`) | 状態ラベル (`stateText`) | 意味 |
|---|---|---|---|
| `low` | 低い | NOMINAL | 通常レベル |
| `mid` | 中程度 | ELEVATED | 注意 |
| `high` | 高い | WARNING | 高リスク |
| `danger` | 危険 | CRITICAL | 危険水準。UI でパルス表示 |

`maxLevel(levels)` は配列中の最も高い Level を返す。総合状態 (System State) はメトリクス全体の `maxLevel` で決定する。

#### Metric
個別リスクの一単位。型定義:
```ts
type Metric = {
  id: string;          // "migraine" | "swing" | "heat" | "uv" | "air" | "dust" | "pollen"
  title: string;       // 日本語表示名
  icon: string;        // 絵文字（Twemoji 化される）
  level: Level;
  value: string;       // 主表示の数値・文字列（既にフォーマット済み）
  unit?: string;       // 単位
  note: string;        // 補足説明（リスク判断の理由）
};
```

#### 各メトリクスの判定ロジック

##### 偏頭痛リスク (`migraineRisk`)
- 入力: `pressure_msl` (海面気圧, hPa)
- 評価範囲: 現在 ±24h
- 観測量:
  - **Drop**: 12h 窓での最大下降幅 (hPa)
  - **Swing**: 12h 窓での最大変動幅 (上昇含む)
- 閾値:

  | Level | 条件 |
  |---|---|
  | `danger` | Drop ≥ 8 hPa または Swing ≥ 12 hPa |
  | `high` | Drop ≥ 5 hPa または Swing ≥ 8 hPa |
  | `mid` | Drop ≥ 3 hPa または Swing ≥ 5 hPa |
  | `low` | それ未満 |

##### 寒暖差 (`tempSwingRisk`)
- 入力: `daily.temperature_2m_max/min`
- 観測量:
  - **Diurnal Range** (日較差): 当日 max - min
  - **DoD** (Day-over-Day): |当日max - 前日max|
  - **Swing**: max(Diurnal, DoD)
- 閾値: Swing ≥ 13/10/7/それ未満 → danger/high/mid/low

##### 熱中症リスク (`heatstrokeRisk`)
- 入力: `temperature_2m`, `relative_humidity_2m`
- 観測量: **WBGT** (Wet Bulb Globe Temperature) を Australian BoM 経験式で推定
  - `WBGT ≈ 0.567 T + 0.393 e + 3.94`, `e = (RH/100) · 6.105 · exp(17.27 T / (237.7 + T))`
  - 屋外日射補正は省略（屋内/日陰想定の簡易値）
- 閾値: WBGT ≥ 31/28/25/その他 → danger/high/mid/low

##### UV リスク (`uvRisk`)
- 入力: `daily.uv_index_max[0]` (UVI)
- 閾値: UVI ≥ 11/8/6/3 → danger/high/mid/low

##### 大気質 (`airQualityRisk`)
- 入力: `pm2_5` (μg/m³), `european_aqi`
- 閾値: PM2.5 ≥ 75 または AQI ≥ 100 → danger、PM2.5 ≥ 35 または AQI ≥ 80 → high、PM2.5 ≥ 15 または AQI ≥ 40 → mid、その他 → low

##### 黄砂 (`dustRisk`)
- 入力: `dust` (μg/m³)
- 閾値: ≥ 500/200/80/その他 → danger/high/mid/low
- データなし時は表示自体を省略

##### 花粉 (`pollenRisk`)
- 入力: ハンノキ/シラカバ/イネ科/ヨモギ/オリーブ/ブタクサ (各 grains/m³)
- 観測量:
  - **TopVal**: 樹種別の最大値
  - **Total**: 全樹種合計
- 閾値: TopVal ≥ 50 または Total ≥ 80 → danger、TopVal ≥ 25 または Total ≥ 40 → high、TopVal ≥ 10 または Total ≥ 15 → mid、その他 → low
- データなし時は表示省略

### 5. 警報モデル

#### WarningResult
気象庁発表の警報・注意報の集約結果。

| フィールド | 意味 |
|---|---|
| `prefecture` | 都道府県名 (例: "東京都") |
| `reportDatetime` | JMA 発表日時 (ISO 8601) |
| `warnings` | `ActiveWarning[]`、Severity 順でソート |

#### ActiveWarning
| フィールド | 意味 |
|---|---|
| `code` | JMA 警報種別コード (例: `"03"` = 大雨警報) |
| `name` | 日本語表示名 |
| `severity` | `"alert"` (特別警報) / `"warn"` (警報) / `"info"` (注意報) |
| `areas` | 一次細分区域名のリスト (例: `["23区西部", "多摩東部"]`) |

#### OfficeCode
JMA の官署コード（6桁）。47 都道府県 → コード の固定マッピングを `OFFICE_CODE` で保持。
- 例: 東京都 = `"130000"`, 大阪府 = `"270000"`, 北海道 = `"016010"` (札幌管区代表)
- 沖縄県・北海道は複数官署が存在するが代表値を採用

### 6. UI モデル

##### Panel
情報の論理的なまとまり。タイトルバーとボディからなる固定レイアウト。

| Panel | 表示内容 |
|---|---|
| `SYS/STATE` | 総合リスク (NOMINAL〜CRITICAL) と要約メッセージ |
| `NOW/COND` | 現在の気温/天気/湿度/降水確率 |
| `JMA/ALERTS` | 気象庁警報・注意報（日本国内のみ） |
| `SOLAR/CYCLE` | 日の出/日の入り/日長 |
| `PRESS/MSL` | 過去24h〜先24h の気圧推移 SVG グラフ |

##### Status Line
ヘッダ直下のセグメント表示。`[XXX]` 形式で囲まれた状態タグの並び。

| セグメント | 意味 |
|---|---|
| `GEO` / `DEFAULT` | 位置情報の取得状態 |
| `TZ` | タイムゾーン |
| `TS HH:MM:SS` | 現在時刻（毎秒更新） |
| `INIT` / `LOC/REQ` / `FETCH` / `READY` / `ERROR ...` | 取得ステージ |

##### Severity Tag (警報用)
JMA 警報パネル内で各警報の重要度を示す等幅タグ。

| Tag | 色 | 対応 Severity |
|---|---|---|
| `ALERT` | critical (#ff2d6e) | alert (特別警報) |
| `WARN` | warn (#ffb547) | warn (警報) |
| `INFO` | info (#59c1ff) | info (注意報) |

##### Metric Card
各リスクメトリクスのカード表示。左端に Level 連動のアクセントバー、右上に Level タグ。

### 7. 略語辞典

実装・UI 全体で使用する略語。

| 略語 | 展開 | 文脈 |
|---|---|---|
| MSL | Mean Sea Level | 海面気圧 (`pressure_msl`) |
| WBGT | Wet Bulb Globe Temperature | 湿球黒球温度 |
| UVI | UV Index | 紫外線指数 |
| AQI | Air Quality Index | 大気質指数 (European AQI を採用) |
| RH | Relative Humidity | 相対湿度 |
| PM2.5 | Particulate Matter ≤ 2.5μm | 微小粒子状物質 |
| WMO | World Meteorological Organization | 天気コード規格 |
| JMA | Japan Meteorological Agency | 気象庁 |
| TS / TZ | Timestamp / Timezone | ステータス行表記 |
| GEO | Geolocation | 現在地情報 |
| DoD | Day-over-Day | 前日比 |

### 8. 不変条件・前提

- `Location` は必ず存在する（取得失敗 → 東京フォールバック）
- 気象庁警報は **日本国内 (lat 24-46, lon 122-146) かつ 都道府県名が判定できた場合のみ** 取得
- リスク算出は常に `now` (描画時のクライアント時刻) を起点とする。再描画ボタンで更新
- `Conditions` の取得失敗時はパネル全体を非表示（部分的な空表示はしない）

---

## データソース

| 用途 | エンドポイント |
|---|---|
| 気象 (forecast) | `https://api.open-meteo.com/v1/forecast` |
| 大気質 (PM/花粉/黄砂/UV) | `https://air-quality-api.open-meteo.com/v1/air-quality` |
| 逆ジオコーディング | `https://api.bigdatacloud.net/data/reverse-geocode-client` |
| 気象庁警報 | `https://www.jma.go.jp/bosai/warning/data/warning/{officeCode}.json` |
| 気象庁区域名 | `https://www.jma.go.jp/bosai/common/const/area.json` |
| Twemoji SVG | `https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/` |

すべて API キー不要・CORS 許可済み。

## 技術スタック

- TypeScript (strict)
- Vite 5 + Tailwind CSS v4 (`@tailwindcss/vite` プラグイン、設定ファイルなし)
- カラートークンは `@theme` で一元定義
- フレームワークなし（Vanilla TS + DOM API のみ）
- GitHub Actions で `gh-pages` 環境にデプロイ

## 開発

```sh
npm install
npm run dev      # localhost:5173
npm run build    # tsc --noEmit + vite build → dist/
npm run preview
```

## デプロイ

`main` への push で GitHub Actions が自動デプロイ。Settings → Pages → Source = "GitHub Actions" であること。

## 免責

表示は気象データからの **推定値** であり、医学的な助言ではありません。体調が悪い場合は無理をせず、必要に応じて医師に相談してください。
